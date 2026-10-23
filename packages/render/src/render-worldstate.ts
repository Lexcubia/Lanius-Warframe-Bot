import type { Locale, WorldstateDto } from '@lanius/core';

import { captureVueCard } from './chromium/capture-vue-card.js';
import type { CardSkinId } from './vue-cards/skins.js';

/**
 * 渲染卡片的公共入参（含可选 QQ 皮肤）。
 */
export type RenderWorldstateCardInput = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
  /** QQ 皮肤；缺省 light */
  skin?: CardSkinId | string;
};

/**
 * 带可选皮肤的公共渲染字段。
 */
type SkinOpt = {
  /** QQ 皮肤；缺省 light */
  skin?: CardSkinId | string;
};

/**
 * 渲染「世界状态」开放世界周期 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderWorldstateCard(input: RenderWorldstateCardInput): Promise<Buffer> {
  return captureVueCard({ kind: 'cycles', ...input });
}

/**
 * 渲染「入侵」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderInvasionsCard(input: RenderWorldstateCardInput): Promise<Buffer> {
  return captureVueCard({ kind: 'invasions', ...input });
}

/**
 * 渲染「午夜电波」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderNightwaveCard(input: RenderWorldstateCardInput): Promise<Buffer> {
  return captureVueCard({ kind: 'nightwave', ...input });
}

/**
 * 渲染「科研」独立模块 PNG（精英 / 时光；与警报无关）。
 *
 * @param input - 世界状态载荷；可选 `kind` 过滤子类（勿与 CardKind 混淆）
 * @returns PNG 字节
 */
export async function renderArchimedeaCard(
  input: RenderWorldstateCardInput & { kind?: import('@lanius/core').ArchimedeaKind },
): Promise<Buffer> {
  const { kind: archimedeaKind, ...rest } = input;
  return captureVueCard({
    kind: 'archimedea',
    ...rest,
    ...(archimedeaKind ? { archimedeaKind } : {}),
  });
}

/**
 * 渲染「虚空裂隙」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderFissuresCard(input: RenderWorldstateCardInput): Promise<Buffer> {
  return captureVueCard({ kind: 'fissures', ...input });
}

/**
 * 渲染「警报」独立模块 PNG（Vue + Playwright 节点截图）。
 * 与科研卡完全分离；空态由卡片展示「当前无警报」。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderAlertsCard(input: RenderWorldstateCardInput): Promise<Buffer> {
  return captureVueCard({ kind: 'alerts', ...input });
}

/**
 * 渲染「仲裁」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷（含 `arbitration` 切片）
 * @returns PNG 字节
 */
export async function renderArbitrationCard(input: RenderWorldstateCardInput): Promise<Buffer> {
  return captureVueCard({ kind: 'arbitration', ...input });
}

/**
 * 渲染「回廊 / Circuit」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷（读取 `circuit` 切片）
 * @returns PNG 字节
 */
export async function renderCircuitCard(input: RenderWorldstateCardInput): Promise<Buffer> {
  return captureVueCard({ kind: 'circuit', ...input });
}

/**
 * 渲染帮助卡片 PNG。
 *
 * @param input - 帮助 DTO、locale 与可选皮肤
 * @returns PNG 字节
 */
export async function renderHelpCard(
  input: {
    help: import('@lanius/core').HelpDto;
    locale: import('@lanius/core').Locale;
  } & SkinOpt,
): Promise<Buffer> {
  return captureVueCard({
    kind: 'help',
    locale: input.locale,
    help: input.help,
    skin: input.skin,
  });
}

/**
 * 渲染市场卡片 PNG。
 *
 * @param input - 市场 DTO、locale 与可选皮肤
 * @returns PNG 字节
 */
export async function renderMarketCard(
  input: {
    market: import('@lanius/core').MarketSearchDto;
    locale: import('@lanius/core').Locale;
  } & SkinOpt,
): Promise<Buffer> {
  return captureVueCard({
    kind: 'market',
    locale: input.locale,
    market: input.market,
    skin: input.skin,
  });
}

/**
 * 渲染紫卡卡片 PNG。
 *
 * @param input - 紫卡 DTO、locale 与可选皮肤
 * @returns PNG 字节
 */
export async function renderRivenCard(
  input: {
    riven: import('@lanius/core').RivenSearchDto;
    locale: import('@lanius/core').Locale;
  } & SkinOpt,
): Promise<Buffer> {
  return captureVueCard({
    kind: 'riven',
    locale: input.locale,
    riven: input.riven,
    skin: input.skin,
  });
}

/**
 * 渲染虚空商人卡片 PNG。
 *
 * @param input - 虚空商人 DTO、locale 与可选皮肤
 * @returns PNG 字节
 */
export async function renderVoidTraderCard(
  input: {
    voidTrader: import('@lanius/core').VoidTraderDto;
    locale: import('@lanius/core').Locale;
    stale?: boolean;
  } & SkinOpt,
): Promise<Buffer> {
  return captureVueCard({
    kind: 'voidTrader',
    locale: input.locale,
    stale: input.stale,
    voidTrader: input.voidTrader,
    skin: input.skin,
  });
}

/**
 * 渲染瓦奇娅卡片 PNG。
 *
 * @param input - 瓦奇娅 DTO、locale 与可选皮肤
 * @returns PNG 字节
 */
export async function renderVarziaCard(
  input: {
    varzia: import('@lanius/core').VarziaDto;
    locale: import('@lanius/core').Locale;
    stale?: boolean;
  } & SkinOpt,
): Promise<Buffer> {
  return captureVueCard({
    kind: 'varzia',
    locale: input.locale,
    stale: input.stale,
    varzia: input.varzia,
    skin: input.skin,
  });
}

/**
 * 渲染信条 / 终幕轮换卡片 PNG。
 *
 * @param input - 武器轮换 DTO、locale 与可选皮肤
 * @returns PNG 字节
 */
export async function renderWeaponRotationCard(
  input: {
    rotation: import('@lanius/core').WeaponRotationDto;
    locale: import('@lanius/core').Locale;
    stale?: boolean;
  } & SkinOpt,
): Promise<Buffer> {
  return captureVueCard({
    kind: 'weaponRotation',
    locale: input.locale,
    stale: input.stale,
    weaponRotation: input.rotation,
    skin: input.skin,
  });
}
