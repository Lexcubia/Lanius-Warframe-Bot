<script setup lang="ts">
import type { Locale, RotationWeaponDto, WeaponRotationDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import {
  DamageTypeIcon,
  formatRemain,
  formatTimestamp,
  OfficialItemIcon,
  ValenceBonusBar,
} from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 信条 / 终幕轮换 QQ 截图卡：名 + Valence 细条同行；元素右对齐。
 */
const props = defineProps<{
  rotation: WeaponRotationDto;
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
 * 元素译名。
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
const stamp = computed(() => formatTimestamp(props.rotation.fetchedAt));
</script>

<template>
  <QqCardShell
    :title="title"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <p class="rot__meta">{{ remainLine }}</p>
    <ul class="rot__list">
      <li
        v-for="(item, idx) in offerings"
        :key="`${idx}-${item.name.en}`"
        class="rot__row"
        :class="{ 'rot__row--zebra': idx % 2 === 1 }"
      >
        <OfficialItemIcon :icon-url="item.iconUrl" :alt="label(item.name)" :size="28" />
        <span class="rot__name">{{ label(item.name) }}</span>
        <ValenceBonusBar
          v-if="item.bonusPct != null"
          class="rot__bar"
          :bonus-pct="item.bonusPct"
          :show-label="true"
        />
        <span v-else class="rot__pct">—</span>
        <span class="rot__el">
          <DamageTypeIcon :element="item.element" :alt="elementName(item) ?? ''" :size="14" />
          {{ elementName(item) || '—' }}
        </span>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.rot__meta {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--lanius-text-muted);
}
.rot__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--lanius-border);
}
.rot__row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 2px;
  border-bottom: 1px solid var(--lanius-border);
  min-width: 0;
}
.rot__row--zebra {
  background: var(--lanius-zebra);
}
.rot__name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rot__bar {
  flex: 0 1 120px;
  min-width: 72px;
  max-width: 140px;
}
.rot__pct {
  font-size: 10px;
  color: var(--lanius-text-muted);
}
.rot__el {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
  flex-shrink: 0;
  font-size: 10px;
  color: var(--lanius-text-muted);
}
</style>
