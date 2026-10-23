<script setup lang="ts">
import type { Locale, VarziaDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatRemain, formatTimestamp, OfficialItemIcon } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 瓦奇娅 QQ 截图卡：名左分割行（无嵌套白卡）。
 */
const props = defineProps<{
  varzia: VarziaDto;
  locale: Locale;
  stale?: boolean;
  maxItems?: number;
  skin?: CardSkinId;
}>();

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
 * @returns 瓦奇娅货架行
 */
const items = computed(() => {
  const limit = props.maxItems ?? 20;
  return props.varzia.inventory.slice(0, limit);
});

/**
 * 活跃状态与剩余时间。
 *
 * @returns 状态行文案
 */
const statusLine = computed(() => {
  const remain =
    props.varzia.remainingMs != null ? formatRemain(props.varzia.remainingMs, props.locale) : null;
  if (props.locale === 'en') {
    if (props.varzia.active) {
      return remain ? `Active · ${remain}` : 'Active';
    }
    return remain ? `Inactive · ${remain}` : 'Inactive';
  }
  if (props.varzia.active) {
    return remain ? `在场 · ${remain}` : '在场';
  }
  return remain ? `未在场 · ${remain}` : '未在场';
});

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.varzia.fetchedAt));
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'VARZIA' : '瓦奇娅'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <p class="trader__meta">
      <strong>{{ label(varzia.character) }}</strong>
      · {{ statusLine }}
    </p>
    <ul v-if="items.length" class="trader__list">
      <li
        v-for="(item, idx) in items"
        :key="idx"
        class="trader__row"
        :class="{ 'trader__row--zebra': idx % 2 === 1 }"
      >
        <OfficialItemIcon :icon-url="item.iconUrl" :alt="label(item.name)" :size="24" />
        <span class="trader__name">{{ label(item.name) }}</span>
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
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.trader__meta strong {
  color: var(--lanius-brand);
  font-weight: 700;
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
  padding: 3px 2px;
  border-bottom: 1px solid var(--lanius-border);
  min-width: 0;
}
.trader__row--zebra {
  background: var(--lanius-zebra);
}
.trader__name {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.trader__empty {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
