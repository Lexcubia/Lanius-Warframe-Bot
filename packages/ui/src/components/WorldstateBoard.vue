<script setup lang="ts">
import type { LocalizedName, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

/**
 * Nuxt 页面使用的共享世界状态看板 props。
 */
const props = defineProps<{
  /** 来自 Lanius API 的规范化 worldstate DTO。 */
  worldstate: WorldstateDto;
  /** 当前 UI locale，用于双语标签。 */
  locale: 'zh' | 'en';
  /** 可选：API meta 中的陈旧缓存提示。 */
  stale?: boolean;
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
 * 从 DTO 双语字段选取当前 locale 文案。
 *
 * @param name - 可选 LocalizedName
 * @returns 显示字符串；缺省时为空串
 */
function label(name: LocalizedName | undefined): string {
  return name ? pickLocalized(name, props.locale) : '';
}

/**
 * 格式化周期剩余时间。
 *
 * @param remainingMs - 剩余毫秒
 * @returns 短时文案
 */
function remain(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return props.locale === 'en'
      ? `${hours}h ${minutes}m`
      : `${hours}时 ${minutes}分`;
  }
  return props.locale === 'en'
    ? `${minutes}m ${seconds}s`
    : `${minutes}分 ${seconds}秒`;
}

/**
 * 按状态取 SVG 环强调色。
 *
 * @param state - 状态键
 * @returns CSS 颜色
 */
function ringColor(state: string): string {
  if (state === 'day' || state === 'fass' || state === 'warm' || state === 'anger') {
    return '#f0a030';
  }
  if (state === 'night' || state === 'vome' || state === 'cold' || state === 'corpus') {
    return '#3aa7d6';
  }
  return 'var(--lanius-accent)';
}

/**
 * 为单条周期计算 SVG 环几何与描边色（模板内只调用一次）。
 *
 * @param cycle - 开放世界周期 DTO
 * @returns 圆环绘制参数
 */
function cycleRing(cycle: { progress: number; state: string }): {
  r: number;
  cx: number;
  cy: number;
  dash: number;
  circ: number;
  thumbX: number;
  thumbY: number;
  color: string;
} {
  const cx = 36;
  const cy = 36;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, cycle.progress));
  const angle = -Math.PI / 2 + p * Math.PI * 2;
  return {
    r,
    cx,
    cy,
    dash: circ * p,
    circ,
    thumbX: cx + r * Math.cos(angle),
    thumbY: cy + r * Math.sin(angle),
    color: ringColor(cycle.state),
  };
}
</script>

<template>
  <section class="lanius-ws">
    <header class="lanius-ws__header">
      <div>
        <p class="lanius-ws__eyebrow">{{ t('世界状态', 'World State') }}</p>
        <h2 class="lanius-ws__title">{{ t('开放世界周期', 'Open-world cycles') }}</h2>
      </div>
      <div class="lanius-ws__meta">
        <span class="lanius-ws__live">LIVE</span>
        <time class="lanius-ws__time">{{ worldstate.fetchedAt }}</time>
      </div>
    </header>

    <p v-if="stale" class="lanius-ws__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

    <div class="lanius-ws__cycles">
      <article
        v-for="cycle in worldstate.cycles"
        :key="cycle.id"
        class="lanius-ws__cycle"
      >
        <template v-for="ring in [cycleRing(cycle)]" :key="`${cycle.id}-ring`">
          <h3>{{ label(cycle.name) }}</h3>
          <svg
            class="lanius-ws__ring"
            viewBox="0 0 72 72"
            width="72"
            height="72"
            aria-hidden="true"
          >
            <circle
              class="lanius-ws__ring-track"
              :cx="ring.cx"
              :cy="ring.cy"
              :r="ring.r"
              fill="none"
              stroke-width="7"
            />
            <circle
              class="lanius-ws__ring-active"
              :cx="ring.cx"
              :cy="ring.cy"
              :r="ring.r"
              fill="none"
              stroke-width="7"
              stroke-linecap="round"
              :stroke="ring.color"
              :stroke-dasharray="`${ring.dash} ${ring.circ}`"
              transform="rotate(-90 36 36)"
            />
            <circle
              class="lanius-ws__ring-thumb"
              :cx="ring.thumbX"
              :cy="ring.thumbY"
              r="5"
              :fill="ring.color"
              stroke="#fff"
              stroke-width="2"
            />
          </svg>
          <p class="lanius-ws__cycle-state" :style="{ color: ring.color }">
            {{ label(cycle.stateLabel) }}
          </p>
          <p class="lanius-ws__cycle-time" :style="{ color: ring.color }">
            {{ remain(cycle.remainingMs) }}
          </p>
        </template>
      </article>
    </div>

    <div class="lanius-ws__grid">
      <article class="lanius-ws__panel">
        <h3>{{ t('入侵', 'Invasions') }}</h3>
        <ul v-if="worldstate.invasions.length" class="lanius-ws__list">
          <li v-for="row in worldstate.invasions.slice(0, 8)" :key="row.id">
            <div class="lanius-ws__row-top">
              <strong>{{ label(row.node) }}</strong>
              <span v-if="row.completionPct !== undefined">{{ row.completionPct }}%</span>
            </div>
            <p class="lanius-ws__muted">
              {{ label(row.attackingFaction) }} → {{ label(row.defendingFaction) }}
            </p>
            <div
              v-if="row.completionPct !== undefined"
              class="lanius-ws__bar"
              :style="{ '--pct': `${row.completionPct}%` }"
            />
          </li>
        </ul>
        <p v-else class="lanius-ws__muted">{{ t('当前无活跃入侵', 'No active invasions') }}</p>
      </article>

      <article class="lanius-ws__panel">
        <h3>{{ t('午夜电波', 'Nightwave') }}</h3>
        <template v-if="worldstate.nightwave">
          <p class="lanius-ws__muted">
            {{ t('赛季', 'Season') }} {{ worldstate.nightwave.season ?? '—' }} ·
            {{ t('阶段', 'Phase') }} {{ worldstate.nightwave.phase ?? '—' }}
          </p>
          <ul class="lanius-ws__list">
            <li
              v-for="challenge in worldstate.nightwave.activeChallenges.slice(0, 6)"
              :key="challenge.id"
            >
              <strong>{{ label(challenge.title) || challenge.id }}</strong>
              <p v-if="challenge.description" class="lanius-ws__muted">
                {{ label(challenge.description) }}
              </p>
            </li>
          </ul>
        </template>
        <p v-else class="lanius-ws__muted">{{ t('暂无午夜电波数据', 'No Nightwave data') }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.lanius-ws {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
}

.lanius-ws__header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
}

.lanius-ws__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-ws__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.4rem, 2vw, 1.8rem);
}

.lanius-ws__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.lanius-ws__live {
  background: var(--lanius-accent);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.lanius-ws__time {
  color: var(--lanius-text-muted);
  font-size: 0.75rem;
}

.lanius-ws__stale {
  color: var(--lanius-warn);
  margin: 0 0 1rem;
}

.lanius-ws__cycles {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.65rem;
  margin-bottom: 1.25rem;
}

@media (max-width: 900px) {
  .lanius-ws__cycles {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .lanius-ws__cycles {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.lanius-ws__cycle {
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: 0.85rem;
  padding: 0.75rem;
  text-align: center;
}

.lanius-ws__cycle h3 {
  margin: 0 0 0.35rem;
  font-size: 0.85rem;
  color: var(--lanius-brand);
}

.lanius-ws__ring {
  display: block;
  margin: 0.35rem auto 0.5rem;
}

.lanius-ws__ring-track {
  stroke: var(--lanius-border-bright);
}

.lanius-ws__cycle-state {
  margin: 0;
  font-weight: 700;
  color: var(--lanius-accent-dim);
}

.lanius-ws__cycle-time {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  font-weight: 700;
}

.lanius-ws__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 720px) {
  .lanius-ws__grid {
    grid-template-columns: 1fr;
  }
}

.lanius-ws__panel {
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: 0.9rem;
  padding: 1rem;
}

.lanius-ws__panel h3 {
  margin: 0 0 0.75rem;
  color: var(--lanius-brand);
  font-family: var(--lanius-font-display);
}

.lanius-ws__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.lanius-ws__row-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.lanius-ws__muted {
  margin: 0.2rem 0 0;
  color: var(--lanius-text-muted);
  font-size: 0.85rem;
}

.lanius-ws__bar {
  margin-top: 0.4rem;
  height: 0.3rem;
  border-radius: 999px;
  background: var(--lanius-border);
  position: relative;
  overflow: hidden;
}

.lanius-ws__bar::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--pct, 0%);
  background: linear-gradient(
    90deg,
    var(--lanius-bar-attack),
    var(--lanius-bar-defend)
  );
}
</style>
