/**
 * Pontuacao de leads promissores.
 *
 * Deterministica, explicavel e TRANSITORIA: nunca e persistida como verdade
 * permanente. Nao usa IA externa e nao esconde resultado valido -- serve
 * apenas como ordenacao opcional, sempre acompanhada dos motivos.
 */
import type { BusinessStatus, WebsiteClassification } from '../../shared/constants';
import type { NormalizedPhone } from './normalize';

export interface ScoreInput {
  phone: NormalizedPhone | null;
  classification: WebsiteClassification;
  businessStatus: BusinessStatus;
  rating: number | null;
  userRatingCount: number | null;
}

export interface ScoreReason {
  label: string;
  /** Positivo aproxima do perfil ideal; negativo afasta. */
  weight: number;
}

export interface ScoreResult {
  /** 0 a 100. */
  score: number;
  reasons: ScoreReason[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Perfil buscado: empresa operacional, com telefone utilizavel e sem site
 * proprio -- justamente quem tende a precisar de presenca digital.
 */
export function scoreLead(input: ScoreInput): ScoreResult {
  const reasons: ScoreReason[] = [];
  let score = 40; // base neutra

  // --- Contato disponivel -------------------------------------------------
  if (input.phone?.isValid) {
    score += 20;
    reasons.push({ label: 'Telefone disponivel', weight: 20 });
    if (input.phone.type === 'MOBILE') {
      score += 5;
      reasons.push({ label: 'Numero movel identificado', weight: 5 });
    }
  } else {
    score -= 25;
    reasons.push({ label: 'Sem telefone utilizavel', weight: -25 });
  }

  // --- Presenca digital ---------------------------------------------------
  switch (input.classification) {
    case 'NONE':
      score += 22;
      reasons.push({ label: 'Sem nenhum link no perfil', weight: 22 });
      break;
    case 'INSTAGRAM':
      score += 18;
      reasons.push({ label: 'Usa Instagram no lugar de site proprio', weight: 18 });
      break;
    case 'FACEBOOK_OR_SOCIAL':
      score += 16;
      reasons.push({ label: 'Usa rede social no lugar de site proprio', weight: 16 });
      break;
    case 'WHATSAPP':
      score += 16;
      reasons.push({ label: 'Usa WhatsApp no lugar de site proprio', weight: 16 });
      break;
    case 'LINK_IN_BIO':
      score += 15;
      reasons.push({ label: 'Usa pagina de links no lugar de site proprio', weight: 15 });
      break;
    case 'DIRECTORY_OR_PLATFORM':
      score += 12;
      reasons.push({ label: 'Presenca apenas em diretorio ou plataforma', weight: 12 });
      break;
    case 'OWN_WEBSITE':
      score -= 18;
      reasons.push({ label: 'Provavel site proprio ja existente', weight: -18 });
      break;
    case 'UNKNOWN':
      reasons.push({ label: 'Link nao classificado - verificar', weight: 0 });
      break;
  }

  // --- Situacao do negocio ------------------------------------------------
  if (input.businessStatus === 'OPERATIONAL') {
    score += 6;
    reasons.push({ label: 'Empresa em operacao', weight: 6 });
  } else if (input.businessStatus === 'CLOSED_TEMPORARILY') {
    score -= 12;
    reasons.push({ label: 'Fechada temporariamente', weight: -12 });
  }

  // --- Sinal de atividade -------------------------------------------------
  // Volume de avaliacoes indica movimento; a nota entra com peso moderado
  // para nao confundir qualidade de atendimento com potencial comercial.
  const reviews = input.userRatingCount ?? 0;
  if (reviews >= 100) {
    score += 8;
    reasons.push({ label: 'Muitas avaliacoes no Google', weight: 8 });
  } else if (reviews >= 20) {
    score += 5;
    reasons.push({ label: 'Volume relevante de avaliacoes', weight: 5 });
  } else if (reviews >= 5) {
    score += 2;
    reasons.push({ label: 'Alguma atividade em avaliacoes', weight: 2 });
  }

  if (input.rating !== null && reviews >= 5) {
    if (input.rating >= 4.5) {
      score += 3;
      reasons.push({ label: 'Boa reputacao no Google', weight: 3 });
    } else if (input.rating < 3) {
      score -= 3;
      reasons.push({ label: 'Reputacao baixa no Google', weight: -3 });
    }
  }

  return {
    score: Math.round(clamp(score, 0, 100)),
    reasons: reasons.filter((reason) => reason.weight !== 0 || reason.label.includes('verificar')),
  };
}

export const SORT_OPTIONS = ['RELEVANCE', 'SCORE', 'RATING', 'REVIEWS'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_OPTION_LABELS: Record<SortOption, string> = {
  RELEVANCE: 'Relevancia do Google',
  SCORE: 'Pontuacao da plataforma',
  RATING: 'Nota',
  REVIEWS: 'Numero de avaliacoes',
};
