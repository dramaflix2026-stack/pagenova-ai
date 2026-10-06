/**
 * Seed idempotente.
 *
 * Reexecutar nunca duplica etapas, motivos, origens ou configuracoes.
 * Nao cria usuario nem qualquer dado secreto -- o administrador e criado pela
 * tarefa administrativa dedicada (scripts/create-admin.ts).
 */
import { and, eq, sql } from 'drizzle-orm';

import { STAGE_SEMANTIC_KEYS, type StageSemanticKey } from '../../shared/constants';
import { newId } from '../lib/ids';
import type { Database } from './client';
import { appSettings, leadSources, lossReasons, stages } from './schema';

interface StageSeed {
  name: string;
  semanticKey: StageSemanticKey;
  color: string;
}

/** Ordem exigida pela especificacao. */
export const DEFAULT_STAGES: StageSeed[] = [
  { name: 'Selecionados', semanticKey: 'SELECTED', color: '#64748b' },
  { name: 'Contato realizado', semanticKey: 'FIRST_CONTACT', color: '#2563eb' },
  { name: 'Follow-up', semanticKey: 'FOLLOW_UP', color: '#7c3aed' },
  { name: 'Respondeu', semanticKey: 'REPLIED', color: '#0891b2' },
  { name: 'Em negociacao', semanticKey: 'NEGOTIATION', color: '#d97706' },
  { name: 'Aguardando pagamento', semanticKey: 'AWAITING_PAYMENT', color: '#f59e0b' },
  { name: 'Venda concluida', semanticKey: 'WON', color: '#16a34a' },
  { name: 'Recusado/Perdido', semanticKey: 'LOST', color: '#dc2626' },
];

export const DEFAULT_SOURCES = [
  { name: 'Google Maps', slug: 'google-maps' },
  { name: 'Planilha', slug: 'planilha' },
  { name: 'Instagram', slug: 'instagram' },
  { name: 'Facebook', slug: 'facebook' },
  { name: 'Indicacao', slug: 'indicacao' },
  { name: 'Manual', slug: 'manual' },
  { name: 'Outro', slug: 'outro' },
];

export const DEFAULT_LOSS_REASONS = [
  'Nao tem interesse',
  'Achou caro',
  'Ja possui fornecedor',
  'Ja possui site',
  'Nao respondeu',
  'Contato invalido',
  'Fora do perfil',
  'Pediu para retornar futuramente',
  'Outro',
];

/** Preferencias nao secretas com valores iniciais. */
export const DEFAULT_SETTINGS: Record<string, unknown> = {
  appName: 'Stavo Digital',
  stalledNegotiationDays: 7,
  stalledSelectedDays: 5,
  dashboardDefaultPeriod: 'THIS_MONTH',
  searchRequirePhoneByDefault: true,
};

export interface SeedResult {
  stagesCreated: number;
  sourcesCreated: number;
  lossReasonsCreated: number;
  settingsCreated: number;
}

export async function runSeed(db: Database, workspaceId: string): Promise<SeedResult> {
  const now = new Date();
  const result: SeedResult = {
    stagesCreated: 0,
    sourcesCreated: 0,
    lossReasonsCreated: 0,
    settingsCreated: 0,
  };

  // --- Etapas: identidade e a semantic_key das etapas principais -----------
  const existingStages = await db.select().from(stages).where(eq(stages.workspaceId, workspaceId));
  const bySemantic = new Map(existingStages.map((stage) => [stage.semanticKey, stage]));

  for (const [index, seed] of DEFAULT_STAGES.entries()) {
    if (bySemantic.has(seed.semanticKey)) continue;
    await db.insert(stages).values({
      workspaceId,
      id: newId(),
      name: seed.name,
      semanticKey: seed.semanticKey,
      color: seed.color,
      position: index,
      active: true,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    });
    result.stagesCreated += 1;
  }

  // --- Origens: identidade e o slug ---------------------------------------
  const existingSources = await db.select().from(leadSources).where(eq(leadSources.workspaceId, workspaceId));
  const bySlug = new Set(existingSources.map((source) => source.slug));

  for (const seed of DEFAULT_SOURCES) {
    if (bySlug.has(seed.slug)) continue;
    await db.insert(leadSources).values({
      workspaceId,
      id: newId(),
      name: seed.name,
      slug: seed.slug,
      isSystem: true,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    result.sourcesCreated += 1;
  }

  // --- Motivos de perda: identidade e o nome ------------------------------
  const existingReasons = await db.select().from(lossReasons).where(eq(lossReasons.workspaceId, workspaceId));
  const byName = new Set(existingReasons.map((reason) => reason.name.toLowerCase()));

  for (const [index, name] of DEFAULT_LOSS_REASONS.entries()) {
    if (byName.has(name.toLowerCase())) continue;
    await db.insert(lossReasons).values({
      workspaceId,
      id: newId(),
      name,
      active: true,
      isSystem: true,
      position: index,
      createdAt: now,
      updatedAt: now,
    });
    result.lossReasonsCreated += 1;
  }

  // --- Configuracoes: nunca sobrescreve um valor ja ajustado --------------
  const existingSettings = await db.select().from(appSettings).where(eq(appSettings.workspaceId, workspaceId));
  const settingKeys = new Set(existingSettings.map((setting) => setting.settingKey));

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (settingKeys.has(key)) continue;
    await db.insert(appSettings).values({ workspaceId, settingKey: key, value, updatedAt: now });
    result.settingsCreated += 1;
  }

  return result;
}

/**
 * Valida que as etapas principais existem e nao se repetem.
 * Executado depois do seed e pelos testes de integracao.
 */
export async function assertStageIntegrity(db: Database, workspaceId: string): Promise<void> {
  const rows = await db
    .select({ semanticKey: stages.semanticKey, total: sql<number>`count(*)` })
    .from(stages)
    .where(
      and(
        eq(stages.workspaceId, workspaceId),
        sql`${stages.semanticKey} <> 'AUXILIARY' and ${stages.deletedAt} is null`,
      ),
    )
    .groupBy(stages.semanticKey);

  const counts = new Map(rows.map((row) => [row.semanticKey, Number(row.total)]));

  for (const key of STAGE_SEMANTIC_KEYS) {
    if (key === 'AUXILIARY') continue;
    const count = counts.get(key) ?? 0;
    if (count === 0) {
      throw new Error(`Etapa principal ausente: ${key}. Rode "npm run db:seed".`);
    }
    if (count > 1) {
      throw new Error(`Existe mais de uma etapa com o significado ${key}. Corrija antes de seguir.`);
    }
  }
}

/** Etapa correspondente a um significado interno. */
export async function getStageBySemantic(
  db: Database,
  workspaceId: string,
  semanticKey: StageSemanticKey,
): Promise<{ id: string; name: string } | null> {
  const [row] = await db
    .select({ id: stages.id, name: stages.name })
    .from(stages)
    .where(and(eq(stages.workspaceId, workspaceId), eq(stages.semanticKey, semanticKey)))
    .limit(1);
  return row ?? null;
}
