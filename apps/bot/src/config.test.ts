import { afterEach, describe, expect, it } from 'vitest';

import { applyBotEnvOverrides, type BotConfig } from './config.js';

/**
 * 构造最小 Bot 配置。
 *
 * @returns BotConfig
 */
function sampleConfig(): BotConfig {
  return {
    qq: {
      appId: 'id',
      appSecret: 'secret',
      callbackPath: '/qq/callback',
      panelIds: {},
    },
    api: { adminToken: 't' },
    bot: {
      host: '127.0.0.1',
      port: 8788,
      apiBaseUrl: 'http://127.0.0.1:8787',
      defaultReplyMode: 'text',
      dryRun: true,
      pushIntervalMs: 60_000,
      commandPrefix: '/',
      commandPrefixPolicy: 'optional',
      image: {
        maxPerUserPerMinute: 5,
        renderTimeoutMs: 4000,
      },
    },
    defaults: {
      realm: 'international',
      locale: 'zh',
    },
  };
}

describe('applyBotEnvOverrides', () => {
  afterEach(() => {
    delete process.env.LANIUS_API_BASE;
    delete process.env.PUBLIC_SITE_BASE_URL;
  });

  it('overrides api and site base from env', () => {
    process.env.LANIUS_API_BASE = 'http://api:8787';
    process.env.PUBLIC_SITE_BASE_URL = 'https://warframe.example.com';
    const next = applyBotEnvOverrides(sampleConfig());
    expect(next.bot.apiBaseUrl).toBe('http://api:8787');
    expect(next.bot.publicSiteBaseUrl).toBe('https://warframe.example.com');
  });

  it('leaves yaml values when env absent', () => {
    const next = applyBotEnvOverrides(sampleConfig());
    expect(next.bot.apiBaseUrl).toBe('http://127.0.0.1:8787');
    expect(next.bot.publicSiteBaseUrl).toBeUndefined();
  });
});
