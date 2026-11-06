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
  AlertDtoSchema,
  ArbitrationDtoSchema,
  ArchimedeaDifficultyDtoSchema,
  ArchimedeaDtoSchema,
  ArchimedeaKindSchema,
  ArchimedeaMissionDtoSchema,
  ArchimedeaSeasonDtoSchema,
  ArchonHuntDtoSchema,
  BountyJobDtoSchema,
  BountySyndicateDtoSchema,
  CircuitChoiceDtoSchema,
  CircuitDtoSchema,
  EMPTY_WORLDSTATE_MISSION_SLICES,
  SortieDtoSchema,
  SortieMissionDtoSchema,
  type AlertDto,
  type ArbitrationDto,
  type ArchimedeaDifficultyDto,
  type ArchimedeaDto,
  type ArchimedeaKind,
  type ArchimedeaMissionDto,
  type ArchimedeaSeasonDto,
  type ArchonHuntDto,
  type BountyJobDto,
  type BountySyndicateDto,
  type CircuitChoiceDto,
  type CircuitDto,
  type SortieDto,
  type SortieMissionDto,
} from './dto/worldstate-missions.js';

export {
  AcrithisDtoSchema,
  AcrithisOfferDtoSchema,
  ArbTableDtoSchema,
  ArbTableRowDtoSchema,
  Calendar1999DtoSchema,
  CalendarDayDtoSchema,
  CalendarDayEventDtoSchema,
  ClanRewardDtoSchema,
  ClanRewardTierDtoSchema,
  ConclaveChallengeDtoSchema,
  ConstructionAssaultDtoSchema,
  ConstructionDtoSchema,
  ConstructionProjectDtoSchema,
  DailyDealDtoSchema,
  DescendiaDtoSchema,
  DescendiaFloorDtoSchema,
  EMPTY_WORLDSTATE_DAILY_SLICES,
  EssenceShopDtoSchema,
  EventDtoSchema,
  FlashSaleDtoSchema,
  IncarnonRotationDtoSchema,
  IncarnonWeaponDtoSchema,
  IncursionsDtoSchema,
  KuvaDtoSchema,
  NewsItemDtoSchema,
  ShopOfferDtoSchema,
  SynthTargetDtoSchema,
  TimerRowDtoSchema,
  TimersDtoSchema,
  VoidStormDtoSchema,
  type AcrithisDto,
  type AcrithisOfferDto,
  type ArbTableDto,
  type ArbTableRowDto,
  type Calendar1999Dto,
  type CalendarDayDto,
  type CalendarDayEventDto,
  type ClanRewardDto,
  type ClanRewardTierDto,
  type ConclaveChallengeDto,
  type ConstructionAssaultDto,
  type ConstructionDto,
  type ConstructionProjectDto,
  type DailyDealDto,
  type DescendiaDto,
  type DescendiaFloorDto,
  type EssenceShopDto,
  type EventDto,
  type FlashSaleDto,
  type IncarnonRotationDto,
  type IncarnonWeaponDto,
  type IncursionsDto,
  type KuvaDto,
  type NewsItemDto,
  type ShopOfferDto,
  type SynthTargetDto,
  type TimerRowDto,
  type TimersDto,
  type VoidStormDto,
} from './dto/worldstate-daily.js';

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

export { GATED_MODULE_IDS, ModuleIdSchema, RESERVED_MODULE_IDS, type ModuleId } from './modules.js';

export {
  MARKET_ORDERS_PAGE_SIZE,
  MarketListingDtoSchema,
  MarketOrdersDtoSchema,
  MarketOrdersQuerySchema,
  MarketResolvedTargetSchema,
  MarketSearchDtoSchema,
  MarketSellerStatusSchema,
  MarketSetComponentSchema,
  RivenAttributeDtoSchema,
  RivenListingDtoSchema,
  RivenOrdersDtoSchema,
  RivenOrdersQuerySchema,
  RivenSearchDtoSchema,
  type MarketListingDto,
  type MarketOrdersDto,
  type MarketOrdersQuery,
  type MarketResolvedTarget,
  type MarketSearchDto,
  type MarketSellerStatus,
  type MarketSetComponent,
  type RivenAttributeDto,
  type RivenListingDto,
  type RivenOrdersDto,
  type RivenOrdersQuery,
  type RivenSearchDto,
} from './dto/market.js';

export {
  DUCAT_TIER_VALUES,
  DucatJunkDtoSchema,
  DucatJunkQuerySchema,
  DucatJunkRowSchema,
  DucatTierSchema,
  MarketRankCategorySchema,
  MarketRankDtoSchema,
  MarketRankQuerySchema,
  MarketRankRowSchema,
  MarketTrendDtoSchema,
  MarketTrendPointSchema,
  MarketTrendQuerySchema,
  MarketTrendSummarySchema,
  type DucatJunkDto,
  type DucatJunkRow,
  type DucatTier,
  type MarketRankCategory,
  type MarketRankDto,
  type MarketTrendDto,
} from './dto/market-wave2.js';

export {
  DispositionDtoSchema,
  DispositionRowSchema,
  LichAuctionsDtoSchema,
  LichAuctionsQuerySchema,
  LichListingDtoSchema,
  RivenAnalysisDtoSchema,
  RivenAnalysisQuerySchema,
  RivenRangesDtoSchema,
  RivenSpliceDtoSchema,
  RivenSpliceRecipeDtoSchema,
  RivenStatAnalysisDtoSchema,
  type DispositionDto,
  type LichAuctionsDto,
  type RivenAnalysisDto,
  type RivenRangesDto,
  type RivenSpliceDto,
} from './dto/riven-tools.js';

export {
  OpenRelicDtoSchema,
  OpenRelicRowSchema,
  PartSourceRowSchema,
  PartsDtoSchema,
  RelicDtoSchema,
  RelicQueryDtoSchema,
  RelicRaritySchema,
  RelicRewardSlotSchema,
  type OpenRelicDto,
  type PartsDto,
  type RelicQueryDto,
  type RelicRarity,
} from './dto/relic.js';

export {
  RIVEN_STAT_ZH,
  UNIFIED_DISPOSITION,
  analyzeRivenStats,
  deviationPct,
  factorFor,
  listSpliceRecipes,
  listStatRangesForClass,
  parseRivenAnalysisText,
  rangePosition,
  resolveRivenStatId,
  resolveRivenWeaponClass,
  statRange,
  type RivenStatAnalysis,
  type RivenStatInput,
  type RivenWeaponClass,
} from './riven/analysis.js';

export {
  expandQueryCandidates,
  resolveBestItem,
  scoreItemMatch,
  scoreItemMatchWithAliases,
  type ItemIndexRow,
  type ResolvedItemHit,
} from './market/resolve-item.js';

export {
  WFM_STATIC_ASSET_BASE,
  formatDucatsLabel,
  formatMarketPlatinumLabel,
  formatMarketPriceQuantity,
  formatMarketQuantityLabel,
  formatMarketWhisper,
  formatSellerReputationLabel,
  formatSellerStatusLabel,
  resolveWfmAssetUrl,
  sellerStatusTone,
} from './market/display.js';

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
  RESERVED_SUBSCRIBABLE_MODULE_IDS,
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
  WikiDtoSchema,
  TranslateDtoSchema,
  TranslatePairSchema,
  ValenceFusionDtoSchema,
  ValenceMaterialDtoSchema,
  type WikiDto,
  type TranslateDto,
  type ValenceFusionDto,
} from './dto/wiki-tools.js';

export {
  VALENCE_CAP_PCT,
  VALENCE_ELEMENT_LABEL_EN,
  VALENCE_ELEMENT_LABEL_ZH,
  fusionStepsToCap,
  parseValenceElement,
  parseValenceMaterialTokens,
  valenceBonusPct,
  valenceFusion,
  type ValenceFusionResult,
  type ValenceMaterialToken,
} from './valence/fusion.js';

export {
  bilingualLookup,
  buildBilingualIndex,
  type BilingualLookupResult,
  type BilingualNameIndex,
  type BilingualNamePair,
  type TranslateDirection,
} from './names/bilingual-lookup.js';

export { hasCjk, normalizeName } from './names/normalize-name.js';

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

export {
  applyBountyMapFilter,
  isBountyMapFilterActive,
  parseBountyMapTokens,
  type BountyMapFilter,
} from './bounties/filter-bounties.js';
