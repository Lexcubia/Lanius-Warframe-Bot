import {
  DispositionDtoSchema,
  DucatJunkDtoSchema,
  DucatJunkQuerySchema,
  LichAuctionsDtoSchema,
  LichAuctionsQuerySchema,
  MarketRankDtoSchema,
  MarketRankQuerySchema,
  MarketTrendDtoSchema,
  MarketTrendQuerySchema,
  OpenRelicDtoSchema,
  PartsDtoSchema,
  RelicQueryDtoSchema,
  RivenAnalysisDtoSchema,
  RivenAnalysisQuerySchema,
  RivenRangesDtoSchema,
  RivenSpliceDtoSchema,
} from '@lanius/core';
import { Hono } from 'hono';

import type { AppVariables } from '../app-context.js';
import type { AppContext } from '../app-context.js';
import { writeAuditEvent } from '../db/repositories.js';
import { successWithMeta } from '../lib/build-meta.js';
import { validationError } from '../lib/http-error.js';
import { assertModuleAllowed } from '../services/module-gate.js';

/**
 * 从查询串解析 scene / target / user。
 *
 * @param c - Hono 上下文查询
 * @returns 门禁上下文
 */
function gateFromQuery(c: { req: { query: (k: string) => string | undefined } }) {
  return {
    scene: (c.req.query('scene') as 'group' | 'c2c' | 'web') || 'web',
    targetId: c.req.query('targetId') ?? 'public',
    userId: c.req.query('userId') ?? '',
  };
}

/**
 * Wave 2 市场 / 紫卡工具 / 遗物路由。
 *
 * @returns Hono 子应用
 */
export function wave2Routes() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.get('/market/trend', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const parsed = MarketTrendQuerySchema.safeParse({ q: c.req.query('q') });
    if (!parsed.success) {
      throw validationError('invalid market trend query', { issues: parsed.error.flatten() });
    }
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'marketTrend' });
      const data = MarketTrendDtoSchema.parse(
        await ctx.marketWave2Service.getTrend(parsed.data.q),
      );
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'marketTrend',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'warframe-market',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'marketTrend',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/market/rank', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const parsed = MarketRankQuerySchema.safeParse({
      category: c.req.query('category') ?? undefined,
      page: c.req.query('page') ?? undefined,
      pageSize: c.req.query('pageSize') ?? undefined,
    });
    if (!parsed.success) {
      throw validationError('invalid market rank query', { issues: parsed.error.flatten() });
    }
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'marketRank' });
      const data = MarketRankDtoSchema.parse(
        await ctx.marketWave2Service.getRank(
          parsed.data.category,
          parsed.data.page,
          parsed.data.pageSize,
        ),
      );
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'marketRank',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'warframe-market',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'marketRank',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/market/ducats', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const parsed = DucatJunkQuerySchema.safeParse({
      tier: c.req.query('tier') ?? undefined,
      page: c.req.query('page') ?? undefined,
      pageSize: c.req.query('pageSize') ?? undefined,
    });
    if (!parsed.success) {
      throw validationError('invalid ducats query', { issues: parsed.error.flatten() });
    }
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'ducats' });
      const data = DucatJunkDtoSchema.parse(
        await ctx.marketWave2Service.getDucatJunk(
          parsed.data.tier,
          parsed.data.page,
          parsed.data.pageSize,
        ),
      );
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'ducats',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'warframe-market',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'ducats',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/riven/analysis', async (c) => {
    return handleRivenAnalysis(c, 'GET');
  });

  app.post('/riven/analysis', async (c) => {
    return handleRivenAnalysis(c, 'POST');
  });

  app.get('/riven/ranges', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const q = c.req.query('q') ?? '';
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'rivenRanges' });
      const data = RivenRangesDtoSchema.parse(await ctx.rivenToolsService.getRanges(q));
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'rivenRanges',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'lanius-riven-tables',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'rivenRanges',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/riven/splice', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const q = c.req.query('q') ?? '';
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'rivenSplice' });
      const data = RivenSpliceDtoSchema.parse(ctx.rivenToolsService.getSplice(q));
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'rivenSplice',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'lanius-riven-tables',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'rivenSplice',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/riven/disposition', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const q = c.req.query('q') ?? '';
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'disposition' });
      const data = DispositionDtoSchema.parse(await ctx.rivenToolsService.getDisposition(q));
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'disposition',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'disposition-wiki-mirror',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'disposition',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/lich', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const parsed = LichAuctionsQuerySchema.safeParse({
      q: c.req.query('q'),
      element: c.req.query('element') ?? undefined,
      damageMax: c.req.query('damageMax') ?? undefined,
      page: c.req.query('page') ?? undefined,
      pageSize: c.req.query('pageSize') ?? undefined,
    });
    if (!parsed.success) {
      throw validationError('invalid lich query', { issues: parsed.error.flatten() });
    }
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'lichAuctions' });
      const data = LichAuctionsDtoSchema.parse(
        await ctx.rivenToolsService.getLichAuctions({
          query: parsed.data.q,
          element: parsed.data.element,
          damageMax: parsed.data.damageMax,
          page: parsed.data.page,
          pageSize: parsed.data.pageSize,
        }),
      );
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'lichAuctions',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'warframe-market',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'lichAuctions',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/relic', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const q = c.req.query('q') ?? '';
    const page = Number(c.req.query('page') ?? '1');
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'relic' });
      const data = RelicQueryDtoSchema.parse(ctx.relicService.getRelic(q, page));
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'relic',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'bundled-relic-index',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'relic',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/parts', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    const q = c.req.query('q') ?? '';
    const page = Number(c.req.query('page') ?? '1');
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'parts' });
      const data = PartsDtoSchema.parse(ctx.relicService.getParts(q, page));
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'parts',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'bundled-relic-inverse',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'parts',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  app.get('/open-relic', async (c) => {
    const started = Date.now();
    const ctx = c.get('app');
    const gate = gateFromQuery(c);
    try {
      assertModuleAllowed(ctx.db, { ...gate, moduleId: 'openRelic' });
      const data = OpenRelicDtoSchema.parse(await ctx.relicService.getOpenRelic());
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'openRelic',
        outcome: 'ok',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
      });
      return c.json(
        successWithMeta(data, {
          realm: ctx.config.defaults.realm,
          locale: ctx.config.defaults.locale,
          cached: false,
          source: 'worldstate+relic',
        }),
      );
    } catch (error) {
      writeAuditEvent(ctx.db, {
        ...gate,
        moduleId: 'openRelic',
        outcome: 'error',
        latencyMs: Date.now() - started,
        requestId: c.get('requestId'),
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });

  return app;
}

/**
 * 处理紫卡分析 GET/POST。
 *
 * @param c - Hono 上下文
 * @param method - 方法
 * @returns JSON 响应
 */
async function handleRivenAnalysis(
  c: {
    get: (k: 'app' | 'requestId') => unknown;
    req: {
      query: (k: string) => string | undefined;
      json: () => Promise<unknown>;
    };
    json: (body: unknown) => Response;
  },
  method: 'GET' | 'POST',
) {
  const started = Date.now();
  const ctx = c.get('app') as AppContext;
  const gate = gateFromQuery(c);
  let body: unknown = {};
  if (method === 'POST') {
    body = await c.req.json().catch(() => ({}));
  } else {
    const linesRaw = c.req.query('lines');
    body = {
      text: c.req.query('text') ?? c.req.query('q') ?? undefined,
      lines: linesRaw ? linesRaw.split(/\n|\|/).map((s) => s.trim()).filter(Boolean) : undefined,
      disposition: c.req.query('disposition') ?? undefined,
      cls: c.req.query('cls') ?? undefined,
    };
  }
  const parsed = RivenAnalysisQuerySchema.safeParse(body);
  if (!parsed.success) {
    throw validationError('invalid riven analysis body', { issues: parsed.error.flatten() });
  }
  try {
    assertModuleAllowed(ctx.db, { ...gate, moduleId: 'rivenAnalysis' });
    const data = RivenAnalysisDtoSchema.parse(
      await ctx.rivenToolsService.analyze({
        text: parsed.data.text,
        lines: parsed.data.lines,
        disposition: parsed.data.disposition,
        cls: parsed.data.cls,
      }),
    );
    writeAuditEvent(ctx.db, {
      ...gate,
      moduleId: 'rivenAnalysis',
      outcome: 'ok',
      latencyMs: Date.now() - started,
      requestId: c.get('requestId') as string,
    });
    return c.json(
      successWithMeta(data, {
        realm: ctx.config.defaults.realm,
        locale: ctx.config.defaults.locale,
        cached: false,
        source: 'lanius-riven-analysis',
      }),
    );
  } catch (error) {
    writeAuditEvent(ctx.db, {
      ...gate,
      moduleId: 'rivenAnalysis',
      outcome: 'error',
      latencyMs: Date.now() - started,
      requestId: c.get('requestId') as string,
      detail: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
