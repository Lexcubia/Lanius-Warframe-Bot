<script setup lang="ts">
import { RivenModuleCard } from '@lanius/ui';
import type { RivenSearchDto } from '@lanius/core';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const api = useLaniusApi();

const query = ref(String(route.query.q ?? '').trim());

/**
 * 提交紫卡搜索并同步 URL `q`。
 *
 * @returns 无返回值
 */
async function search(): Promise<void> {
  const q = query.value.trim();
  query.value = q;
  await router.replace({
    path: localePath('/riven'),
    query: q ? { q } : {},
  });
  await refresh();
}

const { data, error, pending, refresh } = await useAsyncData(
  'riven',
  async () => {
    const q = String(route.query.q ?? query.value ?? '').trim();
    if (!q) return null;
    const envelope = await api.getRiven(q);
    if (!envelope.ok) {
      throw new Error(envelope.error.message);
    }
    return envelope.data as RivenSearchDto;
  },
  { watch: [() => route.query.q] },
);
</script>

<template>
  <section class="page">
    <header class="page__header">
      <p class="eyebrow">{{ t('riven.eyebrow') }}</p>
      <h1>{{ t('riven.title') }}</h1>
      <p class="muted">{{ t('riven.intro') }}</p>
    </header>

    <form class="search" @submit.prevent="search">
      <input
        v-model="query"
        type="search"
        autocomplete="off"
        :placeholder="t('riven.placeholder')"
      />
      <button type="submit">{{ t('common.search') }}</button>
    </form>

    <p v-if="!query && !data" class="state">{{ t('riven.emptyHint') }}</p>
    <p v-else-if="pending" class="state">{{ t('riven.loading') }}</p>
    <p v-else-if="error" class="state state--error">{{ t('riven.error') }}</p>
    <RivenModuleCard
      v-else-if="data"
      :riven="data"
      :locale="locale === 'en' ? 'en' : 'zh'"
    />
  </section>
</template>

<style scoped>
.page__header {
  margin-bottom: 1rem;
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
  margin: 0;
}
.search {
  display: flex;
  gap: 0.5rem;
  width: min(640px, 100%);
  margin: 1rem 0 1.25rem;
}
.search input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--lanius-border-bright);
  background: rgba(255, 255, 255, 0.92);
  color: var(--lanius-text);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.search button {
  border: 0;
  border-radius: 10px;
  padding: 0 1.1rem;
  background: linear-gradient(135deg, var(--lanius-accent), var(--lanius-highlight));
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition:
    filter 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

@media (hover: hover) {
  .search button:hover {
    filter: brightness(1.05);
    box-shadow: 0 8px 18px rgba(255, 122, 110, 0.28);
    transform: translateY(-1px);
  }

  .search input:hover {
    border-color: rgba(255, 122, 110, 0.4);
  }
}
.state {
  color: var(--lanius-text-muted);
}
.state--error {
  color: var(--lanius-danger);
}
</style>
