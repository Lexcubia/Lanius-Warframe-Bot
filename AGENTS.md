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
   ┌────┼────────┬────────────┐
   QQ官方  公开站   管理后台   （后期）Tauri 桌面/移动
           Next 宿主
```

| 允许                                         | 禁止                                     |
| -------------------------------------------- | ---------------------------------------- |
| `apps/bot` / `apps/web` 只调 Lanius API      | 客户端直连 WF 上游或第三方原始接口       |
| `packages/core` 放 DTO / Zod / 别名 / 错误码 | 在 bot/web 内复制业务查询逻辑            |
| 规划 `packages/ui` + `api-client` 供多宿主   | 共享层写死仅 Next / 仅浏览器假设         |
| `packages/qq-official` 仅被 `apps/bot` 使用  | api/web 引用 QQ SDK                      |
| QQ 消息里放公开站 URL（可选导流）            | QQ 进程依赖 Web，或 Web 依赖 QQ 才能工作 |
| 现期 Web 做响应式与可插拔（见 TODO-TAURI）   | **现在**脚手架 Tauri 或桌面专用后端      |

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
- **后期**可考虑 Tauri 2（Windows + 移动）；**禁止擅自脚手架**。现期遵守 [docs/TODO-TAURI.md](./docs/TODO-TAURI.md) 与 `.cursor/rules/tauri-ui-pluggable.mdc`。

## 分支与版本（硬约束）

| 分支                                               | 角色                                                                   |
| -------------------------------------------------- | ---------------------------------------------------------------------- |
| **`develop`**                                      | **日常集成**目标：功能 / 修复 / 文档 PR 合入此处                       |
| **`main`**                                         | **发布归档**：仅接受发布相关合并；对应已发布快照，**不是**日常集成分支 |
| **`feature/*` · `fix/*` · `docs/*` · `release/*`** | 按职责的工作分支（平台若要求前缀如 `Lexcubia/…`，仍须能看出职责）      |

1. **禁止随意新建分支。** 需新建时：先**询问用户**；或使用用户/任务已指定的职责名。
2. **禁止**模糊名：`temp`、`wip`、`agent-1`、裸 `fix` 等。
3. 功能/工作完成后：PR **合并进 `develop`**（不是 `main`）。
4. **禁止向 `main` 直接 commit / push**；**禁止向 `develop` 直接 commit / push**——二者均只接受 **merge / PR**。Agent 只在职责分支上提交。
5. **发布**：自 `develop`（或 `release/x.y.z`）合并进 `main`，按 SemVer 打 tag **`vX.Y.Z`**，并更新 `CHANGELOG.md` 与根 `package.json` 版本。详见 [docs/VERSIONING.md](./docs/VERSIONING.md)。

分支细则：[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) §分支。

## 命名（硬约束）

- 变量 / 函数 / 类型名：**清晰、简洁、能描述职责**（duty-describing）。
- **禁止**冗长绕口、把说明文塞进标识符（如 `functionThatFetchesWorldstateFromOfficialApiAndCachesIt`）。
- **禁止**无意义名：`data`、`temp`、`foo`、`handleStuff`（除非极小局部且上下文已足够，仍优先具名）。
- 风格表见 [docs/CODING_STANDARDS.md](./docs/CODING_STANDARDS.md) §命名。

## 注释与文档（硬约束）

> 下列规则**优先于**旧的「尽量少写注释」表述。

1. **注释率目标 ≥ 80%**（对「需注释单元」的覆盖率，定义见 CODING_STANDARDS §注释率；禁止用空 `@param`、复述型废话刷比例）。
2. **所有函数**（含非导出）的**入参与返回值**须有**标准多行 TSDoc**（`@param` / `@returns`；有抛错约定时加 `@throws`）。格式见 CODING_STANDARDS。
3. 导出类型 / 类 / 重要常量：须有简述职责的文档注释。
4. 非平凡逻辑块（分支降级、协议、缓存、鉴权）：在块前用简短注释说明**项目内原因**。
5. TSDoc 主体用 **English**；行内业务说明可用中文或英文（单文件内统一）。
6. **禁止**把 Agent 对话、提示词、聊天记录、会话摘录写进注释或代码。注释**只描述项目与代码本身**。
7. Commit：`type(scope): subject`。见 [docs/COMMIT_CONVENTION.md](./docs/COMMIT_CONVENTION.md)。暂不强制 commitlint。

## 语言约定

| 场景                                   | 语言                   |
| -------------------------------------- | ---------------------- |
| 代码、标识符、API 字段（契约层）       | English                |
| 用户可见产品文案                       | zh / en（i18n）        |
| 仓库工程文档（`docs/`、README）        | 中文或中英短双语       |
| Commit subject / body                  | 中文或英文均可         |
| 函数 TSDoc（含 `@param` / `@returns`） | English                |
| 行内注释                               | 中文或英文；单文件统一 |

## 改代码前

1. 读本文件与 `docs/ARCHITECTURE.md`。
2. 遵守 `.cursor/rules/`（分支、注释、架构、密钥、QQ）。
3. 重复工作流优先跟 `.cursor/skills/`。
4. 不确定是否在范围内 → **缩小范围或不做**，不要擅自扩 scope。
5. 不在 `main` / `develop` 上直接提交；日常合入 `develop`；不擅自开无关分支。
