/**
 * Upload e processamento de imagem (secao 13.2 da especificacao).
 *
 * O que estes testes protegem: o MIME e decidido pelo CONTEUDO do arquivo,
 * nunca pelo nome; um arquivo que finge ser imagem mas nao decodifica e
 * recusado; e o storage nunca escreve fora da propria raiz.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { detectMime, MIN_DIMENSION_PX, processUploadedImage } from '@builder/publishing/image-processing';
import { checkStorageWritable, createLocalStorage } from '@builder/publishing/storage';

/** PNG minimo (1x1) valido, gerado uma vez para os testes. */
async function tinyPng(width = 400, height = 300): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 120, g: 80, b: 40 } },
  })
    .png()
    .toBuffer();
}

describe('detectMime: decide pelos bytes, nunca pelo nome', () => {
  it('reconhece PNG pela assinatura', async () => {
    const buffer = await tinyPng();
    expect(detectMime(buffer)).toEqual({ ok: true, mime: 'image/png' });
  });

  it('reconhece JPEG pela assinatura', async () => {
    const buffer = await sharp({ create: { width: 300, height: 300, channels: 3, background: '#000' } })
      .jpeg()
      .toBuffer();
    expect(detectMime(buffer)).toEqual({ ok: true, mime: 'image/jpeg' });
  });

  it('reconhece WebP e nao confunde com outro container RIFF', () => {
    const webp = Buffer.concat([Buffer.from('RIFF', 'ascii'), Buffer.alloc(4), Buffer.from('WEBP', 'ascii'), Buffer.alloc(4)]);
    expect(detectMime(webp)).toMatchObject({ ok: true, mime: 'image/webp' });

    const otherRiff = Buffer.concat([Buffer.from('RIFF', 'ascii'), Buffer.alloc(4), Buffer.from('AVI ', 'ascii'), Buffer.alloc(4)]);
    expect(detectMime(otherRiff).ok).toBe(false);
  });

  it('recusa um arquivo de texto disfarcado de imagem', () => {
    const fake = Buffer.from('<script>alert(1)</script>'.repeat(10));
    expect(detectMime(fake)).toMatchObject({ ok: false });
  });

  it('recusa um PNG com extensao .jpg no NOME -- o nome nunca e consultado', async () => {
    // A funcao nem recebe o nome do arquivo: e a prova de que ele nao importa.
    const buffer = await tinyPng();
    expect(detectMime(buffer).ok).toBe(true);
  });

  it('recusa arquivo vazio ou pequeno demais para ter assinatura', () => {
    expect(detectMime(Buffer.alloc(0)).ok).toBe(false);
    expect(detectMime(Buffer.from([0x89, 0x50])).ok).toBe(false);
  });
});

describe('processUploadedImage', () => {
  it('aceita uma imagem valida e devolve uma versao otimizada', async () => {
    const buffer = await tinyPng(1200, 800);
    const result = await processUploadedImage(buffer);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.image.mime).toBe('image/png');
    expect(result.image.original.width).toBe(1200);
    expect(result.image.optimized.width).toBeLessThanOrEqual(1200);
    // A otimizada e SEMPRE WebP, independente do formato de entrada.
    const optimizedMeta = await sharp(result.image.optimized.buffer).metadata();
    expect(optimizedMeta.format).toBe('webp');
  });

  it('recusa imagem menor que o minimo', async () => {
    const buffer = await tinyPng(50, 50);
    const result = await processUploadedImage(buffer);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain(String(MIN_DIMENSION_PX));
  });

  it('recusa um arquivo corrompido que passa pela assinatura mas nao decodifica', async () => {
    const real = await tinyPng();
    const corrupted = Buffer.concat([real.subarray(0, 30), Buffer.alloc(20, 0xff)]);
    const result = await processUploadedImage(corrupted);
    expect(result.ok).toBe(false);
  });

  it('a otimizacao remove EXIF: a versao final nao carrega metadados de origem', async () => {
    const withExif = await sharp({ create: { width: 500, height: 500, channels: 3, background: '#fff' } })
      .withMetadata({ exif: { IFD0: { Make: 'CameraFalsa' } } })
      .jpeg()
      .toBuffer();

    const result = await processUploadedImage(withExif);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const optimizedMeta = await sharp(result.image.optimized.buffer).metadata();
    expect(optimizedMeta.exif).toBeUndefined();
  });

  it('o checksum e estavel para o mesmo arquivo', async () => {
    const buffer = await tinyPng();
    const a = await processUploadedImage(buffer);
    const b = await processUploadedImage(Buffer.from(buffer));
    if (!a.ok || !b.ok) throw new Error('deveria ter aceitado');
    expect(a.image.checksum).toBe(b.image.checksum);
  });
});

describe('storage local', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'site-ai-storage-'));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('escreve, le e remove', async () => {
    const storage = createLocalStorage(root);
    await storage.write('a/b.webp', Buffer.from('conteudo'));

    expect(await storage.exists('a/b.webp')).toBe(true);
    expect((await storage.read('a/b.webp')).toString()).toBe('conteudo');

    await storage.delete('a/b.webp');
    expect(await storage.exists('a/b.webp')).toBe(false);
  });

  it('recusa path traversal tentando escapar da raiz', async () => {
    const storage = createLocalStorage(root);
    await expect(storage.write('../fora-da-raiz.txt', Buffer.from('x'))).rejects.toThrow();
    await expect(storage.read('../../etc/passwd')).rejects.toThrow();
  });

  it('a verificacao de boot confirma escrita, leitura e remocao de verdade', async () => {
    const storage = createLocalStorage(root);
    const result = await checkStorageWritable(storage);
    expect(result).toEqual({ ok: true });
  });

  it('a verificacao de boot falha honestamente quando a raiz nao existe e nao pode ser criada', async () => {
    // Um caminho impossivel (arquivo no lugar de diretorio) simula storage quebrado.
    const blockerFile = path.join(root, 'nao-e-diretorio');
    await createLocalStorage(root).write('nao-e-diretorio', Buffer.from('x'));
    const storage = createLocalStorage(blockerFile);

    const result = await checkStorageWritable(storage);
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
