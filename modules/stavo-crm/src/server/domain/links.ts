/**
 * Classificacao de links.
 *
 * A plataforma nunca afirma certeza absoluta: a linguagem e sempre
 * "provavel site proprio", "sem site proprio identificado no perfil" ou
 * "link nao classificado - verificar". A validacao final e humana.
 *
 * As listas de dominios ficam aqui, em um unico lugar testavel.
 */
import type { LinkType, WebsiteClassification, WebsiteFilter } from '../../shared/constants';
import { normalizeHost, normalizeUrl } from './normalize';

export const INSTAGRAM_HOSTS = new Set(['instagram.com', 'instagr.am', 'ig.me']);

export const WHATSAPP_HOSTS = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'whatsapp.com',
  'chat.whatsapp.com',
]);

export const SOCIAL_HOSTS = new Set([
  'facebook.com',
  'fb.com',
  'fb.me',
  'm.facebook.com',
  'business.facebook.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'youtube.com',
  'youtu.be',
  'linkedin.com',
  'pinterest.com',
  'threads.net',
  'threads.com',
  'kwai.com',
]);

export const LINK_IN_BIO_HOSTS = new Set([
  'linktr.ee',
  'beacons.ai',
  'bio.link',
  'linkbio.co',
  'linklist.bio',
  'lnk.bio',
  'campsite.bio',
  'linkme.bio',
  'many.link',
  'solo.to',
  'taplink.cc',
  'linktree.com',
  'msha.ke',
  'flowpage.com',
  'koji.to',
]);

/**
 * Diretorios, marketplaces e construtores de perfil: presenca em plataforma
 * de terceiros, nao site proprio.
 */
export const DIRECTORY_HOSTS = new Set([
  'doctoralia.com.br',
  'doctoralia.com',
  'boaconsulta.com',
  'ifood.com.br',
  'rappi.com.br',
  'booksy.com',
  'trustvox.com.br',
  'tripadvisor.com',
  'tripadvisor.com.br',
  'yelp.com',
  'guiamais.com.br',
  'telelistas.net',
  'apontador.com.br',
  'solutudo.com.br',
  'hotmart.com',
  'sympla.com.br',
  'olx.com.br',
  'mercadolivre.com.br',
  'elo7.com.br',
  'shopee.com.br',
  'magazinevoce.com.br',
  'buscape.com.br',
  'zapimoveis.com.br',
  'vivareal.com.br',
  'imovelweb.com.br',
  'quintoandar.com.br',
  'airbnb.com.br',
  'booking.com',
  'getninjas.com.br',
  'workana.com',
  'g.page',
  'goo.gl',
  'maps.app.goo.gl',
  'business.site',
  'negocio.site',
  'sites.google.com',
  'google.com',
  'linktree.com.br',
]);

/**
 * Construtores com subdominio gratuito: o negocio nao tem dominio proprio.
 * Compara pelo sufixo porque o subdominio muda a cada cliente.
 */
export const FREE_BUILDER_SUFFIXES = [
  '.wixsite.com',
  '.wordpress.com',
  '.blogspot.com',
  '.blogspot.com.br',
  '.weebly.com',
  '.webnode.com',
  '.webnode.page',
  '.squarespace.com',
  '.godaddysites.com',
  '.myshopify.com',
  '.lojaintegrada.com.br',
  '.tray.com.br',
  '.mercadoshops.com.br',
  '.canva.site',
  '.notion.site',
  '.framer.website',
  '.vercel.app',
  '.netlify.app',
  '.github.io',
  '.business.site',
];

const hostMatches = (host: string, set: Set<string>): boolean => {
  if (set.has(host)) return true;
  // Cobre subdominios: m.facebook.com casa com facebook.com.
  return [...set].some((known) => host.endsWith(`.${known}`));
};

export interface ClassifiedLink {
  classification: WebsiteClassification;
  /** URL canonica; null quando a entrada nao e um link valido. */
  url: string | null;
  host: string | null;
  /** Tipo correspondente para persistir em lead_links. */
  linkType: LinkType;
  /** Frase pronta para a interface, sem prometer certeza. */
  label: string;
}

const NONE_RESULT: ClassifiedLink = {
  classification: 'NONE',
  url: null,
  host: null,
  linkType: 'OTHER',
  label: 'Sem nenhum link',
};

/**
 * Classifica um website. Funcao pura: mesma URL, mesmo resultado.
 */
export function classifyWebsite(value: string | null | undefined): ClassifiedLink {
  const raw = (value ?? '').trim();
  if (!raw) return NONE_RESULT;

  const url = normalizeUrl(raw);
  const host = normalizeHost(raw);

  if (!url || !host) {
    return {
      classification: 'UNKNOWN',
      url: null,
      host: null,
      linkType: 'OTHER',
      label: 'Link nao classificado - verificar',
    };
  }

  if (hostMatches(host, INSTAGRAM_HOSTS)) {
    return {
      classification: 'INSTAGRAM',
      url,
      host,
      linkType: 'INSTAGRAM',
      label: 'Instagram usado como site',
    };
  }

  if (hostMatches(host, WHATSAPP_HOSTS)) {
    return {
      classification: 'WHATSAPP',
      url,
      host,
      linkType: 'WHATSAPP',
      label: 'WhatsApp usado como site',
    };
  }

  if (hostMatches(host, LINK_IN_BIO_HOSTS)) {
    return {
      classification: 'LINK_IN_BIO',
      url,
      host,
      linkType: 'LINK_IN_BIO',
      label: 'Pagina de links, nao site proprio',
    };
  }

  if (hostMatches(host, SOCIAL_HOSTS)) {
    const isFacebook = host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.me';
    return {
      classification: 'FACEBOOK_OR_SOCIAL',
      url,
      host,
      linkType: isFacebook ? 'FACEBOOK' : 'OTHER',
      label: 'Rede social usada como site',
    };
  }

  if (hostMatches(host, DIRECTORY_HOSTS)) {
    return {
      classification: 'DIRECTORY_OR_PLATFORM',
      url,
      host,
      linkType: 'DIRECTORY',
      label: 'Perfil em diretorio ou plataforma',
    };
  }

  if (FREE_BUILDER_SUFFIXES.some((suffix) => host.endsWith(suffix))) {
    return {
      classification: 'DIRECTORY_OR_PLATFORM',
      url,
      host,
      linkType: 'DIRECTORY',
      label: 'Site em construtor gratuito, sem dominio proprio',
    };
  }

  // Host sem ponto (ex.: "localhost") nao caracteriza dominio de empresa.
  if (!host.includes('.')) {
    return {
      classification: 'UNKNOWN',
      url,
      host,
      linkType: 'OTHER',
      label: 'Link nao classificado - verificar',
    };
  }

  return {
    classification: 'OWN_WEBSITE',
    url,
    host,
    linkType: 'WEBSITE',
    label: 'Provavel site proprio',
  };
}

/** Classificacoes que NAO representam site proprio. */
export const NO_OWN_WEBSITE_CLASSIFICATIONS: readonly WebsiteClassification[] = [
  'NONE',
  'INSTAGRAM',
  'WHATSAPP',
  'FACEBOOK_OR_SOCIAL',
  'LINK_IN_BIO',
  'DIRECTORY_OR_PLATFORM',
];

/**
 * Aplica o filtro de site da tela de pesquisa.
 * UNKNOWN nunca e escondido: aparece sinalizado para conferencia manual.
 */
export function matchesWebsiteFilter(
  classification: WebsiteClassification,
  filter: WebsiteFilter,
): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'NO_OWN_WEBSITE':
      return NO_OWN_WEBSITE_CLASSIFICATIONS.includes(classification) || classification === 'UNKNOWN';
    case 'HAS_OWN_WEBSITE':
      return classification === 'OWN_WEBSITE' || classification === 'UNKNOWN';
    case 'NO_LINK':
      return classification === 'NONE';
    case 'SOCIAL_AS_WEBSITE':
      return (
        classification === 'INSTAGRAM' ||
        classification === 'FACEBOOK_OR_SOCIAL' ||
        classification === 'WHATSAPP' ||
        classification === 'LINK_IN_BIO'
      );
    default:
      return true;
  }
}

/** Descobre o tipo de link a partir da URL, para salvar em lead_links. */
export function inferLinkType(value: string | null | undefined): LinkType {
  return classifyWebsite(value).linkType;
}

/**
 * Extrai perfis do Instagram de um HTML ja baixado.
 * Nao executa JavaScript e nao guarda o conteudo da pagina.
 */
export function extractInstagramLinks(html: string, limit = 5): string[] {
  const found = new Set<string>();
  const pattern = /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null && found.size < limit) {
    const handle = match[1]?.toLowerCase();
    // Caminhos utilitarios do proprio Instagram nao sao perfis de empresa.
    if (!handle || ['p', 'reel', 'reels', 'explore', 'accounts', 'stories'].includes(handle)) {
      continue;
    }
    found.add(`https://instagram.com/${handle}`);
  }

  return [...found];
}

/** URL de pesquisa manual do Instagram, aberta pelo proprio usuario. */
export function instagramSearchUrl(businessName: string, city?: string | null): string {
  const query = [businessName, city, 'instagram'].filter(Boolean).join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Link de WhatsApp a partir de um telefone E.164.
 * Nunca envia mensagem automaticamente e nunca afirma que o numero tem WhatsApp.
 */
export function whatsappLink(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, '')}`;
}

/** Link estavel do Google Maps a partir do place_id. */
export function mapsLinkFromPlaceId(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}
