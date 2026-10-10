import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifyQqCallback } from './verify.js';

describe('verifyQqCallback', () => {
  it('accepts a matching HMAC signature', () => {
    const appSecret = 'test-secret';
    const timestamp = '1710000000';
    const rawBody = '{"op":0}';
    const signature = createHmac('sha256', appSecret)
      .update(`${timestamp}${rawBody}`)
      .digest('hex');

    expect(
      verifyQqCallback(
        {
          rawBody,
          headers: {
            'x-signature-ed25519': signature,
            'x-signature-timestamp': timestamp,
          },
        },
        { appSecret },
      ),
    ).toBe(true);
  });

  it('rejects a mismatched signature', () => {
    expect(
      verifyQqCallback(
        {
          rawBody: '{}',
          headers: {
            'x-signature-ed25519': 'deadbeef',
            'x-signature-timestamp': '1',
          },
        },
        { appSecret: 'test-secret' },
      ),
    ).toBe(false);
  });
});
