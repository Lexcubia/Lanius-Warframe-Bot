import { parsePublicQuery } from '@lanius/core';
import { Hono } from 'hono';
import { ZodError } from 'zod';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';
import { validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * 注册 Wave3 资料工具路由：`/wiki` · `/translate` · `/valence`。
 *
 * @returns Hono 子应用
 */
export function wikiToolsRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/wiki', (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, {
      scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
      targetId: c.req.query('targetId') ?? 'public',
      userId: c.req.query('userId') ?? '',
      moduleId: 'wiki',
    });
    const q = (c.req.query('q') ?? '').trim();
    if (!q) {
      throw validationError('Missing q', { field: 'q' });
    }
    const data = ctx.wikiToolsService.lookupWiki(q, locale);
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        source: 'lanius-wiki-deeplink',
      }),
    );
  });

  app.get('/translate', (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, {
      scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
      targetId: c.req.query('targetId') ?? 'public',
      userId: c.req.query('userId') ?? '',
      moduleId: 'translate',
    });
    const q = (c.req.query('q') ?? '').trim();
    if (!q) {
      throw validationError('Missing q', { field: 'q' });
    }
    const data = ctx.wikiToolsService.translateName(q);
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        source: 'lanius-name-bilingual',
      }),
    );
  });

  app.get('/valence', (c) => {
    const { realm, locale } = parseQuery(c);
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, {
      scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
      targetId: c.req.query('targetId') ?? 'public',
      userId: c.req.query('userId') ?? '',
      moduleId: 'valence',
    });
    const raw = (c.req.query('q') ?? c.req.query('tokens') ?? '').trim();
    const tokens = raw.length > 0 ? raw.split(/[\s,]+/u).filter(Boolean) : [];
    const data = ctx.wikiToolsService.computeValence(tokens, locale);
    return c.json(
      successWithMeta(data, {
        realm,
        locale,
        cached: false,
        source: 'lanius-valence-fusion',
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
