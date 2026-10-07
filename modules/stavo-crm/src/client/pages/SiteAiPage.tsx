/**
 * Modulo "Sites com IA" (secao 6.2 da especificacao).
 *
 * Lista os projetos e usa leads cadastrados no CRM como unica origem para
 * novos sites. O painel acompanha todos os projetos do workspace.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { formatDate } from '@shared/format';
import {
  SITE_CARD_ACTION_LABELS,
  SITE_PROJECT_STATUS_LABELS,
  SITE_TYPE_LABELS,
  cardActionFor,
  type SiteProjectStatus,
} from '@site-kit/types/site-ai';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import { useBoard, useGoogleDetails, useLeadDetail, type BoardColumnData } from '../hooks/useCrm';
import { useCreateSiteProject, useSiteAiDiagnostics, useSiteProjects, type SiteProjectSummary } from '../hooks/useSiteAi';
import { formatUsd } from '../lib/site-ai-format';
import { api, ApiError } from '../lib/api';
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

  useEffect(() => {
    if (
      !selectedLeadId ||
      !selectedLead.data ||
      selectedLead.isLoading ||
      googleDetails.isLoading ||
      creatingFromLead ||
      createError
    ) {
      return;
    }
    void createSiteDirectlyFromLead();
    // A selecao do lead e a conclusao das consultas sao os gatilhos. A funcao
    // protege contra reentrada com creatingFromLead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeadId, selectedLead.data, selectedLead.isLoading, googleDetails.isLoading]);

  const projects = useSiteProjects({
    search: search || undefined,
    status: status || undefined,
    limit: 50,
  });

  return (
    <>
      <PageHeader
        title="Sites com IA"
        description="Crie amostras de site personalizadas para prospeccao, publique e acompanhe."
        actions={
          <Button onClick={() => setLeadPickerOpen(true)}>Selecionar lead do CRM</Button>
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

        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome do negocio..."
            className="max-w-xs"
          />
          <Select value={status || '__todos__'} onValueChange={(v) => setStatus(v === '__todos__' ? '' : (v as SiteProjectStatus))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__todos__">Todos os status</SelectItem>
              {Object.entries(SITE_PROJECT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {projects.isLoading ? <LoadingBlock label="Carregando projetos..." /> : null}
        {projects.isError ? <ErrorState message="Nao foi possivel carregar os projetos." /> : null}

        {projects.data && projects.data.projects.length === 0 ? (
          <EmptyState
            title="Nenhum site criado ainda"
            description="Selecione um lead cadastrado no CRM para gerar o primeiro site com IA."
            action={
              <Button onClick={() => setLeadPickerOpen(true)}>Selecionar lead do CRM</Button>
            }
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data?.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`/sites-ia/${project.id}`)}
              onGenerateAnother={() => project.leadId && setSelectedLeadId(project.leadId)}
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
                  <LoadingBlock label={creatingFromLead ? "Criando projeto e iniciando geração..." : "Dados carregados. Iniciando geração..."} />

                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}

function ProjectCard({ project, onOpen, onGenerateAnother }: { project: SiteProjectSummary; onOpen: () => void; onGenerateAnother: () => void }) {
  const action = cardActionFor(project.status);

  return (
    <Card className="cursor-pointer transition hover:shadow-md" onClick={onOpen}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-tight">{project.businessName}</p>
          <Badge tone={STATUS_TONE[project.status]}>{SITE_PROJECT_STATUS_LABELS[project.status]}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {SITE_TYPE_LABELS[project.siteType as keyof typeof SITE_TYPE_LABELS] ?? project.siteType} · atualizado em{' '}
          {formatDate(project.updatedAt)}
        </p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">Custo: {formatUsd(project.costAccumulatedUsd)}</span>
          <div className="flex items-center gap-2">
            {project.leadId ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={(event) => {
                  event.stopPropagation();
                  onGenerateAnother();
                }}
              >
                + Gerar outro site
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              {SITE_CARD_ACTION_LABELS[action]}
            </Button>
          </div>
        </div>
        {project.lastFailureMessage && project.status === 'FAILED' ? (
          <p className="truncate text-xs text-destructive">{project.lastFailureMessage}</p>
        ) : null}
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
