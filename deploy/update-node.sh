#!/usr/bin/env bash
# Node 生产换版（默认路径）：git checkout tag → pnpm install/build → systemd 重启。
# Admin「版本」与 deploy-release.yml 共用本脚本。
#
# 用法：
#   bash /opt/lanius/repo/deploy/update-node.sh v0.3.1
#
# 环境变量（均可选）：
#   LANIUS_REPO          仓库根（默认本脚本上一级）
#   LANIUS_SKIP_PLAYWRIGHT=1  跳过 Playwright 检查/安装
#   LANIUS_SYSTEMCTL=0   不调用 systemctl（仅构建，便于排障）
#   LANIUS_HEALTH_URL    健康检查 URL（默认 http://127.0.0.1:8787/v1/health）

set -euo pipefail

TAG="${1:-}"
if [[ -z "${TAG}" ]]; then
  echo "usage: $0 <vX.Y.Z>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${LANIUS_REPO:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
HEALTH_URL="${LANIUS_HEALTH_URL:-http://127.0.0.1:8787/v1/health}"
SYSTEMCTL_ON="${LANIUS_SYSTEMCTL:-1}"

cd "${REPO_ROOT}"

echo "[lanius] repo=${REPO_ROOT} tag=${TAG}"

# 仅切换到目标 tag/ref；不清理 config/local（gitignore）与 data/
if git rev-parse --verify --quiet "refs/tags/${TAG}" >/dev/null \
  || git ls-remote --exit-code --tags origin "refs/tags/${TAG}" >/dev/null 2>&1; then
  git fetch --tags --force origin "${TAG}" 2>/dev/null \
    || git fetch --tags --force origin
  git checkout -f "tags/${TAG}" 2>/dev/null || git checkout -f "${TAG}"
else
  # 允许传入分支名（如 release）以便 Actions 推进长期指针后构建当前 HEAD
  git fetch origin "${TAG}" --force
  git checkout -B "${TAG}" "FETCH_HEAD" 2>/dev/null || git checkout -f "${TAG}"
fi

echo "[lanius] HEAD=$(git rev-parse --short HEAD) $(git describe --tags --always 2>/dev/null || true)"

corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

if [[ "${LANIUS_SKIP_PLAYWRIGHT:-0}" != "1" ]]; then
  # 出图依赖：优先本机已装目录，否则走 package 脚本
  if [[ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]] && compgen -G "${PLAYWRIGHT_BROWSERS_PATH}/chromium-*" > /dev/null; then
    echo "[lanius] Playwright browsers present at ${PLAYWRIGHT_BROWSERS_PATH}"
  else
    echo "[lanius] ensuring Playwright Chromium…"
    pnpm --filter @lanius/render browsers:install || {
      echo "[lanius] warn: browsers:install failed; bot 图片模式可能降级文本" >&2
    }
  fi
fi

# API/Bot dist + card-host；Web 单独 Nuxt build（根 package.json build 不含 web）
pnpm --filter @lanius/render build:card-host
pnpm build
pnpm --filter @lanius/web build

if [[ ! -f apps/api/dist/index.js ]]; then
  echo "[lanius] missing apps/api/dist/index.js" >&2
  exit 1
fi
if [[ ! -f apps/bot/dist/index.js ]]; then
  echo "[lanius] missing apps/bot/dist/index.js" >&2
  exit 1
fi
if [[ ! -f apps/web/.output/server/index.mjs ]]; then
  echo "[lanius] missing apps/web/.output/server/index.mjs（须 Nuxt build，禁止 nuxt dev）" >&2
  exit 1
fi

if [[ "${SYSTEMCTL_ON}" == "1" ]] && command -v systemctl >/dev/null 2>&1; then
  echo "[lanius] restarting systemd units…"
  # root 直接调；非 root 尝试无密码 sudo（见 DEPLOY.md sudoers 示例）
  if [[ "$(id -u)" -eq 0 ]]; then
    SCT=(systemctl)
  else
    SCT=(sudo -n systemctl)
  fi
  "${SCT[@]}" restart lanius-api.service lanius-bot.service lanius-web.service
  "${SCT[@]}" start lanius.target 2>/dev/null || true
else
  echo "[lanius] skip systemctl (LANIUS_SYSTEMCTL=${SYSTEMCTL_ON})"
fi

echo "[lanius] waiting for health ${HEALTH_URL}…"
ok=0
for _ in $(seq 1 60); do
  if curl -fsS "${HEALTH_URL}" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done

if [[ "${ok}" != "1" ]]; then
  echo "[lanius] health check failed" >&2
  if command -v journalctl >/dev/null 2>&1; then
    journalctl -u lanius-api -n 80 --no-pager || true
  fi
  exit 1
fi

echo "[lanius] done ${TAG}"
