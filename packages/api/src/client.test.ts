import { describe, expect, it, vi } from 'vitest';

import { createLaniusApiClient } from './client.js';

describe('LaniusApiClient', () => {
  it('getHealth parses a success envelope', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          data: { status: 'ok', uptimeSec: 12 },
          meta: {
            realm: 'international',
            locale: 'zh',
            cached: false,
            generatedAt: '2026-10-10T12:00:00.000Z',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    ) as unknown as typeof fetch;

    const client = createLaniusApiClient({
      baseUrl: 'http://127.0.0.1:8787',
      fetchImpl,
    });
    const result = await client.getHealth();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.uptimeSec).toBe(12);
    }
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/v1/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('getWorldstate appends query params', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: 'REALM_NOT_AVAILABLE',
            message: 'no',
            messageKey: 'errors.realm_not_available',
          },
        }),
        { status: 501, headers: { 'Content-Type': 'application/json' } },
      ),
    ) as unknown as typeof fetch;

    const client = createLaniusApiClient({
      baseUrl: 'http://127.0.0.1:8787/',
      fetchImpl,
    });
    const result = await client.getWorldstate({ realm: 'china', locale: 'en' });
    expect(result.ok).toBe(false);
    expect(fetchImpl).toHaveBeenCalledWith(
      'http://127.0.0.1:8787/v1/worldstate?realm=china&locale=en',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
