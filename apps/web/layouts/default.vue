<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const localePath = useLocalePath();
const route = useRoute();

const STORAGE_KEY = 'lanius.moduleNavOpen';

/**
 * 来自 i18n 模块配置的可用 locale 代码。
 */
const localeCodes = computed(() =>
  locales.value.map((entry) => (typeof entry === 'string' ? entry : entry.code)),
);

/**
 * 顶部站级菜单（首页 / 工具 / 关于 / 帮助 / 订阅）。
 */
const topNav = [
  { to: '/', key: 'nav.home' },
  { to: '/tools', key: 'nav.tools' },
  { to: '/about', key: 'nav.about' },
  { to: '/help', key: 'nav.help' },
  { to: '/subscribe', key: 'nav.subscribe' },
] as const;

/**
 * 浮动侧栏：首页看板模块锚点（与 `pages/index.vue` catalog 对齐）。
 */
const moduleNav = [
  { hash: 'mod-worldstate', key: 'nav.worldstate' },
  { hash: 'mod-fissures', key: 'nav.fissures' },
  { hash: 'mod-invasions', key: 'home.mod.invasions' },
  { hash: 'mod-nightwave', key: 'home.mod.nightwave' },
  { hash: 'mod-traders', key: 'nav.traders' },
  { hash: 'mod-tenet', key: 'rotations.tenet' },
  { hash: 'mod-coda', key: 'rotations.coda' },
] as const;

/** 浮动模块导航是否展开（收起时完全隐藏，不占主区）。 */
const navOpen = ref(false);

/**
 * 当前是否落在首页（含默认 locale 前缀）。
 *
 * @returns 是否首页路由
 */
const isHome = computed(() => {
  const home = localePath('/');
  return route.path === home || route.path === `${home}/`;
});

/**
 * 构造首页模块锚点路由。
 *
 * @param hash - 不含 `#` 的锚点 id
 * @returns Vue Router 目标
 */
function moduleLink(hash: string): { path: string; hash: string } {
  return { path: localePath('/'), hash: `#${hash}` };
}

/**
 * 侧栏模块项是否为当前激活锚点。
 *
 * @param hash - 模块锚点 id
 * @returns 是否高亮
 */
function isModuleActive(hash: string): boolean {
  return isHome.value && route.hash === `#${hash}`;
}

/**
 * 是否窄屏。
 *
 * @returns 是否 ≤820px
 */
function isMobile(): boolean {
  return import.meta.client && window.matchMedia('(max-width: 820px)').matches;
}

/**
 * 从 localStorage 恢复开合；无记录时桌面默认开、窄屏默认关。
 *
 * @returns 无返回值
 */
function restoreOpen(): void {
  if (!import.meta.client) return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '1' || saved === '0') {
      navOpen.value = saved === '1';
      return;
    }
  } catch {
    /* ignore */
  }
  navOpen.value = !isMobile();
}

/**
 * 持久化开合状态。
 *
 * @param open - 是否展开
 * @returns 无返回值
 */
function persistOpen(open: boolean): void {
  if (!import.meta.client) return;
  try {
    localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/**
 * 打开浮动侧栏。
 *
 * @returns 无返回值
 */
function openNav(): void {
  navOpen.value = true;
  persistOpen(true);
}

/**
 * 关闭浮动侧栏（完全收起）。
 *
 * @returns 无返回值
 */
function closeNav(): void {
  navOpen.value = false;
  persistOpen(false);
}

/**
 * 窄屏时若打开侧栏则锁滚动，避免背后页面跟着滚。
 *
 * @param open - 是否展开
 * @returns 无返回值
 */
function syncBodyScroll(open: boolean): void {
  if (!import.meta.client) return;
  document.documentElement.style.overflow =
    open && isMobile() ? 'hidden' : '';
}

watch(
  () => route.fullPath,
  () => {
    // 路由变化后保持用户偏好；仅在窄屏默认关时不强制关
    if (isMobile()) {
      closeNav();
    }
  },
);

watch(navOpen, (open) => {
  syncBodyScroll(open);
});

onMounted(() => {
  restoreOpen();
  syncBodyScroll(navOpen.value);
});

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.documentElement.style.overflow = '';
});
</script>

<template>
  <div class="shell" :class="{ 'shell--nav-open': navOpen }">
    <header class="shell__bar">
      <NuxtLink :to="localePath('/')" class="shell__brand">
        <span class="shell__mark">L</span>
        <span>{{ t('brand') }}</span>
      </NuxtLink>
      <nav class="shell__nav" aria-label="Site">
        <NuxtLink
          v-for="item in topNav"
          :key="item.to"
          :to="localePath(item.to)"
        >
          {{ t(item.key) }}
        </NuxtLink>
      </nav>
      <div class="shell__locales">
        <NuxtLink
          v-for="code in localeCodes"
          :key="code"
          :to="switchLocalePath(code)"
          class="shell__locale"
          :class="{ 'shell__locale--active': locale === code }"
          @click="setLocale(code)"
        >
          {{ code }}
        </NuxtLink>
      </div>
    </header>

    <!-- 浮动遮罩：点击关闭，不参与文档流 -->
    <div
      class="shell__backdrop"
      aria-hidden="true"
      @click="closeNav"
    />

    <aside
      class="shell__float"
      :aria-label="t('home.modulesNav')"
      :aria-hidden="!navOpen"
    >
      <div class="shell__float-top">
        <p class="shell__float-title">{{ t('home.modulesNav') }}</p>
        <button
          type="button"
          class="shell__close"
          :aria-label="t('nav.collapse')"
          :title="t('nav.collapse')"
          @click="closeNav"
        >
          ×
        </button>
      </div>

      <nav class="shell__links">
        <NuxtLink
          v-for="item in moduleNav"
          :key="item.hash"
          :to="moduleLink(item.hash)"
          class="shell__link"
          :class="{ 'shell__link--active': isModuleActive(item.hash) }"
          @click="closeNav"
        >
          {{ t(item.key) }}
        </NuxtLink>
      </nav>
    </aside>

    <!-- 收起后仅保留浮动展开钮，主区宽度不受影响 -->
    <button
      v-show="!navOpen"
      type="button"
      class="shell__fab"
      :aria-expanded="false"
      :aria-label="t('nav.expand')"
      :title="t('nav.expand')"
      @click="openNav"
    >
      <span class="shell__mark shell__mark--fab">≡</span>
      <span class="visually-hidden">{{ t('nav.expand') }}</span>
    </button>

    <div class="shell__content">
      <main class="shell__main">
        <slot />
      </main>
      <SiteFooter />
    </div>
  </div>
</template>

<style scoped>
.shell {
  --shell-float-w: 13rem;
  --shell-float-gap: 0.85rem;
  min-height: 100vh;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  overflow-x: clip;
}

.shell__bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem clamp(1rem, 4vw, 2rem);
  border-bottom: 1px solid var(--anime-line, var(--lanius-border, #e4d5c8));
  background: rgba(255, 250, 245, 0.92);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 40;
  box-shadow: 0 8px 24px rgba(62, 78, 110, 0.06);
  max-width: 100%;
  min-width: 0;
  color: var(--anime-ink, var(--lanius-text, #2a3142));
}

.shell__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-family: var(--lanius-font-display);
  font-weight: 700;
  letter-spacing: 0.04em;
  font-size: 1.15rem;
  color: var(--lanius-brand);
  text-decoration: none;
  flex-shrink: 0;
}

.shell__mark {
  width: 1.6rem;
  height: 1.6rem;
  display: grid;
  place-items: center;
  background: linear-gradient(
    145deg,
    var(--anime-coral, #ff7a6e),
    var(--anime-peach, #ffb38a)
  );
  color: #fff;
  font-size: 0.95rem;
  border-radius: 10px;
  font-weight: 700;
}

.shell__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-left: 0.5rem;
  color: var(--lanius-text-muted);
  font-size: 0.95rem;
  min-width: 0;
}

.shell__nav a {
  text-decoration: none;
  color: inherit;
  transition: color 0.18s ease;
}

@media (hover: hover) {
  .shell__nav a:hover {
    color: var(--lanius-accent-dim, #2f8fc4);
  }

  .shell__fab:hover {
    border-color: rgba(78, 183, 232, 0.5);
    box-shadow: 0 10px 22px rgba(62, 78, 110, 0.16);
    transform: translateY(-1px);
  }

  .shell__link:hover {
    background: rgba(78, 183, 232, 0.1);
    color: var(--lanius-text, #2a3142);
  }

  .shell__close:hover {
    color: var(--lanius-accent-dim, #2f8fc4);
    border-color: rgba(78, 183, 232, 0.5);
    background: rgba(78, 183, 232, 0.08);
  }

  .shell__locale:hover:not(.shell__locale--active) {
    border-color: rgba(78, 183, 232, 0.4);
    background: rgba(78, 183, 232, 0.08);
    color: var(--lanius-accent-dim, #2f8fc4);
  }
}

.shell__nav a.router-link-active {
  color: var(--lanius-accent);
  font-weight: 600;
}

.shell__locales {
  margin-left: auto;
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
}

.shell__locale {
  text-transform: uppercase;
  font-family: var(--lanius-font-mono);
  font-size: 0.75rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--lanius-text-muted);
  text-decoration: none;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.shell__locale--active {
  color: var(--lanius-text);
  border-color: var(--lanius-border-bright, rgba(90, 120, 160, 0.28));
  background: var(--lanius-panel, #fff);
}

/* 浮动层：不占文档流，不影响主区宽度 */
.shell__backdrop {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: rgba(42, 49, 66, 0.28);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.shell--nav-open .shell__backdrop {
  opacity: 1;
  pointer-events: auto;
}

.shell__float {
  position: fixed;
  z-index: 50;
  left: var(--shell-float-gap);
  top: calc(3.6rem + var(--shell-float-gap));
  bottom: var(--shell-float-gap);
  width: min(var(--shell-float-w), calc(100vw - var(--shell-float-gap) * 2));
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem 0.75rem;
  border: 1px solid var(--anime-line, var(--lanius-border, #e4d5c8));
  border-radius: 18px;
  background: rgba(255, 250, 245, 0.96);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 44px rgba(62, 78, 110, 0.14);
  color: var(--anime-ink, var(--lanius-text, #2a3142));
  transform: translateX(calc(-100% - var(--shell-float-gap) - 12px));
  opacity: 0;
  pointer-events: none;
  transition:
    transform 0.22s ease,
    opacity 0.2s ease;
}

.shell--nav-open .shell__float {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}

.shell__float-top {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2rem;
}

.shell__float-title {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lanius-text-muted, #6b7385);
  font-family: var(--lanius-font-display);
}

.shell__close {
  flex-shrink: 0;
  width: 1.7rem;
  height: 1.7rem;
  border: 1px solid var(--lanius-border, rgba(90, 120, 160, 0.2));
  border-radius: 8px;
  background: #fff;
  color: var(--lanius-text-muted, #6b7385);
  font-size: 1.15rem;
  line-height: 1;
  cursor: pointer;
  display: grid;
  place-items: center;
  padding: 0;
}

.shell__links {
  display: grid;
  gap: 0.2rem;
  flex: 1;
  align-content: start;
  overflow: auto;
}

.shell__link {
  display: flex;
  align-items: center;
  min-height: 2.25rem;
  padding: 0.4rem 0.65rem;
  border-radius: 10px;
  color: var(--lanius-text-muted, #6b7385);
  font-size: 0.92rem;
  font-weight: 600;
  text-decoration: none;
}

.shell__link--active {
  background: rgba(78, 183, 232, 0.14);
  color: var(--lanius-accent-dim, #2f8fc4);
}

.shell__fab {
  position: fixed;
  z-index: 55;
  left: var(--shell-float-gap);
  bottom: var(--shell-float-gap);
  width: 2.85rem;
  height: 2.85rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--anime-line, var(--lanius-border, #e4d5c8));
  border-radius: 14px;
  background: rgba(255, 250, 245, 0.96);
  box-shadow: 0 12px 28px rgba(62, 78, 110, 0.14);
  cursor: pointer;
  padding: 0;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.shell__mark--fab {
  width: 1.85rem;
  height: 1.85rem;
  font-size: 1.1rem;
}

/* 主区始终全宽，侧栏 float 不顶开布局 */
.shell__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
  background: transparent;
  color: var(--anime-ink, var(--lanius-text, #2a3142));
}

.shell__main {
  width: min(1120px, 100%);
  max-width: 100%;
  margin: 0 auto;
  padding: clamp(1rem, 3.5vw, 2.25rem) clamp(0.85rem, 3.5vw, 2rem) 2.5rem;
  flex: 1;
  min-width: 0;
  overflow-x: clip;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 820px) {
  .shell__bar {
    flex-wrap: wrap;
    gap: 0.55rem 0.75rem;
    padding: 0.7rem 0.85rem;
  }

  .shell__nav {
    order: 3;
    width: 100%;
    margin-left: 0;
    gap: 0.65rem;
    font-size: 0.88rem;
  }

  .shell__float {
    top: var(--shell-float-gap);
    bottom: var(--shell-float-gap);
    width: min(16rem, calc(100vw - var(--shell-float-gap) * 2));
  }

  .shell__main {
    padding: 1rem clamp(0.75rem, 3.5vw, 1.25rem) 1.75rem;
  }
}
</style>
