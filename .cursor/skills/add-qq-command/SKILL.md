---
name: add-qq-command
description: Add a QQ bot command that calls Lanius API and replies in text and/or image mode. Use when extending apps/bot commands.
---

# Add QQ command

## Goal

Parse a user command in `apps/bot`, call **Lanius API** only, format text and/or image, send via **official** QQ APIs.

## Steps

1. **Confirm API exists** — Prefer an existing `/v1/...` endpoint. If missing, use skill `add-api-endpoint` first (or split PRs).
2. **Command parser** — Register pattern (prefix from config, e.g. `wf …`). Keep aliases in config/`core`, not hardcoded one-offs without docs.
3. **HTTP client** — Call Lanius API with `realm` / `locale` from group/user defaults (MVP realm = international).
4. **Text formatter** — Map DTO → short QQ-friendly text (i18n keys).
5. **Image path** — If reply mode is image, render via `packages/card-render`; on failure, fall back to text + brief notice.
6. **Send** — Use `packages/qq-official` only (no unofficial protocol).
7. **Tests** — Parser unit tests; formatter snapshot if non-trivial.

## Checklist

- [ ] No NapCat / go-cqhttp / AstrBot / OneBot
- [ ] No direct upstream Warframe calls from bot
- [ ] Text + image modes considered; degradation defined
- [ ] Does not require Web process to be online
