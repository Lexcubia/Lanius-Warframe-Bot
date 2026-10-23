<script setup lang="ts">
import type { CatalogItemDto, InvasionDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { OfficialItemIcon, formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 入侵 QQ 截图模块卡（dense：节点+％一行，细条，攻守奖励并排）。
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
 * 可选奖励文案（数量大于 1 时附带 ×N）。
 *
 * @param reward - 奖励物品引用
 * @returns 显示串
 */
function rewardText(reward: CatalogItemDto | undefined): string {
  if (!reward) {
    return props.locale === 'en' ? '—' : '无奖励';
  }
  const name = label(reward.name);
  if (reward.quantity != null && reward.quantity > 1) {
    return `${name} ×${reward.quantity}`;
  }
  return name;
}

/**
 * 活跃入侵列表（未过期，响应 props）。
 *
 * @returns 截断后的入侵行
 */
const items = computed((): InvasionDto[] => {
  const limit = props.maxItems ?? 6;
  return props.worldstate.invasions.filter((row) => !row.expired).slice(0, limit);
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
    :title="locale === 'en' ? 'INVASIONS' : '入侵'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <ul v-if="items.length" class="invasions">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        class="invasions__row"
        :class="{ 'invasions__row--zebra': index % 2 === 1 }"
      >
        <div class="invasions__head">
          <strong>{{ label(item.node) }}</strong>
          <span v-if="item.completionPct !== undefined" class="invasions__pct"
            >{{ item.completionPct }}%</span
          >
        </div>
        <div v-if="item.completionPct !== undefined" class="invasions__bar" aria-hidden="true">
          <div
            class="invasions__fill"
            :style="{ width: `${Math.max(2, Math.min(100, item.completionPct))}%` }"
          />
        </div>
        <div class="invasions__sides">
          <p class="invasions__side">
            <span class="invasions__faction">{{ label(item.attackingFaction) }}</span>
            <OfficialItemIcon
              :icon-url="item.attackerReward?.iconUrl"
              :alt="rewardText(item.attackerReward)"
              :size="22"
            />
            <span class="invasions__reward">{{ rewardText(item.attackerReward) }}</span>
          </p>
          <p class="invasions__side">
            <span class="invasions__faction">{{ label(item.defendingFaction) }}</span>
            <OfficialItemIcon
              :icon-url="item.defenderReward?.iconUrl"
              :alt="rewardText(item.defenderReward)"
              :size="22"
            />
            <span class="invasions__reward">{{ rewardText(item.defenderReward) }}</span>
          </p>
        </div>
      </li>
    </ul>
    <p v-else class="invasions__empty">
      {{ locale === 'en' ? 'No active invasions' : '当前无进行中的入侵' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.invasions {
  list-style: none;
  margin: 0;
  padding: 0;
}
.invasions__row {
  padding: 5px 2px 6px;
  border-bottom: 1px solid var(--lanius-border);
}
.invasions__row--zebra {
  background: var(--lanius-zebra);
}
.invasions__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 3px;
}
.invasions__head strong {
  color: var(--lanius-brand);
  min-width: 0;
}
.invasions__pct {
  margin-left: auto;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-text);
}
.invasions__bar {
  height: 3px;
  border-radius: 2px;
  background: var(--lanius-border);
  overflow: hidden;
  margin-bottom: 4px;
}
.invasions__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--lanius-bar-attack), var(--lanius-bar-defend));
}
.invasions__sides {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
}
.invasions__side {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text);
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.invasions__faction {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--lanius-text-muted);
  max-width: 4.2em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.invasions__reward {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.invasions__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
