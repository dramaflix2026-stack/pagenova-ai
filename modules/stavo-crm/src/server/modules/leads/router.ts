/**
 * Rotas do CRM.
 *  GET    /api/leads/board            quadro Kanban com filtros
 *  POST   /api/leads                  cadastro manual
 *  GET    /api/leads/:id              detalhe do card
 *  PATCH  /api/leads/:id              edicao de dados proprios
 *  POST   /api/leads/:id/move         movimentacao de etapa
 *  POST   /api/leads/:id/archive      arquivar (sai do quadro, mantem tudo)
 *  DELETE /api/leads/:id              excluir de vez (leva o financeiro junto)
 *  POST   /api/leads/:id/activities   anotacao / tentativa de contato
 *  POST   /api/leads/:id/follow-ups   agendar follow-up
 */
import { Router } from 'express';

import {
  confirmContactSchema,
  confirmLinkSchema,
  completeFollowUpSchema,
  createActivitySchema,
  createFollowUpSchema,
  createLeadSchema,
  leadFiltersSchema,
  moveLeadSchema,
  transferLeadSchema,
  updateActivitySchema,
  updateLeadSchema,
} from '../../../shared/schemas';
import { leadVisibilityOwnerFilter, type UserRole } from '../../../shared/roles';
import { getDb } from '../../db/client';
import { activities, followUps } from '../../db/schema';
import { asyncHandler, parseBody, parseQuery } from '../../lib/http';
import { notFound } from '../../lib/errors';
import { csrfProtection, requireAuth, requireCapability } from '../../middleware';
import { listLeadEvents } from './events';
import { getBoard, getFilterOptions, getLeadDetail, searchLeadOptions } from './queries';
import {
  archiveLead,
  assertCanEditLead,
  assertCanViewLead,
  assertCanNoteLead,
  completeFollowUp,
  confirmLeadContact,
  confirmLeadLink,
  countContactAttempts,
  createLead,
  deleteLead,
  getLeadDeletionImpact,
  listStageHistory,
  moveLead,
  recordActivity,
  removeLeadContact,
  removeLeadLink,
  restoreLead,
  scheduleFollowUp,
  transferLead,
  updateLeadData,
} from './service';
import { eq } from 'drizzle-orm';

export const leadsRouter: Router = Router();

leadsRouter.use(requireAuth);

/** Quem esta pedindo: id decide a propriedade, cargo decide a permissao. */
const atorDe = (req: { session?: { user: { id: string; role: string } } }) => ({
  id: req.session!.user.id,
  role: req.session!.user.role,
});

leadsRouter.get(
  '/leads/board',
  asyncHandler(async (req, res) => {
    const filters = parseQuery(leadFiltersSchema, req);
    res.json(await getBoard(getDb(), filters, atorDe(req)));
  }),
);

leadsRouter.get(
  '/leads/search',
  asyncHandler(async (req, res) => {
    const termo = typeof req.query.q === 'string' ? req.query.q : '';
    // Menos de 2 letras devolveria quase o banco inteiro.
    if (termo.trim().length < 2) {
      res.json({ leads: [] });
      return;
    }
    const ator = atorDe(req);
    res.json({
      leads: await searchLeadOptions(
        getDb(),
        termo,
        20,
        leadVisibilityOwnerFilter(ator.role as UserRole, ator.id),
      ),
    });
  }),
);

leadsRouter.get(
  '/leads/filter-options',
  asyncHandler(async (_req, res) => {
    res.json(await getFilterOptions(getDb()));
  }),
);

leadsRouter.post(
  '/leads',
  csrfProtection,
  requireCapability('LEAD_CREATE'),
  asyncHandler(async (req, res) => {
    const input = parseBody(createLeadSchema, req);
    const result = await createLead(getDb(), input, {
      actorUserId: req.session!.user.id,
      originType: input.originType,
    });

    res.status(201).json({
      lead: result.lead,
      duplicateReviewId: result.duplicateReviewId ?? null,
      warning:
        result.duplicate && result.duplicate.kind === 'REVIEW'
          ? `Possivel duplicidade: ${result.duplicate.reason}. O lead foi criado e aguarda sua revisao.`
          : null,
    });
  }),
);

leadsRouter.get(
  '/leads/:id',
  asyncHandler(async (req, res) => {
    const detail = await getLeadDetail(getDb(), req.params.id!, atorDe(req));
    if (!detail) throw notFound('Lead nao encontrado.');
    res.json(detail);
  }),
);

leadsRouter.patch(
  '/leads/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    const input = parseBody(updateLeadSchema, req);
    res.json({ lead: await updateLeadData(getDb(), req.params.id!, input) });
  }),
);

leadsRouter.post(
  '/leads/:id/move',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    const input = parseBody(moveLeadSchema, req);
    const result = await moveLead(getDb(), req.params.id!, input, req.session!.user.id);
    res.json({
      lead: result.lead,
      applied: result.applied,
      saleId: result.saleId ?? null,
      receivableIds: result.receivableIds ?? [],
    });
  }),
);

leadsRouter.post(
  '/leads/:id/archive',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    // A tela reenvia com esta confirmacao depois de avisar sobre as reunioes.
    const manterReunioes =
      (req.body as { keepFutureMeetings?: boolean }).keepFutureMeetings === true;
    await archiveLead(getDb(), req.params.id!, req.session!.user.id, {
      keepFutureMeetings: manterReunioes,
    });
    res.json({ ok: true, message: 'Lead arquivado. Todo o historico foi preservado.' });
  }),
);

leadsRouter.post(
  '/leads/:id/restore',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    await restoreLead(getDb(), req.params.id!, req.session!.user.id);
    res.json({ ok: true, message: 'Lead restaurado.' });
  }),
);

/**
 * O que sera perdido na exclusao. Consultado pela tela ANTES de confirmar:
 * a pessoa precisa ver o valor que vai sumir do painel enquanto ainda pode
 * desistir.
 */
leadsRouter.get(
  '/leads/:id/deletion-impact',
  asyncHandler(async (req, res) => {
    await assertCanViewLead(getDb(), req.params.id!, atorDe(req));
    res.json({ impact: await getLeadDeletionImpact(getDb(), req.params.id!) });
  }),
);

leadsRouter.delete(
  '/leads/:id',
  csrfProtection,
  requireCapability('LEAD_DELETE'),
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    const impact = await deleteLead(getDb(), req.params.id!, req.session!.user.id);
    res.json({
      ok: true,
      impact,
      message: `Lead "${impact.leadName}" excluido. Os valores sairam do painel.`,
    });
  }),
);

/**
 * Transferir o lead para outra pessoa. So o dono da conta -- foi a decisao
 * tomada para que um lead nunca fique preso quando alguem sai da empresa.
 */
leadsRouter.post(
  '/leads/:id/transfer',
  csrfProtection,
  requireCapability('LEAD_TRANSFER'),
  asyncHandler(async (req, res) => {
    const input = parseBody(transferLeadSchema, req);
    const lead = await transferLead(
      getDb(),
      req.params.id!,
      input.ownerUserId,
      req.session!.user.id,
    );
    res.json({ lead, message: 'Lead transferido.' });
  }),
);

// --- Historico ------------------------------------------------------------

leadsRouter.get(
  '/leads/:id/events',
  asyncHandler(async (req, res) => {
    const db = getDb();
    await assertCanViewLead(db, req.params.id!, atorDe(req));
    res.json({
      events: await listLeadEvents(db, req.params.id!),
      stageHistory: await listStageHistory(db, req.params.id!),
      attemptCount: await countContactAttempts(db, req.params.id!),
    });
  }),
);

// --- Atividades -----------------------------------------------------------

leadsRouter.post(
  '/leads/:id/activities',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanNoteLead(getDb(), req.params.id!, atorDe(req));
    const input = parseBody(createActivitySchema, req);
    const result = await recordActivity(getDb(), req.params.id!, input, req.session!.user.id);
    res.status(201).json(result);
  }),
);

leadsRouter.patch(
  '/leads/:leadId/activities/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanNoteLead(getDb(), req.params.leadId!, atorDe(req));
    const input = parseBody(updateActivitySchema, req);
    await getDb()
      .update(activities)
      .set({ body: input.body, updatedAt: new Date() })
      .where(eq(activities.id, req.params.id!));
    res.json({ ok: true });
  }),
);

// --- Follow-ups -----------------------------------------------------------

leadsRouter.post(
  '/leads/:id/follow-ups',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    const input = parseBody(createFollowUpSchema, req);
    const result = await scheduleFollowUp(getDb(), req.params.id!, input, req.session!.user.id);
    res.status(201).json(result);
  }),
);

leadsRouter.post(
  '/follow-ups/:id/complete',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const [followUp] = await getDb()
      .select({ leadId: followUps.leadId })
      .from(followUps)
      .where(eq(followUps.id, req.params.id!))
      .limit(1);
    if (!followUp) throw notFound('Follow-up nao encontrado.');
    await assertCanEditLead(getDb(), followUp.leadId, atorDe(req));
    const input = parseBody(completeFollowUpSchema, req);
    await completeFollowUp(getDb(), req.params.id!, input, req.session!.user.id);
    res.json({ ok: true });
  }),
);

// --- Contatos e links confirmados -----------------------------------------

leadsRouter.post(
  '/leads/:id/contacts',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    const input = parseBody(confirmContactSchema, req);
    await confirmLeadContact(getDb(), req.params.id!, input, req.session!.user.id);
    res.status(201).json({ ok: true, message: 'Contato salvo como dado confirmado do CRM.' });
  }),
);

leadsRouter.delete(
  '/leads/:leadId/contacts/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.leadId!, atorDe(req));
    await removeLeadContact(getDb(), req.params.leadId!, req.params.id!);
    res.json({ ok: true });
  }),
);

leadsRouter.post(
  '/leads/:id/links',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.id!, atorDe(req));
    const input = parseBody(confirmLinkSchema, req);
    await confirmLeadLink(getDb(), req.params.id!, input, req.session!.user.id);
    res.status(201).json({ ok: true, message: 'Link salvo como dado confirmado do CRM.' });
  }),
);

leadsRouter.delete(
  '/leads/:leadId/links/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    await assertCanEditLead(getDb(), req.params.leadId!, atorDe(req));
    await removeLeadLink(getDb(), req.params.leadId!, req.params.id!);
    res.json({ ok: true });
  }),
);
