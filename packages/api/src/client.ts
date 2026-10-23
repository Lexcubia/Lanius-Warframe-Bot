import {
  FailureEnvelopeSchema,
  HealthDtoSchema,
  HelpDtoSchema,
  MarketOrdersDtoSchema,
  MetaDtoSchema,
  PushDispatchDtoSchema,
  RivenOrdersDtoSchema,
  SiteDtoSchema,
  SubscriptionDtoSchema,
  VarziaDtoSchema,
  VoidTraderDtoSchema,
  WeaponRotationDtoSchema,
  WorldstateDtoSchema,
  type ApiEnvelope,
  type HealthDto,
  type HelpDto,
  type Locale,
  type MarketOrdersDto,
  type MetaDto,
  type PushDispatchDto,
  type PushFrequency,
  type Realm,
  type RivenOrdersDto,
  type SiteDto,
  type SubscribableModuleId,
  type SubscriptionDto,
  type VarziaDto,
  type VoidTraderDto,
  type WeaponRotationDto,
  type WorldstateDto,
} from '@lanius/core';
import { z } from 'zod';

/**
 * Options for constructing a Lanius HTTP API client.
 */
export type LaniusApiClientOptions = {
  /** Absolute API origin including scheme/host/port, without trailing slash preference. */
  baseUrl: string;
  /** Injectable fetch implementation (defaults to global `fetch`). */
  fetchImpl?: typeof fetch;
  /** 内部写操作 Bearer（订阅 / 推送 tick）；对应 api.adminToken */
  adminToken?: string;
};

/**
 * Optional query parameters shared by public GET endpoints.
 */
export type PublicQueryInput = {
  realm?: Realm;
  locale?: Locale;
};

/**
 * Error thrown when the API returns a failure envelope or unexpected payload.
 */
export class LaniusApiClientError extends Error {
  readonly status: number;
  readonly body: unknown;

  /**
   * Creates a client-side API error.
   *
   * @param message - Human-readable summary.
   * @param status - HTTP status from the response.
   * @param body - Parsed response body when available.
   */
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'LaniusApiClientError';
    this.status = status;
    this.body = body;
  }
}

/**
 * 面向 Lanius `/v1` 公开端点的薄 fetch 客户端（仅请求配置的 `baseUrl`）。
 */
export class LaniusApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly adminToken?: string;

  /**
   * Creates a client bound to a Lanius API base URL.
   *
   * @param options - `baseUrl` and optional injectable `fetch`.
   */
  constructor(options: LaniusApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    // 浏览器原生 fetch 作为方法引用会丢 `this`，触发 Illegal invocation；须 bind。
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.adminToken = options.adminToken;
  }

  /**
   * Calls `GET /v1/health`.
   *
   * @returns Parsed success or failure envelope for health.
   * @throws LaniusApiClientError when the response is not JSON or fails schema checks.
   */
  async getHealth(): Promise<ApiEnvelope<HealthDto>> {
    return this.getJson('/v1/health', HealthDtoSchema);
  }

  /**
   * Calls `GET /v1/meta`.
   *
   * @returns Parsed success or failure envelope for meta.
   * @throws LaniusApiClientError when the response is not JSON or fails schema checks.
   */
  async getMeta(): Promise<ApiEnvelope<MetaDto>> {
    return this.getJson('/v1/meta', MetaDtoSchema);
  }

  /**
   * 调用 `GET /v1/help`，可选模块详解。
   *
   * @param moduleToken - 模块 id 或根命令（如 `zk`）
   * @returns 帮助包络
   * @throws LaniusApiClientError 当响应非 JSON 或 schema 校验失败时抛出
   */
  async getHelp(moduleToken?: string): Promise<ApiEnvelope<HelpDto>> {
    const suffix = moduleToken ? `?module=${encodeURIComponent(moduleToken)}` : '';
    return this.getJson(`/v1/help${suffix}`, HelpDtoSchema);
  }

  /**
   * 调用 `GET /v1/market/items`（单目标在线卖单分页）。
   *
   * @param input - 关键词与可选 page / modRank
   * @param context - 可选场景 ACL 上下文
   * @returns 市场卖单包络
   */
  async getMarketItems(
    input: string | MarketOrdersClientQuery,
    context: { scene?: string; targetId?: string; userId?: string } = {},
  ): Promise<ApiEnvelope<MarketOrdersDto>> {
    const query = typeof input === 'string' ? { q: input } : input;
    const params = new URLSearchParams({ q: query.q });
    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.pageSize !== undefined) {
      params.set('pageSize', String(query.pageSize));
    }
    if (query.modRank !== undefined) {
      params.set('modRank', String(query.modRank));
    }
    if (context.scene) params.set('scene', context.scene);
    if (context.targetId) params.set('targetId', context.targetId);
    if (context.userId) params.set('userId', context.userId);
    return this.getJson(`/v1/market/items?${params}`, MarketOrdersDtoSchema);
  }

  /**
   * 调用 `GET /v1/riven`（单武器在线拍卖分页）。
   *
   * @param input - 武器名与可选筛选/分页
   * @param context - 可选场景 ACL 上下文
   * @returns 紫卡拍卖包络
   */
  async getRiven(
    input: string | RivenOrdersClientQuery,
    context: { scene?: string; targetId?: string; userId?: string } = {},
  ): Promise<ApiEnvelope<RivenOrdersDto>> {
    const query = typeof input === 'string' ? { q: input } : input;
    const params = new URLSearchParams({ q: query.q });
    if (query.page !== undefined) params.set('page', String(query.page));
    if (query.pageSize !== undefined) {
      params.set('pageSize', String(query.pageSize));
    }
    if (query.rank !== undefined) params.set('rank', String(query.rank));
    if (query.mastery !== undefined) {
      params.set('mastery', String(query.mastery));
    }
    if (query.minRerolls !== undefined) {
      params.set('minRerolls', String(query.minRerolls));
    }
    if (query.maxRerolls !== undefined) {
      params.set('maxRerolls', String(query.maxRerolls));
    }
    if (context.scene) params.set('scene', context.scene);
    if (context.targetId) params.set('targetId', context.targetId);
    if (context.userId) params.set('userId', context.userId);
    return this.getJson(`/v1/riven?${params}`, RivenOrdersDtoSchema);
  }

  /**
   * 调用 `GET /v1/site`（页脚备案等公开站点配置）。
   *
   * @returns 站点配置包络
   * @throws LaniusApiClientError 当响应非 JSON 或 schema 校验失败时抛出
   */
  async getSite(): Promise<ApiEnvelope<SiteDto>> {
    return this.getJson('/v1/site', SiteDtoSchema);
  }

  /**
   * Calls `GET /v1/worldstate` with optional realm/locale.
   *
   * @param query - Optional public query parameters.
   * @returns Parsed success or failure envelope for worldstate.
   * @throws LaniusApiClientError when the response is not JSON or fails schema checks.
   */
  async getWorldstate(query: PublicQueryInput = {}): Promise<ApiEnvelope<WorldstateDto>> {
    const params = new URLSearchParams();
    if (query.realm) {
      params.set('realm', query.realm);
    }
    if (query.locale) {
      params.set('locale', query.locale);
    }
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return this.getJson(`/v1/worldstate${suffix}`, WorldstateDtoSchema);
  }

  /**
   * 调用 `GET /v1/void-trader`。
   *
   * @param query - realm/locale
   * @param context - 可选 ACL 上下文
   * @returns 虚空商人包络
   */
  async getVoidTrader(
    query: PublicQueryInput = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<VoidTraderDto>> {
    return this.getJson(`/v1/void-trader${buildQuery(query, context)}`, VoidTraderDtoSchema);
  }

  /**
   * 调用 `GET /v1/varzia`。
   *
   * @param query - realm/locale
   * @param context - 可选 ACL 上下文
   * @returns 瓦奇娅包络
   */
  async getVarzia(
    query: PublicQueryInput = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<VarziaDto>> {
    return this.getJson(`/v1/varzia${buildQuery(query, context)}`, VarziaDtoSchema);
  }

  /**
   * 调用 `GET /v1/rotations/tenet` 或 `/coda`。
   *
   * @param kind - tenet | coda
   * @param query - realm/locale
   * @param context - 可选 ACL 上下文
   * @returns 轮换包络
   */
  async getWeaponRotation(
    kind: 'tenet' | 'coda',
    query: PublicQueryInput = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<WeaponRotationDto>> {
    return this.getJson(
      `/v1/rotations/${kind}${buildQuery(query, context)}`,
      WeaponRotationDtoSchema,
    );
  }

  /**
   * 列出某场景订阅（需 adminToken）。
   *
   * @param scene - group | c2c
   * @param targetId - 目标 openid
   * @returns 订阅列表包络
   */
  async listSubscriptions(
    scene: 'group' | 'c2c',
    targetId: string,
  ): Promise<ApiEnvelope<{ subscriptions: SubscriptionDto[] }>> {
    const params = new URLSearchParams({ scene, targetId });
    return this.getJson(
      `/v1/subscriptions?${params}`,
      z.object({ subscriptions: z.array(SubscriptionDtoSchema) }),
      { auth: true },
    );
  }

  /**
   * 创建/更新订阅（需 adminToken）。
   *
   * @param input - 订阅字段
   * @returns 订阅包络
   */
  async upsertSubscription(input: {
    scene: 'group' | 'c2c';
    targetId: string;
    moduleId: SubscribableModuleId;
    frequency: PushFrequency;
    userId?: string;
  }): Promise<ApiEnvelope<{ subscription: SubscriptionDto }>> {
    return this.postJson(
      '/v1/subscriptions',
      input,
      z.object({ subscription: SubscriptionDtoSchema }),
    );
  }

  /**
   * 关闭订阅（需 adminToken）。
   *
   * @param input - 场景与模块
   * @returns ok 包络
   */
  async disableSubscription(input: {
    scene: 'group' | 'c2c';
    targetId: string;
    moduleId: SubscribableModuleId;
  }): Promise<ApiEnvelope<{ ok: boolean }>> {
    return this.postJson('/v1/subscriptions/disable', input, z.object({ ok: z.boolean() }));
  }

  /**
   * 拉取到期推送（需 adminToken）。
   *
   * @returns dispatches + fingerprints
   */
  async pushTick(): Promise<
    ApiEnvelope<{
      dispatches: PushDispatchDto[];
      fingerprints: Record<string, string>;
    }>
  > {
    return this.postJson(
      '/v1/push/tick',
      {},
      z.object({
        dispatches: z.array(PushDispatchDtoSchema),
        fingerprints: z.record(z.string()),
      }),
    );
  }

  /**
   * 确认推送已发送（需 adminToken）。
   *
   * @param subscriptionId - 订阅 id
   * @param fingerprint - 内容指纹
   * @returns ok 包络
   */
  async pushAck(
    subscriptionId: number,
    fingerprint: string,
  ): Promise<ApiEnvelope<{ ok: boolean }>> {
    return this.postJson(
      '/v1/push/ack',
      { subscriptionId, fingerprint },
      z.object({ ok: z.boolean() }),
    );
  }

  /**
   * Performs a GET and parses a Lanius envelope for the given data schema.
   *
   * @param path - Absolute path beginning with `/v1`.
   * @param dataSchema - Zod schema for the success `data` field.
   * @param options - 可选鉴权
   * @returns Typed API envelope.
   * @throws LaniusApiClientError on non-JSON or schema mismatch.
   */
  private async getJson<T>(
    path: string,
    // 第三泛参为 unknown：带 .default() 的 schema 以输出类型作为 T
    dataSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
    options: { auth?: boolean } = {},
  ): Promise<ApiEnvelope<T>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.auth && this.adminToken) {
      headers.Authorization = `Bearer ${this.adminToken}`;
    }
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers,
    });
    return this.parseEnvelope(response, dataSchema);
  }

  /**
   * POST JSON 并解析包络（默认带 adminToken）。
   *
   * @param path - 路径
   * @param body - JSON 体
   * @param dataSchema - data schema
   * @returns 包络
   */
  private async postJson<T>(
    path: string,
    body: unknown,
    dataSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
  ): Promise<ApiEnvelope<T>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (this.adminToken) {
      headers.Authorization = `Bearer ${this.adminToken}`;
    }
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return this.parseEnvelope(response, dataSchema);
  }

  /**
   * 解析成功/失败包络。
   *
   * @param response - fetch Response
   * @param dataSchema - data schema
   * @returns 包络
   * @throws LaniusApiClientError 非法 JSON 或 schema 不匹配
   */
  private async parseEnvelope<T>(
    response: Response,
    dataSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
  ): Promise<ApiEnvelope<T>> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new LaniusApiClientError('Response is not JSON', response.status, null);
    }

    if (
      typeof body === 'object' &&
      body !== null &&
      'ok' in body &&
      (body as { ok: unknown }).ok === false
    ) {
      const failure = FailureEnvelopeSchema.safeParse(body);
      if (!failure.success) {
        throw new LaniusApiClientError('Invalid failure envelope', response.status, body);
      }
      return failure.data;
    }

    const successSchema = z.object({
      ok: z.literal(true),
      data: dataSchema,
      meta: z.object({
        realm: z.enum(['international', 'china']),
        locale: z.enum(['zh', 'en']),
        cached: z.boolean(),
        cacheAgeMs: z.number().optional(),
        stale: z.boolean().optional(),
        source: z.string().optional(),
        generatedAt: z.string(),
      }),
    });

    const parsed = successSchema.safeParse(body);
    if (!parsed.success) {
      throw new LaniusApiClientError('Invalid success envelope', response.status, body);
    }

    return parsed.data as ApiEnvelope<T>;
  }
}

/**
 * `getMarketItems` 结构化查询（字符串重载仍支持仅 `q`）。
 */
export type MarketOrdersClientQuery = {
  /** 物品关键词 */
  q: string;
  page?: number;
  pageSize?: number;
  modRank?: number;
};

/**
 * `getRiven` 结构化查询。
 */
export type RivenOrdersClientQuery = {
  /** 武器关键词 */
  q: string;
  page?: number;
  pageSize?: number;
  rank?: number;
  mastery?: number;
  minRerolls?: number;
  maxRerolls?: number;
};

/**
 * QQ/Web 门禁上下文查询参数。
 */
type GateContext = { scene?: string; targetId?: string; userId?: string };

/**
 * 拼装公开查询 + 门禁参数。
 *
 * @param query - realm/locale
 * @param context - scene 等
 * @returns 含前导 `?` 的查询串，或空串
 */
function buildQuery(query: PublicQueryInput, context: GateContext): string {
  const params = new URLSearchParams();
  if (query.realm) params.set('realm', query.realm);
  if (query.locale) params.set('locale', query.locale);
  if (context.scene) params.set('scene', context.scene);
  if (context.targetId) params.set('targetId', context.targetId);
  if (context.userId) params.set('userId', context.userId);
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return suffix;
}

/**
 * Factory for a Lanius API client with injectable base URL and fetch.
 *
 * @param options - Client construction options.
 * @returns Configured `LaniusApiClient` instance.
 */
export function createLaniusApiClient(options: LaniusApiClientOptions): LaniusApiClient {
  return new LaniusApiClient(options);
}
