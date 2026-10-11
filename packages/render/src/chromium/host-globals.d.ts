/**
 * 卡片宿主页注入到 `window` 的挂载 API（Playwright evaluate 侧可见）。
 */
interface Window {
  __LANIUS_MOUNT_CARD__?: (payload: {
    kind: 'cycles' | 'fissures' | 'invasions' | 'nightwave';
    worldstate: unknown;
    locale: 'zh' | 'en';
    stale?: boolean;
  }) => void;
  __LANIUS_CARD_READY__?: boolean;
}
