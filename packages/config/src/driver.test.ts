import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ConfigDriver, resetConfigDriverForTests, SECRET_MASK } from './index.js';

/**
 * 构造临时 config 根。
 *
 * @returns configRoot
 */
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'lanius-cfg-'));
  mkdirSync(join(root, 'default'), { recursive: true });
  mkdirSync(join(root, 'local'), { recursive: true });
  writeFileSync(
    join(root, 'default', 'api.yaml'),
    "host: '127.0.0.1'\nport: 8787\nupstream:\n  timeoutMs: 8000\n",
  );
  writeFileSync(join(root, 'default', 'bot.yaml'), 'dryRun: true\n');
  writeFileSync(join(root, 'default', 'qq.yaml'), "appId: 'x'\nappSecret: 'y'\n");
  writeFileSync(join(root, 'default', 'admin.yaml'), "username: 'admin'\n");
  writeFileSync(join(root, 'default', 'redis.yaml'), "url: ''\n");
  writeFileSync(join(root, 'default', 'database.yaml'), "sqlitePath: 'data/t.sqlite'\n");
  writeFileSync(join(root, 'default', 'defaults.yaml'), 'realm: international\nlocale: zh\n');
  writeFileSync(join(root, 'default', 'web.yaml'), "apiBaseUrl: 'http://127.0.0.1:8787'\n");
  writeFileSync(join(root, 'default', 'site.yaml'), "footer:\n  copyright: ''\n  lines: []\n");
  writeFileSync(
    join(root, 'default', 'labels.yaml'),
    'factions: {}\nnodes: {}\npaths: {}\nweapons: {}\n',
  );
  writeFileSync(
    join(root, 'default', 'github.yaml'),
    "owner: 'o'\nrepo: 'r'\ndeployDir: '/tmp'\ncomposeFile: 'x.yml'\n",
  );
  return root;
}

describe('ConfigDriver', () => {
  it('merges local over default and masks secrets', () => {
    resetConfigDriverForTests();
    const configRoot = makeRoot();
    writeFileSync(
      join(configRoot, 'local', 'api.yaml'),
      "adminToken: 'secret-token'\nport: 9999\n",
    );
    const driver = new ConfigDriver({
      repoRoot: configRoot,
      configRoot,
      watchLocal: false,
    });
    expect(driver.get('api').port).toBe(9999);
    expect(driver.get('api').adminToken).toBe('secret-token');
    // bot.yaml 仅写 dryRun 时，回复形态/皮肤走 schema 默认（后台配置）
    expect(driver.get('bot').defaultReplyMode).toBe('image');
    expect(driver.get('bot').defaultCardSkin).toBe('light');
    const desc = driver.describe('api');
    expect(desc.data.adminToken).toBe(SECRET_MASK);
    expect(desc.restartRequired).toContain('port');
  });

  it('preserves secrets when saving mask', () => {
    resetConfigDriverForTests();
    const configRoot = makeRoot();
    writeFileSync(join(configRoot, 'local', 'api.yaml'), "adminToken: 'keep-me'\n");
    const driver = new ConfigDriver({
      repoRoot: configRoot,
      configRoot,
      watchLocal: false,
    });
    driver.save('api', { adminToken: SECRET_MASK, port: 8788 });
    expect(driver.get('api').adminToken).toBe('keep-me');
    expect(driver.get('api').port).toBe(8788);
  });
});
