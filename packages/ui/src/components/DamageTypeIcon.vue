<script setup lang="ts">
import type { ValenceElement } from '@lanius/core';
import { computed, ref, watch } from 'vue';

import { resolveValenceElementIconSrc } from '../lib/valence-element-icon.js';

/**
 * Valence 元素图标（本地资产）。
 * 始终占固定尺寸槽位：无元素 / 加载失败时显示占位，保证与有图行对齐。
 */
const props = withDefaults(
  defineProps<{
    /** 规范元素键；优先于 iconUrl 使用本地打包图 */
    element?: ValenceElement;
    /** 可选覆盖 URL；无 element 时使用 */
    iconUrl?: string;
    /** 无障碍 alt（如「火焰」） */
    alt?: string;
    /** 边长像素 */
    size?: number;
    /**
     * 为 false 时：无元素也不渲染占位（用于可选列完全隐藏）。
     * 默认 true：凡使用本组件处都留槽位。
     */
    placeholder?: boolean;
  }>(),
  {
    alt: '',
    size: 18,
    placeholder: true,
  },
);

/** 当前是否因加载失败而回退占位 */
const failed = ref(false);

/**
 * 最终图标地址：本地元素图优先，其次 API 覆盖 URL。
 */
const src = computed(() => {
  if (props.element) {
    return resolveValenceElementIconSrc(props.element);
  }
  return props.iconUrl;
});

/**
 * 是否显示占位槽（无 src 或失败，且允许占位）。
 */
const showPlaceholder = computed(
  () => props.placeholder && (!src.value || failed.value),
);

watch(src, () => {
  failed.value = false;
});

/**
 * 图片加载失败时改用占位。
 *
 * @param _event - error 事件（未使用）
 * @returns 无返回值
 */
function onError(_event: Event): void {
  failed.value = true;
}
</script>

<template>
  <span
    v-if="src || placeholder"
    class="dmg-icon"
    :class="{ 'dmg-icon--placeholder': showPlaceholder }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :aria-hidden="!alt || showPlaceholder ? true : undefined"
    :role="alt && src && !failed ? 'img' : undefined"
    :aria-label="alt && src && !failed ? alt : undefined"
  >
    <!--
      与 OfficialItemIcon 相同：截图前须完成加载，故强制 eager。
    -->
    <img
      v-if="src && !failed"
      class="dmg-icon__img"
      data-lanius-icon="damage"
      :src="src"
      :alt="alt"
      :width="size"
      :height="size"
      loading="eager"
      decoding="sync"
      @error="onError"
    />
  </span>
</template>

<style scoped>
.dmg-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  box-sizing: border-box;
  border-radius: 4px;
  overflow: hidden;
}

.dmg-icon--placeholder {
  border: 1px dashed rgba(62, 78, 110, 0.2);
  background: rgba(62, 78, 110, 0.04);
}

.dmg-icon--placeholder::after {
  content: '';
  width: 42%;
  height: 42%;
  border-radius: 2px;
  background: rgba(62, 78, 110, 0.14);
}

.dmg-icon__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: transparent;
}
</style>
