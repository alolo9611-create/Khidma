# Planning checkpoint — paused 2026-10-18

Planning is paused at a safe point so UI work can start. Nothing was reverted, committed or pushed. No plan is half-written: there are no `.partial.md` files and no planner process is running.

## State

- **Plans:** 22 of 22 exist (NN 01–22). **20 of 21** generated plans pass `python3 .squad/tools/planning_context.py check <id>`.
- **Round-3 fixes (done):** #38, #30, #36, #41, #42, #44, #46, #48, #51, #92 and #101 were regenerated and pass. #38's `requests` table is correct: it keeps `assigneeId`, has all 13 PRD fields and no extras.
- **#79 (NN 13): not finished.**
  - The current plan is correct about the schema: it reuses `requests.assigneeId` from `003_requests.sql`. But it creates `006_request_assignment.sql`, an index-only migration.
  - That number clashes with **#83 (NN 15)**, which already uses `006_certificates.sql`. So **#83 fails its check**.
  - The last regeneration (with a "no migration" constraint added to #79's intake) **hung and was stopped** before writing anything. The constraint is still in `.squad/stories/pick-and-assign/79/intake.md`.
- **Root cause, now fixed in the tool:** `planning_context.py` did not strip SQL `--` comments when reading table columns. A comment in #38 hid `assigneeId` from #79's planning context. The checker now strips comments, checks PRD §01 domain-model columns, and rejects `ALTER TABLE … ADD COLUMN` for an existing column.

## To resume

1. Regenerate #79 only:
   ```bash
   cd /Users/alaamohamed/Khidma && python3 .squad/tools/planning_context.py refresh 79 && squad new-plan .squad/stories/pick-and-assign/79/intake.md --api -y && python3 .squad/tools/planning_context.py check 79
   ```
2. Re-check all 21 plans. #83 should pass once #79 creates no migration.
3. Update the overviews, `00-index.md` and §4b of `00-pre-implementation-review.md`. Their "reconcile plan" flags still describe the state **before** round 3.
4. Still waiting on the product owner: PQ-03, PQ-10, PQ-12 (WITHDRAWN part), PQ-14 (a), PQ-19.

## Backups (session scratchpad, not in the workspace)

Pre-round-3 versions of the 12 regenerated plans and of `planning_context.py` were kept for comparison only. The workspace copies are the current truth.

## Implementation status (2026-10-19)

- All 22 stories are implemented in `app/` from the PRD, the approved decisions and the Khidma design handoff. Committed as `7be1f29` on `feature/khidma-full-app`, pushed to GitHub `origin`; `main` is unchanged.
- Implementation follows the decided answers. The open items (PQ-03, PQ-10, PQ-12 WITHDRAWN part, PQ-19) use the recommended default and are marked in code. PQ-14 (a) follows the design handoff's stated product-owner decision.
- Plan-generation work (#79/#83 migration numbering in the plans) is superseded by the implementation: the code uses migrations 002–009 with no conflict.
