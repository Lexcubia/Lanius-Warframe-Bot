<script setup lang="ts">
import type { WorldstateDto } from '@lanius/core';
import { computed, ref } from 'vue';

import {
  emptyFissureFilter,
  filterFissures,
  type FissureFilterState,
} from '../lib/filter-fissures.js';
import FissuresFilters from './FissuresFilters.vue';
import FissuresModuleCard from './FissuresModuleCard.vue';

/**
 * 可筛选的虚空裂隙面板（筛选条 + 模块卡片）。
 * 供公开站首页 / 裂隙页复用；筛选状态仅本地，不改上游 DTO。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
}>();

/** 三维筛选状态（空维 = 全部）。 */
const filter = ref<FissureFilterState>(emptyFissureFilter());

/**
 * 应用筛选后的 worldstate（仅替换 fissures）。
 *
 * @returns 供卡片渲染的快照
 */
const filteredWorldstate = computed((): WorldstateDto => ({
  ...props.worldstate,
  fissures: filterFissures(props.worldstate.fissures, filter.value),
}));

/**
 * 匹配条数（筛选结果计数）。
 *
 * @returns 过滤后裂隙数量
 */
const matchCount = computed(() => filteredWorldstate.value.fissures.length);
</script>

<template>
  <div class="fissures-panel">
    <FissuresFilters
      v-model="filter"
      :fissures="worldstate.fissures"
      :locale="locale"
      :match-count="matchCount"
    />
    <FissuresModuleCard
      :worldstate="filteredWorldstate"
      :locale="locale"
      :stale="stale"
      :max-items="Math.max(filteredWorldstate.fissures.length, 1)"
    />
  </div>
</template>

<style scoped>
.fissures-panel {
  display: grid;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
  background: transparent;
  /* Web 看板铺满；QQ 截图宿主未设此变量时仍用默认 640px */
  --lanius-card-width: 100%;
}

.fissures-panel :deep(.lanius-qq-shell) {
  width: 100%;
  max-width: none;
}
</style>
