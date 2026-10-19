# draft-and-submit — plan overview

Entry point for the **draft-and-submit** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 05 | `05-story-38.md` | Draft & submit | 38 | — |

## Dependency notes

- **Depends on:** [02 — Role guards (#30)](../role-guards/02-story-30.md); [03 — Public catalog (#33)](../public-catalog/03-story-33.md).
- **Required by:** [06 — Due-date calculator (#88)](../due-date-calculator/06-story-88.md); [07 — Declare documents (#41)](../declare-documents/07-story-41.md); [08 — Reference number (#42)](../reference-number/08-story-42.md); [09 — Duplicate guard (#44)](../duplicate-guard/09-story-44.md); [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/draft-and-submit/38/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 38`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-02, PQ-06, PQ-07, PQ-09; awaiting product-owner input — PQ-10. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** **Defect:** `RequestStatus` uses `UNDER_REVIEW`; PRD and all later plans use `IN_REVIEW`; inactive service → `409 SERVICE_INACTIVE` (PQ-07); plan returns 404; `formData` is opaque; PQ-06 per-service field sets not planned; `INVALID_TRANSITION` / `VALIDATION_ERROR` titles differ from PQ-09. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #38; duplicate #64 left untouched in Azure (PQ-01).
- **Order:** global NN 05; see [`../00-index.md`](../00-index.md).
