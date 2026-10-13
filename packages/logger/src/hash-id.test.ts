import { describe, expect, it } from 'vitest';

import { hashLogId } from './hash-id.js';

describe('hashLogId', () => {
  it('returns empty marker for blank input', () => {
    expect(hashLogId('')).toBe('empty');
    expect(hashLogId('   ')).toBe('empty');
  });

  it('returns stable short fingerprint', () => {
    const a = hashLogId('group-openid-1');
    const b = hashLogId('group-openid-1');
    const c = hashLogId('group-openid-2');
    expect(a).toBe(b);
    expect(a).toMatch(/^h_[0-9a-f]{12}$/);
    expect(a).not.toBe(c);
    expect(a).not.toContain('group-openid');
  });
});
