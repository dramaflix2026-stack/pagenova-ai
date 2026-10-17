/**
 * Buscar empresas (Google Places API oficial, via backend).
 *
 * Regras visiveis nesta tela:
 *  - cada pagina e pedida explicitamente ("Carregar mais"), nunca automatica;
 *  - o consumo aproximado e sempre informado antes e depois da busca;
 *  - "Adicionar ao CRM" e a UNICA acao que cria lead;
 *  - WhatsApp aparece sempre como NAO confirmado;
 *  - a atribuicao do Google fica no mesmo bloco visual dos resultados.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Building2,
  ExternalLink,
  Instagram,
  MapPin,
  MessageCircle,
  PhoneCall,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ATTRIBUTION_TEXT, WEBSITE_FILTER_LABELS, WEBSITE_FILTERS } from '@shared/constants';
import { formatNumber, formatPhone } from '@shared/format';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  Checkbox,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Label,
  LoadingBlock,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { ApiError, api, newIdempotencyKey } from '../lib/api';
import { ordenarResultados, type SearchResultItem, type SortOption } from '../lib/searchResults';
import { useServices } from '../hooks/useCrm';
import { useCidades, useEstados } from '../hooks/useLocations';
import { semAcento } from '../lib/utils';
import { countryCodeForName, countryOptions, citySuggestions } from '@shared/country-options';

interface SearchResponse {
  results: SearchResultItem[];
  nextPageToken: string | null;
  pageNumber: number;
  searchRunId: string;
  usage: { used: number; limit: number; warning: boolean };
  attribution: string;
  rawCount: number;
  hiddenByFilters: number;
  notice: string | null;
}

/** Resume o motivo tecnico devolvido pelo Google, quando houver. */
function formatarDetalhe(erro: ApiError): string | null {
  const d = erro.details as
    | {
        googleStatus?: number;
        googleReason?: string | null;
        googleMessage?: string | null;
        networkCode?: string;
        attempts?: number;
      }
    | undefined;
  if (!d) return null;
  const partes = [
    d.googleStatus ? `HTTP ${d.googleStatus}` : null,
    d.googleReason ?? null,
    d.googleMessage ?? null,
    d.networkCode ? `rede: ${d.networkCode}` : null,
    d.attempts ? `tentativas: ${d.attempts}` : null,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : null;
}

const EMPTY = '__nenhum__';

export default function SearchPage() {
  const toast = useToast();
  const services = useServices();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    niche: '',
    country: 'Brasil',
    state: '',
    city: '',
    region: '',
    websiteFilter: 'ALL' as (typeof WEBSITE_FILTERS)[number],
    requirePhone: true,
    serviceId: '',
  });

  // Ao reutilizar uma pesquisa antiga, apenas restaura parametros locais.
  // A consulta ao Google acontece SOMENTE quando o usuario clica Pesquisar.
  useEffect(() => {
    if (!searchParams.get('niche')) return;
    const key = (name:string,max:number) => (searchParams.get(name)||'').slice(0,max);
    const website = key('websiteFilter',24);
    setForm(current=>({
      ...current,
      niche:key('niche',120),country:key('country',80)||'Brasil',
      state:key('state',80),city:key('city',120),region:key('region',120),
      serviceId:key('serviceId',26),
      websiteFilter:WEBSITE_FILTERS.includes(website as (typeof WEBSITE_FILTERS)[number])
        ? website as (typeof WEBSITE_FILTERS)[number] : 'ALL',
    }));
  },[searchParams]);

  // As listas de estado e municipio sao brasileiras. Com outro pais no campo,
  // os dois campos voltam a ser texto livre: oferecer municipios do Brasil
  // para uma busca em Portugal seria pior que nao oferecer nada.
  const ehBrasil = ['brasil', 'brazil', 'br'].includes(semAcento(form.country));
  // Native selects open Android/iOS's real option picker, unlike <datalist>
  // whose drop-down arrow is often inert in embedded mobile browsers.
  const selectedCountryCode=countryCodeForName(form.country);
  const knownCountry=countryOptions.some(item=>item.code===selectedCountryCode);
  const suggestedCities=useMemo(()=>citySuggestions(form.country),[form.country]);
  const [manualCity,setManualCity]=useState(false);
  const useCustomCity=!ehBrasil&&(manualCity||
    (!!form.city&&!suggestedCities.includes(form.city)));

  const estados = useEstados();
  const cidades = useCidades(ehBrasil ? form.state : '');

  const opcoesEstado = useMemo(
    () =>
      (estados.data?.states ?? []).map((estado) => ({
        value: estado.uf,
        label: estado.nome,
        // A sigla entra na busca: digitar "SP" tambem encontra Sao Paulo.
        hint: estado.uf,
      })),
    [estados.data],
  );

  const opcoesCidade = useMemo(
    () => (cidades.data?.cities ?? []).map((nome) => ({ value: nome, label: nome })),
    [cidades.data],
  );

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(0);
  const [searchRunId, setSearchRunId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('SCORE');
  const [error, setError] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [addTarget, setAddTarget] = useState<SearchResultItem | null>(null);

  const usage = useQuery({
    queryKey: ['google-usage'],
    queryFn: () =>
      api.get<{
        usage: {
          sku: string;
          used: number;
          limit: number;
          remaining: number;
          warning: boolean;
          blocked: boolean;
        }[];
      }>('/google/usage'),
    staleTime: 30_000,
  });

  // The CRM's /google/usage describes an internal, calendar-month Google Cloud
  // budget. It is NOT the customer's contracted PageNova search allowance.
  // The subscriber's authoritative balance comes from the PageNova Supabase
  // ledger through the same-origin endpoint (never from the shared CRM database).
  const subscriberCredits = useQuery({
    queryKey: ['pagenova-subscriber-search-credits'],
    queryFn: async () => {
      const response = await fetch('/api/credits', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Saldo de créditos indisponível');
      return (await response.json()) as {
        configured: boolean;
        contract?: { sites: number; google: number };
        balance?: {
          active: boolean;
          googleUsed?: number;
          googleLimit?: number;
          googleRemaining: number;
          startedAt?: string;
        };
      };
    },
    staleTime: 30_000,
    retry: 1,
  });
  const technicalSearchUsage = usage.data?.usage.find((entry) => entry.sku === 'TEXT_SEARCH');
  const balance = subscriberCredits.data?.configured ? subscriberCredits.data.balance : undefined;
  const hasConfirmedBalance = Boolean(
    balance?.active && Number.isFinite(balance.googleRemaining) && balance.googleRemaining >= 0,
  );
  const contractedSearchLimit = 150;
  const cycleLimit = hasConfirmedBalance && Number.isFinite(balance?.googleLimit)
    ? balance!.googleLimit! : contractedSearchLimit;
  const cycleRemaining = hasConfirmedBalance ? Math.max(0, balance!.googleRemaining) : null;
  const cycleUsed = cycleRemaining === null
    ? null
    : typeof balance?.googleUsed === 'number' && Number.isFinite(balance.googleUsed)
      ? Math.max(0, balance.googleUsed)
      : Math.max(0, cycleLimit - cycleRemaining);

  const search = useMutation({
    mutationFn: (input: { pageToken: string | null; page: number }) =>
      api.post<SearchResponse>(`/google/search?page=${input.page}`, {
        ...form,
        serviceId: form.serviceId || null,
        pageToken: input.pageToken,
        searchRunId: input.pageToken ? searchRunId : null,
      }),
    onSuccess: (data, variables) => {
      setResults((current) => (variables.pageToken ? [...current, ...data.results] : data.results));
      setPageToken(data.nextPageToken);
      setPageNumber(data.pageNumber);
      setSearchRunId(data.searchRunId);
      setError(null);
      setSearchNotice(data.notice);
      void usage.refetch();
      void subscriberCredits.refetch();
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Nao foi possivel pesquisar agora. Tente novamente em instantes.',
      );
      // Motivo tecnico devolvido pelo Google: sem ele, um erro de
      // configuracao vira tentativa e erro as cegas.
      setDetalhe(caught instanceof ApiError ? formatarDetalhe(caught) : null);
    },
  });

  const runSearch = () => {
    if (form.niche.trim().length < 2) {
      setError('Informe o nicho ou profissao que voce quer prospectar.');
      return;
    }
    setResults([]);
    setPageToken(null);
    setSearchRunId(null);
    setDetalhe(null);
    setSearchNotice(null);
    search.mutate({ pageToken: null, page: 1 });
  };

  const sorted = ordenarResultados(results, sortBy);

  return (
    <>
      <PageHeader
        title="Buscar empresas"
        description="Pesquisa oficial do Google Places, feita pelo servidor."
      />

      <PageBody className="space-y-4">
        <Callout
          tone={hasConfirmedBalance && cycleRemaining === 0 ? 'warning' : 'info'}
          title={hasConfirmedBalance && cycleUsed !== null
            ? `Pesquisas do seu ciclo: ${cycleUsed} de ${cycleLimit} utilizadas`
            : `Seu plano: até ${contractedSearchLimit} páginas de pesquisa por ciclo`}
        >
          {hasConfirmedBalance && cycleRemaining !== null
            ? `Restam ${cycleRemaining} páginas de pesquisa neste ciclo da assinatura. Cada página solicitada corresponde a uma consulta ao Google, com até 20 resultados.`
            : subscriberCredits.isLoading
              ? 'Verificando seus créditos individuais...'
              : subscriberCredits.data?.configured === false
                ? 'O saldo individual está em migração. A franquia é por ciclo da assinatura, não por mês do calendário. O consumo técnico da API não representa seus créditos.'
                : 'Não foi possível confirmar seu saldo individual agora. A franquia informada é contratual, não um saldo disponível verificado.'}
        </Callout>
        {technicalSearchUsage?.blocked ? (
          <Callout tone="warning" title="Busca temporariamente limitada pelo Google">
            O limite técnico do provedor foi atingido. Ele é diferente dos créditos da sua assinatura. Entre em contato com o suporte para verificar a liberação.
          </Callout>
        ) : null}

        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nicho ou profissao" htmlFor="search-niche" required>
                <Input
                  id="search-niche"
                  value={form.niche}
                  onChange={(event) => setForm((c) => ({ ...c, niche: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') runSearch();
                  }}
                  placeholder="Ex.: psicologos, pizzarias, dentistas"
                />
              </Field>

              <Field label="País" htmlFor="search-country">
                <select
                  id="search-country"
                  value={knownCountry && selectedCountryCode ? selectedCountryCode : '__other__'}
                  onChange={(event) => {
                    const code=event.target.value;
                    const option=countryOptions.find(item=>item.code===code);
                    setForm(current=>({...current,country:option?.name||'',state:'',city:'',region:''}));
                    setManualCity(false);
                  }}
                  className="flex h-11 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                  aria-label="Escolher país"
                >
                  {countryOptions.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}
                  <option value="__other__">Outro país (digitar)</option>
                </select>
                {!knownCountry&&<Input
                  id="search-country-other"
                  aria-label="Digite o nome do país"
                  value={form.country}
                  onChange={(event)=>setForm(current=>({...current,country:event.target.value,state:'',city:'',region:''}))}
                  placeholder="Digite o país que deseja pesquisar"
                  className="mt-2"
                />}
              </Field>

              <Field label={ehBrasil?"Estado":"Estado ou província"} htmlFor="search-state">
                {ehBrasil ? (
                  <>
                    <select
                      id="search-state"
                      value={form.state}
                      onChange={(event)=>setForm(current=>({...current,state:event.target.value,city:''}))}
                      disabled={estados.isLoading}
                      className="flex h-11 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 sm:text-sm"
                      aria-label="Escolher estado brasileiro"
                    >
                      <option value="">{estados.isLoading?"Carregando estados...":"Todos os estados"}</option>
                      {opcoesEstado.map(estado=><option key={estado.value} value={estado.value}>{estado.label} ({estado.value})</option>)}
                    </select>
                    {estados.isError&&<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-destructive">
                      Não foi possível carregar estados.
                      <button type="button" className="underline" onClick={()=>void estados.refetch()}>Tentar novamente</button>
                    </div>}
                  </>
                ) : (
                  <Input
                    id="search-state"
                    value={form.state}
                    onChange={(event)=>setForm(current=>({...current,state:event.target.value}))}
                    placeholder="Opcional: estado, região ou província"
                  />
                )}
              </Field>

              <Field
                label="Cidade"
                htmlFor="search-city"
                hint={ehBrasil&&!form.state?"Escolha um estado para ver as cidades.":undefined}
              >
                {ehBrasil ? (
                  <>
                    <select
                      id="search-city"
                      value={form.city}
                      disabled={!form.state||cidades.isFetching}
                      onChange={(event)=>setForm(current=>({...current,city:event.target.value}))}
                      className="flex h-11 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 sm:text-sm"
                      aria-label="Escolher cidade brasileira"
                    >
                      <option value="">{!form.state?"Escolha o estado primeiro":cidades.isFetching?"Carregando cidades...":"Todas as cidades"}</option>
                      {opcoesCidade.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    {cidades.isError&&form.state&&<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-destructive">
                      Não foi possível carregar as cidades deste estado.
                      <button type="button" className="underline" onClick={()=>void cidades.refetch()}>Tentar novamente</button>
                    </div>}
                  </>
                ) : (
                  <>
                    {suggestedCities.length>0&&<select
                      id="search-city"
                      value={useCustomCity?"__other__":form.city}
                      onChange={(event)=>{
                        const value=event.target.value;
                        setManualCity(value==="__other__");
                        setForm(current=>({...current,city:value==="__other__"?"":value}));
                      }}
                      className="flex h-11 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                      aria-label="Escolher cidade internacional"
                    >
                      <option value="">Todas as cidades</option>
                      {suggestedCities.map(city=><option key={city} value={city}>{city}</option>)}
                      <option value="__other__">Outra cidade (digitar)</option>
                    </select>}
                    {(suggestedCities.length===0||useCustomCity)&&<Input
                      id={suggestedCities.length===0?"search-city":"search-city-custom"}
                      aria-label="Digite a cidade"
                      value={form.city}
                      onChange={(event)=>setForm(current=>({...current,city:event.target.value}))}
                      placeholder="Digite qualquer cidade deste país"
                      className={suggestedCities.length?"mt-2":""}
                    />}
                    {suggestedCities.length>0&&<p className="mt-1 text-xs text-muted-foreground">
                      Cidades populares. Use “Outra cidade” para pesquisar qualquer município.
                    </p>}
                  </>
                )}
              </Field>

              <Field label="Bairro ou regiao" htmlFor="search-region">
                <Input
                  id="search-region"
                  value={form.region}
                  onChange={(event) => setForm((c) => ({ ...c, region: event.target.value }))}
                  placeholder="Opcional"
                />
              </Field>

              <Field
                label="Filtro de site"
                htmlFor="search-website"
                hint="Instagram, WhatsApp, Linktree e diretorios contam como sem site proprio."
              >
                <Select
                  value={form.websiteFilter}
                  onValueChange={(value) =>
                    setForm((c) => ({ ...c, websiteFilter: value as typeof c.websiteFilter }))
                  }
                >
                  <SelectTrigger id="search-website">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBSITE_FILTERS.map((filter) => (
                      <SelectItem key={filter} value={filter}>
                        {WEBSITE_FILTER_LABELS[filter]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Servico para associar" htmlFor="search-service">
                <Select
                  value={form.serviceId || EMPTY}
                  onValueChange={(value) =>
                    setForm((c) => ({ ...c, serviceId: value === EMPTY ? '' : value }))
                  }
                >
                  <SelectTrigger id="search-service">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY}>Nao associar</SelectItem>
                    {(services.data?.services ?? [])
                      .filter((service) => service.active)
                      .map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="search-require-phone"
                checked={form.requirePhone}
                onCheckedChange={(checked) =>
                  setForm((c) => ({ ...c, requirePhone: checked === true }))
                }
              />
              <Label htmlFor="search-require-phone" className="cursor-pointer text-sm font-normal">
                Esconder resultados sem telefone
              </Label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={runSearch} loading={search.isPending} loadingText="Pesquisando...">
                <Search className="h-4 w-4" aria-hidden="true" />
                Pesquisar
              </Button>
              <p className="text-xs text-muted-foreground">
                Cada página solicitada consulta o Google e traz até 20 resultados.
              </p>
            </div>

            {error ? (
              <div role="alert" className="space-y-1">
                <p className="text-sm text-destructive">{error}</p>
                {detalhe ? (
                  <p className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                    {detalhe}
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {searchNotice ? (
          <Callout tone="warning" title="Conferência de localização">
            {searchNotice}
          </Callout>
        ) : null}

        {search.isPending && results.length === 0 ? (
          <LoadingBlock label="Consultando o Google..." />
        ) : null}

        {search.isError && results.length === 0 ? (
          <ErrorState
            title="Pesquisa indisponivel"
            message={
              error ??
              'Nao foi possivel consultar o Google agora. O restante do CRM continua funcionando.'
            }
            onRetry={runSearch}
          />
        ) : null}

        {results.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {formatNumber(results.length)} resultado(s) exibido(s) · pagina {pageNumber} de no
                maximo 3
              </p>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Ordenar por
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-52" aria-label="Ordenar resultados">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCORE">Pontuacao (mais promissores)</SelectItem>
                    <SelectItem value="RELEVANCE">Relevancia do Google</SelectItem>
                    <SelectItem value="RATING">Nota</SelectItem>
                    <SelectItem value="REVIEWS">Numero de avaliacoes</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="grid gap-3">
              {sorted.map((result) => (
                <ResultCard
                  key={result.placeId}
                  result={result}
                  onAdd={() => setAddTarget(result)}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-2 py-2">
              {pageToken && pageNumber < 3 ? (
                <Button
                  variant="secondary"
                  loading={search.isPending}
                  onClick={() => search.mutate({ pageToken, page: pageNumber + 1 })}
                >
                  Carregar mais 20 resultados (consome 1 chamada)
                </Button>
              ) : null}

              <p className="text-center text-xs text-muted-foreground">
                Os resultados vem do Google e nao representam todas as empresas da cidade. A
                validacao final e sempre sua.
              </p>
              {/* Atribuicao obrigatoria, no mesmo contexto visual dos resultados. */}
              <p className="text-xs text-muted-foreground">{ATTRIBUTION_TEXT}</p>
            </div>
          </>
        ) : !search.isPending && !search.isError ? (
          <EmptyState
            title="Pesquise para comecar"
            description="Informe o nicho e a cidade. Empresas permanentemente fechadas ficam ocultas; quem esta apenas fora do horario continua aparecendo."
            icon={<Building2 className="h-6 w-6" aria-hidden="true" />}
          />
        ) : null}
      </PageBody>

      <AddToCrmDialog
        result={addTarget}
        form={form}
        searchRunId={searchRunId}
        onOpenChange={() => setAddTarget(null)}
        onAdded={(placeId, lead) => {
          setResults((current) =>
            current.map((item) =>
              item.placeId === placeId
                ? {
                    ...item,
                    existing: {
                      leadId: lead.id,
                      internalName: lead.name,
                      stageName: 'Selecionados',
                    },
                  }
                : item,
            ),
          );
          toast.success('Lead adicionado', 'O card foi criado em Selecionados.');
          setAddTarget(null);
        }}
      />
    </>
  );
}

function ResultCard({ result, onAdd }: { result: SearchResultItem; onAdd: () => void }) {
  const isTemporarilyClosed = result.businessStatus === 'CLOSED_TEMPORARILY';

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{result.name}</h3>
              {result.existing ? <Badge tone="primary">Ja esta no CRM</Badge> : null}
              {isTemporarilyClosed ? <Badge tone="warning">Fechada temporariamente</Badge> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[result.category, result.address].filter(Boolean).join(' · ')}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <Badge
              tone={result.score >= 70 ? 'success' : result.score >= 45 ? 'neutral' : 'outline'}
            >
              Pontuacao {result.score}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone={result.website.classification === 'OWN_WEBSITE' ? 'neutral' : 'primary'}>
            {result.website.label}
          </Badge>
          {result.rating ? (
            <Badge tone="outline">
              <Star className="h-3 w-3" aria-hidden="true" />
              {result.rating} ({formatNumber(result.userRatingCount ?? 0)})
            </Badge>
          ) : null}
          {result.phone.e164 ? (
            <Badge tone="outline">{formatPhone(result.phone.e164)}</Badge>
          ) : (
            <Badge tone="outline">Sem telefone</Badge>
          )}
        </div>

        {result.scoreReasons.length > 0 ? (
          <p className="text-xs text-muted-foreground">
            Motivos: {result.scoreReasons.map((reason) => reason.label).join(' · ')}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {result.actions.whatsappUrl ? (
            <Button variant="secondary" size="sm" asChild>
              <a href={result.actions.whatsappUrl} target="_blank" rel="noreferrer noopener">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Abrir WhatsApp — nao confirmado
              </a>
            </Button>
          ) : null}

          {result.actions.callUrl ? (
            <Button variant="secondary" size="sm" asChild>
              <a href={result.actions.callUrl}>
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                Ligar
              </a>
            </Button>
          ) : null}

          {result.actions.instagramUrl ? (
            <Button variant="secondary" size="sm" asChild>
              <a href={result.actions.instagramUrl} target="_blank" rel="noreferrer noopener">
                <Instagram className="h-4 w-4" aria-hidden="true" />
                Instagram
              </a>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <a href={result.actions.instagramSearchUrl} target="_blank" rel="noreferrer noopener">
                <Instagram className="h-4 w-4" aria-hidden="true" />
                Buscar Instagram
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild>
            <a href={result.actions.mapsUrl} target="_blank" rel="noreferrer noopener">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Google Maps
            </a>
          </Button>

          {result.existing ? (
            <Button size="sm" variant="secondary" disabled>
              Ja esta no CRM ({result.existing.stageName})
            </Button>
          ) : (
            <Button size="sm" onClick={onAdd}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Adicionar ao CRM
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Ao adicionar, o usuario define o nome interno do lead. */
function AddToCrmDialog({
  result,
  form,
  searchRunId,
  onOpenChange,
  onAdded,
}: {
  result: SearchResultItem | null;
  form: {
    niche: string;
    country: string;
    state: string;
    city: string;
    region: string;
    serviceId: string;
  };
  searchRunId: string | null;
  onOpenChange: (open: boolean) => void;
  onAdded: (placeId: string, lead: { id: string; name: string }) => void;
}) {
  const services = useServices();
  const [internalName, setInternalName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = Boolean(result);

  // Preenche o nome sugerido apenas como referencia transitoria ao abrir.
  useEffect(() => {
    if (!result) return;
    setInternalName(result.name);
    setServiceId(form.serviceId);
  }, [result, form.serviceId]);

  const submit = async () => {
    if (!result) return;
    if (!internalName.trim()) {
      setError('Informe o nome interno do lead.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await api.post<{ lead: { id: string; internalName: string } }>(
        '/google/leads',
        {
          placeId: result.placeId,
          internalName: internalName.trim(),
          serviceId: serviceId || null,
          niche: form.niche || null,
          country: form.country || null,
          state: form.state || null,
          city: form.city || null,
          region: form.region || null,
          searchRunId,
          idempotencyKey: newIdempotencyKey('gplace'),
          confirmedPhoneE164: result.phone.e164,
          confirmedWebsiteUrl: result.website.url,
        },
      );
      onAdded(result.placeId, { id: response.lead.id, name: response.lead.internalName });
      setInternalName('');
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Nao foi possivel adicionar o lead.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setInternalName('');
          setError(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Adicionar ao CRM</DialogTitle>
          <DialogDescription>
            O lead entra em Selecionados com o identificador do local, o contexto da sua
            prospeccao e o telefone/site/Maps que ja apareceram no card — sem nova consulta ao
            Google.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field
            label="Nome interno do lead"
            htmlFor="add-name"
            required
            hint="Este e o nome que aparece no card. O nome do Google e apenas referencia."
          >
            <Input
              id="add-name"
              value={internalName}
              onChange={(event) => setInternalName(event.target.value)}
            />
          </Field>

          <Field label="Servico" htmlFor="add-service">
            <Select
              value={serviceId || EMPTY}
              onValueChange={(value) => setServiceId(value === EMPTY ? '' : value)}
            >
              <SelectTrigger id="add-service">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY}>Nao associar</SelectItem>
                {(services.data?.services ?? [])
                  .filter((service) => service.active)
                  .map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>

          {result && (result.phone.e164 || result.website.url) ? (
            <div className="space-y-1 rounded-md border border-border p-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Vai junto com o lead</p>
              {result.phone.e164 ? <p>Telefone: {formatPhone(result.phone.e164)}</p> : null}
              {result.website.url && result.website.classification !== 'NONE' ? (
                <p>
                  {result.website.label}: {result.website.url}
                </p>
              ) : null}
              <p>Google Maps: link do local</p>
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving} loadingText="Adicionando...">
            Adicionar ao CRM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
