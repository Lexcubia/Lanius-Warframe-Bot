<script setup lang="ts">
import { OfficialItemIcon, formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { DenseListCardPayload } from './dense-list-types.js';
import type { CardSkinId } from './skins.js';

/**
 * Orokin 密列表模块卡（达沃/新闻/风暴/商店等共用壳）。
 */
const props = defineProps<{
  payload: DenseListCardPayload;
  locale: 'zh' | 'en';
  stale?: boolean;
  skin?: CardSkinId;
}>();

/**
 * 抓取时间副标题。
 *
 * @returns 时间或 LANIUS
 */
const stamp = computed(() =>
  props.payload.fetchedAt ? formatTimestamp(props.payload.fetchedAt) : 'LANIUS',
);
</script>

<template>
  <QqCardShell
    :title="payload.title"
    :kicker="payload.kicker"
    :subtitle="stamp"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <ul v-if="payload.rows.length" class="dense">
      <li
        v-for="(row, index) in payload.rows"
        :key="`${row.primary}-${index}`"
        class="dense__row"
        :class="{ 'dense__row--zebra': index % 2 === 1 }"
      >
        <div class="dense__head">
          <span v-if="row.iconUrl" class="dense__icon">
            <OfficialItemIcon :icon-url="row.iconUrl" :alt="row.primary" :size="20" />
          </span>
          <strong>{{ row.primary }}</strong>
          <time v-if="row.remain" class="dense__remain">{{ row.remain }}</time>
        </div>
        <p v-if="row.secondary || row.meta" class="dense__meta">
          <span v-if="row.secondary">{{ row.secondary }}</span>
          <span v-if="row.meta" class="dense__meta-right">{{ row.meta }}</span>
        </p>
      </li>
    </ul>
    <p v-else class="dense__empty">
      {{ payload.emptyText || (locale === 'en' ? 'Empty' : '暂无数据') }}
    </p>
    <p v-if="payload.note" class="dense__note">{{ payload.note }}</p>
  </QqCardShell>
</template>

<style scoped>
.dense {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
}
.dense__row {
  padding: 5px 0 6px;
  border-bottom: 1px solid var(--lanius-border);
  width: 100%;
  box-sizing: border-box;
}
.dense__row--zebra {
  background: var(--lanius-zebra);
}
.dense__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  font-size: var(--lanius-type-body, 14px);
}
.dense__icon {
  flex-shrink: 0;
  display: inline-flex;
}
.dense__head strong {
  color: var(--lanius-brand);
  min-width: 0;
  font-size: var(--lanius-type-lead, 16px);
}
.dense__remain {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  font-size: var(--lanius-type-meta, 12px);
  color: var(--lanius-text-muted);
  flex-shrink: 0;
}
.dense__meta {
  margin: 2px 0 0;
  font-size: var(--lanius-type-body, 14px);
  color: var(--lanius-text);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.dense__meta-right {
  color: var(--lanius-text-muted);
  flex-shrink: 0;
  text-align: right;
}
.dense__empty {
  margin: 0;
  font-size: var(--lanius-type-body, 14px);
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
.dense__note {
  margin: 8px 0 0;
  font-size: var(--lanius-type-meta, 12px);
  color: var(--lanius-text-muted);
}
</style>
