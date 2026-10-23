import { describe, expect, it, vi } from 'vitest';

import { MemoryCacheStore } from '../cache/memory-cache-store.js';
import { createLogger } from '../lib/logger.js';

import { WorldstateService } from './worldstate-service.js';

/**
 * 构造带可注入 fetch 的 WorldstateService（官方 + 社区源共用同一 fetchImpl）。
 *
 * @param fetchImpl - mock fetch
 * @returns 服务实例
 */
function createService(fetchImpl: typeof fetch): WorldstateService {
  return new WorldstateService({
    cache: new MemoryCacheStore(),
    worldstateUrl: 'https://example.test/worldState.php',
    warframestatBaseUrl: 'https://example.test/stat',
    timeoutMs: 5_000,
    logger: createLogger('silent'),
    fetchImpl,
  });
}

describe('WorldstateService arbitration degrade', () => {
  it('keeps worldstate when arbitration community source fails', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('worldState.php')) {
        return Response.json({
          Time: Math.floor(Date.now() / 1000),
          Invasions: [],
          ActiveMissions: [],
        });
      }
      return new Response(JSON.stringify({ error: 'No such worldstate field' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as unknown as typeof fetch;

    const service = createService(fetchImpl);
    const result = await service.getWorldstate('international', 'zh');
    expect(result.data.arbitration).toBeNull();
    expect(result.data.cycles.length).toBeGreaterThan(0);
    expect(result.data.fissures).toEqual([]);
    expect(result.source).toBe('warframe-worldstate');
  });

  it('attaches mapped arbitration when community source succeeds', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes('worldState.php')) {
        return Response.json({
          Time: Math.floor(Date.now() / 1000),
          Invasions: [],
          ActiveMissions: [],
        });
      }
      return Response.json({
        nodeKey: 'SolNode64',
        node: 'Tessera (Venus)',
        type: 'Defense',
        typeKey: 'Defense',
        enemy: 'Corpus',
        activation: new Date(Date.now() - 60_000).toISOString(),
        expiry: new Date(Date.now() + 3_600_000).toISOString(),
        expired: false,
      });
    }) as unknown as typeof fetch;

    const service = createService(fetchImpl);
    const result = await service.getWorldstate('international', 'zh');
    expect(result.data.arbitration).not.toBeNull();
    expect(result.data.arbitration?.source).toBe('warframestat');
    expect(result.data.arbitration?.missionTypeKey).toBe('Defense');
  });
});
