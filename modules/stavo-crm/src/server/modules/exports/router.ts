/**
 * Exportacao de dados proprios.
 *
 * Nunca inclui: senha, password_hash, token de sessao, SESSION_SECRET,
 * GOOGLE_MAPS_API_KEY, credenciais do MySQL ou conteudo transitorio do Google.
 *
 * O CSV e protegido contra formula injection: qualquer celula que comece com
 * =, +, - ou @ recebe um apostrofo antes, para que o Excel/Sheets nao execute.
 */
import { desc, eq } from 'drizzle-orm';
import { Router } from 'express';

import { getDb, type Database } from '../../db/client';
import {
  activities,
  followUps,
  goals,
  leadContacts,
  leadLinks,
  leadServiceInterests,
  leads,
  payments,
  receivables,
  saleItems,
  sales,
  services,
  stageHistory,
  stages,
  subscriptions,
} from '../../db/schema';
import { badRequest } from '../../lib/errors';
import { asyncHandler } from '../../lib/http';
import { requireCapability, requireAuth } from '../../middleware';

export const exportsRouter: Router = Router();

exportsRouter.use(requireAuth);
exportsRouter.use('/exports', requireCapability('EXPORT_DATA'));

/** Neutraliza formulas antes de escrever a celula. */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  let text = value instanceof Date ? value.toISOString() : String(value);

  // Protecao contra CSV formula injection.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\n\r;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return columns ? `${columns.join(',')}\n` : '';
  const headers = columns ?? Object.keys(rows[0]!);
  const lines = [headers.join(',')];

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(','));
  }

  // BOM (\uFEFF) garante acentuacao correta ao abrir no Excel brasileiro.
  return `\uFEFF${lines.join('\n')}\n`;
}

const CSV_DATASETS = {
  leads: async (db: Database) => {
    const rows = await db
      .select({
        id: leads.id,
        nome_interno: leads.internalName,
        origem_tipo: leads.originType,
        etapa: stages.name,
        nicho: leads.prospectingNiche,
        cidade: leads.prospectingCity,
        estado: leads.prospectingState,
        pais: leads.prospectingCountry,
        endereco: leads.address,
        place_id: leads.placeId,
        completude: leads.incompleteLevel,
        criado_em: leads.createdAt,
        arquivado_em: leads.archivedAt,
      })
      .from(leads)
      .innerJoin(stages, eq(stages.id, leads.currentStageId))
      .orderBy(desc(leads.createdAt));
    return rows;
  },
  contatos: async (db: Database) =>
    db
      .select({
        lead_id: leadContacts.leadId,
        tipo: leadContacts.type,
        valor: leadContacts.value,
        normalizado: leadContacts.normalizedValue,
        origem: leadContacts.origin,
        confirmado: leadContacts.isConfirmed,
        valido: leadContacts.isValid,
      })
      .from(leadContacts),
  links: async (db: Database) =>
    db
      .select({
        lead_id: leadLinks.leadId,
        tipo: leadLinks.type,
        url: leadLinks.url,
        host: leadLinks.normalizedHost,
        origem: leadLinks.origin,
      })
      .from(leadLinks),
  atividades: async (db: Database) =>
    db
      .select({
        lead_id: activities.leadId,
        tipo: activities.activityType,
        conteudo: activities.body,
        ocorrido_em: activities.occurredAt,
      })
      .from(activities)
      .orderBy(desc(activities.occurredAt)),
  follow_ups: async (db: Database) =>
    db
      .select({
        lead_id: followUps.leadId,
        vencimento: followUps.dueAt,
        status: followUps.status,
        nota: followUps.note,
        concluido_em: followUps.completedAt,
      })
      .from(followUps),
  servicos: async (db: Database) =>
    db
      .select({
        id: services.id,
        nome: services.name,
        descricao: services.description,
        cobranca: services.billingType,
        preco_padrao: services.defaultPrice,
        ativo: services.active,
      })
      .from(services),
  propostas: async (db: Database) =>
    db
      .select({
        lead_id: leadServiceInterests.leadId,
        servico: services.name,
        valor_proposto: leadServiceInterests.proposedPrice,
        cobranca: leadServiceInterests.billingTypeSnapshot,
        status: leadServiceInterests.status,
      })
      .from(leadServiceInterests)
      .innerJoin(services, eq(services.id, leadServiceInterests.serviceId)),
  vendas: async (db: Database) =>
    db
      .select({
        id: sales.id,
        lead_id: sales.leadId,
        status: sales.status,
        acordado_em: sales.agreedAt,
        confirmado_em: sales.confirmedAt,
        total: sales.totalSnapshot,
      })
      .from(sales)
      .orderBy(desc(sales.agreedAt)),
  itens_venda: async (db: Database) =>
    db
      .select({
        venda_id: saleItems.saleId,
        servico: saleItems.serviceNameSnapshot,
        cobranca: saleItems.billingTypeSnapshot,
        valor_unitario: saleItems.unitPriceSnapshot,
        quantidade: saleItems.quantity,
        total: saleItems.totalSnapshot,
      })
      .from(saleItems),
  recebiveis: async (db: Database) =>
    db
      .select({
        id: receivables.id,
        lead_id: receivables.leadId,
        descricao: receivables.descriptionSnapshot,
        competencia: receivables.referencePeriod,
        valor: receivables.amount,
        vencimento: receivables.dueDate,
        status: receivables.status,
        pago_em: receivables.paidAt,
      })
      .from(receivables)
      .orderBy(desc(receivables.dueDate)),
  pagamentos: async (db: Database) =>
    db
      .select({
        id: payments.id,
        recebivel_id: payments.receivableId,
        lead_id: payments.leadId,
        valor: payments.amount,
        data: payments.paymentDate,
        status: payments.status,
        estorno_de: payments.reversalOfId,
        motivo: payments.reason,
      })
      .from(payments)
      .orderBy(desc(payments.paymentDate)),
  assinaturas: async (db: Database) =>
    db
      .select({
        id: subscriptions.id,
        lead_id: subscriptions.leadId,
        servico: subscriptions.serviceNameSnapshot,
        valor: subscriptions.amountSnapshot,
        status: subscriptions.status,
        primeiro_vencimento: subscriptions.firstDueDate,
        proximo_vencimento: subscriptions.nextDueDate,
        cancelada_em: subscriptions.canceledAt,
      })
      .from(subscriptions),
  metas: async (db: Database) =>
    db
      .select({
        metrica: goals.metricType,
        periodo: goals.periodType,
        alvo: goals.targetValue,
        inicio: goals.startsOn,
        fim: goals.endsOn,
        ativa: goals.active,
      })
      .from(goals),
  historico_etapas: async (db: Database) =>
    db
      .select({
        lead_id: stageHistory.leadId,
        etapa: stages.name,
        significado: stageHistory.semanticKey,
        entrou_em: stageHistory.enteredAt,
        saiu_em: stageHistory.exitedAt,
      })
      .from(stageHistory)
      .innerJoin(stages, eq(stages.id, stageHistory.stageId))
      .orderBy(desc(stageHistory.enteredAt)),
} as const;

type DatasetName = keyof typeof CSV_DATASETS;

exportsRouter.get(
  '/exports/datasets',
  asyncHandler(async (_req, res) => {
    res.json({
      datasets: Object.keys(CSV_DATASETS),
      note: 'A exportacao contem apenas dados proprios do CRM. Segredos e conteudo do Google nunca sao incluidos.',
    });
  }),
);

exportsRouter.get(
  '/exports/csv/:dataset',
  asyncHandler(async (req, res) => {
    const dataset = req.params.dataset as DatasetName;
    const loader = CSV_DATASETS[dataset];
    if (!loader) throw badRequest('Conjunto de dados desconhecido.');

    const rows = (await loader(getDb())) as Record<string, unknown>[];
    const csv = toCsv(rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${dataset}.csv"`);
    res.send(csv);
  }),
);

exportsRouter.get(
  '/exports/json',
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const payload: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      format: 'stavo-crm-backup-v1',
      note: 'Backup logico dos dados proprios. Nao contem segredos nem dados do Google.',
    };

    for (const [name, loader] of Object.entries(CSV_DATASETS)) {
      payload[name] = await loader(db);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="stavo-crm-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.send(JSON.stringify(payload, null, 2));
  }),
);
