# 部署指南（Docker + GHCR + 开源 Fork 安全）

本文说明如何将 **Lanius-Warframe-Bot** 以 Docker 形式部署到自有服务器，域名示例：`warframe.xxxx.com`（Web 与 API 同域）。

## 架构摘要

```
Internet
   │
   ▼
 Caddy (:80/:443)          ← deploy/Caddyfile
   ├─ /qq/*  → bot:8788
   └─ /*     → web:8790
                 └─ /api/lanius/*  --Nitro-->  api:8787（compose 内网）
```

| 服务  | 镜像（GHCR）                                              | 说明                          |
| ----- | --------------------------------------------------------- | ----------------------------- |
| api   | `ghcr.io/lexcubia/lanius-warframe-bot/api:<tag>`          | Lanius 业务 API               |
| web   | `ghcr.io/lexcubia/lanius-warframe-bot/web:<tag>`          | Nuxt 公开站 + `/api/lanius`   |
| bot   | `ghcr.io/lexcubia/lanius-warframe-bot/bot:<tag>`          | QQ 官方回调                   |
| caddy | `caddy:2.9-alpine`                                        | TLS 与同域路由                |

密钥只通过服务器上的 **`config.local.yaml` 挂载**进入 api/bot，**永不写入镜像**。

运行时展示配置（备案页脚、派系名等）走 **`config/default` + `config/local`**（见 [config/README.md](../config/README.md)）：改 YAML 后重启 api 容器即可，不必重发镜像。真实备案号只写 `config/local/`（gitignore）。

## 发布流程（维护者）

与 [VERSIONING.md](./VERSIONING.md) 对齐：

1. 功能 PR → `develop`（仅跑 [ci.yml](../.github/workflows/ci.yml)）。
2. 发布 PR：整理 `CHANGELOG`（Unreleased → `## [X.Y.Z] - 日期`）并同步根 `package.json` version → 合入 `main`。
3. [auto-tag-on-main.yml](../.github/workflows/auto-tag-on-main.yml) 自动读取 CHANGELOG 最新版本节，打 `vX.Y.Z`（若尚不存在）。
4. 同一次流水线经 `workflow_call` 调用 [release.yml](../.github/workflows/release.yml)：测试 → 构建三镜像 → 推 GHCR → SSH 到服务器 `docker compose pull && up -d`。
5. 回滚：将服务器 `IMAGE_TAG` 设为上一版本后重新 `pull && up`，或在 Actions 对 `Release` 使用 `workflow_dispatch` 指定旧 tag。

> 说明：用 `GITHUB_TOKEN` 推送的 tag **不会**再触发其它 workflow，因此发版由 auto-tag **显式调用** Release，而不是只靠 `push: tags`。手工 `git push origin vX.Y.Z` 仍可触发 Release。

## Fork / 开源安全（必读）

本仓库是开源的。流水线刻意拆成两条，避免 fork 影响你的生产：

| Workflow       | 谁能触发                         | Secrets | 行为           |
| -------------- | -------------------------------- | ------- | -------------- |
| `ci.yml`       | 任意 PR（含 fork）、push develop/main | **无**  | 安装 / 测试 / 类型检查 |
| `release.yml`  | **仅**本仓库 `v*` tag（或维护者手动） | GHCR + 部署 | 推镜像 + SSH 部署 |

硬规则：

1. **禁止**用 `pull_request_target` 做构建或部署。
2. `release.yml` 每个敏感 job 带  
   `if: github.repository == 'Lexcubia/Lanius-Warframe-Bot'`。
3. 部署 secrets 只挂在 GitHub Environment **`production`**，不出现在 `ci.yml`。
4. `ci.yml` 的 `permissions` 仅 `contents: read`；`packages: write` 只在 `release.yml`。
5. 贡献者 **无需**也不应配置任何部署密钥；fork 上的 Actions 跑的是他们自己的副本，碰不到你的 Environment。

### 仓库 Settings 建议（人工一次）

- **Actions → General → Fork pull request workflows from outside collaborators**：不要向 fork workflow 提供 secrets（保持默认）。
- 可选：**Require approval for first-time contributors**。
- **Actions permissions**：不要默认 `Read and write` 给所有 workflow；依赖各 yaml 内声明的 permissions。
- **Environments → production**：放入下列 secrets；可选加 required reviewers。
- **Branch protection**：`main` / `develop` 禁直推，必经 PR；可要求 CI 通过。

### Environment `production` secrets

| Name             | 含义                                      |
| ---------------- | ----------------------------------------- |
| `DEPLOY_HOST`    | 服务器主机名或 IP                         |
| `DEPLOY_USER`    | SSH 用户                                  |
| `DEPLOY_SSH_KEY` | 部署用私钥（整段 PEM）                    |
| `DEPLOY_PORT`    | SSH 端口（可选，默认 22）                 |
| `DEPLOY_PATH`    | 服务器上 `deploy/` 目录绝对路径           |

GHCR 推送使用 `GITHUB_TOKEN`（workflow 内 `packages: write`），无需额外 PAT（除非你改用其它 registry）。

## 服务器首次安装

1. 安装 Docker Engine + Compose 插件。
2. 创建目录并放入编排文件（从发布 tag / 仓库 `deploy/` 复制）：

   ```bash
   mkdir -p /opt/lanius && cd /opt/lanius
   # 放入 docker-compose.yml、Caddyfile、.env、config.local.yaml
   ```

3. 从仓库根 `config.example.yaml` 复制为 `config.local.yaml`，填入 QQ / admin 等密钥；生产建议：

   - `bot.dryRun: false`（确认回调与发信就绪后）
   - `bot.publicSiteBaseUrl` 可被 compose 的 `PUBLIC_SITE_BASE_URL` 覆盖
   - `api.host` / `bot.host` 可保持 `127.0.0.1`；容器内由 `HOST=0.0.0.0` 覆盖

4. 复制 [deploy/.env.example](../deploy/.env.example) 为 `.env`：

   ```env
   DOMAIN=warframe.xxxx.com
   PUBLIC_SITE_BASE_URL=https://warframe.xxxx.com
   IMAGE_TAG=v0.1.0
   GHCR_IMAGE_PREFIX=ghcr.io/lexcubia/lanius-warframe-bot
   LANIUS_CONFIG_FILE=./config.local.yaml
   ```

5. DNS：将 `DOMAIN` A/AAAA 指到服务器；Caddy 自动申请证书。

6. 若 GHCR 包为 private，先在服务器：

   ```bash
   echo "$GHCR_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
   ```

   公开包可跳过登录。

7. 启动：

   ```bash
   cd /opt/lanius
   docker compose pull
   docker compose up -d
   docker compose ps
   curl -fsS "https://$DOMAIN/api/lanius/v1/health"
   ```

## 本地构建镜像（可选）

在仓库根目录：

```bash
docker build -f apps/api/Dockerfile -t lanius-api:local .
docker build -f apps/web/Dockerfile -t lanius-web:local .
docker build -f apps/bot/Dockerfile -t lanius-bot:local .
```

自托管用户可不依赖官方 GHCR：改 `deploy/docker-compose.yml` 的 `image:` 或增加 `build:` 段后本地 `compose up --build`。

## 同域与 QQ 回调

- 浏览器只访问 `https://warframe.xxxx.com`；业务 API 经 Web 的 `/api/lanius/*` 代理到内网 `api:8787`。
- QQ 开放平台回调 URL 示例：`https://warframe.xxxx.com/qq/callback`（与 `qq.callbackPath` 一致）。
- **不要**把 api 端口直接暴露到公网（compose 仅 `expose`，由 Caddy/web 进入）。

## 回滚

```bash
cd /opt/lanius
# 编辑 .env：IMAGE_TAG=v0.0.9
docker compose pull
docker compose up -d
```

## 相关文档

- [VERSIONING.md](./VERSIONING.md) — SemVer 与 tag
- [ARCHITECTURE.md](./ARCHITECTURE.md) — 进程边界
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 分支与 PR
- 根 [README.md](../README.md) — 本地开发
