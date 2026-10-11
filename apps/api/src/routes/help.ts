import { HelpDtoSchema } from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { buildHelpFromDb } from '../db/repositories.js';
import { successWithMeta } from '../lib/build-meta.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * 注册 `GET /v1/help`（可配置帮助；可选 `module` 详解）。
 *
 * @returns 挂载在 `/v1` 下的 Hono 子应用
 */
export function helpRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/help', (c) => {
    const ctx = c.get('app');
    assertModuleAllowed(ctx.db, {
      scene: 'web',
      targetId: 'public',
      userId: '',
      moduleId: 'help',
    });

    const moduleToken = c.req.query('module')?.trim();
    const data = HelpDtoSchema.parse(buildHelpFromDb(ctx.db, moduleToken));

    return c.json(
      successWithMeta(data, {
        realm: ctx.config.defaults.realm,
        locale: ctx.config.defaults.locale,
        cached: false,
        source: 'lanius-help',
      }),
    );
  });

  return app;
}
