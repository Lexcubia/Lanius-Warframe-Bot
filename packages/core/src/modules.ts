import { z } from 'zod';

/**
 * Lanius 功能模块稳定 id（开关 / ACL / 帮助 / 审计 / 订阅共用）。
 */
export const ModuleIdSchema = z.enum([
  'worldstate',
  'fissures',
  'invasions',
  'nightwave',
  'sortie',
  'archon',
  'circuit',
  'bounties',
  'arbitration',
  'alerts',
  'archimedea',
  'market',
  'riven',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
  'subscribe',
  'help',
]);

/**
 * 功能模块 id。
 */
export type ModuleId = z.infer<typeof ModuleIdSchema>;

/**
 * 默认可被 ACL / 开关管控的模块。
 * 回复模式与卡片皮肤由后台 `bot.defaultReplyMode` / `bot.defaultCardSkin` 配置，不作为用户指令模块。
 */
export const GATED_MODULE_IDS = [
  'worldstate',
  'fissures',
  'invasions',
  'nightwave',
  'sortie',
  'archon',
  'circuit',
  'bounties',
  'arbitration',
  'alerts',
  'archimedea',
  'market',
  'riven',
  'voidTrader',
  'varzia',
  'tenetRotation',
  'codaRotation',
  'subscribe',
  'help',
] as const satisfies readonly ModuleId[];
