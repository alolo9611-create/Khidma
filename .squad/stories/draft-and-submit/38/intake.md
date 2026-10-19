# Draft & submit

## Feature

- **Feature name (display):** Draft & submit
- **Feature slug (folder under `plans/`):** `draft-and-submit`
- **PRD reference:** F-05 (Epic E-03 Applicant requests) — `Khidma-PRD-Lite.pdf` v2.0-lite

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `38`
- **Work item type:** `User Story`
- **Status:** `New`
- **Assignee:** —
- **Labels:** `Baseline-Verify; E-03; F-05; Khidma`
- **Possible duplicate:** `#64` has the same title and tags. This intake uses `#38` pending **PQ-01**.
- **Source:** ids from the Azure DevOps query export `queries.csv` (2026-10-18); description and acceptance criteria from the import file `Khidma_Azure_Import_AGILE.csv`. squad-kit tracker auto-fetch failed (Azure returned a sign-in page).
- **Parent (import file hierarchy, live link not verified):** Feature "Draft & submit" → Epic "Applicant requests".

---

## Title

```
Draft & submit
```

---

## Description

```
As an applicant, I want to save a draft and fill the fixed request form so that I can prepare a request before submitting.

Traceability: T-01
Open questions to resolve: Draft persistence, required fields, and form schema should be confirmed against baseline/repo.
Scope note: Baseline feature from the PRD; verify existing behavior and avoid reimplementation unless a gap is confirmed.
```

## Acceptance Criteria

```
Given an authenticated applicant, when they create a request, then it starts as DRAFT and can be edited before submission; submission follows T-01. (T-01)
```

> **Source:** verbatim from `Khidma_Azure_Import_AGILE.csv` (the file the Azure work items were imported from), User Story row "Draft & submit" under Feature "Draft & submit" / Epic "Applicant requests" (tags `Khidma; E-03; F-05; Baseline-Verify`). Not yet re-checked against the live Azure item. The tracker's "Open questions to resolve" line is consolidated in `.squad/plans/00-open-questions.md`; it is **not** answered here.

---

## PRD requirements (quoted from `Khidma-PRD-Lite.pdf`)

- **F-05 (§05 backlog):** F-05 Draft & submit — "Create a draft, fill the fixed form, submit. No documents or reference number yet." T-01. Marker: BASELINE.
- **BR-04 (§04):** "After submit, the request is read-only to the applicant, except while INFO_REQUESTED."
- **BR-18 (§04):** "Applicants see only their own requests; staff see only their department's. Anything else returns 403."
- **T-01 (§03):** DRAFT → SUBMITTED · Submit · Applicant — "Form valid, mandatory documents declared, no duplicate open request. Sets reference no. and due date." (BR-01 02 03 11)
- **Permissions (§01):** "Create, submit, withdraw own request" — applicant ● · BR-01, BR-03, BR-10
- **API surface (§06, base `/api/v1`):** `POST /requests · PATCH …/:id — Create & edit draft — F-05`
- **API surface (§06, base `/api/v1`):** `POST …/:id/submit — Submit — T-01`
- §01: "Request BASE id, referenceNo, serviceTypeId, applicantId, status, formData, assigneeId, infoCycles, submittedAt, dueAt, decidedAt, rejectReason, certificateNo — Status changes only through transition endpoints (§03) — never a free PATCH."
- §01: "Activity BASE id, requestId, actorId, action, fromStatus, toStatus, note, at — Append-only. Baseline writes it on submit; F-20 extends it everywhere."
- §03: "Any other move returns 409 INVALID_TRANSITION."
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

- **PQ-01** — canonical tracker ids (duplicates #54–#77). *(Status 2026-10-18: answered by product owner — see `00-open-questions.md`.)*
- **PQ-02** — Baseline-Verify stories implemented from scratch. *(Status 2026-10-18: resolved from evidence — see `00-open-questions.md`.)*
- **PQ-06** — the fixed form fields. *(Status 2026-10-18: approved default — see `00-open-questions.md`.)*
- **PQ-07** — effects of deactivating a service / editing slaDays. *(Status 2026-10-18: decided (evidence + approved default) — see `00-open-questions.md`.)*
- **PQ-09** — HTTP statuses and titles for error codes. *(Status 2026-10-18: approved default — see `00-open-questions.md`.)*
- **PQ-10** — whether a DRAFT counts as open. *(Status 2026-10-18: awaiting product-owner input — see `00-open-questions.md`.)*

---

## Attachments

None. Source document: `Khidma-PRD-Lite.pdf` at the workspace root (relevant text quoted above).

---

## Dependencies

- **Blocked by / related ids:** #30 (F-02 Role guards), #33 (F-03 Public catalog).
- **Depends on code areas or other stories:** builds on the code created by the stories above. Execution order is in `.squad/plans/00-index.md`.

## Technical hints (optional)

- Repo root for application code: `app/`. Primary language: typescript.

<!-- planning-context:start (generated by .squad/tools/planning_context.py — do not edit by hand) -->

## Planning context from earlier plans

Generated from the committed code in `app/` and from every plan that runs **before** this story. These contracts are already decided. **Reuse them exactly** (same file paths, function names and signatures, table and column names, problem codes, routes). Do not rename or re-create them.

### This plan

- Global NN **05**. The H1 must read `# Story 05 — <title> (Story: 38)`. The closing STOP line names Story 06 (#88).

### Dependency plans

- #30: `.squad/plans/role-guards/02-story-30.md`
- #33: `.squad/plans/public-catalog/03-story-33.md`

Read a dependency plan with `read_file` only when a detail you need is not summarised below.

### Migrations

- **Next free migration number: `003`.** Use it for the first migration this story creates; never reuse a number below.

- `001_accounts.sql` — existing code
- `002_catalog.sql` — #33 (.squad/plans/public-catalog/03-story-33.md)

### Tables (name: columns — owner)

- `departments`: id, name, maxActivePerReviewer — existing code
- `required_documents`: id, serviceTypeId, typeCode, label, mandatory — #33 (.squad/plans/public-catalog/03-story-33.md)
- `schema_migrations`: name, appliedAt — existing code
- `service_types`: id, code, name, departmentId, slaDays, allowMultiple, isActive — #33 (.squad/plans/public-catalog/03-story-33.md)
- `users`: id, nationalId, name, email, role, departmentId, passwordHash — existing code

### Exported helpers and types (planned)

- `ApiProblem` in `app/web/src/api/auth.ts` — `export class ApiProblem extends Error {` — existing code
- `App` in `app/web/src/App.tsx` — `export function App() {` — existing code
- `AppConfig` in `app/api/core/config.ts` — `export interface AppConfig { port: number; jwtSecret: string; databasePath: string }` — existing code
- `AppDeps` in `app/api/app.ts` — `export interface AppDeps { db: Database; clock: Clock; jwtSecret: string; limiter?: LoginRateLimiter }` — existing code
- `AuthDeps` in `app/api/modules/accounts/auth.service.ts` — `export interface AuthDeps { db: Database; clock: Clock; jwtSecret: string }` — existing code
- `CATALOG_SEED_FILE` in `app/api/core/db/seed.ts` — `export const CATALOG_SEED_FILE = fileURLToPath(new URL('../../../db/seed/services.json', import.meta.url));` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `Clock` in `app/api/core/clock.ts` — `export interface Clock { now(): Date }` — existing code
- `Database` in `app/api/core/db/connection.ts` — `export type Database = BetterSqlite3.Database;` — existing code
- `LoginPage` in `app/web/src/pages/LoginPage.tsx` — `export function LoginPage() {` — existing code
- `LoginRateLimiter` in `app/api/modules/accounts/login-rate-limiter.ts` — `export interface LoginRateLimiter {` — existing code
- `MIGRATIONS_DIR` in `app/api/core/db/migrate.ts` — `export const MIGRATIONS_DIR = fileURLToPath(new URL('../../../db/migrations/', import.meta.url));` — existing code
- `NormalisedServiceSettings` in `app/api/rules/service-settings.ts` — `export interface NormalisedServiceSettings { slaDays?: number; isActive?: boolean }` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `PROBLEM_TITLES` in `app/api/core/problem.ts` — `export const PROBLEM_TITLES: Record<ProblemCode, string> = {` — existing code
- `PlaceholderArea` in `app/web/src/pages/PlaceholderArea.tsx` — `export function PlaceholderArea({ heading }: { heading: string }) {` — existing code
- `ProblemCode` in `app/api/core/problem.ts` — `export type ProblemCode = 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'UNAUTHENTICATED'; // UNAUTHENTICATED: Q-16` — existing code
- `ProblemError` in `app/api/core/problem.ts` — `export class ProblemError extends Error {` — existing code
- `PublicRequiredDocument` in `app/api/modules/catalog/services.repository.ts` — `export interface PublicRequiredDocument {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `PublicServiceDetail` in `app/api/modules/catalog/services.repository.ts` — `export interface PublicServiceDetail extends PublicServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `PublicServiceSummary` in `app/api/modules/catalog/services.repository.ts` — `export interface PublicServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `PublicUser` in `app/api/modules/accounts/users.repository.ts` — `export interface PublicUser { id: number; name: string; email: string; role: Role; departmentId: number | null }` — existing code
- `RequireRole` in `app/web/src/session/RequireRole.tsx` — `export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `RequiredDocument` in `app/web/src/api/catalog.ts` — `export interface RequiredDocument {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `Role` in `app/api/modules/accounts/users.repository.ts` — `export type Role = 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR';` — existing code
- `SEED_FILE` in `app/api/core/db/seed.ts` — `export const SEED_FILE = fileURLToPath(new URL('../../../db/seed/accounts.json', import.meta.url));` — existing code
- `SEED_PASSWORD` in `app/api/core/db/seed.ts` — `export const SEED_PASSWORD = 'Passw0rd!'; // PRD §06 seed data` — existing code
- `SESSION_COOKIE` in `app/api/modules/accounts/auth.service.ts` — `export const SESSION_COOKIE = 'khidma_session';` — existing code
- `SESSION_TTL_SECONDS` in `app/api/modules/accounts/auth.service.ts` — `export const SESSION_TTL_SECONDS = 3600;` — existing code
- `ServiceDetail` in `app/web/src/api/catalog.ts` — `export interface ServiceDetail extends ServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `ServiceRow` in `app/api/modules/catalog/services.repository.ts` — `export interface ServiceRow {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `ServiceSettingsInput` in `app/api/rules/service-settings.ts` — `export interface ServiceSettingsInput { slaDays?: unknown; active?: unknown }` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `ServiceSettingsPatch` in `app/api/modules/catalog/services.repository.ts` — `export interface ServiceSettingsPatch {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `ServiceSummary` in `app/web/src/api/catalog.ts` — `export interface ServiceSummary {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `ServicesDeps` in `app/api/modules/catalog/services.routes.ts` — `export interface ServicesDeps { db: Database }` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `SessionProvider` in `app/web/src/session/SessionContext.tsx` — `export function SessionProvider({ children }: { children: ReactNode }) {` — existing code
- `SessionUser` in `app/web/src/api/auth.ts` — `export interface SessionUser { id: number; name: string; email: string; role: Role; departmentId: number | null }` — existing code
- `TEST_SECRET` in `app/api/test/helpers.ts` — `export const TEST_SECRET = 'test-secret';` — existing code
- `USERS` in `app/web/src/test/fetchStub.ts` — `export const USERS: Record<string, SessionUser> = {` — existing code
- `UserWithHash` in `app/api/modules/accounts/users.repository.ts` — `export interface UserWithHash extends PublicUser { passwordHash: string }` — existing code
- `assertDepartmentScope` in `app/api/rules/data-scope.ts` — `export function assertDepartmentScope(user: PublicUser, recordDepartmentId: number): void {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `assertOwnsRecord` in `app/api/rules/data-scope.ts` — `export function assertOwnsRecord(user: PublicUser, ownerUserId: number): void {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `authRouter` in `app/api/modules/accounts/auth.routes.ts` — `export function authRouter(deps: AuthDeps & { limiter: LoginRateLimiter }): Router {` — existing code
- `authenticate` in `app/api/modules/accounts/auth.service.ts` — `export async function authenticate(deps: AuthDeps, email: string, password: string): Promise<{ user: PublicUser; token: string }> {` — existing code
- `createApp` in `app/api/app.ts` — `export function createApp(deps: AppDeps): Express {` — existing code
- `createLoginRateLimiter` in `app/api/modules/accounts/login-rate-limiter.ts` — `export function createLoginRateLimiter(` — existing code
- `fakeClock` in `app/api/test/helpers.ts` — `export function fakeClock(start: Date): Clock & { advance(ms: number): void } {` — existing code
- `fetchMe` in `app/web/src/api/auth.ts` — `export async function fetchMe(): Promise<SessionUser | null> {` — existing code
- `fetchService` in `app/web/src/api/catalog.ts` — `export async function fetchService(code: string): Promise<ServiceDetail> {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `findActiveServiceDetail` in `app/api/modules/catalog/services.repository.ts` — `export function findActiveServiceDetail(db: Database, code: string): PublicServiceDetail | undefined {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `findPublicUserById` in `app/api/modules/accounts/users.repository.ts` — `export function findPublicUserById(db: Database, id: number): PublicUser | undefined {` — existing code
- `findServiceById` in `app/api/modules/catalog/services.repository.ts` — `export function findServiceById(db: Database, id: number): ServiceRow | undefined {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `findServiceDetailById` in `app/api/modules/catalog/services.repository.ts` — `export function findServiceDetailById(db: Database, id: number): (PublicServiceDetail & { isActive: boolean }) | undefined {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `findUserByEmail` in `app/api/modules/accounts/users.repository.ts` — `export function findUserByEmail(db: Database, normalizedEmail: string): UserWithHash | undefined {` — existing code
- `json` in `app/web/src/test/fetchStub.ts` — `export function json(status: number, body?: unknown): Response {` — existing code
- `listActiveServices` in `app/api/modules/catalog/services.repository.ts` — `export function listActiveServices(db: Database): PublicServiceSummary[] {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `listServices` in `app/web/src/api/catalog.ts` — `export async function listServices(): Promise<ServiceSummary[]> {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `loadConfig` in `app/api/core/config.ts` — `export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {` — existing code
- `login` in `app/web/src/api/auth.ts` — `export async function login(email: string, password: string): Promise<SessionUser> {` — existing code
- `logout` in `app/web/src/api/auth.ts` — `export async function logout(): Promise<void> {` — existing code
- `normalizeEmail` in `app/api/modules/accounts/email.ts` — `export function normalizeEmail(raw: string): string { return raw.trim().toLowerCase(); }` — existing code
- `openDatabase` in `app/api/core/db/connection.ts` — `export function openDatabase(path: string): Database {` — existing code
- `parseServiceSettings` in `app/api/rules/service-settings.ts` — `export function parseServiceSettings(input: ServiceSettingsInput): NormalisedServiceSettings {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `problem` in `app/web/src/test/fetchStub.ts` — `export const problem = (status: number, code: string, title: string) =>` — existing code
- `problemMiddleware` in `app/api/core/problem.ts` — `export function problemMiddleware(): ErrorRequestHandler {` — existing code
- `requireRole` in `app/api/modules/accounts/require-role.ts` — `export function requireRole(deps: AuthDeps, roles: readonly Role[]): RequestHandler {` — #30 (.squad/plans/role-guards/02-story-30.md)
- `resolveSession` in `app/api/modules/accounts/auth.service.ts` — `export function resolveSession(deps: AuthDeps, token: string | undefined): PublicUser {` — existing code
- `roleHome` in `app/web/src/session/roleHome.ts` — `export function roleHome(role: Role): string {` — existing code
- `runMigrations` in `app/api/core/db/migrate.ts` — `export function runMigrations(db: Database, migrationsDir: string, clock: Clock): string[] {` — existing code
- `seedAccounts` in `app/api/core/db/seed.ts` — `export async function seedAccounts(db: Database, seedFile: string): Promise<{ departments: number; users: number }> {` — existing code
- `seedCatalog` in `app/api/core/db/seed.ts` — `export function seedCatalog(db: Database, seedFile: string): { serviceTypes: number; requiredDocuments: number } {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `seededDb` in `app/api/test/helpers.ts` — `export async function seededDb(): Promise<Database> {` — existing code
- `servicesRouter` in `app/api/modules/catalog/services.routes.ts` — `export function servicesRouter(deps: ServicesDeps): Router {` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `stubFetch` in `app/web/src/test/fetchStub.ts` — `export function stubFetch(handlers: Record<string, Handler> = {}) {` — existing code
- `systemClock` in `app/api/core/clock.ts` — `export const systemClock: Clock = { now: () => new Date() };` — existing code
- `updateServiceSettings` in `app/api/modules/catalog/services.repository.ts` — `export function updateServiceSettings(db: Database, id: number, patch: ServiceSettingsPatch): void {` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `useSession` in `app/web/src/session/SessionContext.tsx` — `export function useSession(): SessionValue {` — existing code

### Problem codes (planned)

- `FORBIDDEN` → HTTP 403 — #30 (.squad/plans/role-guards/02-story-30.md)
- `INVALID_CREDENTIALS` → HTTP 401 — existing code
- `NOT_FOUND` → HTTP 404 — #33 (.squad/plans/public-catalog/03-story-33.md)
- `RATE_LIMITED` → HTTP 429 — existing code
- `UNAUTHENTICATED` → HTTP 401 — existing code
- `VALIDATION_ERROR` → HTTP 400 — existing code

### Routes (planned)

- `GET /` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `GET /:code` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `GET /api/v1/_probe/applicant` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /api/v1/_probe/reviewer` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /api/v1/_probe/staff` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /api/v1/_probe/supervisor` — #30 (.squad/plans/role-guards/02-story-30.md)
- `GET /me` — #30 (.squad/plans/role-guards/02-story-30.md)
- `PATCH /:id` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `USE /api/v1/services` — #33 (.squad/plans/public-catalog/03-story-33.md)

### Files created by earlier plans

Edit these with **File:**; never **Create file:** them again.

- `.squad/plans/edit-service-settings/00-overview.md` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `.squad/plans/public-catalog/00-overview.md` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/api/modules/accounts/require-role.ts` — #30 (.squad/plans/role-guards/02-story-30.md)
- `app/api/modules/catalog/services.repository.ts` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/api/modules/catalog/services.routes.ts` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/api/rules/data-scope.ts` — #30 (.squad/plans/role-guards/02-story-30.md)
- `app/api/rules/service-settings.ts` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `app/db/migrations/002_catalog.sql` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/db/seed/services.json` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/api/catalog.ts` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/pages/CatalogDetailPage.tsx` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/pages/CatalogPage.tsx` — #33 (.squad/plans/public-catalog/03-story-33.md)
- `app/web/src/pages/SupervisorServicesPage.tsx` — #36 (.squad/plans/edit-service-settings/04-story-36.md)
- `app/web/src/session/RequireRole.tsx` — #30 (.squad/plans/role-guards/02-story-30.md)

### Keep these contracts (later plans already depend on them)

This story is being re-planned. Later plans already use the names below. Keep them exactly (same names, files, signatures, tables, migration). Change only what the decided answers require.

- `ActivityRow` in `app/api/modules/requests/requests.repository.ts`
- `ProblemCode` in `app/api/core/problem.ts`
- `RequestRecord` in `app/web/src/api/requests.ts`
- `RequestRow` in `app/api/modules/requests/requests.repository.ts`
- `RequestStatus` in `app/api/rules/request-transitions.ts`
- `RequestsDeps` in `app/api/modules/requests/requests.routes.ts`
- `SubmittableRequest` in `app/api/rules/request-transitions.ts`
- `appendActivity` in `app/api/modules/requests/requests.repository.ts`
- `assertCanEditDraft` in `app/api/rules/request-transitions.ts`
- `assertCanSubmit` in `app/api/rules/request-transitions.ts`
- `assertFormDataPresent` in `app/api/rules/request-transitions.ts`
- `fetchRequest` in `app/web/src/api/requests.ts`
- `findById` in `app/api/modules/requests/requests.repository.ts`
- `insertDraft` in `app/api/modules/requests/requests.repository.ts`
- `markSubmitted` in `app/api/modules/requests/requests.repository.ts`
- `requestsRouter` in `app/api/modules/requests/requests.routes.ts`
- `submitRequest` in `app/web/src/api/requests.ts`
- `updateFormData` in `app/api/modules/requests/requests.repository.ts`
- table `activity_log` (id, requestId, actorId, action, fromStatus, toStatus, note, at)
- table `requests` (id, referenceNo, serviceTypeId, applicantId, status, formData, assigneeId, infoCycles, submittedAt, dueAt, decidedAt, rejectReason, certificateNo)
- file `app/db/migrations/003_requests.sql`
- file `app/api/rules/request-transitions.ts`
- file `app/api/modules/requests/requests.repository.ts`
- file `app/api/modules/requests/requests.routes.ts`
- file `app/web/src/api/requests.ts`
- file `app/web/src/pages/DraftEditorPage.tsx`
- migration `003_requests.sql`

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

- **PQ-02** — These are tagged **Baseline-Verify**, but the repo has no baseline beyond #28. Implement them from scratch like #28? **Recommended:** Yes, implement from scratch; "verify" means their tests prove the PRD behaviour. **Status:** **Resolved from evidence (2026-10-18):** implement. Tracker scope note: "verify existing behavior and avoid reimplementation unless a gap is confirmed"; the code in `app/` has no guards, catalog or requests (gap confirmed).
- **PQ-06** — What is the "**fixed form**"? Which fields, types and rules? Same for all services or per service? **Recommended:** Fixed field set **per service**, defined in code (not dynamic). SHOP-LIC: `shopName` (3–100), `shopAddress` (5–200), `activityType` (3–100). SIGN-PMT: `shopName`, `signText` (1–100), `signWidthCm` and `signHeightCm` (integer 10–2000). EVENT-PMT: `eventName` (3–100), `eventDate` (date ≥ today), `venue` (5–200), `expectedAttendees` (integer 1–100000). All required. **Status:** **Approved default (product owner, 2026-10-18):** recommendation adopted. "dynamic forms" is cut from v1, so the per-service field sets are fixed in code.
- **PQ-07** — Effects of **deactivating** a service, and of editing `slaDays`? **Recommended:** Inactive services are hidden from the catalog (detail → 404). New drafts and submits fail with `409 SERVICE_INACTIVE`. In-flight requests are unaffected. An `slaDays` change does **not** move existing `dueAt` (stored at submit). **Status:** **Decided:** inactive services are not listed publicly (evidence: F-03; #33 AC). **Approved default (product owner, 2026-10-18):** recommendation adopted. Inactive detail → 404; new drafts and submits → `409 SERVICE_INACTIVE`; in-flight requests unaffected; `dueAt` is not recomputed (F-16 "set on submit").
- **PQ-09** — HTTP status and public title for the PRD codes, plus a generic validation title (the approved `VALIDATION_ERROR` title is login-specific). **Recommended:** `REQ_INCOMPLETE` 422 "Complete all required fields and documents before submitting." · `REQ_DUPLICATE_OPEN` 409 "You already have an open request for this service." · `SERVICE_INACTIVE` 409 "This service is not currently available." · `INVALID_TRANSITION` 409 (PRD) "This action is not allowed in the request's current status." · `LOAD_LIMIT` 409 "You have reached your active request limit." · `INFO_LIMIT` 409 "This request has reached the maximum number of information requests." · `NOT_FOUND` 404 "Not found." · `VALIDATION_ERROR` outside login 400 "Some fields are invalid.", with a `fields` array of invalid field names. **Status:** **Approved default (product owner, 2026-10-18):** recommendation adopted. Statuses and titles as in the table; consistent with the PRD-given `409 INVALID_TRANSITION` and BR-18 403.
- **PQ-10** — Does a **DRAFT** count as "open" for BR-03? May an applicant hold several drafts for one service? **Recommended:** DRAFT is **not** open. Multiple drafts are allowed. The guard runs at submit only. **Status:** **Needs product-owner input.** The recommendation (DRAFT not open) departs from the literal BR-03 text, under which DRAFT counts as open.

### Conventions

- Business-rule pure functions live in `app/api/rules/` (AGENTS.md), never under `app/api/modules/`.
- Never reuse a problem code with a different HTTP status than listed under "Problem codes" above. Impossible-state invariants (for example a value the DB CHECK already guarantees) throw a plain `Error`, not a `ProblemError`; Express then answers 500.
- Do not invent answers to product questions; use the decided answers above and cite their PQ ids.

<!-- planning-context:end -->

## Out of scope

- Anything beyond F-05.
- Registration and password reset (simplicity rule).
- Documents (F-06), reference number (F-07), duplicate guard (F-08), due date (F-16), notifications (F-19).
