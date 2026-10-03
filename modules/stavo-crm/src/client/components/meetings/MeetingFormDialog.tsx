/**
 * Formulario de reuniao — agendar, editar e reagendar.
 *
 * UM formulario para os tres caminhos de entrada (botao da agenda, clique no
 * calendario, card do lead). Duplicar a tela duplicaria a regra do link e do
 * conflito, e as duas copias divergiriam.
 *
 * Mudar data ou horario de uma reuniao existente NAO e edicao comum: vai pelo
 * reagendamento, que grava o horario anterior no historico. Quem decide isso
 * e este componente, comparando o que foi digitado com o que ja existia.
 */
import { CalendarClock, ExternalLink, Loader2, Search, Video } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { APP_TIMEZONE } from '@shared/constants';
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_REMINDER_OFFSETS,
  DURATION_PRESETS_MINUTES,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  REMINDER_OFFSET_LABELS,
  parseMeetUrl,
} from '@shared/meetings';
import { Badge, Button, Callout, Checkbox, Field, Input, Textarea } from '../ui';
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
  useCreateMeeting,
  useRescheduleMeeting,
  useUpdateMeeting,
  type Meeting,
} from '../../hooks/useMeetings';
import { ApiError, api } from '../../lib/api';
import { addMinutes, durationMinutes, toInstant, toLocalParts } from '../../lib/meetingTime';

interface LeadOption {
  id: string;
  internalName: string;
  stageName: string;
  city: string | null;
  niche: string | null;
}

export interface MeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reuniao existente. Ausente cria uma nova. */
  meeting?: Meeting | null;
  /** Lead ja escolhido (abertura pelo card): trava o campo. */
  fixedLead?: { id: string; internalName: string } | null;
  /** Data/hora clicada no calendario, em instante ISO. */
  initialStart?: string | null;
  onSaved?: (meeting: Meeting) => void;
}

const AGORA_MAIS_UMA_HORA = (): Date => {
  const data = new Date(Date.now() + 60 * 60 * 1000);
  // Arredonda para os proximos 15 minutos: horario cheio e mais natural.
  data.setMinutes(Math.ceil(data.getMinutes() / 15) * 15, 0, 0);
  return data;
};

export function MeetingFormDialog({
  open,
  onOpenChange,
  meeting = null,
  fixedLead = null,
  initialStart = null,
  onSaved,
}: MeetingFormDialogProps) {
  const toast = useToast();
  const criar = useCreateMeeting();
  const atualizar = useUpdateMeeting();
  const reagendar = useRescheduleMeeting();

  const editando = Boolean(meeting);

  const [leadId, setLeadId] = useState('');
  const [leadNome, setLeadNome] = useState('');
  const [busca, setBusca] = useState('');
  const [opcoes, setOpcoes] = useState<LeadOption[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duracao, setDuracao] = useState(DEFAULT_DURATION_MINUTES);
  const [meetUrl, setMeetUrl] = useState('');
  const [agenda, setAgenda] = useState('');
  const [notas, setNotas] = useState('');
  const [lembretes, setLembretes] = useState<number[]>([...DEFAULT_REMINDER_OFFSETS]);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [errosCampo, setErrosCampo] = useState<Record<string, string[]>>({});

  const salvando = criar.isPending || atualizar.isPending || reagendar.isPending;

  // --- Preenchimento inicial ---------------------------------------------
  useEffect(() => {
    if (!open) return;

    setErroServidor(null);
    setErrosCampo({});
    setBusca('');
    setOpcoes([]);

    if (meeting) {
      const partes = toLocalParts(meeting.startAt);
      setLeadId(meeting.leadId);
      setLeadNome(meeting.leadName);
      setTitle(meeting.title);
      setDate(partes.date);
      setTime(partes.time);
      setDuracao(durationMinutes(meeting.startAt, meeting.endAt));
      setMeetUrl(meeting.meetUrl);
      setAgenda(meeting.agenda ?? '');
      setNotas(meeting.internalNotes ?? '');
      return;
    }

    const inicio = initialStart ? new Date(initialStart) : AGORA_MAIS_UMA_HORA();
    const partes = toLocalParts(inicio);
    setLeadId(fixedLead?.id ?? '');
    setLeadNome(fixedLead?.internalName ?? '');
    setTitle(fixedLead ? `Reuniao com ${fixedLead.internalName}` : '');
    setDate(partes.date);
    setTime(partes.time);
    setDuracao(DEFAULT_DURATION_MINUTES);
    setMeetUrl('');
    setAgenda('');
    setNotas('');
    setLembretes([...DEFAULT_REMINDER_OFFSETS]);
  }, [open, meeting, fixedLead, initialStart]);

  // --- Autocomplete de lead ----------------------------------------------
  const debounce = useRef<number | null>(null);

  useEffect(() => {
    if (fixedLead || editando) return;
    if (busca.trim().length < 2) {
      setOpcoes([]);
      return;
    }

    // Sem debounce, cada tecla viraria uma consulta ao banco.
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      setBuscando(true);
      api
        .get<{ leads: LeadOption[] }>(`/leads/search?q=${encodeURIComponent(busca.trim())}`)
        .then((resposta) => setOpcoes(resposta.leads))
        .catch(() => setOpcoes([]))
        .finally(() => setBuscando(false));
    }, 300);

    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, [busca, fixedLead, editando]);

  // --- Validacao local ----------------------------------------------------
  const linkResultado = useMemo(() => parseMeetUrl(meetUrl), [meetUrl]);

  const inicio = useMemo(() => {
    if (!date || !time) return null;
    try {
      return toInstant(date, time);
    } catch {
      return null;
    }
  }, [date, time]);

  const noPassado = useMemo(() => {
    // Editar uma reuniao que ja passou nao deve reclamar do passado enquanto
    // o horario nao for alterado.
    if (!inicio) return false;
    if (editando && meeting && inicio.getTime() === new Date(meeting.startAt).getTime()) {
      return false;
    }
    return inicio.getTime() < Date.now();
  }, [inicio, editando, meeting]);

  const duracaoValida = duracao >= MIN_DURATION_MINUTES && duracao <= MAX_DURATION_MINUTES;

  const podeSalvar =
    leadId.length > 0 &&
    title.trim().length >= 3 &&
    Boolean(inicio) &&
    !noPassado &&
    duracaoValida &&
    linkResultado.ok &&
    !salvando;

  const erroDe = (campo: string): string | undefined => errosCampo[campo]?.[0];

  // --- Envio --------------------------------------------------------------
  const salvar = async () => {
    if (!inicio || !linkResultado.ok) return;
    setErroServidor(null);
    setErrosCampo({});

    const fim = addMinutes(inicio, duracao);

    try {
      if (meeting) {
        const horarioMudou =
          inicio.getTime() !== new Date(meeting.startAt).getTime() ||
          fim.getTime() !== new Date(meeting.endAt).getTime();

        // Conteudo primeiro; o horario vai pelo reagendamento, que registra o
        // antes/depois no historico do lead.
        const aposConteudo = await atualizar.mutateAsync({
          id: meeting.id,
          expectedVersion: meeting.version,
          title: title.trim(),
          agenda: agenda.trim() || null,
          internalNotes: notas.trim() || null,
          meetUrl: linkResultado.url,
        });

        const resultado = horarioMudou
          ? await reagendar.mutateAsync({
              id: meeting.id,
              // A versao subiu na atualizacao acima.
              expectedVersion: aposConteudo.meeting.version,
              startAt: inicio.toISOString(),
              endAt: fim.toISOString(),
              reminderOffsetsMinutes: lembretes,
            })
          : aposConteudo;

        toast.success(horarioMudou ? 'Reuniao reagendada' : 'Reuniao atualizada');
        onSaved?.(resultado.meeting);
      } else {
        const resposta = await criar.mutateAsync({
          leadId,
          title: title.trim(),
          agenda: agenda.trim() || null,
          internalNotes: notas.trim() || null,
          serviceId: null,
          startAt: inicio.toISOString(),
          endAt: fim.toISOString(),
          timezone: APP_TIMEZONE,
          meetUrl: linkResultado.url,
          reminderOffsetsMinutes: lembretes,
        });
        toast.success('Reuniao agendada', `${leadNome} — ${date.split('-').reverse().join('/')}`);
        onSaved?.(resposta.meeting);
      }

      onOpenChange(false);
    } catch (erro) {
      if (erro instanceof ApiError) {
        setErroServidor(erro.message);
        if (erro.fieldErrors) setErrosCampo(erro.fieldErrors);
      } else {
        setErroServidor('Nao foi possivel salvar agora. Tente novamente em instantes.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar reuniao' : 'Nova reuniao'}</DialogTitle>
          <DialogDescription>
            Horario de Brasilia. Crie a sala no Google Meet e cole o link aqui.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {erroServidor ? (
            <Callout tone="danger" title="Nao foi possivel salvar">
              {erroServidor}
            </Callout>
          ) : null}

          {/* --- Cliente ------------------------------------------------- */}
          <Field
            label="Cliente"
            htmlFor="reuniao-lead"
            required
            error={erroDe('leadId')}
            hint={
              fixedLead || editando
                ? 'A reuniao pertence a este lead.'
                : 'Digite ao menos 2 letras do nome interno do lead.'
            }
          >
            {fixedLead || editando ? (
              <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm">
                {leadNome}
              </div>
            ) : leadId ? (
              <div className="flex items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 py-2 text-sm">
                <span className="truncate">{leadNome}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLeadId('');
                    setLeadNome('');
                    setBusca('');
                  }}
                >
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-3 h-4 w-4 opacity-60"
                    aria-hidden="true"
                  />
                  <Input
                    id="reuniao-lead"
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Buscar cliente no CRM..."
                    className="pl-9"
                    autoComplete="off"
                  />
                  {buscando ? (
                    <Loader2
                      className="absolute right-3 top-3 h-4 w-4 animate-spin opacity-60"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                {opcoes.length > 0 ? (
                  <ul
                    className="max-h-48 overflow-y-auto rounded-md border border-border"
                    role="listbox"
                    aria-label="Clientes encontrados"
                  >
                    {opcoes.map((opcao) => (
                      <li key={opcao.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          onClick={() => {
                            setLeadId(opcao.id);
                            setLeadNome(opcao.internalName);
                            if (!title.trim()) setTitle(`Reuniao com ${opcao.internalName}`);
                          }}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{opcao.internalName}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[opcao.city, opcao.niche].filter(Boolean).join(' · ') ||
                                'Sem cidade definida'}
                            </span>
                          </span>
                          <Badge tone="neutral">{opcao.stageName}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : busca.trim().length >= 2 && !buscando ? (
                  <p className="text-xs text-muted-foreground">
                    Nenhum cliente encontrado. A reuniao precisa de um lead que ja exista no CRM.
                  </p>
                ) : null}
              </div>
            )}
          </Field>

          {/* --- Titulo -------------------------------------------------- */}
          <Field
            label="Titulo da reuniao"
            htmlFor="reuniao-titulo"
            required
            error={erroDe('title')}
          >
            <Input
              id="reuniao-titulo"
              value={title}
              onChange={(evento) => setTitle(evento.target.value)}
              placeholder="Ex.: Apresentacao da proposta"
              maxLength={160}
            />
          </Field>

          {/* --- Data e hora --------------------------------------------- */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Data" htmlFor="reuniao-data" required error={erroDe('startAt')}>
              <Input
                id="reuniao-data"
                type="date"
                value={date}
                onChange={(evento) => setDate(evento.target.value)}
              />
            </Field>

            <Field label="Horario" htmlFor="reuniao-hora" required>
              <Input
                id="reuniao-hora"
                type="time"
                value={time}
                onChange={(evento) => setTime(evento.target.value)}
              />
            </Field>

            <Field
              label="Duracao"
              htmlFor="reuniao-duracao"
              required
              error={
                duracaoValida
                  ? erroDe('endAt')
                  : `Entre ${MIN_DURATION_MINUTES} e ${MAX_DURATION_MINUTES} minutos.`
              }
            >
              <Input
                id="reuniao-duracao"
                type="number"
                min={MIN_DURATION_MINUTES}
                max={MAX_DURATION_MINUTES}
                step={5}
                value={duracao}
                onChange={(evento) => setDuracao(Number(evento.target.value))}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Duracao rapida:</span>
            {DURATION_PRESETS_MINUTES.map((minutos) => (
              <Button
                key={minutos}
                type="button"
                size="sm"
                variant={duracao === minutos ? 'primary' : 'secondary'}
                onClick={() => setDuracao(minutos)}
              >
                {minutos} min
              </Button>
            ))}
          </div>

          {noPassado ? (
            <Callout tone="warning" title="Horario no passado">
              Nao e possivel agendar uma reuniao no passado. Escolha uma data e um horario futuros.
            </Callout>
          ) : inicio ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Termina as{' '}
              <strong className="font-medium">
                {toLocalParts(addMinutes(inicio, duracao)).time}
              </strong>{' '}
              (horario de Brasilia)
            </p>
          ) : null}

          {/* --- Link do Meet -------------------------------------------- */}
          <Field
            label="Link do Google Meet"
            htmlFor="reuniao-link"
            required
            error={
              erroDe('meetUrl') ??
              (meetUrl.trim().length > 0 && !linkResultado.ok ? linkResultado.reason : undefined)
            }
            hint="Crie a sala no Google Meet e cole o endereco. Somente links de meet.google.com."
          >
            <Input
              id="reuniao-link"
              value={meetUrl}
              onChange={(evento) => setMeetUrl(evento.target.value)}
              placeholder="https://meet.google.com/abc-defg-hij"
              inputMode="url"
              autoComplete="off"
            />
          </Field>

          {linkResultado.ok ? (
            <a
              href={linkResultado.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              Testar o link agora
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}

          {/* --- Opcionais ------------------------------------------------ */}
          <Field label="Objetivo ou pauta" htmlFor="reuniao-pauta">
            <Textarea
              id="reuniao-pauta"
              rows={2}
              value={agenda}
              onChange={(evento) => setAgenda(evento.target.value)}
              placeholder="O que precisa ser tratado nesta conversa"
              maxLength={2000}
            />
          </Field>

          <Field
            label="Observacoes internas"
            htmlFor="reuniao-notas"
            hint="Preparacao sua. Nao aparece para o cliente."
          >
            <Textarea
              id="reuniao-notas"
              rows={2}
              value={notas}
              onChange={(evento) => setNotas(evento.target.value)}
              maxLength={2000}
            />
          </Field>

          {/* --- Lembretes ------------------------------------------------ */}
          <fieldset>
            <legend className="text-sm font-medium">Lembretes internos</legend>
            <p className="mt-1 text-xs text-muted-foreground">
              Aparecem em &ldquo;Precisa da sua atencao&rdquo; no painel. Lembrete cujo horario ja
              passou nao e criado.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              {[1440, 60].map((offset) => (
                <label key={offset} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={lembretes.includes(offset)}
                    onCheckedChange={(marcado) =>
                      setLembretes((atual) =>
                        marcado === true
                          ? [...new Set([...atual, offset])]
                          : atual.filter((item) => item !== offset),
                      )
                    }
                  />
                  {REMINDER_OFFSET_LABELS[offset]}
                </label>
              ))}
            </div>
          </fieldset>
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={() => void salvar()} loading={salvando} disabled={!podeSalvar}>
            {editando ? 'Salvar alteracoes' : 'Agendar reuniao'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
