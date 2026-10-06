/**
 * Validacao das variaveis de ambiente na inicializacao.
 *
 * Em producao a aplicacao RECUSA iniciar quando um segredo obrigatorio esta
 * ausente, fraco ou igual ao valor de exemplo. Nenhum valor secreto e logado.
 */
import path from 'node:path';

import 'dotenv/config';
import { z } from 'zod';

import { APP_TIMEZONE } from '../../shared/constants';

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === 'boolean' ? value : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase()),
  );

/** Valores que jamais podem ser aceitos como segredo real. */
const FORBIDDEN_SECRET_VALUES = new Set([
  '',
  'change-me',
  'changeme',
  'secret',
  'password',
  'senha',
  'test',
  'example',
  'troque-me',
  'your-secret-here',
]);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    HOST: z.string().default('0.0.0.0'),
    APP_URL: z.string().url().default('http://localhost:5173'),
    APP_NAME: z.string().min(1).max(60).default('Stavo Digital'),
    APP_TIMEZONE: z.string().min(1).default(APP_TIMEZONE),
    TRUST_PROXY: booleanish.default(false),
    /**
     * Aplica migracoes pendentes ao iniciar. Ligado por padrao porque a
     * hospedagem nao da acesso a terminal: sem isto, publicar uma mudanca de
     * schema exigiria liberar um IP no MySQL e rodar o script de fora.
     */
    AUTO_MIGRATE: booleanish.default(true),

    DB_HOST: z.string().min(1).default('localhost'),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
    DB_NAME: z.string().min(1).default('stavo_crm'),
    DB_USER: z.string().min(1).default('root'),
    DB_PASSWORD: z.string().default(''),
    DB_SSL: booleanish.default(false),
    DB_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(8),

    SESSION_SECRET: z.string().default(''),
    PAGENOVA_SSO_SECRET: z.string().optional(),
    SESSION_IDLE_MINUTES: z.coerce
      .number()
      .int()
      .min(5)
      .max(60 * 24 * 30)
      .default(720),
    SESSION_ABSOLUTE_HOURS: z.coerce
      .number()
      .int()
      .min(1)
      .max(24 * 90)
      .default(720),

    ADMIN_EMAIL: z.string().email().default('stavodigital123@gmail.com'),
    ADMIN_INITIAL_PASSWORD: z.string().optional(),

    GOOGLE_MAPS_API_KEY: z.string().optional(),
    GOOGLE_PLACES_LANGUAGE: z.string().default('pt-BR'),
    GOOGLE_PLACES_REGION: z.string().default('BR'),
    GOOGLE_TEXT_SEARCH_MONTHLY_HARD_LIMIT: z.coerce.number().int().min(0).default(900),
    GOOGLE_DETAILS_MONTHLY_HARD_LIMIT: z.coerce.number().int().min(0).default(900),
    GOOGLE_USAGE_WARNING_PERCENT: z.coerce.number().int().min(1).max(100).default(80),
    GOOGLE_PLACES_BASE_URL: z.string().url().default('https://places.googleapis.com'),

    MAX_IMPORT_FILE_MB: z.coerce.number().int().min(1).max(100).default(10),
    MAX_IMPORT_ROWS: z.coerce.number().int().min(1).max(200000).default(5000),

    CRON_SECRET: z.string().optional(),

    // --- Sites com IA ------------------------------------------------------
    // O modulo nasce desligado. Ligado sem chave, ele sobe em modo mock e a
    // geracao real fica bloqueada com diagnostico -- nunca simulada em
    // silencio. Nada aqui pode derrubar o CRM (ver secao 24.3 da spec).
    SITE_AI_ENABLED: booleanish.default(false),
    SITE_AI_MOCK_MODE: booleanish.default(false),
    SITE_AI_PROVIDER: z.enum(['openai', 'anthropic', 'mock']).default('openai'),

    ANTHROPIC_API_KEY: z.string().optional(),
    /**
     * So necessaria quando a chave e "multi-workspace" (pessoal ou de conta
     * de servico, vinculada a mais de um workspace no console). Nesse caso a
     * API recusa a chamada com 400 sem o cabecalho `anthropic-workspace-id`
     * (achado real ao testar uma chave assim -- ver IMPLEMENTATION_PLAN).
     * Uma chave de workspace unico nunca precisa disto.
     */
    ANTHROPIC_WORKSPACE_ID: z.string().optional(),
    /**
     * Ids de modelo ficam no ambiente, nunca gravados como verdade permanente
     * no codigo: modelo novo nao pode exigir deploy.
     */
    ANTHROPIC_SITE_MODEL: z.string().default('claude-opus-5'),
    ANTHROPIC_FAST_MODEL: z.string().default('claude-haiku-4-5'),
    /**
     * Esforco da geracao do site (thinking adaptativo + profundidade).
     * `medium` equilibra qualidade de direcao criativa e custo no modo
     * demonstracao; `high` pensa mais e gasta mais tokens de saida.
     */
    ANTHROPIC_SITE_EFFORT: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).default('medium'),
    /**
     * Qual gerador usar. `spec-v2` = SiteSpec com structured outputs e cache
     * (padrao). `plan-v1` = formato antigo, mantido para voltar atras sem
     * deploy caso o novo apresente problema em producao.
     */
    SITE_AI_GENERATOR: z.enum(['spec-v2', 'plan-v1']).default('spec-v2'),
    /**
     * De onde os sites gerados carregam as fontes. `google` (padrao) usa o
     * Google Fonts; `none` fica so com fontes do sistema. Trocar para `none`
     * remove a dependencia externa (e o envio do IP do visitante ao Google),
     * ao custo de perder a identidade tipografica.
     */
    SITE_FONTS_SOURCE: z.enum(['google', 'none']).default('google'),

    // --- Garimpoo: ferramenta publica de busca de leads --------------------
    /** Liga o modulo. Desligado, o subdominio responde 404 e nada e exposto. */
    GARIMPOO_ENABLED: booleanish.default(false),
    /**
     * Host que serve o Garimpoo (ex.: garimpoo.stavodigital.com.br). O CRM
     * continua respondendo no host principal, no MESMO processo: a separacao e
     * por dominio, nao por porta.
     */
    GARIMPOO_HOST: z.string().optional(),
    /**
     * Segredo combinado com a Cakto. Sem ele, o webhook recusa tudo -- um
     * endpoint que concede acesso nao pode ficar aberto na internet.
     */
    CAKTO_WEBHOOK_SECRET: z.string().optional(),
    /** Buscas por membro por dia. Cada uma gasta cota paga do Google. */
    GARIMPOO_DAILY_SEARCH_LIMIT: z.coerce.number().int().min(1).max(500).default(30),
    /** Dias de validade da sessao antes de pedir a senha de novo. */
    GARIMPOO_SESSION_DAYS: z.coerce.number().int().min(1).max(365).default(30),
    /** Horas de validade do direito de ativar a conta apos a compra. */
    GARIMPOO_ACTIVATION_HOURS: z.coerce.number().int().min(1).max(720).default(168),
    ANTHROPIC_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(1024).max(200000).default(32000),
    ANTHROPIC_TIMEOUT_MS: z.coerce.number().int().min(5000).max(600000).default(180000),

    OPENAI_API_KEY: z.string().optional(),
    OPENAI_SITE_MODEL: z.string().default('gpt-5.6-terra'),
    OPENAI_SITE_TIMEOUT_MS: z.coerce.number().int().min(5000).max(600000).default(180000),
    OPENAI_IMAGE_PRIMARY_MODEL: z.string().default('gpt-image-1'),
    OPENAI_IMAGE_ECONOMY_MODEL: z.string().default('gpt-image-1-mini'),
    OPENAI_IMAGE_TIMEOUT_MS: z.coerce.number().int().min(5000).max(600000).default(120000),
    SITE_IMAGE_GENERATION_ENABLED: booleanish.default(false),
    SITE_IMAGE_PROVIDER: z.enum(['openai', 'none']).default('openai'),

    /** Origem que serve o site publicado. Vazio = usa APP_URL + /p/<slug>. */
    PUBLIC_SITES_BASE_URL: z.string().optional(),
    PUBLIC_SITES_HOST_ALLOWLIST: z.string().default(''),
    SITE_PUBLIC_STORAGE_DRIVER: z.enum(['local']).default('local'),
    /**
     * Diretorio persistente dos artefatos publicados.
     *
     * Nunca /tmp e nunca dentro de dist/: a pasta de build nao sobrevive a um
     * novo deploy, e um site publicado que some no proximo deploy e pior que
     * um site que nunca foi publicado.
     */
    SITE_PUBLIC_ASSETS_DIR: z.string().default('storage/sites'),
    /** Uploads e imagens geradas ANTES de publicar. Diretorio proprio, separado do que fica publico. */
    SITE_ASSETS_DIR: z.string().default('storage/site-assets'),
    MAX_SITE_ASSET_UPLOAD_MB: z.coerce.number().int().min(1).max(30).default(8),

    SITE_AI_MONTHLY_BUDGET_USD: z.coerce.number().min(0).max(500).default(50),
    SITE_AI_DEFAULT_PROJECT_BUDGET_USD: z.coerce.number().min(0).max(25).default(2),
    SITE_AI_MAX_GENERATION_ATTEMPTS: z.coerce.number().int().min(1).max(3).default(2),
    SITE_AI_MAX_REPAIR_ATTEMPTS: z.coerce.number().int().min(0).max(1).default(1),
    /**
     * Teto de custo de UMA chamada, calculado antes de enviar: entrada
     * estimada sem cache + saida ate max_tokens. Acima disso a chamada nem
     * sai. Protege contra max_tokens alto demais num modelo caro.
     */
    SITE_AI_MAX_COST_PER_CALL_USD: z.coerce.number().min(0.05).max(10).default(1.5),
    /** Geracoes (e regeracoes) permitidas por projeto a cada 24 horas. */
    SITE_AI_MAX_GENERATIONS_PER_PROJECT_PER_DAY: z.coerce.number().int().min(1).max(50).default(5),
    SITE_AI_JOB_CONCURRENCY: z.coerce.number().int().min(1).max(4).default(1),

    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .superRefine((value, ctx) => {
    const isProduction = value.NODE_ENV === 'production';

    // SESSION_SECRET: obrigatorio e forte em producao.
    const secret = value.SESSION_SECRET.trim();
    if (isProduction) {
      if (secret.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SESSION_SECRET'],
          message:
            'SESSION_SECRET e obrigatorio em producao e precisa de no minimo 32 caracteres. ' +
            "Gere com: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
        });
      }
      if (FORBIDDEN_SECRET_VALUES.has(secret.toLowerCase())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SESSION_SECRET'],
          message: 'SESSION_SECRET nao pode usar um valor de exemplo.',
        });
      }
      const pageNovaSecret = value.PAGENOVA_SSO_SECRET?.trim() ?? '';
      if (pageNovaSecret && pageNovaSecret.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['PAGENOVA_SSO_SECRET'],
          message: 'PAGENOVA_SSO_SECRET precisa de no minimo 32 caracteres quando definido.',
        });
      }
      if (!pageNovaSecret) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['PAGENOVA_SSO_SECRET'],
          message: 'PAGENOVA_SSO_SECRET e obrigatorio em producao.',
        });
      }

      if (!value.DB_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DB_PASSWORD'],
          message: 'DB_PASSWORD e obrigatorio em producao.',
        });
      }
      if (!value.APP_URL.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['APP_URL'],
          message: 'APP_URL deve usar HTTPS em producao.',
        });
      }
    }

    // ADMIN_INITIAL_PASSWORD e um segredo temporario de bootstrap.
    const initial = value.ADMIN_INITIAL_PASSWORD?.trim();
    if (initial && (initial.length < 12 || FORBIDDEN_SECRET_VALUES.has(initial.toLowerCase()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ADMIN_INITIAL_PASSWORD'],
        message:
          'ADMIN_INITIAL_PASSWORD precisa de no minimo 12 caracteres e nao pode ser um valor obvio.',
      });
    }

    if (value.CRON_SECRET && value.CRON_SECRET.trim().length < 16) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CRON_SECRET'],
        message: 'CRON_SECRET precisa de no minimo 16 caracteres quando definido.',
      });
    }

    /**
     * Sites com IA.
     *
     * Ausencia de chave NAO invalida o ambiente: o CRM inteiro nao pode deixar
     * de subir porque um modulo opcional esta sem credencial. A falta de chave
     * vira diagnostico em /api/ready e bloqueio da geracao real.
     *
     * O que e validado aqui e configuracao INSEGURA ou impossivel, que causaria
     * um site publicado quebrado ou um link vazando ambiente interno.
     */
    if (value.PUBLIC_SITES_BASE_URL?.trim()) {
      const base = value.PUBLIC_SITES_BASE_URL.trim();
      let parsed: URL | null = null;
      try {
        parsed = new URL(base);
      } catch {
        parsed = null;
      }
      if (!parsed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['PUBLIC_SITES_BASE_URL'],
          message: 'PUBLIC_SITES_BASE_URL precisa ser uma URL absoluta valida.',
        });
      } else if (isProduction && parsed.protocol !== 'https:') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['PUBLIC_SITES_BASE_URL'],
          message:
            'PUBLIC_SITES_BASE_URL deve usar HTTPS em producao: o link e enviado ao cliente.',
        });
      }
    }

    // Um artefato publicado dentro de dist/ desaparece no proximo deploy.
    const assetsDir = value.SITE_PUBLIC_ASSETS_DIR.trim().replace(/\\/g, '/');
    if (/^(\/tmp|dist)(\/|$)/.test(assetsDir)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SITE_PUBLIC_ASSETS_DIR'],
        message:
          'SITE_PUBLIC_ASSETS_DIR nao pode ficar em /tmp nem em dist/: os sites publicados ' +
          'seriam apagados no proximo deploy. Use um diretorio persistente.',
      });
    }

    const siteAssetsDir = value.SITE_ASSETS_DIR.trim().replace(/\\/g, '/');
    if (/^(\/tmp|dist)(\/|$)/.test(siteAssetsDir)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SITE_ASSETS_DIR'],
        message:
          'SITE_ASSETS_DIR nao pode ficar em /tmp nem em dist/: os uploads sumiriam no proximo deploy.',
      });
    }

    if (value.SITE_AI_DEFAULT_PROJECT_BUDGET_USD > value.SITE_AI_MONTHLY_BUDGET_USD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SITE_AI_DEFAULT_PROJECT_BUDGET_USD'],
        message: 'O orcamento por projeto nao pode ser maior que o orcamento mensal.',
      });
    }

    if (value.SESSION_ABSOLUTE_HOURS * 60 < value.SESSION_IDLE_MINUTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SESSION_ABSOLUTE_HOURS'],
        message: 'A expiracao absoluta precisa ser maior que a expiracao por inatividade.',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * Le e valida o ambiente. Falha com mensagem clara, sem imprimir valores.
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'ambiente'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Configuracao de ambiente invalida. Corrija as variaveis abaixo antes de iniciar:\n${details}`,
    );
  }

  // Em desenvolvimento, um segredo derivado e estavel evita bloquear o setup
  // local, mas nunca e usado em producao (bloqueado acima).
  if (!parsed.data.SESSION_SECRET.trim()) {
    parsed.data.SESSION_SECRET = 'desenvolvimento-local-sessao-nao-use-em-producao-0001';
  }

  return parsed.data;
}

export function getEnv(): Env {
  if (!cached) {
    cached = loadEnv();
  }
  return cached;
}

/** Usado apenas por testes para trocar o ambiente carregado. */
export function setEnvForTests(env: Env): void {
  cached = env;
}

export const isProduction = (): boolean => getEnv().NODE_ENV === 'production';
export const isTest = (): boolean => getEnv().NODE_ENV === 'test';

/** A integracao Google so e considerada configurada quando ha chave. */
export const hasGoogleKey = (): boolean => Boolean(getEnv().GOOGLE_MAPS_API_KEY?.trim());

// ---------------------------------------------------------------------------
// Sites com IA
// ---------------------------------------------------------------------------

export const hasAnthropicKey = (): boolean => Boolean(getEnv().ANTHROPIC_API_KEY?.trim());
export const hasOpenAiKey = (): boolean => Boolean(getEnv().OPENAI_API_KEY?.trim());

/** O modulo aparece no menu e registra rotas privadas? */
export const isSiteAiEnabled = (): boolean => getEnv().SITE_AI_ENABLED;

/**
 * O Garimpoo so responde com modulo ligado E host configurado.
 *
 * Sem host definido nao existe como separar o publico do CRM no mesmo
 * processo -- e servir a ferramenta publica no dominio do CRM seria expor a
 * tela de login do CRM a qualquer visitante da comunidade.
 */
export const isGarimpooEnabled = (): boolean => {
  const env = getEnv();
  return env.GARIMPOO_ENABLED && Boolean(env.GARIMPOO_HOST?.trim());
};

/** Host do Garimpoo normalizado (sem porta, minusculo). */
export const garimpooHost = (): string | null => {
  const host = getEnv().GARIMPOO_HOST?.trim().toLowerCase();
  return host ? host.split(':')[0]! : null;
};

/** A requisicao chegou pelo dominio do Garimpoo? */
export const isGarimpooRequest = (hostHeader: string | undefined): boolean => {
  const host = garimpooHost();
  if (!host || !hostHeader) return false;
  return hostHeader.toLowerCase().split(':')[0] === host;
};

/**
 * Em que modo a geracao roda.
 *
 * `real`      chave presente, chamadas pagas de verdade;
 * `mock`      fixture deterministica, sem custo, marcada na interface;
 * `bloqueado` modulo ligado, sem chave e sem mock explicito -- a interface
 *             funciona, mas gerar responde com o diagnostico do que falta.
 *
 * Nao existe estado que gere fixture achando que e IA real: `mock` so e
 * atingido quando alguem pediu por ele.
 */
export type SiteAiMode = 'real' | 'mock' | 'bloqueado';

export function siteAiMode(): SiteAiMode {
  const env = getEnv();
  if (env.SITE_AI_MOCK_MODE || env.SITE_AI_PROVIDER === 'mock') return 'mock';
  if (env.SITE_AI_PROVIDER === 'openai') return hasOpenAiKey() ? 'real' : 'bloqueado';
  return hasAnthropicKey() ? 'real' : 'bloqueado';
}

/** Geracao de imagem exige chave E autorizacao explicita: e custo extra. */
export const isImageGenerationAvailable = (): boolean =>
  getEnv().SITE_IMAGE_GENERATION_ENABLED &&
  getEnv().SITE_IMAGE_PROVIDER === 'openai' &&
  hasOpenAiKey();

/** Origem publica efetiva dos sites, sem barra final. */
export function publicSitesBaseUrl(): string {
  const env = getEnv();
  const configured = env.PUBLIC_SITES_BASE_URL?.trim();
  return (configured || env.APP_URL).replace(/\/+$/, '');
}

/** Caminho absoluto do diretorio de assets (pre-publicacao), fora de dist/. */
export function siteAssetsDirAbsolute(): string {
  return path.resolve(process.cwd(), getEnv().SITE_ASSETS_DIR);
}

/** Caminho absoluto do diretorio de sites publicados. */
export function publicSitesDirAbsolute(): string {
  return path.resolve(process.cwd(), getEnv().SITE_PUBLIC_ASSETS_DIR);
}
