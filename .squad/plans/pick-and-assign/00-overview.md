# pick-and-assign — plan overview

Entry point for the **pick-and-assign** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 13 | `13-story-79.md` | Pick & assign | 79 | — |

## Dependency notes

- **Depends on:** [12 — Department queue (#51)](../department-queue/12-story-51.md).
- **Required by:** [14 — Request info & respond (#81)](../request-info-and-respond/14-story-81.md); [15 — Approve & reject (#83)](../approve-and-reject/15-story-83.md); [18 — Supervisor dashboard (#92)](../supervisor-dashboard/18-story-92.md); [21 — National ID masking (#99)](../national-id-masking/21-story-99.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/pick-and-assign/79/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 79`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-09, PQ-13, PQ-14; awaiting product-owner input — PQ-14 (a). See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** reuses the login `VALIDATION_ERROR` title (PQ-09). See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #79.
- **Order:** global NN 13; see [`../00-index.md`](../00-index.md).
