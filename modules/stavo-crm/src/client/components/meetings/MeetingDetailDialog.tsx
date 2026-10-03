/**
 * Detalhe da reuniao, com as acoes do ciclo de vida.
 *
 * Cada status oferece apenas o que faz sentido: uma reuniao cancelada nao
 * mostra "Entrar" como acao principal, e uma concluida nao aceita ser
 * concluida de novo. Botao que existe mas devolve erro e pior que botao
 * ausente.
 *
 * Concluir, cancelar e registrar ausencia NAO mexem na etapa do CRM nem
 * geram venda -- isso continua sendo decisao explicita no card.
 */
import {
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Pencil,
  UserX,
  Video,
} from 'lucide-react';
import { useState } from 'react';

import { MEETING_STATUS_LABELS } from '@shared/meetings';
import { Badge, Button, Callout, Field, Textarea } from '../ui';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { useToast } from '../ui/Toast';
import {
  useCancelMeeting,
  useCompleteMeeting,
  useNoShowMeeting,
  type Meeting,
} from '../../hooks/useMeetings';
import { ApiError } from '../../lib/api';
import {
  durationMinutes,
  formatMeetingWindow,
  formatProximity,
  isHappeningNow,
} from '../../lib/meetingTime';

const TOM_POR_STATUS = {
  SCHEDULED: 'primary',
  COMPLETED: 'success',
  CANCELED: 'neutral',
  NO_SHOW: 'danger',
} as const;

export interface MeetingDetailDialogProps {
  meeting: Meeting | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (meeting: Meeting) => void;
  onOpenLead?: (leadId: string) => void;
}

export function MeetingDetailDialog({
  meeting,
  onOpenChange,
  onEdit,
  onOpenLead,
}: MeetingDetailDialogProps) {
  const toast = useToast();
  const concluir = useCompleteMeeting();
  const ausencia = useNoShowMeeting();
  const cancelar = useCancelMeeting();

  const [confirmando, setConfirmando] = useState<'COMPLETE' | 'NO_SHOW' | 'CANCEL' | null>(null);
  const [texto, setTexto] = useState('');

  if (!meeting) return null;

  const agendada = meeting.status === 'SCHEDULED';
  const acontecendo = agendada && isHappeningNow(meeting.startAt, meeting.endAt);
  const venceuSemDesfecho = agendada && new Date(meeting.endAt).getTime() < Date.now();

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(meeting.meetUrl);
      toast.success('Link copiado');
    } catch {
      toast.error('Nao foi possivel copiar', 'Selecione e copie manualmente.');
    }
  };

  const aplicarDesfecho = async () => {
    try {
      if (confirmando === 'COMPLETE') {
        await concluir.mutateAsync({
          id: meeting.id,
          outcome: texto.trim() || null,
          expectedVersion: meeting.version,
        });
        toast.success('Reuniao concluida', 'A etapa do CRM nao mudou.');
      } else if (confirmando === 'NO_SHOW') {
        await ausencia.mutateAsync({
          id: meeting.id,
          note: texto.trim() || null,
          expectedVersion: meeting.version,
        });
        toast.success('Ausencia registrada');
      } else if (confirmando === 'CANCEL') {
        await cancelar.mutateAsync({
          id: meeting.id,
          reason: texto.trim(),
          expectedVersion: meeting.version,
        });
        toast.success('Reuniao cancelada', 'O historico foi preservado.');
      }
      setConfirmando(null);
      setTexto('');
      onOpenChange(false);
    } catch (erro) {
      toast.error(
        'Nao foi possivel concluir a acao',
        erro instanceof ApiError ? erro.message : 'Tente novamente em instantes.',
      );
    }
  };

  const salvando = concluir.isPending || ausencia.isPending || cancelar.isPending;

  return (
    <>
      <Dialog open={Boolean(meeting)} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={TOM_POR_STATUS[meeting.status]}>
                {MEETING_STATUS_LABELS[meeting.status]}
              </Badge>
              {acontecendo ? <Badge tone="warning">Acontecendo agora</Badge> : null}
              {venceuSemDesfecho ? <Badge tone="warning">Pendente de atualizacao</Badge> : null}
            </div>
            <DialogTitle className="mt-2">{meeting.title}</DialogTitle>
            <DialogDescription>
              {meeting.leadName} · {meeting.leadStageName}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {venceuSemDesfecho ? (
              <Callout tone="warning" title="Esta reuniao ja passou">
                O sistema nao sabe o que aconteceu. Marque como concluida, registre a ausencia ou
                reagende.
              </Callout>
            ) : null}

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Quando</dt>
                <dd className="font-medium">
                  {formatMeetingWindow(meeting.startAt, meeting.endAt)}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {durationMinutes(meeting.startAt, meeting.endAt)} minutos · horario de Brasilia
                  {agendada ? ` · ${formatProximity(meeting.startAt)}` : ''}
                </dd>
              </div>
              {meeting.serviceName ? (
                <div>
                  <dt className="text-xs text-muted-foreground">Servico relacionado</dt>
                  <dd className="font-medium">{meeting.serviceName}</dd>
                </div>
              ) : null}
            </dl>

            {meeting.agenda ? (
              <div>
                <h4 className="text-xs text-muted-foreground">Objetivo / pauta</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">{meeting.agenda}</p>
              </div>
            ) : null}

            {meeting.internalNotes ? (
              <div>
                <h4 className="text-xs text-muted-foreground">Observacoes internas</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">{meeting.internalNotes}</p>
              </div>
            ) : null}

            {meeting.outcome ? (
              <div>
                <h4 className="text-xs text-muted-foreground">
                  {meeting.status === 'NO_SHOW' ? 'Observacao da ausencia' : 'Resultado'}
                </h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">{meeting.outcome}</p>
              </div>
            ) : null}

            {meeting.cancelReason ? (
              <div>
                <h4 className="text-xs text-muted-foreground">Motivo do cancelamento</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm">{meeting.cancelReason}</p>
              </div>
            ) : null}

            {/* A sala continua acessivel para consulta, mas so e acao
                principal enquanto a reuniao estiver de pe. */}
            <div className="flex flex-wrap gap-2">
              <Button variant={agendada ? 'primary' : 'secondary'} size="sm" asChild>
                <a href={meeting.meetUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4" aria-hidden="true" />
                  Entrar no Google Meet
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>

              <Button variant="secondary" size="sm" onClick={() => void copiarLink()}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copiar link
              </Button>

              {onOpenLead ? (
                <Button variant="secondary" size="sm" onClick={() => onOpenLead(meeting.leadId)}>
                  Abrir card do cliente
                </Button>
              ) : null}
            </div>
          </DialogBody>

          {agendada ? (
            <DialogFooter className="flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => onEdit(meeting)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar / reagendar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTexto('');
                  setConfirmando('COMPLETE');
                }}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Concluida
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setTexto('');
                  setConfirmando('NO_SHOW');
                }}
              >
                <UserX className="h-4 w-4" aria-hidden="true" />
                Nao compareceu
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setTexto('');
                  setConfirmando('CANCEL');
                }}
              >
                <CalendarX2 className="h-4 w-4" aria-hidden="true" />
                Cancelar reuniao
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                Reuniao encerrada. O registro fica no historico do lead.
              </p>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Confirmacoes ------------------------------------------------ */}
      <Dialog
        open={confirmando !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setConfirmando(null);
        }}
      >
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {confirmando === 'COMPLETE'
                ? 'Marcar como concluida'
                : confirmando === 'NO_SHOW'
                  ? 'Registrar ausencia'
                  : 'Cancelar reuniao'}
            </DialogTitle>
            <DialogDescription>
              {confirmando === 'CANCEL'
                ? 'A reuniao sai dos alertas e do calendario ativo. Nada e apagado.'
                : 'A reuniao sai dos alertas e fica registrada no historico do lead.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Field
              label={
                confirmando === 'COMPLETE'
                  ? 'Resultado da reuniao'
                  : confirmando === 'NO_SHOW'
                    ? 'Observacao'
                    : 'Motivo do cancelamento'
              }
              htmlFor="desfecho-texto"
              required={confirmando === 'CANCEL'}
              hint={confirmando === 'CANCEL' ? undefined : 'Opcional.'}
            >
              <Textarea
                id="desfecho-texto"
                rows={3}
                value={texto}
                onChange={(evento) => setTexto(evento.target.value)}
                maxLength={2000}
              />
            </Field>

            {confirmando === 'COMPLETE' ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Concluir a reuniao nao move o card de etapa nem registra venda. Essas acoes
                continuam sendo suas, no CRM.
              </p>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmando(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              variant={confirmando === 'CANCEL' ? 'destructive' : 'primary'}
              loading={salvando}
              disabled={confirmando === 'CANCEL' && texto.trim().length < 3}
              onClick={() => void aplicarDesfecho()}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Reexportado para a pagina reaproveitar o mesmo mapa de cores. */
export { TOM_POR_STATUS as MEETING_STATUS_TONES };
