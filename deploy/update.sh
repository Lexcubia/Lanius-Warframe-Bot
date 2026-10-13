#!/usr/bin/env bash
# Lanius 更新脚本（热启动模式）
# 在服务器上以 root 或有 sudo 的用户执行：bash /opt/lanius/repo/deploy/update.sh
#
# 流程：git pull → pnpm install（依赖有变化时）→ 重建 web（Nuxt 必须构建）→ 重启 lanius.target
# api/bot 为 tsx 直跑源码，无需构建；web 为 Nuxt，必须 build 出 .output。

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCH="${LANIUS_UPDATE_BRANCH:-develop}"

echo "[lanius-update] repo=$REPO_ROOT branch=$BRANCH"

cd "$REPO_ROOT"

# 1. 拉取最新代码
echo "[lanius-update] git fetch + reset to origin/$BRANCH"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 2. 依赖（lockfile 变化才重装，省时间）
if git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q 'pnpm-lock.yaml'; then
  echo "[lanius-update] lockfile changed, pnpm install"
  pnpm install --frozen-lockfile
else
  echo "[lanius-update] lockfile unchanged, skip install"
fi

# 3. 重建 web（Nuxt 必须构建；api/bot 走 tsx 源码无需构建）
echo "[lanius-update] build web (nuxt)"
pnpm --filter @lanius/web build

# 4. 重启服务
echo "[lanius-update] restart lanius.target"
systemctl restart lanius.target

echo "[lanius-update] done"
