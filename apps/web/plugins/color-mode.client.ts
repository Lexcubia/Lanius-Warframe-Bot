/**
 * 颜色模式：公开站固定亮色 anime；管理后台可保留本地暗色偏好。
 */
import { useLaniusColorMode } from '~/composables/useLaniusColorMode';

export default defineNuxtPlugin(() => {
  const route = useRoute();
  const { restoreMode, setMode } = useLaniusColorMode();

  /**
   * 当前是否管理后台路径。
   *
   * @returns 是否 `/admin`
   */
  function isAdminPath(): boolean {
    const path = route.path;
    return path === '/admin' || path.endsWith('/admin');
  }

  /**
   * 按路由应用颜色模式。
   *
   * @returns 无返回值
   */
  function syncColorMode(): void {
    if (isAdminPath()) {
      restoreMode();
      return;
    }
    // 公开站统一亮色，避免与暖底 token 冲突
    setMode('light');
  }

  watch(() => route.path, syncColorMode, { immediate: true });
});
