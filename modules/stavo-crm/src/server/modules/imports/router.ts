/**
 * Assistente de importacao.
 *
 * Fluxo: upload -> escolha de aba -> previa -> mapeamento -> validacao ->
 * previa de duplicidades -> confirmacao -> relatorio -> revisao manual.
 *
 * O arquivo vive apenas em memoria, por no maximo 30 minutos, e nunca e
 * gravado em disco. Nenhum caminho de arquivo vem do usuario.
 */
import { desc } from 'drizzle-orm';
import { Router } from 'express';
import multer from 'multer';

import { IMPORT_FIELD_LABELS, IMPORT_ROW_STATUS_LABELS } from '../../../shared/constants';
import {
  importConfirmSchema,
  importFillEmptySchema,
  importMappingSchema,
  importPreviewSchema,
} from '../../../shared/schemas';
import { getEnv } from '../../config/env';
import { getDb } from '../../db/client';
import { importJobs } from '../../db/schema';
import { badRequest, notFound } from '../../lib/errors';
import { asyncHandler, parseBody } from '../../lib/http';
import { newId } from '../../lib/ids';
import { requireCapability, csrfProtection, requireAuth } from '../../middleware';
import { looksLikeHeader, parseCsv, parseXlsx, suggestMapping, type ParsedFile } from './parser';
import {
  applyFillEmpty,
  assertMapping,
  getImportJob,
  listFillableFields,
  previewImport,
  runImport,
} from './service';
import { toCsv } from '../exports/router';

const env = getEnv();

const upload = multer({
  // Memoria apenas: nada toca o disco do servidor.
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_IMPORT_FILE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.csv') || name.endsWith('.xlsx')) {
      callback(null, true);
      return;
    }
    callback(badRequest('Envie um arquivo .csv ou .xlsx.'));
  },
});

/** Upload retido em memoria enquanto o usuario percorre o assistente. */
interface PendingUpload {
  id: string;
  filename: string;
  buffer: Buffer;
  kind: 'csv' | 'xlsx';
  createdAt: number;
}

const PENDING_TTL_MS = 30 * 60 * 1000;
const pendingUploads = new Map<string, PendingUpload>();

function purgePending(): void {
  const cutoff = Date.now() - PENDING_TTL_MS;
  for (const [id, item] of pendingUploads) {
    if (item.createdAt < cutoff) pendingUploads.delete(id);
  }
}

function getPending(uploadId: string): PendingUpload {
  purgePending();
  const pending = pendingUploads.get(uploadId);
  if (!pending) {
    throw notFound(
      'O arquivo enviado expirou ou nao foi encontrado. Envie a planilha novamente.',
      'UPLOAD_EXPIRED',
    );
  }
  return pending;
}

async function readSheet(pending: PendingUpload, sheetName?: string | null): Promise<ParsedFile> {
  return pending.kind === 'csv'
    ? parseCsv(pending.buffer, env.MAX_IMPORT_ROWS)
    : parseXlsx(pending.buffer, env.MAX_IMPORT_ROWS, sheetName ?? null);
}

export const importsRouter: Router = Router();

importsRouter.use(requireAuth);
importsRouter.use('/imports', requireCapability('LEAD_IMPORT'));

importsRouter.get(
  '/imports/fields',
  asyncHandler(async (_req, res) => {
    res.json({
      fields: Object.entries(IMPORT_FIELD_LABELS).map(([value, label]) => ({ value, label })),
      statusLabels: IMPORT_ROW_STATUS_LABELS,
      maxFileMb: env.MAX_IMPORT_FILE_MB,
      maxRows: env.MAX_IMPORT_ROWS,
    });
  }),
);

importsRouter.get(
  '/imports',
  asyncHandler(async (_req, res) => {
    const rows = await getDb()
      .select()
      .from(importJobs)
      .orderBy(desc(importJobs.createdAt))
      .limit(50);
    res.json({ imports: rows });
  }),
);

importsRouter.post(
  '/imports/upload',
  csrfProtection,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest('Selecione um arquivo para importar.');

    purgePending();

    const kind = req.file.originalname.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx';
    const uploadId = newId();

    pendingUploads.set(uploadId, {
      id: uploadId,
      filename: req.file.originalname,
      buffer: req.file.buffer,
      kind,
      createdAt: Date.now(),
    });

    const parsed = await readSheet(pendingUploads.get(uploadId)!);
    const firstRow = parsed.activeSheet.rows[0] ?? [];
    const hasHeader = looksLikeHeader(firstRow);

    res.status(201).json({
      uploadId,
      filename: req.file.originalname,
      sheets: parsed.sheets,
      activeSheet: parsed.activeSheet.sheetName,
      hasHeader,
      suggestedMapping: hasHeader ? suggestMapping(firstRow) : {},
      // Previa curta: o usuario confere antes de mapear.
      previewRows: parsed.activeSheet.rows.slice(0, 10),
      totalRows: parsed.totalRows,
      truncated: parsed.truncated,
      truncationNotice: parsed.truncated
        ? `O arquivo tem mais de ${env.MAX_IMPORT_ROWS} linhas. Apenas as primeiras serao processadas.`
        : null,
    });
  }),
);

importsRouter.post(
  '/imports/preview',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(importPreviewSchema, req);
    const mapping = importMappingSchema.parse(input.mapping);
    assertMapping(mapping);

    const pending = getPending(input.uploadId);
    const parsed = await readSheet(pending, mapping.sheetName);
    const preview = await previewImport(getDb(), parsed.activeSheet.rows, mapping);

    res.json({
      summary: preview.summary,
      // Limita o retorno para nao pesar a resposta em arquivos grandes.
      rows: preview.rows.slice(0, 200),
      totalRows: preview.rows.length,
    });
  }),
);

importsRouter.post(
  '/imports/confirm',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(importConfirmSchema, req);
    const mapping = importMappingSchema.parse(input.mapping);
    assertMapping(mapping);

    const pending = getPending(input.uploadId);
    const parsed = await readSheet(pending, mapping.sheetName);

    const result = await runImport(getDb(), {
      filename: pending.filename,
      rawRows: parsed.activeSheet.rows,
      mapping,
      idempotencyKey: input.idempotencyKey,
      actorUserId: req.session!.user.id,
    });

    // O arquivo em memoria e descartado assim que a importacao termina.
    pendingUploads.delete(input.uploadId);

    res.status(201).json({
      importJobId: result.importJobId,
      summary: result.summary,
      alreadyProcessed: result.alreadyProcessed,
      rows: result.rows.slice(0, 500),
      message: result.alreadyProcessed
        ? 'Esta importacao ja havia sido processada. Nenhum lead foi duplicado.'
        : 'Importacao concluida.',
    });
  }),
);

importsRouter.get(
  '/imports/:id',
  asyncHandler(async (req, res) => {
    res.json(await getImportJob(getDb(), req.params.id!));
  }),
);

importsRouter.get(
  '/imports/:id/fillable',
  asyncHandler(async (req, res) => {
    res.json({
      fields: await listFillableFields(getDb(), req.params.id!),
      explanation:
        'Adicionar ao lead existente apenas uma informacao que ainda nao existe, apos sua confirmacao. ' +
        'Nenhum dado atual sera substituido.',
    });
  }),
);

importsRouter.post(
  '/imports/:id/fill-empty',
  csrfProtection,
  asyncHandler(async (req, res) => {
    const input = parseBody(importFillEmptySchema, req);
    const result = await applyFillEmpty(
      getDb(),
      req.params.id!,
      input.fields.map((item) => ({ rowId: item.rowId, field: item.field })),
      req.session!.user.id,
    );

    res.json({
      ...result,
      message:
        result.skipped > 0
          ? `${result.applied} campo(s) preenchido(s). ${result.skipped} ignorado(s) porque ja possuiam valor.`
          : `${result.applied} campo(s) preenchido(s). Nenhum dado existente foi alterado.`,
    });
  }),
);

importsRouter.get(
  '/imports/:id/errors.csv',
  asyncHandler(async (req, res) => {
    const { rows } = await getImportJob(getDb(), req.params.id!);

    const problems = rows
      .filter((row) => row.status !== 'IMPORTED')
      .map((row) => ({
        linha: row.rowNumber,
        situacao: IMPORT_ROW_STATUS_LABELS[row.status as keyof typeof IMPORT_ROW_STATUS_LABELS],
        detalhe: row.normalizedMatchSummary ?? '',
        erros: ((row.validationErrors as { field: string; message: string }[]) ?? [])
          .map((error) => `${error.field}: ${error.message}`)
          .join(' | '),
      }));

    // toCsv ja protege contra formula injection.
    const csv = toCsv(problems, ['linha', 'situacao', 'detalhe', 'erros']);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-importacao.csv"');
    res.send(csv);
  }),
);
