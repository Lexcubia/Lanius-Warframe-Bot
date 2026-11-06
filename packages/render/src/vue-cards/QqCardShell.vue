<script setup lang="ts">
import type { CardSkinId } from './skins.js';

/**
 * QQ 截图专用卡片外壳：固定逻辑宽、Orokin 切角金框 + 四角 L 饰；经 `data-lanius-skin` 套用皮肤。
 */
withDefaults(
  defineProps<{
    /** 主标题（通常为中文栏目名） */
    title: string;
    /** 副标题（时间戳 / 页码说明等） */
    subtitle: string;
    /** 英文栏目 kicker（Orokin 头栏上方 slug；缺省 LANIUS） */
    kicker?: string;
    /** 可选页码胶囊文案（如 `1/3`） */
    pageChip?: string;
    /** 是否陈旧数据提示 */
    stale?: boolean;
    /** 文案语言 */
    locale: 'zh' | 'en';
    /** QQ 皮肤 id（非法值由挂载侧已 resolve） */
    skin?: CardSkinId;
  }>(),
  {
    kicker: 'LANIUS',
    pageChip: undefined,
    stale: false,
    skin: 'orokin',
  },
);
</script>

<template>
  <section class="lanius-qq-shell" data-lanius-card-root :data-lanius-skin="skin">
    <span class="lanius-qq-shell__ornament lanius-qq-shell__ornament--tl" aria-hidden="true" />
    <span class="lanius-qq-shell__ornament lanius-qq-shell__ornament--tr" aria-hidden="true" />
    <span class="lanius-qq-shell__ornament lanius-qq-shell__ornament--bl" aria-hidden="true" />
    <span class="lanius-qq-shell__ornament lanius-qq-shell__ornament--br" aria-hidden="true" />

    <header class="lanius-qq-shell__head">
      <div class="lanius-qq-shell__titles">
        <p class="lanius-qq-shell__kicker">{{ kicker }}</p>
        <div class="lanius-qq-shell__title-row">
          <h1 class="lanius-qq-shell__title">{{ title }}</h1>
          <span v-if="pageChip" class="lanius-qq-shell__chip">{{ pageChip }}</span>
        </div>
      </div>
      <p class="lanius-qq-shell__sub">{{ subtitle }}</p>
    </header>
    <div class="lanius-qq-shell__rule" aria-hidden="true">
      <span class="lanius-qq-shell__rule-stub" />
    </div>
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
  position: relative;
  box-sizing: border-box;
  width: min(100%, var(--lanius-card-width, 1000px));
  max-width: 100%;
  min-width: 0;
  padding: var(--lanius-card-padding, 14px);
  background: var(--lanius-shell-bg);
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  /* 切角外框（对齐 SDJK chamfer） */
  border: 2px solid var(--lanius-frame, var(--lanius-border-bright));
  clip-path: polygon(
    12px 0,
    calc(100% - 12px) 0,
    100% 12px,
    100% calc(100% - 12px),
    calc(100% - 12px) 100%,
    12px 100%,
    0 calc(100% - 12px),
    0 12px
  );
  overflow: hidden;
  box-shadow: var(--lanius-shell-shadow);
}

.lanius-qq-shell__ornament {
  position: absolute;
  width: 18px;
  height: 18px;
  pointer-events: none;
  z-index: 2;
}

.lanius-qq-shell__ornament--tl {
  top: 6px;
  left: 6px;
  border-top: 3px solid var(--lanius-ornament, var(--lanius-highlight));
  border-left: 3px solid var(--lanius-ornament, var(--lanius-highlight));
}

.lanius-qq-shell__ornament--tr {
  top: 6px;
  right: 6px;
  border-top: 3px solid var(--lanius-ornament, var(--lanius-highlight));
  border-right: 3px solid var(--lanius-ornament, var(--lanius-highlight));
}

.lanius-qq-shell__ornament--bl {
  bottom: 6px;
  left: 6px;
  border-bottom: 3px solid var(--lanius-ornament, var(--lanius-highlight));
  border-left: 3px solid var(--lanius-ornament, var(--lanius-highlight));
}

.lanius-qq-shell__ornament--br {
  bottom: 6px;
  right: 6px;
  border-bottom: 3px solid var(--lanius-ornament, var(--lanius-highlight));
  border-right: 3px solid var(--lanius-ornament, var(--lanius-highlight));
}

.lanius-qq-shell__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 0;
  padding: 4px 4px 0;
}

.lanius-qq-shell__titles {
  min-width: 0;
  flex: 1;
}

.lanius-qq-shell__kicker {
  margin: 0 0 2px;
  font-size: var(--lanius-type-shell-kicker, 13px);
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--lanius-accent);
  font-family: var(--lanius-font-display);
}

.lanius-qq-shell__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.lanius-qq-shell__title {
  margin: 0;
  font-size: var(--lanius-type-shell-title, 28px);
  font-weight: 700;
  color: var(--lanius-text);
  font-family: var(--lanius-font-display);
  letter-spacing: 0.01em;
  line-height: 1.15;
}

.lanius-qq-shell__chip {
  flex-shrink: 0;
  padding: 3px 12px;
  border-radius: 999px;
  border: 1px solid var(--lanius-accent);
  background: color-mix(in srgb, var(--lanius-accent) 18%, transparent);
  color: var(--lanius-text);
  font-size: var(--lanius-type-meta, 13px);
  font-weight: 700;
}

.lanius-qq-shell__sub {
  margin: 0;
  font-size: var(--lanius-type-shell-sub, 13px);
  color: var(--lanius-text-muted);
  flex-shrink: 0;
  align-self: flex-end;
  padding-bottom: 4px;
}

.lanius-qq-shell__rule {
  position: relative;
  height: 1px;
  margin: 8px 4px 6px;
  background: var(--lanius-hair, var(--lanius-border));
}

.lanius-qq-shell__rule-stub {
  position: absolute;
  left: 0;
  top: -1px;
  width: 48px;
  height: 3px;
  background: var(--lanius-accent);
}

.lanius-qq-shell__stale {
  margin: 0 4px 6px;
  font-size: var(--lanius-type-meta, 13px);
  color: var(--lanius-warn);
}

.lanius-qq-shell__body {
  padding: 4px 4px 2px;
  min-width: 0;
}

/* light / dark 备选：略圆角，弱化切角观感但仍保留框线 */
.lanius-qq-shell[data-lanius-skin='light'],
.lanius-qq-shell[data-lanius-skin='dark'] {
  clip-path: none;
  border-radius: 10px;
}
</style>
