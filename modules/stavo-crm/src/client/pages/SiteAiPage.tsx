/**
 * Modulo "Sites com IA" (secao 6.2 da especificacao).
 *
 * Lista os projetos, com filtros basicos e o ponto de entrada para criar um
 * projeto avulso. Um projeto ligado a um lead tambem aparece aqui -- este e
 * o painel de visao geral do modulo inteiro, nao so dos avulsos.
 */
import { useState } from 'react';
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
  const [wizardOpen, setWizardOpen] = useState(false);

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
        actions={<Button onClick={() => setWizardOpen(true)}>Novo site</Button>}
      />
      <PageBody className="space-y-4">
        {diagnostics.data && diagnostics.data.mode === 'bloqueado' ? (
          <Callout tone="warning" title="Geracao por IA nao configurada">
            A interface funciona normalmente, mas gerar um site exige configurar ANTHROPIC_API_KEY no
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
            description="Crie o primeiro site com IA a partir de um lead ou de forma avulsa."
            action={<Button onClick={() => setWizardOpen(true)}>Novo site</Button>}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data?.projects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={() => navigate(`/sites-ia/${project.id}`)} />
          ))}
        </div>
      </PageBody>

      <SiteWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onCreated={(projectId) => navigate(`/sites-ia/${projectId}`)}
      />
    </>
  );
}

function ProjectCard({ project, onOpen }: { project: SiteProjectSummary; onOpen: () => void }) {
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
          <Button size="sm" variant="secondary" onClick={onOpen}>
            {SITE_CARD_ACTION_LABELS[action]}
          </Button>
        </div>
        {project.lastFailureMessage && project.status === 'FAILED' ? (
          <p className="truncate text-xs text-destructive">{project.lastFailureMessage}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
