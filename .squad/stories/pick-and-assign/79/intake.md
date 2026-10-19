# Pick & assign

## Feature

- **Feature name (display):** Pick & assign
- **Feature slug (folder under `plans/`):** `pick-and-assign`
- **PRD reference:** F-12 (Epic E-04 Review) — `Khidma-PRD-Lite.pdf` v2.0-lite

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `79`
- **Work item type:** `User Story`
- **Status:** `New`
- **Assignee:** —
- **Labels:** `E-04; F-12; Khidma`
- **Source:** ids from the Azure DevOps query export `queries.csv` (2026-10-18); description and acceptance criteria from the import file `Khidma_Azure_Import_AGILE.csv`. squad-kit tracker auto-fetch failed (Azure returned a sign-in page).
- **Parent (import file hierarchy, live link not verified):** Feature "Pick & assign" → Epic "Review".

---

## Title

```
Pick & assign
```

---

## Description

```
As a reviewer, I want to pick an unassigned request, and as a supervisor I want to assign or reassign a request, so that work is allocated clearly.

Traceability: BR-05, BR-06, T-02
Open questions to resolve: Definition of 'active request' for load count should be confirmed; assignment/reassignment audit and notification required.
```

## Acceptance Criteria

```
Given an unassigned request, when a reviewer picks it, then it is assigned to them if their active load is below the configured limit; otherwise fail with LOAD_LIMIT. A supervisor may assign/reassign within their department even above that limit. (BR-05, BR-06, T-02)
```

> **Source:** verbatim from `Khidma_Azure_Import_AGILE.csv` (the file the Azure work items were imported from), User Story row "Pick & assign" under Feature "Pick & assign" / Epic "Review" (tags `Khidma; E-04; F-12`). Not yet re-checked against the live Azure item. The tracker's "Open questions to resolve" line is consolidated in `.squad/plans/00-open-questions.md`; it is **not** answered here.

---

## PRD requirements (quoted from `Khidma-PRD-Lite.pdf`)

- **F-12 (§05 backlog):** F-12 Pick & assign — "Reviewer picks, supervisor assigns or reassigns, with the load limit." Rule: BR-05 06 · T-02. Size: S.
- **BR-05 (§04):** "New submissions enter their department's unassigned queue. Reviewers pick; supervisors assign and reassign."
- **BR-06 (§04):** "A reviewer holds at most 10 active requests (department setting). Picks above the limit fail with LOAD_LIMIT; supervisors can still assign."
- **BR-15 (§04):** "Every transition and assignment writes an Activity entry: actor, action, from/to status, note, time. Entries are never edited or deleted."
- **T-02 (§03):** SUBMITTED → IN_REVIEW · Pick · Reviewer / Assign · Supervisor — "Load limit checked. Sets assigneeId." (BR-05 06)
- **Permissions (§01):** "Pick a request" — reviewer ◐, supervisor ● "load limit · BR-06"
- **Permissions (§01):** "Assign / reassign to a reviewer" — supervisor ● "BR-05"
- **API surface (§06, base `/api/v1`):** `POST …/:id/pick · /assign — Assignment — T-02`
- §06 seed ticket KH-103 (PARTIAL): "Reviewers shouldn't be able to grab too many requests."
- §01: "Department BASE id, name, maxActivePerReviewer — Load limit, default 10 (BR-06)."
- **Golden rule (§00):** "Where this document is silent, write an open question — never let the agent decide product behaviour."

---

## Reused approved decisions (Story #28)

- **D-1** stack (TypeScript, Express, React + Vite, SQLite, SQL migrations, Vitest, npm) and **D-12** layout (`app/api`, `app/web`, `app/db`).
- **D-5** `400 VALIDATION_ERROR` for malformed input; problem+json with a stable code for every error.
- **Q-16** `401 UNAUTHENTICATED` "Not signed in." for every endpoint that needs a session; session cookie per **D-3**.
- **D-6** `nationalId` is never part of auth responses; **D-7** all data fictional.
- PRD engineering rules: migrations only, BR logic in `api/rules` as pure functions, injected Clock, ≥ 1 test per BR, suite < 1 minute.

## Open questions

Consolidated in `.squad/plans/00-open-questions.md` (one report for the whole backlog). This story is blocked until these are answered:

- **PQ-09** — HTTP statuses and titles for error codes. *(Status 2026-10-18: approved default — see `00-open-questions.md`.)*
- **PQ-13** — "active" and "open" definitions. *(Status 2026-10-18: approved default — see `00-open-questions.md`.)*
- **PQ-14** — supervisor powers on assignment and decisions. *(Status 2026-10-18: partly decided; (a) awaits input — see `00-open-questions.md`.)*

---

## Attachments

None. Source document: `Khidma-PRD-Lite.pdf` at the workspace root (relevant text quoted above).

---

## Dependencies

- **Blocked by / related ids:** #51 (F-11 Department queue).
- **Depends on code areas or other stories:** builds on the code created by the stories above. Execution order is in `.squad/plans/00-index.md`.

## Technical hints (optional)

- Repo root for application code: `app/`. Primary language: typescript.

## Planning constraint (product owner, 2026-10-18)

- **This story creates no migration.** `requests.assigneeId` already exists (`003_requests.sql`, #38). Do not add an index migration either: seed data is small, and migration `006` belongs to #83 (Approve & reject, NN 15). Load counting queries the existing columns.

<!-- planning-context:start (generated by .squad/tools/planning_context.py — do not edit by hand) -->

## Planning context from earlier plans

Generated from the committed code in `app/` and from every plan that runs **before** this story. These contracts are already decided. **Reuse them exactly** (same file paths, function names and signatures, table and column names, problem codes, routes). Do not rename or re-create them.

### This plan

- Global NN **13**. The H1 must read `# Story 13 — <title> (Story: 79)`. The closing STOP line names Story 14 (#81).

### Dependency plans

- #51: `.squad/plans/department-queue/12-story-51.md`

Read a dependency plan with `read_file` only when a detail you need is not summarised below.

### Migrations

- **Next free migration number: `006`.** Use it for the first migration this story creates; never reuse a number below.

- `001_accounts.sql` — existing code
- `002_catalog.sql` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `003_requests.sql` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `004_declared_documents.sql` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `005_reference_sequences.sql` — #42 (.squad/plans/reference-number/08-story-42.md)

### Tables (name: columns — owner)

- `activity_log`: id, requestId, actorId, action, fromStatus, toStatus, note, at — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `declared_documents`: id, requestId, typeCode, documentNumber, updatedAt — #41 (.squad/plans/declare-documents/07-story-41.md)
- `departments`: id, name, maxActivePerReviewer — existing code
- `reference_sequences`: year, nextValue — #42 (.squad/plans/reference-number/08-story-42.md)
- `requests`: id, referenceNo, serviceTypeId, applicantId, status, formData, assigneeId, infoCycles, submittedAt, dueAt, decidedAt, rejectReason, certificateNo — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `required_documents`: id, serviceTypeId, typeCode, label, mandatory — #33 (.squad/plans/public-catalog/03-story-33.md)
- `schema_migrations`: name, appliedAt — existing code
- `service_types`: id, code, name, departmentId, slaDays, allowMultiple, isActive — #33 (.squad/plans/public-catalog/03-story-33.md)
- `users`: id, nationalId, name, email, role, departmentId, passwordHash — existing code

### Exported helpers and types (planned)

- `ActivityEntry` in `app/web/src/api/requests.ts` — `export interface ActivityEntry {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `ActivityRow` in `app/api/modules/requests/requests.repository.ts` — `export interface ActivityRow {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `ApiProblem` in `app/web/src/api/auth.ts` — `export class ApiProblem extends Error {` — existing code
- `App` in `app/web/src/App.tsx` — `export function App() {` — existing code
- `AppConfig` in `app/api/core/config.ts` — `export interface AppConfig { port: number; jwtSecret: string; databasePath: string }` — existing code
- `AppDeps` in `app/api/app.ts` — `export interface AppDeps { db: Database; clock: Clock; jwtSecret: string; limiter?: LoginRateLimiter }` — existing code
- `AuthDeps` in `app/api/modules/accounts/auth.service.ts` — `export interface AuthDeps { db: Database; clock: Clock; jwtSecret: string }` — existing code
- `CATALOG_SEED_FILE` in `app/api/core/db/seed.ts` — `export const CATALOG_SEED_FILE = fileURLToPath(new URL('../../../db/seed/services.json', import.meta.url));` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `Clock` in `app/api/core/clock.ts` — `export interface Clock { now(): Date }` — existing code
- `DOCUMENT_NUMBER_MAX` in `app/api/rules/declared-documents.ts` — `export const DOCUMENT_NUMBER_MAX = 40;  // PQ-16 approved default (2026-10-18): 1–40 code points` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `DOCUMENT_NUMBER_MIN` in `app/api/rules/declared-documents.ts` — `export const DOCUMENT_NUMBER_MIN = 1;   // PQ-16 approved default (2026-10-18): trim then 1 code point minimum` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `Database` in `app/api/core/db/connection.ts` — `export type Database = BetterSqlite3.Database;` — existing code
- `DeclaredDocument` in `app/web/src/api/requests.ts` — `export interface DeclaredDocument {` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `DeclaredDocumentInput` in `app/api/rules/declared-documents.ts` — `export interface DeclaredDocumentInput {` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `DeclaredDocumentRow` in `app/api/modules/requests/declared-documents.repository.ts` — `export interface DeclaredDocumentRow {` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `DepartmentQueuePage` in `app/web/src/pages/DepartmentQueuePage.tsx` — `export function DepartmentQueuePage() {` — #51 (.squad/plans/department-queue/12-story-51.md)
- `DueDateInputs` in `app/api/rules/due-date.ts` — `export interface DueDateInputs {` — #88 (.squad/plans/due-date-calculator/06-story-88.md)
- `DuplicateGuardInput` in `app/api/rules/duplicate-guard.ts` — `export interface DuplicateGuardInput {` — #44 (.squad/plans/duplicate-guard/09-story-44.md)
- `FormSchemaDeps` in `app/api/rules/request-transitions.ts` — `export interface FormSchemaDeps { todayUtcDate: string }   // 'YYYY-MM-DD' from clock` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `LoginPage` in `app/web/src/pages/LoginPage.tsx` — `export function LoginPage() {` — existing code
- `LoginRateLimiter` in `app/api/modules/accounts/login-rate-limiter.ts` — `export interface LoginRateLimiter {` — existing code
- `MIGRATIONS_DIR` in `app/api/core/db/migrate.ts` — `export const MIGRATIONS_DIR = fileURLToPath(new URL('../../../db/migrations/', import.meta.url));` — existing code
- `MandatoryDocument` in `app/api/rules/declared-documents.ts` — `export interface MandatoryDocument { typeCode: string; mandatory: boolean }` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `MyRequestsPage` in `app/web/src/pages/MyRequestsPage.tsx` — `export function MyRequestsPage() {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `MyServiceRow` in `app/web/src/api/catalog.ts` — `export interface MyServiceRow extends ServiceSummary { id: number; isActive: boolean }` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `NormalisedDeclaredDocument` in `app/api/rules/declared-documents.ts` — `export interface NormalisedDeclaredDocument {` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `OPEN_STATUSES` in `app/api/rules/duplicate-guard.ts` — `export const OPEN_STATUSES: readonly RequestStatus[] = ['SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED'];` — #44 (.squad/plans/duplicate-guard/09-story-44.md)
- `PROBLEM_TITLES` in `app/api/core/problem.ts` — `export const PROBLEM_TITLES: Record<ProblemCode, string> = {` — existing code
- `ParseResult` in `app/api/rules/service-settings.ts` — `export type ParseResult =` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `ParsedDeclaredDocuments` in `app/api/rules/declared-documents.ts` — `export interface ParsedDeclaredDocuments {` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `PlaceholderArea` in `app/web/src/pages/PlaceholderArea.tsx` — `export function PlaceholderArea({ heading }: { heading: string }) {` — existing code
- `ProblemCode` in `app/api/core/problem.ts` — `export type ProblemCode = 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'UNAUTHENTICATED'; // UNAUTHENTICATED: Q-16` — existing code
- `ProblemError` in `app/api/core/problem.ts` — `export class ProblemError extends Error {` — existing code
- `PublicRequiredDocument` in `app/api/modules/catalog/services.repository.ts` — `export interface PublicRequiredDocument {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `PublicServiceDetail` in `app/api/modules/catalog/services.repository.ts` — `export interface PublicServiceDetail extends PublicServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `PublicServiceSummary` in `app/api/modules/catalog/services.repository.ts` — `export interface PublicServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `PublicUser` in `app/api/modules/accounts/users.repository.ts` — `export interface PublicUser { id: number; name: string; email: string; role: Role; departmentId: number | null }` — existing code
- `QueueFilters` in `app/api/modules/requests/requests.repository.ts` — `export interface QueueFilters {` — #51 (.squad/plans/department-queue/12-story-51.md)
- `QueueItem` in `app/web/src/api/requests.ts` — `export interface QueueItem extends RequestListItem {` — #51 (.squad/plans/department-queue/12-story-51.md)
- `QueueQuery` in `app/web/src/api/requests.ts` — `export interface QueueQuery {` — #51 (.squad/plans/department-queue/12-story-51.md)
- `QueueRow` in `app/api/modules/requests/requests.repository.ts` — `export interface QueueRow extends RequestListRow {` — #51 (.squad/plans/department-queue/12-story-51.md)
- `REFERENCE_NUMBER_TIMEZONE` in `app/api/rules/reference-number.ts` — `export const REFERENCE_NUMBER_TIMEZONE = 'Asia/Riyadh'; // PRD §01` — #42 (.squad/plans/reference-number/08-story-42.md)
- `RequestDetailPage` in `app/web/src/pages/RequestDetailPage.tsx` — `export function RequestDetailPage() {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `RequestListItem` in `app/web/src/api/requests.ts` — `export interface RequestListItem {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `RequestListRow` in `app/api/modules/requests/requests.repository.ts` — `export interface RequestListRow {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `RequestRecord` in `app/web/src/api/requests.ts` — `export interface RequestRecord {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `RequestRow` in `app/api/modules/requests/requests.repository.ts` — `export interface RequestRow {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `RequestStatus` in `app/api/rules/request-transitions.ts` — `export type RequestStatus =` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `RequestsDeps` in `app/api/modules/requests/requests.routes.ts` — `export interface RequestsDeps extends AuthDeps {}` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `RequireRole` in `app/web/src/session/RequireRole.tsx` — `export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `RequiredDocument` in `app/web/src/api/catalog.ts` — `export interface RequiredDocument {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `Role` in `app/api/modules/accounts/users.repository.ts` — `export type Role = 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR';` — existing code
- `SEED_FILE` in `app/api/core/db/seed.ts` — `export const SEED_FILE = fileURLToPath(new URL('../../../db/seed/accounts.json', import.meta.url));` — existing code
- `SEED_PASSWORD` in `app/api/core/db/seed.ts` — `export const SEED_PASSWORD = 'Passw0rd!'; // PRD §06 seed data` — existing code
- `SESSION_COOKIE` in `app/api/modules/accounts/auth.service.ts` — `export const SESSION_COOKIE = 'khidma_session';` — existing code
- `SESSION_TTL_SECONDS` in `app/api/modules/accounts/auth.service.ts` — `export const SESSION_TTL_SECONDS = 3600;` — existing code
- `ServiceDetail` in `app/web/src/api/catalog.ts` — `export interface ServiceDetail extends ServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `ServiceRow` in `app/api/modules/catalog/services.repository.ts` — `export interface ServiceRow {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `ServiceSettingsPatch` in `app/api/rules/service-settings.ts` — `export interface ServiceSettingsPatch { slaDays?: number; isActive?: boolean }` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `ServiceSummary` in `app/web/src/api/catalog.ts` — `export interface ServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `ServicesDeps` in `app/api/modules/catalog/services.routes.ts` — `export interface ServicesDeps { db: Database }` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `SessionProvider` in `app/web/src/session/SessionContext.tsx` — `export function SessionProvider({ children }: { children: ReactNode }) {` — existing code
- `SessionUser` in `app/web/src/api/auth.ts` — `export interface SessionUser { id: number; name: string; email: string; role: Role; departmentId: number | null }` — existing code
- `SubmittableRequest` in `app/api/rules/request-transitions.ts` — `export interface SubmittableRequest {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `TEST_SECRET` in `app/api/test/helpers.ts` — `export const TEST_SECRET = 'test-secret';` — existing code
- `USERS` in `app/web/src/test/fetchStub.ts` — `export const USERS: Record<string, SessionUser> = {` — existing code
- `UserWithHash` in `app/api/modules/accounts/users.repository.ts` — `export interface UserWithHash extends PublicUser { passwordHash: string }` — existing code
- `WITHDRAWABLE_STATUSES` in `app/api/rules/request-transitions.ts` — `export const WITHDRAWABLE_STATUSES: readonly RequestStatus[] = ['SUBMITTED', 'IN_REVIEW', 'INFO_REQUESTED'];` — #48 (.squad/plans/withdraw/11-story-48.md)
- `WORKING_DAYS` in `app/api/rules/due-date.ts` — `export const WORKING_DAYS = [0, 1, 2, 3, 4] as const; // Sun..Thu in TZ-local getDay()` — #88 (.squad/plans/due-date-calculator/06-story-88.md)
- `allocateReferenceNumber` in `app/api/modules/requests/reference-sequence.repository.ts` — `export function allocateReferenceNumber(db: Database, year: number): string {` — #42 (.squad/plans/reference-number/08-story-42.md)
- `appendActivity` in `app/api/modules/requests/requests.repository.ts` — `export function appendActivity(` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `assertCanEditDraft` in `app/api/rules/request-transitions.ts` — `export function assertCanEditDraft(status: RequestStatus): void {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `assertCanSubmit` in `app/api/rules/request-transitions.ts` — `export function assertCanSubmit(status: RequestStatus): void {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `assertCanWithdraw` in `app/api/rules/request-transitions.ts` — `export function assertCanWithdraw(status: RequestStatus): void {` — #48 (.squad/plans/withdraw/11-story-48.md)
- `assertDepartmentScope` in `app/api/rules/data-scope.ts` — `export function assertDepartmentScope(user: PublicUser, recordDepartmentId: number): void {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `assertDocumentsComplete` in `app/api/rules/declared-documents.ts` — `export function assertDocumentsComplete(` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `assertFormDataPresent` in `app/api/rules/request-transitions.ts` — `export function assertFormDataPresent(data: unknown): asserts data is Record<string, unknown> {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `assertNoDuplicateOpen` in `app/api/rules/duplicate-guard.ts` — `export function assertNoDuplicateOpen(input: DuplicateGuardInput): void {` — #44 (.squad/plans/duplicate-guard/09-story-44.md)
- `assertOwnsRecord` in `app/api/rules/data-scope.ts` — `export function assertOwnsRecord(user: PublicUser, ownerUserId: number): void {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `authRouter` in `app/api/modules/accounts/auth.routes.ts` — `export function authRouter(deps: AuthDeps & { limiter: LoginRateLimiter }): Router {` — existing code
- `authenticate` in `app/api/modules/accounts/auth.service.ts` — `export async function authenticate(deps: AuthDeps, email: string, password: string): Promise<{ user: PublicUser; token: string }> {` — existing code
- `calculateDueAt` in `app/api/rules/due-date.ts` — `export function calculateDueAt(input: DueDateInputs): Date { /* … */ }` — #88 (.squad/plans/due-date-calculator/06-story-88.md)
- `createApp` in `app/api/app.ts` — `export function createApp(deps: AppDeps): Express {` — existing code
- `createDraft` in `app/web/src/api/requests.ts` — `export async function createDraft(serviceTypeCode: string): Promise<RequestRecord> {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `createLoginRateLimiter` in `app/api/modules/accounts/login-rate-limiter.ts` — `export function createLoginRateLimiter(` — existing code
- `fakeClock` in `app/api/test/helpers.ts` — `export function fakeClock(start: Date): Clock & { advance(ms: number): void } {` — existing code
- `fetchMe` in `app/web/src/api/auth.ts` — `export async function fetchMe(): Promise<SessionUser | null> {` — existing code
- `fetchRequest` in `app/web/src/api/requests.ts` — `export async function fetchRequest(id: number): Promise<RequestRecord> {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `fetchService` in `app/web/src/api/catalog.ts` — `export async function fetchService(code: string): Promise<ServiceDetail> {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `findActiveServiceDetail` in `app/api/modules/catalog/services.repository.ts` — `export function findActiveServiceDetail(db: Database, code: string): PublicServiceDetail | undefined {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `findById` in `app/api/modules/requests/requests.repository.ts` — `export function findById(db: Database, id: number): RequestRow | undefined { /* parse formData JSON */ }` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `findPublicUserById` in `app/api/modules/accounts/users.repository.ts` — `export function findPublicUserById(db: Database, id: number): PublicUser | undefined {` — existing code
- `findServiceByCode` in `app/api/modules/catalog/services.repository.ts` — `export function findServiceByCode(db: Database, code: string): ServiceRow | undefined {` — #51 (.squad/plans/department-queue/12-story-51.md)
- `findServiceById` in `app/api/modules/catalog/services.repository.ts` — `export function findServiceById(db: Database, id: number): ServiceRow | undefined {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `findServiceDetailById` in `app/api/modules/catalog/services.repository.ts` — `export function findServiceDetailById(db: Database, id: number): (PublicServiceDetail & { isActive: boolean }) | undefined {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `findUserByEmail` in `app/api/modules/accounts/users.repository.ts` — `export function findUserByEmail(db: Database, normalizedEmail: string): UserWithHash | undefined {` — existing code
- `formatReferenceNumber` in `app/api/rules/reference-number.ts` — `export function formatReferenceNumber(year: number, sequence: number): string {` — #42 (.squad/plans/reference-number/08-story-42.md)
- `hasOpenRequestForService` in `app/api/modules/requests/requests.repository.ts` — `export function hasOpenRequestForService(` — #44 (.squad/plans/duplicate-guard/09-story-44.md)
- `insertDraft` in `app/api/modules/requests/requests.repository.ts` — `export function insertDraft(` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `isWorkingDay` in `app/api/rules/due-date.ts` — `export function isWorkingDay(localDate: { year: number; month: number; day: number; weekday: number }): boolean {` — #88 (.squad/plans/due-date-calculator/06-story-88.md)
- `json` in `app/web/src/test/fetchStub.ts` — `export function json(status: number, body?: unknown): Response {` — existing code
- `listActiveServices` in `app/api/modules/catalog/services.repository.ts` — `export function listActiveServices(db: Database): PublicServiceSummary[] {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `listActivityByRequest` in `app/api/modules/requests/requests.repository.ts` — `export function listActivityByRequest(db: Database, requestId: number): ActivityRow[] {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `listByRequest` in `app/api/modules/requests/declared-documents.repository.ts` — `export function listByRequest(db: Database, requestId: number): DeclaredDocumentRow[] {` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `listDepartmentQueue` in `app/api/modules/requests/requests.repository.ts` — `export function listDepartmentQueue(` — #51 (.squad/plans/department-queue/12-story-51.md)
- `listMine` in `app/web/src/api/requests.ts` — `export async function listMine(): Promise<RequestListItem[]> {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `listMineForApplicant` in `app/api/modules/requests/requests.repository.ts` — `export function listMineForApplicant(db: Database, applicantId: number): RequestListRow[] {` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `listMyDepartmentServices` in `app/web/src/api/catalog.ts` — `export async function listMyDepartmentServices(): Promise<MyServiceRow[]> {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `listQueue` in `app/web/src/api/requests.ts` — `export async function listQueue(q: QueueQuery = {}): Promise<QueueItem[]> {` — #51 (.squad/plans/department-queue/12-story-51.md)
- `listRequiredDocumentsByServiceId` in `app/api/modules/catalog/services.repository.ts` — `export function listRequiredDocumentsByServiceId(` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `listServices` in `app/web/src/api/catalog.ts` — `export async function listServices(): Promise<ServiceSummary[]> {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `listServicesByDepartment` in `app/api/modules/catalog/services.repository.ts` — `export function listServicesByDepartment(db: Database, departmentId: number): ServiceRow[] {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `loadConfig` in `app/api/core/config.ts` — `export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {` — existing code
- `login` in `app/web/src/api/auth.ts` — `export async function login(email: string, password: string): Promise<SessionUser> {` — existing code
- `logout` in `app/web/src/api/auth.ts` — `export async function logout(): Promise<void> {` — existing code
- `markSubmitted` in `app/api/modules/requests/requests.repository.ts` — `export function markSubmitted(db: Database, id: number, submittedAt: string): void {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `markWithdrawn` in `app/api/modules/requests/requests.repository.ts` — `export function markWithdrawn(db: Database, id: number): void {` — #48 (.squad/plans/withdraw/11-story-48.md)
- `normalizeEmail` in `app/api/modules/accounts/email.ts` — `export function normalizeEmail(raw: string): string { return raw.trim().toLowerCase(); }` — existing code
- `openDatabase` in `app/api/core/db/connection.ts` — `export function openDatabase(path: string): Database {` — existing code
- `parseDeclaredDocuments` in `app/api/rules/declared-documents.ts` — `export function parseDeclaredDocuments(` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `parseServiceSettings` in `app/api/rules/service-settings.ts` — `export function parseServiceSettings(body: unknown): ParseResult {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `problem` in `app/web/src/test/fetchStub.ts` — `export const problem = (status: number, code: string, title: string) =>` — existing code
- `problemMiddleware` in `app/api/core/problem.ts` — `export function problemMiddleware(): ErrorRequestHandler {` — existing code
- `putDeclaredDocuments` in `app/web/src/api/requests.ts` — `export async function putDeclaredDocuments(` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `replaceForRequest` in `app/api/modules/requests/declared-documents.repository.ts` — `export function replaceForRequest(` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `requestsRouter` in `app/api/modules/requests/requests.routes.ts` — `export function requestsRouter(deps: RequestsDeps): Router {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `requireRole` in `app/api/modules/accounts/require-role.ts` — `export function requireRole(deps: AuthDeps, roles: readonly Role[]): RequestHandler {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `resolveSession` in `app/api/modules/accounts/auth.service.ts` — `export function resolveSession(deps: AuthDeps, token: string | undefined): PublicUser {` — existing code
- `riyadhYear` in `app/api/rules/reference-number.ts` — `export function riyadhYear(now: Date): number {` — #42 (.squad/plans/reference-number/08-story-42.md)
- `roleHome` in `app/web/src/session/roleHome.ts` — `export function roleHome(role: Role): string {` — existing code
- `runMigrations` in `app/api/core/db/migrate.ts` — `export function runMigrations(db: Database, migrationsDir: string, clock: Clock): string[] {` — existing code
- `saveDraft` in `app/web/src/api/requests.ts` — `export async function saveDraft(id: number, formData: Record<string, unknown>): Promise<RequestRecord> {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `seedAccounts` in `app/api/core/db/seed.ts` — `export async function seedAccounts(db: Database, seedFile: string): Promise<{ departments: number; users: number }> {` — existing code
- `seedCatalog` in `app/api/core/db/seed.ts` — `export function seedCatalog(db: Database, seedFile: string): { serviceTypes: number; requiredDocuments: number } {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `seededDb` in `app/api/test/helpers.ts` — `export async function seededDb(): Promise<Database> {` — existing code
- `servicesRouter` in `app/api/modules/catalog/services.routes.ts` — `export function servicesRouter(deps: ServicesDeps): Router {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `setReferenceNo` in `app/api/modules/requests/requests.repository.ts` — `export function setReferenceNo(db: Database, id: number, referenceNo: string): void {` — #42 (.squad/plans/reference-number/08-story-42.md)
- `stubFetch` in `app/web/src/test/fetchStub.ts` — `export function stubFetch(handlers: Record<string, Handler> = {}) {` — existing code
- `submitRequest` in `app/web/src/api/requests.ts` — `export async function submitRequest(id: number): Promise<RequestRecord> {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `systemClock` in `app/api/core/clock.ts` — `export const systemClock: Clock = { now: () => new Date() };` — existing code
- `updateFormData` in `app/api/modules/requests/requests.repository.ts` — `export function updateFormData(db: Database, id: number, formData: Record<string, unknown>): void {` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `updateServiceSettings` in `app/api/modules/catalog/services.repository.ts` — `export function updateServiceSettings(` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `useSession` in `app/web/src/session/SessionContext.tsx` — `export function useSession(): SessionValue {` — existing code
- `validateFormForService` in `app/api/rules/request-transitions.ts` — `export function validateFormForService(` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `withdrawRequest` in `app/web/src/api/requests.ts` — `export async function withdrawRequest(id: number): Promise<RequestRecord> {` — #48 (.squad/plans/withdraw/11-story-48.md)

### Problem codes (planned)

- `FORBIDDEN` → HTTP 403 — #30 (.squad/plans/role-guards/02-story-30.md)
- `INVALID_CREDENTIALS` → HTTP 401 — existing code
- `INVALID_TRANSITION` → HTTP 409 — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `NOT_FOUND` → HTTP 404 — #33 (.squad/plans/public-catalog/03-story-33.md)
- `RATE_LIMITED` → HTTP 429 — existing code
- `REQ_DUPLICATE_OPEN` → HTTP 409 — #44 (.squad/plans/duplicate-guard/09-story-44.md)
- `REQ_INCOMPLETE` → HTTP 422 — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `SERVICE_INACTIVE` → HTTP 409 — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `UNAUTHENTICATED` → HTTP 401 — existing code
- `VALIDATION_ERROR` → HTTP 400 — existing code

### Routes (planned)

- `GET /` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `GET /:code` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `GET /:id` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `GET /api/v1/_probe/applicant` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /api/v1/_probe/reviewer` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /api/v1/_probe/staff` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /api/v1/_probe/supervisor` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /me` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /mine` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `GET /queue` — #51 (.squad/plans/department-queue/12-story-51.md)
- `PATCH /:id` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `POST /` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `POST /:id/submit` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `POST /:id/withdraw` — #48 (.squad/plans/withdraw/11-story-48.md)
- `USE /api/v1/auth` — #30 (.squad/plans/role-guards/02-story-30.md)
- `USE /api/v1/requests` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `USE /api/v1/services` — #33 (.squad/plans/public-catalog/03-story-33.md)

### Files created by earlier plans

Edit these with **File:**; never **Create file:** them again.

- `.squad/plans/draft-and-submit/00-overview.md` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `.squad/plans/edit-service-settings/00-overview.md` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `.squad/plans/public-catalog/00-overview.md` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/api/modules/accounts/require-role.ts` — #30 (.squad/plans/role-guards/02-story-30.md)
- `app/api/modules/catalog/services.repository.ts` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/api/modules/catalog/services.routes.ts` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/api/modules/requests/declared-documents.repository.ts` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `app/api/modules/requests/declared-documents.routes.test.ts` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `app/api/modules/requests/reference-sequence.repository.ts` — #42 (.squad/plans/reference-number/08-story-42.md)
- `app/api/modules/requests/requests.repository.ts` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `app/api/modules/requests/requests.routes.ts` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `app/api/rules/data-scope.ts` — #30 (.squad/plans/role-guards/02-story-30.md)
- `app/api/rules/declared-documents.test.ts` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `app/api/rules/declared-documents.ts` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `app/api/rules/due-date.test.ts` — #88 (.squad/plans/due-date-calculator/06-story-88.md)
- `app/api/rules/due-date.ts` — #88 (.squad/plans/due-date-calculator/06-story-88.md)
- `app/api/rules/duplicate-guard.ts` — #44 (.squad/plans/duplicate-guard/09-story-44.md)
- `app/api/rules/reference-number.test.ts` — #42 (.squad/plans/reference-number/08-story-42.md)
- `app/api/rules/reference-number.ts` — #42 (.squad/plans/reference-number/08-story-42.md)
- `app/api/rules/request-transitions.ts` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `app/api/rules/service-settings.ts` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `app/db/migrations/002_catalog.sql` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/db/migrations/003_requests.sql` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `app/db/migrations/004_declared_documents.sql` — #41 (.squad/plans/declare-documents/07-story-41.md)
- `app/db/migrations/005_reference_sequences.sql` — #42 (.squad/plans/reference-number/08-story-42.md)
- `app/db/seed/services.json` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/api/catalog.ts` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/api/requests.ts` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `app/web/src/pages/CatalogDetailPage.tsx` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/pages/CatalogPage.tsx` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/pages/DepartmentQueuePage.tsx` — #51 (.squad/plans/department-queue/12-story-51.md)
- `app/web/src/pages/DraftEditorPage.tsx` — #38 (.squad/plans/draft-and-submit/05-story-38.md)
- `app/web/src/pages/MyRequestsPage.tsx` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `app/web/src/pages/RequestDetailPage.tsx` — #46 (.squad/plans/my-requests-and-timeline/10-story-46.md)
- `app/web/src/pages/SupervisorServicesPage.tsx` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `app/web/src/session/RequireRole.tsx` — #30 (.squad/plans/role-guards/02-story-30.md)

### Keep these contracts (later plans already depend on them)

This story is being re-planned. Later plans already use the names below. Keep them exactly (same names, files, signatures, tables, migration). Change only what the decided answers require.

- `AssignUpdate` in `app/api/modules/requests/requests.repository.ts`
- `PICKABLE_STATUSES` in `app/api/rules/assignment.ts`
- `ProblemError` in `app/api/core/problem.ts`
- `QueueItem` in `app/api/modules/requests/requests.repository.ts`
- `QueueRow` in `app/api/modules/requests/requests.repository.ts`
- `assertCanAssign` in `app/api/rules/assignment.ts`
- `assertCanPick` in `app/api/rules/assignment.ts`
- `assignRequest` in `app/api/modules/requests/requests.repository.ts`
- `countActiveForReviewer` in `app/api/modules/requests/requests.repository.ts`
- `listReviewersByDepartment` in `app/api/modules/accounts/users.repository.ts`
- `pickRequest` in `app/web/src/api/requests.ts`
- file `app/api/rules/assignment.ts`
- migration `006_request_assignment.sql`

### PRD domain model (§01)

Tables for these entities must contain these columns (`requests`: exactly these). Never re-add a column that the Tables list above already shows.

- `requests`: id, referenceNo, serviceTypeId, applicantId, status, formData, assigneeId, infoCycles, submittedAt, dueAt, decidedAt, rejectReason, certificateNo
- `service_types`: id, code, name, departmentId, slaDays, allowMultiple, isActive
- `required_documents`: id, serviceTypeId, typeCode, label, mandatory
- `declared_documents`: id, requestId, typeCode, documentNumber
- `activity_log`: id, requestId, actorId, action, fromStatus, toStatus, note, at
- `comments`: requestId, authorId, visibility, body
- `notifications`: userId, message, link, readAt

### Request statuses (PRD §03)

- Use exactly: `DRAFT`, `SUBMITTED`, `IN_REVIEW`, `INFO_REQUESTED`, `APPROVED`, `REJECTED`, `WITHDRAWN`. No other request-status names (for example not `UNDER_REVIEW` or `NEEDS_INFO`).

### Problem titles (decided 2026-10-18, PQ-08 / PQ-09)

- `FORBIDDEN` → HTTP 403, title "You do not have access to this resource."
- `NOT_FOUND` → HTTP 404, title "Not found."
- `REQ_INCOMPLETE` → HTTP 422, title "Complete all required fields and documents before submitting."
- `REQ_DUPLICATE_OPEN` → HTTP 409, title "You already have an open request for this service."
- `SERVICE_INACTIVE` → HTTP 409, title "This service is not currently available."
- `INVALID_TRANSITION` → HTTP 409, title "This action is not allowed in the request's current status."
- `LOAD_LIMIT` → HTTP 409, title "You have reached your active request limit."
- `INFO_LIMIT` → HTTP 409, title "This request has reached the maximum number of information requests."
- `VALIDATION_ERROR` → HTTP 400, title "Some fields are invalid."
- `PROBLEM_TITLES.VALIDATION_ERROR` is the **login-only** text "Email and password are required.". Every other endpoint uses `400 VALIDATION_ERROR` with the title "Some fields are invalid." plus a `fields` array naming the invalid fields.

### Decided product answers for this story

From `.squad/plans/00-open-questions.md`. **Implement the decided answers.** Where an item still needs product-owner input, plan the recommendation and keep a `⛔ PQ-nn` marker on that spot only.

- **PQ-09** — HTTP status and public title for the PRD codes, plus a generic validation title (the approved `VALIDATION_ERROR` title is login-specific). **Recommended:** `REQ_INCOMPLETE` 422 "Complete all required fields and documents before submitting." · `REQ_DUPLICATE_OPEN` 409 "You already have an open request for this service." · `SERVICE_INACTIVE` 409 "This service is not currently available." · `INVALID_TRANSITION` 409 (PRD) "This action is not allowed in the request's current status." · `LOAD_LIMIT` 409 "You have reached your active request limit." · `INFO_LIMIT` 409 "This request has reached the maximum number of information requests." · `NOT_FOUND` 404 "Not found." · `VALIDATION_ERROR` outside login 400 "Some fields are invalid.", with a `fields` array of invalid field names. **Status:** **Approved default (product owner, 2026-10-18):** recommendation adopted. Statuses and titles as in the table; consistent with the PRD-given `409 INVALID_TRANSITION` and BR-18 403.
- **PQ-13** — Definitions of "**active**" (BR-06 load, F-18 per reviewer) and "**open**" (F-18). **Recommended:** Active = assigned to the reviewer and IN_REVIEW or INFO_REQUESTED. Open = SUBMITTED + IN_REVIEW + INFO_REQUESTED in the department. "At risk" and "overdue" are counted among open. **Status:** **Approved default (product owner, 2026-10-18):** recommendation adopted. Consistent with #92 tracker note ("align with BR-03/load logic") for the in-flight statuses.
- **PQ-14** — The permissions matrix gives supervisors unconditional request-info/approve/reject, but T-03/05/06 name the "Assignee". (a) May a supervisor act on requests not assigned to them? (b) Self-assign? (c) Reassign during INFO_REQUESTED? (d) Notify the previous reviewer? Note: tracker #83 says "As an **assigned reviewer**" and its AC starts "Given an **assigned** IN_REVIEW request". **Recommended:** (a) Yes, on department requests in IN_REVIEW; `assigneeId` is unchanged. (b) No: assignees must be REVIEWERs of the department. (c) Yes, status unchanged. (d) No. (Recommendation unchanged; the tracker wording leans towards assignee-only, so this needs an explicit answer.) **Status:** **Decided:** (b) no self-assign (evidence: §01, BR-05). **Approved default (product owner, 2026-10-18):** recommendation adopted. for (c) reassign allowed during INFO_REQUESTED, status unchanged; (d) previous reviewer not notified. **Needs input on (a):** supervisor decides on non-assigned requests (matrix ●) vs "Assignee" in T-03/05/06 and tracker #81/#83.

### Conventions

- Business-rule pure functions live in `app/api/rules/` (AGENTS.md), never under `app/api/modules/`.
- Never reuse a problem code with a different HTTP status than listed under "Problem codes" above. Impossible-state invariants (for example a value the DB CHECK already guarantees) throw a plain `Error`, not a `ProblemError`; Express then answers 500.
- Do not invent answers to product questions; use the decided answers above and cite their PQ ids.

<!-- planning-context:end -->

## Out of scope

- Anything beyond F-12.
- Registration and password reset (simplicity rule).
- Auto-assignment (cut from v1).
- Notifications (F-19).
