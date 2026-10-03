/**
 * Regras de dominio das reunioes.
 *
 * Este arquivo e compartilhado entre servidor e navegador de proposito: a
 * validacao do link do Meet e a regra de conflito precisam ser IDENTICAS nos
 * dois lados. Duas implementacoes "equivalentes" divergem com o tempo, e o
 * usuario descobre isso vendo o formulario aceitar algo que a API recusa.
 *
 * O servidor continua sendo a autoridade: a tela usa isto para explicar o erro
 * antes do envio, nunca para dispensar a checagem do backend.
 */

export const MEETING_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  SCHEDULED: 'Agendada',
  COMPLETED: 'Concluida',
  CANCELED: 'Cancelada',
  NO_SHOW: 'Nao compareceu',
};

/** Apenas SCHEDULED ocupa horario e aparece em alertas. */
export const isActiveMeeting = (status: MeetingStatus): boolean => status === 'SCHEDULED';

/**
 * Transicoes permitidas.
 *
 * Os tres estados finais sao definitivos: uma reuniao concluida nao volta
 * silenciosamente a agendada. Voltar atras e uma decisao humana que hoje se
 * resolve agendando uma NOVA reuniao para o mesmo lead.
 */
const ALLOWED_TRANSITIONS: Record<MeetingStatus, readonly MeetingStatus[]> = {
  SCHEDULED: ['COMPLETED', 'CANCELED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELED: [],
  NO_SHOW: [],
};

export function canTransition(from: MeetingStatus, to: MeetingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// ---------------------------------------------------------------------------
// Link do Google Meet
// ---------------------------------------------------------------------------

/** Unico hostname aceito. Comparacao exata, nunca "contem". */
export const MEET_HOSTNAME = 'meet.google.com';

export type MeetUrlResult =
  { ok: true; url: string } | { ok: false; reason: string; code: MeetUrlError };

export type MeetUrlError =
  | 'EMPTY'
  | 'MALFORMED'
  | 'NOT_HTTPS'
  | 'WRONG_HOST'
  | 'HAS_CREDENTIALS'
  | 'HAS_PORT'
  | 'NO_MEETING_PATH';

const MENSAGEM_PADRAO =
  'Cole um link valido do Google Meet, por exemplo: https://meet.google.com/abc-defg-hij.';

/**
 * Valida e normaliza o link da sala.
 *
 * A analise usa o parser de URL do proprio ambiente, nunca `includes`: um
 * teste por substring aceitaria `https://meet.google.com.exemplo.com/abc`, que
 * pertence a `exemplo.com` e nao ao Google.
 *
 * O servidor NUNCA busca esta URL. Validar e so ler o texto -- fazer uma
 * requisicao para o endereco colado pelo usuario abriria caminho para SSRF.
 */
export function parseMeetUrl(raw: string | null | undefined): MeetUrlResult {
  const texto = (raw ?? '').trim();

  if (texto.length === 0) {
    return { ok: false, code: 'EMPTY', reason: 'Cole o link da reuniao do Google Meet.' };
  }

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return { ok: false, code: 'MALFORMED', reason: MENSAGEM_PADRAO };
  }

  if (url.protocol !== 'https:') {
    return {
      ok: false,
      code: 'NOT_HTTPS',
      reason: 'O link do Google Meet precisa comecar com https://.',
    };
  }

  // `URL` ja devolve o hostname em minusculas; a comparacao e exata.
  if (url.hostname !== MEET_HOSTNAME) {
    return {
      ok: false,
      code: 'WRONG_HOST',
      reason: `Este link nao e do Google Meet. O endereco precisa ser exatamente ${MEET_HOSTNAME}.`,
    };
  }

  // Credencial embutida e tecnica classica de disfarce de endereco.
  if (url.username.length > 0 || url.password.length > 0) {
    return { ok: false, code: 'HAS_CREDENTIALS', reason: MENSAGEM_PADRAO };
  }

  if (url.port.length > 0) {
    return { ok: false, code: 'HAS_PORT', reason: MENSAGEM_PADRAO };
  }

  const codigo = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (codigo.length === 0) {
    return {
      ok: false,
      code: 'NO_MEETING_PATH',
      reason: 'Falta o codigo da sala no final do link.',
    };
  }

  // O fragmento (#...) nunca faz parte de uma sala e nao e guardado.
  url.hash = '';

  return { ok: true, url: url.toString() };
}

/** Atalho booleano para uso em validadores. */
export const isValidMeetUrl = (raw: string | null | undefined): boolean => parseMeetUrl(raw).ok;

// ---------------------------------------------------------------------------
// Janelas de tempo
// ---------------------------------------------------------------------------

export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Duas reunioes se sobrepoem?
 *
 * Terminar exatamente quando a outra comeca NAO e conflito: 14:00-15:00 e
 * 15:00-16:00 convivem. Por isso a comparacao e estritamente menor/maior.
 */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start.getTime() < b.end.getTime() && a.end.getTime() > b.start.getTime();
}

/** Duracoes oferecidas como atalho no formulario. */
export const DURATION_PRESETS_MINUTES = [30, 45, 60, 90] as const;
export const DEFAULT_DURATION_MINUTES = 60;
export const MIN_DURATION_MINUTES = 5;
export const MAX_DURATION_MINUTES = 8 * 60;

// ---------------------------------------------------------------------------
// Lembretes internos
// ---------------------------------------------------------------------------

/** 24 horas e 1 hora antes, ligados por padrao. */
export const DEFAULT_REMINDER_OFFSETS = [1440, 60] as const;
export const ALLOWED_REMINDER_OFFSETS = [10080, 1440, 240, 60, 30, 10] as const;

export const REMINDER_OFFSET_LABELS: Record<number, string> = {
  10080: '1 semana antes',
  1440: '24 horas antes',
  240: '4 horas antes',
  60: '1 hora antes',
  30: '30 minutos antes',
  10: '10 minutos antes',
};

/**
 * Quais lembretes ainda fazem sentido criar.
 *
 * Um lembrete no passado nunca dispararia e so sujaria a tabela. Se a reuniao
 * for marcada para daqui a 20 minutos, o lembrete de 24 horas simplesmente
 * nao existe -- a reuniao ja entra direto na faixa de urgencia dos alertas.
 */
export function futureReminderOffsets(
  startAt: Date,
  offsets: readonly number[],
  now: Date = new Date(),
): number[] {
  return offsets
    .filter((offset) => startAt.getTime() - offset * 60_000 > now.getTime())
    .sort((a, b) => b - a);
}

// ---------------------------------------------------------------------------
// Urgencia usada pelos alertas
// ---------------------------------------------------------------------------

export type MeetingUrgency =
  'IN_PROGRESS' | 'WITHIN_HOUR' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'LATER' | 'NEEDS_OUTCOME';

/**
 * Uma reuniao aparece nos alertas como UM item, com a maior urgencia atual.
 *
 * Sem esta funcao, os lembretes de 24h e de 1h gerariam duas linhas para a
 * mesma reuniao -- foi o que a especificacao pediu para evitar.
 */
export function meetingUrgency(
  range: TimeRange,
  status: MeetingStatus,
  now: Date = new Date(),
): MeetingUrgency | null {
  if (status !== 'SCHEDULED') return null;

  const agora = now.getTime();
  const inicio = range.start.getTime();
  const fim = range.end.getTime();

  // Passou do fim e ninguem disse o que aconteceu: o sistema nao adivinha.
  if (fim <= agora) return 'NEEDS_OUTCOME';
  if (inicio <= agora) return 'IN_PROGRESS';

  const minutos = (inicio - agora) / 60_000;
  if (minutos <= 60) return 'WITHIN_HOUR';
  if (minutos <= 24 * 60) return 'TODAY';
  if (minutos <= 48 * 60) return 'TOMORROW';
  if (minutos <= 7 * 24 * 60) return 'THIS_WEEK';
  return 'LATER';
}

export const MEETING_URGENCY_LABELS: Record<MeetingUrgency, string> = {
  IN_PROGRESS: 'Acontecendo agora',
  WITHIN_HOUR: 'Comeca em menos de 1 hora',
  TODAY: 'Nas proximas 24 horas',
  TOMORROW: 'Amanha',
  THIS_WEEK: 'Nos proximos 7 dias',
  LATER: 'Mais adiante',
  NEEDS_OUTCOME: 'Pendente de atualizacao',
};

/** Menor numero aparece primeiro na central de alertas. */
export const MEETING_URGENCY_PRIORITY: Record<MeetingUrgency, number> = {
  NEEDS_OUTCOME: 0,
  IN_PROGRESS: 1,
  WITHIN_HOUR: 2,
  TODAY: 3,
  TOMORROW: 4,
  THIS_WEEK: 5,
  LATER: 6,
};

// ---------------------------------------------------------------------------
// Limites de texto (espelhados no schema do banco)
// ---------------------------------------------------------------------------

export const MEETING_LIMITS = {
  title: 160,
  agenda: 2000,
  internalNotes: 2000,
  outcome: 2000,
  cancelReason: 500,
  meetUrl: 500,
} as const;
