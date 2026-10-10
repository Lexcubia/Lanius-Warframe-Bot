import pino, { type Logger } from 'pino';

/**
 * Creates the process-wide structured logger for `apps/api`.
 *
 * @param level - Pino log level string (default `info`).
 * @returns Configured pino logger instance.
 */
export function createLogger(level: string = 'info'): Logger {
  return pino({
    level,
    name: 'lanius-api',
    base: { service: 'lanius-api' },
  });
}
