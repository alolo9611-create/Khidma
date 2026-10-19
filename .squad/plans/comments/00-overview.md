# comments — plan overview

Entry point for the **comments** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 16 | `16-story-85.md` | Comments | 85 | 10 (#46) |

## Dependency notes

- **Depends on:** [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md).
- **Required by:** no later story.
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/comments/85/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 85`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-16, PQ-19; awaiting product-owner input — PQ-19. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** none found; plan matches the decided answers. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #85.
- **Order:** global NN 16; see [`../00-index.md`](../00-index.md).
