# Khidma — pre-implementation review (2026-10-18)

A review covering three things: duplicate Azure stories, the open product questions, and whether the 22 planned stories are ready to implement. Only planning documents changed. No application code, plan files, commits, pushes or Azure work items were touched. Plan files are unchanged (combined checksum `34547880…` before and after).

---

## 1. Azure DevOps duplicate User Stories

**Live Azure access is unavailable.** A read-only `squad new-story --id 56` probe (cleaned up into `.squad/.trash/`) got Azure's HTML sign-in page instead of the work item. The same thing happened on every earlier attempt. **No duplicate has been verified against live Azure data**: not the descriptions, not the acceptance criteria, not the parent Feature.

Sources available offline:

- `queries.csv`: live ids, titles, state and tags, but no description, acceptance criteria or parent.
- `Khidma_Azure_Import_AGILE.csv`: the import source. It has exactly one row per story, with description, acceptance criteria and Feature → Epic.

| Canonical | Duplicate | Feature | Title + tags (`queries.csv`) | Description / AC / parent | Notes |
|-----------|-----------|---------|------------------------------|---------------------------|-------|
| #28 | #54 | F-01 | identical | not verifiable live; one import row | #28 is implemented (`a5ec262`) and named in its intake and plan |
| #30 | #56 | F-02 | identical | not verifiable live; one import row | — |
| #33 | #59 | F-03 | identical | not verifiable live; one import row | — |
| #36 | #61 | F-04 | identical | not verifiable live; one import row | — |
| #38 | #64 | F-05 | identical | not verifiable live; one import row | — |
| #41 | #66 | F-06 | identical | not verifiable live; one import row | — |
| #42 | #68 | F-07 | identical | not verifiable live; one import row | — |
| #44 | #70 | F-08 | identical | not verifiable live; one import row | — |
| #46 | #72 | F-09 | identical | not verifiable live; one import row | — |
| #48 | #74 | F-10 | identical | not verifiable live; one import row | — |
| #51 | #77 | F-11 | identical | not verifiable live; one import row | — |

#79–#101 (F-12…F-22) appear **once** each; no duplicates.

**Status.** The planning backlog uses the lower ids (PQ-01, answered by the product owner). The confirmation the review asked for (description, AC and parent compared on the live items) **could not be done**.

**Link and dependency concerns (unverified):**

- **Possible orphan stories.** The id gaps hint that #54–#101 is one clean import, with Epic and Feature items interleaved, and that #28–#51 is an earlier partial import. If the earlier import's Features were deleted, the canonical stories #28–#51 may have no live parent, while #79–#101 do. The canonical set would then mix the two imports.
- **Closing duplicates.** Before closing any duplicate in Azure, check that nothing links to it (parent/child, related, predecessor).
- **Minimum action to verify:** export the query again with **Parent**, **Description** and **Acceptance Criteria** columns. Alternatively, make the PAT in `.squad/secrets.yaml` work for squad-kit: scope Work Items (Read), organization `Alaa-Work`, pasted once.

---

## 2. Open product questions (PQ-02 – PQ-23)

### 2a. Resolved or partly resolved from project evidence

Recorded in the **Answer** column of `00-open-questions.md`. Nothing here is a new decision; each line quotes its evidence.

| PQ | Resolved part | Evidence | Plans checked |
|----|---------------|----------|---------------|
| PQ-02 | **Fully:** implement #30, #33, #38 | Tracker scope note "avoid reimplementation **unless a gap is confirmed**"; `app/` has no guards, catalog or requests | #30, #33, #38 implement ✓ |
| PQ-07 | Inactive services are not listed publicly | F-03 "active services"; #33 AC "inactive services are not listed publicly" | #33 hides them ✓ |
| PQ-08 | Out-of-scope access → HTTP 403 | BR-18 "Anything else returns 403" | #30 uses 403 ✓ |
| PQ-14 (b) | No supervisor self-assign; assignees are REVIEWERs | §01 "Assign / reassign **to a reviewer**"; BR-05 | #79 ✓ |
| PQ-17 | UI confirmation dialog required | F-10 "Withdraw with a confirmation dialog"; BR-10 | #48 ✓ |
| PQ-18 | Timeline is chronological (oldest first) | #46 AC "chronological Activity timeline" | #46 `ORDER BY at ASC` ✓ |
| PQ-19 | INTERNAL notes visible only to authorised staff | #85 AC | #85 ✓ |
| PQ-21 | `{SERVICE}` = service code (`SHOP-LIC-2026-00001`) | §00 service codes; §01 `ServiceType.code` | #83 `formatCertificateNumber(serviceCode, …)` ✓ |
| PQ-22 (a) | Applicant-initiated status changes notify the applicant | BR-14 "**Every** status change … for the applicant"; #95 AC | #95 ✓ |

Also already settled by the PRD: the SLA never pauses (§03 "The SLA due date never pauses"). #90 handles this correctly (no pause), but it files it under PQ-12.

### 2b. Decisions awaiting the product owner

Each item lists the recommendation, what the alternative changes, and the affected plans (by NN). Plans are written against the recommendation and mark each spot with `⛔ PQ-nn`.

1. **Demo-request seed (PQ-03).** No story owns "20 requests across all states, incl. 2 overdue." *Recommend:* a new tracker story run after NN 15 and NN 06. *Alternative:* attach it to an existing story, which widens that story's scope. Affects no current plan.
2. **Catalog data and fixed form (PQ-04, PQ-05, PQ-06).** Which department owns each service, the required documents, and the form fields. *Recommend:* the proposals in `00-open-questions.md`. *Alternative:* different data changes the seed files and form validation. Affects 03, 05, 07, 14.
3. **Errors and access (PQ-08 rest, PQ-09).** The 403 code and title, the UI on forbidden routes (redirect vs a "Forbidden" screen; #30 plans a screen while the recommendation is a redirect), and statuses and titles for `REQ_INCOMPLETE`, `REQ_DUPLICATE_OPEN`, `LOAD_LIMIT`, `INFO_LIMIT`, `NOT_FOUND`, and generic `VALIDATION_ERROR`. *Recommend:* the PQ-09 table plus a redirect to the role's home. *Impact:* titles and status codes in tests across 12 plans (02, 03, 04, 05, 07, 09, 10, 11, 13, 14, 15, 22); changing the UI choice affects 02 only.
4. **Service lifecycle (PQ-07 rest).** Inactive service detail (404?), whether drafts or submits are allowed for an inactive service, and whether an `slaDays` edit moves an existing `dueAt`. *Recommend:* 404; `409 SERVICE_INACTIVE`; `dueAt` stays as stored at submit. Affects 03, 04, 05.
5. **Submission rules (PQ-10, PQ-15, PQ-16).** Does a DRAFT count as "open" for BR-03? Under the literal BR-03 reading it does, so two drafts for the same service would block each other. Does a respond need a message, and does BR-01 apply again? What are the text-length and document-number rules? *Recommend:* DRAFT not open; optional response message with BR-01 re-checked; trim, max 1000, document numbers 1–40 characters. Affects 05, 07, 09, 14, 15, 16.
6. **SLA definitions (PQ-11, PQ-12, PQ-13).** The exact `dueAt` instant, how AT_RISK is measured, the status at exactly `dueAt`, which statuses get an SLA status, and what "active" and "open" mean. *Recommend:* end of the N-th working day; AT_RISK during the due day; only SUBMITTED, IN_REVIEW and INFO_REQUESTED have an SLA status; active = IN_REVIEW or INFO_REQUESTED. *Impact:* due-date arithmetic and the risk sort: 06, 13, 17, 18.
7. **Supervisor powers (PQ-14 a, c, d).** The matrix gives supervisors unconditional decide rights, but T-03/05/06 and tracker #81/#83 say "assignee". *Recommend:* supervisors may decide on department requests in IN_REVIEW; reassign allowed during INFO_REQUESTED; the previous reviewer is not notified. *Alternative:* assignee-only removes the supervisor branches. Affects 13, 14, 15.
8. **Applicant visibility (PQ-18 rest, PQ-19 rest, PQ-20, PQ-23).** Staff names and assignment entries in the applicant timeline; drafts in "My requests"; whether applicants may post PUBLIC comments and in which states (the tracker story is staff-only); the default queue contents and empty-state text; where the national ID is shown. *Recommend:* as in `00-open-questions.md`. Affects 10, 12, 16, 21.
9. **Withdraw (PQ-17 rest).** API-level confirmation, and whether a reason is needed. *Recommend:* `{ "confirm": true }` required; no reason. Affects 11.
10. **Certificates (PQ-21 rest).** Yearly sequence restart, the validity boundary, verify-input normalisation, and the dates shown. *Recommend:* restart yearly; valid through decision date + 12 months − 1 day; trim and upper-case the input; show the issued and valid-until dates. Affects 15, 22.
11. **Notifications (PQ-22 b, c).** Does a self-pick notify the reviewer, and what is the wording? *Recommend:* no; use the proposed wording table. Affects 19.

---

## 3. Readiness audit

| Check | Result |
|-------|--------|
| Canonical stories / intakes | **22 / 22** (F-01…F-22, one intake each; no intake for a duplicate id) |
| Plans | **22** (01 implemented; 02–22 generated by squad-kit, scout off); **0** partial |
| Contract check (`planning_context.py check`) | **21 / 21 OK** |
| NN order | file NN = index order 01–22; every dependency has a lower NN |
| Links (index, overviews) | all resolve; no placeholders; Depends-on filled |
| Index ↔ overviews | every plan has an overview row and an index row |
| Required plan sections | present in all 22 |
| Plans citing duplicate ids | only in PQ-01 notes ("keep #NN canonical"); no plan targets a duplicate |
| App repo | clean; `a5ec262` is HEAD, 1 ahead of `origin/main`, nothing pushed |

### Plan defects found (reported, not changed)

1. **#42 `reference-number/08-story-42.md`: wrong story number.** Its H1 reads "Story **09**" (the file and the index say 08; #44 is the real 09), and its STOP line says "proceed to Story 10". *Fix:* regenerate #42 with squad-kit. Its contract check passes, so this is cosmetic, but an executor could be misled about order.
2. **#88 `due-date-calculator/06-story-88.md`: false status claim.** It says "Open question **PQ-11 is answered**". PQ-11 is open. The rule it describes is only the recommendation. *Fix:* regenerate after PQ-11 is answered, or treat the line as "recommendation".
3. **Minor, no fix needed:**
   - #41 caps document numbers at 64 characters ("tentative"); the PQ-16 recommendation is 40.
   - #90 files the never-pause rule under PQ-12 although the PRD settles it.
   - #30 adds permanent `/api/v1/_probe/*` test routes; worth a reviewer's look as possible scope creep.

### Implementation blockers

1. **Product decisions:** the 11 items in §2b. Every plan except #28 still carries `⛔ PQ` markers.
2. **Azure verification:** descriptions, acceptance criteria and parent links have not been checked live (§1).
3. **Plan defects 1–2 above:** two runs to regenerate before those stories are executed.
4. **Process risk:** the workspace root (`.squad/`, plans, intakes, `planning_context.py`) is **not under version control**. Only `app/` is a git repo. Consider tracking `.squad/` (secrets are already git-ignored) before implementation starts.

---

## 4. Round 2 — defaults applied (2026-10-18)

The product owner approved the report's recommendations as defaults. A recommendation was **adopted** unless it contradicts PRD or tracker text, or needs a backlog action only the product owner can take.

### 4a. Decision log

| PQ | Outcome | Basis |
|----|---------|-------|
| PQ-02 | Resolved | Evidence (round 1) |
| PQ-04, PQ-05, PQ-06 | Adopted | PRD silent; fictional data; "dynamic forms" cut from v1 |
| PQ-07 | Adopted (rest) | Evidence for catalog visibility; F-16 "set on submit" for `dueAt` |
| PQ-08, PQ-09 | Adopted | BR-18 403 and §03 409 are given; titles and UI behaviour per recommendation |
| PQ-11 | Adopted | Consistent with BR-11 and #88 AC |
| PQ-12 | Adopted, **except** WITHDRAWN | BR-12 "not decided" literally covers WITHDRAWN |
| PQ-13 | Adopted | #92 tracker note |
| PQ-14 | (b) evidence; (c), (d) adopted; **(a) open** | Matrix ● vs T-03/05/06 "Assignee" and #81/#83 AC |
| PQ-15, PQ-16, PQ-20, PQ-23 | Adopted | PRD silent |
| PQ-17, PQ-18, PQ-21 | Evidence + adopted | F-10/BR-10; #46 AC; §00/§01 |
| PQ-19 | Evidence part; **applicant PUBLIC comments open** | #85 tracker is staff-only |
| PQ-22 | (a), (b) evidence; (c) adopted | BR-14; BR-05 separates "pick" from "assign" |
| PQ-03, PQ-10 | **Open** | Needs a backlog action / contradicts literal BR-03 |

### 4b. Plans to reconcile before execution (found in this round)

Statuses for every plan match the decided PQ-09 table. The deviations are in titles and behaviour.

| NN | Story | Issue | Kind |
|----|-------|-------|------|
| 02 | #30 | FORBIDDEN title "…this area." (decided: "…this resource."); Forbidden screen instead of redirect | deviation |
| 04, 11, 12, 13, 18 | #36, #48, #51, #79, #92 | reuse `PROBLEM_TITLES.VALIDATION_ERROR`, the login text "Email and password are required." (decided: "Some fields are invalid." + `fields`) | deviation |
| 05 | #38 | **`RequestStatus` uses `UNDER_REVIEW`** (PRD and all later plans: `IN_REVIEW`); inactive service → 404 (decided: `409 SERVICE_INACTIVE`); `formData` opaque (decided: PQ-06 field sets); ad-hoc titles | **defect** + deviations |
| 07 | #41 | document-number cap 64 (decided: 40 and charset); `REQ_INCOMPLETE` title wording | deviation |
| 08 | #42 | H1 "Story 09", STOP "Story 10" | **defect** (round 1) |
| 09 | #44 | **`OPEN_STATUSES` contains `NEEDS_INFO`** (PRD: `INFO_REQUESTED`); DRAFT rule waits on PQ-10 | **defect** |
| 10 | #46 | applicant-timeline details unverified against PQ-18 | verify |
| 11 | #48 | API accepts an empty body (decided: `{ "confirm": true }` required) | deviation |
| 22 | #101 | verify input not upper-cased; validity uses an instant, not the decided date-level rule | deviation |

**#88 (NN 06) defect from round 1 is resolved.** PQ-11 is now decided, and the rule #88 describes matches it, so its "PQ-11 is answered" line is accurate.

**Tooling gap:** `planning_context.py check` does not validate request-status literals or problem titles. That is how `UNDER_REVIEW`, `NEEDS_INFO` and the login title slipped through. Add both checks before regenerating.

### 4c. Decisions still requiring the product owner

1. **PQ-10: does a DRAFT count as "open" for BR-03?** *Recommended:* no (multiple drafts allowed; guard at submit). *Alternative:* the literal BR-03 reading (DRAFT counts), with at most one draft per service, blocked at draft creation. *Impact:* #38 (NN 05), #44 (NN 09); the literal reading adds a create-time guard and changes the applicant flow.
2. **PQ-14 (a): may a supervisor request info, approve or reject requests not assigned to them?** *Recommended:* yes, for department requests in IN_REVIEW (matrix ●), with `assigneeId` unchanged. *Alternative:* assignee-only (T-03/05/06 and tracker #81/#83 wording). Supervisors cannot self-assign (PQ-14 b), so to act they would reassign the request to a reviewer. *Impact:* #79, #81, #83 (NN 13–15); the alternative removes the supervisor branches and tests.
3. **PQ-19: may applicants post PUBLIC comments?** *Recommended:* yes, on their own requests, any non-DRAFT state. *Alternative:* staff-only comments, as the #85 tracker story reads; applicants only read PUBLIC comments. *Impact:* #85 (NN 16); the alternative removes the applicant composer, the endpoint permission and its tests.
4. **PQ-12 (part): does a WITHDRAWN request get an SLA status?** *Recommended:* no; only SUBMITTED, IN_REVIEW and INFO_REQUESTED. *Alternative:* the literal BR-12 reading, where a past-due WITHDRAWN request shows OVERDUE. *Impact:* #90, #92 (NN 17–18): badge logic and dashboard counts.
5. **PQ-03: who owns the 20-request demo seed?** *Recommended:* create a new tracker story, planned after NN 15 and NN 06. *Alternative:* add it to an existing story (scope growth) or drop it from Lite. *Impact:* no current plan; needs a tracker action only the product owner can take.

### 4d. Remaining blockers (updated)

1. The five decisions in 4c.
2. Regenerate the **reconcile plan** rows in 4b (after 4c and after adding the two checker rules). Order: #38 first (the base `RequestStatus`), then #30, #41, #42, #44, #48, #36, #51, #79, #92, #101, then re-check all plans.
3. Live Azure verification of duplicates and parents (§1): still unavailable.
4. `.squad/` is not under version control.
