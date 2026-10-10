import { z } from 'zod';

import { LocaleSchema } from '../locale.js';
import { RealmSchema } from '../realm.js';

/**
 * Reply modes supported by the QQ bot surface (advertised via meta).
 */
export const ReplyModeSchema = z.enum(['text', 'image']);

/**
 * QQ reply mode identifier.
 */
export type ReplyMode = z.infer<typeof ReplyModeSchema>;

/**
 * Service capability metadata returned by `GET /v1/meta`.
 */
export const MetaDtoSchema = z.object({
  realms: z.array(RealmSchema).min(1),
  locales: z.array(LocaleSchema).min(1),
  mvpRealm: RealmSchema,
  replyModes: z.array(ReplyModeSchema).min(1),
  version: z.string().min(1),
});

/**
 * Normalized meta DTO describing supported realms, locales, and features.
 */
export type MetaDto = z.infer<typeof MetaDtoSchema>;
