import { HelpDtoSchema, buildHelpDto } from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';

/**
 * 注册 `GET /v1/help`（来自共享指令目录的帮助载荷）。
 *
 * @returns 挂载在 `/v1` 下的 Hono 子应用
 */
export function helpRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/help', (c) => {
    const ctx = c.get('app');
    const data = HelpDtoSchema.parse(buildHelpDto());

    return c.json(
      successWithMeta(data, {
        realm: ctx.config.defaults.realm,
        locale: ctx.config.defaults.locale,
        cached: true,
        source: 'lanius-command-catalog',
      }),
    );
  });

  return app;
}
