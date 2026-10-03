/**
 * Rotas das reunioes.
 *
 *  GET    /api/meetings                 janela do calendario
 *  GET    /api/meetings/upcoming        proximas (card, drawer, resumo)
 *  GET    /api/meetings/alerts          reunioes que pedem atencao agora
 *  GET    /api/meetings/:id             detalhe
 *  POST   /api/meetings                 agendar
 *  PATCH  /api/meetings/:id             editar conteudo (nunca horario)
 *  POST   /api/meetings/:id/reschedule  mudar horario da MESMA reuniao
 *  POST   /api/meetings/:id/cancel      cancelar
 *  POST   /api/meetings/:id/complete    concluir
 *  POST   /api/meetings/:id/no-show     cliente nao compareceu
 *  PATCH  /api/meeting-reminders/:id    marcar aviso como lido/dispensado
 *
 * Todas exigem sessao. Reuniao carrega link de sala e nota interna: nada aqui
 * pode ficar publico.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { MEETING_STATUSES, type MeetingStatus } from '../../../shared/meetings';
import {
  cancelMeetingSchema,
  completeMeetingSchema,
  createMeetingSchema,
  meetingRangeSchema,
  noShowMeetingSchema,
  rescheduleMeetingSchema,
  updateMeetingSchema,
} from '../../../shared/schemas';
import { getEnv } from '../../config/env';
import { getDb } from '../../db/client';
import { asyncHandler, parseBody, parseQuery } from '../../lib/http';
import { badRequest } from '../../lib/errors';
import { csrfProtection, requireAuth } from '../../middleware';
import {
  cancelMeeting,
  completeMeeting,
  createMeeting,
  getMeetingOrThrow,
  listMeetingAlerts,
  listMeetings,
  listUpcomingMeetings,
  noShowMeeting,
  rescheduleMeeting,
  updateMeeting,
  updateReminderStatus,
} from './service';

export const meetingsRouter: Router = Router();

meetingsRouter.use(requireAuth);

/** Protege as mutacoes de clique repetido e de script. */
const meetingRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => getEnv().NODE_ENV === 'test',
});

/**
 * Teto da janela consultada.
 *
 * O calendario mensal pede ~6 semanas; um ano inteiro so poderia vir de URL
 * montada a mao e faria a consulta varrer a tabela toda.
 */
const MAX_RANGE_DAYS = 120;

meetingsRouter.get(
  '/meetings',
  asyncHandler(async (req, res) => {
    const filtros = parseQuery(meetingRangeSchema, req);
    const start = new Date(filtros.start);
    const end = new Date(filtros.end);

    if (end <= start) {
      throw badRequest('O fim da janela deve ser posterior ao inicio.', {
        code: 'INVALID_TIME_RANGE',
      });
    }

    const dias = (end.getTime() - start.getTime()) / 86_400_000;
    if (dias > MAX_RANGE_DAYS) {
      throw badRequest(`Consulte no maximo ${MAX_RANGE_DAYS} dias por vez.`, {
        code: 'INVALID_TIME_RANGE',
      });
    }

    const meetings = await listMeetings(getDb(), {
      start,
      end,
      status: filtros.status,
      leadId: filtros.leadId,
      search: filtros.search,
    });

    res.json({ meetings });
  }),
);

meetingsRouter.get(
  '/meetings/upcoming',
  asyncHandler(async (req, res) => {
    const limite = Number(req.query.limit ?? 10);
    const leadId = typeof req.query.leadId === 'string' ? req.query.leadId : undefined;

    const meetings = await listUpcomingMeetings(getDb(), {
      limit: Number.isFinite(limite) ? limite : 10,
      ...(leadId ? { leadId } : {}),
    });

    res.json({ meetings });
  }),
);

meetingsRouter.get(
  '/meetings/alerts',
  asyncHandler(async (_req, res) => {
    res.json({ alerts: await listMeetingAlerts(getDb()) });
  }),
);

meetingsRouter.get(
  '/meetings/:id',
  asyncHandler(async (req, res) => {
    const meeting = await getMeetingOrThrow(getDb(), req.params.id!);
    res.json({ meeting });
  }),
);

meetingsRouter.post(
  '/meetings',
  csrfProtection,
  meetingRateLimit,
  asyncHandler(async (req, res) => {
    const input = parseBody(createMeetingSchema, req);
    const meeting = await createMeeting(getDb(), input, req.session!.user.id);
    res.status(201).json({ meeting, message: 'Reuniao agendada.' });
  }),
);

meetingsRouter.patch(
  '/meetings/:id',
  csrfProtection,
  meetingRateLimit,
  asyncHandler(async (req, res) => {
    // Horario nesta rota seria uma edicao silenciosa: perderia o evento de
    // reagendamento e o registro do antes/depois.
    if ('startAt' in req.body || 'endAt' in req.body) {
      throw badRequest(
        'Para mudar data ou horario, use o reagendamento: ele guarda o horario anterior.',
        { code: 'INVALID_MEETING_TRANSITION' },
      );
    }

    const input = parseBody(updateMeetingSchema, req);
    const meeting = await updateMeeting(getDb(), req.params.id!, input, req.session!.user.id);
    res.json({ meeting, message: 'Reuniao atualizada.' });
  }),
);

meetingsRouter.post(
  '/meetings/:id/reschedule',
  csrfProtection,
  meetingRateLimit,
  asyncHandler(async (req, res) => {
    const input = parseBody(rescheduleMeetingSchema, req);
    const meeting = await rescheduleMeeting(getDb(), req.params.id!, input, req.session!.user.id);
    res.json({ meeting, message: 'Reuniao reagendada.' });
  }),
);

meetingsRouter.post(
  '/meetings/:id/cancel',
  csrfProtection,
  meetingRateLimit,
  asyncHandler(async (req, res) => {
    const input = parseBody(cancelMeetingSchema, req);
    const meeting = await cancelMeeting(getDb(), req.params.id!, input, req.session!.user.id);
    res.json({ meeting, message: 'Reuniao cancelada. O historico foi preservado.' });
  }),
);

meetingsRouter.post(
  '/meetings/:id/complete',
  csrfProtection,
  meetingRateLimit,
  asyncHandler(async (req, res) => {
    const input = parseBody(completeMeetingSchema, req);
    const meeting = await completeMeeting(getDb(), req.params.id!, input, req.session!.user.id);
    res.json({ meeting, message: 'Reuniao concluida.' });
  }),
);

meetingsRouter.post(
  '/meetings/:id/no-show',
  csrfProtection,
  meetingRateLimit,
  asyncHandler(async (req, res) => {
    const input = parseBody(noShowMeetingSchema, req);
    const meeting = await noShowMeeting(getDb(), req.params.id!, input, req.session!.user.id);
    res.json({ meeting, message: 'Ausencia registrada.' });
  }),
);

meetingsRouter.patch(
  '/meeting-reminders/:id',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const acao = (req.body as { status?: string }).status;
    if (acao !== 'READ' && acao !== 'DISMISSED') {
      throw badRequest('Acao invalida para o lembrete.');
    }
    // Dispensar o aviso nunca cancela a reuniao.
    await updateReminderStatus(getDb(), req.params.id!, acao);
    res.json({ ok: true });
  }),
);

/** Exportado para uso em testes de contrato. */
export const MEETING_STATUS_VALUES: readonly MeetingStatus[] = MEETING_STATUSES;
