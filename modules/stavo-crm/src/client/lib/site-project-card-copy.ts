/**
 * Copy for the existing project list. Messages describe actual project status;
 * they must never imply that an unpublished site is live or invent business data.
 */
import type { SiteProjectStatus } from '@site-kit/types/site-ai';

export interface SiteProjectCardCopy {
  description: string;
  action: string;
}

export const SITE_PROJECT_CARD_COPY: Record<SiteProjectStatus, SiteProjectCardCopy> = {
  BRIEFING: {
    description: 'Projeto iniciado. Continue a configuração para preparar a primeira versão do site.',
    action: 'Continuar projeto',
  },
  QUEUED: {
    description: 'Solicitação recebida. A geração começará assim que chegar a vez deste projeto.',
    action: 'Ver andamento',
  },
  GENERATING: {
    description: 'A estrutura, os textos e os elementos visuais estão sendo preparados.',
    action: 'Acompanhar geração',
  },
  READY: {
    description: 'A primeira versão está pronta para revisar textos, imagens e detalhes antes de publicar.',
    action: 'Revisar site',
  },
  PUBLISHED: {
    description: 'Site publicado e disponível para compartilhar. Abra o projeto para editar ou atualizar a publicação.',
    action: 'Gerenciar site',
  },
  FAILED: {
    description: 'A geração não foi concluída. Consulte o motivo e retome o projeto quando estiver pronto.',
    action: 'Ver o problema',
  },
  ARCHIVED: {
    description: 'Projeto arquivado. As informações anteriores permanecem disponíveis para consulta.',
    action: 'Consultar projeto',
  },
};
