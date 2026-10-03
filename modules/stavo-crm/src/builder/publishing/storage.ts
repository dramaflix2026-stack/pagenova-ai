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

export function createLocalStorage(root: string): StorageAdapter {
  return {
    async write(key, data) {
      const filePath = resolveSafe(root, key);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, data);
    },
    async read(key) {
      return fs.readFile(resolveSafe(root, key));
    },
    async delete(key) {
      await fs.rm(resolveSafe(root, key), { force: true });
    },
    async exists(key) {
      try {
        await fs.access(resolveSafe(root, key));
        return true;
      } catch {
        return false;
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
