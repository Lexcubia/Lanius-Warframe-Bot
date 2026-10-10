import { z } from 'zod';

import { RealmSchema } from '../realm.js';

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
 * 节点 / 阵营 / 奖励均为可读显示名，不再透传官方内部键。
 */
export const InvasionDtoSchema = z.object({
  id: z.string().min(1),
  node: LocalizedNameSchema,
  attackingFaction: LocalizedNameSchema,
  defendingFaction: LocalizedNameSchema,
  attackerReward: LocalizedNameSchema.optional(),
  defenderReward: LocalizedNameSchema.optional(),
  completionPct: z.number().min(0).max(100).optional(),
  expired: z.boolean(),
});

/**
 * Normalized invasion row (node, factions, optional rewards/progress).
 */
export type InvasionDto = z.infer<typeof InvasionDtoSchema>;

/**
 * Nightwave / seasonal challenge summary for MVP worldstate.
 */
export const NightwaveDtoSchema = z.object({
  season: z.number().int().nonnegative().optional(),
  phase: z.number().int().nonnegative().optional(),
  activeChallenges: z.array(
    z.object({
      id: z.string().min(1),
      title: LocalizedNameSchema.optional(),
      description: LocalizedNameSchema.optional(),
      reputation: z.number().int().optional(),
      expiry: z.string().datetime().optional(),
    }),
  ),
});

/**
 * Normalized Nightwave slice embedded in worldstate.
 */
export type NightwaveDto = z.infer<typeof NightwaveDtoSchema>;

/**
 * Worldstate snapshot for one realm (MVP: invasions + nightwave).
 * Clients must not depend on upstream field names.
 */
export const WorldstateDtoSchema = z.object({
  realm: RealmSchema,
  fetchedAt: z.string().datetime(),
  invasions: z.array(InvasionDtoSchema),
  nightwave: NightwaveDtoSchema.nullable(),
});

/**
 * Normalized worldstate DTO exposed on `GET /v1/worldstate`.
 */
export type WorldstateDto = z.infer<typeof WorldstateDtoSchema>;
