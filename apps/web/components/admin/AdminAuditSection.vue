<script setup lang="ts">
defineProps<{
  /** 审计事件行 */
  events: Array<Record<string, unknown>>;
}>();
</script>

<template>
  <section class="admin-panel">
    <h2 class="admin-panel__title">调用日志</h2>
    <p class="admin-panel__hint">最近 {{ events.length }} 条（按接口 limit）。</p>
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>场景</th>
            <th>模块</th>
            <th>结果</th>
            <th>耗时</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ev in events" :key="String(ev.id)">
            <td>
              <code>{{ ev.ts }}</code>
            </td>
            <td>{{ ev.scene ?? '—' }}</td>
            <td>
              <code>{{ ev.module_id ?? '—' }}</code>
            </td>
            <td>{{ ev.outcome ?? '—' }}</td>
            <td>{{ ev.latency_ms != null ? `${ev.latency_ms}ms` : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!events.length" class="admin-empty">暂无审计记录。</p>
  </section>
</template>
