/**
 * Financeiro.
 *
 * Separacao central da tela: valor pendente NAO e receita. A receita so
 * aparece depois da confirmacao manual do recebimento.
 * Nada e excluido: apenas cancelado, estornado ou revertido, sempre com motivo.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useState } from 'react';

import { RECEIVABLE_STATUS_LABELS } from '@shared/constants';
import { formatDate, formatMoney, formatReferencePeriod } from '@shared/format';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui';
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { ApiError, api, buildQuery, newIdempotencyKey } from '../lib/api';

interface Receivable {
  id: string;
  leadId: string;
  leadName: string;
  descriptionSnapshot: string;
  referencePeriod: string | null;
  amount: string;
  dueDate: string;
  status: string;
  paidAt: string | null;
}

interface Payment {
  id: string;
  leadName: string;
  amount: string;
  paymentDate: string;
  status: string;
  reversalOfId: string | null;
  reason: string | null;
  /** Preenchido quando este pagamento foi estornado depois. */
  reversedAt: string | null;
  reversalReason: string | null;
}

interface Subscription {
  id: string;
  leadName: string;
  serviceNameSnapshot: string;
  amountSnapshot: string;
  status: string;
  firstDueDate: string;
  nextDueDate: string | null;
  canceledAt: string | null;
  cancellationReason: string | null;
}

export default function FinancePage() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [confirming, setConfirming] = useState<Receivable | null>(null);
  const [canceling, setCanceling] = useState<Receivable | null>(null);
  const [reversing, setReversing] = useState<Payment | null>(null);
  const [cancelingSubscription, setCancelingSubscription] = useState<Subscription | null>(null);

  const summary = useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: () =>
      api.get<{
        pending: { total: string; count: number };
        overdue: { total: string; count: number };
        received: { total: string; count: number };
        activeMrr: { total: string; count: number };
        disclaimer: string;
      }>('/finance/summary'),
  });

  const pending = useQuery({
    queryKey: ['finance', 'receivables', 'PENDING'],
    queryFn: () =>
      api.get<{ receivables: Receivable[]; total: string }>(
        `/receivables${buildQuery({ status: 'PENDING' })}`,
      ),
  });

  const overdue = useQuery({
    queryKey: ['finance', 'receivables', 'OVERDUE'],
    queryFn: () =>
      api.get<{ receivables: Receivable[]; total: string }>(
        `/receivables${buildQuery({ status: 'OVERDUE' })}`,
      ),
  });

  const paid = useQuery({
    queryKey: ['finance', 'payments', 'received'],
    queryFn: () => api.get<{ payments: Payment[]; total: string }>('/payments?view=RECEIVED'),
  });

  const reversed = useQuery({
    queryKey: ['finance', 'payments', 'reversed'],
    queryFn: () => api.get<{ payments: Payment[]; total: string }>('/payments?view=REVERSED'),
  });

  const subscriptions = useQuery({
    queryKey: ['finance', 'subscriptions'],
    queryFn: () => api.get<{ subscriptions: Subscription[] }>('/subscriptions'),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['finance'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['board'] });
  };

  const cancelReceivable = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/receivables/${id}/cancel`, { reason }),
    onSuccess: () => {
      toast.success('Cobranca cancelada', 'O historico foi preservado.');
      invalidate();
      setCanceling(null);
    },
    onError: (error) =>
      toast.error(
        'Nao foi possivel cancelar',
        error instanceof ApiError ? error.message : undefined,
      ),
  });

  const reversePayment = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/payments/${id}/reverse`, { reason, idempotencyKey: newIdempotencyKey('rev') }),
    onSuccess: () => {
      toast.success(
        'Pagamento estornado',
        'Saiu de Recebidos e esta na aba Estornos. A cobranca voltou a ficar em aberto.',
      );
      invalidate();
      setReversing(null);
    },
    onError: (error) =>
      toast.error(
        'Nao foi possivel estornar',
        error instanceof ApiError ? error.message : undefined,
      ),
  });

  return (
    <>
      <PageHeader title="Financeiro" description="Controle comercial interno da Stavo Digital." />

      <PageBody className="space-y-5">
        {summary.isLoading ? (
          <LoadingBlock />
        ) : summary.isError ? (
          <ErrorState
            message="Nao foi possivel carregar o resumo financeiro."
            onRetry={() => void summary.refetch()}
          />
        ) : summary.data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="A receber"
                value={formatMoney(summary.data.pending.total)}
                detail={`${summary.data.pending.count} cobranca(s) em aberto`}
                tone="warning"
              />
              <SummaryCard
                label="Vencidos"
                value={formatMoney(summary.data.overdue.total)}
                detail={`${summary.data.overdue.count} cobranca(s) vencida(s)`}
                tone="danger"
              />
              <SummaryCard
                label="Receita recebida"
                value={formatMoney(summary.data.received.total)}
                detail="Ja descontados os estornos"
                tone="success"
              />
              <SummaryCard
                label="Recorrencia ativa"
                value={formatMoney(summary.data.activeMrr.total)}
                detail={`${summary.data.activeMrr.count} contrato(s) ativo(s)`}
              />
            </div>

            <Callout tone="info">{summary.data.disclaimer}</Callout>
          </>
        ) : null}

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">A receber</TabsTrigger>
            <TabsTrigger value="overdue">Vencidos</TabsTrigger>
            <TabsTrigger value="received">Recebidos</TabsTrigger>
            <TabsTrigger value="reversed">Estornos</TabsTrigger>
            <TabsTrigger value="subscriptions">Recorrencias</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-3">
            <ReceivableTable
              query={pending}
              emptyTitle="Nenhuma cobranca em aberto"
              onConfirm={setConfirming}
              onCancel={setCanceling}
            />
          </TabsContent>

          <TabsContent value="overdue" className="mt-3">
            <ReceivableTable
              query={overdue}
              emptyTitle="Nenhuma cobranca vencida"
              onConfirm={setConfirming}
              onCancel={setCanceling}
            />
          </TabsContent>

          <TabsContent value="received" className="mt-3">
            {paid.isLoading ? (
              <LoadingBlock />
            ) : (paid.data?.payments.length ?? 0) === 0 ? (
              <EmptyState title="Nenhum recebimento registrado" />
            ) : (
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">Pagamentos recebidos</caption>
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th scope="col" className="p-2">
                        Cliente
                      </th>
                      <th scope="col" className="p-2">
                        Data
                      </th>
                      <th scope="col" className="p-2">
                        Valor
                      </th>
                      <th scope="col" className="p-2">
                        Situacao
                      </th>
                      <th scope="col" className="p-2 text-right">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(paid.data?.payments ?? []).map((payment) => (
                      <tr key={payment.id} className="border-b border-border">
                        <td className="p-2">{payment.leadName}</td>
                        <td className="p-2">{formatDate(payment.paymentDate)}</td>
                        <td className="p-2 font-medium">{formatMoney(payment.amount)}</td>
                        <td className="p-2">
                          <Badge tone="success">Confirmado</Badge>
                        </td>
                        <td className="p-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setReversing(payment)}>
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            Estornar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reversed" className="mt-3">
            {reversed.isLoading ? (
              <LoadingBlock />
            ) : (reversed.data?.payments.length ?? 0) === 0 ? (
              <EmptyState
                title="Nenhum estorno registrado"
                description="Pagamentos estornados saem de Recebidos e aparecem aqui, com o motivo."
              />
            ) : (
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <caption className="sr-only">Pagamentos estornados</caption>
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th scope="col" className="p-2">
                        Cliente
                      </th>
                      <th scope="col" className="p-2">
                        Recebido em
                      </th>
                      <th scope="col" className="p-2">
                        Estornado em
                      </th>
                      <th scope="col" className="p-2">
                        Valor devolvido
                      </th>
                      <th scope="col" className="p-2">
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reversed.data?.payments ?? []).map((payment) => (
                      <tr key={payment.id} className="border-b border-border">
                        <td className="p-2">{payment.leadName}</td>
                        <td className="p-2">{formatDate(payment.paymentDate)}</td>
                        <td className="p-2">
                          {payment.reversedAt ? formatDate(payment.reversedAt) : '—'}
                        </td>
                        <td className="p-2 font-medium text-destructive">
                          -{formatMoney(payment.amount)}
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">
                          {payment.reversalReason || 'Sem motivo registrado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p className="mt-3 text-xs text-muted-foreground">
                  Estornar nao apaga nada: o recebimento sai da lista de Recebidos, a cobranca volta
                  a ficar em aberto e a receita do painel e ajustada.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-3">
            {subscriptions.isLoading ? (
              <LoadingBlock />
            ) : (subscriptions.data?.subscriptions.length ?? 0) === 0 ? (
              <EmptyState
                title="Nenhuma recorrencia"
                description="Venda um servico com cobranca mensal para criar uma assinatura."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(subscriptions.data?.subscriptions ?? []).map((subscription) => (
                  <Card key={subscription.id}>
                    <CardContent className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{subscription.leadName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {subscription.serviceNameSnapshot}
                          </p>
                        </div>
                        <Badge tone={subscription.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {subscription.status === 'ACTIVE' ? 'Ativa' : 'Cancelada'}
                        </Badge>
                      </div>

                      <p className="text-lg font-semibold">
                        {formatMoney(subscription.amountSnapshot)}
                        <span className="text-sm font-normal text-muted-foreground">/mes</span>
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {subscription.status === 'ACTIVE' && subscription.nextDueDate
                          ? `Proxima cobranca em ${formatDate(subscription.nextDueDate)}`
                          : subscription.canceledAt
                            ? `Cancelada em ${formatDate(subscription.canceledAt)}`
                            : 'Sem proxima cobranca'}
                      </p>

                      {subscription.status === 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setCancelingSubscription(subscription)}
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Cancelar recorrencia
                        </Button>
                      ) : subscription.cancellationReason ? (
                        <p className="text-xs text-muted-foreground">
                          Motivo: {subscription.cancellationReason}
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageBody>

      <ConfirmPaymentDialog
        receivable={confirming}
        onOpenChange={() => setConfirming(null)}
        onDone={() => {
          invalidate();
          setConfirming(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(canceling)}
        onOpenChange={(open) => {
          if (!open) setCanceling(null);
        }}
        title="Cancelar cobranca"
        description={`${canceling?.descriptionSnapshot ?? ''} — ${formatMoney(canceling?.amount)}`}
        consequence="A cobranca sai de pendente sem virar receita. O registro permanece no historico com o motivo informado."
        confirmLabel="Cancelar cobranca"
        cancelLabel="Voltar"
        requireReason
        reasonLabel="Motivo do cancelamento"
        loading={cancelReceivable.isPending}
        onConfirm={(reason) =>
          canceling && cancelReceivable.mutate({ id: canceling.id, reason: reason ?? '' })
        }
      />

      <ConfirmDialog
        open={Boolean(reversing)}
        onOpenChange={(open) => {
          if (!open) setReversing(null);
        }}
        title="Estornar pagamento"
        description={`${reversing?.leadName ?? ''} — ${formatMoney(reversing?.amount)}`}
        consequence="O recebimento sai desta lista e passa para a aba Estornos. A cobranca volta a ficar em aberto e a receita do painel e ajustada. Nada e apagado: a trilha continua no historico do lead."
        confirmLabel="Estornar pagamento"
        cancelLabel="Voltar"
        requireReason
        reasonLabel="Motivo do estorno"
        loading={reversePayment.isPending}
        onConfirm={(reason) =>
          reversing && reversePayment.mutate({ id: reversing.id, reason: reason ?? '' })
        }
      />

      <CancelSubscriptionDialog
        subscription={cancelingSubscription}
        onOpenChange={() => setCancelingSubscription(null)}
        onDone={() => {
          invalidate();
          setCancelingSubscription(null);
        }}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive',
  }[tone];

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ReceivableTable({
  query,
  emptyTitle,
  onConfirm,
  onCancel,
}: {
  query: {
    isLoading: boolean;
    isError: boolean;
    data?: { receivables: Receivable[]; total: string } | undefined;
    refetch: () => void;
  };
  emptyTitle: string;
  onConfirm: (receivable: Receivable) => void;
  onCancel: (receivable: Receivable) => void;
}) {
  if (query.isLoading) return <LoadingBlock />;
  if (query.isError) {
    return <ErrorState message="Nao foi possivel carregar as cobrancas." onRetry={query.refetch} />;
  }

  const rows = query.data?.receivables ?? [];
  if (rows.length === 0) return <EmptyState title={emptyTitle} />;

  return (
    <>
      <p className="mb-2 text-sm text-muted-foreground">
        Total: <span className="font-medium text-foreground">{formatMoney(query.data?.total)}</span>
      </p>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Cobrancas</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="p-2">
                Cliente
              </th>
              <th scope="col" className="p-2">
                Descricao
              </th>
              <th scope="col" className="p-2">
                Competencia
              </th>
              <th scope="col" className="p-2">
                Vencimento
              </th>
              <th scope="col" className="p-2">
                Valor
              </th>
              <th scope="col" className="p-2">
                Situacao
              </th>
              <th scope="col" className="p-2 text-right">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((receivable) => (
              <tr key={receivable.id} className="border-b border-border">
                <td className="p-2">{receivable.leadName}</td>
                <td className="p-2">{receivable.descriptionSnapshot}</td>
                <td className="p-2">
                  {receivable.referencePeriod
                    ? formatReferencePeriod(receivable.referencePeriod)
                    : '—'}
                </td>
                <td className="p-2">{formatDate(receivable.dueDate)}</td>
                <td className="p-2 font-medium">{formatMoney(receivable.amount)}</td>
                <td className="p-2">
                  <Badge tone={receivable.status === 'OVERDUE' ? 'danger' : 'warning'}>
                    {RECEIVABLE_STATUS_LABELS[
                      receivable.status as keyof typeof RECEIVABLE_STATUS_LABELS
                    ] ?? receivable.status}
                  </Badge>
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" onClick={() => onConfirm(receivable)}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Confirmar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onCancel(receivable)}>
                      <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                      Cancelar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ConfirmPaymentDialog({
  receivable,
  onOpenChange,
  onDone,
}: {
  receivable: Receivable | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!receivable) return;
    setSaving(true);
    setError(null);
    try {
      await api.post(`/receivables/${receivable.id}/confirm`, {
        paymentDate,
        idempotencyKey: newIdempotencyKey('pay'),
      });
      toast.success(
        'Recebimento confirmado',
        'O valor saiu de pendente e entrou na receita realizada.',
      );
      onDone();
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : 'Nao foi possivel confirmar o recebimento.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(receivable)} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Confirmar recebimento</DialogTitle>
          <DialogDescription>
            {receivable?.leadName} — {formatMoney(receivable?.amount)}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field
            label="Data do recebimento"
            htmlFor="confirm-date"
            required
            hint="A receita realizada e contabilizada nesta data."
          >
            <Input
              id="confirm-date"
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
          </Field>

          <Callout tone="success" title="O que acontece ao confirmar">
            O valor sai de &quot;Aguardando pagamento&quot; e entra na receita realizada. O
            lancamento pode ser estornado depois, com motivo, sem apagar nada.
          </Callout>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="success" onClick={submit} loading={saving} loadingText="Confirmando...">
            Confirmar recebimento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelSubscriptionDialog({
  subscription,
  onOpenChange,
  onDone,
}: {
  subscription: Subscription | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const [canceledAt, setCanceledAt] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'KEEP_PENDING' | 'CANCEL'>('KEEP_PENDING');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!subscription) return;
    if (reason.trim().length < 3) {
      setError('Informe o motivo do cancelamento.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.post(`/subscriptions/${subscription.id}/cancel`, {
        canceledAt,
        reason: reason.trim(),
        openReceivableAction: action,
      });
      toast.success('Recorrencia cancelada', 'Cobrancas futuras foram interrompidas.');
      setReason('');
      onDone();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Nao foi possivel cancelar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(subscription)} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Cancelar recorrencia</DialogTitle>
          <DialogDescription>
            {subscription?.leadName} — {subscription?.serviceNameSnapshot}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field label="Data do cancelamento" htmlFor="cancel-date" required>
            <Input
              id="cancel-date"
              type="date"
              value={canceledAt}
              onChange={(event) => setCanceledAt(event.target.value)}
            />
          </Field>

          <Field label="Motivo" htmlFor="cancel-reason" required>
            <Input
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ex.: cliente encerrou o contrato"
            />
          </Field>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Cobranca em aberto</legend>
            <label className="flex items-start gap-2 rounded-md border border-border p-2 text-sm">
              <input
                type="radio"
                name="open-receivable"
                className="mt-1"
                checked={action === 'KEEP_PENDING'}
                onChange={() => setAction('KEEP_PENDING')}
              />
              <span>
                <span className="font-medium">Manter como pendente</span>
                <span className="block text-xs text-muted-foreground">
                  O cliente ainda deve este valor.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-md border border-border p-2 text-sm">
              <input
                type="radio"
                name="open-receivable"
                className="mt-1"
                checked={action === 'CANCEL'}
                onChange={() => setAction('CANCEL')}
              />
              <span>
                <span className="font-medium">Cancelar a cobranca em aberto</span>
                <span className="block text-xs text-muted-foreground">
                  O valor deixa de ser cobrado. O registro permanece no historico.
                </span>
              </span>
            </label>
          </fieldset>

          <Callout tone="info">
            Pagamentos anteriores permanecem intactos e a assinatura nao e apagada.
          </Callout>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={submit} loading={saving}>
            Cancelar recorrencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
