import { RivenOrdersDtoSchema, RivenOrdersQuerySchema } from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { writeAuditEvent } from '../db/repositories.js';
import { successWithMeta } from '../lib/build-meta.js';
import { validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * 注册紫卡查询路由。
 *
 * @returns Hono 子应用
 */
export function rivenRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/riven', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const parsed = RivenOrdersQuerySchema.safeParse({
      q: c.req.query('q'),
      page: c.req.query('page') ?? undefined,
      pageSize: c.req.query('pageSize') ?? undefined,
      rank: c.req.query('rank') ?? undefined,
      mastery: c.req.query('mastery') ?? undefined,
      minRerolls: c.req.query('minRerolls') ?? undefined,
      maxRerolls: c.req.query('maxRerolls') ?? undefined,
    });
    if (!parsed.success) {
      throw validationError('invalid riven query', {
        issues: parsed.error.flatten(),
      });
    }

    const scene = (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web';
    const targetId = c.req.query('targetId') ?? 'public';
    const userId = c.req.query('userId') ?? '';

    try {
      assertModuleAllowed(ctx.db, {
        scene,
        targetId,
        userId,
        moduleId: 'riven',
      });
      const data = RivenOrdersDtoSchema.parse(
        await ctx.rivenService.searchOrders({
          query: parsed.data.q,
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
          rank: parsed.data.rank,
          mastery: parsed.data.mastery,
          minRerolls: parsed.data.minRerolls,
          maxRerolls: parsed.data.maxRerolls,
        }),
      );
      writeAuditEvent(ctx.db, {
        scene,
        targetId,
        userId,
        moduleId: 'riven',
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
        moduleId: 'riven',
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
