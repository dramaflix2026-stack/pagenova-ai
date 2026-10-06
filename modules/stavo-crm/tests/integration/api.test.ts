/**
 * API HTTP: autenticacao, CSRF, protecao de rotas e quota do Google.
 */
import { eq } from 'drizzle-orm';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import type { Database } from '@server/db/client';
import { hashPassword } from '@server/modules/auth/password';
import { newId } from '@server/lib/ids';
import {
  hasTestDatabase,
  resetDatabase,
  schema,
  setupTestDatabase,
  SKIP_MESSAGE,
  teardownTestDatabase,
} from './setup';

const suite = hasTestDatabase ? describe : describe.skip;

if (!hasTestDatabase) {
  console.warn(`\n${SKIP_MESSAGE}\n`);
}

const EMAIL = 'teste@stavo.local';
const PASSWORD = 'senhaDeTesteForte2026';

suite('API HTTP', () => {
  let db: Database;
  let app: Express;

  beforeAll(async () => {
    db = await setupTestDatabase();
    const { createApp } = await import('@server/app');
    app = createApp();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase(db);
    const now = new Date();
    await db.insert(schema.users).values({
      id: newId(),
      email: EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  });

  /**
   * Faz login exatamente como um navegador faria.
   *
   * Importante: o token CSRF NAO e fabricado aqui. Ele e obtido do servidor,
   * como o navegador obtem. Fabricar o cookie mascarava um bug real -- a tela
   * de login ficava impossivel de usar porque o token nunca era emitido para
   * quem ainda nao havia entrado.
   */
  async function login() {
    const agent = request.agent(app);

    // Primeira visita: o servidor precisa emitir o cookie CSRF sozinho.
    const primeiraVisita = await agent.get('/api/health');
    const csrf = extractCsrf(primeiraVisita);
    expect(csrf, 'o servidor deve emitir o cookie CSRF na primeira visita').toBeTruthy();

    const response = await agent
      .post('/api/auth/login')
      .set('x-csrf-token', csrf!)
      .send({ email: EMAIL, password: PASSWORD });

    expect(response.status).toBe(200);
    return { agent, csrf: extractCsrf(response) ?? csrf! };
  }

  function extractCsrf(response: request.Response): string | null {
    const cookies = response.headers['set-cookie'];
    const list = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
    const match = list.find((cookie) => cookie.startsWith('stavo_csrf='));
    return match ? decodeURIComponent(match.split('=')[1]!.split(';')[0]!) : null;
  }

  describe('rotas publicas', () => {
    it('a saude responde sem sessao e sem segredo', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');

      const body = JSON.stringify(response.body);
      expect(body).not.toContain('PASSWORD');
      expect(body).not.toContain('SECRET');
    });

    it('a prontidao testa o banco sem revelar credenciais', async () => {
      const response = await request(app).get('/api/ready');
      expect([200, 503]).toContain(response.status);
      expect(JSON.stringify(response.body)).not.toContain(process.env.TEST_DB_USER ?? '@@@');
    });
  });

  describe('autenticacao', () => {
    it('sem sessao, as rotas internas respondem 401 em JSON', async () => {
      for (const path of ['/api/me', '/api/leads/board', '/api/dashboard', '/api/settings']) {
        const response = await request(app).get(path);
        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('senha errada nao revela se o e-mail existe', async () => {
      const agenteA = request.agent(app);
      const csrfA = extractCsrf(await agenteA.get('/api/health'))!;
      const errada = await agenteA
        .post('/api/auth/login')
        .set('x-csrf-token', csrfA)
        .send({ email: EMAIL, password: 'senhaCompletamenteErrada' });

      const agenteB = request.agent(app);
      const csrfB = extractCsrf(await agenteB.get('/api/health'))!;
      const inexistente = await agenteB
        .post('/api/auth/login')
        .set('x-csrf-token', csrfB)
        .send({ email: 'naoexiste@stavo.local', password: 'senhaCompletamenteErrada' });

      expect(errada.status).toBe(401);
      expect(inexistente.status).toBe(401);
      // A mensagem e exatamente a mesma nos dois casos.
      expect(errada.body.error.message).toBe(inexistente.body.error.message);
    });

    it('o cookie de sessao e HttpOnly e nao vai para o JavaScript', async () => {
      const agente = request.agent(app);
      const csrf = extractCsrf(await agente.get('/api/health'))!;
      const response = await agente
        .post('/api/auth/login')
        .set('x-csrf-token', csrf)
        .send({ email: EMAIL, password: PASSWORD });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      const session = cookies.find((cookie) => cookie.startsWith('stavo_session='));
      expect(session).toBeTruthy();
      expect(session).toContain('HttpOnly');
      expect(session).toContain('SameSite=Lax');
    });

    it('login valido da acesso as rotas internas', async () => {
      const { agent } = await login();
      const me = await agent.get('/api/me');
      expect(me.status).toBe(200);
      expect(me.body.user.email).toBe(EMAIL);
      // A resposta nunca traz o hash da senha.
      expect(JSON.stringify(me.body)).not.toContain('passwordHash');
    });

    it('logout invalida a sessao', async () => {
      const { agent, csrf } = await login();

      const logout = await agent.post('/api/auth/logout').set('x-csrf-token', csrf);
      expect(logout.status).toBe(200);

      const me = await agent.get('/api/me');
      expect(me.status).toBe(401);
    });

    it('a resposta de login nunca inclui a senha', async () => {
      const agente = request.agent(app);
      const csrf = extractCsrf(await agente.get('/api/health'))!;
      const response = await agente
        .post('/api/auth/login')
        .set('x-csrf-token', csrf)
        .send({ email: EMAIL, password: PASSWORD });

      expect(JSON.stringify(response.body)).not.toContain(PASSWORD);
    });
  });

  describe('CSRF', () => {
    it('o cookie CSRF e emitido para quem ainda NAO entrou', async () => {
      // Regressao: sem isto a tela de login e impossivel de usar, porque o
      // navegador nao teria token para enviar e o login seria sempre recusado.
      const response = await request(app).get('/api/health');
      const cookies = response.headers['set-cookie'];
      const lista = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      expect(lista.some((c) => c.startsWith('stavo_csrf='))).toBe(true);
    });

    it('mutacao sem o cabecalho e recusada', async () => {
      const { agent } = await login();
      const response = await agent.post('/api/leads').send({ internalName: 'Teste' });
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('mutacao com cabecalho divergente do cookie e recusada', async () => {
      const { agent } = await login();
      const response = await agent
        .post('/api/leads')
        .set('x-csrf-token', 'token-diferente-do-cookie')
        .send({ internalName: 'Teste' });
      expect(response.status).toBe(403);
    });

    it('leitura nao exige CSRF', async () => {
      const { agent } = await login();
      const response = await agent.get('/api/leads/board');
      expect(response.status).toBe(200);
    });
  });

  describe('validacao', () => {
    it('erros de campo vem com codigo estavel e mapa por campo', async () => {
      const { agent, csrf } = await login();
      const response = await agent
        .post('/api/leads')
        .set('x-csrf-token', csrf)
        .send({ internalName: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fieldErrors).toBeTruthy();
      expect(response.body.error.requestId).toBeTruthy();
    });

    it('rota inexistente devolve 404 padronizado para sessao valida', async () => {
      const { agent } = await login();
      const response = await agent.get('/api/rota-que-nao-existe');
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
    });

    it('rota inexistente nao revela sua existencia para quem nao entrou', async () => {
      const response = await request(app).get('/api/rota-que-nao-existe');
      expect(response.status).toBe(401);
    });
  });

  describe('quota do Google', () => {
    it('bloqueia a chamada quando o limite interno e atingido', async () => {
      const { reserveUsage } = await import('@server/modules/google/usage');
      const now = new Date();

      // Limite interno reduzido para 2 chamadas neste mes.
      await db
        .insert(schema.appSettings)
        .values({ workspaceId: '01TESTWORKSPACE000000000001', settingKey: 'googleTextSearchLimit', value: 2, updatedAt: now })
        .onDuplicateKeyUpdate({ set: { value: 2, updatedAt: now } });

      await reserveUsage(db, '01TESTWORKSPACE000000000001', 'TEXT_SEARCH', now);
      await reserveUsage(db, '01TESTWORKSPACE000000000001', 'TEXT_SEARCH', now);

      // A terceira e bloqueada ANTES de qualquer chamada externa.
      await expect(reserveUsage(db, '01TESTWORKSPACE000000000001', 'TEXT_SEARCH', now)).rejects.toMatchObject({
        code: 'GOOGLE_QUOTA_EXCEEDED',
      });

      const [usage] = await db
        .select()
        .from(schema.googleApiUsage)
        .where(eq(schema.googleApiUsage.skuType, 'TEXT_SEARCH'));
      expect(usage!.requestCount).toBe(2);
    });

    it('cada SKU tem contador proprio', async () => {
      const { reserveUsage, getUsageSummary } = await import('@server/modules/google/usage');
      const now = new Date();

      await reserveUsage(db, '01TESTWORKSPACE000000000001', 'TEXT_SEARCH', now);
      await reserveUsage(db, '01TESTWORKSPACE000000000001', 'PLACE_DETAILS', now);
      await reserveUsage(db, '01TESTWORKSPACE000000000001', 'PLACE_DETAILS', now);

      const summary = await getUsageSummary(db, '01TESTWORKSPACE000000000001', now);
      expect(summary.find((entry) => entry.sku === 'TEXT_SEARCH')!.used).toBe(1);
      expect(summary.find((entry) => entry.sku === 'PLACE_DETAILS')!.used).toBe(2);
    });

    it('chamadas simultaneas nunca ultrapassam o limite', async () => {
      const { reserveUsage } = await import('@server/modules/google/usage');
      const now = new Date();

      await db
        .insert(schema.appSettings)
        .values({ workspaceId: '01TESTWORKSPACE000000000001', settingKey: 'googleTextSearchLimit', value: 5, updatedAt: now })
        .onDuplicateKeyUpdate({ set: { value: 5, updatedAt: now } });

      // Dez tentativas ao mesmo tempo para um limite de cinco.
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, () => reserveUsage(db, '01TESTWORKSPACE000000000001', 'TEXT_SEARCH', now)),
      );

      const aprovadas = results.filter((result) => result.status === 'fulfilled').length;
      expect(aprovadas).toBe(5);

      const [usage] = await db
        .select()
        .from(schema.googleApiUsage)
        .where(eq(schema.googleApiUsage.skuType, 'TEXT_SEARCH'));
      expect(usage!.requestCount).toBe(5);
    });
  });

  describe('exportacao', () => {
    it('o backup JSON nao contem segredo algum', async () => {
      const { agent } = await login();
      const response = await agent.get('/api/exports/json');

      expect(response.status).toBe(200);
      const body = response.text;

      for (const secret of [
        'passwordHash',
        'password_hash',
        'tokenHash',
        'token_hash',
        'SESSION_SECRET',
        'GOOGLE_MAPS_API_KEY',
        PASSWORD,
      ]) {
        expect(body).not.toContain(secret);
      }
    });

    it('o CSV neutraliza formulas', async () => {
      const { agent, csrf } = await login();

      await agent
        .post('/api/leads')
        .set('x-csrf-token', csrf)
        .send({
          internalName: '=HYPERLINK("http://mal.com")',
          originType: 'MANUAL',
          contacts: [{ type: 'PHONE', value: '(11) 98888-7777', isPrimary: true }],
          links: [],
        });

      const response = await agent.get('/api/exports/csv/leads');
      expect(response.status).toBe(200);
      // A celula recebe um apostrofo antes do sinal de igual.
      expect(response.text).toContain("'=HYPERLINK");
    });
  });
});
