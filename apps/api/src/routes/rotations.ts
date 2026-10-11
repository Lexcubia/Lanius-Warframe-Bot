import { parsePublicQuery } from '@lanius/core';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';
import { validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * 注册信条 / 终幕轮换查询路由。
 *
 * @returns Hono 子应用
 */
export function rotationRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/rotations/tenet', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, {
      scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
      targetId: c.req.query('targetId') ?? 'public',
      userId: c.req.query('userId') ?? '',
      moduleId: 'tenetRotation',
    });
    const data = await ctx.rotationService.getRotation('tenet');
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        source: 'lanius-rotation',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  app.get('/rotations/coda', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, {
      scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
      targetId: c.req.query('targetId') ?? 'public',
      userId: c.req.query('userId') ?? '',
      moduleId: 'codaRotation',
    });
    const data = await ctx.rotationService.getRotation('coda');
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        source: 'lanius-rotation',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  return app;
}

/**
 * 解析公开查询参数。
 *
 * @param c - 请求上下文
 * @returns realm / locale
 */
function parseQuery(c: { req: { query: () => Record<string, string> } }) {
  try {
    return parsePublicQuery(c.req.query());
  } catch (error) {
    if (error instanceof ZodError) {
      throw validationError('Invalid realm or locale', {
        issues: error.flatten(),
      });
    }
    throw error;
  }
}
