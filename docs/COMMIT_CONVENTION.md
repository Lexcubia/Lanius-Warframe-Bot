# Commit 规范

本仓库采用 [Conventional Commits](https://www.conventionalcommits.org/) 风格，并按 monorepo 范围加 `scope`。

## 格式

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

- **type**、**scope**、冒号后的 **subject**：必填（`scope` 在极少数全仓杂项可用 `repo`）。
- subject：**祈使句、现在时**；首字母小写（英文时）；不加句号；≤72 字符为宜。
- **中文或英文均可**（subject / body）；同一条 commit 内语言保持一致。
- body 写「为什么」，不写「改了哪些文件列表」（diff 已有）。

## Type

| type       | 用途                     |
| ---------- | ------------------------ |
| `feat`     | 新功能                   |
| `fix`      | 缺陷修复                 |
| `docs`     | 仅文档                   |
| `style`    | 格式/排版，不影响逻辑    |
| `refactor` | 重构，无功能/修复意图    |
| `perf`     | 性能                     |
| `test`     | 测试                     |
| `build`    | 构建、依赖、脚手架       |
| `ci`       | CI 配置                  |
| `chore`    | 杂务（工具、忽略规则等） |
| `revert`   | 回滚                     |

## Scope（本仓库）

| scope   | 对应                         |
| ------- | ---------------------------- |
| `api`   | `apps/api`                   |
| `bot`   | `apps/bot`                   |
| `web`   | `apps/web`（公开站与 admin） |
| `core`  | `packages/core`              |
| `qq`    | `packages/qq-official`       |
| `render`| `packages/render`            |
| `docs`  | `docs/`、README、AGENTS 等   |
| `repo`  | 根配置、gitignore、工具链    |
| `rules` | `.cursor/rules` / skills     |

一次改动跨多个包时：选**主影响面**一个 scope；确需强调多面可用 `feat(api): ...` 并在 body 注明触及 `bot`/`web`。避免 `feat(api,bot):` 这类多 scope 列表。

## 示例

**好：**

```
feat(api): add international worldstate endpoint
```

```
fix(bot): fall back to text when card render fails

官方发图上传超时时回落文本，避免群内无回复。
```

```
docs(repo): add commit and comment conventions
```

```
chore(repo): ignore config.local.yaml
```

**不好：**

```
update stuff
```

```
Fix Bug
```

```
feat: 做了很多改动（api bot web 全改了）
```

```
WIP
```

## Breaking change

破坏性变更在 footer 使用：

```
feat(api): rename market DTO fields

BREAKING CHANGE: `itemName` renamed to `name` in MarketItemDto.
```

或在 type 后加 `!`：`feat(api)!: rename market DTO fields`。

## 分支（与 commit 配合）

Commit 只应出现在**职责分支**（`feature/*` / `fix/*` / `docs/*` 等）上：

- 勿随意建分支；需新建时先问用户，或使用职责清晰的命名（见 [CONTRIBUTING.md](./CONTRIBUTING.md) §分支、[AGENTS.md](../AGENTS.md) §分支）。
- 日常完成后经 PR **合并进 `develop`**（集成）；**不要**把日常功能 PR 直接打向 `main`。
- **`main`** = 发布归档；**`develop`** = 日常集成。二者都 **只接受 merge / PR，禁止直推 commit**。
- 发布与 tag：见 [VERSIONING.md](./VERSIONING.md)。

## Agent / 自动化

- Cursor Agent 与本地手写 commit **均须**遵守本规范。
- 当前**不强制** commitlint/husky（避免在无 app 阶段过重）；靠文档、`AGENTS.md` 与 `.cursor/rules` 约束。日后若频繁违规，再轻量接入 commitlint。

## 相关

- [CONTRIBUTING.md](./CONTRIBUTING.md)（分支策略）
- [VERSIONING.md](./VERSIONING.md)（SemVer / tag / CHANGELOG）
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)（注释率、TSDoc、命名）
