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
  renderFissuresCard,
  renderHelpCard,
  renderInvasionsCard,
  renderMarketCard,
  renderNightwaveCard,
  renderRivenCard,
  renderVarziaCard,
  renderVoidTraderCard,
  renderWeaponRotationCard,
  renderWorldstateCard,
  type RenderWorldstateCardInput,
} from './render-worldstate.js';
export {
  CARD_SKINS,
  DEFAULT_CARD_SKIN,
  listCardSkinIds,
  resolveCardSkin,
  type CardSkinDef,
  type CardSkinId,
} from './vue-cards/skins.js';
