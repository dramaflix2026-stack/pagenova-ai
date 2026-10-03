/**
 * Card compacto do Kanban.
 *
 * Mostra apenas o que ajuda a decidir. Endereco completo, notas longas e
 * historico ficam no drawer.
 *
 * Contorno vermelho = dados criticos incompletos (sem nome ou sem contato).
 * Aviso ambar = pendencia ou atraso. Nunca so cor: sempre icone + texto.
 */
import { useDraggable } from '@dnd-kit/core';
import {
  AlertTriangle,
  CalendarClock,
  CircleDollarSign,
  Clock,
  Video,
  Lock,
  MessageSquare,
  Repeat,
  Phone,
  UserRound,
} from 'lucide-react';

import { formatDate, formatDuration, formatMoney } from '@shared/format';
import { useAuth } from '../../hooks/useAuth';
import { formatMeetingWhen } from '../../lib/meetingTime';
import { cn } from '../../lib/utils';
import { Badge } from '../ui';

export interface BoardCardData {
  id: string;
  internalName: string;
  originType: string;
  sourceName: string | null;
  stageId: string;
  incompleteLevel: string;
  stageEnteredAt: string;
  createdAt: string;
  archivedAt: string | null;
  city: string | null;
  niche: string | null;
  serviceSummary: { name: string; billingType: string }[];
  proposedTotal: string;
  billingTypes: string[];
  nextFollowUpAt: string | null;
  followUpStatus: 'NONE' | 'OVERDUE' | 'TODAY' | 'UPCOMING';
  pendingAmount: string;
  overdueAmount: string;
  paidAmount: string;
  hasActiveSubscription: boolean;
  attemptCount: number;
  hasReplied: boolean;
  hasSale: boolean;
  /** Quem trabalha o lead. Nulo quando esta no pote comum. */
  owner: { id: string; name: string } | null;
  /** Calculado pelo servidor: falso quando voce so pode acompanhar. */
  canEdit: boolean;
  /**
   * Proxima reuniao agendada. Somente a mais proxima: o card e pequeno.
   * `otherCount` sinaliza que existem outras, consultaveis no drawer.
   */
  nextMeeting: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    meetUrl: string;
    otherCount: number;
  } | null;
}

interface LeadCardProps {
  card: BoardCardData;
  onOpen: (leadId: string) => void;
  /** Seletor "Mover para..." — no celular substitui totalmente o arrastar. */
  onRequestMove: (leadId: string) => void;
  draggable?: boolean;
}

export function LeadCard({ card, onOpen, onRequestMove, draggable = true }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    // Arrastar um card que o servidor vai recusar so gera frustracao.
    disabled: !draggable || !card.canEdit,
    data: { stageId: card.stageId },
  });

  const { user } = useAuth();
  const deOutraPessoa = Boolean(card.owner && card.owner.id !== user?.id);

  const critical = card.incompleteLevel === 'CRITICAL';
  const warning = card.incompleteLevel === 'WARNING';
  const stageMs = Date.now() - new Date(card.stageEnteredAt).getTime();
  const hasPending = Number(card.pendingAmount) > 0;
  const hasOverdue = Number(card.overdueAmount) > 0;
  const hasProposal = Number(card.proposedTotal) > 0;
  // Menos de 2 horas ate o inicio, ou ja acontecendo: destaque ambar.
  const reuniaoUrgente = card.nextMeeting
    ? new Date(card.nextMeeting.startAt).getTime() - Date.now() < 2 * 60 * 60 * 1000
    : false;

  return (
    <article
      ref={setNodeRef}
      className={cn(
        'group rounded-lg border bg-surface p-3 text-left shadow-sm transition-shadow',
        'focus-within:shadow-md hover:shadow-md',
        critical ? 'border-destructive' : warning ? 'border-warning/50' : 'border-border',
        isDragging && 'opacity-50',
      )}
      aria-label={`Lead ${card.internalName}`}
    >
      {/*
        Lead de outra pessoa sempre mostra o NOME de quem trabalha, e nao o
        cargo. O cadeado aparece so quando voce nao pode alterar; o dono da
        conta, que pode, ve o mesmo aviso sem cadeado.
      */}
      {deOutraPessoa ? (
        <div
          className="mb-2 flex items-center gap-1.5 rounded border border-primary/30 bg-primary-soft px-2 py-1 text-xs text-primary"
          title={`${card.owner!.name} esta trabalhando este lead`}
        >
          {card.canEdit ? (
            <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          )}
          <span className="truncate">
            <strong className="font-semibold">{card.owner!.name}</strong> esta trabalhando
          </span>
        </div>
      ) : card.owner ? (
        <p className="mb-1.5 truncate text-xs text-muted-foreground">Com voce</p>
      ) : null}

      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => onOpen(card.id)}
          className="min-w-0 flex-1 text-left"
          aria-label={`Abrir detalhes de ${card.internalName}`}
        >
          <p className="truncate text-sm font-medium text-foreground">{card.internalName}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {[card.sourceName, card.city].filter(Boolean).join(' · ') || 'Sem origem definida'}
          </p>
        </button>

        {draggable ? (
          <button
            type="button"
            className="hidden shrink-0 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted lg:block"
            aria-label={`Arrastar ${card.internalName}`}
            {...listeners}
            {...attributes}
          >
            <span aria-hidden="true" className="text-xs leading-none">
              ⠿
            </span>
          </button>
        ) : null}
      </div>

      {critical ? (
        <div className="mt-2 flex items-center gap-1.5 rounded border border-destructive/30 bg-destructive-soft px-2 py-1 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Dados incompletos</span>
        </div>
      ) : null}

      {card.nextMeeting ? (
        <div
          className={cn(
            'mt-2 flex items-center gap-2 rounded border px-2 py-1.5 text-xs',
            reuniaoUrgente
              ? 'border-warning/40 bg-warning-soft text-warning'
              : 'border-border bg-muted',
          )}
        >
          <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            <span className="font-medium">{formatMeetingWhen(card.nextMeeting.startAt)}</span>
            {card.nextMeeting.otherCount > 0 ? (
              <span className="text-muted-foreground"> · +{card.nextMeeting.otherCount}</span>
            ) : null}
          </span>

          {/*
            O clique no link nao pode abrir o card nem iniciar o arraste:
            `stopPropagation` no ponteiro resolve os dois de uma vez.
          */}
          <a
            href={card.nextMeeting.meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(evento) => evento.stopPropagation()}
            onPointerDown={(evento) => evento.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium text-primary hover:bg-primary/10"
            aria-label={`Entrar na reuniao com ${card.internalName} no Google Meet`}
          >
            <Video className="h-3.5 w-3.5" aria-hidden="true" />
            Entrar
          </a>
        </div>
      ) : null}

      {card.serviceSummary.length > 0 ? (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {card.serviceSummary.map((service) => service.name).join(', ')}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap gap-1.5">
        {hasProposal ? (
          <Badge tone="neutral">
            <CircleDollarSign className="h-3 w-3" aria-hidden="true" />
            Proposta {formatMoney(card.proposedTotal)}
          </Badge>
        ) : null}

        {hasOverdue ? (
          <Badge tone="danger">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Vencido {formatMoney(card.overdueAmount)}
          </Badge>
        ) : hasPending ? (
          <Badge tone="warning">
            <Clock className="h-3 w-3" aria-hidden="true" />A receber{' '}
            {formatMoney(card.pendingAmount)}
          </Badge>
        ) : null}

        {Number(card.paidAmount) > 0 ? (
          <Badge tone="success">
            <CircleDollarSign className="h-3 w-3" aria-hidden="true" />
            Recebido {formatMoney(card.paidAmount)}
          </Badge>
        ) : null}

        {card.hasActiveSubscription ? (
          <Badge tone="primary">
            <Repeat className="h-3 w-3" aria-hidden="true" />
            Recorrente
          </Badge>
        ) : null}

        {card.hasReplied ? (
          <Badge tone="primary">
            <MessageSquare className="h-3 w-3" aria-hidden="true" />
            Respondeu
          </Badge>
        ) : null}

        {card.attemptCount > 0 ? (
          <Badge tone="outline">
            <Phone className="h-3 w-3" aria-hidden="true" />
            {card.attemptCount} tentativa{card.attemptCount > 1 ? 's' : ''}
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatDuration(stageMs)} nesta etapa
        </span>

        {card.nextFollowUpAt ? (
          <span
            className={cn(
              'flex items-center gap-1',
              card.followUpStatus === 'OVERDUE' && 'font-medium text-destructive',
              card.followUpStatus === 'TODAY' && 'font-medium text-warning',
            )}
          >
            <CalendarClock className="h-3 w-3" aria-hidden="true" />
            {card.followUpStatus === 'OVERDUE'
              ? 'Follow-up atrasado'
              : card.followUpStatus === 'TODAY'
                ? 'Follow-up hoje'
                : formatDate(card.nextFollowUpAt)}
          </span>
        ) : null}
      </div>

      {/* Alternativa acessivel ao arrastar; obrigatoria no celular. */}
      <button
        type="button"
        onClick={() => onRequestMove(card.id)}
        className="mt-2 w-full rounded-md border border-border bg-muted px-2 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
      >
        Mover para...
      </button>
    </article>
  );
}
