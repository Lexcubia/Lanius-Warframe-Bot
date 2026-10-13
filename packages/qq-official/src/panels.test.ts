import { describe, expect, it, vi } from 'vitest';

import { ensureQqGroupCommandPanel, reclaimOrphanPanels, syncQqCommandPanels } from './panels.js';

/**
 * 按 method+url 关键字匹配的假 fetch；token 请求自动放行。
 *
 * @param handlers - 顺序无关的路由表
 * @returns mock fetch
 */
function mockFetch(
  handlers: Array<{
    when: (method: string, url: string) => boolean;
    respond: () => { ok?: boolean; body: unknown };
  }>,
): typeof fetch {
  const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    if (url.includes('getAppAccessToken')) {
      const tokenBody = { access_token: 'tok', expires_in: 7200 };
      return {
        ok: true,
        json: async () => tokenBody,
        text: async () => JSON.stringify(tokenBody),
      };
    }
    const hit = handlers.find((row) => row.when(method, url));
    if (!hit) {
      throw new Error(`unexpected fetch ${method} ${url}`);
    }
    const { ok = true, body } = hit.respond();
    return { ok, text: async () => JSON.stringify(body) };
  });
  return fetchImpl as unknown as typeof fetch;
}

describe('toPanelItems via sync payload', () => {
  it('weighted-truncates long desc before POST body', async () => {
    let postedDesc: string | undefined;
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('getAppAccessToken')) {
        const tokenBody = { access_token: 'tok', expires_in: 7200 };
        return {
          ok: true,
          json: async () => tokenBody,
          text: async () => JSON.stringify(tokenBody),
        };
      }
      if (method === 'GET' && url.includes('scope=c2c')) {
        return {
          ok: true,
          text: async () => JSON.stringify({ code: 0, records: [], is_end: true }),
        };
      }
      if (method === 'POST' && url.includes('/v2/panels')) {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          panel?: { items?: Array<{ desc?: string }> };
        };
        postedDesc = body.panel?.items?.[0]?.desc;
        return {
          ok: true,
          text: async () => JSON.stringify({ code: 0, panel_id: 'p_new' }),
        };
      }
      throw new Error(`unexpected ${method} ${url}`);
    });

    await syncQqCommandPanels({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      items: [
        {
          name: '世界状态',
          desc: '查看开放世界周期（地球 / 平原 / 魔胎 / 山谷 / 双衍 / 扎里曼）',
        },
      ],
    });

    // 中文加权 2：30 上限约 15 汉字，不得整句原样上传
    expect(postedDesc).toBeDefined();
    expect(postedDesc!.length).toBeLessThan(
      '查看开放世界周期（地球 / 平原 / 魔胎 / 山谷 / 双衍 / 扎里曼）'.length,
    );
    let weight = 0;
    for (const ch of postedDesc!) {
      weight += /[\u4e00-\u9fff]/.test(ch) ? 2 : 1;
    }
    expect(weight).toBeLessThanOrEqual(30);
  });
});

describe('syncQqCommandPanels', () => {
  it('updates existing c2c panel instead of creating', async () => {
    const fetchImpl = mockFetch([
      {
        when: (m, u) => m === 'GET' && u.includes('scope=c2c'),
        respond: () => ({
          body: {
            code: 0,
            records: [
              {
                panel_id: 'p_c2c',
                scope: 'c2c',
                target_type: 'all',
                panel: { remark: 'other' },
              },
            ],
            is_end: true,
          },
        }),
      },
      {
        when: (m, u) => m === 'PUT' && u.includes('/v2/panels/p_c2c'),
        respond: () => ({ body: { code: 0 } }),
      },
    ]);

    const results = await syncQqCommandPanels({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl,
      items: [{ name: '/帮助', desc: '帮助' }],
    });

    expect(results[0]).toMatchObject({
      scope: 'c2c',
      panelId: 'p_c2c',
      action: 'updated',
    });
  });

  it('reclaims orphans then creates c2c when quota exceeded', async () => {
    let posted = 0;
    const deleted: string[] = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('getAppAccessToken')) {
        const tokenBody = { access_token: 'tok', expires_in: 7200 };
        return {
          ok: true,
          json: async () => tokenBody,
          text: async () => JSON.stringify(tokenBody),
        };
      }
      if (method === 'GET' && url.includes('scope=c2c')) {
        return {
          ok: true,
          text: async () => JSON.stringify({ code: 0, records: [], is_end: true }),
        };
      }
      if (method === 'GET' && url.includes('scope=group')) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              code: 0,
              records: [
                {
                  panel_id: 'p_junk1',
                  scope: 'group',
                  panel: { remark: 'junk' },
                },
              ],
              is_end: true,
            }),
        };
      }
      if (method === 'GET' && (url.includes('scope=channel') || url.includes('scope=dm'))) {
        return {
          ok: true,
          text: async () => JSON.stringify({ code: 0, records: [], is_end: true }),
        };
      }
      if (method === 'POST' && url.includes('/v2/panels')) {
        posted += 1;
        if (posted === 1) {
          return {
            ok: false,
            text: async () => JSON.stringify({ code: 30013, message: '超出数量限制' }),
          };
        }
        return {
          ok: true,
          text: async () => JSON.stringify({ code: 0, panel_id: 'p_new_c2c' }),
        };
      }
      if (method === 'DELETE') {
        deleted.push(url.split('/').pop() ?? '');
        return { ok: true, text: async () => '{}' };
      }
      throw new Error(`unexpected ${method} ${url}`);
    });

    const results = await syncQqCommandPanels({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      items: [{ name: '/帮助', desc: '帮助' }],
    });

    expect(results[0]).toMatchObject({
      scope: 'c2c',
      panelId: 'p_new_c2c',
      action: 'created',
    });
    expect(deleted).toContain('p_junk1');
    expect(posted).toBe(2);
  });
});

describe('ensureQqGroupCommandPanel', () => {
  it('reuses any existing group panel when remark mismatches', async () => {
    const fetchImpl = mockFetch([
      {
        when: (m, u) => m === 'GET' && u.includes('scope=group'),
        respond: () => ({
          body: {
            code: 0,
            records: [
              {
                panel_id: 'p_group',
                scope: 'group',
                target_type: 'specific',
                panel: { remark: 'legacy' },
              },
            ],
            is_end: true,
          },
        }),
      },
      {
        when: (m, u) => m === 'PUT' && u.includes('/v2/panels/p_group') && !u.includes('/target'),
        respond: () => ({ body: { code: 0 } }),
      },
      {
        when: (m, u) => m === 'PUT' && u.includes('/target'),
        respond: () => ({ body: { code: 0 } }),
      },
    ]);

    const result = await ensureQqGroupCommandPanel({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl,
      groupOpenid: 'G1',
      items: [{ name: '/帮助', desc: '帮助' }],
    });

    // 进程内 sharedGroupPanelId 可能被同文件其它用例占用 → bound；否则 updated。
    expect(result.scope).toBe('group');
    expect(result.panelId).toBeTruthy();
    expect(['updated', 'bound']).toContain(result.action);
  });

  it('force rebinds after in-process skip cache', async () => {
    let targetPuts = 0;
    const fetchImpl = mockFetch([
      {
        when: (m, u) => m === 'GET' && u.includes('scope=group'),
        respond: () => ({
          body: {
            code: 0,
            records: [
              {
                panel_id: 'p_force',
                scope: 'group',
                target_type: 'specific',
                panel: { remark: 'lanius-mvp-commands' },
              },
            ],
            is_end: true,
          },
        }),
      },
      {
        when: (m, u) => m === 'PUT' && u.includes('/v2/panels/') && !u.includes('/target'),
        respond: () => ({ body: { code: 0 } }),
      },
      {
        when: (m, u) => m === 'PUT' && u.includes('/target'),
        respond: () => {
          targetPuts += 1;
          return { body: { code: 0 } };
        },
      },
    ]);

    const first = await ensureQqGroupCommandPanel({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl,
      groupOpenid: 'G-force',
      items: [{ name: '/帮助', desc: '帮助' }],
    });
    expect(['updated', 'bound']).toContain(first.action);
    const putsAfterFirst = targetPuts;
    expect(putsAfterFirst).toBeGreaterThanOrEqual(1);

    const skipped = await ensureQqGroupCommandPanel({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl,
      groupOpenid: 'G-force',
      items: [{ name: '/帮助', desc: '帮助' }],
    });
    expect(skipped.action).toBe('skipped');
    expect(targetPuts).toBe(putsAfterFirst);

    const forced = await ensureQqGroupCommandPanel({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl,
      groupOpenid: 'G-force',
      force: true,
      items: [{ name: '/帮助', desc: '帮助' }],
    });
    expect(['bound', 'updated']).toContain(forced.action);
    expect(targetPuts).toBeGreaterThan(putsAfterFirst);
  });
});

describe('reclaimOrphanPanels', () => {
  it('keeps one lanius panel per scope and deletes the rest', async () => {
    const deleted: string[] = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('getAppAccessToken')) {
        const tokenBody = { access_token: 'tok', expires_in: 7200 };
        return {
          ok: true,
          json: async () => tokenBody,
          text: async () => JSON.stringify(tokenBody),
        };
      }
      if (method === 'GET' && url.includes('scope=c2c')) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              code: 0,
              records: [
                {
                  panel_id: 'p_c2c_keep',
                  scope: 'c2c',
                  panel: { remark: 'lanius-mvp-commands' },
                },
                {
                  panel_id: 'p_c2c_extra',
                  scope: 'c2c',
                  panel: { remark: 'lanius-mvp-commands' },
                },
              ],
              is_end: true,
            }),
        };
      }
      if (method === 'GET' && url.includes('scope=group')) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              code: 0,
              records: [
                {
                  panel_id: 'p_group_keep',
                  scope: 'group',
                  panel: { remark: 'lanius-mvp-commands' },
                },
                {
                  panel_id: 'p_group_junk',
                  scope: 'group',
                  panel: { remark: 'junk' },
                },
              ],
              is_end: true,
            }),
        };
      }
      if (method === 'GET') {
        return {
          ok: true,
          text: async () => JSON.stringify({ code: 0, records: [], is_end: true }),
        };
      }
      if (method === 'DELETE') {
        deleted.push(url.split('/').pop() ?? '');
        return { ok: true, text: async () => '{}' };
      }
      throw new Error(`unexpected ${method} ${url}`);
    });

    const count = await reclaimOrphanPanels({
      appId: 'app',
      appSecret: 'secret',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(count).toBe(2);
    expect(deleted.sort()).toEqual(['p_c2c_extra', 'p_group_junk'].sort());
  });
});
