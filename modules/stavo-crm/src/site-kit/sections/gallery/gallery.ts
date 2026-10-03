/**
 * Familias de lista: servicos, beneficios, publico, processo, numeros, galeria.
 *
 * Todas partem de uma colecao de itens, e e justamente por isso que a
 * diferenca entre variantes precisa ser estrutural: cartao, linha, acordeao,
 * tabela e passo numerado nao sao a mesma coisa com CSS diferente -- mudam o
 * que o visitante consegue comparar de relance.
 */
import {
  renderImage,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type GallerySection = Extract<SiteSection, { type: 'gallery' }>;

// ---------------------------------------------------------------------------
// Servicos (6 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderGallery(section: GallerySection, ctx: RenderContext): string {
  const heading = section.headline ? sectionHeading({ headline: section.headline, centered: true }) : '';
  const images = section.images.map((image) => renderImage(image, ctx)).filter(Boolean);

  // Galeria sem nenhuma imagem resolvida vira uma faixa vazia: melhor sumir.
  if (images.length === 0) return '';

  switch (section.variant) {
    /** Grade uniforme: o padrao seguro. */
    case 'grid-uniform':
      return shell(
        section,
        'gallery gallery--grid',
        `${heading}<div class="grid grid-3 gallery-grid" data-animate-stagger>${images.join('')}</div>`,
      );

    /** Mosaico com a primeira imagem em destaque. */
    case 'mosaic-lead':
      return shell(
        section,
        'gallery gallery--mosaic',
        `${heading}<div class="mosaic" data-animate-stagger>${images
          .map((img, i) => `<figure class="mosaic__item${i === 0 ? ' mosaic__item--lead' : ''}">${img}</figure>`)
          .join('')}</div>`,
      );

    /** Faixa horizontal rolavel: preserva a proporcao das fotos no celular. */
    case 'media-rail':
      return shell(
        section,
        'gallery gallery--rail',
        `${heading}<div class="rail rail--media" role="list">${images
          .map((img) => `<figure class="rail__item rail__item--media" role="listitem">${img}</figure>`)
          .join('')}</div>`,
      );

    /** Duas colunas com deslocamento vertical: ritmo de portfolio. */
    case 'offset-columns':
      return shell(
        section,
        'gallery gallery--offset',
        `${heading}<div class="offset-grid" data-animate-stagger>${images
          .map((img, i) => `<figure class="offset-grid__item${i % 2 ? ' is-shifted' : ''}">${img}</figure>`)
          .join('')}</div>`,
      );

    default:
      return renderGallery({ ...section, variant: 'grid-uniform' }, ctx);
  }
}
