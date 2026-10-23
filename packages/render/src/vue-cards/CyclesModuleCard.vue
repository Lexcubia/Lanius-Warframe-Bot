<script setup lang="ts">
import type { OpenWorldCycleDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import {
  formatRemain,
  formatTimestamp,
  OpenWorldCycleIcon,
  resolveOpenWorldCycleTheme,
} from '@lanius/ui';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 世界状态（开放世界周期）QQ 截图卡：2×3 环格铺满宽；字号偏大便于缩略图可读。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  skin?: CardSkinId;
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
 * SVG 环几何与六地主题色（环半径略缩小以省高）。
 *
 * @param cycle - 周期 DTO
 * @returns 绘制参数
 */
function ringGeom(cycle: OpenWorldCycleDto): {
  dash: number;
  circ: number;
  thumbX: number;
  thumbY: number;
  color: string;
  track: string;
  badgeBg: string;
  badgeFg: string;
} {
  const r = 28;
  const cx = 36;
  const cy = 36;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, cycle.progress));
  const angle = -Math.PI / 2 + p * Math.PI * 2;
  const theme = resolveOpenWorldCycleTheme(cycle.id);
  return {
    dash: circ * p,
    circ,
    thumbX: cx + r * Math.cos(angle),
    thumbY: cy + r * Math.sin(angle),
    color: theme.accent,
    track: theme.track,
    badgeBg: theme.badgeBg,
    badgeFg: theme.badgeFg,
  };
}

const rows = [() => props.worldstate.cycles.slice(0, 3), () => props.worldstate.cycles.slice(3, 6)];
const stamp = formatTimestamp(props.worldstate.fetchedAt);
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'WORLD STATE' : '世界状态'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <div class="cycles">
      <div v-for="(rowFn, ri) in rows" :key="ri" class="cycles__row">
        <article v-for="cycle in rowFn()" :key="cycle.id" class="cycles__tile">
          <template v-for="g in [ringGeom(cycle)]" :key="`${cycle.id}-g`">
            <h3 :style="{ color: g.color }">{{ label(cycle.name) }}</h3>
            <div class="cycles__ring-wrap">
              <svg
                class="cycles__ring"
                viewBox="0 0 72 72"
                width="64"
                height="64"
                aria-hidden="true"
              >
                <circle cx="36" cy="36" r="28" fill="none" stroke-width="7" :stroke="g.track" />
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  fill="none"
                  stroke-width="7"
                  stroke-linecap="round"
                  :stroke="g.color"
                  :stroke-dasharray="`${g.dash} ${g.circ}`"
                  transform="rotate(-90 36 36)"
                />
                <circle
                  :cx="g.thumbX"
                  :cy="g.thumbY"
                  r="4.5"
                  :fill="g.color"
                  stroke="#fff"
                  stroke-width="1.5"
                />
              </svg>
              <OpenWorldCycleIcon
                class="cycles__ring-icon"
                :cycle-id="cycle.id"
                :color="g.color"
                :size="22"
              />
            </div>
            <span class="cycles__badge" :style="{ background: g.badgeBg, color: g.badgeFg }">
              {{ label(cycle.stateLabel) }}
            </span>
            <p class="cycles__time" :style="{ color: g.badgeFg }">
              {{ formatRemain(cycle.remainingMs, locale) }}
            </p>
          </template>
        </article>
      </div>
    </div>
  </QqCardShell>
</template>

<style scoped>
.cycles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}
.cycles__row {
  display: flex;
  gap: 0;
  width: 100%;
}
.cycles__tile {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3px 2px 4px;
  text-align: center;
  border-right: 1px solid var(--lanius-border);
}
.cycles__tile:last-child {
  border-right: none;
}
.cycles__tile h3 {
  margin: 0 0 2px;
  font-size: var(--lanius-type-meta, 12px);
  font-weight: 700;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cycles__ring-wrap {
  position: relative;
  width: 64px;
  height: 64px;
}
.cycles__ring {
  display: block;
}
.cycles__ring-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  pointer-events: none;
}
.cycles__badge {
  margin-top: 3px;
  padding: 1px 7px;
  border-radius: 4px;
  font-size: var(--lanius-type-caption, 11px);
  font-weight: 700;
}
.cycles__time {
  margin: 2px 0 0;
  font-size: var(--lanius-type-body, 14px);
  font-weight: 700;
  font-family: var(--lanius-font-display);
}
</style>
