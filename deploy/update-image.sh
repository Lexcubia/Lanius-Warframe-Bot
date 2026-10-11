#!/usr/bin/env bash
# 按 tag pull 换版并 up（禁止 build）。Admin / release 分支部署共用。
set -euo pipefail

TAG="${1:-${IMAGE_TAG:-}}"
if [[ -z "${TAG}" ]]; then
  echo "usage: $0 <vX.Y.Z>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.app.yml}"
export IMAGE_TAG="${TAG}"

# 写入 .env 中的 IMAGE_TAG（若存在 .env）
if [[ -f .env ]]; then
  if grep -q '^IMAGE_TAG=' .env; then
    sed -i.bak "s|^IMAGE_TAG=.*|IMAGE_TAG=${TAG}|" .env && rm -f .env.bak
  else
    echo "IMAGE_TAG=${TAG}" >> .env
  fi
fi

echo "pulling IMAGE_TAG=${TAG} with ${COMPOSE_FILE}"
docker compose -f "${COMPOSE_FILE}" pull
docker compose -f "${COMPOSE_FILE}" up -d --no-deps --remove-orphans
docker compose -f "${COMPOSE_FILE}" ps
echo "done"
