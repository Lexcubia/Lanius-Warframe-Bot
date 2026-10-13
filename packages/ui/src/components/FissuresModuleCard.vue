<script setup lang="ts">
import type { FissureDto, FissurePath, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

import axiUrl from '../../assets/relics/axi.png';
import lithUrl from '../../assets/relics/lith.png';
import mesoUrl from '../../assets/relics/meso.png';
import neoUrl from '../../assets/relics/neo.png';
import omniaUrl from '../../assets/relics/omnia.png';
import requiemUrl from '../../assets/relics/requiem.png';
import { formatRemain } from '../lib/format-remain.js';
import { formatTimestamp } from '../lib/format-timestamp.js';
import OfficialItemIcon from './OfficialItemIcon.vue';
import QqCardShell from './QqCardShell.vue';

/**
 * 虚空裂隙 QQ/截图模块卡片（消费 `WorldstateDto.fissures`）。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  /** 最多展示条数；默认 14（QQ 卡片高度预算） */
  maxItems?: number;
}>();

const RELIC_ICON: Record<string, string> = {
  lith: lithUrl,
  meso: mesoUrl,
  neo: neoUrl,
  axi: axiUrl,
  requiem: requiemUrl,
  omnia: omniaUrl,
};

/**
 * 路径档展示顺序。
 */
const PATH_ORDER: FissurePath[] = ['normal', 'steelPath', 'empyrean'];

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
 * 纪元本地打包图标（优先于上游 CDN，保证截图离线可用）。
 *
 * @param era - 纪元键
 * @returns 资源 URL
 */
function iconFor(era: string): string {
  return RELIC_ICON[era] ?? lithUrl;
}

/**
 * 路径短标签（普通 / 钢铁之路 / 九重天均展示，便于色标区分）。
 *
 * @param path - 裂隙路径档
 * @returns 短标签文案
 */
function pathTag(path: FissurePath): string {
  if (path === 'steelPath') {
    return props.locale === 'en' ? 'Steel Path' : '钢铁之路';
  }
  if (path === 'empyrean') {
    return props.locale === 'en' ? 'Empyrean' : '九重天';
  }
  return props.locale === 'en' ? 'Normal' : '普通';
}

/**
 * 按路径档排序后的展示列表（响应 props 变化）。
 *
 * @returns 截断后的裂隙行
 */
const items = computed((): FissureDto[] => {
  const limit = props.maxItems ?? 14;
  const ranked = [...props.worldstate.fissures].sort(
    (a, b) => PATH_ORDER.indexOf(a.path) - PATH_ORDER.indexOf(b.path),
  );
  return ranked.slice(0, Math.max(0, limit));
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
    :title="locale === 'en' ? 'VOID FISSURES' : '虚空裂隙'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
  >
    <ul v-if="items.length" class="fissures">
      <li v-for="item in items" :key="item.id" class="fissures__row">
        <OfficialItemIcon
          class="fissures__icon"
          :icon-url="iconFor(item.era)"
          :alt="label(item.eraLabel)"
          :size="36"
        />
        <div class="fissures__main">
          <div class="fissures__top">
            <span class="fissures__era">{{ label(item.eraLabel) }}</span>
            <span class="fissures__path" :class="`fissures__path--${item.path}`">{{
              pathTag(item.path)
            }}</span>
            <time class="fissures__remain">{{ formatRemain(item.remainingMs, locale) }}</time>
          </div>
          <p class="fissures__mission">{{ label(item.missionType) }} · {{ label(item.node) }}</p>
        </div>
      </li>
    </ul>
    <p v-else class="fissures__empty">
      {{ locale === 'en' ? 'No active fissures' : '当前无活跃裂隙' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.fissures {
  list-style: none;
  margin: 0;
  padding: 0;
  /* 单列纵向：给足行宽，保证纪元/任务/节点/时间完整显示不省略 */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fissures__row {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
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
  .fissures__row:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}

.fissures__icon {
  flex-shrink: 0;
}

.fissures__main {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
}

.fissures__top {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.fissures__era {
  font-size: 13px;
  font-weight: 700;
  color: var(--lanius-brand);
  white-space: nowrap;
}

.fissures__path {
  white-space: nowrap;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

/* 普通：晴空青 */
.fissures__path--normal {
  background: rgba(56, 148, 186, 0.14);
  color: #2a7a9a;
}

/* 钢铁之路：冷钢灰 */
.fissures__path--steelPath {
  background: rgba(90, 102, 122, 0.18);
  color: #4a5568;
}

/* 九重天：虚空靛 */
.fissures__path--empyrean {
  background: rgba(88, 92, 196, 0.16);
  color: #4a4eb8;
}

.fissures__mission {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--lanius-text);
  /* 节点名完整显示：单行优先，不截断 */
  white-space: nowrap;
}

.fissures__remain {
  /* 位于第一行（纪元/路径标签）末尾，避免独立列被节点名挤占 */
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 8px;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-accent);
  font-family: var(--lanius-font-display);
}

.fissures__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 16px 0;
}
</style>
