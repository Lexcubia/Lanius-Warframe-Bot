<script setup lang="ts">
import type { Locale, RotationWeaponDto, WeaponRotationDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

import { formatRemain } from '../lib/format-remain.js';
import DamageTypeIcon from './DamageTypeIcon.vue';
import OfficialItemIcon from './OfficialItemIcon.vue';
import QqCardShell from './QqCardShell.vue';
import ValenceBonusBar from './ValenceBonusBar.vue';

/**
 * 信条 / 终幕武器轮换 QQ/截图模块卡片。
 */
const props = defineProps<{
  /** 轮换货架快照（`kind` 区分信条/终幕） */
  rotation: WeaponRotationDto;
  /** 文案语言 */
  locale: Locale;
  /** 是否陈旧数据 */
  stale?: boolean;
  /** 最多展示武器条数 */
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
 * 元素译名（无配置时返回 null）。
 *
 * @param weapon - 轮换武器行
 * @returns 元素名或 null
 */
function elementName(weapon: RotationWeaponDto): string | null {
  if (!weapon.elementLabel) {
    return null;
  }
  return label(weapon.elementLabel);
}

/**
 * 截断后的货架。
 *
 * @returns 武器行
 */
const offerings = computed(() => {
  const limit = props.maxItems ?? 12;
  return props.rotation.offerings.slice(0, limit);
});

/**
 * 卡片主标题。
 *
 * @returns 信条或终幕标题
 */
const title = computed(() => {
  if (props.rotation.kind === 'tenet') {
    return props.locale === 'en' ? 'TENET' : '信条轮换';
  }
  return props.locale === 'en' ? 'CODA' : '终幕轮换';
});

/**
 * 剩余时间副文案。
 *
 * @returns 剩余时间说明
 */
const remainLine = computed(() => {
  const remain = formatRemain(props.rotation.remainingMs, props.locale);
  return props.locale === 'en' ? `Ends in ${remain}` : `${remain}后换档`;
});

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() =>
  props.rotation.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, ''),
);
</script>

<template>
  <QqCardShell
    :title="title"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
  >
    <p class="rot__meta">{{ remainLine }}</p>
    <ul class="rot__list">
      <li
        v-for="(item, idx) in offerings"
        :key="`${idx}-${item.name.en}`"
        class="rot__row"
      >
        <OfficialItemIcon
          :icon-url="item.iconUrl"
          :alt="label(item.name)"
          :size="36"
        />
        <div class="rot__body">
          <p class="rot__name">{{ label(item.name) }}</p>
          <div class="rot__valence">
            <DamageTypeIcon
              :element="item.element"
              :alt="elementName(item) ?? ''"
              :size="16"
            />
            <span class="rot__el">{{ elementName(item) || '—' }}</span>
            <ValenceBonusBar
              v-if="item.bonusPct != null"
              :bonus-pct="item.bonusPct"
            />
            <span v-else class="rot__pct">—</span>
          </div>
        </div>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.rot__meta {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}

.rot__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rot__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--lanius-panel-raised);
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
  min-width: 0;
}

.rot__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rot__name {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rot__valence {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.rot__el {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--lanius-text-muted);
  min-width: 2.5em;
}

.rot__pct {
  font-size: 11px;
  color: var(--lanius-text-muted);
}
</style>
