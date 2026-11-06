<script setup lang="ts">
const props = defineProps<{
  /** 锚点 id（不含 #） */
  moduleId: string;
  /** 主标题 */
  title: string;
  /** 英文/副标题 */
  subtitle?: string;
  /** LIVE / 状态徽章 */
  badge?: string;
  /** 是否展开 */
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [boolean];
}>();

/**
 * 切换展开收起。
 *
 * @returns 无返回值
 */
function toggle(): void {
  emit('update:open', !props.open);
}
</script>

<template>
  <section :id="moduleId" class="mod" :class="{ 'mod--open': open }">
    <header class="mod__head">
      <button type="button" class="mod__toggle" :aria-expanded="open" @click="toggle">
        <span class="mod__chev" aria-hidden="true">{{ open ? '▾' : '▸' }}</span>
        <span class="mod__titles">
          <span class="mod__title">{{ title }}</span>
          <span v-if="subtitle" class="mod__sub">{{ subtitle }}</span>
        </span>
        <span v-if="badge" class="mod__badge">{{ badge }}</span>
      </button>
    </header>
    <div v-show="open" class="mod__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.mod {
  scroll-margin-top: 5.5rem;
  background: var(--anime-panel, #131823);
  border: 1px solid var(--anime-line, rgba(122, 100, 62, 0.55));
  border-radius: 12px;
  /* 不用 backdrop-filter，避免叠出发灰半透明块 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  overflow: clip;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.mod--open {
  border-color: rgba(212, 176, 106, 0.55);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

@media (hover: hover) {
  .mod:hover {
    border-color: rgba(212, 176, 106, 0.65);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  }
}

.mod__head {
  margin: 0;
  background: #131823;
}

.mod--open .mod__head {
  background: linear-gradient(180deg, #181e2b 0%, #131823 100%);
  border-bottom: 1px solid var(--anime-line, #342f26);
}

.mod__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  padding: 0.7rem 1rem;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  color: var(--anime-ink, #ece8de);
  font: inherit;
}

@media (hover: hover) {
  .mod__toggle:hover {
    background: rgba(212, 176, 106, 0.08);
  }

  .mod__toggle:hover .mod__chev {
    color: var(--anime-peach, #f0d79a);
  }
}

.mod__chev {
  width: 1rem;
  color: var(--anime-gold, #d4b06a);
  font-size: 0.75rem;
  line-height: 1;
  flex-shrink: 0;
}

.mod__titles {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.55rem;
  min-width: 0;
  flex: 1;
}

.mod__title {
  font-family: var(--anime-font-display, inherit);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.01em;
  color: var(--anime-peach, #f0d79a);
}

.mod__sub {
  color: var(--anime-muted, #a8b0be);
  font-size: 0.78rem;
  font-weight: 500;
}

.mod__badge {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0c0f16;
  background: linear-gradient(135deg, var(--anime-gold, #d4b06a), var(--anime-peach, #f0d79a));
  padding: 0.2rem 0.48rem;
  border-radius: 6px;
}

.mod__body {
  padding: 0.85rem 1rem 1rem;
  background: var(--anime-cream, #0c0f16);
  animation: mod-in 0.2s ease;
}

@keyframes mod-in {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
