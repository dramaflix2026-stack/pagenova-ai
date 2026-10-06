/**
 * Importacao de leads.
 *
 * Regra absoluta sobre duplicatas: a linha duplicada e IGNORADA.
 * Nunca criamos um segundo card, nunca alteramos o lead existente e nunca
 * sobrescrevemos anotacao, valor, servico, etapa ou historico -- nem mesmo um
 * campo vazio. O preenchimento de campo vazio so acontece depois, na revisao
 * manual, campo a campo, com confirmacao explicita.
 */
import { and, eq, inArray, isNull } from 'drizzle-orm';

import type {
  ContactType,
  ImportField,
  ImportRowStatus,
  LinkType,
} from '../../../shared/constants';
import type { ImportMapping } from '../../../shared/schemas';
import type { Database } from '../../db/client';
import {
  importJobs,
  importRows,
  leadContacts,
  leadLinks,
  leadSources,
  leads,
  services,
  stages,
} from '../../db/schema';
import { classifyWebsite } from '../../domain/links';
import { normalizeMoney } from '../../domain/money';
import { normalizeEmail, normalizeInstagram, normalizePhone, normalizeUrl } from '../../domain/normalize';
import { badRequest, notFound } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { checkDuplicates, openDuplicateReview } from '../leads/identity';
import { createLead } from '../leads/service';
import { recordEvent } from '../leads/events';

export interface NormalizedRow {
  rowNumber: number;
  values: Partial<Record<ImportField, string>>;
  errors: { field: ImportField | '_'; message: string }[];
  isEmpty: boolean;
}

/** Converte uma linha crua em valores normalizados, sem tocar no banco. */
export function normalizeRow(
  raw: string[],
  mapping: ImportMapping,
  rowNumber: number,
): NormalizedRow {
  const values: Partial<Record<ImportField, string>> = {};
  const errors: NormalizedRow['errors'] = [];

  const read = (field: ImportField): string => {
    const index = mapping.columns[field];
    if (index === undefined) return '';
    return (raw[index] ?? '').trim();
  };

  const isEmpty = raw.every((cell) => !cell || cell.trim().length === 0);
  if (isEmpty) return { rowNumber, values, errors, isEmpty: true };

  // --- Nome ---------------------------------------------------------------
  const name = read('name');
  if (name) values.name = name.slice(0, 160);
  // Nome vazio e incompleto critico, mas a linha entra assim mesmo.

  // --- Telefones ----------------------------------------------------------
  for (const field of ['phone', 'whatsapp'] as const) {
    const value = read(field);
    if (!value) continue;
    const parsed = normalizePhone(value);
    values[field] = value.slice(0, 160);
    if (!parsed.isValid) {
      // Importa como dado a revisar; nunca gera link de contato quebrado.
      errors.push({ field, message: 'Telefone nao reconhecido - revise manualmente.' });
    }
  }

  // --- E-mail -------------------------------------------------------------
  const email = read('email');
  if (email) {
    values.email = email.slice(0, 160);
    if (!normalizeEmail(email)) {
      errors.push({ field: 'email', message: 'E-mail invalido.' });
    }
  }

  // --- Links --------------------------------------------------------------
  const instagram = read('instagram');
  if (instagram) {
    const normalized = normalizeInstagram(instagram);
    if (normalized) values.instagram = normalized;
    else errors.push({ field: 'instagram', message: 'Perfil do Instagram nao reconhecido.' });
  }

  for (const field of ['website', 'demoUrl', 'mapsUrl'] as const) {
    const value = read(field);
    if (!value) continue;
    const normalized = normalizeUrl(value);
    if (normalized) values[field] = normalized;
    else errors.push({ field, message: 'Endereco de link invalido.' });
  }

  // --- Texto livre --------------------------------------------------------
  for (const field of ['address', 'city', 'state', 'country', 'niche', 'source', 'service'] as const) {
    const value = read(field);
    if (value) values[field] = value.slice(0, 255);
  }

  const notes = read('notes');
  if (notes) values.notes = notes.slice(0, 4000);

  // --- Valor --------------------------------------------------------------
  const price = read('proposedPrice');
  if (price) {
    try {
      // Aceita "1.234,56" e "1234.56"; nunca converte silenciosamente lixo.
      values.proposedPrice = normalizeMoney(price.replace(/[R$\s]/gi, ''));
    } catch {
      errors.push({ field: 'proposedPrice', message: 'Valor monetario invalido.' });
    }
  }

  // --- Data ---------------------------------------------------------------
  const followUp = read('nextFollowUp');
  if (followUp) {
    const parsed = parseDate(followUp);
    if (parsed) values.nextFollowUp = parsed;
    else
      errors.push({
        field: 'nextFollowUp',
        message: 'Data ambigua ou invalida. Use AAAA-MM-DD ou DD/MM/AAAA.',
      });
  }

  return { rowNumber, values, errors, isEmpty: false };
}

/** Aceita AAAA-MM-DD e DD/MM/AAAA. Formatos ambiguos viram erro, nao chute. */
export function parseDate(value: string): string | null {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidDate(trimmed) ? trimmed : null;
  }

  const br = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, day, month, year] = br;
    // Dia acima de 12 confirma DD/MM; caso contrario o padrao brasileiro vale.
    const iso = `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`;
    return isValidDate(iso) ? iso : null;
  }

  return null;
}

function isValidDate(iso: string): boolean {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export interface RowOutcome {
  rowNumber: number;
  status: ImportRowStatus;
  leadId?: string;
  duplicateLeadId?: string;
  duplicateLeadName?: string;
  duplicateStageName?: string;
  matchSummary?: string;
  errors: { field: string; message: string }[];
  values: Partial<Record<ImportField, string>>;
}

export interface ImportPreview {
  rows: RowOutcome[];
  summary: ImportSummary;
}

export interface ImportSummary {
  totalRows: number;
  imported: number;
  duplicates: number;
  probableDuplicates: number;
  incomplete: number;
  invalid: number;
  empty: number;
}

const emptySummary = (): ImportSummary => ({
  totalRows: 0,
  imported: 0,
  duplicates: 0,
  probableDuplicates: 0,
  incomplete: 0,
  invalid: 0,
  empty: 0,
});

/**
 * Simula a importacao sem gravar nada.
 * Detecta duplicatas dentro do proprio arquivo e contra toda a base.
 */
export async function previewImport(
  db: Database,
  rawRows: string[][],
  mapping: ImportMapping,
): Promise<ImportPreview> {
  const dataRows = mapping.hasHeader ? rawRows.slice(1) : rawRows;
  const outcomes: RowOutcome[] = [];
  const summary = emptySummary();

  // Chaves ja vistas neste arquivo: a segunda ocorrencia tambem e duplicata.
  const seenInFile = new Map<string, number>();

  for (const [index, raw] of dataRows.entries()) {
    const rowNumber = index + (mapping.hasHeader ? 2 : 1);
    const normalized = normalizeRow(raw, mapping, rowNumber);
    summary.totalRows += 1;

    if (normalized.isEmpty) {
      summary.empty += 1;
      outcomes.push({ rowNumber, status: 'EMPTY', errors: [], values: {} });
      continue;
    }

    const fileKey = buildFileKey(normalized);
    if (fileKey && seenInFile.has(fileKey)) {
      summary.duplicates += 1;
      outcomes.push({
        rowNumber,
        status: 'DUPLICATE',
        matchSummary: `Repetida na linha ${seenInFile.get(fileKey)} do proprio arquivo`,
        errors: [],
        values: normalized.values,
      });
      continue;
    }
    if (fileKey) seenInFile.set(fileKey, rowNumber);

    const verdict = await checkDuplicates(db, identityFromRow(normalized));

    if (verdict.kind === 'BLOCKED') {
      summary.duplicates += 1;
      outcomes.push({
        rowNumber,
        status: 'DUPLICATE',
        duplicateLeadId: verdict.existing.id,
        duplicateLeadName: verdict.existing.internalName,
        duplicateStageName: verdict.existing.stageName,
        matchSummary: verdict.reason,
        errors: [],
        values: normalized.values,
      });
      continue;
    }

    if (verdict.kind === 'REVIEW') {
      summary.probableDuplicates += 1;
      outcomes.push({
        rowNumber,
        status: 'PROBABLE_DUPLICATE',
        duplicateLeadId: verdict.existing.id,
        duplicateLeadName: verdict.existing.internalName,
        duplicateStageName: verdict.existing.stageName,
        matchSummary: verdict.reason,
        errors: [],
        values: normalized.values,
      });
      continue;
    }

    const hasName = Boolean(normalized.values.name);
    const hasContact = Boolean(
      normalized.values.phone || normalized.values.whatsapp || normalized.values.email,
    );

    if (!hasName && !hasContact) {
      summary.invalid += 1;
      outcomes.push({
        rowNumber,
        status: 'INVALID',
        errors: [
          ...normalized.errors.map((error) => ({ field: String(error.field), message: error.message })),
          { field: '_', message: 'A linha nao possui nome nem contato.' },
        ],
        values: normalized.values,
      });
      continue;
    }

    // Sem nome ou sem contato -> importa, mas marcado como incompleto critico.
    const incomplete = !hasName || !hasContact || normalized.errors.length > 0;

    if (incomplete) summary.incomplete += 1;
    summary.imported += 1;

    outcomes.push({
      rowNumber,
      status: incomplete ? 'INCOMPLETE' : 'IMPORTED',
      errors: normalized.errors.map((error) => ({
        field: String(error.field),
        message: error.message,
      })),
      values: normalized.values,
    });
  }

  return { rows: outcomes, summary };
}

function identityFromRow(row: NormalizedRow) {
  return {
    phones: [row.values.phone, row.values.whatsapp],
    websites: [row.values.website],
    name: row.values.name ?? null,
    address: row.values.address ?? null,
    city: row.values.city ?? null,
  };
}

/** Chave para detectar repeticao dentro do mesmo arquivo. */
function buildFileKey(row: NormalizedRow): string | null {
  const phone = normalizePhone(row.values.phone ?? row.values.whatsapp ?? '');
  if (phone.isValid && phone.e164) return `phone:${phone.e164}`;

  const website = classifyWebsite(row.values.website ?? null);
  if (website.classification === 'OWN_WEBSITE' && website.host) return `domain:${website.host}`;

  if (row.values.name && row.values.address) {
    return `name:${row.values.name.toLowerCase()}|${row.values.address.toLowerCase()}`;
  }

  return null;
}

export interface ImportResult {
  importJobId: string;
  summary: ImportSummary;
  rows: RowOutcome[];
  /** true quando a mesma chave de idempotencia ja tinha sido processada. */
  alreadyProcessed: boolean;
}

/** Executa a importacao de fato, em lotes transacionais por linha. */
export async function runImport(
  db: Database,
  workspaceId: string,
  input: {
    filename: string;
    rawRows: string[][];
    mapping: ImportMapping;
    idempotencyKey: string;
    actorUserId: string;
  },
): Promise<ImportResult> {
  const [existing] = await db
    .select()
    .from(importJobs)
    .where(and(eq(importJobs.workspaceId, workspaceId), eq(importJobs.idempotencyKey, input.idempotencyKey)))
    .limit(1);

  if (existing) {
    const rows = await db
      .select()
      .from(importRows)
      .where(eq(importRows.importJobId, existing.id));

    return {
      importJobId: existing.id,
      alreadyProcessed: true,
      summary: {
        totalRows: existing.totalRows,
        imported: existing.importedRows,
        duplicates: existing.duplicateRows,
        probableDuplicates: existing.probableDuplicateRows,
        incomplete: existing.incompleteRows,
        invalid: existing.invalidRows,
        empty: existing.emptyRows,
      },
      rows: rows.map((row) => ({
        rowNumber: row.rowNumber,
        status: row.status as ImportRowStatus,
        ...(row.leadId ? { leadId: row.leadId } : {}),
        ...(row.duplicateLeadId ? { duplicateLeadId: row.duplicateLeadId } : {}),
        ...(row.normalizedMatchSummary ? { matchSummary: row.normalizedMatchSummary } : {}),
        errors: (row.validationErrors as { field: string; message: string }[]) ?? [],
        values: (row.normalizedValues as Partial<Record<ImportField, string>>) ?? {},
      })),
    };
  }

  const jobId = newId();
  const now = new Date();

  const [source] = input.mapping.sourceId
    ? await db.select().from(leadSources).where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.id, input.mapping.sourceId))).limit(1)
    : await db.select().from(leadSources).where(and(eq(leadSources.workspaceId, workspaceId), eq(leadSources.slug, 'planilha'))).limit(1);

  await db.insert(importJobs).values({
    workspaceId,
    id: jobId,
    originalFilename: input.filename.slice(0, 255),
    sourceId: source?.id ?? null,
    serviceId: input.mapping.serviceId ?? null,
    status: 'PENDING',
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
  });

  const preview = await previewImport(db, input.rawRows, input.mapping);
  const finalRows: RowOutcome[] = [];
  const summary = emptySummary();
  summary.totalRows = preview.summary.totalRows;

  const sourcesByName = await loadSourcesByName(db, workspaceId);
  const servicesByName = await loadServicesByName(db, workspaceId);

  for (const outcome of preview.rows) {
    if (outcome.status === 'EMPTY') {
      summary.empty += 1;
      finalRows.push(outcome);
      await persistRow(db, jobId, outcome, now);
      continue;
    }

    if (outcome.status === 'INVALID') {
      summary.invalid += 1;
      finalRows.push(outcome);
      await persistRow(db, jobId, outcome, now);
      continue;
    }

    if (outcome.status === 'DUPLICATE') {
      // Linha ignorada. O lead existente permanece exatamente como estava.
      summary.duplicates += 1;
      finalRows.push(outcome);
      await persistRow(db, jobId, outcome, now);
      continue;
    }

    if (outcome.status === 'PROBABLE_DUPLICATE') {
      summary.probableDuplicates += 1;
      if (outcome.duplicateLeadId) {
        await openDuplicateReview(db, {
          candidateLeadId: null,
          existingLeadId: outcome.duplicateLeadId,
          reason: outcome.matchSummary ?? 'Possivel duplicidade na importacao',
          candidatePayload: outcome.values,
          importJobId: jobId,
          importRowNumber: outcome.rowNumber,
        });
      }
      finalRows.push(outcome);
      await persistRow(db, jobId, outcome, now);
      continue;
    }

    // --- Criacao ----------------------------------------------------------
    const values = outcome.values;
    const contacts = buildContacts(values);
    const links = buildLinks(values);

    const rowSourceId = values.source
      ? (sourcesByName.get(values.source.toLowerCase()) ?? source?.id ?? null)
      : (source?.id ?? null);

    const rowServiceId = values.service
      ? (servicesByName.get(values.service.toLowerCase()) ?? input.mapping.serviceId ?? null)
      : (input.mapping.serviceId ?? null);

    try {
      const created = await createLead(
        db,
        workspaceId,
        {
          internalName: values.name ?? 'Lead sem nome',
          originType: 'IMPORTED',
          sourceId: rowSourceId,
          placeId: null,
          niche: values.niche ?? null,
          country: values.country ?? null,
          state: values.state ?? null,
          city: values.city ?? null,
          address: values.address ?? null,
          campaignContext: null,
          notes: values.notes ?? null,
          contacts,
          links,
          serviceId: rowServiceId,
          proposedPrice: values.proposedPrice ?? null,
          nextFollowUpAt: values.nextFollowUp ?? null,
          allowSharedIdentity: false,
          sharedIdentityReason: null,
        },
        {
          actorUserId: input.actorUserId,
          originType: 'IMPORTED',
          importJobId: jobId,
          dataOrigin: 'IMPORT',
        },
      );

      const withLead: RowOutcome = { ...outcome, leadId: created.lead.id };
      if (outcome.status === 'INCOMPLETE') summary.incomplete += 1;
      summary.imported += 1;
      finalRows.push(withLead);
      await persistRow(db, jobId, withLead, now);
    } catch (error) {
      // Conflito de identidade que so apareceu na hora da gravacao.
      const failed: RowOutcome = {
        ...outcome,
        status: 'DUPLICATE',
        matchSummary:
          error instanceof Error ? error.message.slice(0, 255) : 'Conflito de identidade',
      };
      summary.duplicates += 1;
      finalRows.push(failed);
      await persistRow(db, jobId, failed, now);
    }
  }

  const completedAt = new Date();
  await db
    .update(importJobs)
    .set({
      status: 'COMPLETED',
      totalRows: summary.totalRows,
      importedRows: summary.imported,
      duplicateRows: summary.duplicates,
      probableDuplicateRows: summary.probableDuplicates,
      incompleteRows: summary.incomplete,
      invalidRows: summary.invalid,
      emptyRows: summary.empty,
      completedAt,
    })
    .where(and(eq(importJobs.workspaceId, workspaceId), eq(importJobs.id, jobId)));

  return { importJobId: jobId, summary, rows: finalRows, alreadyProcessed: false };
}

async function persistRow(
  db: Database,
  jobId: string,
  outcome: RowOutcome,
  now: Date,
): Promise<void> {
  // Guarda apenas o necessario para relatorio e revisao. Nunca senha ou segredo.
  await db.insert(importRows).values({
    id: newId(),
    importJobId: jobId,
    rowNumber: outcome.rowNumber,
    status: outcome.status,
    leadId: outcome.leadId ?? null,
    duplicateLeadId: outcome.duplicateLeadId ?? null,
    validationErrors: outcome.errors.length > 0 ? outcome.errors : null,
    normalizedMatchSummary: outcome.matchSummary?.slice(0, 255) ?? null,
    normalizedValues: Object.keys(outcome.values).length > 0 ? outcome.values : null,
    createdAt: now,
  });
}

function buildContacts(values: Partial<Record<ImportField, string>>) {
  const contacts: { type: ContactType; value: string; isPrimary: boolean }[] = [];
  if (values.phone) contacts.push({ type: 'PHONE', value: values.phone, isPrimary: true });
  if (values.whatsapp) {
    contacts.push({ type: 'WHATSAPP', value: values.whatsapp, isPrimary: !values.phone });
  }
  if (values.email) contacts.push({ type: 'EMAIL', value: values.email, isPrimary: false });
  return contacts;
}

function buildLinks(values: Partial<Record<ImportField, string>>) {
  const links: { type: LinkType; url: string; isPrimary: boolean }[] = [];
  if (values.website) links.push({ type: 'WEBSITE', url: values.website, isPrimary: true });
  if (values.instagram) links.push({ type: 'INSTAGRAM', url: values.instagram, isPrimary: false });
  if (values.mapsUrl) links.push({ type: 'MAPS', url: values.mapsUrl, isPrimary: false });
  if (values.demoUrl) {
    links.push({ type: 'DEMO_OR_PROPOSAL', url: values.demoUrl, isPrimary: false });
  }
  return links;
}

async function loadSourcesByName(db: Database, workspaceId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: leadSources.id, name: leadSources.name })
    .from(leadSources)
    .where(eq(leadSources.workspaceId, workspaceId));
  return new Map(rows.map((row) => [row.name.toLowerCase(), row.id]));
}

async function loadServicesByName(db: Database, workspaceId: string): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.workspaceId, workspaceId));
  return new Map(rows.map((row) => [row.name.toLowerCase(), row.id]));
}

// ---------------------------------------------------------------------------
// Revisao manual: preencher SOMENTE campos hoje vazios
// ---------------------------------------------------------------------------

export interface FillableField {
  rowId: string;
  rowNumber: number;
  leadId: string;
  leadName: string;
  field: ImportField;
  /** Sempre vazio: campos preenchidos nunca aparecem aqui. */
  currentValue: null;
  importedValue: string;
  label: string;
}

/**
 * Lista o que a importacao trouxe e o lead existente ainda NAO tem.
 * Campo ja preenchido nunca aparece: nada pode ser sobrescrito.
 */
export async function listFillableFields(db: Database, workspaceId: string, importJobId: string,
): Promise<FillableField[]> {
  const rows = await db
    .select()
    .from(importRows)
    .where(
      and(eq(importRows.importJobId, importJobId), eq(importRows.status, 'DUPLICATE')),
    );

  const leadIds = rows
    .map((row) => row.duplicateLeadId)
    .filter((id): id is string => Boolean(id));
  if (leadIds.length === 0) return [];

  const leadRows = await db
    .select({ id: leads.id, internalName: leads.internalName, city: leads.prospectingCity })
    .from(leads)
    .where(inArray(leads.id, leadIds));
  const leadById = new Map(leadRows.map((lead) => [lead.id, lead]));

  const contactRows = await db
    .select({ leadId: leadContacts.leadId, type: leadContacts.type })
    .from(leadContacts)
    .where(inArray(leadContacts.leadId, leadIds));

  const linkRows = await db
    .select({ leadId: leadLinks.leadId, type: leadLinks.type })
    .from(leadLinks)
    .where(inArray(leadLinks.leadId, leadIds));

  const output: FillableField[] = [];

  for (const row of rows) {
    if (!row.duplicateLeadId) continue;
    const lead = leadById.get(row.duplicateLeadId);
    if (!lead) continue;

    const values = (row.normalizedValues as Partial<Record<ImportField, string>>) ?? {};
    const contactTypes = new Set(
      contactRows.filter((item) => item.leadId === lead.id).map((item) => item.type),
    );
    const linkTypes = new Set(
      linkRows.filter((item) => item.leadId === lead.id).map((item) => item.type),
    );

    const candidates: [ImportField, boolean, string][] = [
      ['phone', !contactTypes.has('PHONE'), 'Telefone'],
      ['whatsapp', !contactTypes.has('WHATSAPP'), 'WhatsApp'],
      ['email', !contactTypes.has('EMAIL'), 'E-mail'],
      ['instagram', !linkTypes.has('INSTAGRAM'), 'Instagram'],
      ['website', !linkTypes.has('WEBSITE'), 'Website'],
      ['demoUrl', !linkTypes.has('DEMO_OR_PROPOSAL'), 'Link da demonstracao'],
      ['city', !lead.city, 'Cidade'],
    ];

    for (const [field, isEmpty, label] of candidates) {
      const importedValue = values[field];
      if (!importedValue || !isEmpty) continue;
      output.push({
        rowId: row.id,
        rowNumber: row.rowNumber,
        leadId: lead.id,
        leadName: lead.internalName,
        field,
        currentValue: null,
        importedValue,
        label,
      });
    }
  }

  return output;
}

/**
 * Aplica o preenchimento apenas nos campos escolhidos explicitamente e apenas
 * quando ainda estiverem vazios. Anotacoes, valores, etapa e historico nunca
 * sao tocados.
 */
export async function applyFillEmpty(db: Database, workspaceId: string, importJobId: string,
  selections: { rowId: string; field: ImportField }[],
  actorUserId: string,
): Promise<{ applied: number; skipped: number }> {
  const available = await listFillableFields(db, workspaceId, importJobId);
  const allowed = new Map(available.map((item) => [`${item.rowId}:${item.field}`, item]));

  let applied = 0;
  let skipped = 0;
  const now = new Date();

  for (const selection of selections) {
    const item = allowed.get(`${selection.rowId}:${selection.field}`);
    if (!item) {
      // Campo deixou de estar vazio ou nao pertence a esta importacao.
      skipped += 1;
      continue;
    }

    await db.transaction(async (tx) => {
      switch (item.field) {
        case 'phone':
        case 'whatsapp':
        case 'email': {
          const type =
            item.field === 'phone' ? 'PHONE' : item.field === 'whatsapp' ? 'WHATSAPP' : 'EMAIL';

          // Reconfere dentro da transacao: corrida nunca sobrescreve.
          const [existing] = await tx
            .select({ id: leadContacts.id })
            .from(leadContacts)
            .where(and(eq(leadContacts.leadId, item.leadId), eq(leadContacts.type, type)))
            .limit(1);
          if (existing) {
            skipped += 1;
            return;
          }

          const parsed = normalizePhone(item.importedValue);
          await tx.insert(leadContacts).values({
            id: newId(),
            leadId: item.leadId,
            type,
            value: item.importedValue,
            normalizedValue:
              type === 'EMAIL' ? normalizeEmail(item.importedValue) : parsed.e164,
            origin: 'IMPORT',
            isPrimary: false,
            isConfirmed: true,
            isValid: type === 'EMAIL' ? Boolean(normalizeEmail(item.importedValue)) : parsed.isValid,
            createdAt: now,
            updatedAt: now,
          });
          applied += 1;
          break;
        }

        case 'instagram':
        case 'website':
        case 'demoUrl':
        case 'mapsUrl': {
          const type =
            item.field === 'instagram'
              ? 'INSTAGRAM'
              : item.field === 'website'
                ? 'WEBSITE'
                : item.field === 'mapsUrl'
                  ? 'MAPS'
                  : 'DEMO_OR_PROPOSAL';

          const [existing] = await tx
            .select({ id: leadLinks.id })
            .from(leadLinks)
            .where(and(eq(leadLinks.leadId, item.leadId), eq(leadLinks.type, type)))
            .limit(1);
          if (existing) {
            skipped += 1;
            return;
          }

          const normalized = normalizeUrl(item.importedValue);
          if (!normalized) {
            skipped += 1;
            return;
          }

          await tx.insert(leadLinks).values({
            id: newId(),
            leadId: item.leadId,
            type,
            url: normalized,
            normalizedHost: classifyWebsite(normalized).host,
            origin: 'IMPORT',
            isPrimary: false,
            createdAt: now,
            updatedAt: now,
          });
          applied += 1;
          break;
        }

        case 'city': {
          const updated = await tx
            .update(leads)
            .set({ prospectingCity: item.importedValue, updatedAt: now })
            // A condicao IS NULL garante que nada preenchido seja sobrescrito.
            .where(and(eq(leads.id, item.leadId), isNull(leads.prospectingCity)));
          const affected = Number(
            (updated as unknown as { affectedRows?: number }).affectedRows ?? 0,
          );
          if (affected > 0) applied += 1;
          else skipped += 1;
          break;
        }

        default:
          skipped += 1;
          return;
      }

      await recordEvent(tx, {
        leadId: item.leadId,
        eventType: 'DATA_CONFIRMED',
        occurredAt: now,
        actorUserId,
        payload: {
          field: item.field,
          source: 'IMPORT_REVIEW',
          importJobId,
          note: 'Campo vazio preenchido apos confirmacao explicita do usuario.',
        },
      });
    });
  }

  return { applied, skipped };
}

export async function getImportJob(db: Database, workspaceId: string, importJobId: string) {
  const [job] = await db.select().from(importJobs).where(and(eq(importJobs.workspaceId, workspaceId), eq(importJobs.id, importJobId))).limit(1);
  if (!job) throw notFound('Importacao nao encontrada.');

  const rows = await db.select().from(importRows).where(eq(importRows.importJobId, importJobId));

  const leadIds = rows.map((row) => row.duplicateLeadId).filter((id): id is string => Boolean(id));
  const stageByLead =
    leadIds.length > 0
      ? await db
          .select({ leadId: leads.id, stageName: stages.name })
          .from(leads)
          .innerJoin(stages, eq(stages.id, leads.currentStageId))
          .where(inArray(leads.id, leadIds))
      : [];
  const stageMap = new Map(stageByLead.map((row) => [row.leadId, row.stageName]));

  return {
    job,
    rows: rows
      .sort((a, b) => a.rowNumber - b.rowNumber)
      .map((row) => ({
        ...row,
        duplicateStageName: row.duplicateLeadId
          ? (stageMap.get(row.duplicateLeadId) ?? null)
          : null,
      })),
  };
}

export function assertMapping(mapping: ImportMapping): void {
  if (Object.keys(mapping.columns).length === 0) {
    throw badRequest('Mapeie ao menos uma coluna antes de continuar.');
  }
}
