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
    const result = await client.sendText({ scene: 'c2c', targetId: 'u1', msgId: 'm1' }, 'ping');
    expect(result.ok).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('QqOfficialClient.sendMarkdown', () => {
  it('posts msg_type=2 with markdown and keyboard', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'tok', expires_in: 7200 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 'md-1' }),
      });

    const client = createQqOfficialClient({
      appId: '42',
      appSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.sendMarkdown(
      { scene: 'group', targetId: 'g1', msgId: 'm1' },
      '**裂隙**\n一行',
      {
        rows: [
          {
            buttons: [
              {
                id: 'f-all',
                label: '全部',
                actionType: 2,
                data: '裂隙',
                enter: false,
              },
            ],
          },
        ],
      },
    );

    expect(result).toEqual({ ok: true, messageId: 'md-1' });
    const [, sendInit] = fetchImpl.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(sendInit.body)) as {
      msg_type: number;
      markdown: { content: string };
      keyboard: { content: { bot_appid?: number; rows: unknown[] } };
      msg_id: string;
    };
    expect(body.msg_type).toBe(2);
    expect(body.markdown.content).toContain('裂隙');
    expect(body.keyboard.content.bot_appid).toBe(42);
    expect(body.keyboard.content.rows).toHaveLength(1);
    expect(body.msg_id).toBe('m1');
  });

  it('keeps image markdown url but strips bare links', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'tok', expires_in: 7200 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ id: 'md-2' }),
      });

    const client = createQqOfficialClient({
      appId: '42',
      appSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await client.sendMarkdown(
      { scene: 'c2c', targetId: 'u1', msgId: 'm2' },
      '**虚空裂隙**\n\n![虚空裂隙 #640px #534px](https://cos.lexcubia.com/lanius/cards/a.png)\n\n见 https://example.com/x',
    );

    const [, sendInit] = fetchImpl.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(String(sendInit.body)) as {
      markdown: { content: string };
    };
    // 图片语法内 URL 与尺寸标注保留；裸链被剥除
    expect(body.markdown.content).toContain(
      '![虚空裂隙 #640px #534px](https://cos.lexcubia.com/lanius/cards/a.png)',
    );
    expect(body.markdown.content).not.toContain('![img](');
    expect(body.markdown.content).not.toContain('https://example.com/x');
  });
});

describe('QqOfficialClient.sendImage', () => {
  it('uploads file_data then posts msg_type=7 media', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ access_token: 'tok', expires_in: 7200 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ code: 0, file_info: 'FILEINFO', file_uuid: 'fu1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ code: 0, id: 'img-1' }),
      });

    const client = createQqOfficialClient({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.sendImage({ scene: 'group', targetId: 'g1', msgId: 'm1' }, png);

    expect(result).toMatchObject({ ok: true, messageId: 'img-1' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);

    const [uploadUrl, uploadInit] = fetchImpl.mock.calls[1] as [string, RequestInit];
    expect(uploadUrl).toContain('/v2/groups/g1/files');
    const uploadBody = JSON.parse(String(uploadInit.body)) as {
      file_type: number;
      file_data: string;
      file_name: string;
      srv_send_msg: boolean;
    };
    expect(uploadBody.file_type).toBe(1);
    expect(uploadBody.file_name).toBe('lanius-card.png');
    expect(uploadBody.srv_send_msg).toBe(false);
    expect(uploadBody.file_data).toBe(png.toString('base64'));

    const [, sendInit] = fetchImpl.mock.calls[2] as [string, RequestInit];
    const sendBody = JSON.parse(String(sendInit.body)) as {
      msg_type: number;
      media: { file_info: string };
      msg_id: string;
      msg_seq: number;
    };
    expect(sendBody.msg_type).toBe(7);
    expect(sendBody.media.file_info).toBe('FILEINFO');
    expect(sendBody.msg_id).toBe('m1');
    expect(sendBody.msg_seq).toBe(1);
  });
});
