/**
 * Dashboard.
 *
 * Ordem da informacao: hoje e resultado -> precisa da sua atencao -> funil
 * atual -> desempenho. Todos os numeros vem do backend; o navegador apenas
 * formata. Taxas com denominador zero aparecem como "—" com explicacao.
 */
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Clock,
  Target,
  TrendingUp,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { GOAL_METRIC_LABELS } from '@shared/constants';
import { formatDate, formatMoney, formatNumber, formatPercent } from '@shared/format';
import { formatProximity } from '../lib/meetingTime';
import { PERIOD_PRESET_LABELS, PERIOD_PRESETS, type PeriodPreset } from '@shared/schemas';
import { LeadDrawer } from '../components/crm/LeadDrawer';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  HelpTip,
  ProgressBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '../components/ui';
import { api, buildQuery } from '../lib/api';

interface DashboardResponse {
  period: { preset: string; fromDate: string; toDate: string };
  metrics: {
    firstContacts: number;
    contactAttempts: number;
    responses: number;
    followUpsCompleted: number;
    negotiationsStarted: number;
    lossesRecorded: number;
    salesConfirmed: number;
    realizedRevenue: string;
    responseRate: number | null;
    lossRate: number | null;
    conversionRate: number | null;
    averageTicket: string | null;
  };
  funnel: {
    stageId: string;
    stageName: string;
    semanticKey: string;
    color: string;
    count: number;
  }[];
  financial: {
    pendingTotal: string;
    overdueTotal: string;
    activeMrr: string;
    nextDueDate: string | null;
    activeSubscriptions: number;
  };
  attention: {
    kind: string;
    title: string;
    description: string;
    leadId: string | null;
    amount: string | null;
    dueDate: string | null;
    /** Preenchidos quando o item e de reuniao. */
    meetingId?: string | null;
    meetUrl?: string | null;
    startAt?: string | null;
    priority: number;
  }[];
  goals: {
    goal: { id: string; metricType: string; periodType: string; targetValue: string };
    current: string;
    target: string;
    ratio: number;
    remaining: string;
    achieved: boolean;
    periodLabel: string;
  }[];
  series: {
    date: string;
    firstContacts: number;
    responses: number;
    sales: number;
    revenue: string;
  }[];
  googleUsage: { sku: string; used: number; limit: number; remaining: number; warning: boolean }[];
}

export default function DashboardPage() {
  // Abre no dia: e a pergunta mais frequente de quem entra pela manha.
  // Semana, mes e periodo livre continuam no seletor ao lado do titulo.
  const [preset, setPreset] = useState<PeriodPreset>('TODAY');
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['dashboard', preset],
    queryFn: () => api.get<DashboardResponse>(`/dashboard${buildQuery({ preset })}`),
  });

  const data = query.data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          data
            ? `Periodo: ${formatDate(data.period.fromDate)} a ${formatDate(data.period.toDate)}`
            : undefined
        }
        actions={
          <Select value={preset} onValueChange={(value) => setPreset(value as PeriodPreset)}>
            <SelectTrigger className="w-48" aria-label="Periodo do dashboard">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_PRESETS.filter((item) => item !== 'CUSTOM').map((item) => (
                <SelectItem key={item} value={item}>
                  {PERIOD_PRESET_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <PageBody className="space-y-6">
        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message="Nao foi possivel carregar o dashboard. Verifique sua conexao e tente novamente."
            onRetry={() => void query.refetch()}
          />
        ) : data ? (
          <>
            {/* --- Metas ------------------------------------------------- */}
            {data.goals.length > 0 ? (
              <section aria-labelledby="metas-titulo">
                <h2 id="metas-titulo" className="mb-2 text-sm font-semibold">
                  Metas
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.goals.map((entry) => {
                    const isMoney = entry.goal.metricType === 'REALIZED_REVENUE';
                    return (
                      <Card key={entry.goal.id}>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {
                                GOAL_METRIC_LABELS[
                                  entry.goal.metricType as keyof typeof GOAL_METRIC_LABELS
                                ]
                              }{' '}
                              <span className="text-muted-foreground">{entry.periodLabel}</span>
                            </p>
                            {entry.achieved ? <Badge tone="success">Meta atingida</Badge> : null}
                          </div>

                          <p className="text-lg font-semibold">
                            {isMoney
                              ? formatMoney(entry.current)
                              : formatNumber(Number(entry.current))}
                            <span className="text-sm font-normal text-muted-foreground">
                              {' '}
                              de{' '}
                              {isMoney
                                ? formatMoney(entry.target)
                                : formatNumber(Number(entry.target))}
                            </span>
                          </p>

                          <ProgressBar
                            value={entry.ratio}
                            tone={entry.achieved ? 'success' : 'primary'}
                            label={`Progresso da meta: ${Math.round(entry.ratio * 100)}%`}
                          />

                          <p className="text-xs text-muted-foreground">
                            {entry.achieved
                              ? 'Meta concluida neste periodo.'
                              : `Faltam ${isMoney ? formatMoney(entry.remaining) : formatNumber(Number(entry.remaining))}.`}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* --- Cards principais -------------------------------------- */}
            <section aria-labelledby="resultado-titulo">
              <h2 id="resultado-titulo" className="mb-2 text-sm font-semibold">
                Resultado do periodo
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MetricCard
                  label="Primeiros contatos"
                  value={formatNumber(data.metrics.firstContacts)}
                  help="Leads unicos abordados pela primeira vez no periodo."
                  formula="Leads unicos com primeiro contato registrado"
                />
                <MetricCard
                  label="Respostas"
                  value={formatNumber(data.metrics.responses)}
                  help="Leads unicos que responderam pela primeira vez no periodo."
                />
                <MetricCard
                  label="Taxa de resposta"
                  value={formatPercent(data.metrics.responseRate)}
                  help={
                    data.metrics.firstContacts === 0
                      ? 'Sem primeiros contatos no periodo, a taxa nao pode ser calculada.'
                      : 'Proporcao de leads abordados que responderam.'
                  }
                  formula="leads que responderam ÷ primeiros contatos"
                />
                <MetricCard
                  label="Vendas concluidas"
                  value={formatNumber(data.metrics.salesConfirmed)}
                  help="Vendas com recebimento confirmado no periodo."
                />
                <MetricCard
                  label="Receita recebida"
                  value={formatMoney(data.metrics.realizedRevenue)}
                  tone="success"
                  help="Somente dinheiro confirmado como recebido, ja descontados os estornos."
                  formula="pagamentos confirmados − estornos"
                />
                <MetricCard
                  label="Aguardando pagamento"
                  value={formatMoney(data.financial.pendingTotal)}
                  tone={Number(data.financial.overdueTotal) > 0 ? 'warning' : 'neutral'}
                  help="Valor combinado que ainda nao foi recebido. Nao entra em receita."
                />
              </div>
            </section>

            {/* --- Precisa da sua atencao -------------------------------- */}
            <section aria-labelledby="atencao-titulo">
              <Card>
                <CardHeader>
                  <CardTitle id="atencao-titulo" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />
                    Precisa da sua atencao
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {data.attention.length === 0 ? (
                    <EmptyState
                      title="Nada pendente agora"
                      description="Nenhum follow-up atrasado, pagamento vencido ou negociacao parada."
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {data.attention.slice(0, 12).map((item, index) => (
                        <li
                          key={`${item.kind}-${item.leadId ?? index}`}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex min-w-0 items-start gap-2">
                            <AttentionIcon kind={item.kind} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{item.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {item.description}
                                {item.startAt && item.kind === 'MEETING_SOON'
                                  ? ` · ${formatProximity(item.startAt)}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {item.amount ? (
                              <span className="text-sm font-medium">
                                {formatMoney(item.amount)}
                              </span>
                            ) : null}
                            {/* Entrar na sala e a acao mais urgente do item. */}
                            {item.meetUrl ? (
                              <Button size="sm" asChild>
                                <a href={item.meetUrl} target="_blank" rel="noopener noreferrer">
                                  <Video className="h-3.5 w-3.5" aria-hidden="true" />
                                  Entrar
                                </a>
                              </Button>
                            ) : null}
                            {item.leadId ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setOpenLeadId(item.leadId)}
                              >
                                Abrir card
                                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* --- Funil atual ------------------------------------------- */}
            <section aria-labelledby="funil-titulo">
              <Card>
                <CardHeader>
                  <CardTitle id="funil-titulo">Funil atual</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Onde cada lead esta agora. Nao e o mesmo que a atividade do periodo.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {data.funnel.map((stage) => (
                      <div
                        key={stage.stageId}
                        className={`rounded-md border border-border p-3 ${
                          stage.semanticKey === 'SELECTED' ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: stage.color }}
                            aria-hidden="true"
                          />
                          <p className="truncate text-xs text-muted-foreground">
                            {stage.stageName}
                          </p>
                        </div>
                        <p className="mt-1 text-xl font-semibold">{formatNumber(stage.count)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* --- Desempenho -------------------------------------------- */}
            <section aria-labelledby="desempenho-titulo" className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle id="desempenho-titulo">Contatos e respostas por dia</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.series.length === 0 ? (
                    <EmptyState title="Sem atividade no periodo" />
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.series}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 25% 90%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={shortDate} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <ChartTooltip
                            formatter={(value, name) => [
                              formatNumber(Number(value ?? 0)),
                              name === 'firstContacts' ? 'Primeiros contatos' : 'Respostas',
                            ]}
                            labelFormatter={(label) => formatDate(String(label ?? ''))}
                          />
                          <Line
                            type="monotone"
                            dataKey="firstContacts"
                            stroke="hsl(221 83% 53%)"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="responses"
                            stroke="hsl(142 71% 36%)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receita recebida por dia</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.series.length === 0 ? (
                    <EmptyState title="Sem recebimentos no periodo" />
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.series}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 25% 90%)" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={shortDate} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <ChartTooltip
                            formatter={(value) => [formatMoney(Number(value ?? 0)), 'Recebido']}
                            labelFormatter={(label) => formatDate(String(label ?? ''))}
                          />
                          <Bar dataKey="revenue" fill="hsl(142 71% 36%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* --- Indicadores secundarios -------------------------------- */}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Taxa de conversao"
                value={formatPercent(data.metrics.conversionRate)}
                help="Leads unicos com venda confirmada em relacao aos abordados."
                formula="leads com venda ÷ primeiros contatos"
              />
              <MetricCard
                label="Taxa de recusa"
                value={formatPercent(data.metrics.lossRate)}
                help="Leads unicos marcados como recusados ou perdidos."
                formula="leads perdidos ÷ primeiros contatos"
              />
              <MetricCard
                label="Ticket medio"
                value={data.metrics.averageTicket ? formatMoney(data.metrics.averageTicket) : '—'}
                help="Valor medio das vendas confirmadas no periodo."
                formula="valor das vendas ÷ quantidade de vendas"
              />
              <MetricCard
                label="Receita recorrente ativa"
                value={formatMoney(data.financial.activeMrr)}
                help="Soma mensal dos contratos recorrentes ativos. NAO significa dinheiro ja recebido."
                formula="soma das assinaturas ativas"
              />
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Tentativas de contato"
                value={formatNumber(data.metrics.contactAttempts)}
                help="Todas as tentativas registradas. Diferente de contatos novos."
              />
              <MetricCard
                label="Follow-ups concluidos"
                value={formatNumber(data.metrics.followUpsCompleted)}
              />
              <MetricCard
                label="Negociacoes iniciadas"
                value={formatNumber(data.metrics.negotiationsStarted)}
              />
            </section>
          </>
        ) : null}
      </PageBody>

      <LeadDrawer leadId={openLeadId} onOpenChange={() => setOpenLeadId(null)} />
    </>
  );
}

const shortDate = (value: string): string => value.slice(8, 10) + '/' + value.slice(5, 7);

function MetricCard({
  label,
  value,
  help,
  formula,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  help?: string;
  formula?: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  const toneClass = {
    neutral: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
  }[tone];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          {help ? <HelpTip text={help} {...(formula ? { formula } : {})} /> : null}
        </div>
        <p className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function AttentionIcon({ kind }: { kind: string }) {
  const className = 'mt-0.5 h-4 w-4 shrink-0';
  switch (kind) {
    case 'FOLLOW_UP_OVERDUE':
      return <CalendarClock className={`${className} text-destructive`} aria-hidden="true" />;
    case 'FOLLOW_UP_TODAY':
      return <CalendarClock className={`${className} text-warning`} aria-hidden="true" />;
    case 'PAYMENT_OVERDUE':
      return <CircleDollarSign className={`${className} text-destructive`} aria-hidden="true" />;
    case 'STALLED_NEGOTIATION':
    case 'SELECTED_IDLE':
      return <Clock className={`${className} text-muted-foreground`} aria-hidden="true" />;
    case 'INCOMPLETE_DATA':
      return <AlertTriangle className={`${className} text-destructive`} aria-hidden="true" />;
    case 'UPCOMING_RECURRENCE':
      return <TrendingUp className={`${className} text-primary`} aria-hidden="true" />;
    case 'GOOGLE_QUOTA':
      return <Target className={`${className} text-warning`} aria-hidden="true" />;
    case 'MEETING_SOON':
      return <Video className={`${className} text-primary`} aria-hidden="true" />;
    case 'MEETING_NEEDS_OUTCOME':
      return <CalendarClock className={`${className} text-warning`} aria-hidden="true" />;
    default:
      return <AlertTriangle className={`${className} text-muted-foreground`} aria-hidden="true" />;
  }
}
