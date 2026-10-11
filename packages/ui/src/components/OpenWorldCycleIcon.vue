<script setup lang="ts">
import type { OpenWorldCycleId } from '@lanius/core';
import { computed } from 'vue';

import { resolveOpenWorldCycleIconKind } from '../lib/open-world-cycle-theme.js';

/**
 * 开放世界周期环心符号图标（SVG path，随主题着色）。
 */
const props = withDefaults(
  defineProps<{
    /** 周期 id */
    cycleId: OpenWorldCycleId | string;
    /** 描边/填充色 */
    color?: string;
    /** 边长（与外环 viewBox 协调） */
    size?: number;
  }>(),
  {
    color: 'currentColor',
    size: 22,
  },
);

/**
 * 当前图标种类。
 */
const kind = computed(() => resolveOpenWorldCycleIconKind(props.cycleId));
</script>

<template>
  <svg
    class="ow-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    aria-hidden="true"
    :style="{ color }"
  >
    <!-- 地球：简明地球仪 -->
    <g v-if="kind === 'globe'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <circle cx="12" cy="12" r="8.2" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8.2" />
      <path d="M4 12h16M6.2 7.5h11.6M6.2 16.5h11.6" />
    </g>

    <!-- 平原：日轮 -->
    <g v-else-if="kind === 'sun'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path
        d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M5.2 18.8l1.6-1.6M17.2 6.8l1.6-1.6"
      />
    </g>

    <!-- 魔胎：侵染孢囊 -->
    <g v-else-if="kind === 'spore'" fill="currentColor">
      <path
        d="M12 3.2c-2.8 0-5.2 2.6-5.2 6.1 0 2.6 1.4 4.7 3.2 6.3L12 21l1.9-5.4c1.9-1.6 3.3-3.7 3.3-6.3 0-3.5-2.4-6.1-5.2-6.1z"
        opacity="0.92"
      />
      <circle cx="10.4" cy="9.2" r="1.1" fill="#fff" opacity="0.55" />
    </g>

    <!-- 山谷：雪晶 -->
    <g v-else-if="kind === 'snow'" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <path d="M12 3v18M4.8 7.5l14.4 9M4.8 16.5l14.4-9" />
      <path d="M12 6.2l1.6-1.4M12 6.2l-1.6-1.4M12 17.8l1.6 1.4M12 17.8l-1.6 1.4" />
      <path d="M7.2 8.4l-2 .2M7.2 8.4l.6-1.9M16.8 15.6l2-.2M16.8 15.6l-.6 1.9" />
      <path d="M7.2 15.6l-2-.2M7.2 15.6l.6 1.9M16.8 8.4l2 .2M16.8 8.4l-.6-1.9" />
    </g>

    <!-- 双衍：螺旋 -->
    <g v-else-if="kind === 'spiral'" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
      <path
        d="M12 5.2c3.6 0 5.8 2.4 5.8 5.2S15.2 15.2 12 15.2 7.2 13.4 7.2 11c0-1.7 1.2-3 3-3s2.8 1 2.8 2.4c0 1-.7 1.7-1.8 1.7"
      />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </g>

    <!-- 扎里曼：虚空菱晶 -->
    <g v-else fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round">
      <path d="M12 3.2 19.2 12 12 20.8 4.8 12Z" />
      <path d="M12 7.2 15.6 12 12 16.8 8.4 12Z" opacity="0.85" />
    </g>
  </svg>
</template>

<style scoped>
.ow-icon {
  display: block;
  flex-shrink: 0;
}
</style>
