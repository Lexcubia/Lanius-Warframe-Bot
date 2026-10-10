import { describe, expect, it } from 'vitest';

import { parsePublicQuery } from './query.js';

describe('parsePublicQuery', () => {
  it('applies MVP defaults when query is empty', () => {
    const query = parsePublicQuery({});
    expect(query).toEqual({ realm: 'international', locale: 'zh' });
  });

  it('accepts explicit valid realm and locale', () => {
    const query = parsePublicQuery({ realm: 'china', locale: 'en' });
    expect(query).toEqual({ realm: 'china', locale: 'en' });
  });

  it('rejects an unknown realm', () => {
    expect(() => parsePublicQuery({ realm: 'pc' })).toThrow();
  });
});
