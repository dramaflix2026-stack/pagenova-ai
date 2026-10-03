/**
 * Leitura segura de CSV e XLSX.
 *
 * Regras de seguranca do arquivo:
 *  - extensao e conteudo validados;
 *  - celulas tratadas SEMPRE como dado; formulas e macros nunca sao executadas;
 *  - limite de linhas e de tamanho para evitar exaustao de memoria;
 *  - nada e gravado em disco: o buffer vive apenas na memoria da requisicao;
 *  - o caminho do arquivo nunca vem do usuario.
 */
import Papa from 'papaparse';
import readXlsxFile, { readSheetNames } from 'read-excel-file/node';

import { IMPORT_FIELDS, type ImportField } from '../../../shared/constants';
import { badRequest } from '../../lib/errors';

export interface ParsedSheet {
  /** Nome da aba (XLSX) ou 'CSV'. */
  sheetName: string;
  /** Linhas cruas, ja convertidas para texto. */
  rows: string[][];
}

export interface ParsedFile {
  sheets: string[];
  activeSheet: ParsedSheet;
  totalRows: number;
  truncated: boolean;
}

const toCellText = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'sim' : 'nao';
  return String(value).trim();
};

export async function parseCsv(buffer: Buffer, maxRows: number): Promise<ParsedFile> {
  // Remove BOM para nao contaminar o primeiro cabecalho.
  const text = buffer.toString('utf-8').replace(/^\uFEFF/, '');

  const result = Papa.parse<string[]>(text, {
    delimiter: '', // deteccao automatica (virgula, ponto e virgula, tab)
    skipEmptyLines: 'greedy',
    header: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw badRequest(
      'Nao foi possivel ler este CSV. Verifique se o arquivo esta integro e salvo em UTF-8.',
    );
  }

  const rows = result.data.map((row) => row.map(toCellText));
  const truncated = rows.length > maxRows;

  return {
    sheets: ['CSV'],
    activeSheet: { sheetName: 'CSV', rows: truncated ? rows.slice(0, maxRows) : rows },
    totalRows: rows.length,
    truncated,
  };
}

export async function parseXlsx(
  buffer: Buffer,
  maxRows: number,
  sheetName?: string | null,
): Promise<ParsedFile> {
  let sheets: string[];
  try {
    sheets = await readSheetNames(buffer);
  } catch {
    throw badRequest('Nao foi possivel ler este XLSX. O arquivo pode estar corrompido.');
  }

  if (sheets.length === 0) {
    throw badRequest('A planilha nao possui abas legiveis.');
  }

  const target = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0]!;

  let raw: unknown[][];
  try {
    // A biblioteca le apenas valores; formulas e macros nunca sao avaliadas.
    raw = (await readXlsxFile(buffer, { sheet: target })) as unknown[][];
  } catch {
    throw badRequest('Nao foi possivel ler a aba selecionada.');
  }

  const rows = raw
    .map((row) => row.map(toCellText))
    .filter((row) => row.some((cell) => cell.length > 0));

  const truncated = rows.length > maxRows;

  return {
    sheets,
    activeSheet: { sheetName: target, rows: truncated ? rows.slice(0, maxRows) : rows },
    totalRows: rows.length,
    truncated,
  };
}

/** Variacoes comuns de cabecalho aceitas na deteccao automatica. */
const HEADER_ALIASES: Record<ImportField, string[]> = {
  name: ['empresa', 'nome', 'nome da empresa', 'razao social', 'cliente', 'lead', 'estabelecimento'],
  phone: ['telefone', 'fone', 'celular', 'tel', 'contato', 'numero', 'telefone 1'],
  whatsapp: ['whatsapp', 'wpp', 'zap', 'whats'],
  email: ['email', 'e-mail', 'mail'],
  instagram: ['instagram', 'insta', 'ig', 'perfil'],
  website: ['site', 'website', 'web site', 'pagina', 'url', 'dominio'],
  demoUrl: ['demonstracao', 'demo', 'proposta', 'link da demo', 'link demonstracao'],
  mapsUrl: ['maps', 'google maps', 'link do maps', 'mapa'],
  address: ['endereco', 'logradouro', 'rua', 'localizacao'],
  city: ['cidade', 'municipio'],
  state: ['estado', 'uf'],
  country: ['pais'],
  niche: ['nicho', 'segmento', 'categoria', 'ramo', 'area'],
  source: ['origem', 'fonte'],
  service: ['servico', 'produto'],
  proposedPrice: ['valor', 'preco', 'valor proposto', 'orcamento'],
  notes: ['observacao', 'observacoes', 'notas', 'nota', 'comentario', 'obs'],
  nextFollowUp: ['follow up', 'follow-up', 'retorno', 'proximo contato', 'data de retorno'],
};

const normalizeHeader = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Sugere o mapeamento a partir dos cabecalhos.
 * E apenas SUGESTAO: o usuario confirma antes de importar.
 */
export function suggestMapping(headerRow: string[]): Partial<Record<ImportField, number>> {
  const mapping: Partial<Record<ImportField, number>> = {};
  const used = new Set<number>();

  for (const field of IMPORT_FIELDS) {
    const aliases = HEADER_ALIASES[field];

    for (const [index, header] of headerRow.entries()) {
      if (used.has(index)) continue;
      const normalized = normalizeHeader(header);
      if (!normalized) continue;

      // Os aliases passam pela mesma normalizacao do cabecalho, para que
      // "E-mail", "e mail" e "EMAIL" casem com a mesma entrada.
      if (
        aliases.some((alias) => {
          const target = normalizeHeader(alias);
          return normalized === target || normalized.startsWith(`${target} `);
        })
      ) {
        mapping[field] = index;
        used.add(index);
        break;
      }
    }
  }

  return mapping;
}

/** Heuristica simples: a primeira linha e cabecalho se casar com algum alias. */
export function looksLikeHeader(row: string[]): boolean {
  const suggested = suggestMapping(row);
  return Object.keys(suggested).length >= 2;
}
