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
    _id?: { $oid?: string };
    expiry?: { $date?: { $numberLong?: string } };
  }>;
};

/**
 * Root fields read from the official worldState JSON document.
 */
export type UpstreamWorldstate = {
  Time?: number;
  Invasions?: UpstreamInvasion[];
  EventInvasions?: UpstreamInvasion[];
  SeasonInfo?: UpstreamSeasonInfo;
};
