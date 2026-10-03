/**
 * Regras de dominio das reunioes.
 *
 * A validacao do link e o ponto mais sensivel do modulo: um link aceito por
 * engano leva o usuario para um endereco que nao e do Google. Por isso a
 * bateria de rejeicao e mais longa que a de aceitacao.
 */
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REMINDER_OFFSETS,
  canTransition,
  futureReminderOffsets,
  isActiveMeeting,
  meetingUrgency,
  overlaps,
  parseMeetUrl,
  type MeetingStatus,
} from '@shared/meetings';

describe('link do Google Meet', () => {
  it('aceita o formato oficial', () => {
    const resultado = parseMeetUrl('https://meet.google.com/abc-defg-hij');
    expect(resultado.ok).toBe(true);
    expect(resultado.ok && resultado.url).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('aceita com espacos sobrando e devolve limpo', () => {
    const resultado = parseMeetUrl('   https://meet.google.com/abc-defg-hij   ');
    expect(resultado.ok && resultado.url).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('aceita outros caminhos legitimos do dominio oficial', () => {
    // Links de sala nomeada e de lookup tambem sao do Google.
    expect(parseMeetUrl('https://meet.google.com/lookup/abcdefghij').ok).toBe(true);
    expect(parseMeetUrl('https://meet.google.com/abc-defg-hij?authuser=1').ok).toBe(true);
  });

  it('remove o fragmento antes de guardar', () => {
    const resultado = parseMeetUrl('https://meet.google.com/abc-defg-hij#pin=123');
    expect(resultado.ok && resultado.url).toBe('https://meet.google.com/abc-defg-hij');
  });

  it('recusa vazio', () => {
    for (const entrada of ['', '   ', null, undefined]) {
      const resultado = parseMeetUrl(entrada);
      expect(resultado.ok, String(entrada)).toBe(false);
      expect(!resultado.ok && resultado.code).toBe('EMPTY');
    }
  });

  it('recusa http sem TLS', () => {
    const resultado = parseMeetUrl('http://meet.google.com/abc-defg-hij');
    expect(!resultado.ok && resultado.code).toBe('NOT_HTTPS');
  });

  it('recusa o dominio sem sala', () => {
    expect(parseMeetUrl('https://meet.google.com/').ok).toBe(false);
    expect(parseMeetUrl('https://meet.google.com').ok).toBe(false);
  });

  it('recusa dominio que apenas COMECA com o oficial', () => {
    // O caso classico: pertence a evil.example, nao ao Google.
    const resultado = parseMeetUrl('https://meet.google.com.evil.example/abc');
    expect(!resultado.ok && resultado.code).toBe('WRONG_HOST');
  });

  it('recusa dominio parecido', () => {
    for (const entrada of [
      'https://google-meet.com/abc-defg-hij',
      'https://meetgoogle.com/abc',
      'https://meet.google.com.br/abc',
      'https://www.meet.google.com/abc',
      'https://meet.google.co/abc',
    ]) {
      expect(parseMeetUrl(entrada).ok, entrada).toBe(false);
    }
  });

  it('recusa hostname que apenas contem a palavra meet', () => {
    expect(parseMeetUrl('https://falso.com/meet.google.com/abc').ok).toBe(false);
    expect(parseMeetUrl('https://meet.exemplo.com/abc').ok).toBe(false);
  });

  it('recusa credencial embutida no endereco', () => {
    const resultado = parseMeetUrl('https://usuario:senha@meet.google.com/abc-defg-hij');
    expect(!resultado.ok && resultado.code).toBe('HAS_CREDENTIALS');
  });

  it('recusa porta explicita', () => {
    const resultado = parseMeetUrl('https://meet.google.com:8443/abc-defg-hij');
    expect(!resultado.ok && resultado.code).toBe('HAS_PORT');
  });

  it('recusa esquema perigoso', () => {
    for (const entrada of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
    ]) {
      expect(parseMeetUrl(entrada).ok, entrada).toBe(false);
    }
  });

  it('recusa texto que nao e URL', () => {
    for (const entrada of ['meet.google.com/abc', 'reuniao de terca', 'abc-defg-hij']) {
      expect(parseMeetUrl(entrada).ok, entrada).toBe(false);
    }
  });

  it('toda recusa vem com motivo em portugues', () => {
    const resultado = parseMeetUrl('https://google-meet.com/abc');
    expect(!resultado.ok && resultado.reason.length).toBeGreaterThan(10);
    expect(!resultado.ok && resultado.reason).not.toContain('Invalid');
  });
});

describe('sobreposicao de horarios', () => {
  const faixa = (inicio: string, fim: string) => ({
    start: new Date(inicio),
    end: new Date(fim),
  });

  it('encostadas nao conflitam', () => {
    // 14:00-15:00 e 15:00-16:00 convivem no mesmo dia.
    expect(
      overlaps(
        faixa('2026-09-01T14:00:00Z', '2026-09-01T15:00:00Z'),
        faixa('2026-09-01T15:00:00Z', '2026-09-01T16:00:00Z'),
      ),
    ).toBe(false);
  });

  it('sobreposicao parcial conflita', () => {
    expect(
      overlaps(
        faixa('2026-09-01T14:00:00Z', '2026-09-01T15:00:00Z'),
        faixa('2026-09-01T14:30:00Z', '2026-09-01T15:30:00Z'),
      ),
    ).toBe(true);
  });

  it('uma dentro da outra conflita, nos dois sentidos', () => {
    const externa = faixa('2026-09-01T14:00:00Z', '2026-09-01T17:00:00Z');
    const interna = faixa('2026-09-01T15:00:00Z', '2026-09-01T16:00:00Z');
    expect(overlaps(externa, interna)).toBe(true);
    expect(overlaps(interna, externa)).toBe(true);
  });

  it('faixas distantes nao conflitam', () => {
    expect(
      overlaps(
        faixa('2026-09-01T09:00:00Z', '2026-09-01T10:00:00Z'),
        faixa('2026-09-01T14:00:00Z', '2026-09-01T15:00:00Z'),
      ),
    ).toBe(false);
  });

  it('mesmo instante de inicio e fim conflita', () => {
    const mesma = faixa('2026-09-01T14:00:00Z', '2026-09-01T15:00:00Z');
    expect(overlaps(mesma, mesma)).toBe(true);
  });
});

describe('transicoes de status', () => {
  it('agendada pode ir para os tres desfechos', () => {
    expect(canTransition('SCHEDULED', 'COMPLETED')).toBe(true);
    expect(canTransition('SCHEDULED', 'CANCELED')).toBe(true);
    expect(canTransition('SCHEDULED', 'NO_SHOW')).toBe(true);
  });

  it('estado final nao volta atras', () => {
    const finais: MeetingStatus[] = ['COMPLETED', 'CANCELED', 'NO_SHOW'];
    for (const de of finais) {
      expect(canTransition(de, 'SCHEDULED'), de).toBe(false);
      for (const para of finais) {
        expect(canTransition(de, para), `${de} -> ${para}`).toBe(false);
      }
    }
  });

  it('so a agendada ocupa horario', () => {
    expect(isActiveMeeting('SCHEDULED')).toBe(true);
    for (const status of ['COMPLETED', 'CANCELED', 'NO_SHOW'] as MeetingStatus[]) {
      expect(isActiveMeeting(status), status).toBe(false);
    }
  });
});

describe('lembretes internos', () => {
  const agora = new Date('2026-09-01T12:00:00Z');

  it('reuniao distante recebe os dois lembretes padrao', () => {
    const inicio = new Date('2026-09-10T12:00:00Z');
    expect(futureReminderOffsets(inicio, DEFAULT_REMINDER_OFFSETS, agora)).toEqual([1440, 60]);
  });

  it('reuniao em 3 horas perde o lembrete de 24 horas', () => {
    const inicio = new Date('2026-09-01T15:00:00Z');
    expect(futureReminderOffsets(inicio, DEFAULT_REMINDER_OFFSETS, agora)).toEqual([60]);
  });

  it('reuniao em 20 minutos nao gera lembrete nenhum', () => {
    // Ela entra direto na faixa de urgencia do alerta, sem lembrete no passado.
    const inicio = new Date('2026-09-01T12:20:00Z');
    expect(futureReminderOffsets(inicio, DEFAULT_REMINDER_OFFSETS, agora)).toEqual([]);
  });

  it('nunca devolve lembrete com horario ja passado', () => {
    const inicio = new Date('2026-09-01T13:00:00Z');
    for (const offset of futureReminderOffsets(inicio, [1440, 60, 30, 10], agora)) {
      expect(inicio.getTime() - offset * 60_000).toBeGreaterThan(agora.getTime());
    }
  });

  it('vem do mais distante para o mais proximo', () => {
    const inicio = new Date('2026-09-10T12:00:00Z');
    expect(futureReminderOffsets(inicio, [60, 10080, 1440], agora)).toEqual([10080, 1440, 60]);
  });
});

describe('urgencia nos alertas', () => {
  const agora = new Date('2026-09-01T12:00:00Z');
  const faixaEm = (minutos: number, duracao = 60) => ({
    start: new Date(agora.getTime() + minutos * 60_000),
    end: new Date(agora.getTime() + (minutos + duracao) * 60_000),
  });

  it('em andamento quando ja comecou e nao terminou', () => {
    expect(meetingUrgency(faixaEm(-10), 'SCHEDULED', agora)).toBe('IN_PROGRESS');
  });

  it('pendente de atualizacao quando o fim ja passou', () => {
    // O sistema nao adivinha o desfecho: quem decide e a pessoa.
    expect(meetingUrgency(faixaEm(-120), 'SCHEDULED', agora)).toBe('NEEDS_OUTCOME');
  });

  it('classifica as faixas de proximidade', () => {
    expect(meetingUrgency(faixaEm(30), 'SCHEDULED', agora)).toBe('WITHIN_HOUR');
    expect(meetingUrgency(faixaEm(5 * 60), 'SCHEDULED', agora)).toBe('TODAY');
    expect(meetingUrgency(faixaEm(30 * 60), 'SCHEDULED', agora)).toBe('TOMORROW');
    expect(meetingUrgency(faixaEm(72 * 60), 'SCHEDULED', agora)).toBe('THIS_WEEK');
    expect(meetingUrgency(faixaEm(20 * 24 * 60), 'SCHEDULED', agora)).toBe('LATER');
  });

  it('reuniao encerrada some dos alertas', () => {
    for (const status of ['COMPLETED', 'CANCELED', 'NO_SHOW'] as MeetingStatus[]) {
      expect(meetingUrgency(faixaEm(30), status, agora), status).toBeNull();
    }
  });
});
