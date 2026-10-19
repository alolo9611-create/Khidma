# my-requests-and-timeline — plan overview

Entry point for the **my-requests-and-timeline** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 10 | `10-story-46.md` | My requests & timeline | 46 | — |

## Dependency notes

- **Depends on:** [05 — Draft & submit (#38)](../draft-and-submit/05-story-38.md); [06 — Due-date calculator (#88)](../due-date-calculator/06-story-88.md); [07 — Declare documents (#41)](../declare-documents/07-story-41.md); [08 — Reference number (#42)](../reference-number/08-story-42.md).
- **Required by:** [11 — Withdraw (#48)](../withdraw/11-story-48.md); [12 — Department queue (#51)](../department-queue/12-story-51.md); [16 — Comments (#85)](../comments/16-story-85.md); [21 — National ID masking (#99)](../national-id-masking/21-story-99.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/my-requests-and-timeline/46/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 46`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-09, PQ-18; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** verify applicant timeline against PQ-18 (role labels, hide reassign-only entries, drafts listed); plan ships a minimal field set. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #46; duplicate #72 left untouched in Azure (PQ-01).
- **Order:** global NN 10; see [`../00-index.md`](../00-index.md).
