<script setup lang="ts">
import type { CardSkinId } from './skins.js';

/**
 * QQ 截图专用卡片外壳：固定逻辑宽、扁头栏、dense 间距；经 `data-lanius-skin` 套用 light/dark。
 */
withDefaults(
  defineProps<{
    /** 主标题 */
    title: string;
    /** 副标题 */
    subtitle: string;
    /** 是否陈旧数据提示 */
    stale?: boolean;
    /** 文案语言 */
    locale: 'zh' | 'en';
    /** QQ 皮肤 id（非法值由挂载侧已 resolve） */
    skin?: CardSkinId;
  }>(),
  {
    stale: false,
    skin: 'light',
  },
);
</script>

<template>
  <section class="lanius-qq-shell" data-lanius-card-root :data-lanius-skin="skin">
    <header class="lanius-qq-shell__head">
      <div class="lanius-qq-shell__brand">
        <span class="lanius-qq-shell__mark" aria-hidden="true" />
        <h1 class="lanius-qq-shell__title">{{ title }}</h1>
      </div>
      <p class="lanius-qq-shell__sub">{{ subtitle }}</p>
    </header>
    <p v-if="stale" class="lanius-qq-shell__stale">
      {{ locale === 'en' ? 'Data may be delayed' : '数据可能延迟' }}
    </p>
    <div class="lanius-qq-shell__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.lanius-qq-shell {
  box-sizing: border-box;
  width: min(100%, var(--lanius-card-width, 640px));
  max-width: 100%;
  min-width: 0;
  padding: var(--lanius-card-padding, 8px);
  background: var(--lanius-shell-bg);
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  border: 1px solid var(--lanius-border);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--lanius-shell-shadow);
}

.lanius-qq-shell__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--lanius-border);
}

.lanius-qq-shell__brand {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.lanius-qq-shell__mark {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: linear-gradient(145deg, var(--lanius-highlight), var(--lanius-bar-defend));
}

.lanius-qq-shell__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--lanius-brand);
  font-family: var(--lanius-font-display);
  letter-spacing: -0.02em;
}

.lanius-qq-shell__sub {
  margin: 0;
  font-size: 12px;
  color: var(--lanius-text-muted);
  flex-shrink: 0;
}

.lanius-qq-shell__stale {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--lanius-warn);
}

.lanius-qq-shell__body {
  padding: 2px 0 0;
}
</style>
