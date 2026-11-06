/**
 * `@lanius/render` — 将 DTO 渲染为 QQ 图片回复用的 PNG 卡片（Vue + Playwright）。
 */

export {
  captureVueCard,
  shutdownVueCardCapture,
  type CaptureVueCardInput,
} from './chromium/capture-vue-card.js';
export type { CardKind } from './chromium/card-kind.js';
export {
  renderAlertsCard,
  renderArbitrationCard,
  renderArchimedeaCard,
  renderBountiesCard,
  renderCircuitCard,
  renderArchonCard,
  renderDenseListCard,
  renderFissuresCard,
  renderHelpCard,
  renderInvasionsCard,
  renderMarketCard,
  renderNightwaveCard,
  renderRivenCard,
  renderSortieCard,
  renderVarziaCard,
  renderVoidTraderCard,
  renderWeaponRotationCard,
  renderWikiCard,
  renderValenceCard,
  renderWorldstateCard,
  type RenderWorldstateCardInput,
} from './render-worldstate.js';
export type { DenseListCardPayload, DenseListRow } from './vue-cards/dense-list-types.js';
export {
  CARD_SKINS,
  DEFAULT_CARD_SKIN,
  listCardSkinIds,
  resolveCardSkin,
  type CardSkinDef,
  type CardSkinId,
} from './vue-cards/skins.js';
export { renderWave2LinesCard, type RenderWave2LinesInput } from './render-wave2.js';
