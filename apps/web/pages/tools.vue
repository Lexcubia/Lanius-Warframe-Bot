<script setup lang="ts">
import {
  pickLocalized,
  type TranslateDto,
  type ValenceFusionDto,
  type WikiDto,
} from '@lanius/core';

const { t, locale } = useI18n();
const localePath = useLocalePath();
const api = useLaniusApi();

const loc = computed(() => (locale.value === 'en' ? 'en' : 'zh') as 'zh' | 'en');

const wikiQ = ref('');
const translateQ = ref('');
const valenceQ = ref('');

const wikiPending = ref(false);
const translatePending = ref(false);
const valencePending = ref(false);

const wikiError = ref<string | null>(null);
const translateError = ref<string | null>(null);
const valenceError = ref<string | null>(null);

const wikiResult = ref<WikiDto | null>(null);
const translateResult = ref<TranslateDto | null>(null);
const valenceResult = ref<ValenceFusionDto | null>(null);

/**
 * 按 locale 取双语字段。
 *
 * @param name - LocalizedName
 * @returns 展示字符串
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, loc.value);
}

/**
 * 查询 wiki 深链。
 *
 * @returns 无返回值
 */
async function runWiki(): Promise<void> {
  const q = wikiQ.value.trim();
  if (!q) {
    return;
  }
  wikiPending.value = true;
  wikiError.value = null;
  try {
    const envelope = await api.getWiki(q, { realm: 'international', locale: loc.value });
    if (!envelope.ok) {
      throw new Error(envelope.error.message);
    }
    wikiResult.value = envelope.data;
  } catch (err) {
    wikiResult.value = null;
    wikiError.value = err instanceof Error ? err.message : t('tools.error');
  } finally {
    wikiPending.value = false;
  }
}

/**
 * 查询中英对照。
 *
 * @returns 无返回值
 */
async function runTranslate(): Promise<void> {
  const q = translateQ.value.trim();
  if (!q) {
    return;
  }
  translatePending.value = true;
  translateError.value = null;
  try {
    const envelope = await api.getTranslate(q, { realm: 'international', locale: loc.value });
    if (!envelope.ok) {
      throw new Error(envelope.error.message);
    }
    translateResult.value = envelope.data;
  } catch (err) {
    translateResult.value = null;
    translateError.value = err instanceof Error ? err.message : t('tools.error');
  } finally {
    translatePending.value = false;
  }
}

/**
 * 查询效价融合。
 *
 * @returns 无返回值
 */
async function runValence(): Promise<void> {
  const tokens = valenceQ.value.trim().split(/\s+/).filter(Boolean);
  valencePending.value = true;
  valenceError.value = null;
  try {
    const envelope = await api.getValence(tokens, { realm: 'international', locale: loc.value });
    if (!envelope.ok) {
      throw new Error(envelope.error.message);
    }
    valenceResult.value = envelope.data;
  } catch (err) {
    valenceResult.value = null;
    valenceError.value = err instanceof Error ? err.message : t('tools.error');
  } finally {
    valencePending.value = false;
  }
}
</script>

<template>
  <section class="tools">
    <p class="eyebrow">{{ t('tools.eyebrow') }}</p>
    <h1>{{ t('tools.title') }}</h1>
    <p class="lead">{{ t('tools.lead') }}</p>
    <p class="body">{{ t('tools.body') }}</p>

    <div class="stack">
      <article class="panel">
        <h2>{{ t('tools.wikiTitle') }}</h2>
        <form class="row" @submit.prevent="runWiki">
          <input v-model="wikiQ" type="search" :placeholder="t('tools.wikiPlaceholder')" />
          <button type="submit">{{ t('tools.query') }}</button>
        </form>
        <p v-if="wikiPending" class="muted">{{ t('tools.loading') }}</p>
        <p v-else-if="wikiError" class="err">{{ wikiError }}</p>
        <div v-else-if="wikiResult" class="result">
          <p>
            <strong>{{ wikiResult.pageName }}</strong>
            <span class="sep">·</span>
            <span class="muted">{{ wikiResult.mode }}</span>
          </p>
          <a :href="wikiResult.pageUrl" target="_blank" rel="noopener noreferrer">
            {{ wikiResult.pageUrl }}
          </a>
          <ul v-if="wikiResult.lines.length">
            <li v-for="(line, idx) in wikiResult.lines" :key="idx">{{ line }}</li>
          </ul>
          <p v-if="wikiResult.note" class="muted">{{ wikiResult.note }}</p>
        </div>
        <p v-else class="muted">{{ t('tools.empty') }}</p>
      </article>

      <article class="panel">
        <h2>{{ t('tools.translateTitle') }}</h2>
        <form class="row" @submit.prevent="runTranslate">
          <input
            v-model="translateQ"
            type="search"
            :placeholder="t('tools.translatePlaceholder')"
          />
          <button type="submit">{{ t('tools.query') }}</button>
        </form>
        <p v-if="translatePending" class="muted">{{ t('tools.loading') }}</p>
        <p v-else-if="translateError" class="err">{{ translateError }}</p>
        <div v-else-if="translateResult" class="result">
          <ul v-if="translateResult.hits.length">
            <li v-for="(hit, idx) in translateResult.hits" :key="`h-${idx}`">
              <strong>{{ hit.zh }}</strong>
              <span class="sep">·</span>
              <span>{{ hit.en }}</span>
            </li>
          </ul>
          <ul v-else-if="translateResult.candidates.length">
            <li v-for="(hit, idx) in translateResult.candidates" :key="`c-${idx}`">
              <strong>{{ hit.zh }}</strong>
              <span class="sep">·</span>
              <span>{{ hit.en }}</span>
            </li>
          </ul>
          <p v-else class="muted">{{ t('tools.empty') }}</p>
        </div>
        <p v-else class="muted">{{ t('tools.empty') }}</p>
      </article>

      <article class="panel">
        <h2>{{ t('tools.valenceTitle') }}</h2>
        <form class="row" @submit.prevent="runValence">
          <input v-model="valenceQ" type="search" :placeholder="t('tools.valencePlaceholder')" />
          <button type="submit">{{ t('tools.query') }}</button>
        </form>
        <p v-if="valencePending" class="muted">{{ t('tools.loading') }}</p>
        <p v-else-if="valenceError" class="err">{{ valenceError }}</p>
        <div v-else-if="valenceResult" class="result">
          <p class="muted">{{ valenceResult.mode }}</p>
          <ul v-if="valenceResult.lines.length">
            <li v-for="(line, idx) in valenceResult.lines" :key="idx">{{ line }}</li>
          </ul>
          <p v-if="valenceResult.note" class="muted">{{ valenceResult.note }}</p>
          <p v-if="valenceResult.formula" class="muted">{{ valenceResult.formula }}</p>
          <ul v-if="valenceResult.options.length">
            <li v-for="opt in valenceResult.options" :key="opt.element">
              {{ label(opt.label) }}
            </li>
          </ul>
        </div>
        <p v-else class="muted">{{ t('tools.empty') }}</p>
      </article>
    </div>

    <NuxtLink class="back" :to="localePath('/')">{{ t('tools.backHome') }}</NuxtLink>
  </section>
</template>

<style scoped>
.tools {
  max-width: 44rem;
  padding-top: 1rem;
  display: grid;
  gap: 0.85rem;
}

.eyebrow {
  margin: 0;
  color: var(--anime-gold, #d4b06a);
  font-family: var(--anime-font-display, inherit);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 700;
}

h1 {
  margin: 0;
  font-family: var(--anime-font-display, inherit);
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  color: var(--anime-peach, #f0d79a);
}

.lead,
.body,
.muted {
  margin: 0;
  color: var(--anime-muted, #a8b0be);
  line-height: 1.55;
}

.stack {
  display: grid;
  gap: 0.75rem;
}

.panel {
  padding: 1rem 1.1rem;
  border-radius: 0.35rem;
  border: 1px solid var(--anime-line, rgba(122, 100, 62, 0.55));
  background: var(--anime-panel, rgba(19, 24, 35, 0.94));
  box-shadow: var(--anime-shadow);
}

.panel h2 {
  margin: 0 0 0.65rem;
  font-size: 1rem;
  color: var(--anime-gold, #d4b06a);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.65rem;
}

.row input {
  flex: 1 1 12rem;
  min-height: 2.4rem;
  border: 1px solid var(--anime-line, rgba(122, 100, 62, 0.55));
  border-radius: 0.35rem;
  padding: 0.45rem 0.7rem;
  background: #0c0f16;
  color: var(--anime-ink, #ece8de);
}

.row button {
  min-height: 2.4rem;
  border: 0;
  border-radius: 0.35rem;
  padding: 0 0.95rem;
  background: linear-gradient(135deg, var(--anime-gold, #d4b06a), var(--anime-peach, #f0d79a));
  color: #0c0f16;
  font-weight: 700;
  cursor: pointer;
}

.result {
  display: grid;
  gap: 0.35rem;
  font-size: 0.92rem;
}

.result a {
  color: var(--anime-sky, #6fd3e8);
  word-break: break-all;
}

.result ul {
  margin: 0.25rem 0 0;
  padding-left: 1.1rem;
  color: var(--anime-ink, #ece8de);
}

.err {
  color: var(--anime-coral, #d86458);
  margin: 0;
}

.sep {
  margin: 0 0.35rem;
  color: var(--anime-muted, #a8b0be);
}

.back {
  display: inline-flex;
  font-weight: 700;
  color: var(--anime-gold, #d4b06a);
  text-decoration: none;
}

.back:hover {
  text-decoration: underline;
}
</style>
