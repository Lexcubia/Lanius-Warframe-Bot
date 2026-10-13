<script setup lang="ts">
import type { HelpDto, Locale } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

import QqCardShell from './QqCardShell.vue';

const props = defineProps<{
  help: HelpDto;
  locale: Locale;
}>();
</script>

<template>
  <QqCardShell
    :title="pickLocalized(help.title, locale)"
    :subtitle="new Date().toISOString().slice(0, 19).replace('T', ' ')"
    :locale="locale"
  >
    <p class="help-intro">{{ pickLocalized(help.intro, locale) }}</p>
    <ul class="help-list">
      <li v-for="line in help.lines" :key="line.id" class="help-item">
        <div class="help-item__cmd">{{ line.command }}</div>
        <div class="help-item__sum">{{ pickLocalized(line.summary, locale) }}</div>
        <div class="help-item__usage">{{ pickLocalized(line.usage, locale) }}</div>
        <div v-if="line.examples.length" class="help-item__ex">
          {{ line.examples.slice(0, 3).join(' · ') }}
        </div>
      </li>
    </ul>
  </QqCardShell>
</template>

<style scoped>
.help-intro {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--lanius-text-muted);
  line-height: 1.45;
}
.help-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}
.help-item {
  border: 1px solid var(--lanius-border);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--lanius-panel);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .help-item:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}
.help-item__cmd {
  font-weight: 700;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: 14px;
}
.help-item__sum,
.help-item__usage,
.help-item__ex {
  font-size: 12px;
  margin-top: 3px;
  color: var(--lanius-text);
}
.help-item__usage,
.help-item__ex {
  color: var(--lanius-text-muted);
}
</style>
