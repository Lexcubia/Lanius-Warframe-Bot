import { createHash, createHmac, randomBytes } from 'node:crypto';

/**
 * 腾讯云 COS 上传配置（卡片图公网托管）。
 */
export type CosUploadConfig = {
  /** COS SecretId */
  secretId: string;
  /** COS SecretKey */
  secretKey: string;
  /** 桶名（含 APPID），如 `xxx-1257961979` */
  bucket: string;
  /** 地域，如 `ap-shanghai` */
  region: string;
  /** 自定义 CDN/域名；缺省用桶默认域名 */
  domain?: string;
  /** 对象键前缀，默认 `lanius/cards/` */
  prefix?: string;
};

/**
 * COS 上传结果。
 */
export type CosUploadResult = {
  ok: boolean;
  /** 公网可访问的对象 URL */
  url?: string;
  detail?: string;
};

/**
 * 拼接对象公网 URL。
 *
 * @param config - COS 配置
 * @param key - 对象键
 * @returns 公网 URL
 */
function publicUrlFor(config: CosUploadConfig, key: string): string {
  const host = (config.domain ?? '').trim()
    ? (config.domain ?? '').trim()
    : `${config.bucket}.cos.${config.region}.myqcloud.com`;
  return `https://${host}/${key}`;
}

/**
 * 生成 COS XML API 的 Authorization 签名（HMAC-SHA1）。
 *
 * 算法：`q-sign-algorithm=sha1&q-ak=<ak>&q-sign-time=...&q-key-time=...&q-header-list=...&q-url-param-list=...&q-signature=...`
 *
 * @param config - COS 配置
 * @param method - HTTP 方法（大写）
 * @param pathname - 请求路径（以 `/` 开头，含对象键）
 * @param headers - 参与签名的请求头（host、content-type 等）
 * @returns Authorization 头值
 */
function cosAuthorization(
  config: CosUploadConfig,
  method: string,
  pathname: string,
  headers: Record<string, string>,
): string {
  const now = Math.floor(Date.now() / 1000);
  const keyTime = `${now - 60};${now + 600}`;

  // 参与签名的 header：统一小写 key、按字典序、键值分别 url 编码
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lower[k.toLowerCase()] = v;
  }
  const headerKeys = Object.keys(lower).sort();
  const headerList = headerKeys.join(';');
  const headerString = headerKeys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(lower[k] ?? '')}`)
    .join('&');

  const httpString = [method.toLowerCase(), pathname, '', headerString, ''].join('\n');

  const stringToSign = [
    'sha1',
    keyTime,
    createHash('sha1').update(httpString).digest('hex'),
    '',
  ].join('\n');

  const signKey = createHmac('sha1', config.secretKey).update(keyTime).digest('hex');
  const signature = createHmac('sha1', signKey).update(stringToSign).digest('hex');

  return (
    `q-sign-algorithm=sha1&q-ak=${config.secretId}` +
    `&q-sign-time=${keyTime}&q-key-time=${keyTime}` +
    `&q-header-list=${headerList}&q-url-param-list=` +
    `&q-signature=${signature}`
  );
}

/**
 * 上传 PNG 到 COS 并返回公网 URL。
 *
 * 使用 COS XML API `PutObject`（HMAC-SHA1 签名，无 SDK 依赖）。
 * 要求桶为「公有读」或自定义域名已放开读，否则 markdown 无法转存。
 *
 * @param config - COS 配置
 * @param png - PNG 字节
 * @param fetchImpl - 可注入的 fetch（测试用）
 * @returns 上传结果（含公网 URL）
 */
export async function uploadCardPng(
  config: CosUploadConfig,
  png: Buffer,
  fetchImpl: typeof fetch = fetch,
): Promise<CosUploadResult> {
  const prefix = (config.prefix ?? 'lanius/cards/').replace(/^\//, '');
  const key = `${prefix}${Date.now()}-${randomBytes(6).toString('hex')}.png`;
  const host = `${config.bucket}.cos.${config.region}.myqcloud.com`;
  const pathname = `/${key}`;

  const headers: Record<string, string> = {
    host,
    'content-type': 'image/png',
    'content-length': String(png.length),
  };
  const authorization = cosAuthorization(config, 'PUT', pathname, headers);

  try {
    const res = await fetchImpl(`https://${host}${pathname}`, {
      method: 'PUT',
      headers: {
        'content-type': 'image/png',
        'content-length': String(png.length),
        authorization,
      },
      // Node 22 undici：Buffer 作为 body 可保证 Content-Length 与字节流一致；
      // 传入 Uint8Array 在部分场景会被错误地按空流处理，导致 70B 空文件。
      body: png,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        detail: `COS PUT ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    return { ok: true, url: publicUrlFor(config, key) };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}
