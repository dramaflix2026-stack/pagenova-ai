/**
 * Configuracoes.
 *
 * Segredos permanecem no ambiente do servidor e NUNCA aparecem aqui, nem
 * parcialmente. A tela mostra apenas se cada integracao esta configurada.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  GripVertical,
  KeyRound,
  Plus,
} from 'lucide-react';
import { useState } from 'react';

import { GOOGLE_SKU_LABELS, STAGE_MEANINGS } from '@shared/constants';
import { formatNumber } from '@shared/format';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  HelpTip,
  Input,
  LoadingBlock,
  ProgressBar,
  Separator,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui';
import { ConfirmDialog } from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { ApiError, api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { useLossReasons, useSources, useStages } from '../hooks/useCrm';

interface SettingsResponse {
  preferences: {
    appName: string;
    stalledNegotiationDays: number;
    stalledSelectedDays: number;
    dashboardDefaultPeriod: string;
    searchRequirePhoneByDefault: boolean;
    googleTextSearchLimit: number | null;
    googleDetailsLimit: number | null;
    googleWarningPercent: number | null;
  };
  system: {
    timezone: string;
    nodeEnv: string;
    googleConfigured: boolean;
    googleLanguage: string;
    googleRegion: string;
    maxImportFileMb: number;
    maxImportRows: number;
    cronConfigured: boolean;
    bootstrapSecretPresent: boolean;
  };
  googleUsage: {
    sku: string;
    billingMonth: string;
    used: number;
    limit: number;
    remaining: number;
    warningPercent: number;
    warning: boolean;
    blocked: boolean;
  }[];
}

export default function SettingsPage() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<SettingsResponse>('/settings'),
  });

  return (
    <>
      <PageHeader title="Configuracoes" description="Personalize o processo sem quebrar o historico." />

      <PageBody className="space-y-4">
        {query.isLoading ? (
          <LoadingBlock />
        ) : query.data ? (
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="stages">Etapas</TabsTrigger>
              <TabsTrigger value="sources">Origens e motivos</TabsTrigger>
              <TabsTrigger value="google">Uso do Google</TabsTrigger>
              <TabsTrigger value="security">Seguranca</TabsTrigger>
              <TabsTrigger value="export">Exportacao</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4">
              <GeneralSettings data={query.data} onSaved={() => void query.refetch()} />
            </TabsContent>

            <TabsContent value="stages" className="mt-4">
              <StagesSettings />
            </TabsContent>

            <TabsContent value="sources" className="mt-4 space-y-4">
              <SourcesSettings />
              <LossReasonsSettings />
            </TabsContent>

            <TabsContent value="google" className="mt-4">
              <GoogleSettings data={query.data} onSaved={() => void query.refetch()} />
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <SecuritySettings bootstrapSecretPresent={query.data.system.bootstrapSecretPresent} />
            </TabsContent>

            <TabsContent value="export" className="mt-4">
              <ExportSettings />
            </TabsContent>
          </Tabs>
        ) : null}
      </PageBody>
    </>
  );
}

function GeneralSettings({
  data,
  onSaved,
}: {
  data: SettingsResponse;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    appName: data.preferences.appName,
    stalledNegotiationDays: String(data.preferences.stalledNegotiationDays),
    stalledSelectedDays: String(data.preferences.stalledSelectedDays),
    searchRequirePhoneByDefault: data.preferences.searchRequirePhoneByDefault,
  });

  const save = useMutation({
    mutationFn: () =>
      api.patch('/settings', {
        appName: form.appName,
        stalledNegotiationDays: Number(form.stalledNegotiationDays),
        stalledSelectedDays: Number(form.stalledSelectedDays),
        searchRequirePhoneByDefault: form.searchRequirePhoneByDefault,
      }),
    onSuccess: () => {
      toast.success('Preferencias salvas');
      onSaved();
    },
    onError: (error) =>
      toast.error('Nao foi possivel salvar', error instanceof ApiError ? error.message : undefined),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias gerais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field label="Nome exibido da plataforma" htmlFor="settings-app-name">
          <Input
            id="settings-app-name"
            value={form.appName}
            onChange={(event) => setForm((c) => ({ ...c, appName: event.target.value }))}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Negociacao parada apos (dias)"
            htmlFor="settings-stalled-negotiation"
            hint="Usado no bloco 'Precisa da sua atencao'."
          >
            <Input
              id="settings-stalled-negotiation"
              type="number"
              min={1}
              value={form.stalledNegotiationDays}
              onChange={(event) =>
                setForm((c) => ({ ...c, stalledNegotiationDays: event.target.value }))
              }
            />
          </Field>

          <Field
            label="Selecionado sem abordagem apos (dias)"
            htmlFor="settings-stalled-selected"
          >
            <Input
              id="settings-stalled-selected"
              type="number"
              min={1}
              value={form.stalledSelectedDays}
              onChange={(event) =>
                setForm((c) => ({ ...c, stalledSelectedDays: event.target.value }))
              }
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium">Esconder resultados sem telefone</p>
            <p className="text-xs text-muted-foreground">
              Valor inicial do filtro na tela Buscar empresas.
            </p>
          </div>
          <Switch
            checked={form.searchRequirePhoneByDefault}
            onCheckedChange={(checked) =>
              setForm((c) => ({ ...c, searchRequirePhoneByDefault: checked }))
            }
            aria-label="Esconder resultados sem telefone por padrao"
          />
        </div>

        <Separator />

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Fuso operacional</dt>
            <dd className="font-medium">{data.system.timezone}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Moeda e formato</dt>
            <dd className="font-medium">BRL · pt-BR</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Limite de importacao</dt>
            <dd className="font-medium">
              {data.system.maxImportFileMb} MB · {formatNumber(data.system.maxImportRows)} linhas
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Cron de manutencao</dt>
            <dd className="font-medium">
              {data.system.cronConfigured ? 'Configurado' : 'Nao configurado (opcional)'}
            </dd>
          </div>
        </dl>

        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Salvar preferencias
        </Button>
      </CardContent>
    </Card>
  );
}

function StagesSettings() {
  const stages = useStages();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [newName, setNewName] = useState('');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['stages'] });
    void queryClient.invalidateQueries({ queryKey: ['board'] });
  };

  const rename = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.patch(`/stages/${id}`, { name }),
    onSuccess: () => {
      toast.success('Etapa renomeada', 'As metricas continuam corretas.');
      invalidate();
    },
    onError: (error) =>
      toast.error('Nao foi possivel renomear', error instanceof ApiError ? error.message : undefined),
  });

  const recolor = useMutation({
    mutationFn: ({ id, color }: { id: string; color: string }) =>
      api.patch(`/stages/${id}`, { color }),
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: () => api.post('/stages', { name: newName.trim(), semanticKey: 'AUXILIARY' }),
    onSuccess: () => {
      toast.success('Etapa auxiliar criada', 'Ela organiza o quadro sem alterar metricas.');
      setNewName('');
      invalidate();
    },
    onError: (error) =>
      toast.error('Nao foi possivel criar', error instanceof ApiError ? error.message : undefined),
  });

  const list = stages.data?.stages ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapas do CRM</CardTitle>
        <p className="text-sm text-muted-foreground">
          Renomear ou mudar a cor nao afeta o historico: as metricas usam o significado interno da
          etapa.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.isLoading ? (
          <LoadingBlock />
        ) : (
          <ul className="space-y-2">
            {list.map((stage) => (
              <li
                key={stage.id}
                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center"
              >
                <GripVertical className="hidden h-4 w-4 text-muted-foreground sm:block" aria-hidden="true" />

                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="color"
                    value={stage.color}
                    onChange={(event) => recolor.mutate({ id: stage.id, color: event.target.value })}
                    className="h-8 w-10 cursor-pointer rounded border border-border"
                    aria-label={`Cor da etapa ${stage.name}`}
                  />
                  <Input
                    defaultValue={stage.name}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value && value !== stage.name) {
                        rename.mutate({ id: stage.id, name: value });
                      }
                    }}
                    aria-label={`Nome da etapa ${stage.name}`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {stage.isSystem ? (
                    <Badge tone="neutral">Etapa principal</Badge>
                  ) : (
                    <Badge tone="outline">Auxiliar</Badge>
                  )}
                  <HelpTip
                    text={
                      stage.meaning ??
                      STAGE_MEANINGS[stage.semanticKey as keyof typeof STAGE_MEANINGS] ??
                      'Etapa de organizacao.'
                    }
                    label={`O que a etapa ${stage.name} representa`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <Field label="Nova etapa auxiliar" htmlFor="new-stage" className="flex-1">
            <Input
              id="new-stage"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ex.: Aguardando material"
            />
          </Field>
          <Button
            onClick={() => create.mutate()}
            loading={create.isPending}
            disabled={newName.trim().length === 0}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar etapa
          </Button>
        </div>

        <Callout tone="info">
          Etapas principais nao podem ser apagadas nem desativadas — elas sustentam o funil e o
          dashboard. Etapas auxiliares podem ser removidas informando um destino para os cards.
        </Callout>
      </CardContent>
    </Card>
  );
}

function SourcesSettings() {
  const sources = useSources();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [newName, setNewName] = useState('');

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['sources'] });

  const create = useMutation({
    mutationFn: () => api.post('/sources', { name: newName.trim() }),
    onSuccess: () => {
      toast.success('Origem criada');
      setNewName('');
      invalidate();
    },
    onError: (error) =>
      toast.error('Nao foi possivel criar', error instanceof ApiError ? error.message : undefined),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/sources/${id}`, { active }),
    onSuccess: () => {
      toast.success('Origem atualizada', 'O historico dos leads nao foi alterado.');
      invalidate();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Origens de lead</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {(sources.data?.sources ?? []).map((source) => (
            <li
              key={source.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{source.name}</span>
                {source.isSystem ? <Badge tone="neutral">Padrao</Badge> : null}
              </div>
              <Switch
                checked={source.active}
                onCheckedChange={(checked) => toggle.mutate({ id: source.id, active: checked })}
                aria-label={`Origem ${source.name} ativa`}
              />
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Nova origem"
            aria-label="Nome da nova origem"
          />
          <Button onClick={() => create.mutate()} disabled={newName.trim().length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LossReasonsSettings() {
  const reasons = useLossReasons();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [newName, setNewName] = useState('');

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['loss-reasons'] });

  const create = useMutation({
    mutationFn: () => api.post('/loss-reasons', { name: newName.trim() }),
    onSuccess: () => {
      toast.success('Motivo criado');
      setNewName('');
      invalidate();
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/loss-reasons/${id}`, { active }),
    onSuccess: invalidate,
    onError: (error) =>
      toast.error('Nao foi possivel alterar', error instanceof ApiError ? error.message : undefined),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motivos de perda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {(reasons.data?.lossReasons ?? []).map((reason) => (
            <li
              key={reason.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
            >
              <span className="font-medium">{reason.name}</span>
              <Switch
                checked={reason.active}
                onCheckedChange={(checked) => toggle.mutate({ id: reason.id, active: checked })}
                aria-label={`Motivo ${reason.name} ativo`}
              />
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Novo motivo"
            aria-label="Nome do novo motivo"
          />
          <Button onClick={() => create.mutate()} disabled={newName.trim().length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GoogleSettings({ data, onSaved }: { data: SettingsResponse; onSaved: () => void }) {
  const toast = useToast();
  const [textLimit, setTextLimit] = useState(
    String(data.googleUsage.find((entry) => entry.sku === 'TEXT_SEARCH')?.limit ?? 900),
  );
  const [detailsLimit, setDetailsLimit] = useState(
    String(data.googleUsage.find((entry) => entry.sku === 'PLACE_DETAILS')?.limit ?? 900),
  );
  const [warningPercent, setWarningPercent] = useState(
    String(data.googleUsage[0]?.warningPercent ?? 80),
  );

  const save = useMutation({
    mutationFn: () =>
      api.patch('/settings', {
        googleTextSearchLimit: Number(textLimit),
        googleDetailsLimit: Number(detailsLimit),
        googleWarningPercent: Number(warningPercent),
      }),
    onSuccess: () => {
      toast.success('Limites atualizados');
      onSaved();
    },
    onError: (error) =>
      toast.error('Nao foi possivel salvar', error instanceof ApiError ? error.message : undefined),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Uso da API do Google</CardTitle>
        <p className="text-sm text-muted-foreground">
          O limite interno bloqueia a chamada antes de sair do servidor, protegendo o orcamento.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data.system.googleConfigured ? (
          <Callout
            tone="warning"
            title="Chave nao configurada"
            icon={<AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />}
          >
            Defina GOOGLE_MAPS_API_KEY no ambiente do servidor para habilitar a tela Buscar
            empresas. A chave nunca e exibida aqui nem enviada ao navegador.
          </Callout>
        ) : (
          <Callout
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />}
          >
            Chave configurada no servidor · idioma {data.system.googleLanguage} · regiao{' '}
            {data.system.googleRegion}
          </Callout>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {data.googleUsage.map((entry) => (
            <div key={entry.sku} className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {GOOGLE_SKU_LABELS[entry.sku as keyof typeof GOOGLE_SKU_LABELS] ?? entry.sku}
                </p>
                {entry.blocked ? (
                  <Badge tone="danger">Bloqueado</Badge>
                ) : entry.warning ? (
                  <Badge tone="warning">Perto do limite</Badge>
                ) : (
                  <Badge tone="success">Dentro do limite</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Mes {entry.billingMonth}</p>
              <p className="mt-1 text-lg font-semibold">
                {formatNumber(entry.used)}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  de {formatNumber(entry.limit)}
                </span>
              </p>
              <ProgressBar
                className="mt-2"
                value={entry.limit > 0 ? entry.used / entry.limit : 0}
                tone={entry.blocked ? 'danger' : entry.warning ? 'warning' : 'primary'}
                label={`Consumo de ${entry.sku}`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Restam {formatNumber(entry.remaining)} chamadas neste mes.
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Limite de pesquisas/mes" htmlFor="google-text-limit">
            <Input
              id="google-text-limit"
              type="number"
              min={0}
              value={textLimit}
              onChange={(event) => setTextLimit(event.target.value)}
            />
          </Field>
          <Field label="Limite de detalhes/mes" htmlFor="google-details-limit">
            <Input
              id="google-details-limit"
              type="number"
              min={0}
              value={detailsLimit}
              onChange={(event) => setDetailsLimit(event.target.value)}
            />
          </Field>
          <Field label="Avisar em (%)" htmlFor="google-warning">
            <Input
              id="google-warning"
              type="number"
              min={1}
              max={100}
              value={warningPercent}
              onChange={(event) => setWarningPercent(event.target.value)}
            />
          </Field>
        </div>

        <Callout tone="info" title="Alerta de orcamento nao interrompe consumo">
          Configure tambem quotas e alertas no Google Cloud. Um alerta apenas avisa: quem bloqueia
          antes da chamada e este limite interno.
        </Callout>

        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Salvar limites
        </Button>
      </CardContent>
    </Card>
  );
}

function SecuritySettings({ bootstrapSecretPresent }: { bootstrapSecretPresent: boolean }) {
  const { user } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const change = useMutation({
    mutationFn: () =>
      api.post<{ message: string }>('/auth/password', {
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    onSuccess: (data) => {
      toast.success('Senha alterada', data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setConfirmOpen(false);
    },
    onError: (caught) => {
      setError(
        caught instanceof ApiError ? caught.message : 'Nao foi possivel alterar a senha.',
      );
      setConfirmOpen(false);
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Seguranca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bootstrapSecretPresent ? (
            <Callout
              tone="warning"
              title="Remova o segredo de bootstrap"
              icon={<AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />}
            >
              A variavel ADMIN_INITIAL_PASSWORD ainda esta definida no servidor. Ela so serve para
              criar o administrador. Remova-a do painel de variaveis e reinicie a aplicacao.
            </Callout>
          ) : null}

          <p className="text-sm text-muted-foreground">
            Administrador: <span className="font-medium text-foreground">{user?.email}</span>
          </p>

          <Field label="Senha atual" htmlFor="current-password" required>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </Field>

          <Field
            label="Nova senha"
            htmlFor="new-password"
            required
            hint="Minimo de 12 caracteres, com boa variedade."
          >
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>

          <Field label="Confirmar nova senha" htmlFor="confirm-password" required>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </Field>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Alterar senha
          </Button>

          <Callout tone="info">
            Esta versao nao possui recuperacao de senha por e-mail. Em caso de perda, existe um
            procedimento administrativo no servidor documentado em docs/admin-password-reset.md.
          </Callout>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Alterar senha"
        description="A nova senha passa a valer imediatamente."
        consequence="Todas as sessoes abertas em outros dispositivos serao encerradas. Este navegador continuara conectado."
        confirmLabel="Alterar senha"
        tone="primary"
        loading={change.isPending}
        onConfirm={() => change.mutate()}
      />
    </>
  );
}

function ExportSettings() {
  const datasets = useQuery({
    queryKey: ['export-datasets'],
    queryFn: () => api.get<{ datasets: string[]; note: string }>('/exports/datasets'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar dados</CardTitle>
        <p className="text-sm text-muted-foreground">{datasets.data?.note}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Callout tone="info" title="O que a exportacao contem">
          Apenas dados proprios do CRM. Senha, tokens, chave da API do Google, credenciais do banco
          e conteudo transitorio do Google nunca sao incluidos. O CSV e protegido contra formulas
          maliciosas.
        </Callout>

        <Button asChild>
          <a href="/api/exports/json">
            <Download className="h-4 w-4" aria-hidden="true" />
            Backup completo (JSON)
          </a>
        </Button>

        <Separator />

        <p className="text-sm font-medium">Listas em CSV</p>
        <div className="flex flex-wrap gap-2">
          {(datasets.data?.datasets ?? []).map((dataset) => (
            <Button key={dataset} variant="secondary" size="sm" asChild>
              <a href={`/api/exports/csv/${dataset}`}>
                <Download className="h-4 w-4" aria-hidden="true" />
                {dataset.replace(/_/g, ' ')}
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
