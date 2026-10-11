import { createHmac, timingSafeEqual } from 'node:crypto';

import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';

import type { AppVariables } from '../app-context.js';
import { unauthorizedError } from './http-error.js';

const COOKIE = 'lanius_admin_session';

/**
 * 校验 Bearer adminToken（Bot 推送 / 订阅写操作）。
 *
 * @param c - Hono 上下文
 * @returns 无返回值
 * @throws HttpError 未授权时
 */
export function requireAdminToken(c: Context<{ Variables: AppVariables }>): void {
  const ctx = c.get('app');
  const expected = ctx.config.api.adminToken ?? '';
  if (!expected) {
    throw unauthorizedError('adminToken not configured');
  }
  const header = c.req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const token = match?.[1]?.trim() ?? '';
  if (!safeEqual(token, expected)) {
    throw unauthorizedError('Invalid admin token');
  }
}

/**
 * 校验管理 Cookie 会话或 Bearer adminToken（二选一）。
 *
 * @param c - Hono 上下文
 * @returns 无返回值
 * @throws HttpError 未授权时
 */
export function requireAdminSessionOrToken(
  c: Context<{ Variables: AppVariables }>,
): void {
  const ctx = c.get('app');
  const header = c.req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const bearer = match?.[1]?.trim() ?? '';
  const expectedToken = ctx.config.api.adminToken ?? '';
  if (expectedToken && bearer && safeEqual(bearer, expectedToken)) {
    return;
  }

  const secret =
    ctx.config.admin?.sessionSecret ?? ctx.config.api.adminToken ?? '';
  const cookie = getCookie(c, COOKIE) ?? '';
  const token = bearer || cookie;
  if (!secret || !token || !verifyAdminSession(token, secret)) {
    throw unauthorizedError('Admin session required');
  }
}

/**
 * 校验 admin 会话 token（`user.exp.sig`）。
 *
 * @param token - cookie 或 bearer
 * @param secret - HMAC 密钥
 * @returns 是否有效
 */
export function verifyAdminSession(token: string, secret: string): boolean {
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

/**
 * 常量时间字符串比较。
 *
 * @param a - 左侧
 * @param b - 右侧
 * @returns 是否相等
 */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
