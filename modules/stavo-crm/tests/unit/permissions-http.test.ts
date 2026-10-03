/**
 * O bloqueio por cargo acontece no SERVIDOR.
 *
 * A tela esconde o que a pessoa nao pode fazer, mas esconder botao nao e
 * seguranca: quem souber o endereco chama a rota direto pelo navegador. Estes
 * testes exercitam o middleware por HTTP de verdade, com sessao simulada.
 */
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { UserRole } from '@shared/roles';
import { errorHandler, requireCapability, requireCapabilityToWrite } from '@server/middleware';
import { CSRF_COOKIE, CSRF_HEADER } from '@server/modules/auth/sessions';
import { apiRouter } from '@server/routes';

/** App minimo com uma sessao do cargo pedido. */
function criarApp(role: UserRole | null, montar: (app: express.Express) => void) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const bruto = req as unknown as { requestId: string; session?: unknown };
    bruto.requestId = 'teste';
    if (role) {
      bruto.session = { sessionId: 's', user: { id: 'user-1', email: 'a@b.c', name: 'A', role } };
    }
    next();
  });
  montar(app);
  app.use(errorHandler);
  return app;
}

const rotaProtegida = (app: express.Express) => {
  app.get('/pesquisa', requireCapability('GOOGLE_SEARCH'), (_req, res) => res.json({ ok: true }));
};

const rotaDeEscrita = (app: express.Express) => {
  app.use(requireCapabilityToWrite('SETTINGS_MANAGE'));
  app.get('/etapas', (_req, res) => res.json({ ok: true }));
  app.post('/etapas', (_req, res) => res.json({ ok: true }));
};

describe('requireCapability', () => {
  it('o suporte NAO chega na pesquisa do Google', async () => {
    // Era o exemplo dado: suporte nao gasta cota paga.
    const resposta = await request(criarApp('SUPPORT', rotaProtegida)).get('/pesquisa');
    expect(resposta.status).toBe(403);
  });

  it('a recusa diz qual cargo faltou, para a pessoa saber a quem pedir', async () => {
    const resposta = await request(criarApp('SUPPORT', rotaProtegida)).get('/pesquisa');
    // O envelope de erro da API e { error: { code, message, ... } }.
    expect(resposta.body.error.message).toContain('Suporte');
    expect(resposta.body.error.code).toBe('FORBIDDEN');
  });

  it('socio, funcionario e dono passam', async () => {
    for (const cargo of ['OWNER', 'PARTNER', 'EMPLOYEE'] as UserRole[]) {
      const resposta = await request(criarApp(cargo, rotaProtegida)).get('/pesquisa');
      expect(resposta.status, cargo).toBe(200);
    }
  });

  it('sem sessao e 401, nao 403', async () => {
    // A diferenca importa: 401 manda entrar, 403 diz que nao adianta.
    const resposta = await request(criarApp(null, rotaProtegida)).get('/pesquisa');
    expect(resposta.status).toBe(401);
  });
});

describe('requireCapabilityToWrite', () => {
  it('deixa ler, mas nao deixa gravar', async () => {
    // O quadro precisa da lista de etapas mesmo para quem nao pode edita-las.
    const app = criarApp('EMPLOYEE', rotaDeEscrita);
    expect((await request(app).get('/etapas')).status).toBe(200);
    expect((await request(app).post('/etapas').send({})).status).toBe(403);
  });

  it('o dono da conta grava', async () => {
    const app = criarApp('OWNER', rotaDeEscrita);
    expect((await request(app).post('/etapas').send({})).status).toBe(200);
  });

  it('o socio nao mexe em configuracoes', async () => {
    const app = criarApp('PARTNER', rotaDeEscrita);
    expect((await request(app).post('/etapas').send({})).status).toBe(403);
  });
});

/**
 * Os routers sao montados em fila, todos sem prefixo. Uma trava de cargo
 * aplicada com `router.use(trava)` sem caminho vale para TODA requisicao que
 * atravessa aquele router -- inclusive as dos routers seguintes. Foi assim
 * que a trava de importacao barrava o vendedor no dashboard e nas metas, e a
 * de configuracoes barrava a pesquisa do Google.
 *
 * Aqui a fila real e exercitada. O handler pode falhar por falta de banco
 * (500); o que nao pode acontecer e a recusa por cargo de outro modulo.
 */
describe('a trava de um modulo nao vaza para os outros', () => {
  const recusadoPorCargo = (resposta: request.Response) =>
    resposta.status === 403 && resposta.body?.error?.code === 'FORBIDDEN';

  const appReal = (role: UserRole) =>
    criarApp(role, (app) => {
      // O CSRF e testado a parte; aqui so interessa a regra de cargo.
      app.use((req, _res, next) => {
        const bruto = req as unknown as { cookies: Record<string, string> };
        bruto.cookies = { [CSRF_COOKIE]: 'token-de-teste' };
        req.headers[CSRF_HEADER] = 'token-de-teste';
        next();
      });
      app.use('/api', apiRouter);
    });

  it('o vendedor chega no dashboard, nas metas e na pesquisa', async () => {
    const app = appReal('EMPLOYEE');
    const chamadas: [string, request.Test][] = [
      ['GET /dashboard', request(app).get('/api/dashboard')],
      ['GET /goals', request(app).get('/api/goals')],
      ['GET /google/usage', request(app).get('/api/google/usage')],
      ['POST /google/search', request(app).post('/api/google/search').send({})],
      ['POST /google/leads', request(app).post('/api/google/leads').send({})],
      ['GET /meetings/upcoming', request(app).get('/api/meetings/upcoming')],
      ['GET /locations', request(app).get('/api/locations/states/SP/cities')],
    ];
    for (const [rota, chamada] of chamadas) {
      expect(recusadoPorCargo(await chamada), rota).toBe(false);
    }
  });

  it('as travas continuam valendo nas rotas do proprio modulo', async () => {
    const app = appReal('EMPLOYEE');
    expect(recusadoPorCargo(await request(app).get('/api/imports'))).toBe(true);
    expect(recusadoPorCargo(await request(app).post('/api/goals').send({}))).toBe(true);
    expect(recusadoPorCargo(await request(app).get('/api/goals/performance'))).toBe(true);
    expect(recusadoPorCargo(await request(app).post('/api/stages').send({}))).toBe(true);
    expect(recusadoPorCargo(await request(app).post('/api/team').send({}))).toBe(true);
  });
});
