<script setup lang="ts">
import { VALENCE_BONUS_MAX_PCT } from '@lanius/core';
import { computed } from 'vue';

/**
 * Valence 加成百分比进度条（相对游戏上限 60% 归一）。
 */
const props = defineProps<{
  /** 加成百分比（通常 25–60） */
  bonusPct: number;
  /** 是否显示右侧数值文案 */
  showLabel?: boolean;
}>();

/**
 * 填充宽度 0–100（相对 VALENCE_BONUS_MAX_PCT）。
 */
const fillPct = computed(() => {
  if (!Number.isFinite(props.bonusPct) || props.bonusPct <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (props.bonusPct / VALENCE_BONUS_MAX_PCT) * 100));
});

/**
 * 展示用百分比文案（一位小数）。
 */
const labelText = computed(() => `${Number(props.bonusPct.toFixed(1))}%`);
</script>

<template>
  <div
    class="valence-bar"
    role="meter"
    :aria-valuenow="bonusPct"
    :aria-valuemin="0"
    :aria-valuemax="VALENCE_BONUS_MAX_PCT"
  >
    <div class="valence-bar__track">
      <div class="valence-bar__fill" :style="{ width: `${fillPct}%` }" />
    </div>
    <span v-if="showLabel !== false" class="valence-bar__label">{{ labelText }}</span>
  </div>
</template>

<style scoped>
.valence-bar {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  flex: 1;
}

.valence-bar__track {
  flex: 1;
  min-width: 3.5rem;
  max-width: 12rem;
  height: 6px;
  border-radius: 999px;
  background: rgba(62, 78, 110, 0.14);
  overflow: hidden;
}

.valence-bar__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #5eb8e8, #3d8fbf);
  transition: width 0.25s ease;
}

.valence-bar__label {
  flex-shrink: 0;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--lanius-text, #2b3350);
  min-width: 3em;
  text-align: right;
}
</style>
