---
name: add-api-endpoint
description: Add a Lanius API endpoint under apps/api with Zod validation, DTO in core, and docs. Use when adding or extending REST routes.
---

# Add API endpoint

## Goal

Ship one `/v1/...` route that validates input, returns a stable DTO, and never leaks upstream shapes to clients.

## Steps

1. **Contract first** — In `packages/core`, add Zod schemas + inferred types + error codes. Keep `realm` / `locale` consistent with existing helpers.
2. **Service** — Implement domain logic in `apps/api` (fetch via upstream adapter if needed). Cache with the TTL class for that data (see architecture docs).
3. **Route** — Thin Hono handler: parse query/body with Zod → call service → map errors to API error envelope.
4. **MVP gate** — If `realm=china`, return the reserved “not available” response; do not invent China upstream calls in MVP.
5. **OpenAPI** — Register schema so generated docs stay in sync.
6. **Tests** — Vitest for schema + happy path + validation failure.
7. **Clients** — Do **not** add bot/web UI in the same change unless explicitly requested; API-only PRs are preferred.

## Checklist

- [ ] No secret in env; config/DB only if the route needs privileged config
- [ ] Clients still must not call upstream directly
- [ ] i18n keys for user-facing error messages
- [ ] Spelling: Lanius
