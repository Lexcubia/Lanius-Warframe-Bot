import type {
  HelpDto,
  Locale,
  MarketSearchDto,
  RivenSearchDto,
  WorldstateDto,
} from '@lanius/core';
import {
  CyclesModuleCard,
  FissuresModuleCard,
  HelpModuleCard,
  InvasionsModuleCard,
  MarketModuleCard,
  NightwaveModuleCard,
  RivenModuleCard,
} from '@lanius/ui';
import '@lanius/ui/tokens.css';
import '@fontsource/noto-sans-sc/chinese-simplified-400.css';
import '@fontsource/noto-sans-sc/chinese-simplified-700.css';
import '@fontsource/noto-sans-sc/latin-400.css';
import '@fontsource/noto-sans-sc/latin-700.css';
import { createApp, type App, type Component } from 'vue';

import './host.css';

/**
 * 卡片宿主可挂载的模块种类。
 */
export type CardHostKind =
  | 'cycles'
  | 'fissures'
  | 'invasions'
  | 'nightwave'
  | 'help'
  | 'market'
  | 'riven';

/**
 * Playwright `page.evaluate` 注入的挂载载荷。
 */
export type CardHostPayload = {
  kind: CardHostKind;
  locale: Locale;
  stale?: boolean;
  worldstate?: WorldstateDto;
  help?: HelpDto;
  market?: MarketSearchDto;
  riven?: RivenSearchDto;
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
 * 当前 Vue 应用实例。
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
    case 'help':
      return HelpModuleCard;
    case 'market':
      return MarketModuleCard;
    case 'riven':
      return RivenModuleCard;
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unknown card kind: ${_exhaustive}`);
    }
  }
}

/**
 * 将指定模块卡片挂载到 `#app`。
 *
 * @param payload - 种类与载荷
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
  const props: Record<string, unknown> = {
    locale: payload.locale,
    stale: payload.stale ?? false,
  };
  if (payload.kind === 'help') {
    props.help = payload.help;
  } else if (payload.kind === 'market') {
    props.market = payload.market;
  } else if (payload.kind === 'riven') {
    props.riven = payload.riven;
  } else {
    props.worldstate = payload.worldstate;
  }
  activeApp = createApp(Card, props);
  activeApp.mount(root);
  window.__LANIUS_CARD_READY__ = true;
}

window.__LANIUS_MOUNT_CARD__ = mountCard;
