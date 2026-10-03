/**
 * Vendas, recebiveis, pagamentos e assinaturas.
 *
 * Separacao central do modulo:
 *   proposta         -> valor discutido, nao e receita;
 *   aguardando       -> recebivel PENDING/OVERDUE, nao e receita;
 *   venda concluida  -> pagamento confirmado;
 *   receita realizada-> soma de pagamentos confirmados menos estornos.
 *
 * Nada e apagado: cancelamento e estorno criam registros novos e preservam
 * os snapshots historicos.
 */
import { and, eq, inArray, sql } from 'drizzle-orm';

import type { BillingType } from '../../../shared/constants';
import { isDuplicateKeyError, type Database } from '../../db/client';
import {
  auditLog,
  payments,
  receivables,
  saleItems,
  sales,
  services,
  subscriptionChanges,
  subscriptions,
  type Receivable,
  type Subscription,
} from '../../db/schema';
import { addMoney, multiplyMoney, normalizeMoney, toCents, ZERO } from '../../domain/money';
import {
  addMonthsToDateString,
  addMonthsToReferencePeriod,
  compareReferencePeriods,
  referencePeriodDueDate,
  toLocalDateString,
  toReferencePeriod,
} from '../../domain/time';
import { badRequest, conflict, notFound, unprocessable } from '../../lib/errors';
import { newId } from '../../lib/ids';
import { recordEvent } from '../leads/events';

export interface SaleItemDraft {
  serviceId: string;
  unitPrice: string;
  quantity: number;
}

export interface CreateSaleInput {
  leadId: string;
  items: SaleItemDraft[];
  agreedAt: string;
  dueDate: string;
  notes?: string | null;
  /** Quando verdadeiro, o recebivel unico nasce quitado com pagamento junto. */
  paidNow?: boolean;
  paymentDate?: string | null;
  actorUserId: string;
  idempotencyKey: string;
}

export interface CreateSaleResult {
  saleId: string;
  receivableIds: string[];
  subscriptionIds: string[];
  total: string;
}

/**
 * Cria a venda com snapshots imutaveis, os recebiveis e as assinaturas.
 * Deve rodar dentro de uma transacao.
 */
export async function createSale(tx: Database, input: CreateSaleInput): Promise<CreateSaleResult> {
  if (input.items.length === 0) {
    throw badRequest('Selecione pelo menos um servico para registrar a venda.');
  }

  const serviceIds = [...new Set(input.items.map((item) => item.serviceId))];
  const catalog = await tx.select().from(services).where(inArray(services.id, serviceIds));
  const byId = new Map(catalog.map((service) => [service.id, service]));

  for (const serviceId of serviceIds) {
    if (!byId.has(serviceId)) {
      throw notFound('Servico nao encontrado. Atualize a pagina e tente novamente.');
    }
  }

  const now = new Date();
  const saleId = newId();

  let total = ZERO;
  const oneTimeItems: { id: string; total: string }[] = [];
  const recurringItems: {
    id: string;
    serviceId: string;
    serviceName: string;
    amount: string;
  }[] = [];
  const itemRows: (typeof saleItems.$inferInsert)[] = [];

  for (const item of input.items) {
    const service = byId.get(item.serviceId)!;
    const unitPrice = normalizeMoney(item.unitPrice);
    const itemTotal = multiplyMoney(unitPrice, item.quantity);
    const itemId = newId();

    itemRows.push({
      id: itemId,
      saleId,
      serviceId: service.id,
      // Snapshots: alterar o catalogo depois nao muda esta venda.
      serviceNameSnapshot: service.name,
      billingTypeSnapshot: service.billingType,
      unitPriceSnapshot: unitPrice,
      quantity: item.quantity,
      totalSnapshot: itemTotal,
      createdAt: now,
    });

    total = addMoney(total, itemTotal);

    if ((service.billingType as BillingType) === 'RECURRING_MONTHLY') {
      recurringItems.push({
        id: itemId,
        serviceId: service.id,
        serviceName: service.name,
        amount: itemTotal,
      });
    } else {
      oneTimeItems.push({ id: itemId, total: itemTotal });
    }
  }

  // A venda precisa existir ANTES dos itens: sale_items.sale_id tem chave
  // estrangeira para sales.id e o InnoDB valida a referencia no momento do
  // INSERT. Inverter esta ordem derruba a movimentacao com o erro 1452
  // (ER_NO_REFERENCED_ROW_2), que chega ao operador como "Erro inesperado".
  await tx.insert(sales).values({
    id: saleId,
    leadId: input.leadId,
    status: 'PENDING',
    agreedAt: input.agreedAt,
    totalSnapshot: total,
    notes: input.notes ?? null,
    createdBy: input.actorUserId,
    createdAt: now,
    updatedAt: now,
  });

  await tx.insert(saleItems).values(itemRows);

  const receivableIds: string[] = [];
  const subscriptionIds: string[] = [];

  // --- Servicos de pagamento unico: um recebivel agregado ------------------
  const oneTimeTotal = oneTimeItems.reduce<string>((sum, item) => addMoney(sum, item.total), ZERO);

  if (toCents(oneTimeTotal) > 0) {
    const receivableId = newId();
    await tx.insert(receivables).values({
      id: receivableId,
      leadId: input.leadId,
      saleId,
      subscriptionId: null,
      referencePeriod: null,
      descriptionSnapshot: describeItems(input.items, byId, 'ONE_TIME'),
      amount: oneTimeTotal,
      dueDate: input.dueDate,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
    receivableIds.push(receivableId);

    await recordEvent(tx, {
      leadId: input.leadId,
      eventType: 'RECEIVABLE_GENERATED',
      occurredAt: now,
      actorUserId: input.actorUserId,
      payload: { receivableId, amount: oneTimeTotal, dueDate: input.dueDate, saleId },
      idempotencyKey: `${input.idempotencyKey}:receivable:onetime`,
    });
  }

  // --- Servicos recorrentes: assinatura + primeiro recebivel ---------------
  for (const item of recurringItems) {
    const subscriptionId = newId();
    const firstPeriod = input.dueDate.slice(0, 7);

    await tx.insert(subscriptions).values({
      id: subscriptionId,
      leadId: input.leadId,
      saleItemId: item.id,
      serviceId: item.serviceId,
      serviceNameSnapshot: item.serviceName,
      amountSnapshot: item.amount,
      status: 'ACTIVE',
      firstDueDate: input.dueDate,
      nextDueDate: addMonthsToDateString(input.dueDate, 1),
      lastGeneratedPeriod: firstPeriod,
      createdAt: now,
      updatedAt: now,
    });
    subscriptionIds.push(subscriptionId);

    const receivableId = newId();
    await tx.insert(receivables).values({
      id: receivableId,
      leadId: input.leadId,
      saleId,
      subscriptionId,
      referencePeriod: firstPeriod,
      descriptionSnapshot: `${item.serviceName} - competencia ${firstPeriod}`,
      amount: item.amount,
      dueDate: input.dueDate,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
    receivableIds.push(receivableId);

    await recordEvent(tx, {
      leadId: input.leadId,
      eventType: 'SUBSCRIPTION_STARTED',
      occurredAt: now,
      actorUserId: input.actorUserId,
      payload: {
        subscriptionId,
        serviceName: item.serviceName,
        amount: item.amount,
        firstDueDate: input.dueDate,
      },
      idempotencyKey: `${input.idempotencyKey}:subscription:${item.id}`,
    });

    await recordEvent(tx, {
      leadId: input.leadId,
      eventType: 'RECEIVABLE_GENERATED',
      occurredAt: now,
      actorUserId: input.actorUserId,
      payload: { receivableId, amount: item.amount, dueDate: input.dueDate, subscriptionId },
      idempotencyKey: `${input.idempotencyKey}:receivable:${subscriptionId}:${firstPeriod}`,
    });
  }

  await recordEvent(tx, {
    leadId: input.leadId,
    eventType: 'SALE_RECORDED',
    occurredAt: now,
    actorUserId: input.actorUserId,
    payload: { saleId, total, itemCount: input.items.length },
    idempotencyKey: `${input.idempotencyKey}:sale`,
  });

  // --- Pagamento imediato opcional ----------------------------------------
  if (input.paidNow && receivableIds.length > 0) {
    const paymentDate = input.paymentDate ?? toLocalDateString(now);
    for (const receivableId of receivableIds) {
      await confirmPayment(tx, {
        receivableId,
        paymentDate,
        actorUserId: input.actorUserId,
        idempotencyKey: `${input.idempotencyKey}:payment:${receivableId}`,
      });
    }
  }

  return { saleId, receivableIds, subscriptionIds, total };
}

function describeItems(
  items: SaleItemDraft[],
  catalog: Map<string, { name: string; billingType: string }>,
  billingType: BillingType,
): string {
  const names = items
    .filter((item) => catalog.get(item.serviceId)?.billingType === billingType)
    .map((item) => catalog.get(item.serviceId)?.name ?? 'Servico')
    .filter((name, index, all) => all.indexOf(name) === index);
  return names.join(', ').slice(0, 255) || 'Servico';
}

export interface ConfirmPaymentInput {
  receivableId: string;
  paymentDate: string;
  /** Ausente confirma o valor integral do recebivel. */
  amount?: string | null;
  note?: string | null;
  actorUserId: string;
  idempotencyKey: string;
}

export interface ConfirmPaymentResult {
  paymentId: string;
  receivable: Receivable;
  /** false quando a mesma chave de idempotencia ja tinha sido processada. */
  created: boolean;
}

/**
 * Confirma o recebimento.
 * Trava o recebivel com SELECT ... FOR UPDATE para que duas requisicoes
 * simultaneas nunca gerem dois pagamentos.
 */
export async function confirmPayment(
  tx: Database,
  input: ConfirmPaymentInput,
): Promise<ConfirmPaymentResult> {
  const [existingPayment] = await tx
    .select()
    .from(payments)
    .where(eq(payments.idempotencyKey, input.idempotencyKey))
    .limit(1);

  if (existingPayment) {
    const receivable = await getReceivable(tx, existingPayment.receivableId);
    return { paymentId: existingPayment.id, receivable, created: false };
  }

  await tx.execute(
    sql`select id from ${receivables} where ${receivables.id} = ${input.receivableId} for update`,
  );

  const receivable = await getReceivable(tx, input.receivableId);

  if (receivable.status === 'PAID') {
    throw conflict('Este recebimento ja foi confirmado.', { code: 'ALREADY_PAID' });
  }
  if (receivable.status === 'CANCELED') {
    throw unprocessable('Este recebivel foi cancelado e nao pode ser confirmado.', {
      code: 'RECEIVABLE_CANCELED',
    });
  }

  const amount = normalizeMoney(input.amount ?? receivable.amount);
  if (toCents(amount) <= 0) {
    throw badRequest('O valor recebido precisa ser maior que zero.');
  }
  // Nesta versao o recebimento e integral: valores parciais nao sao suportados.
  if (toCents(amount) !== toCents(receivable.amount)) {
    throw unprocessable(
      'Nesta versao o recebimento e integral. Ajuste o valor do recebivel antes de confirmar.',
      { code: 'PARTIAL_PAYMENT_UNSUPPORTED' },
    );
  }

  const now = new Date();
  const paymentId = newId();

  try {
    await tx.insert(payments).values({
      id: paymentId,
      receivableId: receivable.id,
      leadId: receivable.leadId,
      amount,
      paymentDate: input.paymentDate,
      status: 'CONFIRMED',
      reversalOfId: null,
      reason: input.note ?? null,
      idempotencyKey: input.idempotencyKey,
      createdBy: input.actorUserId,
      createdAt: now,
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const [row] = await tx
        .select()
        .from(payments)
        .where(eq(payments.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (row) {
        return { paymentId: row.id, receivable, created: false };
      }
    }
    throw error;
  }

  await tx
    .update(receivables)
    .set({ status: 'PAID', paidAt: now, updatedAt: now })
    .where(eq(receivables.id, receivable.id));

  await recordEvent(tx, {
    leadId: receivable.leadId,
    eventType: 'PAYMENT_RECEIVED',
    occurredAt: now,
    actorUserId: input.actorUserId,
    payload: {
      paymentId,
      receivableId: receivable.id,
      amount,
      paymentDate: input.paymentDate,
    },
    idempotencyKey: `${input.idempotencyKey}:event`,
  });

  await confirmSaleIfFullyPaid(tx, receivable.saleId, input.actorUserId, now);

  const updated = await getReceivable(tx, receivable.id);
  return { paymentId, receivable: updated, created: true };
}

/** Marca a venda como confirmada quando nenhum recebivel dela segue em aberto. */
async function confirmSaleIfFullyPaid(
  tx: Database,
  saleId: string | null,
  actorUserId: string,
  now: Date,
): Promise<void> {
  if (!saleId) return;

  const open = await tx
    .select({ total: sql<number>`count(*)` })
    .from(receivables)
    .where(
      and(eq(receivables.saleId, saleId), inArray(receivables.status, ['PENDING', 'OVERDUE'])),
    );

  if (Number(open[0]?.total ?? 0) > 0) return;

  await tx
    .update(sales)
    .set({ status: 'CONFIRMED', confirmedAt: now, updatedAt: now })
    .where(and(eq(sales.id, saleId), eq(sales.status, 'PENDING')));

  void actorUserId;
}

export async function getReceivable(tx: Database, receivableId: string): Promise<Receivable> {
  const [row] = await tx
    .select()
    .from(receivables)
    .where(eq(receivables.id, receivableId))
    .limit(1);
  if (!row) throw notFound('Recebivel nao encontrado.');
  return row;
}

export interface ReversePaymentInput {
  paymentId: string;
  reason: string;
  actorUserId: string;
  idempotencyKey: string;
}

/**
 * Estorna um pagamento. O registro original permanece visivel; a reversao e
 * um novo lancamento que retira o valor da receita liquida.
 */
export async function reversePayment(tx: Database, input: ReversePaymentInput): Promise<string> {
  const [existing] = await tx
    .select()
    .from(payments)
    .where(eq(payments.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing) return existing.id;

  const [original] = await tx
    .select()
    .from(payments)
    .where(eq(payments.id, input.paymentId))
    .limit(1);
  if (!original) throw notFound('Pagamento nao encontrado.');
  if (original.status !== 'CONFIRMED') {
    throw conflict('Somente um pagamento confirmado pode ser estornado.');
  }

  const [alreadyReversed] = await tx
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.reversalOfId, original.id))
    .limit(1);
  if (alreadyReversed) {
    throw conflict('Este pagamento ja foi estornado.', { code: 'ALREADY_REVERSED' });
  }

  const now = new Date();
  const reversalId = newId();

  await tx.insert(payments).values({
    id: reversalId,
    receivableId: original.receivableId,
    leadId: original.leadId,
    amount: `-${original.amount}`,
    /**
     * A data e a do pagamento ORIGINAL, nao a de hoje.
     *
     * Datar o estorno no dia em que ele foi feito jogava o lado negativo em
     * um periodo e o positivo em outro: "Hoje" ficava com receita negativa,
     * e o mes do recebimento seguia inflado por um dinheiro que voltou.
     *
     * Casando as duas linhas na mesma data, elas se anulam onde precisam se
     * anular: o periodo em que o dinheiro supostamente entrou passa a somar
     * zero. `created_at` continua guardando QUANDO o estorno aconteceu, que
     * e o dado de auditoria.
     */
    paymentDate: original.paymentDate,
    status: 'REVERSAL',
    reversalOfId: original.id,
    reason: input.reason.slice(0, 500),
    idempotencyKey: input.idempotencyKey,
    createdBy: input.actorUserId,
    createdAt: now,
  });

  // O recebivel volta a ficar em aberto para nova conferencia.
  await tx
    .update(receivables)
    .set({ status: 'PENDING', paidAt: null, updatedAt: now })
    .where(eq(receivables.id, original.receivableId));

  const receivable = await getReceivable(tx, original.receivableId);
  if (receivable.saleId) {
    await tx
      .update(sales)
      .set({ status: 'PENDING', confirmedAt: null, updatedAt: now })
      .where(and(eq(sales.id, receivable.saleId), eq(sales.status, 'CONFIRMED')));
  }

  await recordEvent(tx, {
    leadId: original.leadId,
    eventType: 'PAYMENT_REVERSED',
    occurredAt: now,
    actorUserId: input.actorUserId,
    payload: {
      paymentId: reversalId,
      reversalOf: original.id,
      amount: original.amount,
      reason: input.reason.slice(0, 500),
    },
    idempotencyKey: `${input.idempotencyKey}:event`,
  });

  await tx.insert(auditLog).values({
    id: newId(),
    action: 'PAYMENT_REVERSED',
    entityType: 'payments',
    entityId: original.id,
    actorUserId: input.actorUserId,
    summary: 'Pagamento estornado com motivo registrado.',
    metadata: { reversalId, amount: original.amount },
    occurredAt: now,
  });

  return reversalId;
}

export async function cancelReceivable(
  tx: Database,
  input: { receivableId: string; reason: string; actorUserId: string },
): Promise<void> {
  const receivable = await getReceivable(tx, input.receivableId);

  if (receivable.status === 'PAID') {
    throw conflict('Um recebimento confirmado deve ser estornado, nao cancelado.', {
      code: 'USE_REVERSAL',
    });
  }
  if (receivable.status === 'CANCELED') return;

  const now = new Date();
  await tx
    .update(receivables)
    .set({
      status: 'CANCELED',
      canceledAt: now,
      cancellationReason: input.reason.slice(0, 500),
      updatedAt: now,
    })
    .where(eq(receivables.id, receivable.id));

  await tx.insert(auditLog).values({
    id: newId(),
    action: 'RECEIVABLE_CANCELED',
    entityType: 'receivables',
    entityId: receivable.id,
    actorUserId: input.actorUserId,
    summary: 'Recebivel cancelado com motivo registrado.',
    metadata: { amount: receivable.amount },
    occurredAt: now,
  });
}

export async function cancelSale(
  tx: Database,
  input: {
    saleId: string;
    reason: string;
    receivableAction: 'KEEP_PENDING' | 'CANCEL';
    actorUserId: string;
  },
): Promise<void> {
  const [sale] = await tx.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
  if (!sale) throw notFound('Venda nao encontrada.');
  if (sale.status === 'CANCELED') return;

  const now = new Date();

  // Snapshots e itens permanecem intactos; apenas o status muda.
  await tx
    .update(sales)
    .set({
      status: 'CANCELED',
      canceledAt: now,
      cancellationReason: input.reason.slice(0, 500),
      updatedAt: now,
    })
    .where(eq(sales.id, sale.id));

  if (input.receivableAction === 'CANCEL') {
    const open = await tx
      .select({ id: receivables.id })
      .from(receivables)
      .where(
        and(eq(receivables.saleId, sale.id), inArray(receivables.status, ['PENDING', 'OVERDUE'])),
      );

    for (const row of open) {
      await cancelReceivable(tx, {
        receivableId: row.id,
        reason: `Venda cancelada: ${input.reason}`,
        actorUserId: input.actorUserId,
      });
    }
  }

  await recordEvent(tx, {
    leadId: sale.leadId,
    eventType: 'SALE_REVERSED',
    occurredAt: now,
    actorUserId: input.actorUserId,
    payload: { saleId: sale.id, reason: input.reason.slice(0, 500) },
  });

  await tx.insert(auditLog).values({
    id: newId(),
    action: 'SALE_CANCELED',
    entityType: 'sales',
    entityId: sale.id,
    actorUserId: input.actorUserId,
    summary: 'Venda cancelada com motivo registrado.',
    metadata: { total: sale.totalSnapshot, receivableAction: input.receivableAction },
    occurredAt: now,
  });
}

export async function cancelSubscription(
  tx: Database,
  input: {
    subscriptionId: string;
    canceledAt: string;
    reason: string;
    openReceivableAction: 'KEEP_PENDING' | 'CANCEL';
    actorUserId: string;
  },
): Promise<void> {
  const [subscription] = await tx
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, input.subscriptionId))
    .limit(1);
  if (!subscription) throw notFound('Recorrencia nao encontrada.');
  if (subscription.status === 'CANCELED') return;

  const now = new Date();

  // A assinatura nao e apagada: cobrancas futuras simplesmente param.
  await tx
    .update(subscriptions)
    .set({
      status: 'CANCELED',
      canceledAt: now,
      cancellationReason: input.reason.slice(0, 500),
      nextDueDate: null,
      updatedAt: now,
    })
    .where(eq(subscriptions.id, subscription.id));

  if (input.openReceivableAction === 'CANCEL') {
    const open = await tx
      .select({ id: receivables.id })
      .from(receivables)
      .where(
        and(
          eq(receivables.subscriptionId, subscription.id),
          inArray(receivables.status, ['PENDING', 'OVERDUE']),
        ),
      );

    for (const row of open) {
      await cancelReceivable(tx, {
        receivableId: row.id,
        reason: `Recorrencia cancelada: ${input.reason}`,
        actorUserId: input.actorUserId,
      });
    }
  }

  await recordEvent(tx, {
    leadId: subscription.leadId,
    eventType: 'SUBSCRIPTION_CANCELED',
    occurredAt: now,
    actorUserId: input.actorUserId,
    payload: {
      subscriptionId: subscription.id,
      reason: input.reason.slice(0, 500),
      canceledAt: input.canceledAt,
      openReceivableAction: input.openReceivableAction,
    },
  });
}

export async function changeSubscriptionAmount(
  tx: Database,
  input: {
    subscriptionId: string;
    newAmount: string;
    effectiveFrom: string;
    reason?: string | null;
    actorUserId: string;
  },
): Promise<void> {
  const [subscription] = await tx
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, input.subscriptionId))
    .limit(1);
  if (!subscription) throw notFound('Recorrencia nao encontrada.');
  if (subscription.status === 'CANCELED') {
    throw conflict('Uma recorrencia cancelada nao pode ter o valor alterado.');
  }

  const currentPeriod = toReferencePeriod(new Date());
  if (compareReferencePeriods(input.effectiveFrom, currentPeriod) < 0) {
    throw unprocessable(
      'A vigencia nao pode comecar em uma competencia ja encerrada. Periodos anteriores preservam o valor antigo.',
    );
  }

  const now = new Date();
  const newAmount = normalizeMoney(input.newAmount);

  await tx.insert(subscriptionChanges).values({
    id: newId(),
    subscriptionId: subscription.id,
    previousAmount: subscription.amountSnapshot,
    newAmount,
    effectiveFrom: input.effectiveFrom,
    reason: input.reason?.slice(0, 500) ?? null,
    createdAt: now,
  });

  await tx
    .update(subscriptions)
    .set({ amountSnapshot: newAmount, updatedAt: now })
    .where(eq(subscriptions.id, subscription.id));

  // Recebiveis ja pagos jamais sao reescritos; apenas os abertos da competencia
  // vigente em diante acompanham o novo valor.
  await tx
    .update(receivables)
    .set({ amount: newAmount, updatedAt: now })
    .where(
      and(
        eq(receivables.subscriptionId, subscription.id),
        inArray(receivables.status, ['PENDING', 'OVERDUE']),
        sql`${receivables.referencePeriod} >= ${input.effectiveFrom}`,
      ),
    );

  await recordEvent(tx, {
    leadId: subscription.leadId,
    eventType: 'SUBSCRIPTION_CHANGED',
    occurredAt: now,
    actorUserId: input.actorUserId,
    payload: {
      subscriptionId: subscription.id,
      previousAmount: subscription.amountSnapshot,
      newAmount,
      effectiveFrom: input.effectiveFrom,
    },
  });
}

export interface RecurrenceRunResult {
  generated: number;
  subscriptionsProcessed: number;
  overdueMarked: number;
}

/**
 * Gera as mensalidades faltantes.
 *
 * Idempotente por construcao: a unicidade (subscription_id, reference_period)
 * impede duplicar competencia. Se o cron parar por meses, a proxima execucao
 * gera as competencias faltantes na ordem correta.
 */
export async function generateRecurrences(
  db: Database,
  options: { now?: Date; actorUserId?: string | null } = {},
): Promise<RecurrenceRunResult> {
  const now = options.now ?? new Date();
  const today = toLocalDateString(now);
  const currentPeriod = toReferencePeriod(now);

  const active = await db.select().from(subscriptions).where(eq(subscriptions.status, 'ACTIVE'));

  let generated = 0;

  for (const subscription of active) {
    generated += await generateForSubscription(
      db,
      subscription,
      currentPeriod,
      options.actorUserId,
    );
  }

  // Atualiza vencidos: o valor continua pendente, apenas muda de rotulo.
  const overdue = await db
    .update(receivables)
    .set({ status: 'OVERDUE', updatedAt: now })
    .where(and(eq(receivables.status, 'PENDING'), sql`${receivables.dueDate} < ${today}`));

  return {
    generated,
    subscriptionsProcessed: active.length,
    overdueMarked: Number((overdue as unknown as { affectedRows?: number }).affectedRows ?? 0),
  };
}

async function generateForSubscription(
  db: Database,
  subscription: Subscription,
  currentPeriod: string,
  actorUserId: string | null | undefined,
): Promise<number> {
  const firstPeriod = subscription.firstDueDate.slice(0, 7);
  let period = subscription.lastGeneratedPeriod
    ? addMonthsToReferencePeriod(subscription.lastGeneratedPeriod, 1)
    : firstPeriod;

  // Nunca retroage antes da primeira competencia contratada.
  if (compareReferencePeriods(period, firstPeriod) < 0) period = firstPeriod;

  const dueDayOfMonth = Number(subscription.firstDueDate.slice(8, 10));
  let created = 0;
  let guard = 0;

  while (compareReferencePeriods(period, currentPeriod) <= 0 && guard < 240) {
    guard += 1;
    const dueDate = referencePeriodDueDate(period, dueDayOfMonth);
    const now = new Date();

    try {
      await db.transaction(async (tx) => {
        const receivableId = newId();
        await tx.insert(receivables).values({
          id: receivableId,
          leadId: subscription.leadId,
          saleId: null,
          subscriptionId: subscription.id,
          referencePeriod: period,
          descriptionSnapshot: `${subscription.serviceNameSnapshot} - competencia ${period}`,
          amount: subscription.amountSnapshot,
          dueDate,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        });

        await recordEvent(tx, {
          leadId: subscription.leadId,
          eventType: 'RECEIVABLE_GENERATED',
          occurredAt: now,
          actorUserId: actorUserId ?? null,
          payload: {
            receivableId,
            subscriptionId: subscription.id,
            referencePeriod: period,
            amount: subscription.amountSnapshot,
            dueDate,
          },
          // Chave deterministica: reexecutar o job nunca duplica o evento.
          idempotencyKey: `recurrence:${subscription.id}:${period}`,
        });

        await tx
          .update(subscriptions)
          .set({
            lastGeneratedPeriod: period,
            nextDueDate: referencePeriodDueDate(
              addMonthsToReferencePeriod(period, 1),
              dueDayOfMonth,
            ),
            updatedAt: now,
          })
          .where(eq(subscriptions.id, subscription.id));
      });

      created += 1;
    } catch (error) {
      // A competencia ja existia: avanca sem duplicar e sem falhar o job.
      if (!isDuplicateKeyError(error)) throw error;

      await db
        .update(subscriptions)
        .set({
          lastGeneratedPeriod: period,
          nextDueDate: referencePeriodDueDate(addMonthsToReferencePeriod(period, 1), dueDayOfMonth),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));
    }

    period = addMonthsToReferencePeriod(period, 1);
  }

  return created;
}
