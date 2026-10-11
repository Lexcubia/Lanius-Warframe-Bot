import {
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';

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
 * Webhook URL 校验（`op:13`）签名入参。
 */
export type SignQqWebhookValidationOptions = {
  /** BotSecret，与开放平台「开发设置」中一致。 */
  appSecret: string;
  /** 平台下发的 `d.plain_token`。 */
  plainToken: string;
  /** 平台下发的 `d.event_ts`（字符串形式）。 */
  eventTs: string;
};

/** Ed25519 PKCS8 DER 前缀（后接 32 字节 seed）。 */
const ED25519_PKCS8_PREFIX = Buffer.from(
  '302e020100300506032b657004220420',
  'hex',
);

/**
 * 按官方文档将 BotSecret 扩展为 32 字节 Ed25519 seed：
 * 反复倍增直至长度 ≥ 32，再截取前 32 字节。
 *
 * @param botSecret - 开放平台 BotSecret（通常为 ASCII）
 * @returns 供 `ed25519.NewKeyFromSeed` 等价用法的 32 字节 seed
 */
export function expandBotSecretToEd25519Seed(botSecret: string): Buffer {
  let seed = botSecret;
  while (Buffer.byteLength(seed, 'utf8') < 32) {
    seed = seed + seed;
  }
  return Buffer.from(seed, 'utf8').subarray(0, 32);
}

/**
 * 从 BotSecret 派生 Ed25519 私钥（PKCS8）。
 *
 * @param botSecret - 开放平台 BotSecret
 * @returns Node `KeyObject` 私钥
 */
function ed25519PrivateKeyFromBotSecret(botSecret: string): KeyObject {
  const seed = expandBotSecretToEd25519Seed(botSecret);
  const der = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
  return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
}

/**
 * 从 BotSecret 派生对应的 Ed25519 公钥。
 *
 * @param botSecret - 开放平台 BotSecret
 * @returns Node `KeyObject` 公钥
 */
function ed25519PublicKeyFromBotSecret(botSecret: string): KeyObject {
  return createPublicKey(ed25519PrivateKeyFromBotSecret(botSecret));
}

/**
 * 对 Webhook URL 校验请求签名：`sign(event_ts + plain_token)`，返回十六进制。
 * 对应开放平台文档「Webhook 配置」中的 Validation 响应。
 *
 * @param options - BotSecret 与平台下发的 plain_token / event_ts
 * @returns 64 字节签名的小写十六进制字符串
 */
export function signQqWebhookValidation(
  options: SignQqWebhookValidationOptions,
): string {
  const privateKey = ed25519PrivateKeyFromBotSecret(options.appSecret);
  const message = Buffer.from(`${options.eventTs}${options.plainToken}`, 'utf8');
  return sign(null, message, privateKey).toString('hex');
}

/**
 * 使用 Ed25519 校验官方 QQ 回调签名。
 * 消息为 `timestamp + rawBody`；公钥由 BotSecret 按文档 seed 规则派生。
 *
 * @param request - 入站 HTTP 回调的原始 body 与 headers
 * @param options - appSecret 以及可选的 header 名覆盖
 * @returns 签名合法时为 `true`，否则为 `false`
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

  const signatureBytes = parseHexSignature(signature);
  if (!signatureBytes) {
    return false;
  }

  try {
    const publicKey = ed25519PublicKeyFromBotSecret(options.appSecret);
    const message = Buffer.from(`${timestamp}${request.rawBody}`, 'utf8');
    return verify(null, message, publicKey, signatureBytes);
  } catch {
    return false;
  }
}

/**
 * 将十六进制签名解析为原始字节。
 *
 * @param signature - header 中的十六进制签名（大小写不敏感）
 * @returns 64 字节 Buffer；格式非法时为 `null`
 */
function parseHexSignature(signature: string): Buffer | null {
  const normalized = signature.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) {
    return null;
  }
  const bytes = Buffer.from(normalized, 'hex');
  // Ed25519 签名固定 64 字节
  if (bytes.length !== 64) {
    return null;
  }
  return bytes;
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
