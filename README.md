# Lanius-Warframe-Bot

面向腾讯**官方 QQ 机器人**的 Warframe 查询服务，配套公开查询站与管理后台。  
三者均为 **Lanius 自定义 API** 的独立客户端（运行时互不依赖）。

> 拼写：**Lanius**（不是 Lanuis）。

## 当前状态

已落地 API + Bot + Web 骨架：共享视觉 token（`packages/ui`）同时驱动公开站与 QQ 卡片图。

| 表面              | 路径                                          | MVP / 状态                                         |
| ----------------- | --------------------------------------------- | -------------------------------------------------- |
| Lanius API        | `apps/api`（Hono）                            | health / meta / help / worldstate（国际服）        |
| 共享契约          | `packages/core`                               | DTO / Zod / 错误码 / realm·locale                  |
| HTTP 客户端       | `packages/api`（`fetch`）              | health / meta / help / worldstate                  |
| 视觉 / UI         | `packages/ui`                                 | token + WorldstateBoard（Web）                     |
| QQ 卡片           | `packages/render`                        | worldstate PNG（与 Web 同色板）                    |
| QQ 官方封装       | `packages/qq-official`                        | 验签 + dry-run 发送                                |
| QQ 官方适配       | `apps/bot`                                    | 独立根命令 `/世界状态` `/入侵` `/午夜电波` `/模式` `/帮助`；文本+图片降级 |
| 公开站 + 管理壳   | `apps/web`（Nuxt）                            | 首页 / 世界状态 / 帮助 /admin；zh/en               |
| 桌面 / 移动       | Tauri 2（后期）                               | **现不脚手架**；见 `docs/TODO-TAURI.md`            |

## 本地运行

```bash
# 根目录 .npmrc 默认 registry.npmmirror.com（国内镜像）
pnpm install
cp config.example.yaml config.local.yaml   # 填入密钥；勿提交

# 三个进程可并行
pnpm dev:api    # http://127.0.0.1:8787
pnpm dev:bot    # http://127.0.0.1:8788  （默认 dryRun=true）
pnpm dev:web    # http://127.0.0.1:8790
```

API 试探：

```bash
curl "http://127.0.0.1:8787/v1/health"
curl "http://127.0.0.1:8787/v1/worldstate?realm=international&locale=zh"
curl "http://127.0.0.1:8787/v1/help"
```

Bot 本地回调（dry-run，无需真实签名时可先开 `bot.dryRun: true`）：

```bash
curl -X POST "http://127.0.0.1:8788/qq/callback" ^
  -H "content-type: application/json" ^
  -d "{\"d\":{\"content\":\"/世界状态\",\"channel_id\":\"dev\"}}"
```

指令为独立根（可选 `/`），详见公开站帮助页或 `GET /v1/help`。

```bash
pnpm test
pnpm typecheck
```

密钥放在 **`config.local.yaml` 和/或数据库**，不以环境变量为主存储。  
允许非密钥例外：`NODE_ENV`、`PORT` / `HOST`、`LANIUS_CONFIG`、`LANIUS_API_BASE`、`LANIUS_RUNTIME_CONFIG_ROOT`。

备案页脚、派系显示名等**可运行时覆盖**的内容：见 [`config/README.md`](./config/README.md)（`default/` 回退 + `local/` 覆盖，重启即生效）。

## 规范与 Agent 入口

| 文档 / 配置                                              | 说明                         |
| -------------------------------------------------------- | ---------------------------- |
| [AGENTS.md](./AGENTS.md)                                 | 给人类与 Agent 的总约束      |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)           | 架构边界与模块               |
| [docs/CODING_STANDARDS.md](./docs/CODING_STANDARDS.md)   | 编码、命名、注释率与 TSDoc   |
| [docs/COMMIT_CONVENTION.md](./docs/COMMIT_CONVENTION.md) | Conventional Commits + scope |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)           | 分支策略与 PR 流程           |
| [docs/VERSIONING.md](./docs/VERSIONING.md)               | SemVer、tag、发布流程        |
| [docs/DEPLOY.md](./docs/DEPLOY.md)                       | Docker / GHCR / 同域部署与 Fork 安全 CI |
| [docs/TODO-TAURI.md](./docs/TODO-TAURI.md)               | 后期 Tauri 2；现期 Web TODO  |
| [CHANGELOG.md](./CHANGELOG.md)                           | 版本变更记录                 |

### Git 模型（摘要）

- **`develop`**：日常集成；功能 PR 合入此处。
- **`main`**：发布归档（非日常集成）；发布时合并并打 tag `vX.Y.Z`。
- **`main` / `develop` 均禁止直接 commit**，只接受 merge / PR。

## 锁定原则（摘要）

1. QQ = 腾讯官方机器人；禁止 NapCat / go-cqhttp / AstrBot 等非官方协议。
2. 官方/社区上游数据 → **仅经 Lanius API** → QQ / 公开站 / 后台。
3. 客户端禁止直连 Warframe 上游；QQ ↔ Web 无运行时耦合。
4. MVP：国际服；`locale` 支持 zh/en；国服架构预留、MVP 不上线。
5. 品牌与产品名：**Lanius-Warframe-Bot**。

## License

见仓库后续声明；未声明前仅供本项目开发使用。
