import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadAppConfig, resolveConfigPath } from './load-config.js';

describe('resolveConfigPath', () => {
  it('prefers LANIUS_CONFIG override when set', () => {
    const previous = process.env.LANIUS_CONFIG;
    // 使用当前平台绝对路径，保证 Linux CI 与 Windows 本地一致
    const overridePath = resolve('/custom', 'config.yaml');
    const cwd = resolve('/repo');
    process.env.LANIUS_CONFIG = overridePath;
    try {
      expect(resolveConfigPath(cwd, () => false)).toBe(overridePath);
    } finally {
      if (previous === undefined) {
        delete process.env.LANIUS_CONFIG;
      } else {
        process.env.LANIUS_CONFIG = previous;
      }
    }
  });

  it('falls back to config.example.yaml when local is missing', () => {
    const previous = process.env.LANIUS_CONFIG;
    delete process.env.LANIUS_CONFIG;
    try {
      const path = resolveConfigPath('/repo', (candidate) =>
        candidate.endsWith('config.example.yaml'),
      );
      // path.resolve('/repo', ...) is platform-specific (e.g. E:\repo on Windows).
      expect(path.replace(/\\/g, '/').endsWith('/repo/config.example.yaml')).toBe(true);
    } finally {
      if (previous === undefined) {
        delete process.env.LANIUS_CONFIG;
      } else {
        process.env.LANIUS_CONFIG = previous;
      }
    }
  });
});

describe('loadAppConfig', () => {
  it('loads yaml from a temporary directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lanius-config-'));
    writeFileSync(
      join(dir, 'config.local.yaml'),
      `
api:
  host: 127.0.0.1
  port: 8799
  upstream:
    worldstateUrl: https://example.test/ws
    timeoutMs: 1234
defaults:
  realm: international
  locale: en
`,
      'utf8',
    );

    const previous = process.env.LANIUS_CONFIG;
    process.env.LANIUS_CONFIG = join(dir, 'config.local.yaml');
    try {
      const config = loadAppConfig(dir);
      expect(config.api.port).toBe(8799);
      expect(config.api.upstream.timeoutMs).toBe(1234);
      expect(config.defaults.locale).toBe('en');
    } finally {
      if (previous === undefined) {
        delete process.env.LANIUS_CONFIG;
      } else {
        process.env.LANIUS_CONFIG = previous;
      }
    }
  });
});
