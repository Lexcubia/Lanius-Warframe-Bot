import type { Locale, WorldstateDto } from '@lanius/core';

import { captureVueCard } from './chromium/capture-vue-card.js';

/**
 * 渲染卡片的公共入参。
 */
export type RenderWorldstateCardInput = {
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/**
 * 渲染「世界状态」开放世界周期 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderWorldstateCard(
  input: RenderWorldstateCardInput,
): Promise<Buffer> {
  return captureVueCard({ kind: 'cycles', ...input });
}

/**
 * 渲染「入侵」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderInvasionsCard(
  input: RenderWorldstateCardInput,
): Promise<Buffer> {
  return captureVueCard({ kind: 'invasions', ...input });
}

/**
 * 渲染「午夜电波」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderNightwaveCard(
  input: RenderWorldstateCardInput,
): Promise<Buffer> {
  return captureVueCard({ kind: 'nightwave', ...input });
}

/**
 * 渲染「虚空裂隙」独立模块 PNG（Vue + Playwright 节点截图）。
 *
 * @param input - 世界状态载荷
 * @returns PNG 字节
 */
export async function renderFissuresCard(
  input: RenderWorldstateCardInput,
): Promise<Buffer> {
  return captureVueCard({ kind: 'fissures', ...input });
}

/**
 * 渲染帮助卡片 PNG。
 *
 * @param input - 帮助 DTO 与 locale
 * @returns PNG 字节
 */
export async function renderHelpCard(input: {
  help: import('@lanius/core').HelpDto;
  locale: import('@lanius/core').Locale;
}): Promise<Buffer> {
  return captureVueCard({ kind: 'help', locale: input.locale, help: input.help });
}

/**
 * 渲染市场卡片 PNG。
 *
 * @param input - 市场 DTO 与 locale
 * @returns PNG 字节
 */
export async function renderMarketCard(input: {
  market: import('@lanius/core').MarketSearchDto;
  locale: import('@lanius/core').Locale;
}): Promise<Buffer> {
  return captureVueCard({
    kind: 'market',
    locale: input.locale,
    market: input.market,
  });
}

/**
 * 渲染紫卡卡片 PNG。
 *
 * @param input - 紫卡 DTO 与 locale
 * @returns PNG 字节
 */
export async function renderRivenCard(input: {
  riven: import('@lanius/core').RivenSearchDto;
  locale: import('@lanius/core').Locale;
}): Promise<Buffer> {
  return captureVueCard({
    kind: 'riven',
    locale: input.locale,
    riven: input.riven,
  });
}

/**
 * 渲染虚空商人卡片 PNG。
 *
 * @param input - 虚空商人 DTO 与 locale
 * @returns PNG 字节
 */
export async function renderVoidTraderCard(input: {
  voidTrader: import('@lanius/core').VoidTraderDto;
  locale: import('@lanius/core').Locale;
  stale?: boolean;
}): Promise<Buffer> {
  return captureVueCard({
    kind: 'voidTrader',
    locale: input.locale,
    stale: input.stale,
    voidTrader: input.voidTrader,
  });
}

/**
 * 渲染瓦奇娅卡片 PNG。
 *
 * @param input - 瓦奇娅 DTO 与 locale
 * @returns PNG 字节
 */
export async function renderVarziaCard(input: {
  varzia: import('@lanius/core').VarziaDto;
  locale: import('@lanius/core').Locale;
  stale?: boolean;
}): Promise<Buffer> {
  return captureVueCard({
    kind: 'varzia',
    locale: input.locale,
    stale: input.stale,
    varzia: input.varzia,
  });
}

/**
 * 渲染信条 / 终幕轮换卡片 PNG。
 *
 * @param input - 武器轮换 DTO 与 locale
 * @returns PNG 字节
 */
export async function renderWeaponRotationCard(input: {
  rotation: import('@lanius/core').WeaponRotationDto;
  locale: import('@lanius/core').Locale;
  stale?: boolean;
}): Promise<Buffer> {
  return captureVueCard({
    kind: 'weaponRotation',
    locale: input.locale,
    stale: input.stale,
    weaponRotation: input.rotation,
  });
}
