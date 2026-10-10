<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const localePath = useLocalePath();

/**
 * 来自 i18n 模块配置的可用 locale 代码。
 */
const localeCodes = computed(() =>
  locales.value.map((entry) => (typeof entry === 'string' ? entry : entry.code)),
);
</script>

<template>
  <div class="shell">
    <header class="shell__bar">
      <NuxtLink :to="localePath('/')" class="shell__brand">
        <span class="shell__mark">L</span>
        <span>{{ t('brand') }}</span>
      </NuxtLink>
      <nav class="shell__nav">
        <NuxtLink :to="localePath('/')">{{ t('nav.home') }}</NuxtLink>
        <NuxtLink :to="localePath('/worldstate')">{{ t('nav.worldstate') }}</NuxtLink>
        <NuxtLink :to="localePath('/help')">{{ t('nav.help') }}</NuxtLink>
        <NuxtLink to="/admin">{{ t('nav.admin') }}</NuxtLink>
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
    <main class="shell__main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.shell__bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem clamp(1rem, 4vw, 2rem);
  border-bottom: 1px solid var(--lanius-border);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 20;
  box-shadow: 0 8px 24px rgba(28, 47, 66, 0.04);
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
}

.shell__mark {
  width: 1.6rem;
  height: 1.6rem;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--lanius-accent), #38bdf8);
  color: #ffffff;
  font-size: 0.95rem;
  border-radius: 8px;
  font-weight: 700;
}

.shell__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-left: 0.5rem;
  color: var(--lanius-text-muted);
  font-size: 0.95rem;
}

.shell__nav a.router-link-active {
  color: var(--lanius-accent);
}

.shell__locales {
  margin-left: auto;
  display: flex;
  gap: 0.35rem;
}

.shell__locale {
  text-transform: uppercase;
  font-family: var(--lanius-font-mono);
  font-size: 0.75rem;
  padding: 0.25rem 0.45rem;
  border: 1px solid transparent;
  color: var(--lanius-text-muted);
}

.shell__locale--active {
  color: var(--lanius-text);
  border-color: var(--lanius-border-bright);
  background: var(--lanius-panel);
}

.shell__main {
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: clamp(1.25rem, 4vw, 2.5rem) clamp(1rem, 4vw, 2rem) 3rem;
  flex: 1;
}
</style>
