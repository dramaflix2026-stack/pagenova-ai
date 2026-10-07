/**
 * Familias de conteudo e prova: sobre, autoridade, depoimentos, FAQ, oferta.
 *
 * Duas destas familias carregam o maior risco factual do modulo. Autoridade
 * exibe credencial; depoimento exibe fala de terceiro. O renderer nao valida
 * nada disso -- quem bloqueia e o linter, antes de a publicacao acontecer.
 * Aqui a responsabilidade e desenhar sem inventar campo que o schema nao tem.
 */
import {
  escapeHtml,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type TestimonialsSection = Extract<SiteSection, { type: 'testimonials' }>;

// ---------------------------------------------------------------------------
// Sobre (5 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderTestimonials(section: TestimonialsSection, ctx: RenderContext): string {
  const heading = sectionHeading({ headline: section.headline, centered: true });

  /**
   * Nenhuma variante desenha estrela, nota ou contagem de avaliacoes.
   * O schema nao tem esse campo de proposito: seria inventar dado que a
   * plataforma nao possui e que o Google trata como spam estruturado.
   */
  const figure = (
    item: { quote: string; author: string; role?: string; image?: never },
    klass: string,
  ): string =>
    `<figure class="${klass}"><blockquote>${escapeHtml(item.quote)}</blockquote>` +
    `<figcaption>${escapeHtml(item.author)}` +
    `${item.role ? ` <span class="muted">&middot; ${escapeHtml(item.role)}</span>` : ''}</figcaption></figure>`;

  // Nunca exibe rotulos internos de seed/demo no site final. Esses termos sao
  // metadados de geracao, nao conteudo para o visitante.
  const cleanDemoLabel = (value: string | undefined): string | undefined => {
    if (!value) return undefined;
    const cleaned = value
      .replace(/\b(?:perfil|conte[uú]do)\s+demonstrativo\b/gi, '')
      .replace(/\bdemonstrativo\b/gi, '')
      .replace(/\bdemo\b/gi, '')
      .replace(/^[\s·|—–-]+|[\s·|—–-]+$/g, '')
      .trim();
    return cleaned || undefined;
  };

  const items = (section.items as Array<{ quote: string; author: string; role?: string }>).map(
    (item) => ({ ...item, role: cleanDemoLabel(item.role) }),
  );

  switch (section.variant) {
    /** Dois depoimentos lado a lado, tipografia de citacao. */
    case 'quote-pair':
      return shell(
        section,
        'testimonials testimonials--pair',
        `${heading}<div class="grid grid-2" data-animate-stagger>${items
          .map((item) => figure(item, 'quote'))
          .join('')}</div>`,
      );

    /** Uma citacao unica e grande: quando ha um depoimento realmente forte. */
    case 'single-feature':
      return shell(
        section,
        'testimonials testimonials--single',
        `${heading}${items[0] ? figure(items[0], 'quote quote--feature') : ''}`,
      );

    /** Grade de cartoes: varios depoimentos curtos. */
    case 'card-grid':
      return shell(
        section,
        'testimonials testimonials--grid',
        `${heading}<div class="grid grid-3" data-animate-stagger>${items
          .map((item) => figure(item, 'quote quote--card'))
          .join('')}</div>`,
      );

    /** Faixa rolavel: muitos depoimentos sem alongar a pagina. */
    case 'rail-scroll':
      return shell(
        section,
        'testimonials testimonials--rail',
        `${heading}<div class="rail" role="list">${items
          .map((item) => `<div role="listitem">${figure(item, 'quote rail__item')}</div>`)
          .join('')}</div>`,
      );

    default:
      return renderTestimonials({ ...section, variant: 'quote-pair' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// FAQ (4 variantes)
