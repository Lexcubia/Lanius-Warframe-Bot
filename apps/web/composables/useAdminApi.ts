/**
 * 管理后台 API 错误（携带 HTTP 状态，便于会话探测）。
 */
export class AdminApiError extends Error {
  readonly status: number;

  /**
   * 创建管理 API 错误。
   *
   * @param message - 可读摘要
   * @param status - HTTP 状态码
   */
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

/**
 * 提供带 cookie 凭证的管理端 fetch（经 Nitro `/api/lanius` 代理）。
 *
 * @returns `adminFetch` 与固定 API 前缀
 */
export function useAdminApi() {
  const apiBase = '/api/lanius';

  /**
   * 调用管理 API 并解包成功 `data`。
   *
   * @param path - 以 `/v1/...` 开头的路径
   * @param init - 可选 fetch 初始化（会合并 credentials / JSON headers）
   * @returns 成功响应的 `data` 字段
   * @throws AdminApiError 当 HTTP 非 2xx 或包络 `ok` 为 false
   */
  async function adminFetch<T = unknown>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const headers = new Headers(init?.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (init?.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${apiBase}${path}`, {
      credentials: 'include',
      ...init,
      headers,
    });

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new AdminApiError('Response is not JSON', response.status);
    }

    if (
      !response.ok ||
      typeof body !== 'object' ||
      body === null ||
      !('ok' in body) ||
      (body as { ok: unknown }).ok !== true
    ) {
      const message =
        typeof body === 'object' &&
        body !== null &&
        'error' in body &&
        typeof (body as { error?: { message?: unknown } }).error?.message ===
          'string'
          ? String((body as { error: { message: string } }).error.message)
          : `HTTP ${response.status}`;
      throw new AdminApiError(message, response.status);
    }

    return (body as unknown as { data: T }).data;
  }

  return { apiBase, adminFetch };
}
