import type { AssembledApiConfig } from '@lanius/config';

/**
 * API 进程配置（由 `@lanius/config` 驱动组装）。
 * 保留此类型别名以免大范围改动既有引用。
 */
export type AppConfig = AssembledApiConfig;
