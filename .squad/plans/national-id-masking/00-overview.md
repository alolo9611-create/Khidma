# national-id-masking — plan overview

Entry point for the **national-id-masking** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 21 | `21-story-99.md` | National ID masking | 99 | 10 (#46), 13 (#79) |

## Dependency notes

- **Depends on:** [10 — My requests & timeline (#46)](../my-requests-and-timeline/10-story-46.md); [13 — Pick & assign (#79)](../pick-and-assign/13-story-79.md).
- **Required by:** no later story.
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/national-id-masking/99/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 99`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-23; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** none found; plan matches the decided answers. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #99.
- **Order:** global NN 21; see [`../00-index.md`](../00-index.md).
