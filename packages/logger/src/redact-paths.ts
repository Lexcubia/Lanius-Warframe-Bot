/**
 * pino redact 路径列表：避免把密钥/口令写入日志。
 *
 * 覆盖常见嵌套字段（config、headers、OpenAPI 错误体等）。
 */
export const LANIUS_LOG_REDACT_PATHS = [
  'appSecret',
  'clientSecret',
  'secret',
  'password',
  'token',
  'access_token',
  'adminToken',
  'Authorization',
  'authorization',
  'req.headers.authorization',
  'headers.authorization',
  'headers["x-signature-ed25519"]',
  'config.qq.appSecret',
  'config.api.adminToken',
  'qq.appSecret',
  'bot.cos.secretKey',
  'cos.secretKey',
  'secretKey',
  'secretId',
] as const;
