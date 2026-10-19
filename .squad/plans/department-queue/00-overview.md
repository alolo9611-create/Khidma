# department-queue — plan overview

Entry point for the **department-queue** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 12 | `12-story-51.md` | Department queue | 51 | — |

## Dependency notes

- **Depends on:** [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md).
- **Required by:** [13 — Pick & assign (#79)](../pick-and-assign/13-story-79.md); [17 — SLA status & queue sort (#90)](../sla-status-and-queue-sort/17-story-90.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/department-queue/51/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 51`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-20; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** reuses the login `VALIDATION_ERROR` title (PQ-09). See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #51; duplicate #77 left untouched in Azure (PQ-01).
- **Order:** global NN 12; see [`../00-index.md`](../00-index.md).
