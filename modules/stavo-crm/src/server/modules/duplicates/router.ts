/**
 * Revisao de possiveis duplicidades.
 *
 * Nenhum lead e mesclado automaticamente. O usuario decide:
 *  - "E o mesmo lead"    -> arquiva o candidato e preserva o original;
 *  - "Sao leads diferentes" -> registra excecao de identidade auditada;
 *  - "Ignorar"           -> apenas encerra o alerta.
 */
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { Router } from 'express';

import { duplicateFiltersSchema, resolveDuplicateSchema } from '../../../shared/schemas';
import { getDb } from '../../db/client';
import {
  auditLog,
  duplicateReviews,
  leadIdentityKeys,
  leadIdentityMemberships,
  leads,
  stages,
} from '../../db/schema';
import { badRequest, notFound } from '../../lib/errors';
import { asyncHandler, parseBody, parseQuery } from '../../lib/http';
import { newId } from '../../lib/ids';
import { requireCapabilityToWrite, csrfProtection, requireAuth } from '../../middleware';
import { archiveLead } from '../leads/service';

export const duplicatesRouter: Router = Router();

duplicatesRouter.use(requireAuth);
duplicatesRouter.use('/duplicates', requireCapabilityToWrite('LEAD_CREATE'));

duplicatesRouter.get(
  '/duplicates',
  asyncHandler(async (req, res) => {
    const workspaceId = req.session!.workspaceId;
    const filters = parseQuery(duplicateFiltersSchema, req);
    const db = getDb();

    const rows = await db
      .select({
        review: duplicateReviews,
        existingName: leads.internalName,
        existingStage: stages.name,
        existingCity: leads.prospectingCity,
      })
      .from(duplicateReviews)
      .innerJoin(leads, eq(leads.id, duplicateReviews.existingLeadId))
      .innerJoin(stages, eq(stages.id, leads.currentStageId))
      .where(
        and(
          eq(leads.workspaceId, workspaceId),
          eq(duplicateReviews.status, filters.status),
        ),
      )
      .orderBy(desc(duplicateReviews.createdAt))
      .limit(200);

    const candidateIds = rows
      .map((row) => row.review.candidateLeadId)
      .filter((id): id is string => Boolean(id));

    const candidates =
      candidateIds.length > 0
        ? await db
            .select({
              id: leads.id,
              internalName: leads.internalName,
              city: leads.prospectingCity,
              stageName: stages.name,
              createdAt: leads.createdAt,
            })
            .from(leads)
            .innerJoin(stages, eq(stages.id, leads.currentStageId))
            .where(
              and(
                eq(leads.workspaceId, workspaceId),
                inArray(leads.id, candidateIds),
              ),
            )
        : [];

    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

    res.json({
      reviews: rows.map((row) => ({
        id: row.review.id,
        reason: row.review.reason,
        status: row.review.status,
        createdAt: row.review.createdAt,
        importJobId: row.review.importJobId,
        importRowNumber: row.review.importRowNumber,
        candidatePayload: row.review.candidatePayload,
        existing: {
          id: row.review.existingLeadId,
          internalName: row.existingName,
          stageName: row.existingStage,
          city: row.existingCity,
        },
        candidate: row.review.candidateLeadId
          ? (byId.get(row.review.candidateLeadId) ?? null)
          : null,
      })),
    });
  }),
);

duplicatesRouter.post(
  '/duplicates/:id/resolve',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const workspaceId = req.session!.workspaceId;
    const input = parseBody(resolveDuplicateSchema, req);
    const db = getDb();
    const actorUserId = req.session!.user.id;

    const [review] = await db
      .select()
      .from(duplicateReviews)
      .where(eq(duplicateReviews.id, req.params.id!))
      .limit(1);
    if (!review) throw notFound('Revisao nao encontrada.');
    if (review.status !== 'PENDING') {
      throw badRequest('Esta revisao ja foi resolvida.');
    }

    const now = new Date();
    let message = '';

    if (input.decision === 'SAME') {
      if (!review.candidateLeadId) {
        throw badRequest('Nao existe card candidato para arquivar nesta revisao.');
      }
      // O original permanece intocado: notas, etapa, valores e historico.
      await archiveLead(db, review.candidateLeadId, actorUserId);
      message = 'Card duplicado arquivado. O lead original nao foi alterado.';
    }

    if (input.decision === 'DIFFERENT') {
      // Excecao de identidade: nunca enfraquece a deduplicacao globalmente e
      // nunca se aplica a place_id.
      const keys = review.candidateLeadId
        ? await db
            .select({ keyId: leadIdentityKeys.id, keyType: leadIdentityKeys.keyType })
            .from(leadIdentityMemberships)
            .innerJoin(
              leadIdentityKeys,
              eq(leadIdentityKeys.id, leadIdentityMemberships.identityKeyId),
            )
            .where(eq(leadIdentityMemberships.leadId, review.candidateLeadId))
        : [];

      const shareable = keys.filter((key) => key.keyType !== 'PLACE_ID');

      if (shareable.length > 0) {
        await db
          .update(leadIdentityKeys)
          .set({
            isSharedException: true,
            exceptionReason: (
              input.reason ?? 'Confirmado pelo usuario como unidades/leads diferentes'
            ).slice(0, 255),
            updatedAt: now,
          })
          .where(
            inArray(
              leadIdentityKeys.id,
              shareable.map((key) => key.keyId),
            ),
          );
      }

      message =
        'Registrado como leads diferentes. Uma nova coincidencia com essa identidade voltara para revisao.';
    }

    if (input.decision === 'DISMISS') {
      message = 'Alerta encerrado. Nenhum dado foi alterado.';
    }

    const status =
      input.decision === 'SAME'
        ? 'CONFIRMED_SAME'
        : input.decision === 'DIFFERENT'
          ? 'CONFIRMED_DIFFERENT'
          : 'DISMISSED';

    await db
      .update(duplicateReviews)
      .set({ status, reviewedAt: now })
      .where(
        and(
          eq(duplicateReviews.id, review.id),
          eq(duplicateReviews.status, 'PENDING'),
          sql`exists (
            select 1
            from ${leads}
            where ${leads.workspaceId} = ${workspaceId}
              and (
                ${leads.id} = ${duplicateReviews.candidateLeadId}
                or ${leads.id} = ${duplicateReviews.existingLeadId}
              )
          )`,
        ),
      );

    await db.insert(auditLog).values({
      workspaceId,
      id: newId(),
      action: 'DUPLICATE_REVIEW_RESOLVED',
      entityType: 'duplicate_reviews',
      entityId: review.id,
      actorUserId,
      summary: `Revisao de duplicidade resolvida como ${status}.`,
      metadata: { reason: input.reason ?? null },
      occurredAt: now,
    });

    res.json({ ok: true, status, message });
  }),
);
