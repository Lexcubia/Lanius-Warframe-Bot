<script setup lang="ts">
import type { InvasionDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

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
 * 可选奖励文案。
 *
 * @param reward - 奖励 LocalizedName
 * @returns 显示串
 */
function rewardText(reward: InvasionDto['attackerReward']): string {
  if (!reward) {
    return props.locale === 'en' ? '—' : '无奖励';
  }
  return label(reward);
}

/**
 * 活跃入侵列表（未过期）。
 *
 * @returns 截断后的入侵行
 */
function activeItems(): InvasionDto[] {
  const limit = props.maxItems ?? 8;
  return props.worldstate.invasions.filter((row) => !row.expired).slice(0, limit);
}

const items = activeItems();
const stamp = props.worldstate.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, '');
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
          <p>
            <span class="invasions__faction">{{ label(item.attackingFaction) }}</span>
            {{ rewardText(item.attackerReward) }}
          </p>
          <p>
            <span class="invasions__faction">{{ label(item.defendingFaction) }}</span>
            {{ rewardText(item.defenderReward) }}
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
  background: var(--lanius-panel-raised);
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
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

.invasions__sides p {
  margin: 0 0 4px;
  font-size: 11px;
  color: var(--lanius-text);
}

.invasions__faction {
  display: inline-block;
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
