<script setup lang="ts">
/**
 * QQ 移动端卡片外壳：固定逻辑宽度、紧凑头栏，供 Chromium 节点截图与 Web 复用。
 * 视觉对齐公开站暖底动漫风（奶油底、珊瑚点缀、软圆角）。
 */
defineProps<{
  /** 主标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 是否陈旧数据提示 */
  stale?: boolean;
  /** 文案语言 */
  locale: 'zh' | 'en';
}>();
</script>

<template>
  <section class="lanius-qq-shell" data-lanius-card-root>
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
  /*
   * 默认 QQ 逻辑宽 640；Web 可在祖先设 `--lanius-card-width: 100%` 铺满。
   */
  width: min(100%, var(--lanius-card-width, 640px));
  max-width: 100%;
  min-width: 0;
  padding: var(--lanius-card-padding, 12px);
  background:
    radial-gradient(420px 180px at 6% -20%, rgba(78, 183, 232, 0.22), transparent 60%),
    radial-gradient(360px 160px at 96% 0%, rgba(255, 122, 110, 0.18), transparent 55%),
    linear-gradient(180deg, var(--lanius-panel-raised) 0%, var(--lanius-void) 100%);
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
  border: 1px solid var(--lanius-border);
  border-radius: calc(var(--lanius-card-radius, 16px) + 4px);
  box-shadow: 0 10px 28px rgba(62, 78, 110, 0.1);
}

.lanius-qq-shell__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--lanius-border);
}

.lanius-qq-shell__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.lanius-qq-shell__mark {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  border-radius: 4px;
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
  font-size: 10px;
  color: var(--lanius-text-muted);
  flex-shrink: 0;
}

.lanius-qq-shell__stale {
  margin: 0 0 6px;
  font-size: 11px;
  color: var(--lanius-warn);
}

.lanius-qq-shell__body {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--lanius-border);
  border-radius: var(--lanius-card-radius, 16px);
  padding: 12px;
  box-shadow: 0 4px 14px rgba(62, 78, 110, 0.05);
}
</style>
