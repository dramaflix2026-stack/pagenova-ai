/**
 * Moldura e conversao: cabecalho, CTA, contato, formulario e rodape.
 *
 * O cabecalho e o rodape sao as duas pecas que aparecem em TODA pagina, entao
 * um erro aqui aparece o tempo inteiro. O formulario e a peca que precisa
 * funcionar sem backend nenhum -- e o que permite o ZIP ser entregue.
 */
import {
  escapeHtml,
  renderActions,
  renderButton,
  renderIcon,
  sectionAttrs,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type ContactSection = Extract<SiteSection, { type: 'contactMap' }>;

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

// ---------------------------------------------------------------------------

export function renderContact(section: ContactSection, ctx: RenderContext): string {
  const heading = sectionHeading({ headline: section.headline });
  const address = section.address ? `<p class="address">${escapeHtml(section.address)}</p>` : '';
  const hours = section.openingHours.length
    ? `<ul class="hours">${section.openingHours.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
    : '';
  const contacts = section.contacts.length ? renderActions(section.contacts) : '';

  /**
   * Botao para o Maps em vez de iframe por padrao.
   *
   * O iframe oficial exige uma chave de navegador restrita por dominio -- que
   * o cliente ainda nao tem. Um link sempre funciona, no site publicado e no
   * ZIP, sem configurar nada.
   */
  const mapsButton = section.mapsUrl
    ? `<a class="btn btn-secondary" href="${escapeHtml(section.mapsUrl)}" rel="noopener noreferrer" target="_blank">${renderIcon('map-pin')}Ver no Google Maps</a>`
    : '';

  const mapsBlock =
    section.showEmbeddedMap && section.mapsUrl
      ? `<div class="map-frame"><iframe title="Mapa da localizacao" src="${escapeHtml(section.mapsUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`
      : '';

  switch (section.variant) {
    /** Cartao de endereco com horarios e botoes. Sem mapa embutido. */
    case 'address-card':
      return shell(
        section,
        'contact contact--card',
        `${heading}<div class="contact-grid"><div class="card">${address}${hours}` +
          `<div class="actions">${mapsButton}</div></div>` +
          `<div class="card">${contacts}</div></div>`,
      );

    /** Mapa ao lado do cartao, quando ha chave configurada. */
    case 'map-side':
      return shell(
        section,
        'contact contact--map-side',
        `${heading}<div class="contact-grid"><div class="card">${address}${hours}${contacts}` +
          `<div class="actions">${mapsButton}</div></div>` +
          `${mapsBlock || `<div class="card card--quiet"><p class="muted">Endereco disponivel acima.</p></div>`}</div>`,
      );

    /** Lista de canais em coluna: telefone, WhatsApp, e-mail, redes. */
    case 'channel-list':
      return shell(
        section,
        'contact contact--channels',
        `${heading}${address}<div class="channel-list">${section.contacts
          .map((c) => `<div class="channel">${renderButton(c, 'secondary')}</div>`)
          .join('')}</div>${hours}<div class="actions">${mapsButton}</div>`,
      );

    /** Faixa larga com endereco e horarios lado a lado. */
    case 'wide-band':
      return `<section${sectionAttrs(section, 'contact contact--band section--surface')}>` +
        `<div class="container">${heading}<div class="contact-grid">` +
        `<div>${address}<div class="actions">${mapsButton}</div></div>` +
        `<div>${hours}${contacts}</div></div></div></section>`;

    default:
      return renderContact({ ...section, variant: 'address-card' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Formulario para WhatsApp (3 variantes)
// ---------------------------------------------------------------------------

/**
 * O formulario NAO envia nada e NAO guarda lead.
 *
 * Ele valida no navegador, monta uma mensagem e abre o WhatsApp. E por isso
 * que o site exportado funciona sem backend, sem banco e sem chave. Tambem e
 * por isso que ele nunca pode dizer "mensagem enviada": quem envia e a pessoa,
 * no aplicativo.
 */
