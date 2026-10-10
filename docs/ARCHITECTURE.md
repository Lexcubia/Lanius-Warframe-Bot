# 架构说明

> 产品设计细节以项目 Context 设计文档为准；本文是**仓库内**实现边界，供人类与 Agent 遵守。

## 1. 系统形态

```
 Warframe 官方数据（优先）+ 经标注的社区源（仅 API 层）
              │
              ▼
 ┌────────────────────────────────────┐
 │  apps/api — Lanius 自定义 API       │
 │  规范化 / 缓存 / 别名 / realm·locale │
 └─────────────┬──────────────────────┘
               │  HTTP（唯一业务入口）
       ┌───────┼──────────────┬────────────────┐
       ▼       ▼              ▼                ▼（后期）
  apps/bot   apps/web      apps/web         Tauri 2
  QQ 官方适配  公开查询站     /admin          桌面/移动
             （Nuxt / Vue 宿主）
```

三个**现期**部署进程：`lanius-api`、`lanius-bot`、`lanius-web`。  
后期 Tauri 客户端仍只调 Lanius API，**不**替代 QQ、**不**直连上游。

## 2. 目标 Monorepo 布局

```
lanius-warframe-bot/
├── apps/
│   ├── api/                 # Lanius 自定义 API 服务（@lanius/server，Hono + Zod + pino）
│   ├── bot/                 # QQ 官方适配
│   ├── web/                 # Nuxt 4：公开站 + /admin（当前 UI 宿主）
│   ├── desktop/             # 后期 Tauri 2 Windows（现不建）
│   └── mobile/              # 后期 Tauri 2 移动（现不建）
├── packages/
│   ├── core/                # DTO、Zod schema、别名、错误码、realm/locale
│   ├── api/                 # 可注入 baseUrl + fetch 的 Lanius HTTP 客户端（不默认 axios）
│   ├── ui/                  # Vue SFC / 与路由解耦的共享展示组件
│   ├── render/              # 图片模式：DTO → PNG/WebP
│   └── qq-official/         # 验签、事件、发文本/发图
├── config.example.yaml
├── config.local.yaml        # gitignore
├── docs/
│   └── TODO-TAURI.md        # Tauri 阶段 TODO（无脚手架）
├── .cursor/rules/
├── .cursor/skills/
├── AGENTS.md
└── README.md
```

**已落地：** `packages/core`、`packages/api`、`packages/ui`、`packages/render`、`packages/qq-official`、`apps/api`、`apps/bot`、`apps/web`。  
API：`/v1/health` · `/v1/meta` · `/v1/help` · `/v1/worldstate`。  
Web 与 QQ 卡片共用 `packages/ui` 视觉 token；市场/遗物/搜索端点与完整官方下行仍待后续。  
**禁止**在未立项时脚手架 Tauri。  
**Web 栈已锁定 Nuxt/Vue**；勿再引入 Next.js / React / shadcn / next-intl 作为 Web 默认。

## 3. 依赖规则

| 包 / 应用             | 可依赖                                                 | 禁止                                         |
| --------------------- | ------------------------------------------------------ | -------------------------------------------- |
| `packages/core`       | 无业务应用依赖                                         | 依赖 api/bot/web                             |
| `packages/api` (`@lanius/api`) | `core`；可注入 `fetch` / `baseUrl`              | 直连 WF 上游；默认 axios；仅能在 Nuxt server 工作 |
| `packages/ui`         | Vue 展示向依赖；**避免**硬绑 `vue-router` / `#app`       | React；假设 `window` 必存在且无适配           |
| `apps/api` (`@lanius/server`) | `core`；上游 HTTP 客户端                        | 依赖 bot/web；把 QQ SDK 塞进 API             |
| `apps/bot`            | `@lanius/api`；`qq-official`；可选 `render`            | 直连 WF 上游；依赖 Nuxt/Web                   |
| `apps/web`            | `@lanius/api` / `ui` + Nuxt 壳（SEO/BFF/cookie）       | 直连上游；依赖 bot 进程；默认 axios           |
| `qq-official`         | 仅 bot                                                 | 被 api/web 引用                              |
| `packages/render`     | bot（MVP）；可选 server 管理预览                       | 公开站直接渲染 QQ 卡片                       |

## 4. Tauri 可插拔（现期）

- **当前宿主**：Nuxt 4（Vue 3）。后期：**Tauri 2**（Windows 优先，移动另阶段）。
- Web 须：**响应式**、触控可用；业务 UI/API 调用倾向进 `packages/ui`（Vue）+ `packages/api`（fetch）。
- Nuxt 专有能力（SSR SEO、route middleware、Nitro BFF、HttpOnly cookie 桥）留在 `apps/web`。
- 清单：[TODO-TAURI.md](./TODO-TAURI.md)。Context 详案：`tauri-roadmap.md`。

## 5. 横切约定

| 项       | 约定                                       | MVP                      |
| -------- | ------------------------------------------ | ------------------------ |
| `realm`  | `international` \| `china`                 | 仅实现 international     |
| `locale` | `zh` \| `en`（`@nuxtjs/i18n`）             | 中英骨架                 |
| Web UI   | Nuxt UI + Tailwind；Lanius 主题            | 避免默认紫系 AI 审美     |
| HTTP     | `fetch` via `packages/api`                 | 不默认 axios             |
| 密钥     | `config.local.yaml` 和/或 DB               | 不以 env 为主存储        |
| QQ 回复  | `text` \| `image`                          | 均需支持；图片可降级文本 |
| Git      | 日常 → `develop`；发布 → `main` + `vX.Y.Z` | 二者禁直推 commit        |

## 6. 非目标（架构层）

- 非官方 QQ 协议栈
- QQ ↔ Web 运行时耦合
- 客户端旁路 Lanius API
- MVP 上线国服数据
- 多租户 / 多 IM 中台
- **现在**脚手架 Tauri / 另起桌面业务后端
- Web 侧 React / Next.js 默认栈

## 7. 相关文档

- [TODO-TAURI.md](./TODO-TAURI.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [VERSIONING.md](./VERSIONING.md)
- 根目录 [AGENTS.md](../AGENTS.md)
