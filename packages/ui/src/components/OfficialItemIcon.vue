<script setup lang="ts">
import { ref, watch } from 'vue';

/**
 * 官方 PublicExport 物品图标。
 * 始终占固定尺寸槽位：无 URL / 加载失败时显示占位，保证列表文字对齐。
 */
const props = withDefaults(
  defineProps<{
    /** 官方 CDN 图标 URL；缺省显示占位 */
    iconUrl?: string;
    /** 无障碍 alt */
    alt?: string;
    /** 边长像素 */
    size?: number;
  }>(),
  {
    alt: '',
    size: 36,
  },
);

/** 当前是否因加载失败而回退占位 */
const failed = ref(false);

watch(
  () => props.iconUrl,
  () => {
    failed.value = false;
  },
);

/**
 * 图片加载失败时改用占位（不塌缩布局）。
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
    class="item-icon"
    :class="{ 'item-icon--placeholder': !iconUrl || failed }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :aria-hidden="!alt || !iconUrl || failed ? true : undefined"
    :role="alt && iconUrl && !failed ? 'img' : undefined"
    :aria-label="alt && iconUrl && !failed ? alt : undefined"
  >
    <img
      v-if="iconUrl && !failed"
      class="item-icon__img"
      :src="iconUrl"
      :alt="alt"
      :width="size"
      :height="size"
      loading="lazy"
      decoding="async"
      @error="onError"
    />
  </span>
</template>

<style scoped>
.item-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(62, 78, 110, 0.06);
  overflow: hidden;
  box-sizing: border-box;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.item-icon--placeholder {
  border: 1px dashed rgba(62, 78, 110, 0.22);
  background: rgba(62, 78, 110, 0.04);
}

.item-icon--placeholder::after {
  content: '';
  width: 38%;
  height: 38%;
  border-radius: 3px;
  background: rgba(62, 78, 110, 0.16);
}

.item-icon__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

@media (hover: hover) {
  .item-icon:not(.item-icon--placeholder):hover {
    transform: scale(1.06);
    box-shadow: 0 4px 10px rgba(62, 78, 110, 0.14);
  }
}
</style>
