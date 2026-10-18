# AGENTS.md — Khidma project rules

## Engineering rules

PRD §06, verbatim:

- Relational DB (SQLite is fine), migrations only.
- Business rules live in api/rules as pure functions.
- An injected Clock — no direct now() — so SLA tests run instantly.
- Errors as problem+json with a stable code.
- Every BR has ≥ 1 test; test suite runs in under a minute.
- No real personal data anywhere — including prompts and plans.

## Simplicity rules

PRD §00, verbatim:

- No file uploads — documents are declared by number.
- No background jobs — SLA status is computed when read.
- No email or SMS — in-app notifications only.
- English only — no RTL, translations or Hijri dates.
- One approval level — the reviewer decides.
- Seeded logins — no registration, no password reset.
- No exports, charts or pagination — small lists only.

If an agent's plan adds any of these, the plan is rejected at review.

## Commands

```bash
# Run from app/. Each line is self-contained.

# Install
(cd api && npm install)
(cd web && npm install)

# Database (after cp api/.env.example api/.env)
(cd api && npm run db:migrate)
(cd api && npm run db:seed)

# Test
(cd api && npm run typecheck && npm test)
(cd web && npm test && npm run build)

# Dev (one terminal each)
(cd api && npm run dev)    # API on http://localhost:3000
(cd web && npm run dev)    # SPA on http://localhost:5173
```
