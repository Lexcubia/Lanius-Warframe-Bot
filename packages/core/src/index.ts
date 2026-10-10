/**
 * `@lanius/core` — shared contracts for Lanius API and clients.
 * Apps must consume these DTOs instead of upstream Warframe JSON shapes.
 */

export {
  DEFAULT_REALM,
  MVP_REALMS,
  RealmSchema,
  isRealmAvailable,
  type Realm,
} from './realm.js';

export {
  DEFAULT_LOCALE,
  LocaleSchema,
  SUPPORTED_LOCALES,
  type Locale,
} from './locale.js';

export { pickLocalized } from './localized.js';

export { ErrorCode, ErrorMessageKey } from './errors.js';
export type { ErrorCode as ErrorCodeName } from './errors.js';

export {
  ApiErrorBodySchema,
  FailureEnvelopeSchema,
  ResponseMetaSchema,
  createFailureEnvelope,
  createSuccessEnvelope,
  successEnvelopeSchema,
  type ApiEnvelope,
  type ApiErrorBody,
  type FailureEnvelope,
  type ResponseMeta,
  type SuccessEnvelope,
} from './envelope.js';

export { PublicQuerySchema, parsePublicQuery, type PublicQuery } from './query.js';

export {
  HealthChecksSchema,
  HealthDtoSchema,
  type HealthChecks,
  type HealthDto,
} from './dto/health.js';

export {
  MetaDtoSchema,
  ReplyModeSchema,
  type MetaDto,
  type ReplyMode,
} from './dto/meta.js';

export {
  InvasionDtoSchema,
  LocalizedNameSchema,
  NightwaveDtoSchema,
  WorldstateDtoSchema,
  type InvasionDto,
  type LocalizedName,
  type NightwaveDto,
  type WorldstateDto,
} from './dto/worldstate.js';

export {
  HelpDtoSchema,
  HelpLineSchema,
  HelpParamSchema,
  type HelpDto,
  type HelpLine,
  type HelpParam,
} from './dto/help.js';

export {
  LANIUS_COMMAND_CATALOG,
  buildHelpDto,
  findCommandByRoot,
  type CommandDef,
  type CommandParamDef,
} from './commands/catalog.js';

export {
  SiteDtoSchema,
  SiteFooterLineSchema,
  SiteFooterSchema,
  type SiteDto,
  type SiteFooter,
  type SiteFooterLine,
} from './dto/site.js';

export {
  LabelOverrideSchema,
  LabelsConfigSchema,
  type LabelOverride,
  type LabelsConfig,
} from './dto/labels.js';
