<script setup lang="ts">
import type { CircuitChoiceDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatRemain, formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 回廊 / Circuit QQ 截图卡：普通战甲 + 钢路 Incarnon 两节列表。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
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
 * 选项显示名（无解析名时回退短键）。
 *
 * @param row - 回廊可选项
 * @returns 展示文案
 */
function choiceLabel(row: CircuitChoiceDto): string {
  return row.name ? label(row.name) : row.key;
}

/**
 * 回廊切片。
 *
 * @returns circuit DTO 或 null
 */
const circuit = computed(() => props.worldstate.circuit);

/**
 * 本周剩余时间副文案。
 *
 * @returns 剩余说明；无 expiry 时空串
 */
const remainLine = computed(() => {
  const expiry = circuit.value?.expiry;
  if (!expiry) {
    return '';
  }
  const remainMs = Date.parse(expiry) - Date.now();
  if (!Number.isFinite(remainMs) || remainMs <= 0) {
    return props.locale === 'en' ? 'Rotation ended' : '本周轮换已结束';
  }
  const remain = formatRemain(remainMs, props.locale);
  return props.locale === 'en' ? `Ends in ${remain}` : `${remain}后换周`;
});

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.worldstate.fetchedAt));
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'CIRCUIT' : '回廊 / Circuit'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <template v-if="circuit">
      <p v-if="remainLine" class="circuit__meta">{{ remainLine }}</p>

      <section class="circuit__group">
        <h4 class="circuit__group-title" data-kind="normal">
          {{ locale === 'en' ? 'Normal · Warframes' : '普通 · 可选战甲' }}
        </h4>
        <ul v-if="circuit.normalChoices.length" class="circuit__list">
          <li v-for="row in circuit.normalChoices" :key="`n-${row.key}`" class="circuit__row">
            <span class="circuit__name">{{ choiceLabel(row) }}</span>
          </li>
        </ul>
        <p v-else class="circuit__empty-inline">
          {{ locale === 'en' ? 'No warframe choices' : '暂无战甲选项' }}
        </p>
      </section>

      <section class="circuit__group">
        <h4 class="circuit__group-title" data-kind="hard">
          {{ locale === 'en' ? 'Steel Path · Incarnon' : '钢路 · Incarnon 适配器' }}
        </h4>
        <ul v-if="circuit.hardChoices.length" class="circuit__list">
          <li v-for="row in circuit.hardChoices" :key="`h-${row.key}`" class="circuit__row">
            <span class="circuit__name">{{ choiceLabel(row) }}</span>
          </li>
        </ul>
        <p v-else class="circuit__empty-inline">
          {{ locale === 'en' ? 'No Incarnon adapters' : '暂无 Incarnon 适配器' }}
        </p>
      </section>
    </template>
    <p v-else class="circuit__empty">
      {{ locale === 'en' ? 'No Circuit rotation data' : '暂无回廊轮换数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.circuit__meta {
  margin: 0 0 6px;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.circuit__group {
  margin-bottom: 6px;
}
.circuit__group:last-child {
  margin-bottom: 0;
}
.circuit__group-title {
  margin: 0 0 2px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--lanius-text-muted);
}
.circuit__group-title[data-kind='normal'] {
  color: var(--lanius-accent-dim);
}
.circuit__group-title[data-kind='hard'] {
  color: var(--lanius-warn);
}
.circuit__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--lanius-border);
}
.circuit__row {
  padding: 4px 2px;
  border-bottom: 1px solid var(--lanius-border);
  font-size: 13px;
}
.circuit__name {
  font-weight: 600;
  color: var(--lanius-text);
}
.circuit__empty-inline,
.circuit__empty {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 8px 0;
}
.circuit__empty-inline {
  text-align: left;
  padding: 4px 2px;
}
</style>
