/**
 * Saude e prontidao.
 *  GET /api/health  publica, sem segredo e sem tocar no banco
 *  GET /api/ready   testa o banco e explica a causa da falha
 */
import { Router } from 'express';

import { getEnv } from '../../config/env';
import { getMigrationState } from '../../db/auto-migrate';
import { pingDatabase } from '../../db/client';
import { asyncHandler } from '../../lib/http';

export const healthRouter: Router = Router();

const startedAt = Date.now();

// Injetados pelo build (scripts/build-server.mjs).
declare const __BUILD_COMMIT__: string;
declare const __BUILD_TIME__: string;

const versao = {
  commit: typeof __BUILD_COMMIT__ === 'string' ? __BUILD_COMMIT__ : 'desenvolvimento',
  builtAt: typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : null,
};

healthRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    timezone: getEnv().APP_TIMEZONE,
    // Qual codigo esta no ar. Evita implantar e ficar na duvida.
    version: versao,
  });
});

/**
 * Traduz o codigo do driver em uma orientacao acionavel.
 *
 * Somente o CODIGO do erro e exposto -- nunca host, usuario, senha ou a
 * mensagem bruta, que pode conter credenciais.
 */
const DIAGNOSTICOS: Record<string, string> = {
  ENOTFOUND: 'O endereco do banco nao existe. Revise DB_HOST: o nome do servidor esta incorreto.',
  EAI_AGAIN: 'Nao foi possivel resolver o endereco do banco. Revise DB_HOST.',
  ECONNREFUSED:
    'O servidor recusou a conexao. O endereco responde, mas nao ha MySQL escutando nessa porta. Revise DB_HOST e DB_PORT.',
  ETIMEDOUT:
    'A conexao expirou. Um firewall provavelmente esta bloqueando. Libere o acesso remoto ao MySQL para o IP desta aplicacao.',
  ER_ACCESS_DENIED_ERROR: 'Usuario ou senha recusados pelo MySQL. Revise DB_USER e DB_PASSWORD.',
  ER_DBACCESS_DENIED_ERROR:
    'O usuario existe, mas nao tem permissao neste banco. Revise as permissoes de DB_USER sobre DB_NAME.',
  ER_HOST_NOT_PRIVILEGED:
    'O MySQL recusou a origem da conexao. Libere o IP desta aplicacao em "MySQL remoto" no painel.',
  ER_BAD_DB_ERROR: 'O banco informado nao existe. Revise DB_NAME.',
  ER_NOT_SUPPORTED_AUTH_MODE:
    'O metodo de autenticacao do usuario nao e compativel. Recrie o usuario do banco.',
  PROTOCOL_CONNECTION_LOST: 'A conexao caiu durante o teste. Pode ser instabilidade momentanea.',
};

/**
 * Extrai APENAS a origem que o MySQL recusou.
 *
 * A mensagem do driver tem a forma:
 *   Access denied for user 'usuario'@'origem' (using password: YES)
 *
 * O usuario e descartado; so a origem e devolvida, porque e ela que precisa
 * ser liberada no painel. Origem nao e credencial.
 */
function origemRecusada(error: unknown): string | null {
  const mensagem =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message)
      : '';
  const encontrado = mensagem.match(/@'([^']+)'/);
  return encontrado?.[1] ?? null;
}

healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    try {
      await pingDatabase();
      const migracoes = getMigrationState();
      // Pronto exige DUAS coisas: banco no ar e schema na versao do codigo.
      //
      // 'pendente' aqui significa que o banco estava fora quando a aplicacao
      // subiu, entao a migracao nem chegou a ser tentada. O banco voltou, mas
      // o schema pode estar velho -- reportar 'ok' esconderia isso ate uma
      // tela quebrar.
      const pronto = migracoes.status === 'aplicadas' || migracoes.status === 'desligado';
      res.status(pronto ? 200 : 503).json({
        status: pronto ? 'ready' : 'unavailable',
        database: 'ok',
        migrations: migracoes,
        ...(pronto
          ? {}
          : {
              hint:
                migracoes.status === 'pendente'
                  ? 'O banco responde agora, mas estava fora quando a aplicacao subiu e as ' +
                    'migracoes nao foram aplicadas. Reinicie a aplicacao.'
                  : 'O banco responde, mas as migracoes falharam. Veja o log da aplicacao.',
            }),
      });
    } catch (error) {
      const codigo =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : 'DESCONHECIDO';

      res.status(503).json({
        status: 'unavailable',
        database: 'unreachable',
        // Codigo do driver: nao revela host, usuario nem senha.
        code: codigo,
        hint: DIAGNOSTICOS[codigo] ?? 'Falha nao identificada ao conectar no banco.',
        // Origem que o MySQL enxerga. E o dado necessario para liberar o
        // acesso corretamente; nao e credencial.
        ...(origemRecusada(error) ? { seenAs: origemRecusada(error) } : {}),
      });
    }
  }),
);
