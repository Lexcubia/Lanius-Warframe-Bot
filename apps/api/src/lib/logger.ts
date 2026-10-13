import { createLaniusLogger, type Logger } from '@lanius/logger';

/**
 * 创建 API 进程级结构化日志器（委托 `@lanius/logger`，含密钥脱敏）。
 *
 * @param level - Pino 日志级别字符串（默认 `info`）
 * @returns 已配置的 logger 实例
 */
export function createLogger(level: string = 'info'): Logger {
  return createLaniusLogger({
    service: 'lanius-api',
    level,
  });
}

export type { Logger };
