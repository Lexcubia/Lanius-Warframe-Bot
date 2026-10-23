#!/usr/bin/env bash
# Lanius 容器热启动更新脚本。
#
# 适用：`deploy/docker-compose.app.yml` 挂载宿主机 monorepo 源码（/opt/lanius/repo:/repo），
# api/bot 经 tsx 直跑 TypeScript 源码的运行模式。
#
# 流程：git fetch（含国内镜像回退）+ reset 到目标 ref →（lockfile 变化时 pnpm install）→
#       重建 card-host（Chromium 截图所需的 ui 产物）与 web → docker compose up -d 重建容器。
#
# 用法（服务器上，root）：
#   bash /opt/lanius/repo/deploy/update-container.sh            # 默认更新到 origin/develop
#   LANIUS_UPDATE_REF=v0.4.0 bash deploy/update-container.sh    # 更新到指定 tag/分支

set -euo pipefail

# 允许 workflow 显式传入仓库根（脚本可能被复制到 /tmp 执行）
if [ -n "${LANIUS_REPO_ROOT:-}" ]; then
  REPO_ROOT="${LANIUS_REPO_ROOT}"
else
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fi
REF="${LANIUS_UPDATE_REF:-develop}"
COMPOSE_FILE="${REPO_ROOT}/deploy/docker-compose.app.yml"

echo "[lanius-update-container] repo=${REPO_ROOT} ref=${REF}"

cd "${REPO_ROOT}"

# 1. 对齐代码到目标 ref（tag 直接 reset；分支则对齐 origin/<branch>）
# 机房常连不上 github.com：与 update-node.sh 相同，依次尝试 origin / 直连 / 镜像。
fetch_ok=0
for remote in \
  "origin" \
  "https://github.com/Lexcubia/Lanius-Warframe-Bot.git" \
  "https://gitclone.com/github.com/Lexcubia/Lanius-Warframe-Bot.git" \
  "https://ghfast.top/https://github.com/Lexcubia/Lanius-Warframe-Bot.git"
do
  echo "[lanius-update-container] git fetch via ${remote}"
  # +refs/tags/* 强制更新本地 tag：发布时 tag 可能被 force 重打，避免 fetch 因 clobber 拒绝。
  if git fetch "${remote}" --prune '+refs/heads/*:refs/remotes/origin/*' '+refs/tags/*:refs/tags/*' \
    2>/tmp/lanius-container-git-fetch.err; then
    fetch_ok=1
    break
  fi
  cat /tmp/lanius-container-git-fetch.err 2>/dev/null || true
done
if [[ "${fetch_ok}" != "1" ]]; then
  echo "[lanius-update-container] git fetch failed on all remotes/mirrors" >&2
  exit 1
fi

if git rev-parse -q --verify "refs/tags/${REF}" >/dev/null; then
  TARGET="${REF}"
elif git rev-parse -q --verify "refs/remotes/origin/${REF}" >/dev/null; then
  TARGET="origin/${REF}"
else
  TARGET="${REF}"
fi
echo "[lanius-update-container] reset --hard ${TARGET}"
git reset --hard "${TARGET}"

# 2. 依赖（lockfile 变化才重装）
if git diff --name-only 'HEAD@{1}' HEAD 2>/dev/null | grep -q 'pnpm-lock.yaml'; then
  echo "[lanius-update-container] lockfile changed, pnpm install"
  pnpm install --frozen-lockfile
else
  echo "[lanius-update-container] lockfile unchanged, skip install"
fi

# 3. 重建 Chromium 卡片宿主（ui 变更需重新打包进 dist/card-host）
echo "[lanius-update-container] build card-host"
pnpm --filter @lanius/render build:card-host

# 4. 重建 web（Nuxt 必须构建出 .output）
echo "[lanius-update-container] build web (nuxt)"
pnpm --filter @lanius/web build

# 5. 强制重建容器：源码挂载 + tsx 长驻时，普通 `up -d` 可能不换进程，
#    表现为 health 仍报超长 uptimeSec、业务仍跑旧代码。
echo "[lanius-update-container] docker compose up -d --force-recreate"
docker compose -f "${COMPOSE_FILE}" up -d --force-recreate --remove-orphans

# 6. 再显式 restart，确保 supervisord 子进程（api/bot/web）全部拉起
echo "[lanius-update-container] docker compose restart lanius-app"
docker compose -f "${COMPOSE_FILE}" restart lanius-app

echo "[lanius-update-container] done"
