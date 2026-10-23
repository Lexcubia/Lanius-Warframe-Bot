import { ConfigDriver, resetConfigDriverForTests } from '@lanius/config';
import type { WorldstateDto } from '@lanius/core';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MemoryCacheStore } from './cache/memory-cache-store.js';
import { createApp } from './create-app.js';
import type { AppConfig } from './config/schema.js';
import { openLaniusDb } from './db/client.js';
import { seedDatabaseIfEmpty } from './db/seed.js';
import { createLogger } from './lib/logger.js';
import { MarketService } from './services/market-service.js';
import { PushService } from './services/push-service.js';
import { RivenService } from './services/riven-service.js';
import { RotationService } from './services/rotation-service.js';
import { TraderService } from './services/trader-service.js';
import { WorldstateService } from './services/worldstate-service.js';

/**
 * 最小 API 配置。
 *
 * @returns AppConfig
 */
function testConfig(): AppConfig {
  return {
    qq: {
      appId: 'x',
      appSecret: 'y',
      callbackPath: '/qq/callback',
      panelIds: {},
    },
    admin: { username: 'admin' },
    api: {
      host: '127.0.0.1',
      port: 8787,
      upstream: {
        worldstateUrl: 'https://example.test/worldState.php',
        warframeMarketUrl: 'https://api.warframe.market/v2',
        timeoutMs: 1000,
      },
    },
    redis: { url: '' },
    database: { sqlitePath: ':memory:' },
    defaults: {
      realm: 'international',
      locale: 'zh',
      qqReplyMode: 'text',
    },
  };
}

/**
 * 临时配置根（供 ConfigDriver）。
 *
 * @returns configRoot
 */
function makeConfigRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'lanius-api-test-'));
  mkdirSync(join(root, 'default'), { recursive: true });
  mkdirSync(join(root, 'local'), { recursive: true });
  const files: Record<string, string> = {
    'api.yaml': "host: '127.0.0.1'\nport: 8787\n",
    'bot.yaml': 'dryRun: true\n',
    'qq.yaml': "appId: 'x'\nappSecret: 'y'\n",
    'admin.yaml': "username: 'admin'\n",
    'redis.yaml': "url: ''\n",
    'database.yaml': "sqlitePath: ':memory:'\n",
    'defaults.yaml': 'realm: international\nlocale: zh\n',
    'web.yaml': "apiBaseUrl: 'http://127.0.0.1:8787'\n",
    'site.yaml':
      "footer:\n  copyright: 'Test'\n  lines:\n    - text: '粤ICP备测试号'\n      href: 'https://beian.miit.gov.cn/'\n",
    'labels.yaml': 'factions: {}\nnodes: {}\npaths: {}\n',
    'github.yaml': "owner: 'o'\nrepo: 'r'\ndeployDir: '/tmp'\ncomposeFile: 'x.yml'\n",
  };
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(root, 'default', name), body);
  }
  return root;
}

/**
 * 创建测试应用。
 *
 * @param upstreamBody - 上游 JSON
 * @returns Hono app
 */
function createTestApp(upstreamBody: unknown) {
  const logger = createLogger('silent');
  const cache = new MemoryCacheStore();
  const db = openLaniusDb(':memory:');
  seedDatabaseIfEmpty(db);
  const fetchImpl = vi.fn(
    async () =>
      new Response(JSON.stringify(upstreamBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  ) as unknown as typeof fetch;

  const worldstateService = new WorldstateService({
    cache,
    worldstateUrl: 'https://example.test/worldState.php',
    timeoutMs: 1000,
    logger,
    fetchImpl,
  });
  const traderService = new TraderService({ worldstateService });
  const rotationService = new RotationService({ db });
  const pushService = new PushService({
    db,
    worldstateService,
    traderService,
    rotationService,
    realm: 'international',
    locale: 'zh',
  });
  const configRoot = makeConfigRoot();
  const configDriver = new ConfigDriver({
    repoRoot: configRoot,
    configRoot,
    watchLocal: false,
  });

  return createApp({
    config: testConfig(),
    configDriver,
    logger,
    startedAtMs: Date.now() - 5_000,
    cache,
    db,
    worldstateService,
    marketService: new MarketService({ cache }),
    rivenService: new RivenService({ cache }),
    traderService,
    rotationService,
    pushService,
    site: configDriver.get('site'),
    version: '0.0.0-test',
  });
}

/**
 * @param response - Response
 * @returns JSON
 */
async function readJson(response: Response): Promise<Record<string, any>> {
  return (await response.json()) as Record<string, any>;
}

afterEach(() => {
  resetConfigDriverForTests();
});

describe('createApp routes', () => {
  it('returns site footer from runtime config', async () => {
    const app = createTestApp({});
    const response = await app.request('/v1/site');
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.ok).toBe(true);
    expect(body.data.footer.lines[0].text).toContain('ICP');
  });

  it('returns health envelope', async () => {
    const app = createTestApp({});
    const response = await app.request('/v1/health');
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.uptimeSec).toBeGreaterThanOrEqual(0);
  });

  it('returns help with market and riven modules', async () => {
    const app = createTestApp({});
    const response = await app.request('/v1/help');
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.ok).toBe(true);
    const ids = body.data.lines.map((line: { id: string }) => line.id);
    expect(ids).toContain('market');
    expect(ids).toContain('riven');
  });

  it('returns help module detail', async () => {
    const app = createTestApp({});
    const response = await app.request('/v1/help?module=zk');
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.ok).toBe(true);
    expect(body.data.lines).toHaveLength(1);
    expect(body.data.lines[0].id).toBe('riven');
  });
});

void (0 as unknown as WorldstateDto);
