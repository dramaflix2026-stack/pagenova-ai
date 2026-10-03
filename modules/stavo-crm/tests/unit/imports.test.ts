/**
 * Importacao: mapeamento de cabecalhos, normalizacao de linha, datas e
 * protecao do CSV exportado contra formula injection.
 */
import { describe, expect, it } from 'vitest';

import { escapeCsvCell, toCsv } from '@server/modules/exports/router';
import { looksLikeHeader, suggestMapping } from '@server/modules/imports/parser';
import { normalizeRow, parseDate } from '@server/modules/imports/service';
import type { ImportMapping } from '@shared/schemas';

const mapping = (columns: Record<string, number>): ImportMapping => ({
  columns: columns as ImportMapping['columns'],
  hasHeader: true,
  sheetName: null,
  sourceId: null,
  serviceId: null,
});

describe('deteccao de cabecalhos', () => {
  it('reconhece variacoes comuns em portugues', () => {
    const suggested = suggestMapping(['Empresa', 'Telefone', 'Instagram', 'Site', 'Cidade']);
    expect(suggested.name).toBe(0);
    expect(suggested.phone).toBe(1);
    expect(suggested.instagram).toBe(2);
    expect(suggested.website).toBe(3);
    expect(suggested.city).toBe(4);
  });

  it('reconhece sinonimos', () => {
    const suggested = suggestMapping(['Nome da empresa', 'Celular', 'WPP', 'Observações']);
    expect(suggested.name).toBe(0);
    expect(suggested.phone).toBe(1);
    expect(suggested.whatsapp).toBe(2);
    expect(suggested.notes).toBe(3);
  });

  it('ignora acentos e caixa', () => {
    expect(suggestMapping(['NOME', 'FONE']).name).toBe(0);
    expect(suggestMapping(['nome', 'e-mail']).email).toBe(1);
  });

  it('identifica se a primeira linha e cabecalho', () => {
    expect(looksLikeHeader(['Empresa', 'Telefone'])).toBe(true);
    expect(looksLikeHeader(['Padaria Sao Joao', '(11) 98888-7777'])).toBe(false);
  });
});

describe('normalizacao de linha', () => {
  const columns = mapping({ name: 0, phone: 1, website: 2, proposedPrice: 3, nextFollowUp: 4 });

  it('normaliza uma linha completa', () => {
    const row = normalizeRow(
      ['Padaria Sao Joao', '(11) 98888-7777', 'www.padaria.com.br', 'R$ 1.500,00', '15/09/2026'],
      columns,
      2,
    );
    expect(row.isEmpty).toBe(false);
    expect(row.errors).toHaveLength(0);
    expect(row.values.name).toBe('Padaria Sao Joao');
    expect(row.values.website).toBe('https://padaria.com.br');
    expect(row.values.proposedPrice).toBe('1500.00');
    expect(row.values.nextFollowUp).toBe('2026-09-15');
  });

  it('linha totalmente vazia e ignorada', () => {
    expect(normalizeRow(['', '   ', ''], columns, 3).isEmpty).toBe(true);
  });

  it('telefone invalido entra como dado a revisar, sem descartar a linha', () => {
    const row = normalizeRow(['Empresa', '123', '', '', ''], columns, 4);
    // O valor digitado e preservado...
    expect(row.values.phone).toBe('123');
    // ...mas fica sinalizado para revisao manual.
    expect(row.errors.some((error) => error.field === 'phone')).toBe(true);
  });

  it('linha sem telefone e importada assim mesmo', () => {
    const row = normalizeRow(['Empresa sem telefone', '', '', '', ''], columns, 5);
    expect(row.isEmpty).toBe(false);
    expect(row.values.name).toBe('Empresa sem telefone');
    expect(row.values.phone).toBeUndefined();
  });

  it('valor monetario invalido nao e convertido silenciosamente', () => {
    const row = normalizeRow(['Empresa', '', '', 'combinar', ''], columns, 6);
    expect(row.values.proposedPrice).toBeUndefined();
    expect(row.errors.some((error) => error.field === 'proposedPrice')).toBe(true);
  });

  it('URL invalida e sinalizada', () => {
    const row = normalizeRow(['Empresa', '', 'nao é link!!', '', ''], columns, 7);
    expect(row.values.website).toBeUndefined();
    expect(row.errors.some((error) => error.field === 'website')).toBe(true);
  });

  it('coluna nao mapeada e simplesmente ignorada', () => {
    const row = normalizeRow(['Empresa', '(11) 98888-7777', '', '', ''], mapping({ name: 0 }), 8);
    expect(row.values.name).toBe('Empresa');
    expect(row.values.phone).toBeUndefined();
  });
});

describe('datas', () => {
  it('aceita AAAA-MM-DD', () => {
    expect(parseDate('2026-09-15')).toBe('2026-09-15');
  });

  it('aceita DD/MM/AAAA', () => {
    expect(parseDate('15/09/2026')).toBe('2026-09-15');
    expect(parseDate('5/9/2026')).toBe('2026-09-05');
  });

  it('recusa data impossivel em vez de chutar', () => {
    expect(parseDate('31/02/2026')).toBeNull();
    expect(parseDate('2026-13-01')).toBeNull();
    expect(parseDate('amanha')).toBeNull();
  });
});

describe('CSV seguro', () => {
  it('neutraliza formulas', () => {
    expect(escapeCsvCell('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
    expect(escapeCsvCell('+1234')).toBe("'+1234");
    expect(escapeCsvCell('-1234')).toBe("'-1234");
    expect(escapeCsvCell('@import')).toBe("'@import");
  });

  it('escapa aspas e separadores', () => {
    expect(escapeCsvCell('Empresa "A", Ltda')).toBe('"Empresa ""A"", Ltda"');
    expect(escapeCsvCell('linha1\nlinha2')).toBe('"linha1\nlinha2"');
  });

  it('mantem texto comum intacto', () => {
    expect(escapeCsvCell('Padaria Sao Joao')).toBe('Padaria Sao Joao');
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(42)).toBe('42');
  });

  it('gera CSV com cabecalho e BOM', () => {
    const csv = toCsv([{ nome: 'A', valor: '10.00' }]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('nome,valor');
    expect(csv).toContain('A,10.00');
  });

  it('CSV vazio com colunas informadas ainda traz o cabecalho', () => {
    expect(toCsv([], ['a', 'b'])).toBe('a,b\n');
  });
});
