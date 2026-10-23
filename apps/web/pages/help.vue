<script setup lang="ts">
import { HelpBoard } from '@lanius/ui';
import { pickLocalized } from '@lanius/core';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();
const api = useLaniusApi();

const moduleToken = computed(() => {
  const raw = route.query.module;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
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

/**
 * 打开某条指令的模块详解。
 *
 * @param id - 帮助行 / 模块 id
 * @returns 无返回值
 */
function openModule(id: string): void {
  void router.push({
    path: localePath('/help'),
    query: { module: id },
  });
}

/**
 * 返回完整帮助列表。
 *
 * @returns 无返回值
 */
function clearModule(): void {
  void router.push({ path: localePath('/help') });
}

const { data, pending, error, refresh } = await useAsyncData(
  () => `help-${moduleToken.value ?? 'all'}`,
  async () => {
    const envelope = await api.getHelp(moduleToken.value);
    if (!envelope.ok) {
      throw new Error(envelope.error.message);
    }
    return envelope.data;
  },
  { watch: [moduleToken, locale] },
);
</script>

<template>
  <section class="help">
    <header class="help__header">
      <p class="help__eyebrow">{{ t('help.eyebrow') }}</p>
      <h1>{{ data ? label(data.title) : t('help.title') }}</h1>
      <p class="help__intro">
        {{ data ? label(data.intro) : t('help.qqHint') }}
      </p>
      <p v-if="moduleToken" class="help__detail-bar">
        <button type="button" class="linkish" @click="clearModule">
          {{ t('help.backToList') }}
        </button>
        <span>{{ t('help.moduleDetail', { module: moduleToken }) }}</span>
      </p>
    </header>

    <p v-if="pending" class="help__muted">{{ t('help.loading') }}</p>
    <div v-else-if="error" class="help__error">
      <p>{{ t('help.error') }}</p>
      <button type="button" class="retry" @click="() => refresh()">
        {{ t('common.retry') }}
      </button>
    </div>

    <template v-else-if="data">
      <HelpBoard
        v-if="moduleToken"
        class="help__card-view"
        :help="data"
        :locale="locale === 'en' ? 'en' : 'zh'"
      />

      <ul v-else class="help__list">
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
            <code v-for="example in line.examples" :key="example">{{
              example
            }}</code>
          </p>

          <button type="button" class="detail" @click="openModule(line.id)">
            {{ t('help.viewDetail') }}
          </button>
        </li>
      </ul>
    </template>
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

.help__detail-bar {
  margin: 0.85rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  color: var(--lanius-text-muted);
  font-size: 0.9rem;
}

.linkish {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--lanius-accent);
  cursor: pointer;
  font: inherit;
  transition: color 0.18s ease;
}

.help__error {
  color: var(--lanius-danger);
  display: grid;
  gap: 0.75rem;
}

.retry {
  width: fit-content;
  border: 1px solid var(--lanius-border-bright);
  background: var(--lanius-panel);
  color: var(--lanius-text);
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.help__card-view {
  max-width: 480px;
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
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
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
  background: rgba(78, 183, 232, 0.12);
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

.detail {
  margin-top: 0.85rem;
  border: 1px solid var(--lanius-border-bright);
  background: #fff;
  color: var(--lanius-brand);
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  font-weight: 600;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

@media (hover: hover) {
  .linkish:hover {
    color: var(--lanius-highlight);
  }

  .retry:hover,
  .detail:hover {
    border-color: rgba(78, 183, 232, 0.5);
    color: var(--lanius-accent-dim);
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }

  .help__card:hover {
    border-color: rgba(78, 183, 232, 0.4);
    box-shadow: 0 14px 32px rgba(62, 78, 110, 0.12);
    transform: translateY(-2px);
  }
}
</style>
