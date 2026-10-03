/**
 * Data do estorno.
 *
 * Regressao de um bug real: o estorno era datado no dia em que foi feito,
 * enquanto o pagamento que ele anula ficava na data original. O painel
 * mostrava receita NEGATIVA no periodo do estorno e receita inflada no
 * periodo do recebimento -- quando, na pratica, nada tinha entrado.
 *
 * O par precisa cair na MESMA data para se anular. Sem banco: a transacao e
 * simulada e o teste le a linha que teria sido gravada.
 */
import { getTableName, is } from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import * as schema from '@server/db/schema';
import { reversePayment } from '@server/modules/finance/service';

type Linha = Record<string, unknown>;

const PAGAMENTO_ORIGINAL: Linha = {
  id: 'pay00000000000000000001',
  receivableId: 'rec00000000000000000001',
  leadId: 'lead00000000000000000001',
  amount: '247.00',
  // Recebido ha varios dias: e essa data que o estorno precisa herdar.
  paymentDate: '2026-08-21',
  status: 'CONFIRMED',
  reversalOfId: null,
  reason: null,
  idempotencyKey: 'original',
  createdBy: 'user00000000000000000001',
  createdAt: new Date('2026-08-21T12:00:00Z'),
};

const RECEBIVEL: Linha = {
  id: 'rec00000000000000000001',
  leadId: 'lead00000000000000000001',
  saleId: null,
  subscriptionId: null,
  status: 'PAID',
  amount: '247.00',
};

/**
 * Transacao simulada.
 *
 * `reversePayment` consulta a tabela `payments` tres vezes, nesta ordem:
 * pela chave de idempotencia, pelo id do pagamento e pelo estorno existente.
 * A fila abaixo responde nessa sequencia, e o teste confere que ela foi
 * consumida por inteiro -- se a ordem das consultas mudar, isto falha em vez
 * de passar por acidente.
 */
function criarTransacaoFalsa() {
  const filaPayments: Linha[][] = [[], [PAGAMENTO_ORIGINAL], []];
  const inseridos: { tabela: string; linha: Linha }[] = [];

  const encadear = (resultado: unknown[]) => {
    const alvo = Promise.resolve(resultado) as Promise<unknown[]> & Record<string, () => unknown>;
    for (const metodo of ['where', 'limit', 'orderBy', 'groupBy', 'having']) {
      alvo[metodo] = () => alvo;
    }
    return alvo;
  };

  const consultar = (tabela: MySqlTable) => {
    const nome = getTableName(tabela);
    if (nome === 'payments') return encadear(filaPayments.shift() ?? []);
    if (nome === 'receivables') return encadear([RECEBIVEL]);
    // lead_events: nenhum evento anterior com esta chave.
    return encadear([]);
  };

  const tx = {
    select: () => ({ from: consultar }),
    insert: (tabela: MySqlTable) => ({
      values: (valores: Linha | Linha[]) => {
        const nome = getTableName(tabela);
        for (const linha of Array.isArray(valores) ? valores : [valores]) {
          inseridos.push({ tabela: nome, linha });
        }
        return Promise.resolve(undefined);
      },
    }),
    update: () => ({ set: () => ({ where: () => Promise.resolve(undefined) }) }),
    execute: () => Promise.resolve([[], []]),
  };

  return { tx: tx as unknown as Database, inseridos, filaPayments };
}

/** Garante que o schema realmente tem a coluna comparada. */
const TABELAS = new Set<string>();
for (const valor of Object.values(schema)) {
  if (is(valor, MySqlTable)) TABELAS.add(getTableName(valor));
}

describe('estorno de pagamento', () => {
  it('herda a data do pagamento original, nao a de hoje', async () => {
    const { tx, inseridos, filaPayments } = criarTransacaoFalsa();

    await reversePayment(tx, {
      paymentId: PAGAMENTO_ORIGINAL.id as string,
      reason: 'Cliente pediu devolucao',
      actorUserId: 'user00000000000000000001',
      idempotencyKey: 'chave-de-teste-estorno',
    });

    // As tres consultas previstas foram realmente feitas.
    expect(filaPayments).toHaveLength(0);

    const estorno = inseridos.find((item) => item.tabela === 'payments');
    expect(estorno).toBeDefined();
    expect(estorno!.linha.paymentDate).toBe('2026-08-21');
  });

  it('o valor e o negativo exato do original', async () => {
    const { tx, inseridos } = criarTransacaoFalsa();

    await reversePayment(tx, {
      paymentId: PAGAMENTO_ORIGINAL.id as string,
      reason: 'teste',
      actorUserId: 'user00000000000000000001',
      idempotencyKey: 'chave-2',
    });

    const estorno = inseridos.find((item) => item.tabela === 'payments')!;
    expect(estorno.linha.amount).toBe('-247.00');
    expect(estorno.linha.status).toBe('REVERSAL');
    expect(estorno.linha.reversalOfId).toBe(PAGAMENTO_ORIGINAL.id);
  });

  it('o par soma exatamente zero no periodo', async () => {
    // E a consequencia que o painel enxerga: nada entrou, nada saiu.
    const { tx, inseridos } = criarTransacaoFalsa();

    await reversePayment(tx, {
      paymentId: PAGAMENTO_ORIGINAL.id as string,
      reason: 'teste',
      actorUserId: 'user00000000000000000001',
      idempotencyKey: 'chave-3',
    });

    const estorno = inseridos.find((item) => item.tabela === 'payments')!;
    expect(estorno.linha.paymentDate).toBe(PAGAMENTO_ORIGINAL.paymentDate);

    const soma =
      Number(PAGAMENTO_ORIGINAL.amount as string) + Number(estorno.linha.amount as string);
    expect(soma).toBe(0);
  });

  it('registra QUANDO o estorno aconteceu, sem mexer na data contabil', async () => {
    // A auditoria nao pode se perder junto com a correcao do periodo.
    const { tx, inseridos } = criarTransacaoFalsa();
    const antes = Date.now();

    await reversePayment(tx, {
      paymentId: PAGAMENTO_ORIGINAL.id as string,
      reason: 'teste',
      actorUserId: 'user00000000000000000001',
      idempotencyKey: 'chave-4',
    });

    const estorno = inseridos.find((item) => item.tabela === 'payments')!;
    const criadoEm = estorno.linha.createdAt as Date;
    expect(criadoEm.getTime()).toBeGreaterThanOrEqual(antes);

    // E o log de auditoria continua sendo gravado.
    expect(inseridos.some((item) => item.tabela === 'audit_log')).toBe(true);
  });

  it('a tabela de pagamentos existe no schema com a coluna comparada', () => {
    // Trava contra o teste passar por engano se a tabela for renomeada.
    expect(TABELAS.has('payments')).toBe(true);
    expect(Object.keys(schema.payments)).toContain('paymentDate');
  });
});
