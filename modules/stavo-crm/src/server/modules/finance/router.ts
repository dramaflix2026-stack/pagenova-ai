/**
 * Rotas financeiras: recebiveis, pagamentos, vendas e assinaturas.
 *
 * Vocabulario da interface: nunca "Excluir". Sempre "Cancelar", "Estornar" ou
 * "Reverter", com motivo obrigatorio.
 */
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { Router } from 'express';

import {
  cancelReceivableSchema,
  cancelSaleSchema,
  cancelSubscriptionSchema,
  changeSubscriptionSchema,
  confirmPaymentSchema,
  receivableFiltersSchema,
  reversePaymentSchema,
  subscriptionFiltersSchema,
} from '../../../shared/schemas';
import { getDb } from '../../db/client';
import { leads, payments, receivables, saleItems, sales, subscriptions } from '../../db/schema';
import { addMoney, fromCents, toCents, ZERO } from '../../domain/money';
import { toLocalDateString } from '../../domain/time';
import { asyncHandler, parseBody, parseQuery } from '../../lib/http';
import { requireCapabilityToWrite, csrfProtection, requireAuth } from '../../middleware';
import { scheduleMaintenance } from '../jobs/maintenance';
import {
  cancelReceivable,
  cancelSale,
  cancelSubscription,
  changeSubscriptionAmount,
  confirmPayment,
  reversePayment,
} from './service';

export const financeRouter: Router = Router();

financeRouter.use(requireAuth);
financeRouter.use(
  ['/finance', '/payments', '/receivables', '/sales', '/subscriptions'],
  requireCapabilityToWrite('FINANCE_MANAGE'),
);

// --- Resumo ---------------------------------------------------------------

financeRouter.get(
  '/finance/summary',
  asyncHandler(async (_req, res) => {
    const db = getDb();
    // Garante que vencidos e mensalidades estejam atualizados ao abrir a tela.
    scheduleMaintenance(db);

    const today = toLocalDateString(new Date());

    const [pending] = await db
      .select({
        total: sql<string>`coalesce(sum(${receivables.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(receivables)
      .where(inArray(receivables.status, ['PENDING', 'OVERDUE']));

    const [overdue] = await db
      .select({
        total: sql<string>`coalesce(sum(${receivables.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(receivables)
      .where(
        and(inArray(receivables.status, ['PENDING', 'OVERDUE']), lte(receivables.dueDate, today)),
      );

    const [received] = await db
      .select({
        total: sql<string>`coalesce(sum(${payments.amount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(payments);

    const [mrr] = await db
      .select({
        total: sql<string>`coalesce(sum(${subscriptions.amountSnapshot}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE'));

    res.json({
      pending: { total: money(pending?.total), count: Number(pending?.count ?? 0) },
      overdue: { total: money(overdue?.total), count: Number(overdue?.count ?? 0) },
      // Liquido: pagamentos confirmados menos estornos (gravados como negativos).
      received: { total: money(received?.total), count: Number(received?.count ?? 0) },
      activeMrr: { total: money(mrr?.total), count: Number(mrr?.count ?? 0) },
      disclaimer: 'Controle comercial interno. Nao substitui contabilidade fiscal oficial.',
    });
  }),
);

const money = (value: string | number | null | undefined): string =>
  fromCents(toCents(String(value ?? '0')));

// --- Recebiveis -----------------------------------------------------------

financeRouter.get(
  '/receivables',
  asyncHandler(async (req, res) => {
    const filters = parseQuery(receivableFiltersSchema, req);
    const db = getDb();

    const conditions = [];
    if (filters.status) conditions.push(eq(receivables.status, filters.status));
    if (filters.leadId) conditions.push(eq(receivables.leadId, filters.leadId));
    if (filters.from) conditions.push(gte(receivables.dueDate, filters.from));
    if (filters.to) conditions.push(lte(receivables.dueDate, filters.to));

    const rows = await db
      .select({
        receivable: receivables,
        leadName: leads.internalName,
      })
      .from(receivables)
      .innerJoin(leads, eq(leads.id, receivables.leadId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(receivables.dueDate))
      .limit(500);

    const total = rows.reduce<string>((sum, row) => addMoney(sum, row.receivable.amount), ZERO);

    res.json({
      receivables: rows.map((row) => ({ ...row.receivable, leadName: row.leadName })),
      total,
    });
  }),
);

financeRouter.post(
  '/receivables/:id/confirm',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(confirmPaymentSchema, req);
    const db = getDb();

    const result = await db.transaction(async (tx) =>
      confirmPayment(tx, {
        receivableId: req.params.id!,
        paymentDate: input.paymentDate,
        amount: input.amount ?? null,
        note: input.note ?? null,
        actorUserId: req.session!.user.id,
        idempotencyKey: input.idempotencyKey,
      }),
    );

    res.json({
      paymentId: result.paymentId,
      receivable: result.receivable,
      created: result.created,
      message: result.created
        ? 'Recebimento confirmado. O valor saiu de pendente e entrou na receita realizada.'
        : 'Este recebimento ja havia sido confirmado.',
    });
  }),
);

financeRouter.post(
  '/receivables/:id/cancel',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(cancelReceivableSchema, req);
    const db = getDb();

    await db.transaction(async (tx) =>
      cancelReceivable(tx, {
        receivableId: req.params.id!,
        reason: input.reason,
        actorUserId: req.session!.user.id,
      }),
    );

    res.json({ ok: true, message: 'Cobranca cancelada. O historico foi preservado.' });
  }),
);

// --- Pagamentos -----------------------------------------------------------

/**
 * Recebimentos.
 *
 *   ?view=RECEIVED  (padrao) o dinheiro que entrou e continua valendo
 *   ?view=REVERSED            os estornos
 *
 * O livro de pagamentos e imutavel: estornar NAO apaga o lancamento original,
 * grava um segundo com valor negativo. Isso mantem a trilha contabil, mas
 * jogava as duas linhas na mesma lista -- a compra aparecia como
 * "Confirmado", o estorno logo abaixo, e a tela parecia ter duplicado o lead.
 *
 * A separacao e feita aqui, por consulta, e nao apagando dado: "estornado" e
 * uma condicao DERIVADA (existe um estorno apontando para este pagamento),
 * nunca uma coluna que poderia divergir da realidade.
 */
financeRouter.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const db = getDb();
    const from = typeof req.query.from === 'string' ? req.query.from : null;
    const to = typeof req.query.to === 'string' ? req.query.to : null;
    const estornados = req.query.view === 'REVERSED';

    const temEstorno = sql`exists (
      select 1 from payments estorno where estorno.reversal_of_id = ${payments.id}
    )`;

    const conditions = [
      // As linhas de estorno nunca aparecem sozinhas: elas sao mostradas
      // junto do pagamento que anularam.
      eq(payments.status, 'CONFIRMED'),
      estornados ? temEstorno : sql`not ${temEstorno}`,
    ];
    if (from) conditions.push(gte(payments.paymentDate, from));
    if (to) conditions.push(lte(payments.paymentDate, to));

    const rows = await db
      .select({
        payment: payments,
        leadName: leads.internalName,
        reversedAt: sql<string | null>`(
          select estorno.payment_date from payments estorno
           where estorno.reversal_of_id = ${payments.id} limit 1
        )`,
        reversalReason: sql<string | null>`(
          select estorno.reason from payments estorno
           where estorno.reversal_of_id = ${payments.id} limit 1
        )`,
      })
      .from(payments)
      .innerJoin(leads, eq(leads.id, payments.leadId))
      .where(and(...conditions))
      .orderBy(desc(payments.paymentDate), desc(payments.createdAt))
      .limit(500);

    res.json({
      payments: rows.map((row) => ({
        ...row.payment,
        leadName: row.leadName,
        reversedAt: row.reversedAt,
        reversalReason: row.reversalReason,
      })),
      // Na aba de estornos o total e o valor devolvido, nao receita.
      total: rows.reduce<string>((sum, row) => addMoney(sum, row.payment.amount), ZERO),
    });
  }),
);

financeRouter.post(
  '/payments/:id/reverse',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(reversePaymentSchema, req);
    const db = getDb();

    const reversalId = await db.transaction(async (tx) =>
      reversePayment(tx, {
        paymentId: req.params.id!,
        reason: input.reason,
        actorUserId: req.session!.user.id,
        idempotencyKey: input.idempotencyKey,
      }),
    );

    res.json({
      reversalId,
      message:
        'Pagamento estornado. Ele saiu de Recebidos e esta na aba Estornos; a cobranca voltou a ficar em aberto.',
    });
  }),
);

// --- Vendas ---------------------------------------------------------------

financeRouter.get(
  '/sales',
  asyncHandler(async (_req, res) => {
    const db = getDb();
    const rows = await db
      .select({ sale: sales, leadName: leads.internalName })
      .from(sales)
      .innerJoin(leads, eq(leads.id, sales.leadId))
      .orderBy(desc(sales.agreedAt))
      .limit(300);

    const items =
      rows.length > 0
        ? await db
            .select()
            .from(saleItems)
            .where(
              inArray(
                saleItems.saleId,
                rows.map((row) => row.sale.id),
              ),
            )
        : [];

    res.json({
      sales: rows.map((row) => ({
        ...row.sale,
        leadName: row.leadName,
        items: items.filter((item) => item.saleId === row.sale.id),
      })),
    });
  }),
);

financeRouter.post(
  '/sales/:id/cancel',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(cancelSaleSchema, req);
    const db = getDb();

    await db.transaction(async (tx) =>
      cancelSale(tx, {
        saleId: req.params.id!,
        reason: input.reason,
        receivableAction: input.receivableAction,
        actorUserId: req.session!.user.id,
      }),
    );

    res.json({
      ok: true,
      message: 'Venda cancelada. Snapshots e historico foram preservados.',
    });
  }),
);

// --- Assinaturas ----------------------------------------------------------

financeRouter.get(
  '/subscriptions',
  asyncHandler(async (req, res) => {
    const filters = parseQuery(subscriptionFiltersSchema, req);
    const db = getDb();

    const conditions = [];
    if (filters.status) conditions.push(eq(subscriptions.status, filters.status));
    if (filters.leadId) conditions.push(eq(subscriptions.leadId, filters.leadId));

    const rows = await db
      .select({ subscription: subscriptions, leadName: leads.internalName })
      .from(subscriptions)
      .innerJoin(leads, eq(leads.id, subscriptions.leadId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(subscriptions.createdAt))
      .limit(300);

    res.json({
      subscriptions: rows.map((row) => ({ ...row.subscription, leadName: row.leadName })),
    });
  }),
);

financeRouter.post(
  '/subscriptions/:id/cancel',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(cancelSubscriptionSchema, req);
    const db = getDb();

    await db.transaction(async (tx) =>
      cancelSubscription(tx, {
        subscriptionId: req.params.id!,
        canceledAt: input.canceledAt,
        reason: input.reason,
        openReceivableAction: input.openReceivableAction,
        actorUserId: req.session!.user.id,
      }),
    );

    res.json({
      ok: true,
      message:
        input.openReceivableAction === 'CANCEL'
          ? 'Recorrencia cancelada e cobranca em aberto cancelada. Pagamentos anteriores permanecem.'
          : 'Recorrencia cancelada. A cobranca em aberto continua pendente e pagamentos anteriores permanecem.',
    });
  }),
);

financeRouter.post(
  '/subscriptions/:id/change',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(changeSubscriptionSchema, req);
    const db = getDb();

    await db.transaction(async (tx) =>
      changeSubscriptionAmount(tx, {
        subscriptionId: req.params.id!,
        newAmount: input.newAmount,
        effectiveFrom: input.effectiveFrom,
        reason: input.reason ?? null,
        actorUserId: req.session!.user.id,
      }),
    );

    res.json({
      ok: true,
      message: 'Valor alterado a partir da competencia informada. Periodos anteriores nao mudaram.',
    });
  }),
);
