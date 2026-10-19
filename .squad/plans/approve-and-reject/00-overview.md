# approve-and-reject — plan overview

Entry point for the **approve-and-reject** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 15 | `15-story-83.md` | Approve & reject | 83 | 13 (#79) |

## Dependency notes

- **Depends on:** [13 — Pick & assign (#79)](../pick-and-assign/13-story-79.md).
- **Required by:** [19 — In-app notifications (#95)](../in-app-notifications/19-story-95.md); [20 — Activity log coverage (#97)](../activity-log-coverage/20-story-97.md); [22 — Certificate verify page (#101)](../certificate-verify-page/22-story-101.md).
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/approve-and-reject/83/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 83`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-09, PQ-14, PQ-16, PQ-21; awaiting product-owner input — PQ-14 (a). See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** none found; plan matches the decided answers. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #83.
- **Order:** global NN 15; see [`../00-index.md`](../00-index.md).
