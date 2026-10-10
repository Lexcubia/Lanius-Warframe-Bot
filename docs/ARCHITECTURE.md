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
       ┌───────┼──────────────┐
       ▼       ▼              ▼
  apps/bot   apps/web        apps/web
  QQ 官方适配  公开查询站       /admin 管理后台
```

三个部署进程独立扩缩：`lanius-api`、`lanius-bot`、`lanius-web`。

## 2. 目标 Monorepo 布局

```
lanius-warframe-bot/
├── apps/
│   ├── api/                 # Lanius 自定义 API（Hono + Zod + pino）
│   ├── bot/                 # QQ 官方适配
│   └── web/                 # Next.js：公开站 + /admin
├── packages/
│   ├── core/                # DTO、Zod schema、别名、错误码、realm/locale
│   ├── card-render/         # 图片模式：DTO → PNG/WebP
│   └── qq-official/         # 验签、事件、发文本/发图
├── config.example.yaml
├── config.local.yaml        # gitignore
├── docs/
├── .cursor/rules/
├── .cursor/skills/
├── AGENTS.md
└── README.md
```

当前仓库可能尚未创建 `apps/` / `packages/`；布局是约定，实现时按此落地。

## 3. 依赖规则

| 包 / 应用       | 可依赖                                                | 禁止                             |
| --------------- | ----------------------------------------------------- | -------------------------------- |
| `packages/core` | 无业务应用依赖                                        | 依赖 api/bot/web                 |
| `apps/api`      | `core`；上游 HTTP 客户端                              | 依赖 bot/web；把 QQ SDK 塞进 API |
| `apps/bot`      | API 的 HTTP 客户端；`qq-official`；可选 `card-render` | 直连 WF 上游；依赖 Next          |
| `apps/web`      | API 的 HTTP 客户端；共享类型                          | 直连上游；依赖 bot 进程          |
| `qq-official`   | 仅 bot                                                | 被 api/web 引用                  |
| `card-render`   | bot（MVP）；可选 api 管理预览                         | 公开站直接渲染 QQ 卡片           |

## 4. 横切约定

| 项       | 约定                         | MVP                      |
| -------- | ---------------------------- | ------------------------ |
| `realm`  | `international` \| `china`   | 仅实现 international     |
| `locale` | `zh` \| `en`                 | 中英骨架                 |
| 密钥     | `config.local.yaml` 和/或 DB | 不以 env 为主存储        |
| QQ 回复  | `text` \| `image`            | 均需支持；图片可降级文本 |

## 5. 非目标（架构层）

- 非官方 QQ 协议栈
- QQ ↔ Web 运行时耦合
- 客户端旁路 Lanius API
- MVP 上线国服数据
- 多租户 / 多 IM 中台

## 6. 相关文档

- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- 根目录 [AGENTS.md](../AGENTS.md)
