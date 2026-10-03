/**
 * Exportacao ZIP estatica (secao 17 da especificacao).
 *
 * Usa o MESMO `buildSiteArtifactFiles` da publicacao (A12) -- e a garantia
 * central desta etapa: o site que sai no ZIP e byte a byte comparavel ao que
 * esta publicado, porque os dois vem da mesma fonte.
 *
 * Adaptacao de escopo, registrada aqui e no relatorio final: a especificacao
 * modela exportacao como um job assincrono com download em duas chamadas
 * (`POST /exports` + `GET /exports/:jobId/download`). Como a exportacao NAO
 * chama nenhuma IA e um projeto de uma pagina so gera um ZIP pequeno em
 * menos de um segundo, implementei como uma UNICA requisicao sincrona que
 * devolve os bytes -- sem fila, sem storage intermediario, sem expiracao
 * para gerenciar. Reconstruir o ZIP de novo e igualmente rapido e
 * deterministico, entao "idempotente" (secao 17.6) continua valendo.
 */
import JSZip from 'jszip';

import { lintSite } from '@site-kit/utils/linter';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import { SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';
import { unprocessable } from '@server/lib/errors';
import { buildSiteArtifactFiles } from '@builder/publishing/artifact-builder';
import { validateAndLintConfig } from '@server/modules/site-ai/service';

export interface ExportOptions {
  /** Só true depois de confirmação explícita do administrador (secao 17.3). */
  allowIndexing: boolean;
  canonicalUrl?: string;
  businessNameOverride?: string;
}

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  warnings: string[];
}

/** Strings que NUNCA podem sobreviver num ZIP entregue ao cliente. */
const FORBIDDEN_LEAKS = [
  'localhost',
  '127.0.0.1',
  '/api/site-projects',
  'draftConfig',
  'ANTHROPIC_API_KEY',
  'sk-ant-',
  'OPENAI_API_KEY',
  'SESSION_SECRET',
];

function slugForFile(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'site';
}

/** Favicon minimo, gerado, nunca baixado de fora: um circulo com a inicial. */
function buildFavicon(model: SiteSchemaModel): string {
  const letter = (model.business.name.trim()[0] ?? 'S').toUpperCase();
  const bg = model.theme.colors.primary;
  const fg = model.theme.colors.primaryForeground;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<circle cx="32" cy="32" r="32" fill="${bg}"/>` +
    `<text x="32" y="42" font-family="Georgia,serif" font-size="32" font-weight="700" ` +
    `text-anchor="middle" fill="${fg}">${letter}</text></svg>`;
}

function build404(model: SiteSchemaModel): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Pagina nao encontrada | ${escapeMinimal(model.business.name)}</title>` +
    `<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;` +
    `align-items:center;justify-content:center;text-align:center;margin:0;` +
    `background:${model.theme.colors.background};color:${model.theme.colors.text}}` +
    `a{color:${model.theme.colors.primary}}</style></head><body>` +
    `<div><h1>Pagina nao encontrada</h1><p><a href="/">Voltar ao inicio</a></p></div>` +
    `</body></html>`;
}

const escapeMinimal = (text: string): string => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

function buildReadme(model: SiteSchemaModel, allowIndexing: boolean): string {
  return `COMO IMPLANTAR ESTE SITE
========================

Este pacote e um site estatico: HTML, CSS e JavaScript prontos. Nao precisa de
banco de dados, servidor Node.js, chave de API nem login do CRM para funcionar.

NETLIFY DROP (mais simples)
----------------------------
1. Acesse https://app.netlify.com/drop
2. Arraste a PASTA EXTRAIDA deste ZIP (nao o arquivo .zip) para a pagina.
3. Pronto: o Netlify gera um endereco imediatamente.
4. Para usar seu proprio dominio, configure em "Domain settings" no painel do Netlify.

HOSTINGER (ou outra hospedagem com FTP/gerenciador de arquivos)
-----------------------------------------------------------------
1. Extraia este ZIP no seu computador.
2. Envie TODO o conteudo extraido (nao a pasta em si, o CONTEUDO dela) para a
   pasta publica do seu dominio (geralmente "public_html").
3. index.html deve ficar na RAIZ dessa pasta.

DEPOIS DE PUBLICAR
-------------------
- Teste o site em um navegador anonimo, no computador e no celular.
- Teste o botao de WhatsApp e o formulario de contato, se houver.
- Confirme que o cadeado de HTTPS aparece (a maioria das hospedagens emite
  certificado automatico; confira nas configuracoes de dominio).
${allowIndexing ? '' : `
INDEXACAO NOS BUSCADORES
-------------------------
Este pacote foi gerado com robots="noindex": os buscadores NAO vao indexar o
site enquanto esse arquivo nao for trocado. Se quiser aparecer no Google,
gere um novo pacote marcando "permitir indexacao" e informando o dominio
final -- o sistema ajusta o robots e o link canonico automaticamente.
`}
NUNCA COMPARTILHE
-------------------
Nenhuma chave, senha ou credencial esta neste pacote. Nao ha nada aqui que
precise ser mantido em segredo alem do dominio que voce escolher registrar.

Site gerado para: ${model.business.name}
`;
}

/**
 * Monta e valida o ZIP. Lanca erro (422) se o schema tiver erro estrutural
 * do linter -- exportar um site quebrado nao e menos grave que publica-lo.
 */
export async function exportProjectZip(
  projectId: string,
  draftConfig: unknown,
  options: ExportOptions,
): Promise<ExportResult> {
  const { model: baseModel, report } = validateAndLintConfig(draftConfig);
  if (!report.canPublish) {
    throw unprocessable(
      `O projeto tem ${report.errors.length} problema(s) que impedem a exportacao.`,
      { code: 'SITE_LINT_BLOCKED', details: { errors: report.errors } },
    );
  }

  const model: SiteSchemaModel = {
    ...baseModel,
    business: options.businessNameOverride
      ? { ...baseModel.business, name: options.businessNameOverride }
      : baseModel.business,
    seo: {
      ...baseModel.seo,
      noindex: !options.allowIndexing,
      canonicalUrl: options.allowIndexing ? (options.canonicalUrl ?? null) : null,
    },
  };

  // Perfil PRODUCTION so quando o dominio final e conhecido -- nunca gera
  // canonical falso para um dominio que ainda nao existe (secao 17.3).
  const profile = options.allowIndexing && options.canonicalUrl ? 'PRODUCTION' : 'DEMO';
  // Sem o runtime embutido o pacote abriria "mudo": nem o menu do celular,
  // nem as animacoes, nem o formulario de WhatsApp funcionariam -- so o
  // conteudo estatico, que e exatamente o cenario que este teste evita.
  const artifact = await buildSiteArtifactFiles(projectId, model, profile, { inlineRuntime: SITE_RUNTIME_JS });

  const zip = new JSZip();
  zip.file('index.html', artifact.html);
  zip.file('404.html', build404(model));
  zip.file('favicon.svg', buildFavicon(model));
  zip.file(
    'robots.txt',
    options.allowIndexing
      ? `User-agent: *\nAllow: /\n${options.canonicalUrl ? `Sitemap: ${options.canonicalUrl.replace(/\/$/, '')}/sitemap.xml\n` : ''}`
      : 'User-agent: *\nDisallow: /\n',
  );
  if (options.allowIndexing && options.canonicalUrl) {
    const base = options.canonicalUrl.replace(/\/$/, '');
    zip.file(
      'sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
        `<url><loc>${base}/</loc></url></urlset>`,
    );
  }
  zip.file('README-DEPLOY.txt', buildReadme(model, options.allowIndexing));

  for (const file of artifact.files) {
    zip.file(file.path, file.buffer);
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  // Validacao pos-montagem (secao 17.6): reabre o proprio ZIP e varre o texto
  // de cada arquivo textual em busca de vazamento -- nao confia so em ter
  // controlado os inputs, verifica o produto final.
  const reopened = await JSZip.loadAsync(buffer);
  const warnings: string[] = [];
  for (const [name, entry] of Object.entries(reopened.files)) {
    if (entry.dir || !/\.(html|txt|xml|svg)$/.test(name)) continue;
    const text = await entry.async('string');
    for (const leak of FORBIDDEN_LEAKS) {
      if (text.includes(leak)) warnings.push(`Vazamento potencial em ${name}: contem "${leak}".`);
    }
  }
  if (warnings.length > 0) {
    // Isto so dispara se um bug introduzir um vazamento -- e por isso vira
    // erro, nao aviso: nunca se deve entregar um ZIP nessas condicoes.
    throw unprocessable(`Exportacao bloqueada por seguranca: ${warnings.join(' ')}`, {
      code: 'SITE_EXPORT_LEAK_DETECTED',
    });
  }

  const maxSizeMb = 25;
  if (buffer.length > maxSizeMb * 1024 * 1024) {
    throw unprocessable(`O pacote ficou maior que ${maxSizeMb} MB. Reduza o numero de imagens.`, {
      code: 'SITE_EXPORT_TOO_LARGE',
    });
  }

  return {
    buffer,
    filename: `${slugForFile(model.business.name)}.zip`,
    warnings: lintSite(model).warnings.map((w) => w.message),
  };
}
