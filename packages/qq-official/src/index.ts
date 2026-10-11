/**
 * `@lanius/qq-official` — 官方 QQ 验签、发信、菜单与指令面板（仅 bot 使用）。
 */

export {
  getAppAccessToken,
  type AccessTokenCache,
  type GetAppAccessTokenOptions,
} from './access-token.js';
export {
  createQqOfficialClient,
  QqOfficialClient,
  type QqOfficialClientOptions,
  type QqSendResult,
  type QqSendTarget,
} from './client.js';
export {
  syncQqCustomMenu,
  type QqMenuSendItem,
  type SyncQqCustomMenuOptions,
  type SyncQqCustomMenuResult,
} from './menu.js';
export {
  qqOpenApiJson,
  truncateChars,
  truncateWeightedChars,
  type QqOpenApiOptions,
} from './open-api.js';
export {
  loadQqPanelIdStore,
  saveQqPanelIdStore,
  type QqPanelIdStore,
} from './panel-id-store.js';
export {
  ensureQqGroupCommandPanel,
  reclaimOrphanPanels,
  syncQqCommandPanels,
  type QqPanelCommandItem,
  type QqPanelScope,
  type SyncQqCommandPanelResult,
  type SyncQqCommandPanelsOptions,
} from './panels.js';
export {
  expandBotSecretToEd25519Seed,
  signQqWebhookValidation,
  verifyQqCallback,
  type QqCallbackRequest,
  type SignQqWebhookValidationOptions,
  type VerifyQqCallbackOptions,
} from './verify.js';
