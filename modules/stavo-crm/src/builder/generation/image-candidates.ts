/**
 * Imagens reais que a IA pode escolher.
 *
 * Regra do modulo: o modelo NUNCA escreve URL de imagem e nunca ve o id
 * interno de um asset. O servidor monta uma lista de candidatas a partir de
 * um provedor, da a cada uma um apelido curto ("img-1"), e o modelo so pode
 * referenciar esses apelidos. Um apelido fora da lista vira "sem imagem".
 *
 * `SiteAssetProvider` e o ponto de extensao: hoje so existem os uploads do
 * proprio projeto; um banco de imagens licenciado ou geracao de imagem entram
 * como outra implementacao desta interface, sem mexer na IA nem no assembler.
 */
import type { AssetRef } from '@site-kit/schemas/site-schema';

export type ImageOrientation = 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE';

/** Uma imagem real, ja armazenada e com direito de uso conhecido. */
export interface SiteImageCandidate {
  /** Id interno do asset. Nunca vai para o prompt. */
  assetId: string;
  width: number | null;
  height: number | null;
  /** Descricao humana (alt), usada para a IA entender o conteudo. */
  description: string;
  focalX: number;
  focalY: number;
  /** De onde veio: UPLOAD hoje; STOCK/GENERATED no futuro. */
  source: string;
}

export interface SiteAssetProvider {
  readonly name: string;
  listCandidates(projectId: string): Promise<SiteImageCandidate[]>;
}

/** Candidata com apelido, no formato que a IA recebe. */
export interface AliasedCandidate extends SiteImageCandidate {
  alias: string;
  orientation: ImageOrientation;
}

/** Limite de imagens enviadas ao prompt, alinhado ao teto do projeto. */
export const MAX_IMAGE_CANDIDATES = 8;

export function orientationOf(width: number | null, height: number | null): ImageOrientation {
  if (!width || !height) return 'LANDSCAPE';
  const ratio = width / height;
  if (ratio > 1.15) return 'LANDSCAPE';
  if (ratio < 0.87) return 'PORTRAIT';
  return 'SQUARE';
}

/** Apelidos estaveis na ordem recebida: img-1, img-2, ... */
export function aliasCandidates(candidates: SiteImageCandidate[]): AliasedCandidate[] {
  return candidates.slice(0, MAX_IMAGE_CANDIDATES).map((candidate, index) => ({
    ...candidate,
    alias: `img-${index + 1}`,
    orientation: orientationOf(candidate.width, candidate.height),
  }));
}

/** Resolve um apelido escolhido pela IA. Desconhecido ou "none" -> null. */
export function resolveAlias(alias: string, candidates: AliasedCandidate[]): AssetRef | null {
  if (!alias || alias === 'none') return null;
  const found = candidates.find((candidate) => candidate.alias === alias);
  if (!found) return null;
  return {
    assetId: found.assetId,
    alt: found.description.slice(0, 200),
    focalX: found.focalX,
    focalY: found.focalY,
  };
}

/** Linhas da lista de imagens para a mensagem do usuario. Sem id, sem URL. */
export function candidatesForPrompt(candidates: AliasedCandidate[]): string {
  if (candidates.length === 0) return 'Nenhuma imagem disponivel. Use "none" em todo campo de imagem.';
  return candidates
    .map((candidate) => `${candidate.alias}: ${candidate.orientation.toLowerCase()} -- ${candidate.description || 'sem descricao'}`)
    .join('\n');
}
