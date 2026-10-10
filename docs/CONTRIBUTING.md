# 贡献指南

感谢参与 **Lanius-Warframe-Bot**。提交前请读 [AGENTS.md](../AGENTS.md) 与 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 开发环境（应用落地后）

1. Node.js 20+、pnpm
2. `pnpm install`
3. `cp config.example.yaml config.local.yaml`，填入本地密钥（勿提交）
4. 按 README 启动 `api` / `bot` / `web`

当前阶段仓库以**规范与工具链**为主；完整 monorepo 脚手架随后续 PR。

## 分支与 PR

1. 从 `main` 拉功能分支（团队约定前缀时请遵守）。
2. 保持 PR 聚焦：一次一件事（规范、API、Bot、Web 勿无必要混装）。
3. 草稿 PR 可用于早期讨论；就绪后标 Ready。
4. 描述中写清：动机、改动面、如何验证、是否触及密钥/QQ/区服。

## 范围检查清单

在打开 PR 前自问：

- [ ] 是否仍只通过 Lanius API 暴露业务数据？
- [ ] 是否引入了非官方 QQ 协议？（必须为否）
- [ ] 密钥是否仍在配置文件/DB，而非 env 主存储？
- [ ] MVP 是否误上线了国服数据路径？
- [ ] 拼写是否为 **Lanius**？
- [ ] 用户文案是否考虑 zh/en？

## 代码风格

- 遵循 [CODING_STANDARDS.md](./CODING_STANDARDS.md)。
- 格式化：Prettier；静态检查：ESLint（`pnpm lint` / `pnpm format` 在根 `package.json` 就绪后使用）。
- VS Code：安装 `.vscode/extensions.json` 推荐扩展。

## Agent / Cursor

- 规则：`.cursor/rules/`
- Skills：`.cursor/skills/`（新增 API 端点、QQ 命令、同步 WF 数据源等）
- 不要扩大产品非目标（见 AGENTS.md）。

## 安全报告

怀疑密钥泄露或配置被误提交：立刻轮换密钥，并从 git 历史中清除敏感文件（联系维护者）。
