# 贡献指南

感谢参与 **Lanius-Warframe-Bot**。提交前请读 [AGENTS.md](../AGENTS.md) 与 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 开发环境（应用落地后）

1. Node.js 20+、pnpm
2. `pnpm install`
3. `cp config.example.yaml config.local.yaml`，填入本地密钥（勿提交）
4. 按 README 启动 `api` / `bot` / `web`

当前阶段仓库以**规范与工具链**为主；完整 monorepo 脚手架随后续 PR。

## 分支

硬约束（Agent 与人类相同）：

1. **不要随意新建分支。** 需要新分支时：先征得用户同意；或按已指定的**职责/工作流**命名并沿用（例：`Lexcubia/repo-standards-4f3f`、`Lexcubia/api-worldstate-4f3f`）。
2. 分支名须能看出职责；禁止 `temp` / `wip` / `fix` / `agent-1` 等模糊名。
3. 日常开发在职责分支上 commit；完成后开 PR，**合并进主开发分支 `main`**。
4. **`main` 只接受合并，禁止直接在 `main` 上 commit 或 push。**

PR 要求：

- 保持聚焦：一次一件事（规范、API、Bot、Web 勿无必要混装）。
- 草稿可用于早期讨论；就绪后标 Ready。
- 描述写清：动机、改动面、如何验证、是否触及密钥/QQ/区服。

## Commit 信息

遵循 [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)：

- 格式：`type(scope): subject`（如 `fix(bot): …`、`docs(repo): …`）。
- subject 可用中文或英文；说明意图，避免 `update` / `WIP`。
- 暂不强制 commitlint；评审与 Agent 规则会按该文档检查。

## 范围检查清单

在打开 PR 前自问：

- [ ] 是否仍只通过 Lanius API 暴露业务数据？
- [ ] 是否引入了非官方 QQ 协议？（必须为否）
- [ ] 密钥是否仍在配置文件/DB，而非 env 主存储？
- [ ] MVP 是否误上线了国服数据路径？
- [ ] 拼写是否为 **Lanius**？
- [ ] 用户文案是否考虑 zh/en？
- [ ] 是否误在 `main` 上直接提交？
- [ ] 新增/改动函数是否具备完整 `@param` / `@returns` TSDoc？注释率是否达标？
- [ ] 注释中是否误含 Agent 对话？（必须为否）

## 代码风格

- 遵循 [CODING_STANDARDS.md](./CODING_STANDARDS.md)：
  - 命名清晰简洁、描述职责；
  - 注释率 ≥ 80%（定义见该文档）；
  - 全部函数多行 TSDoc（入参/出参）；
  - 禁止 Agent 对话进注释。
- 格式化：Prettier；静态检查：ESLint（`pnpm lint` / `pnpm format`）。
- VS Code：安装 `.vscode/extensions.json` 推荐扩展。

## Agent / Cursor

- 规则：`.cursor/rules/`（含 `git-branches.mdc`、`commit-and-comments.mdc`）
- Skills：`.cursor/skills/`（新增 API 端点、QQ 命令、同步 WF 数据源等）
- 不要扩大产品非目标（见 AGENTS.md）。

## 安全报告

怀疑密钥泄露或配置被误提交：立刻轮换密钥，并从 git 历史中清除敏感文件（联系维护者）。
