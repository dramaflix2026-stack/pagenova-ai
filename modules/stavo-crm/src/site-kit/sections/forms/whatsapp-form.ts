/**
 * Moldura e conversao: cabecalho, CTA, contato, formulario e rodape.
 *
 * O cabecalho e o rodape sao as duas pecas que aparecem em TODA pagina, entao
 * um erro aqui aparece o tempo inteiro. O formulario e a peca que precisa
 * funcionar sem backend nenhum -- e o que permite o ZIP ser entregue.
 */
import {
  escapeHtml,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type FormSection = Extract<SiteSection, { type: 'whatsappForm' }>;

// ---------------------------------------------------------------------------
// Cabecalho (5 variantes)
// ---------------------------------------------------------------------------

/**
 * Cabecalho do site.
 *
 * Invariantes que valem para as cinco variantes, independentemente do desenho:
 *  - o botao do menu controla o mesmo `#menu-principal` e informa `aria-expanded`;
 *  - o alvo de toque tem 48px;
 *  - sem JavaScript o menu continua sendo uma lista de ancoras utilizavel.
 */
import { shell } from '@site-kit/primitives/section-shell';

export function renderWhatsAppForm(section: FormSection, ctx: RenderContext): string {
  void ctx;

  const fields = section.fields
    .map((field) => {
      const id = `f-${escapeHtml(field.name)}`;
      const required = field.required ? ' required aria-required="true"' : '';
      const control =
        field.type === 'textarea'
          ? `<textarea id="${id}" name="${escapeHtml(field.name)}"${required}></textarea>`
          : field.type === 'select'
            ? `<select id="${id}" name="${escapeHtml(field.name)}"${required}>` +
              `<option value="">Selecione</option>` +
              field.options
                .map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`)
                .join('') +
              `</select>`
            : `<input id="${id}" type="${escapeHtml(field.type)}" name="${escapeHtml(field.name)}"${required}>`;

      return (
        `<div class="form-field"><label for="${id}">${escapeHtml(field.label)}</label>` +
        `${control}<span class="form-error">Preencha este campo.</span></div>`
      );
    })
    .join('');

  const form =
    `<form class="wa-form" data-whatsapp-form` +
    ` data-phone="${escapeHtml(section.whatsappE164.replace(/\D/g, ''))}" novalidate>` +
    `${fields}<button type="submit" class="btn btn-primary">${escapeHtml(section.submitLabel)}</button>` +
    `<p class="form-note muted">Ao enviar, o WhatsApp abre com a mensagem pronta para voce conferir.</p>` +
    `</form>`;

  const heading = sectionHeading({ headline: section.headline, subheadline: section.body });

  switch (section.variant) {
    /** Formulario em cartao centralizado, coluna unica. */
    case 'card-centered':
      return shell(
        section,
        'wa wa--card',
        `${sectionHeading({ headline: section.headline, subheadline: section.body, centered: true })}` +
          `<div class="card form-card">${form}</div>`,
      );

    /** Texto a esquerda, formulario a direita: contexto e acao juntos. */
    case 'split-context':
      return shell(
        section,
        'wa wa--split',
        `<div class="hero-split"><div>${heading}</div><div class="card form-card">${form}</div></div>`,
      );

    /** Compacto em linha: poucos campos, para landing page curta. */
    case 'compact-inline':
      return shell(
        section,
        'wa wa--compact',
        `${sectionHeading({ headline: section.headline, subheadline: section.body, centered: true })}` +
          `<div class="form-card form-card--inline">${form}</div>`,
      );

    default:
      return renderWhatsAppForm({ ...section, variant: 'card-centered' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Rodape (5 variantes)
