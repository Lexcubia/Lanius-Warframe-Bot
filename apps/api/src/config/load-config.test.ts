import { describe, expect, it } from 'vitest';

import { loadAppConfig } from './load-config.js';

describe('loadAppConfig', () => {
  it('loads modular config from repo config/', () => {
    const config = loadAppConfig(process.cwd().includes('apps/api')
      ? `${process.cwd()}/../..`
      : process.cwd());
    expect(config.api.port).toBeGreaterThan(0);
    expect(config.defaults.realm).toBe('international');
  });
});
