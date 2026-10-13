import { describe, expect, it } from 'vitest';

import { buildQqWebhookAck } from './webhook-ack.js';

describe('buildQqWebhookAck', () => {
  it('returns OpCode 12 under common field aliases', () => {
    expect(buildQqWebhookAck()).toEqual({
      op: 12,
      opcode: 12,
      op_code: 12,
    });
  });
});
