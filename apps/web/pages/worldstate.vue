<script setup lang="ts">
import { WorldstateBoard } from '@lanius/ui';
import type { WorldstateDto } from '@lanius/core';

const { t, locale } = useI18n();
const api = useLaniusApi();
const localePath = useLocalePath();

const { data, error, pending, refresh } = await useAsyncData(
  'worldstate',
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
  <div>
    <p class="links">
      <NuxtLink :to="localePath('/fissures')">{{ t('worldstate.toFissures') }}</NuxtLink>
      <NuxtLink :to="localePath('/traders')">{{ t('nav.traders') }}</NuxtLink>
    </p>
    <p v-if="pending" class="state">{{ t('worldstate.loading') }}</p>
    <div v-else-if="error" class="state state--error">
      <p>{{ t('worldstate.error') }}</p>
      <button type="button" class="retry" @click="() => refresh()">
        {{ t('worldstate.retry') }}
      </button>
    </div>
    <WorldstateBoard
      v-else-if="data"
      :worldstate="data.worldstate"
      :locale="locale === 'en' ? 'en' : 'zh'"
      :stale="data.stale"
    />
  </div>
</template>

<style scoped>
.links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin: 0 0 1rem;
  font-size: 0.92rem;
}
.links a {
  color: var(--lanius-accent);
  transition: color 0.18s ease;
}

@media (hover: hover) {
  .links a:hover {
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
