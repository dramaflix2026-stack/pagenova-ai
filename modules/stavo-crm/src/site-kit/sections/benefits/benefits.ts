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
  renderIcon,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type BenefitsSection = Extract<SiteSection, { type: 'benefits' }>;

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

export function renderBenefits(section: BenefitsSection, ctx: RenderContext): string {
  const heading = sectionHeading({ headline: section.headline, centered: true });
  const items = section.items as Item[];

  switch (section.variant) {
    /** Grade com icone acima do texto, sem cartao: leve e escaneavel. */
    case 'icon-grid':
      return shell(
        section,
        'benefits benefits--icons',
        `${heading}<div class="grid grid-3 icon-grid" data-animate-stagger>${items
          .map(
            (item) =>
              `<div class="icon-block">${renderIcon(item.icon)}` +
              `<h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div>`,
          )
          .join('')}</div>`,
      );

    /** Lista de marcadores em duas colunas: densa, para leitura rapida. */
    case 'checklist-two-col':
      return shell(
        section,
        'benefits benefits--checklist',
        `${heading}<ul class="checklist">${items
          .map(
            (item) =>
              `<li>${renderIcon('check')}<div><strong>${escapeHtml(item.title)}</strong>` +
              `${item.body ? `<span>${escapeHtml(item.body)}</span>` : ''}</div></li>`,
          )
          .join('')}</ul>`,
      );

    /**
     * Comparacao "antes e depois" em duas colunas.
     * NAO e antes/depois de resultado -- e o contraste entre a situacao atual
     * e o que o servico organiza. Resultado clinico prometido esta proibido.
     */
    case 'contrast-pairs':
      return shell(
        section,
        'benefits benefits--contrast',
        `${heading}<div class="contrast-grid" data-animate-stagger>${items
          .map(
            (item) =>
              `<div class="contrast-card"><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div>`,
          )
          .join('')}</div>`,
      );

    /** Uma coluna larga com divisores: ritmo lento, tom editorial. */
    case 'divided-rows':
      return shell(
        section,
        'benefits benefits--rows',
        `${heading}<div class="divided">${items
          .map(
            (item) =>
              `<div class="divided__row"><h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div>`,
          )
          .join('')}</div>`,
      );

    /** Destaque assimetrico: o primeiro item ocupa o dobro do espaco. */
    case 'feature-lead':
      return shell(
        section,
        'benefits benefits--lead',
        `${heading}<div class="feature-lead" data-animate-stagger>${items
          .map(
            (item, index) =>
              `<div class="card${index === 0 ? ' card--lead' : ''}">` +
              `${renderIcon(item.icon)}<h3>${escapeHtml(item.title)}</h3>` +
              `${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}</div>`,
          )
          .join('')}</div>`,
      );

    default:
      return renderBenefits({ ...section, variant: 'icon-grid' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Publico e problemas (4 variantes)
