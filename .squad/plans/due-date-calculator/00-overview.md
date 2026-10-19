# due-date-calculator — plan overview

Entry point for the **due-date-calculator** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 06 | `06-story-88.md` | Due-date calculator | 88 | 05 (#38) |

## Dependency notes

- **Depends on:** [05 — Draft & submit (#38)](../draft-and-submit/05-story-38.md).
- **Required by:** [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md); [17 — SLA status & queue sort (#90)](../sla-status-and-queue-sort/17-story-90.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/due-date-calculator/88/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 88`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-11; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** none found; plan matches the decided answers. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #88.
- **Order:** global NN 06; see [`../00-index.md`](../00-index.md).
