# syntax=docker/dockerfile:1
# Lanius API — build from monorepo root: docker build -f apps/api/Dockerfile .

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS build
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
 && node scripts/prepare-runtime-package.mjs api /out \
 && cp -r apps/api/dist /out/dist \
 && cp -r config/default /out/runtime-default

FROM node:22-bookworm-slim AS deps
WORKDIR /out
COPY .npmrc ./
COPY --from=build /out/package.json ./package.json
RUN npm install --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8787 \
    LANIUS_CONFIG=/config/config.local.yaml \
    LANIUS_RUNTIME_CONFIG_ROOT=/runtime-config
RUN useradd --system --uid 10001 --create-home lanius \
 && mkdir -p /runtime-config/default /runtime-config/local /data \
 && chown -R lanius:lanius /runtime-config /data
COPY --from=deps --chown=lanius:lanius /out/node_modules ./node_modules
COPY --from=build --chown=lanius:lanius /out/package.json ./package.json
COPY --from=build --chown=lanius:lanius /out/dist ./dist
# 镜像内自带 default 回退；compose 可再挂载覆盖 /runtime-config/default 与 local
COPY --from=build --chown=lanius:lanius /out/runtime-default/ /runtime-config/default/
USER lanius
EXPOSE 8787
CMD ["node", "dist/index.js"]
