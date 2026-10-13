/**
 * Modulo "Sites com IA" (secao 6.2 da especificacao).
 *
 * Lista os projetos e usa leads cadastrados no CRM como unica origem para
 * novos sites. O painel acompanha todos os projetos do workspace.
 */
import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, FilePenLine, Globe2, LayoutTemplate, Search, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { formatDate } from '@shared/format';
import {
  SITE_PROJECT_STATUS_LABELS,
  SITE_TYPE_LABELS,
  type SiteProjectStatus,
} from '@site-kit/types/site-ai';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import { useBoard, useGoogleDetails, useLeadDetail, type BoardColumnData } from '../hooks/useCrm';
import { useCreateSiteProject, useSiteAiDiagnostics, useSiteProjects, type SiteProjectSummary } from '../hooks/useSiteAi';
import { api, ApiError } from '../lib/api';
import { SITE_PROJECT_CARD_COPY } from '../lib/site-project-card-copy';
import { Badge, Button, Callout, Card, CardContent, EmptyState, ErrorState, Input, LoadingBlock, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui';

const STATUS_TONE: Record<SiteProjectStatus, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
  BRIEFING: 'neutral',
  QUEUED: 'warning',
  GENERATING: 'warning',
  READY: 'primary',
  PUBLISHED: 'success',
  FAILED: 'danger',
  ARCHIVED: 'neutral',
};

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text || undefined;
}

function optionalAbsoluteUrl(value: unknown): string | undefined {
  const raw = optionalText(value);
  if (!raw) return undefined;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function describeApiError(error: ApiError): string {
  const fields = Object.entries(error.fieldErrors ?? {}).flatMap(([field, messages]) =>
    messages.map((message) => `${field}: ${message}`),
  );
  return fields.length > 0 ? `${error.message} ${fields.join(' | ')}` : error.message;
}

export default function SiteAiPage() {
  const navigate = useNavigate();
  const diagnostics = useSiteAiDiagnostics();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SiteProjectStatus | ''>('');
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedTemplateId,setSelectedTemplateId] = useState<'frigolog-universal'|'muse-editorial'>('frigolog-universal');
  const [creatingFromLead, setCreatingFromLead] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const board = useBoard({ search: leadSearch || undefined, archived: 'EXCLUDE' });
  const selectedLead = useLeadDetail(selectedLeadId);
  const createProject = useCreateSiteProject();
  const selectedPlaceId = selectedLead.data?.lead.placeId ?? null;
  const googleDetails = useGoogleDetails(selectedPlaceId, Boolean(selectedLeadId && selectedLead.data));

  const liveGoogle = (googleDetails.data?.details ?? {}) as Record<string, any>;
  const liveAddress =
    liveGoogle.formattedAddress ??
    liveGoogle.formatted_address ??
    liveGoogle.address ??
    null;
  const livePhone =
    liveGoogle.internationalPhoneNumber ??
    liveGoogle.international_phone_number ??
    liveGoogle.nationalPhoneNumber ??
    liveGoogle.formatted_phone_number ??
    null;
  const liveWebsite =
    liveGoogle.websiteUri ??
    liveGoogle.website ??
    null;
  const liveCategory =
    liveGoogle.primaryTypeDisplayName?.text ??
    liveGoogle.primary_type_display_name?.text ??
    liveGoogle.primaryType ??
    liveGoogle.primary_type ??
    null;
  const liveCity =
    liveGoogle.city ??
    liveGoogle.locality ??
    null;

  async function createSiteDirectlyFromLead() {
    if (!selectedLeadId || !selectedLead.data || creatingFromLead) return;

    const lead = selectedLead.data;
    const businessName = optionalText(lead.lead.internalName) ?? '';
    if (businessName.length < 2) {
      setCreateError('Este lead nao possui um nome de negocio valido.');
      return;
    }

    setCreatingFromLead(true);
    setCreateError(null);
    try {
      const briefing = {
        templateId: selectedTemplateId,
        business: {
          name: businessName,
          niche: optionalText(lead.lead.prospectingNiche) ?? optionalText(liveCategory),
          city: optionalText(lead.lead.prospectingCity) ?? optionalText(liveCity),
          state: optionalText(lead.lead.prospectingState),
          phoneE164:
            optionalText(lead.contacts.find((item) => item.type === 'WHATSAPP')?.value) ??
            optionalText(lead.contacts.find((item) => item.type === 'PHONE')?.value) ??
            optionalText(livePhone),
          address: optionalText(lead.lead.address) ?? optionalText(liveAddress),
          instagramUrl: optionalAbsoluteUrl(
            lead.links.find((item) => item.type === 'INSTAGRAM')?.url,
          ),
          websiteUrl: optionalAbsoluteUrl(
            lead.links.find((item) => item.type === 'WEBSITE')?.url ?? liveWebsite,
          ),
          services: [],
          differentials: [],
        },
        objective: { goal: 'WHATSAPP_CONVERSATIONS' as const },
        style: {
          theme: 'AI_DECIDES' as const,
          keywords: [],
          density: 'BALANCED' as const,
          motionLevel: 'BALANCED' as const,
        },
        requiredSections: ['hero', 'services', 'benefits', 'about', 'process', 'faq', 'cta', 'footer'],
        forbiddenSections: [],
      };

      const { project } = await createProject.mutateAsync({
        leadId: selectedLeadId,
        businessName,
        siteType: 'ONE_PAGE',
        briefing,
      });

      // Usa o cliente oficial do CRM para manter /api/crm, CSRF e sessao.
      // O endpoint devolve 202 quando a geracao entra na fila.
      await api.post(`/site-projects/${project.id}/generate`, {});

      setSelectedLeadId(null);
      navigate(`/sites-ia/${project.id}`);
    } catch (error) {
      setCreateError(
        error instanceof ApiError
          ? describeApiError(error)
          : error instanceof Error
            ? error.message
            : 'Nao foi possivel criar o site deste lead.',
      );
    } finally {
      setCreatingFromLead(false);
    }
  }

  // Do NOT auto-start a paid generation when a lead is selected.
  // The user must choose a visual template and confirm explicitly.

  const projects = useSiteProjects({
    search: search || undefined,
    status: status || undefined,
    limit: 50,
  });

  return (
    <>
      <PageHeader
        title="Sites com IA"
        description="Crie, revise e gerencie os sites da sua empresa em um só lugar."
        actions={
          <Button onClick={() => setLeadPickerOpen(true)}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Criar site a partir de um lead
          </Button>
        }
      />
      <PageBody className="space-y-4">
        {diagnostics.data && diagnostics.data.mode === 'bloqueado' ? (
          <Callout tone="warning" title="Geracao por IA nao configurada">
            A interface funciona normalmente, mas gerar um site exige configurar a OPENAI_API_KEY no
            servidor ou ligar o modo de teste. Veja Configuracoes.
          </Callout>
        ) : null}
        {diagnostics.data?.mode === 'mock' ? (
          <Callout tone="neutral" title="Modo de teste — nenhuma IA real foi chamada">
            As geracoes deste ambiente usam um provedor de demonstracao, sem custo e sem chamada real.
          </Callout>
        ) : null}

        <section aria-label="Seus projetos de site" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Seus sites</h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                Encontre seus projetos, acompanhe o andamento e retome a edição de onde parou.
              </p>
            </div>
            {projects.data ? (
              <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                {projects.data.total} {projects.data.total === 1 ? 'projeto encontrado' : 'projetos encontrados'}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-3 sm:flex-row sm:items-center sm:p-4">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Buscar sites pelo nome do negócio"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar site pelo nome da empresa"
                className="w-full pl-10"
              />
            </div>
            <Select value={status || '__todos__'} onValueChange={(value) => setStatus(value === '__todos__' ? '' : (value as SiteProjectStatus))}>
              <SelectTrigger aria-label="Filtrar sites por status" className="w-full shrink-0 sm:w-52">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos__">Todos os status</SelectItem>
                {Object.entries(SITE_PROJECT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {projects.isLoading ? <LoadingBlock label="Carregando projetos..." /> : null}
        {projects.isError ? <ErrorState message="Nao foi possivel carregar os projetos." /> : null}

        {projects.data && projects.data.projects.length === 0 ? (
          <EmptyState
            title={search || status ? "Nenhum site corresponde aos filtros" : "Seu primeiro site começa aqui"}
            description={search || status
              ? "Tente outro nome ou selecione um status diferente para localizar seus projetos."
              : "Selecione uma empresa do CRM para criar seu primeiro site com IA."}
            action={
              search || status
                ? <Button variant="secondary" onClick={() => { setSearch(''); setStatus(''); }}>Limpar filtros</Button>
                : <Button onClick={() => setLeadPickerOpen(true)}>Selecionar empresa do CRM</Button>
            }
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.data?.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`/sites-ia/${project.id}`)}
            />
          ))}
        </div>
      </PageBody>

      {leadPickerOpen ? (
        <LeadPicker
          columns={board.data?.columns ?? []}
          loading={board.isLoading}
          search={leadSearch}
          onSearch={setLeadSearch}
          onClose={() => setLeadPickerOpen(false)}
          onSelect={(leadId) => {
            // Fecha primeiro o seletor e so depois monta o wizard.
            // Evita duas camadas modais concorrendo no mesmo frame no mobile.
            setLeadPickerOpen(false);
            setSelectedTemplateId('frigolog-universal');
            setCreateError(null);
            window.requestAnimationFrame(() => setSelectedLeadId(leadId));
          }}
        />
      ) : null}

      {selectedLeadId ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background p-4" role="status" aria-live="polite">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 p-6">
              {selectedLead.isLoading || (selectedLead.data && googleDetails.isLoading) ? (
                <LoadingBlock label="Preparando os dados do lead para gerar o site..." />
              ) : selectedLead.isError ? (
                <>
                  <ErrorState message="Nao foi possivel carregar os dados deste lead." />
                  <Button variant="secondary" onClick={() => setSelectedLeadId(null)}>Voltar para os leads</Button>
                </>
              ) : createError ? (
                <>
                  <ErrorState message={createError} />
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setSelectedLeadId(null)}>Cancelar</Button>
                    <Button onClick={() => void createSiteDirectlyFromLead()} disabled={creatingFromLead}>
                      {creatingFromLead ? 'Gerando...' : 'Tentar novamente'}
                    </Button>
                  </div>
                </>
              ) : selectedLead.data ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-primary">Criar site com IA</p>
                    <h2 className="mt-2 break-words text-lg font-semibold text-foreground">
                      {selectedLead.data.lead.internalName}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Escolha um dos modelos. A IA vai adaptar o conteúdo deste lead ao visual selecionado.
                    </p>
                  </div>
                  <div role="group" aria-label="Escolher template visual" className="grid grid-cols-2 gap-3">
                    <button type="button" aria-pressed={selectedTemplateId==='frigolog-universal'}
                      onClick={()=>setSelectedTemplateId('frigolog-universal')} disabled={creatingFromLead}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        selectedTemplateId==='frigolog-universal'
                          ? 'border-primary bg-primary-soft text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40'
                      }`}>
                      <div aria-hidden="true" className="mb-3 flex h-20 flex-col rounded-lg bg-[#f4f7f5] p-2">
                        <span className="h-2 w-10 rounded bg-[#0e5e50]"/>
                        <div className="mt-2 flex flex-1 gap-2">
                          <div className="w-3/5 space-y-1.5"><div className="h-2 rounded bg-[#0e5e50]"/><div className="h-2 w-4/5 rounded bg-[#0e5e50]"/><div className="h-2 w-1/2 rounded bg-[#18af8b]"/></div>
                          <div className="flex-1 rounded bg-gradient-to-tr from-[#285e55] to-[#b4c3b8]"/>
                        </div>
                      </div>
                      <span className="block text-sm font-semibold">Modelo 1 · Original</span>
                      <span className="mt-1 block text-xs text-muted-foreground">Visual moderno e comercial</span>
                    </button>
                    <button type="button" aria-pressed={selectedTemplateId==='muse-editorial'}
                      onClick={()=>setSelectedTemplateId('muse-editorial')} disabled={creatingFromLead}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        selectedTemplateId==='muse-editorial'
                          ? 'border-primary bg-primary-soft text-foreground'
                          : 'border-border bg-card text-foreground hover:border-primary/40'
                      }`}>
                      <div aria-hidden="true" className="mb-3 flex h-20 flex-col rounded-lg bg-[#f8f7f5] p-2">
                        <span className="text-[22px] font-black tracking-[-.08em] text-[#222]">muse<span className="text-[#df321e]">.</span></span>
                        <div className="mt-1 flex-1 rounded bg-gradient-to-br from-[#687a72] via-[#abafa2] to-[#e1d7bd]"/>
                      </div>
                      <span className="block text-sm font-semibold">Modelo 2 · Muse Editorial</span>
                      <span className="mt-1 block text-xs text-muted-foreground">Tipografia e portfólio visual</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                    <Button type="button" variant="secondary" disabled={creatingFromLead}
                      onClick={()=>setSelectedLeadId(null)}>Cancelar</Button>
                    <Button type="button" disabled={creatingFromLead}
                      onClick={()=>void createSiteDirectlyFromLead()}>
                      <Sparkles className="h-4 w-4" aria-hidden="true"/>
                      {creatingFromLead?'Gerando...':'Gerar com este template'}
                    </Button>
                  </div>
                  {creatingFromLead&&<p role="status" className="text-center text-xs text-muted-foreground">
                    Criando projeto e iniciando geração...
                  </p>}
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

function ProjectCard({ project, onOpen }: { project: SiteProjectSummary; onOpen: () => void }) {
  const copy = SITE_PROJECT_CARD_COPY[project.status];
  const typeLabel = SITE_TYPE_LABELS[project.siteType as keyof typeof SITE_TYPE_LABELS] ?? project.siteType;
  const isPublished = project.status === 'PUBLISHED';

  return (
    <Card className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15">
      <div aria-hidden="true" className="h-1 w-full bg-gradient-to-r from-primary via-primary/65 to-transparent" />
      <CardContent className="flex h-full min-w-0 flex-col p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
            {isPublished ? <Globe2 className="h-6 w-6" aria-hidden="true" /> : (
              <LayoutTemplate className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <Badge tone={STATUS_TONE[project.status]} className="max-w-[65%] shrink-0 text-center">
            {SITE_PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-lg font-semibold leading-snug tracking-tight text-foreground">
            {project.businessName}
          </h3>
          <p className="mt-2 min-h-[4.5rem] text-sm leading-relaxed text-muted-foreground">
            {copy.description}
          </p>
          {project.status === 'FAILED' && project.lastFailureMessage ? (
            <p className="mt-2 line-clamp-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
              {project.lastFailureMessage}
            </p>
          ) : null}
        </div>
        <div className="mt-5 space-y-3 border-t border-border/75 pt-4 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <LayoutTemplate className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
            <span className="shrink-0 font-medium text-foreground/80">Formato:</span>
            <span className="min-w-0 truncate" title={typeLabel}>{typeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
            <span className="shrink-0 font-medium text-foreground/80">Atualizado em:</span>
            <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
          </div>
        </div>
        <Button onClick={onOpen} block className="mt-5 h-11 justify-between rounded-xl px-4">
          <span className="flex items-center gap-2">
            {isPublished ? <Globe2 className="h-4 w-4" aria-hidden="true" /> : (
              <FilePenLine className="h-4 w-4" aria-hidden="true" />
            )}
            {copy.action}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
}

function LeadPicker({
  columns,
  loading,
  search,
  onSearch,
  onClose,
  onSelect,
}: {
  columns: BoardColumnData[];
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  onClose: () => void;
  onSelect: (leadId: string) => void;
}) {
  const leads = useMemo(
    () =>
      columns.flatMap((column) =>
        column.cards.map((card) => ({
          id: card.id,
          name: card.internalName,
          stage: column.name,
          city: card.city,
          niche: card.niche,
        })),
      ),
    [columns],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <Card className="w-full max-w-2xl">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Importar lead do CRM</h2>
              <p className="text-sm text-muted-foreground">Escolha um lead para preencher o gerador de site automaticamente.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
          </div>
          <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar lead por nome..." autoFocus />
          {loading ? <LoadingBlock label="Carregando leads..." /> : null}
          {!loading && leads.length === 0 ? (
            <EmptyState title="Nenhum lead encontrado" description="Adicione empresas ao CRM ou altere a busca." />
          ) : null}
          <div className="max-h-[55vh] space-y-2 overflow-y-auto">
            {leads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => onSelect(lead.id)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-3 text-left transition hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lead.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[lead.niche, lead.city, lead.stage].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-primary">Selecionar</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
