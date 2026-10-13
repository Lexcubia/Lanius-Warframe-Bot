#!/usr/bin/env bash
# 将 deploy/systemd/*.service 安装到 /etc/systemd/system（需 root）。
#
# 用法：
#   sudo bash /opt/lanius/repo/deploy/install-node-services.sh
#   sudo LANIUS_REPO=/opt/lanius/repo LANIUS_USER=lanius bash deploy/install-node-services.sh
#
# 不创建系统用户时设 LANIUS_SKIP_USER=1（单元内仍写 User=lanius，需自行保证）。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${LANIUS_REPO:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
UNIT_SRC="${SCRIPT_DIR}/systemd"
UNIT_DST="${LANIUS_SYSTEMD_DIR:-/etc/systemd/system}"
RUN_USER="${LANIUS_USER:-lanius}"
RUN_GROUP="${LANIUS_GROUP:-${RUN_USER}}"
PLAYWRIGHT_DIR="${LANIUS_PLAYWRIGHT_DIR:-/opt/lanius/ms-playwright}"
DATA_DIR="${LANIUS_DATA_DIR:-/opt/lanius/data}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "请用 root 运行（需要写入 ${UNIT_DST}）" >&2
  exit 1
fi

if [[ "${LANIUS_SKIP_USER:-0}" != "1" ]]; then
  if ! id -u "${RUN_USER}" >/dev/null 2>&1; then
    useradd --system --home "${REPO_ROOT}" --shell /usr/sbin/nologin "${RUN_USER}"
    echo "[lanius] created user ${RUN_USER}"
  fi
fi

mkdir -p "${DATA_DIR}" "${PLAYWRIGHT_DIR}"
chown -R "${RUN_USER}:${RUN_GROUP}" "${DATA_DIR}" || true
# 仓库树：至少保证 config/local 与 data 可写；源码可由部署用户拥有
chown -R "${RUN_USER}:${RUN_GROUP}" "${REPO_ROOT}/config/local" 2>/dev/null || true
mkdir -p "${REPO_ROOT}/data"
chown -R "${RUN_USER}:${RUN_GROUP}" "${REPO_ROOT}/data" || true

for unit in lanius-api.service lanius-bot.service lanius-web.service lanius.target; do
  src="${UNIT_SRC}/${unit}"
  dst="${UNIT_DST}/${unit}"
  if [[ ! -f "${src}" ]]; then
    echo "missing ${src}" >&2
    exit 1
  fi
  # 替换占位符与运行用户
  sed \
    -e "s|__LANIUS_REPO__|${REPO_ROOT}|g" \
    -e "s|__LANIUS_PLAYWRIGHT__|${PLAYWRIGHT_DIR}|g" \
    -e "s|^User=lanius$|User=${RUN_USER}|" \
    -e "s|^Group=lanius$|Group=${RUN_GROUP}|" \
    "${src}" > "${dst}"
  echo "[lanius] installed ${dst}"
done

systemctl daemon-reload
systemctl enable lanius-api.service lanius-bot.service lanius-web.service
echo "[lanius] enabled. 启动：systemctl start lanius.target"
echo "[lanius] 日志：journalctl -u lanius-api -u lanius-bot -u lanius-web -f"
