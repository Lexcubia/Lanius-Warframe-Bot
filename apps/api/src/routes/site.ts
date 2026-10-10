import { SiteDtoSchema } from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';

/**
 * 注册 `GET /v1/site`（页脚备案等公开站点配置）。
 *
 * @returns 挂载在 `/v1` 下的 Hono 子应用
 */
export function siteRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/site', (c) => {
    const ctx = c.get('app');
    const data = SiteDtoSchema.parse(ctx.site);

    return c.json(
      successWithMeta(data, {
        realm: ctx.config.defaults.realm,
        locale: ctx.config.defaults.locale,
        cached: true,
        source: 'lanius-runtime-config',
      }),
    );
  });

  return app;
}
