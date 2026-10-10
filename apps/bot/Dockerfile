# syntax=docker/dockerfile:1
# Lanius Bot — build from monorepo root: docker build -f apps/bot/Dockerfile .

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
RUN pnpm --filter @lanius/bot build \
 && node scripts/prepare-runtime-package.mjs bot /out \
 && cp -r apps/bot/dist /out/dist

FROM node:22-bookworm-slim AS deps
WORKDIR /out
COPY .npmrc ./
COPY --from=build /out/package.json ./package.json
RUN npm install --omit=dev

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8788 \
    LANIUS_CONFIG=/config/config.local.yaml
RUN useradd --system --uid 10001 --create-home lanius
COPY --from=deps --chown=lanius:lanius /out/node_modules ./node_modules
COPY --from=build --chown=lanius:lanius /out/package.json ./package.json
COPY --from=build --chown=lanius:lanius /out/dist ./dist
USER lanius
EXPOSE 8788
CMD ["node", "dist/index.js"]
