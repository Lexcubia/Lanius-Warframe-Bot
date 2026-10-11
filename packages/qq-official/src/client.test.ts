import { describe, expect, it, vi } from 'vitest';

import { createQqOfficialClient } from './client.js';

describe('QqOfficialClient.sendText', () => {
  it('posts group passive reply with msg_id and strips URLs', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        // getAppAccessToken
        json: async () => ({ access_token: 'tok', expires_in: 7200 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 'out-1' }),
      });

    const client = createQqOfficialClient({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.sendText(
      { scene: 'group', targetId: 'g1', msgId: 'm1' },
      'hello\nhttps://warframe.lexcubia.com/zh/worldstate\nworld',
    );

    expect(result).toEqual({ ok: true, messageId: 'out-1' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [, sendInit] = fetchImpl.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(sendInit.body)) as {
      content: string;
      msg_id: string;
      msg_seq: number;
      msg_type: number;
    };
    expect(body.msg_type).toBe(0);
    expect(body.msg_id).toBe('m1');
    expect(body.msg_seq).toBe(1);
    expect(body.content).not.toMatch(/https?:\/\//);
    expect(body.content).toContain('hello');
    expect(body.content).toContain('world');
  });

  it('returns ok in dryRun without network', async () => {
    const fetchImpl = vi.fn();
    const client = createQqOfficialClient({
      appId: 'app',
      appSecret: 'secret',
      dryRun: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const result = await client.sendText(
      { scene: 'c2c', targetId: 'u1', msgId: 'm1' },
      'ping',
    );
    expect(result.ok).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
