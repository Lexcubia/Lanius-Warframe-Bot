/**
 * `@lanius/api` — injectable fetch client for Lanius `/v1` APIs.
 */

export {
  LaniusApiClient,
  LaniusApiClientError,
  createLaniusApiClient,
  type LaniusApiClientOptions,
  type MarketOrdersClientQuery,
  type PublicQueryInput,
  type RivenOrdersClientQuery,
} from './client.js';
