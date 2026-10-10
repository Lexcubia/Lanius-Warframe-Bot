import type { InvasionDto, NightwaveDto, Realm, WorldstateDto } from '@lanius/core';

import type {
  UpstreamInvasion,
  UpstreamSeasonInfo,
  UpstreamWorldstate,
} from './types.js';

/**
 * Source tag recorded in response `meta.source` for official worldstate.
 */
export const WORLDSTATE_SOURCE = 'warframe-worldstate';

/**
 * Maps official worldState JSON into a Lanius `WorldstateDto`.
 * Upstream field names never leave this function's return shape.
 *
 * @param realm - Realm this snapshot belongs to (must be available).
 * @param raw - Parsed upstream JSON object.
 * @param fetchedAt - ISO8601 timestamp when the snapshot was obtained.
 * @returns Normalized worldstate DTO for `/v1/worldstate`.
 */
export function mapWorldstate(
  realm: Realm,
  raw: UpstreamWorldstate,
  fetchedAt: string,
): WorldstateDto {
  const invasions = [...(raw.Invasions ?? []), ...(raw.EventInvasions ?? [])]
    .map(mapInvasion)
    .filter((row): row is InvasionDto => row !== null);

  return {
    realm,
    fetchedAt,
    invasions,
    nightwave: mapNightwave(raw.SeasonInfo),
  };
}

/**
 * Maps a single upstream invasion into a Lanius invasion DTO.
 *
 * @param raw - Upstream invasion object.
 * @returns Normalized invasion, or `null` when required fields are missing.
 */
function mapInvasion(raw: UpstreamInvasion): InvasionDto | null {
  const id = raw._id?.$oid;
  const node = raw.Node;
  if (!id || !node) {
    return null;
  }

  const attackingFaction = raw.AttackerMissionInfo?.faction ?? 'Unknown';
  const defendingFaction = raw.DefenderMissionInfo?.faction ?? 'Unknown';
  const completionPct = computeCompletionPct(raw.Count, raw.Goal);

  return {
    id,
    node,
    attackingFaction,
    defendingFaction,
    attackerReward: firstRewardLabel(raw.AttackerReward),
    defenderReward: firstRewardLabel(raw.DefenderReward),
    completionPct,
    expired: Boolean(raw.Completed),
  };
}

/**
 * Maps upstream SeasonInfo into a Nightwave DTO, or `null` when absent.
 *
 * @param raw - Upstream season info, if present.
 * @returns Normalized nightwave slice, or `null`.
 */
function mapNightwave(raw: UpstreamSeasonInfo | undefined): NightwaveDto | null {
  if (!raw) {
    return null;
  }

  const activeChallenges = (raw.ActiveChallenges ?? []).map((challenge, index) => {
    const id = challenge._id?.$oid ?? challenge.Challenge ?? `challenge-${index}`;
    const expiryMs = Number(challenge.expiry?.$date?.$numberLong);
    return {
      id,
      title: challenge.Challenge
        ? { zh: challenge.Challenge, en: challenge.Challenge }
        : undefined,
      expiry: Number.isFinite(expiryMs)
        ? new Date(expiryMs).toISOString()
        : undefined,
    };
  });

  return {
    season: raw.Season,
    phase: raw.Phase,
    activeChallenges,
  };
}

/**
 * Computes invasion completion percentage from count/goal when available.
 *
 * @param count - Upstream progress count (may be negative depending on side).
 * @param goal - Upstream goal magnitude.
 * @returns Percentage in `[0, 100]`, or `undefined` when inputs are unusable.
 */
function computeCompletionPct(
  count: number | undefined,
  goal: number | undefined,
): number | undefined {
  if (count === undefined || goal === undefined || goal === 0) {
    return undefined;
  }
  const pct = (Math.abs(count) / Math.abs(goal)) * 100;
  if (!Number.isFinite(pct)) {
    return undefined;
  }
  return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
}

/**
 * Extracts a short reward label from the first counted item, if any.
 *
 * @param reward - Upstream attacker/defender reward object.
 * @returns Item type string, or `undefined` when empty.
 */
function firstRewardLabel(
  reward:
    | { countedItems?: Array<{ ItemType?: string; ItemCount?: number }> }
    | undefined,
): string | undefined {
  const itemType = reward?.countedItems?.[0]?.ItemType;
  return itemType && itemType.length > 0 ? itemType : undefined;
}
