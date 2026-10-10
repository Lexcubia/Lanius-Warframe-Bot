<script setup lang="ts">
const { t, locale } = useI18n();
const localePath = useLocalePath();
const query = ref('');

/**
 * 提交首页搜索表单（在 /v1/search 上线前仅为 UI 壳）。
 *
 * @returns 无返回值
 */
function onSearch(): void {
  query.value = query.value.trim();
}
</script>

<template>
  <section class="hero">
    <p class="hero__live">{{ t('home.realmNote') }}</p>
    <h1 class="hero__brand">{{ t('brand') }}</h1>
    <p class="hero__tag">{{ t('home.tagline') }}</p>

    <form class="hero__search" @submit.prevent="onSearch">
      <input
        v-model="query"
        class="hero__input"
        type="search"
        autocomplete="off"
        :placeholder="t('home.searchPlaceholder')"
      />
      <button class="hero__button" type="submit">{{ t('home.searchButton') }}</button>
    </form>
    <p class="hero__hint">{{ t('home.searchHint') }}</p>

    <div class="hero__cta">
      <NuxtLink class="hero__link" :to="localePath('/worldstate')">
        {{ t('home.ctaWorldstate') }}
      </NuxtLink>
      <NuxtLink class="hero__link hero__link--ghost" :to="localePath('/help')">
        {{ t('nav.help') }}
      </NuxtLink>
      <span class="hero__locale">{{ locale }}</span>
    </div>
  </section>
</template>

<style scoped>
.hero {
  min-height: min(70vh, 640px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.85rem;
  position: relative;
}

.hero::before {
  content: '';
  position: absolute;
  inset: -8% -4% auto;
  height: 58%;
  background:
    radial-gradient(circle at 20% 30%, rgba(20, 184, 166, 0.16), transparent 42%),
    radial-gradient(circle at 78% 20%, rgba(255, 122, 89, 0.12), transparent 40%);
  pointer-events: none;
}

.hero__live {
  position: relative;
  margin: 0;
  color: var(--lanius-accent-dim);
  font-family: var(--lanius-font-display);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
}

.hero__brand {
  position: relative;
  margin: 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(3.2rem, 9vw, 5.6rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
  font-weight: 700;
  color: var(--lanius-brand);
}

.hero__tag {
  position: relative;
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: clamp(1.05rem, 2.4vw, 1.3rem);
  max-width: 34rem;
}

.hero__search {
  position: relative;
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
  width: min(640px, 100%);
}

.hero__input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--lanius-border-bright);
  background: rgba(255, 255, 255, 0.92);
  color: var(--lanius-text);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  font-size: 1rem;
  box-shadow: 0 8px 24px rgba(28, 47, 66, 0.05);
}

.hero__input:focus {
  outline: 2px solid rgba(20, 184, 166, 0.35);
  border-color: var(--lanius-accent);
}

.hero__button {
  border: 0;
  border-radius: 12px;
  padding: 0 1.2rem;
  background: linear-gradient(135deg, var(--lanius-accent), #2dd4bf);
  color: #ffffff;
  font-family: var(--lanius-font-display);
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(20, 184, 166, 0.28);
}

.hero__hint {
  position: relative;
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 0.9rem;
  max-width: 36rem;
}

.hero__cta {
  position: relative;
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.hero__link {
  display: inline-flex;
  align-items: center;
  padding: 0.7rem 1.05rem;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #ffffff;
  background: linear-gradient(135deg, var(--lanius-brand), var(--lanius-accent-dim));
  font-weight: 600;
}

.hero__link--ghost {
  color: var(--lanius-brand);
  background: #ffffff;
  border-color: var(--lanius-border-bright);
}

.hero__locale {
  font-family: var(--lanius-font-mono);
  color: var(--lanius-text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
}
</style>
