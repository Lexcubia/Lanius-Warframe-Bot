<script setup lang="ts">
import { pickLocalized, type VarziaDto, type VoidTraderDto } from '@lanius/core';
import { formatRemain, OfficialItemIcon } from '@lanius/ui';

const { t, locale } = useI18n();
const api = useLaniusApi();

const tab = ref<'voidTrader' | 'varzia'>('voidTrader');

/**
 * 按当前 locale 取双语字段。
 *
 * @param name - LocalizedName
 * @returns 展示字符串
 */
function label(name: { zh: string; en: string }): string {
  return pickLocalized(name, locale.value === 'en' ? 'en' : 'zh');
}

/**
 * 主语言译名 + 另一语言副名。
 *
 * @param name - LocalizedName
 * @returns 主名与可选副名
 */
function itemNames(name: { zh: string; en: string }): {
  primary: string;
  secondary: string | null;
} {
  const loc = locale.value === 'en' ? 'en' : 'zh';
  const primary = pickLocalized(name, loc);
  const secondary = loc === 'zh' ? name.en : name.zh;
  if (!secondary || secondary === primary) {
    return { primary, secondary: null };
  }
  return { primary, secondary };
}

const { data, error, pending, refresh } = await useAsyncData(
  'traders',
  async () => {
    const query = {
      realm: 'international' as const,
      locale: (locale.value === 'en' ? 'en' : 'zh') as 'zh' | 'en',
    };
    const [baro, varzia] = await Promise.all([
      api.getVoidTrader(query),
      api.getVarzia(query),
    ]);
    if (!baro.ok) throw new Error(baro.error.message);
    if (!varzia.ok) throw new Error(varzia.error.message);
    return {
      voidTrader: baro.data as VoidTraderDto,
      varzia: varzia.data as VarziaDto,
      stale: Boolean(baro.meta.stale || varzia.meta.stale),
    };
  },
  { watch: [locale] },
);
</script>

<template>
  <section class="page">
    <header class="page__header">
      <p class="eyebrow">{{ t('traders.eyebrow') }}</p>
      <h1>{{ t('traders.title') }}</h1>
      <p class="muted">{{ t('traders.intro') }}</p>
    </header>

    <div class="tabs">
      <button
        type="button"
        :class="{ active: tab === 'voidTrader' }"
        @click="tab = 'voidTrader'"
      >
        {{ t('traders.voidTrader') }}
      </button>
      <button
        type="button"
        :class="{ active: tab === 'varzia' }"
        @click="tab = 'varzia'"
      >
        {{ t('traders.varzia') }}
      </button>
    </div>

    <p v-if="pending" class="state">{{ t('traders.loading') }}</p>
    <div v-else-if="error" class="state state--error">
      <p>{{ t('traders.error') }}</p>
      <button type="button" class="retry" @click="() => refresh()">
        {{ t('common.retry') }}
      </button>
    </div>

    <template v-else-if="data">
      <p v-if="data.stale" class="stale">{{ t('common.stale') }}</p>

      <article v-if="tab === 'voidTrader'" class="panel">
        <h2>{{ label(data.voidTrader.character) }}</h2>
        <p class="meta">
          {{ label(data.voidTrader.node) }} ·
          {{
            data.voidTrader.active
              ? t('traders.activeUntil', {
                  remain: formatRemain(data.voidTrader.remainingMs, locale === 'en' ? 'en' : 'zh'),
                })
              : t('traders.arrivesIn', {
                  remain: formatRemain(data.voidTrader.remainingMs, locale === 'en' ? 'en' : 'zh'),
                })
          }}
        </p>
        <ul v-if="data.voidTrader.inventory.length" class="items">
          <li v-for="(item, idx) in data.voidTrader.inventory" :key="idx">
            <OfficialItemIcon
              :icon-url="item.iconUrl"
              :alt="itemNames(item.name).primary"
              :size="36"
            />
            <span class="item-name">
              <strong>{{ itemNames(item.name).primary }}</strong>
              <span
                v-if="itemNames(item.name).secondary"
                class="item-name__en"
              >
                {{ itemNames(item.name).secondary }}
              </span>
            </span>
            <span v-if="item.ducats != null">{{ item.ducats }} ducats</span>
            <span v-if="item.credits != null">{{ item.credits }} cr</span>
          </li>
        </ul>
        <p v-else class="muted">{{ t('traders.noInventory') }}</p>
      </article>

      <article v-else class="panel">
        <h2>{{ label(data.varzia.character) }}</h2>
        <p class="meta">
          {{
            data.varzia.active
              ? t('traders.active')
              : t('traders.inactive')
          }}
          <template v-if="data.varzia.remainingMs != null">
            ·
            {{
              formatRemain(
                data.varzia.remainingMs,
                locale === 'en' ? 'en' : 'zh',
              )
            }}
          </template>
        </p>
        <ul v-if="data.varzia.inventory.length" class="items">
          <li v-for="(item, idx) in data.varzia.inventory" :key="idx">
            <OfficialItemIcon
              :icon-url="item.iconUrl"
              :alt="itemNames(item.name).primary"
              :size="36"
            />
            <span class="item-name">
              <strong>{{ itemNames(item.name).primary }}</strong>
              <span
                v-if="itemNames(item.name).secondary"
                class="item-name__en"
              >
                {{ itemNames(item.name).secondary }}
              </span>
            </span>
          </li>
        </ul>
        <p v-else class="muted">{{ t('traders.noInventory') }}</p>
      </article>
    </template>
  </section>
</template>

<style scoped>
.page__header {
  margin-bottom: 1rem;
}
.eyebrow {
  margin: 0 0 0.35rem;
  color: var(--lanius-accent-dim);
  font-family: var(--lanius-font-display);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 600;
}
h1 {
  margin: 0 0 0.5rem;
  font-family: var(--lanius-font-display);
  color: var(--lanius-brand);
  font-size: clamp(1.8rem, 4vw, 2.4rem);
}
.muted {
  color: var(--lanius-text-muted);
  margin: 0;
}
.tabs {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}
.tabs button {
  border: 1px solid var(--lanius-border);
  background: var(--lanius-panel);
  color: var(--lanius-text-muted);
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}
.tabs button.active {
  color: var(--lanius-text);
  border-color: var(--lanius-accent);
}
.panel {
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--lanius-border);
  border-radius: 14px;
  background: linear-gradient(165deg, var(--lanius-panel), var(--lanius-panel-raised));
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.panel h2 {
  margin: 0 0 0.4rem;
  font-size: 1.2rem;
}
.meta {
  margin: 0 0 0.85rem;
  color: var(--lanius-text-muted);
  font-size: 0.92rem;
}
.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}
.items li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--lanius-border);
  border-radius: 8px;
  font-size: 0.92rem;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}
.item-name {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.5rem;
  flex: 1;
  min-width: 0;
}
.item-name__en {
  font-size: 0.85em;
  font-weight: 500;
  color: var(--lanius-text-muted);
}
.state {
  color: var(--lanius-text-muted);
}
.state--error {
  color: var(--lanius-danger);
  display: grid;
  gap: 0.75rem;
}
.stale {
  color: var(--lanius-highlight);
  font-size: 0.85rem;
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
    box-shadow 0.18s ease;
}

@media (hover: hover) {
  .tabs button:hover:not(.active) {
    border-color: rgba(78, 183, 232, 0.45);
    background: rgba(78, 183, 232, 0.1);
    color: var(--lanius-accent-dim);
  }

  .items li:hover {
    border-color: rgba(78, 183, 232, 0.4);
    background: #fff;
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }

  .panel:hover {
    border-color: rgba(78, 183, 232, 0.35);
    box-shadow: 0 10px 24px rgba(62, 78, 110, 0.1);
  }

  .retry:hover {
    border-color: rgba(78, 183, 232, 0.5);
    color: var(--lanius-accent-dim);
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
  }
}
</style>
