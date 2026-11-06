<script setup lang="ts">
import type { Locale, WikiDto } from '@lanius/core';
import { formatTimestamp } from '@lanius/ui';

import QqCardShell from './QqCardShell.vue';
import type { CardSkinId } from './skins.js';

/**
 * QQ wiki 深链短简介卡（非全文镜像；可点链接由 Bot 文本 / footer 另发）。
 */
defineProps<{
  wiki: WikiDto;
  locale: Locale;
  stale?: boolean;
  skin?: CardSkinId;
}>();
</script>

<template>
  <QqCardShell
    :title="wiki.pageName"
    kicker="WIKI DEEPLINK"
    :subtitle="formatTimestamp(new Date().toISOString())"
    :stale="stale"
    :locale="locale"
    :skin="skin"
  >
    <p class="wiki__mode">
      {{
        wiki.mode === 'search'
          ? locale === 'en'
            ? 'Search fallback'
            : '搜索兜底'
          : locale === 'en'
            ? 'Page deep-link'
            : '条目深链'
      }}
    </p>
    <ul class="wiki__lines">
      <li v-for="(line, idx) in wiki.lines" :key="idx" class="wiki__line">{{ line }}</li>
    </ul>
    <p v-if="wiki.alts.length" class="wiki__alts">
      {{ locale === 'en' ? 'Also:' : '同类候选：'
      }}{{ wiki.alts.join(locale === 'en' ? ', ' : '、') }}
    </p>
    <p v-if="wiki.note" class="wiki__note">⚠️ {{ wiki.note }}</p>
    <p class="wiki__hint">
      {{
        locale === 'en'
          ? 'Open the clickable link in the message text / footer.'
          : '可点链接见消息文本 / 图下 footer（避免 URL 烧死在图里）。'
      }}
    </p>
  </QqCardShell>
</template>

<style scoped>
.wiki__mode {
  margin: 0 0 0.55rem;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.72;
}

.wiki__lines {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
}

.wiki__line {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
}

.wiki__alts,
.wiki__note,
.wiki__hint {
  margin: 0.65rem 0 0;
  font-size: 0.82rem;
  line-height: 1.4;
  opacity: 0.85;
}
</style>
