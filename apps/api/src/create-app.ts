import { ErrorCode, ErrorMessageKey, createFailureEnvelope } from '@lanius/core';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

import type { AppContext, AppVariables } from './app-context.js';
import { HttpError, internalError, validationError } from './lib/http-error.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { healthRoutes } from './routes/health.js';
import { metaRoutes } from './routes/meta.js';
import { worldstateRoutes } from './routes/worldstate.js';

/**
 * Builds the Hono application with `/v1` public routes and error mapping.
 *
 * @param appContext - Shared runtime dependencies for routes.
 * @returns Configured Hono app ready to serve HTTP.
 */
export function createApp(appContext: AppContext) {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use('*', requestIdMiddleware());
  app.use('*', async (c, next) => {
    c.set('app', appContext);
    await next();
  });

  const v1 = new Hono<{ Variables: AppVariables }>();
  v1.route('/', healthRoutes());
  v1.route('/', metaRoutes());
  v1.route('/', worldstateRoutes());
  app.route('/v1', v1);

  app.onError((error, c) => {
    const logger = c.get('app').logger;
    const requestId = c.get('requestId');

    if (error instanceof HttpError) {
      logger.warn(
        { err: { code: error.code, message: error.message }, requestId },
        'request failed with HttpError',
      );
      return c.json(
        createFailureEnvelope(error.toErrorBody()),
        error.status as ContentfulStatusCode,
      );
    }

    if (error instanceof ZodError) {
      const mapped = validationError('Request validation failed', {
        issues: error.flatten(),
      });
      return c.json(
        createFailureEnvelope(mapped.toErrorBody()),
        mapped.status as ContentfulStatusCode,
      );
    }

    logger.error(
      { err: { name: error.name, message: error.message }, requestId },
      'unhandled error',
    );
    const mapped = internalError();
    return c.json(
      createFailureEnvelope(mapped.toErrorBody()),
      mapped.status as ContentfulStatusCode,
    );
  });

  app.notFound((c) => {
    return c.json(
      createFailureEnvelope({
        code: ErrorCode.NOT_FOUND,
        message: 'Not found',
        messageKey: ErrorMessageKey.NOT_FOUND,
      }),
      404,
    );
  });

  return app;
}
