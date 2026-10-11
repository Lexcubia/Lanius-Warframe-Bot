/**
 * 官方 OpenAPI 访问凭证缓存（`getAppAccessToken`）。
 */
export type AccessTokenCache = {
  token: string;
  /** 本地认为过期的时刻（Unix ms）；会预留刷新窗口。 */
  expiresAtMs: number;
};

/**
 * 获取 App Access Token 的选项。
 */
export type GetAppAccessTokenOptions = {
  appId: string;
  /** 开放平台 ClientSecret（与配置中的 appSecret 同源）。 */
  clientSecret: string;
  fetchImpl?: typeof fetch;
  /** Token 接口基址，默认 `https://api.bot.qq.com`。 */
  apiBaseUrl?: string;
  /** 可注入的缓存槽，便于单测与跨调用复用。 */
  cache?: { current?: AccessTokenCache };
  /** 相对官方 expires_in 提前刷新的秒数，默认 60。 */
  refreshSkewSec?: number;
};

/**
 * 获取（或复用缓存的）机器人 `access_token`。
 * 官方有效期约 7200s；临近过期 60s 内会重新拉取。
 *
 * @param options - AppID、ClientSecret、可选 fetch / 缓存
 * @returns Bearer 用的纯 token 字符串（不含 `QQBot ` 前缀）
 * @throws Error 当接口返回业务错误或网络失败
 */
export async function getAppAccessToken(
  options: GetAppAccessTokenOptions,
): Promise<string> {
  const skewSec = options.refreshSkewSec ?? 60;
  const cacheSlot = options.cache ?? {};
  const cached = cacheSlot.current;
  if (cached && Date.now() < cached.expiresAtMs) {
    return cached.token;
  }

  const apiBase = (options.apiBaseUrl ?? 'https://api.bot.qq.com').replace(/\/$/, '');
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${apiBase}/app/getAppAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appId: options.appId,
      clientSecret: options.clientSecret,
    }),
  });

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: string | number;
    code?: number;
    message?: string;
  };

  // 官方约定：失败时 HTTP 仍可能为 200，需看 body.code
  if (body.code != null || !body.access_token) {
    throw new Error(
      `getAppAccessToken failed: code=${body.code ?? 'n/a'} message=${body.message ?? response.status}`,
    );
  }

  const expiresInSec = Number(body.expires_in ?? 7200);
  cacheSlot.current = {
    token: body.access_token,
    expiresAtMs: Date.now() + Math.max(30, expiresInSec - skewSec) * 1000,
  };
  return body.access_token;
}
