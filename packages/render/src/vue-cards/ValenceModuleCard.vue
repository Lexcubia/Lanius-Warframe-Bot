<script setup lang="ts">
import type { Locale, ValenceFusionDto } from '@lanius/core';
import { pickLocalized } from '@lanius/core';
import { DamageTypeIcon, ValenceBonusBar, formatTimestamp } from '@lanius/ui';
import { computed } from 'vue';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * 效价融合 QQ 卡：结果条 + 可选元素本地图标 + 公式行。
 */
const props = defineProps<{
  valence: ValenceFusionDto;
  locale: Locale;
  skin?: CardSkinId;
}>();

/**
 * 卡片主标题。
 *
 * @returns 标题
 */
const title = computed(() => {
  if (props.valence.mode === 'plan') {
    return props.locale === 'en' ? 'Valence plan' : '效价融合规划';
  }
  if (props.valence.mode === 'usage') {
    return props.locale === 'en' ? 'Valence fusion' : '效价融合';
  }
  return props.locale === 'en' ? 'Valence fusion' : '效价融合';
});
</script>

<template>
  <QqCardShell
    :title="title"
    kicker="VALENCE FUSION"
    :subtitle="formatTimestamp(new Date().toISOString())"
    :locale="locale"
    :skin="skin"
  >
    <div v-if="valence.percent != null" class="val__result">
      <span class="val__result-label">{{ locale === 'en' ? 'Result' : '融合结果' }}</span>
      <ValenceBonusBar :bonus-pct="valence.percent" />
    </div>

    <ul v-if="valence.options.length" class="val__options">
      <li v-for="opt in valence.options" :key="opt.element" class="val__opt">
        <DamageTypeIcon :element="opt.element" />
        <span>{{ pickLocalized(opt.label, locale) }}</span>
      </li>
    </ul>

    <ul class="val__lines">
      <li v-for="(line, idx) in valence.lines" :key="idx" class="val__line">{{ line }}</li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.val__result {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.75rem;
}

.val__result-label {
  flex-shrink: 0;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.val__options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem 1rem;
  margin: 0 0 0.75rem;
  padding: 0;
  list-style: none;
}

.val__opt {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.val__lines {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.3rem;
}

.val__line {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
}
</style>
