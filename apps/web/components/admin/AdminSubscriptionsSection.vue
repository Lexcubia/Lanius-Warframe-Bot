<script setup lang="ts">
defineProps<{
  /** 推送订阅行 */
  subscriptions: Array<Record<string, unknown>>;
}>();

const emit = defineEmits<{
  patch: [id: number, patch: { enabled?: boolean; frequency?: string }];
}>();
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">推送订阅</h2>
    <p class="admin-panel__hint">
      共 {{ subscriptions.length }} 条。公开站不写入 QQ 订阅，仅在此运维启停与频率。
    </p>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>场景 / 目标</th>
            <th>模块</th>
            <th>频率</th>
            <th>启用</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in subscriptions" :key="String(s.id)">
            <td>
              <code>{{ s.scene }}/{{ s.targetId }}</code>
            </td>
            <td><code>{{ s.moduleId }}</code></td>
            <td>
              <select
                class="admin-select"
                style="max-width: 9rem"
                :value="String(s.frequency)"
                @change="
                  emit('patch', Number(s.id), {
                    frequency: ($event.target as HTMLSelectElement).value,
                  })
                "
              >
                <option value="on_change">变更时</option>
                <option value="hourly">每小时</option>
                <option value="daily">每天</option>
                <option value="weekly">每周</option>
              </select>
            </td>
            <td>
              <input
                type="checkbox"
                :checked="Boolean(s.enabled)"
                @change="
                  emit('patch', Number(s.id), {
                    enabled: ($event.target as HTMLInputElement).checked,
                  })
                "
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!subscriptions.length" class="admin-empty">暂无订阅。</p>
  </section>
</template>
