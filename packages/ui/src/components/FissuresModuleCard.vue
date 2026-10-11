<script setup lang="ts">
import type { FissureDto, FissurePath, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import axiUrl from '../../assets/relics/axi.png';
import lithUrl from '../../assets/relics/lith.png';
import mesoUrl from '../../assets/relics/meso.png';
import neoUrl from '../../assets/relics/neo.png';
import omniaUrl from '../../assets/relics/omnia.png';
import requiemUrl from '../../assets/relics/requiem.png';
import { formatRemain } from '../lib/format-remain.js';
import QqCardShell from './QqCardShell.vue';

/**
 * 虚空裂隙 QQ/截图模块卡片（消费 `WorldstateDto.fissures`）。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  /** 最多展示条数 */
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
 * 路径短标签。
 *
 * @param path - 裂隙路径档
 * @returns 短标签；普通档不额外标
 */
function pathTag(path: FissurePath): string | null {
  if (path === 'steelPath') {
    return props.locale === 'en' ? 'Steel Path' : '钢铁之路';
  }
  if (path === 'empyrean') {
    return props.locale === 'en' ? 'Empyrean' : '九重天';
  }
  return null;
}

/**
 * 按路径档排序后的展示列表。
 *
 * @returns 截断后的裂隙行
 */
function orderedItems(): FissureDto[] {
  const limit = props.maxItems ?? 14;
  const ranked = [...props.worldstate.fissures].sort(
    (a, b) => PATH_ORDER.indexOf(a.path) - PATH_ORDER.indexOf(b.path),
  );
  return ranked.slice(0, limit);
}

const items = orderedItems();
const stamp = props.worldstate.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, '');
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
        <img
          class="fissures__icon"
          :src="iconFor(item.era)"
          :alt="label(item.eraLabel)"
          width="36"
          height="36"
        />
        <div class="fissures__main">
          <div class="fissures__top">
            <span class="fissures__era">{{ label(item.eraLabel) }}</span>
            <span v-if="pathTag(item.path)" class="fissures__path">{{ pathTag(item.path) }}</span>
          </div>
          <p class="fissures__mission">
            {{ label(item.missionType) }} · {{ label(item.node) }}
          </p>
        </div>
        <time class="fissures__remain">{{ formatRemain(item.remainingMs, locale) }}</time>
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
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fissures__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--lanius-panel-raised);
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
}

.fissures__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.fissures__main {
  flex: 1;
  min-width: 0;
}

.fissures__top {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.fissures__era {
  font-size: 13px;
  font-weight: 700;
  color: var(--lanius-brand);
}

.fissures__path {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 6px;
  background: #fff4e8;
  color: #d97706;
}

.fissures__mission {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--lanius-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fissures__remain {
  flex-shrink: 0;
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
