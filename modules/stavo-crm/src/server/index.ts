/**
 * Ponto de entrada do servidor.
 *
 * Requisitos da hospedagem: escuta em 0.0.0.0, usa process.env.PORT,
 * roda em um unico processo e encerra de forma graciosa fechando o MySQL.
 */
import { createApp } from './app';
import { getEnv, isSiteAiEnabled } from './config/env';
import { runPendingMigrations } from './db/auto-migrate';
import { closeDatabase, pingDatabase } from './db/client';
import { logger } from './lib/logger';
import { startSiteAiWorker, type WorkerHandle } from '@builder/generation/worker';

async function main(): Promise<void> {
  const env = getEnv();

  // Primeira linha de log do processo: se ela nao aparecer, o problema esta
  // antes daqui (arquivo de entrada errado ou ambiente invalido).
  logger.info(
    { node: process.version, env: env.NODE_ENV, port: env.PORT, host: env.HOST },
    'Iniciando a aplicacao...',
  );

  const app = createApp();

  // Verificacao inicial do banco.
  //
  // O processo NAO e encerrado quando o banco esta fora do ar. Encerrar aqui
  // apagaria justamente quem poderia relatar a causa: sem processo nao ha log,
  // nao ha /api/health e o operador so enxerga um 503 mudo.
  //
  // A aplicacao sobe, /api/health confirma que o processo vive e /api/ready
  // reporta o problema do banco. Uma indisponibilidade passageira tambem deixa
  // de derrubar o sistema.
  try {
    await pingDatabase();
    logger.info('Conexao com o MySQL verificada.');
    // So faz sentido migrar depois de confirmar que o banco responde.
    await runPendingMigrations();
  } catch (error) {
    logger.error(
      { err: error },
      'Nao foi possivel conectar ao MySQL. A aplicacao subiu, mas as telas que ' +
        'dependem de dados vao falhar. Confira as variaveis DB_* no ambiente do ' +
        'servidor e consulte /api/ready.',
    );
  }

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
      `${env.APP_NAME} disponivel.`,
    );
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 70_000;

  if (env.ADMIN_INITIAL_PASSWORD?.trim()) {
    logger.warn(
      'ADMIN_INITIAL_PASSWORD ainda esta definida. Remova a variavel do ambiente apos criar o administrador.',
    );
  }

  // Worker de Sites com IA: mesmo processo, sem infraestrutura adicional.
  // So sobe com o modulo ligado -- desligado, nenhum job e reivindicado e o
  // loop nem consulta o banco (ver a guarda dentro do proprio worker).
  let siteAiWorker: WorkerHandle | null = null;
  if (isSiteAiEnabled()) {
    siteAiWorker = startSiteAiWorker();
    logger.info('Worker de Sites com IA iniciado.');

    // Diagnostico de verdade (escreve, le, remove), nao suposicao (secao
    // 16.4). Nunca bloqueia o boot: um storage quebrado desativa upload e
    // publicacao, e o resto do CRM continua funcionando.
    const { createLocalStorage, checkStorageWritable } = await import('@builder/publishing/storage');
    const { siteAssetsDirAbsolute, publicSitesDirAbsolute } = await import('./config/env');

    const [assetsCheck, publicCheck] = await Promise.all([
      checkStorageWritable(createLocalStorage(siteAssetsDirAbsolute())),
      checkStorageWritable(createLocalStorage(publicSitesDirAbsolute())),
    ]);

    if (!assetsCheck.ok) {
      logger.error({ error: assetsCheck.error }, 'SITE_ASSETS_DIR nao esta gravavel. Upload de imagem vai falhar.');
    }
    if (!publicCheck.ok) {
      logger.error(
        { error: publicCheck.error },
        'SITE_PUBLIC_ASSETS_DIR nao esta gravavel. Publicacao de sites vai falhar.',
      );
    }
    if (assetsCheck.ok && publicCheck.ok) {
      logger.info('Storage de Sites com IA verificado: leitura, escrita e remocao confirmadas.');
    }
  }

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Encerrando a aplicacao...');

    server.close(() => {
      // Espera o job em andamento terminar antes de fechar o banco: matar a
      // conexao no meio de uma escrita deixaria o job preso em RUNNING ate o
      // lease vencer, e a versao que ele estava salvando poderia se perder.
      (siteAiWorker?.stop() ?? Promise.resolve())
        .then(() => closeDatabase())
        .then(() => {
          logger.info('Encerramento concluido.');
          process.exit(0);
        })
        .catch(() => process.exit(1));
    });

    // Rede de seguranca: nao deixa o processo pendurado indefinidamente.
    setTimeout(() => process.exit(1), 15_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Promise rejeitada sem tratamento.');
  });
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'Excecao nao capturada. Encerrando por seguranca.');
    shutdown('uncaughtException');
  });
}

main().catch((error: unknown) => {
  // Erro de configuracao de ambiente cai aqui, com mensagem explicativa.
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`\nFalha ao iniciar a aplicacao:\n${message}\n\n`);
  process.exit(1);
});
