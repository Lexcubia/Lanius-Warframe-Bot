import { CONFIG_MODULE_IDS, ConfigModuleIdSchema } from '@lanius/config';
import { ModuleIdSchema } from '@lanius/core';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import type { AppVariables } from '../app-context.js';
import {
  deleteAclRule,
  insertAclRule,
  listAclRules,
  listAuditEvents,
  listModuleSettings,
  setModuleEnabled,
  updateHelpMenu,
} from '../db/repositories.js';
import { listAllSubscriptions } from '../db/subscriptions.js';
import { successWithMeta } from '../lib/build-meta.js';
import {
  unauthorizedError,
  validationError,
} from '../lib/http-error.js';
import {
  applyReleaseTag,
  getCurrentReleaseInfo,
  listGithubReleases,
} from '../services/release-service.js';

const COOKIE = 'lanius_admin_session';

/**
 * 注册 `/v1/admin/*` 管理端点（口令会话）。
 *
 * @returns Hono 子应用
 */
export function adminRoutes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.post('/admin/login', async (c) => {
    const ctx = c.get('app');
    const body = z
      .object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
      .parse(await c.req.json());

    const expectedUser = ctx.config.admin?.username ?? 'admin';
    const hash = ctx.config.admin?.passwordHash;
    if (!hash || body.username !== expectedUser) {
      throw unauthorizedError('Invalid credentials');
    }
    const ok = await verifyPassword(body.password, hash);
    if (!ok) {
      throw unauthorizedError('Invalid credentials');
    }

    const token = signSession(
      body.username,
      ctx.config.admin?.sessionSecret ?? ctx.config.api.adminToken ?? 'dev',
    );
    setCookie(c, COOKIE, token, {
      httpOnly: true,
      path: '/',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 12,
    });

    return c.json(
      successWithMeta(
        { ok: true },
        {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'lanius-admin',
        },
      ),
    );
  });

  app.post('/admin/logout', (c) => {
    setCookie(c, COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
    const ctx = c.get('app');
    return c.json(
      successWithMeta(
        { ok: true },
        {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'lanius-admin',
        },
      ),
    );
  });

  app.use('/admin/*', async (c, next) => {
    if (c.req.path.endsWith('/admin/login')) {
      await next();
      return;
    }
    requireAdmin(c);
    await next();
  });

  app.get('/admin/modules', (c) => {
    const ctx = c.get('app');
    const rows = listModuleSettings(ctx.db);
    return c.json(
      successWithMeta(
        {
          modules: rows.map((row) => ({
            id: row.module_id,
            enabled: row.enabled === 1,
            sortOrder: row.sort_order,
          })),
        },
        meta(ctx),
      ),
    );
  });

  app.patch('/admin/modules/:id', async (c) => {
    const ctx = c.get('app');
    const id = ModuleIdSchema.parse(c.req.param('id'));
    const body = z.object({ enabled: z.boolean() }).parse(await c.req.json());
    setModuleEnabled(ctx.db, id, body.enabled);
    return c.json(successWithMeta({ id, enabled: body.enabled }, meta(ctx)));
  });

  app.get('/admin/acl', (c) => {
    const ctx = c.get('app');
    return c.json(successWithMeta({ rules: listAclRules(ctx.db) }, meta(ctx)));
  });

  app.post('/admin/acl', async (c) => {
    const ctx = c.get('app');
    const body = z
      .object({
        scope: z.enum(['global', 'group', 'c2c']),
        targetId: z.string().default(''),
        subject: z.enum(['module', 'user']),
        effect: z.enum(['allow', 'deny']),
        moduleId: z.string().optional(),
        userOpenid: z.string().optional(),
      })
      .parse(await c.req.json());
    if (body.subject === 'module' && !body.moduleId) {
      throw validationError('moduleId required for module ACL');
    }
    if (body.subject === 'user' && !body.userOpenid) {
      throw validationError('userOpenid required for user ACL');
    }
    const id = insertAclRule(ctx.db, body);
    return c.json(successWithMeta({ id }, meta(ctx)));
  });

  app.delete('/admin/acl/:id', (c) => {
    const ctx = c.get('app');
    const id = Number(c.req.param('id'));
    deleteAclRule(ctx.db, id);
    return c.json(successWithMeta({ id }, meta(ctx)));
  });

  app.get('/admin/audit', (c) => {
    const ctx = c.get('app');
    const limit = Number(c.req.query('limit') ?? 100);
    return c.json(
      successWithMeta({ events: listAuditEvents(ctx.db, limit) }, meta(ctx)),
    );
  });

  app.put('/admin/help-menu', async (c) => {
    const ctx = c.get('app');
    const body = z
      .object({
        titleZh: z.string(),
        titleEn: z.string(),
        introZh: z.string(),
        introEn: z.string(),
        visibleModuleIds: z.array(z.string()),
      })
      .parse(await c.req.json());
    updateHelpMenu(ctx.db, body);
    return c.json(successWithMeta({ ok: true }, meta(ctx)));
  });

  app.get('/admin/subscriptions', (c) => {
    const ctx = c.get('app');
    return c.json(
      successWithMeta({ subscriptions: listAllSubscriptions(ctx.db) }, meta(ctx)),
    );
  });

  app.get('/admin/rotations', (c) => {
    const ctx = c.get('app');
    return c.json(
      successWithMeta({ schedules: ctx.rotationService.listSchedules() }, meta(ctx)),
    );
  });

  app.put('/admin/rotations/:moduleId', async (c) => {
    const ctx = c.get('app');
    const moduleId = z
      .enum(['tenetRotation', 'codaRotation'])
      .parse(c.req.param('moduleId'));
    const body = z
      .object({
        epochIso: z.string().datetime(),
        periodDays: z.number().int().positive(),
        items: z.array(z.string().min(1)).min(1),
      })
      .parse(await c.req.json());
    ctx.rotationService.upsertSchedule(moduleId, body);
    return c.json(successWithMeta({ ok: true, moduleId }, meta(ctx)));
  });

  app.get('/admin/config', (c) => {
    const ctx = c.get('app');
    const modules = CONFIG_MODULE_IDS.map((id) => ctx.configDriver.describe(id));
    return c.json(successWithMeta({ modules }, meta(ctx)));
  });

  app.get('/admin/config/:moduleId', (c) => {
    const ctx = c.get('app');
    const moduleId = ConfigModuleIdSchema.parse(c.req.param('moduleId'));
    return c.json(
      successWithMeta(ctx.configDriver.describe(moduleId), meta(ctx)),
    );
  });

  app.put('/admin/config/:moduleId', async (c) => {
    const ctx = c.get('app');
    const moduleId = ConfigModuleIdSchema.parse(c.req.param('moduleId'));
    const body = z.record(z.unknown()).parse(await c.req.json());
    const result = ctx.configDriver.save(moduleId, body);
    return c.json(
      successWithMeta(
        {
          ok: true,
          moduleId,
          restartRequired: result.restartRequired,
          data: ctx.configDriver.describe(moduleId).data,
        },
        meta(ctx),
      ),
    );
  });

  app.get('/admin/releases', async (c) => {
    const ctx = c.get('app');
    const releases = await listGithubReleases(ctx.configDriver.get('github'));
    return c.json(
      successWithMeta(
        { releases, current: getCurrentReleaseInfo() },
        meta(ctx),
      ),
    );
  });

  app.get('/admin/releases/current', (c) => {
    const ctx = c.get('app');
    return c.json(
      successWithMeta({ current: getCurrentReleaseInfo() }, meta(ctx)),
    );
  });

  app.post('/admin/releases/apply', async (c) => {
    const ctx = c.get('app');
    const body = z
      .object({
        tag: z.string().min(1),
        action: z.enum(['update', 'rollback']).default('update'),
      })
      .parse(await c.req.json());
    const result = await applyReleaseTag(
      ctx.configDriver.get('github'),
      body.tag,
    );
    return c.json(
      successWithMeta({ ...result, action: body.action }, meta(ctx)),
    );
  });

  return app;
}

/**
 * @param ctx - AppContext 的 config/defaults
 * @returns meta 片段
 */
function meta(ctx: { config: { defaults: { realm: 'international' | 'china'; locale: 'zh' | 'en' } } }) {
  return {
    realm: ctx.config.defaults.realm,
    locale: ctx.config.defaults.locale,
    cached: false as const,
    source: 'lanius-admin',
  };
}

/**
 * 校验管理员会话 cookie。
 *
 * @param c - Hono context
 * @returns 无返回值
 * @throws HttpError 未登录
 */
function requireAdmin(c: {
  get: (key: 'app') => AppVariables['app'];
  req: { header: (name: string) => string | undefined };
}): void {
  const ctx = c.get('app');
  const secret =
    ctx.config.admin?.sessionSecret ?? ctx.config.api.adminToken ?? '';
  const bearer = c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const cookie = getCookie(c as never, COOKIE);
  const token = bearer || cookie;
  if (!token || !secret || !verifySession(token, secret)) {
    throw unauthorizedError('Admin session required');
  }
}

/**
 * 校验口令哈希（bcrypt；示例占位哈希则拒绝）。
 *
 * @param password - 明文口令
 * @param hash - 存储哈希
 * @returns 是否匹配
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.includes('REPLACE_ME')) {
    return false;
  }
  if (hash.startsWith('$2')) {
    return bcrypt.compare(password, hash);
  }
  // 开发便利：明文配置仅当以 plain: 前缀时（勿用于生产）
  if (hash.startsWith('plain:')) {
    const expected = hash.slice('plain:'.length);
    const a = Buffer.from(password);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  return false;
}

/**
 * 签发会话 token。
 *
 * @param username - 用户名
 * @param secret - 签名密钥
 * @returns token
 */
function signSession(username: string, secret: string): string {
  const exp = Date.now() + 12 * 60 * 60_000;
  const payload = `${username}.${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/**
 * 校验会话 token。
 *
 * @param token - cookie/bearer
 * @param secret - 密钥
 * @returns 是否有效
 */
function verifySession(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  const [username, expStr, sig] = parts;
  const payload = `${username}.${expStr}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  try {
    const a = Buffer.from(sig ?? '', 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return false;
    }
  } catch {
    return false;
  }
  return Number(expStr) > Date.now();
}
