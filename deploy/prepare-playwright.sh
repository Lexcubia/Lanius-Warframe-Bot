#!/usr/bin/env bash
# 预装 Playwright Chromium，供 Bot 出图使用。
#
# 默认：本机 Node/pnpm（Node 生产路径，无需 Docker）。
# 可选：LANIUS_PLAYWRIGHT_METHOD=docker 走临时容器下载（旧 Docker 部署）。
#
# 用法：
#   bash /opt/lanius/repo/deploy/prepare-playwright.sh
#   LANIUS_PLAYWRIGHT_METHOD=docker bash deploy/prepare-playwright.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DIR="${LANIUS_PLAYWRIGHT_DIR:-/opt/lanius/ms-playwright}"
METHOD="${LANIUS_PLAYWRIGHT_METHOD:-native}"
PW_VERSION="${PLAYWRIGHT_VERSION:-1.64.0}"
PW_DOWNLOAD_HOST="${PLAYWRIGHT_DOWNLOAD_HOST:-https://npmmirror.com/mirrors/playwright}"
NODE_IMAGE="${LANIUS_PLAYWRIGHT_NODE_IMAGE:-docker.m.daocloud.io/library/node:22-bookworm}"
MARKER="${DIR}/.lanius-playwright-version"

echo "[lanius] Playwright prep → ${DIR} (playwright@${PW_VERSION}, method=${METHOD})"
echo "[lanius] PLAYWRIGHT_DOWNLOAD_HOST=${PW_DOWNLOAD_HOST}"

mkdir -p "${DIR}"

if [[ -f "${MARKER}" ]] && [[ "$(cat "${MARKER}")" == "${PW_VERSION}" ]]; then
  if compgen -G "${DIR}/chromium-*" > /dev/null; then
    echo "[lanius] already installed (version ${PW_VERSION}), skip download"
    ls -la "${DIR}"
    exit 0
  fi
fi

export PLAYWRIGHT_BROWSERS_PATH="${DIR}"
export PLAYWRIGHT_DOWNLOAD_HOST="${PW_DOWNLOAD_HOST}"

if [[ "${METHOD}" == "docker" ]]; then
  echo "[lanius] pulling node image (may use mirror)…"
  docker pull "${NODE_IMAGE}"
  echo "[lanius] downloading Chromium via docker + npmmirror…"
  docker run --rm \
    -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    -e PLAYWRIGHT_DOWNLOAD_HOST="${PW_DOWNLOAD_HOST}" \
    -e npm_config_registry="${NPM_CONFIG_REGISTRY:-https://registry.npmmirror.com}" \
    -v "${DIR}:/ms-playwright" \
    "${NODE_IMAGE}" \
    /bin/bash -lc "
      set -euo pipefail
      npm install -g \"playwright@${PW_VERSION}\"
      playwright install chromium
    "
else
  echo "[lanius] downloading Chromium via local Node/pnpm…"
  cd "${REPO_ROOT}"
  if [[ -f pnpm-lock.yaml ]]; then
    corepack enable >/dev/null 2>&1 || true
    pnpm install --frozen-lockfile --filter @lanius/render...
    pnpm --filter @lanius/render exec playwright install chromium
  else
    npm_config_registry="${NPM_CONFIG_REGISTRY:-https://registry.npmmirror.com}" \
      npx --yes "playwright@${PW_VERSION}" install chromium
  fi
fi

echo "${PW_VERSION}" > "${MARKER}"
chmod -R a+rX "${DIR}" || true

echo "[lanius] done"
ls -la "${DIR}"
