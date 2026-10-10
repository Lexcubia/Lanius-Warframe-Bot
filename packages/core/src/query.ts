import { z } from 'zod';

import { DEFAULT_LOCALE, LocaleSchema } from './locale.js';
import { DEFAULT_REALM, RealmSchema } from './realm.js';

/**
 * Shared query parameters for public Lanius `/v1` GET endpoints.
 * Missing values coerce to MVP defaults (`international` / `zh`).
 */
export const PublicQuerySchema = z.object({
  realm: RealmSchema.default(DEFAULT_REALM),
  locale: LocaleSchema.default(DEFAULT_LOCALE),
});

/**
 * Parsed public query (`realm` + `locale`) after Zod defaults.
 */
export type PublicQuery = z.infer<typeof PublicQuerySchema>;

/**
 * Parses and validates public query parameters from a raw record.
 *
 * @param raw - Raw query object (e.g. Hono `c.req.query()`).
 * @returns Parsed public query with defaults applied.
 * @throws ZodError when `realm` or `locale` are present but invalid.
 */
export function parsePublicQuery(raw: Record<string, string | undefined>): PublicQuery {
  return PublicQuerySchema.parse(raw);
}
