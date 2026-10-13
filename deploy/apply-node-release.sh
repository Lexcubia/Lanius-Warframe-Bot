#!/usr/bin/env bash
# 在生产机应用 Node 发版包（由 Actions SCP 的 tarball），完成首次/日常切到 systemd。
#
# 用法（root）：
#   LANIUS_REPO=/opt/lanius/repo \
#   LANIUS_TARBALL=/opt/lanius/releases/lanius-v0.4.0.tgz \
#   bash deploy/apply-node-release.sh v0.4.0
#
# 行为：解压覆盖源码（保留 config/local 与 data）→ pnpm build → 安装/重启 systemd
# → 停止 Docker lanius-app（若存在）→ 将 Docker Caddy 指到宿主机端口（若仍用 compose caddy）。

set -euo pipefail

TAG="${1:-}"
if [[ -z "${TAG}" ]]; then
  echo "usage: $0 <vX.Y.Z>" >&2
  exit 1
fi

REPO_ROOT="${LANIUS_REPO:-/opt/lanius/repo}"
TARBALL="${LANIUS_TARBALL:-/opt/lanius/releases/lanius-${TAG}.tgz}"
PLAYWRIGHT_DIR="${LANIUS_PLAYWRIGHT_DIR:-/opt/lanius/ms-playwright}"
HEALTH_URL="${LANIUS_HEALTH_URL:-http://127.0.0.1:8787/v1/health}"
RUN_USER="${LANIUS_USER:-lanius}"
DOCKER_GATEWAY="${LANIUS_DOCKER_GATEWAY:-172.17.0.1}"

if [[ ! -f "${TARBALL}" ]]; then
  echo "missing tarball ${TARBALL}" >&2
  exit 1
fi

echo "[lanius] apply ${TAG} from ${TARBALL} → ${REPO_ROOT}"

mkdir -p "${REPO_ROOT}" /opt/lanius/data "${PLAYWRIGHT_DIR}" /opt/lanius/releases
# 保留可写配置与数据
if [[ -d "${REPO_ROOT}/config/local" ]]; then
  cp -a "${REPO_ROOT}/config/local" "/tmp/lanius-config-local.$$"
fi
if [[ -d "${REPO_ROOT}/data" ]]; then
  cp -a "${REPO_ROOT}/data" "/tmp/lanius-data.$$"
fi

# 解压到仓库根（不含 node_modules / config/local）
tar -xzf "${TARBALL}" -C "${REPO_ROOT}"

if [[ -d "/tmp/lanius-config-local.$$" ]]; then
  mkdir -p "${REPO_ROOT}/config/local"
  cp -a "/tmp/lanius-config-local.$$/." "${REPO_ROOT}/config/local/"
  rm -rf "/tmp/lanius-config-local.$$"
fi
if [[ -d "/tmp/lanius-data.$$" ]]; then
  mkdir -p "${REPO_ROOT}/data"
  cp -a "/tmp/lanius-data.$$/." "${REPO_ROOT}/data/"
  rm -rf "/tmp/lanius-data.$$"
fi

cd "${REPO_ROOT}"
chmod +x deploy/*.sh 2>/dev/null || true

NODE_IMAGE="${LANIUS_NODE_IMAGE:-docker.m.daocloud.io/library/node:22-bookworm}"

# 首次：需要完整 Node（含 npm）。残缺 node 也会重装。
# 机房常连不上 NodeSource/GitHub：默认从 npmmirror 拉官方 linux-x64 包。
need_full_node=0
if ! command -v node >/dev/null 2>&1; then need_full_node=1; fi
if ! command -v npm >/dev/null 2>&1; then need_full_node=1; fi
if [[ "${need_full_node}" == "1" ]]; then
  if [[ "$(id -u)" -ne 0 ]]; then
    echo "[lanius] 缺少完整 Node/npm（需 root 安装）" >&2
    exit 1
  fi
  NODE_VER="${LANIUS_NODE_VERSION:-22.14.0}"
  NODE_MIRROR="${LANIUS_NODE_MIRROR:-https://npmmirror.com/mirrors/node}"
  echo "[lanius] installing Node ${NODE_VER} from ${NODE_MIRROR}…"
  apt-get update -y >/dev/null 2>&1 || true
  apt-get install -y ca-certificates curl xz-utils >/dev/null 2>&1 || true
  curl -fsSL "${NODE_MIRROR}/v${NODE_VER}/node-v${NODE_VER}-linux-x64.tar.xz" -o /tmp/lanius-node.tar.xz
  tar -xJf /tmp/lanius-node.tar.xz -C /usr/local --strip-components=1
  rm -f /tmp/lanius-node.tar.xz
  hash -r || true
  node -v
  npm -v
fi
# pnpm：corepack → npm -g → 官方安装脚本
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@9.15.0 --activate 2>/dev/null || true
fi
if ! command -v pnpm >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  echo "[lanius] installing pnpm via npm -g…"
  npm install -g pnpm@9.15.0
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[lanius] installing pnpm via get.pnpm.io…"
  curl -fsSL https://get.pnpm.io/install.sh | SHELL="$(command -v bash)" bash -
  export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
  export PATH="${PNPM_HOME}:${PATH}"
fi
if [[ "$(id -u)" -eq 0 ]] && command -v apt-get >/dev/null 2>&1; then
  if ! command -v redis-server >/dev/null 2>&1 && ! systemctl cat redis-server >/dev/null 2>&1; then
    echo "[lanius] installing redis-server…"
    apt-get install -y redis-server || true
  fi
fi

export NPM_CONFIG_REGISTRY="${NPM_CONFIG_REGISTRY:-https://registry.npmmirror.com}"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_DIR}"
export PLAYWRIGHT_DOWNLOAD_HOST="${PLAYWRIGHT_DOWNLOAD_HOST:-https://npmmirror.com/mirrors/playwright}"

# 安装依赖并（可选）构建。默认 LANIUS_SKIP_BUILD=1：使用 Actions 预构建产物。
export LANIUS_REPO="${REPO_ROOT}"
export LANIUS_SKIP_GIT=1
export LANIUS_SYSTEMCTL=0
export LANIUS_SKIP_BUILD="${LANIUS_SKIP_BUILD:-1}"
bash "${REPO_ROOT}/deploy/update-node.sh" "${TAG}"

# 安装 systemd（首次）
if [[ "$(id -u)" -eq 0 ]]; then
  bash "${REPO_ROOT}/deploy/install-node-services.sh"
else
  sudo bash "${REPO_ROOT}/deploy/install-node-services.sh"
fi

# 停 Docker 主体，释放 8787/8788/8790；Caddy 可留在 compose 并改指宿主机
if command -v docker >/dev/null 2>&1; then
  cd "${REPO_ROOT}/deploy"
  if [[ -f docker-compose.app.yml ]]; then
    # 写一份给 compose caddy 用的宿主机反代（不进 git 密钥）
    cat > Caddyfile.host-bridge <<EOF
{\$DOMAIN:localhost} {
	encode gzip
	handle /qq/* {
		reverse_proxy ${DOCKER_GATEWAY}:8788
	}
	handle /api/lanius/* {
		uri strip_prefix /api/lanius
		reverse_proxy ${DOCKER_GATEWAY}:8787
	}
	handle {
		reverse_proxy ${DOCKER_GATEWAY}:8790
	}
}
EOF
    # 临时让 compose 使用 bridge 文件
    if [[ -f Caddyfile.app ]]; then
      cp -a Caddyfile.app "Caddyfile.app.bak.${TAG}" || true
      cp -a Caddyfile.host-bridge Caddyfile.app
    fi
    docker compose -f docker-compose.app.yml stop lanius-app 2>/dev/null || true
    docker compose -f docker-compose.app.yml rm -f lanius-app 2>/dev/null || true
    docker compose -f docker-compose.app.yml up -d caddy 2>/dev/null || true
  fi
fi

# 确保本机 Redis（若配置指向 127.0.0.1）
if command -v systemctl >/dev/null 2>&1; then
  systemctl start redis-server 2>/dev/null || systemctl start redis 2>/dev/null || true
fi

systemctl restart lanius-api.service lanius-bot.service lanius-web.service
systemctl start lanius.target 2>/dev/null || true

echo "[lanius] waiting for ${HEALTH_URL}"
ok=0
for _ in $(seq 1 60); do
  if curl -fsS "${HEALTH_URL}" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "${ok}" != "1" ]]; then
  echo "[lanius] health failed" >&2
  journalctl -u lanius-api -u lanius-bot -u lanius-web -n 100 --no-pager || true
  exit 1
fi

curl -fsS "${HEALTH_URL}" || true
echo "[lanius] apply-node-release ${TAG} done (user=${RUN_USER})"
