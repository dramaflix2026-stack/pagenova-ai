/**
 * Historico persistido de pesquisas (sem armazenar resultados brutos do Google).
 * Consultar esta tela nao consome quota.
 */
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, Clock3, Search, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import { api } from '../lib/api';

type HistoryRow = {
  id:string;
  niche:string|null;
  country:string|null;
  state:string|null;
  city:string|null;
  region:string|null;
  websiteFilter:string|null;
  serviceId:string|null;
  pagesRequested:number;
  resultCount:number;
  createdAt:string;
  savedLeads:Array<{id:string;name:string;placeId:string|null;status:string;createdAt:string}>;
};

function existingSearchUrl(item:HistoryRow) {
  const query=new URLSearchParams();
  for (const [key,value] of Object.entries({
    niche:item.niche,country:item.country,state:item.state,city:item.city,
    region:item.region,websiteFilter:item.websiteFilter,serviceId:item.serviceId,
  })) {
    if(value)query.set(key,value);
  }
  return '/buscar?'+query.toString();
}

export default function SearchHistoryPage(){
  const history=useQuery({
    queryKey:['google-search-history'],
    queryFn:()=>api.get<{searches:HistoryRow[]}>('/google/history'),
    staleTime:60_000,
  });
  const rows=history.data?.searches||[];
  const stored=rows.reduce((sum,item)=>sum+item.savedLeads.length,0);
  return <>
    <PageHeader title="Empresas pesquisadas" description="Histórico das consultas e contatos que você já salvou. Abrir esta página não consome Google Places."/>
    <PageBody className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pesquisas recentes</p>
          <strong className="mt-1 block text-2xl">{rows.length}</strong>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Contatos salvos dessas pesquisas</p>
          <strong className="mt-1 block text-2xl">{stored}</strong>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground"><Search className="h-4 w-4"/> Custo para consultar histórico</p>
          <strong className="mt-1 block text-xl text-emerald-500">0 chamadas</strong>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Ao salvar um contato na busca, ele passa a constar aqui como lead do CRM. Os resultados não salvos do Google são temporários e não são armazenados. Uma pesquisa nova só acontece quando você clica em Pesquisar na guia Buscar empresas.
      </div>
      {history.isLoading&&<p role="status" className="py-10 text-center text-sm text-muted-foreground">Carregando pesquisas existentes...</p>}
      {history.isError&&<div role="alert" className="rounded-xl border border-destructive/30 p-5 text-sm">
        Não foi possível consultar o histórico. <button type="button" onClick={()=>void history.refetch()} className="ml-2 underline">Tentar novamente</button>
      </div>}
      {!history.isLoading&&!history.isError&&rows.length===0&&
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground"/>
          <h2 className="mt-3 font-semibold">Ainda não há pesquisas registradas</h2>
          <p className="mt-2 text-sm text-muted-foreground">Depois da primeira consulta, o nicho e os contatos salvos ficam aqui.</p>
          <Link to="/buscar" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Buscar empresas</Link>
        </div>}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(item=><article key={item.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Pesquisa realizada</p>
              <h2 className="mt-1 break-words text-lg font-bold">{item.niche||'Pesquisa de empresas'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{[item.region,item.city,item.state,item.country].filter(Boolean).join(' · ')||'Região não especificada'}</p>
            </div>
            <Clock3 className="h-5 w-5 shrink-0 text-muted-foreground"/>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {new Date(item.createdAt).toLocaleDateString('pt-BR')} · {item.pagesRequested} página(s) consultada(s) · {item.resultCount} resultados exibidos na época
          </p>
          <div className="mt-4 rounded-xl bg-muted/40 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold"><UsersRound className="h-4 w-4"/> {item.savedLeads.length} contato(s) salvo(s)</p>
            {item.savedLeads.length ? <ul className="mt-2 space-y-1.5">
              {item.savedLeads.slice(0,12).map(lead=><li key={lead.id} className="flex items-start justify-between gap-2 text-sm">
                <span className="min-w-0 break-words">{lead.name}</span>
                <Link to="/crm" className="shrink-0 text-xs text-primary hover:underline">Ver CRM</Link>
              </li>)}
              {item.savedLeads.length>12&&<li className="text-xs text-muted-foreground">Mais {item.savedLeads.length-12} contatos no CRM</li>}
            </ul> : <p className="mt-2 text-xs text-muted-foreground">Nenhum contato desta pesquisa foi salvo.</p>}
          </div>
          <Link to={existingSearchUrl(item)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Reutilizar os filtros <ArrowRight className="h-4 w-4"/>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Preenche os mesmos filtros sem pesquisar automaticamente.</p>
        </article>)}
      </div>
      {rows.length>=60&&<p className="text-center text-xs text-muted-foreground">Exibindo as 60 pesquisas mais recentes.</p>}
    </PageBody>
  </>;
}
