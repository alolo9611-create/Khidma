# public-catalog — plan overview

Entry point for the **public-catalog** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 03 | `03-story-33.md` | Public catalog | 33 | 01 (#28) |

## Dependency notes

- **Depends on:** [01 — Login with seeded users (#28)](../login-with-seeded-users/01-story-28.md).
- **Required by:** [04 — Edit service settings (#36)](../edit-service-settings/04-story-36.md); [05 — Draft & submit (#38)](../draft-and-submit/05-story-38.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/public-catalog/33/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 33`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-02, PQ-04, PQ-05, PQ-07, PQ-09; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** none found; plan matches the decided answers. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #33; duplicate #59 left untouched in Azure (PQ-01).
- **Order:** global NN 03; see [`../00-index.md`](../00-index.md).
