/**
 * Deduplicacao global de leads.
 *
 * Escopo da comparacao: CRM ativo, leads arquivados, importacoes anteriores,
 * leads manuais e leads originados do Google -- tudo pela mesma tabela de
 * identidades normalizadas.
 *
 * Regras inegociaveis:
 *  - mesmo place_id NUNCA cria dois cards e nunca vira excecao;
 *  - chave forte ja pertencente a outro lead bloqueia a criacao automatica;
 *  - correspondencia apenas provavel nao cria e nao funde: vai para revisao;
 *  - so a decisao humana "sao leads diferentes" cria excecao auditada;
 *  - excecao nunca autoriza uma terceira criacao automatica.
 */
import { and, eq, inArray, ne, or, sql } from 'drizzle-orm';

import type { IdentityKeyType } from '../../../shared/constants';
import type { Database } from '../../db/client';
import {
  duplicateReviews,
  leadIdentityKeys,
  leadIdentityMemberships,
  leads,
  stages,
} from '../../db/schema';
import { classifyWebsite } from '../../domain/links';
import {
  domainKey,
  nameAddressKey,
  normalizeCompanyName,
  normalizePhone,
  phoneKey,
  placeIdKey,
  similarity,
  type IdentityKey,
} from '../../domain/normalize';
import { newId } from '../../lib/ids';

export interface IdentityInput {
  placeId?: string | null;
  /** Telefones brutos; apenas os validos viram identidade forte. */
  phones?: (string | null | undefined)[];
  /** URLs brutas; apenas dominio proprio vira identidade forte. */
  websites?: (string | null | undefined)[];
  name?: string | null;
  address?: string | null;
  /** Usado apenas na suspeita por nome parecido, nunca como chave forte. */
  city?: string | null;
}

/**
 * Constroi as chaves fortes de um candidato.
 * Instagram, WhatsApp, Linktree e diretorios NAO geram chave de dominio:
 * empresas diferentes compartilham essas plataformas o tempo todo.
 */
export function buildIdentityKeys(input: IdentityInput): IdentityKey[] {
  const keys = new Map<string, IdentityKey>();
  const add = (key: IdentityKey | null) => {
    if (key) keys.set(`${key.keyType}:${key.keyHash}`, key);
  };

  if (input.placeId?.trim()) {
    add(placeIdKey(input.placeId.trim()));
  }

  for (const phone of input.phones ?? []) {
    const normalized = normalizePhone(phone);
    if (normalized.isValid && normalized.e164) {
      add(phoneKey(normalized.e164));
    }
  }

  for (const website of input.websites ?? []) {
    const classified = classifyWebsite(website);
    if (classified.classification === 'OWN_WEBSITE' && classified.host) {
      add(domainKey(classified.host));
    }
  }

  add(nameAddressKey(input.name, input.address));

  return [...keys.values()];
}

export interface ExistingLeadSummary {
  id: string;
  internalName: string;
  stageId: string;
  stageName: string;
  archivedAt: Date | null;
  createdAt: Date;
}

export type DuplicateVerdict =
  | { kind: 'CLEAR' }
  | {
      /** Chave forte de outro lead: bloqueia a criacao automatica. */
      kind: 'BLOCKED';
      keyType: IdentityKeyType;
      reason: string;
      existing: ExistingLeadSummary;
    }
  | {
      /** Suspeita: nao cria e nao funde; espera decisao humana. */
      kind: 'REVIEW';
      keyType: IdentityKeyType | null;
      reason: string;
      existing: ExistingLeadSummary;
    };

const KEY_REASONS: Record<IdentityKeyType, string> = {
  PLACE_ID: 'Mesmo local do Google (place_id) ja cadastrado',
  PHONE: 'Mesmo telefone ja cadastrado em outro lead',
  OWN_DOMAIN: 'Mesmo dominio proprio ja cadastrado em outro lead',
  NAME_ADDRESS: 'Mesmo nome e endereco ja cadastrados em outro lead',
};

async function summarizeLead(
  db: Database,
  leadId: string,
): Promise<ExistingLeadSummary | null> {
  const [row] = await db
    .select({
      id: leads.id,
      internalName: leads.internalName,
      stageId: leads.currentStageId,
      stageName: stages.name,
      archivedAt: leads.archivedAt,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .where(eq(leads.id, leadId))
    .limit(1);
  return row ?? null;
}

/**
 * Verifica um candidato contra todas as identidades existentes.
 * `excludeLeadId` permite reavaliar um lead ao editar seus dados.
 */
export async function checkDuplicates(
  db: Database,
  input: IdentityInput,
  options: { excludeLeadId?: string; allowSharedIdentity?: boolean } = {},
): Promise<DuplicateVerdict> {
  const keys = buildIdentityKeys(input);

  if (keys.length > 0) {
    const hashes = keys.map((key) => key.keyHash);
    const rows = await db
      .select({
        keyId: leadIdentityKeys.id,
        keyType: leadIdentityKeys.keyType,
        keyHash: leadIdentityKeys.keyHash,
        isSharedException: leadIdentityKeys.isSharedException,
        leadId: leadIdentityMemberships.leadId,
      })
      .from(leadIdentityKeys)
      .innerJoin(
        leadIdentityMemberships,
        eq(leadIdentityMemberships.identityKeyId, leadIdentityKeys.id),
      )
      .where(inArray(leadIdentityKeys.keyHash, hashes));

    const byHash = new Map(keys.map((key) => [key.keyHash, key]));

    for (const row of rows) {
      if (options.excludeLeadId && row.leadId === options.excludeLeadId) continue;
      const key = byHash.get(row.keyHash);
      if (!key || key.keyType !== row.keyType) continue;

      const existing = await summarizeLead(db, row.leadId);
      if (!existing) continue;

      // place_id nunca aceita excecao nem confirmacao humana.
      if (row.keyType === 'PLACE_ID') {
        return {
          kind: 'BLOCKED',
          keyType: 'PLACE_ID',
          reason: KEY_REASONS.PLACE_ID,
          existing,
        };
      }

      // Chave ja marcada como compartilhada volta para revisao; ela nunca
      // libera automaticamente uma terceira criacao.
      if (row.isSharedException) {
        return {
          kind: 'REVIEW',
          keyType: row.keyType as IdentityKeyType,
          reason: `${KEY_REASONS[row.keyType as IdentityKeyType]} (ja marcado como compartilhado antes)`,
          existing,
        };
      }

      // O usuario declarou explicitamente que sao leads diferentes.
      if (options.allowSharedIdentity) {
        return {
          kind: 'REVIEW',
          keyType: row.keyType as IdentityKeyType,
          reason: KEY_REASONS[row.keyType as IdentityKeyType],
          existing,
        };
      }

      return {
        kind: 'BLOCKED',
        keyType: row.keyType as IdentityKeyType,
        reason: KEY_REASONS[row.keyType as IdentityKeyType],
        existing,
      };
    }
  }

  const probable = await findProbableMatch(db, input, options.excludeLeadId);
  if (probable) return probable;

  return { kind: 'CLEAR' };
}

/** Limiar de similaridade para "possivel duplicidade" na mesma cidade. */
const PROBABLE_NAME_THRESHOLD = 0.86;

/**
 * Correspondencia provavel: nome muito parecido na mesma cidade, ou nome igual
 * sem endereco. Nome sozinho em cidades diferentes NUNCA e duplicata --
 * unidades e franquias sao leads legitimos.
 */
async function findProbableMatch(
  db: Database,
  input: IdentityInput,
  excludeLeadId?: string,
): Promise<DuplicateVerdict | null> {
  const candidateName = normalizeCompanyName(input.name);
  if (!candidateName || candidateName.length < 4) return null;

  const candidateCity = input.city?.trim() || null;
  const candidateAddress = input.address?.trim() || null;

  // Conjunto de comparacao limitado: leads da mesma cidade ou com inicio de
  // nome semelhante. Evita varrer a base inteira a cada criacao.
  const prefix = `${candidateName.slice(0, 4)}%`;
  const rows = await db
    .select({
      id: leads.id,
      internalName: leads.internalName,
      address: leads.address,
      city: leads.prospectingCity,
      stageId: leads.currentStageId,
      stageName: stages.name,
      archivedAt: leads.archivedAt,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .where(
      and(
        excludeLeadId ? ne(leads.id, excludeLeadId) : sql`1 = 1`,
        or(
          sql`${leads.internalName} like ${prefix}`,
          candidateCity ? eq(leads.prospectingCity, candidateCity) : sql`1 = 0`,
        ),
      ),
    )
    .limit(200);

  for (const row of rows) {
    const score = similarity(candidateName, normalizeCompanyName(row.internalName));
    if (score < PROBABLE_NAME_THRESHOLD) continue;

    // Cidades diferentes e conhecidas indicam unidades legitimas, nao duplicata.
    if (candidateCity && row.city && candidateCity.toLowerCase() !== row.city.toLowerCase()) {
      continue;
    }

    // Enderecos conhecidos e distintos tambem separam unidades da mesma marca.
    if (candidateAddress && row.address && similarity(candidateAddress, row.address) < 0.6) {
      continue;
    }

    return {
      kind: 'REVIEW',
      keyType: null,
      reason:
        score >= 0.98
          ? 'Nome praticamente identico a um lead existente'
          : 'Nome muito parecido com um lead existente',
      existing: {
        id: row.id,
        internalName: row.internalName,
        stageId: row.stageId,
        stageName: row.stageName,
        archivedAt: row.archivedAt,
        createdAt: row.createdAt,
      },
    };
  }

  return null;
}

/**
 * Grava as identidades do lead. Deve rodar na MESMA transacao da criacao ou
 * atualizacao do lead.
 */
export async function attachIdentities(
  tx: Database,
  leadId: string,
  keys: IdentityKey[],
  options: { sharedReason?: string | null } = {},
): Promise<void> {
  const now = new Date();

  for (const key of keys) {
    // Reaproveita a chave existente; a unicidade e garantida pelo banco.
    const [existing] = await tx
      .select({ id: leadIdentityKeys.id, isSharedException: leadIdentityKeys.isSharedException })
      .from(leadIdentityKeys)
      .where(and(eq(leadIdentityKeys.keyType, key.keyType), eq(leadIdentityKeys.keyHash, key.keyHash)))
      .limit(1);

    let keyId = existing?.id;

    if (!keyId) {
      keyId = newId();
      await tx.insert(leadIdentityKeys).values({
        id: keyId,
        keyType: key.keyType,
        keyHash: key.keyHash,
        keySample: key.keySample,
        isSharedException: false,
        createdAt: now,
        updatedAt: now,
      });
    } else if (options.sharedReason && key.keyType !== 'PLACE_ID') {
      // Marca a excecao humana; place_id jamais e compartilhavel.
      await tx
        .update(leadIdentityKeys)
        .set({
          isSharedException: true,
          exceptionReason: options.sharedReason.slice(0, 255),
          updatedAt: now,
        })
        .where(eq(leadIdentityKeys.id, keyId));
    }

    await tx
      .insert(leadIdentityMemberships)
      .values({ identityKeyId: keyId, leadId, createdAt: now })
      .onDuplicateKeyUpdate({ set: { leadId } });
  }
}

/** Recalcula as identidades de um lead apos edicao dos dados proprios. */
export async function refreshIdentities(
  tx: Database,
  leadId: string,
  input: IdentityInput,
): Promise<void> {
  const keys = buildIdentityKeys(input);
  const keyHashes = keys.map((key) => key.keyHash);

  const current = await tx
    .select({
      membershipKeyId: leadIdentityMemberships.identityKeyId,
      keyHash: leadIdentityKeys.keyHash,
    })
    .from(leadIdentityMemberships)
    .innerJoin(leadIdentityKeys, eq(leadIdentityKeys.id, leadIdentityMemberships.identityKeyId))
    .where(eq(leadIdentityMemberships.leadId, leadId));

  // Remove vinculos que nao correspondem mais aos dados atuais.
  const stale = current
    .filter((row) => !keyHashes.includes(row.keyHash))
    .map((row) => row.membershipKeyId);

  if (stale.length > 0) {
    await tx
      .delete(leadIdentityMemberships)
      .where(
        and(
          eq(leadIdentityMemberships.leadId, leadId),
          inArray(leadIdentityMemberships.identityKeyId, stale),
        ),
      );
  }

  await attachIdentities(tx, leadId, keys);
}

export interface OpenDuplicateReviewInput {
  candidateLeadId?: string | null;
  existingLeadId: string;
  reason: string;
  candidatePayload?: Record<string, unknown> | null;
  importJobId?: string | null;
  importRowNumber?: number | null;
}

/** Registra uma suspeita para decisao humana posterior. */
export async function openDuplicateReview(
  tx: Database,
  input: OpenDuplicateReviewInput,
): Promise<string> {
  const id = newId();
  await tx.insert(duplicateReviews).values({
    id,
    candidateLeadId: input.candidateLeadId ?? null,
    existingLeadId: input.existingLeadId,
    reason: input.reason.slice(0, 255),
    candidatePayload: input.candidatePayload ?? null,
    importJobId: input.importJobId ?? null,
    importRowNumber: input.importRowNumber ?? null,
    status: 'PENDING',
    createdAt: new Date(),
  });
  return id;
}
