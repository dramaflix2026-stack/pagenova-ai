/**
 * Ordem da exclusao definitiva de um lead.
 *
 * Quase toda tabela aponta para `leads` com ON DELETE RESTRICT. Apagar o pai
 * antes do filho derruba a transacao com o erro 1451 (ER_ROW_IS_REFERENCED_2)
 * -- o espelho do 1452 que quebrou a movimentacao para "Aguardando pagamento".
 * Como esse erro tambem nao e um AppError, chegaria ao operador como um
 * generico "Erro inesperado".
 *
 * O teste registra a sequencia real de DELETEs e reproduz a checagem que o
 * InnoDB faria, lendo as chaves estrangeiras do proprio schema. Sem banco.
 */
import { getTableName, is } from 'drizzle-orm';
import { MySqlTable, getTableConfig } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import * as schema from '@server/db/schema';
import { deleteLead } from '@server/modules/leads/service';

const TABELAS: MySqlTable[] = [];
for (const valor of Object.values(schema)) {
  if (is(valor, MySqlTable)) TABELAS.push(valor);
}

/**
 * Para cada tabela-pai, quem aponta para ela com RESTRICT.
 *
 * Só RESTRICT importa: com CASCADE o proprio banco apaga o filho, e com
 * SET NULL a referencia e desfeita sem erro.
 */
function filhosQueBloqueiam(): Map<string, string[]> {
  const mapa = new Map<string, string[]>();

  for (const tabela of TABELAS) {
    const filho = getTableName(tabela);
    for (const fk of getTableConfig(tabela).foreignKeys) {
      if (fk.onDelete !== 'restrict' && fk.onDelete !== 'no action' && fk.onDelete !== undefined) {
        continue;
      }
      const pai = getTableName(fk.reference().foreignTable);
      if (pai === filho) continue;
      mapa.set(pai, [...(mapa.get(pai) ?? []), filho]);
    }
  }

  return mapa;
}

const BLOQUEADORES = filhosQueBloqueiam();

/** Acusa todo DELETE de pai que aconteceu antes do DELETE de um filho seu. */
function violacoes(ordem: string[]): string[] {
  const problemas: string[] = [];

  ordem.forEach((pai, indice) => {
    for (const filho of BLOQUEADORES.get(pai) ?? []) {
      const posicaoFilho = ordem.indexOf(filho);
      // Filho que nao e apagado nesta operacao nao entra na conta: ou nao tem
      // linha para este lead, ou sai em cascata.
      if (posicaoFilho === -1) continue;
      if (posicaoFilho > indice) {
        problemas.push(`${pai} apagado antes de ${filho}, que ainda aponta para ele`);
      }
    }
  });

  return problemas;
}

const LEAD_ID = 'lead00000000000000000001';

const leadFalso = {
  id: LEAD_ID,
  internalName: 'Lead de teste',
  archivedAt: null,
  currentStageId: 'stage0000000000000000001',
};

/** Transacao de mentira: anota a sequencia de DELETEs, ignora o resto. */
function criarBancoFalso() {
  const deletes: string[] = [];

  const encadear = (resultado: unknown[]) => {
    const alvo = Promise.resolve(resultado) as Promise<unknown[]> & Record<string, () => unknown>;
    for (const metodo of ['where', 'limit', 'orderBy', 'groupBy', 'having']) {
      alvo[metodo] = () => alvo;
    }
    return alvo;
  };

  // Só a tabela `leads` devolve linha: as demais consultas sao contagens, e
  // lista vazia ja significa zero em getLeadDeletionImpact.
  const consultar = (tabela: MySqlTable) =>
    encadear(getTableName(tabela) === 'leads' ? [leadFalso] : []);

  const alvo = {
    select: () => ({ from: consultar }),
    delete: (tabela: MySqlTable) => {
      deletes.push(getTableName(tabela));
      return { where: () => Promise.resolve(undefined) };
    },
    insert: () => ({ values: () => Promise.resolve(undefined) }),
    update: () => ({ set: () => ({ where: () => Promise.resolve(undefined) }) }),
    transaction: (cb: (tx: unknown) => Promise<unknown>) => cb(alvo),
  };

  return { db: alvo as unknown as Database, deletes };
}

describe('deleteLead apaga filho antes de pai', () => {
  it('a sequencia respeita todas as chaves estrangeiras do schema', async () => {
    const { db, deletes } = criarBancoFalso();
    await deleteLead(db, LEAD_ID, 'user00000000000000000001');

    expect(violacoes(deletes)).toEqual([]);
  });

  it('o lead sai por ultimo', async () => {
    const { db, deletes } = criarBancoFalso();
    await deleteLead(db, LEAD_ID, 'user00000000000000000001');

    // Nao literalmente o ultimo: a limpeza de chaves orfas vem depois.
    expect(deletes).toContain('leads');
    const posicaoLead = deletes.indexOf('leads');
    const dependentes = ['payments', 'receivables', 'sales', 'subscriptions', 'lead_events'];
    for (const tabela of dependentes) {
      expect(deletes.indexOf(tabela), `${tabela} deveria sair antes do lead`).toBeLessThan(
        posicaoLead,
      );
    }
  });

  it('o dinheiro e apagado, senao o painel continuaria contando', async () => {
    const { db, deletes } = criarBancoFalso();
    await deleteLead(db, LEAD_ID, 'user00000000000000000001');

    // Era exatamente a queixa: excluir o card e o valor continuar no painel.
    expect(deletes).toContain('payments');
    expect(deletes).toContain('receivables');
    expect(deletes).toContain('sales');
    expect(deletes).toContain('subscriptions');
  });

  it('pagamentos saem antes das cobrancas que eles quitam', async () => {
    const { db, deletes } = criarBancoFalso();
    await deleteLead(db, LEAD_ID, 'user00000000000000000001');

    expect(deletes.indexOf('payments')).toBeLessThan(deletes.indexOf('receivables'));
    expect(deletes.indexOf('receivables')).toBeLessThan(deletes.indexOf('sales'));
    expect(deletes.indexOf('receivables')).toBeLessThan(deletes.indexOf('subscriptions'));
  });

  it('toda tabela que trava o lead e apagada antes dele', async () => {
    // A checagem de ordem acima ignora tabela que nao aparece na sequencia.
    // Foi por esse buraco que as reunioes passaram: nunca eram apagadas, e o
    // banco recusava excluir qualquer lead que ja tivesse tido reuniao.
    const { db, deletes } = criarBancoFalso();
    await deleteLead(db, LEAD_ID, 'user00000000000000000001');

    const posicaoLead = deletes.indexOf('leads');
    for (const filho of BLOQUEADORES.get('leads') ?? []) {
      const posicao = deletes.indexOf(filho);
      expect(posicao, `${filho} trava o lead e nao e apagado`).not.toBe(-1);
      expect(posicao, `${filho} deveria sair antes do lead`).toBeLessThan(posicaoLead);
    }
  });

  it('a checagem simulada realmente acusa uma ordem invertida', () => {
    // Sem isto, um verificador quebrado deixaria os testes acima verdes a toa.
    expect(violacoes(['leads', 'payments'])).not.toHaveLength(0);
  });
});
