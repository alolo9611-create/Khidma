# supervisor-dashboard — plan overview

Entry point for the **supervisor-dashboard** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 18 | `18-story-92.md` | Supervisor dashboard | 92 | — |

## Dependency notes

- **Depends on:** [17 — SLA status & queue sort (#90)](../sla-status-and-queue-sort/17-story-90.md); [13 — Pick & assign (#79)](../pick-and-assign/13-story-79.md).
- **Required by:** no later story.
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/supervisor-dashboard/92/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 92`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-12, PQ-13; awaiting product-owner input — PQ-12 (WITHDRAWN part). See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** reuses the login `VALIDATION_ERROR` title (PQ-09). See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #92.
- **Order:** global NN 18; see [`../00-index.md`](../00-index.md).
