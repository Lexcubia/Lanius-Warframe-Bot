import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * 官方 QQ 回调验签所需的最小请求形状。
 */
export type QqCallbackRequest = {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
};

/**
 * 校验腾讯官方 QQ 机器人回调签名的选项。
 */
export type VerifyQqCallbackOptions = {
  appSecret: string;
  /** 携带签名的 header 名（平台相关；测试可注入）。 */
  signatureHeader?: string;
  /** 携带参与签名的时间戳 header 名。 */
  timestampHeader?: string;
};

/**
 * 使用 HMAC-SHA256 校验官方 QQ 回调签名。
 * header 名可注入，便于平台文档变更时局部调整。
 *
 * @param request - 入站 HTTP 回调的原始 body 与 headers
 * @param options - appSecret 以及可选的 header 名覆盖
 * @returns 签名匹配时为 `true`，否则为 `false`
 */
export function verifyQqCallback(
  request: QqCallbackRequest,
  options: VerifyQqCallbackOptions,
): boolean {
  const signatureHeader = options.signatureHeader ?? 'x-signature-ed25519';
  const timestampHeader = options.timestampHeader ?? 'x-signature-timestamp';
  const signature = headerValue(request.headers, signatureHeader);
  const timestamp = headerValue(request.headers, timestampHeader);

  if (!signature || !timestamp || !options.appSecret) {
    return false;
  }

  // MVP：HMAC-SHA256(secret, timestamp + rawBody) 十六进制比对。
  const expected = createHmac('sha256', options.appSecret)
    .update(`${timestamp}${request.rawBody}`)
    .digest('hex');

  try {
    const left = Buffer.from(expected, 'utf8');
    const right = Buffer.from(signature, 'utf8');
    if (left.length !== right.length) {
      return false;
    }
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

/**
 * 不区分大小写地读取单个 header 值。
 *
 * @param headers - 入站 header 映射
 * @param name - 要解析的 header 名
 * @returns 第一个字符串值；缺失时为 `undefined`
 */
function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(direct)) {
    return direct[0];
  }
  return direct;
}
