# 部署指南（开源：手动 + Docker）

Lanius 面向社区自托管。生产推荐 **Docker 单容器 `lanius-app` + 旁路 Caddy**；也可用纯 Node 手动部署。

## 架构摘要

```
Internet
   │
   ▼
 Caddy (:80/:443)                 ← deploy/Caddyfile.app
   ├─ /qq/*           → lanius-app:8788
   ├─ /api/lanius/*   → lanius-app:8787
   └─ /*              → lanius-app:8790
                              └─ 内嵌 Redis + SQLite(/data)
```

配置：`config/default`（回退）+ `config/local`（可写，Admin 热更新）。见 [config/README.md](../config/README.md)。

## 发版与自动部署（维护者）

| 事件 | 行为 |
| --- | --- |
| PR / `develop` | 仅 [ci.yml](../.github/workflows/ci.yml) |
| tag `v*` / `main` auto-tag | [release.yml](../.github/workflows/release.yml)：测试 + **推 GHCR**（含 `lanius-app`），**不 SSH** |
| 长期分支 **`release`** push | [deploy-release.yml](../.github/workflows/deploy-release.yml)：SSH → **`update-image.sh`（pull + up，禁止 build）** |
| Admin「版本」 | 拉 GitHub Releases/tags，同样走 pull 换版 |

约定：先确保 GHCR 上已有对应 tag 镜像，再更新 `release` 分支或 Admin 选版。

Fork 安全：部署 / 推包 job 限制 `github.repository == Lexcubia/Lanius-Warframe-Bot`；`ci.yml` 无 secrets。

### Environment `production` secrets（仅 deploy-release）

| Name | 含义 |
| --- | --- |
| `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY` | SSH |
| `DEPLOY_PORT` | 可选，默认 22 |
| `DEPLOY_PATH` | 服务器上 `deploy/` 绝对路径 |

---

## A. 手动部署（无 Docker）

适合开发机或小型 VPS。

1. 安装 **Node ≥ 20**、**pnpm 9**；可选 Redis；Bot 出图需 Playwright Chromium。
2. Clone 并检出版本：

   ```bash
   git clone https://github.com/Lexcubia/Lanius-Warframe-Bot.git /opt/lanius/repo
   cd /opt/lanius/repo
   git checkout v0.2.0
   ```

3. 配置：

   ```bash
   cp config/local/admin.yaml.example config/local/admin.yaml
   cp config/local/api.yaml.example config/local/api.yaml
   cp config/local/qq.yaml.example config/local/qq.yaml
   # 编辑口令哈希、adminToken、QQ 凭据等
   ```

4. 安装与构建：

   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter @lanius/render exec playwright install chromium
   pnpm build
   ```

5. 启动（三进程，可用 systemd）：

   ```bash
   pnpm --filter @lanius/server start   # :8787
   pnpm --filter @lanius/bot start      # :8788
   # web：pnpm --filter @lanius/web build && node apps/web/.output/server/index.mjs  # :8790
   ```

6. 反代：`/qq`→8788，`/api/lanius`→8787，`/`→8790。  
7. 升级：`git fetch && git checkout vX.Y.Z && pnpm install && pnpm build` 后重启进程。配置项优先在 Admin 改（热加载）。

systemd 单元示例可放在 `deploy/systemd/`（按需复制）。

---

## B. Docker 部署（推荐）

### 首次安装

1. 安装 Docker Engine + Compose；国内建议配置镜像加速。
2. 准备目录与密钥（**密钥在 git 工作树外**）：

   ```bash
   mkdir -p /opt/lanius/secrets /opt/lanius/data
   git clone https://github.com/Lexcubia/Lanius-Warframe-Bot.git /opt/lanius/repo
   cd /opt/lanius/repo
   git checkout v0.2.0   # 或 release 分支
   # 填写 config/local/*.yaml（或仍用单体 secrets 文件，见下）
   cp deploy/.env.example deploy/.env
   ```

3. `deploy/.env` 示例：

   ```env
   DOMAIN=warframe.xxxx.com
   PUBLIC_SITE_BASE_URL=https://warframe.xxxx.com
   IMAGE_TAG=v0.2.0
   GHCR_IMAGE_PREFIX=ghcr.io/lexcubia/lanius-warframe-bot
   LANIUS_CONFIG_DEFAULT=/opt/lanius/repo/config/default
   LANIUS_CONFIG_LOCAL=/opt/lanius/repo/config/local
   LANIUS_CONFIG_FILE=/opt/lanius/secrets/config.local.yaml
   ```

4. Playwright（Bot 出图）：

   ```bash
   bash /opt/lanius/repo/deploy/prepare-playwright.sh
   ```

5. 启动（优先 pull，避免每次重建）：

   ```bash
   cd /opt/lanius/repo/deploy
   export IMAGE_TAG=v0.2.0
   docker compose -f docker-compose.app.yml pull
   docker compose -f docker-compose.app.yml up -d
   ```

   若 GHCR 拉取过慢，可首次 `docker compose -f docker-compose.app.yml build`，之后日常仍用 pull。

6. DNS 指向服务器；Caddy 申请证书。

### 日常更新 / 回退（不 rebuild）

```bash
cd /opt/lanius/repo/deploy
bash ./update-image.sh v0.2.1
```

或：将 `release` 分支推进到目标版本（Actions 自动 pull），或在 **Admin → 版本** 选择 tag。

Admin 自动执行需可选挂载 `docker.sock`（见 `docker-compose.app.yml` 注释；有安全风险，默认关闭）。

### 配置热更新

在 `/admin` 编辑模块配置并保存 → 写入 `config/local` → API/Bot 进程内重载。  
更改监听端口 / Redis URL / SQLite 路径后需重启容器或进程。

---

## 安全提示

- 勿将 `config/local`、`config.local.yaml`、真实口令提交进 git。
- 生产 `admin.passwordHash` 使用 bcrypt；`plain:` 仅本地。
- 不要把 API/Bot 端口直接暴露公网；经 Caddy 反代。
