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
 * 仲裁社区源薄占位（官方 worldState **无** Arbitrations 字段）。
 * Wave 0 仅类型；完整拉取 / mapper 见 Wave 1（`warframestat.us`）。
 *
 * @see docs/DATA_SOURCES.md
 */
export type UpstreamArbitration = {
  node?: string;
  type?: string;
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
};
