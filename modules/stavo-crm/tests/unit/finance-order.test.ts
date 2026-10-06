/**
 * Ordem de insercao dentro de createSale.
 *
 * O InnoDB valida chave estrangeira NO MOMENTO do INSERT. Gravar um filho
 * antes do pai derruba a transacao com o erro 1452 (ER_NO_REFERENCED_ROW_2).
 * Esse erro nao e um AppError, entao chega ao operador como a mensagem
 * generica "Erro inesperado" -- sem nenhuma pista da causa.
 *
 * Foi exatamente o que acontecia ao mover um lead para "Aguardando pagamento":
 * sale_items era gravado antes de sales.
 *
 * Estes testes NAO precisam de banco. Eles registram a sequencia real de
 * INSERTs e reproduzem a checagem que o InnoDB faria, usando as chaves
 * estrangeiras declaradas no proprio schema.
 */
import { getTableName, is } from 'drizzle-orm';
import { MySqlTable, getTableConfig } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import * as schema from '@server/db/schema';
import { createSale } from '@server/modules/finance/service';

type Linha = Record<string, unknown>;

interface Insercao {
  tabela: string;
  linhas: Linha[];
}

const TABELAS = new Map<string, MySqlTable>();
for (const valor of Object.values(schema)) {
  if (is(valor, MySqlTable)) TABELAS.set(getTableName(valor), valor);
}

/** Mapeia o nome da coluna no banco para a chave usada em JavaScript. */
function chavesDaTabela(tabela: MySqlTable): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const chave of Object.keys(tabela)) {
    const coluna = (tabela as unknown as Record<string, { name?: unknown }>)[chave];
    if (coluna && typeof coluna.name === 'string') mapa.set(coluna.name, chave);
  }
  return mapa;
}

/**
 * Percorre os INSERTs na ordem em que aconteceram e acusa qualquer linha que
 * aponte para um registro que ainda nao existe.
 *
 * Somente tabelas que nascem NESTA operacao sao cobradas: lead, servico e
 * usuario ja existem no banco antes da chamada.
 */
function violacoesDeChaveEstrangeira(insercoes: Insercao[]): string[] {
  const nascemAqui = new Set(insercoes.map((item) => item.tabela));
  const idsJaGravados = new Map<string, Set<string>>();
  const problemas: string[] = [];

  for (const insercao of insercoes) {
    const tabela = TABELAS.get(insercao.tabela);
    if (!tabela) continue;

    const chaves = chavesDaTabela(tabela);

    for (const linha of insercao.linhas) {
      for (const fk of getTableConfig(tabela).foreignKeys) {
        const referencia = fk.reference();
        const pai = getTableName(referencia.foreignTable);

        // Auto-referencia e tabelas preexistentes ficam de fora.
        if (pai === insercao.tabela || !nascemAqui.has(pai)) continue;

        referencia.columns.forEach((coluna, indice) => {
          // A checagem simulada cobre referencias a chave primaria.
          if (referencia.foreignColumns[indice]?.name !== 'id') return;

          const chaveJs = chaves.get(coluna.name);
          const valor = chaveJs ? linha[chaveJs] : undefined;
          if (valor === null || valor === undefined) return;

          if (!idsJaGravados.get(pai)?.has(String(valor))) {
            problemas.push(
              `${insercao.tabela}.${coluna.name} referencia ${pai} antes de ${pai} existir`,
            );
          }
        });
      }
    }

    const conhecidos = idsJaGravados.get(insercao.tabela) ?? new Set<string>();
    for (const linha of insercao.linhas) {
      if (typeof linha.id === 'string') conhecidos.add(linha.id);
    }
    idsJaGravados.set(insercao.tabela, conhecidos);
  }

  return problemas;
}

/**
 * Tabelas cujo SELECT sempre volta vazio nesta simulacao.
 *
 * O duble ignora o WHERE, entao devolver linhas aqui seria pior que devolver
 * nada: `recordEvent` acharia que todo evento ja existe e `confirmPayment`
 * acharia que o pagamento ja foi feito. Vazio e o estado correto para uma
 * transacao que acabou de comecar.
 */
const SEMPRE_VAZIAS = new Set(['lead_events', 'payments']);

const WORKSPACE_ID = 'workspace-finance-order-test';
const LEAD_ID = 'lead00000000000000000001';

/** Transacao de mentira que anota a sequencia de INSERTs. */
function criarTransacaoFalsa(catalogo: Linha[]): {
  tx: Database;
  insercoes: Insercao[];
} {
  const insercoes: Insercao[] = [];
  const gravadas = new Map<string, Linha[]>();

  const encadear = (resultado: unknown[]) => {
    const alvo = Promise.resolve(resultado) as Promise<unknown[]> & Record<string, () => unknown>;
    for (const metodo of ['where', 'limit', 'orderBy', 'groupBy', 'having']) {
      alvo[metodo] = () => alvo;
    }
    return alvo;
  };

  const consultar = (tabela: MySqlTable) => {
    const nome = getTableName(tabela);
    if (nome === 'services') return encadear(catalogo);
    if (nome === 'leads') {
      return encadear([
        {
          id: LEAD_ID,
          workspaceId: WORKSPACE_ID,
        },
      ]);
    }
    if (SEMPRE_VAZIAS.has(nome)) return encadear([]);
    return encadear(gravadas.get(nome) ?? []);
  };

  const tx = {
    select: () => ({ from: consultar }),
    insert: (tabela: MySqlTable) => ({
      values: (valores: Linha | Linha[]) => {
        const nome = getTableName(tabela);
        const linhas = Array.isArray(valores) ? valores : [valores];
        insercoes.push({ tabela: nome, linhas });
        gravadas.set(nome, [...(gravadas.get(nome) ?? []), ...linhas]);
        return Promise.resolve(undefined);
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve(undefined) }) }),
    // SELECT ... FOR UPDATE do confirmPayment: aqui nao ha concorrencia.
    execute: () => Promise.resolve([[], []]),
  };

  return { tx: tx as unknown as Database, insercoes };
}

const agora = new Date('2026-08-21T12:00:00Z');

const servico = (id: string, billingType: string): Linha => ({
  id,
  workspaceId: WORKSPACE_ID,
  name: `Servico ${id}`,
  description: null,
  billingType,
  defaultPrice: '900.00',
  active: true,
  createdAt: agora,
  updatedAt: agora,
});

const entradaBase = {
  leadId: LEAD_ID,
  agreedAt: '2026-08-21',
  dueDate: '2026-09-05',
  notes: null,
  actorUserId: 'user00000000000000000001',
};

const ordemDe = (insercoes: Insercao[]): string[] => insercoes.map((item) => item.tabela);

describe('createSale grava pai antes de filho', () => {
  it('a venda nasce antes dos itens (regressao do erro 1452)', async () => {
    const { tx, insercoes } = criarTransacaoFalsa([servico('svcunico', 'ONE_TIME')]);

    await createSale(tx, {
      ...entradaBase,
      items: [{ serviceId: 'svcunico', unitPrice: '900.00', quantity: 1 }],
      paidNow: false,
      idempotencyKey: 'chave-de-teste-1',
    });

    const ordem = ordemDe(insercoes);
    expect(ordem).toContain('sales');
    expect(ordem).toContain('sale_items');
    // Inverter esta linha e exatamente o bug que quebrava a movimentacao.
    expect(ordem.indexOf('sale_items')).toBeGreaterThan(ordem.indexOf('sales'));
    expect(violacoesDeChaveEstrangeira(insercoes)).toEqual([]);
  });

  it('assinatura nasce antes da cobranca que aponta para ela', async () => {
    const { tx, insercoes } = criarTransacaoFalsa([servico('svcmensal', 'RECURRING_MONTHLY')]);

    await createSale(tx, {
      ...entradaBase,
      items: [{ serviceId: 'svcmensal', unitPrice: '300.00', quantity: 1 }],
      paidNow: false,
      idempotencyKey: 'chave-de-teste-2',
    });

    const ordem = ordemDe(insercoes);
    expect(ordem.indexOf('sale_items')).toBeGreaterThan(ordem.indexOf('sales'));
    expect(ordem.indexOf('subscriptions')).toBeGreaterThan(ordem.indexOf('sale_items'));
    expect(ordem.indexOf('receivables')).toBeGreaterThan(ordem.indexOf('subscriptions'));
    expect(violacoesDeChaveEstrangeira(insercoes)).toEqual([]);
  });

  it('venda mista, com pagamento imediato, tambem respeita a ordem', async () => {
    const { tx, insercoes } = criarTransacaoFalsa([
      servico('svcunico', 'ONE_TIME'),
      servico('svcmensal', 'RECURRING_MONTHLY'),
    ]);

    await createSale(tx, {
      ...entradaBase,
      items: [
        { serviceId: 'svcunico', unitPrice: '1500.00', quantity: 1 },
        { serviceId: 'svcmensal', unitPrice: '300.00', quantity: 2 },
      ],
      paidNow: true,
      paymentDate: '2026-08-21',
      idempotencyKey: 'chave-de-teste-3',
    });

    expect(violacoesDeChaveEstrangeira(insercoes)).toEqual([]);
  });

  it('a checagem simulada realmente acusa uma ordem invertida', () => {
    // Sem este teste, um verificador quebrado passaria despercebido e os
    // demais casos ficariam verdes sem verificar nada.
    const invertido: Insercao[] = [
      { tabela: 'sale_items', linhas: [{ id: 'item1', saleId: 'venda1' }] },
      { tabela: 'sales', linhas: [{ id: 'venda1' }] },
    ];
    expect(violacoesDeChaveEstrangeira(invertido)).toHaveLength(1);
  });
});
