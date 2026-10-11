#!/usr/bin/env bash
# 在生产机预装 Playwright Chromium 到宿主机目录，供 bot 容器只读挂载。
# Actions `docker compose build` 不再下载浏览器；目录已存在且版本匹配时本脚本也会跳过。
#
# 用法（在服务器上，建议 root 或具备 docker 权限的用户）：
#   bash /opt/lanius/repo/deploy/prepare-playwright.sh
#   LANIUS_PLAYWRIGHT_DIR=/opt/lanius/ms-playwright PLAYWRIGHT_VERSION=1.51.0 bash deploy/prepare-playwright.sh

set -euo pipefail

DIR="${LANIUS_PLAYWRIGHT_DIR:-/opt/lanius/ms-playwright}"
# 与 packages/render、prepare-runtime-package 中的 playwright 主版本对齐
PW_VERSION="${PLAYWRIGHT_VERSION:-1.51.0}"
MARKER="${DIR}/.lanius-playwright-version"

echo "[lanius] Playwright prep → ${DIR} (playwright@${PW_VERSION})"

mkdir -p "${DIR}"

if [[ -f "${MARKER}" ]] && [[ "$(cat "${MARKER}")" == "${PW_VERSION}" ]]; then
  # 已有 chromium-* 目录则跳过下载
  if compgen -G "${DIR}/chromium-*" > /dev/null; then
    echo "[lanius] already installed (version ${PW_VERSION}), skip download"
    ls -la "${DIR}"
    exit 0
  fi
fi

echo "[lanius] downloading Chromium via docker (one-time / version bump)…"
# 使用官方 Playwright 镜像拉浏览器；写入宿主机目录后供 bot 挂载复用
docker run --rm \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
  -v "${DIR}:/ms-playwright" \
  "mcr.microsoft.com/playwright:v${PW_VERSION}-jammy" \
  /bin/bash -lc "npx --yes playwright@${PW_VERSION} install chromium"

echo "${PW_VERSION}" > "${MARKER}"
# 容器内常以 root 写入；挂载给 uid 10001（镜像内 lanius）只读即可
chmod -R a+rX "${DIR}" || true

echo "[lanius] done"
ls -la "${DIR}"
