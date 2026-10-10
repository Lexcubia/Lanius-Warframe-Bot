import { z } from 'zod';

/**
 * Supported game realms (platforms / regional deployments).
 * MVP serves data only for `international`; `china` is reserved.
 */
export const RealmSchema = z.enum(['international', 'china']);

/**
 * Parsed realm identifier used across API query params and DTOs.
 */
export type Realm = z.infer<typeof RealmSchema>;

/**
 * Default realm for MVP public queries when the client omits `realm`.
 */
export const DEFAULT_REALM: Realm = 'international';

/**
 * Realms that expose live data in the current MVP.
 */
export const MVP_REALMS: readonly Realm[] = ['international'] as const;

/**
 * Returns whether the given realm has live upstream wiring in MVP.
 *
 * @param realm - Realm selected by the client or defaults.
 * @returns `true` when adapters may fetch data for this realm.
 */
export function isRealmAvailable(realm: Realm): boolean {
  return realm === 'international';
}
