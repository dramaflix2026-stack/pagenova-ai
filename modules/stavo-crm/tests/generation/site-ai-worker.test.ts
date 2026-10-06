/**
 * Parte pura do worker: traduzir o briefing salvo em entrada do provider.
 *
 * A execucao completa (claim, lease, execucao, persistencia) exige o banco
 * real e esta coberta em `tests/integration/site-ai-worker.test.ts`. Aqui fica
 * so a logica que nao depende de rede nem de banco.
 */
import { describe, expect, it } from 'vitest';

import { briefingToProviderInput } from '@builder/generation/worker';
import type { SiteProject } from '@server/db/schema';

function projectWith(draftConfig: unknown): SiteProject {
  return {
    workspaceId: '01TESTWORKSPACE000000000001',
    id: 'p'.repeat(26),
    leadId: null,
    ownerUserId: 'u'.repeat(26),
    internalName: 'Projeto',
    businessName: 'Negocio Padrao',
    siteType: 'ONE_PAGE',
    status: 'QUEUED',
    desiredSlug: null,
    draftConfig,
    schemaVersion: '1.0.0',
    rendererVersion: '1.0.0',
    promptVersion: '1.0.0',
    creativeSeed: 'seed-0001',
    designFingerprint: null,
    currentVersionNumber: 0,
    activePublicationId: null,
    lockVersion: 1,
    costAccumulatedUsd: '0',
    budgetLimitUsd: null,
    lastFailureCode: null,
    lastFailureMessage: null,
    createdBy: 'u'.repeat(26),
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    deletedAt: null,
  };
}

describe('briefingToProviderInput', () => {
  it('usa o briefing salvo quando presente', () => {
    const input = briefingToProviderInput(
      projectWith({
        business: { name: 'Clinica Aurora', niche: 'Odontologia', services: [], differentials: [] },
        objective: { goal: 'APPOINTMENTS' },
        style: { theme: 'DARK', keywords: ['premium'], density: 'COMPACT', motionLevel: 'SUBTLE' },
        freeformInstructions: 'Tom acolhedor.',
      }),
    );

    expect(input.business.name).toBe('Clinica Aurora');
    expect(input.objective.goal).toBe('APPOINTMENTS');
    expect(input.style.motionLevel).toBe('SUBTLE');
    expect(input.freeformInstructions).toBe('Tom acolhedor.');
  });

  it('cai em defaults seguros quando o briefing esta vazio', () => {
    const input = briefingToProviderInput(projectWith(null));

    expect(input.business.name).toBe('Negocio Padrao');
    expect(input.objective.goal).toBe('WHATSAPP_CONVERSATIONS');
    expect(input.style.density).toBe('BALANCED');
    expect(input.style.motionLevel).toBe('BALANCED');
  });

  it('o nome do negocio do projeto sempre prevalece se o briefing vier sem nome', () => {
    const input = briefingToProviderInput(
      projectWith({ business: { name: '', services: [], differentials: [] } }),
    );
    expect(input.business.name).toBe('Negocio Padrao');
  });

  it('a semente criativa do projeto e sempre repassada', () => {
    const input = briefingToProviderInput(projectWith(null));
    expect(input.creativeSeed).toBe('seed-0001');
  });

  it('embrulha telefone/email/endereco digitados como fato USER_CONFIRMED', () => {
    const input = briefingToProviderInput(
      projectWith({
        business: {
          name: 'Clinica Aurora',
          phoneE164: '+5519998877665',
          email: 'contato@aurora.com.br',
          address: 'Rua das Flores, 100',
          services: [],
          differentials: [],
        },
      }),
    );

    expect(input.business.phoneE164).toMatchObject({ value: '+5519998877665', source: 'USER_CONFIRMED' });
    expect(input.business.email).toMatchObject({ value: 'contato@aurora.com.br', source: 'USER_CONFIRMED' });
    expect(input.business.address).toMatchObject({ value: 'Rua das Flores, 100', source: 'USER_CONFIRMED' });
    expect(input.business.phoneE164?.confirmedAt).toBeTruthy();
  });

  it('campo de contato ausente vira null, nunca um fato vazio inventado', () => {
    const input = briefingToProviderInput(
      projectWith({ business: { name: 'Sem Contato', services: [], differentials: [] } }),
    );

    expect(input.business.phoneE164).toBeNull();
    expect(input.business.whatsappE164).toBeNull();
    expect(input.business.address).toBeNull();
    expect(input.business.instagramUrl).toBeNull();
  });
});
