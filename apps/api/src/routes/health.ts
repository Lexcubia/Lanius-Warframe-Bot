import { HealthDtoSchema, type HealthDto } from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';

/**
 * Registers `GET /v1/health` (liveness + optional probe summary).
 *
 * @returns Hono sub-app mounted under `/v1`.
 */
export function healthRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/health', (c) => {
    const ctx = c.get('app');
    const uptimeSec = Math.floor((Date.now() - ctx.startedAtMs) / 1000);
    const hasWorldstateCache = ctx.worldstateCache.has('worldstate:international');

    const data: HealthDto = HealthDtoSchema.parse({
      status: 'ok',
      uptimeSec,
      checks: {
        cache: hasWorldstateCache ? 'ok' : 'unknown',
        upstreamWorldstate: 'unknown',
      },
    });

    return c.json(
      successWithMeta(data, {
        realm: ctx.config.defaults.realm,
        locale: ctx.config.defaults.locale,
        cached: false,
        source: 'lanius-api',
      }),
    );
  });

  return app;
}
