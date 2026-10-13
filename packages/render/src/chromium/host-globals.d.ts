/**
 * 卡片宿主页注入到 `window` 的挂载 API（Playwright evaluate 侧可见）。
 */
interface Window {
  __LANIUS_MOUNT_CARD__?: (payload: {
    kind:
      | 'cycles'
      | 'fissures'
      | 'invasions'
      | 'nightwave'
      | 'help'
      | 'market'
      | 'riven'
      | 'voidTrader'
      | 'varzia'
      | 'weaponRotation';
    locale: 'zh' | 'en';
    stale?: boolean;
    worldstate?: unknown;
    help?: unknown;
    market?: unknown;
    riven?: unknown;
    voidTrader?: unknown;
    varzia?: unknown;
    weaponRotation?: unknown;
  }) => void;
  __LANIUS_CARD_READY__?: boolean;
}
