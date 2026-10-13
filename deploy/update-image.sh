#!/usr/bin/env bash
# 【可选 Docker 路径】按 tag pull 换版并 up（禁止 build）。
# 生产默认请用 update-node.sh。仅当 github.deployMode=docker 或
# deploy-release runtime=docker 时使用本脚本。
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

# 等待 lanius-app 健康（最多 5 分钟）
echo "waiting for lanius-app to become healthy..."
for i in $(seq 1 30); do
  if docker inspect --format='{{.State.Health.Status}}' lanius-lanius-app-1 2>/dev/null | grep -q healthy; then
    echo "lanius-app is healthy"
    break
  fi
  if ! docker ps --format='{{.Names}}' | grep -q lanius-lanius-app-1; then
    echo "lanius-app container is not running"
    docker logs lanius-lanius-app-1 --tail 100
    exit 1
  fi
  sleep 10
done

if ! docker inspect --format='{{.State.Health.Status}}' lanius-lanius-app-1 2>/dev/null | grep -q healthy; then
  echo "lanius-app did not become healthy within 5 minutes"
  docker logs lanius-lanius-app-1 --tail 100
  exit 1
fi

docker compose -f "${COMPOSE_FILE}" up -d --no-deps caddy
docker compose -f "${COMPOSE_FILE}" ps
echo "done"
