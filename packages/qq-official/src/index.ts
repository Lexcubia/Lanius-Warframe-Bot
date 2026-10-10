/**
 * `@lanius/qq-official` — 官方 QQ 验签与发送辅助（仅 bot 使用）。
 */

export {
  createQqOfficialClient,
  QqOfficialClient,
  type QqOfficialClientOptions,
  type QqSendResult,
  type QqSendTarget,
} from './client.js';
export {
  verifyQqCallback,
  type QqCallbackRequest,
  type VerifyQqCallbackOptions,
} from './verify.js';
