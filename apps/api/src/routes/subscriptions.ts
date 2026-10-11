import {
  PushFrequencySchema,
  SubscribableModuleIdSchema,
} from '@lanius/core';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AppVariables } from '../app-context.js';
import {
  deleteSubscription,
  disableSubscription,
  listAllSubscriptions,
  listSubscriptionsForTarget,
  patchSubscription,
  upsertSubscription,
} from '../db/subscriptions.js';
import { requireAdminSessionOrToken, requireAdminToken } from '../lib/admin-auth.js';
import { successWithMeta } from '../lib/build-meta.js';
import { notFoundError, validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * 注册订阅读写路由（Bot token / Admin 会话）。
 *
 * @returns Hono 子应用
 */
export function subscriptionRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/subscriptions', (c) => {
    requireAdminSessionOrToken(c);
    const ctx = c.get('app');
    const scene = c.req.query('scene');
    const targetId = c.req.query('targetId');
    const items =
      scene && targetId && (scene === 'group' || scene === 'c2c')
        ? listSubscriptionsForTarget(ctx.db, scene, targetId)
        : listAllSubscriptions(ctx.db);
    return c.json(successWithMeta({ subscriptions: items }, meta(ctx)));
  });

  app.post('/subscriptions', async (c) => {
    requireAdminToken(c);
    const ctx = c.get('app');
    const body = z
      .object({
        scene: z.enum(['group', 'c2c']),
        targetId: z.string().min(1),
        moduleId: SubscribableModuleIdSchema,
        frequency: PushFrequencySchema.default('on_change'),
        enabled: z.boolean().optional(),
        userId: z.string().optional(),
      })
      .parse(await c.req.json());

    assertModuleAllowed(ctx.db, {
      scene: body.scene,
      targetId: body.targetId,
      userId: body.userId ?? '',
      moduleId: 'subscribe',
    });
    assertModuleAllowed(ctx.db, {
      scene: body.scene,
      targetId: body.targetId,
      userId: body.userId ?? '',
      moduleId: body.moduleId,
    });

    const row = upsertSubscription(ctx.db, body);
    return c.json(successWithMeta({ subscription: row }, meta(ctx)));
  });

  app.post('/subscriptions/disable', async (c) => {
    requireAdminToken(c);
    const ctx = c.get('app');
    const body = z
      .object({
        scene: z.enum(['group', 'c2c']),
        targetId: z.string().min(1),
        moduleId: SubscribableModuleIdSchema,
      })
      .parse(await c.req.json());
    const ok = disableSubscription(
      ctx.db,
      body.scene,
      body.targetId,
      body.moduleId,
    );
    if (!ok) {
      throw notFoundError('Subscription not found');
    }
    return c.json(successWithMeta({ ok: true }, meta(ctx)));
  });

  app.patch('/subscriptions/:id', async (c) => {
    requireAdminSessionOrToken(c);
    const ctx = c.get('app');
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id)) {
      throw validationError('Invalid id');
    }
    const body = z
      .object({
        enabled: z.boolean().optional(),
        frequency: PushFrequencySchema.optional(),
      })
      .parse(await c.req.json());
    const row = patchSubscription(ctx.db, id, body);
    if (!row) {
      throw notFoundError('Subscription not found');
    }
    return c.json(successWithMeta({ subscription: row }, meta(ctx)));
  });

  app.delete('/subscriptions/:id', (c) => {
    requireAdminSessionOrToken(c);
    const ctx = c.get('app');
    const id = Number(c.req.param('id'));
    if (!deleteSubscription(ctx.db, id)) {
      throw notFoundError('Subscription not found');
    }
    return c.json(successWithMeta({ id }, meta(ctx)));
  });

  return app;
}

/**
 * @param ctx - 应用上下文
 * @returns meta 片段
 */
function meta(ctx: {
  config: { defaults: { realm: 'international' | 'china'; locale: 'zh' | 'en' } };
}) {
  return {
    realm: ctx.config.defaults.realm,
    locale: ctx.config.defaults.locale,
    cached: false as const,
    source: 'lanius-subscriptions',
  };
}
