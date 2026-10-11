# syntax=docker/dockerfile:1
# Lanius Bot — build from monorepo root: docker build -f apps/bot/Dockerfile .
#
# Chromium 浏览器不在镜像内下载：由宿主机预装目录挂载（见 deploy/prepare-playwright.sh）。
# 这样 Actions `docker compose build` 不会卡在 playwright 下载；已装过则跳过。

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/bot/package.json apps/bot/
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/qq-official/package.json packages/qq-official/
COPY packages/render/package.json packages/render/
COPY packages/ui/package.json packages/ui/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @lanius/bot...
COPY apps/bot apps/bot
COPY packages/core packages/core
COPY packages/api packages/api
COPY packages/qq-official packages/qq-official
COPY packages/render packages/render
COPY packages/ui packages/ui
COPY scripts/prepare-runtime-package.mjs scripts/prepare-runtime-package.mjs
# 预构建 Vue 卡片宿主，供 Playwright 静态托管（不在运行时起 Vite）
RUN pnpm --filter @lanius/render build:card-host \
 && pnpm --filter @lanius/bot build \
 && node scripts/prepare-runtime-package.mjs bot /out \
 && cp -r apps/bot/dist /out/dist \
 && cp -r packages/render/dist/card-host /out/card-host

FROM node:22-bookworm-slim AS deps
WORKDIR /out
COPY .npmrc ./
COPY --from=build /out/package.json ./package.json
# 仅装 npm 依赖（含 playwright 驱动）；浏览器二进制由宿主机挂载
RUN --mount=type=cache,id=lanius-bot-npm,target=/root/.npm \
    npm install --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8788 \
    LANIUS_CONFIG=/config/config.local.yaml \
    LANIUS_CARD_HOST_DIR=/app/card-host \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
# Chromium 运行时系统库（与 playwright install-deps 对齐的精简集；层可缓存）
RUN --mount=type=cache,id=lanius-bot-apt,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,id=lanius-bot-apt-lists,target=/var/lib/apt/lists,sharing=locked \
    apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      fonts-liberation \
      libasound2 \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libgbm1 \
      libgtk-3-0 \
      libnspr4 \
      libnss3 \
      libx11-xcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxfixes3 \
      libxkbcommon0 \
      libxrandr2 \
      xdg-utils \
 && useradd --system --uid 10001 --create-home lanius
COPY --from=deps --chown=lanius:lanius /out/node_modules ./node_modules
COPY --from=build --chown=lanius:lanius /out/package.json ./package.json
COPY --from=build --chown=lanius:lanius /out/dist ./dist
COPY --from=build --chown=lanius:lanius /out/card-host ./card-host
# 浏览器目录由 compose 挂载；占位以免路径不存在时进程误判
RUN mkdir -p /ms-playwright && chown lanius:lanius /ms-playwright
USER lanius
EXPOSE 8788
CMD ["node", "dist/index.js"]
