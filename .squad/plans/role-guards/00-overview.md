# role-guards — plan overview

Entry point for the **role-guards** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 02 | `02-story-30.md` | Role guards | 30 | — |

## Dependency notes

- **Depends on:** [01 — Login with seeded users (#28)](../login-with-seeded-users/01-story-28.md).
- **Required by:** [04 — Edit service settings (#36)](../edit-service-settings/04-story-36.md); [05 — Draft & submit (#38)](../draft-and-submit/05-story-38.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/role-guards/30/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 30`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-02, PQ-08, PQ-09; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** FORBIDDEN title → "You do not have access to this resource." and forbidden-route UI → redirect to own role home (PQ-08/09); plan has "…this area." and a Forbidden screen. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #30; duplicate #56 left untouched in Azure (PQ-01).
- **Order:** global NN 02; see [`../00-index.md`](../00-index.md).
