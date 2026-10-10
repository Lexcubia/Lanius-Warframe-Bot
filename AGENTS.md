# AGENTS.md — Lanius-Warframe-Bot

给 Cursor Agent 与贡献者的**项目级硬约束**。细则见 `docs/` 与 `.cursor/rules/`。

## 产品身份

- 正式名称：**Lanius-Warframe-Bot**（拼写 **Lanius**，不是 Lanuis）。
- 对外文案、仓库、包名、品牌以 Lanius 为准。

## 架构边界（勿打破）

```
Warframe 官方数据（及经文档标注的社区源）
        ↓
  Lanius 自定义 API（唯一业务入口）
        ↓
   ┌────┼────────┐
   QQ官方  公开站   管理后台
```

| 允许                                         | 禁止                                     |
| -------------------------------------------- | ---------------------------------------- |
| `apps/bot` / `apps/web` 只调 Lanius API      | 客户端直连 WF 上游或第三方原始接口       |
| `packages/core` 放 DTO / Zod / 别名 / 错误码 | 在 bot/web 内复制业务查询逻辑            |
| `packages/qq-official` 仅被 `apps/bot` 使用  | api/web 引用 QQ SDK                      |
| QQ 消息里放公开站 URL（可选导流）            | QQ 进程依赖 Web，或 Web 依赖 QQ 才能工作 |

## QQ 通道

- **仅**腾讯官方 QQ 机器人开放平台。
- **禁止** NapCat、go-cqhttp、Lagrange、AstrBot 桥接等非官方协议。
- 回复模式：文本 + 图片；图片失败应降级文本。

## 密钥

- 主存放：**配置文件**（`config.local.yaml`）和/或 **数据库**。
- **不以环境变量为主存储**密钥/口令。
- 可提交 `config.example.yaml`（无真实密钥）；`config.local.*` 必须 gitignore。
- 口令只存哈希（argon2/bcrypt），不存明文。

## 范围与 MVP

- MVP：`realm=international`；国服仅预留类型/路由，不上线数据。
- i18n：`locale=zh|en`；产品面向用户的文案可中英；代码标识符用英文。
- **不要发明范围**：不做玩家账号、交易撮合、全量百科镜像、多 IM 中台、多租户 SaaS。

## 语言约定

| 场景                                                    | 语言                     |
| ------------------------------------------------------- | ------------------------ |
| 代码、标识符、API 字段（契约层）                        | English                  |
| 用户可见产品文案（QQ 回复、Web UI、错误消息键对应文案） | zh / en（i18n）          |
| 仓库工程文档（`docs/`、README）                         | 中文或中英短双语         |
| Commit subject / body                                   | 中文或英文均可；见下节   |
| 导出 API 的 TSDoc                                       | English                  |
| 行内注释                                                | 中文或英文；单文件内统一 |

## Commit 与注释

- Commit：`type(scope): subject`（Conventional Commits）。scope 示例：`api` / `bot` / `web` / `core` / `docs` / `repo` / `rules`。详见 [docs/COMMIT_CONVENTION.md](./docs/COMMIT_CONVENTION.md)。
- 注释：少写、写「为什么」；公共导出用英文 TSDoc；禁止噪音注释与裸 `TODO`。详见 [docs/CODING_STANDARDS.md](./docs/CODING_STANDARDS.md) §注释。
- 当前不强制 commitlint/husky；Agent 与人工提交均须自觉遵守。

## 改代码前

1. 读本文件与 `docs/ARCHITECTURE.md`。
2. 涉及 QQ / API / Web 时遵守对应 `.cursor/rules/`。
3. 重复工作流优先跟 `.cursor/skills/`。
4. 不确定是否在范围内 → **缩小范围或不做**，不要擅自扩 scope。
