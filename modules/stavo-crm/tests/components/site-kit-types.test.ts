/**
 * Camada de tipos do site-kit e a barrel publica.
 *
 * O que se cobra aqui e o que silenciosamente apodrece: uma secao nova sem
 * categoria, um id aceito com formato errado, um status que some da lista, ou
 * a barrel deixando de exportar algo que o builder usa.
 */
import { describe, expect, it } from 'vitest';

import * as siteKit from '@site-kit';
import {
  COMPONENT_CATEGORIES,
  COMPONENT_LICENSES,
  COMPONENT_QUALITY_STATUSES,
  componentId,
  isComponentId,
  isPermissiveLicense,
  isRenderable,
  isUsableInProduction,
  requiresAttribution,
  type ComponentQualityStatus,
} from '@site-kit/types/component';
import { CATEGORY_BY_SECTION_TYPE, categoryOf, sectionTypesOf } from '@site-kit/types/categories';
import { blueprintId, isBlueprintId } from '@site-kit/types/blueprint';
import { AUTO_THEME_ID, isThemeId, themeId } from '@site-kit/types/theme';
import { SECTION_TYPES } from '@site-kit/schemas/site-schema';
import { VARIANT_REGISTRY } from '@site-kit/registry/variants';

describe('categorias', () => {
  it('toda secao do schema tem categoria', () => {
    for (const tipo of SECTION_TYPES) {
      expect(CATEGORY_BY_SECTION_TYPE[tipo], tipo).toBeDefined();
      expect(COMPONENT_CATEGORIES).toContain(categoryOf(tipo));
    }
  });

  it('as 13 categorias combinadas sao as pedidas', () => {
    expect([...COMPONENT_CATEGORIES]).toEqual([
      'navigation',
      'hero',
      'benefits',
      'about',
      'services',
      'proof',
      'gallery',
      'process',
      'pricing',
      'faq',
      'form',
      'cta',
      'footer',
    ]);
  });

  it('agrupa o que o visitante percebe como a mesma parte da pagina', () => {
    expect(sectionTypesOf('proof').sort()).toEqual(['stats', 'testimonials']);
    expect(sectionTypesOf('form').sort()).toEqual(['contactMap', 'whatsappForm']);
    expect(sectionTypesOf('about').sort()).toEqual(['about', 'authority']);
  });

  it('navigation nao tem tipo de secao: o cabecalho nao entra na pagina', () => {
    expect(sectionTypesOf('navigation')).toEqual([]);
  });

  it('toda categoria com secao tem pelo menos uma variante no catalogo', () => {
    for (const categoria of COMPONENT_CATEGORIES) {
      const tipos = sectionTypesOf(categoria);
      if (tipos.length === 0) continue;
      const variantes = VARIANT_REGISTRY.filter((v) => tipos.includes(v.type));
      expect(variantes.length, categoria).toBeGreaterThan(0);
    }
  });
});

describe('estados de qualidade', () => {
  it('sao exatamente os cinco do ciclo de vida', () => {
    expect([...COMPONENT_QUALITY_STATUSES]).toEqual(['draft', 'review', 'approved', 'deprecated', 'rejected']);
  });

  it('so o aprovado pode ser escolhido para um site novo', () => {
    const usaveis = COMPONENT_QUALITY_STATUSES.filter(isUsableInProduction);
    expect(usaveis).toEqual(['approved']);
  });

  it('descontinuado ainda renderiza: existem sites publicados com ele', () => {
    expect(isRenderable('deprecated')).toBe(true);
    expect(isRenderable('approved')).toBe(true);
    for (const status of ['draft', 'review', 'rejected'] as ComponentQualityStatus[]) {
      expect(isRenderable(status), status).toBe(false);
    }
  });
});

describe('identificadores', () => {
  it('id de componente exige categoria/nome-em-kebab-case', () => {
    expect(isComponentId('hero/editorial-split')).toBe(true);
    expect(componentId('proof/quote-pair')).toBe('proof/quote-pair');

    for (const invalido of ['Hero/Editorial', 'sem-barra', 'hero/Editorial', 'hero//x', 'hero/split_reverse']) {
      expect(isComponentId(invalido), invalido).toBe(false);
      expect(() => componentId(invalido), invalido).toThrow();
    }
  });

  it('tema e blueprint usam kebab-case simples', () => {
    expect(isThemeId('consultorio-claro')).toBe(true);
    expect(isThemeId('Consultorio')).toBe(false);
    expect(() => themeId('Consultorio')).toThrow();
    expect(AUTO_THEME_ID).toBe('auto');

    expect(isBlueprintId('agendamento-local')).toBe(true);
    expect(() => blueprintId('Agendamento Local')).toThrow();
  });
});

describe('licencas', () => {
  it('separa permissiva de proprietaria e desconhecida', () => {
    expect(isPermissiveLicense('MIT')).toBe(true);
    expect(isPermissiveLicense('OFL-1.1')).toBe(true);
    expect(isPermissiveLicense('PROPRIETARY')).toBe(false);
    expect(isPermissiveLicense('UNKNOWN')).toBe(false);
  });

  it('marca quem exige manter o aviso de copyright', () => {
    expect(requiresAttribution('ISC')).toBe(true);
    expect(requiresAttribution('Apache-2.0')).toBe(true);
    expect(requiresAttribution('ORIGINAL')).toBe(false);
    expect(requiresAttribution('CC0-1.0')).toBe(false);
  });

  it('toda licenca permissiva ou com atribuicao esta na lista de licencas', () => {
    for (const licenca of COMPONENT_LICENSES) {
      expect(typeof isPermissiveLicense(licenca)).toBe('boolean');
    }
  });
});

describe('barrel publica', () => {
  it('exporta o contrato que o builder e o CRM usam', () => {
    for (const nome of [
      'renderSite',
      'lintSite',
      'siteSchema',
      'VARIANT_REGISTRY',
      'checkCompatibility',
      'renderStyles',
      'fontStack',
      'MOTION_PRESETS',
      'SITE_RUNTIME_JS',
      'COMPONENT_CATEGORIES',
      'COMPONENT_QUALITY_STATUSES',
      'categoryOf',
    ]) {
      expect(siteKit, nome).toHaveProperty(nome);
    }
  });

  it('nao vaza helper interno: usar um e sinal de que falta contrato', () => {
    // `shell` e `escapeHtml` sao peca de implementacao das secoes.
    expect(siteKit).not.toHaveProperty('shell');
    expect(siteKit).not.toHaveProperty('escapeHtml');
  });
});
