/**
 * Familias de lista: servicos, beneficios, publico, processo, numeros, galeria.
 *
 * Todas partem de uma colecao de itens, e e justamente por isso que a
 * diferenca entre variantes precisa ser estrutural: cartao, linha, acordeao,
 * tabela e passo numerado nao sao a mesma coisa com CSS diferente -- mudam o
 * que o visitante consegue comparar de relance.
 */
import {
  escapeHtml,
  renderActions,
  renderImage,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type ProcessSection = Extract<SiteSection, { type: 'process' }>;

interface Item {
  title: string;
  body?: string;
  icon?: string;
  image?: { assetId: string; alt: string; focalX: number; focalY: number };
}

// ---------------------------------------------------------------------------
// Servicos (6 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderProcess(section: ProcessSection, ctx: RenderContext): string {
  const heading = sectionHeading({
    headline: section.headline,
    subheadline: section.subheadline,
    centered: section.variant === 'timeline-horizontal',
  });
  const cta = section.cta ? renderActions([section.cta]) : '';
  const steps = section.steps as Item[];

  const stepBody = (item: Item): string =>
    `<h3>${escapeHtml(item.title)}</h3>${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}`;

  switch (section.variant) {
    /** Coluna numerada com linha conectando: a sequencia fica obvia. */
    case 'numbered-steps':
      return shell(
        section,
        'process process--steps',
        `${heading}<ol class="steps">${steps.map((s) => `<li>${stepBody(s)}</li>`).join('')}</ol>${cta}`,
      );

    /** Linha do tempo horizontal: poucos passos, leitura da esquerda a direita. */
    case 'timeline-horizontal':
      return shell(
        section,
        'process process--timeline',
        `${heading}<ol class="timeline" data-animate-stagger>${steps
          .map((s) => `<li><span class="timeline__dot" aria-hidden="true"></span>${stepBody(s)}</li>`)
          .join('')}</ol>${cta}`,
      );

    /** Cartoes numerados grandes: cada passo com peso proprio. */
    case 'step-cards':
      return shell(
        section,
        'process process--cards',
        `${heading}<ol class="grid grid-3 step-cards" data-animate-stagger>${steps
          .map((s, i) => `<li class="card"><span class="step-num">${i + 1}</span>${stepBody(s)}</li>`)
          .join('')}</ol>${cta}`,
      );

    /** Passos alternando com imagem: quando cada etapa tem foto real. */
    case 'steps-with-media':
      return shell(
        section,
        'process process--media',
        `${heading}${steps
          .map(
            (s, i) =>
              `<div class="alt-row${i % 2 ? ' alt-row--flip' : ''}">` +
              `<div class="alt-row__media">${renderImage(s.image, ctx)}</div>` +
              `<div class="alt-row__text"><span class="step-num">${i + 1}</span>${stepBody(s)}</div></div>`,
          )
          .join('')}${cta}`,
      );

    /** Compacto em coluna estreita: bom para landing page curta. */
    case 'steps-compact':
      return shell(
        section,
        'process process--compact',
        `${heading}<ol class="steps steps--compact">${steps
          .map((s) => `<li>${stepBody(s)}</li>`)
          .join('')}</ol>${cta}`,
      );

    default:
      return renderProcess({ ...section, variant: 'numbered-steps' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Numeros (3 variantes)
