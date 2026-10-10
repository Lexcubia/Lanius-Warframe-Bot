import { z } from 'zod';

/**
 * User-facing locale codes supported by Lanius APIs and clients.
 */
export const LocaleSchema = z.enum(['zh', 'en']);

/**
 * Parsed locale identifier for localized messages and display names.
 */
export type Locale = z.infer<typeof LocaleSchema>;

/**
 * Default locale when the client omits `locale`.
 */
export const DEFAULT_LOCALE: Locale = 'zh';

/**
 * Locales advertised by `GET /v1/meta`.
 */
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh', 'en'] as const;
