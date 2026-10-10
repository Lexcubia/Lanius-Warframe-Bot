<script setup lang="ts">
import { pickLocalized } from '@lanius/core';

const { t, locale } = useI18n();
const api = useLaniusApi();

const { data, pending, error } = await useAsyncData('help', async () => {
  const envelope = await api.getHelp();
  if (!envelope.ok) {
    throw new Error(envelope.error.message);
  }
  return envelope.data;
});

/**
 * 按当前页面 locale 选取双语文案。
 *
 * @param name - LocalizedName
 * @returns 展示字符串
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, locale.value === 'en' ? 'en' : 'zh');
}
</script>

<template>
  <section class="help">
    <header class="help__header">
      <p class="help__eyebrow">{{ t('help.eyebrow') }}</p>
      <h1>{{ data ? label(data.title) : t('help.title') }}</h1>
      <p class="help__intro">
        {{ data ? label(data.intro) : t('help.qqHint') }}
      </p>
    </header>

    <p v-if="pending" class="help__muted">{{ t('help.loading') }}</p>
    <p v-else-if="error" class="help__error">{{ t('help.error') }}</p>

    <ul v-else-if="data" class="help__list">
      <li v-for="line in data.lines" :key="line.id" class="help__card">
        <div class="help__card-top">
          <code>{{ line.command }}</code>
          <span class="help__usage">{{ label(line.usage) }}</span>
        </div>
        <p class="help__summary">{{ label(line.summary) }}</p>
        <p v-if="line.aliases.length" class="help__meta">
          {{ t('help.aliases') }}：{{ line.aliases.join(' · ') }}
        </p>

        <div v-if="line.params.length" class="help__params">
          <p class="help__params-title">{{ t('help.params') }}</p>
          <ul>
            <li v-for="param in line.params" :key="param.name">
              <strong>{{ param.name }}</strong>
              <span class="help__badge">
                {{ param.required ? t('help.required') : t('help.optional') }}
              </span>
              <span v-if="param.choices?.length" class="help__choices">
                {{ param.choices.join(' | ') }}
              </span>
              <p>{{ label(param.description) }}</p>
            </li>
          </ul>
        </div>

        <p v-if="line.examples.length" class="help__examples">
          {{ t('help.examples') }}：
          <code v-for="example in line.examples" :key="example">{{ example }}</code>
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.help__header {
  margin-bottom: 1.5rem;
}

.help__eyebrow {
  margin: 0 0 0.35rem;
  color: var(--lanius-accent-dim);
  font-family: var(--lanius-font-display);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
}

.help h1 {
  margin: 0 0 0.5rem;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: clamp(1.8rem, 4vw, 2.4rem);
}

.help__intro,
.help__muted,
.help__meta,
.help__summary {
  color: var(--lanius-text-muted);
  margin: 0;
  line-height: 1.55;
}

.help__error {
  color: var(--lanius-danger);
}

.help__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.help__card {
  padding: 1.1rem 1.2rem 1.2rem;
  border: 1px solid var(--lanius-border);
  border-radius: 14px;
  background: linear-gradient(165deg, var(--lanius-panel), var(--lanius-panel-raised));
  box-shadow: 0 10px 28px rgba(28, 47, 66, 0.06);
}

.help__card-top {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1rem;
  align-items: baseline;
  margin-bottom: 0.45rem;
}

.help__card code,
.help__examples code {
  font-family: var(--lanius-font-mono);
  color: var(--lanius-accent-dim);
  background: rgba(20, 184, 166, 0.1);
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  font-size: 0.92rem;
}

.help__usage {
  font-family: var(--lanius-font-mono);
  font-size: 0.85rem;
  color: var(--lanius-text);
}

.help__params {
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--lanius-border);
}

.help__params-title {
  margin: 0 0 0.45rem;
  font-weight: 600;
  color: var(--lanius-brand);
  font-size: 0.9rem;
}

.help__params ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.help__params li p {
  margin: 0.25rem 0 0;
  color: var(--lanius-text-muted);
  font-size: 0.92rem;
}

.help__badge {
  display: inline-block;
  margin-left: 0.35rem;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--lanius-highlight);
  background: rgba(255, 122, 89, 0.12);
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
}

.help__choices {
  margin-left: 0.45rem;
  font-family: var(--lanius-font-mono);
  font-size: 0.8rem;
  color: var(--lanius-text-muted);
}

.help__examples {
  margin: 0.85rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
  color: var(--lanius-text-muted);
  font-size: 0.9rem;
}
</style>
