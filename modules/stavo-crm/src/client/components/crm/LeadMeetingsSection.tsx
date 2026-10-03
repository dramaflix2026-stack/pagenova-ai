/**
 * Reunioes do lead, dentro do drawer.
 *
 * Divide em "proximas" e "historico" porque sao duas perguntas diferentes:
 * o que ainda vou fazer, e o que ja aconteceu. Misturar as duas obrigaria a
 * pessoa a ler datas para descobrir onde esta o presente.
 *
 * O historico e paginado localmente: um cliente antigo pode ter dezenas de
 * reunioes, e desenhar todas de uma vez encheria o drawer.
 */
import { CalendarPlus, ExternalLink, Video } from 'lucide-react';
import { useState } from 'react';

import { MEETING_STATUS_LABELS, type MeetingStatus } from '@shared/meetings';
import { Badge, Button, EmptyState } from '../ui';
import { MeetingDetailDialog } from '../meetings/MeetingDetailDialog';
import { MeetingFormDialog } from '../meetings/MeetingFormDialog';
import type { Meeting } from '../../hooks/useMeetings';
import { formatMeetingWhen, formatMeetingWindow, isHappeningNow } from '../../lib/meetingTime';

const TOM: Record<MeetingStatus, 'primary' | 'success' | 'neutral' | 'danger'> = {
  SCHEDULED: 'primary',
  COMPLETED: 'success',
  CANCELED: 'neutral',
  NO_SHOW: 'danger',
};

const PAGINA = 5;

export interface LeadMeetingsSectionProps {
  leadId: string;
  leadName: string;
  meetings: Meeting[];
  /** Falso quando quem esta olhando so pode acompanhar o lead. */
  canEdit: boolean;
}

export function LeadMeetingsSection({
  leadId,
  leadName,
  meetings,
  canEdit,
}: LeadMeetingsSectionProps) {
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Meeting | null>(null);
  const [detalhe, setDetalhe] = useState<Meeting | null>(null);
  const [mostrarHistorico, setMostrarHistorico] = useState(PAGINA);

  const agora = Date.now();

  // "Futura" inclui a que esta acontecendo agora: o botao do Meet importa.
  const futuras = meetings
    .filter(
      (reuniao) => reuniao.status === 'SCHEDULED' && new Date(reuniao.endAt).getTime() > agora,
    )
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const historico = meetings
    .filter((reuniao) => !futuras.includes(reuniao))
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  const [proxima, ...outrasFuturas] = futuras;

  return (
    <section aria-labelledby="reunioes-titulo">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="reunioes-titulo" className="text-sm font-semibold">
          Reunioes
        </h3>
        {canEdit ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditando(null);
              setFormAberto(true);
            }}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Agendar reuniao
          </Button>
        ) : null}
      </div>

      {meetings.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            title="Nenhuma reuniao com este cliente"
            description={
              canEdit
                ? 'Crie a sala no Google Meet e agende aqui.'
                : 'Somente quem trabalha este lead pode agendar.'
            }
          />
        </div>
      ) : (
        <div className="mt-3 space-y-4">
          {/* --- Proxima em destaque -------------------------------------- */}
          {proxima ? (
            <div className="rounded-md border border-primary/30 bg-primary-soft/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Proxima reuniao
              </p>
              <button
                type="button"
                onClick={() => setDetalhe(proxima)}
                className="mt-1 block w-full text-left"
              >
                <p className="text-sm font-medium">
                  {formatMeetingWhen(proxima.startAt)}
                  {isHappeningNow(proxima.startAt, proxima.endAt) ? (
                    <Badge tone="warning" className="ml-2">
                      Agora
                    </Badge>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{proxima.title}</p>
              </button>

              <Button size="sm" className="mt-2" asChild>
                <a href={proxima.meetUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="h-4 w-4" aria-hidden="true" />
                  Entrar no Google Meet
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </Button>
            </div>
          ) : null}

          {/* --- Demais futuras ------------------------------------------ */}
          {outrasFuturas.length > 0 ? (
            <div>
              <h4 className="text-xs text-muted-foreground">Outras agendadas</h4>
              <ul className="mt-1 divide-y divide-border">
                {outrasFuturas.map((reuniao) => (
                  <li key={reuniao.id}>
                    <button
                      type="button"
                      onClick={() => setDetalhe(reuniao)}
                      className="w-full py-2 text-left"
                    >
                      <p className="text-sm">{formatMeetingWhen(reuniao.startAt)}</p>
                      <p className="truncate text-xs text-muted-foreground">{reuniao.title}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* --- Historico ----------------------------------------------- */}
          {historico.length > 0 ? (
            <div>
              <h4 className="text-xs text-muted-foreground">Historico</h4>
              <ul className="mt-1 divide-y divide-border">
                {historico.slice(0, mostrarHistorico).map((reuniao) => (
                  <li key={reuniao.id}>
                    <button
                      type="button"
                      onClick={() => setDetalhe(reuniao)}
                      className="flex w-full items-center justify-between gap-2 py-2 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm">
                          {formatMeetingWindow(reuniao.startAt, reuniao.endAt)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {reuniao.title}
                        </span>
                      </span>
                      <Badge tone={TOM[reuniao.status]}>
                        {MEETING_STATUS_LABELS[reuniao.status]}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>

              {historico.length > mostrarHistorico ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => setMostrarHistorico((atual) => atual + PAGINA)}
                >
                  Ver mais {Math.min(PAGINA, historico.length - mostrarHistorico)} de{' '}
                  {historico.length - mostrarHistorico}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      <MeetingFormDialog
        open={formAberto}
        onOpenChange={setFormAberto}
        meeting={editando}
        fixedLead={editando ? null : { id: leadId, internalName: leadName }}
        onSaved={() => setEditando(null)}
      />

      <MeetingDetailDialog
        meeting={detalhe}
        onOpenChange={(aberto) => {
          if (!aberto) setDetalhe(null);
        }}
        onEdit={(reuniao) => {
          setDetalhe(null);
          setEditando(reuniao);
          setFormAberto(true);
        }}
      />
    </section>
  );
}
