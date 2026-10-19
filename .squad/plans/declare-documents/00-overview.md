# declare-documents — plan overview

Entry point for the **declare-documents** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 07 | `07-story-41.md` | Declare documents | 41 | — |

## Dependency notes

- **Depends on:** [05 — Draft & submit (#38)](../draft-and-submit/05-story-38.md).
- **Required by:** [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/declare-documents/41/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 41`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-05, PQ-06, PQ-09, PQ-16; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** document-number cap 64 → 40, charset `A–Z a–z 0–9 - /` (PQ-16); `REQ_INCOMPLETE` title differs from PQ-09. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #41; duplicate #66 left untouched in Azure (PQ-01).
- **Order:** global NN 07; see [`../00-index.md`](../00-index.md).
