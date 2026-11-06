import {
  AcrithisDtoSchema,
  ArbTableDtoSchema,
  DispositionDtoSchema,
  DucatJunkDtoSchema,
  EssenceShopDtoSchema,
  FailureEnvelopeSchema,
  HealthDtoSchema,
  HelpDtoSchema,
  IncarnonRotationDtoSchema,
  IncursionsDtoSchema,
  LichAuctionsDtoSchema,
  MarketOrdersDtoSchema,
  MarketRankDtoSchema,
  MarketTrendDtoSchema,
  MetaDtoSchema,
  OpenRelicDtoSchema,
  PartsDtoSchema,
  PushDispatchDtoSchema,
  RelicQueryDtoSchema,
  RivenAnalysisDtoSchema,
  RivenOrdersDtoSchema,
  RivenRangesDtoSchema,
  RivenSpliceDtoSchema,
  SiteDtoSchema,
  SubscriptionDtoSchema,
  TimersDtoSchema,
  TranslateDtoSchema,
  ValenceFusionDtoSchema,
  VarziaDtoSchema,
  VoidTraderDtoSchema,
  WeaponRotationDtoSchema,
  WikiDtoSchema,
  WorldstateDtoSchema,
  type AcrithisDto,
  type ApiEnvelope,
  type ArbTableDto,
  type DispositionDto,
  type DucatJunkDto,
  type DucatTier,
  type EssenceShopDto,
  type HealthDto,
  type HelpDto,
  type IncarnonRotationDto,
  type IncursionsDto,
  type LichAuctionsDto,
  type Locale,
  type MarketOrdersDto,
  type MarketRankCategory,
  type MarketRankDto,
  type MarketTrendDto,
  type MetaDto,
  type OpenRelicDto,
  type PartsDto,
  type PushDispatchDto,
  type PushFrequency,
  type Realm,
  type RelicQueryDto,
  type RivenAnalysisDto,
  type RivenOrdersDto,
  type RivenRangesDto,
  type RivenSpliceDto,
  type SiteDto,
  type SubscribableModuleId,
  type SubscriptionDto,
  type TimersDto,
  type TranslateDto,
  type ValenceFusionDto,
  type VarziaDto,
  type VoidTraderDto,
  type WeaponRotationDto,
  type WikiDto,
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
   * 调用 `GET /v1/timers`。
   *
   * @param query - realm/locale
   * @returns 时效总览包络
   */
  async getTimers(query: PublicQueryInput = {}): Promise<ApiEnvelope<TimersDto>> {
    return this.getJson(`/v1/timers${buildQuery(query, {})}`, TimersDtoSchema);
  }

  /**
   * 调用 `GET /v1/arb-table`。
   *
   * @param query - realm/locale
   * @returns 仲裁表包络
   */
  async getArbTable(query: PublicQueryInput = {}): Promise<ApiEnvelope<ArbTableDto>> {
    return this.getJson(`/v1/arb-table${buildQuery(query, {})}`, ArbTableDtoSchema);
  }

  /**
   * 调用 `GET /v1/steel-path`。
   *
   * @param query - realm/locale
   * @returns 钢精商店包络
   */
  async getSteelPath(query: PublicQueryInput = {}): Promise<ApiEnvelope<EssenceShopDto>> {
    return this.getJson(`/v1/steel-path${buildQuery(query, {})}`, EssenceShopDtoSchema);
  }

  /**
   * 调用 `GET /v1/sliver-shop`。
   *
   * @param query - realm/locale
   * @returns 碎银商店包络
   */
  async getSliverShop(query: PublicQueryInput = {}): Promise<ApiEnvelope<EssenceShopDto>> {
    return this.getJson(`/v1/sliver-shop${buildQuery(query, {})}`, EssenceShopDtoSchema);
  }

  /**
   * 调用 `GET /v1/incursions`。
   *
   * @param query - realm/locale
   * @returns 钢路侵袭包络
   */
  async getIncursions(query: PublicQueryInput = {}): Promise<ApiEnvelope<IncursionsDto>> {
    return this.getJson(`/v1/incursions${buildQuery(query, {})}`, IncursionsDtoSchema);
  }

  /**
   * 调用 `GET /v1/incarnon`。
   *
   * @param query - realm/locale
   * @returns 灵化轮换包络
   */
  async getIncarnon(query: PublicQueryInput = {}): Promise<ApiEnvelope<IncarnonRotationDto>> {
    return this.getJson(`/v1/incarnon${buildQuery(query, {})}`, IncarnonRotationDtoSchema);
  }

  /**
   * 调用 `GET /v1/acrithis`。
   *
   * @param query - realm/locale
   * @returns 言录使包络
   */
  async getAcrithis(query: PublicQueryInput = {}): Promise<ApiEnvelope<AcrithisDto>> {
    return this.getJson(`/v1/acrithis${buildQuery(query, {})}`, AcrithisDtoSchema);
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
   * 调用 `GET /v1/wiki`（灰机深链 + 短简介）。
   *
   * @param q - 关键词
   * @param query - realm/locale
   * @param context - 可选 ACL 上下文
   * @returns Wiki 包络
   */
  async getWiki(
    q: string,
    query: PublicQueryInput = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<WikiDto>> {
    const params = mergeQuery({ q }, query, context);
    return this.getJson(`/v1/wiki?${params}`, WikiDtoSchema);
  }

  /**
   * 调用 `GET /v1/translate`（中英官方名对照）。
   *
   * @param q - 名称
   * @param query - realm/locale
   * @param context - 可选 ACL 上下文
   * @returns 翻译包络
   */
  async getTranslate(
    q: string,
    query: PublicQueryInput = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<TranslateDto>> {
    const params = mergeQuery({ q }, query, context);
    return this.getJson(`/v1/translate?${params}`, TranslateDtoSchema);
  }

  /**
   * 调用 `GET /v1/valence`（效价融合 / 规划）。
   *
   * @param tokens - 材料词元（空则返回用法）
   * @param query - realm/locale
   * @param context - 可选 ACL 上下文
   * @returns 效价包络
   */
  async getValence(
    tokens: readonly string[] = [],
    query: PublicQueryInput = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<ValenceFusionDto>> {
    const q = tokens.join(' ').trim();
    const params = mergeQuery(q ? { q } : {}, query, context);
    return this.getJson(`/v1/valence?${params}`, ValenceFusionDtoSchema);
  }

  /**
   * 调用 `GET /v1/market/trend`。
   *
   * @param q - 物品关键词
   * @param context - 门禁
   * @returns 趋势包络
   */
  async getMarketTrend(q: string, context: GateContext = {}): Promise<ApiEnvelope<MarketTrendDto>> {
    const params = mergeQuery({ q }, {}, context);
    return this.getJson(`/v1/market/trend?${params}`, MarketTrendDtoSchema);
  }

  /**
   * 调用 `GET /v1/market/rank`。
   *
   * @param input - 分类与分页
   * @param context - 门禁
   * @returns 排行包络
   */
  async getMarketRank(
    input: { category?: MarketRankCategory; page?: number; pageSize?: number } = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<MarketRankDto>> {
    const fields: Record<string, string> = {};
    if (input.category) fields.category = input.category;
    if (input.page != null) fields.page = String(input.page);
    if (input.pageSize != null) fields.pageSize = String(input.pageSize);
    const params = mergeQuery(fields, {}, context);
    return this.getJson(`/v1/market/rank?${params}`, MarketRankDtoSchema);
  }

  /**
   * 调用 `GET /v1/market/ducats`。
   *
   * @param input - 档位与分页
   * @param context - 门禁
   * @returns 杜卡德垃圾包络
   */
  async getDucats(
    input: { tier?: DucatTier; page?: number; pageSize?: number } = {},
    context: GateContext = {},
  ): Promise<ApiEnvelope<DucatJunkDto>> {
    const fields: Record<string, string> = {};
    if (input.tier) fields.tier = input.tier;
    if (input.page != null) fields.page = String(input.page);
    if (input.pageSize != null) fields.pageSize = String(input.pageSize);
    const params = mergeQuery(fields, {}, context);
    return this.getJson(`/v1/market/ducats?${params}`, DucatJunkDtoSchema);
  }

  /**
   * 调用 `GET /v1/riven/analysis`（文字分析；识图行可走 POST）。
   *
   * @param text - 武器 + 词条数值
   * @param context - 门禁
   * @returns 分析包络
   */
  async getRivenAnalysis(
    text: string,
    context: GateContext = {},
  ): Promise<ApiEnvelope<RivenAnalysisDto>> {
    const params = mergeQuery({ text }, {}, context);
    return this.getJson(`/v1/riven/analysis?${params}`, RivenAnalysisDtoSchema);
  }

  /**
   * 调用 `POST /v1/riven/analysis`（支持 OCR lines）。
   *
   * @param body - text / lines / disposition / cls
   * @param context - 门禁（拼进 query）
   * @returns 分析包络
   */
  async postRivenAnalysis(
    body: { text?: string; lines?: string[]; disposition?: number; cls?: string },
    context: GateContext = {},
  ): Promise<ApiEnvelope<RivenAnalysisDto>> {
    const params = mergeQuery({}, {}, context);
    const suffix = params.size > 0 ? `?${params}` : '';
    return this.postJson(`/v1/riven/analysis${suffix}`, body, RivenAnalysisDtoSchema);
  }

  /**
   * 调用 `GET /v1/riven/ranges`。
   *
   * @param q - 武器或类名
   * @param context - 门禁
   * @returns 范围包络
   */
  async getRivenRanges(q: string, context: GateContext = {}): Promise<ApiEnvelope<RivenRangesDto>> {
    const params = mergeQuery({ q }, {}, context);
    return this.getJson(`/v1/riven/ranges?${params}`, RivenRangesDtoSchema);
  }

  /**
   * 调用 `GET /v1/riven/splice`。
   *
   * @param q - 可选过滤
   * @param context - 门禁
   * @returns 融合包络
   */
  async getRivenSplice(q = '', context: GateContext = {}): Promise<ApiEnvelope<RivenSpliceDto>> {
    const params = mergeQuery(q ? { q } : {}, {}, context);
    return this.getJson(`/v1/riven/splice?${params}`, RivenSpliceDtoSchema);
  }

  /**
   * 调用 `GET /v1/riven/disposition`。
   *
   * @param q - 武器名
   * @param context - 门禁
   * @returns 倾向包络
   */
  async getDisposition(q: string, context: GateContext = {}): Promise<ApiEnvelope<DispositionDto>> {
    const params = mergeQuery({ q }, {}, context);
    return this.getJson(`/v1/riven/disposition?${params}`, DispositionDtoSchema);
  }

  /**
   * 调用 `GET /v1/lich`。
   *
   * @param input - 武器与筛选
   * @param context - 门禁
   * @returns 玄骸包络
   */
  async getLichAuctions(
    input: {
      q: string;
      element?: string;
      damageMax?: number;
      page?: number;
      pageSize?: number;
    },
    context: GateContext = {},
  ): Promise<ApiEnvelope<LichAuctionsDto>> {
    const fields: Record<string, string> = { q: input.q };
    if (input.element) fields.element = input.element;
    if (input.damageMax != null) fields.damageMax = String(input.damageMax);
    if (input.page != null) fields.page = String(input.page);
    if (input.pageSize != null) fields.pageSize = String(input.pageSize);
    const params = mergeQuery(fields, {}, context);
    return this.getJson(`/v1/lich?${params}`, LichAuctionsDtoSchema);
  }

  /**
   * 调用 `GET /v1/relic`。
   *
   * @param q - 遗物 / 纪元
   * @param page - 页码
   * @param context - 门禁
   * @returns 遗物包络
   */
  async getRelic(
    q = '',
    page?: number,
    context: GateContext = {},
  ): Promise<ApiEnvelope<RelicQueryDto>> {
    const fields: Record<string, string> = {};
    if (q) fields.q = q;
    if (page != null) fields.page = String(page);
    const params = mergeQuery(fields, {}, context);
    return this.getJson(`/v1/relic?${params}`, RelicQueryDtoSchema);
  }

  /**
   * 调用 `GET /v1/parts`。
   *
   * @param q - 部件名
   * @param page - 页码
   * @param context - 门禁
   * @returns 部件包络
   */
  async getParts(
    q: string,
    page?: number,
    context: GateContext = {},
  ): Promise<ApiEnvelope<PartsDto>> {
    const fields: Record<string, string> = { q };
    if (page != null) fields.page = String(page);
    const params = mergeQuery(fields, {}, context);
    return this.getJson(`/v1/parts?${params}`, PartsDtoSchema);
  }

  /**
   * 调用 `GET /v1/open-relic`。
   *
   * @param context - 门禁
   * @returns 开核桃包络
   */
  async getOpenRelic(context: GateContext = {}): Promise<ApiEnvelope<OpenRelicDto>> {
    const params = mergeQuery({}, {}, context);
    const suffix = params.size > 0 ? `?${params}` : '';
    return this.getJson(`/v1/open-relic${suffix}`, OpenRelicDtoSchema);
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
    filterArgs?: string | null;
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
   * @param input - 场景与模块；可选 filterArgs 精确匹配
   * @returns ok 包络
   */
  async disableSubscription(input: {
    scene: 'group' | 'c2c';
    targetId: string;
    moduleId: SubscribableModuleId;
    filterArgs?: string | null;
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
  const params = mergeQuery({}, query, context);
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return suffix;
}

/**
 * 合并业务查询、公开 meta 与门禁上下文为 URLSearchParams。
 *
 * @param fields - 业务字段（如 q）
 * @param query - realm/locale
 * @param context - scene 等
 * @returns URLSearchParams
 */
function mergeQuery(
  fields: Record<string, string>,
  query: PublicQueryInput,
  context: GateContext,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    if (value) params.set(key, value);
  }
  if (query.realm) params.set('realm', query.realm);
  if (query.locale) params.set('locale', query.locale);
  if (context.scene) params.set('scene', context.scene);
  if (context.targetId) params.set('targetId', context.targetId);
  if (context.userId) params.set('userId', context.userId);
  return params;
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
