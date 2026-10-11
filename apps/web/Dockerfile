# syntax=docker/dockerfile:1
# Lanius Web (Nuxt) — build from monorepo root: docker build -f apps/web/Dockerfile .

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
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
# 构建期默认指向 compose 服务名；运行时可被 LANIUS_API_BASE 覆盖。
ENV LANIUS_API_BASE=http://api:8787
RUN pnpm --filter @lanius/web build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8790 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=8790 \
    LANIUS_API_BASE=http://api:8787 \
    NUXT_LANIUS_API_BASE=http://api:8787
RUN useradd --system --uid 10001 --create-home lanius
COPY --from=build --chown=lanius:lanius /app/apps/web/.output ./.output
USER lanius
EXPOSE 8790
CMD ["node", ".output/server/index.mjs"]
