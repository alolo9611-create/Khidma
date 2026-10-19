# duplicate-guard — plan overview

Entry point for the **duplicate-guard** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 09 | `09-story-44.md` | Duplicate guard | 44 | — |

## Dependency notes

- **Depends on:** [05 — Draft & submit (#38)](../draft-and-submit/05-story-38.md).
- **Required by:** no later story.
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/duplicate-guard/44/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 44`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-09; awaiting product-owner input — PQ-10. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** **Defect:** `OPEN_STATUSES` uses `NEEDS_INFO`; PRD state is `INFO_REQUESTED`; DRAFT handling pending PQ-10. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #44; duplicate #70 left untouched in Azure (PQ-01).
- **Order:** global NN 09; see [`../00-index.md`](../00-index.md).
