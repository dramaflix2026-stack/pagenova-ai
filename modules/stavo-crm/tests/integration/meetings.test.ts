/**
 * Reunioes contra o banco real.
 *
 * O que so o banco prova:
 *  - reuniao + evento + lembretes nascem na MESMA transacao;
 *  - falha no meio nao deixa reuniao orfa;
 *  - a mesma chave de idempotencia nao cria duas reunioes;
 *  - conflito de horario e recusado, e horario encostado passa;
 *  - reagendar altera a MESMA linha, invalida os avisos antigos e cria novos;
 *  - cancelar/concluir/ausencia preservam tudo.
 *
 * Sem TEST_DB_* configurado a suite e IGNORADA com aviso -- nunca mascarada
 * como aprovada. Veja docs/testing.md.
 */
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import { runSeed } from '@server/db/seed';
import { newIdempotencyKey } from '@server/lib/ids';
import { createLead } from '@server/modules/leads/service';
import {
  cancelMeeting,
  completeMeeting,
  createMeeting,
  listMeetingAlerts,
  listMeetings,
  listUpcomingMeetings,
  nextMeetingByLead,
  noShowMeeting,
  rescheduleMeeting,
} from '@server/modules/meetings/service';
import {
  hasTestDatabase,
  resetDatabase,
  schema,
  setupTestDatabase,
  SKIP_MESSAGE,
  teardownTestDatabase,
} from './setup';

const suite = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  console.warn(`\n${SKIP_MESSAGE}\n`);
}

const LINK = 'https://meet.google.com/abc-defg-hij';

suite('integracao das reunioes', () => {
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
      name: 'Teste',
      role: 'OWNER',
      passwordHash: 'scrypt$32768$8$1$AAAA$AAAA',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await runSeed(db);
  });

  /**
   * Telefone deterministico por nome.
   *
   * Os testes de conflito de horario criam DOIS leads na mesma chamada
   * ("Cliente A" e "Cliente B"); com um numero fixo, o segundo sempre
   * colidiria com o primeiro pela regra (correta) de telefone unico.
   */
  const telefonePara = (nome: string) => {
    const soma = [...nome].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const sufixo = String(1000 + (soma % 9000)).padStart(4, '0');
    return `(11) 9${sufixo}-7777`;
  };

  /** Lead minimo para pendurar reunioes. */
  const novoLead = async (nome = 'Padaria Sao Joao') => {
    const resultado = await createLead(
      db,
      {
        internalName: nome,
        originType: 'MANUAL',
        sourceId: null,
        placeId: null,
        niche: 'padaria',
        country: 'Brasil',
        state: 'SP',
        city: 'Sao Paulo',
        address: null,
        campaignContext: null,
        notes: null,
        contacts: [{ type: 'PHONE', value: telefonePara(nome), isPrimary: true }],
        links: [],
        serviceId: null,
        proposedPrice: null,
        nextFollowUpAt: null,
        allowSharedIdentity: false,
        sharedIdentityReason: null,
      } as Parameters<typeof createLead>[1],
      { actorUserId: ADMIN, originType: 'MANUAL' },
    );
    return resultado.lead.id;
  };

  /** Faixa a partir de agora, em horas. */
  const daquiA = (horas: number, duracaoMin = 60) => {
    const start = new Date(Date.now() + horas * 60 * 60 * 1000);
    return {
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + duracaoMin * 60_000).toISOString(),
    };
  };

  const agendar = async (leadId: string, horas: number, extras: Record<string, unknown> = {}) =>
    createMeeting(
      db,
      {
        leadId,
        title: 'Apresentacao da proposta',
        agenda: null,
        internalNotes: null,
        serviceId: null,
        timezone: 'America/Sao_Paulo',
        meetUrl: LINK,
        reminderOffsetsMinutes: [1440, 60],
        idempotencyKey: newIdempotencyKey('t'),
        ...daquiA(horas),
        ...extras,
      } as Parameters<typeof createMeeting>[1],
      ADMIN,
    );

  // -------------------------------------------------------------------------
  describe('criacao', () => {
    it('grava reuniao, evento e lembretes na mesma transacao', async () => {
      const leadId = await novoLead();
      const reuniao = await agendar(leadId, 48);

      expect(reuniao.status).toBe('SCHEDULED');
      expect(reuniao.meetUrl).toBe(LINK);
      expect(reuniao.version).toBe(1);

      const eventos = await db
        .select()
        .from(schema.leadEvents)
        .where(eq(schema.leadEvents.meetingId, reuniao.id));
      expect(eventos).toHaveLength(1);
      expect(eventos[0]!.eventType).toBe('MEETING_SCHEDULED');

      const lembretes = await db
        .select()
        .from(schema.meetingReminders)
        .where(eq(schema.meetingReminders.meetingId, reuniao.id));
      expect(lembretes.map((l) => l.offsetMinutes).sort((a, b) => b - a)).toEqual([1440, 60]);
    });

    it('reuniao proxima nasce so com o lembrete que ainda cabe', async () => {
      const leadId = await novoLead();
      // Daqui a 3 horas: o aviso de 24h ja passou.
      const reuniao = await agendar(leadId, 3);

      const lembretes = await db
        .select()
        .from(schema.meetingReminders)
        .where(eq(schema.meetingReminders.meetingId, reuniao.id));
      expect(lembretes.map((l) => l.offsetMinutes)).toEqual([60]);
    });

    it('recusa lead inexistente sem deixar reuniao orfa', async () => {
      await expect(agendar('lead00000000000000000404', 48)).rejects.toMatchObject({
        code: 'LEAD_NOT_FOUND',
      });
      expect(await db.select().from(schema.meetings)).toHaveLength(0);
    });

    it('recusa lead arquivado', async () => {
      const leadId = await novoLead();
      await db
        .update(schema.leads)
        .set({ archivedAt: new Date(), status: 'ARCHIVED' })
        .where(eq(schema.leads.id, leadId));

      await expect(agendar(leadId, 48)).rejects.toMatchObject({ code: 'LEAD_ARCHIVED' });
    });

    it('recusa link que nao e do Google Meet', async () => {
      const leadId = await novoLead();
      await expect(
        agendar(leadId, 48, { meetUrl: 'https://meet.google.com.evil.example/abc' }),
      ).rejects.toMatchObject({ code: 'INVALID_MEET_URL' });
      expect(await db.select().from(schema.meetings)).toHaveLength(0);
    });

    it('recusa horario no passado', async () => {
      const leadId = await novoLead();
      await expect(agendar(leadId, -2)).rejects.toMatchObject({ code: 'MEETING_IN_PAST' });
    });

    it('recusa fim anterior ao inicio', async () => {
      const leadId = await novoLead();
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      await expect(
        agendar(leadId, 48, {
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() - 60_000).toISOString(),
        }),
      ).rejects.toMatchObject({ code: 'INVALID_TIME_RANGE' });
    });

    it('a mesma chave de idempotencia nao cria duas reunioes', async () => {
      const leadId = await novoLead();
      const chave = newIdempotencyKey('dup');
      const primeira = await agendar(leadId, 48, { idempotencyKey: chave });
      const segunda = await agendar(leadId, 48, { idempotencyKey: chave });

      expect(segunda.id).toBe(primeira.id);
      expect(await db.select().from(schema.meetings)).toHaveLength(1);
      expect(
        await db
          .select()
          .from(schema.leadEvents)
          .where(eq(schema.leadEvents.meetingId, primeira.id)),
      ).toHaveLength(1);
    });

    it('um lead pode ter varias reunioes', async () => {
      const leadId = await novoLead();
      await agendar(leadId, 48);
      await agendar(leadId, 72);
      await agendar(leadId, 96);

      const proximas = await listUpcomingMeetings(db, { leadId });
      expect(proximas).toHaveLength(3);
      // Da mais proxima para a mais distante.
      expect(new Date(proximas[0]!.startAt) < new Date(proximas[1]!.startAt)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('conflito de horario', () => {
    it('recusa sobreposicao', async () => {
      const leadA = await novoLead('Cliente A');
      const leadB = await novoLead('Cliente B');
      await agendar(leadA, 48);

      // Comeca 30 minutos depois da primeira, que dura 60.
      const start = new Date(Date.now() + 48.5 * 60 * 60 * 1000);
      await expect(
        agendar(leadB, 48, {
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() + 60 * 60_000).toISOString(),
        }),
      ).rejects.toMatchObject({ code: 'MEETING_CONFLICT' });
    });

    it('permite reuniao encostada', async () => {
      const leadA = await novoLead('Cliente A');
      const leadB = await novoLead('Cliente B');
      const primeira = await agendar(leadA, 48);

      const segunda = await agendar(leadB, 49, {
        startAt: primeira.endAt.toISOString(),
        endAt: new Date(primeira.endAt.getTime() + 60 * 60_000).toISOString(),
      });
      expect(segunda.status).toBe('SCHEDULED');
    });

    it('reuniao cancelada libera o horario', async () => {
      const leadA = await novoLead('Cliente A');
      const leadB = await novoLead('Cliente B');
      const primeira = await agendar(leadA, 48);

      await cancelMeeting(
        db,
        primeira.id,
        {
          reason: 'Cliente adiou',
          expectedVersion: primeira.version,
          idempotencyKey: newIdempotencyKey('c'),
        },
        ADMIN,
      );

      const segunda = await agendar(leadB, 48, {
        startAt: primeira.startAt.toISOString(),
        endAt: primeira.endAt.toISOString(),
      });
      expect(segunda.status).toBe('SCHEDULED');
    });
  });

  // -------------------------------------------------------------------------
  describe('reagendamento', () => {
    it('altera a MESMA reuniao, sem criar uma segunda', async () => {
      const leadId = await novoLead();
      const original = await agendar(leadId, 48);

      const novo = daquiA(96);
      const reagendada = await rescheduleMeeting(
        db,
        original.id,
        {
          startAt: novo.startAt,
          endAt: novo.endAt,
          expectedVersion: original.version,
          idempotencyKey: newIdempotencyKey('r'),
        } as Parameters<typeof rescheduleMeeting>[2],
        ADMIN,
      );

      expect(reagendada.id).toBe(original.id);
      expect(reagendada.version).toBe(original.version + 1);
      expect(await db.select().from(schema.meetings)).toHaveLength(1);
    });

    it('registra o horario anterior e o novo no historico', async () => {
      const leadId = await novoLead();
      const original = await agendar(leadId, 48);
      const novo = daquiA(96);

      await rescheduleMeeting(
        db,
        original.id,
        {
          startAt: novo.startAt,
          endAt: novo.endAt,
          expectedVersion: original.version,
          idempotencyKey: newIdempotencyKey('r'),
        } as Parameters<typeof rescheduleMeeting>[2],
        ADMIN,
      );

      const [evento] = await db
        .select()
        .from(schema.leadEvents)
        .where(
          and(
            eq(schema.leadEvents.meetingId, original.id),
            eq(schema.leadEvents.eventType, 'MEETING_RESCHEDULED'),
          ),
        );

      const payload = evento!.payload as { from: { startAt: string }; to: { startAt: string } };
      expect(payload.from.startAt).toBe(original.startAt.toISOString());
      expect(payload.to.startAt).toBe(new Date(novo.startAt).toISOString());
    });

    it('cancela os lembretes antigos e cria os do horario novo', async () => {
      const leadId = await novoLead();
      const original = await agendar(leadId, 48);
      const novo = daquiA(120);

      await rescheduleMeeting(
        db,
        original.id,
        {
          startAt: novo.startAt,
          endAt: novo.endAt,
          expectedVersion: original.version,
          idempotencyKey: newIdempotencyKey('r'),
        } as Parameters<typeof rescheduleMeeting>[2],
        ADMIN,
      );

      const lembretes = await db
        .select()
        .from(schema.meetingReminders)
        .where(eq(schema.meetingReminders.meetingId, original.id));

      const antigos = lembretes.filter((l) => l.meetingVersion === 1);
      const novos = lembretes.filter((l) => l.meetingVersion === 2);

      // Nenhum aviso do horario velho continua valendo.
      expect(antigos.every((l) => l.status === 'CANCELED')).toBe(true);
      expect(novos.every((l) => l.status === 'PENDING')).toBe(true);
      expect(novos.length).toBeGreaterThan(0);
    });

    it('nao conflita consigo mesma', async () => {
      const leadId = await novoLead();
      const original = await agendar(leadId, 48);

      // Empurra 15 minutos: a janela nova encosta na antiga.
      const start = new Date(original.startAt.getTime() + 15 * 60_000);
      const reagendada = await rescheduleMeeting(
        db,
        original.id,
        {
          startAt: start.toISOString(),
          endAt: new Date(start.getTime() + 60 * 60_000).toISOString(),
          expectedVersion: original.version,
          idempotencyKey: newIdempotencyKey('r'),
        } as Parameters<typeof rescheduleMeeting>[2],
        ADMIN,
      );
      expect(reagendada.id).toBe(original.id);
    });

    it('recusa versao desatualizada', async () => {
      const leadId = await novoLead();
      const original = await agendar(leadId, 48);
      const novo = daquiA(96);

      await expect(
        rescheduleMeeting(
          db,
          original.id,
          {
            startAt: novo.startAt,
            endAt: novo.endAt,
            expectedVersion: 99,
            idempotencyKey: newIdempotencyKey('r'),
          } as Parameters<typeof rescheduleMeeting>[2],
          ADMIN,
        ),
      ).rejects.toMatchObject({ code: 'STALE_MEETING_VERSION' });
    });
  });

  // -------------------------------------------------------------------------
  describe('desfechos', () => {
    it('concluir preserva a reuniao e cancela os avisos', async () => {
      const leadId = await novoLead();
      const reuniao = await agendar(leadId, 48);

      const concluida = await completeMeeting(
        db,
        reuniao.id,
        {
          outcome: 'Cliente pediu proposta',
          expectedVersion: reuniao.version,
          idempotencyKey: newIdempotencyKey('d'),
        },
        ADMIN,
      );

      expect(concluida.status).toBe('COMPLETED');
      expect(concluida.completedAt).not.toBeNull();
      expect(await db.select().from(schema.meetings)).toHaveLength(1);

      const lembretes = await db
        .select()
        .from(schema.meetingReminders)
        .where(eq(schema.meetingReminders.meetingId, reuniao.id));
      expect(lembretes.every((l) => l.status === 'CANCELED')).toBe(true);
    });

    it('concluir NAO move a etapa do lead nem cria venda', async () => {
      const leadId = await novoLead();
      const [antes] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
      const reuniao = await agendar(leadId, 48);

      await completeMeeting(
        db,
        reuniao.id,
        { outcome: null, expectedVersion: reuniao.version, idempotencyKey: newIdempotencyKey('d') },
        ADMIN,
      );

      const [depois] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
      expect(depois!.currentStageId).toBe(antes!.currentStageId);
      expect(await db.select().from(schema.sales)).toHaveLength(0);
    });

    it('ausencia e cancelamento preservam o registro', async () => {
      const leadA = await novoLead('Cliente A');
      const leadB = await novoLead('Cliente B');
      const primeira = await agendar(leadA, 48);
      const segunda = await agendar(leadB, 72);

      await noShowMeeting(
        db,
        primeira.id,
        {
          note: 'Nao entrou na sala',
          expectedVersion: primeira.version,
          idempotencyKey: newIdempotencyKey('n'),
        },
        ADMIN,
      );
      await cancelMeeting(
        db,
        segunda.id,
        {
          reason: 'Cliente desistiu',
          expectedVersion: segunda.version,
          idempotencyKey: newIdempotencyKey('c'),
        },
        ADMIN,
      );

      const todas = await db.select().from(schema.meetings);
      expect(todas).toHaveLength(2);
      expect(todas.find((m) => m.id === primeira.id)!.status).toBe('NO_SHOW');
      expect(todas.find((m) => m.id === segunda.id)!.status).toBe('CANCELED');
      expect(todas.find((m) => m.id === segunda.id)!.cancelReason).toBe('Cliente desistiu');
    });

    it('reuniao encerrada nao aceita novo desfecho', async () => {
      const leadId = await novoLead();
      const reuniao = await agendar(leadId, 48);
      const concluida = await completeMeeting(
        db,
        reuniao.id,
        { outcome: null, expectedVersion: reuniao.version, idempotencyKey: newIdempotencyKey('d') },
        ADMIN,
      );

      await expect(
        cancelMeeting(
          db,
          reuniao.id,
          {
            reason: 'tentativa',
            expectedVersion: concluida.version,
            idempotencyKey: newIdempotencyKey('c'),
          },
          ADMIN,
        ),
      ).rejects.toMatchObject({ code: 'INVALID_MEETING_TRANSITION' });
    });
  });

  // -------------------------------------------------------------------------
  describe('consultas', () => {
    it('a janela devolve so o intervalo pedido', async () => {
      const leadId = await novoLead();
      await agendar(leadId, 24);
      await agendar(leadId, 24 * 20);

      const inicio = new Date();
      const fim = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const dentro = await listMeetings(db, { start: inicio, end: fim });

      expect(dentro).toHaveLength(1);
    });

    it('reuniao que atravessa a borda da janela aparece', async () => {
      const leadId = await novoLead();
      const reuniao = await agendar(leadId, 24, { ...daquiA(24, 180) });

      // Janela que comeca no meio da reuniao.
      const meio = new Date(reuniao.startAt.getTime() + 60 * 60_000);
      const encontradas = await listMeetings(db, {
        start: meio,
        end: new Date(meio.getTime() + 24 * 60 * 60 * 1000),
      });
      expect(encontradas.map((m) => m.id)).toContain(reuniao.id);
    });

    it('a proxima reuniao por lead vem em uma consulta', async () => {
      const leadA = await novoLead('Cliente A');
      const leadB = await novoLead('Cliente B');
      const maisProxima = await agendar(leadA, 24);
      await agendar(leadA, 240);
      await agendar(leadB, 48);

      const mapa = await nextMeetingByLead(db, [leadA, leadB]);
      expect(mapa.get(leadA)!.id).toBe(maisProxima.id);
      // Sinaliza que existe mais uma alem da mostrada no card.
      expect(mapa.get(leadA)!.otherCount).toBe(1);
      expect(mapa.get(leadB)!.otherCount).toBe(0);
    });

    it('reuniao vencida sem desfecho aparece como pendente', async () => {
      const leadId = await novoLead();
      const reuniao = await agendar(leadId, 48);

      // Empurra para o passado direto no banco, simulando o tempo passando.
      const ontem = new Date(Date.now() - 26 * 60 * 60 * 1000);
      await db
        .update(schema.meetings)
        .set({ startAt: ontem, endAt: new Date(ontem.getTime() + 60 * 60_000) })
        .where(eq(schema.meetings.id, reuniao.id));

      const alertas = await listMeetingAlerts(db);
      const alerta = alertas.find((item) => item.meetingId === reuniao.id);
      expect(alerta?.urgency).toBe('NEEDS_OUTCOME');
    });

    it('reuniao cancelada nao gera alerta', async () => {
      const leadId = await novoLead();
      const reuniao = await agendar(leadId, 1);
      await cancelMeeting(
        db,
        reuniao.id,
        {
          reason: 'desistiu',
          expectedVersion: reuniao.version,
          idempotencyKey: newIdempotencyKey('c'),
        },
        ADMIN,
      );

      const alertas = await listMeetingAlerts(db);
      expect(alertas.find((item) => item.meetingId === reuniao.id)).toBeUndefined();
    });

    it('cada reuniao vira UM alerta, mesmo com dois lembretes', async () => {
      const leadId = await novoLead();
      const reuniao = await agendar(leadId, 0.5);

      const alertas = await listMeetingAlerts(db);
      const doMesmo = alertas.filter((item) => item.meetingId === reuniao.id);
      expect(doMesmo).toHaveLength(1);
      expect(doMesmo[0]!.urgency).toBe('WITHIN_HOUR');
    });
  });
});
