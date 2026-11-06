import {
  AcrithisDtoSchema,
  ArbTableDtoSchema,
  EssenceShopDtoSchema,
  IncarnonRotationDtoSchema,
  IncursionsDtoSchema,
  TimersDtoSchema,
  parsePublicQuery,
} from '@lanius/core';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';
import { validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * SDJK Wave1 独立路由：时效 / 仲裁表 / 钢精 / 碎银 / 侵袭 / 灵化 / 言录使。
 * worldstate 切片类模块仍走 `GET /v1/worldstate`。
 *
 * @returns Hono 子应用
 */
export function worldstateWave1Routes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/timers', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, gate(c, 'timers'));
    const result = await ctx.worldstateService.getTimers(realm, locale);
    const data = TimersDtoSchema.parse(result.data);
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: result.cached,
        cacheAgeMs: result.cacheAgeMs,
        stale: result.stale,
        source: result.source,
        generatedAt: data.fetchedAt,
      }),
    );
  });

  app.get('/arb-table', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, gate(c, 'arbTable'));
    const data = ArbTableDtoSchema.parse(await ctx.worldstateService.getArbTable(realm));
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: 'arbi.wf.wiki',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  app.get('/steel-path', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, gate(c, 'steelPath'));
    const data = EssenceShopDtoSchema.parse(ctx.worldstateService.getSteelPathShop());
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: 'wiki-steel-essence',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  app.get('/sliver-shop', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, gate(c, 'sliverShop'));
    const data = EssenceShopDtoSchema.parse(ctx.worldstateService.getSliverShop());
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: 'wiki-riven-sliver',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  app.get('/incursions', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, gate(c, 'incursions'));
    const data = IncursionsDtoSchema.parse(await ctx.worldstateService.getIncursions(realm));
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: 'browse.wf',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  app.get('/incarnon', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, gate(c, 'incarnon'));
    const data = IncarnonRotationDtoSchema.parse(ctx.worldstateService.getIncarnon());
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: 'rotations-seed',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  app.get('/acrithis', async (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, gate(c, 'acrithis'));
    const data = AcrithisDtoSchema.parse(ctx.worldstateService.getAcrithis());
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        cacheAgeMs: 0,
        stale: false,
        source: 'acrithis-pool',
        generatedAt: data.fetchedAt,
      }),
    );
  });

  return app;
}

/**
 * 解析 realm/locale 查询。
 *
 * @param c - Hono context
 * @returns realm + locale
 */
function parseQuery(c: { req: { query: () => Record<string, string> } }) {
  try {
    return parsePublicQuery(c.req.query());
  } catch (error) {
    if (error instanceof ZodError) {
      throw validationError('Invalid realm or locale', { issues: error.flatten() });
    }
    throw error;
  }
}

/**
 * 构造模块门禁上下文。
 *
 * @param c - Hono context
 * @param moduleId - ModuleId
 * @returns 门禁入参
 */
function gate(
  c: { req: { query: (k: string) => string | undefined } },
  moduleId:
    'timers' | 'arbTable' | 'steelPath' | 'sliverShop' | 'incursions' | 'incarnon' | 'acrithis',
) {
  return {
    scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
    targetId: c.req.query('targetId') ?? 'public',
    userId: c.req.query('userId') ?? '',
    moduleId,
  };
}
