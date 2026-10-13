/**
 * Storage de arquivos: interface + adapter local.
 *
 * A interface existe para a secao 16.4 da especificacao: "prepare adapter
 * futuro S3-compatible sem exigir S3 nesta fase". Trocar de local para um
 * bucket remoto no futuro significa escrever uma segunda classe que
 * implementa `StorageAdapter`, sem tocar em quem usa.
 *
 * Duas raizes separadas, nunca uma dentro da outra:
 *  - `SITE_ASSETS_DIR`  arquivos de trabalho (uploads, gerados) ANTES de
 *    publicar. Privados, servidos apenas atraves da API autenticada;
 *  - `SITE_PUBLIC_ASSETS_DIR` artefatos publicados (etapa A12), servidos
 *    diretamente e sem autenticacao.
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { RowDataPacket } from 'mysql2';
import { getPool } from '@server/db/client';
import { getEnv, publicSitesDirAbsolute, siteAssetsDirAbsolute } from '@server/config/env';

export interface StorageAdapter {
  write(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

/**
 * Resolve uma chave contra a raiz, recusando qualquer tentativa de escapar
 * dela.
 *
 * `key` nunca deve ser um caminho fornecido pelo usuario (secao 25.4): quem
 * gera a chave e sempre o servidor, com `newId()`. Esta funcao e a segunda
 * camada de defesa, para o caso de um bug em algum chamador -- path
 * traversal aqui seria escrita/leitura arbitraria de arquivo no servidor.
 */
function resolveSafe(root: string, key: string): string {
  const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
  const resolved = path.resolve(root, normalizedKey);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;

  if (!resolved.startsWith(rootWithSep) && resolved !== root) {
    throw new Error(`Chave de storage tenta escapar da raiz: "${key}".`);
  }
  return resolved;
}

/**
 * MySQL stores a durable copy of site files. Railway's default filesystem
 * may be replaced on each deployment; merely creating storage/sites outside
 * dist/ does not make it persistent. A DB-backed cache guarantees that both
 * source images and already published pages survive such restarts.
 *
 * This is a small-project fallback; migrate to object storage for large
 * media libraries. Never write image bytes to a public DB route.
 */
type DurableScope = 'assets' | 'published';
const backedThisProcess = new Set<string>();
const MAX_DURABLE_BYTES = 15_000_000;

function scopeForRoot(root: string): DurableScope | null {
  if (getEnv().NODE_ENV !== 'production') return null;
  const canonical = path.resolve(root);
  if (canonical === siteAssetsDirAbsolute()) return 'assets';
  if (canonical === publicSitesDirAbsolute()) return 'published';
  return null;
}

async function storeBackup(scope: DurableScope, key: string, bytes: Buffer): Promise<void> {
  if (bytes.length > MAX_DURABLE_BYTES) {
    throw new Error('Arquivo de site excede o limite do backup persistente (15 MB).');
  }
  const sha = createHash('sha256').update(bytes).digest('hex');
  await getPool().execute(
    `INSERT INTO site_storage_blobs (scope, storage_key, data, checksum, updated_at)
      VALUES (?, ?, ?, ?, UTC_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE data=VALUES(data), checksum=VALUES(checksum),
      updated_at=VALUES(updated_at)`,
    [scope, key, bytes, sha],
  );
  if (backedThisProcess.size > 20_000) backedThisProcess.clear();
  backedThisProcess.add(scope + ':' + key);
}

async function loadBackup(scope: DurableScope, key: string): Promise<Buffer | null> {
  const [rows] = await getPool().execute<RowDataPacket[]>(
    'SELECT data, checksum FROM site_storage_blobs WHERE scope=? AND storage_key=? LIMIT 1',
    [scope, key],
  );
  const row = rows[0] as { data?: Buffer; checksum?: string } | undefined;
  if (!row?.data) return null;
  const bytes = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== row.checksum) throw new Error('Backup de mídia danificado: checksum incompatível.');
  backedThisProcess.add(scope + ':' + key);
  return bytes;
}

export function createLocalStorage(root: string): StorageAdapter {
  const scope = scopeForRoot(root);
  return {
    async write(key, data) {
      const filePath = resolveSafe(root, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data);
      // A write counts as success only when the permanent copy exists.
      // Otherwise a green deployment could silently lose the site next time.
      if (scope) await storeBackup(scope, key, data);
    },
    async read(key) {
      const filePath = resolveSafe(root, key);
      try {
        const bytes = await fs.readFile(filePath);
        // Opportunistically migrate pre-existing local files (written before
        // the DB-backed adapter) without requiring any paid regeneration.
        if (scope && !backedThisProcess.has(scope + ':' + key)) {
          await storeBackup(scope, key, bytes);
        }
        return bytes;
      } catch (err) {
        if (!scope || (err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
        const bytes = await loadBackup(scope, key);
        if (!bytes) throw err;
        // Restore the cache after a redeploy. Reading the DB is sufficient
        // if the local filesystem is temporarily not writable.
        await fs.mkdir(path.dirname(filePath), { recursive: true })
          .then(() => fs.writeFile(filePath, bytes)).catch(() => undefined);
        return bytes;
      }
    },
    async delete(key) {
      const filePath = resolveSafe(root, key);
      if (scope) {
        await getPool().execute(
          'DELETE FROM site_storage_blobs WHERE scope=? AND storage_key=?',
          [scope, key],
        );
        backedThisProcess.delete(scope + ':' + key);
      }
      await fs.rm(filePath, { force: true });
    },
    async exists(key) {
      try {
        await fs.access(resolveSafe(root, key));
        return true;
      } catch {
        if (!scope) return false;
        const [rows] = await getPool().execute<RowDataPacket[]>(
          'SELECT 1 AS present FROM site_storage_blobs WHERE scope=? AND storage_key=? LIMIT 1',
          [scope, key],
        );
        return rows.length > 0;
      }
    },
  };
}

export interface StorageCheckResult {
  ok: boolean;
  error?: string;
}

/**
 * Verificacao de boot exigida pela secao 16.4: escreve, le, confere o
 * conteudo e remove um arquivo de teste. Se qualquer passo falhar, a
 * publicacao/upload reais devem ficar bloqueados com diagnostico -- nunca
 * simulados como se o storage funcionasse.
 */
export async function checkStorageWritable(adapter: StorageAdapter): Promise<StorageCheckResult> {
  const probeKey = `.storage-check-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;
  const probeContent = Buffer.from(createHash('sha256').update(probeKey).digest('hex'));

  try {
    await adapter.write(probeKey, probeContent);
    const readBack = await adapter.read(probeKey);
    if (!readBack.equals(probeContent)) {
      return { ok: false, error: 'O conteudo lido de volta nao confere com o que foi escrito.' };
    }
    await adapter.delete(probeKey);
    if (await adapter.exists(probeKey)) {
      return { ok: false, error: 'O arquivo de teste nao foi removido.' };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' };
  }
}
