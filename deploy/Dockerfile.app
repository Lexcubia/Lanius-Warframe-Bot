# syntax=docker/dockerfile:1
# Lanius 主体应用镜像：api + web + bot + 内嵌 Redis（不含 Caddy）。
# 构建：docker build -f deploy/Dockerfile.app -t lanius-app .

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# --- API build ---
FROM base AS build-api
# better-sqlite3 原生编译工具链
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/config/package.json packages/config/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @lanius/server...
COPY apps/api apps/api
COPY packages/core packages/core
COPY packages/config packages/config
COPY config/default config/default
COPY scripts/prepare-runtime-package.mjs scripts/prepare-runtime-package.mjs
RUN pnpm --filter @lanius/server build \
 && node scripts/prepare-runtime-package.mjs api /out/api \
 && cp -r apps/api/dist /out/api/dist \
 && cp -r config/default /out/runtime-default

# --- Web build ---
FROM base AS build-web
# better-sqlite3 原生编译工具链（peer dep 会触发安装）
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/ui/package.json packages/ui/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @lanius/web...
COPY apps/web apps/web
COPY packages/core packages/core
COPY packages/api packages/api
COPY packages/ui packages/ui
ENV LANIUS_API_BASE=http://127.0.0.1:8787
RUN pnpm --filter @lanius/web build

# --- Bot build ---
FROM base AS build-bot
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/bot/package.json apps/bot/
COPY packages/core/package.json packages/core/
COPY packages/config/package.json packages/config/
COPY packages/api/package.json packages/api/
COPY packages/qq-official/package.json packages/qq-official/
COPY packages/render/package.json packages/render/
COPY packages/ui/package.json packages/ui/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @lanius/bot...
COPY apps/bot apps/bot
COPY packages/core packages/core
COPY packages/config packages/config
COPY packages/api packages/api
COPY packages/qq-official packages/qq-official
COPY packages/render packages/render
COPY packages/ui packages/ui
COPY scripts/prepare-runtime-package.mjs scripts/prepare-runtime-package.mjs
RUN pnpm --filter @lanius/render build:card-host \
 && pnpm --filter @lanius/bot build \
 && node scripts/prepare-runtime-package.mjs bot /out/bot \
 && cp -r apps/bot/dist /out/bot/dist \
 && cp -r packages/render/dist/card-host /out/bot/card-host

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# apt 国内镜像 + redis + supervisor + Chromium 系统库（bot）
RUN set -eux; \
    if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i \
        -e 's|https\?://deb.debian.org|http://mirrors.aliyun.com|g' \
        -e 's|https\?://security.debian.org|http://mirrors.aliyun.com|g' \
        /etc/apt/sources.list.d/debian.sources; \
    fi; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      redis-server \
      supervisor \
      fonts-liberation \
      fonts-wqy-microhei \
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
      xdg-utils; \
    rm -rf /var/lib/apt/lists/*; \
    mkdir -p /data/redis /var/log/supervisor /ms-playwright /runtime-config/default /runtime-config/local /config

COPY --from=build-api /out/api /app/api
COPY --from=build-api /out/runtime-default /runtime-config/default
WORKDIR /app/api
# better-sqlite3 需编译原生模块
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && npm install --omit=dev \
 && apt-get purge -y python3 make g++ \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build-web /app/apps/web/.output /app/web/.output

COPY --from=build-bot /out/bot /app/bot
WORKDIR /app/bot
RUN npm install --omit=dev

COPY deploy/supervisord.app.conf /etc/supervisor/conf.d/lanius.conf

WORKDIR /app
EXPOSE 8787 8788 8790
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/lanius.conf"]
