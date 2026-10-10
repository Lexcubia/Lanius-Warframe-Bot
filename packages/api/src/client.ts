import {
  FailureEnvelopeSchema,
  HealthDtoSchema,
  HelpDtoSchema,
  MetaDtoSchema,
  SiteDtoSchema,
  WorldstateDtoSchema,
  type ApiEnvelope,
  type HealthDto,
  type HelpDto,
  type Locale,
  type MetaDto,
  type Realm,
  type SiteDto,
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

  /**
   * Creates a client bound to a Lanius API base URL.
   *
   * @param options - `baseUrl` and optional injectable `fetch`.
   */
  constructor(options: LaniusApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
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
   * 调用 `GET /v1/help`。
   *
   * @returns 帮助接口的成功或失败包络
   * @throws LaniusApiClientError 当响应非 JSON 或 schema 校验失败时抛出
   */
  async getHelp(): Promise<ApiEnvelope<HelpDto>> {
    return this.getJson('/v1/help', HelpDtoSchema);
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
  async getWorldstate(
    query: PublicQueryInput = {},
  ): Promise<ApiEnvelope<WorldstateDto>> {
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
   * Performs a GET and parses a Lanius envelope for the given data schema.
   *
   * @param path - Absolute path beginning with `/v1`.
   * @param dataSchema - Zod schema for the success `data` field.
   * @returns Typed API envelope.
   * @throws LaniusApiClientError on non-JSON or schema mismatch.
   */
  private async getJson<T>(
    path: string,
    // 第三泛参为 unknown：带 .default() 的 schema 以输出类型作为 T
    dataSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
  ): Promise<ApiEnvelope<T>> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

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
        throw new LaniusApiClientError(
          'Invalid failure envelope',
          response.status,
          body,
        );
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
      throw new LaniusApiClientError(
        'Invalid success envelope',
        response.status,
        body,
      );
    }

    // Narrow Zod's inferred object into the shared SuccessEnvelope<T> contract.
    return parsed.data as ApiEnvelope<T>;
  }
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
