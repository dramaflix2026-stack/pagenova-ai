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
  renderIcon,
  renderImage,
  sectionHeading,
  type RenderContext,
} from '@site-kit/primitives/render-utils';
import type { SiteSection } from '@site-kit/schemas/site-schema';

type AuthoritySection = Extract<SiteSection, { type: 'authority' }>;

// ---------------------------------------------------------------------------
// Sobre (5 variantes)
import { shell } from '@site-kit/primitives/section-shell';

// ---------------------------------------------------------------------------

export function renderAuthority(section: AuthoritySection, ctx: RenderContext): string {
  const image = renderImage(section.image, ctx);
  const text = section.body ? paragraphs(section.body) : '';

  const person = section.personName
    ? `<p class="person"><strong>${escapeHtml(section.personName)}</strong>` +
      `${section.personRole ? ` <span class="muted">&middot; ${escapeHtml(section.personRole)}</span>` : ''}</p>`
    : '';

  // Credenciais em tom discreto: prova, nao propaganda. O linter ja garantiu
  // que cada uma existe em `business` com origem confirmada.
  const credentials = section.credentials.length
    ? `<ul class="credentials">${section.credentials
        .map((item) => `<li>${renderIcon('award')}<span>${escapeHtml(item)}</span></li>`)
        .join('')}</ul>`
    : '';

  const heading = sectionHeading({ headline: section.headline });

  switch (section.variant) {
    /** Retrato ao lado do texto: o formato mais direto de autoridade. */
    case 'portrait-side':
      return shell(
        section,
        'authority authority--side',
        `<div class="hero-split"><div>${heading}${text}${person}${credentials}</div>` +
          `<div>${image}</div></div>`,
      );

    /** Retrato circular centralizado acima do texto: tom pessoal. */
    case 'portrait-centered':
      return shell(
        section,
        'authority authority--centered',
        `<div class="authority-centered">${image ? `<div class="avatar">${image}</div>` : ''}` +
          `${sectionHeading({ headline: section.headline, centered: true })}` +
          `<div class="prose">${text}</div>${person}${credentials}</div>`,
      );

    /** Credenciais como faixa de selos, texto acima. Bom para clinica. */
    case 'credential-strip':
      return shell(
        section,
        'authority authority--strip',
        `${sectionHeading({ headline: section.headline, centered: true })}` +
          `<div class="prose prose--centered">${text}</div>${person}` +
          `<div class="credential-strip">${section.credentials
            .map((item) => `<span class="badge">${renderIcon('shield')}${escapeHtml(item)}</span>`)
            .join('')}</div>`,
      );

    /** Cartao de perfil compacto: assinatura no fim de uma landing page. */
    case 'profile-card':
      return shell(
        section,
        'authority authority--card',
        `<div class="card profile-card">${image ? `<div class="avatar avatar--sm">${image}</div>` : ''}` +
          `<div>${heading}${text}${person}${credentials}</div></div>`,
      );

    default:
      return renderAuthority({ ...section, variant: 'portrait-side' }, ctx);
  }
}

// ---------------------------------------------------------------------------
// Depoimentos (4 variantes)
