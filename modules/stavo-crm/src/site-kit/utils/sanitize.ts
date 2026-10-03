/**
 * Saneamento de tudo que entra no SiteSchema.
 *
 * Este arquivo existe porque o conteudo do site vem de tres fontes que NAO
 * merecem confianca igual: o briefing digitado pelo administrador, os dados do
 * lead e a saida do modelo de IA. Nenhuma das tres pode injetar HTML, script
 * ou um link com protocolo perigoso na pagina que sera publicada.
 *
 * Compartilhado com o navegador de proposito: o editor precisa recusar na hora
 * o que o servidor recusaria depois. O servidor continua sendo a autoridade e
 * sempre revalida.
 *
 * Regra geral: sanear NUNCA e o mesmo que escapar. O renderer escapa por
 * padrao ao inserir texto; estas funcoes removem o que nem deveria chegar la.
 */

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

/**
 * Caracteres de controle e formatacao invisivel.
 *
 * Inclui os bidi overrides (U+202A-U+202E, U+2066-U+2069): eles reordenam a
 * exibicao sem mudar o texto, e sao o truque classico para fazer um link
 * parecer outro. Zero-width tambem sai -- serve para burlar filtro de palavra
 * e para esconder marcacao dentro de uma frase aparentemente normal.
 */
const INVISIBLE_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/**
 * Limpa um texto que vai virar conteudo visivel do site.
 *
 * Nao aceita HTML: `<` e `>` sao removidos em vez de escapados porque nenhum
 * campo do schema deveria conte-los. Escapar deixaria "&lt;script&gt;" visivel
 * na pagina do cliente, o que e feio e denuncia o gerador.
 */
export function sanitizeText(raw: unknown, maxLength = 5000): string {
  if (typeof raw !== 'string') return '';

  return raw
    .replace(INVISIBLE_CHARS, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/** Texto de uma linha so: quebras viram espaco. Titulos, rotulos, CTAs. */
export function sanitizeLine(raw: unknown, maxLength = 300): string {
  return sanitizeText(raw, maxLength).replace(/\s*\n\s*/g, ' ').trim().slice(0, maxLength);
}

// ---------------------------------------------------------------------------
// URLs
// ---------------------------------------------------------------------------

/**
 * Protocolos aceitos em um link do site publicado.
 *
 * `javascript:` e `data:` estao fora por motivo obvio. `file:` e `blob:`
 * tambem: nao fazem sentido em uma pagina publica e sao vetor de vazamento.
 */
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'tel:', 'mailto:']);

export type UrlError =
  | 'EMPTY'
  | 'MALFORMED'
  | 'FORBIDDEN_PROTOCOL'
  | 'INSECURE'
  | 'CREDENTIALS'
  | 'PRIVATE_HOST';

export type UrlResult = { ok: true; url: string } | { ok: false; code: UrlError; reason: string };

/**
 * Hosts que nunca podem aparecer em um site publicado.
 *
 * Um link para localhost ou para um IP interno funcionaria na maquina de quem
 * gerou e quebraria para o cliente -- ou pior, vazaria a topologia da rede.
 * A checagem e por forma do host, nao por resolucao de DNS: nada aqui faz
 * requisicao.
 */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;
  if (host === '0.0.0.0' || host === '::1' || host === '[::1]') return true;
  // IPv4 privado, loopback, link-local e o endereco de metadados de nuvem.
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;

  return false;
}

/**
 * Valida um link que ira para dentro do site.
 *
 * `requireHttps` fica ligado por padrao: um site entregue ao cliente nao
 * deveria apontar para http, e navegador moderno reclama. A excecao existe
 * para casos em que o negocio so tem um endereco antigo.
 */
export function sanitizeUrl(raw: unknown, options: { allowHttp?: boolean } = {}): UrlResult {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, code: 'EMPTY', reason: 'Link vazio.' };
  }

  const candidate = raw.replace(INVISIBLE_CHARS, '').trim();

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      ok: false,
      code: 'MALFORMED',
      reason: 'Link invalido. Inclua o endereco completo, comecando com https://.',
    };
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      code: 'FORBIDDEN_PROTOCOL',
      reason: `Links com "${parsed.protocol}" nao sao permitidos em um site publicado.`,
    };
  }

  if (parsed.protocol === 'tel:' || parsed.protocol === 'mailto:') {
    return { ok: true, url: parsed.toString() };
  }

  // Credencial embutida (https://usuario:senha@site) e sempre suspeita: ou e
  // um vazamento, ou e uma tentativa de disfarcar o dominio real.
  if (parsed.username || parsed.password) {
    return {
      ok: false,
      code: 'CREDENTIALS',
      reason: 'O link nao pode conter usuario e senha embutidos.',
    };
  }

  if (isPrivateHost(parsed.hostname)) {
    return {
      ok: false,
      code: 'PRIVATE_HOST',
      reason: 'Este link aponta para um endereco interno e nao funcionaria para o cliente.',
    };
  }

  if (parsed.protocol === 'http:' && !options.allowHttp) {
    return {
      ok: false,
      code: 'INSECURE',
      reason: 'Use https:// para que o navegador nao marque o site como inseguro.',
    };
  }

  return { ok: true, url: parsed.toString() };
}

export const isSafeUrl = (raw: unknown, options?: { allowHttp?: boolean }): boolean =>
  sanitizeUrl(raw, options).ok;

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

/**
 * Monta o link do WhatsApp a partir de um telefone ja normalizado.
 *
 * O link e SEMPRE gerado aqui, nunca aceito pronto: um `wa.me` colado poderia
 * apontar para outro numero. A mensagem vai codificada.
 *
 * Gerar o link nao afirma que o numero tem conta no WhatsApp -- essa checagem
 * o Google nao fornece e a plataforma nao inventa.
 */
export function buildWhatsAppUrl(phoneE164: string, message?: string): string | null {
  const digits = phoneE164.replace(/\D/g, '');
  // E.164 aceita de 8 a 15 digitos; fora disso nao e telefone.
  if (digits.length < 8 || digits.length > 15) return null;

  const base = `https://wa.me/${digits}`;
  const text = message ? sanitizeText(message, 900) : '';

  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// ---------------------------------------------------------------------------
// Ancoras
// ---------------------------------------------------------------------------

/**
 * Ancora usada no menu e no `id` da secao.
 *
 * Precisa ser um id de HTML valido e estavel: o link do menu depende dele, e
 * uma ancora que muda a cada geracao quebraria o menu do site publicado.
 */
export function sanitizeAnchor(raw: unknown, fallback = 'secao'): string {
  const base = typeof raw === 'string' ? raw : '';

  const anchor = base
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  // Um id nao pode comecar com digito sem quebrar seletores CSS antigos.
  if (!anchor || /^\d/.test(anchor)) return `${fallback}-${anchor || '1'}`.slice(0, 40);
  return anchor;
}

/**
 * Torna uma lista de ancoras unica, preservando a ordem.
 *
 * Duas secoes com a mesma ancora fariam o menu levar sempre a primeira, e o
 * usuario levaria tempo para entender por que o item nao funciona.
 */
export function uniqueAnchors(anchors: string[]): string[] {
  const seen = new Map<string, number>();

  return anchors.map((anchor) => {
    const count = seen.get(anchor) ?? 0;
    seen.set(anchor, count + 1);
    return count === 0 ? anchor : `${anchor}-${count + 1}`;
  });
}

// ---------------------------------------------------------------------------
// Prompt injection
// ---------------------------------------------------------------------------

/**
 * Marcadores de instrucao que nao devem sobreviver dentro de dado nao confiavel
 * enviado ao modelo.
 *
 * Isto NAO e a defesa principal contra prompt injection -- a defesa e delimitar
 * o briefing como dado e instruir o modelo a ignorar ordens contidas nele
 * (secao 25.2). Isto e a segunda camada, que remove o que claramente tenta se
 * passar por instrucao de sistema.
 */
const INJECTION_MARKERS = [
  /^\s*(system|assistant|human|user)\s*:/gim,
  /<\/?\s*(system|instructions?|prompt)\s*>/gi,
  /ignore (all |any )?(previous|above|prior) instructions?/gi,
  /disregard (all |any )?(previous|above|prior) instructions?/gi,
  /esque[cç]a (todas )?as instru[cç][õo]es/gi,
  /ignore (todas )?as instru[cç][õo]es/gi,
];

/**
 * Prepara um texto livre do usuario para ir ao modelo como DADO.
 *
 * O texto continua tendo prioridade criativa alta: o objetivo nao e censurar o
 * briefing, e impedir que ele mude as regras do sistema.
 */
export function neutralizeInjection(raw: string): string {
  let text = sanitizeText(raw, 8000);
  for (const marker of INJECTION_MARKERS) {
    text = text.replace(marker, '[trecho removido]');
  }
  return text;
}
