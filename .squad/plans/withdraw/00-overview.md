# withdraw — plan overview

Entry point for the **withdraw** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 11 | `11-story-48.md` | Withdraw | 48 | — |

## Dependency notes

- **Depends on:** [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md).
- **Required by:** [19 — In-app notifications (#95)](../in-app-notifications/19-story-95.md); [20 — Activity log coverage (#97)](../activity-log-coverage/20-story-97.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/withdraw/48/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 48`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-09, PQ-17; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** API must require `{ "confirm": true }` (PQ-17); plan accepts an empty body; reuses the login `VALIDATION_ERROR` title (PQ-09). See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #48; duplicate #74 left untouched in Azure (PQ-01).
- **Order:** global NN 11; see [`../00-index.md`](../00-index.md).
