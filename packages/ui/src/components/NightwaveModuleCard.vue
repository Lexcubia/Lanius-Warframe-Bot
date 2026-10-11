<script setup lang="ts">
import type {
  NightwaveChallengeDto,
  NightwaveChallengeKind,
  WorldstateDto,
} from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';

/**
 * 午夜电波 QQ/截图模块卡片（消费 `WorldstateDto.nightwave`）。
 * 挑战按每日 / 每周分组标注。
 */
const props = defineProps<{
  worldstate: WorldstateDto;
  locale: 'zh' | 'en';
  stale?: boolean;
  /** 最多展示挑战条数 */
  maxItems?: number;
}>();

/**
 * 分组展示顺序。
 */
const KIND_ORDER: NightwaveChallengeKind[] = ['daily', 'weekly', 'other'];

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
 * 午夜电波切片。
 *
 * @returns nightwave DTO 或 null
 */
const nw = computed(() => props.worldstate.nightwave);

/**
 * 截断后的挑战列表。
 *
 * @returns 挑战行
 */
const challenges = computed((): NightwaveChallengeDto[] => {
  const limit = props.maxItems ?? 12;
  return nw.value?.activeChallenges.slice(0, limit) ?? [];
});

/**
 * 按周期档分组（仅包含有条目的组）。
 *
 * @returns 分组列表
 */
const groups = computed(() => {
  const byKind = new Map<NightwaveChallengeKind, NightwaveChallengeDto[]>();
  for (const kind of KIND_ORDER) {
    byKind.set(kind, []);
  }
  for (const row of challenges.value) {
    byKind.get(row.kind)?.push(row);
  }
  return KIND_ORDER.filter((kind) => (byKind.get(kind)?.length ?? 0) > 0).map(
    (kind) => ({
      kind,
      label: byKind.get(kind)?.[0]?.kindLabel ?? {
        zh: kind,
        en: kind,
      },
      items: byKind.get(kind) ?? [],
    }),
  );
});

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() =>
  props.worldstate.fetchedAt.replace('T', ' ').replace(/\.\d+Z$/, ''),
);
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'NIGHTWAVE' : '午夜电波'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
  >
    <template v-if="nw">
      <div class="nw__meta">
        <span>
          {{ locale === 'en' ? 'Season' : '赛季' }} {{ nw.season ?? '—' }}
          ·
          {{ locale === 'en' ? 'Phase' : '阶段' }} {{ nw.phase ?? '—' }}
        </span>
        <span class="nw__count">{{ challenges.length }}</span>
      </div>

      <template v-if="groups.length">
        <section
          v-for="group in groups"
          :key="group.kind"
          class="nw__group"
        >
          <h4 class="nw__group-title" :data-kind="group.kind">
            {{ label(group.label) }}
          </h4>
          <ul class="nw__list">
            <li
              v-for="challenge in group.items"
              :key="challenge.id"
              class="nw__row"
            >
              <span class="nw__tag" :data-kind="challenge.kind">
                {{ label(challenge.kindLabel) }}
              </span>
              <div class="nw__body">
                <strong>
                  {{
                    challenge.title ? label(challenge.title) : challenge.id
                  }}
                </strong>
                <p v-if="challenge.description">
                  {{ label(challenge.description) }}
                </p>
              </div>
            </li>
          </ul>
        </section>
      </template>
      <p v-else class="nw__empty">
        {{ locale === 'en' ? 'No active challenges' : '当前无活跃挑战' }}
      </p>
    </template>
    <p v-else class="nw__empty">
      {{ locale === 'en' ? 'No Nightwave data' : '暂无午夜电波数据' }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.nw__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--lanius-text-muted);
}

.nw__count {
  min-width: 1.5em;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(78, 183, 232, 0.14);
  color: var(--lanius-accent-dim);
  font-weight: 700;
  text-align: center;
}

.nw__group {
  margin-bottom: 12px;
}

.nw__group:last-child {
  margin-bottom: 0;
}

.nw__group-title {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--lanius-text-muted);
}

.nw__group-title[data-kind='daily'] {
  color: var(--lanius-brand, #2f8fc4);
}

.nw__group-title[data-kind='weekly'] {
  color: var(--lanius-warn, #d97706);
}

.nw__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nw__row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px;
  margin: 0 -8px;
  border-radius: 10px;
  border: 1px solid transparent;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .nw__row:hover {
    border-color: var(--lanius-border);
    background: var(--lanius-panel-raised);
    box-shadow: 0 4px 12px rgba(62, 78, 110, 0.08);
  }
}

.nw__tag {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  line-height: 1.4;
  margin-top: 1px;
}

.nw__tag[data-kind='daily'] {
  background: rgba(78, 183, 232, 0.14);
  color: var(--lanius-accent-dim, #2f8fc4);
}

.nw__tag[data-kind='weekly'] {
  background: rgba(255, 122, 110, 0.12);
  color: var(--lanius-highlight, #ff7a6e);
}

.nw__tag[data-kind='other'] {
  background: rgba(228, 213, 200, 0.45);
  color: var(--lanius-text-muted, #6b7385);
}

.nw__body {
  flex: 1;
  min-width: 0;
}

.nw__body strong {
  display: block;
  font-size: 13px;
  color: var(--lanius-text);
}

.nw__body p {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--lanius-text-muted);
}

.nw__empty {
  margin: 0;
  font-size: 13px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 16px 0;
}
</style>
