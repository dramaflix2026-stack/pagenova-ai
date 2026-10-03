/**
 * Regras centrais contra o banco real.
 *
 * Cobre os criterios de aceite mais importantes do prompt:
 *  - migracao do zero e seed idempotente;
 *  - place_id nunca cria dois cards;
 *  - telefone repetido nao duplica lead;
 *  - tres follow-ups continuam sendo UM primeiro contato;
 *  - voltar e mover de novo nao duplica evento;
 *  - pendente nao vira receita;
 *  - recorrencia gera uma cobranca por competencia, mesmo rodando duas vezes;
 *  - estorno preserva a trilha.
 */
import { and, count, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import { runSeed } from '@server/db/seed';
import { toCents } from '@server/domain/money';
import { generateRecurrences } from '@server/modules/finance/service';
import { createLead, moveLead, recordActivity } from '@server/modules/leads/service';
import { newIdempotencyKey } from '@server/lib/ids';
import {
  hasTestDatabase,
  resetDatabase,
  schema,
  setupTestDatabase,
  SKIP_MESSAGE,
  stageId,
  teardownTestDatabase,
} from './setup';

const suite = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  console.warn(`\n${SKIP_MESSAGE}\n`);
}

suite('integracao do CRM', () => {
  let db: Database;
  const ADMIN = 'usuario-de-teste-000000001';

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    const now = new Date();
    await db.insert(schema.users).values({
      id: ADMIN,
      email: 'teste@stavo.local',
      passwordHash: 'scrypt$32768$8$1$AAAA$AAAA',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  const baseLead = (overrides: Record<string, unknown> = {}) =>
    ({
      internalName: 'Padaria Sao Joao',
      originType: 'MANUAL' as const,
      sourceId: null,
      placeId: null,
      niche: 'padaria',
      country: 'Brasil',
      state: 'SP',
      city: 'Sao Paulo',
      address: 'Av. Paulista, 1000',
      campaignContext: null,
      notes: null,
      contacts: [{ type: 'PHONE' as const, value: '(11) 98888-7777', isPrimary: true }],
      links: [],
      serviceId: null,
      proposedPrice: null,
      nextFollowUpAt: null,
      allowSharedIdentity: false,
      sharedIdentityReason: null,
      ...overrides,
    }) as Parameters<typeof createLead>[1];

  const createService = async (billingType: 'ONE_TIME' | 'RECURRING_MONTHLY', price: string) => {
    const id = newIdempotencyKey('svc').slice(0, 26);
    const now = new Date();
    await db.insert(schema.services).values({
      id,
      name: billingType === 'ONE_TIME' ? 'Site institucional' : 'Manutencao mensal',
      description: null,
      billingType,
      defaultPrice: price,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  };

  // -------------------------------------------------------------------------
  describe('migracoes e seed', () => {
    it('cria o banco do zero com as etapas padrao na ordem correta', async () => {
      const stages = await db.select().from(schema.stages).orderBy(schema.stages.position);
      expect(stages.map((stage) => stage.semanticKey)).toEqual([
        'SELECTED',
        'FIRST_CONTACT',
        'FOLLOW_UP',
        'REPLIED',
        'NEGOTIATION',
        'AWAITING_PAYMENT',
        'WON',
        'LOST',
      ]);
    });

    it('o seed e idempotente: reexecutar nao duplica nada', async () => {
      await runSeed(db);
      await runSeed(db);

      const [stages] = await db.select({ total: count() }).from(schema.stages);
      const [sources] = await db.select({ total: count() }).from(schema.leadSources);
      const [reasons] = await db.select({ total: count() }).from(schema.lossReasons);

      expect(Number(stages?.total)).toBe(8);
      expect(Number(sources?.total)).toBe(7);
      expect(Number(reasons?.total)).toBe(9);
    });
  });

  // -------------------------------------------------------------------------
  describe('deduplicacao', () => {
    it('o mesmo place_id nunca cria dois cards', async () => {
      await createLead(db, baseLead({ placeId: 'ChIJ_unico', originType: 'GOOGLE_PLACE' }), {
        actorUserId: ADMIN,
      });

      await expect(
        createLead(
          db,
          baseLead({
            placeId: 'ChIJ_unico',
            internalName: 'Outro nome',
            originType: 'GOOGLE_PLACE',
            contacts: [],
            address: null,
          }),
          { actorUserId: ADMIN },
        ),
      ).rejects.toMatchObject({ code: 'DUPLICATE_LEAD' });

      const [total] = await db.select({ total: count() }).from(schema.leads);
      expect(Number(total?.total)).toBe(1);
    });

    it('o mesmo telefone importado duas vezes gera um unico card', async () => {
      await createLead(db, baseLead(), { actorUserId: ADMIN });

      await expect(
        createLead(
          db,
          baseLead({
            internalName: 'Padaria do Joao',
            address: 'Rua Diferente, 99',
            contacts: [{ type: 'WHATSAPP', value: '+5511988887777', isPrimary: true }],
          }),
          { actorUserId: ADMIN },
        ),
      ).rejects.toMatchObject({ code: 'DUPLICATE_LEAD' });

      const [total] = await db.select({ total: count() }).from(schema.leads);
      expect(Number(total?.total)).toBe(1);
    });

    it('a mesma marca em cidades diferentes gera dois leads legitimos', async () => {
      await createLead(db, baseLead(), { actorUserId: ADMIN });

      const segunda = await createLead(
        db,
        baseLead({
          city: 'Campinas',
          address: 'Rua Barao, 500',
          contacts: [{ type: 'PHONE', value: '(19) 97777-6666', isPrimary: true }],
        }),
        { actorUserId: ADMIN },
      );

      expect(segunda.lead.id).toBeTruthy();
      const [total] = await db.select({ total: count() }).from(schema.leads);
      expect(Number(total?.total)).toBe(2);
    });

    it('lead arquivado tambem bloqueia duplicata automatica', async () => {
      const created = await createLead(db, baseLead(), { actorUserId: ADMIN });
      await db
        .update(schema.leads)
        .set({ archivedAt: new Date(), status: 'ARCHIVED' })
        .where(eq(schema.leads.id, created.lead.id));

      await expect(createLead(db, baseLead(), { actorUserId: ADMIN })).rejects.toMatchObject({
        code: 'DUPLICATE_LEAD',
      });
    });
  });

  // -------------------------------------------------------------------------
  describe('primeiro contato e follow-up', () => {
    it('tres follow-ups continuam sendo UM primeiro contato', async () => {
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });

      const firstContact = await stageId(db, 'FIRST_CONTACT');
      const followUp = await stageId(db, 'FOLLOW_UP');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: firstContact,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('m1'),
        },
        ADMIN,
      );

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: followUp,
          expectedCurrentStageId: firstContact,
          idempotencyKey: newIdempotencyKey('m2'),
        },
        ADMIN,
      );

      // Tres tentativas explicitas em dias diferentes.
      for (let i = 0; i < 3; i += 1) {
        await recordActivity(
          db,
          lead.id,
          { activityType: 'WHATSAPP_ATTEMPT', body: `tentativa ${i + 1}` },
          ADMIN,
        );
      }

      // Volta e move de novo para Contato realizado.
      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: firstContact,
          expectedCurrentStageId: followUp,
          idempotencyKey: newIdempotencyKey('m3'),
        },
        ADMIN,
      );

      const [contacts] = await db
        .select({ total: count() })
        .from(schema.leadEvents)
        .where(
          and(
            eq(schema.leadEvents.leadId, lead.id),
            eq(schema.leadEvents.eventType, 'FIRST_CONTACT_RECORDED'),
          ),
        );

      const [attempts] = await db
        .select({ total: count() })
        .from(schema.leadEvents)
        .where(
          and(
            eq(schema.leadEvents.leadId, lead.id),
            eq(schema.leadEvents.eventType, 'CONTACT_ATTEMPT_RECORDED'),
          ),
        );

      expect(Number(contacts?.total)).toBe(1);
      expect(Number(attempts?.total)).toBe(3);
    });

    it('entrar na coluna Follow-up NAO registra tentativa', async () => {
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const followUp = await stageId(db, 'FOLLOW_UP');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: followUp,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('m'),
        },
        ADMIN,
      );

      const [attempts] = await db
        .select({ total: count() })
        .from(schema.leadEvents)
        .where(eq(schema.leadEvents.eventType, 'CONTACT_ATTEMPT_RECORDED'));
      expect(Number(attempts?.total)).toBe(0);
    });

    it('a primeira resposta e registrada uma unica vez', async () => {
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const replied = await stageId(db, 'REPLIED');
      const followUp = await stageId(db, 'FOLLOW_UP');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: replied,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('a'),
        },
        ADMIN,
      );
      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: followUp,
          expectedCurrentStageId: replied,
          idempotencyKey: newIdempotencyKey('b'),
        },
        ADMIN,
      );
      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: replied,
          expectedCurrentStageId: followUp,
          idempotencyKey: newIdempotencyKey('c'),
        },
        ADMIN,
      );

      const [responses] = await db
        .select({ total: count() })
        .from(schema.leadEvents)
        .where(eq(schema.leadEvents.eventType, 'FIRST_RESPONSE_RECORDED'));
      expect(Number(responses?.total)).toBe(1);
    });

    it('a mesma chave de idempotencia nao move o card duas vezes', async () => {
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const firstContact = await stageId(db, 'FIRST_CONTACT');
      const key = newIdempotencyKey('unica');

      const primeira = await moveLead(
        db,
        lead.id,
        {
          destinationStageId: firstContact,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: key,
        },
        ADMIN,
      );
      const segunda = await moveLead(
        db,
        lead.id,
        {
          destinationStageId: firstContact,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: key,
        },
        ADMIN,
      );

      expect(primeira.applied).toBe(true);
      expect(segunda.applied).toBe(false);

      const [moves] = await db
        .select({ total: count() })
        .from(schema.leadEvents)
        .where(eq(schema.leadEvents.eventType, 'STAGE_MOVED'));
      expect(Number(moves?.total)).toBe(1);
    });

    it('mover com a etapa esperada errada devolve conflito', async () => {
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const firstContact = await stageId(db, 'FIRST_CONTACT');
      const won = await stageId(db, 'WON');

      await expect(
        moveLead(
          db,
          lead.id,
          {
            destinationStageId: firstContact,
            // O card esta em Selecionados, nao em WON.
            expectedCurrentStageId: won,
            idempotencyKey: newIdempotencyKey('x'),
          },
          ADMIN,
        ),
      ).rejects.toMatchObject({ code: 'STAGE_CONFLICT' });
    });

    it('o historico de etapas guarda todas as passagens', async () => {
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const firstContact = await stageId(db, 'FIRST_CONTACT');
      const followUp = await stageId(db, 'FOLLOW_UP');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: firstContact,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('h1'),
        },
        ADMIN,
      );
      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: followUp,
          expectedCurrentStageId: firstContact,
          idempotencyKey: newIdempotencyKey('h2'),
        },
        ADMIN,
      );

      const history = await db
        .select()
        .from(schema.stageHistory)
        .where(eq(schema.stageHistory.leadId, lead.id));

      expect(history).toHaveLength(3); // Selecionados + Contato + Follow-up
      expect(history.filter((row) => row.exitedAt === null)).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  describe('perda', () => {
    it('exige motivo e registra uma unica perda por ciclo', async () => {
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const lost = await stageId(db, 'LOST');
      const [reason] = await db.select().from(schema.lossReasons).limit(1);

      await expect(
        moveLead(
          db,
          lead.id,
          {
            destinationStageId: lost,
            expectedCurrentStageId: lead.currentStageId,
            idempotencyKey: newIdempotencyKey('l0'),
          },
          ADMIN,
        ),
      ).rejects.toMatchObject({ code: 'LOSS_REASON_REQUIRED' });

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: lost,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('l1'),
          loss: { lossReasonId: reason!.id, note: 'Achou caro', followUpAt: null },
        },
        ADMIN,
      );

      const [losses] = await db.select({ total: count() }).from(schema.leadLosses);
      expect(Number(losses?.total)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  describe('financeiro', () => {
    it('valor pendente NAO conta como receita ate a confirmacao', async () => {
      const serviceId = await createService('ONE_TIME', '1500.00');
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const awaiting = await stageId(db, 'AWAITING_PAYMENT');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: awaiting,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('f1'),
          sale: {
            items: [{ serviceId, unitPrice: '1500.00', quantity: 1 }],
            agreedAt: '2026-08-20',
            dueDate: '2026-08-27',
            notes: null,
            paidNow: false,
            paymentDate: null,
          },
        },
        ADMIN,
      );

      const receivables = await db.select().from(schema.receivables);
      const payments = await db.select().from(schema.payments);

      expect(receivables).toHaveLength(1);
      expect(receivables[0]!.status).toBe('PENDING');
      expect(toCents(receivables[0]!.amount)).toBe(150000);
      // Nenhum pagamento: a receita realizada continua zero.
      expect(payments).toHaveLength(0);
    });

    it('confirmar o recebimento transfere o valor e confirma a venda', async () => {
      const serviceId = await createService('ONE_TIME', '1500.00');
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const awaiting = await stageId(db, 'AWAITING_PAYMENT');
      const won = await stageId(db, 'WON');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: awaiting,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('f2'),
          sale: {
            items: [{ serviceId, unitPrice: '1500.00', quantity: 1 }],
            agreedAt: '2026-08-20',
            dueDate: '2026-08-27',
            notes: null,
            paidNow: false,
            paymentDate: null,
          },
        },
        ADMIN,
      );

      const [receivable] = await db.select().from(schema.receivables);

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: won,
          expectedCurrentStageId: awaiting,
          idempotencyKey: newIdempotencyKey('f3'),
          won: {
            receivableId: receivable!.id,
            paymentDate: '2026-08-25',
            amount: null,
            sale: null,
          },
        },
        ADMIN,
      );

      const [updated] = await db
        .select()
        .from(schema.receivables)
        .where(eq(schema.receivables.id, receivable!.id));
      const payments = await db.select().from(schema.payments);
      const [sale] = await db.select().from(schema.sales);

      expect(updated!.status).toBe('PAID');
      expect(payments).toHaveLength(1);
      expect(payments[0]!.paymentDate).toBe('2026-08-25');
      expect(sale!.status).toBe('CONFIRMED');
    });

    it('estornar preserva o pagamento original e ajusta a receita liquida', async () => {
      const { reversePayment, confirmPayment } = await import('@server/modules/finance/service');
      const serviceId = await createService('ONE_TIME', '1000.00');
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const awaiting = await stageId(db, 'AWAITING_PAYMENT');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: awaiting,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('f4'),
          sale: {
            items: [{ serviceId, unitPrice: '1000.00', quantity: 1 }],
            agreedAt: '2026-08-20',
            dueDate: '2026-08-27',
            notes: null,
            paidNow: false,
            paymentDate: null,
          },
        },
        ADMIN,
      );

      const [receivable] = await db.select().from(schema.receivables);

      const payment = await db.transaction(async (tx) =>
        confirmPayment(tx as unknown as Database, {
          receivableId: receivable!.id,
          paymentDate: '2026-08-25',
          actorUserId: ADMIN,
          idempotencyKey: newIdempotencyKey('pay'),
        }),
      );

      await db.transaction(async (tx) =>
        reversePayment(tx as unknown as Database, {
          paymentId: payment.paymentId,
          reason: 'Cobranca em duplicidade',
          actorUserId: ADMIN,
          idempotencyKey: newIdempotencyKey('rev'),
        }),
      );

      const payments = await db.select().from(schema.payments);
      expect(payments).toHaveLength(2);

      // O lancamento original continua visivel.
      const original = payments.find((row) => row.id === payment.paymentId);
      expect(original).toBeTruthy();
      expect(original!.status).toBe('CONFIRMED');

      // A soma liquida volta a zero.
      const liquido = payments.reduce((sum, row) => sum + toCents(row.amount), 0);
      expect(liquido).toBe(0);

      // O recebivel volta a ficar em aberto.
      const [updated] = await db
        .select()
        .from(schema.receivables)
        .where(eq(schema.receivables.id, receivable!.id));
      expect(updated!.status).toBe('PENDING');
    });

    it('confirmar duas vezes com a mesma chave nao duplica o pagamento', async () => {
      const { confirmPayment } = await import('@server/modules/finance/service');
      const serviceId = await createService('ONE_TIME', '500.00');
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const awaiting = await stageId(db, 'AWAITING_PAYMENT');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: awaiting,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('f5'),
          sale: {
            items: [{ serviceId, unitPrice: '500.00', quantity: 1 }],
            agreedAt: '2026-08-20',
            dueDate: '2026-08-27',
            notes: null,
            paidNow: false,
            paymentDate: null,
          },
        },
        ADMIN,
      );

      const [receivable] = await db.select().from(schema.receivables);
      const key = newIdempotencyKey('mesma');

      const primeira = await db.transaction(async (tx) =>
        confirmPayment(tx as unknown as Database, {
          receivableId: receivable!.id,
          paymentDate: '2026-08-25',
          actorUserId: ADMIN,
          idempotencyKey: key,
        }),
      );
      const segunda = await db.transaction(async (tx) =>
        confirmPayment(tx as unknown as Database, {
          receivableId: receivable!.id,
          paymentDate: '2026-08-25',
          actorUserId: ADMIN,
          idempotencyKey: key,
        }),
      );

      expect(primeira.created).toBe(true);
      expect(segunda.created).toBe(false);

      const payments = await db.select().from(schema.payments);
      expect(payments).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  describe('recorrencias', () => {
    it('gera uma cobranca por competencia e nunca duplica ao rodar de novo', async () => {
      const serviceId = await createService('RECURRING_MONTHLY', '299.00');
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const awaiting = await stageId(db, 'AWAITING_PAYMENT');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: awaiting,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('r1'),
          sale: {
            items: [{ serviceId, unitPrice: '299.00', quantity: 1 }],
            agreedAt: '2026-06-10',
            dueDate: '2026-06-10',
            notes: null,
            paidNow: false,
            paymentDate: null,
          },
        },
        ADMIN,
      );

      // A venda ja cria a competencia inicial.
      let receivables = await db.select().from(schema.receivables);
      expect(receivables).toHaveLength(1);
      expect(receivables[0]!.referencePeriod).toBe('2026-06');

      // O job gera as competencias faltantes ate agosto.
      const august = new Date('2026-08-20T12:00:00Z');
      await generateRecurrences(db, { now: august });

      receivables = await db.select().from(schema.receivables);
      expect(receivables.map((row) => row.referencePeriod).sort()).toEqual([
        '2026-06',
        '2026-07',
        '2026-08',
      ]);

      // Rodar o job de novo NAO cria nada.
      await generateRecurrences(db, { now: august });
      receivables = await db.select().from(schema.receivables);
      expect(receivables).toHaveLength(3);
    });

    it('cancelar a recorrencia interrompe cobrancas futuras e preserva o passado', async () => {
      const { cancelSubscription } = await import('@server/modules/finance/service');
      const serviceId = await createService('RECURRING_MONTHLY', '299.00');
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });
      const awaiting = await stageId(db, 'AWAITING_PAYMENT');

      await moveLead(
        db,
        lead.id,
        {
          destinationStageId: awaiting,
          expectedCurrentStageId: lead.currentStageId,
          idempotencyKey: newIdempotencyKey('r2'),
          sale: {
            items: [{ serviceId, unitPrice: '299.00', quantity: 1 }],
            agreedAt: '2026-06-10',
            dueDate: '2026-06-10',
            notes: null,
            paidNow: false,
            paymentDate: null,
          },
        },
        ADMIN,
      );

      const [subscription] = await db.select().from(schema.subscriptions);

      await db.transaction(async (tx) =>
        cancelSubscription(tx as unknown as Database, {
          subscriptionId: subscription!.id,
          canceledAt: '2026-07-01',
          reason: 'Cliente encerrou o contrato',
          openReceivableAction: 'KEEP_PENDING',
          actorUserId: ADMIN,
        }),
      );

      const before = await db.select().from(schema.receivables);
      await generateRecurrences(db, { now: new Date('2026-12-20T12:00:00Z') });
      const after = await db.select().from(schema.receivables);

      // Nenhuma cobranca nova apos o cancelamento.
      expect(after).toHaveLength(before.length);

      // A assinatura nao foi apagada.
      const [canceled] = await db.select().from(schema.subscriptions);
      expect(canceled!.status).toBe('CANCELED');
      expect(canceled!.cancellationReason).toContain('encerrou');
    });
  });

  // -------------------------------------------------------------------------
  describe('arquivamento', () => {
    it('arquivar nao apaga eventos nem financeiro', async () => {
      const { archiveLead } = await import('@server/modules/leads/service');
      const { lead } = await createLead(db, baseLead(), { actorUserId: ADMIN });

      await archiveLead(db, lead.id, ADMIN);

      const [archived] = await db
        .select()
        .from(schema.leads)
        .where(eq(schema.leads.id, lead.id));
      const events = await db
        .select()
        .from(schema.leadEvents)
        .where(eq(schema.leadEvents.leadId, lead.id));

      expect(archived!.archivedAt).not.toBeNull();
      expect(events.length).toBeGreaterThan(0);
    });
  });
});
