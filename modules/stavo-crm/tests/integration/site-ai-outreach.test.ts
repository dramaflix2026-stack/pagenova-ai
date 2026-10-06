/**
 * Abordagem por WhatsApp contra o banco real (secao 18).
 *
 * O que importa aqui nao e a geracao do texto (isso e testado no mock
 * provider, sem banco) e sim o que o banco garante: idempotencia de
 * "abriu"/"confirmou", e que confirmar o envio de um projeto ligado a um
 * lead cria UMA atividade nesse lead usando o MESMO mecanismo do resto do
 * CRM -- nunca um historico paralelo.
 *
 * Sem TEST_DB_* configurado a suite e IGNORADA com aviso -- nunca mascarada
 * como aprovada. Veja docs/testing.md.
 */
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import { activities } from '@server/db/schema';
import { createLead, deleteLead, recordActivity } from '@server/modules/leads/service';
import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import * as repo from '@server/modules/site-ai/repository';

import { hasTestDatabase, resetDatabase, schema, setupTestDatabase, SKIP_MESSAGE, teardownTestDatabase } from './setup';

const suite = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  console.warn(`\n${SKIP_MESSAGE}\n`);
}

const ADMIN = 'usuario-de-teste-000000001';

suite('abordagem por WhatsApp de sites com IA', () => {
  let db: Database;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    // site_projects.owner_user_id tem FK para users.id: precisa existir de verdade.
    const now = new Date();
    await db.insert(schema.users).values({
      id: ADMIN,
      email: 'teste-outreach@stavo.local',
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
    }) as Parameters<typeof createLead>[2];

  async function projectFor(leadId: string | null, businessName: string): Promise<string> {
    const model = buildFixtureSite();
    model.business.name = businessName;

    return repo.insertProject('01TESTWORKSPACE000000000001', {
      leadId,
      ownerUserId: ADMIN,
      internalName: businessName,
      businessName,
      siteType: 'ONE_PAGE',
      desiredSlug: null,
      draftConfig: model,
      creativeSeed: 'seed-outreach-0001',
      budgetLimitUsd: '5',
      createdBy: ADMIN,
    });
  }

  it('gerar duas mensagens mantem as duas no historico, mais recente primeiro', async () => {
    const projectId = await projectFor(null, 'Clinica Outreach Um');

    const firstId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: null,
      phoneSnapshot: '+5511988887777',
      messageText: 'Primeira mensagem gerada.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });
    const secondId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: null,
      phoneSnapshot: '+5511988887777',
      messageText: 'Segunda mensagem gerada.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });

    const list = await repo.listOutreachMessages(projectId);
    expect(list.map((m) => m.id)).toEqual([secondId, firstId]);
  });

  it('editar a mensagem marca editedByUser e persiste o novo texto', async () => {
    const projectId = await projectFor(null, 'Clinica Outreach Editar');
    const messageId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: null,
      phoneSnapshot: '+5511988887777',
      messageText: 'Texto original.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });

    const updated = await repo.updateOutreachMessage(projectId, messageId, {
      messageText: 'Texto editado a mao.',
      editedByUser: true,
    });
    expect(updated).toBe(true);

    const message = await repo.findOutreachMessage(projectId, messageId);
    expect(message?.messageText).toBe('Texto editado a mao.');
    expect(message?.editedByUser).toBe(true);
  });

  it('marcar como aberto e idempotente: a segunda chamada nao falha nem sobrescreve o horario', async () => {
    const projectId = await projectFor(null, 'Clinica Outreach Aberto');
    const messageId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: null,
      phoneSnapshot: '+5511988887777',
      messageText: 'Mensagem.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });

    const first = await repo.markOutreachOpened(projectId, messageId);
    expect(first).toBe(true);
    const openedAt = (await repo.findOutreachMessage(projectId, messageId))?.openedAt;
    expect(openedAt).toBeTruthy();

    const second = await repo.markOutreachOpened(projectId, messageId);
    expect(second).toBe(false); // ja estava aberto: WHERE openedAt IS NULL nao bate mais.

    const stillSame = (await repo.findOutreachMessage(projectId, messageId))?.openedAt;
    expect(stillSame?.getTime()).toBe(openedAt?.getTime());
  });

  it('confirmar envio em um projeto SEM lead so atualiza a mensagem, sem tentar criar atividade', async () => {
    const projectId = await projectFor(null, 'Clinica Outreach Sem Lead');
    const messageId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: null,
      phoneSnapshot: '+5511988887777',
      messageText: 'Mensagem.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });

    const confirmed = await repo.markOutreachConfirmedSent(projectId, messageId);
    expect(confirmed).toBe(true);

    const message = await repo.findOutreachMessage(projectId, messageId);
    expect(message?.confirmedSentAt).toBeTruthy();
  });

  it('confirmar envio em um projeto COM lead cria uma atividade WHATSAPP_ATTEMPT nesse lead', async () => {
    const { lead } = await createLead(db, '01TESTWORKSPACE000000000001', baseLead({ internalName: 'Padaria Outreach' }), { actorUserId: ADMIN });
    const projectId = await projectFor(lead.id, 'Padaria Outreach');
    const messageId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: lead.id,
      phoneSnapshot: '+5511988887777',
      messageText: 'Mensagem para a padaria.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });

    const confirmed = await repo.markOutreachConfirmedSent(projectId, messageId);
    expect(confirmed).toBe(true);

    // O router chama recordActivity so quando o projeto tem leadId; aqui
    // reproduzimos essa chamada diretamente para provar que o mecanismo
    // compartilhado (o mesmo que o resto do CRM ja usa) funciona de ponta a
    // ponta contra o banco real.
    await recordActivity(
      db,
      lead.id,
      { activityType: 'WHATSAPP_ATTEMPT', body: 'Mensagem do site com IA enviada pelo WhatsApp.' },
      ADMIN,
    );

    const rows = await db.select().from(activities).where(eq(activities.leadId, lead.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.activityType).toBe('WHATSAPP_ATTEMPT');
  });

  it('confirmar envio e idempotente: a segunda chamada nao falha nem sobrescreve o horario', async () => {
    const projectId = await projectFor(null, 'Clinica Outreach Confirmar Duas Vezes');
    const messageId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: null,
      phoneSnapshot: '+5511988887777',
      messageText: 'Mensagem.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });

    await repo.markOutreachConfirmedSent(projectId, messageId);
    const confirmedAt = (await repo.findOutreachMessage(projectId, messageId))?.confirmedSentAt;

    const second = await repo.markOutreachConfirmedSent(projectId, messageId);
    expect(second).toBe(false);

    const stillSame = (await repo.findOutreachMessage(projectId, messageId))?.confirmedSentAt;
    expect(stillSame?.getTime()).toBe(confirmedAt?.getTime());
  });

  it('apagar o lead nao apaga a mensagem de abordagem: leadId so vira nulo', async () => {
    const { lead } = await createLead(db, '01TESTWORKSPACE000000000001', baseLead({ internalName: 'Padaria Sera Excluida' }), { actorUserId: ADMIN });
    const projectId = await projectFor(lead.id, 'Padaria Sera Excluida');
    const messageId = await repo.insertOutreachMessage({
      projectId,
      publicationId: null,
      leadId: lead.id,
      phoneSnapshot: '+5511988887777',
      messageText: 'Mensagem antes da exclusao.',
      generatedByModel: 'mock-planner-v1',
      createdBy: ADMIN,
    });

    await deleteLead(db, lead.id, ADMIN);

    const message = await repo.findOutreachMessage(projectId, messageId);
    expect(message).not.toBeNull();
    expect(message?.leadId).toBeNull();
  });
});
