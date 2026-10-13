import { createLaniusLogger } from '@lanius/logger';
import { describe, expect, it, vi } from 'vitest';

import type { BotConfig } from './config.js';
import { createBotApp } from './create-app.js';

/**
 * 构造 dry-run Bot 配置（跳过验签，便于本地注入回调）。
 *
 * @returns BotConfig
 */
function sampleConfig(): BotConfig {
  return {
    qq: {
      appId: 'id',
      appSecret: 'secret',
      callbackPath: '/qq/callback',
      panelIds: {},
    },
    api: { adminToken: 't' },
    bot: {
      host: '127.0.0.1',
      port: 8788,
      apiBaseUrl: 'http://127.0.0.1:9',
      defaultReplyMode: 'text',
      dryRun: true,
      pushIntervalMs: 0,
      commandPrefix: '/',
      commandPrefixPolicy: 'optional',
      markdownImage: true,
      image: {
        maxPerUserPerMinute: 5,
        renderTimeoutMs: 4000,
      },
    },
    defaults: {
      realm: 'international',
      locale: 'zh',
    },
  };
}

/**
 * 构造群 @ 消息回调体。
 *
 * @param content - 消息文本
 * @param msgId - d.id（被动回复 msg_id）
 * @returns JSON 字符串
 */
function groupAtBody(content: string, msgId: string): string {
  return JSON.stringify({
    id: `evt-${msgId}`,
    op: 0,
    t: 'GROUP_AT_MESSAGE_CREATE',
    d: {
      id: msgId,
      content,
      group_openid: 'group-openid-900',
    },
  });
}

describe('createBotApp webhook', () => {
  it('ACKs with OpCode 12 before command finishes and still replies', async () => {
    const logger = createLaniusLogger({ service: 'lanius-bot-test', level: 'silent' });
    const { app, qq, drainBackgroundWork } = createBotApp(sampleConfig(), logger);
    const sendText = vi.spyOn(qq, 'sendText');

    const response = await app.request('/qq/callback', {
      method: 'POST',
      body: groupAtBody('模式 文本', 'msg-ack-1'),
      headers: { 'content-type': 'application/json' },
    });

    expect(response.status).toBe(200);
    const ack = (await response.json()) as { op: number; opcode: number; op_code: number };
    expect(ack.op).toBe(12);
    expect(ack.opcode).toBe(12);
    expect(ack.op_code).toBe(12);

    await drainBackgroundWork();
    expect(sendText).toHaveBeenCalled();
    const [, content] = sendText.mock.calls[0] as [unknown, string];
    expect(content).toContain('文本');
  });

  it('dedupes redelivered msg_id after accept', async () => {
    const logger = createLaniusLogger({ service: 'lanius-bot-test', level: 'silent' });
    const { app, qq, drainBackgroundWork } = createBotApp(sampleConfig(), logger);
    const sendText = vi.spyOn(qq, 'sendText');
    const body = groupAtBody('模式 图片', 'msg-dup-1');

    const first = await app.request('/qq/callback', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
    });
    const second = await app.request('/qq/callback', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
    });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await drainBackgroundWork();
    expect(sendText).toHaveBeenCalledTimes(1);
  });

  it('ACKs ignored non-message events', async () => {
    const logger = createLaniusLogger({ service: 'lanius-bot-test', level: 'silent' });
    const { app } = createBotApp(sampleConfig(), logger);
    const response = await app.request('/qq/callback', {
      method: 'POST',
      body: JSON.stringify({ op: 0, t: 'READY', d: {} }),
      headers: { 'content-type': 'application/json' },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ op: 12 });
  });

  it('ACKs group lifecycle events without running command pipeline', async () => {
    const logger = createLaniusLogger({ service: 'lanius-bot-test', level: 'silent' });
    const { app, qq, drainBackgroundWork } = createBotApp(sampleConfig(), logger);
    const sendText = vi.spyOn(qq, 'sendText');

    const add = await app.request('/qq/callback', {
      method: 'POST',
      body: JSON.stringify({
        op: 0,
        t: 'GROUP_ADD_ROBOT',
        d: { group_openid: 'group-readd' },
      }),
      headers: { 'content-type': 'application/json' },
    });
    expect(add.status).toBe(200);
    expect(await add.json()).toMatchObject({ op: 12 });

    const del = await app.request('/qq/callback', {
      method: 'POST',
      body: JSON.stringify({
        op: 0,
        t: 'GROUP_DEL_ROBOT',
        d: { group_openid: 'group-readd' },
      }),
      headers: { 'content-type': 'application/json' },
    });
    expect(del.status).toBe(200);
    expect(await del.json()).toMatchObject({ op: 12 });

    await drainBackgroundWork();
    expect(sendText).not.toHaveBeenCalled();
  });
});
