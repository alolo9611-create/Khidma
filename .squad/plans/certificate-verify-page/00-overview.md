# certificate-verify-page — plan overview

Entry point for the **certificate-verify-page** feature. Stories execute in order by their `NN` prefix.

## Stories

| NN | File | Title | Tracker id | Depends on |
|----|------|-------|------------|------------|
| 22 | `22-story-101.md` | Certificate verify page | 101 | — |

## Dependency notes

- **Depends on:** [15 — Approve & reject (#83)](../approve-and-reject/15-story-83.md).
- **Required by:** no later story.
- **Shared contracts:** planned against the generated *Planning context* section of `.squad/stories/certificate-verify-page/101/intake.md` (migrations, tables, helpers, problem codes and routes from earlier plans). Contract check `python3 .squad/tools/planning_context.py check 101`: **OK**.
- **Product questions (2026-10-18):** decided — PQ-09, PQ-21; awaiting product-owner input — none. See [`../00-open-questions.md`](../00-open-questions.md).
- **Plan reconciliation before execution:** verify input must also be upper-cased; validity is date-level through decision date + 12 months − 1 day (PQ-21); plan uses an instant `decidedAt + 12 months`. See [`../00-pre-implementation-review.md`](../00-pre-implementation-review.md).
- **Tracker:** canonical id #101.
- **Order:** global NN 22; see [`../00-index.md`](../00-index.md).
