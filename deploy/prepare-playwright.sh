#!/usr/bin/env bash
# 在生产机预装 Playwright Chromium 到宿主机目录，供 bot 容器只读挂载。
# 默认走 npmmirror + DaoCloud Node 镜像，避免卡在官方 CDN / Docker Hub。
#
# 用法：
#   bash /opt/lanius/repo/deploy/prepare-playwright.sh

set -euo pipefail

DIR="${LANIUS_PLAYWRIGHT_DIR:-/opt/lanius/ms-playwright}"
PW_VERSION="${PLAYWRIGHT_VERSION:-1.51.0}"
PW_DOWNLOAD_HOST="${PLAYWRIGHT_DOWNLOAD_HOST:-https://npmmirror.com/mirrors/playwright}"
# DaoCloud 代理 Docker Hub 上的官方 node 镜像
NODE_IMAGE="${LANIUS_PLAYWRIGHT_NODE_IMAGE:-docker.m.daocloud.io/library/node:22-bookworm}"
MARKER="${DIR}/.lanius-playwright-version"

echo "[lanius] Playwright prep → ${DIR} (playwright@${PW_VERSION})"
echo "[lanius] PLAYWRIGHT_DOWNLOAD_HOST=${PW_DOWNLOAD_HOST}"
echo "[lanius] NODE_IMAGE=${NODE_IMAGE}"

mkdir -p "${DIR}"

if [[ -f "${MARKER}" ]] && [[ "$(cat "${MARKER}")" == "${PW_VERSION}" ]]; then
  if compgen -G "${DIR}/chromium-*" > /dev/null; then
    echo "[lanius] already installed (version ${PW_VERSION}), skip download"
    ls -la "${DIR}"
    exit 0
  fi
fi

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

echo "${PW_VERSION}" > "${MARKER}"
chmod -R a+rX "${DIR}" || true

echo "[lanius] done"
ls -la "${DIR}"
