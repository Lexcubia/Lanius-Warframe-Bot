<script setup lang="ts">
import type { Locale, VarziaDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

import { formatRemain } from '../lib/format-remain.js';
import OfficialItemIcon from './OfficialItemIcon.vue';
import QqCardShell from './QqCardShell.vue';

/**
 * 瓦奇娅（Prime Vault）QQ/截图模块卡片。
 */
const props = defineProps<{
  /** 瓦奇娅快照 */
  varzia: VarziaDto;
  /** 文案语言 */
  locale: Locale;
  /** 是否陈旧数据 */
  stale?: boolean;
  /** 最多展示货架条数 */
  maxItems?: number;
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
    props.varzia.remainingMs != null
      ? formatRemain(props.varzia.remainingMs, props.locale)
      : null;
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
const stamp = computed(() =>
  props.varzia.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, ''),
);
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'VARZIA' : '瓦奇娅'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
  >
    <p class="trader__meta">
      <strong>{{ label(varzia.character) }}</strong>
      · {{ statusLine }}
    </p>
    <ul v-if="items.length" class="trader__list">
      <li v-for="(item, idx) in items" :key="idx" class="trader__row">
        <OfficialItemIcon
          :icon-url="item.iconUrl"
          :alt="label(item.name)"
          :size="32"
        />
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
  margin: 0 0 8px;
  font-size: 12px;
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
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trader__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: var(--lanius-panel-raised);
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
  min-width: 0;
}

.trader__name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trader__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 16px 0;
}
</style>
