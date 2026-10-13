/**
 * Rotas da integracao Google.
 *  POST /api/google/search           pesquisa (consome TEXT_SEARCH)
 *  GET  /api/google/places/:placeId  detalhes ao vivo (consome PLACE_DETAILS)
 *  POST /api/google/leads            adiciona um resultado ao CRM
 *  POST /api/google/instagram        analise manual do site do lead
 *  GET  /api/google/usage            consumo do mes
 */
import { Router } from 'express';
import { and, desc, eq, inArray } from 'drizzle-orm';
import rateLimit from 'express-rate-limit';

import { ATTRIBUTION_TEXT } from '../../../shared/constants';
import {
  addGooglePlaceSchema,
  findInstagramSchema,
  googleSearchSchema,
} from '../../../shared/schemas';
import { getEnv } from '../../config/env';
import { getDb } from '../../db/client';
import { leads, searchRuns } from '../../db/schema';
import { mapsLinkFromPlaceId } from '../../domain/links';
import { asyncHandler, parseBody } from '../../lib/http';
import { serviceUnavailable } from '../../lib/errors';
import { csrfProtection, requireAuth, requireCapability } from '../../middleware';
import { createLead } from '../leads/service';
import { findInstagramOnWebsite } from './instagram';
import { fetchLiveDetails, searchPlaces } from './service';
import { placePhotoMedia } from './client';
import { getUsageSummary } from './usage';

/** Protecao adicional contra cliques repetidos que gastariam quota. */
const googleRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => getEnv().NODE_ENV === 'test',
});

export const googleRouter: Router = Router();

googleRouter.use(requireAuth);

/**
 * Historico sem custo de API: os parametros de buscas anteriores e os leads
 * explicitamente salvos pelo usuario ja existem no banco do workspace.
 * NUNCA persista uma copia dos resultados transitorios do Google.
 */
googleRouter.get(
  '/google/history',
  requireCapability('GOOGLE_SEARCH'),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const workspaceId = req.session!.workspaceId;
    const runs = await db.select({
      id: searchRuns.id,
      niche: searchRuns.niche,
      country: searchRuns.country,
      state: searchRuns.state,
      city: searchRuns.city,
      region: searchRuns.regionOrNeighborhood,
      websiteFilter: searchRuns.websiteFilter,
      serviceId: searchRuns.selectedServiceId,
      pagesRequested: searchRuns.pagesRequested,
      resultCount: searchRuns.resultCount,
      createdAt: searchRuns.createdAt,
    }).from(searchRuns).where(eq(searchRuns.workspaceId,workspaceId))
      .orderBy(desc(searchRuns.createdAt)).limit(60);
    const runIds = runs.map(run=>run.id);
    const saved = runIds.length ? await db.select({
      searchRunId: leads.searchRunId,
      id: leads.id,
      name: leads.internalName,
      placeId: leads.placeId,
      status: leads.status,
      createdAt: leads.createdAt,
    }).from(leads).where(and(eq(leads.workspaceId,workspaceId),inArray(leads.searchRunId,runIds))) : [];
    const byRun = new Map<string,typeof saved>();
    for (const lead of saved) {
      if (!lead.searchRunId) continue;
      byRun.set(lead.searchRunId,[...(byRun.get(lead.searchRunId)||[]),lead]);
    }
    res.setHeader('Cache-Control','private, no-store');
    res.json({ searches:runs.map(run=>({
      ...run,
      savedLeads:byRun.get(run.id)||[],
    })) });
  }),
);

googleRouter.get(
  '/google/usage',
  asyncHandler(async (req, res) => {
    res.json({ usage: await getUsageSummary(getDb(), req.session!.workspaceId), attribution: ATTRIBUTION_TEXT });
  }),
);

googleRouter.post(
  '/google/search',
  csrfProtection,
  requireCapability('GOOGLE_SEARCH'),
  googleRateLimit,
  asyncHandler(async (req, res) => {
    const input = parseBody(googleSearchSchema, req);
    // Cada pagina e pedida explicitamente pelo usuario: nada e pre-carregado.
    const pageNumber = Number(req.query.page ?? 1);

    const controller = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    const result = await searchPlaces(getDb(), req.session!.workspaceId, input, {
      pageNumber: Number.isFinite(pageNumber) ? pageNumber : 1,
      signal: controller.signal,
    });

    res.json(result);
  }),
);

googleRouter.get(
  '/google/places/:placeId',
  requireCapability('GOOGLE_SEARCH'),
  googleRateLimit,
  asyncHandler(async (req, res) => {
    const controller = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) controller.abort();
    });

    const details = await fetchLiveDetails(getDb(), req.session!.workspaceId, req.params.placeId!, controller.signal);
    res.json({ details });
  }),
);

googleRouter.get(
  '/google/photos/media',
  requireCapability('GOOGLE_SEARCH'),
  googleRateLimit,
  asyncHandler(async (req, res) => {
    const name = typeof req.query.name === 'string' ? req.query.name : '';
    const width = typeof req.query.width === 'string' ? Number(req.query.width) : 1600;
    const controller = new AbortController();
    req.on('close', () => { if (!res.writableEnded) controller.abort(); });
    const upstream = await placePhotoMedia(name, Number.isFinite(width) ? width : 1600, controller.signal);
    if (!upstream.ok || !upstream.body) throw serviceUnavailable('Nao foi possivel carregar a foto do Google.', 'GOOGLE_PHOTO_UNAVAILABLE');
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    const bytes = Buffer.from(await upstream.arrayBuffer());
    res.send(bytes);
  }),
);

googleRouter.post(
  '/google/leads',
  csrfProtection,
  requireCapability('LEAD_CREATE'),
  asyncHandler(async (req, res) => {
    const input = parseBody(addGooglePlaceSchema, req);
    const db = getDb();

    // "Adicionar ao CRM" e a UNICA acao da pesquisa que cria lead.
    // Telefone, site/Instagram e o link do Maps entram automaticamente
    // quando presentes -- e a mesma consulta que ja apareceu no card, nunca
    // uma chamada nova ao Google. O WhatsApp nao precisa de campo proprio:
    // a tela do lead ja deriva o botao "Abrir WhatsApp" de qualquer contato
    // PHONE (ver queries.ts). Place ID e sempre permanente; o link do Maps
    // e derivado dele localmente, sem custo, exatamente como a importacao
    // por CSV ja faz para quem digita a URL na mao.
    const contacts: { type: 'PHONE'; value: string; isPrimary: boolean }[] = [];
    if (input.confirmedPhoneE164) {
      contacts.push({ type: 'PHONE', value: input.confirmedPhoneE164, isPrimary: true });
    }

    const links: { type: 'WEBSITE' | 'MAPS'; url: string; isPrimary: boolean }[] = [];
    if (input.confirmedWebsiteUrl) {
      // O tipo real (WEBSITE/INSTAGRAM/...) e reclassificado por
      // `insertLinks` a partir da URL -- nunca confiamos em rotulo do cliente.
      links.push({ type: 'WEBSITE', url: input.confirmedWebsiteUrl, isPrimary: false });
    }
    links.push({ type: 'MAPS', url: mapsLinkFromPlaceId(input.placeId), isPrimary: false });

    const result = await createLead(
      db,
      req.session!.workspaceId,
      {
        internalName: input.internalName,
        originType: 'GOOGLE_PLACE',
        sourceId: null,
        placeId: input.placeId,
        niche: input.niche ?? null,
        country: input.country ?? null,
        state: input.state ?? null,
        city: input.city ?? null,
        address: null,
        campaignContext: input.region ?? null,
        notes: null,
        contacts,
        links,
        serviceId: input.serviceId ?? null,
        proposedPrice: null,
        nextFollowUpAt: null,
        allowSharedIdentity: false,
        sharedIdentityReason: null,
        ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      },
      {
        actorUserId: req.session!.user.id,
        originType: 'GOOGLE_PLACE',
        searchRunId: input.searchRunId ?? null,
        // MANUAL: o mesmo peso de qualquer dado digitado na hora de criar o
        // lead. Isto NAO e "confirmado" (isConfirmed=false) -- quem revisa
        // e promove a confirmado continua sendo o botao do drawer.
        dataOrigin: 'MANUAL',
      },
    );

    res.status(201).json({
      lead: {
        id: result.lead.id,
        internalName: result.lead.internalName,
        currentStageId: result.lead.currentStageId,
      },
      mapsUrl: mapsLinkFromPlaceId(input.placeId),
      duplicateReviewId: result.duplicateReviewId ?? null,
      message: 'Lead adicionado em Selecionados.',
    });
  }),
);

googleRouter.post(
  '/google/instagram',
  csrfProtection,
  requireCapability('GOOGLE_SEARCH'),
  rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => getEnv().NODE_ENV === 'test',
  }),
  asyncHandler(async (req, res) => {
    const input = parseBody(findInstagramSchema, req);
    // Analise manual, apenas da pagina informada, com protecao SSRF completa.
    res.json(await findInstagramOnWebsite(input.websiteUrl));
  }),
);
