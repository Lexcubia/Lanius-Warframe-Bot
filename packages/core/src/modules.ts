import { z } from 'zod';

/**
 * Lanius 功能模块稳定 id（开关 / ACL / 帮助 / 审计 / 订阅共用）。
 */
export const ModuleIdSchema = z.enum([
  'worldstate',
  'fissures',
  'invasions',
  'nightwave',
  'market',
  'riven',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
  'subscribe',
  'help',
  'mode',
]);

/**
 * 功能模块 id。
 */
export type ModuleId = z.infer<typeof ModuleIdSchema>;

/**
 * 默认可被 ACL / 开关管控的模块（不含 `mode` 会话偏好）。
 */
export const GATED_MODULE_IDS = [
  'worldstate',
  'fissures',
  'invasions',
  'nightwave',
  'market',
  'riven',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
  'subscribe',
  'help',
] as const satisfies readonly ModuleId[];
