<script setup lang="ts">
/**
 * QQ 移动端卡片外壳：固定逻辑宽度、紧凑头栏，供 Chromium 节点截图与 Web 复用。
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
      <h1 class="lanius-qq-shell__title">{{ title }}</h1>
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
  width: var(--lanius-card-width, 640px);
  padding: var(--lanius-card-padding, 10px);
  background: linear-gradient(
    180deg,
    var(--lanius-panel-raised) 0%,
    var(--lanius-void) 100%
  );
  color: var(--lanius-text);
  font-family: var(--lanius-font-body);
}

.lanius-qq-shell__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--lanius-border-bright);
}

.lanius-qq-shell__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--lanius-brand);
  font-family: var(--lanius-font-display);
}

.lanius-qq-shell__sub {
  margin: 0;
  font-size: 10px;
  color: var(--lanius-text-muted);
}

.lanius-qq-shell__stale {
  margin: 0 0 6px;
  font-size: 11px;
  color: var(--lanius-warn);
}

.lanius-qq-shell__body {
  background: var(--lanius-panel);
  border: 1px solid var(--lanius-border);
  border-radius: var(--lanius-card-radius, 12px);
  padding: 12px;
}
</style>
