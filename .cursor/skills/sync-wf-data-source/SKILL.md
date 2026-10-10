---
name: sync-wf-data-source
description: Add or update a Warframe upstream data adapter inside the Lanius API layer. Use when wiring official or documented community sources.
---

# Sync WF data source

## Goal

Ingest Warframe (or documented community) data **only inside `apps/api`**, normalize to `packages/core` DTOs, and expose via Lanius routes.

## Steps

1. **Document the source** — Official preferred. If community (e.g. market), note ToS/attribution in API docs; clients stay unaware.
2. **Adapter** — Place fetch/parse under API upstream adapters. Normalize timestamps, ids, and locale fields.
3. **Cache** — Apply TTL appropriate to volatility (worldstate short; static items long).
4. **DTO mapping** — Output only `core` shapes; never return raw upstream JSON to QQ/Web.
5. **Realm** — Wire `international` for MVP. Stub or explicitly error `china` — do not silently mix realms.
6. **Observability** — Log source name, cache hit/miss, and sanitized error codes (no secrets).
7. **Tests** — Fixture-based parser tests; avoid live network in unit tests.

## Checklist

- [ ] Adapter not imported from `apps/bot` or `apps/web`
- [ ] Secrets for upstream (if any) from config.local / DB
- [ ] Public clients still only see Lanius API
