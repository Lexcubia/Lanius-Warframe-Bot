import { describe, expect, it } from 'vitest';

import { parseQqSendFailure } from './parse-send-failure.js';

describe('parseQqSendFailure', () => {
  it('detects passive window errors', () => {
    const parsed = parseQqSendFailure(
      'QQ OpenAPI POST /v2/groups/x/messages failed: HTTP 400 code=40034128 message=被动回复时间或次数超限',
    );
    expect(parsed.code).toBe('40034128');
    expect(parsed.passiveWindowExceeded).toBe(true);
    expect(parsed.rateLimited).toBe(false);
  });

  it('detects rate limit hints', () => {
    const parsed = parseQqSendFailure(
      'QQ OpenAPI POST failed: HTTP 429 code=11264 message=rate limit=20',
    );
    expect(parsed.code).toBe('11264');
    expect(parsed.rateLimited).toBe(true);
  });

  it('handles empty detail', () => {
    expect(parseQqSendFailure(undefined)).toEqual({
      code: undefined,
      passiveWindowExceeded: false,
      rateLimited: false,
      summary: 'unknown',
    });
  });
});
