<script setup lang="ts">
import { AdminApiError } from '../../composables/useAdminApi';
import type { AdminSectionId } from '../../types/admin-section';

definePageMeta({
  layout: false,
});

const { t } = useI18n({ useScope: 'global' });
const { adminFetch } = useAdminApi();

const username = ref('admin');
const password = ref('');
const loggedIn = ref(false);
const probing = ref(true);
const loginPending = ref(false);
const error = ref('');
const notice = ref('');
const activeSection = ref<AdminSectionId>('overview');
const navOpen = ref(false);

/**
 * 分区标题与说明（工作区页眉）。
 */
const sectionMeta: Record<AdminSectionId, { title: string; desc: string }> = {
  overview: { title: '概览', desc: '运行态速览：模块、订阅、ACL、版本与最近审计。' },
  config: { title: '配置', desc: '按模块编辑 YAML 投影 JSON；密钥掩码，支持热加载。' },
  releases: { title: '版本', desc: '从 GitHub Releases/tags 选版，服务器 pull 换版。' },
  modules: { title: '模块', desc: '功能模块启停（门禁 / 帮助 / 推送共用 ModuleId）。' },
  subscriptions: { title: '订阅', desc: 'QQ 推送订阅运维：频率与启用状态。' },
  rotations: { title: '轮换', desc: '信条 / 终幕武器轮换表（epoch、周期、列表）。' },
  acl: { title: 'ACL', desc: '全局 / 群 / C2C 维度的允许与拒绝规则。' },
  helpMenu: { title: '帮助菜单', desc: '公开帮助标题、简介与可见模块清单。' },
  audit: { title: '审计', desc: '近期调用日志，便于排查门禁与延迟。' },
};

const modules = ref<Array<{ id: string; enabled: boolean; sortOrder: number }>>(
  [],
);
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
const configEdit = ref('');
const releases = ref<
  Array<{ tag: string; name: string; publishedAt: string | null }>
>([]);
const currentRelease = ref<Record<string, unknown> | null>(null);
const helpDraft = ref({
  titleZh: '指令帮助',
  titleEn: 'Command help',
  introZh: 'QQ 中每条指令为独立根命令，可带前导 /。',
  introEn: 'Each QQ command is its own root. A leading / is optional.',
  visibleModuleIds: [] as string[],
});

/**
 * 当前工作区页眉。
 */
const currentMeta = computed(() => sectionMeta[activeSection.value]);

/**
 * 概览指标。
 */
const overviewStats = computed(() => [
  {
    label: '模块',
    value: String(modules.value.length),
    sub: `启用 ${modules.value.filter((m) => m.enabled).length}`,
  },
  {
    label: '订阅',
    value: String(subscriptions.value.length),
    sub: 'push subscriptions',
  },
  {
    label: 'ACL',
    value: String(acl.value.length),
    sub: 'access rules',
  },
  {
    label: '审计',
    value: String(audit.value.length),
    sub: 'recent events',
  },
]);

/**
 * 将选中配置模块载入 JSON 编辑器。
 *
 * @returns 无返回值
 */
function loadConfigEditor(): void {
  const row = configModules.value.find(
    (m) => m.moduleId === selectedConfig.value,
  );
  configEdit.value = row ? JSON.stringify(row.data, null, 2) : '{}';
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
  const [mod, rules, events, subs, rots, cfg, rel] = await Promise.all([
    adminFetch<{ modules: typeof modules.value }>('/v1/admin/modules'),
    adminFetch<{ rules: typeof acl.value }>('/v1/admin/acl'),
    adminFetch<{ events: typeof audit.value }>('/v1/admin/audit?limit=50'),
    adminFetch<{ subscriptions: typeof subscriptions.value }>(
      '/v1/admin/subscriptions',
    ),
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
  loadConfigEditor();
  await hydrateHelpDraft();
}

/**
 * 探测已有会话（cookie）；401 则停留登录页。
 *
 * @returns 无返回值
 */
async function probeSession(): Promise<void> {
  probing.value = true;
  error.value = '';
  try {
    await adminFetch('/v1/admin/modules');
    loggedIn.value = true;
    await refresh();
  } catch (err) {
    loggedIn.value = false;
    if (!(err instanceof AdminApiError && err.status === 401)) {
      // 非未授权错误仍展示，便于代理/API 宕机排查
      error.value = err instanceof Error ? err.message : String(err);
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
  error.value = '';
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
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
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
  error.value = '';
  notice.value = '';
  try {
    await adminFetch('/v1/admin/logout', { method: 'POST' });
  } catch {
    // 即便 logout 失败也清空本地会话态
  }
  loggedIn.value = false;
  activeSection.value = 'overview';
}

/**
 * 保存当前配置模块 JSON。
 *
 * @returns 无返回值
 */
async function saveConfig(): Promise<void> {
  notice.value = '';
  error.value = '';
  try {
    const body = JSON.parse(configEdit.value) as Record<string, unknown>;
    const result = await adminFetch<{ restartRequired?: string[] }>(
      `/v1/admin/config/${selectedConfig.value}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
    );
    notice.value = result.restartRequired?.length
      ? `已保存并热加载。需进程重启的字段：${result.restartRequired.join(', ')}`
      : '已保存并热加载。';
    await refresh();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
}

/**
 * 请求 pull 换版到指定 tag。
 *
 * @param tag - 版本 tag
 * @returns 无返回值
 */
async function applyTag(tag: string): Promise<void> {
  notice.value = '';
  error.value = '';
  try {
    const result = await adminFetch<{
      ok: boolean;
      mode: string;
      detail: string;
    }>('/v1/admin/releases/apply', {
      method: 'POST',
      body: JSON.stringify({ tag, action: 'update' }),
    });
    notice.value = result.ok
      ? `已请求更新到 ${tag}（${result.mode}）`
      : `未能自动执行：${result.detail}`;
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
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
  error.value = '';
  try {
    await adminFetch(`/v1/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    await refresh();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
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
  error.value = '';
  try {
    await adminFetch(`/v1/admin/modules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
    await refresh();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
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
  notice.value = '';
  error.value = '';
  try {
    await adminFetch(`/v1/admin/rotations/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    notice.value = `已保存轮换表 ${moduleId}`;
    await refresh();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
}

/**
 * 新增 ACL 规则。
 *
 * @param body - ACL POST 体
 * @returns 无返回值
 */
async function createAcl(body: Record<string, unknown>): Promise<void> {
  notice.value = '';
  error.value = '';
  try {
    await adminFetch('/v1/admin/acl', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    notice.value = '已新增 ACL 规则';
    await refresh();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
}

/**
 * 删除 ACL 规则。
 *
 * @param id - 规则 id
 * @returns 无返回值
 */
async function removeAcl(id: number): Promise<void> {
  notice.value = '';
  error.value = '';
  try {
    await adminFetch(`/v1/admin/acl/${id}`, { method: 'DELETE' });
    notice.value = `已删除 ACL #${id}`;
    await refresh();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
}

/**
 * 保存帮助菜单。
 *
 * @returns 无返回值
 */
async function saveHelpMenu(): Promise<void> {
  notice.value = '';
  error.value = '';
  try {
    await adminFetch('/v1/admin/help-menu', {
      method: 'PUT',
      body: JSON.stringify(helpDraft.value),
    });
    notice.value = '已保存帮助菜单';
    await refresh();
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
}

watch(selectedConfig, () => loadConfigEditor());

onMounted(() => {
  void probeSession();
});
</script>

<template>
  <div class="admin-root" :class="{ 'admin-root--nav-open': navOpen }">
    <header class="admin-top">
      <button
        v-if="loggedIn"
        type="button"
        class="admin-menu-btn"
        aria-label="Toggle navigation"
        @click="navOpen = !navOpen"
      >
        ☰
      </button>
      <div class="admin-top__brand">
        <span class="admin-top__mark">L</span>
        <span>Lanius Admin</span>
      </div>
      <span class="admin-top__meta">ops console · cookie session</span>
      <div class="admin-top__spacer" />
      <div class="admin-top__actions">
        <button
          v-if="loggedIn"
          type="button"
          class="admin-btn admin-btn--top"
          @click="refresh"
        >
          刷新
        </button>
        <button
          v-if="loggedIn"
          type="button"
          class="admin-btn admin-btn--top"
          @click="logout"
        >
          退出
        </button>
        <NuxtLink class="admin-btn admin-btn--top" to="/">公开站</NuxtLink>
      </div>
    </header>

    <p v-if="probing" class="admin-flash" style="margin: 1rem">
      正在探测会话…
    </p>

    <AdminLoginCard
      v-else-if="!loggedIn"
      v-model:username="username"
      v-model:password="password"
      :error="error"
      :pending="loginPending"
      @submit="login"
    />

    <div v-else class="admin-shell">
      <div class="admin-backdrop" @click="navOpen = false" />
      <aside class="admin-side">
        <p class="admin-side__label">导航</p>
        <AdminSectionNav
          v-model="activeSection"
          @select="navOpen = false"
        />
        <div class="admin-side__foot">
          <button type="button" class="admin-btn admin-btn--ghost" @click="refresh">
            刷新全部数据
          </button>
        </div>
      </aside>

      <main class="admin-work">
        <header class="admin-work__head">
          <div>
            <h1 class="admin-work__title">{{ currentMeta.title }}</h1>
            <p class="admin-work__desc">{{ currentMeta.desc }}</p>
          </div>
        </header>

        <p v-if="notice" class="admin-flash admin-flash--ok">{{ notice }}</p>
        <p v-if="error" class="admin-flash admin-flash--err">{{ error }}</p>

        <section v-if="activeSection === 'overview'" class="admin-panel">
          <h2 class="admin-panel__title">{{ t('admin.title') }}</h2>
          <p class="admin-panel__hint">
            手动访问 /admin；前台导航不展示入口。
          </p>
          <div class="admin-metrics">
            <div
              v-for="stat in overviewStats"
              :key="stat.label"
              class="admin-metric"
            >
              <p class="admin-metric__label">{{ stat.label }}</p>
              <p class="admin-metric__value">{{ stat.value }}</p>
              <p class="admin-metric__sub">{{ stat.sub }}</p>
            </div>
            <div class="admin-metric">
              <p class="admin-metric__label">版本</p>
              <p class="admin-metric__value" style="font-size: 1.05rem">
                {{ String(currentRelease?.imageTag ?? 'n/a') }}
              </p>
              <p class="admin-metric__sub">
                pkg {{ String(currentRelease?.packageVersion ?? 'n/a') }}
              </p>
            </div>
          </div>
        </section>

        <AdminConfigSection
          v-else-if="activeSection === 'config'"
          v-model:selected-module-id="selectedConfig"
          v-model:edit-text="configEdit"
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
          @create="createAcl"
          @remove="removeAcl"
        />

        <AdminHelpMenuSection
          v-else-if="activeSection === 'helpMenu'"
          v-model:draft="helpDraft"
          :module-ids="modules.map((m) => m.id)"
          @save="saveHelpMenu"
        />

        <AdminAuditSection
          v-else-if="activeSection === 'audit'"
          :events="audit"
        />
      </main>
    </div>
  </div>
</template>
