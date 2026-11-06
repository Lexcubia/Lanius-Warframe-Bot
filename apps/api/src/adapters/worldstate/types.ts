/**
 * Minimal upstream invasion shape used before mapping to Lanius DTO.
 * Extra fields from the official JSON are ignored on purpose.
 */
export type UpstreamInvasion = {
  _id?: { $oid?: string };
  Node?: string;
  AttackerMissionInfo?: { faction?: string };
  DefenderMissionInfo?: { faction?: string };
  AttackerReward?: { countedItems?: Array<{ ItemType?: string; ItemCount?: number }> };
  DefenderReward?: { countedItems?: Array<{ ItemType?: string; ItemCount?: number }> };
  Count?: number;
  Goal?: number;
  Completed?: boolean;
};

/**
 * Minimal upstream Nightwave / SeasonInfo shape.
 */
export type UpstreamSeasonInfo = {
  Season?: number;
  Phase?: number;
  ActiveChallenges?: Array<{
    Challenge?: string;
    /** 官方偶发布尔：true=每日；缺省时从 Challenge 路径推断 */
    Daily?: boolean;
    _id?: { $oid?: string };
    expiry?: { $date?: { $numberLong?: string } };
  }>;
};

/**
 * 上游赏金 Job（`SyndicateMissions[].Jobs`）。
 * `rewards` 为 MissionDeck 路径，须经奖励表解析成物品。
 */
export type UpstreamSyndicateJob = {
  jobType?: string;
  rewards?: string;
  masteryReq?: number;
  minEnemyLevel?: number;
  maxEnemyLevel?: number;
  xpAmounts?: number[];
  endless?: boolean;
  locationTag?: string;
  isVault?: boolean;
};

/**
 * 上游赏金联盟任务（用于平原/扎里曼周期对齐与赏金 Jobs）。
 */
export type UpstreamSyndicateMission = {
  Tag?: string;
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Seed?: number;
  Nodes?: string[];
  /** 有 Jobs 的联盟才出赏金表；空数组表示本轮无表 */
  Jobs?: UpstreamSyndicateJob[];
};

/**
 * 上游星图虚空裂隙（`ActiveMissions`）。
 */
export type UpstreamActiveMission = {
  _id?: { $oid?: string };
  Node?: string;
  MissionType?: string;
  Modifier?: string;
  Hard?: boolean;
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
};

/**
 * 上游九重天虚空风暴（`VoidStorms`，不含星图 ActiveMissions）。
 */
export type UpstreamVoidStorm = {
  _id?: { $oid?: string };
  Node?: string;
  ActiveMissionTier?: string;
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
};

/**
 * 上游每日突击单步（`Sorties[].Variants`）。
 */
export type UpstreamSortieVariant = {
  missionType?: string;
  modifierType?: string;
  node?: string;
  tileset?: string;
};

/**
 * 上游每日突击（`Sorties`）。
 */
export type UpstreamSortie = {
  _id?: { $oid?: string };
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Reward?: string;
  Seed?: number;
  Boss?: string;
  Variants?: UpstreamSortieVariant[];
};

/**
 * 上游执行官狩猎单步（`LiteSorties[].Missions`）。
 */
export type UpstreamLiteSortieMission = {
  missionType?: string;
  node?: string;
};

/**
 * 上游执行官狩猎 / Archon Hunt（`LiteSorties`）。
 */
export type UpstreamLiteSortie = {
  _id?: { $oid?: string };
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Reward?: string;
  Seed?: number;
  Boss?: string;
  Missions?: UpstreamLiteSortieMission[];
};

/**
 * 上游回廊档位选项（`EndlessXpSchedule[].CategoryChoices`）。
 * `EXC_NORMAL`＝战甲；`EXC_HARD`＝钢路 Incarnon 武器。
 */
export type UpstreamEndlessXpChoice = {
  Category?: string;
  Choices?: string[];
};

/**
 * 上游回廊 / Circuit 周轮换（`EndlessXpSchedule`）。
 */
export type UpstreamEndlessXpScheduleEntry = {
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  CategoryChoices?: UpstreamEndlessXpChoice[];
};

/**
 * 上游警报任务信息（`Alerts[].MissionInfo`）。
 */
export type UpstreamAlertMissionInfo = {
  missionType?: string;
  faction?: string;
  location?: string;
  minEnemyLevel?: number;
  maxEnemyLevel?: number;
  descText?: string;
  missionReward?: {
    credits?: number;
    countedItems?: Array<{ ItemType?: string; ItemCount?: number }>;
  };
};

/**
 * 上游警报（`Alerts`）。与科研 Conquests **无关**。
 */
export type UpstreamAlert = {
  _id?: { $oid?: string };
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  MissionInfo?: UpstreamAlertMissionInfo;
  Tag?: string;
  Icon?: string;
};

/**
 * 上游科研单档难度（`Conquests[].Missions[].difficulties`）。
 */
export type UpstreamConquestDifficulty = {
  type?: string;
  deviation?: string;
  risks?: string[];
};

/**
 * 上游科研任务链单步。
 */
export type UpstreamConquestMission = {
  faction?: string;
  missionType?: string;
  difficulties?: UpstreamConquestDifficulty[];
};

/**
 * 上游科研（`Conquests`）：`CT_LAB`＝精英；`CT_HEX`＝时光。
 * 与警报 Alerts **无关**，禁止合包。
 */
export type UpstreamConquest = {
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Type?: string;
  Missions?: UpstreamConquestMission[];
  Variables?: string[];
  RandomSeed?: number;
};

/**
 * 仲裁社区源薄形状（官方 worldState **无** Arbitrations 字段）。
 * 由 WFCD `warframestat.us` `GET /{platform}/arbitration` 归一；失败时服务层保持 DTO `null`。
 *
 * @see docs/DATA_SOURCES.md
 */
export type UpstreamArbitration = {
  /** SolNode 等节点键（优先用于标签解析） */
  nodeKey?: string;
  /** 社区源展示节点名（无 nodeKey 时回退） */
  node?: string;
  /** 任务类型键（`MT_*` 或英文 type） */
  typeKey?: string;
  /** 任务类型展示名 */
  type?: string;
  /** 敌对阵营展示名（如 Corpus / Grineer） */
  enemy?: string;
  activation?: string;
  expiry?: string;
  expired?: boolean;
};

/**
 * Root fields read from the official worldState JSON document.
 */
export type UpstreamWorldstate = {
  Time?: number;
  Invasions?: UpstreamInvasion[];
  EventInvasions?: UpstreamInvasion[];
  SeasonInfo?: UpstreamSeasonInfo;
  SyndicateMissions?: UpstreamSyndicateMission[];
  ActiveMissions?: UpstreamActiveMission[];
  VoidStorms?: UpstreamVoidStorm[];
  /** 每日突击 */
  Sorties?: UpstreamSortie[];
  /** 执行官狩猎 */
  LiteSorties?: UpstreamLiteSortie[];
  /** 回廊 / Circuit 周轮换 */
  EndlessXpSchedule?: UpstreamEndlessXpScheduleEntry[];
  /** 警报（独立模块） */
  Alerts?: UpstreamAlert[];
  /** 精英 / 时光科研（独立模块） */
  Conquests?: UpstreamConquest[];
  /** 虚空商人 Baro */
  VoidTraders?: unknown[];
  /** 瓦奇娅（部分版本字段名） */
  VaultTrader?: unknown;
  PrimeVaultTraders?: unknown[];
  /** 达沃每日特惠 */
  DailyDeals?: UpstreamDailyDeal[];
  /** 官方新闻 / 公告 */
  Events?: UpstreamNewsEvent[];
  /** 舰队建造进度（巴罗尔 / 利刃豺狼） */
  ProjectPct?: number[];
  /** 限时活动 Goals */
  Goals?: UpstreamGoal[];
  /** 武形秘仪挑战实例 */
  PVPChallengeInstances?: UpstreamPvpChallenge[];
  /** 氏族周奖励加成 */
  WeeklyVaultBonusRewards?: UpstreamClanVaultBonus[];
  /** 商城闪购 */
  FlashSales?: UpstreamFlashSale[];
  /** 1999 日历季 */
  KnownCalendarSeasons?: UpstreamCalendarSeason[];
  /** 沉沦之地（炼狱塔） */
  Descents?: UpstreamDescent[];
};

/**
 * 上游达沃特惠（`DailyDeals`）。
 */
export type UpstreamDailyDeal = {
  StoreItem?: string;
  OriginalPrice?: number;
  SalePrice?: number;
  Discount?: number;
  AmountTotal?: number;
  AmountSold?: number;
  Expiry?: { $date?: { $numberLong?: string } };
};

/**
 * 上游新闻 Messages 行。
 */
export type UpstreamNewsMessage = {
  LanguageCode?: string;
  Message?: string;
};

/**
 * 上游新闻 / 公告（`Events`）。
 */
export type UpstreamNewsEvent = {
  _id?: { $oid?: string };
  Messages?: UpstreamNewsMessage[];
  Prop?: string;
  Date?: { $date?: { $numberLong?: string } };
  Priority?: boolean;
  Community?: boolean;
};

/**
 * 上游限时活动 Goal。
 */
export type UpstreamGoal = {
  _id?: { $oid?: string };
  Desc?: string;
  ToolTip?: string;
  Tag?: string;
  Faction?: string;
  Node?: string;
  VictimNode?: string;
  HealthPct?: number;
  Count?: number;
  Goal?: number;
  Expiry?: { $date?: { $numberLong?: string } };
  GracePeriod?: { $date?: { $numberLong?: string } };
  Reward?: {
    items?: string[];
    countedItems?: Array<{ ItemType?: string; ItemCount?: number }>;
  };
};

/**
 * 上游武形秘仪挑战。
 */
export type UpstreamPvpChallenge = {
  _id?: { $oid?: string };
  challengeTypeRefID?: string;
  PVPMode?: string;
  Category?: string;
  params?: Array<{ n?: string; v?: string | number }>;
  endDate?: { $date?: { $numberLong?: string } };
};

/**
 * 上游氏族周奖励。
 */
export type UpstreamClanVaultBonus = {
  WeekCount?: number;
  BonusRegion?: string;
  Rewards?: Array<{
    PointThreshold?: number;
    Reward?: string;
    ItemCount?: number;
  }>;
};

/**
 * 上游商城闪购。
 */
export type UpstreamFlashSale = {
  TypeName?: string;
  ShowInMarket?: boolean;
  StartDate?: { $date?: { $numberLong?: string } };
  EndDate?: { $date?: { $numberLong?: string } };
};

/**
 * 上游 1999 日历日事件。
 */
export type UpstreamCalendarEvent = {
  type?: string;
  typeName?: string;
  reward?: string;
  UpgradeType?: string;
};

/**
 * 上游 1999 日历日。
 */
export type UpstreamCalendarDay = {
  day?: number;
  date?: string;
  events?: UpstreamCalendarEvent[];
};

/**
 * 上游 1999 日历季。
 */
export type UpstreamCalendarSeason = {
  Season?: string;
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Days?: UpstreamCalendarDay[];
};

/**
 * 上游沉沦之地单层。
 */
export type UpstreamDescentChallenge = {
  Index?: number;
  Type?: string;
  Challenge?: string;
};

/**
 * 上游沉沦之地周轮换。
 */
export type UpstreamDescent = {
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
  Challenges?: UpstreamDescentChallenge[];
};
