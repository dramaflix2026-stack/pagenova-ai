/**
 * Rotas do Garimpoo.
 *
 *  POST /api/garimpoo/webhooks/cakto  compra, reembolso e chargeback
 *  POST /api/garimpoo/ativar          define a senha provando a compra
 *  POST /api/garimpoo/entrar          login (prende a sessao ao dispositivo)
 *  POST /api/garimpoo/sair            encerra a sessao
 *  GET  /api/garimpoo/eu              quem sou eu + cota do dia
 *  POST /api/garimpoo/buscar          busca no Google Places
 *  GET  /api/garimpoo/historico       ultimas buscas da conta
 *
 * O Garimpoo NAO usa a sessao do CRM: cookie proprio, tabela propria, regra
 * propria. Um membro da comunidade nunca vira usuario do CRM por acidente.
 */
import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';

import { garimpooSearchSchema, garimpooActivateSchema, garimpooLoginSchema } from '../../../shared/schemas';
import { getEnv, hasGoogleKey, isGarimpooEnabled } from '../../config/env';
import { getDb } from '../../db/client';
import { forbidden, serviceUnavailable, unauthorized } from '../../lib/errors';
import { asyncHandler, parseBody } from '../../lib/http';
import { newId } from '../../lib/ids';
import { searchPlaces, type SearchResultItem } from '../google/service';
import * as repo from './repository';
import {
  GARIMPOO_DEVICE_COOKIE,
  GARIMPOO_SESSION_COOKIE,
  activateAccess,
  assertQuotaAvailable,
  checkWebhookSecret,
  handleCaktoEvent,
  login,
  logout,
  quotaStatus,
  resolveSession,
  type SessionContext,
} from './service';

export const garimpooRouter: Router = Router();

declare module 'express-serve-static-core' {
  interface Request {
    garimpoo?: SessionContext;
  }
}

const emProducao = (): boolean => getEnv().NODE_ENV === 'production';

/** Um ano: o dispositivo precisa sobreviver a varios logins. */
const DEVICE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Garante o cookie de dispositivo.
 *
 * E ele que prende a sessao a um navegador. Emitido na primeira visita, antes
 * mesmo do login, para que a pessoa ja chegue identificada na hora de entrar.
 */
const ensureDevice = (req: Request, res: Response): string => {
  const cookies = (req.cookies ?? {}) as Record<string, string>;
  const existente = cookies[GARIMPOO_DEVICE_COOKIE];
  if (existente) return existente;

  const novo = newId();
  res.cookie(GARIMPOO_DEVICE_COOKIE, novo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: emProducao(),
    maxAge: DEVICE_MAX_AGE_MS,
    path: '/',
  });
  return novo;
};

const deviceLabel = (req: Request): string | null => {
  const agent = req.get('user-agent') ?? '';
  if (!agent) return null;
  const sistema = /Android/i.test(agent)
    ? 'Android'
    : /iPhone|iPad/i.test(agent)
      ? 'iPhone'
      : /Windows/i.test(agent)
        ? 'Windows'
        : /Mac/i.test(agent)
          ? 'Mac'
          : 'Outro';
  return sistema.slice(0, 120);
};

/** Modulo desligado responde 404: nao anuncia rota que nao deveria existir. */
const requireModule = asyncHandler(async (_req, res, next) => {
  if (!isGarimpooEnabled()) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurso nao encontrado.' } });
    return;
  }
  next();
});

garimpooRouter.use(requireModule);

/** Exige sessao valida no dispositivo certo. */
const requireMember = asyncHandler(async (req, _res, next) => {
  const cookies = (req.cookies ?? {}) as Record<string, string>;
  const contexto = await resolveSession(
    cookies[GARIMPOO_SESSION_COOKIE],
    cookies[GARIMPOO_DEVICE_COOKIE],
    getDb(),
  );

  if (!contexto) throw unauthorized('Entre de novo para continuar.');
  req.garimpoo = contexto;
  next();
});

// ---------------------------------------------------------------------------
// Webhook da Cakto
// ---------------------------------------------------------------------------

/**
 * Sempre responde 200 quando o segredo confere, mesmo para evento ignorado:
 * a plataforma reenvia o que nao recebe 200, e reenvio eterno de um evento
 * que nunca vamos entender so gera ruido.
 */
garimpooRouter.post(
  '/garimpoo/webhooks/cakto',
  rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }),
  asyncHandler(async (req, res) => {
    const segredo =
      req.get('x-cakto-signature') ??
      req.get('x-webhook-secret') ??
      (typeof req.query.secret === 'string' ? req.query.secret : undefined);

    if (!checkWebhookSecret(segredo)) {
      throw forbidden('Assinatura do webhook invalida.');
    }

    const resultado = await handleCaktoEvent(req.body ?? {}, getDb());
    res.json({ ok: true, ...resultado });
  }),
);

// ---------------------------------------------------------------------------
// Acesso
// ---------------------------------------------------------------------------

const limiteDeTentativas = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Aguarde alguns minutos.' },
  },
  skip: () => getEnv().NODE_ENV === 'test',
});

garimpooRouter.post(
  '/garimpoo/ativar',
  limiteDeTentativas,
  asyncHandler(async (req, res) => {
    const input = parseBody(garimpooActivateSchema, req);
    await activateAccess(input, getDb());

    // Ativou, ja entra: pedir a senha logo depois de cria-la seria atrito a toa.
    const device = ensureDevice(req, res);
    const sessao = await login(
      {
        email: input.email,
        password: input.password,
        deviceId: device,
        deviceLabel: deviceLabel(req),
        ip: req.ip,
      },
      getDb(),
    );

    definirCookieDeSessao(res, sessao.token, sessao.expiresAt);
    res.status(201).json({ ok: true, member: publicMember(sessao.member) });
  }),
);

garimpooRouter.post(
  '/garimpoo/entrar',
  limiteDeTentativas,
  asyncHandler(async (req, res) => {
    const input = parseBody(garimpooLoginSchema, req);
    const device = ensureDevice(req, res);

    const sessao = await login(
      {
        email: input.email,
        password: input.password,
        deviceId: device,
        deviceLabel: deviceLabel(req),
        ip: req.ip,
      },
      getDb(),
    );

    definirCookieDeSessao(res, sessao.token, sessao.expiresAt);
    res.json({ ok: true, member: publicMember(sessao.member) });
  }),
);

garimpooRouter.post(
  '/garimpoo/sair',
  requireMember,
  asyncHandler(async (req, res) => {
    await logout(req.garimpoo!.session.id, getDb());
    res.clearCookie(GARIMPOO_SESSION_COOKIE, { path: '/' });
    res.json({ ok: true });
  }),
);

garimpooRouter.get(
  '/garimpoo/eu',
  requireMember,
  asyncHandler(async (req, res) => {
    const { member } = req.garimpoo!;
    res.json({
      member: publicMember(member),
      quota: await quotaStatus(member, getDb()),
      googleReady: hasGoogleKey(),
    });
  }),
);

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

const limiteDeBusca = rateLimit({
  windowMs: 60_000,
  limit: 12,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => getEnv().NODE_ENV === 'test',
});

garimpooRouter.post(
  '/garimpoo/buscar',
  requireMember,
  limiteDeBusca,
  asyncHandler(async (req, res) => {
    if (!hasGoogleKey()) {
      throw serviceUnavailable('A busca esta temporariamente indisponivel.', 'GARIMPOO_SEARCH_UNAVAILABLE');
    }

    const { member } = req.garimpoo!;
    const input = parseBody(garimpooSearchSchema, req);
    const db = getDb();

    await assertQuotaAvailable(member, db);

    const pageNumber = Number(req.query.page ?? 1);
    const controller = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    const resultado = await searchPlaces(
      db,
      {
        niche: input.niche,
        country: 'Brasil',
        state: input.state ?? null,
        city: input.city ?? null,
        region: null,
        websiteFilter: input.websiteFilter,
        requirePhone: input.requirePhone,
        serviceId: null,
        pageToken: input.pageToken ?? null,
        searchRunId: null,
      },
      { pageNumber: Number.isFinite(pageNumber) ? pageNumber : 1, signal: controller.signal },
    );

    await repo.logSearch(
      {
        memberId: member.id,
        niche: input.niche,
        city: input.city ?? null,
        state: input.state ?? null,
        resultCount: resultado.results.length,
        pageNumber: resultado.pageNumber,
        ipHash: null,
      },
      db,
    );

    res.json({
      results: resultado.results.map(paraPublico),
      nextPageToken: resultado.nextPageToken,
      pageNumber: resultado.pageNumber,
      hiddenByFilters: resultado.hiddenByFilters,
      notice: resultado.notice,
      attribution: resultado.attribution,
      quota: await quotaStatus(member, db),
    });
  }),
);

garimpooRouter.get(
  '/garimpoo/historico',
  requireMember,
  asyncHandler(async (req, res) => {
    res.json({ searches: await repo.recentSearches(req.garimpoo!.member.id, 12, getDb()) });
  }),
);

// ---------------------------------------------------------------------------
// Formatos publicos
// ---------------------------------------------------------------------------

function definirCookieDeSessao(res: Response, token: string, expiresAt: Date): void {
  res.cookie(GARIMPOO_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: emProducao(),
    expires: expiresAt,
    path: '/',
  });
}

const publicMember = (member: { email: string; name: string | null; status: string }) => ({
  email: member.email,
  name: member.name,
  status: member.status,
});

/**
 * Resultado sem nada do CRM.
 *
 * `existing` diz se a empresa ja e lead do CRM da Stavo -- informacao interna
 * que nao pode chegar a um membro da comunidade. Aqui ela e descartada de
 * proposito, e nao por esquecimento.
 */
function paraPublico(item: SearchResultItem) {
  return {
    placeId: item.placeId,
    name: item.name,
    address: item.address,
    category: item.category,
    rating: item.rating,
    userRatingCount: item.userRatingCount,
    phone: { display: item.phone.display, e164: item.phone.e164, isValid: item.phone.isValid },
    website: item.website,
    actions: item.actions,
    score: item.score,
    scoreReasons: item.scoreReasons,
  };
}
