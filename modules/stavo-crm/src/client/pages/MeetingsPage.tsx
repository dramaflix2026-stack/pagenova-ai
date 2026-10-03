/**
 * Agenda de reunioes.
 *
 * O calendario e o FullCalendar (modulos comunitarios, MIT), tematizado com
 * os tokens da plataforma para nao parecer um corpo estranho. Ele resolve
 * mes/semana/dia/lista, navegacao e clique em horario vazio -- problemas que
 * uma implementacao caseira erraria em detalhes de borda.
 *
 * Carregamento por janela: o calendario avisa qual intervalo esta visivel e
 * so esse pedaco e pedido a API. Nunca a tabela inteira.
 *
 * Fuso: os instantes chegam em UTC e sao entregues ao calendario UMA vez,
 * com `timeZone` fixo em America/Sao_Paulo. Converter de novo aqui seria o
 * caminho classico para a reuniao aparecer tres horas deslocada.
 */
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { CalendarPlus, Video } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { APP_TIMEZONE } from '@shared/constants';
import { MEETING_STATUSES, MEETING_STATUS_LABELS, type MeetingStatus } from '@shared/meetings';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import { MeetingDetailDialog } from '../components/meetings/MeetingDetailDialog';
import { MeetingFormDialog } from '../components/meetings/MeetingFormDialog';
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui';
import { useMeetingsRange, useUpcomingMeetings, type Meeting } from '../hooks/useMeetings';
import { formatMeetingWhen, formatProximity, isHappeningNow } from '../lib/meetingTime';
import './meetings-calendar.css';

const TODOS = '__todos__';

/** Cor do evento por status, lida das variaveis do tema. */
const CORES: Record<MeetingStatus, { bg: string; border: string; text: string }> = {
  SCHEDULED: {
    bg: 'hsl(var(--primary) / 0.12)',
    border: 'hsl(var(--primary))',
    text: 'hsl(var(--foreground))',
  },
  COMPLETED: {
    bg: 'hsl(var(--success) / 0.12)',
    border: 'hsl(var(--success))',
    text: 'hsl(var(--foreground))',
  },
  CANCELED: {
    bg: 'hsl(var(--muted))',
    border: 'hsl(var(--border))',
    text: 'hsl(var(--muted-foreground))',
  },
  NO_SHOW: {
    bg: 'hsl(var(--destructive) / 0.10)',
    border: 'hsl(var(--destructive))',
    text: 'hsl(var(--foreground))',
  },
};

export default function MeetingsPage() {
  const calendario = useRef<FullCalendar>(null);

  // Janela visivel, definida pelo proprio calendario.
  const [janela, setJanela] = useState<{ start: string; end: string }>(() => {
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const fim = new Date(agora.getFullYear(), agora.getMonth() + 2, 0);
    return { start: inicio.toISOString(), end: fim.toISOString() };
  });

  const [status, setStatus] = useState<string>(TODOS);
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Meeting | null>(null);
  const [inicioSugerido, setInicioSugerido] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Meeting | null>(null);

  const filtros = useMemo(
    () => ({
      ...(status !== TODOS ? { status: status as MeetingStatus } : {}),
      ...(buscaAplicada ? { search: buscaAplicada } : {}),
    }),
    [status, buscaAplicada],
  );

  const reunioes = useMeetingsRange(janela.start, janela.end, filtros);
  const proximas = useUpcomingMeetings({ limit: 8 });

  const lista = useMemo(() => reunioes.data?.meetings ?? [], [reunioes.data]);

  const eventos: EventInput[] = useMemo(
    () =>
      lista.map((reuniao) => {
        const cor = CORES[reuniao.status];
        return {
          id: reuniao.id,
          title: `${reuniao.leadName} — ${reuniao.title}`,
          start: reuniao.startAt,
          end: reuniao.endAt,
          backgroundColor: cor.bg,
          borderColor: cor.border,
          textColor: cor.text,
          // Cancelada fica atenuada, sem sumir do historico visual.
          classNames: reuniao.status === 'CANCELED' ? ['reuniao-cancelada'] : [],
          extendedProps: { meeting: reuniao },
        };
      }),
    [lista],
  );

  const aoMudarJanela = useCallback((info: { startStr: string; endStr: string }) => {
    setJanela({
      start: new Date(info.startStr).toISOString(),
      end: new Date(info.endStr).toISOString(),
    });
  }, []);

  const aoSelecionarHorario = (info: DateSelectArg) => {
    setEditando(null);
    setInicioSugerido(info.start.toISOString());
    setFormAberto(true);
    calendario.current?.getApi().unselect();
  };

  const aoClicarEvento = (info: EventClickArg) => {
    const reuniao = info.event.extendedProps.meeting as Meeting | undefined;
    if (reuniao) setDetalhe(reuniao);
  };

  const hojeCount = lista.filter(
    (reuniao) =>
      reuniao.status === 'SCHEDULED' &&
      new Date(reuniao.startAt).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <>
      <PageHeader
        title="Agenda de reunioes"
        description={
          hojeCount === 0
            ? 'Nenhuma reuniao marcada para hoje.'
            : hojeCount === 1
              ? '1 reuniao marcada para hoje.'
              : `${hojeCount} reunioes marcadas para hoje.`
        }
        actions={
          <Button
            onClick={() => {
              setEditando(null);
              setInicioSugerido(null);
              setFormAberto(true);
            }}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Nova reuniao
          </Button>
        }
      />

      <PageBody className="space-y-4">
        {/* --- Filtros ------------------------------------------------- */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[200px] flex-1">
              <label htmlFor="reuniao-busca" className="text-xs text-muted-foreground">
                Buscar por cliente ou titulo
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="reuniao-busca"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') setBuscaAplicada(busca.trim());
                  }}
                  placeholder="Nome do cliente..."
                />
                <Button variant="secondary" onClick={() => setBuscaAplicada(busca.trim())}>
                  Buscar
                </Button>
              </div>
            </div>

            <div>
              <label htmlFor="reuniao-status" className="text-xs text-muted-foreground">
                Situacao
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="reuniao-status" className="mt-1 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  {MEETING_STATUSES.map((valor) => (
                    <SelectItem key={valor} value={valor}>
                      {MEETING_STATUS_LABELS[valor]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* --- Calendario ---------------------------------------------- */}
        <Card>
          <CardContent className="p-2 sm:p-4">
            {reunioes.isError ? (
              <ErrorState
                title="Nao foi possivel carregar a agenda"
                message="Tente novamente em instantes."
                onRetry={() => void reunioes.refetch()}
              />
            ) : (
              <div className="stavo-calendario">
                {reunioes.isFetching ? (
                  <p className="mb-2 text-xs text-muted-foreground" role="status">
                    Atualizando a agenda...
                  </p>
                ) : null}

                <FullCalendar
                  ref={calendario}
                  plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={ptBrLocale}
                  // Fuso fixo do negocio: o horario e o mesmo em qualquer
                  // maquina, independente do relogio do navegador.
                  timeZone={APP_TIMEZONE}
                  headerToolbar={{
                    left: 'prev,next hoje',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                  }}
                  customButtons={{
                    hoje: {
                      text: 'Hoje',
                      click: () => calendario.current?.getApi().today(),
                    },
                  }}
                  buttonText={{
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Dia',
                    list: 'Lista',
                  }}
                  events={eventos}
                  datesSet={aoMudarJanela}
                  selectable
                  selectMirror
                  select={aoSelecionarHorario}
                  eventClick={aoClicarEvento}
                  nowIndicator
                  height="auto"
                  expandRows
                  slotMinTime="06:00:00"
                  slotMaxTime="23:00:00"
                  allDaySlot={false}
                  firstDay={1}
                  noEventsText="Nenhuma reuniao neste periodo."
                  dayMaxEvents={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Proximas reunioes --------------------------------------- */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold">Proximas reunioes</h2>

            {proximas.isLoading ? (
              <LoadingBlock label="Carregando..." />
            ) : (proximas.data?.meetings.length ?? 0) === 0 ? (
              <EmptyState
                title="Nenhuma reuniao futura"
                description="Agende a primeira reuniao pelo botao acima ou pelo card de um lead."
                action={
                  <Button
                    onClick={() => {
                      setEditando(null);
                      setInicioSugerido(null);
                      setFormAberto(true);
                    }}
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Agendar primeira reuniao
                  </Button>
                }
              />
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {(proximas.data?.meetings ?? []).map((reuniao) => {
                  const agora = isHappeningNow(reuniao.startAt, reuniao.endAt);
                  return (
                    <li
                      key={reuniao.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <button
                        type="button"
                        onClick={() => setDetalhe(reuniao)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {reuniao.leadName}
                          {agora ? <Badge tone="warning">Agora</Badge> : null}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatMeetingWhen(reuniao.startAt)} · {reuniao.title} ·{' '}
                          {formatProximity(reuniao.startAt)}
                        </p>
                      </button>

                      <Button variant={agora ? 'primary' : 'secondary'} size="sm" asChild>
                        <a href={reuniao.meetUrl} target="_blank" rel="noopener noreferrer">
                          <Video className="h-4 w-4" aria-hidden="true" />
                          Entrar
                        </a>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </PageBody>

      <MeetingFormDialog
        open={formAberto}
        onOpenChange={setFormAberto}
        meeting={editando}
        initialStart={inicioSugerido}
        onSaved={() => {
          setEditando(null);
          setInicioSugerido(null);
        }}
      />

      <MeetingDetailDialog
        meeting={detalhe}
        onOpenChange={(aberto) => {
          if (!aberto) setDetalhe(null);
        }}
        onEdit={(reuniao) => {
          setDetalhe(null);
          setEditando(reuniao);
          setInicioSugerido(null);
          setFormAberto(true);
        }}
      />
    </>
  );
}
