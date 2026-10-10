/**
 * 将浏览器 `/api/lanius/*` 请求代理到 Lanius API 进程。
 * 示例：`/api/lanius/v1/worldstate` → `{laniusApiBase}/v1/worldstate`。
 */
export default defineEventHandler(async (event) => {
  const runtime = useRuntimeConfig();
  const path = event.context.params?.path;
  const suffix = Array.isArray(path) ? path.join('/') : String(path ?? '');
  const base = String(runtime.laniusApiBase).replace(/\/+$/, '');
  const target = new URL(`${base}/${suffix}`);
  const incoming = getRequestURL(event);
  target.search = incoming.search;

  return proxyRequest(event, target.toString());
});
