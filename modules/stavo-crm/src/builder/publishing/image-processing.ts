/**
 * Processamento de imagem enviada (secao 13.2 da especificacao).
 *
 * Regras de seguranca, nesta ordem:
 *  1. o MIME e decidido pelos primeiros bytes do arquivo (assinatura),
 *     NUNCA pelo nome ou pela extensao -- um `.png` pode conter qualquer
 *     coisa;
 *  2. SVG nunca e aceito aqui: sanitizar SVG de verdade exige uma biblioteca
 *     dedicada, e um SVG mal sanitizado executa script. Fora de escopo desta
 *     etapa, documentado como limitacao;
 *  3. dimensoes e alteradas so depois de decodificar com uma biblioteca de
 *     imagem de verdade (sharp/libvips), nunca por inspecionar o cabecalho a
 *     mao -- decoders escritos a mao sao a fonte classica de furo de
 *     seguranca em processamento de imagem;
 *  4. orientacao EXIF e corrigida e os metadados (que podem conter
 *     localizacao, dispositivo etc.) sao removidos da versao otimizada.
 */
import { createHash } from 'node:crypto';

import sharp from 'sharp';

/** Assinaturas conhecidas. Cada arquivo aceito comeca com um destes bytes. */
const SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF87a / GIF89a
  { mime: 'image/bmp', bytes: [0x42, 0x4d] },
  { mime: 'image/tiff', bytes: [0x49, 0x49, 0x2a, 0x00] },
  { mime: 'image/tiff', bytes: [0x4d, 0x4d, 0x00, 0x2a] },
];

export const MAX_DIMENSION_PX = 6000;
export const MIN_DIMENSION_PX = 200;
const OPTIMIZED_MAX_WIDTH = 2000;

export type MimeDetectionResult = { ok: true; mime: string } | { ok: false; reason: string };

/** Detecta o MIME real pelos bytes iniciais. Nunca confia no nome do arquivo. */
export function detectMime(buffer: Buffer): MimeDetectionResult {
  if (buffer.length < 12) return { ok: false, reason: 'Arquivo pequeno demais para ser uma imagem valida.' };

  for (const sig of SIGNATURES) {
    const matches = sig.bytes.every((byte, index) => buffer[index] === byte);
    if (!matches) continue;

    if (sig.mime === 'image/webp') {
      // RIFF e um container generico; so e WebP se os bytes 8-11 forem "WEBP".
      const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
      if (!isWebp) continue;
    }
    return { ok: true, mime: sig.mime };
  }
  // HEIC/HEIF and AVIF are ISO-BMFF containers, differentiated by their
  // ftyp brands. sharp/libvips must still decode them successfully.
  if (buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buffer.subarray(8, 12).toString('ascii');
    if (['avif', 'avis'].includes(brand)) return { ok: true, mime: 'image/avif' };
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand)) {
      return { ok: true, mime: 'image/heic' };
    }
  }
  return {
    ok: false,
    reason: 'Formato não suportado. Use PNG, JPG, WebP, GIF, BMP, TIFF, AVIF ou HEIC/HEIF (quando disponível no servidor). SVG não é aceito por segurança.',
  };
}

export interface ProcessedImage {
  mime: string;
  checksum: string;
  original: { width: number; height: number; sizeBytes: number };
  /** Versao otimizada: EXIF removido, orientacao corrigida, WebP, redimensionada. */
  optimized: { buffer: Buffer; width: number; height: number; sizeBytes: number };
}

export type ProcessImageResult = { ok: true; image: ProcessedImage } | { ok: false; reason: string };

/**
 * Valida e processa um upload.
 *
 * Decodifica com sharp/libvips ANTES de qualquer outra operacao: e o que
 * garante que um arquivo com assinatura falsificada mas conteudo corrompido
 * (ou uma bomba de descompressao) seja recusado pelo decoder, em vez de
 * travar o processo.
 */
export async function processUploadedImage(buffer: Buffer): Promise<ProcessImageResult> {
  const detected = detectMime(buffer);
  if (!detected.ok) return { ok: false, reason: detected.reason };

  // `sharp().metadata()` decodifica o suficiente para validar a imagem de
  // verdade; um arquivo malicioso que so finge ser PNG falha aqui.
  const metadata = await sharp(buffer, { limitInputPixels: 60_000_000 })
    .metadata()
    .catch(() => null);
  if (!metadata) {
    return { ok: false, reason: 'Nao foi possivel decodificar o arquivo como imagem.' };
  }

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (width < MIN_DIMENSION_PX || height < MIN_DIMENSION_PX) {
    return {
      ok: false,
      reason: `Imagem pequena demais (${width}x${height}px). O minimo e ${MIN_DIMENSION_PX}px no menor lado.`,
    };
  }
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    return { ok: false, reason: `Imagem grande demais (${width}x${height}px).` };
  }

  const optimizedBuffer = await sharp(buffer, { limitInputPixels: 60_000_000 })
    // `.rotate()` sem argumento aplica a orientacao do EXIF e depois a
    // descarta -- e assim que a correcao de orientacao "gruda" na imagem.
    .rotate()
    .resize({ width: OPTIMIZED_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const optimizedMeta = await sharp(optimizedBuffer).metadata();

  return {
    ok: true,
    image: {
      mime: detected.mime,
      checksum: createHash('sha256').update(buffer).digest('hex'),
      original: { width, height, sizeBytes: buffer.length },
      optimized: {
        buffer: optimizedBuffer,
        width: optimizedMeta.width ?? OPTIMIZED_MAX_WIDTH,
        height: optimizedMeta.height ?? 0,
        sizeBytes: optimizedBuffer.length,
      },
    },
  };
}
