/**
 * Secao "Site com IA" no drawer do lead (secao 6.1 da especificacao).
 *
 * Mostra o estado compacto do projeto ligado a este lead e a acao principal
 * de acordo com a tabela da especificacao: Criar site / Ver andamento /
 * Editar site / Abrir site / Retomar geracao.
 */
import { ExternalLink, Globe } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  SITE_CARD_ACTION_LABELS,
  SITE_PROJECT_STATUS_LABELS,
  cardActionFor,
  type SiteProjectStatus,
} from '@site-kit/types/site-ai';
import { formatDate } from '@shared/format';
import { useSiteProjectByLead } from '../../hooks/useSiteAi';
import { formatUsd } from '../../lib/site-ai-format';
import { SiteWizardDialog } from '../site-ai/SiteWizardDialog';
import { Badge, Button, LoadingBlock } from '../ui';
import type { LeadDetailResponse } from '../../hooks/useCrm';

interface LeadSiteAiSectionProps {
  leadId: string;
  detail: LeadDetailResponse;
  /** Fecha o drawer antes de sair para a pagina do projeto. */
  onNavigateAway: () => void;
}

export function LeadSiteAiSection({ leadId, detail, onNavigateAway }: LeadSiteAiSectionProps) {
  const routerNavigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const query = useSiteProjectByLead(leadId);

  const navigate = (path: string) => {
    onNavigateAway();
    routerNavigate(path);
  };

  if (query.isLoading) return <LoadingBlock label="Verificando site..." />;

  const project = query.data?.projects[0] ?? null;
  const action = cardActionFor(project?.status as SiteProjectStatus | undefined);

  const phone =
    detail.contacts.find((c) => c.type === 'WHATSAPP')?.value ??
    detail.contacts.find((c) => c.type === 'PHONE')?.value ??
    null;
  const instagram = detail.links.find((l) => l.type === 'INSTAGRAM')?.url ?? null;
  const website = detail.links.find((l) => l.type === 'WEBSITE')?.url ?? null;

  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Globe className="h-4 w-4" aria-hidden="true" />
        Site com IA
      </h3>

      {!project ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-dashed border-border p-3">
          <p className="text-sm text-muted-foreground">
            Crie uma amostra de site personalizada para prospectar este lead.
          </p>
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            Criar site
          </Button>
        </div>
      ) : (
        <div className="mt-2 space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <Badge tone={project.status === 'PUBLISHED' ? 'success' : project.status === 'FAILED' ? 'danger' : 'primary'}>
              {SITE_PROJECT_STATUS_LABELS[project.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">Atualizado em {formatDate(project.updatedAt)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Custo acumulado: {formatUsd(project.costAccumulatedUsd)}</p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate(`/sites-ia/${project.id}`)}>
              {SITE_CARD_ACTION_LABELS[action]}
            </Button>
            {project.status === 'PUBLISHED' ? (
              <Button size="sm" variant="secondary" onClick={() => navigate(`/sites-ia/${project.id}`)}>
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                WhatsApp
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <SiteWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        leadId={leadId}
        initialBusinessName={detail.lead.internalName}
        initialPhone={phone}
        initialAddress={detail.lead.address}
        initialInstagram={instagram}
        initialWebsite={website}
        onCreated={(projectId) => navigate(`/sites-ia/${projectId}`)}
      />
    </section>
  );
}
