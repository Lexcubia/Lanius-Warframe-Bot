<script setup lang="ts">
import type { Locale, VoidTraderDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatRemain, formatTimestamp, OfficialItemIcon, resolveDucatsIconSrc } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 虚空商人 QQ 截图卡：名左 · 信用中 · 杜卡德右，分割行。
 */
const props = defineProps<{
  voidTrader: VoidTraderDto;
  locale: Locale;
  stale?: boolean;
  maxItems?: number;
  skin?: CardSkinId;
}>();

const ducatIcon = resolveDucatsIconSrc();

/**
 * 取双语字段。
 *
 * @param name - LocalizedName
 * @returns 当前 locale 文案
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, props.locale);
}

/**
 * 截断后的货架列表。
 *
 * @returns 商人货架行
 */
const items = computed(() => {
  const limit = props.maxItems ?? 12;
  return props.voidTrader.inventory.slice(0, limit);
});

/**
 * 状态与剩余时间副文案。
 *
 * @returns 状态行
 */
const statusLine = computed(() => {
  const remain = formatRemain(props.voidTrader.remainingMs, props.locale);
  const node = label(props.voidTrader.node);
  if (props.locale === 'en') {
    return props.voidTrader.active
      ? `${node} · leaves in ${remain}`
      : `Arrives ${node} in ${remain}`;
  }
  return props.voidTrader.active ? `${node} · ${remain}后离开` : `${remain}后抵达 ${node}`;
});

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.voidTrader.fetchedAt));
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'VOID TRADER' : '虚空商人'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <p class="trader__meta">{{ statusLine }}</p>
    <ul v-if="items.length" class="trader__list">
      <li
        v-for="(item, idx) in items"
        :key="idx"
        class="trader__row"
        :class="{ 'trader__row--zebra': idx % 2 === 1 }"
      >
        <OfficialItemIcon :icon-url="item.iconUrl" :alt="label(item.name)" :size="28" />
        <span class="trader__name">{{ label(item.name) }}</span>
        <span v-if="item.credits != null" class="trader__credits">
          {{ Math.round(item.credits / 1000) }}k
        </span>
        <span v-if="item.ducats != null" class="trader__ducats">
          <img
            class="trader__ducat-icon"
            :src="ducatIcon"
            alt=""
            width="14"
            height="14"
            data-lanius-icon="ducats"
          />
          <span>{{ item.ducats }}</span>
        </span>
      </li>
    </ul>
    <p v-else class="trader__empty">
      {{ locale === 'en' ? 'Inventory empty' : '货架暂无条目' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.trader__meta {
  margin: 0 0 4px;
  font-size: 13px;
  color: var(--lanius-text-muted);
}
.trader__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--lanius-border);
}
.trader__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 2px;
  border-bottom: 1px solid var(--lanius-border);
  min-width: 0;
}
.trader__row--zebra {
  background: var(--lanius-zebra);
}
.trader__name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.trader__credits {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  font-variant-numeric: tabular-nums;
}
.trader__ducats {
  flex-shrink: 0;
  margin-left: 4px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-accent-dim);
  font-variant-numeric: tabular-nums;
}
.trader__ducat-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}
.trader__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
