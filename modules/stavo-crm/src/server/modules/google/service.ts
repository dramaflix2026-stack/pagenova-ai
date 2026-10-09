/**
 * Orquestracao da pesquisa e dos detalhes ao vivo.
 *
 * Politica de persistencia (regra central do produto):
 *  - o resultado do Google e TRANSITORIO: existe apenas na resposta HTTP;
 *  - nada de nome, endereco, telefone, nota, avaliacoes, categoria ou website
 *    retornado pelo Google e gravado automaticamente;
 *  - so o place_id, o contexto de prospeccao digitado pelo usuario e os dados
 *    que ele confirmar explicitamente viram registro permanente.
 */
import { and, eq, inArray } from 'drizzle-orm';

import { ATTRIBUTION_TEXT, type BusinessStatus } from '../../../shared/constants';
import type { GoogleSearchInput } from '../../../shared/schemas';
import type { Database } from '../../db/client';
import { leads, searchRuns, stages } from '../../db/schema';
import {
  classifyWebsite,
  instagramSearchUrl,
  mapsLinkFromPlaceId,
  matchesWebsiteFilter,
  whatsappLink,
} from '../../domain/links';
import { normalizePhone, type NormalizedPhone } from '../../domain/normalize';
import { scoreLead, type ScoreReason } from '../../domain/scoring';
import { newId } from '../../lib/ids';
import { mapBusinessStatus, placeDetails, textSearch, type GooglePlaceRaw } from './client';
import { reserveUsage } from './usage';
import { releaseWorkspaceQuota, reserveWorkspaceQuota, workspaceQuotasEnabled } from '../billing/workspace-usage';
import { changeSubscriberGooglePage, type GoogleCycleQuota } from '../billing/subscriber-google-ledger';

export interface SearchResultItem {
  placeId: string;
  name: string;
  address: string | null;
  category: string | null;
  businessStatus: BusinessStatus;
  rating: number | null;
  userRatingCount: number | null;
  phone: {
    display: string | null;
    e164: string | null;
    isValid: boolean;
    type: NormalizedPhone['type'];
  };
  website: {
    url: string | null;
    classification: string;
    label: string;
  };
  actions: {
    /** Sempre rotulado como nao confirmado: o Google nao informa WhatsApp. */
    whatsappUrl: string | null;
    callUrl: string | null;
    instagramUrl: string | null;
    instagramSearchUrl: string;
    mapsUrl: string;
  };
  score: number;
  scoreReasons: ScoreReason[];
  /** Preenchido quando o local ja existe no CRM. */
  existing: { leadId: string; internalName: string; stageName: string; createdAt: Date } | null;
}

export interface SearchResponse {
  results: SearchResultItem[];
  nextPageToken: string | null;
  pageNumber: number;
  searchRunId: string;
  usage: { used: number; limit: number; warning: boolean };
  attribution: string;
  /** Quantos resultados a pagina trouxe antes dos filtros locais. */
  rawCount: number;
  hiddenByFilters: number;
  notice: string | null;
}

/** Monta a consulta textual a partir dos campos do formulario. */
export function buildTextQuery(input: GoogleSearchInput): string {
  return [input.niche, input.region, input.city, input.state, input.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

export async function searchPlaces(
  db: Database,
  workspaceId: string,
  input: GoogleSearchInput,
  options: { pageNumber: number; signal?: AbortSignal; subscriberCycle?: GoogleCycleQuota } = { pageNumber: 1 },
): Promise<SearchResponse> {
  // Cada pagina realmente solicitada consome uma unidade da SKU TEXT_SEARCH.
  // Customer quota is reserved first; if the global Google budget refuses the call,
  // compensate the customer reservation before any paid provider request.
  const quotaNow = new Date();
  const customerReserved = !options.subscriberCycle && workspaceQuotasEnabled();
  if (options.subscriberCycle) await changeSubscriberGooglePage(options.subscriberCycle, 1);
  if (customerReserved) await reserveWorkspaceQuota(db, workspaceId, 'googleSearchPages', quotaNow);
  let usage: Awaited<ReturnType<typeof reserveUsage>>;
  try {
    usage = await reserveUsage(db, workspaceId, 'TEXT_SEARCH');
  } catch (error) {
    if (options.subscriberCycle) {
      try { await changeSubscriberGooglePage(options.subscriberCycle, -1); }
      catch (refundError) { console.error('[PageNova] Google subscriber refund failed', refundError); }
    }
    if (customerReserved) {
      try {
        await releaseWorkspaceQuota(db, workspaceId, 'googleSearchPages', quotaNow);
      } catch (refundError) {
        console.error('[PageNova] Could not refund quota after Google budget rejection', refundError);
      }
    }
    throw error;
  }

  const textQuery = buildTextQuery(input);
  const response = await textSearch({
    textQuery,
    pageToken: input.pageToken ?? null,
    signal: options.signal,
  });

  const mapped = response.places.map((place) => mapPlace(place));

  // Permanentemente fechado sai por padrao. "Fechado agora" NUNCA e filtrado:
  // horario de funcionamento nao diz nada sobre a empresa estar ativa.
  const operational = mapped.filter((item) => item.businessStatus !== 'CLOSED_PERMANENTLY');

  const filtered = operational.filter((item) => {
    if (input.requirePhone && !item.phone.e164) return false;
    return matchesWebsiteFilter(item.website.classification as never, input.websiteFilter);
  });

  const withExisting = await annotateExisting(db, workspaceId, filtered);

  const searchRunId = input.searchRunId ?? (await createSearchRun(db, workspaceId, input, textQuery));
  await bumpSearchRun(db, searchRunId, withExisting.length);

  const hiddenByFilters = operational.length - filtered.length;

  return {
    results: withExisting,
    nextPageToken: response.nextPageToken,
    pageNumber: options.pageNumber,
    searchRunId,
    usage,
    attribution: ATTRIBUTION_TEXT,
    rawCount: response.places.length,
    hiddenByFilters,
    notice:
      options.pageNumber >= 3
        ? 'Esta e a terceira e ultima pagina desta consulta. Os resultados nao representam todas as empresas da cidade.'
        : null,
  };
}

/** Converte a resposta do Google no formato transitorio da interface. */
export function mapPlace(place: GooglePlaceRaw): SearchResultItem {
  const rawPhone = place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? null;
  const phone = normalizePhone(rawPhone);
  const website = classifyWebsite(place.websiteUri ?? null);
  const businessStatus = mapBusinessStatus(place.businessStatus);
  const name = place.displayName?.text ?? 'Empresa sem nome no Google';

  const scored = scoreLead({
    phone: phone.isValid ? phone : null,
    classification: website.classification,
    businessStatus,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
  });

  return {
    placeId: place.id,
    name,
    address: place.formattedAddress ?? null,
    category: place.primaryTypeDisplayName?.text ?? null,
    businessStatus,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    phone: {
      display: rawPhone,
      e164: phone.e164,
      isValid: phone.isValid,
      type: phone.type,
    },
    website: {
      url: website.url,
      classification: website.classification,
      label: website.label,
    },
    actions: {
      // Movel ou tipo incerto recebem o link, sempre rotulado como nao confirmado.
      whatsappUrl: phone.e164 && phone.type !== 'FIXED_LINE' ? whatsappLink(phone.e164) : null,
      callUrl: phone.e164 ? `tel:${phone.e164}` : null,
      instagramUrl: website.classification === 'INSTAGRAM' ? website.url : null,
      instagramSearchUrl: instagramSearchUrl(name, place.formattedAddress ?? null),
      mapsUrl: place.googleMapsUri ?? mapsLinkFromPlaceId(place.id),
    },
    score: scored.score,
    scoreReasons: scored.reasons,
    existing: null,
  };
}

/** Marca resultados que ja estao no CRM, informando a etapa atual. */
async function annotateExisting(
  db: Database,
  workspaceId: string,
  items: SearchResultItem[],
): Promise<SearchResultItem[]> {
  if (items.length === 0) return items;

  const placeIds = items.map((item) => item.placeId);
  const rows = await db
    .select({
      leadId: leads.id,
      placeId: leads.placeId,
      internalName: leads.internalName,
      stageName: stages.name,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .innerJoin(stages, eq(stages.id, leads.currentStageId))
    .where(and(eq(leads.workspaceId, workspaceId), inArray(leads.placeId, placeIds)));

  const byPlaceId = new Map(rows.map((row) => [row.placeId!, row]));

  return items.map((item) => {
    const existing = byPlaceId.get(item.placeId);
    return existing
      ? {
          ...item,
          existing: {
            leadId: existing.leadId,
            internalName: existing.internalName,
            stageName: existing.stageName,
            createdAt: existing.createdAt,
          },
        }
      : item;
  });
}

/** Guarda APENAS os metadados da pesquisa, nunca o conteudo dos resultados. */
async function createSearchRun(
  db: Database,
  workspaceId: string,
  input: GoogleSearchInput,
  textQuery: string,
): Promise<string> {
  const id = newId();
  await db.insert(searchRuns).values({
    workspaceId,
    id,
    queryText: textQuery.slice(0, 255),
    niche: input.niche,
    country: input.country ?? null,
    state: input.state ?? null,
    city: input.city ?? null,
    regionOrNeighborhood: input.region ?? null,
    selectedServiceId: input.serviceId ?? null,
    websiteFilter: input.websiteFilter,
    pagesRequested: 0,
    resultCount: 0,
    createdAt: new Date(),
  });
  return id;
}

async function bumpSearchRun(db: Database, id: string, resultCount: number): Promise<void> {
  const [run] = await db.select().from(searchRuns).where(eq(searchRuns.id, id)).limit(1);
  if (!run) return;

  await db
    .update(searchRuns)
    .set({
      pagesRequested: run.pagesRequested + 1,
      resultCount: run.resultCount + resultCount,
    })
    .where(eq(searchRuns.id, id));
}

export interface LivePlaceDetails {
  placeId: string;
  name: string;
  address: string | null;
  category: string | null;
  businessStatus: BusinessStatus;
  rating: number | null;
  userRatingCount: number | null;
  phone: { display: string | null; e164: string | null; isValid: boolean; type: string };
  website: { url: string | null; classification: string; label: string };
  mapsUrl: string;
  whatsappUrl: string | null;
  attribution: string;
  fetchedAt: string;
  photos: Array<{ name: string; widthPx: number | null; heightPx: number | null; attribution: string | null }>;
}

/**
 * Detalhes ao vivo de um lead do Google.
 * O retorno e enviado ao navegador e descartado: nada e gravado.
 */
export async function fetchLiveDetails(
  db: Database,
  workspaceId: string,
  placeId: string,
  signal?: AbortSignal,
): Promise<LivePlaceDetails> {
  await reserveUsage(db, workspaceId, 'PLACE_DETAILS');

  const place = await placeDetails(placeId, signal);
  const mapped = mapPlace(place);

  return {
    placeId: mapped.placeId,
    name: mapped.name,
    address: mapped.address,
    category: mapped.category,
    businessStatus: mapped.businessStatus,
    rating: mapped.rating,
    userRatingCount: mapped.userRatingCount,
    phone: mapped.phone,
    website: mapped.website,
    mapsUrl: mapped.actions.mapsUrl,
    whatsappUrl: mapped.actions.whatsappUrl,
    attribution: ATTRIBUTION_TEXT,
    fetchedAt: new Date().toISOString(),
    photos: (place.photos ?? []).filter((photo) => Boolean(photo.name)).slice(0, 8).map((photo) => ({
      name: photo.name!,
      widthPx: photo.widthPx ?? null,
      heightPx: photo.heightPx ?? null,
      attribution: photo.authorAttributions?.map((item) => item.displayName).filter(Boolean).join(', ') || null,
    })),
  };
}
