# 版本与发布

本项目使用 **Semantic Versioning 2.0**（`MAJOR.MINOR.PATCH`），与 git 分支模型配合。

## 版本号含义

| 位        | 何时递增                                                | 示例              |
| --------- | ------------------------------------------------------- | ----------------- |
| **MAJOR** | 不兼容的 API / 协议 / 配置破坏性变更                    | `1.0.0` → `2.0.0` |
| **MINOR** | 向后兼容的功能（新查询、新命令、新管理能力）            | `0.1.0` → `0.2.0` |
| **PATCH** | 向后兼容的缺陷修复、文档/依赖安全补丁（不改变对外契约） | `0.2.0` → `0.2.1` |

预发布（可选）：`0.3.0-rc.1`；正式版去掉后缀。  
MVP / 未首发前可用 `0.y.z`（`0.x` 允许较积极的 MINOR 演进，但仍应在 CHANGELOG 写清破坏点）。

根目录 `package.json` 的 `"version"` 与即将打的 tag **保持一致**（monorepo 以根版本为产品发布号；各包若日后拆版本，另文说明——当前以**单一产品版本**为准）。

## 分支与版本的关系

```
feature/*  fix/*  docs/*  …
        \  |  /
         develop     ← 日常集成（未发布；不自动部署）
            |
       release/x.y.z  （可选：冻结某次发版）
            |
          main       ← 归档 / 已发布快照
            |
       tag vX.Y.Z    ← Actions：可选推 GHCR（不 SSH）
            |
         release     ← 长期「上线指针」；仅从 main tip 推进
                         push → Node：git + build + systemd
```

**硬顺序（唯一合法发版链）**：功能先合 **`develop`** → PR **`develop` → `main`** → 在 `main` 打 **`vX.Y.Z`** → 将 **`release` 快进/推到与 `main` tip（发版提交）一致**。

| 允许                                                              | 禁止                                          |
| ----------------------------------------------------------------- | --------------------------------------------- |
| `develop` → `main`（发布归档 PR）                                 | `develop` 直推 / 直合 **`release`**           |
| `main` tip → `release`（FF 或推 tip；上线）                       | 绕过 `main` 上线；从 feature 分支推 `release` |
| 发版后若 `main` 非 `develop` 祖先：PR **`main` → `develop`** 回灌 | 让 `develop` / `main` 长期分叉不处理          |

- **日常功能**合入 `develop`，**不**因每个 PR 打 tag，**不**自动部署。
- **发布归档**：`develop` → `main`；Actions 按 CHANGELOG 打 **`vX.Y.Z`**；`release.yml` **可选**推 GHCR（镜像交付降级为可选产物）。
- **上线 / 回退（默认）**：仅把长期分支 **`release`** 推进到 **`main` 上已打 tag 的提交**（或 Admin 选版 / `deploy/update-node.sh`）→ 宿主机 checkout tag → `pnpm build` → systemd 重启。
- **可选 Docker 路径**：`github.deployMode: docker` 或 deploy workflow 选 `docker` → `update-image.sh`（pull，不 rebuild）。
- Hotfix：从 tag / `main` 拉 `fix/...` → 合回 `main` 与 `develop`；需要上线时再推进 `release`（仍须经 `main`）。

## CHANGELOG

- 维护根目录 [CHANGELOG.md](../CHANGELOG.md)（[Keep a Changelog](https://keepachangelog.com/) 风格）。
- 每个**已发布**版本一节：`## [X.Y.Z] - YYYY-MM-DD`，下分 `Added` / `Changed` / `Fixed` / `Breaking`（按需）。
- `## [Unreleased]`：合入 `develop` 的变更先记在这里；**合入 `main` 前必须清空条目**，并新增对应版本节。
- 语言：中文或中英短句均可，写清用户/运维可感知的变化。
- 解析脚本：[scripts/changelog-release-version.mjs](../scripts/changelog-release-version.mjs)；工作流：[auto-tag-on-main.yml](../.github/workflows/auto-tag-on-main.yml)。

## 发布检查清单（简）

1. `develop` 稳定；把 `CHANGELOG` 的 Unreleased **提升**为 `## [X.Y.Z] - YYYY-MM-DD`（Unreleased 不留条目）。
2. 更新根 `package.json` `"version"` → `X.Y.Z`（必须与 CHANGELOG 最新节一致）；该 bump 经 PR 合入 **`develop`**。
3. PR：**`develop` → `main`**（或经可选冻结线 `release/x.y.z` 再进 `main`）。**禁止**跳过 `main`。
4. 合并进 `main` 后，`Auto tag on main` 自动：若 `vX.Y.Z` 尚不存在则打 tag，并 `workflow_call` → `Release`（可选推 GHCR，无预检）。
5. 将 **`release` 快进到 `main` tip**（与 tag 指向的发版提交一致；或 Admin / `update-node.sh vX.Y.Z`）完成 **Node** 上线；仅当仍用镜像时才需等 GHCR 就绪并走 `update-image.sh`。**禁止**从 `develop` 直推 `release`。
6. 若 `main` 合入产生了 `develop` 尚未包含的 merge 提交：立刻开 PR **`main` → `develop`**（或等价干净 merge）回灌，消除分叉。
7. 若该版本 tag 已存在（重复合入 / 无版本 bump），自动跳过打 tag；勿再手工重复打同一 tag（补推镜像可用 `Release` 的 `workflow_dispatch`）。

## 质量关卡

发版硬约束：**`develop` → `main` → `release`**（`release` 只跟 `main`，不做检查）。

- **本地**：husky + lint-staged 在 commit 前自动格式化与 lint 已暂存文件。
- **CI**：仅 PR→`develop`/`main` 与 push 同分支触发 `ci.yml`（轻量 install → test → typecheck；不装 Playwright）。**不**在 `release` 上跑检查。
- **Release**：`release.yml` 仅推 GHCR（无 test）；长期 `release` 分支只部署。

## 相关

- 分支策略：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 部署与 Fork 安全 CI：[DEPLOY.md](./DEPLOY.md)
- Agent 约束：[AGENTS.md](../AGENTS.md)
