<script setup lang="ts">
import type { HelpDto, Locale } from '@lanius/core';
import { pickLocalized } from '@lanius/core';

/**
 * 公开站帮助详情看板（模块指令说明；不依赖 QQ ModuleCard / Shell）。
 */
const props = defineProps<{
  /** 来自 Lanius API 的帮助 DTO（通常为单模块详解）。 */
  help: HelpDto;
  /** 当前 UI locale。 */
  locale: Locale;
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
</script>

<template>
  <section class="lanius-hb">
    <header class="lanius-hb__header">
      <div>
        <p class="lanius-hb__eyebrow">{{ t('帮助', 'Help') }}</p>
        <h2 class="lanius-hb__title">{{ pickLocalized(help.title, locale) }}</h2>
      </div>
    </header>

    <p class="lanius-hb__intro">{{ pickLocalized(help.intro, locale) }}</p>

    <ul class="lanius-hb__list">
      <li v-for="line in help.lines" :key="line.id" class="lanius-hb__item">
        <div class="lanius-hb__cmd">{{ line.command }}</div>
        <div class="lanius-hb__sum">{{ pickLocalized(line.summary, locale) }}</div>
        <div class="lanius-hb__usage">{{ pickLocalized(line.usage, locale) }}</div>
        <div v-if="line.examples.length" class="lanius-hb__ex">
          {{ line.examples.slice(0, 6).join(' · ') }}
        </div>
        <div v-if="line.params.length" class="lanius-hb__params">
          <p class="lanius-hb__params-title">{{ t('参数', 'Params') }}</p>
          <ul>
            <li v-for="param in line.params" :key="param.name">
              <strong>{{ param.name }}</strong>
              <span class="lanius-hb__badge">
                {{ param.required ? t('必填', 'required') : t('可选', 'optional') }}
              </span>
              <span v-if="param.choices?.length" class="lanius-hb__choices">
                {{ param.choices.join(' | ') }}
              </span>
              <p>{{ pickLocalized(param.description, locale) }}</p>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lanius-hb {
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  max-width: 100%;
  min-width: 0;
}

.lanius-hb__header {
  margin-bottom: 0.85rem;
}

.lanius-hb__eyebrow {
  margin: 0;
  color: var(--lanius-accent);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lanius-hb__title {
  margin: 0.25rem 0 0;
  font-family: var(--lanius-font-display);
  font-size: clamp(1.25rem, 2vw, 1.6rem);
}

.lanius-hb__intro {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: var(--lanius-text-muted);
  line-height: 1.5;
}

.lanius-hb__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.lanius-hb__item {
  border: 1px solid var(--lanius-border);
  border-radius: 0.85rem;
  padding: 0.85rem 1rem;
  background: var(--lanius-panel);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease,
    background 0.18s ease;
}

@media (hover: hover) {
  .lanius-hb__item:hover {
    border-color: rgba(78, 183, 232, 0.45);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}

.lanius-hb__cmd {
  font-weight: 700;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: 1.05rem;
}

.lanius-hb__sum,
.lanius-hb__usage,
.lanius-hb__ex {
  font-size: 0.9rem;
  margin-top: 0.3rem;
  color: var(--lanius-text);
  line-height: 1.45;
}

.lanius-hb__usage,
.lanius-hb__ex {
  color: var(--lanius-text-muted);
  font-family: var(--lanius-font-mono);
  font-size: 0.85rem;
}

.lanius-hb__params {
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px dashed var(--lanius-border);
}

.lanius-hb__params-title {
  margin: 0 0 0.4rem;
  font-weight: 600;
  color: var(--lanius-brand);
  font-size: 0.85rem;
}

.lanius-hb__params ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.lanius-hb__params li p {
  margin: 0.2rem 0 0;
  color: var(--lanius-text-muted);
  font-size: 0.85rem;
}

.lanius-hb__badge {
  display: inline-block;
  margin-left: 0.35rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--lanius-highlight);
  background: rgba(255, 122, 89, 0.12);
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
}

.lanius-hb__choices {
  margin-left: 0.45rem;
  font-family: var(--lanius-font-mono);
  font-size: 0.8rem;
  color: var(--lanius-text-muted);
}
</style>
