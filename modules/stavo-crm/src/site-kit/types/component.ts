/**
 * Identidade de um componente do site-kit: quem ele e, a que familia pertence,
 * em que estado de qualidade esta e de onde veio.
 *
 * Este arquivo e a base do catalogo e NAO importa nada do site-kit: e o ponto
 * mais baixo da pilha de dependencias. Schemas, registry e renderer podem
 * depender dele; ele nao pode depender de ninguem. E isso que impede ciclo de
 * import quando a barrel publica (`src/site-kit/index.ts`) reexporta tudo.
 *
 * Relacao com o catalogo que ja existe (`registry/variants.ts`): o registry
 * atual descreve VARIANTES de secao e usa `status: STABLE | EXPERIMENTAL`. Os
 * tipos aqui sao a camada nova, mais ampla (primitivas, interacoes e secoes) e
 * com um ciclo de vida de qualidade proprio. A migracao de um para o outro
 * acontece quando os componentes novos chegarem -- nada do fluxo de geracao
 * atual depende deste arquivo ainda.
 */

// ---------------------------------------------------------------------------
// Identificador
// ---------------------------------------------------------------------------

/**
 * Id de componente: `categoria/nome-em-kebab-case`.
 *
 * O tipo e uma string marcada (branded). Isso obriga a passar por
 * `componentId()`, que valida o formato, em vez de aceitar qualquer string que
 * por acaso tenha uma barra no meio.
 */
export type ComponentId = string & { readonly __brand: 'ComponentId' };

const COMPONENT_ID_PATTERN = /^[a-z]+\/[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isComponentId(value: string): value is ComponentId {
  return COMPONENT_ID_PATTERN.test(value);
}

/** Cria um `ComponentId` validado. Lanca quando o formato nao bate. */
export function componentId(value: string): ComponentId {
  if (!isComponentId(value)) {
    throw new Error(
      `Id de componente invalido: "${value}". Use "categoria/nome-em-kebab-case", ex.: "hero/editorial-split".`,
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Categoria
// ---------------------------------------------------------------------------

/**
 * Familias de secao que o site-kit desenha, na ordem em que costumam aparecer
 * numa pagina. A ordem nao e regra de composicao -- e so leitura humana.
 */
export const COMPONENT_CATEGORIES = [
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
] as const;
export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

export const COMPONENT_CATEGORY_LABELS: Record<ComponentCategory, string> = {
  navigation: 'Navegacao',
  hero: 'Hero',
  benefits: 'Beneficios',
  about: 'Sobre',
  services: 'Servicos',
  proof: 'Prova',
  gallery: 'Galeria',
  process: 'Processo',
  pricing: 'Oferta',
  faq: 'Perguntas frequentes',
  form: 'Contato e formulario',
  cta: 'Chamada para acao',
  footer: 'Rodape',
};

export const isComponentCategory = (value: string): value is ComponentCategory =>
  (COMPONENT_CATEGORIES as readonly string[]).includes(value);

// ---------------------------------------------------------------------------
// Estado de qualidade
// ---------------------------------------------------------------------------

/**
 * Ciclo de vida de um componente.
 *
 *   draft      -> existe, ainda nao foi revisado; a IA nunca recebe;
 *   review     -> em revisao (codigo, prévia nos tres tamanhos, licenca);
 *   approved   -> pode ser usado em producao e oferecido a IA;
 *   deprecated -> continua funcionando por causa de sites publicados, mas nao
 *                 entra em site novo;
 *   rejected   -> reprovado; fica registrado para nao ser proposto de novo.
 */
export const COMPONENT_QUALITY_STATUSES = ['draft', 'review', 'approved', 'deprecated', 'rejected'] as const;
export type ComponentQualityStatus = (typeof COMPONENT_QUALITY_STATUSES)[number];

export const COMPONENT_QUALITY_LABELS: Record<ComponentQualityStatus, string> = {
  draft: 'Rascunho',
  review: 'Em revisao',
  approved: 'Aprovado',
  deprecated: 'Descontinuado',
  rejected: 'Reprovado',
};

/** So componente aprovado pode ser escolhido para um site novo. */
export const isUsableInProduction = (status: ComponentQualityStatus): boolean => status === 'approved';

/** Aprovado e descontinuado continuam renderizando (ha sites publicados). */
export const isRenderable = (status: ComponentQualityStatus): boolean =>
  status === 'approved' || status === 'deprecated';

// ---------------------------------------------------------------------------
// Licenca e procedencia
// ---------------------------------------------------------------------------

/**
 * Licencas aceitas no produto.
 *
 * `PROPRIETARY` existe para REGISTRAR um item de origem paga que apareceu na
 * revisao -- nunca como permissao de uso: componente pago so entra com
 * licenca que cubra redistribuicao em site de terceiro, e essa decisao e
 * humana (ver `.claude/rules/site-kit.md`, secao 11).
 */
export const COMPONENT_LICENSES = [
  'ORIGINAL',
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-3-Clause',
  'OFL-1.1',
  'CC0-1.0',
  'CC-BY-4.0',
  'PROPRIETARY',
  'UNKNOWN',
] as const;
export type ComponentLicense = (typeof COMPONENT_LICENSES)[number];

/** Licencas permissivas o bastante para entrar no produto sem analise extra. */
const PERMISSIVE: ReadonlySet<ComponentLicense> = new Set<ComponentLicense>([
  'ORIGINAL',
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-3-Clause',
  'OFL-1.1',
  'CC0-1.0',
]);

export const isPermissiveLicense = (license: ComponentLicense): boolean => PERMISSIVE.has(license);

/** Licencas que exigem manter o aviso de copyright junto do que foi usado. */
const REQUIRES_ATTRIBUTION: ReadonlySet<ComponentLicense> = new Set<ComponentLicense>([
  'MIT',
  'ISC',
  'Apache-2.0',
  'BSD-3-Clause',
  'OFL-1.1',
  'CC-BY-4.0',
]);

export const requiresAttribution = (license: ComponentLicense): boolean => REQUIRES_ATTRIBUTION.has(license);

/**
 * Procedencia de um componente: as mesmas colunas de
 * `docs/licenses/component-inventory.md`, para que o inventario e o codigo
 * nunca contem historias diferentes.
 */
export interface ComponentProvenance {
  /** De onde veio ("Original", "Lucide", "shadcn/ui", ...). */
  source: string;
  /** URL da fonte. Nulo quando o componente e original do projeto. */
  sourceUrl: string | null;
  license: ComponentLicense;
  /** Versao ou data da verificacao (AAAA-MM-DD). */
  versionOrDate: string;
  /** Foi modificado depois de trazido? */
  modified: boolean;
  /** A licenca permite redistribuir dentro dos sites dos clientes? */
  redistributionAllowed: boolean;
  /** A licenca permite entregar o codigo no ZIP de exportacao? */
  codeExportAllowed: boolean;
  attributionRequired: boolean;
  /** Onde o aviso de atribuicao vive, quando exigido. */
  attributionNotice: string | null;
}

/** Metadados minimos de qualquer componente do catalogo novo. */
export interface ComponentMeta {
  id: ComponentId;
  category: ComponentCategory;
  /** Nome curto para humanos, na tela do editor. */
  name: string;
  /** O que a composicao faz. E o texto que a IA le para escolher. */
  description: string;
  status: ComponentQualityStatus;
  provenance: ComponentProvenance;
  /** Sobe a cada mudanca que altere o HTML gerado. */
  version: number;
}
