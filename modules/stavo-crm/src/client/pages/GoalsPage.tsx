/**
 * Metas de prospeccao e de vendas.
 *
 * Quem gerencia metas (dono da conta) define metas da empresa ou de cada
 * vendedor e acompanha o desempenho de todos lado a lado. O vendedor ve so
 * as proprias metas, sem botoes de criar ou remover -- o servidor recusaria.
 *
 * O progresso vem sempre dos eventos do periodo, calculado no fuso de
 * Sao Paulo. Meta atingida recebe um retorno positivo discreto, em verde.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  GOAL_METRIC_LABELS,
  GOAL_METRIC_TYPES,
  GOAL_PERIOD_LABELS,
  GOAL_PERIOD_TYPES,
} from '@shared/constants';
import { formatMoney, formatNumber, formatPercent } from '@shared/format';
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
  ProgressBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import { ApiError, api } from '../lib/api';

interface GoalEntry {
  id: string;
  userId: string | null;
  userName: string | null;
  metricType: string;
  periodType: string;
  targetValue: string;
  startsOn: string;
  endsOn: string | null;
  active: boolean;
}

interface GoalProgressEntry {
  goal: GoalEntry;
  current: string;
  target: string;
  ratio: number;
  remaining: string;
  achieved: boolean;
  periodLabel: string;
}

interface SellerPerformance {
  userId: string;
  name: string;
  active: boolean;
  leadsProspected: number;
  firstContacts: number;
  responses: number;
  negotiationsStarted: number;
  salesConfirmed: number;
  realizedRevenue: string;
  conversionRate: number | null;
  goals: GoalProgressEntry[];
}

const PERFORMANCE_PRESETS = {
  TODAY: 'Hoje',
  THIS_WEEK: 'Esta semana',
  THIS_MONTH: 'Este mes',
  LAST_MONTH: 'Mes passado',
  THIS_YEAR: 'Este ano',
} as const;
type PerformancePreset = keyof typeof PERFORMANCE_PRESETS;

const EMPRESA = 'EMPRESA';

const metricLabel = (metricType: string) =>
  GOAL_METRIC_LABELS[metricType as keyof typeof GOAL_METRIC_LABELS] ?? metricType;

const displayValue = (metricType: string, value: string) =>
  metricType === 'REALIZED_REVENUE' ? formatMoney(value) : formatNumber(Number(value));

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { pode } = useAuth();
  const gerencia = pode('GOALS_MANAGE');
  const [creating, setCreating] = useState<{ userId: string | null } | null>(null);
  const [deleting, setDeleting] = useState<GoalProgressEntry | null>(null);

  const query = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get<{ goals: GoalEntry[]; progress: GoalProgressEntry[] }>('/goals'),
  });

  const remove = useMutation({
    mutationFn: (goalId: string) => api.delete(`/goals/${goalId}`),
    onSuccess: () => {
      toast.success('Meta removida');
      invalidate();
      setDeleting(null);
    },
    onError: () => toast.error('Nao foi possivel remover a meta'),
  });

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['goals'] });
    void queryClient.invalidateQueries({ queryKey: ['goals-performance'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }

  const progress = query.data?.progress ?? [];
  const companyProgress = progress.filter((entry) => entry.goal.userId === null);
  const inactive = (query.data?.goals ?? []).filter(
    (goal) => !progress.some((entry) => entry.goal.id === goal.id),
  );

  const onDelete = gerencia ? setDeleting : undefined;

  return (
    <>
      <PageHeader
        title={gerencia ? 'Metas' : 'Minhas metas'}
        description={
          gerencia
            ? 'Defina metas de prospeccao e de vendas para a empresa e para cada vendedor.'
            : 'Metas definidas pelo dono da conta, medidas apenas nos seus leads.'
        }
        actions={
          gerencia ? (
            <Button onClick={() => setCreating({ userId: null })}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova meta
            </Button>
          ) : null
        }
      />

      <PageBody className="space-y-6">
        <Callout tone="info" title="Como o progresso e calculado">
          Leads prospectados contam os leads adicionados ao CRM no periodo. Primeiros contatos e
          vendas contam leads unicos. Receita conta apenas pagamentos ja confirmados. Metas de um
          vendedor medem somente os leads dele. O dia comeca e termina no horario de Sao Paulo.
        </Callout>

        {query.isLoading ? (
          <LoadingBlock />
        ) : query.isError ? (
          <ErrorState
            message="Nao foi possivel carregar as metas."
            onRetry={() => void query.refetch()}
          />
        ) : gerencia ? (
          <>
            <SellerPerformanceSection
              onCreateFor={(userId) => setCreating({ userId })}
              onDelete={setDeleting}
            />

            <section aria-labelledby="metas-empresa-titulo" className="space-y-2">
              <h2 id="metas-empresa-titulo" className="text-sm font-semibold">
                Metas da empresa
              </h2>
              {companyProgress.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma meta da empresa vigente. As metas da empresa aparecem no dashboard.
                </p>
              ) : (
                <GoalGrid entries={companyProgress} onDelete={onDelete} />
              )}
            </section>

            <InactiveGoals goals={inactive} />
          </>
        ) : progress.length === 0 && inactive.length === 0 ? (
          <EmptyState
            title="Nenhuma meta definida para voce"
            description="Quando o dono da conta definir suas metas de prospeccao e vendas, elas aparecem aqui e no dashboard."
          />
        ) : (
          <>
            <GoalGrid entries={progress} />
            <InactiveGoals goals={inactive} />
          </>
        )}
      </PageBody>

      {gerencia ? (
        <GoalDialog
          open={Boolean(creating)}
          initialUserId={creating?.userId ?? null}
          onOpenChange={(open) => {
            if (!open) setCreating(null);
          }}
          onSaved={() => {
            invalidate();
            setCreating(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Remover meta"
        description={
          deleting?.goal.userName
            ? `A meta deixa de valer para ${deleting.goal.userName}.`
            : 'A meta deixa de aparecer no dashboard.'
        }
        consequence="Nenhum dado comercial ou financeiro e afetado: metas nao guardam historico proprio."
        confirmLabel="Remover meta"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.goal.id)}
      />
    </>
  );
}

function GoalGrid({
  entries,
  onDelete,
}: {
  entries: GoalProgressEntry[];
  onDelete?: ((entry: GoalProgressEntry) => void) | undefined;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <GoalCard key={entry.goal.id} entry={entry} onDelete={onDelete} />
      ))}
    </div>
  );
}

function GoalCard({
  entry,
  onDelete,
}: {
  entry: GoalProgressEntry;
  onDelete?: ((entry: GoalProgressEntry) => void) | undefined;
}) {
  const display = (value: string) => displayValue(entry.goal.metricType, value);

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">{metricLabel(entry.goal.metricType)}</p>
            <p className="text-xs text-muted-foreground">Meta {entry.periodLabel}</p>
          </div>
          {entry.achieved ? (
            <Badge tone="success">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Atingida
            </Badge>
          ) : null}
        </div>

        <p className="text-xl font-semibold">
          {display(entry.current)}
          <span className="text-sm font-normal text-muted-foreground">
            {' '}
            de {display(entry.target)}
          </span>
        </p>

        <ProgressBar
          value={entry.ratio}
          tone={entry.achieved ? 'success' : 'primary'}
          label={`Progresso: ${Math.round(entry.ratio * 100)}%`}
        />

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {entry.achieved ? 'Meta concluida.' : `Faltam ${display(entry.remaining)}.`}
          </p>
          {onDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entry)}
              aria-label="Remover meta"
            >
              <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function InactiveGoals({ goals }: { goals: GoalEntry[] }) {
  if (goals.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">Metas fora de vigencia</h2>
      <ul className="space-y-2">
        {goals.map((goal) => (
          <li
            key={goal.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {metricLabel(goal.metricType)} ·{' '}
                {GOAL_PERIOD_LABELS[goal.periodType as keyof typeof GOAL_PERIOD_LABELS]}
                {goal.userName ? ` · ${goal.userName}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                De {goal.startsOn} {goal.endsOn ? `ate ${goal.endsOn}` : 'sem data final'}
              </p>
            </div>
            <Badge tone="neutral">{goal.active ? 'Fora do periodo' : 'Inativa'}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SellerPerformanceSection({
  onCreateFor,
  onDelete,
}: {
  onCreateFor: (userId: string) => void;
  onDelete: (entry: GoalProgressEntry) => void;
}) {
  const [preset, setPreset] = useState<PerformancePreset>('THIS_MONTH');

  const query = useQuery({
    queryKey: ['goals-performance', preset],
    queryFn: () =>
      api.get<{ fromDate: string; toDate: string; sellers: SellerPerformance[] }>(
        `/goals/performance?preset=${preset}`,
      ),
  });

  const sellers = query.data?.sellers ?? [];

  return (
    <section aria-labelledby="desempenho-titulo" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="desempenho-titulo" className="text-sm font-semibold">
            Desempenho dos vendedores
          </h2>
          <p className="text-xs text-muted-foreground">
            Numeros de cada vendedor contam apenas os leads dele.
          </p>
        </div>
        <div className="w-44">
          <Select value={preset} onValueChange={(valor) => setPreset(valor as PerformancePreset)}>
            <SelectTrigger aria-label="Periodo do desempenho">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PERFORMANCE_PRESETS).map(([valor, rotulo]) => (
                <SelectItem key={valor} value={valor}>
                  {rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <LoadingBlock />
      ) : query.isError ? (
        <ErrorState
          message="Nao foi possivel carregar o desempenho."
          onRetry={() => void query.refetch()}
        />
      ) : sellers.length === 0 ? (
        <EmptyState
          title="Nenhum vendedor na equipe"
          description="Adicione colaboradores com o cargo Vendedor em Equipe para acompanhar o desempenho e definir metas individuais."
        />
      ) : (
        <>
          <Card>
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">Desempenho dos vendedores no periodo</caption>
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th scope="col" className="p-2">
                      Vendedor
                    </th>
                    <th scope="col" className="p-2 text-right">
                      Leads prospectados
                    </th>
                    <th scope="col" className="p-2 text-right">
                      Primeiros contatos
                    </th>
                    <th scope="col" className="p-2 text-right">
                      Responderam
                    </th>
                    <th scope="col" className="p-2 text-right">
                      Negociacoes
                    </th>
                    <th scope="col" className="p-2 text-right">
                      Vendas
                    </th>
                    <th scope="col" className="p-2 text-right">
                      Receita
                    </th>
                    <th scope="col" className="p-2 text-right">
                      Conversao
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller.userId} className="border-b border-border last:border-0">
                      <td className="p-2 font-medium">
                        {seller.name}
                        {!seller.active ? (
                          <Badge tone="neutral" className="ml-2">
                            Desativado
                          </Badge>
                        ) : null}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(seller.leadsProspected)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(seller.firstContacts)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(seller.responses)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(seller.negotiationsStarted)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatNumber(seller.salesConfirmed)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatMoney(seller.realizedRevenue)}
                      </td>
                      <td className="p-2 text-right tabular-nums">
                        {formatPercent(seller.conversionRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-4">
            {sellers.map((seller) => (
              <div key={seller.userId} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Metas de {seller.name}</h3>
                  {seller.active ? (
                    <Button variant="secondary" size="sm" onClick={() => onCreateFor(seller.userId)}>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Meta para {seller.name}
                    </Button>
                  ) : null}
                </div>
                {seller.goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma meta vigente.</p>
                ) : (
                  <GoalGrid entries={seller.goals} onDelete={onDelete} />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function GoalDialog({
  open,
  initialUserId,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  initialUserId: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const team = useTeam();
  const [owner, setOwner] = useState<string>(initialUserId ?? EMPRESA);
  const [metricType, setMetricType] = useState<string>('LEADS_PROSPECTED');
  const [periodType, setPeriodType] = useState<string>('DAILY');
  const [targetValue, setTargetValue] = useState('30');
  const [startsOn, setStartsOn] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reabrir o dialogo a partir de outro vendedor troca o dono pre-selecionado.
  const [lastInitial, setLastInitial] = useState(initialUserId);
  if (open && initialUserId !== lastInitial) {
    setLastInitial(initialUserId);
    setOwner(initialUserId ?? EMPRESA);
  }

  const vendedores = (team.data?.members ?? []).filter(
    (member) => member.active && member.role === 'EMPLOYEE',
  );

  const isMoney = metricType === 'REALIZED_REVENUE';

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const numeric = Number(targetValue.replace(',', '.'));
      if (!Number.isFinite(numeric) || numeric <= 0) {
        setError('Informe um valor maior que zero.');
        setSaving(false);
        return;
      }

      await api.post('/goals', {
        userId: owner === EMPRESA ? null : owner,
        metricType,
        periodType,
        targetValue: numeric.toFixed(2),
        startsOn,
        endsOn: null,
      });

      toast.success('Meta criada');
      onSaved();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Nao foi possivel criar a meta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Nova meta</DialogTitle>
          <DialogDescription>
            O progresso e recalculado automaticamente a partir dos eventos do CRM.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field
            label="Para quem"
            htmlFor="goal-owner"
            required
            hint={
              owner === EMPRESA
                ? 'Mede o resultado da empresa inteira.'
                : 'Mede apenas os leads deste vendedor. Ele acompanha a meta no proprio painel.'
            }
          >
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger id="goal-owner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPRESA}>Empresa inteira</SelectItem>
                {vendedores.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Metrica" htmlFor="goal-metric" required>
            <Select value={metricType} onValueChange={setMetricType}>
              <SelectTrigger id="goal-metric">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_METRIC_TYPES.map((metric) => (
                  <SelectItem key={metric} value={metric}>
                    {GOAL_METRIC_LABELS[metric]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Periodo" htmlFor="goal-period" required>
            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger id="goal-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_PERIOD_TYPES.map((period) => (
                  <SelectItem key={period} value={period}>
                    {GOAL_PERIOD_LABELS[period]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label={isMoney ? 'Valor alvo (R$)' : 'Quantidade alvo'}
            htmlFor="goal-target"
            required
          >
            <Input
              id="goal-target"
              inputMode="decimal"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
            />
          </Field>

          <Field label="Valendo a partir de" htmlFor="goal-start" required>
            <Input
              id="goal-start"
              type="date"
              value={startsOn}
              onChange={(event) => setStartsOn(event.target.value)}
            />
          </Field>

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
          <Button onClick={submit} loading={saving} loadingText="Criando...">
            Criar meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
