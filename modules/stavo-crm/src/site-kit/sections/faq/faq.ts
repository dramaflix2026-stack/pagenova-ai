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
  paragraphs,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type FaqSection = Extract<SiteSection, { type: 'faq' }>;

// ---------------------------------------------------------------------------
// Sobre (5 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderFaq(section: FaqSection, ctx: RenderContext): string {
  const heading = sectionHeading({ headline: section.headline, centered: true });

  /**
   * Todas as variantes usam `<details>` nativo.
   *
   * E acessivel por teclado, anunciado corretamente por leitor de tela e
   * funciona com o JavaScript desligado. Um accordion feito a mao precisaria
   * de ARIA, gerenciamento de foco e um script -- e quebraria sem ele.
   */
  const detail = (item: { question: string; answer: string }, open = false): string =>
    `<details class="faq-item"${open ? ' open' : ''}>` +
    `<summary>${escapeHtml(item.question)}</summary>` +
    `<div class="answer">${paragraphs(item.answer)}</div></details>`;

  switch (section.variant) {
    /** Coluna unica, a primeira ja aberta para mostrar do que se trata. */
    case 'accordion-single':
      return shell(
        section,
        'faq faq--single',
        `${heading}<div class="faq">${section.items.map((item, i) => detail(item, i === 0)).join('')}</div>`,
      );

    /** Duas colunas: muitas perguntas curtas sem rolagem longa. */
    case 'accordion-two-col':
      return shell(
        section,
        'faq faq--two-col',
        `${heading}<div class="faq faq--columns">${section.items.map((item) => detail(item)).join('')}</div>`,
      );

    /** Titulo a esquerda, perguntas a direita: hierarquia editorial. */
    case 'side-heading':
      return shell(
        section,
        'faq faq--side',
        `<div class="hero-split"><div>${sectionHeading({ headline: section.headline })}</div>` +
          `<div class="faq">${section.items.map((item) => detail(item)).join('')}</div></div>`,
      );

    /** Tudo aberto, sem interacao: para quem prefere ler corrido. */
    case 'open-list':
      return shell(
        section,
        'faq faq--open',
        `${heading}<dl class="faq-open">${section.items
          .map(
            (item) =>
              `<dt>${escapeHtml(item.question)}</dt><dd>${paragraphs(item.answer)}</dd>`,
          )
          .join('')}</dl>`,
      );

    default:
      return renderFaq({ ...section, variant: 'accordion-single' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Oferta (4 variantes)
