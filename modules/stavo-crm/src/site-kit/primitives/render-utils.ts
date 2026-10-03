/**
 * Primitivas do renderer.
 *
 * Extraidas para que cada familia de secao possa usa-las sem que o renderer
 * vire um arquivo unico impossivel de ler. Sao as pecas que TODA variante
 * compartilha: escape, imagem, botao, moldura de secao.
 *
 * A regra que justifica este arquivo existir: se cada familia tivesse a
 * propria funcao de escape ou de link, uma delas esqueceria o `noopener` ou o
 * escape de aspas. Uma implementacao so, usada por todas.
 */
import type { ActionLink, AssetRef, SiteSection } from '@site-kit/schemas/site-schema';

// ---------------------------------------------------------------------------
// Escape
// ---------------------------------------------------------------------------

/**
 * Escapa texto para conteudo e para atributo.
 *
 * Aspas simples e duplas entram na lista porque a mesma funcao e usada dentro
 * de atributos. Uma funcao so, sem "versao para atributo", elimina a chance de
 * alguem escolher a errada.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Texto com linhas em branco viram paragrafos separados. */
export const paragraphs = (text: string): string =>
  text
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim())}</p>`)
    .join('');

// ---------------------------------------------------------------------------
// Contexto
// ---------------------------------------------------------------------------

/**
 * Como o renderer transforma um id de asset em URL.
 *
 * Injetado pelo chamador porque a resposta muda conforme o destino: no preview
 * aponta para a API autenticada; no ZIP, para `assets/images/...` relativo.
 * O renderer nao precisa saber qual e -- e por isso que ele serve aos dois.
 */
export interface RenderContext {
  resolveAsset: (assetId: string) => { url: string; width?: number; height?: number } | null;
  /** Perfil: demonstracao usa noindex; producao decide pelo dominio final. */
  profile: 'DEMO' | 'PRODUCTION';
  /** Runtime JS embutido. Ausente no preview mais simples. */
  inlineRuntime?: string;
  /**
   * De onde vem a fonte. `google` (padrao) carrega do Google Fonts; `none`
   * usa apenas as fontes do sistema -- util se a dependencia externa passar a
   * ser indesejada (LGPD, site sem internet).
   */
  fontSource?: 'google' | 'none';
}

// ---------------------------------------------------------------------------
// Imagem
// ---------------------------------------------------------------------------

export function renderImage(
  image: AssetRef | null | undefined,
  ctx: RenderContext,
  options: { className?: string; loading?: 'lazy' | 'eager'; sizes?: string } = {},
): string {
  if (!image) return '';

  const asset = ctx.resolveAsset(image.assetId);
  // Asset ausente nao derruba a pagina: some o elemento e o layout se fecha.
  if (!asset) return '';

  const objectPosition = `${(image.focalX * 100).toFixed(1)}% ${(image.focalY * 100).toFixed(1)}%`;
  const dimensions =
    asset.width && asset.height ? ` width="${asset.width}" height="${asset.height}"` : '';

  return (
    `<img src="${escapeHtml(asset.url)}" alt="${escapeHtml(image.alt)}"${dimensions}` +
    ` loading="${options.loading ?? 'lazy'}" decoding="async"` +
    (options.sizes ? ` sizes="${escapeHtml(options.sizes)}"` : '') +
    ` class="${escapeHtml(options.className ?? 'media')}"` +
    ` style="object-position:${objectPosition}">`
  );
}

/** Moldura decorativa: usada por variantes que emolduram a foto. */
export const framedImage = (
  image: AssetRef | null | undefined,
  ctx: RenderContext,
  frameClass: string,
): string => {
  const img = renderImage(image, ctx);
  return img ? `<div class="${escapeHtml(frameClass)}">${img}</div>` : '';
};

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

/**
 * Monta o href de um link de acao.
 *
 * O `wa.me` e construido a partir do telefone, nunca copiado de um campo: um
 * link colado poderia levar a conversa para outro numero.
 */
export function hrefFor(link: ActionLink): string {
  switch (link.kind) {
    case 'whatsapp': {
      const digits = link.target.replace(/\D/g, '');
      const base = `https://wa.me/${digits}`;
      return link.prefilledMessage
        ? `${base}?text=${encodeURIComponent(link.prefilledMessage)}`
        : base;
    }
    case 'tel':
      return `tel:${link.target.replace(/[^\d+]/g, '')}`;
    case 'mailto':
      return `mailto:${link.target}`;
    case 'anchor':
      return `#${link.target}`;
    default:
      return link.target;
  }
}

export const isExternal = (link: ActionLink): boolean =>
  link.kind === 'external' || link.kind === 'maps' || link.kind === 'whatsapp';

export function renderButton(
  link: ActionLink,
  variant: 'primary' | 'secondary' | 'ghost' = 'primary',
): string {
  const rel = isExternal(link) ? ' rel="noopener noreferrer" target="_blank"' : '';

  return (
    `<a class="btn btn-${variant}" href="${escapeHtml(hrefFor(link))}"${rel}` +
    ` data-motion="button">${escapeHtml(link.label)}</a>`
  );
}

/** Link simples de texto, para rodape e listas. */
export function renderTextLink(link: ActionLink): string {
  const rel = isExternal(link) ? ' rel="noopener noreferrer" target="_blank"' : '';
  return `<a href="${escapeHtml(hrefFor(link))}"${rel}>${escapeHtml(link.label)}</a>`;
}

export const renderActions = (links: Array<ActionLink | undefined>, klass = 'actions'): string => {
  const rendered = links
    .filter((link): link is ActionLink => Boolean(link))
    .map((link, index) => renderButton(link, index === 0 ? 'primary' : 'secondary'))
    .join('');

  return rendered ? `<div class="${klass}">${rendered}</div>` : '';
};

// ---------------------------------------------------------------------------
// Moldura da secao
// ---------------------------------------------------------------------------

/**
 * Atributos comuns da tag `<section>`.
 *
 * `variantClass` entra aqui para que o CSS possa mudar a composicao por
 * variante sem que cada arquivo de familia repita a montagem da classe.
 */
export function sectionAttrs(section: SiteSection, variantClass?: string): string {
  const classes = ['section'];
  if (variantClass) classes.push(variantClass);
  if (section.style?.background === 'SURFACE') classes.push('section--surface');
  if (section.style?.background === 'PRIMARY') classes.push('section--primary');
  if (section.style?.background === 'ACCENT_SOFT') classes.push('section--accent-soft');

  const id = section.anchor ? ` id="${escapeHtml(section.anchor)}"` : '';
  const motion =
    section.motionPreset && section.motionPreset !== 'none'
      ? ` data-animate="${escapeHtml(section.motionPreset)}"`
      : '';
  const pad = section.style?.paddingScale
    ? ` style="--pad-scale:${section.style.paddingScale}"`
    : '';

  return `${id} class="${classes.join(' ')}"${motion}${pad}`;
}

/** Cabecalho de secao: sobrancelha, titulo e apoio. Usado por quase todas. */
export function sectionHeading(input: {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  centered?: boolean;
  level?: 'h1' | 'h2';
}): string {
  const tag = input.level ?? 'h2';
  const klass = input.centered ? ' class="heading heading--centered"' : ' class="heading"';

  const parts = [
    input.eyebrow ? `<p class="eyebrow">${escapeHtml(input.eyebrow)}</p>` : '',
    input.headline ? `<${tag}>${escapeHtml(input.headline)}</${tag}>` : '',
    input.subheadline ? `<p class="lead">${escapeHtml(input.subheadline)}</p>` : '',
  ].join('');

  return parts ? `<div${klass}>${parts}</div>` : '';
}

/**
 * Icone da allowlist.
 *
 * SVG inline e desenhado aqui, nunca vindo do modelo nem de CDN: aceitar SVG
 * externo seria aceitar script, e depender de CDN quebraria o ZIP offline.
 * Um nome desconhecido devolve string vazia -- o layout simplesmente segue sem
 * icone, em vez de mostrar um quadrado quebrado.
 */
const ICONS: Record<string, string> = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'heart-pulse':
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.2 12h4.4l1.4-3 2.4 6 1.6-3h5.8"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'clipboard-list':
    '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M8 11h8M8 15h5"/>',
  'calendar-check':
    '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 2v4M16 2v4M9 15l2 2 4-4"/>',
  video: '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>',
  phone:
    '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="m8.2 13.9-1.4 7.1L12 18l5.2 3-1.4-7.1"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  sparkles:
    '<path d="m12 3 1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3Z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9L19 15Z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 21c0-3 1.9-5.7 4.5-7"/>',
  message:
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
};

export function renderIcon(name: string | undefined): string {
  if (!name) return '';
  const path = ICONS[name];
  if (!path) return '';

  return (
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"` +
    ` stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `${path}</svg>`
  );
}

export const ICON_ALLOWLIST = Object.keys(ICONS);
