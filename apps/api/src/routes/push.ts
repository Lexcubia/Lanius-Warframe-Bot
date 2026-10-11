import { z } from 'zod';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { requireAdminToken } from '../lib/admin-auth.js';
import { successWithMeta } from '../lib/build-meta.js';

/**
 * 注册推送 tick / ack（仅 Bot Bearer adminToken）。
 *
 * @returns Hono 子应用
 */
export function pushRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.post('/push/tick', async (c) => {
    requireAdminToken(c);
    const ctx = c.get('app');
    const due = await ctx.pushService.collectDue();
    return c.json(
      successWithMeta(
        {
          dispatches: due.map(({ fingerprint: _fp, ...rest }) => rest),
          // fingerprint 单独给出，便于 bot ack
          fingerprints: Object.fromEntries(
            due.map((row) => [String(row.subscriptionId), row.fingerprint]),
          ),
        },
        {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'lanius-push',
        },
      ),
    );
  });

  app.post('/push/ack', async (c) => {
    requireAdminToken(c);
    const ctx = c.get('app');
    const body = z
      .object({
        subscriptionId: z.number().int().positive(),
        fingerprint: z.string().min(1),
      })
      .parse(await c.req.json());
    ctx.pushService.acknowledge(body.subscriptionId, body.fingerprint);
    return c.json(
      successWithMeta(
        { ok: true },
        {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'lanius-push',
        },
      ),
    );
  });

  return app;
}
