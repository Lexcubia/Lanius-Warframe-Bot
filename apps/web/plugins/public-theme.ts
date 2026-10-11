/**
 * 公开站视觉主题：暖底 anime；与 Admin 暗壳分离。
 * 公开页强制 `color-scheme: light`，避免系统暗色 / 半成品 `theme-dark` 把配色打乱。
 */
export default defineNuxtPlugin(() => {
  const route = useRoute();

  /**
   * 当前是否管理后台路径。
   *
   * @returns 是否 `/admin`
   */
  const isAdmin = computed(() => {
    const path = route.path;
    return path === '/admin' || path.endsWith('/admin');
  });

  useHead({
    bodyAttrs: {
      class: computed(() => (isAdmin.value ? '' : 'theme-anime')),
    },
    htmlAttrs: {
      style: computed(() =>
        isAdmin.value ? undefined : 'color-scheme: light',
      ),
    },
  });

  /**
   * 客户端清理暗色残留 class。
   *
   * @returns 无返回值
   */
  function clearPublicDark(): void {
    if (!import.meta.client || isAdmin.value) return;
    document.documentElement.classList.remove('theme-dark', 'dark');
    document.documentElement.classList.remove('theme-anime-boot');
    document.documentElement.style.colorScheme = 'light';
    document.body.classList.add('theme-anime');
  }

  watch(isAdmin, clearPublicDark, { immediate: true });
});
