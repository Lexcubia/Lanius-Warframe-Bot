<script setup lang="ts">
import type { CatalogItemDto, InvasionDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '../lib/format-timestamp.js';
import { computed } from 'vue';

import OfficialItemIcon from './OfficialItemIcon.vue';
import QqCardShell from './QqCardShell.vue';

/**
 * 入侵 QQ/截图模块卡片（消费 `WorldstateDto.invasions`）。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  /** 最多展示条数 */
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
  const limit = props.maxItems ?? 8;
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
  >
    <ul v-if="items.length" class="invasions">
      <li v-for="item in items" :key="item.id" class="invasions__row">
        <div class="invasions__head">
          <strong>{{ label(item.node) }}</strong>
          <span v-if="item.completionPct !== undefined">{{ item.completionPct }}%</span>
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
              :size="28"
            />
            <span>{{ rewardText(item.attackerReward) }}</span>
          </p>
          <p class="invasions__side">
            <span class="invasions__faction">{{ label(item.defendingFaction) }}</span>
            <OfficialItemIcon
              :icon-url="item.defenderReward?.iconUrl"
              :alt="rewardText(item.defenderReward)"
              :size="28"
            />
            <span>{{ rewardText(item.defenderReward) }}</span>
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.invasions__row {
  padding: 10px;
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .invasions__row:hover {
    border-color: rgba(255, 122, 110, 0.4);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}

.invasions__head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 6px;
}

.invasions__head strong {
  color: var(--lanius-brand);
}

.invasions__bar {
  height: 8px;
  border-radius: 4px;
  background: var(--lanius-border);
  overflow: hidden;
  margin-bottom: 8px;
}

.invasions__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--lanius-bar-attack), var(--lanius-bar-defend));
}

.invasions__sides p,
.invasions__side {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--lanius-text);
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.invasions__faction {
  flex-shrink: 0;
  min-width: 4.5em;
  font-weight: 700;
  color: var(--lanius-text-muted);
}

.invasions__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 16px 0;
}
</style>
