# login-with-seeded-users — plan overview

Entry point for the **login-with-seeded-users** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 01 | `01-story-28.md` | Login with seeded users | 28 | None |

## Dependency notes

- Decisions D-1 to D-12 approved 2026-10-18 (recorded in the intake).
- Q-13 (`GET /api/v1/auth/me` session restore), Q-14 (rate-limit semantics) and Q-15 (error wording) approved 2026-10-18.
- Q-16 (`/me` 401 → `UNAUTHENTICATED`, "Not signed in.") approved 2026-10-18.
- **Story 01 is ready to execute.** No open questions remain.
- Story 01 creates the initial `app/api`, `app/web`, `app/db` skeleton and `AGENTS.md` (D-12); later stories build inside that layout.
- Ordering relative to other features (e.g. F-02 Role guards) is not defined by the PRD.
- **Implemented and committed** (`a5ec262`). Required by: [02 — Role guards (#30)](../role-guards/02-story-30.md), [03 — Public catalog (#33)](../public-catalog/03-story-33.md). Backlog order: [`../00-index.md`](../00-index.md).
