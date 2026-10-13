import pino, { type Logger, type LoggerOptions } from 'pino';

import { LANIUS_LOG_REDACT_PATHS } from './redact-paths.js';

/**
 * 创建 Lanius 进程日志器的选项。
 */
export type CreateLaniusLoggerOptions = {
  /** 服务名（写入 `name` / `service` 字段），如 `lanius-bot`。 */
  service: string;
  /** pino 级别，默认 `info`。 */
  level?: string;
  /** 追加到每条日志的固定字段。 */
  base?: Record<string, unknown>;
  /** 额外 redact 路径（合并到默认密钥路径）。 */
  redactPaths?: readonly string[];
};

/**
 * 创建带密钥脱敏的结构化 pino 日志器，供 api / bot 等共用。
 *
 * @param options - 服务名、级别与可选 base 字段
 * @returns 已配置 redact 的 pino `Logger`
 */
export function createLaniusLogger(options: CreateLaniusLoggerOptions): Logger {
  const paths = [...LANIUS_LOG_REDACT_PATHS, ...(options.redactPaths ?? [])];
  const pinoOptions: LoggerOptions = {
    name: options.service,
    level: options.level ?? 'info',
    base: {
      service: options.service,
      ...(options.base ?? {}),
    },
    redact: {
      paths: [...paths],
      censor: '[Redacted]',
    },
  };
  return pino(pinoOptions);
}

/**
 * 从既有日志器派生子 logger（绑定固定字段，如 `component=qq-send`）。
 *
 * @param parent - 父 logger
 * @param bindings - 绑定到子 logger 的结构化字段
 * @returns 子 logger
 */
export function childLogger(parent: Logger, bindings: Record<string, unknown>): Logger {
  return parent.child(bindings);
}

export type { Logger };
