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
</script>

<template>
  <section class="lanius-ws">
    <header class="lanius-ws__header">
      <div>
        <p class="lanius-ws__eyebrow">{{ t('世界状态', 'World State') }}</p>
        <h2 class="lanius-ws__title">{{ t('国际服实时概览', 'International overview') }}</h2>
      </div>
      <div class="lanius-ws__meta">
        <span class="lanius-ws__live">LIVE</span>
        <time class="lanius-ws__time">{{ worldstate.fetchedAt }}</time>
      </div>
    </header>

    <p v-if="stale" class="lanius-ws__stale">
      {{ t('数据可能延迟（缓存降级）', 'Data may be delayed (stale cache)') }}
    </p>

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
        <h3>{{ t('夜浪', 'Nightwave') }}</h3>
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
        <p v-else class="lanius-ws__muted">{{ t('暂无夜浪数据', 'No Nightwave data') }}</p>
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
  margin-bottom: 1.25rem;
}

.lanius-ws__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-family: var(--lanius-font-display);
}

.lanius-ws__title {
  margin: 0.35rem 0 0;
  font-family: var(--lanius-font-display);
  font-weight: 650;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: 0.02em;
}

.lanius-ws__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.lanius-ws__live {
  color: #ffffff;
  background: linear-gradient(135deg, var(--lanius-highlight), #ff9a6b);
  font-family: var(--lanius-font-display);
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.7rem;
}

.lanius-ws__time {
  color: var(--lanius-text-muted);
  font-family: var(--lanius-font-mono);
  font-size: 0.75rem;
}

.lanius-ws__stale {
  color: var(--lanius-warn);
  margin: 0 0 1rem;
}

.lanius-ws__grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 840px) {
  .lanius-ws__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.lanius-ws__panel {
  background: linear-gradient(165deg, #ffffff, var(--lanius-panel-raised));
  border: 1px solid var(--lanius-border);
  border-radius: 14px;
  padding: 1rem 1.1rem 1.15rem;
  box-shadow: 0 12px 30px rgba(28, 47, 66, 0.06);
}

.lanius-ws__panel h3 {
  margin: 0 0 0.75rem;
  font-family: var(--lanius-font-display);
  font-size: 1.15rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--lanius-brand);
}

.lanius-ws__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.lanius-ws__row-top {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.lanius-ws__muted {
  margin: 0.2rem 0 0;
  color: var(--lanius-text-muted);
  font-size: 0.9rem;
}

.lanius-ws__bar {
  margin-top: 0.45rem;
  height: 4px;
  border-radius: 999px;
  background: var(--lanius-border);
  position: relative;
  overflow: hidden;
}

.lanius-ws__bar::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--pct);
  background: linear-gradient(90deg, var(--lanius-accent-dim), var(--lanius-accent));
}
</style>
