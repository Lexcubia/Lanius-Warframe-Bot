import type { UpstreamWorldstate } from './types.js';

/**
 * Default official international worldState endpoint.
 * Config may override via `api.upstream.worldstateUrl`.
 */
export const DEFAULT_WORLDSTATE_URL =
  'https://content.warframe.com/dynamic/worldState.php';

/**
 * Options for fetching international worldstate from Digital Extremes.
 */
export type FetchInternationalWorldstateOptions = {
  url: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

/**
 * Fetches and parses the official international worldState JSON.
 *
 * @param options - URL, timeout, and optional injectable `fetch`.
 * @returns Parsed upstream document (not yet mapped to Lanius DTO).
 * @throws Error when the HTTP request fails, times out, or returns non-JSON.
 */
export async function fetchInternationalWorldstate(
  options: FetchInternationalWorldstateOptions,
): Promise<UpstreamWorldstate> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetchImpl(options.url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Lanius-Warframe-Bot/0.0.0 (+https://github.com/Lexcubia/Lanius-Warframe-Bot)',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Upstream worldstate HTTP ${response.status}`);
    }

    const body: unknown = await response.json();
    if (body === null || typeof body !== 'object') {
      throw new Error('Upstream worldstate response is not a JSON object');
    }

    return body as UpstreamWorldstate;
  } finally {
    clearTimeout(timer);
  }
}
