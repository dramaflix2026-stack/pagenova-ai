/**
 * Aplicacao Express.
 *
 * Em producao este mesmo processo expoe a API e serve o frontend compilado.
 * O fallback de SPA nunca intercepta rotas iniciadas por /api.
 */
import path from 'node:path';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { type Express, type Response } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { getEnv } from './config/env';
import { logger } from './lib/logger';
import {
  apiNotFound,
  ensureCsrfCookie,
  errorHandler,
  loadSession,
  noIndex,
  requestContext,
  validateOrigin,
} from './middleware';
import { GOOGLE_FONTS_FILE_ORIGIN, GOOGLE_FONTS_STYLE_ORIGIN } from '@site-kit/themes/fonts';
import { apiRouter } from './routes';

export function createApp(): Express {
  const env = getEnv();
  const app = express();

  app.disable('x-powered-by');

  // Confia no proxy reverso da hospedagem apenas quando explicitamente ligado.
  app.set('trust proxy', env.TRUST_PROXY ? 1 : false);

  app.use(requestContext);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as { requestId?: string }).requestId ?? '',
      autoLogging: {
        ignore: (req) => req.url === '/api/health',
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      // Somente metadados; nenhum corpo de requisicao ou resposta e registrado.
      serializers: {
        req: (req) => ({ method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          scriptSrc: ["'self'"],
          // Radix e Recharts aplicam estilos inline de posicionamento.
          // O dominio do Google Fonts entra porque a previa do editor renderiza
          // o site dentro de um iframe `srcdoc`, que herda ESTA politica.
          styleSrc: ["'self'", "'unsafe-inline'", GOOGLE_FONTS_STYLE_ORIGIN],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'", 'data:', GOOGLE_FONTS_FILE_ORIGIN],
          connectSrc: ["'self'"],
          manifestSrc: ["'self'"],
          upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'same-origin' },
      hsts: env.NODE_ENV === 'production' ? { maxAge: 15_552_000, includeSubDomains: true } : false,
    }),
  );

  app.use(compression());
  app.use(cookieParser());

  // Limite de corpo: uploads passam por multer com limite proprio.
  app.use('/api', express.json({ limit: '512kb' }));
  app.use('/api', express.urlencoded({ extended: false, limit: '512kb' }));

  app.use('/api', noIndex, ensureCsrfCookie, validateOrigin, loadSession, apiRouter);
  app.use('/api', apiNotFound);

  // robots.txt restritivo: complementa a autenticacao, nunca a substitui.
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send('User-agent: *\nDisallow: /\n');
  });

  registerPublicSiteRoutes(app);

  if (env.NODE_ENV === 'production') {
    const clientDir = path.resolve(process.cwd(), 'dist/client');

    // Assets com hash no nome podem ter cache longo; o HTML nunca.
    app.use(
      express.static(clientDir, {
        index: false,
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      }),
    );

    app.get('*', noIndex, (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
}

/**
 * Rota publica do site publicado (secao 16 da especificacao).
 *
 * Registrada ANTES do fallback de SPA de proposito: sem isto, `/p/:slug`
 * cairia no `app.get('*', ...)` do React Router e o prospect veria a tela de
 * login do CRM em vez do site dele.
 *
 * Nao passa por `/api`, por `requireAuth` nem por `apiRouter`: e a UNICA
 * rota do processo que serve conteudo sem sessao de proposito. Por isso a
 * CSP e sobrescrita aqui, so para esta origem -- o inline `<script>` do
 * runtime e do JSON-LD e OBRA NOSSA, gerada pelo renderer, nunca texto do
 * usuario; a CSP do resto do CRM continua estrita e intocada.
 */
function registerPublicSiteRoutes(app: Express): void {
  const setPublicHeaders = (res: Response): void => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; " +
        `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_STYLE_ORIGIN}; ` +
        `img-src 'self' data:; font-src 'self' data: ${GOOGLE_FONTS_FILE_ORIGIN}; ` +
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  };

  app.get('/p/:slug', async (req, res, next) => {
    try {
      const { findActivePublicationBySlug } = await import('./modules/site-ai/repository');
      const { readPublishedFile } = await import('@builder/publishing/publisher');

      const publication = await findActivePublicationBySlug(req.params.slug!);
      if (!publication) {
        setPublicHeaders(res);
        res.status(404).type('text/plain').send('Pagina nao encontrada.');
        return;
      }

      const html = await readPublishedFile(publication.projectId, publication.id, 'index.html');
      if (!html) {
        setPublicHeaders(res);
        res.status(404).type('text/plain').send('Pagina nao encontrada.');
        return;
      }

      setPublicHeaders(res);
      // HTML sempre revalida: uma nova publicacao precisa aparecer na hora,
      // nunca preso em cache do navegador ou de um proxy intermediario.
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.type('html').send(html);
    } catch (error) {
      next(error);
    }
  });

  app.get('/p/:slug/assets/images/:file', async (req, res, next) => {
    try {
      const { findActivePublicationBySlug } = await import('./modules/site-ai/repository');
      const { readPublishedFile } = await import('@builder/publishing/publisher');

      const publication = await findActivePublicationBySlug(req.params.slug!);
      if (!publication) return res.status(404).end();

      // O nome do arquivo e sempre `${assetId}.webp`, gerado pelo publisher
      // -- nunca um caminho vindo do visitante. `readPublishedFile` ainda
      // resolve contra a raiz do storage com protecao propria (storage.ts).
      const file = String(req.params.file ?? '');
      if (!/^[A-Za-z0-9_-]{1,64}\.webp$/.test(file)) return res.status(404).end();

      const buffer = await readPublishedFile(publication.projectId, publication.id, `assets/images/${file}`);
      if (!buffer) return res.status(404).end();

      // Asset tem hash no nome (o id do asset): pode ficar em cache por muito
      // tempo, porque o CONTEUDO daquele nome nunca muda.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.type('webp').send(buffer);
    } catch (error) {
      next(error);
    }
  });
}
