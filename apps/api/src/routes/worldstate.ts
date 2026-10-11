import { parsePublicQuery } from '@lanius/core';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';
import { validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * Registers `GET /v1/worldstate` (invasions + nightwave for a realm).
 *
 * @returns Hono sub-app mounted under `/v1`.
 */
export function worldstateRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/worldstate', async (c) => {
    let realm;
    let locale;
    try {
      const parsed = parsePublicQuery(c.req.query());
      realm = parsed.realm;
      locale = parsed.locale;
    } catch (error) {
      if (error instanceof ZodError) {
        throw validationError('Invalid realm or locale', {
          issues: error.flatten(),
        });
      }
      throw error;
    }

    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, {
      scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
      targetId: c.req.query('targetId') ?? 'public',
      userId: c.req.query('userId') ?? '',
      moduleId: 'worldstate',
    });
    const result = await ctx.worldstateService.getWorldstate(realm, locale);

    return c.json(
      successWithMeta(result.data, {
        realm,
        locale,
        cached: result.cached,
        cacheAgeMs: result.cacheAgeMs,
        stale: result.stale,
        source: result.source,
        generatedAt: result.data.fetchedAt,
      }),
    );
  });

  return app;
}
