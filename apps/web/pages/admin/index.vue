<script setup lang="ts">
import { AdminApiError } from '../../composables/useAdminApi';
import type { AdminSectionId } from '../../types/admin-section';

definePageMeta({
  layout: false,
});

const { adminFetch } = useAdminApi();
const toast = useToast();

const username = ref('admin');
const password = ref('');
const loggedIn = ref(false);
const probing = ref(true);
const loginPending = ref(false);
const refreshing = ref(false);
const activeSection = ref<AdminSectionId>('overview');
const sidebarOpen = ref(false);

/**
 * 分区标题与说明（工作区页眉）。
 */
const sectionMeta: Record<AdminSectionId, { title: string; desc: string }> = {
  overview: {
    title: '概览',
    desc: '运行态速览：模块、订阅、ACL、版本与最近审计。',
  },
  config: {
    title: '配置',
    desc: '按模块结构化编辑；密钥掩码，支持热加载。',
  },
  releases: {
    title: '版本',
    desc: '从 GitHub Releases/tags 选版，服务器 pull 换版。',
  },
  modules: {
    title: '模块',
    desc: '功能模块启停（门禁 / 帮助 / 推送共用 ModuleId）。',
  },
  subscriptions: {
    title: '订阅',
    desc: 'QQ 推送订阅运维：频率与启用状态。',
  },
  rotations: {
    title: '轮换',
    desc: '信条 / 终幕武器轮换表（epoch、周期、列表）。',
  },
  acl: {
    title: 'ACL',
    desc: '全局 / 群 / C2C 维度的允许与拒绝规则。',
  },
  helpMenu: {
    title: '帮助菜单',
    desc: '公开帮助标题、简介与可见模块清单。',
  },
  audit: {
    title: '审计',
    desc: '近期调用日志，便于排查门禁与延迟。',
  },
};

const modules = ref<Array<{ id: string; enabled: boolean; sortOrder: number }>>([]);
const audit = ref<Array<Record<string, unknown>>>([]);
const acl = ref<Array<Record<string, unknown>>>([]);
const subscriptions = ref<Array<Record<string, unknown>>>([]);
const rotations = ref<Array<Record<string, unknown>>>([]);
const configModules = ref<
  Array<{
    moduleId: string;
    data: Record<string, unknown>;
    restartRequired: string[];
  }>
>([]);
const selectedConfig = ref('api');
const releases = ref<Array<{ tag: string; name: string; publishedAt: string | null }>>([]);
const currentRelease = ref<Record<string, unknown> | null>(null);
const helpDraft = ref({
  titleZh: '指令帮助',
  titleEn: 'Command help',
  introZh: 'QQ 中每条指令为独立根命令，可带前导 /。',
  introEn: 'Each QQ command is its own root. A leading / is optional.',
  visibleModuleIds: [] as string[],
});
const helpSaving = ref(false);

/**
 * 当前工作区页眉。
 */
const currentMeta = computed(() => sectionMeta[activeSection.value]);

/**
 * 面包屑项。
 */
const breadcrumbs = computed(() => [{ label: 'Lanius Admin' }, { label: currentMeta.value.title }]);

/**
 * 展示成功 toast。
 *
 * @param title - 标题
 * @param description - 可选说明
 * @returns 无返回值
 */
function notifyOk(title: string, description?: string): void {
  toast.add({
    title,
    description,
    color: 'success',
    icon: 'i-lucide-check',
  });
}

/**
 * 展示错误 toast。
 *
 * @param err - 错误对象或文案
 * @returns 无返回值
 */
function notifyErr(err: unknown): void {
  toast.add({
    title: '操作失败',
    description: err instanceof Error ? err.message : String(err),
    color: 'error',
    icon: 'i-lucide-circle-alert',
  });
}

/**
 * 从公开帮助接口预填帮助菜单表单。
 *
 * @returns 无返回值
 */
async function hydrateHelpDraft(): Promise<void> {
  try {
    const help = await adminFetch<{
      title: { zh: string; en: string };
      intro: { zh: string; en: string };
      lines: Array<{ id: string }>;
    }>('/v1/help');
    helpDraft.value = {
      titleZh: help.title.zh,
      titleEn: help.title.en,
      introZh: help.intro.zh,
      introEn: help.intro.en,
      visibleModuleIds: help.lines.map((line) => line.id),
    };
  } catch {
    helpDraft.value.visibleModuleIds = modules.value.map((m) => m.id);
  }
}

/**
 * 刷新全部管理数据。
 *
 * @returns 无返回值
 */
async function refresh(): Promise<void> {
  refreshing.value = true;
  try {
    const [mod, rules, events, subs, rots, cfg, rel] = await Promise.all([
      adminFetch<{ modules: typeof modules.value }>('/v1/admin/modules'),
      adminFetch<{ rules: typeof acl.value }>('/v1/admin/acl'),
      adminFetch<{ events: typeof audit.value }>('/v1/admin/audit?limit=200'),
      adminFetch<{ subscriptions: typeof subscriptions.value }>('/v1/admin/subscriptions'),
      adminFetch<{ schedules: typeof rotations.value }>('/v1/admin/rotations'),
      adminFetch<{ modules: typeof configModules.value }>('/v1/admin/config'),
      adminFetch<{
        releases: typeof releases.value;
        current: Record<string, unknown> | null;
      }>('/v1/admin/releases').catch(() => ({
        releases: [] as typeof releases.value,
        current: null,
      })),
    ]);
    modules.value = mod.modules;
    acl.value = rules.rules;
    audit.value = events.events;
    subscriptions.value = subs.subscriptions;
    rotations.value = rots.schedules;
    configModules.value = cfg.modules;
    releases.value = rel.releases ?? [];
    currentRelease.value = rel.current ?? null;
    if (!configModules.value.some((m) => m.moduleId === selectedConfig.value)) {
      selectedConfig.value = configModules.value[0]?.moduleId ?? 'api';
    }
    await hydrateHelpDraft();
  } finally {
    refreshing.value = false;
  }
}

/**
 * 探测已有会话（cookie）；401 则停留登录页。
 *
 * @returns 无返回值
 */
async function probeSession(): Promise<void> {
  probing.value = true;
  try {
    await adminFetch('/v1/admin/modules');
    loggedIn.value = true;
    await refresh();
  } catch (err) {
    loggedIn.value = false;
    if (!(err instanceof AdminApiError && err.status === 401)) {
      notifyErr(err);
    }
  } finally {
    probing.value = false;
  }
}

/**
 * 登录并加载控制台数据。
 *
 * @returns 无返回值
 */
async function login(): Promise<void> {
  loginPending.value = true;
  try {
    await adminFetch('/v1/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });
    loggedIn.value = true;
    password.value = '';
    await refresh();
    notifyOk('已登录');
  } catch (err) {
    notifyErr(err);
  } finally {
    loginPending.value = false;
  }
}

/**
 * 退出并清除会话 cookie。
 *
 * @returns 无返回值
 */
async function logout(): Promise<void> {
  try {
    await adminFetch('/v1/admin/logout', { method: 'POST' });
  } catch {
    // 即便 logout 失败也清空本地会话态
  }
  loggedIn.value = false;
  activeSection.value = 'overview';
  notifyOk('已退出');
}

/**
 * 保存配置模块对象。
 *
 * @param body - 配置 JSON 体
 * @returns 无返回值
 */
async function saveConfig(body: Record<string, unknown>): Promise<void> {
  try {
    const result = await adminFetch<{ restartRequired?: string[] }>(
      `/v1/admin/config/${selectedConfig.value}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
    );
    notifyOk(
      '已保存并热加载',
      result.restartRequired?.length
        ? `需进程重启的字段：${result.restartRequired.join(', ')}`
        : undefined,
    );
    await refresh();
  } catch (err) {
    notifyErr(err);
  }
}

/**
 * 请求 pull 换版到指定 tag。
 *
 * @param tag - 版本 tag
 * @returns 无返回值
 */
async function applyTag(tag: string): Promise<void> {
  try {
    const result = await adminFetch<{
      ok: boolean;
      mode: string;
      detail: string;
    }>('/v1/admin/releases/apply', {
      method: 'POST',
      body: JSON.stringify({ tag, action: 'update' }),
    });
    if (result.ok) {
      notifyOk(`已请求更新到 ${tag}`, result.mode);
    } else {
      notifyErr(new Error(result.detail));
    }
  } catch (err) {
    notifyErr(err);
  }
}

/**
 * 更新订阅启用状态或频率。
 *
 * @param id - 订阅 id
 * @param patch - 补丁字段
 * @returns 无返回值
 */
async function patchSub(
  id: number,
  patch: { enabled?: boolean; frequency?: string },
): Promise<void> {
  try {
    await adminFetch(`/v1/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await refresh();
    notifyOk('订阅已更新');
  } catch (err) {
    notifyErr(err);
  }
}

/**
 * 切换功能模块开关。
 *
 * @param id - 模块 id
 * @param enabled - 是否启用
 * @returns 无返回值
 */
async function toggleModule(id: string, enabled: boolean): Promise<void> {
  try {
    await adminFetch(`/v1/admin/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    await refresh();
    notifyOk(`${id} 已${enabled ? '启用' : '关闭'}`);
  } catch (err) {
    notifyErr(err);
  }
}

/**
 * 保存轮换表。
 *
 * @param moduleId - tenetRotation | codaRotation
 * @param body - epoch / period / items
 * @returns 无返回值
 */
async function saveRotation(
  moduleId: string,
  body: { epochIso: string; periodDays: number; items: string[] },
): Promise<void> {
  try {
    await adminFetch(`/v1/admin/rotations/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    notifyOk(`已保存轮换表 ${moduleId}`);
    await refresh();
  } catch (err) {
    notifyErr(err);
  }
}

/**
 * 新增 ACL 规则。
 *
 * @param body - ACL POST 体
 * @returns 无返回值
 */
async function createAcl(body: Record<string, unknown>): Promise<void> {
  try {
    await adminFetch('/v1/admin/acl', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    notifyOk('已新增 ACL 规则');
    await refresh();
  } catch (err) {
    notifyErr(err);
  }
}

/**
 * 删除 ACL 规则。
 *
 * @param id - 规则 id
 * @returns 无返回值
 */
async function removeAcl(id: number): Promise<void> {
  try {
    await adminFetch(`/v1/admin/acl/${id}`, { method: 'DELETE' });
    notifyOk(`已删除 ACL #${id}`);
    await refresh();
  } catch (err) {
    notifyErr(err);
  }
}

/**
 * 保存帮助菜单。
 *
 * @returns 无返回值
 */
async function saveHelpMenu(): Promise<void> {
  helpSaving.value = true;
  try {
    await adminFetch('/v1/admin/help-menu', {
      method: 'PUT',
      body: JSON.stringify(helpDraft.value),
    });
    notifyOk('已保存帮助菜单');
    await refresh();
  } catch (err) {
    notifyErr(err);
  } finally {
    helpSaving.value = false;
  }
}

/**
 * 切换侧栏分区并在窄屏关闭抽屉。
 *
 * @param id - 分区 id
 * @returns 无返回值
 */
function goSection(id: AdminSectionId): void {
  activeSection.value = id;
  sidebarOpen.value = false;
}

onMounted(() => {
  void probeSession();
});
</script>

<template>
  <UApp>
    <div class="admin-root min-h-screen bg-default text-default">
      <div v-if="probing" class="flex min-h-screen flex-col items-center justify-center gap-3">
        <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary" />
        <p class="text-sm text-muted">正在探测会话…</p>
      </div>

      <AdminLoginCard
        v-else-if="!loggedIn"
        v-model:username="username"
        v-model:password="password"
        error=""
        :pending="loginPending"
        @submit="login"
      />

      <UDashboardGroup v-else unit="rem" storage-key="lanius-admin">
        <UDashboardSidebar
          id="lanius-admin-sidebar"
          v-model:open="sidebarOpen"
          collapsible
          resizable
          :min-size="14"
          :default-size="16"
          :max-size="22"
          class="bg-elevated"
        >
          <template #header>
            <div class="flex items-center gap-2.5 px-2 py-1">
              <span
                class="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-inverted"
              >
                L
              </span>
              <div class="min-w-0">
                <p class="truncate font-semibold text-highlighted">Lanius Admin</p>
                <p class="truncate text-xs text-muted">ops · cookie session</p>
              </div>
            </div>
          </template>

          <AdminSectionNav v-model="activeSection" @select="sidebarOpen = false" />

          <template #footer>
            <div class="space-y-2 p-2">
              <UButton
                block
                color="neutral"
                variant="soft"
                icon="i-lucide-refresh-cw"
                :loading="refreshing"
                @click="refresh"
              >
                刷新全部
              </UButton>
              <UButton
                block
                color="neutral"
                variant="ghost"
                icon="i-lucide-log-out"
                @click="logout"
              >
                退出
              </UButton>
            </div>
          </template>
        </UDashboardSidebar>

        <UDashboardPanel id="lanius-admin-panel">
          <template #header>
            <UDashboardNavbar :title="currentMeta.title">
              <template #leading>
                <UDashboardSidebarCollapse />
              </template>
              <template #right>
                <div class="flex items-center gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-refresh-cw"
                    :loading="refreshing"
                    aria-label="刷新"
                    @click="refresh"
                  />
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-external-link"
                    to="/"
                    target="_blank"
                  >
                    公开站
                  </UButton>
                </div>
              </template>
            </UDashboardNavbar>
            <div
              class="flex flex-wrap items-center justify-between gap-2 border-b border-default px-4 py-2 sm:px-6"
            >
              <UBreadcrumb :items="breadcrumbs" />
              <p class="text-xs text-muted sm:text-sm">
                {{ currentMeta.desc }}
              </p>
            </div>
          </template>

          <template #body>
            <div>
              <AdminOverviewSection
                v-if="activeSection === 'overview'"
                :modules="modules"
                :subscription-count="subscriptions.length"
                :acl-count="acl.length"
                :audit="audit"
                :current-release="currentRelease"
                @navigate="goSection"
              />

              <AdminConfigSection
                v-else-if="activeSection === 'config'"
                v-model:selected-module-id="selectedConfig"
                :modules="configModules"
                @save="saveConfig"
              />

              <AdminReleasesSection
                v-else-if="activeSection === 'releases'"
                :releases="releases"
                :current="currentRelease"
                @apply="applyTag"
              />

              <AdminModulesSection
                v-else-if="activeSection === 'modules'"
                :modules="modules"
                :loading="refreshing"
                @toggle="toggleModule"
              />

              <AdminSubscriptionsSection
                v-else-if="activeSection === 'subscriptions'"
                :subscriptions="subscriptions"
                @patch="patchSub"
              />

              <AdminRotationsSection
                v-else-if="activeSection === 'rotations'"
                :schedules="rotations"
                @save="saveRotation"
              />

              <AdminAclSection
                v-else-if="activeSection === 'acl'"
                :rules="acl"
                :module-ids="modules.map((m) => m.id)"
                @create="createAcl"
                @remove="removeAcl"
              />

              <AdminHelpMenuSection
                v-else-if="activeSection === 'helpMenu'"
                v-model:draft="helpDraft"
                :module-ids="modules.map((m) => m.id)"
                :saving="helpSaving"
                @save="saveHelpMenu"
              />

              <AdminAuditSection v-else-if="activeSection === 'audit'" :events="audit" />
            </div>
          </template>
        </UDashboardPanel>
      </UDashboardGroup>
    </div>
  </UApp>
</template>
