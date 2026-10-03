/**
 * Drawer de detalhes do lead.
 *
 * Seções: visão geral, contatos e links, serviço e proposta, atividades,
 * follow-ups, histórico de etapas, venda e financeiro e — para leads do
 * Google — os dados atuais consultados ao vivo.
 *
 * Se a API do Google falhar, TODO o conteúdo próprio do CRM continua visível.
 */
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  CalendarPlus,
  CheckCircle2,
  ExternalLink,
  Globe,
  Instagram,
  Lock,
  UserRound,
  MapPin,
  MessageSquarePlus,
  Phone,
  PhoneCall,
  RefreshCw,
  Save,
  Undo2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { ATTRIBUTION_TEXT, ACTIVITY_TYPE_LABELS, LEAD_EVENT_LABELS } from '@shared/constants';
import {
  formatDate,
  formatDateTime,
  formatDuration,
  formatMoney,
  formatPhone,
} from '@shared/format';
import { api, newIdempotencyKey } from '../../lib/api';
import {
  useGoogleDetails,
  useInvalidateCrm,
  useLeadDetail,
  useLeadHistory,
  type LeadDetailResponse,
} from '../../hooks/useCrm';
import {
  Badge,
  Button,
  Callout,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '../ui';
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { DeleteLeadDialog } from './DeleteLeadDialog';
import { LeadMeetingsSection } from './LeadMeetingsSection';
import { LeadSiteAiSection } from './LeadSiteAiSection';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useTeam, useTransferLead } from '../../hooks/useTeam';
import { useToast } from '../ui/Toast';

interface LeadDrawerProps {
  leadId: string | null;
  onOpenChange: (open: boolean) => void;
}

/** Valor do seletor para "sem dono": Select do Radix nao aceita string vazia. */
const SEM_DONO = '__sem_dono__';

export function LeadDrawer({ leadId, onOpenChange }: LeadDrawerProps) {
  const detailQuery = useLeadDetail(leadId);
  const historyQuery = useLeadHistory(leadId);
  const detail = detailQuery.data;

  return (
    <Dialog open={Boolean(leadId)} onOpenChange={onOpenChange}>
      <DialogContent layout="drawer" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{detail?.lead.internalName ?? 'Carregando lead...'}</DialogTitle>
          <DialogDescription>
            {detail
              ? `${detail.stageName}${detail.sourceName ? ` · ${detail.sourceName}` : ''}`
              : 'Buscando informacoes do CRM.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="p-0">
          {detailQuery.isLoading ? (
            <LoadingBlock label="Carregando o lead..." />
          ) : detailQuery.isError || !detail ? (
            <div className="p-4">
              <ErrorState
                message="Nao foi possivel carregar este lead. Tente novamente."
                onRetry={() => void detailQuery.refetch()}
              />
            </div>
          ) : (
            <LeadDrawerContent
              detail={detail}
              history={historyQuery.data ?? null}
              historyLoading={historyQuery.isLoading}
              onOpenChange={onOpenChange}
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function LeadDrawerContent({
  detail,
  history,
  historyLoading,
  onOpenChange,
}: {
  detail: LeadDetailResponse;
  history: ReturnType<typeof useLeadHistory>['data'] | null;
  historyLoading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const invalidate = useInvalidateCrm();
  const queryClient = useQueryClient();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const lead = detail.lead;
  // O dono da conta pode alterar lead de qualquer pessoa, mas precisa saber
  // de quem ele e antes de mexer.
  const deOutraPessoa = Boolean(detail.owner && detail.owner.id !== user?.id);
  const isGoogleLead = Boolean(detail.google);

  const archiveLead = async () => {
    setArchiving(true);
    try {
      await api.post(`/leads/${lead.id}/archive`);
      toast.success('Lead arquivado', 'Todo o historico foi preservado.');
      invalidate();
      setArchiveOpen(false);
    } catch {
      toast.error('Nao foi possivel arquivar', 'Tente novamente em instantes.');
    } finally {
      setArchiving(false);
    }
  };

  const deleteLead = async () => {
    setDeleting(true);
    try {
      await api.delete(`/leads/${lead.id}`);
      toast.success('Lead excluido', 'Os valores sairam do painel.');
      // O painel e o quadro precisam ser recarregados: os numeros mudaram.
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteOpen(false);
    } catch {
      toast.error('Nao foi possivel excluir', 'Tente novamente em instantes.');
    } finally {
      setDeleting(false);
    }
  };

  const restoreLead = async () => {
    try {
      await api.post(`/leads/${lead.id}/restore`);
      toast.success('Lead restaurado');
      invalidate();
    } catch {
      toast.error('Nao foi possivel restaurar');
    }
  };

  return (
    <div className="flex flex-col">
      {/* --- Quem trabalha este lead -------------------------------------- */}
      {!detail.canEdit ? (
        <div className="border-b border-border p-4">
          <Callout
            tone="info"
            title={
              detail.owner
                ? `${detail.owner.name} esta trabalhando este lead`
                : 'Voce nao pode alterar este lead'
            }
            icon={<Lock className="h-4 w-4" aria-hidden="true" />}
          >
            Voce acompanha tudo: contatos, historico e valores. Mover de coluna, editar e registrar
            venda sao acoes de quem e dono do lead. Peca ao dono da conta para transferir se
            precisar assumir.
          </Callout>
        </div>
      ) : deOutraPessoa ? (
        <div className="border-b border-border p-4">
          <Callout
            tone="info"
            title={`${detail.owner!.name} esta trabalhando este lead`}
            icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
          >
            Voce pode alterar por ser o dono da conta, mas o contato e acompanhado por{' '}
            {detail.owner!.name}. Para passar a outra pessoa, use Transferir lead em Acoes.
          </Callout>
        </div>
      ) : null}

      {/* --- Alertas de completude ---------------------------------------- */}
      {detail.completeness.criticalIssues.length > 0 ? (
        <div className="border-b border-border p-4">
          <Callout
            tone="danger"
            title="Dados incompletos"
            icon={<AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />}
          >
            <ul className="list-inside list-disc">
              {detail.completeness.criticalIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Callout>
        </div>
      ) : null}

      {lead.archivedAt ? (
        <div className="border-b border-border p-4">
          <Callout tone="warning" title="Lead arquivado">
            <div className="flex items-center justify-between gap-2">
              <span>Arquivado em {formatDate(lead.archivedAt)}. Nada foi apagado.</span>
              <Button size="sm" variant="secondary" onClick={restoreLead}>
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                Restaurar
              </Button>
            </div>
          </Callout>
        </div>
      ) : null}

      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b border-border px-4 pt-3">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Visao geral</TabsTrigger>
            <TabsTrigger value="activities">Atividades</TabsTrigger>
            <TabsTrigger value="finance">Financeiro</TabsTrigger>
            <TabsTrigger value="history">Historico</TabsTrigger>
            {isGoogleLead ? <TabsTrigger value="google">Google</TabsTrigger> : null}
          </TabsList>
        </div>

        {/* --- Visao geral ------------------------------------------------ */}
        <TabsContent value="overview" className="space-y-5 p-4">
          <section>
            <h3 className="text-sm font-semibold">Prospeccao</h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Detail label="Origem" value={detail.sourceName ?? 'Nao definida'} />
              <Detail label="Nicho" value={lead.prospectingNiche ?? '—'} />
              <Detail label="Cidade" value={lead.prospectingCity ?? '—'} />
              <Detail label="Estado" value={lead.prospectingState ?? '—'} />
              <Detail label="Entrou no CRM" value={formatDate(lead.createdAt)} />
              <Detail
                label="Tempo na etapa"
                value={formatDuration(Date.now() - new Date(lead.stageEnteredAt).getTime())}
              />
            </dl>
          </section>

          <Separator />

          <ContactsSection detail={detail} />

          <Separator />

          <section>
            <h3 className="text-sm font-semibold">Servico e proposta</h3>
            {detail.interests.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhum servico associado. Associe ao mover o lead para negociacao.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.interests.map((interest) => (
                  <li
                    key={interest.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{interest.serviceName}</p>
                      <p className="text-xs text-muted-foreground">
                        {interest.billingType === 'RECURRING_MONTHLY'
                          ? 'Recorrente mensal'
                          : 'Pagamento unico'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium">{formatMoney(interest.proposedPrice)}</p>
                      <Badge tone={interest.status === 'WON' ? 'success' : 'neutral'}>
                        {interest.status === 'WON'
                          ? 'Vendido'
                          : interest.status === 'LOST'
                            ? 'Perdido'
                            : 'Em aberto'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <LeadMeetingsSection
            leadId={lead.id}
            leadName={lead.internalName}
            meetings={detail.meetings}
            canEdit={detail.canEdit}
          />

          <Separator />

          <section>
            <h3 className="text-sm font-semibold">Acoes</h3>
            {!detail.canEdit ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Nenhuma acao disponivel: este lead e de
                {detail.owner ? ` ${detail.owner.name}` : ' outra pessoa'}.
              </p>
            ) : null}
            <div className={cn('mt-2 flex flex-wrap gap-2', !detail.canEdit && 'hidden')}>
              {lead.archivedAt ? null : (
                <Button variant="secondary" size="sm" onClick={() => setArchiveOpen(true)}>
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  Arquivar lead
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Excluir definitivamente
              </Button>
            </div>
            <p className={cn('mt-2 text-xs text-muted-foreground', !detail.canEdit && 'hidden')}>
              Arquivar tira o lead do quadro e mantem tudo. Excluir apaga vendas, cobrancas e
              pagamentos junto, e o painel deixa de contar esses valores.
            </p>

            <TransferControl leadId={lead.id} ownerId={detail.owner?.id ?? null} />
          </section>

          <LeadSiteAiSection leadId={lead.id} detail={detail} onNavigateAway={() => onOpenChange(false)} />
        </TabsContent>

        {/* --- Atividades e follow-ups ------------------------------------ */}
        <TabsContent value="activities" className="space-y-5 p-4">
          <ActivityForm
            leadId={lead.id}
            onDone={() => {
              invalidate();
              void queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
            }}
          />

          <Separator />

          <section>
            <h3 className="text-sm font-semibold">Follow-ups</h3>
            {detail.followUps.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum follow-up agendado.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.followUps.map((followUp) => (
                  <li
                    key={followUp.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatDate(followUp.dueAt)}</p>
                      {followUp.note ? (
                        <p className="text-xs text-muted-foreground">{followUp.note}</p>
                      ) : null}
                    </div>
                    {followUp.status === 'PENDING' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          try {
                            await api.post(`/follow-ups/${followUp.id}/complete`, {
                              idempotencyKey: newIdempotencyKey('fu'),
                            });
                            toast.success('Follow-up concluido');
                            invalidate();
                            void queryClient.invalidateQueries({ queryKey: ['lead', lead.id] });
                          } catch {
                            toast.error('Nao foi possivel concluir');
                          }
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Concluir
                      </Button>
                    ) : (
                      <Badge tone={followUp.status === 'COMPLETED' ? 'success' : 'neutral'}>
                        {followUp.status === 'COMPLETED' ? 'Concluido' : 'Cancelado'}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="text-sm font-semibold">Anotacoes e tentativas</h3>
            {detail.activities.length === 0 ? (
              <EmptyState
                title="Nenhuma atividade registrada"
                description="Registre uma tentativa de contato ou uma anotacao para manter o historico."
              />
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.activities.map((activity) => (
                  <li key={activity.id} className="rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="outline">
                        {ACTIVITY_TYPE_LABELS[
                          activity.activityType as keyof typeof ACTIVITY_TYPE_LABELS
                        ] ?? activity.activityType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(activity.occurredAt)}
                      </span>
                    </div>
                    {activity.body ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm">{activity.body}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        {/* --- Financeiro -------------------------------------------------- */}
        <TabsContent value="finance" className="space-y-5 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
              <p className="mt-1 text-lg font-semibold text-warning">
                {formatMoney(detail.finance.pendingTotal)}
              </p>
            </div>
            <div className="rounded-md border border-border p-3">
              <p className="text-xs text-muted-foreground">Recebido</p>
              <p className="mt-1 text-lg font-semibold text-success">
                {formatMoney(detail.finance.paidTotal)}
              </p>
            </div>
          </div>

          <section>
            <h3 className="text-sm font-semibold">Cobrancas</h3>
            {detail.finance.receivables.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma cobranca registrada.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.finance.receivables.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.descriptionSnapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        Vence {formatDate(item.dueDate)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium">{formatMoney(item.amount)}</p>
                      <ReceivableBadge status={item.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {detail.finance.subscriptions.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold">Recorrencias</h3>
              <ul className="mt-2 space-y-2">
                {detail.finance.subscriptions.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.serviceNameSnapshot}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.status === 'ACTIVE' && item.nextDueDate
                          ? `Proxima em ${formatDate(item.nextDueDate)}`
                          : item.status === 'CANCELED'
                            ? `Cancelada em ${formatDate(item.canceledAt)}`
                            : 'Pausada'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-medium">{formatMoney(item.amountSnapshot)}/mes</p>
                      <Badge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {item.status === 'ACTIVE' ? 'Ativa' : 'Encerrada'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Confirmacoes, cancelamentos e estornos ficam na tela Financeiro.
          </p>
        </TabsContent>

        {/* --- Historico --------------------------------------------------- */}
        <TabsContent value="history" className="space-y-5 p-4">
          {historyLoading ? (
            <LoadingBlock />
          ) : (
            <>
              <Callout tone="info" title="Historico preservado">
                Mover o card nao apaga passagens anteriores. Tentativas registradas:{' '}
                <strong>{history?.attemptCount ?? 0}</strong>.
              </Callout>

              <section>
                <h3 className="text-sm font-semibold">Passagens por etapa</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {(history?.stageHistory ?? []).map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1.5"
                    >
                      <span className="font-medium">{entry.stageName}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(entry.enteredAt)}
                        {entry.exitedAt ? ` → ${formatDateTime(entry.exitedAt)}` : ' (atual)'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Eventos</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {(history?.events ?? []).map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1.5"
                    >
                      <span>
                        {LEAD_EVENT_LABELS[event.eventType as keyof typeof LEAD_EVENT_LABELS] ??
                          event.eventType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(event.occurredAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </TabsContent>

        {/* --- Dados ao vivo do Google ------------------------------------- */}
        {isGoogleLead ? (
          <TabsContent value="google" className="p-4">
            <GooglePanel
              leadId={lead.id}
              placeId={detail.google!.placeId}
              mapsUrl={detail.google!.mapsUrl}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      <DeleteLeadDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        leadId={lead.id}
        leadName={lead.internalName}
        loading={deleting}
        onConfirm={deleteLead}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Arquivar lead"
        description={`O lead "${lead.internalName}" sai da visao padrao do CRM.`}
        consequence="Nada e apagado: eventos, vendas, pagamentos e anotacoes continuam guardados e o lead pode ser restaurado depois."
        confirmLabel="Arquivar lead"
        loading={archiving}
        onConfirm={archiveLead}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}

function ReceivableBadge({ status }: { status: string }) {
  const map: Record<string, { tone: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> =
    {
      PAID: { tone: 'success', label: 'Recebido' },
      PENDING: { tone: 'warning', label: 'Pendente' },
      OVERDUE: { tone: 'danger', label: 'Vencido' },
      CANCELED: { tone: 'neutral', label: 'Cancelado' },
      REVERSED: { tone: 'neutral', label: 'Estornado' },
    };
  const entry = map[status] ?? { tone: 'neutral' as const, label: status };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}

function ContactsSection({ detail }: { detail: LeadDetailResponse }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">Contatos e links</h3>

      {detail.contacts.length === 0 && detail.links.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nenhum contato proprio salvo neste lead.
        </p>
      ) : null}

      <ul className="mt-2 space-y-2">
        {detail.contacts.map((contact) => (
          <li
            key={contact.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">
                {contact.type === 'EMAIL'
                  ? contact.value
                  : formatPhone(contact.normalizedValue ?? contact.value)}
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {contact.isConfirmed ? 'Confirmado por voce' : 'Importado'}
                {!contact.isValid ? (
                  <span className="text-destructive"> · numero nao reconhecido</span>
                ) : null}
              </p>
            </div>

            <div className="flex shrink-0 gap-1">
              {contact.normalizedValue && contact.isValid && contact.type !== 'EMAIL' ? (
                <>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={`tel:${contact.normalizedValue}`} aria-label="Ligar">
                      <PhoneCall className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </Button>
                  {contact.whatsappUrl ? (
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={contact.whatsappUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Abrir WhatsApp (nao confirmado)"
                        title="Abrir WhatsApp — nao confirmado"
                      >
                        <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </li>
        ))}

        {detail.links.map((link) => (
          <li
            key={link.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <LinkIcon type={link.type} />
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="truncate text-primary hover:underline"
              >
                {link.normalizedHost ?? link.url}
              </a>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </li>
        ))}
      </ul>

      {detail.contacts.some((contact) => !contact.isValid) ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Contatos nao reconhecidos ficam visiveis para revisao e nunca geram links quebrados.
        </p>
      ) : null}
    </section>
  );
}

function LinkIcon({ type }: { type: string }) {
  const className = 'h-4 w-4 shrink-0 text-muted-foreground';
  if (type === 'INSTAGRAM') return <Instagram className={className} aria-hidden="true" />;
  if (type === 'MAPS') return <MapPin className={className} aria-hidden="true" />;
  if (type === 'WHATSAPP') return <Phone className={className} aria-hidden="true" />;
  return <Globe className={className} aria-hidden="true" />;
}

/** Formulario de anotacao / tentativa de contato. */
function ActivityForm({ leadId, onDone }: { leadId: string; onDone: () => void }) {
  const toast = useToast();
  const [activityType, setActivityType] = useState('CONTACT_ATTEMPT');
  const [body, setBody] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.post(`/leads/${leadId}/activities`, {
        activityType,
        body: body || null,
        nextFollowUpAt: nextFollowUp || null,
        idempotencyKey: newIdempotencyKey('act'),
      });
      toast.success(
        activityType === 'NOTE' ? 'Anotacao registrada' : 'Tentativa registrada',
        'Isto nao cria um novo primeiro contato.',
      );
      setBody('');
      setNextFollowUp('');
      onDone();
    } catch {
      toast.error('Nao foi possivel registrar', 'Tente novamente em instantes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Registrar atividade</h3>

      <Callout tone="info">
        Uma tentativa de contato entra no historico como tentativa. Ela nunca conta como um contato
        novo na meta de primeiros contatos.
      </Callout>

      <Field label="Tipo" htmlFor="activity-type">
        <Select value={activityType} onValueChange={setActivityType}>
          <SelectTrigger id="activity-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Anotacao" htmlFor="activity-body">
        <Textarea
          id="activity-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="O que aconteceu neste contato?"
        />
      </Field>

      <Field
        label="Agendar proximo follow-up"
        htmlFor="activity-followup"
        hint="Opcional. Aceita data no passado, hoje ou futuro."
      >
        <Input
          id="activity-followup"
          type="date"
          value={nextFollowUp}
          onChange={(event) => setNextFollowUp(event.target.value)}
        />
      </Field>

      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} loadingText="Registrando...">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Registrar
        </Button>
      </div>
    </section>
  );
}

/**
 * Painel de dados atuais do Google.
 * Nada aqui e gravado automaticamente: cada dado precisa de um clique
 * explicito em "Salvar como dado confirmado".
 */
function GooglePanel({
  leadId,
  placeId,
  mapsUrl,
}: {
  leadId: string;
  placeId: string;
  mapsUrl: string;
}) {
  const [enabled, setEnabled] = useState(false);
  const query = useGoogleDetails(placeId, enabled);
  const toast = useToast();
  const invalidate = useInvalidateCrm();
  const queryClient = useQueryClient();

  const details = query.data?.details as
    | {
        name?: string;
        address?: string | null;
        category?: string | null;
        businessStatus?: string;
        rating?: number | null;
        userRatingCount?: number | null;
        phone?: { display: string | null; e164: string | null; isValid: boolean; type: string };
        website?: { url: string | null; classification: string; label: string };
        whatsappUrl?: string | null;
        attribution?: string;
      }
    | undefined;

  const saveContact = async (value: string, type: 'PHONE' | 'WHATSAPP') => {
    try {
      await api.post(`/leads/${leadId}/contacts`, { type, value, isPrimary: false });
      toast.success('Contato salvo no CRM', 'Agora ele e um dado proprio, confirmado por voce.');
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    } catch {
      toast.error('Nao foi possivel salvar o contato');
    }
  };

  const saveLink = async (url: string, type: 'WEBSITE' | 'INSTAGRAM') => {
    try {
      await api.post(`/leads/${leadId}/links`, { type, url, isPrimary: false });
      toast.success('Link salvo no CRM', 'Agora ele e um dado proprio, confirmado por voce.');
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    } catch {
      toast.error('Nao foi possivel salvar o link');
    }
  };

  return (
    <div className="space-y-4">
      <Callout tone="info" title="Dados publicos consultados ao vivo">
        A plataforma nao guarda copia do conteudo do Google. Os dados abaixo sao buscados na hora e
        descartados ao fechar. Salve apenas o que voce quiser incorporar ao CRM.
      </Callout>

      {!enabled ? (
        <Button onClick={() => setEnabled(true)}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Consultar dados atuais no Google
        </Button>
      ) : query.isLoading ? (
        <LoadingBlock label="Consultando o Google..." />
      ) : query.isError ? (
        <ErrorState
          title="Dados do Google indisponiveis"
          message="Nao foi possivel consultar o Google agora. Todo o conteudo do CRM acima continua disponivel."
          onRetry={() => void query.refetch()}
        />
      ) : details ? (
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Detail label="Nome no Google" value={details.name ?? '—'} />
            <Detail label="Categoria" value={details.category ?? '—'} />
            <Detail label="Endereco" value={details.address ?? '—'} />
            <Detail
              label="Situacao"
              value={
                details.businessStatus === 'OPERATIONAL'
                  ? 'Em operacao'
                  : details.businessStatus === 'CLOSED_TEMPORARILY'
                    ? 'Fechada temporariamente'
                    : details.businessStatus === 'CLOSED_PERMANENTLY'
                      ? 'Fechada permanentemente'
                      : 'Nao informada'
              }
            />
            <Detail
              label="Nota"
              value={
                details.rating
                  ? `${details.rating} (${details.userRatingCount ?? 0} avaliacoes)`
                  : '—'
              }
            />
          </dl>

          {details.phone?.e164 ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{formatPhone(details.phone.e164)}</p>
                <p className="text-xs text-muted-foreground">
                  {details.phone.type === 'MOBILE'
                    ? 'Numero movel — WhatsApp nao confirmado'
                    : details.phone.type === 'FIXED_LINE'
                      ? 'Telefone fixo'
                      : 'Tipo nao identificado'}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => saveContact(details.phone!.e164!, 'PHONE')}
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Salvar como contato confirmado
              </Button>
            </div>
          ) : null}

          {details.website?.url ? (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
              <div className="min-w-0">
                <a
                  href={details.website.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="truncate text-primary hover:underline"
                >
                  {details.website.url}
                </a>
                <p className="text-xs text-muted-foreground">{details.website.label}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  saveLink(
                    details.website!.url!,
                    details.website!.classification === 'INSTAGRAM' ? 'INSTAGRAM' : 'WEBSITE',
                  )
                }
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                Salvar link confirmado
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href={mapsUrl} target="_blank" rel="noreferrer noopener">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Abrir no Google Maps
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void query.refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Atualizar
            </Button>
          </div>

          <p className="border-t border-border pt-2 text-xs text-muted-foreground">
            {details.attribution ?? ATTRIBUTION_TEXT}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Transferir o lead para outra pessoa.
 *
 * So aparece para o dono da conta -- e a valvula de escape combinada: sem
 * ela, o lead de quem sai da empresa ficaria preso para sempre.
 */
function TransferControl({ leadId, ownerId }: { leadId: string; ownerId: string | null }) {
  const toast = useToast();
  const { pode } = useAuth();
  const team = useTeam();
  const transferir = useTransferLead();
  const [destino, setDestino] = useState<string>(ownerId ?? SEM_DONO);

  if (!pode('LEAD_TRANSFER')) return null;

  const ativos = (team.data?.members ?? []).filter((membro) => membro.active);

  return (
    <div className="mt-4 rounded-md border border-border p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Responsavel
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Quem pode mover, editar e vender este lead. Fica registrado no historico.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Select value={destino} onValueChange={setDestino}>
          <SelectTrigger className="w-56" aria-label="Responsavel pelo lead">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEM_DONO}>Sem dono (livre para qualquer um)</SelectItem>
            {ativos.map((membro) => (
              <SelectItem key={membro.id} value={membro.id}>
                {membro.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="secondary"
          size="sm"
          loading={transferir.isPending}
          disabled={destino === (ownerId ?? SEM_DONO)}
          onClick={async () => {
            try {
              await transferir.mutateAsync({
                leadId,
                ownerUserId: destino === SEM_DONO ? null : destino,
              });
              toast.success('Lead transferido');
            } catch {
              toast.error('Nao foi possivel transferir', 'Tente novamente em instantes.');
            }
          }}
        >
          Transferir
        </Button>
      </div>
    </div>
  );
}
