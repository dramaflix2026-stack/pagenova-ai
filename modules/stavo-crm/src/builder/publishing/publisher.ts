/**
 * Publicacao (secao 16 da especificacao).
 *
 * O artefato gerado aqui e a MESMA arvore de arquivos que a exportacao ZIP
 * (etapa A13) vai empacotar -- `index.html` mais `assets/images/*` -- porque
 * ambos partem da mesma fonte: `renderSite` sobre o `SiteSchema` congelado
 * numa versao. Publicar e exportar diferem so no destino final dos bytes.
 *
 * Fluxo, e por que cada passo existe nessa ordem:
 *
 *  1. o rascunho e validado e lintado de novo -- o editor pode ter permitido
 *     salvar com aviso, mas publicar com ERRO estrutural nunca;
 *  2. uma versao NOVA e congelada (origin=PUBLICATION) -- o que fica no ar
 *     nunca muda silenciosamente se o rascunho for editado depois;
 *  3. o artefato e escrito num caminho NOVO, exclusivo desta publicacao --
 *     nunca sobrescreve o anterior;
 *  4. o ponteiro troca JA (repo.activatePublication) -- a rota publica so
 *     serve uma publicacao ACTIVE, entao o smoke test do passo seguinte
 *     precisa que ela ja esteja no ar para testar a URL de verdade;
 *  5. um smoke test anonimo roda contra o proprio processo; se falhar, a
 *     troca do passo 4 e desfeita (a publicacao anterior volta a ACTIVE) e
 *     o administrador nunca ve "sucesso" para um link quebrado.
 */
import { getEnv, publicSitesBaseUrl, publicSitesDirAbsolute } from '@server/config/env';
import { validateSlug } from '@site-kit/types/site-ai';
import { lintSite } from '@site-kit/utils/linter';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import { SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';
import { AppError, conflict, notFound, serviceUnavailable, unprocessable } from '@server/lib/errors';
import { logger } from '@server/lib/logger';
import { buildSiteArtifactFiles } from '@builder/publishing/artifact-builder';
import { ensureGooglePlaceAssets } from '@builder/generation/google-place-asset-provider';
import * as repo from '@server/modules/site-ai/repository';
import { assertPublishable, resolveAvailableSlug, validateAndLintConfig } from '@server/modules/site-ai/service';
import { createLocalStorage } from '@builder/publishing/storage';
import type { SiteProject } from '@server/db/schema';

/** Raiz de armazenamento de todo artefato publicado. */
const publicStorage = () => createLocalStorage(publicSitesDirAbsolute());

/** Caminho-base desta publicacao dentro do storage publico. Nunca reaproveitado. */
const publicationRoot = (projectId: string, publicationId: string): string =>
  `${projectId}/pub-${publicationId}`;

export interface PublishResult {
  publication: NonNullable<Awaited<ReturnType<typeof repo.findPublication>>>;
  url: string;
}


/**
 * Normalizacao deterministica imediatamente antes da publicacao.
 * Mantem o conteudo criativo intacto e atua somente nos quatro bloqueios que
 * podem nascer da geracao automatica: placeholders e prova social nao
 * confirmada. Isso garante que um site gerado pela PageNova nao dependa de
 * uma correcao manual para conseguir ser publicado.
 */
function makeGeneratedDraftPublishSafe(model: SiteSchemaModel): SiteSchemaModel {
  const copy = structuredClone(model) as SiteSchemaModel;
  const blockedProofTypes = new Set(['authority', 'testimonials', 'stats']);
  const initial = lintSite(copy);
  const badProofIndexes = new Set<number>();

  for (const finding of initial.errors) {
    if (!['FACT_UNCONFIRMED_CREDENTIAL', 'FACT_UNCONFIRMED_TESTIMONIAL', 'FACT_UNCONFIRMED_STAT'].includes(finding.code)) continue;
    const match = finding.path.match(/^sections\\[(\\d+)\\]/);
    if (match) badProofIndexes.add(Number(match[1]));
  }

  if (badProofIndexes.size) {
    copy.sections = copy.sections.filter((section, index) =>
      !badProofIndexes.has(index) || !blockedProofTypes.has(section.type),
    );
  }

  const placeholderTokens = [
    'lorem ipsum', '[inserir', '[insira', '[nome', '[telefone', '[cidade',
    'xxx-xxxx', 'seu texto aqui', 'texto de exemplo', 'todo:', 'tbd',
  ];
  const containsPlaceholder = (value: string) => {
    const flat = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return placeholderTokens.some((token) => flat.includes(token));
  };
  const clean = (value: unknown, key = ''): unknown => {
    if (typeof value === 'string' && containsPlaceholder(value)) {
      if (/headline|title|name/i.test(key)) return copy.business.name;
      if (/label/i.test(key)) return 'Saiba mais';
      return 'Entre em contato para saber mais.';
    }
    if (Array.isArray(value)) return value.map((item) => clean(item, key));
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) out[childKey] = clean(child, childKey);
      return out;
    }
    return value;
  };

  return clean(copy) as SiteSchemaModel;
}

/**
 * Publica (ou atualiza a publicacao de) um projeto.
 *
 * `acknowledgedWarnings` reflete a confirmacao explicita do administrador
 * quando o linter so tem avisos -- nunca publica com aviso pendente em
 * silencio.
 */
export async function publishProject(
  project: SiteProject,
  actorId: string,
  options: { acknowledgedWarnings: boolean; desiredSlug?: string },
): Promise<PublishResult> {
  if (!project.draftConfig) {
    throw conflict('Este projeto ainda nao tem um rascunho para publicar.', { code: 'SITE_PROJECT_NO_DRAFT' });
  }

  // O editor permite salvar rascunhos com findings de qualidade. Publicar
  // precisa primeiro normalizar esses findings automaticos; por isso nao
  // podemos chamar validateAndLintConfig aqui, pois ele bloqueia ANTES de
  // makeGeneratedDraftPublishSafe ter a chance de corrigi-los.
  const { siteSchema } = await import('@site-kit/schemas/site-schema');
  const parsed = siteSchema.safeParse(project.draftConfig);
  if (!parsed.success) {
    throw unprocessable('O site possui uma estrutura invalida e precisa ser salvo novamente antes de publicar.', {
      code: 'SITE_SCHEMA_INVALID',
    });
  }
  // A geracao automatica nao pode entregar um rascunho estruturalmente valido
  // que depois seja impossivel de publicar por residuos do proprio modelo.
  // Corrigimos apenas bloqueios mecanicos e removemos prova social nao confirmada;
  // nunca inventamos credenciais, numeros ou depoimentos.
  const model = makeGeneratedDraftPublishSafe(parsed.data);
  const report = lintSite(model);
  assertPublishable(report, true);

  // Garante que fotos reais importadas do Google continuem publicaveis mesmo
  // se o container tiver sido reimplantado desde a geracao do site. Publicar
  // nao deve depender de a API do Google responder naquele exato segundo:
  // se a reidratacao falhar, o builder abaixo ainda publica normalmente
  // quando os bytes locais ja existem e devolve um erro preciso quando nao.
  await ensureGooglePlaceAssets(project).catch(() => 0);

  // Passo 2: versao congelada especificamente para esta publicacao.
  let versionId: string;
  try {
    ({ id: versionId } = await repo.insertVersion({
      projectId: project.id,
      config: model,
      schemaVersion: model.schemaVersion,
      rendererVersion: model.rendererVersion,
      promptVersion: model.project.promptVersion,
      origin: 'PUBLICATION',
      summary: 'Publicacao.',
      createdBy: actorId,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida ao congelar a versao.';
    logger.error({ err: error, projectId: project.id, stage: 'VERSION' }, 'Falha ao preparar versao para publicacao.');
    throw serviceUnavailable('Nao foi possivel preparar a versao do site para publicacao.', 'SITE_PUBLISH_VERSION_FAILED', {
      stage: 'VERSION',
      technicalMessage: message.slice(0, 300),
    });
  }

  // Slug: mantem o mesmo da publicacao anterior (link estavel, secao 16.3);
  // so resolve um novo quando ainda nao existe nenhum.
  const slugCandidate = options.desiredSlug ?? project.desiredSlug;
  let slug: string;
  if (slugCandidate) {
    const validated = validateSlug(slugCandidate);
    if (!validated.ok) throw unprocessable(validated.reason, { code: 'SITE_SLUG_INVALID' });

    // O slug salvo no projeto pode ter sido herdado/copied de outro projeto.
    // Isso nao deve bloquear a primeira publicacao: cada projeto recebe um
    // endereco publico exclusivo automaticamente. Depois que este projeto
    // tiver sua propria publicacao, desiredSlug passa a ser esse endereco e
    // as atualizacoes futuras permanecem no mesmo link.
    if (await repo.isSlugTaken(validated.slug, project.id)) {
      slug = await resolveAvailableSlug(project.businessName, model.business.city ?? null, project.id);
    } else {
      slug = validated.slug;
    }
  } else {
    slug = await resolveAvailableSlug(project.businessName, model.business.city ?? null, project.id);
  }

  let publicationId: string;
  try {
    ({ id: publicationId } = await repo.insertPublication({
      projectId: project.id,
      versionId,
      slug,
      publishedBy: actorId,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida ao criar a publicacao.';
    logger.error({ err: error, projectId: project.id, stage: 'PUBLICATION_RECORD' }, 'Falha ao criar registro de publicacao.');
    throw serviceUnavailable('Nao foi possivel iniciar a publicacao do site.', 'SITE_PUBLISH_RECORD_FAILED', {
      stage: 'PUBLICATION_RECORD',
      technicalMessage: message.slice(0, 300),
    });
  }

  const previousActivePublicationId = project.activePublicationId;

  try {
    // Passo 3: escreve o artefato num caminho exclusivo desta publicacao.
    const manifest = await writeArtifact(project.id, publicationId, slug, model);

    // Passo 4: troca o ponteiro JA -- a rota publica `/p/:slug` (app.ts) so
    // serve uma publicacao com status ACTIVE, entao o smoke test PRECISA
    // que esta ja esteja ativa para conseguir buscar a URL de verdade.
    // Se a verificacao falhar, o passo seguinte desfaz exatamente esta troca.
    await repo.activatePublication(project.id, publicationId, {
      artifactKey: publicationRoot(project.id, publicationId),
      manifest,
      artifactChecksum: manifest.checksum,
      baseUrlSnapshot: publicSitesBaseUrl(),
    });

    // Passo 5: verifica a URL publicada e registra o diagnostico.
    // A validacao estrutural e o renderer ja garantiram o artefato. O teste
    // HTTP local nao deve desfazer uma publicacao valida por uma falha
    // transitoria de rede, proxy ou inicializacao do processo.
    const smoke = await runSmokeTest(slug, model);
    await repo.recordSmokeTest(publicationId, smoke, smoke.passed);
    if (!smoke.passed) {
      logger.warn({ publicationId, slug, smoke }, 'Smoke test registrou alerta apos a publicacao.');
    }

    // Publicar nao altera o rascunho. Nao use o lockVersion capturado quando
    // a tela abriu: autosave/F5 pode muda-lo enquanto o artefato e construido.
    // A publicacao ja esta ACTIVE neste ponto; sincronizamos apenas o ponteiro
    // e o status do projeto sem disputar o optimistic lock do editor.
    await repo.syncPublishedProject(project.id, publicationId, slug);

    const publication = await repo.findPublication(publicationId);
    if (!publication) throw notFound('Publicacao desapareceu logo apos ser criada.');

    return { publication, url: `${publicSitesBaseUrl()}/p/${slug}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida ao publicar.';
    // Uma tentativa que falhou nao pode permanecer eternamente como BUILDING:
    // isso polui o historico, dificulta o retry e esconde a causa real no banco.
    await repo.markPublicationFailed(publicationId, 'SITE_PUBLICATION_FAILED', message.slice(0, 500)).catch(() => undefined);

    // Se a nova publicacao chegou a ser ativada antes de uma falha posterior,
    // restaura a anterior quando houver uma versao superseded disponivel.
    if (previousActivePublicationId) {
      await repo.rollbackToPublication(project.id, previousActivePublicationId).catch(() => false);
    }

    logger.error({ err: error, publicationId, projectId: project.id, stage: 'ARTIFACT_OR_ACTIVATION' }, 'Falha ao publicar site.');
    if (error instanceof AppError) throw error;
    throw serviceUnavailable('A publicacao falhou durante a montagem ou ativacao do site.', 'SITE_PUBLISH_RUNTIME_FAILED', {
      stage: 'ARTIFACT_OR_ACTIVATION',
      technicalMessage: message.slice(0, 300),
      publicationId,
    });
  }
}

interface ArtifactManifest {
  files: string[];
  checksum: string;
  generatedAt: string;
}

/** Escreve HTML + assets no storage publico, sob a raiz exclusiva da publicacao. */
async function writeArtifact(
  projectId: string,
  publicationId: string,
  slug: string,
  model: SiteSchemaModel,
): Promise<ArtifactManifest> {
  const root = publicationRoot(projectId, publicationId);
  const output = publicStorage();

  // A demonstracao SEMPRE usa o perfil DEMO (noindex forcado), mesmo que o
  // rascunho tenha `seo.noindex=false` -- o perfil de indexacao real so vale
  // para o ZIP exportado (secao 17.3), nunca para o link de prospeccao.
  const artifact = await buildSiteArtifactFiles(projectId, model, 'DEMO', {
    inlineRuntime: SITE_RUNTIME_JS,
    publicBasePath: `/p/${slug}`,
  });

  const files: string[] = [];
  for (const file of artifact.files) {
    await output.write(`${root}/${file.path}`, file.buffer);
    files.push(file.path);
  }
  await output.write(`${root}/index.html`, Buffer.from(artifact.html, 'utf8'));
  files.push('index.html');

  return { files, checksum: artifact.checksum, generatedAt: new Date().toISOString() };
}

export interface SmokeTestResult {
  passed: boolean;
  summary: string;
  checks: Record<string, boolean>;
}

/**
 * Smoke test anonimo (secao 16.8), sem navegador.
 *
 * Roda como uma requisicao HTTP de verdade contra o PROPRIO processo, na
 * mesma origem que o publico vai usar -- e o que prova que a rota publica
 * realmente serve o arquivo, sem depender do CRM estar de pe em outro lugar.
 * Nao usa Chromium: a hospedagem de producao nao tem (nem deveria precisar
 * de) um navegador instalado. Verificacao visual/cross-browser mais profunda
 * e responsabilidade do QA determinístico da etapa A11, rodado em build.
 */
export async function runSmokeTest(slug: string, model: SiteSchemaModel): Promise<SmokeTestResult> {
  const env = getEnv();
  const checks: Record<string, boolean> = {};

  const url = `http://127.0.0.1:${env.PORT}/p/${slug}`;
  let html = '';
  let status = 0;
  let robotsHeader: string | null = null;

  try {
    const response = await fetch(url, { redirect: 'manual' });
    status = response.status;
    robotsHeader = response.headers.get('x-robots-tag');
    html = await response.text();
  } catch (error) {
    return {
      passed: false,
      summary: `Nao foi possivel acessar a URL publica: ${error instanceof Error ? error.message : 'erro desconhecido'}.`,
      checks,
    };
  }

  checks.status200 = status === 200;
  checks.notRedirectedToLogin = !html.includes('name="viewport"') ? false : !html.includes('/entrar');
  checks.hasRobotsMeta = html.includes('noindex');
  checks.hasRobotsHeader = Boolean(robotsHeader?.includes('noindex'));
  checks.hasSingleH1 = (html.match(/<h1/g) ?? []).length === 1;
  checks.hasWhatsappLinkIfExpected = model.integrations.whatsappE164 ? html.includes('wa.me') : true;
  checks.noLocalhostLeak = !html.includes('localhost') && !html.includes('127.0.0.1');
  checks.noPrivatePathLeak = !html.includes('/api/site-projects') && !html.includes('draftConfig');

  const failed = Object.entries(checks).filter(([, ok]) => !ok);
  return {
    passed: failed.length === 0,
    summary: failed.length === 0 ? 'Todas as verificacoes passaram.' : `Falhou: ${failed.map(([name]) => name).join(', ')}.`,
    checks,
  };
}

export async function unpublishProject(project: SiteProject): Promise<void> {
  const done = await repo.unpublish(project.id);
  if (!done) {
    throw conflict('Este projeto nao tem publicacao ativa.', { code: 'SITE_PROJECT_NOT_PUBLISHED' });
  }
  await repo.updateProject(project.id, project.lockVersion, { activePublicationId: null });
  await repo.updateProjectStatus(project.id, 'PUBLISHED', 'READY').catch(() => undefined);
}

export async function rollbackPublication(project: SiteProject, targetPublicationId: string): Promise<void> {
  const done = await repo.rollbackToPublication(project.id, targetPublicationId);
  if (!done) {
    throw notFound('Publicacao alvo nao encontrada ou nao esta disponivel para rollback.', 'SITE_PUBLICATION_NOT_FOUND');
  }
  await repo.updateProject(project.id, project.lockVersion, { activePublicationId: targetPublicationId });
}

/** Le um arquivo ja publicado, para a rota publica (`app.ts`) servir. */
export async function readPublishedFile(
  projectId: string,
  publicationId: string,
  relativePath: string,
): Promise<Buffer | null> {
  const storage = publicStorage();
  const key = `${publicationRoot(projectId, publicationId)}/${relativePath}`;
  return storage.read(key).catch(() => null);
}
