<script setup lang="ts">
import { RivenBoard } from '@lanius/ui';
import type { RivenOrdersDto } from '@lanius/core';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const api = useLaniusApi();

const query = ref(String(route.query.q ?? '').trim());
const page = ref(Math.max(1, Number(route.query.page ?? 1) || 1));
const rankRaw = ref(String(route.query.rank ?? ''));
const masteryRaw = ref(String(route.query.mastery ?? ''));

/**
 * 提交紫卡搜索并同步 URL。
 *
 * @returns 无返回值
 */
async function search(): Promise<void> {
  const q = query.value.trim();
  query.value = q;
  page.value = 1;
  await router.replace({
    path: localePath('/riven'),
    query: buildRouteQuery(),
  });
  await refresh();
}

/**
 * 翻到指定页。
 *
 * @param nextPage - 目标页码
 * @returns 无返回值
 */
async function goPage(nextPage: number): Promise<void> {
  page.value = Math.max(1, nextPage);
  await router.replace({
    path: localePath('/riven'),
    query: buildRouteQuery(),
  });
  await refresh();
}

/**
 * 组装路由 query。
 *
 * @returns 路由 query
 */
function buildRouteQuery(): Record<string, string> {
  const q = query.value.trim();
  const out: Record<string, string> = {};
  if (q) out.q = q;
  if (page.value > 1) out.page = String(page.value);
  if (/^\d+$/.test(rankRaw.value.trim())) out.rank = rankRaw.value.trim();
  if (/^\d+$/.test(masteryRaw.value.trim())) {
    out.mastery = masteryRaw.value.trim();
  }
  return out;
}

/**
 * 解析可选非负整型 query。
 *
 * @param value - 路由值
 * @returns 数字或 undefined
 */
function optionalInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const s = String(value);
  return /^\d+$/.test(s) ? Number(s) : undefined;
}

const { data, error, pending, refresh } = await useAsyncData(
  'riven',
  async () => {
    const q = String(route.query.q ?? query.value ?? '').trim();
    if (!q) return null;
    const pageNum = Math.max(1, Number(route.query.page ?? page.value) || 1);
    const envelope = await api.getRiven({
      q,
      page: pageNum,
      rank: optionalInt(route.query.rank),
      mastery: optionalInt(route.query.mastery),
    });
    if (!envelope.ok) {
      throw new Error(envelope.error.message);
    }
    return envelope.data as RivenOrdersDto;
  },
  {
    watch: [
      () => route.query.q,
      () => route.query.page,
      () => route.query.rank,
      () => route.query.mastery,
    ],
  },
);

const totalPages = computed(() => {
  if (!data.value) return 1;
  return Math.max(1, Math.ceil(data.value.total / data.value.pageSize) || 1);
});
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
      <input
        v-model="rankRaw"
        class="rank"
        type="text"
        inputmode="numeric"
        :placeholder="t('riven.rankPlaceholder')"
      />
      <input
        v-model="masteryRaw"
        class="rank"
        type="text"
        inputmode="numeric"
        :placeholder="t('riven.masteryPlaceholder')"
      />
      <button type="submit">{{ t('common.search') }}</button>
    </form>

    <p v-if="!query && !data" class="state">{{ t('riven.emptyHint') }}</p>
    <p v-else-if="pending" class="state">{{ t('riven.loading') }}</p>
    <p v-else-if="error" class="state state--error">{{ t('riven.error') }}</p>
    <template v-else-if="data">
      <RivenBoard :riven="data" :locale="locale === 'en' ? 'en' : 'zh'" />
      <nav v-if="totalPages > 1" class="pager" aria-label="pagination">
        <button type="button" :disabled="data.page <= 1" @click="goPage(data.page - 1)">
          {{ t('riven.prevPage') }}
        </button>
        <span class="pager__label">{{ data.page }} / {{ totalPages }}</span>
        <button type="button" :disabled="data.page >= totalPages" @click="goPage(data.page + 1)">
          {{ t('riven.nextPage') }}
        </button>
      </nav>
    </template>
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
  flex-wrap: wrap;
  gap: 0.5rem;
  width: min(800px, 100%);
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
.search .rank {
  flex: 0 0 6.5rem;
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
.pager {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
.pager button {
  border: 1px solid var(--lanius-border-bright);
  background: #fff;
  border-radius: 8px;
  padding: 0.4rem 0.85rem;
  cursor: pointer;
}
.pager button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.pager__label {
  font-size: 0.9rem;
  color: var(--lanius-text-muted);
}
</style>
