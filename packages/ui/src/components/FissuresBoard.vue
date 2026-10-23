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
import OfficialItemIcon from './OfficialItemIcon.vue';

/**
 * 公开站虚空裂隙看板（响应式列表；不依赖 QQ ModuleCard / Shell）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的 worldstate（通常已筛选 fissures）。 */
  worldstate: WorldstateDto;
  /** 当前 UI locale。 */
  locale: 'zh' | 'en';
  /** 可选：缓存降级提示。 */
  stale?: boolean;
  /** 最多展示条数；默认展示全部。 */
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

/** 路径档展示顺序。 */
const PATH_ORDER: FissurePath[] = ['normal', 'steelPath', 'empyrean'];

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
 * 纪元本地打包图标（优先于上游 CDN）。
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
    return t('钢铁之路', 'Steel Path');
  }
  if (path === 'empyrean') {
    return t('九重天', 'Empyrean');
  }
  return t('普通', 'Normal');
}

/**
 * 按路径档排序后的展示列表。
 *
 * @returns 截断后的裂隙行
 */
const items = computed((): FissureDto[] => {
  const limit = props.maxItems ?? props.worldstate.fissures.length;
  const ranked = [...props.worldstate.fissures].sort(
    (a, b) => PATH_ORDER.indexOf(a.path) - PATH_ORDER.indexOf(b.path),
  );
  return ranked.slice(0, Math.max(0, limit));
});
</script>

<template>
  <section class="lanius-fb">
    <header class="lanius-fb__header">
      <div>
        <p class="lanius-fb__eyebrow">{{ t('虚空裂隙', 'Void Fissures') }}</p>
        <h2 class="lanius-fb__title">{{ t('活跃裂隙', 'Active fissures') }}</h2>
      </div>
      <time class="lanius-fb__time">{{ worldstate.fetchedAt }}</time>
    </header>

    <p v-if="stale" class="lanius-fb__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <ul v-if="items.length" class="lanius-fb__list">
      <li v-for="item in items" :key="item.id" class="lanius-fb__row">
        <OfficialItemIcon
          class="lanius-fb__icon"
          :icon-url="iconFor(item.era)"
          :alt="label(item.eraLabel)"
          :size="36"
        />
        <div class="lanius-fb__main">
          <div class="lanius-fb__top">
            <span class="lanius-fb__era">{{ label(item.eraLabel) }}</span>
            <span class="lanius-fb__path" :class="`lanius-fb__path--${item.path}`">{{
              pathTag(item.path)
            }}</span>
            <time class="lanius-fb__remain">{{ formatRemain(item.remainingMs, locale) }}</time>
          </div>
          <p class="lanius-fb__mission">{{ label(item.missionType) }} · {{ label(item.node) }}</p>
        </div>
      </li>
    </ul>
    <p v-else class="lanius-fb__empty">
      {{ t('当前无活跃裂隙', 'No active fissures') }}
    </p>
  </section>
</template>

<style scoped>
.lanius-fb {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-fb__header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.lanius-fb__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-fb__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.25rem, 2vw, 1.6rem);
}

.lanius-fb__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-fb__stale {
  color: var(--lanius-warn);
  margin: 0 0 1rem;
}

.lanius-fb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
}

@media (max-width: 640px) {
  .lanius-fb__list {
    grid-template-columns: 1fr;
  }
}

.lanius-fb__row {
  box-sizing: border-box;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.85rem;
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
  .lanius-fb__row:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}

.lanius-fb__icon {
  flex-shrink: 0;
}

.lanius-fb__main {
  flex: 1 1 auto;
  min-width: 0;
}

.lanius-fb__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.lanius-fb__era {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--lanius-brand);
}

.lanius-fb__path {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
}

.lanius-fb__path--normal {
  background: rgba(56, 148, 186, 0.14);
  color: #2a7a9a;
}

.lanius-fb__path--steelPath {
  background: rgba(90, 102, 122, 0.18);
  color: #4a5568;
}

.lanius-fb__path--empyrean {
  background: rgba(88, 92, 196, 0.16);
  color: #4a4eb8;
}

.lanius-fb__mission {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--lanius-text);
  overflow-wrap: break-word;
}

.lanius-fb__remain {
  margin-left: auto;
  white-space: nowrap;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--lanius-accent);
  font-family: var(--lanius-font-display);
}

.lanius-fb__empty {
  margin: 0;
  font-size: 0.95rem;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 1.25rem 0;
}
</style>
