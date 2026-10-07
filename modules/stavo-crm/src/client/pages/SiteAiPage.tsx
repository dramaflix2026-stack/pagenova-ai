/**
 * Modulo "Sites com IA" (secao 6.2 da especificacao).
 *
 * Lista os projetos e usa leads cadastrados no CRM como unica origem para
 * novos sites. O painel acompanha todos os projetos do workspace.
 */
import { useMemo, useState } from 'react';
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
import { SiteWizardDialog } from '../components/site-ai/SiteWizardDialog';
import { useBoard, useGoogleDetails, useLeadDetail, type BoardColumnData } from '../hooks/useCrm';
import { useSiteAiDiagnostics, useSiteProjects, type SiteProjectSummary } from '../hooks/useSiteAi';
import { formatUsd } from '../lib/site-ai-format';
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

export default function SiteAiPage() {
  const navigate = useNavigate();
  const diagnostics = useSiteAiDiagnostics();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SiteProjectStatus | ''>('');
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const board = useBoard({ search: leadSearch || undefined, archived: 'EXCLUDE' });
  const selectedLead = useLeadDetail(selectedLeadId);
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

      {selectedLeadId && selectedLead.isLoading ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="status"
          aria-live="polite"
        >
          <Card className="relative z-[60] w-full max-w-md">
            <CardContent className="p-6">
              <LoadingBlock label="Carregando dados do lead..." />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedLeadId && selectedLead.isError ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="relative z-[60] w-full max-w-md">
            <CardContent className="space-y-4 p-6">
              <ErrorState message="Nao foi possivel carregar os dados deste lead." />
              <Button variant="secondary" onClick={() => setSelectedLeadId(null)}>
                Voltar para os leads
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <SiteWizardDialog
        key={selectedLeadId ?? 'crm-lead-site'}
        open={Boolean(selectedLeadId && selectedLead.data)}
        onOpenChange={(open) => {
          if (!open) setSelectedLeadId(null);
        }}
        leadId={selectedLeadId}
        initialBusinessName={selectedLead.data?.lead.internalName ?? ''}
        initialNiche={selectedLead.data?.lead.prospectingNiche ?? liveCategory ?? ''}
        initialCity={selectedLead.data?.lead.prospectingCity ?? liveCity ?? ''}
        initialPhone={
          selectedLead.data?.contacts.find((item) => item.type === 'WHATSAPP')?.value ??
          selectedLead.data?.contacts.find((item) => item.type === 'PHONE')?.value ??
          livePhone ??
          null
        }
        initialAddress={selectedLead.data?.lead.address ?? liveAddress ?? null}
        initialInstagram={selectedLead.data?.links.find((item) => item.type === 'INSTAGRAM')?.url ?? null}
        initialWebsite={selectedLead.data?.links.find((item) => item.type === 'WEBSITE')?.url ?? liveWebsite ?? null}
        onCreated={(projectId) => {
          setSelectedLeadId(null);
          navigate(`/sites-ia/${projectId}`);
        }}
      />
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
