import { describe, expect, it } from 'vitest';

import { extractGroupOpenid, parseInboundQqMessage } from './parse-inbound-event.js';

describe('parseInboundQqMessage', () => {
  it('parses GROUP_AT_MESSAGE_CREATE', () => {
    const parsed = parseInboundQqMessage({
      id: 'evt-1',
      t: 'GROUP_AT_MESSAGE_CREATE',
      d: {
        id: 'msg-1',
        content: '世界状态',
        group_openid: 'group-1',
      },
    });
    expect(parsed).toEqual({
      content: '世界状态',
      eventType: 'GROUP_AT_MESSAGE_CREATE',
      target: {
        scene: 'group',
        targetId: 'group-1',
        msgId: 'msg-1',
        eventId: 'evt-1',
      },
    });
  });

  it('returns null for unknown event types', () => {
    expect(
      parseInboundQqMessage({
        t: 'READY',
        d: { content: 'x' },
      }),
    ).toBeNull();
  });

  it('extracts group_openid from group add and at events', () => {
    expect(
      extractGroupOpenid({
        t: 'GROUP_ADD_ROBOT',
        d: { group_openid: 'g-1' },
      }),
    ).toBe('g-1');
    expect(
      extractGroupOpenid({
        t: 'GROUP_AT_MESSAGE_CREATE',
        d: { group_openid: 'g-2', content: '帮助' },
      }),
    ).toBe('g-2');
    expect(
      extractGroupOpenid({
        t: 'GROUP_DEL_ROBOT',
        d: { group_openid: 'g-del' },
      }),
    ).toBe('g-del');
    expect(
      extractGroupOpenid({
        t: 'GROUP_MSG_REJECT',
        d: { group_openid: 'g-reject' },
      }),
    ).toBe('g-reject');
    expect(
      extractGroupOpenid({
        t: 'C2C_MESSAGE_CREATE',
        d: { group_openid: 'g-3' },
      }),
    ).toBeUndefined();
  });
});
