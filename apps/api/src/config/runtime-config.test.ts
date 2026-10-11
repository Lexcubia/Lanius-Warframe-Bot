import { deepMerge } from '@lanius/config';
import { describe, expect, it } from 'vitest';

describe('deepMerge (via @lanius/config)', () => {
  it('merges nested objects and replaces arrays', () => {
    const merged = deepMerge(
      { a: 1, nested: { x: 1, y: 2 }, list: [1] },
      { nested: { y: 9 }, list: [2, 3] },
    );
    expect(merged).toEqual({
      a: 1,
      nested: { x: 1, y: 9 },
      list: [2, 3],
    });
  });
});
