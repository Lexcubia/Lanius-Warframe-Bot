# 贡献指南

感谢参与 **Lanius-Warframe-Bot**。提交前请读 [AGENTS.md](../AGENTS.md) 与 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 开发环境（应用落地后）

1. Node.js 20+、pnpm
2. `pnpm install`
3. `cp config.example.yaml config.local.yaml`，填入本地密钥（勿提交）
4. 按 README 启动 `api` / `bot` / `web`

当前已落地 API 垂直切片（`apps/api` + `packages/core` + `packages/api-client`）；QQ / Web 应用随后续 PR。

## 分支

```
feature/* | fix/* | docs/* | …
              ↓ PR
           develop          ← 日常集成
              ↓ 发布 PR（可选经 release/x.y.z）
            main            ← 归档 / 已发布
              ↓
          tag vX.Y.Z
```

硬约束（Agent 与人类相同）：

1. **不要随意新建分支。** 需新建时先征得用户同意；或沿用已指定的职责/工作流名。
2. 推荐命名：`feature/<duty>`、`fix/<duty>`、`docs/<duty>`、`release/x.y.z`。若平台要求前缀（如 `Lexcubia/repo-standards-4f3f`），仍须一眼看出职责。禁止 `temp` / `wip` / `agent-1`。
3. 日常开发在职责分支上 commit；完成后开 PR，**合并进 `develop`**（日常集成目标）。
4. **`main` 与 `develop` 均禁止直接 commit / push**——只接受 merge / PR。
5. **`main` 不是集成分支**：仅在发布时从 `develop`（或 `release/*`）合入，并打 SemVer tag。见 [VERSIONING.md](./VERSIONING.md)。

PR 要求：

- 默认目标分支：**`develop`**（发布 PR 目标为 `main`）。
- 保持聚焦：一次一件事。
- 草稿可用于早期讨论；就绪后标 Ready。
- 描述写清：动机、改动面、如何验证、是否触及密钥/QQ/区服。
- 有用户可感知变更时，更新 `CHANGELOG.md` 的 `[Unreleased]`。

## Commit 信息

遵循 [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md)：

- 格式：`type(scope): subject`（如 `fix(bot): …`、`docs(repo): …`）。
- subject 可用中文或英文；说明意图，避免 `update` / `WIP`。
- 暂不强制 commitlint；评审与 Agent 规则会按该文档检查。

## 版本与发布

见 [VERSIONING.md](./VERSIONING.md) 与根目录 [CHANGELOG.md](../CHANGELOG.md)。摘要：SemVer；tag `vX.Y.Z` 打在 `main`；发布时同步根 `package.json` 版本。

## 范围检查清单

在打开 PR 前自问：

- [ ] 目标分支是否正确？（日常 → `develop`；发布 → `main`）
- [ ] 是否误在 `main` / `develop` 上直接提交？
- [ ] 是否仍只通过 Lanius API 暴露业务数据？
- [ ] 是否引入了非官方 QQ 协议？（必须为否）
- [ ] 密钥是否仍在配置文件/DB，而非 env 主存储？
- [ ] MVP 是否误上线了国服数据路径？
- [ ] 拼写是否为 **Lanius**？
- [ ] 用户文案是否考虑 zh/en？
- [ ] 新增/改动函数是否具备完整 `@param` / `@returns` TSDoc？注释率是否达标？
- [ ] 注释中是否误含 Agent 对话？（必须为否）
- [ ] 用户可感知变更是否记入 `CHANGELOG.md` `[Unreleased]`？

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
