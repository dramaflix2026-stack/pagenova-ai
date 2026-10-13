/**
 * Histórico persistido por workspace.
 * A visualização usa exclusivamente registros existentes no banco;
 * nunca dispara uma nova pesquisa no Google Places.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Building2, CalendarDays, CheckCircle2, ChevronDown,
  ChevronUp, Clock3, History, MapPin, RotateCcw, Search,
  Sparkles, UsersRound, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageBody } from '../components/layout/AppLayout';
import { api } from '../lib/api';

type HistoryRow = {
  id: string;
  niche: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  region: string | null;
  websiteFilter: string | null;
  serviceId: string | null;
  pagesRequested: number;
  resultCount: number;
  createdAt: string;
  savedLeads: Array<{
    id: string;
    name: string;
    placeId: string | null;
    status: string;
    createdAt: string;
  }>;
};

type Filter = 'all' | 'saved' | 'empty';

function existingSearchUrl(item: HistoryRow) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({
    niche: item.niche,
    country: item.country,
    state: item.state,
    city: item.city,
    region: item.region,
    websiteFilter: item.websiteFilter,
    serviceId: item.serviceId,
  })) {
    if (value) params.set(key, value);
  }
  return '/buscar?' + params.toString();
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Data não disponível' :
    parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function searchText(item: HistoryRow) {
  return [
    item.niche, item.region, item.city, item.state, item.country,
    ...item.savedLeads.map(lead => lead.name),
  ].filter(Boolean).join(' ').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function SearchHistoryPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const history = useQuery({
    queryKey: ['google-search-history'],
    queryFn: () => api.get<{ searches: HistoryRow[] }>('/google/history'),
    staleTime: 60_000,
  });

  const rows = history.data?.searches || [];
  const stored = rows.reduce((sum, item) => sum + item.savedLeads.length, 0);
  const savedSearches = rows.filter(item => item.savedLeads.length > 0).length;

  const visibleRows = useMemo(() => {
    const text = query.trim().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return rows.filter(item => {
      if (filter === 'saved' && !item.savedLeads.length) return false;
      if (filter === 'empty' && item.savedLeads.length) return false;
      return !text || searchText(item).includes(text);
    });
  }, [rows, query, filter]);

  const filters: Array<{ id: Filter; label: string; count: number }> = [
    { id: 'all', label: 'Todas', count: rows.length },
    { id: 'saved', label: 'Com contatos', count: savedSearches },
    { id: 'empty', label: 'Sem contatos', count: rows.length - savedSearches },
  ];

  return (
    <PageBody className="min-h-full space-y-5 bg-[#090e18] pb-10 text-slate-100 sm:space-y-6 sm:pb-12">
      {/* The embedded PageNova shell already renders the page title. Avoid a second header. */}
      <section className="relative overflow-hidden rounded-[22px] border border-emerald-400/[.18] bg-gradient-to-br from-[#10281f] via-[#101b1d] to-[#0d1420] px-5 py-5 sm:px-7 sm:py-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-400/[.10] blur-[65px]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300/85">
              <Sparkles className="h-3.5 w-3.5" />
              Inteligência comercial
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Seu histórico de prospecção
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-5 text-slate-300/70 sm:text-sm sm:leading-6">
              Retome pesquisas e encontre empresas que já passaram pelo seu radar.
            </p>
          </div>
          <Link to="/buscar" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#04251b] transition hover:bg-emerald-300 sm:text-sm">
            <Search className="h-4 w-4" />
            Nova pesquisa
          </Link>
        </div>

        <div className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/[.07] bg-black/20 py-3 sm:mt-6 sm:py-4">
          <div className="min-w-0 px-2 text-center sm:px-5">
            <p className="text-xl font-bold tabular-nums text-white sm:text-2xl">{rows.length}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs">Pesquisas</p>
          </div>
          <div className="min-w-0 px-2 text-center sm:px-5">
            <p className="text-xl font-bold tabular-nums text-white sm:text-2xl">{stored}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs">Contatos salvos</p>
          </div>
          <div className="min-w-0 px-2 text-center sm:px-5">
            <p className="text-lg font-extrabold text-emerald-300 sm:text-xl">Grátis</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs">Consultar histórico</p>
          </div>
        </div>
      </section>

      <section aria-label="Filtrar pesquisas" className="space-y-3">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            aria-label="Pesquisar no histórico"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por nicho, cidade ou empresa..."
            className="h-12 w-full rounded-xl border border-white/10 bg-[#111824] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/55 focus:ring-2 focus:ring-emerald-400/[.08]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              aria-label="Limpar pesquisa"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex max-w-full flex-wrap items-center gap-2" role="group" aria-label="Filtrar pelo estado dos contatos">
            {filters.map(option => (
              <button key={option.id} type="button" aria-pressed={filter === option.id}
                onClick={() => setFilter(option.id)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                  filter === option.id
                    ? 'border-emerald-400/50 bg-emerald-400/[.14] text-emerald-200'
                    : 'border-white/10 bg-[#121824] text-slate-400 hover:border-white/25 hover:text-white'
                }`}>
                {option.label} <span className="ml-1 tabular-nums opacity-60">{option.count}</span>
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">{visibleRows.length} de {rows.length} pesquisas</span>
        </div>
      </section>

      {history.isLoading && (
        <div role="status" className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="h-44 animate-pulse rounded-2xl border border-white/[.07] bg-white/[.035]" />
          ))}
        </div>
      )}

      {history.isError && (
        <div role="alert" className="rounded-2xl border border-red-400/25 bg-red-400/[.06] px-5 py-6 text-center">
          <p className="text-sm text-red-200">Não foi possível carregar seu histórico.</p>
          <button type="button" onClick={() => void history.refetch()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2 text-sm text-white hover:bg-white/5">
            <RotateCcw className="h-4 w-4" /> Tentar novamente
          </button>
        </div>
      )}

      {!history.isLoading && !history.isError && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#111824] px-6 py-12 text-center">
          <Building2 className="mx-auto h-9 w-9 text-emerald-300/65" />
          <h2 className="mt-4 text-lg font-semibold text-white">Sua primeira pesquisa começa aqui</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Pesquise um nicho e os contatos salvos ficarão disponíveis neste histórico.
          </p>
          <Link to="/buscar" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-bold text-[#04251b]">
            Buscar empresas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {!history.isLoading && !history.isError && rows.length > 0 && visibleRows.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#111824] px-6 py-10 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-500" />
          <h2 className="mt-3 font-semibold text-white">Nenhuma pesquisa encontrada</h2>
          <p className="mt-2 text-sm text-slate-400">Tente outro termo ou remova os filtros.</p>
          <button type="button" onClick={() => { setQuery(''); setFilter('all'); }}
            className="mt-4 rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-emerald-200">
            Limpar filtros
          </button>
        </div>
      )}

      <div className="grid items-start gap-3 sm:grid-cols-2 sm:gap-4">
        {visibleRows.map(item => {
          const count = item.savedLeads.length;
          const isExpanded = !!expanded[item.id];
          const location = [item.region, item.city, item.state, item.country]
            .filter(Boolean).filter((value, index, values) => values.indexOf(value) === index).join(' · ');
          return (
            <article key={item.id}
              className={`min-w-0 overflow-hidden rounded-[20px] border bg-[#111824] transition duration-200 hover:border-emerald-400/30 ${
                isExpanded ? 'border-emerald-400/30 shadow-[0_15px_35px_rgba(0,0,0,.20)]'
                  : 'border-white/[.08]'
              }`}>
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[.08] text-emerald-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                    count ? 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-300'
                      : 'border-white/10 bg-white/[.035] text-slate-400'
                  }`}>
                    {count ? 'Com contatos' : 'Sem contatos'}
                  </div>
                </div>

                <h2 className="mt-3 break-words text-lg font-bold capitalize tracking-tight text-white sm:text-xl">
                  {item.niche || 'Pesquisa de empresas'}
                </h2>
                <p className="mt-1 flex min-w-0 items-start gap-1.5 break-words text-xs leading-5 text-slate-400 sm:text-sm">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/65" />
                  {location || 'Região não especificada'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/[.07] pt-3 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(item.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    {item.resultCount} resultado{item.resultCount === 1 ? '' : 's'} na época
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[.05] bg-black/[.17] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <UsersRound className={count ? 'h-4 w-4 text-emerald-300' : 'h-4 w-4 text-slate-500'} />
                    <strong className="text-sm tabular-nums text-white">{count}</strong>
                    <span className="text-xs text-slate-400">contato{count === 1 ? '' : 's'} salvo{count === 1 ? '' : 's'}</span>
                  </div>
                  {count > 0 && (
                    <button type="button" aria-expanded={isExpanded}
                      aria-controls={'saved-leads-' + item.id}
                      onClick={() => setExpanded(current => ({ ...current, [item.id]: !current[item.id] }))}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10">
                      {isExpanded ? 'Recolher' : 'Ver contatos'}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                {count > 0 && (
                  <div id={'saved-leads-' + item.id} hidden={!isExpanded}>
                    {isExpanded && (
                      <div className="mt-3 space-y-1.5">
                        {item.savedLeads.map(lead => (
                          <div key={lead.id} className="flex items-start justify-between gap-3 rounded-lg bg-white/[.035] px-3 py-2.5">
                            <span className="min-w-0 break-words text-xs leading-5 text-slate-200">{lead.name}</span>
                            <Link to="/crm" className="shrink-0 whitespace-nowrap text-xs font-semibold text-emerald-300 hover:underline">
                              Ver CRM
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Link to={existingSearchUrl(item)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[.07] px-4 py-3 text-xs font-bold text-emerald-200 transition hover:border-emerald-400/50 hover:bg-emerald-400/[.13] sm:text-sm">
                  Reutilizar filtros <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {rows.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-white/[.07] bg-white/[.025] px-4 py-3 text-xs leading-5 text-slate-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p>
            Este histórico usa dados já registrados: abri-lo ou reutilizar filtros não gera chamadas ao Google.
            Resultados antigos que não foram salvos como leads não ficam disponíveis aqui.
            Uma nova busca só é feita quando você clicar em Pesquisar.
          </p>
        </div>
      )}
      {rows.length >= 60 && (
        <p className="text-center text-xs text-slate-500">Exibindo as 60 pesquisas mais recentes.</p>
      )}
    </PageBody>
  );
}
