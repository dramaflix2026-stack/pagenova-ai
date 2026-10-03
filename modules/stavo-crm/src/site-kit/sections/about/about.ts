/**
 * Familias de conteudo e prova: sobre, autoridade, depoimentos, FAQ, oferta.
 *
 * Duas destas familias carregam o maior risco factual do modulo. Autoridade
 * exibe credencial; depoimento exibe fala de terceiro. O renderer nao valida
 * nada disso -- quem bloqueia e o linter, antes de a publicacao acontecer.
 * Aqui a responsabilidade e desenhar sem inventar campo que o schema nao tem.
 */
import {
  paragraphs,
  renderActions,
  renderImage,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type AboutSection = Extract<SiteSection, { type: 'about' }>;

// ---------------------------------------------------------------------------
// Sobre (5 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderAbout(section: AboutSection, ctx: RenderContext): string {
  const text = section.body.map((block) => paragraphs(block)).join('');
  const cta = section.cta ? renderActions([section.cta]) : '';
  const image = renderImage(section.image, ctx);
  const heading = (centered = false) =>
    sectionHeading({ headline: section.headline, centered });

  switch (section.variant) {
    /** Texto largo com entrelinha generosa, imagem opcional ao lado. */
    case 'text-lead':
      return shell(
        section,
        'about about--lead',
        image
          ? `<div class="hero-split"><div>${heading()}${text}${cta}</div><div>${image}</div></div>`
          : `${heading()}<div class="prose">${text}${cta}</div>`,
      );

    /** Duas colunas de texto, sem imagem: densidade de revista. */
    case 'two-column-prose':
      return shell(
        section,
        'about about--columns',
        `${heading()}<div class="prose-columns">${text}</div>${cta}`,
      );

    /** Citacao destacada abrindo o bloco: da voz ao profissional. */
    case 'statement-quote':
      return shell(
        section,
        'about about--statement',
        `${heading(true)}<div class="statement">${text}</div>${cta}`,
      );

    /** Imagem grande em cima, texto em coluna estreita embaixo. */
    case 'media-above':
      return shell(
        section,
        'about about--media-above',
        `${image ? `<div class="hero-wide-media">${image}</div>` : ''}` +
          `${heading(true)}<div class="prose">${text}${cta}</div>`,
      );

    /** Cartao elevado sobre fundo de superficie: separa do resto da pagina. */
    case 'boxed-card':
      return shell(
        section,
        'about about--boxed',
        `<div class="card card--wide">${heading()}${text}${cta}</div>`,
      );

    default:
      return renderAbout({ ...section, variant: 'text-lead' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Autoridade (4 variantes)
