import { describe, expect, it, vi } from 'vitest';

import {
  fetchWarframestatArbitration,
  normalizeWarframestatArbitration,
} from './warframestat-arbitration.js';

describe('fetchWarframestatArbitration', () => {
  it('parses a successful JSON body', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        nodeKey: 'SolNode10',
        type: 'Survival',
        typeKey: 'Survival',
        enemy: 'Grineer',
        activation: '2026-10-23T09:00:00.000Z',
        expiry: '2026-10-23T10:00:00.000Z',
        expired: false,
      }),
    );
    const raw = await fetchWarframestatArbitration({
      baseUrl: 'https://example.test',
      timeoutMs: 5_000,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.test/pc/arbitration',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(raw.nodeKey).toBe('SolNode10');
    expect(raw.enemy).toBe('Grineer');
  });

  it('throws on non-OK HTTP (caller must degrade)', async () => {
    const fetchImpl = vi.fn(async () => new Response('missing', { status: 404 }));
    await expect(
      fetchWarframestatArbitration({
        baseUrl: 'https://example.test',
        timeoutMs: 5_000,
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/HTTP 404/);
  });
});

describe('normalizeWarframestatArbitration', () => {
  it('keeps known fields and drops empties', () => {
    expect(
      normalizeWarframestatArbitration({
        nodeKey: 'SolNode1',
        node: '',
        type: 'Defense',
        expired: false,
      }),
    ).toEqual({
      nodeKey: 'SolNode1',
      type: 'Defense',
      expired: false,
    });
  });
});
