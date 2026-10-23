<script setup lang="ts">
import type { ArbitrationDto, WorldstateDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 仲裁 QQ 截图卡：单节点 · 任务类型 · 敌对阵营；社区源空态友好提示。
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
 * 仲裁切片。
 *
 * @returns ArbitrationDto 或 null
 */
const arb = computed((): ArbitrationDto | null => props.worldstate.arbitration);

/**
 * 抓取时间戳短文案。
 *
 * @returns 卡片副标题用时间
 */
const stamp = computed(() => formatTimestamp(props.worldstate.fetchedAt));

/**
 * 剩余时间短文案。
 *
 * @returns 剩余时分，或空串
 */
const remaining = computed((): string => {
  const expiry = arb.value?.expiry;
  if (!expiry) {
    return '';
  }
  const remainingMs = Math.max(0, Date.parse(expiry) - Date.now());
  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (props.locale === 'en') {
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  return hours > 0 ? `${hours}时${minutes}分` : `${minutes}分`;
});
</script>

<template>
  <QqCardShell
    :title="locale === 'en' ? 'ARBITRATION' : '仲裁'"
    :subtitle="stamp || 'LANIUS'"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <template v-if="arb">
      <div class="arb__hero">
        <p class="arb__node">
          {{ arb.node ? label(arb.node) : arb.nodeKey || '—' }}
        </p>
        <p class="arb__mission">
          {{ arb.missionType ? label(arb.missionType) : arb.missionTypeKey || '—' }}
        </p>
      </div>
      <dl class="arb__meta">
        <div v-if="arb.enemy || arb.enemyKey" class="arb__row">
          <dt>{{ locale === 'en' ? 'Enemy' : '敌对' }}</dt>
          <dd>{{ arb.enemy ? label(arb.enemy) : arb.enemyKey }}</dd>
        </div>
        <div v-if="remaining" class="arb__row">
          <dt>{{ locale === 'en' ? 'Left' : '剩余' }}</dt>
          <dd>{{ remaining }}</dd>
        </div>
        <div v-if="arb.source" class="arb__row arb__row--muted">
          <dt>{{ locale === 'en' ? 'Source' : '来源' }}</dt>
          <dd>{{ arb.source }}</dd>
        </div>
      </dl>
    </template>
    <p v-else class="arb__empty">
      {{
        locale === 'en'
          ? 'No arbitration data (community source unavailable or none active)'
          : '暂无仲裁数据（社区源暂时不可用或当前无活跃仲裁）'
      }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.arb__hero {
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--lanius-border);
}
.arb__node {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 700;
  color: var(--lanius-text);
  line-height: 1.25;
}
.arb__mission {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--lanius-accent-dim);
}
.arb__meta {
  margin: 0;
  display: grid;
  gap: 4px;
}
.arb__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 11px;
}
.arb__row dt {
  margin: 0;
  color: var(--lanius-text-muted);
  flex-shrink: 0;
}
.arb__row dd {
  margin: 0;
  font-weight: 600;
  color: var(--lanius-text);
  text-align: right;
}
.arb__row--muted dd {
  font-weight: 500;
  color: var(--lanius-text-muted);
}
.arb__empty {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  text-align: center;
  padding: 12px 4px;
  line-height: 1.45;
}
</style>
