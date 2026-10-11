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
  <section
    :id="moduleId"
    class="mod"
    :class="{ 'mod--open': open }"
  >
    <header class="mod__head">
      <button
        type="button"
        class="mod__toggle"
        :aria-expanded="open"
        @click="toggle"
      >
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
  background: #fff;
  border: 1px solid var(--anime-line, #e4d5c8);
  border-radius: 16px;
  /* 不用 backdrop-filter，避免叠出发灰半透明块 */
  box-shadow: 0 2px 10px rgba(62, 78, 110, 0.05);
  overflow: clip;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.mod--open {
  border-color: rgba(78, 183, 232, 0.35);
  box-shadow: 0 8px 24px rgba(62, 78, 110, 0.08);
}

@media (hover: hover) {
  .mod:hover {
    border-color: rgba(78, 183, 232, 0.4);
    box-shadow: 0 6px 18px rgba(62, 78, 110, 0.09);
  }
}

.mod__head {
  margin: 0;
  background: #fff4eb;
}

.mod--open .mod__head {
  background: linear-gradient(180deg, #fff8f2 0%, #ffffff 100%);
  border-bottom: 1px solid var(--anime-line, #e4d5c8);
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
  color: var(--anime-ink, #2a3142);
  font: inherit;
}

@media (hover: hover) {
  .mod__toggle:hover {
    background: rgba(78, 183, 232, 0.06);
  }

  .mod__toggle:hover .mod__chev {
    color: var(--anime-coral, #ff7a6e);
  }
}

.mod__chev {
  width: 1rem;
  color: var(--anime-sky-deep, #2f8fc4);
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
  color: var(--anime-ink, #2a3142);
}

.mod__sub {
  color: var(--anime-muted, #6b7385);
  font-size: 0.78rem;
  font-weight: 500;
}

.mod__badge {
  flex-shrink: 0;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(
    135deg,
    var(--anime-coral, #ff7a6e),
    var(--anime-peach, #ffb38a)
  );
  padding: 0.2rem 0.48rem;
  border-radius: 8px;
}

.mod__body {
  padding: 0.85rem 1rem 1rem;
  background: #fff;
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
