import { createMiddleware } from 'hono/factory';
import { randomUUID } from 'node:crypto';

/**
 * Attaches a request id to context and response headers for log correlation.
 *
 * @returns Hono middleware that sets `X-Request-Id`.
 */
export function requestIdMiddleware() {
  return createMiddleware(async (c, next) => {
    const incoming = c.req.header('x-request-id');
    const requestId =
      incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
    c.set('requestId', requestId);
    await next();
    c.header('X-Request-Id', requestId);
  });
}
