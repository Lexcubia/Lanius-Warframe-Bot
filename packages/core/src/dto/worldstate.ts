import { z } from 'zod';

import { RealmSchema } from '../realm.js';
import { CatalogItemDtoSchema } from './item.js';
import {
  AlertDtoSchema,
  ArbitrationDtoSchema,
  ArchimedeaDtoSchema,
  ArchonHuntDtoSchema,
  BountySyndicateDtoSchema,
  CircuitDtoSchema,
  SortieDtoSchema,
} from './worldstate-missions.js';

/**
 * Localized display name pair used on worldstate entities.
 */
export const LocalizedNameSchema = z.object({
  zh: z.string(),
  en: z.string(),
});

/**
 * Bilingual name object for client-side locale selection.
 */
export type LocalizedName = z.infer<typeof LocalizedNameSchema>;

/**
 * Single invasion mission normalized for Lanius clients.
 * 节点 / 阵营为双语名；奖励为带官方图标的物品引用。
 */
export const InvasionDtoSchema = z.object({
  id: z.string().min(1),
  node: LocalizedNameSchema,
  attackingFaction: LocalizedNameSchema,
  defendingFaction: LocalizedNameSchema,
  attackerReward: CatalogItemDtoSchema.optional(),
  defenderReward: CatalogItemDtoSchema.optional(),
  completionPct: z.number().min(0).max(100).optional(),
  expired: z.boolean(),
});

/**
 * Normalized invasion row (node, factions, optional rewards/progress).
 */
export type InvasionDto = z.infer<typeof InvasionDtoSchema>;

/**
 * 午夜电波挑战周期：每日 / 每周 / 其他（无法识别时）。
 */
export const NightwaveChallengeKindSchema = z.enum(['daily', 'weekly', 'other']);

/**
 * 午夜电波单条挑战。
 */
export const NightwaveChallengeDtoSchema = z.object({
  id: z.string().min(1),
  /** 每日 / 每周 / 其他 */
  kind: NightwaveChallengeKindSchema,
  /** 周期档双语标签（如「每日」「每周」） */
  kindLabel: LocalizedNameSchema,
  title: LocalizedNameSchema.optional(),
  description: LocalizedNameSchema.optional(),
  reputation: z.number().int().optional(),
  expiry: z.string().datetime().optional(),
});

/**
 * Nightwave / seasonal challenge summary for MVP worldstate.
 */
export const NightwaveDtoSchema = z.object({
  season: z.number().int().nonnegative().optional(),
  phase: z.number().int().nonnegative().optional(),
  activeChallenges: z.array(NightwaveChallengeDtoSchema),
});

/**
 * Normalized Nightwave slice embedded in worldstate.
 */
export type NightwaveDto = z.infer<typeof NightwaveDtoSchema>;

/**
 * 午夜电波挑战周期档。
 */
export type NightwaveChallengeKind = z.infer<typeof NightwaveChallengeKindSchema>;

/**
 * 午夜电波单条挑战。
 */
export type NightwaveChallengeDto = z.infer<typeof NightwaveChallengeDtoSchema>;

/**
 * 开放世界周期标识（世界状态模块主内容）。
 */
export const OpenWorldCycleIdSchema = z.enum([
  'earth',
  'cetus',
  'cambion',
  'vallis',
  'duviri',
  'zariman',
]);

/**
 * 单条开放世界周期（地球昼夜、平原、魔胎、山谷、双衍、扎里曼）。
 */
export const OpenWorldCycleDtoSchema = z.object({
  id: OpenWorldCycleIdSchema,
  name: LocalizedNameSchema,
  /** 机器可读状态键：day/night/fass/vome/warm/cold/... */
  state: z.string().min(1),
  stateLabel: LocalizedNameSchema,
  expiry: z.string().datetime(),
  remainingMs: z.number().int().nonnegative(),
  /** 当前状态已流逝比例 `[0,1]`，供环形进度渲染。 */
  progress: z.number().min(0).max(1),
});

/**
 * Normalized open-world cycle row.
 */
export type OpenWorldCycleDto = z.infer<typeof OpenWorldCycleDtoSchema>;
export type OpenWorldCycleId = z.infer<typeof OpenWorldCycleIdSchema>;

/**
 * 虚空裂隙遗物纪元（古纪→全能）。
 */
export const FissureEraSchema = z.enum(['lith', 'meso', 'neo', 'axi', 'requiem', 'omnia']);

/**
 * 裂隙路径档：普通 / 钢铁之路 / 九重天（虚空风暴）。
 */
export const FissurePathSchema = z.enum(['normal', 'steelPath', 'empyrean']);

/**
 * 单条虚空裂隙（含官方遗物图标路径）。
 */
export const FissureDtoSchema = z.object({
  id: z.string().min(1),
  era: FissureEraSchema,
  eraLabel: LocalizedNameSchema,
  missionTypeKey: z.string().min(1),
  missionType: LocalizedNameSchema,
  node: LocalizedNameSchema,
  path: FissurePathSchema,
  pathLabel: LocalizedNameSchema,
  /** 官方 PublicExport 相对路径，如 `/Lotus/Interface/Icons/Relics/RelicLithA.png` */
  iconPath: z.string().min(1),
  /**
   * 官方 CDN 图标 URL（`content.warframe.com/PublicExport…`）。
   * 部分环境需带 contentHash 后缀；渲染侧优先用已打包的官方导出图。
   */
  iconUrl: z.string().url(),
  expiry: z.string().datetime(),
  remainingMs: z.number().int().nonnegative(),
});

/**
 * Normalized void fissure row.
 */
export type FissureDto = z.infer<typeof FissureDtoSchema>;
export type FissureEra = z.infer<typeof FissureEraSchema>;
export type FissurePath = z.infer<typeof FissurePathSchema>;

/**
 * Worldstate snapshot：开放世界周期 + 裂隙 + 入侵 + 午夜电波 + 任务模块切片。
 * 任务模块字段并列、无耦合（alerts 与 archimedea 禁止共享业务类型）。
 * 客户端按指令模块分别消费，勿依赖上游字段名。
 */
export const WorldstateDtoSchema = z.object({
  realm: RealmSchema,
  fetchedAt: z.string().datetime(),
  cycles: z.array(OpenWorldCycleDtoSchema),
  fissures: z.array(FissureDtoSchema),
  invasions: z.array(InvasionDtoSchema),
  nightwave: NightwaveDtoSchema.nullable(),
  /** 每日突击；无数据时 `null` */
  sortie: SortieDtoSchema.nullable().default(null),
  /** 执行官狩猎；无数据时 `null` */
  archon: ArchonHuntDtoSchema.nullable().default(null),
  /** 回廊 / Circuit；无数据时 `null` */
  circuit: CircuitDtoSchema.nullable().default(null),
  /** 开放世界赏金（可空数组） */
  bounties: z.array(BountySyndicateDtoSchema).default([]),
  /** 仲裁（社区源）；失败或未接入时 `null` */
  arbitration: ArbitrationDtoSchema.nullable().default(null),
  /** 警报（独立模块；可空数组） */
  alerts: z.array(AlertDtoSchema).default([]),
  /** 精英 / 时光科研；无数据时 `null` */
  archimedea: ArchimedeaDtoSchema.nullable().default(null),
});

/**
 * Normalized worldstate DTO exposed on `GET /v1/worldstate`.
 */
export type WorldstateDto = z.infer<typeof WorldstateDtoSchema>;
