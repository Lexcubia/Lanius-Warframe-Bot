<script setup lang="ts">
import type { CatalogItemDto, InvasionDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

import OfficialItemIcon from './OfficialItemIcon.vue';

/**
 * 公开站入侵看板（响应式列表；不依赖 QQ ModuleCard / Shell）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的 worldstate。 */
  worldstate: WorldstateDto;
  /** 当前 UI locale。 */
  locale: 'zh' | 'en';
  /** 可选：缓存降级提示。 */
  stale?: boolean;
  /** 最多展示条数；默认展示全部未过期入侵。 */
  maxItems?: number;
}>();

/**
 * 按当前 locale 选择中/英标签。
 *
 * @param zh - 中文文案
 * @param en - 英文文案
 * @returns 与 locale 匹配的字符串
 */
function t(zh: string, en: string): string {
  return props.locale === 'en' ? en : zh;
}

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
    return t('无奖励', '—');
  }
  const name = label(reward.name);
  if (reward.quantity != null && reward.quantity > 1) {
    return `${name} ×${reward.quantity}`;
  }
  return name;
}

/**
 * 活跃入侵列表（未过期）。
 *
 * @returns 截断后的入侵行
 */
const items = computed((): InvasionDto[] => {
  const active = props.worldstate.invasions.filter((row) => !row.expired);
  const limit = props.maxItems ?? active.length;
  return active.slice(0, Math.max(0, limit));
});
</script>

<template>
  <section class="lanius-ib">
    <header class="lanius-ib__header">
      <div>
        <p class="lanius-ib__eyebrow">{{ t('入侵', 'Invasions') }}</p>
        <h2 class="lanius-ib__title">{{ t('进行中的冲突', 'Active conflicts') }}</h2>
      </div>
      <time class="lanius-ib__time">{{ worldstate.fetchedAt }}</time>
    </header>

    <p v-if="stale" class="lanius-ib__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <ul v-if="items.length" class="lanius-ib__list">
      <li v-for="item in items" :key="item.id" class="lanius-ib__row">
        <div class="lanius-ib__head">
          <strong>{{ label(item.node) }}</strong>
          <span v-if="item.completionPct !== undefined">{{ item.completionPct }}%</span>
        </div>
        <div v-if="item.completionPct !== undefined" class="lanius-ib__bar" aria-hidden="true">
          <div
            class="lanius-ib__fill"
            :style="{ width: `${Math.max(2, Math.min(100, item.completionPct))}%` }"
          />
        </div>
        <div class="lanius-ib__sides">
          <p class="lanius-ib__side">
            <span class="lanius-ib__faction">{{ label(item.attackingFaction) }}</span>
            <OfficialItemIcon
              :icon-url="item.attackerReward?.iconUrl"
              :alt="rewardText(item.attackerReward)"
              :size="28"
            />
            <span>{{ rewardText(item.attackerReward) }}</span>
          </p>
          <p class="lanius-ib__side">
            <span class="lanius-ib__faction">{{ label(item.defendingFaction) }}</span>
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
    <p v-else class="lanius-ib__empty">
      {{ t('当前无进行中的入侵', 'No active invasions') }}
    </p>
  </section>
</template>

<style scoped>
.lanius-ib {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-ib__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.lanius-ib__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-ib__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.25rem, 2vw, 1.6rem);
}

.lanius-ib__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-ib__stale {
  color: var(--lanius-warn);
  margin: 0 0 1rem;
}

.lanius-ib__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}

.lanius-ib__row {
  padding: 0.85rem;
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: 0.85rem;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .lanius-ib__row:hover {
    border-color: rgba(255, 122, 110, 0.4);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}

.lanius-ib__head {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.95rem;
  margin-bottom: 0.45rem;
}

.lanius-ib__head strong {
  color: var(--lanius-brand);
}

.lanius-ib__bar {
  height: 8px;
  border-radius: 4px;
  background: var(--lanius-border);
  overflow: hidden;
  margin-bottom: 0.65rem;
}

.lanius-ib__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--lanius-bar-attack), var(--lanius-bar-defend));
}

.lanius-ib__sides {
  display: grid;
  gap: 0.35rem;
}

.lanius-ib__side {
  margin: 0;
  font-size: 0.85rem;
  color: var(--lanius-text);
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
}

.lanius-ib__faction {
  flex-shrink: 0;
  min-width: 4.5em;
  font-weight: 700;
  color: var(--lanius-text-muted);
}

.lanius-ib__empty {
  margin: 0;
  font-size: 0.95rem;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 1.25rem 0;
}
</style>
