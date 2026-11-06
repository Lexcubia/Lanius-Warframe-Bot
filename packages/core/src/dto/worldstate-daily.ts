import { z } from 'zod';

import { CatalogItemDtoSchema } from './item.js';

/**
 * 双语名（与 worldstate `LocalizedName` 同形，避免 dto 循环依赖）。
 */
const DailyLocalizedNameSchema = z.object({
  zh: z.string(),
  en: z.string(),
});

/**
 * 达沃每日特惠单条。
 */
export const DailyDealDtoSchema = z.object({
  /** 商品 uniqueName（StoreItems 路径） */
  uniqueName: z.string().min(1),
  item: CatalogItemDtoSchema,
  originalPrice: z.number().int().nonnegative().optional(),
  salePrice: z.number().int().nonnegative().optional(),
  /** 折扣百分比（上游 Discount） */
  discountPct: z.number().int().nonnegative().optional(),
  amountTotal: z.number().int().nonnegative().optional(),
  amountSold: z.number().int().nonnegative().optional(),
  expiry: z.string().datetime().optional(),
});

/**
 * 达沃每日特惠。
 */
export type DailyDealDto = z.infer<typeof DailyDealDtoSchema>;

/**
 * 官方新闻 / 公告单条（上游 `Events`）。
 */
export const NewsItemDtoSchema = z.object({
  id: z.string().min(1),
  message: DailyLocalizedNameSchema,
  link: z.string().optional(),
  date: z.string().datetime().optional(),
  priority: z.boolean().optional(),
  community: z.boolean().optional(),
});

/**
 * 新闻条目。
 */
export type NewsItemDto = z.infer<typeof NewsItemDtoSchema>;

/**
 * 赤毒 / 血紊虹吸（社区源停摆时为空列表 + 说明）。
 */
export const KuvaDtoSchema = z.object({
  missions: z.array(
    z.object({
      node: DailyLocalizedNameSchema.optional(),
      missionType: DailyLocalizedNameSchema.optional(),
      enemy: DailyLocalizedNameSchema.optional(),
      expiry: z.string().datetime().optional(),
    }),
  ),
  /** 源状态说明（如停摆提示） */
  sourceNote: DailyLocalizedNameSchema.optional(),
});

/**
 * 赤毒切片。
 */
export type KuvaDto = z.infer<typeof KuvaDtoSchema>;

/**
 * 结合目标（Simaris；DE 不下发，静态表）。
 */
export const SynthTargetDtoSchema = z.object({
  name: DailyLocalizedNameSchema,
  planet: DailyLocalizedNameSchema.optional(),
  node: DailyLocalizedNameSchema.optional(),
  missionType: DailyLocalizedNameSchema.optional(),
  faction: DailyLocalizedNameSchema.optional(),
  spawn: z.string().optional(),
});

/**
 * 结合目标。
 */
export type SynthTargetDto = z.infer<typeof SynthTargetDtoSchema>;

/**
 * 舰队建造进度单项目。
 */
export const ConstructionProjectDtoSchema = z.object({
  name: DailyLocalizedNameSchema,
  faction: DailyLocalizedNameSchema.optional(),
  event: DailyLocalizedNameSchema.optional(),
  pct: z.number().min(0).max(100),
});

/**
 * 进行中的中继站袭击。
 */
export const ConstructionAssaultDtoSchema = z.object({
  name: DailyLocalizedNameSchema,
  victimNode: DailyLocalizedNameSchema.optional(),
  healthPct: z.number().min(0).max(100).optional(),
  expiry: z.string().datetime().optional(),
});

/**
 * 舰队建造进度。
 */
export const ConstructionDtoSchema = z.object({
  projects: z.array(ConstructionProjectDtoSchema),
  assaults: z.array(ConstructionAssaultDtoSchema),
});

/**
 * 舰队建造。
 */
export type ConstructionDto = z.infer<typeof ConstructionDtoSchema>;
export type ConstructionProjectDto = z.infer<typeof ConstructionProjectDtoSchema>;
export type ConstructionAssaultDto = z.infer<typeof ConstructionAssaultDtoSchema>;

/**
 * 九重天虚空风暴（Railjack；上游 `VoidStorms`）。
 */
export const VoidStormDtoSchema = z.object({
  id: z.string().min(1),
  nodeKey: z.string().min(1).optional(),
  node: DailyLocalizedNameSchema.optional(),
  missionType: DailyLocalizedNameSchema.optional(),
  tier: z.string().min(1).optional(),
  expiry: z.string().datetime().optional(),
  remainingMs: z.number().int().nonnegative().optional(),
});

/**
 * 虚空风暴。
 */
export type VoidStormDto = z.infer<typeof VoidStormDtoSchema>;

/**
 * 限时活动（上游 `Goals`）。
 */
export const EventDtoSchema = z.object({
  id: z.string().min(1),
  name: DailyLocalizedNameSchema,
  tag: z.string().optional(),
  desc: DailyLocalizedNameSchema.optional(),
  faction: DailyLocalizedNameSchema.optional(),
  node: DailyLocalizedNameSchema.optional(),
  count: z.number().optional(),
  goal: z.number().optional(),
  expiry: z.string().datetime().optional(),
  grace: z.string().datetime().optional(),
  ended: z.boolean().optional(),
  rewards: z.array(CatalogItemDtoSchema).default([]),
});

/**
 * 限时活动。
 */
export type EventDto = z.infer<typeof EventDtoSchema>;

/**
 * 武形秘仪挑战。
 */
export const ConclaveChallengeDtoSchema = z.object({
  id: z.string().min(1),
  mode: DailyLocalizedNameSchema.optional(),
  text: DailyLocalizedNameSchema,
  category: z.enum(['daily', 'weekly', 'other']),
  categoryLabel: DailyLocalizedNameSchema,
  value: z.union([z.string(), z.number()]).optional(),
  expiry: z.string().datetime().optional(),
});

/**
 * 武形秘仪挑战。
 */
export type ConclaveChallengeDto = z.infer<typeof ConclaveChallengeDtoSchema>;

/**
 * 氏族周奖励档。
 */
export const ClanRewardTierDtoSchema = z.object({
  points: z.number().int().nonnegative().optional(),
  item: CatalogItemDtoSchema,
});

/**
 * 氏族区域周奖励。
 */
export const ClanRewardDtoSchema = z.object({
  week: z.number().int().optional(),
  region: DailyLocalizedNameSchema,
  rewards: z.array(ClanRewardTierDtoSchema),
});

/**
 * 氏族奖励。
 */
export type ClanRewardDto = z.infer<typeof ClanRewardDtoSchema>;
export type ClanRewardTierDto = z.infer<typeof ClanRewardTierDtoSchema>;

/**
 * 商城闪购 / 礼包。
 */
export const FlashSaleDtoSchema = z.object({
  uniqueName: z.string().min(1),
  item: CatalogItemDtoSchema,
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  remainingMs: z.number().int().nonnegative().optional(),
});

/**
 * 商城闪购。
 */
export type FlashSaleDto = z.infer<typeof FlashSaleDtoSchema>;

/**
 * 1999 日历单日事件。
 */
export const CalendarDayEventDtoSchema = z.object({
  type: z.string().optional(),
  ref: z.string().optional(),
  name: DailyLocalizedNameSchema.optional(),
});

/**
 * 1999 日历单日。
 */
export const CalendarDayDtoSchema = z.object({
  day: z.number().int().optional(),
  date: z.string().optional(),
  events: z.array(CalendarDayEventDtoSchema),
});

/**
 * 1999 日历季。
 */
export const Calendar1999DtoSchema = z.object({
  season: z.string().optional(),
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  days: z.array(CalendarDayDtoSchema),
  sourceNote: DailyLocalizedNameSchema.optional(),
});

/**
 * 1999 日历。
 */
export type Calendar1999Dto = z.infer<typeof Calendar1999DtoSchema>;
export type CalendarDayDto = z.infer<typeof CalendarDayDtoSchema>;
export type CalendarDayEventDto = z.infer<typeof CalendarDayEventDtoSchema>;

/**
 * 沉沦之地单层。
 */
export const DescendiaFloorDtoSchema = z.object({
  index: z.number().int().nonnegative().optional(),
  typeKey: z.string().optional(),
  type: DailyLocalizedNameSchema.optional(),
  challengeKey: z.string().optional(),
  challenge: DailyLocalizedNameSchema.optional(),
});

/**
 * 沉沦之地（炼狱塔）本周。
 */
export const DescendiaDtoSchema = z.object({
  activation: z.string().datetime().optional(),
  expiry: z.string().datetime().optional(),
  floors: z.array(DescendiaFloorDtoSchema),
});

/**
 * 沉沦之地。
 */
export type DescendiaDto = z.infer<typeof DescendiaDtoSchema>;
export type DescendiaFloorDto = z.infer<typeof DescendiaFloorDtoSchema>;

/**
 * 时效总览单行。
 */
export const TimerRowDtoSchema = z.object({
  id: z.string().min(1),
  label: DailyLocalizedNameSchema,
  expiry: z.string().datetime().optional(),
  remainingMs: z.number().int().nonnegative().optional(),
  note: DailyLocalizedNameSchema.optional(),
});

/**
 * 时效总览。
 */
export const TimersDtoSchema = z.object({
  fetchedAt: z.string().datetime(),
  rows: z.array(TimerRowDtoSchema),
});

/**
 * 时效总览。
 */
export type TimersDto = z.infer<typeof TimersDtoSchema>;
export type TimerRowDto = z.infer<typeof TimerRowDtoSchema>;

/**
 * 仲裁表单行（约 14 日排期）。
 */
export const ArbTableRowDtoSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime().optional(),
  nodeKey: z.string().min(1),
  node: DailyLocalizedNameSchema,
  system: DailyLocalizedNameSchema.optional(),
  missionType: DailyLocalizedNameSchema.optional(),
  faction: DailyLocalizedNameSchema.optional(),
  /** 站点评级 S/A+/A/… */
  tier: z.string().optional(),
  /** 评级来源：arbi tierlist / measured / 空 */
  tierSource: z.enum(['arbi', 'measured', '']).optional(),
  measuredMedian: z.number().optional(),
});

/**
 * 仲裁表。
 */
export const ArbTableDtoSchema = z.object({
  fetchedAt: z.string().datetime(),
  rows: z.array(ArbTableRowDtoSchema),
  sourceNote: DailyLocalizedNameSchema.optional(),
});

/**
 * 仲裁表。
 */
export type ArbTableDto = z.infer<typeof ArbTableDtoSchema>;
export type ArbTableRowDto = z.infer<typeof ArbTableRowDtoSchema>;

/**
 * 商店货架条目（钢精 / 碎银）。
 */
export const ShopOfferDtoSchema = z.object({
  name: DailyLocalizedNameSchema,
  cost: z.number().int().nonnegative().optional(),
  costLabel: DailyLocalizedNameSchema.optional(),
  weekly: z.boolean().optional(),
  uniqueName: z.string().optional(),
  item: CatalogItemDtoSchema.optional(),
});

/**
 * 钢铁精华 / 碎银商店。
 */
export const EssenceShopDtoSchema = z.object({
  kind: z.enum(['steelPath', 'sliverShop']),
  fetchedAt: z.string().datetime(),
  nextReset: z.string().datetime().optional(),
  evergreen: z.array(ShopOfferDtoSchema),
  weekly: z.array(ShopOfferDtoSchema),
  sourceNote: DailyLocalizedNameSchema.optional(),
});

/**
 * 精华商店。
 */
export type EssenceShopDto = z.infer<typeof EssenceShopDtoSchema>;
export type ShopOfferDto = z.infer<typeof ShopOfferDtoSchema>;

/**
 * 钢铁之路侵袭。
 */
export const IncursionsDtoSchema = z.object({
  fetchedAt: z.string().datetime(),
  expiry: z.string().datetime().optional(),
  nodes: z.array(
    z.object({
      nodeKey: z.string().min(1),
      node: DailyLocalizedNameSchema,
    }),
  ),
  sourceNote: DailyLocalizedNameSchema.optional(),
});

/**
 * 钢路侵袭。
 */
export type IncursionsDto = z.infer<typeof IncursionsDtoSchema>;

/**
 * 本周灵化武器。
 */
export const IncarnonWeaponDtoSchema = z.object({
  name: DailyLocalizedNameSchema,
  variant: z.string().optional(),
});

/**
 * 钢铁回廊灵化周轮换。
 */
export const IncarnonRotationDtoSchema = z.object({
  fetchedAt: z.string().datetime(),
  weekIndex: z.number().int().positive(),
  weekTotal: z.number().int().positive(),
  expiry: z.string().datetime().optional(),
  current: z.array(IncarnonWeaponDtoSchema),
  next: z.array(IncarnonWeaponDtoSchema),
  sourceNote: DailyLocalizedNameSchema.optional(),
});

/**
 * 灵化轮换。
 */
export type IncarnonRotationDto = z.infer<typeof IncarnonRotationDtoSchema>;
export type IncarnonWeaponDto = z.infer<typeof IncarnonWeaponDtoSchema>;

/**
 * 言录使商品。
 */
export const AcrithisOfferDtoSchema = z.object({
  name: DailyLocalizedNameSchema,
  price: z.number().int().nonnegative().optional(),
  currency: DailyLocalizedNameSchema.optional(),
});

/**
 * 言录使本周货架。
 */
export const AcrithisDtoSchema = z.object({
  fetchedAt: z.string().datetime(),
  nextReset: z.string().datetime().optional(),
  offers: z.array(AcrithisOfferDtoSchema),
  /** 无当期快照时为候选池 */
  stalePool: z.boolean().optional(),
  sourceNote: DailyLocalizedNameSchema.optional(),
});

/**
 * 言录使。
 */
export type AcrithisDto = z.infer<typeof AcrithisDtoSchema>;
export type AcrithisOfferDto = z.infer<typeof AcrithisOfferDtoSchema>;

/**
 * Wave 1 挂在 `/v1/worldstate` 上的空安全默认切片。
 */
export const EMPTY_WORLDSTATE_DAILY_SLICES: {
  dailyDeals: [];
  news: [];
  kuva: null;
  synthTargets: [];
  construction: null;
  voidStorms: [];
  events: [];
  conclave: [];
  clanRewards: [];
  flashSales: [];
  calendar1999: null;
  descendia: null;
} = {
  dailyDeals: [],
  news: [],
  kuva: null,
  synthTargets: [],
  construction: null,
  voidStorms: [],
  events: [],
  conclave: [],
  clanRewards: [],
  flashSales: [],
  calendar1999: null,
  descendia: null,
};
