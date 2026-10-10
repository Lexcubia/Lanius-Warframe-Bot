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
         develop     ← 日常集成（未发布）
            |
       release/x.y.z  （可选：冻结与修发布缺陷）
            |
          main       ← 归档 / 已发布快照
            |
       tag vX.Y.Z
```

- **日常功能**合入 `develop`，**不**因每个 PR 打 tag。
- **发布**：从 `develop`（或 `release/x.y.z`）合并进 `main`，在 `main` 上打 **`vX.Y.Z`** annotated tag。
- Hotfix（已发布线上紧急修复）：从对应 tag / `main` 拉 `fix/...` → 合回 `main`（打 `vX.Y.Z+1` patch）**并**合回 `develop`，避免回归丢失。

## CHANGELOG

- 维护根目录 [CHANGELOG.md](../CHANGELOG.md)（[Keep a Changelog](https://keepachangelog.com/) 风格）。
- 每个**已发布**版本一节：`## [X.Y.Z] - YYYY-MM-DD`，下分 `Added` / `Changed` / `Fixed` / `Breaking`（按需）。
- `## [Unreleased]`：合入 `develop` 的变更先记在这里；发布时挪到对应版本节。
- 语言：中文或中英短句均可，写清用户/运维可感知的变化。

## 发布检查清单（简）

1. `develop` 稳定；`CHANGELOG` 的 Unreleased 已整理为 `X.Y.Z`。
2. 更新根 `package.json` `"version"` → `X.Y.Z`。
3. PR：`develop` → `main`（或经 `release/x.y.z`）。
4. 在 `main` 打 tag：`git tag -a vX.Y.Z -m "vX.Y.Z"` 并 push tag。
5. 确认 `main` 无额外直推 commit。

## 相关

- 分支策略：[CONTRIBUTING.md](./CONTRIBUTING.md)
- Agent 约束：[AGENTS.md](../AGENTS.md)
