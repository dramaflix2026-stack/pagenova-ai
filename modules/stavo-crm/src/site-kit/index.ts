/**
 * API publica do site-kit.
 *
 * Quem esta FORA do site-kit (builder, servidor, telas do CRM, testes) importa
 * daqui: `import { renderSite, siteSchema } from '@site-kit'`. Assim a
 * organizacao interna pode mudar -- e mudou -- sem quebrar quem consome.
 *
 * REGRA QUE EVITA CICLO: nenhum arquivo dentro de `src/site-kit/` pode importar
 * desta barrel. Internamente, cada modulo importa o caminho direto do outro
 * (`@site-kit/themes/fonts`). Um `index` que importa os modulos e um modulo que
 * importa o `index` fecham um ciclo que o bundler resolve com `undefined` em
 * tempo de execucao -- o tipo de erro que so aparece em producao. O ESLint
 * recusa esse import (`eslint.config.mjs`), entao nao depende de lembrar.
 *
 * A barrel e CURADA: exporta o que e contrato, nao tudo que existe. Helper
 * interno continua acessivel pelo caminho direto, de proposito -- usar um
 * helper interno e sinal de que falta contrato, e isso deve doer um pouco.
 *
 * Ordem: a pilha de baixo para cima (tipos -> schema -> catalogo -> tema ->
 * movimento -> renderer -> qualidade).
 */

// --- Tipos e identidade ----------------------------------------------------
export {
  COMPONENT_CATEGORIES,
  COMPONENT_CATEGORY_LABELS,
  COMPONENT_LICENSES,
  COMPONENT_QUALITY_LABELS,
  COMPONENT_QUALITY_STATUSES,
  componentId,
  isComponentCategory,
  isComponentId,
  isPermissiveLicense,
  isRenderable,
  isUsableInProduction,
  requiresAttribution,
  type ComponentCategory,
  type ComponentId,
  type ComponentLicense,
  type ComponentMeta,
  type ComponentProvenance,
  type ComponentQualityStatus,
} from '@site-kit/types/component';

export { CATEGORY_BY_SECTION_TYPE, categoryOf, sectionTypesOf } from '@site-kit/types/categories';

export {
  AUTO_THEME_ID,
  BUILT_IN_THEME_IDS,
  THEME_MODES,
  isThemeId,
  themeId,
  type ThemeId,
  type ThemeMode,
} from '@site-kit/types/theme';

export {
  blueprintId,
  isBlueprintId,
  type Blueprint,
  type BlueprintId,
  type BlueprintSlot,
} from '@site-kit/types/blueprint';

export {
  MOTION_LEVELS,
  MOTION_PRESETS,
  presetsForLevel,
  type MotionLevel,
  type MotionPreset,
} from '@site-kit/types/motion';

// --- Schema: o formato do site --------------------------------------------
export {
  SECTION_TYPES,
  SITE_RENDERER_VERSION,
  SITE_SCHEMA_VERSION,
  TEXT_LIMITS,
  migrateSiteSchema,
  siteSchema,
  siteSectionSchema,
  type BusinessFacts,
  type DesignTokens,
  type SectionType,
  type SiteSchemaModel,
  type SiteSection,
} from '@site-kit/schemas/site-schema';

// --- Catalogo de variantes -------------------------------------------------
export {
  VARIANT_REGISTRY,
  checkCompatibility,
  findVariant,
  registryForPrompt,
  variantsFor,
  type VariantSpec,
} from '@site-kit/registry/variants';

// --- Tema ------------------------------------------------------------------
export { renderStyles } from '@site-kit/themes/styles';
export { FONT_SPECS, fontLinkTags, fontStack } from '@site-kit/themes/fonts';
export { adjustForContrast, contrastRatio, meetsAA } from '@site-kit/themes/colors';

// --- Temas nomeados --------------------------------------------------------
export {
  DEFAULT_THEME_ID,
  THEME_IDS,
  THEME_PRESETS,
  findTheme,
  themeOptions,
  themeOrDefault,
} from '@site-kit/themes/registry';
export { hexToHslTriplet, themeCssVariables, themeStyleBlock } from '@site-kit/themes/css';
export { auditThemeContrast, failingChecks, type ContrastCheck } from '@site-kit/themes/contrast-audit';
export {
  THEME_COLOR_TOKENS,
  type ThemeButtonTokens,
  type ThemeColorToken,
  type ThemeColorTokens,
  type ThemePreset,
  type ThemeShapeTokens,
  type ThemeTokens,
  type ThemeTypographyTokens,
} from '@site-kit/themes/tokens';
export type { ThemeFont } from '@site-kit/themes/fonts';

// --- Movimento -------------------------------------------------------------
export { MOTION_REGISTRY, findMotionPreset, motionForPrompt } from '@site-kit/interactions/motion';
export { SITE_RUNTIME_JS } from '@site-kit/interactions/runtime';

// --- Renderizacao ----------------------------------------------------------
export { renderSite } from '@site-kit/renderer/render-site';
export type { RenderContext } from '@site-kit/primitives/render-utils';

// --- Qualidade -------------------------------------------------------------
export { lintSite, type LintReport } from '@site-kit/utils/linter';
