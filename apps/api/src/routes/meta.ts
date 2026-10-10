import {
  DEFAULT_REALM,
  MetaDtoSchema,
  MVP_REALMS,
  SUPPORTED_LOCALES,
  type MetaDto,
} from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import { successWithMeta } from '../lib/build-meta.js';

/**
 * Registers `GET /v1/meta` (capabilities advertisement).
 *
 * @returns Hono sub-app mounted under `/v1`.
 */
export function metaRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/meta', (c) => {
    const ctx = c.get('app');
    const data: MetaDto = MetaDtoSchema.parse({
      realms: [...MVP_REALMS],
      locales: [...SUPPORTED_LOCALES],
      mvpRealm: DEFAULT_REALM,
      replyModes: ['text', 'image'],
      version: ctx.version,
    });

    return c.json(
      successWithMeta(data, {
        realm: ctx.config.defaults.realm,
        locale: ctx.config.defaults.locale,
        cached: false,
        source: 'lanius-api',
      }),
    );
  });

  return app;
}
