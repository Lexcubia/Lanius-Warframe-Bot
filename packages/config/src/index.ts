export { deepMerge } from './merge.js';
export {
  ConfigDriver,
  getConfigDriver,
  resetConfigDriverForTests,
  type ConfigDriverOptions,
  type ConfigListener,
} from './driver.js';
export {
  CONFIG_MODULE_IDS,
  ConfigModuleIdSchema,
  MODULE_FIELD_META,
  MODULE_SCHEMAS,
  SECRET_MASK,
  ApiModuleSchema,
  BotModuleSchema,
  QqModuleSchema,
  AdminModuleSchema,
  RedisModuleSchema,
  DatabaseModuleSchema,
  DefaultsModuleSchema,
  WebModuleSchema,
  GithubModuleSchema,
  type ConfigModuleId,
  type ModuleConfigMap,
  type FieldMeta,
} from './modules.js';
export {
  maskSecrets,
  preserveSecretsOnWrite,
  listRestartRequiredFields,
  getByPath,
  setByPath,
} from './mask.js';
export { resolveConfigRoot, findRepoRoot } from './root.js';
export { migrateMonolithLocalIfNeeded } from './migrate.js';
export { checkForUpdate, type UpdateCheckResult } from './update-check.js';
export {
  assembleApiConfig,
  assembleBotConfig,
  type AssembledApiConfig,
  type AssembledBotConfig,
} from './assemble.js';
