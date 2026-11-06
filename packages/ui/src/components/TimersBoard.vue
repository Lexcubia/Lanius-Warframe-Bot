<script setup lang="ts">
import type { LocalizedName, TimersDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

import { formatRemain } from '../lib/format-remain.js';

/**
 * 公开站时效总览看板（`GET /v1/timers`）。
 */
const props = defineProps<{
  /** 时效 DTO。 */
  timers: TimersDto;
  /** 当前 UI locale。 */
  locale: 'zh' | 'en';
  /** 可选：缓存降级提示。 */
  stale?: boolean;
  /** 最多展示行数；默认全部。 */
  maxItems?: number;
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
  return name ? pickLocalized(name, props.locale) : '';
}

/**
 * 截断后的时效行。
 *
 * @returns 行列表
 */
const rows = computed(() => {
  const all = props.timers.rows;
  const limit = props.maxItems ?? all.length;
  return all.slice(0, Math.max(0, limit));
});
</script>

<template>
  <section class="lanius-tb">
    <header class="lanius-tb__header">
      <div>
        <p class="lanius-tb__eyebrow">{{ t('时效', 'Timers') }}</p>
        <h2 class="lanius-tb__title">
          {{ t('开放世界与日常倒计时', 'Open-world & daily timers') }}
        </h2>
      </div>
      <time class="lanius-tb__time">{{ timers.fetchedAt }}</time>
    </header>

    <p v-if="stale" class="lanius-tb__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <ul v-if="rows.length" class="lanius-tb__list">
      <li v-for="row in rows" :key="row.id" class="lanius-tb__row">
        <div class="lanius-tb__main">
          <strong>{{ label(row.label) }}</strong>
          <span v-if="row.note" class="lanius-tb__note">{{ label(row.note) }}</span>
        </div>
        <span v-if="row.remainingMs != null" class="lanius-tb__remain">
          {{ formatRemain(row.remainingMs, locale) }}
        </span>
      </li>
    </ul>
    <p v-else class="lanius-tb__empty">
      {{ t('暂无时效条目', 'No timer rows') }}
    </p>
  </section>
</template>

<style scoped>
.lanius-tb {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-tb__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}

.lanius-tb__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-tb__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.15rem, 2vw, 1.45rem);
}

.lanius-tb__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-tb__stale {
  color: var(--lanius-warn);
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
}

.lanius-tb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.lanius-tb__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 0.75rem;
  padding: 0.55rem 0.7rem;
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: 0.35rem;
}

.lanius-tb__main {
  display: grid;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.lanius-tb__main strong {
  color: var(--lanius-brand);
  font-size: 0.92rem;
}

.lanius-tb__note {
  color: var(--lanius-text-muted);
  font-size: 0.78rem;
}

.lanius-tb__remain {
  font-family: var(--lanius-font-mono);
  color: var(--lanius-accent);
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.lanius-tb__empty {
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 0.9rem;
}
</style>
