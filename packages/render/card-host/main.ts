import type { Locale, WorldstateDto } from '@lanius/core';
import {
  CyclesModuleCard,
  FissuresModuleCard,
  InvasionsModuleCard,
  NightwaveModuleCard,
} from '@lanius/ui';
import '@lanius/ui/tokens.css';
import { createApp, type App, type Component } from 'vue';

import './host.css';

/**
 * 卡片宿主可挂载的模块种类。
 */
export type CardHostKind = 'cycles' | 'fissures' | 'invasions' | 'nightwave';

/**
 * Playwright `page.evaluate` 注入的挂载载荷。
 */
export type CardHostPayload = {
  kind: CardHostKind;
  worldstate: WorldstateDto;
  locale: Locale;
  stale?: boolean;
};

/**
 * 暴露给页面的全局挂载入口。
 */
declare global {
  interface Window {
    __LANIUS_MOUNT_CARD__?: (payload: CardHostPayload) => void;
    __LANIUS_CARD_READY__?: boolean;
  }
}

/**
 * 当前 Vue 应用实例；重复挂载前先卸载。
 */
let activeApp: App | null = null;

/**
 * 按种类解析模块卡片组件。
 *
 * @param kind - 模块种类
 * @returns Vue 组件
 */
function resolveCardComponent(kind: CardHostKind): Component {
  switch (kind) {
    case 'cycles':
      return CyclesModuleCard;
    case 'fissures':
      return FissuresModuleCard;
    case 'invasions':
      return InvasionsModuleCard;
    case 'nightwave':
      return NightwaveModuleCard;
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown card kind: ${_exhaustive}`);
    }
  }
}

/**
 * 将指定模块卡片挂载到 `#app`，供节点截图。
 *
 * @param payload - 种类、DTO 与 locale
 * @returns 无返回值
 */
function mountCard(payload: CardHostPayload): void {
  window.__LANIUS_CARD_READY__ = false;
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('card-host missing #app');
  }
  if (activeApp) {
    activeApp.unmount();
    activeApp = null;
  }
  const Card = resolveCardComponent(payload.kind);
  activeApp = createApp(Card, {
    worldstate: payload.worldstate,
    locale: payload.locale,
    stale: payload.stale ?? false,
  });
  activeApp.mount(root);
  window.__LANIUS_CARD_READY__ = true;
}

window.__LANIUS_MOUNT_CARD__ = mountCard;
