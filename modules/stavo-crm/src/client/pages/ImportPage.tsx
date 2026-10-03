/**
 * Assistente de importacao CSV/XLSX.
 *
 * Regra visivel em toda a tela: uma linha duplicada e IGNORADA. Nenhum dado
 * do lead existente e alterado — nem anotacao, nem valor, nem etapa, nem
 * historico. Depois do relatorio, a revisao manual permite preencher apenas
 * campos hoje vazios, um a um, com confirmacao explicita.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useState } from 'react';

import { IMPORT_FIELD_LABELS, IMPORT_ROW_STATUS_LABELS, type ImportField } from '@shared/constants';
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
  Checkbox,
  EmptyState,
  Field,
  Label,
  LoadingBlock,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui';
import { useToast } from '../components/ui/Toast';
import { ApiError, api, newIdempotencyKey } from '../lib/api';
import { useServices, useSources } from '../hooks/useCrm';

interface UploadResponse {
  uploadId: string;
  filename: string;
  sheets: string[];
  activeSheet: string;
  hasHeader: boolean;
  suggestedMapping: Partial<Record<ImportField, number>>;
  previewRows: string[][];
  totalRows: number;
  truncated: boolean;
  truncationNotice: string | null;
}

interface RowOutcome {
  rowNumber: number;
  status: string;
  leadId?: string;
  duplicateLeadName?: string;
  duplicateStageName?: string;
  matchSummary?: string;
  errors: { field: string; message: string }[];
}

interface ImportSummary {
  totalRows: number;
  imported: number;
  duplicates: number;
  probableDuplicates: number;
  incomplete: number;
  invalid: number;
  empty: number;
}

const EMPTY = '__nenhum__';
const NO_COLUMN = '__sem_coluna__';

type Step = 'upload' | 'mapping' | 'preview' | 'report';

export default function ImportPage() {
  const toast = useToast();
  const services = useServices();
  const sources = useSources();

  const [step, setStep] = useState<Step>('upload');
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [columns, setColumns] = useState<Partial<Record<ImportField, number>>>({});
  const [hasHeader, setHasHeader] = useState(true);
  const [sheetName, setSheetName] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [preview, setPreview] = useState<{ summary: ImportSummary; rows: RowOutcome[] } | null>(null);
  const [report, setReport] = useState<{
    importJobId: string;
    summary: ImportSummary;
    rows: RowOutcome[];
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const config = useQuery({
    queryKey: ['import-config'],
    queryFn: () => api.get<{ maxFileMb: number; maxRows: number }>('/imports/fields'),
    staleTime: 10 * 60_000,
  });

  const mapping = () => ({
    columns,
    hasHeader,
    sheetName: sheetName || null,
    sourceId: sourceId || null,
    serviceId: serviceId || null,
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.upload<UploadResponse>('/imports/upload', formData);
    },
    onSuccess: (data) => {
      setUpload(data);
      setColumns(data.suggestedMapping);
      setHasHeader(data.hasHeader);
      setSheetName(data.activeSheet);
      setStep('mapping');
      setError(null);
    },
    onError: (caught) =>
      setError(caught instanceof ApiError ? caught.message : 'Nao foi possivel ler o arquivo.'),
  });

  const runPreview = useMutation({
    mutationFn: () =>
      api.post<{ summary: ImportSummary; rows: RowOutcome[] }>('/imports/preview', {
        uploadId: upload!.uploadId,
        mapping: mapping(),
      }),
    onSuccess: (data) => {
      setPreview(data);
      setStep('preview');
      setError(null);
    },
    onError: (caught) =>
      setError(caught instanceof ApiError ? caught.message : 'Nao foi possivel validar as linhas.'),
  });

  const confirmImport = useMutation({
    mutationFn: () =>
      api.post<{
        importJobId: string;
        summary: ImportSummary;
        rows: RowOutcome[];
        message: string;
      }>('/imports/confirm', {
        uploadId: upload!.uploadId,
        mapping: mapping(),
        idempotencyKey: newIdempotencyKey('import'),
      }),
    onSuccess: (data) => {
      setReport(data);
      setStep('report');
      toast.success('Importacao concluida', data.message);
    },
    onError: (caught) =>
      setError(caught instanceof ApiError ? caught.message : 'Nao foi possivel importar.'),
  });

  const reset = () => {
    setStep('upload');
    setUpload(null);
    setColumns({});
    setPreview(null);
    setReport(null);
    setError(null);
  };

  return (
    <>
      <PageHeader
        title="Importar leads"
        description="Envie um CSV ou XLSX exportado do Google Sheets, Excel ou outra fonte."
      />

      <PageBody className="space-y-4">
        <StepIndicator step={step} />

        {error ? (
          <Callout tone="danger" title="Nao foi possivel continuar">
            {error}
          </Callout>
        ) : null}

        {/* --- 1. Upload --------------------------------------------------- */}
        {step === 'upload' ? (
          <Card>
            <CardContent className="space-y-4">
              <Callout tone="info" title="O que acontece na importacao">
                Cada linha valida vira um card em Selecionados. Linhas duplicadas sao ignoradas e o
                lead existente nao e alterado de nenhuma forma. Linhas sem telefone entram com
                aviso vermelho, nunca somem.
              </Callout>

              <Field
                label="Arquivo"
                htmlFor="import-file"
                hint={
                  config.data
                    ? `Formatos .csv e .xlsx, ate ${config.data.maxFileMb} MB e ${formatNumber(config.data.maxRows)} linhas.`
                    : 'Formatos .csv e .xlsx.'
                }
              >
                <input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx"
                  className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadFile.mutate(file);
                  }}
                />
              </Field>

              {uploadFile.isPending ? <LoadingBlock label="Lendo o arquivo..." /> : null}
            </CardContent>
          </Card>
        ) : null}

        {/* --- 2. Mapeamento ----------------------------------------------- */}
        {step === 'mapping' && upload ? (
          <Card>
            <CardHeader>
              <CardTitle>Mapear colunas</CardTitle>
              <p className="text-sm text-muted-foreground">
                {upload.filename} · {formatNumber(upload.totalRows)} linha(s).
                {upload.truncationNotice ? ` ${upload.truncationNotice}` : ''}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {upload.sheets.length > 1 ? (
                <Field label="Aba da planilha" htmlFor="import-sheet">
                  <Select value={sheetName} onValueChange={setSheetName}>
                    <SelectTrigger id="import-sheet">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {upload.sheets.map((sheet) => (
                        <SelectItem key={sheet} value={sheet}>
                          {sheet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="import-header"
                  checked={hasHeader}
                  onCheckedChange={(checked) => setHasHeader(checked === true)}
                />
                <Label htmlFor="import-header" className="cursor-pointer font-normal">
                  A primeira linha contem os titulos das colunas
                </Label>
              </div>

              <div className="overflow-x-auto rounded-md border border-border scroll-thin">
                <table className="w-full min-w-[600px] text-xs">
                  <caption className="sr-only">Previa do arquivo</caption>
                  <tbody>
                    {upload.previewRows.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="max-w-[160px] truncate p-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(IMPORT_FIELD_LABELS) as ImportField[]).map((field) => (
                  <Field key={field} label={IMPORT_FIELD_LABELS[field]} htmlFor={`map-${field}`}>
                    <Select
                      value={columns[field] !== undefined ? String(columns[field]) : NO_COLUMN}
                      onValueChange={(value) =>
                        setColumns((current) => {
                          const next = { ...current };
                          if (value === NO_COLUMN) delete next[field];
                          else next[field] = Number(value);
                          return next;
                        })
                      }
                    >
                      <SelectTrigger id={`map-${field}`}>
                        <SelectValue placeholder="Nao importar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_COLUMN}>Nao importar</SelectItem>
                        {(upload.previewRows[0] ?? []).map((header, index) => (
                          <SelectItem key={index} value={String(index)}>
                            {hasHeader ? header || `Coluna ${index + 1}` : `Coluna ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Origem para todas as linhas"
                  htmlFor="import-source"
                  hint="Uma coluna de origem mapeada tem prioridade sobre esta escolha."
                >
                  <Select
                    value={sourceId || EMPTY}
                    onValueChange={(value) => setSourceId(value === EMPTY ? '' : value)}
                  >
                    <SelectTrigger id="import-source">
                      <SelectValue placeholder="Planilha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY}>Planilha (padrao)</SelectItem>
                      {(sources.data?.sources ?? [])
                        .filter((source) => source.active)
                        .map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Servico para todas as linhas" htmlFor="import-service">
                  <Select
                    value={serviceId || EMPTY}
                    onValueChange={(value) => setServiceId(value === EMPTY ? '' : value)}
                  >
                    <SelectTrigger id="import-service">
                      <SelectValue placeholder="Nao associar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY}>Nao associar</SelectItem>
                      {(services.data?.services ?? [])
                        .filter((service) => service.active)
                        .map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={reset}>
                  Voltar
                </Button>
                <Button
                  onClick={() => runPreview.mutate()}
                  loading={runPreview.isPending}
                  loadingText="Validando..."
                  disabled={Object.keys(columns).length === 0}
                >
                  Validar linhas
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* --- 3. Previa --------------------------------------------------- */}
        {step === 'preview' && preview ? (
          <Card>
            <CardHeader>
              <CardTitle>Confira antes de importar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Nada foi gravado ainda. Esta e apenas a simulacao.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <SummaryGrid summary={preview.summary} />

              {preview.summary.duplicates > 0 ? (
                <Callout tone="warning" title="Duplicatas serao ignoradas">
                  Nenhum card novo sera criado para elas e nenhum dado do lead existente sera
                  alterado. Depois da importacao voce podera revisar e preencher apenas campos
                  vazios, um a um.
                </Callout>
              ) : null}

              <RowTable rows={preview.rows} />

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep('mapping')}>
                  Ajustar mapeamento
                </Button>
                <Button
                  onClick={() => confirmImport.mutate()}
                  loading={confirmImport.isPending}
                  loadingText="Importando..."
                  disabled={preview.summary.imported === 0}
                >
                  Importar {formatNumber(preview.summary.imported)} lead(s)
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* --- 4. Relatorio ------------------------------------------------ */}
        {step === 'report' && report ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                  Relatorio da importacao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SummaryGrid summary={report.summary} />

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" asChild>
                    <a href={`/api/imports/${report.importJobId}/errors.csv`}>
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Baixar relatorio de erros (CSV)
                    </a>
                  </Button>
                  <Button variant="ghost" onClick={reset}>
                    Importar outro arquivo
                  </Button>
                </div>

                <RowTable rows={report.rows} />
              </CardContent>
            </Card>

            <FillEmptyPanel importJobId={report.importJobId} />
          </>
        ) : null}
      </PageBody>
    </>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'upload', label: '1. Arquivo' },
    { key: 'mapping', label: '2. Mapeamento' },
    { key: 'preview', label: '3. Validacao' },
    { key: 'report', label: '4. Relatorio' },
  ];
  const currentIndex = steps.findIndex((item) => item.key === step);

  return (
    <ol className="flex flex-wrap gap-2" aria-label="Etapas da importacao">
      {steps.map((item, index) => (
        <li key={item.key}>
          <Badge tone={index === currentIndex ? 'primary' : index < currentIndex ? 'success' : 'neutral'}>
            {item.label}
          </Badge>
        </li>
      ))}
    </ol>
  );
}

function SummaryGrid({ summary }: { summary: ImportSummary }) {
  const items = [
    { label: 'Total de linhas', value: summary.totalRows, tone: 'neutral' as const },
    { label: 'Importados', value: summary.imported, tone: 'success' as const },
    { label: 'Duplicados ignorados', value: summary.duplicates, tone: 'warning' as const },
    { label: 'Possiveis duplicidades', value: summary.probableDuplicates, tone: 'warning' as const },
    { label: 'Incompletos', value: summary.incomplete, tone: 'warning' as const },
    { label: 'Invalidos', value: summary.invalid, tone: 'danger' as const },
    { label: 'Linhas vazias', value: summary.empty, tone: 'neutral' as const },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((item) => (
        <div key={item.label} className="rounded-md border border-border p-2">
          <p className="text-[11px] text-muted-foreground">{item.label}</p>
          <p className="text-lg font-semibold">{formatNumber(item.value)}</p>
        </div>
      ))}
    </div>
  );
}

function RowTable({ rows }: { rows: RowOutcome[] }) {
  const problems = rows.filter((row) => row.status !== 'IMPORTED');
  if (problems.length === 0) {
    return (
      <Callout tone="success" title="Todas as linhas estao prontas">
        Nenhum problema encontrado.
      </Callout>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border scroll-thin">
      <table className="w-full min-w-[560px] text-sm">
        <caption className="sr-only">Linhas com observacoes</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="p-2">Linha</th>
            <th scope="col" className="p-2">Situacao</th>
            <th scope="col" className="p-2">Detalhe</th>
          </tr>
        </thead>
        <tbody>
          {problems.slice(0, 100).map((row) => (
            <tr key={row.rowNumber} className="border-b border-border last:border-0">
              <td className="p-2">{row.rowNumber}</td>
              <td className="p-2">
                <Badge
                  tone={
                    row.status === 'INVALID'
                      ? 'danger'
                      : row.status === 'DUPLICATE' || row.status === 'PROBABLE_DUPLICATE'
                        ? 'warning'
                        : row.status === 'INCOMPLETE'
                          ? 'warning'
                          : 'neutral'
                  }
                >
                  {IMPORT_ROW_STATUS_LABELS[row.status as keyof typeof IMPORT_ROW_STATUS_LABELS] ??
                    row.status}
                </Badge>
              </td>
              <td className="p-2 text-xs text-muted-foreground">
                {row.duplicateLeadName ? (
                  <span>
                    Lead ja existente: {row.duplicateLeadName}
                    {row.duplicateStageName ? ` — ${row.duplicateStageName}` : ''}
                  </span>
                ) : null}
                {row.matchSummary && !row.duplicateLeadName ? row.matchSummary : null}
                {row.errors.length > 0 ? (
                  <ul className="list-inside list-disc">
                    {row.errors.map((issue, index) => (
                      <li key={index}>{issue.message}</li>
                    ))}
                  </ul>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Revisao manual: preenche SOMENTE campos que estao vazios hoje.
 * Nada vem marcado por padrao e nenhum campo preenchido aparece na lista.
 */
function FillEmptyPanel({ importJobId }: { importJobId: string }) {
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: ['import-fillable', importJobId],
    queryFn: () =>
      api.get<{
        fields: {
          rowId: string;
          rowNumber: number;
          leadId: string;
          leadName: string;
          field: ImportField;
          importedValue: string;
          label: string;
        }[];
        explanation: string;
      }>(`/imports/${importJobId}/fillable`),
  });

  const fields = query.data?.fields ?? [];

  const apply = async () => {
    setSaving(true);
    try {
      const payload = fields
        .filter((item) => selected.has(`${item.rowId}:${item.field}`))
        .map((item) => ({ rowId: item.rowId, field: item.field }));

      const result = await api.post<{ applied: number; skipped: number; message: string }>(
        `/imports/${importJobId}/fill-empty`,
        { fields: payload },
      );

      toast.success('Revisao aplicada', result.message);
      setSelected(new Set());
      void query.refetch();
    } catch (caught) {
      toast.error(
        'Nao foi possivel aplicar',
        caught instanceof ApiError ? caught.message : undefined,
      );
    } finally {
      setSaving(false);
    }
  };

  if (query.isLoading) return <LoadingBlock />;

  if (fields.length === 0) {
    return (
      <Card>
        <CardContent>
          <EmptyState
            title="Nada para revisar"
            description="Os leads existentes ja possuem todos os campos que a planilha trouxe. Nenhum dado foi alterado."
            icon={<FileSpreadsheet className="h-6 w-6" aria-hidden="true" />}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisar dados encontrados</CardTitle>
        <p className="text-sm text-muted-foreground">{query.data?.explanation}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Callout
          tone="warning"
          title="Nenhum dado atual sera substituido"
          icon={<AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" />}
        >
          Somente campos hoje vazios aparecem aqui. Anotacoes, valores, etapa e historico nunca sao
          alterados.
        </Callout>

        <ul className="space-y-2">
          {fields.map((item) => {
            const key = `${item.rowId}:${item.field}`;
            return (
              <li
                key={key}
                className="flex items-start gap-3 rounded-md border border-border p-3 text-sm"
              >
                <Checkbox
                  id={`fill-${key}`}
                  className="mt-0.5"
                  checked={selected.has(key)}
                  onCheckedChange={(checked) =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (checked === true) next.add(key);
                      else next.delete(key);
                      return next;
                    })
                  }
                />
                <label htmlFor={`fill-${key}`} className="min-w-0 flex-1 cursor-pointer">
                  <span className="block font-medium">{item.leadName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.label} (linha {item.rowNumber})
                  </span>
                  <span className="mt-1 grid grid-cols-2 gap-2 text-xs">
                    <span className="rounded border border-border bg-muted px-2 py-1">
                      Atual: <span className="text-muted-foreground">vazio</span>
                    </span>
                    <span className="rounded border border-primary/20 bg-primary-soft px-2 py-1">
                      Importado: <span className="font-medium">{item.importedValue}</span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <Button onClick={apply} loading={saving} disabled={selected.size === 0}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Preencher {selected.size} campo(s) selecionado(s)
        </Button>
      </CardContent>
    </Card>
  );
}
