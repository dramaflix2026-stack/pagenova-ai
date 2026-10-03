/**
 * Localizar Instagram na pagina publica do proprio dominio do lead.
 *
 * Acao MANUAL do usuario, nunca automatica. Protecoes obrigatorias:
 *  - somente HTTP/HTTPS;
 *  - bloqueio de localhost, IP privado, link-local e endpoints de metadados;
 *  - resolucao de DNS validada antes de conectar e a cada redirecionamento;
 *  - no maximo 2 redirecionamentos;
 *  - limite de tamanho de resposta e timeout curto;
 *  - nao executa JavaScript, nao rastreia outras paginas e nao armazena o HTML.
 *
 * Se a analise nao puder ser feita com seguranca, o fluxo cai para a busca
 * manual -- nunca abrimos SSRF para cumprir a funcao.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import { extractInstagramLinks } from '../../domain/links';
import { badRequest, serviceUnavailable } from '../../lib/errors';
import { logger } from '../../lib/logger';

const TIMEOUT_MS = 5_000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 2;

/** Faixas reservadas que nunca podem ser alvo de uma requisicao do servidor. */
function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  const [a = 0, b = 0] = parts;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // privado
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local e metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // privado
  if (a === 192 && b === 168) return true; // privado
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast e reservado
  return false;
}

function isBlockedIPv6(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value === '::' || value === '::1') return true; // nao especificado e loopback
  if (value.startsWith('fe80')) return true; // link-local
  if (value.startsWith('fc') || value.startsWith('fd')) return true; // unique local
  if (value.startsWith('ff')) return true; // multicast
  // IPv4 mapeado (::ffff:127.0.0.1) precisa ser avaliado como IPv4.
  const mapped = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) return isBlockedIPv4(mapped[1]);
  return false;
}

export const isBlockedAddress = (ip: string): boolean =>
  isIP(ip) === 6 ? isBlockedIPv6(ip) : isBlockedIPv4(ip);

/** Valida o alvo resolvendo o DNS antes de qualquer conexao. */
async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw badRequest('Endereco de site invalido.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw badRequest('Somente enderecos http e https podem ser analisados.');
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    throw badRequest('Este endereco nao pode ser analisado.');
  }

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw badRequest('Este endereco nao pode ser analisado.');
    }
    return url;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw serviceUnavailable('Nao foi possivel resolver o endereco do site.', 'DNS_FAILURE');
  }

  if (addresses.length === 0 || addresses.some((entry) => isBlockedAddress(entry.address))) {
    throw badRequest('Este endereco nao pode ser analisado.');
  }

  return url;
}

export interface InstagramLookupResult {
  found: string[];
  /** Passo a passo honesto do que foi tentado, exibido na interface. */
  message: string;
}

/**
 * Baixa somente a pagina informada (sem crawl) e extrai links do Instagram.
 * O HTML nao e armazenado em lugar algum.
 */
export async function findInstagramOnWebsite(rawUrl: string): Promise<InstagramLookupResult> {
  let current = rawUrl;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const url = await assertSafeUrl(current);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': 'StavoCRM/1.0 (verificacao manual de perfil)',
        },
      });

      // Cada redirecionamento e revalidado do zero contra as regras de SSRF.
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) break;
        current = new URL(location, url).toString();
        continue;
      }

      if (!response.ok) {
        return {
          found: [],
          message: 'O site respondeu com erro. Use a busca manual para localizar o Instagram.',
        };
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('text/html')) {
        return {
          found: [],
          message: 'O endereco nao retornou uma pagina HTML. Use a busca manual.',
        };
      }

      const html = await readLimited(response, MAX_BYTES);
      const found = extractInstagramLinks(html);

      return {
        found,
        message:
          found.length > 0
            ? 'Perfis encontrados na pagina. Confirme qual pertence a empresa antes de salvar.'
            : 'Instagram nao localizado nesta pagina. Use a busca manual para conferir.',
      };
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          found: [],
          message: 'O site demorou demais para responder. Use a busca manual.',
        };
      }
      // Erros de validacao (SSRF) sobem; falhas de rede viram mensagem amigavel.
      if (typeof error === 'object' && error !== null && 'status' in error) throw error;

      logger.warn({ err: error }, 'Falha ao analisar site do lead em busca de Instagram.');
      return {
        found: [],
        message: 'Nao foi possivel acessar o site. Use a busca manual.',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    found: [],
    message: 'O site tem redirecionamentos demais. Use a busca manual.',
  };
}

/** Le no maximo `maxBytes` do corpo e descarta o restante. */
async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';

  const decoder = new TextDecoder('utf-8');
  let received = 0;
  let html = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    html += decoder.decode(value, { stream: true });
    if (received >= maxBytes) {
      await reader.cancel();
      break;
    }
  }

  return html;
}
