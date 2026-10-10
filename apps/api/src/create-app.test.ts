import type { WorldstateDto } from '@lanius/core';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from './create-app.js';
import type { AppConfig } from './config/schema.js';
import { createLogger } from './lib/logger.js';
import { TtlCache } from './lib/ttl-cache.js';
import { WorldstateService } from './services/worldstate-service.js';

/**
 * Builds a minimal AppConfig for route tests.
 *
 * @returns Validated-shaped config object (not loaded from disk).
 */
function testConfig(): AppConfig {
  return {
    api: {
      host: '127.0.0.1',
      port: 8787,
      upstream: {
        worldstateUrl: 'https://example.test/worldState.php',
        timeoutMs: 1000,
      },
    },
    defaults: {
      realm: 'international',
      locale: 'zh',
      qqReplyMode: 'text',
      commandPrefix: 'wf',
    },
  };
}

/**
 * Creates a Hono app with a mocked worldstate upstream fetch.
 *
 * @param upstreamBody - JSON body returned by the mock fetch.
 * @returns Hono app instance for `app.request`.
 */
function createTestApp(upstreamBody: unknown) {
  const logger = createLogger('silent');
  const cache = new TtlCache<WorldstateDto>();
  const fetchImpl = vi.fn(async () =>
    new Response(JSON.stringify(upstreamBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  ) as unknown as typeof fetch;

  const worldstateService = new WorldstateService({
    cache,
    worldstateUrl: 'https://example.test/worldState.php',
    timeoutMs: 1000,
    logger,
    fetchImpl,
  });

  return createApp({
    config: testConfig(),
    logger,
    startedAtMs: Date.now() - 5_000,
    worldstateCache: cache,
    worldstateService,
    version: '0.0.0-test',
  });
}

/**
 * Reads a JSON response body as a loosely typed object for assertions.
 *
 * @param response - Fetch Response from `app.request`.
 * @returns Parsed JSON value cast for test expectations.
 */
async function readJson(response: Response): Promise<Record<string, any>> {
  return (await response.json()) as Record<string, any>;
}

describe('createApp routes', () => {
  it('returns health envelope', async () => {
    const app = createTestApp({});
    const response = await app.request('/v1/health');
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.uptimeSec).toBeGreaterThanOrEqual(0);
  });

  it('returns meta capabilities', async () => {
    const app = createTestApp({});
    const response = await app.request('/v1/meta');
    const body = await readJson(response);
    expect(body.ok).toBe(true);
    expect(body.data.mvpRealm).toBe('international');
    expect(body.data.locales).toContain('zh');
    expect(body.data.version).toBe('0.0.0-test');
  });

  it('rejects china realm for worldstate in MVP', async () => {
    const app = createTestApp({});
    const response = await app.request('/v1/worldstate?realm=china');
    expect(response.status).toBe(501);
    const body = await readJson(response);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('REALM_NOT_AVAILABLE');
  });

  it('returns mapped worldstate for international realm', async () => {
    const app = createTestApp({
      Invasions: [
        {
          _id: { $oid: 'abc' },
          Node: 'SolNode99',
          AttackerMissionInfo: { faction: 'FC_INFESTATION' },
          DefenderMissionInfo: { faction: 'FC_GRINEER' },
          Completed: false,
        },
      ],
    });
    const response = await app.request('/v1/worldstate?realm=international&locale=en');
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.ok).toBe(true);
    expect(body.data.invasions[0].node).toBe('SolNode99');
    expect(body.meta.source).toBe('warframe-worldstate');
    expect(body.meta.locale).toBe('en');
  });
});
