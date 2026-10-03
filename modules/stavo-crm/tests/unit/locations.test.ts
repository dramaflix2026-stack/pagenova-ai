/**
 * Estados e municipios do Brasil.
 *
 * O arquivo de dados e gerado a partir do IBGE (scripts/generate-locations.mjs)
 * e commitado. Estes testes existem para que uma regeneracao malfeita -- ou uma
 * edicao manual -- nao passe despercebida.
 *
 * Cobrem tambem a busca do Combobox, que precisa ignorar acento: quem digita
 * "sao paulo" tem de encontrar "Sao Paulo".
 */
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { filtrarOpcoes } from '@client/components/ui/Combobox';
import { semAcento } from '@client/lib/utils';
import { CIDADES_POR_UF, ESTADOS } from '@server/data/br-locations';
import { errorHandler } from '@server/middleware';
import { locationsRouter } from '@server/modules/locations/router';

describe('dados do IBGE', () => {
  it('tem as 27 unidades federativas, sem repetir sigla', () => {
    expect(ESTADOS).toHaveLength(27);
    expect(new Set(ESTADOS.map((estado) => estado.uf)).size).toBe(27);
  });

  it('toda unidade federativa tem municipios', () => {
    for (const estado of ESTADOS) {
      const cidades = CIDADES_POR_UF[estado.uf];
      expect(cidades, `${estado.uf} sem municipios`).toBeDefined();
      expect(cidades!.length, `${estado.uf} com lista vazia`).toBeGreaterThan(0);
    }
  });

  it('nao ha sigla em CIDADES_POR_UF que nao exista em ESTADOS', () => {
    const siglas = new Set(ESTADOS.map((estado) => estado.uf));
    for (const uf of Object.keys(CIDADES_POR_UF)) {
      expect(siglas.has(uf), `${uf} nao e uma UF conhecida`).toBe(true);
    }
  });

  it('o total de municipios bate com a ordem de grandeza do Brasil', () => {
    const total = Object.values(CIDADES_POR_UF).reduce((soma, lista) => soma + lista.length, 0);
    // O numero oficial gira em torno de 5.570 e muda muito raramente.
    expect(total).toBeGreaterThan(5500);
    expect(total).toBeLessThan(5700);
  });

  it('nenhum municipio aparece duas vezes dentro da mesma UF', () => {
    for (const [uf, cidades] of Object.entries(CIDADES_POR_UF)) {
      expect(new Set(cidades).size, `${uf} tem municipio repetido`).toBe(cidades.length);
    }
  });

  it('os acentos foram preservados', () => {
    // Se a codificacao do arquivo quebrar, isto falha antes de chegar na tela.
    expect(CIDADES_POR_UF.SP).toContain('São Paulo');
    expect(CIDADES_POR_UF.SP).toContain('Campinas');
    expect(CIDADES_POR_UF.SP).toContain('São José dos Campos');
    expect(ESTADOS.find((estado) => estado.uf === 'SP')?.nome).toBe('São Paulo');
    expect(ESTADOS.find((estado) => estado.uf === 'CE')?.nome).toBe('Ceará');
  });

  it('cada UF so contem municipios dela: Campinas nao aparece no Acre', () => {
    expect(CIDADES_POR_UF.AC).not.toContain('Campinas');
    expect(CIDADES_POR_UF.RJ).not.toContain('São Paulo');
    expect(CIDADES_POR_UF.SP).not.toContain('Rio de Janeiro');
  });

  it('as listas estao ordenadas em portugues', () => {
    const colator = new Intl.Collator('pt-BR');
    for (const [uf, cidades] of Object.entries(CIDADES_POR_UF)) {
      const ordenada = [...cidades].sort(colator.compare);
      expect(cidades, `${uf} fora de ordem`).toEqual(ordenada);
    }
  });
});

describe('busca do Combobox', () => {
  const municipios = [
    'São Paulo',
    'São José dos Campos',
    'Campinas',
    'Santos',
    'Ribeirão Preto',
  ].map((nome) => ({ value: nome, label: nome }));

  const rotulos = (lista: { label: string }[]) => lista.map((item) => item.label);

  it('sem termo devolve tudo', () => {
    expect(filtrarOpcoes(municipios, '')).toHaveLength(municipios.length);
    expect(filtrarOpcoes(municipios, '   ')).toHaveLength(municipios.length);
  });

  it('encontra mesmo sem acento', () => {
    expect(rotulos(filtrarOpcoes(municipios, 'sao paulo'))).toEqual(['São Paulo']);
    expect(rotulos(filtrarOpcoes(municipios, 'ribeirao'))).toEqual(['Ribeirão Preto']);
  });

  it('encontra tambem com acento digitado', () => {
    expect(rotulos(filtrarOpcoes(municipios, 'São'))).toEqual(['São Paulo', 'São José dos Campos']);
  });

  it('ignora maiusculas', () => {
    expect(rotulos(filtrarOpcoes(municipios, 'CAMPINAS'))).toEqual(['Campinas']);
  });

  it('palavras soltas somam, em qualquer ordem', () => {
    expect(rotulos(filtrarOpcoes(municipios, 'campos jose'))).toEqual(['São José dos Campos']);
  });

  it('a sigla da UF tambem encontra o estado', () => {
    const estados = [
      { value: 'SP', label: 'São Paulo', hint: 'SP' },
      { value: 'RJ', label: 'Rio de Janeiro', hint: 'RJ' },
    ];
    expect(rotulos(filtrarOpcoes(estados, 'rj'))).toEqual(['Rio de Janeiro']);
    expect(rotulos(filtrarOpcoes(estados, 'sp'))).toEqual(['São Paulo']);
  });

  it('termo sem correspondencia devolve lista vazia', () => {
    expect(filtrarOpcoes(municipios, 'lisboa')).toEqual([]);
  });
});

describe('semAcento', () => {
  it('remove acento, cedilha e caixa alta', () => {
    expect(semAcento('São Paulo')).toBe('sao paulo');
    expect(semAcento('Ceará')).toBe('ceara');
    expect(semAcento('Açu')).toBe('acu');
    expect(semAcento('  Brasil  ')).toBe('brasil');
  });
});

/**
 * A rota nao toca no banco: os dados vivem no bundle. Por isso ela cabe na
 * suite de unidade, com a sessao simulada -- `requireAuth` apenas verifica se
 * `req.session` existe.
 */
describe('GET /api/locations', () => {
  const criarApp = (comSessao: boolean) => {
    const app = express();
    app.use((req, _res, next) => {
      const bruto = req as unknown as { requestId: string; session?: unknown };
      bruto.requestId = 'teste';
      if (comSessao) bruto.session = { user: { id: 'usuario-de-teste' } };
      next();
    });
    app.use('/api', locationsRouter);
    app.use(errorHandler);
    return app;
  };

  it('devolve as 27 unidades federativas', async () => {
    const resposta = await request(criarApp(true)).get('/api/locations/states');
    expect(resposta.status).toBe(200);
    expect(resposta.body.states).toHaveLength(27);
    expect(resposta.body.states[0]).toHaveProperty('uf');
    expect(resposta.body.states[0]).toHaveProperty('nome');
  });

  it('devolve os municipios da UF pedida', async () => {
    const resposta = await request(criarApp(true)).get('/api/locations/states/SP/cities');
    expect(resposta.status).toBe(200);
    expect(resposta.body.uf).toBe('SP');
    expect(resposta.body.cities).toContain('Campinas');
    expect(resposta.body.cities).not.toContain('Rio de Janeiro');
  });

  it('aceita a sigla em minusculas', async () => {
    const resposta = await request(criarApp(true)).get('/api/locations/states/sp/cities');
    expect(resposta.status).toBe(200);
    expect(resposta.body.uf).toBe('SP');
  });

  it('UF inexistente devolve 404, nao lista vazia', async () => {
    // Lista vazia faria a tela parecer um estado sem municipios.
    const resposta = await request(criarApp(true)).get('/api/locations/states/XX/cities');
    expect(resposta.status).toBe(404);
  });

  it('sem sessao nao devolve nada', async () => {
    const resposta = await request(criarApp(false)).get('/api/locations/states');
    expect(resposta.status).toBe(401);
  });
});
