import { describe, expect, it } from 'vitest';

import { parseInboundQqMessage } from './parse-inbound-event.js';

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
});
