/**
 * `@lanius/render` — 将 DTO 渲染为 QQ 图片回复用的 PNG 卡片。
 */

export {
  captureVueCard,
  shutdownVueCardCapture,
  type CaptureVueCardInput,
} from './chromium/capture-vue-card.js';
export type { CardKind } from './chromium/card-kind.js';
export {
  buildCycleRingDataUrl,
  type CycleRingSvgInput,
} from './cycle-ring-svg.js';
export { rasterizeCard } from './rasterize-card.js';
export {
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
  buildWorldstateCardTree,
  estimateWorldstateCardHeight,
  type WorldstateCardOptions,
} from './worldstate-card.js';
export {
  buildFissuresCardTree,
  estimateFissuresCardHeight,
  type FissuresCardOptions,
} from './fissures-card.js';
export {
  buildInvasionsCardTree,
  estimateInvasionsCardHeight,
  type InvasionsCardOptions,
} from './invasions-card.js';
export {
  buildNightwaveCardTree,
  estimateNightwaveCardHeight,
  type NightwaveCardOptions,
} from './nightwave-card.js';
