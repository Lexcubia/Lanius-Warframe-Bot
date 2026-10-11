import { MarketSearchDtoSchema } from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { writeAuditEvent } from '../db/repositories.js';
import { successWithMeta } from '../lib/build-meta.js';
import { validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * 注册市场查询路由。
 *
 * @returns Hono 子应用
 */
export function marketRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/market/items', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const q = c.req.query('q')?.trim() ?? '';
    if (!q) {
      throw validationError('q is required');
    }

    const scene = (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web';
    const targetId = c.req.query('targetId') ?? 'public';
    const userId = c.req.query('userId') ?? '';

    try {
      assertModuleAllowed(ctx.db, {
        scene,
        targetId,
        userId,
        moduleId: 'market',
      });
      const data = MarketSearchDtoSchema.parse(
        await ctx.marketService.search(q),
      );
      writeAuditEvent(ctx.db, {
        scene,
        targetId,
        userId,
        moduleId: 'market',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'warframe-market',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        scene,
        targetId,
        userId,
        moduleId: 'market',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  return app;
}
