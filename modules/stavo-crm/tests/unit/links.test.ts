/**
 * Classificacao de links e filtros de site.
 *
 * Criterio de aceite: Instagram usado como site e identificado; Linktree NAO
 * conta como site proprio; dominio proprio provavel e diferenciado.
 */
import { describe, expect, it } from 'vitest';

import {
  classifyWebsite,
  extractInstagramLinks,
  inferLinkType,
  mapsLinkFromPlaceId,
  matchesWebsiteFilter,
  whatsappLink,
} from '@server/domain/links';

describe('classificacao de website', () => {
  it('identifica Instagram usado como site', () => {
    const result = classifyWebsite('https://www.instagram.com/minhaempresa');
    expect(result.classification).toBe('INSTAGRAM');
    expect(result.linkType).toBe('INSTAGRAM');
    expect(result.label).toContain('Instagram');
  });

  it('identifica WhatsApp', () => {
    expect(classifyWebsite('https://wa.me/5511988887777').classification).toBe('WHATSAPP');
    expect(classifyWebsite('https://api.whatsapp.com/send?phone=55').classification).toBe(
      'WHATSAPP',
    );
  });

  it('identifica Facebook e outras redes', () => {
    expect(classifyWebsite('https://facebook.com/empresa').classification).toBe(
      'FACEBOOK_OR_SOCIAL',
    );
    expect(classifyWebsite('https://m.facebook.com/empresa').classification).toBe(
      'FACEBOOK_OR_SOCIAL',
    );
    expect(classifyWebsite('https://tiktok.com/@empresa').classification).toBe(
      'FACEBOOK_OR_SOCIAL',
    );
  });

  it('Linktree e pagina de links, nao site proprio', () => {
    expect(classifyWebsite('https://linktr.ee/empresa').classification).toBe('LINK_IN_BIO');
    expect(classifyWebsite('https://beacons.ai/empresa').classification).toBe('LINK_IN_BIO');
  });

  it('identifica diretorios e plataformas', () => {
    expect(classifyWebsite('https://www.doctoralia.com.br/medico').classification).toBe(
      'DIRECTORY_OR_PLATFORM',
    );
    expect(classifyWebsite('https://empresa.business.site').classification).toBe(
      'DIRECTORY_OR_PLATFORM',
    );
  });

  it('construtor gratuito com subdominio nao e dominio proprio', () => {
    expect(classifyWebsite('https://minhaempresa.wixsite.com/inicio').classification).toBe(
      'DIRECTORY_OR_PLATFORM',
    );
    expect(classifyWebsite('https://loja.myshopify.com').classification).toBe(
      'DIRECTORY_OR_PLATFORM',
    );
  });

  it('reconhece provavel dominio proprio', () => {
    const result = classifyWebsite('https://www.padariasaojoao.com.br');
    expect(result.classification).toBe('OWN_WEBSITE');
    expect(result.host).toBe('padariasaojoao.com.br');
    // Nunca afirma certeza absoluta.
    expect(result.label).toBe('Provavel site proprio');
  });

  it('ausencia de link vira NONE', () => {
    expect(classifyWebsite(null).classification).toBe('NONE');
    expect(classifyWebsite('').classification).toBe('NONE');
    expect(classifyWebsite('   ').classification).toBe('NONE');
  });

  it('URL invalida vira UNKNOWN para verificacao manual', () => {
    expect(classifyWebsite('nao é uma url!!').classification).toBe('UNKNOWN');
    expect(classifyWebsite('ftp://arquivo.com').classification).toBe('UNKNOWN');
  });
});

describe('filtros de site', () => {
  it('"sem site proprio" inclui redes sociais, WhatsApp, links e diretorios', () => {
    for (const classification of [
      'NONE',
      'INSTAGRAM',
      'WHATSAPP',
      'FACEBOOK_OR_SOCIAL',
      'LINK_IN_BIO',
      'DIRECTORY_OR_PLATFORM',
    ] as const) {
      expect(matchesWebsiteFilter(classification, 'NO_OWN_WEBSITE')).toBe(true);
    }
    expect(matchesWebsiteFilter('OWN_WEBSITE', 'NO_OWN_WEBSITE')).toBe(false);
  });

  it('"sem nenhum link" inclui apenas NONE', () => {
    expect(matchesWebsiteFilter('NONE', 'NO_LINK')).toBe(true);
    expect(matchesWebsiteFilter('INSTAGRAM', 'NO_LINK')).toBe(false);
  });

  it('"com site proprio" inclui dominio proprio', () => {
    expect(matchesWebsiteFilter('OWN_WEBSITE', 'HAS_OWN_WEBSITE')).toBe(true);
    expect(matchesWebsiteFilter('INSTAGRAM', 'HAS_OWN_WEBSITE')).toBe(false);
  });

  it('UNKNOWN nunca e escondido: aparece sinalizado para verificacao', () => {
    expect(matchesWebsiteFilter('UNKNOWN', 'NO_OWN_WEBSITE')).toBe(true);
    expect(matchesWebsiteFilter('UNKNOWN', 'HAS_OWN_WEBSITE')).toBe(true);
    expect(matchesWebsiteFilter('UNKNOWN', 'ALL')).toBe(true);
  });

  it('"todos" nao filtra nada', () => {
    expect(matchesWebsiteFilter('OWN_WEBSITE', 'ALL')).toBe(true);
    expect(matchesWebsiteFilter('NONE', 'ALL')).toBe(true);
  });
});

describe('tipos de link e acoes', () => {
  it('infere o tipo para persistir em lead_links', () => {
    expect(inferLinkType('https://instagram.com/x')).toBe('INSTAGRAM');
    expect(inferLinkType('https://facebook.com/x')).toBe('FACEBOOK');
    expect(inferLinkType('https://minhaempresa.com.br')).toBe('WEBSITE');
    expect(inferLinkType('https://linktr.ee/x')).toBe('LINK_IN_BIO');
  });

  it('monta link de WhatsApp a partir do numero normalizado', () => {
    expect(whatsappLink('+5511988887777')).toBe('https://wa.me/5511988887777');
  });

  it('monta link estavel do Maps a partir do place_id', () => {
    expect(mapsLinkFromPlaceId('ChIJ_abc')).toContain('place_id:ChIJ_abc');
  });
});

describe('extracao de Instagram do HTML', () => {
  it('encontra perfis explicitos', () => {
    const html = `
      <a href="https://www.instagram.com/minhaempresa">Instagram</a>
      <a href="https://instagram.com/OutroPerfil/">Outro</a>
    `;
    expect(extractInstagramLinks(html)).toEqual([
      'https://instagram.com/minhaempresa',
      'https://instagram.com/outroperfil',
    ]);
  });

  it('ignora caminhos utilitarios do proprio Instagram', () => {
    const html = '<a href="https://instagram.com/p/ABC123">post</a>';
    expect(extractInstagramLinks(html)).toEqual([]);
  });

  it('nao duplica o mesmo perfil', () => {
    const html = `
      <a href="https://instagram.com/empresa">a</a>
      <a href="https://www.instagram.com/empresa/">b</a>
    `;
    expect(extractInstagramLinks(html)).toHaveLength(1);
  });

  it('devolve vazio quando nao ha nada', () => {
    expect(extractInstagramLinks('<p>sem redes</p>')).toEqual([]);
  });
});
