# sla-status-and-queue-sort — plan overview

Entry point for the **sla-status-and-queue-sort** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 17 | `17-story-90.md` | SLA status & queue sort | 90 | 06 (#88), 12 (#51) |

## Dependency notes

- **Depends on:** [06 — Due-date calculator (#88)](../due-date-calculator/06-story-88.md); [12 — Department queue (#51)](../department-queue/12-story-51.md).
- **Required by:** [18 — Supervisor dashboard (#92)](../supervisor-dashboard/18-story-92.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/sla-status-and-queue-sort/90/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 90`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-11, PQ-12; awaiting product-owner input — PQ-12 (WITHDRAWN part). See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** none found; plan matches the decided answers. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #90.
- **Order:** global NN 17; see [`../00-index.md`](../00-index.md).
