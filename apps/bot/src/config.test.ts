import { afterEach, describe, expect, it } from 'vitest';

import { applyBotEnvOverrides, type BotConfig } from './config.js';

/**
 * 构造最小合法 Bot 配置供环境覆盖单测使用。
 *
 * @returns 解析形状的 BotConfig 样例
 */
function sampleConfig(): BotConfig {
  return {
    qq: {
      appId: 'id',
      appSecret: 'secret',
      callbackPath: '/qq/callback',
      panelIds: {},
    },
    bot: {
      host: '127.0.0.1',
      port: 8788,
      apiBaseUrl: 'http://127.0.0.1:8787',
      defaultReplyMode: 'text',
      dryRun: true,
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
