/**
 * Linter deterministico do projeto.
 *
 * Roda SEM IA, de proposito. Perguntar ao modelo se o proprio texto dele esta
 * bom custa dinheiro, demora e nao e confiavel: o mesmo modelo que escreveu o
 * clichê tende a aprova-lo. Estas regras sao mecanicas e sempre dao a mesma
 * resposta para a mesma entrada.
 *
 * Duas severidades, com consequencias diferentes:
 *
 *  ERROR  bloqueia a publicacao. E o que produziria um site quebrado, ilegivel
 *         ou factualmente falso na frente do cliente.
 *  WARN   nao bloqueia. E o que um humano pode conscientemente aceitar, como
 *         uma repeticao de palavra que faz sentido naquele texto.
 *
 * O linter nunca reescreve nada. Ele aponta; quem corrige e a pessoa ou um
 * patch explicito.
 */
import { contrastRatio, themeContrastPairs, AA_LARGE, AA_NORMAL } from '@site-kit/themes/colors';
import { sanitizeUrl } from '@site-kit/utils/sanitize';
import type { SiteSchemaModel, SiteSection } from '@site-kit/schemas/site-schema';

export type LintSeverity = 'ERROR' | 'WARN';

export interface LintFinding {
  severity: LintSeverity;
  /** Codigo estavel: a interface agrupa e traduz por ele, nao pelo texto. */
  code: string;
  message: string;
  /** Caminho dentro do schema, para o editor levar direto ao campo. */
  path: string;
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

/**
 * Clichês de IA que denunciam texto gerado.
 *
 * A lista e curta e especifica de proposito. Um filtro grande demais recusaria
 * frases legitimas -- "solucao" e uma palavra normal em portugues, o problema e
 * "solucao completa" usada como promessa vazia.
 */
const CLICHES = [
  'transforme sua jornada',
  'eleve sua experiencia',
  'eleve seu negocio',
  'solucao completa',
  'excelencia em atendimento',
  'inovacao e qualidade',
  'compromisso com a excelencia',
  'o melhor do mercado',
  'lider de mercado',
  'referencia no segmento',
  'resultados garantidos',
  'satisfacao garantida',
  'nao perca essa oportunidade',
  'vagas limitadas',
  'ultimas vagas',
  'por tempo limitado',
];

/** Restos de template que jamais podem chegar ao ar. */
const PLACEHOLDERS = [
  'lorem ipsum',
  '[inserir',
  '[insira',
  '[nome',
  '[telefone',
  '[cidade',
  'xxx-xxxx',
  'seu texto aqui',
  'texto de exemplo',
  'todo:',
  'tbd',
];

/** Titulos genericos que desperdicam a unica linha que o visitante le. */
const GENERIC_HEADLINES = [
  'sobre nos',
  'sobre',
  'nossos servicos',
  'servicos',
  'quem somos',
  'nossos diferenciais',
  'depoimentos',
  'perguntas frequentes',
  'contato',
];

const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

// ---------------------------------------------------------------------------

/**
 * Percorre todo texto visivel do modelo.
 *
 * Centralizado para que uma secao nova nao escape das regras de copy por
 * esquecimento -- o custo de esquecer e um clichê publicado.
 */
function* visibleTexts(model: SiteSchemaModel): Generator<{ path: string; text: string }> {
  for (const [index, section] of model.sections.entries()) {
    const base = `sections[${index}]`;
    const record = section as unknown as Record<string, unknown>;

    for (const [key, value] of Object.entries(record)) {
      if (key === 'id' || key === 'type' || key === 'variant' || key === 'anchor') continue;

      if (typeof value === 'string') {
        yield { path: `${base}.${key}`, text: value };
      } else if (Array.isArray(value)) {
        for (const [i, item] of value.entries()) {
          if (typeof item === 'string') {
            yield { path: `${base}.${key}[${i}]`, text: item };
          } else if (item && typeof item === 'object') {
            for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
              if (typeof v === 'string' && k !== 'icon' && k !== 'name') {
                yield { path: `${base}.${key}[${i}].${k}`, text: v };
              }
            }
          }
        }
      }
    }
  }
}

function lintCopy(model: SiteSchemaModel): LintFinding[] {
  const findings: LintFinding[] = [];

  for (const { path, text } of visibleTexts(model)) {
    const flat = normalize(text);

    for (const placeholder of PLACEHOLDERS) {
      if (flat.includes(placeholder)) {
        findings.push({
          severity: 'ERROR',
          code: 'COPY_PLACEHOLDER',
          message: `Texto de preenchimento encontrado ("${placeholder}"). Isso nao pode ir ao ar.`,
          path,
        });
      }
    }

    for (const cliche of CLICHES) {
      if (flat.includes(cliche)) {
        findings.push({
          severity: 'WARN',
          code: 'COPY_CLICHE',
          message: `"${cliche}" e uma frase generica que nao diz nada sobre este negocio.`,
          path,
        });
      }
    }

    // Travessao longo repetido e o tique mais reconhecivel de texto gerado.
    const emDashes = (text.match(/—/g) ?? []).length;
    if (emDashes >= 3) {
      findings.push({
        severity: 'WARN',
        code: 'COPY_EM_DASH_OVERUSE',
        message: 'Muitos travessoes longos no mesmo texto: soa artificial.',
        path,
      });
    }
  }

  for (const [index, section] of model.sections.entries()) {
    const headline = (section as { headline?: string }).headline;
    if (headline && GENERIC_HEADLINES.includes(normalize(headline))) {
      findings.push({
        severity: 'WARN',
        code: 'COPY_GENERIC_HEADLINE',
        message: `"${headline}" desperdica o titulo. Prefira algo especifico deste negocio.`,
        path: `sections[${index}].headline`,
      });
    }
  }

  // Repeticao da MESMA headline em secoes diferentes: o visitante sente que a
  // pagina anda em circulo.
  const headlines = model.sections
    .map((section, index) => ({ index, value: (section as { headline?: string }).headline }))
    .filter((entry): entry is { index: number; value: string } => Boolean(entry.value));

  const seen = new Map<string, number>();
  for (const { index, value } of headlines) {
    const key = normalize(value);
    const first = seen.get(key);
    if (first !== undefined) {
      findings.push({
        severity: 'WARN',
        code: 'COPY_REPEATED_HEADLINE',
        message: `Este titulo repete o da secao ${first + 1}.`,
        path: `sections[${index}].headline`,
      });
    } else {
      seen.set(key, index);
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Fatos
// ---------------------------------------------------------------------------

/**
 * Nada afirmado na pagina pode faltar em `business`.
 *
 * Esta e a regra mais importante do arquivo. Um depoimento, uma credencial ou
 * um numero inventado expoe o cliente e a agencia -- e o unico erro deste
 * modulo que nao da para consertar depois de o link ter sido enviado.
 */
function lintFacts(model: SiteSchemaModel): LintFinding[] {
  const findings: LintFinding[] = [];
  const facts = model.business;

  const confirmedCredentials = new Set(
    facts.credentials.filter((c) => c.source !== 'AI_INFERRED').map((c) => normalize(c.value)),
  );
  const confirmedTestimonials = new Set(
    facts.testimonials
      .filter((t) => t.source !== 'AI_INFERRED')
      .map((t) => normalize(t.value.quote)),
  );
  const confirmedStats = new Set(
    facts.stats.filter((s) => s.source !== 'AI_INFERRED').map((s) => normalize(s.value.value)),
  );

  for (const [index, section] of model.sections.entries()) {
    if (section.type === 'authority') {
      for (const [i, credential] of section.credentials.entries()) {
        if (!confirmedCredentials.has(normalize(credential))) {
          findings.push({
            severity: 'ERROR',
            code: 'FACT_UNCONFIRMED_CREDENTIAL',
            message:
              `"${credential}" nao consta entre as credenciais confirmadas do negocio. ` +
              'Confirme o dado ou remova a afirmacao.',
            path: `sections[${index}].credentials[${i}]`,
          });
        }
      }
    }

    if (section.type === 'testimonials') {
      for (const [i, item] of section.items.entries()) {
        if (!confirmedTestimonials.has(normalize(item.quote))) {
          findings.push({
            severity: 'ERROR',
            code: 'FACT_UNCONFIRMED_TESTIMONIAL',
            message:
              'Este depoimento nao foi fornecido pelo negocio. Depoimento inventado nao ' +
              'pode ser publicado.',
            path: `sections[${index}].items[${i}].quote`,
          });
        }
      }
    }

    if (section.type === 'stats') {
      for (const [i, item] of section.items.entries()) {
        if (!confirmedStats.has(normalize(item.value))) {
          findings.push({
            severity: 'ERROR',
            code: 'FACT_UNCONFIRMED_STAT',
            message: `O numero "${item.value}" nao foi confirmado pelo negocio.`,
            path: `sections[${index}].items[${i}].value`,
          });
        }
      }
    }

    if (section.type === 'offer' && section.price) {
      findings.push({
        severity: 'WARN',
        code: 'FACT_PRICE_PRESENT',
        message:
          'Ha um preco na pagina. Confirme com o cliente antes de publicar: preco cria ' +
          'obrigacao comercial.',
        path: `sections[${index}].price`,
      });
    }

    if (section.type === 'contactMap' && section.address) {
      const addressFact = facts.address;
      if (!addressFact || normalize(addressFact.value) !== normalize(section.address)) {
        findings.push({
          severity: 'ERROR',
          code: 'FACT_ADDRESS_MISMATCH',
          message: 'O endereco exibido nao confere com o endereco confirmado do negocio.',
          path: `sections[${index}].address`,
        });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Estrutura, acessibilidade e SEO
// ---------------------------------------------------------------------------

function lintStructure(model: SiteSchemaModel): LintFinding[] {
  const findings: LintFinding[] = [];
  const visible = model.sections.filter((section) => section.visible);

  // Exatamente uma hero: nenhuma deixa a pagina sem H1; duas quebram a
  // hierarquia semantica e confundem buscador e leitor de tela.
  const heroes = visible.filter((section) => section.type === 'hero');
  if (heroes.length === 0) {
    findings.push({
      severity: 'ERROR',
      code: 'STRUCTURE_NO_HERO',
      message: 'O site nao tem uma secao principal (hero), entao ficaria sem H1.',
      path: 'sections',
    });
  } else if (heroes.length > 1) {
    findings.push({
      severity: 'ERROR',
      code: 'STRUCTURE_MULTIPLE_HERO',
      message: `Ha ${heroes.length} secoes hero. So pode existir um H1 na pagina.`,
      path: 'sections',
    });
  }

  const ids = new Set<string>();
  const anchors = new Set<string>();

  for (const [index, section] of model.sections.entries()) {
    if (ids.has(section.id)) {
      findings.push({
        severity: 'ERROR',
        code: 'STRUCTURE_DUPLICATE_ID',
        message: `O id "${section.id}" aparece em mais de uma secao.`,
        path: `sections[${index}].id`,
      });
    }
    ids.add(section.id);

    if (section.anchor) {
      if (anchors.has(section.anchor)) {
        findings.push({
          severity: 'ERROR',
          code: 'STRUCTURE_DUPLICATE_ANCHOR',
          message:
            `A ancora "${section.anchor}" se repete: o menu levaria sempre a primeira secao.`,
          path: `sections[${index}].anchor`,
        });
      }
      anchors.add(section.anchor);
    }

    findings.push(...lintSectionContent(section, index));
  }

  // Todo item do menu precisa chegar a algum lugar.
  for (const [index, item] of model.navigation.items.entries()) {
    if (!anchors.has(item.anchor)) {
      findings.push({
        severity: 'ERROR',
        code: 'STRUCTURE_MENU_DEAD_LINK',
        message: `O item "${item.label}" aponta para "${item.anchor}", que nao existe na pagina.`,
        path: `navigation.items[${index}].anchor`,
      });
    }
  }

  if (!visible.some((section) => section.type === 'footer')) {
    findings.push({
      severity: 'WARN',
      code: 'STRUCTURE_NO_FOOTER',
      message: 'O site nao tem rodape.',
      path: 'sections',
    });
  }

  return findings;
}

/** Regras por secao: secao vazia, imagem sem alt, lista fora do limite. */
function lintSectionContent(section: SiteSection, index: number): LintFinding[] {
  const findings: LintFinding[] = [];
  const path = `sections[${index}]`;
  const record = section as unknown as Record<string, unknown>;

  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value) && value.length === 0 && ['items', 'steps', 'images'].includes(key)) {
      findings.push({
        severity: 'ERROR',
        code: 'STRUCTURE_EMPTY_SECTION',
        message: `A secao "${section.type}" esta visivel mas nao tem nenhum item.`,
        path: `${path}.${key}`,
      });
    }
  }

  // Alt vazio em imagem de conteudo: o leitor de tela anuncia "imagem" e nada
  // mais. Imagem decorativa nao passa por aqui -- ela nao entra no schema.
  const images = collectAssetRefs(record);
  for (const { key, alt } of images) {
    if (!alt.trim()) {
      findings.push({
        severity: 'ERROR',
        code: 'A11Y_MISSING_ALT',
        message: 'Imagem sem texto alternativo.',
        path: `${path}.${key}.alt`,
      });
    }
  }

  return findings;
}

function collectAssetRefs(record: Record<string, unknown>): Array<{ key: string; alt: string }> {
  const found: Array<{ key: string; alt: string }> = [];

  for (const [key, value] of Object.entries(record)) {
    if (isAssetRef(value)) {
      found.push({ key, alt: String(value.alt ?? '') });
    } else if (Array.isArray(value)) {
      for (const [i, item] of value.entries()) {
        if (isAssetRef(item)) {
          found.push({ key: `${key}[${i}]`, alt: String(item.alt ?? '') });
        } else if (item && typeof item === 'object' && isAssetRef((item as never)['image'])) {
          const image = (item as { image: { alt?: unknown } }).image;
          found.push({ key: `${key}[${i}].image`, alt: String(image.alt ?? '') });
        }
      }
    }
  }

  return found;
}

const isAssetRef = (value: unknown): value is { assetId: string; alt?: unknown } =>
  Boolean(value) && typeof value === 'object' && 'assetId' in (value as object);

function lintContrast(model: SiteSchemaModel): LintFinding[] {
  const findings: LintFinding[] = [];

  for (const pair of themeContrastPairs(model.theme.colors)) {
    const ratio = contrastRatio(pair.fg, pair.bg);
    const minimum = pair.large ? AA_LARGE : AA_NORMAL;

    if (ratio < minimum) {
      findings.push({
        severity: 'ERROR',
        code: 'A11Y_CONTRAST',
        message:
          `Contraste insuficiente no ${pair.label}: ${ratio.toFixed(2)}:1, ` +
          `minimo ${minimum}:1. O texto ficaria dificil de ler.`,
        path: pair.path,
      });
    }
  }

  return findings;
}

function lintLinks(model: SiteSchemaModel): LintFinding[] {
  const findings: LintFinding[] = [];

  const check = (link: { kind: string; target: string; label: string }, path: string): void => {
    if (link.kind === 'anchor') {
      const exists = model.sections.some((section) => section.anchor === link.target);
      if (!exists) {
        findings.push({
          severity: 'ERROR',
          code: 'LINK_DEAD_ANCHOR',
          message: `"${link.label}" aponta para uma secao que nao existe.`,
          path,
        });
      }
      return;
    }

    if (link.kind === 'external' || link.kind === 'maps') {
      const result = sanitizeUrl(link.target);
      if (!result.ok) {
        findings.push({
          severity: 'ERROR',
          code: 'LINK_INVALID',
          message: `"${link.label}": ${result.reason}`,
          path,
        });
      }
    }

    if (link.kind === 'whatsapp' || link.kind === 'tel') {
      const digits = link.target.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        findings.push({
          severity: 'ERROR',
          code: 'LINK_INVALID_PHONE',
          message: `O telefone de "${link.label}" nao e valido.`,
          path,
        });
      }
    }
  };

  for (const [index, section] of model.sections.entries()) {
    const record = section as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (isActionLink(value)) {
        check(value, `sections[${index}].${key}`);
      } else if (Array.isArray(value)) {
        for (const [i, item] of value.entries()) {
          if (isActionLink(item)) check(item, `sections[${index}].${key}[${i}]`);
        }
      }
    }
  }

  check(model.objective.primaryCta, 'objective.primaryCta');
  if (model.navigation.headerCta) check(model.navigation.headerCta, 'navigation.headerCta');

  return findings;
}

const isActionLink = (value: unknown): value is { kind: string; target: string; label: string } =>
  Boolean(value) &&
  typeof value === 'object' &&
  'kind' in (value as object) &&
  'target' in (value as object) &&
  'label' in (value as object);

function lintSeo(model: SiteSchemaModel): LintFinding[] {
  const findings: LintFinding[] = [];
  const { seo } = model;

  if (seo.title.length < 15) {
    findings.push({
      severity: 'WARN',
      code: 'SEO_TITLE_SHORT',
      message: 'O titulo da pagina e curto demais para descrever o negocio.',
      path: 'seo.title',
    });
  }
  if (seo.description.length < 50) {
    findings.push({
      severity: 'WARN',
      code: 'SEO_DESCRIPTION_SHORT',
      message: 'A descricao e curta demais para aparecer bem no buscador.',
      path: 'seo.description',
    });
  }

  const flatTitle = normalize(seo.title);
  for (const forbidden of ['demo', 'demonstracao', 'preview', 'teste']) {
    if (flatTitle.includes(forbidden) || normalize(seo.description).includes(forbidden)) {
      findings.push({
        severity: 'ERROR',
        code: 'SEO_REVEALS_DEMO',
        message:
          `A palavra "${forbidden}" aparece no titulo ou na descricao. O cliente veria isso ` +
          'na aba do navegador e no preview do WhatsApp.',
        path: 'seo',
      });
    }
  }

  // Canonical apontando para a origem de demonstracao diria ao buscador que
  // aquele endereco temporario e o site oficial do negocio.
  if (seo.canonicalUrl && seo.noindex) {
    findings.push({
      severity: 'WARN',
      code: 'SEO_CANONICAL_ON_DEMO',
      message: 'Ha um canonical em um site marcado como noindex. Confirme se e proposital.',
      path: 'seo.canonicalUrl',
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------

export interface LintReport {
  findings: LintFinding[];
  errors: LintFinding[];
  warnings: LintFinding[];
  /** Publicacao so e liberada quando nao ha erro. Aviso exige confirmacao. */
  canPublish: boolean;
}

export function lintSite(model: SiteSchemaModel): LintReport {
  const findings = [
    ...lintStructure(model),
    ...lintFacts(model),
    ...lintContrast(model),
    ...lintLinks(model),
    ...lintCopy(model),
    ...lintSeo(model),
  ];

  const errors = findings.filter((finding) => finding.severity === 'ERROR');
  const warnings = findings.filter((finding) => finding.severity === 'WARN');

  return { findings, errors, warnings, canPublish: errors.length === 0 };
}
