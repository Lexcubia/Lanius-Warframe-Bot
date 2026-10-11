<script setup lang="ts">
defineProps<{
  /** GitHub releases/tags 列表 */
  releases: Array<{ tag: string; name: string; publishedAt: string | null }>;
  /** 当前运行版本信息 */
  current: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  apply: [tag: string];
}>();
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">版本（GitHub / pull 换版）</h2>
    <p class="admin-panel__hint">
      当前镜像与包版本如下；选版后走服务器 pull，不在此机 rebuild。
    </p>
    <div class="admin-metrics" style="margin-bottom: 1rem">
      <div class="admin-metric">
        <p class="admin-metric__label">Image</p>
        <p class="admin-metric__value" style="font-size: 1.05rem">
          {{ current?.imageTag ?? 'n/a' }}
        </p>
      </div>
      <div class="admin-metric">
        <p class="admin-metric__label">Package</p>
        <p class="admin-metric__value" style="font-size: 1.05rem">
          {{ current?.packageVersion ?? 'n/a' }}
        </p>
      </div>
    </div>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Tag</th>
            <th>名称</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in releases" :key="r.tag">
            <td><code>{{ r.tag }}</code></td>
            <td>{{ r.name !== r.tag ? r.name : '—' }}</td>
            <td>
              <button
                type="button"
                class="admin-btn admin-btn--ghost"
                @click="emit('apply', r.tag)"
              >
                更新/回退
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!releases.length" class="admin-empty">
      暂无 Release/tag 或 GitHub API 不可用。
    </p>
  </section>
</template>
