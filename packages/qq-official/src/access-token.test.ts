import { describe, expect, it, vi } from 'vitest';

import { getAppAccessToken } from './access-token.js';

describe('getAppAccessToken', () => {
  it('caches token until near expiry', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'tok-1', expires_in: '7200' }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'tok-2', expires_in: '7200' }),
      });

    const cache = {};
    const first = await getAppAccessToken({
      appId: 'app',
      clientSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      cache,
    });
    const second = await getAppAccessToken({
      appId: 'app',
      clientSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      cache,
    });

    expect(first).toBe('tok-1');
    expect(second).toBe('tok-1');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws on business error code', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      json: async () => ({ code: 100016, message: 'invalid appid or secret' }),
    });

    await expect(
      getAppAccessToken({
        appId: 'bad',
        clientSecret: 'bad',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/100016/);
  });
});
