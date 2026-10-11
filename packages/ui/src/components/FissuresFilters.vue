<script setup lang="ts">
import type { FissureDto, FissureEra, FissurePath } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

import {
  collectMissionTypeOptions,
  emptyFissureFilter,
  FISSURE_ERA_ORDER,
  FISSURE_PATH_ORDER,
  isFissureFilterActive,
  toggleFilterValue,
  type FissureFilterState,
} from '../lib/filter-fissures.js';

/**
 * 虚空裂隙三维筛选条：遗物类型 / 任务类型 / 普通·钢铁·九重天。
 * 空选中表示该维不过滤。
 */
const props = defineProps<{
  /** 当前裂隙列表（用于生成任务类型选项） */
  fissures: readonly FissureDto[];
  /** 界面 locale */
  locale: 'zh' | 'en';
  /** 当前筛选状态 */
  modelValue: FissureFilterState;
  /** 过滤后条数（展示计数） */
  matchCount?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: FissureFilterState];
}>();

/**
 * 纪元短标签。
 */
const ERA_LABEL: Record<FissureEra, { zh: string; en: string }> = {
  lith: { zh: '古纪', en: 'Lith' },
  meso: { zh: '前纪', en: 'Meso' },
  neo: { zh: '中纪', en: 'Neo' },
  axi: { zh: '后纪', en: 'Axi' },
  requiem: { zh: '安魂', en: 'Requiem' },
  omnia: { zh: '全能', en: 'Omnia' },
};

/**
 * 路径档短标签。
 */
const PATH_LABEL: Record<FissurePath, { zh: string; en: string }> = {
  normal: { zh: '普通', en: 'Normal' },
  steelPath: { zh: '钢铁之路', en: 'Steel Path' },
  empyrean: { zh: '九重天', en: 'Empyrean' },
};

/**
 * 维标题文案。
 */
const DIM = {
  group: { zh: '裂隙筛选', en: 'Fissure filters' },
  era: { zh: '遗物类型', en: 'Relic' },
  mission: { zh: '任务类型', en: 'Mission' },
  path: { zh: '难度 / 星图', en: 'Path' },
  reset: { zh: '清除筛选', en: 'Clear' },
  matches: { zh: '条结果', en: 'matches' },
} as const;

/**
 * 当前 locale 下的任务类型选项。
 *
 * @returns 去重排序后的任务类型 chip
 */
const missionOptions = computed(() =>
  collectMissionTypeOptions(props.fissures, props.locale),
);

/**
 * 是否存在活动筛选。
 *
 * @returns 任一维非空时为 true
 */
const active = computed(() => isFissureFilterActive(props.modelValue));

/**
 * 取双语短标签。
 *
 * @param name - 双语对象
 * @returns 当前 locale 文案
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, props.locale);
}

/**
 * 更新某一维已选列表。
 *
 * @param key - 筛选维字段名
 * @param next - 新的已选数组
 * @returns 无返回值
 */
function patchDim<K extends keyof FissureFilterState>(
  key: K,
  next: FissureFilterState[K],
): void {
  emit('update:modelValue', { ...props.modelValue, [key]: next });
}

/**
 * 切换遗物纪元选中。
 *
 * @param era - 纪元键
 * @returns 无返回值
 */
function toggleEra(era: FissureEra): void {
  patchDim('eras', toggleFilterValue(props.modelValue.eras, era));
}

/**
 * 切换任务类型选中。
 *
 * @param key - missionTypeKey
 * @returns 无返回值
 */
function toggleMission(key: string): void {
  patchDim(
    'missionTypeKeys',
    toggleFilterValue(props.modelValue.missionTypeKeys, key),
  );
}

/**
 * 切换路径档选中。
 *
 * @param path - 路径档
 * @returns 无返回值
 */
function togglePath(path: FissurePath): void {
  patchDim('paths', toggleFilterValue(props.modelValue.paths, path));
}

/**
 * 清除全部筛选。
 *
 * @returns 无返回值
 */
function reset(): void {
  emit('update:modelValue', emptyFissureFilter());
}
</script>

<template>
  <div class="ff" role="group" :aria-label="label(DIM.group)">
    <div class="ff__row">
      <span class="ff__dim">{{ label(DIM.era) }}</span>
      <div class="ff__chips">
        <button
          v-for="era in FISSURE_ERA_ORDER"
          :key="era"
          type="button"
          class="ff__chip"
          :class="{ 'ff__chip--on': modelValue.eras.includes(era) }"
          :aria-pressed="modelValue.eras.includes(era)"
          @click="toggleEra(era)"
        >
          {{ label(ERA_LABEL[era]) }}
        </button>
      </div>
    </div>

    <div class="ff__row">
      <span class="ff__dim">{{ label(DIM.mission) }}</span>
      <div class="ff__chips">
        <button
          v-for="opt in missionOptions"
          :key="opt.key"
          type="button"
          class="ff__chip"
          :class="{ 'ff__chip--on': modelValue.missionTypeKeys.includes(opt.key) }"
          :aria-pressed="modelValue.missionTypeKeys.includes(opt.key)"
          @click="toggleMission(opt.key)"
        >
          {{ label(opt.label) }}
        </button>
        <span v-if="missionOptions.length === 0" class="ff__hint">—</span>
      </div>
    </div>

    <div class="ff__row">
      <span class="ff__dim">{{ label(DIM.path) }}</span>
      <div class="ff__chips">
        <button
          v-for="path in FISSURE_PATH_ORDER"
          :key="path"
          type="button"
          class="ff__chip"
          :class="[
            `ff__chip--path-${path}`,
            { 'ff__chip--on': modelValue.paths.includes(path) },
          ]"
          :aria-pressed="modelValue.paths.includes(path)"
          @click="togglePath(path)"
        >
          {{ label(PATH_LABEL[path]) }}
        </button>
      </div>
    </div>

    <div v-if="active || matchCount != null" class="ff__meta">
      <span v-if="matchCount != null" class="ff__count">
        {{ matchCount }} {{ label(DIM.matches) }}
      </span>
      <button
        v-if="active"
        type="button"
        class="ff__reset"
        @click="reset"
      >
        {{ label(DIM.reset) }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ff {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 0.85rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--lanius-border, rgba(90, 120, 160, 0.16));
  border-radius: 14px;
  background: var(--lanius-panel, rgba(255, 255, 255, 0.72));
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.ff__row {
  display: grid;
  grid-template-columns: minmax(4.5rem, 5.5rem) 1fr;
  gap: 0.5rem 0.75rem;
  align-items: start;
}

.ff__dim {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--lanius-text-muted, #6b7385);
  padding-top: 0.35rem;
  line-height: 1.3;
}

.ff__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.ff__chip {
  border: 1px solid var(--lanius-border, rgba(90, 120, 160, 0.22));
  background: transparent;
  color: var(--lanius-text, #2a3142);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.28rem 0.65rem;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

@media (hover: hover) {
  .ff__chip:hover {
    border-color: var(--lanius-accent, #4eb7e8);
    background: rgba(78, 183, 232, 0.1);
    color: var(--lanius-accent-dim, #2f8fc4);
  }

  .ff__chip--on:hover {
    background: rgba(78, 183, 232, 0.2);
  }

  .ff__reset:hover {
    color: var(--lanius-highlight, #ff7a6e);
  }
}

.ff__chip--on {
  background: rgba(47, 143, 196, 0.14);
  border-color: rgba(47, 143, 196, 0.55);
  color: var(--lanius-accent, #2f8fc4);
}

/* 路径档色标：普通 / 钢铁 / 九重天 */
.ff__chip--path-normal {
  border-color: rgba(56, 148, 186, 0.35);
  color: #2a7a9a;
}
.ff__chip--path-normal.ff__chip--on {
  background: rgba(56, 148, 186, 0.18);
  border-color: rgba(56, 148, 186, 0.65);
  color: #1f6a88;
}

.ff__chip--path-steelPath {
  border-color: rgba(90, 102, 122, 0.4);
  color: #4a5568;
}
.ff__chip--path-steelPath.ff__chip--on {
  background: rgba(90, 102, 122, 0.2);
  border-color: rgba(74, 85, 104, 0.7);
  color: #3d4656;
}

.ff__chip--path-empyrean {
  border-color: rgba(88, 92, 196, 0.4);
  color: #4a4eb8;
}
.ff__chip--path-empyrean.ff__chip--on {
  background: rgba(88, 92, 196, 0.18);
  border-color: rgba(74, 78, 184, 0.7);
  color: #3d41a0;
}

@media (hover: hover) {
  .ff__chip--path-normal:hover {
    border-color: rgba(56, 148, 186, 0.55);
    background: rgba(56, 148, 186, 0.1);
    color: #1f6a88;
  }
  .ff__chip--path-steelPath:hover {
    border-color: rgba(74, 85, 104, 0.55);
    background: rgba(90, 102, 122, 0.12);
    color: #3d4656;
  }
  .ff__chip--path-empyrean:hover {
    border-color: rgba(74, 78, 184, 0.55);
    background: rgba(88, 92, 196, 0.1);
    color: #3d41a0;
  }
}

.ff__hint {
  color: var(--lanius-text-muted, #6b7385);
  font-size: 0.8rem;
  padding: 0.28rem 0;
}

.ff__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
  padding-top: 0.15rem;
}

.ff__count {
  font-size: 0.78rem;
  color: var(--lanius-text-muted, #6b7385);
}

.ff__reset {
  border: none;
  background: none;
  color: var(--lanius-accent, #2f8fc4);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 560px) {
  .ff__row {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }

  .ff__dim {
    padding-top: 0;
  }
}
</style>
