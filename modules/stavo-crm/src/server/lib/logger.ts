/**
 * Log estruturado. Segredos, cookies, tokens e credenciais sao redigidos
 * antes de qualquer escrita.
 */
import pino from 'pino';

import { getEnv } from '../config/env';

const REDACTED_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'req.headers["x-csrf-token"]',
  'req.headers["x-cron-secret"]',
  'res.headers["set-cookie"]',
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'passwordHash',
  'token',
  'sessionToken',
  'apiKey',
  'GOOGLE_MAPS_API_KEY',
  'SESSION_SECRET',
  'DB_PASSWORD',
  'ADMIN_INITIAL_PASSWORD',
  'CRON_SECRET',
  '*.password',
  '*.passwordHash',
  '*.token',
];

const env = getEnv();

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
  redact: { paths: REDACTED_PATHS, censor: '[redigido]' },
  base: { service: 'stavo-crm' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export type Logger = typeof logger;
