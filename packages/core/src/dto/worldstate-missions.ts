import { z } from 'zod';

import { CatalogItemDtoSchema } from './item.js';

/**
 * 双语名（与 worldstate `LocalizedName` 同形，避免 dto 循环依赖）。
 */
const MissionLocalizedNameSchema = z.object({
  zh: z.string(),
  en: z.string(),
});

/**
 * 突击 / 执行官任务链中的单步（节点 + 任务类型 + 可选修正）。
 * Wave 0 仅占位；Wave 1 由 Sorties / LiteSorties mapper 填满。
 */
export const SortieMissionDtoSchema = z.object({
  /** 上游 `missionType` 键，如 `MT_EXTERMINATION` */
  missionTypeKey: z.string().min(1).optional(),
  missionType: MissionLocalizedNameSchema.optional(),
  /** 上游 `modifierType`（突击有；执行官通常无） */
  modifierKey: z.string().min(1).optional(),
  modifier: MissionLocalizedNameSchema.optional(),
  /** 上游节点键，如 `SolNode412` */
  nodeKey: z.string().min(1).optional(),
  node: MissionLocalizedNameSchema.optional(),
});

/**
 * 突击 / 执行官任务链单步。
 */
export type SortieMissionDto = z.infer<typeof SortieMissionDtoSchema>;

/**
 * 每日突击切片（上游 `Sorties`）。
 * 无活跃数据时 worldstate 字段为 `null`。
 */
export const SortieDtoSchema = z.object({
  id: z.string().min(1),
  /** 上游 Boss 键，如 `SORTIE_BOSS_CORRUPTED_VOR` */
  bossKey: z.string().min(1).optional(),
  boss: MissionLocalizedNameSchema.optional(),
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  missions: z.array(SortieMissionDtoSchema),
});

/**
 * 每日突击。
 */
export type SortieDto = z.infer<typeof SortieDtoSchema>;

/**
 * 执行官狩猎切片（上游 `LiteSorties` / Archon Hunt）。
 * 形状与突击相近，独立字段以便 Wave 1 并行改 mapper。
 */
export const ArchonHuntDtoSchema = z.object({
  id: z.string().min(1),
  bossKey: z.string().min(1).optional(),
  boss: MissionLocalizedNameSchema.optional(),
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  missions: z.array(SortieMissionDtoSchema),
});

/**
 * 执行官狩猎。
 */
export type ArchonHuntDto = z.infer<typeof ArchonHuntDtoSchema>;

/**
 * 回廊（The Circuit）单档可选项（战甲名或 Incarnon 武器名）。
 */
export const CircuitChoiceDtoSchema = z.object({
  /** 上游 Choices 原始字符串（如 `Hydroid` / `Dera`） */
  key: z.string().min(1),
  name: MissionLocalizedNameSchema.optional(),
});

/**
 * 回廊可选项。
 */
export type CircuitChoiceDto = z.infer<typeof CircuitChoiceDtoSchema>;

/**
 * 回廊 / Circuit 周轮换（上游 `EndlessXpSchedule`）。
 * `EXC_NORMAL` → 战甲；`EXC_HARD` → 钢路 Incarnon 武器。
 */
export const CircuitDtoSchema = z.object({
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  /** 普通回廊本周三台可选战甲 */
  normalChoices: z.array(CircuitChoiceDtoSchema),
  /** 钢路回廊本周可选 Incarnon 武器适配器 */
  hardChoices: z.array(CircuitChoiceDtoSchema),
});

/**
 * 回廊周轮换。
 */
export type CircuitDto = z.infer<typeof CircuitDtoSchema>;

/**
 * 赏金单条 Job（联盟 `SyndicateMissions.Jobs`）。
 * `rewardTablePath` 为 MissionDeck 路径；`rewards` 为解析后的物品（Wave 0 可为空数组）。
 */
export const BountyJobDtoSchema = z.object({
  jobType: z.string().min(1).optional(),
  title: MissionLocalizedNameSchema.optional(),
  masteryReq: z.number().int().nonnegative().optional(),
  minEnemyLevel: z.number().int().nonnegative().optional(),
  maxEnemyLevel: z.number().int().nonnegative().optional(),
  endless: z.boolean().optional(),
  /** 上游 `rewards` MissionDeck 路径 */
  rewardTablePath: z.string().min(1).optional(),
  /** 经 MissionDeck 解析后的物品列表（与入侵同一 CatalogItemDto 习惯） */
  rewards: z.array(CatalogItemDtoSchema),
});

/**
 * 赏金 Job。
 */
export type BountyJobDto = z.infer<typeof BountyJobDtoSchema>;

/**
 * 单联盟赏金块（平原 / 金星 / 火卫二等）。
 * `Jobs` 为空时仍可带刷新时间，由 Wave 1 展示空态。
 */
export const BountySyndicateDtoSchema = z.object({
  /** 上游 Tag，如 `CetusSyndicate` */
  tag: z.string().min(1),
  name: MissionLocalizedNameSchema.optional(),
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  jobs: z.array(BountyJobDtoSchema),
});

/**
 * 联盟赏金块。
 */
export type BountySyndicateDto = z.infer<typeof BountySyndicateDtoSchema>;

/**
 * 仲裁切片（官方 worldState **无**独立字段；经 Lanius 封装的社区源）。
 * Wave 0 仅占位；社区源失败时保持 `null`，不拖垮 `/v1/worldstate`。
 */
export const ArbitrationDtoSchema = z.object({
  nodeKey: z.string().min(1).optional(),
  node: MissionLocalizedNameSchema.optional(),
  missionTypeKey: z.string().min(1).optional(),
  missionType: MissionLocalizedNameSchema.optional(),
  enemyKey: z.string().min(1).optional(),
  enemy: MissionLocalizedNameSchema.optional(),
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  /** 数据来源标记（如 `warframestat`） */
  source: z.string().min(1).optional(),
});

/**
 * 仲裁。
 */
export type ArbitrationDto = z.infer<typeof ArbitrationDtoSchema>;

/**
 * 警报单条（上游 `Alerts`）。
 * **独立**于科研；禁止与 archimedea 共用业务类型或入口。
 */
export const AlertDtoSchema = z.object({
  id: z.string().min(1),
  tag: z.string().min(1).optional(),
  nodeKey: z.string().min(1).optional(),
  node: MissionLocalizedNameSchema.optional(),
  missionTypeKey: z.string().min(1).optional(),
  missionType: MissionLocalizedNameSchema.optional(),
  factionKey: z.string().min(1).optional(),
  faction: MissionLocalizedNameSchema.optional(),
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  credits: z.number().int().nonnegative().optional(),
  rewards: z.array(CatalogItemDtoSchema),
});

/**
 * 警报。
 */
export type AlertDto = z.infer<typeof AlertDtoSchema>;

/**
 * 科研子类：`lab`＝精英科研（Deep / `CT_LAB`）；`hex`＝时光科研（Temporal / `CT_HEX`）。
 */
export const ArchimedeaKindSchema = z.enum(['lab', 'hex']);

/**
 * 科研子类。
 */
export type ArchimedeaKind = z.infer<typeof ArchimedeaKindSchema>;

/**
 * 科研单档难度（偏差 + 风险变量）。
 */
export const ArchimedeaDifficultyDtoSchema = z.object({
  /** `CD_NORMAL` / `CD_HARD` */
  typeKey: z.string().min(1),
  deviationKey: z.string().min(1).optional(),
  deviation: MissionLocalizedNameSchema.optional(),
  riskKeys: z.array(z.string()),
  risks: z.array(MissionLocalizedNameSchema).optional(),
});

/**
 * 科研难度档。
 */
export type ArchimedeaDifficultyDto = z.infer<typeof ArchimedeaDifficultyDtoSchema>;

/**
 * 科研任务链单步。
 */
export const ArchimedeaMissionDtoSchema = z.object({
  factionKey: z.string().min(1).optional(),
  faction: MissionLocalizedNameSchema.optional(),
  missionTypeKey: z.string().min(1).optional(),
  missionType: MissionLocalizedNameSchema.optional(),
  difficulties: z.array(ArchimedeaDifficultyDtoSchema),
});

/**
 * 科研任务链单步。
 */
export type ArchimedeaMissionDto = z.infer<typeof ArchimedeaMissionDtoSchema>;

/**
 * 单季科研（精英或时光）。
 * **独立**于警报；禁止与 alerts 共用 formatter / 卡片。
 */
export const ArchimedeaSeasonDtoSchema = z.object({
  kind: ArchimedeaKindSchema,
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  missions: z.array(ArchimedeaMissionDtoSchema),
  /** 个人修正变量键（上游 `Variables`） */
  variableKeys: z.array(z.string()),
  variables: z.array(MissionLocalizedNameSchema).optional(),
});

/**
 * 单季科研。
 */
export type ArchimedeaSeasonDto = z.infer<typeof ArchimedeaSeasonDtoSchema>;

/**
 * 科研模块聚合（精英 + 时光并列；可同时为空）。
 */
export const ArchimedeaDtoSchema = z.object({
  seasons: z.array(ArchimedeaSeasonDtoSchema),
});

/**
 * 科研模块。
 */
export type ArchimedeaDto = z.infer<typeof ArchimedeaDtoSchema>;

/**
 * Wave 0 任务模块在 worldstate 上的空安全默认值。
 * mapper / 测试夹具可展开，避免漏字段导致 Zod 失败。
 */
export const EMPTY_WORLDSTATE_MISSION_SLICES: {
  sortie: null;
  archon: null;
  circuit: null;
  bounties: [];
  arbitration: null;
  alerts: [];
  archimedea: null;
} = {
  sortie: null,
  archon: null,
  circuit: null,
  bounties: [],
  arbitration: null,
  alerts: [],
  archimedea: null,
};
