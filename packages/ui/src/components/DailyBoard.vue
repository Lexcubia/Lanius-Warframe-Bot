<script setup lang="ts">
import type { LocalizedName, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

/**
 * 公开站日常切片看板：达沃 / 新闻 / 活动 / 闪购等摘要（同源 worldstate）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的 worldstate。 */
  worldstate: WorldstateDto;
  /** 当前 UI locale。 */
  locale: 'zh' | 'en';
  /** 可选：缓存降级提示。 */
  stale?: boolean;
  /** 新闻最多展示条数；默认 4。 */
  maxNews?: number;
}>();

/**
 * 按当前 locale 选择中/英标签。
 *
 * @param zh - 中文文案
 * @param en - 英文文案
 * @returns 与 locale 匹配的字符串
 */
function t(zh: string, en: string): string {
  return props.locale === 'en' ? en : zh;
}

/**
 * 取双语字段。
 *
 * @param name - 可选 LocalizedName
 * @returns 展示字符串
 */
function label(name: LocalizedName | undefined): string {
  return name ? pickLocalized(name, props.locale) : '—';
}

/**
 * 达沃特惠行。
 *
 * @returns 展示行
 */
const deals = computed(() =>
  props.worldstate.dailyDeals.slice(0, 4).map((deal, idx) => ({
    key: `deal-${idx}`,
    title: label(deal.item.name),
    meta:
      deal.discountPct != null
        ? `-${deal.discountPct}%`
        : deal.salePrice != null
          ? String(deal.salePrice)
          : '',
  })),
);

/**
 * 新闻行。
 *
 * @returns 展示行
 */
const news = computed(() => {
  const limit = props.maxNews ?? 4;
  return props.worldstate.news.slice(0, limit).map((item, idx) => ({
    key: `news-${idx}`,
    title: label(item.message),
  }));
});

/**
 * 活动条数摘要。
 *
 * @returns 文案
 */
const eventsSummary = computed(() => {
  const n = props.worldstate.events.length;
  return n > 0 ? t(`${n} 个进行中`, `${n} active`) : t('无', 'None');
});

/**
 * 闪购条数摘要。
 *
 * @returns 文案
 */
const flashSummary = computed(() => {
  const n = props.worldstate.flashSales.length;
  return n > 0 ? String(n) : t('无', 'None');
});
</script>

<template>
  <section class="lanius-db">
    <header class="lanius-db__header">
      <div>
        <p class="lanius-db__eyebrow">{{ t('日常', 'Daily') }}</p>
        <h2 class="lanius-db__title">{{ t('达沃 · 新闻 · 活动', 'Darvo · News · Events') }}</h2>
      </div>
      <time class="lanius-db__time">{{ worldstate.fetchedAt }}</time>
    </header>

    <p v-if="stale" class="lanius-db__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <div class="lanius-db__grid">
      <article class="lanius-db__block">
        <h3>{{ t('达沃特惠', "Darvo's Deals") }}</h3>
        <ul v-if="deals.length" class="lanius-db__list">
          <li v-for="row in deals" :key="row.key">
            <strong>{{ row.title }}</strong>
            <span v-if="row.meta" class="lanius-db__meta">{{ row.meta }}</span>
          </li>
        </ul>
        <p v-else class="lanius-db__empty">{{ t('暂无特惠', 'No deals') }}</p>
      </article>

      <article class="lanius-db__block">
        <h3>{{ t('新闻', 'News') }}</h3>
        <ul v-if="news.length" class="lanius-db__list">
          <li v-for="row in news" :key="row.key">
            <strong>{{ row.title }}</strong>
          </li>
        </ul>
        <p v-else class="lanius-db__empty">{{ t('暂无新闻', 'No news') }}</p>
      </article>

      <article class="lanius-db__block lanius-db__block--stats">
        <p>
          <span class="lanius-db__stat-label">{{ t('活动', 'Events') }}</span>
          <span>{{ eventsSummary }}</span>
        </p>
        <p>
          <span class="lanius-db__stat-label">{{ t('闪购', 'Flash sales') }}</span>
          <span>{{ flashSummary }}</span>
        </p>
        <p v-if="worldstate.construction">
          <span class="lanius-db__stat-label">{{ t('舰队', 'Construction') }}</span>
          <span>{{ t('有进度', 'Active') }}</span>
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.lanius-db {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-db__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.lanius-db__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-db__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.15rem, 2vw, 1.45rem);
}

.lanius-db__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-db__stale {
  color: var(--lanius-warn);
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
}

.lanius-db__grid {
  display: grid;
  gap: 0.65rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.lanius-db__block {
  padding: 0.75rem 0.85rem;
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: 0.35rem;
}

.lanius-db__block h3 {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--lanius-accent);
  font-weight: 700;
}

.lanius-db__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}

.lanius-db__list li {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.35rem;
  font-size: 0.88rem;
}

.lanius-db__list strong {
  color: var(--lanius-brand);
  font-weight: 600;
}

.lanius-db__meta {
  color: var(--lanius-accent);
  font-family: var(--lanius-font-mono);
  font-size: 0.8rem;
}

.lanius-db__empty {
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 0.85rem;
}

.lanius-db__block--stats {
  display: grid;
  gap: 0.45rem;
  align-content: start;
}

.lanius-db__block--stats p {
  margin: 0;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.88rem;
}

.lanius-db__stat-label {
  color: var(--lanius-text-muted);
}
</style>
