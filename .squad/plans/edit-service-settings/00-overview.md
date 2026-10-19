# edit-service-settings — plan overview

Entry point for the **edit-service-settings** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 04 | `04-story-36.md` | Edit service settings | 36 | — |

## Dependency notes

- **Depends on:** [02 — Role guards (#30)](../role-guards/02-story-30.md); [03 — Public catalog (#33)](../public-catalog/03-story-33.md).
- **Required by:** no later story.
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/edit-service-settings/36/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 36`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-07, PQ-09; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** reuses the login `VALIDATION_ERROR` title "Email and password are required." (PQ-09). See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #36; duplicate #61 left untouched in Azure (PQ-01).
- **Order:** global NN 04; see [`../00-index.md`](../00-index.md).
