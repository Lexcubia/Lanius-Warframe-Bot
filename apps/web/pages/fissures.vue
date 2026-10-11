<script setup lang="ts">
import { FissuresPanel } from '@lanius/ui';
import type { WorldstateDto } from '@lanius/core';

const { t, locale } = useI18n();
const api = useLaniusApi();
const localePath = useLocalePath();

const { data, error, pending, refresh } = await useAsyncData(
  'fissures',
  async () => {
    const envelope = await api.getWorldstate({
      realm: 'international',
      locale: locale.value === 'en' ? 'en' : 'zh',
    });
    if (!envelope.ok) {
      throw new Error(envelope.error.message);
    }
    return {
      worldstate: envelope.data as WorldstateDto,
      stale: Boolean(envelope.meta.stale),
    };
  },
  { watch: [locale] },
);
</script>

<template>
  <section class="page">
    <header class="page__header">
      <p class="eyebrow">{{ t('fissures.eyebrow') }}</p>
      <h1>{{ t('fissures.title') }}</h1>
      <p class="muted">{{ t('fissures.intro') }}</p>
      <NuxtLink class="back" :to="localePath('/worldstate')">
        {{ t('fissures.toWorldstate') }}
      </NuxtLink>
    </header>

    <p v-if="pending" class="state">{{ t('fissures.loading') }}</p>
    <div v-else-if="error" class="state state--error">
      <p>{{ t('fissures.error') }}</p>
      <button type="button" class="retry" @click="() => refresh()">
        {{ t('common.retry') }}
      </button>
    </div>
    <FissuresPanel
      v-else-if="data"
      :worldstate="data.worldstate"
      :locale="locale === 'en' ? 'en' : 'zh'"
      :stale="data.stale"
    />
  </section>
</template>

<style scoped>
.page__header {
  margin-bottom: 1.25rem;
}
.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--lanius-accent-dim);
  font-family: var(--lanius-font-display);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
}
h1 {
  margin: 0 0 0.5rem;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: clamp(1.8rem, 4vw, 2.4rem);
}
.muted {
  color: var(--lanius-text-muted);
  margin: 0 0 0.75rem;
}
.back {
  color: var(--lanius-accent);
  font-size: 0.92rem;
  transition: color 0.18s ease;
}

@media (hover: hover) {
  .back:hover {
    color: var(--lanius-highlight);
  }

  .retry:hover {
    border-color: rgba(78, 183, 232, 0.5);
    color: var(--lanius-accent-dim);
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
  }
}
.state {
  color: var(--lanius-text-muted);
}
.state--error {
  color: var(--lanius-danger);
  display: grid;
  gap: 0.75rem;
}
.retry {
  width: fit-content;
  border: 1px solid var(--lanius-border-bright);
  background: var(--lanius-panel);
  color: var(--lanius-text);
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}
</style>
