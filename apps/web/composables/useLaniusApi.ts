import { createLaniusApiClient, type LaniusApiClient } from '@lanius/api';

/**
 * 创建绑定到浏览器 Nitro 代理前缀（或 SSR 绝对 base）的 Lanius API 客户端。
 *
 * @returns 已配置的 `@lanius/api` 实例
 */
export function useLaniusApi(): LaniusApiClient {
  const runtime = useRuntimeConfig();
  const baseUrl = import.meta.server
    ? String(runtime.laniusApiBase)
    : String(runtime.public.laniusApiPrefix);

  return createLaniusApiClient({ baseUrl });
}
