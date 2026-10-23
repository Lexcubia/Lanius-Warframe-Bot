<script setup lang="ts">
import type { FissureDto, FissurePath, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatRemain, formatTimestamp, OfficialItemIcon } from '@lanius/ui';
import { computed } from 'vue';

import axiUrl from '@lanius/ui/assets/relics/axi.png';
import lithUrl from '@lanius/ui/assets/relics/lith.png';
import mesoUrl from '@lanius/ui/assets/relics/meso.png';
import neoUrl from '@lanius/ui/assets/relics/neo.png';
import omniaUrl from '@lanius/ui/assets/relics/omnia.png';
import requiemUrl from '@lanius/ui/assets/relics/requiem.png';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 虚空裂隙 QQ 截图卡：两列压缩；末奇数项可跨全宽。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  maxItems?: number;
  skin?: CardSkinId;
}>();

const RELIC_ICON: Record<string, string> = {
  lith: lithUrl,
  meso: mesoUrl,
  neo: neoUrl,
  axi: axiUrl,
  requiem: requiemUrl,
  omnia: omniaUrl,
};

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
 * 纪元本地打包图标。
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
 * 按路径档排序后的展示列表。
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
    :skin="skin"
  >
    <ul v-if="items.length" class="fissures">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        class="fissures__row"
        :class="{ 'fissures__row--span': items.length % 2 === 1 && index === items.length - 1 }"
      >
        <OfficialItemIcon
          class="fissures__icon"
          :icon-url="iconFor(item.era)"
          :alt="label(item.eraLabel)"
          :size="28"
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--lanius-border);
}
.fissures__row {
  box-sizing: border-box;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--lanius-border);
  border-right: 1px solid var(--lanius-border);
}
.fissures__row:nth-child(2n) {
  border-right: none;
}
.fissures__row--span {
  grid-column: 1 / -1;
  border-right: none;
}
.fissures__icon {
  flex-shrink: 0;
}
.fissures__main {
  flex: 1 1 auto;
  min-width: 0;
}
.fissures__top {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.fissures__era {
  font-size: 12px;
  font-weight: 700;
  color: var(--lanius-brand);
}
.fissures__path {
  font-size: 9px;
  font-weight: 700;
  padding: 0 4px;
  border-radius: 3px;
}
.fissures__path--normal {
  background: rgba(56, 148, 186, 0.14);
  color: #2a7a9a;
}
.fissures__path--steelPath {
  background: rgba(90, 102, 122, 0.18);
  color: #4a5568;
}
.fissures__path--empyrean {
  background: rgba(88, 92, 196, 0.16);
  color: #4a4eb8;
}
.fissures__mission {
  margin: 1px 0 0;
  font-size: 10px;
  color: var(--lanius-text);
  overflow-wrap: break-word;
}
.fissures__remain {
  flex: 0 0 auto;
  margin-left: auto;
  padding-left: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--lanius-accent);
  font-family: var(--lanius-font-display);
}
.fissures__empty {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 0;
}
</style>
