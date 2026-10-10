# Lanius-Warframe-Bot

面向腾讯**官方 QQ 机器人**的 Warframe 查询服务，配套公开查询站与管理后台。  
三者均为 **Lanius 自定义 API** 的独立客户端（运行时互不依赖）。

> 拼写：**Lanius**（不是 Lanuis）。

## 当前状态

本仓库已落地 **工程规范 / Cursor 规则与 Skills / IDE 配置**。  
应用代码（API、QQ 适配、Next.js Web）按里程碑后续实现，**尚未脚手架完整 monorepo**。

| 表面              | 计划路径           | MVP                 |
| ----------------- | ------------------ | ------------------- |
| Lanius API        | `apps/api`         | 国际服查询          |
| QQ 官方适配       | `apps/bot`         | 文本 + 图片回复     |
| 公开站 + 管理后台 | `apps/web`         | 国际服 + zh/en 骨架 |
| 共享契约          | `packages/core` 等 | DTO / 别名 / 错误码 |

## 本地运行（后续）

应用落地后预期流程：

```bash
pnpm install
cp config.example.yaml config.local.yaml   # 填入密钥；勿提交
pnpm --filter @lanius/api dev              # API
pnpm --filter @lanius/bot dev              # QQ 适配
pnpm --filter @lanius/web dev              # Web
```

密钥放在 **`config.local.yaml` 和/或数据库**，不以环境变量为主存储。  
允许非密钥例外：`NODE_ENV`、`PORT`、配置文件路径覆盖（如 `LANIUS_CONFIG`）。

## 规范与 Agent 入口

| 文档 / 配置                                              | 说明                         |
| -------------------------------------------------------- | ---------------------------- |
| [AGENTS.md](./AGENTS.md)                                 | 给人类与 Agent 的总约束      |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)           | 架构边界与模块               |
| [docs/CODING_STANDARDS.md](./docs/CODING_STANDARDS.md)   | 编码、命名、注释率与 TSDoc   |
| [docs/COMMIT_CONVENTION.md](./docs/COMMIT_CONVENTION.md) | Conventional Commits + scope |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)           | 分支策略与 PR 流程           |
| [docs/VERSIONING.md](./docs/VERSIONING.md)               | SemVer、tag、发布流程        |
| [CHANGELOG.md](./CHANGELOG.md)                           | 版本变更记录                 |
| `.cursor/rules/`                                         | Cursor 项目规则              |
| `.cursor/skills/`                                        | 可复用工作流 Skills          |
| `.vscode/`                                               | 推荐扩展与编辑器设置         |

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
