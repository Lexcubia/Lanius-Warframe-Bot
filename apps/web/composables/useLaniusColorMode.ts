/**
 * 公开站亮色 / 暗色模式（localStorage 持久化；无记录时跟随系统偏好）。
 * 命名刻意避开 Nuxt UI / `@nuxtjs/color-mode` 的 `useColorMode`，防止自动导入冲突。
 */

const STORAGE_KEY = 'lanius.colorMode';

export type LaniusColorMode = 'light' | 'dark';

/**
 * 读取并切换页面颜色模式，同步 `html.theme-dark` 与 `color-scheme`。
 *
 * @returns mode 状态、是否暗色、切换与设置方法
 */
export function useLaniusColorMode() {
  const mode = useState<LaniusColorMode>('lanius-color-mode', () => 'light');

  /**
   * 将模式应用到 documentElement。
   *
   * @param next - `light` | `dark`
   * @returns 无返回值
   */
  function applyMode(next: LaniusColorMode): void {
    if (!import.meta.client) return;
    const root = document.documentElement;
    root.classList.toggle('theme-dark', next === 'dark');
    root.style.colorScheme = next;
  }

  /**
   * 写入模式并持久化。
   *
   * @param next - 目标模式
   * @returns 无返回值
   */
  function setMode(next: LaniusColorMode): void {
    mode.value = next;
    applyMode(next);
    if (!import.meta.client) return;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  /**
   * 在亮色与暗色间切换。
   *
   * @returns 无返回值
   */
  function toggleMode(): void {
    setMode(mode.value === 'dark' ? 'light' : 'dark');
  }

  /**
   * 从 localStorage / 系统偏好恢复模式。
   *
   * @returns 无返回值
   */
  function restoreMode(): void {
    if (!import.meta.client) return;
    let next: LaniusColorMode = 'light';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        next = saved;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        next = 'dark';
      }
    } catch {
      next = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    mode.value = next;
    applyMode(next);
  }

  const isDark = computed(() => mode.value === 'dark');

  return {
    mode,
    isDark,
    setMode,
    toggleMode,
    restoreMode,
  };
}
