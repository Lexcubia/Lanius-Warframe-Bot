<script setup lang="ts">
import {
  pickLocalized,
  type RotationWeaponDto,
  type WeaponRotationDto,
} from '@lanius/core';
import {
  DamageTypeIcon,
  OfficialItemIcon,
  ValenceBonusBar,
  formatRemain,
} from '@lanius/ui';

const { t, locale } = useI18n();
const api = useLaniusApi();

/**
 * 武器译名：主语言 + 另一语言副名。
 *
 * @param name - 双语武器名
 * @returns 主名与可选副名
 */
function weaponNames(name: { zh: string; en: string }): {
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

/**
 * 元素名（不含百分比；百分比由进度条展示）。
 *
 * @param weapon - 轮换武器
 * @returns 元素译名或 null
 */
function elementName(weapon: RotationWeaponDto): string | null {
  if (!weapon.elementLabel) {
    return null;
  }
  return pickLocalized(
    weapon.elementLabel,
    locale.value === 'en' ? 'en' : 'zh',
  );
}

const { data, error, pending, refresh } = await useAsyncData(
  'rotations',
  async () => {
    const query = {
      realm: 'international' as const,
      locale: (locale.value === 'en' ? 'en' : 'zh') as 'zh' | 'en',
    };
    const [tenet, coda] = await Promise.all([
      api.getWeaponRotation('tenet', query),
      api.getWeaponRotation('coda', query),
    ]);
    if (!tenet.ok) throw new Error(tenet.error.message);
    if (!coda.ok) throw new Error(coda.error.message);
    return {
      tenet: tenet.data as WeaponRotationDto,
      coda: coda.data as WeaponRotationDto,
    };
  },
  { watch: [locale] },
);
</script>

<template>
  <section class="page">
    <header class="page__header">
      <p class="eyebrow">{{ t('rotations.eyebrow') }}</p>
      <h1>{{ t('rotations.title') }}</h1>
      <p class="muted">{{ t('rotations.intro') }}</p>
    </header>

    <p v-if="pending" class="state">{{ t('rotations.loading') }}</p>
    <div v-else-if="error" class="state state--error">
      <p>{{ t('rotations.error') }}</p>
      <button type="button" class="retry" @click="() => refresh()">
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-else-if="data" class="stack">
      <article class="panel">
        <header class="panel__head">
          <h2>{{ t('rotations.tenet') }}</h2>
          <p class="meta">
            {{
              t('rotations.remain', {
                remain: formatRemain(
                  data.tenet.remainingMs,
                  locale === 'en' ? 'en' : 'zh',
                ),
              })
            }}
          </p>
        </header>
        <ul class="offerings">
          <li
            v-for="(item, idx) in data.tenet.offerings"
            :key="`t-${idx}-${item.name.en}`"
            class="offer"
          >
            <OfficialItemIcon
              :icon-url="item.iconUrl"
              :alt="weaponNames(item.name).primary"
              :size="40"
            />
            <div class="offer__body">
              <p class="offer__title">
                <strong>{{ weaponNames(item.name).primary }}</strong>
                <span
                  v-if="weaponNames(item.name).secondary"
                  class="weapon-en"
                >
                  {{ weaponNames(item.name).secondary }}
                </span>
              </p>
              <div class="offer__valence">
                <DamageTypeIcon
                  :element="item.element"
                  :alt="elementName(item) ?? ''"
                  :size="16"
                />
                <span class="offer__el">{{ elementName(item) || '—' }}</span>
                <ValenceBonusBar
                  v-if="item.bonusPct != null"
                  :bonus-pct="item.bonusPct"
                />
                <span v-else class="offer__pct-slot">—</span>
              </div>
            </div>
          </li>
        </ul>
      </article>

      <article class="panel">
        <header class="panel__head">
          <h2>{{ t('rotations.coda') }}</h2>
          <p class="meta">
            {{
              t('rotations.remain', {
                remain: formatRemain(
                  data.coda.remainingMs,
                  locale === 'en' ? 'en' : 'zh',
                ),
              })
            }}
          </p>
        </header>
        <ul class="offerings">
          <li
            v-for="(item, idx) in data.coda.offerings"
            :key="`c-${idx}-${item.name.en}`"
            class="offer"
          >
            <OfficialItemIcon
              :icon-url="item.iconUrl"
              :alt="weaponNames(item.name).primary"
              :size="40"
            />
            <div class="offer__body">
              <p class="offer__title">
                <strong>{{ weaponNames(item.name).primary }}</strong>
                <span
                  v-if="weaponNames(item.name).secondary"
                  class="weapon-en"
                >
                  {{ weaponNames(item.name).secondary }}
                </span>
              </p>
              <div class="offer__valence">
                <DamageTypeIcon
                  :element="item.element"
                  :alt="elementName(item) ?? ''"
                  :size="16"
                />
                <span class="offer__el">{{ elementName(item) || '—' }}</span>
                <ValenceBonusBar
                  v-if="item.bonusPct != null"
                  :bonus-pct="item.bonusPct"
                />
                <span v-else class="offer__pct-slot">—</span>
              </div>
            </div>
          </li>
        </ul>
      </article>
    </div>
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
.stack {
  display: grid;
  gap: 1rem;
}
.panel {
  padding: 1.1rem 1.2rem;
  border: 1px solid var(--lanius-border);
  border-radius: 14px;
  background: linear-gradient(165deg, var(--lanius-panel), var(--lanius-panel-raised));
}
.panel__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.35rem 1rem;
  margin-bottom: 0.75rem;
}
.panel h2 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--lanius-brand);
}
.meta {
  margin: 0;
  color: var(--lanius-text-muted);
  font-size: 0.88rem;
}
.offerings {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}
.offer {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.55);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}
.offer__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.35rem;
}
.offer__title {
  margin: 0;
  font-size: 1rem;
}
.weapon-en {
  margin-left: 0.4rem;
  font-size: 0.85em;
  font-weight: 500;
  color: var(--lanius-text-muted);
}
.offer__valence {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
}
.offer__el {
  font-size: 0.85rem;
  color: var(--lanius-text-muted);
  flex-shrink: 0;
  min-width: 2.5em;
}
.offer__pct-slot {
  flex: 1;
  min-width: 3.5rem;
  max-width: 9rem;
  font-size: 0.8rem;
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
.retry {
  width: fit-content;
  border: 1px solid var(--lanius-border-bright);
  background: var(--lanius-panel);
  color: var(--lanius-text);
  padding: 0.5rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
}

@media (hover: hover) {
  .offer:hover {
    border-color: rgba(78, 183, 232, 0.4);
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }
}
</style>
