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
  renderImage,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type AudienceSection = Extract<SiteSection, { type: 'audience' }>;

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

export function renderAudience(section: AudienceSection, ctx: RenderContext): string {
  const heading = sectionHeading({
    headline: section.headline,
    subheadline: section.subheadline,
    centered: section.variant !== 'persona-rows',
  });
  const items = section.items as Item[];

  switch (section.variant) {
    /** "Para voce que..." em cartoes: o visitante se reconhece em um deles. */
    case 'for-you-cards':
      return shell(
        section,
        'audience audience--cards',
        `${heading}<div class="grid grid-3" data-animate-stagger>${items
          .map(
            (item) =>
              `<article class="card card--quiet"><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</article>`,
          )
          .join('')}</div>`,
      );

    /** Lista de dores com marcador de atencao, em coluna unica estreita. */
    case 'pain-list':
      return shell(
        section,
        'audience audience--pain',
        `${heading}<ul class="pain-list">${items
          .map(
            (item) =>
              `<li><strong>${escapeHtml(item.title)}</strong>` +
              `${item.body ? `<span>${escapeHtml(item.body)}</span>` : ''}</li>`,
          )
          .join('')}</ul>`,
      );

    /** Perfis com retrato: quando ha foto real autorizada do publico atendido. */
    case 'persona-rows':
      return shell(
        section,
        'audience audience--personas',
        `${heading}<div class="persona-list">${items
          .map(
            (item) =>
              `<div class="persona">${renderImage(item.image, ctx, { className: 'persona__img' })}` +
              `<div><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div></div>`,
          )
          .join('')}</div>`,
      );

    /** Duas colunas: "e para voce" contra "nao e para voce". Honestidade vende. */
    case 'fit-split':
      return shell(
        section,
        'audience audience--fit',
        `${heading}<div class="contrast-grid">${items
          .map(
            (item) =>
              `<div class="contrast-card"><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div>`,
          )
          .join('')}</div>`,
      );

    default:
      return renderAudience({ ...section, variant: 'for-you-cards' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Processo (5 variantes)
