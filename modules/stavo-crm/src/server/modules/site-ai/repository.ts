/**
 * Persistencia dos Sites com IA.
 *
 * Camada fina sobre o Drizzle: monta linhas, aplica indices e devolve o que o
 * servico pede. Nenhuma regra de negocio mora aqui -- decisao de transicao,
 * orcamento e autorizacao ficam em `service.ts`.
 *
 * Duas invariantes sao garantidas por INDICE, nunca por leitura previa:
 *  - `site_jobs_idempotency_unique` impede que o clique duplo vire duas
 *    chamadas pagas;
 *  - `site_versions_number_unique` impede duas versoes com o mesmo numero.
 *
 * Checar antes de inserir seria uma corrida perdida: entre o SELECT e o
 * INSERT cabe outra requisicao.
 */
import { createHash } from 'node:crypto';

import { and, desc, eq, gte, isNull, lte, or, sql, type SQL } from 'drizzle-orm';

import type { SiteJobStage, SiteJobStatus, SiteProjectStatus } from '@site-kit/types/site-ai';
import { getDb, type Database } from '../../db/client';
import {
  siteAiUsage,
  siteAssets,
  siteGenerationEvents,
  siteGenerationJobs,
  siteOutreachMessages,
  siteProjects,
  siteProjectVersions,
  sitePublications,
  type SiteAsset,
  type SiteGenerationJob,
  type SiteOutreachMessage,
  type SiteProject,
  type SiteProjectVersion,
} from '../../db/schema';
import { newId } from '../../lib/ids';

/**
 * Serializacao canonica para checksum.
 *
 * As chaves sao ordenadas de proposito: dois configs com o mesmo conteudo em
 * ordem diferente precisam gerar o MESMO hash, senao "nada mudou" viraria uma
 * versao nova a cada salvamento.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);

  return `{${entries.join(',')}}`;
}

export const checksumOf = (value: unknown): string =>
  createHash('sha256').update(canonicalJson(value)).digest('hex');

// ---------------------------------------------------------------------------
// Projetos
// ---------------------------------------------------------------------------

export interface NewProjectRow {
  leadId: string | null;
  ownerUserId: string;
  internalName: string;
  businessName: string;
  siteType: string;
  desiredSlug: string | null;
  draftConfig: unknown;
  creativeSeed: string;
  budgetLimitUsd: string | null;
  createdBy: string;
}

export async function insertProject(row: NewProjectRow, db: Database = getDb()): Promise<string> {
  const now = new Date();
  const id = newId();

  await db.insert(siteProjects).values({
    id,
    leadId: row.leadId,
    ownerUserId: row.ownerUserId,
    internalName: row.internalName,
    businessName: row.businessName,
    siteType: row.siteType,
    status: 'BRIEFING',
    desiredSlug: row.desiredSlug,
    draftConfig: row.draftConfig ?? null,
    creativeSeed: row.creativeSeed,
    budgetLimitUsd: row.budgetLimitUsd,
    createdBy: row.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function findProject(id: string, db: Database = getDb()): Promise<SiteProject | null> {
  const [row] = await db
    .select()
    .from(siteProjects)
    .where(and(eq(siteProjects.id, id), isNull(siteProjects.deletedAt)))
    .limit(1);

  return row ?? null;
}

/**
 * Projeto ATIVO de um lead.
 *
 * Arquivado e excluido nao contam: o objetivo e impedir um segundo projeto
 * em andamento por acidente, nao impedir que o lead receba outra proposta
 * depois que a primeira foi descartada.
 */
export async function findActiveProjectByLead(
  leadId: string,
  db: Database = getDb(),
): Promise<SiteProject | null> {
  const [row] = await db
    .select()
    .from(siteProjects)
    .where(
      and(
        eq(siteProjects.leadId, leadId),
        isNull(siteProjects.deletedAt),
        isNull(siteProjects.archivedAt),
      ),
    )
    .orderBy(desc(siteProjects.updatedAt))
    .limit(1);

  return row ?? null;
}

export interface ProjectListFilters {
  status?: SiteProjectStatus;
  leadId?: string;
  search?: string;
  includeArchived?: boolean;
  limit: number;
  offset: number;
}

export async function listProjects(
  filters: ProjectListFilters,
  db: Database = getDb(),
): Promise<{ rows: SiteProject[]; total: number }> {
  const conditions: SQL[] = [isNull(siteProjects.deletedAt)];

  if (!filters.includeArchived) conditions.push(isNull(siteProjects.archivedAt));
  if (filters.status) conditions.push(eq(siteProjects.status, filters.status));
  if (filters.leadId) conditions.push(eq(siteProjects.leadId, filters.leadId));

  if (filters.search?.trim()) {
    // O termo vai como parametro ligado; o LIKE nunca concatena texto do usuario.
    const term = `%${filters.search.trim()}%`;
    const bySearch = or(
      sql`${siteProjects.businessName} LIKE ${term}`,
      sql`${siteProjects.internalName} LIKE ${term}`,
    );
    if (bySearch) conditions.push(bySearch);
  }

  const where = and(...conditions);

  const rows = await db
    .select()
    .from(siteProjects)
    .where(where)
    .orderBy(desc(siteProjects.updatedAt))
    .limit(filters.limit)
    .offset(filters.offset);

  const [counted] = await db
    .select({ total: sql<number>`count(*)` })
    .from(siteProjects)
    .where(where);

  return { rows, total: Number(counted?.total ?? 0) };
}

/**
 * Atualiza o projeto respeitando a concorrencia otimista.
 *
 * Devolve `false` quando ninguem foi afetado, ou seja, quando outra aba ja
 * salvou por cima. O chamador transforma isso em 409 com o conteudo atual --
 * nunca em uma sobrescrita silenciosa.
 */
export async function updateProject(
  id: string,
  expectedLockVersion: number,
  patch: Partial<{
    internalName: string;
    businessName: string;
    siteType: string;
    status: SiteProjectStatus;
    desiredSlug: string | null;
    draftConfig: unknown;
    designFingerprint: string | null;
    currentVersionNumber: number;
    activePublicationId: string | null;
    budgetLimitUsd: string | null;
    lastFailureCode: string | null;
    lastFailureMessage: string | null;
    archivedAt: Date | null;
  }>,
  db: Database = getDb(),
): Promise<boolean> {
  const result = await db
    .update(siteProjects)
    .set({
      ...patch,
      lockVersion: sql`${siteProjects.lockVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(siteProjects.id, id),
        eq(siteProjects.lockVersion, expectedLockVersion),
        isNull(siteProjects.deletedAt),
      ),
    );

  return affectedRows(result) > 0;
}

/**
 * Muda apenas o status, sem exigir lock.
 *
 * Usado pelo worker: ele nao esta editando conteudo, esta reportando o que
 * aconteceu com o job. Fazer o worker disputar o lock com o editor faria uma
 * digitacao do usuario cancelar a atualizacao de progresso.
 *
 * O `from` esperado protege contra reordenacao: so muda se o projeto ainda
 * estiver no estado que o worker viu.
 */
export async function updateProjectStatus(
  id: string,
  from: SiteProjectStatus,
  to: SiteProjectStatus,
  extra: Partial<{
    lastFailureCode: string | null;
    lastFailureMessage: string | null;
    currentVersionNumber: number;
    activePublicationId: string | null;
    draftConfig: unknown;
  }> = {},
  db: Database = getDb(),
): Promise<boolean> {
  const result = await db
    .update(siteProjects)
    .set({ ...extra, status: to, updatedAt: new Date() })
    .where(
      and(eq(siteProjects.id, id), eq(siteProjects.status, from), isNull(siteProjects.deletedAt)),
    );

  return affectedRows(result) > 0;
}

export async function addProjectCost(
  id: string,
  amountUsd: string,
  db: Database = getDb(),
): Promise<void> {
  await db
    .update(siteProjects)
    .set({
      costAccumulatedUsd: sql`${siteProjects.costAccumulatedUsd} + ${amountUsd}`,
      updatedAt: new Date(),
    })
    .where(eq(siteProjects.id, id));
}

// ---------------------------------------------------------------------------
// Versoes
// ---------------------------------------------------------------------------

export interface NewVersionRow {
  projectId: string;
  config: unknown;
  schemaVersion: string;
  rendererVersion: string;
  promptVersion: string;
  origin: 'GENERATION' | 'MANUAL' | 'AI_PATCH' | 'RESTORE' | 'PUBLICATION';
  summary: string | null;
  createdBy: string | null;
}

/**
 * Cria a proxima versao do projeto.
 *
 * O numero vem de `MAX(version_number) + 1` calculado DENTRO do insert, e a
 * unicidade e garantida pelo indice: duas gravacoes simultaneas nao produzem
 * duas versoes 7 -- a segunda falha e o chamador tenta de novo.
 */
export async function insertVersion(
  row: NewVersionRow,
  db: Database = getDb(),
): Promise<{ id: string; versionNumber: number }> {
  const [current] = await db
    .select({ max: sql<number | null>`max(${siteProjectVersions.versionNumber})` })
    .from(siteProjectVersions)
    .where(eq(siteProjectVersions.projectId, row.projectId));

  const versionNumber = Number(current?.max ?? 0) + 1;
  const id = newId();

  await db.insert(siteProjectVersions).values({
    id,
    projectId: row.projectId,
    versionNumber,
    config: row.config,
    schemaVersion: row.schemaVersion,
    rendererVersion: row.rendererVersion,
    promptVersion: row.promptVersion,
    origin: row.origin,
    summary: row.summary,
    checksum: checksumOf(row.config),
    createdBy: row.createdBy,
    createdAt: new Date(),
  });

  return { id, versionNumber };
}

export async function listVersions(
  projectId: string,
  limit = 50,
  db: Database = getDb(),
): Promise<SiteProjectVersion[]> {
  return db
    .select()
    .from(siteProjectVersions)
    .where(eq(siteProjectVersions.projectId, projectId))
    .orderBy(desc(siteProjectVersions.versionNumber))
    .limit(limit);
}

export async function findVersion(
  projectId: string,
  versionId: string,
  db: Database = getDb(),
): Promise<SiteProjectVersion | null> {
  const [row] = await db
    .select()
    .from(siteProjectVersions)
    .where(
      and(eq(siteProjectVersions.id, versionId), eq(siteProjectVersions.projectId, projectId)),
    )
    .limit(1);

  return row ?? null;
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export interface NewJobRow {
  projectId: string;
  type: string;
  idempotencyKey: string;
  maxAttempts: number;
  priority?: number;
  inputHash?: string | null;
  createdBy: string;
}

/**
 * Enfileira um job, ou devolve o que ja existe com a mesma chave.
 *
 * `INSERT ... ON DUPLICATE KEY UPDATE id = id` e um no-op deliberado: ele nao
 * altera nada, so evita o erro de chave duplicada. Em seguida lemos a linha
 * pela chave, que e a mesma nas duas situacoes. O resultado e que dois cliques
 * simultaneos recebem o MESMO job.
 */
export async function enqueueJob(
  row: NewJobRow,
  db: Database = getDb(),
): Promise<{ job: SiteGenerationJob; created: boolean }> {
  const now = new Date();
  const id = newId();

  await db
    .insert(siteGenerationJobs)
    .values({
      id,
      projectId: row.projectId,
      type: row.type,
      idempotencyKey: row.idempotencyKey,
      status: 'PENDING',
      progress: 0,
      maxAttempts: row.maxAttempts,
      priority: row.priority ?? 0,
      inputHash: row.inputHash ?? null,
      createdBy: row.createdBy,
      createdAt: now,
      updatedAt: now,
    })
    .onDuplicateKeyUpdate({ set: { id: sql`${siteGenerationJobs.id}` } });

  const [job] = await db
    .select()
    .from(siteGenerationJobs)
    .where(eq(siteGenerationJobs.idempotencyKey, row.idempotencyKey))
    .limit(1);

  if (!job) {
    throw new Error('Job desapareceu logo apos ser gravado.');
  }

  return { job, created: job.id === id };
}

/**
 * Geracoes pedidas para o projeto desde `since`, para o limite diario.
 *
 * Um pedido repetido com a MESMA chave de idempotencia nao cria job novo e,
 * portanto, nao conta duas vezes.
 */
export async function countGenerationJobsSince(
  projectId: string,
  since: Date,
  db: Database = getDb(),
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(siteGenerationJobs)
    .where(
      and(
        eq(siteGenerationJobs.projectId, projectId),
        eq(siteGenerationJobs.type, 'INITIAL_GENERATION'),
        gte(siteGenerationJobs.createdAt, since),
      ),
    );
  return Number(row?.total ?? 0);
}

export async function findJob(id: string, db: Database = getDb()): Promise<SiteGenerationJob | null> {
  const [row] = await db
    .select()
    .from(siteGenerationJobs)
    .where(eq(siteGenerationJobs.id, id))
    .limit(1);

  return row ?? null;
}

export async function listJobsByProject(
  projectId: string,
  limit = 20,
  db: Database = getDb(),
): Promise<SiteGenerationJob[]> {
  return db
    .select()
    .from(siteGenerationJobs)
    .where(eq(siteGenerationJobs.projectId, projectId))
    .orderBy(desc(siteGenerationJobs.createdAt))
    .limit(limit);
}

/**
 * Toma posse de um job pendente.
 *
 * O UPDATE condicional e o proprio mecanismo de exclusao: dois workers podem
 * executar isto ao mesmo tempo, mas apenas um vera `affectedRows > 0`, porque
 * a condicao `status = 'PENDING'` deixa de valer depois do primeiro.
 *
 * Nao usa `SELECT ... FOR UPDATE SKIP LOCKED` de proposito: a versao do MySQL
 * da hospedagem nao esta confirmada, e este UPDATE e atomico em qualquer
 * versao.
 */
export async function claimJob(
  jobId: string,
  leaseOwner: string,
  leaseSeconds: number,
  db: Database = getDb(),
): Promise<boolean> {
  const now = new Date();
  const expires = new Date(now.getTime() + leaseSeconds * 1000);

  const result = await db
    .update(siteGenerationJobs)
    .set({
      status: 'RUNNING',
      leaseOwner,
      leaseExpiresAt: expires,
      startedAt: now,
      attempt: sql`${siteGenerationJobs.attempt} + 1`,
      updatedAt: now,
    })
    .where(and(eq(siteGenerationJobs.id, jobId), eq(siteGenerationJobs.status, 'PENDING')));

  return affectedRows(result) > 0;
}

/** Candidatos a execucao, na ordem em que o worker deve tentar. */
export async function findClaimableJobs(
  limit: number,
  db: Database = getDb(),
): Promise<SiteGenerationJob[]> {
  return db
    .select()
    .from(siteGenerationJobs)
    .where(and(eq(siteGenerationJobs.status, 'PENDING'), isNull(siteGenerationJobs.cancelRequestedAt)))
    .orderBy(desc(siteGenerationJobs.priority), siteGenerationJobs.createdAt)
    .limit(limit);
}

export async function renewLease(
  jobId: string,
  leaseOwner: string,
  leaseSeconds: number,
  db: Database = getDb(),
): Promise<boolean> {
  const expires = new Date(Date.now() + leaseSeconds * 1000);

  const result = await db
    .update(siteGenerationJobs)
    .set({ leaseExpiresAt: expires, updatedAt: new Date() })
    .where(
      and(
        eq(siteGenerationJobs.id, jobId),
        eq(siteGenerationJobs.leaseOwner, leaseOwner),
        eq(siteGenerationJobs.status, 'RUNNING'),
      ),
    );

  return affectedRows(result) > 0;
}

/**
 * Devolve a fila os jobs cujo lease venceu.
 *
 * Sem isto, um processo derrubado no meio de uma geracao deixaria o job em
 * RUNNING para sempre e o usuario olhando uma barra parada. Roda no boot e
 * periodicamente.
 *
 * O job so volta se ainda tiver tentativa sobrando; caso contrario vira
 * FAILED com motivo, que e um estado retomavel pelo usuario.
 */
export async function recoverExpiredLeases(db: Database = getDb()): Promise<number> {
  const now = new Date();

  const requeued = await db
    .update(siteGenerationJobs)
    .set({ status: 'PENDING', leaseOwner: null, leaseExpiresAt: null, updatedAt: now })
    .where(
      and(
        eq(siteGenerationJobs.status, 'RUNNING'),
        lte(siteGenerationJobs.leaseExpiresAt, now),
        sql`${siteGenerationJobs.attempt} < ${siteGenerationJobs.maxAttempts}`,
      ),
    );

  await db
    .update(siteGenerationJobs)
    .set({
      status: 'FAILED',
      leaseOwner: null,
      leaseExpiresAt: null,
      errorCode: 'LEASE_EXPIRED',
      errorMessage:
        'A geracao foi interrompida e nao restaram tentativas. Voce pode retomar quando quiser.',
      errorRetryable: true,
      finishedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(siteGenerationJobs.status, 'RUNNING'),
        lte(siteGenerationJobs.leaseExpiresAt, now),
        sql`${siteGenerationJobs.attempt} >= ${siteGenerationJobs.maxAttempts}`,
      ),
    );

  return affectedRows(requeued);
}

export async function updateJobStatus(
  jobId: string,
  from: SiteJobStatus,
  to: SiteJobStatus,
  extra: Partial<{
    stage: SiteJobStage | null;
    progress: number;
    provider: string | null;
    model: string | null;
    errorCode: string | null;
    errorMessage: string | null;
    errorRetryable: boolean | null;
    resultRef: string | null;
    finishedAt: Date | null;
    leaseOwner: string | null;
    leaseExpiresAt: Date | null;
  }> = {},
  db: Database = getDb(),
): Promise<boolean> {
  const result = await db
    .update(siteGenerationJobs)
    .set({ ...extra, status: to, updatedAt: new Date() })
    .where(and(eq(siteGenerationJobs.id, jobId), eq(siteGenerationJobs.status, from)));

  return affectedRows(result) > 0;
}

export async function requestCancel(jobId: string, db: Database = getDb()): Promise<boolean> {
  const result = await db
    .update(siteGenerationJobs)
    .set({ cancelRequestedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(siteGenerationJobs.id, jobId),
        isNull(siteGenerationJobs.cancelRequestedAt),
        or(eq(siteGenerationJobs.status, 'PENDING'), eq(siteGenerationJobs.status, 'RUNNING')),
      ),
    );

  return affectedRows(result) > 0;
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------

/**
 * Grava um evento de etapa.
 *
 * A sequencia vem do banco, nao de um contador em memoria: o processo pode
 * reiniciar no meio de um job e a numeracao precisa continuar de onde parou,
 * senao o SSE reenviaria eventos ja mostrados.
 */
/**
 * Cabe em `message` (varchar(300)). Sem isto, um aviso de IA mais falado que
 * o mock (ex. varios avisos de fato ausente concatenados) estoura a coluna
 * -- achado real com conteudo de IA de verdade -- e o INSERT falha. A falha
 * do proprio registro de evento nunca pode ser o motivo de um job travar.
 */
const EVENT_MESSAGE_MAX_LENGTH = 300;

function truncateForColumn(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const ellipsis = '…';
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

export async function appendEvent(
  jobId: string,
  eventType: string,
  message: string,
  stage: SiteJobStage | null = null,
  metadata: unknown = null,
  db: Database = getDb(),
): Promise<number> {
  const [current] = await db
    .select({ max: sql<number | null>`max(${siteGenerationEvents.sequence})` })
    .from(siteGenerationEvents)
    .where(eq(siteGenerationEvents.jobId, jobId));

  const sequence = Number(current?.max ?? 0) + 1;

  await db.insert(siteGenerationEvents).values({
    id: newId(),
    jobId,
    sequence,
    eventType,
    stage,
    message: truncateForColumn(message, EVENT_MESSAGE_MAX_LENGTH),
    metadata,
    createdAt: new Date(),
  });

  return sequence;
}

export async function listEvents(jobId: string, afterSequence = 0, db: Database = getDb()) {
  return db
    .select()
    .from(siteGenerationEvents)
    .where(
      and(eq(siteGenerationEvents.jobId, jobId), gte(siteGenerationEvents.sequence, afterSequence + 1)),
    )
    .orderBy(siteGenerationEvents.sequence);
}

// ---------------------------------------------------------------------------
// Publicacoes e uso
// ---------------------------------------------------------------------------

export async function findActivePublicationBySlug(slug: string, db: Database = getDb()) {
  const [row] = await db
    .select()
    .from(sitePublications)
    .where(and(eq(sitePublications.slug, slug), eq(sitePublications.status, 'ACTIVE')))
    .limit(1);

  return row ?? null;
}

/** Um slug so pode estar em uso por uma publicacao viva de outro projeto. */
export async function isSlugTaken(
  slug: string,
  exceptProjectId: string | null,
  db: Database = getDb(),
): Promise<boolean> {
  const conditions: SQL[] = [eq(sitePublications.slug, slug)];
  const alive = or(eq(sitePublications.status, 'ACTIVE'), eq(sitePublications.status, 'BUILDING'));
  if (alive) conditions.push(alive);

  const rows = await db
    .select({ projectId: sitePublications.projectId })
    .from(sitePublications)
    .where(and(...conditions))
    .limit(5);

  return rows.some((row) => row.projectId !== exceptProjectId);
}

export interface NewPublicationRow {
  projectId: string;
  versionId: string;
  slug: string;
  publishedBy: string;
}

/**
 * Cria a proxima publicacao, em BUILDING.
 *
 * O numero vem do MAX+1 dentro do proprio insert, protegido pelo indice
 * unico -- a mesma tecnica de `insertVersion`. Nunca comeca ACTIVE: so vira
 * ACTIVE depois do artefato escrito e do smoke test passar (secao 16.8).
 */
export async function insertPublication(
  row: NewPublicationRow,
  db: Database = getDb(),
): Promise<{ id: string; publicationNumber: number }> {
  const [current] = await db
    .select({ max: sql<number | null>`max(${sitePublications.publicationNumber})` })
    .from(sitePublications)
    .where(eq(sitePublications.projectId, row.projectId));

  const publicationNumber = Number(current?.max ?? 0) + 1;
  const id = newId();
  const now = new Date();

  await db.insert(sitePublications).values({
    id,
    projectId: row.projectId,
    versionId: row.versionId,
    publicationNumber,
    slug: row.slug,
    status: 'BUILDING',
    noindex: true,
    publishedBy: row.publishedBy,
    createdAt: now,
    updatedAt: now,
  });

  return { id, publicationNumber };
}

export async function findPublication(id: string, db: Database = getDb()) {
  const [row] = await db.select().from(sitePublications).where(eq(sitePublications.id, id)).limit(1);
  return row ?? null;
}

export async function listPublications(projectId: string, db: Database = getDb()) {
  return db
    .select()
    .from(sitePublications)
    .where(eq(sitePublications.projectId, projectId))
    .orderBy(desc(sitePublications.publicationNumber));
}

/**
 * Ativa uma publicacao que terminou de ser construida.
 *
 * Duas escritas, na ordem que preserva a regra "no maximo uma ativa": primeiro
 * rebaixa quem estava ACTIVE para SUPERSEDED, so DEPOIS promove a nova. Se o
 * processo cair entre as duas, o pior cenario e nenhuma publicacao ativa por
 * um instante -- nunca duas.
 */
export async function activatePublication(
  projectId: string,
  publicationId: string,
  artifact: { artifactKey: string; manifest: unknown; artifactChecksum: string; baseUrlSnapshot: string },
  db: Database = getDb(),
): Promise<void> {
  const now = new Date();

  await db
    .update(sitePublications)
    .set({ status: 'SUPERSEDED', supersededAt: now, updatedAt: now })
    .where(and(eq(sitePublications.projectId, projectId), eq(sitePublications.status, 'ACTIVE')));

  await db
    .update(sitePublications)
    .set({
      status: 'ACTIVE',
      artifactKey: artifact.artifactKey,
      manifest: artifact.manifest,
      artifactChecksum: artifact.artifactChecksum,
      baseUrlSnapshot: artifact.baseUrlSnapshot,
      publishedAt: now,
      updatedAt: now,
    })
    .where(eq(sitePublications.id, publicationId));
}

export async function markPublicationFailed(
  publicationId: string,
  failureCode: string,
  failureMessage: string,
  db: Database = getDb(),
): Promise<void> {
  await db
    .update(sitePublications)
    .set({ status: 'FAILED', failureCode, failureMessage, updatedAt: new Date() })
    .where(eq(sitePublications.id, publicationId));
}

export async function recordSmokeTest(
  publicationId: string,
  result: unknown,
  passed: boolean,
  db: Database = getDb(),
): Promise<void> {
  await db
    .update(sitePublications)
    .set({ smokeTestResult: result, smokeTestPassedAt: passed ? new Date() : null, updatedAt: new Date() })
    .where(eq(sitePublications.id, publicationId));
}

/** Rollback: a publicacao alvo (ja construida) volta a ser a ativa. */
export async function rollbackToPublication(
  projectId: string,
  targetPublicationId: string,
  db: Database = getDb(),
): Promise<boolean> {
  const target = await findPublication(targetPublicationId, db);
  if (!target || target.projectId !== projectId || target.status !== 'SUPERSEDED') return false;

  const now = new Date();
  await db
    .update(sitePublications)
    .set({ status: 'SUPERSEDED', supersededAt: now, updatedAt: now })
    .where(and(eq(sitePublications.projectId, projectId), eq(sitePublications.status, 'ACTIVE')));

  await db
    .update(sitePublications)
    .set({ status: 'ACTIVE', supersededAt: null, updatedAt: now })
    .where(eq(sitePublications.id, targetPublicationId));

  return true;
}

export async function unpublish(projectId: string, db: Database = getDb()): Promise<boolean> {
  const result = await db
    .update(sitePublications)
    .set({ status: 'UNPUBLISHED', unpublishedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(sitePublications.projectId, projectId), eq(sitePublications.status, 'ACTIVE')));

  return affectedRows(result) > 0;
}

// ---------------------------------------------------------------------------
// Mensagens de abordagem (WhatsApp -- secao 18)
// ---------------------------------------------------------------------------

export interface NewOutreachRow {
  projectId: string;
  publicationId?: string | null;
  leadId?: string | null;
  phoneSnapshot: string | null;
  messageText: string;
  generatedByModel?: string | null;
  createdBy: string;
}

export async function insertOutreachMessage(row: NewOutreachRow, db: Database = getDb()): Promise<string> {
  const id = newId();
  const now = new Date();

  await db.insert(siteOutreachMessages).values({
    id,
    projectId: row.projectId,
    publicationId: row.publicationId ?? null,
    leadId: row.leadId ?? null,
    phoneSnapshot: row.phoneSnapshot,
    messageText: row.messageText,
    generatedByModel: row.generatedByModel ?? null,
    editedByUser: false,
    createdBy: row.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function findOutreachMessage(
  projectId: string,
  messageId: string,
  db: Database = getDb(),
): Promise<SiteOutreachMessage | null> {
  const [row] = await db
    .select()
    .from(siteOutreachMessages)
    .where(and(eq(siteOutreachMessages.id, messageId), eq(siteOutreachMessages.projectId, projectId)))
    .limit(1);

  return row ?? null;
}

export async function listOutreachMessages(
  projectId: string,
  db: Database = getDb(),
): Promise<SiteOutreachMessage[]> {
  return db
    .select()
    .from(siteOutreachMessages)
    .where(eq(siteOutreachMessages.projectId, projectId))
    .orderBy(desc(siteOutreachMessages.createdAt));
}

export async function updateOutreachMessage(
  projectId: string,
  messageId: string,
  patch: Partial<{ messageText: string; editedByUser: boolean }>,
  db: Database = getDb(),
): Promise<boolean> {
  const result = await db
    .update(siteOutreachMessages)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(siteOutreachMessages.id, messageId), eq(siteOutreachMessages.projectId, projectId)));

  return affectedRows(result) > 0;
}

export async function markOutreachOpened(
  projectId: string,
  messageId: string,
  db: Database = getDb(),
): Promise<boolean> {
  const result = await db
    .update(siteOutreachMessages)
    .set({ openedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(siteOutreachMessages.id, messageId),
        eq(siteOutreachMessages.projectId, projectId),
        isNull(siteOutreachMessages.openedAt),
      ),
    );

  return affectedRows(result) > 0;
}

/** Idempotente: confirmar duas vezes nao cria dois registros de contato. */
export async function markOutreachConfirmedSent(
  projectId: string,
  messageId: string,
  db: Database = getDb(),
): Promise<boolean> {
  const result = await db
    .update(siteOutreachMessages)
    .set({ confirmedSentAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(siteOutreachMessages.id, messageId),
        eq(siteOutreachMessages.projectId, projectId),
        isNull(siteOutreachMessages.confirmedSentAt),
      ),
    );

  return affectedRows(result) > 0;
}

export interface UsageRow {
  projectId: string | null;
  jobId: string | null;
  provider: string;
  operation: string;
  model: string;
  providerRequestId?: string | null;
  inputTokens?: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  outputTokens?: number;
  imageCount?: number;
  costEstimatedUsd?: string | null;
  costActualUsd?: string | null;
  pricingVersion?: string | null;
  status: string;
  latencyMs?: number | null;
  /** Diagnostico da chamada -- so metadados, nunca conteudo. */
  stopReason?: string | null;
  effort?: string | null;
  promptVersion?: string | null;
  schemaVersion?: string | null;
  attempts?: number | null;
  contentBlocks?: string | null;
  outputBytes?: number | null;
  validationIssues?: number | null;
  errorCode?: string | null;
}

/** Append-only: uso de IA nunca e alterado nem apagado depois de gravado. */
export async function recordUsage(row: UsageRow, db: Database = getDb()): Promise<void> {
  await db.insert(siteAiUsage).values({
    id: newId(),
    projectId: row.projectId,
    jobId: row.jobId,
    provider: row.provider,
    operation: row.operation,
    model: row.model,
    providerRequestId: row.providerRequestId ?? null,
    inputTokens: row.inputTokens ?? 0,
    cacheCreationTokens: row.cacheCreationTokens ?? 0,
    cacheReadTokens: row.cacheReadTokens ?? 0,
    outputTokens: row.outputTokens ?? 0,
    imageCount: row.imageCount ?? 0,
    costEstimatedUsd: row.costEstimatedUsd ?? null,
    costActualUsd: row.costActualUsd ?? null,
    pricingVersion: row.pricingVersion ?? null,
    status: row.status,
    latencyMs: row.latencyMs ?? null,
    stopReason: row.stopReason ?? null,
    effort: row.effort ?? null,
    promptVersion: row.promptVersion ?? null,
    schemaVersion: row.schemaVersion ?? null,
    attempts: row.attempts ?? null,
    // Cabe na coluna mesmo com muitos blocos; e so diagnostico.
    contentBlocks: row.contentBlocks ? row.contentBlocks.slice(0, 200) : null,
    outputBytes: row.outputBytes ?? null,
    validationIssues: row.validationIssues ?? null,
    errorCode: row.errorCode ?? null,
    createdAt: new Date(),
  });
}

/**
 * Quanto ja foi gasto no mes corrente.
 *
 * Usa o valor confirmado quando existe e cai para o estimado quando o provider
 * nao devolveu custo. Somar so o confirmado deixaria o orcamento cego
 * justamente onde ele importa.
 */
export async function monthlySpendUsd(from: Date, db: Database = getDb()): Promise<number> {
  const [row] = await db
    .select({
      total: sql<string | null>`sum(coalesce(${siteAiUsage.costActualUsd}, ${siteAiUsage.costEstimatedUsd}, 0))`,
    })
    .from(siteAiUsage)
    .where(and(gte(siteAiUsage.createdAt, from), eq(siteAiUsage.status, 'SUCCESS')));

  return Number(row?.total ?? 0);
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export interface NewAssetRow {
  projectId: string;
  source: string;
  provider?: string | null;
  providerModel?: string | null;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  sizeBytes: number;
  checksum: string;
  altText?: string | null;
  rightsStatus: string;
  expiresAt?: Date | null;
  createdBy: string;
}

export async function insertAsset(row: NewAssetRow, db: Database = getDb()): Promise<string> {
  const now = new Date();
  const id = newId();

  await db.insert(siteAssets).values({
    id,
    projectId: row.projectId,
    source: row.source,
    provider: row.provider ?? null,
    providerModel: row.providerModel ?? null,
    storageKey: row.storageKey,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    width: row.width,
    height: row.height,
    sizeBytes: row.sizeBytes,
    checksum: row.checksum,
    altText: row.altText ?? null,
    focalX: '0.5000',
    focalY: '0.5000',
    rightsStatus: row.rightsStatus,
    expiresAt: row.expiresAt ?? null,
    createdBy: row.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function findAsset(
  projectId: string,
  assetId: string,
  db: Database = getDb(),
): Promise<SiteAsset | null> {
  const [row] = await db
    .select()
    .from(siteAssets)
    .where(and(eq(siteAssets.id, assetId), eq(siteAssets.projectId, projectId), isNull(siteAssets.deletedAt)))
    .limit(1);

  return row ?? null;
}

export async function listAssets(projectId: string, db: Database = getDb()): Promise<SiteAsset[]> {
  return db
    .select()
    .from(siteAssets)
    .where(and(eq(siteAssets.projectId, projectId), isNull(siteAssets.deletedAt)))
    .orderBy(desc(siteAssets.createdAt));
}

export async function updateAsset(
  projectId: string,
  assetId: string,
  patch: Partial<{ altText: string | null; focalX: string; focalY: string; transforms: unknown }>,
  db: Database = getDb(),
): Promise<boolean> {
  const result = await db
    .update(siteAssets)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(siteAssets.id, assetId), eq(siteAssets.projectId, projectId), isNull(siteAssets.deletedAt)));

  return affectedRows(result) > 0;
}

/** Soft delete: o registro fica para auditoria, so some da listagem. */
export async function softDeleteAsset(projectId: string, assetId: string, db: Database = getDb()): Promise<boolean> {
  const result = await db
    .update(siteAssets)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(siteAssets.id, assetId), eq(siteAssets.projectId, projectId), isNull(siteAssets.deletedAt)));

  return affectedRows(result) > 0;
}

// ---------------------------------------------------------------------------

/**
 * Linhas afetadas por um UPDATE.
 *
 * O mysql2 devolve o resultado dentro de um array; o formato varia conforme a
 * consulta, entao a leitura e defensiva. Este numero decide entre "gravou" e
 * "outra pessoa alterou antes", entao um `undefined` interpretado como sucesso
 * seria uma sobrescrita silenciosa.
 */
function affectedRows(result: unknown): number {
  if (Array.isArray(result)) {
    const [header] = result as Array<{ affectedRows?: number }>;
    return Number(header?.affectedRows ?? 0);
  }
  const header = result as { affectedRows?: number } | null;
  return Number(header?.affectedRows ?? 0);
}
