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
 * 上游赏金联盟任务（用于平原/扎里曼周期对齐）。
 */
export type UpstreamSyndicateMission = {
  Tag?: string;
  Activation?: { $date?: { $numberLong?: string } };
  Expiry?: { $date?: { $numberLong?: string } };
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
  /** 虚空商人 Baro */
  VoidTraders?: unknown[];
  /** 瓦奇娅（部分版本字段名） */
  VaultTrader?: unknown;
  PrimeVaultTraders?: unknown[];
};
