<script setup lang="ts">
import {
  DamageTypeIcon,
  FissuresPanel,
  InvasionsModuleCard,
  NightwaveModuleCard,
  OfficialItemIcon,
  ValenceBonusBar,
  WorldstateBoard,
  formatRemain,
} from '@lanius/ui';
import {
  pickLocalized,
  type RotationWeaponDto,
  type VarziaDto,
  type VoidTraderDto,
  type WeaponRotationDto,
  type WorldstateDto,
} from '@lanius/core';

const { t, locale } = useI18n();
const route = useRoute();
const localePath = useLocalePath();
const api = useLaniusApi();

type ModuleKey =
  | 'worldstate'
  | 'fissures'
  | 'invasions'
  | 'nightwave'
  | 'traders'
  | 'tenet'
  | 'coda';

/**
 * 首页模块目录（速跳 + 折叠面板；不含市场/紫卡/帮助/订阅）。
 */
const catalog = computed(() => [
  { id: 'mod-worldstate' as const, key: 'worldstate' as ModuleKey, title: t('nav.worldstate'), sub: 'World State' },
  { id: 'mod-fissures' as const, key: 'fissures' as ModuleKey, title: t('nav.fissures'), sub: 'Fissures' },
  { id: 'mod-invasions' as const, key: 'invasions' as ModuleKey, title: t('home.mod.invasions'), sub: 'Invasions' },
  { id: 'mod-nightwave' as const, key: 'nightwave' as ModuleKey, title: t('home.mod.nightwave'), sub: 'Nightwave' },
  { id: 'mod-traders' as const, key: 'traders' as ModuleKey, title: t('nav.traders'), sub: 'Traders' },
  { id: 'mod-tenet' as const, key: 'tenet' as ModuleKey, title: t('rotations.tenet'), sub: 'Tenet' },
  { id: 'mod-coda' as const, key: 'coda' as ModuleKey, title: t('rotations.coda'), sub: 'Coda' },
]);

const openMap = reactive<Record<ModuleKey, boolean>>({
  worldstate: true,
  fissures: true,
  invasions: false,
  nightwave: false,
  traders: true,
  tenet: true,
  coda: true,
});

const traderTab = ref<'voidTrader' | 'varzia'>('voidTrader');

const loc = computed(() => (locale.value === 'en' ? 'en' : 'zh') as 'zh' | 'en');

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
 * 物品/武器译名行：主语言名 + 另一语言副名（便于对照）。
 *
 * @param name - 双语名
 * @returns 主名与可选副名
 */
function itemNames(name: { zh: string; en: string }): {
  primary: string;
  secondary: string | null;
} {
  const primary = label(name);
  const secondary = loc.value === 'zh' ? name.en : name.zh;
  if (!secondary || secondary === primary) {
    return { primary, secondary: null };
  }
  return { primary, secondary };
}

/**
 * Valence 元素名（百分比由进度条展示）。
 *
 * @param weapon - 轮换武器
 * @returns 元素译名或 null
 */
function elementName(weapon: RotationWeaponDto): string | null {
  return weapon.elementLabel ? label(weapon.elementLabel) : null;
}

const { data, error, pending, refresh } = await useAsyncData(
  'home-dashboard',
  async () => {
    const query = { realm: 'international' as const, locale: loc.value };
    const [ws, baro, varzia, tenet, coda] = await Promise.all([
      api.getWorldstate(query),
      api.getVoidTrader(query),
      api.getVarzia(query),
      api.getWeaponRotation('tenet', query),
      api.getWeaponRotation('coda', query),
    ]);
    if (!ws.ok) throw new Error(ws.error.message);
    if (!baro.ok) throw new Error(baro.error.message);
    if (!varzia.ok) throw new Error(varzia.error.message);
    if (!tenet.ok) throw new Error(tenet.error.message);
    if (!coda.ok) throw new Error(coda.error.message);
    return {
      worldstate: ws.data as WorldstateDto,
      stale: Boolean(ws.meta.stale),
      voidTrader: baro.data as VoidTraderDto,
      varzia: varzia.data as VarziaDto,
      tenet: tenet.data as WeaponRotationDto,
      coda: coda.data as WeaponRotationDto,
    };
  },
  { watch: [locale] },
);

/**
 * 侧栏 / hash 跳转到模块：展开并平滑滚动。
 *
 * @param moduleId - 锚点 id
 * @param key - 折叠状态键
 * @returns 无返回值
 */
function jumpTo(moduleId: string, key: ModuleKey): void {
  openMap[key] = true;
  nextTick(() => {
    document.getElementById(moduleId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  });
}

/**
 * 根据 URL hash 展开并滚到对应模块（侧栏锚点 / 外链共用）。
 *
 * @returns 无返回值
 */
function syncHashModule(): void {
  const hash = route.hash.replace(/^#/, '');
  if (!hash) return;
  const hit = catalog.value.find((item) => item.id === hash);
  if (hit) jumpTo(hit.id, hit.key);
}

onMounted(() => {
  syncHashModule();
});

watch(
  () => route.hash,
  () => {
    syncHashModule();
  },
);
</script>

<template>
  <div class="home">
    <section class="hero">
      <p class="hero__live">
        <span class="dot" />
        {{ t('home.realmNote') }}
      </p>
      <h1 class="hero__brand">{{ t('brand') }}</h1>
      <p class="hero__tag">{{ t('home.tagline') }}</p>
      <p class="hero__hint">
        <NuxtLink :to="localePath('/market')">{{ t('nav.market') }}</NuxtLink>
        ·
        <NuxtLink :to="localePath('/riven')">{{ t('nav.riven') }}</NuxtLink>
        ·
        <NuxtLink :to="localePath('/help')">{{ t('nav.help') }}</NuxtLink>
        ·
        <NuxtLink :to="localePath('/subscribe')">{{ t('nav.subscribe') }}</NuxtLink>
      </p>
    </section>

    <p v-if="pending" class="state">{{ t('home.loading') }}</p>
    <div v-else-if="error" class="state state--error">
      <p>{{ t('home.error') }}</p>
      <button type="button" class="retry" @click="() => refresh()">
        {{ t('common.retry') }}
      </button>
    </div>

    <div v-else-if="data" class="stack">
      <HomeModulePanel
        v-model:open="openMap.worldstate"
        module-id="mod-worldstate"
        :title="t('nav.worldstate')"
        subtitle="World State"
        badge="LIVE"
      >
        <WorldstateBoard
          :worldstate="data.worldstate"
          :locale="loc"
          :stale="data.stale"
        />
      </HomeModulePanel>

      <HomeModulePanel
        v-model:open="openMap.fissures"
        module-id="mod-fissures"
        :title="t('nav.fissures')"
        subtitle="Fissures"
      >
        <FissuresPanel
          :worldstate="data.worldstate"
          :locale="loc"
          :stale="data.stale"
        />
      </HomeModulePanel>

      <HomeModulePanel
        v-model:open="openMap.invasions"
        module-id="mod-invasions"
        :title="t('home.mod.invasions')"
        subtitle="Invasions"
      >
        <InvasionsModuleCard
          v-if="data.worldstate.invasions.length"
          :worldstate="data.worldstate"
          :locale="loc"
          :stale="data.stale"
          :max-items="data.worldstate.invasions.length"
        />
        <p v-else class="empty">{{ t('home.emptyInvasions') }}</p>
      </HomeModulePanel>

      <HomeModulePanel
        v-model:open="openMap.nightwave"
        module-id="mod-nightwave"
        :title="t('home.mod.nightwave')"
        subtitle="Nightwave"
      >
        <NightwaveModuleCard
          v-if="data.worldstate.nightwave"
          :worldstate="data.worldstate"
          :locale="loc"
          :stale="data.stale"
          :max-items="data.worldstate.nightwave.activeChallenges.length"
        />
        <p v-else class="empty">{{ t('home.emptyNightwave') }}</p>
      </HomeModulePanel>

      <HomeModulePanel
        v-model:open="openMap.traders"
        module-id="mod-traders"
        :title="t('nav.traders')"
        subtitle="Traders"
        badge="LIVE"
      >
        <div class="tabs">
          <button
            type="button"
            :class="{ active: traderTab === 'voidTrader' }"
            @click="traderTab = 'voidTrader'"
          >
            {{ t('traders.voidTrader') }}
          </button>
          <button
            type="button"
            :class="{ active: traderTab === 'varzia' }"
            @click="traderTab = 'varzia'"
          >
            {{ t('traders.varzia') }}
          </button>
        </div>

        <article v-if="traderTab === 'voidTrader'" class="panel">
          <h3>{{ label(data.voidTrader.character) }}</h3>
          <p class="meta">
            {{ label(data.voidTrader.node) }} ·
            {{
              data.voidTrader.active
                ? t('traders.activeUntil', {
                    remain: formatRemain(data.voidTrader.remainingMs, loc),
                  })
                : t('traders.arrivesIn', {
                    remain: formatRemain(data.voidTrader.remainingMs, loc),
                  })
            }}
          </p>
          <ul v-if="data.voidTrader.inventory.length" class="items">
            <li v-for="(item, idx) in data.voidTrader.inventory" :key="idx">
              <OfficialItemIcon
                :icon-url="item.iconUrl"
                :alt="itemNames(item.name).primary"
                :size="32"
              />
              <span class="item-name">
                <strong>{{ itemNames(item.name).primary }}</strong>
                <span
                  v-if="itemNames(item.name).secondary"
                  class="weapon-en"
                >
                  {{ itemNames(item.name).secondary }}
                </span>
              </span>
              <span v-if="item.ducats != null">{{ item.ducats }} ducats</span>
            </li>
          </ul>
          <p v-else class="empty">{{ t('traders.noInventory') }}</p>
        </article>

        <article v-else class="panel">
          <h3>{{ label(data.varzia.character) }}</h3>
          <p class="meta">
            {{ data.varzia.active ? t('traders.active') : t('traders.inactive') }}
            <template v-if="data.varzia.remainingMs != null">
              · {{ formatRemain(data.varzia.remainingMs, loc) }}
            </template>
          </p>
          <ul v-if="data.varzia.inventory.length" class="items">
            <li v-for="(item, idx) in data.varzia.inventory" :key="idx">
              <OfficialItemIcon
                :icon-url="item.iconUrl"
                :alt="itemNames(item.name).primary"
                :size="32"
              />
              <span class="item-name">
                <strong>{{ itemNames(item.name).primary }}</strong>
                <span
                  v-if="itemNames(item.name).secondary"
                  class="weapon-en"
                >
                  {{ itemNames(item.name).secondary }}
                </span>
              </span>
            </li>
          </ul>
          <p v-else class="empty">{{ t('traders.noInventory') }}</p>
        </article>
      </HomeModulePanel>

      <HomeModulePanel
        v-model:open="openMap.tenet"
        module-id="mod-tenet"
        :title="t('rotations.tenet')"
        subtitle="Tenet"
      >
        <article class="panel">
          <p class="meta">
            {{
              t('rotations.remain', {
                remain: formatRemain(data.tenet.remainingMs, loc),
              })
            }}
          </p>
          <ul class="offerings">
            <li
              v-for="(item, idx) in data.tenet.offerings"
              :key="`t-${idx}`"
              class="offer"
            >
              <OfficialItemIcon
                :icon-url="item.iconUrl"
                :alt="itemNames(item.name).primary"
                :size="32"
              />
              <div class="offer__body">
                <p class="offer__title">
                  <strong>{{ itemNames(item.name).primary }}</strong>
                  <span
                    v-if="itemNames(item.name).secondary"
                    class="weapon-en"
                  >
                    {{ itemNames(item.name).secondary }}
                  </span>
                </p>
                <div class="offer__valence">
                  <DamageTypeIcon
                    :element="item.element"
                    :alt="elementName(item) ?? ''"
                    :size="14"
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
      </HomeModulePanel>

      <HomeModulePanel
        v-model:open="openMap.coda"
        module-id="mod-coda"
        :title="t('rotations.coda')"
        subtitle="Coda"
      >
        <article class="panel">
          <p class="meta">
            {{
              t('rotations.remain', {
                remain: formatRemain(data.coda.remainingMs, loc),
              })
            }}
          </p>
          <ul class="offerings">
            <li
              v-for="(item, idx) in data.coda.offerings"
              :key="`c-${idx}`"
              class="offer"
            >
              <OfficialItemIcon
                :icon-url="item.iconUrl"
                :alt="itemNames(item.name).primary"
                :size="32"
              />
              <div class="offer__body">
                <p class="offer__title">
                  <strong>{{ itemNames(item.name).primary }}</strong>
                  <span
                    v-if="itemNames(item.name).secondary"
                    class="weapon-en"
                  >
                    {{ itemNames(item.name).secondary }}
                  </span>
                </p>
                <div class="offer__valence">
                  <DamageTypeIcon
                    :element="item.element"
                    :alt="elementName(item) ?? ''"
                    :size="14"
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
      </HomeModulePanel>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: grid;
  gap: 1.25rem;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.hero {
  padding: 0.5rem 0 0.25rem;
  display: grid;
  gap: 0.7rem;
  /* 透出页面暖底，不再叠一层独立色块 */
  background: transparent;
}

.hero__live {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  color: var(--anime-sky-deep, #2f8fc4);
  font-family: var(--anime-font-display, inherit);
  letter-spacing: 0.08em;
  font-size: 0.82rem;
  font-weight: 700;
}

.dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--anime-coral, #ff7a6e);
  box-shadow: 0 0 0 4px rgba(255, 122, 110, 0.22);
  animation: pulse 1.6s ease infinite;
}

@keyframes pulse {
  50% {
    transform: scale(0.9);
    opacity: 0.75;
  }
}

.hero__brand {
  margin: 0;
  font-family: var(--anime-font-display, inherit);
  font-size: clamp(3rem, 9vw, 5.2rem);
  line-height: 0.95;
  letter-spacing: -0.03em;
  font-weight: 900;
  color: var(--anime-ink, #2a3142);
  background: linear-gradient(120deg, #2a3142 10%, #2f8fc4 55%, #ff7a6e 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

@supports (background-clip: text) or (-webkit-background-clip: text) {
  .hero__brand {
    color: transparent;
  }
}

.hero__tag {
  margin: 0;
  color: var(--anime-muted, #6b7385);
  font-size: clamp(1.02rem, 2.2vw, 1.25rem);
  max-width: 36rem;
}

.hero__search {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: min(640px, 100%);
  margin-top: 0.35rem;
}

.hero__input {
  flex: 1 1 12rem;
  min-width: 0;
  min-height: 2.9rem;
  border: 1px solid var(--anime-line, rgba(90, 120, 160, 0.2));
  border-radius: 16px;
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.hero__button {
  min-height: 2.9rem;
  border: 0;
  border-radius: 16px;
  padding: 0 1.2rem;
  font-family: var(--anime-font-display, inherit);
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--anime-sky, #4eb7e8), var(--anime-mint, #5fd0b0));
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(78, 183, 232, 0.28);
  transition:
    filter 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.hero__hint {
  position: relative;
  margin: 0;
  color: var(--anime-muted, #6b7385);
  font-size: 0.9rem;
}

.hero__hint a {
  color: var(--anime-sky-deep, #2f8fc4);
  text-decoration: none;
  font-weight: 600;
}

.hero__hint a:hover {
  text-decoration: underline;
}

@media (hover: hover) {
  .hero__button:hover {
    filter: brightness(1.05);
    transform: translateY(-1px);
    box-shadow: 0 12px 26px rgba(78, 183, 232, 0.34);
  }

  .inline-search button:hover,
  .retry:hover {
    filter: brightness(1.04);
    transform: translateY(-1px);
  }

  .inv li:hover,
  .nw li:hover,
  .help-list li:hover,
  .items li:hover {
    border-color: rgba(78, 183, 232, 0.4);
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 6px 14px rgba(62, 78, 110, 0.1);
    transform: translateY(-1px);
  }

  .panel:hover {
    border-color: rgba(78, 183, 232, 0.35);
    box-shadow: 0 10px 24px rgba(62, 78, 110, 0.1);
  }
}

.stack {
  display: grid;
  gap: 0.75rem;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
  /* 透出页面暖底，禁止任何半透明底 */
  background: transparent;
  box-shadow: none;
  border: 0;
  padding: 0;
  margin: 0;
}

.state {
  color: var(--anime-muted, #6b7385);
}

.state--error {
  color: var(--anime-coral, #ff7a6e);
  display: grid;
  gap: 0.65rem;
}

.retry {
  width: fit-content;
  border: 1px solid var(--anime-line);
  background: #fff;
  border-radius: 12px;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
}

.empty,
.meta {
  color: var(--anime-muted, #6b7385);
  margin: 0.65rem 0 0;
  font-size: 0.92rem;
}

.inline-search {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 0.75rem 0;
}

.inline-search input {
  flex: 1 1 12rem;
  min-height: 2.5rem;
  border: 1px solid var(--anime-line);
  border-radius: 12px;
  padding: 0.55rem 0.75rem;
}

.inline-search button {
  min-height: 2.5rem;
  border: 0;
  border-radius: 12px;
  padding: 0 0.95rem;
  background: linear-gradient(135deg, var(--anime-coral), var(--anime-peach));
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  transition:
    filter 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.inv,
.nw,
.help-list,
.items,
.cmds,
.upcoming {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.inv li,
.nw li,
.help-list li,
.items li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
  padding: 0.55rem 0.7rem;
  border-radius: 12px;
  background: rgba(78, 183, 232, 0.06);
  border: 1px solid var(--anime-line);
  font-size: 0.92rem;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.pct {
  margin-left: auto;
  font-family: var(--lanius-font-mono);
  color: var(--anime-coral);
  font-weight: 700;
}

.weapon-en {
  display: inline-block;
  margin-left: 0.4rem;
  font-size: 0.82em;
  font-weight: 500;
  color: var(--anime-muted, #6b7385);
}

.item-name {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem 0.35rem;
  flex: 1;
  min-width: 0;
}

.offerings {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.45rem;
}

.offer {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  padding: 0.5rem 0.6rem;
  border-radius: 10px;
  border: 1px solid var(--anime-line);
  background: rgba(255, 255, 255, 0.55);
}

.offer__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.3rem;
}

.offer__title {
  margin: 0;
  font-size: 0.95rem;
}

.offer__valence {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.45rem;
}

.offer__el {
  font-size: 0.8rem;
  color: var(--anime-muted, #6b7385);
  min-width: 2.5em;
}

.offer__pct-slot {
  flex: 1;
  min-width: 3.5rem;
  max-width: 9rem;
  font-size: 0.78rem;
  color: var(--anime-muted, #6b7385);
}

.panel {
  margin-top: 0.65rem;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  border: 1px solid var(--anime-line);
  background: rgba(255, 255, 255, 0.7);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.tabs button {
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
}

.panel h3 {
  margin: 0 0 0.35rem;
  font-family: var(--anime-font-display, inherit);
}

.help-list code,
.cmds code {
  font-family: var(--lanius-font-mono);
  color: var(--anime-sky-deep);
  background: rgba(78, 183, 232, 0.12);
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
}


:deep(.lanius-qq-shell),
:deep(.lanius-ws),
:deep(.fissures-panel),
:deep(.ff) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

@media (max-width: 820px) {
  .hero__brand {
    font-size: clamp(2rem, 10vw, 2.8rem);
  }

  .hero__hint {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.65rem;
  }
}
</style>
