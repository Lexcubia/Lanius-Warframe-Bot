import { describe, expect, it, vi } from 'vitest';

import { qqOpenApiJson, truncateWeightedChars } from './open-api.js';

describe('qqOpenApiJson', () => {
  it('accepts success bodies with code 0', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'tok', expires_in: 7200 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ code: 0, panel_id: 'p1' }),
      });

    const result = await qqOpenApiJson<{ panel_id?: string }>(
      {
        appId: 'app',
        appSecret: 'secret',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      },
      'POST',
      '/v2/panels',
      { scope: 'group' },
    );
    expect(result.panel_id).toBe('p1');
  });

  it('rejects non-zero business codes', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'tok', expires_in: 7200 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ code: 40030016, message: 'missing field' }),
      });

    await expect(
      qqOpenApiJson(
        {
          appId: 'app',
          appSecret: 'secret',
          fetchImpl: fetchImpl as unknown as typeof fetch,
        },
        'GET',
        '/v2/panels?scope=group',
      ),
    ).rejects.toThrow(/40030016/);
  });
});

describe('truncateWeightedChars', () => {
  it('counts CJK as two units', () => {
    expect(truncateWeightedChars('世界状态帮助', 10)).toBe('世界状态帮');
  });
});
