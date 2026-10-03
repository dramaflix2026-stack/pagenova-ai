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
  sectionAttrs,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type StatsSection = Extract<SiteSection, { type: 'stats' }>;

// ---------------------------------------------------------------------------
// Servicos (6 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderStats(section: StatsSection, ctx: RenderContext): string {
  const heading = section.headline ? sectionHeading({ headline: section.headline, centered: true }) : '';

  const item = (value: string, label: string): string =>
    `<li><span class="value" data-count>${escapeHtml(value)}</span>` +
    `<span class="label">${escapeHtml(label)}</span></li>`;

  switch (section.variant) {
    /** Em linha, separados por divisor. Discreto, sem virar propaganda. */
    case 'inline':
      return shell(
        section,
        'stats stats--inline',
        `${heading}<ul class="stats">${section.items.map((s) => item(s.value, s.label)).join('')}</ul>`,
      );

    /** Cartoes: dao peso quando os numeros sao o argumento principal. */
    case 'stat-cards':
      return shell(
        section,
        'stats stats--cards',
        `${heading}<ul class="grid grid-3 stats stats--grid" data-animate-stagger>${section.items
          .map((s) => item(s.value, s.label))
          .join('')}</ul>`,
      );

    /** Faixa de destaque ocupando a largura, com fundo contrastante. */
    case 'banner-strip':
      return `<section${sectionAttrs(section, 'stats stats--banner section--surface')}>` +
        `<div class="container">${heading}<ul class="stats">${section.items
          .map((s) => item(s.value, s.label))
          .join('')}</ul></div></section>`;

    default:
      return renderStats({ ...section, variant: 'inline' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Galeria (4 variantes)
