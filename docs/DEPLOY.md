# 部署指南（生产默认：Node + systemd）

Lanius 面向社区自托管。**生产默认**为：git checkout/tag → `pnpm build` → **Node 进程**（systemd）+ 旁路 Caddy。  
Docker 单容器 `lanius-app` 仍可用，但已降级为**可选**路径（见文末 §B）。

## 架构摘要

```
Internet
   │
   ▼
 Caddy (:80/:443)                 ← deploy/Caddyfile.node（系统 Caddy）
   ├─ /qq/*           → 127.0.0.1:8788   (lanius-bot)
   ├─ /api/lanius/*   → 127.0.0.1:8787   (lanius-api，strip 前缀)
   └─ /*              → 127.0.0.1:8790   (lanius-web Nitro .output)
                              ├─ Redis（本机 redis-server，可选）
                              └─ SQLite（config database.sqlitePath）
```

配置：`config/default`（回退）+ `config/local`（可写，Admin 热更新）。见 [config/README.md](../config/README.md)。  
**密钥只放配置文件/DB**，不要写进仓库或环境变量主存储。

## 发版与自动部署（维护者）

| 事件                             | 行为                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PR→`develop`/`main`、push 同分支 | [ci.yml](../.github/workflows/ci.yml)：轻量 install + test + typecheck（**不装 Playwright**）        |
| tag `v*` / `main` auto-tag       | [release.yml](../.github/workflows/release.yml)：推 **GHCR（可选镜像产物）**，无检查、**不 SSH**     |
| 长期分支 **`release`** push      | **跳过 CI**；仅 [deploy-release.yml](../.github/workflows/deploy-release.yml) 部署（默认容器热启动） |
| Admin「版本」                    | 默认执行 `update-node.sh`；`github.deployMode: docker` 时才走镜像                                    |

约定：先在 `main` 打好 SemVer tag，再推进 `release` 分支（或 Admin 选版）完成上线。  
旧「仅 pull GHCR、禁止 build」流程已降级：仅当显式选 `docker` 运行时使用。

Fork 安全：部署 / 推包 job 限制 `github.repository == Lexcubia/Lanius-Warframe-Bot`；`ci.yml` 无 secrets。

### Environment `production` secrets（deploy-release）

| Name                                             | 含义                                                        |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY` | SSH                                                         |
| `DEPLOY_PORT`                                    | 可选，默认 22                                               |
| `DEPLOY_PATH`                                    | 服务器上 `deploy/` 绝对路径（如 `/opt/lanius/repo/deploy`） |

---

## A. Node 生产部署（推荐默认）

适合 VPS / 裸机。三进程：**API `dist`**、**Bot `dist`**、**Web Nuxt/Nitro `.output`**（**禁止**生产用 `nuxt dev`）。

### A.1 首次安装

1. 安装 **Node ≥ 20**、**pnpm 9**（建议 `corepack enable`）、**Caddy**、可选 **Redis**；系统用户建议专用账号 `lanius`。
2. Clone 并检出版本：

   ```bash
   sudo mkdir -p /opt/lanius && sudo chown "$USER":"$USER" /opt/lanius
   git clone https://github.com/Lexcubia/Lanius-Warframe-Bot.git /opt/lanius/repo
   cd /opt/lanius/repo
   git checkout v0.3.0   # 换成目标 tag
   ```

3. 配置（密钥仅写 local，勿提交）：

   ```bash
   cp config/local/admin.yaml.example config/local/admin.yaml
   cp config/local/api.yaml.example config/local/api.yaml
   cp config/local/qq.yaml.example config/local/qq.yaml
   cp config/local/redis.yaml.example config/local/redis.yaml
   # 编辑口令哈希、adminToken、QQ 凭据、redis.url、sqlitePath 等
   mkdir -p /opt/lanius/data
   # 建议 config/local/database.yaml：
   #   sqlitePath: '/opt/lanius/data/lanius.sqlite'
   ```

4. Redis（推荐；空 `redis.url` 则内存缓存）：

   ```bash
   # Debian/Ubuntu 示例
   sudo apt-get install -y redis-server
   sudo systemctl enable --now redis-server
   # config/local/redis.yaml → url: 'redis://127.0.0.1:6379'
   ```

5. 安装依赖、Playwright、构建：

   ```bash
   cd /opt/lanius/repo
   pnpm install --frozen-lockfile
   bash deploy/prepare-playwright.sh   # 默认 native；浏览器进 /opt/lanius/ms-playwright
   pnpm --filter @lanius/render build:card-host
   pnpm build
   pnpm --filter @lanius/web build
   # 确认存在：
   #   apps/api/dist/index.js
   #   apps/bot/dist/index.js
   #   apps/web/.output/server/index.mjs
   ```

6. 安装 systemd 单元并启动：

   ```bash
   sudo bash deploy/install-node-services.sh
   sudo systemctl start lanius.target
   curl -fsS http://127.0.0.1:8787/v1/health
   ```

   若希望 **Admin 选版** 能从 `lanius` 用户触发重启，配置受限 sudoers（勿放开任意命令）：

   ```text
   # /etc/sudoers.d/lanius-deploy
   lanius ALL=(root) NOPASSWD: /bin/systemctl restart lanius-api.service, /bin/systemctl restart lanius-bot.service, /bin/systemctl restart lanius-web.service, /bin/systemctl start lanius.target
   ```

   无 sudo 时 Admin 会返回手动执行 `update-node.sh` 的指引。

7. Caddy（系统安装，非容器）：

   ```bash
   export DOMAIN=warframe.example.com
   # 将 deploy/Caddyfile.node 装入 /etc/caddy/Caddyfile，或：
   caddy run --config /opt/lanius/repo/deploy/Caddyfile.node
   ```

### A.2 日常启停

```bash
sudo systemctl start lanius.target
sudo systemctl stop lanius.target
sudo systemctl restart lanius-api lanius-bot lanius-web
journalctl -u lanius-api -u lanius-bot -u lanius-web -f
```

### A.3 升级 / 回退

```bash
cd /opt/lanius/repo/deploy
bash ./update-node.sh v0.3.1
```

脚本会：`git fetch` → checkout tag → `pnpm install` → build（含 Web）→ `systemctl restart` → 打健康检查。  
配置项优先在 Admin 改（热加载）；改监听端口 / Redis URL / SQLite 路径后需重启对应单元。

或：将长期分支 **`release`** 推进到含目标版本的提交（Actions 调用同一脚本），或在 **Admin → 版本** 选 tag（`github.deployMode` 须为 `node`）。

### A.4 Playwright / SQLite / Redis 要点

| 组件       | 说明                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Redis      | 本机 `redis-server`；`config` 中 `redis.url`；改 URL 需重启 API                                                                             |
| SQLite     | 相对路径相对**仓库根**（systemd `WorkingDirectory`）；生产建议绝对路径到 `/opt/lanius/data`                                                 |
| Playwright | `PLAYWRIGHT_BROWSERS_PATH`（单元已设）；`prepare-playwright.sh` 或 `pnpm --filter @lanius/render browsers:install`；失败时 Bot 图片降级文本 |

---

## B. Docker 部署（可选）

仍提供 `deploy/docker-compose.app.yml` + `update-image.sh`，适合坚持镜像交付的环境。  
**不是**当前推荐主路径；Admin 需设 `github.deployMode: docker`，`deploy-release` 需选 runtime=`docker`。

### 首次（摘要）

```bash
cp deploy/.env.example deploy/.env
# 填写 DOMAIN / IMAGE_TAG / 配置挂载路径
bash deploy/prepare-playwright.sh   # 可加 LANIUS_PLAYWRIGHT_METHOD=docker
cd deploy
export IMAGE_TAG=v0.3.0
docker compose -f docker-compose.app.yml pull
docker compose -f docker-compose.app.yml up -d
```

日常：`bash ./update-image.sh v0.3.1`（仅 pull，不 rebuild）。

---

## 安全提示

- 勿将 `config/local`、`config.local.yaml`、真实口令提交进 git。
- 生产 `admin.passwordHash` 使用 bcrypt；`plain:` 仅本地。
- 不要把 API/Bot 端口直接暴露公网；经 Caddy 反代。
- QQ 仅腾讯官方机器人开放平台；勿接入非官方协议。
