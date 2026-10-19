# activity-log-coverage — plan overview

Entry point for the **activity-log-coverage** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 20 | `20-story-97.md` | Activity log coverage | 97 | 11 (#48), 14 (#81), 15 (#83) |

## Dependency notes

- **Depends on:** [11 — Withdraw (#48)](../withdraw/11-story-48.md); [14 — Request info & respond (#81)](../request-info-and-respond/14-story-81.md); [15 — Approve & reject (#83)](../approve-and-reject/15-story-83.md).
- **Required by:** no later story.
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/activity-log-coverage/97/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 97`: **OK**.
- **Product questions (2026-10-18):** decided — none; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** none found; plan matches the decided answers. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #97.
- **Order:** global NN 20; see [`../00-index.md`](../00-index.md).
