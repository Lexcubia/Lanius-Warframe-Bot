<script setup lang="ts">
import type { AlertDto, CatalogItemDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { OfficialItemIcon, formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 警报 QQ 截图模块卡（独立于科研；空态「当前无警报」）。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
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
 * 将剩余毫秒格式化为短时文案。
 *
 * @param remainingMs - 剩余毫秒
 * @returns 短时字符串
 */
function formatRemain(remainingMs: number): string {
  const zh = props.locale !== 'en';
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (hours > 0) {
    return zh ? `${hours}时${minutes}分` : `${hours}h${minutes}m`;
  }
  return zh ? `${minutes}分` : `${minutes}m`;
}

/**
 * 奖励物品短文案（数量大于 1 时附带 ×N）。
 *
 * @param reward - 奖励物品
 * @returns 显示串
 */
function rewardText(reward: CatalogItemDto): string {
  const name = label(reward.name);
  if (reward.quantity != null && reward.quantity > 1) {
    return `${name} ×${reward.quantity}`;
  }
  return name;
}

/**
 * 活跃警报列表（响应 props）。
 *
 * @returns 截断后的警报行
 */
const items = computed((): AlertDto[] => {
  const limit = props.maxItems ?? 8;
  return props.worldstate.alerts.slice(0, limit);
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
    :title="locale === 'en' ? 'ALERTS' : '警报'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <ul v-if="items.length" class="alerts">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        class="alerts__row"
        :class="{ 'alerts__row--zebra': index % 2 === 1 }"
      >
        <div class="alerts__head">
          <strong>{{
            item.missionType ? label(item.missionType) : item.missionTypeKey || '—'
          }}</strong>
          <time v-if="item.expiry" class="alerts__remain">{{
            formatRemain(Math.max(0, Date.parse(item.expiry) - Date.now()))
          }}</time>
        </div>
        <p class="alerts__meta">
          <span>{{ item.node ? label(item.node) : item.nodeKey || '—' }}</span>
          <span v-if="item.faction" class="alerts__faction">{{ label(item.faction) }}</span>
        </p>
        <div v-if="item.credits || item.rewards.length" class="alerts__rewards">
          <span v-if="item.credits" class="alerts__credits">{{
            locale === 'en' ? `${item.credits} cr` : `${item.credits} 星币`
          }}</span>
          <span
            v-for="(reward, rIndex) in item.rewards.slice(0, 3)"
            :key="`${item.id}-r-${rIndex}`"
            class="alerts__reward"
          >
            <OfficialItemIcon :icon-url="reward.iconUrl" :alt="rewardText(reward)" :size="20" />
            <span>{{ rewardText(reward) }}</span>
          </span>
        </div>
      </li>
    </ul>
    <p v-else class="alerts__empty">
      {{ locale === 'en' ? 'No active alerts' : '当前无警报' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.alerts {
  list-style: none;
  margin: 0;
  padding: 0;
}
.alerts__row {
  padding: 6px 2px 7px;
  border-bottom: 1px solid var(--lanius-border);
}
.alerts__row--zebra {
  background: var(--lanius-zebra);
}
.alerts__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 2px;
}
.alerts__head strong {
  color: var(--lanius-brand);
  min-width: 0;
}
.alerts__remain {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--lanius-text-muted);
  flex-shrink: 0;
}
.alerts__meta {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--lanius-text);
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
}
.alerts__faction {
  color: var(--lanius-text-muted);
  font-weight: 700;
}
.alerts__rewards {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: 12px;
  color: var(--lanius-text);
}
.alerts__credits {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.alerts__reward {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.alerts__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
