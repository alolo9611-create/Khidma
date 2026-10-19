# reference-number — plan overview

Entry point for the **reference-number** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 08 | `08-story-42.md` | Reference number | 42 | — |

## Dependency notes

- **Depends on:** [05 — Draft & submit (#38)](../draft-and-submit/05-story-38.md).
- **Required by:** [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/reference-number/42/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 42`: **OK**.
- **Product questions (2026-10-18):** decided — none; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** **Defect:** H1 says "Story 09" (file and index: 08); STOP line says Story 10. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #42; duplicate #68 left untouched in Azure (PQ-01).
- **Order:** global NN 08; see [`../00-index.md`](../00-index.md).
