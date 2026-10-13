/**
 * `@lanius/core` — shared contracts for Lanius API and clients.
 * Apps must consume these DTOs instead of upstream Warframe JSON shapes.
 */

export { DEFAULT_REALM, MVP_REALMS, RealmSchema, isRealmAvailable, type Realm } from './realm.js';

export { DEFAULT_LOCALE, LocaleSchema, SUPPORTED_LOCALES, type Locale } from './locale.js';

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

export { MetaDtoSchema, ReplyModeSchema, type MetaDto, type ReplyMode } from './dto/meta.js';

export { CatalogItemDtoSchema, type CatalogItemDto } from './dto/item.js';

export {
  FissureDtoSchema,
  FissureEraSchema,
  FissurePathSchema,
  InvasionDtoSchema,
  LocalizedNameSchema,
  NightwaveChallengeDtoSchema,
  NightwaveChallengeKindSchema,
  NightwaveDtoSchema,
  OpenWorldCycleDtoSchema,
  OpenWorldCycleIdSchema,
  WorldstateDtoSchema,
  type FissureDto,
  type FissureEra,
  type FissurePath,
  type InvasionDto,
  type LocalizedName,
  type NightwaveChallengeDto,
  type NightwaveChallengeKind,
  type NightwaveDto,
  type OpenWorldCycleDto,
  type OpenWorldCycleId,
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
  resolveModuleToken,
  type CommandDef,
  type CommandParamDef,
} from './commands/catalog.js';

export { GATED_MODULE_IDS, ModuleIdSchema, type ModuleId } from './modules.js';

export { checkForUpdate, type UpdateCheckResult } from './update-check.js';

export {
  MarketItemDtoSchema,
  MarketSearchDtoSchema,
  RivenSearchDtoSchema,
  RivenSummaryDtoSchema,
  type MarketItemDto,
  type MarketSearchDto,
  type RivenSearchDto,
  type RivenSummaryDto,
} from './dto/market.js';

export {
  TraderItemDtoSchema,
  VoidTraderDtoSchema,
  VarziaDtoSchema,
  ValenceElementSchema,
  RotationWeaponDtoSchema,
  WeaponRotationDtoSchema,
  VALENCE_BONUS_MAX_PCT,
  type TraderItemDto,
  type VoidTraderDto,
  type VarziaDto,
  type ValenceElement,
  type RotationWeaponDto,
  type WeaponRotationDto,
} from './dto/traders.js';

export {
  PushDispatchDtoSchema,
  PushFrequencySchema,
  SubscribableModuleIdSchema,
  SubscriptionDtoSchema,
  type PushDispatchDto,
  type PushFrequency,
  type SubscribableModuleId,
  type SubscriptionDto,
} from './dto/subscription.js';

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

export {
  FISSURE_ERA_ORDER,
  FISSURE_PATH_ORDER,
  applyFissureQueryFilter,
  canonicalMissionFilterKey,
  collectMissionTypeOptions,
  emptyFissureFilter,
  filterFissures,
  isFissureFilterActive,
  isFissureQueryActive,
  parseFissureFilterTokens,
  resolveMissionTypeKeys,
  toggleFilterValue,
  type FissureFilterState,
  type FissureMissionOption,
  type FissureQueryFilter,
} from './fissures/filter-fissures.js';
