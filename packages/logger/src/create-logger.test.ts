import pino from 'pino';
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';

import { childLogger, createLaniusLogger } from './create-logger.js';
import { LANIUS_LOG_REDACT_PATHS } from './redact-paths.js';

describe('createLaniusLogger', () => {
  it('exposes service bindings and child logger', () => {
    const logger = createLaniusLogger({ service: 'lanius-test', level: 'silent' });
    expect(logger.bindings()).toMatchObject({ service: 'lanius-test' });
    const child = childLogger(logger, { component: 'unit' });
    expect(child.bindings()).toMatchObject({
      service: 'lanius-test',
      component: 'unit',
    });
  });

  it('redacts configured secret paths', async () => {
    const chunks: string[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(String(chunk));
        cb();
      },
    });
    const logger = pino(
      {
        level: 'info',
        redact: {
          paths: [...LANIUS_LOG_REDACT_PATHS],
          censor: '[Redacted]',
        },
      },
      stream,
    );
    logger.info(
      {
        appSecret: 'super-secret',
        token: 'tok',
        ok: true,
      },
      'probe',
    );
    await new Promise((r) => setImmediate(r));
    const joined = chunks.join('');
    expect(joined).toContain('[Redacted]');
    expect(joined).not.toContain('super-secret');
    expect(joined).not.toContain('"tok"');
    expect(joined).toContain('"ok":true');
  });
});
