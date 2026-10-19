# Story 01 — Login with seeded users (Story: 28)

## Prerequisites

- Decisions **D-1 to D-12** are approved. They are recorded in `.squad/stories/login-with-seeded-users/28/intake.md` under **"Approved decisions"** (~lines 73–86).
- **Q-13, Q-14 and Q-15** are approved. They are recorded in the intake under **"Approved decisions — round 2"** (~lines 96–100).
- **Q-16** is approved: `/me` 401 uses code `UNAUTHENTICATED` with title "Not signed in." It is recorded in the intake under **"Approved decisions — round 3"** (~lines 108–112).
- **Status: READY TO EXECUTE.** All decisions D-1 to D-12 and Q-13 to Q-16 are approved, and no open questions remain.
- Repository cloned at `app/` (from `https://github.com/alolo9611-create/Khidma.git`, branch `main`, commit `19fc4c2 Initial commit`). It contains only `app/README.md` (1 line: `# Khidma`).
- Toolchain verified on the planning machine: **Node v24.22.0**, **npm 11.19.1**. Every package below declares support for Node 24.
- Dependency on other stories: **unspecified**. The PRD sets no order between F-01 and other features.
- No prior plans exist under `.squad/plans/`. Structure follows squad-kit's `story-skeleton.md`.

---

## Story Goal

Implement F-01 "Login with seeded users" **from scratch** in `app/`. Source of truth: `Khidma-PRD-Lite.pdf` v2.0-lite. Approved decisions: D-1 to D-12 and Q-13 to Q-16.

User-visible outcomes:

1. A seeded user signs in with **email + password** on the SPA login page.
2. `POST /api/v1/auth/login` validates the credentials. On success it sets a **signed JWT (1 hour)** in a **Secure, HttpOnly, SameSite=Lax** cookie and returns `id, name, email, role, departmentId` (D-3, D-6).
3. The SPA sends the user to their landing area (D-2). These are placeholder pages:
   - APPLICANT → `/applicant`
   - REVIEWER → `/staff/review`
   - SUPERVISOR → `/staff/supervisor`
4. Failures return problem+json:
   - `401 INVALID_CREDENTIALS` for both wrong password and unknown email, with the same message.
   - `400 VALIDATION_ERROR` for malformed input.
   - `429 RATE_LIMITED` after 5 failed attempts per IP within 15 minutes (D-5, D-10).
5. `POST /api/v1/auth/logout` clears the cookie (D-4).
6. `GET /api/v1/auth/me` restores the signed-in user after a page reload, using the session cookie. It returns the D-6 fields, or `401` if the session is missing, expired or invalid (Q-13). This is a minimal supporting endpoint, not a new product feature.
7. Seed: 2 departments (Licensing, Events) and 6 fictional users (2 APPLICANT, 3 REVIEWER, 1 SUPERVISOR) with password "Passw0rd!", stored as Argon2id hashes (D-7, D-8, D-11).
8. Minimal project skeleton following PRD §06 layout, plus `AGENTS.md` (D-12).

**Not in scope:**

- Registration and password reset (PRD simplicity rule: "If an agent's plan adds any of these, the plan is rejected at review").
- Role guards on API or UI: F-02 / BR-18. The landing pages are **not** protected in this story.
- National ID masking: F-21 / BR-16. `nationalId` is simply never returned (D-6).
- Services, requests, notifications and activity log.
- Refresh tokens and token revocation (D-3, D-4).

---

## Context — Read These Files First

1. `.squad/stories/login-with-seeded-users/28/intake.md`, specifically:
   - **"PRD requirements"** (~lines 34–52): verbatim PRD quotes.
   - **"Approved decisions"** (~lines 73–86): D-1 to D-12.
   - **"Approved decisions — round 2"** (~lines 96–100): Q-13 to Q-15.
   - **"Approved decisions — round 3"** (~lines 108–112): Q-16.
2. `Khidma-PRD-Lite.pdf` (workspace root):
   - §01: `User` key fields `id, nationalId, name, email, role, departmentId`, and `Department` key fields `id, name, maxActivePerReviewer`.
   - §06: repo layout, engineering rules, seed data, and the `POST /auth/login` row.
3. `app/README.md`: currently 1 line. Task 13 replaces it with the developer README.
4. `.squad/config.yaml:4` sets `primaryLanguage: typescript`, which matches D-1.

---

## Approved answers (Q-13 to Q-16)

| ID | Answer | Status |
|----|--------|--------|
| **Q-13** Session restore | Add `GET /api/v1/auth/me`. It reads the existing HttpOnly `khidma_session` cookie and returns the D-6 fields. It returns `401` if the session is missing, expired or invalid. | **Approved** |
| **Q-14** Rate-limit semantics | (a) While blocked, **all** login attempts from that IP, including correct ones, get `429 RATE_LIMITED`. (b) A successful login does **not** reset the count. (c) **Sliding** window over the last 15 minutes. (d) Only `INVALID_CREDENTIALS` outcomes count; `VALIDATION_ERROR` does not. | **Approved** |
| **Q-15** Public error wording | `INVALID_CREDENTIALS` → "Invalid email or password." · `VALIDATION_ERROR` → "Email and password are required." · `RATE_LIMITED` → "Too many failed login attempts. Try again later." | **Approved** |
| **Q-16** `/me` 401 code and wording | Code `UNAUTHENTICATED`, title "Not signed in." The same response covers a missing, expired or invalid session, and a token whose user no longer exists. | **Approved** |

---

## Design notes

### Cookie, CSRF and logout limitation (D-3, D-4)

- **Cookie:**
  - Name: `khidma_session`.
  - Attributes: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`.
  - Value: the JWT, signed with HS256 using `JWT_SECRET`.
  - Claims: `sub` (user id as a string), `role`, `iat` and `exp`, with `exp = iat + 3600`. `iat` comes from the **injected Clock**, never a direct `now()` (PRD §06).
- **Minimal CSRF approach (no CSRF token needed for this story):**
  1. `SameSite=Lax` means the browser does not attach the cookie to cross-site `POST` requests. A forged cross-site form therefore arrives unauthenticated.
  2. The API accepts request bodies **only as `application/json`** (`express.json()`). An HTML form cannot send JSON cross-site without a CORS preflight, so a forged login request arrives with no parsed body and fails with `VALIDATION_ERROR`.
  3. **No CORS middleware.** The API sends no `Access-Control-Allow-*` headers, so cross-origin preflights fail. In dev the SPA reaches the API **same-origin** through the Vite proxy.
  4. **No state-changing `GET` routes.** `Lax` still sends cookies on top-level GET navigations.
  - The only endpoint that reads the cookie is `GET /api/v1/auth/me` (Q-13). It is **read-only**, so a cross-site navigation that carries the cookie changes nothing. With no CORS headers (rule 3), another origin cannot read its JSON response. When F-02 adds cookie-authenticated mutations, rules 1–4 must stay in force. F-02 may add an `Origin` header check if it needs more.
- **Logout limitation (document in the developer README, Task 13):** logout only tells the browser to delete the cookie. The JWT is **not revoked**: a copy of the token stays valid until its `exp`, at most 1 hour. That is acceptable for Lite (D-4).
- **Local dev and `Secure`:** Chrome and Firefox accept `Secure` cookies on `http://localhost`. Safari has historically rejected them over plain http, so use Chrome or Firefox for local dev. Tests do not depend on a browser.

### Rate limiter (D-10, Q-14)

- An in-memory store keyed by `req.ip`, holding the failure timestamps for each IP.
- Old timestamps are pruned whenever the store is accessed. There are no timers and no background jobs (PRD: "No background jobs").
- It takes an injected `Clock` and is constructed per app instance, so each test gets a fresh limiter.
- **Limitation:** counts reset when the process restarts and are not shared between processes. That is acceptable for Lite.

### Seeded accounts (D-7, D-9, D-11)

All values are fictional. Emails use the reserved `.test` TLD. National IDs start with `0`, so they are obviously not real.

| id | name | email | role | department |
|----|------|-------|------|------------|
| 1 | Faisal Demo | faisal@khidma.test | APPLICANT | — (`null`) |
| 2 | Huda Demo | huda@khidma.test | APPLICANT | — (`null`) |
| 3 | Noura Demo | noura@khidma.test | REVIEWER | Licensing |
| 4 | Omar Demo | omar@khidma.test | REVIEWER | Licensing |
| 5 | Layla Demo | layla@khidma.test | REVIEWER | Events |
| 6 | Khalid Demo | khalid@khidma.test | SUPERVISOR | Licensing |

- National IDs are `0000000001` to `0000000006`, matching the user id.
- Password for all six: "Passw0rd!".
- Departments: `1` Licensing and `2` Events, each with `maxActivePerReviewer = 10` (PRD: "Load limit, default 10 (BR-06)").
- Faisal, Noura and Khalid are the PRD's own fictional personas. Noura is in Licensing because the PRD happy path has her pick from "the Licensing queue".
- **PRD consequence, not a choice:** the PRD seeds 1 supervisor and says "Each staff user belongs to one department", so **Events has no supervisor**. Khalid's department is not stated in the PRD; Licensing is the D-7 assignment.

### Final layout created by this story

```text
app/
├── .gitignore
├── AGENTS.md
├── README.md                     (rewritten)
├── api/
│   ├── package.json  tsconfig.json  vitest.config.ts  .env.example
│   ├── app.ts  server.ts
│   ├── core/       clock, config, problem+json, db (connection, migrate, seed)
│   ├── modules/accounts/         E-01 Accounts & access
│   ├── rules/.gitkeep            (F-01 cites no BR)
│   ├── activity/.gitkeep         (F-20 owns the writer)
│   ├── scripts/    migrate.ts  seed.ts
│   └── test/       helpers
├── web/
│   ├── package.json  tsconfig.json  vite.config.ts  index.html
│   └── src/        main, App, api client, session, pages, tests
└── db/
    ├── migrations/001_accounts.sql
    └── seed/accounts.json
```

---

## Implementation tasks

### 1 — Repository housekeeping

**Create file: `app/.gitignore`**

```gitignore
node_modules/
dist/
.env
db/*.sqlite
db/*.sqlite-*
```

**Create file: `app/api/rules/.gitkeep`** (empty).
**Create file: `app/api/activity/.gitkeep`** (empty).

Create no other placeholder folders (D-12).

### 2 — API package

**Create file: `app/api/package.json`**

```json
{
  "name": "khidma-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch --env-file=.env server.ts",
    "start": "tsx --env-file=.env server.ts",
    "db:migrate": "tsx --env-file=.env scripts/migrate.ts",
    "db:seed": "tsx --env-file=.env scripts/seed.ts",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  }
}
```

Then install the dependencies. **Do not** hand-write versions; let npm record them. Run in `app/api/`:

```bash
npm install express better-sqlite3 argon2 jsonwebtoken cookie-parser
npm install -D typescript tsx vitest supertest @types/node @types/express @types/better-sqlite3 @types/jsonwebtoken @types/supertest @types/cookie-parser
```

Versions current at planning time (2026-10-18): express 5.3.0, better-sqlite3 13.0.3, argon2 0.45.1, jsonwebtoken 9.0.3, cookie-parser 1.4.7, vitest 5.0.5, supertest 7.3.1, tsx 4.23.15, typescript 7.0.2. If `argon2` or `better-sqlite3` fails to install (native build), **stop and report**. Do not swap libraries.

**Create file: `app/api/tsconfig.json`**

- `"target": "ES2023"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"strict": true`, `"esModuleInterop": true`, `"skipLibCheck": true`, `"noEmit": true`, `"types": ["node"]`.
- `"include"`: `["**/*.ts"]`. `"exclude"`: `["node_modules"]`.
- Import specifiers use the `.js` suffix (NodeNext), e.g. `import { createApp } from './app.js'`.
- TypeScript 7 removed or changed some compiler options. If `npm run typecheck` rejects an option above, adjust **only** `tsconfig.json` to the nearest supported equivalent, and note the change in the report.

**Create file: `app/api/vitest.config.ts`**: `defineConfig({ test: { environment: 'node', include: ['**/*.test.ts'], exclude: ['node_modules/**'] } })`.

**Create file: `app/api/.env.example`**

```dotenv
PORT=3000
JWT_SECRET=dev-only-change-me-to-a-long-random-string
DATABASE_PATH=../db/khidma.sqlite
```

### 3 — Core: clock, config, problem+json

**Create file: `app/api/core/clock.ts`**

```ts
export interface Clock { now(): Date }
export const systemClock: Clock = { now: () => new Date() };
```

This is the **only** place in the API that calls `new Date()` with no arguments (PRD: "An injected Clock — no direct now()").

**Create file: `app/api/core/config.ts`**

```ts
export interface AppConfig { port: number; jwtSecret: string; databasePath: string }
export function loadConfig(env: NodeJS.ProcessEnv): AppConfig
```

- `port = Number(env.PORT ?? 3000)`.
- `databasePath = env.DATABASE_PATH ?? '../db/khidma.sqlite'`.
- If `JWT_SECRET` is missing or empty, throw `Error('JWT_SECRET is required')`.

**Create file: `app/api/core/problem.ts`**

```ts
export type ProblemCode = 'INVALID_CREDENTIALS' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'UNAUTHENTICATED'; // UNAUTHENTICATED: Q-16
export class ProblemError extends Error {
  constructor(readonly status: number, readonly code: ProblemCode, readonly title: string) { super(title); }
}
export function problemMiddleware(): ErrorRequestHandler
```

- `problemMiddleware` turns a `ProblemError` into a response with status `err.status`, header `Content-Type: application/problem+json`, and body `{ "type": "about:blank", "title": err.title, "status": err.status, "code": err.code }`.
- An `express.json()` parse failure (`err.type === 'entity.parse.failed'`) becomes `400 VALIDATION_ERROR` using the approved Q-15 title.
- Any other error is passed to `next(err)`.
- Title strings are the approved Q-15 wording, plus the approved Q-16 title for `UNAUTHENTICATED` ("Not signed in."). They are kept as one exported constant map `PROBLEM_TITLES` in this file.

### 4 — Database: migration file, connection, runner

**Create file: `app/db/migrations/001_accounts.sql`**

```sql
CREATE TABLE departments (
  id                    INTEGER PRIMARY KEY,
  name                  TEXT    NOT NULL,
  maxActivePerReviewer  INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE users (
  id            INTEGER PRIMARY KEY,
  nationalId    TEXT    NOT NULL CHECK (length(nationalId) = 10 AND nationalId NOT GLOB '*[^0-9]*'),
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  role          TEXT    NOT NULL CHECK (role IN ('APPLICANT', 'REVIEWER', 'SUPERVISOR')),
  departmentId  INTEGER NULL REFERENCES departments(id),
  passwordHash  TEXT    NOT NULL,
  CHECK ((role = 'APPLICANT' AND departmentId IS NULL) OR (role <> 'APPLICANT' AND departmentId IS NOT NULL))
);
```

- Columns are exactly the PRD §01 key fields, plus `passwordHash` (D-8).
- The last `CHECK` enforces "Each staff user belongs to one department" and D-7 (applicants have `null`).
- **No** ServiceType, Request or other tables (D-11).

**Create file: `app/api/core/db/connection.ts`**

- `openDatabase(path: string): Database` opens `better-sqlite3` and runs `PRAGMA foreign_keys = ON`.
- `':memory:'` is allowed, for tests.

**Create file: `app/api/core/db/migrate.ts`**

```ts
export function runMigrations(db: Database, migrationsDir: string, clock: Clock): string[] // returns names applied
```

1. `CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, appliedAt TEXT NOT NULL)`.
2. List the `*.sql` files in `migrationsDir`, sorted by name. Skip names already present in `schema_migrations`.
3. For each remaining file, inside **one transaction**: `db.exec(sql)`, then insert `(name, clock.now().toISOString())`. If it fails, the transaction rolls back and the error is rethrown.

Export `MIGRATIONS_DIR`, resolved from this file's location to `app/db/migrations` (`new URL('../../../db/migrations/', import.meta.url)`).

**Create file: `app/api/scripts/migrate.ts`**: `loadConfig(process.env)` → `openDatabase(databasePath)` → `runMigrations(db, MIGRATIONS_DIR, systemClock)` → print the names applied.

### 5 — Seed data and seeder

**Create file: `app/db/seed/accounts.json`**

The content is exactly the two tables in **Design notes → Seeded accounts**:

```json
{
  "departments": [
    { "id": 1, "name": "Licensing", "maxActivePerReviewer": 10 },
    { "id": 2, "name": "Events", "maxActivePerReviewer": 10 }
  ],
  "users": [
    { "id": 1, "nationalId": "0000000001", "name": "Faisal Demo", "email": "faisal@khidma.test", "role": "APPLICANT", "departmentId": null },
    { "id": 2, "nationalId": "0000000002", "name": "Huda Demo", "email": "huda@khidma.test", "role": "APPLICANT", "departmentId": null },
    { "id": 3, "nationalId": "0000000003", "name": "Noura Demo", "email": "noura@khidma.test", "role": "REVIEWER", "departmentId": 1 },
    { "id": 4, "nationalId": "0000000004", "name": "Omar Demo", "email": "omar@khidma.test", "role": "REVIEWER", "departmentId": 1 },
    { "id": 5, "nationalId": "0000000005", "name": "Layla Demo", "email": "layla@khidma.test", "role": "REVIEWER", "departmentId": 2 },
    { "id": 6, "nationalId": "0000000006", "name": "Khalid Demo", "email": "khalid@khidma.test", "role": "SUPERVISOR", "departmentId": 1 }
  ]
}
```

The file holds **no** passwords.

**Create file: `app/api/core/db/seed.ts`**

```ts
export const SEED_PASSWORD = 'Passw0rd!'; // PRD §06 seed data
export async function seedAccounts(db: Database, seedFile: string): Promise<{ departments: number; users: number }>
```

- Read and parse `seedFile`.
- Hash `SEED_PASSWORD` **once per user** with `argon2.hash(SEED_PASSWORD, { type: argon2.argon2id })`.
- Insert departments, then users, all in **one transaction**, using `INSERT OR IGNORE` keyed by `id` so re-running changes nothing.
- Store emails through `normalizeEmail` (Task 6) so they are lowercase (D-9).
- Return the row counts **after** seeding (`SELECT COUNT(*)`).

Export `SEED_FILE`, resolved to `app/db/seed/accounts.json` the same way as `MIGRATIONS_DIR`.

**Create file: `app/api/scripts/seed.ts`**: `loadConfig` → `openDatabase` → `seedAccounts(db, SEED_FILE)` → print the counts.

### 6 — Accounts module: email normaliser and user lookup

**Create file: `app/api/modules/accounts/email.ts`**

```ts
export function normalizeEmail(raw: string): string { return raw.trim().toLowerCase(); }
```

**Create file: `app/api/modules/accounts/users.repository.ts`**

```ts
export type Role = 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR';
export interface PublicUser { id: number; name: string; email: string; role: Role; departmentId: number | null }
export interface UserWithHash extends PublicUser { passwordHash: string }
export function findUserByEmail(db: Database, normalizedEmail: string): UserWithHash | undefined
export function findPublicUserById(db: Database, id: number): PublicUser | undefined
```

- `findUserByEmail` selects **only** `id, name, email, role, departmentId, passwordHash`.
- `findPublicUserById` selects **only** `id, name, email, role, departmentId`.
- Neither query **ever** selects `nationalId` (D-6).

### 7 — Accounts module: rate limiter (D-10, Q-14)

**Create file: `app/api/modules/accounts/login-rate-limiter.ts`**

```ts
export interface LoginRateLimiter {
  isBlocked(key: string): boolean;
  recordFailure(key: string): void;
}
export function createLoginRateLimiter(clock: Clock, opts = { maxFailures: 5, windowMs: 15 * 60 * 1000 }): LoginRateLimiter
```

- Internally a `Map<string, number[]>` of failure timestamps, from `clock.now().getTime()`.
- Each call first drops timestamps that are `<= now - windowMs` (sliding window).
- `isBlocked` returns `count >= maxFailures`.
- No success-reset method (Q-14 (b)).

### 8 — Accounts module: authenticate service

**Create file: `app/api/modules/accounts/auth.service.ts`**

```ts
export const SESSION_COOKIE = 'khidma_session';
export const SESSION_TTL_SECONDS = 3600;
export interface AuthDeps { db: Database; clock: Clock; jwtSecret: string }
export async function authenticate(deps: AuthDeps, email: string, password: string): Promise<{ user: PublicUser; token: string }>
```

1. `findUserByEmail(db, normalizeEmail(email))`.
2. If there is no user, **or** `argon2.verify(user.passwordHash, password)` is false, throw `new ProblemError(401, 'INVALID_CREDENTIALS', PROBLEM_TITLES.INVALID_CREDENTIALS)`. Both causes use the same error (D-5).
3. `const iat = Math.floor(clock.now().getTime() / 1000)`.
4. `token = jwt.sign({ sub: String(user.id), role: user.role, iat }, jwtSecret, { algorithm: 'HS256', expiresIn: SESSION_TTL_SECONDS })`. jsonwebtoken computes `exp` from the supplied `iat`.
5. Return `{ user: { id, name, email, role, departmentId }, token }`, with `passwordHash` stripped.

Also in this file:

```ts
export function resolveSession(deps: AuthDeps, token: string | undefined): PublicUser
```

1. If `token` is missing or empty, throw `new ProblemError(401, 'UNAUTHENTICATED', PROBLEM_TITLES.UNAUTHENTICATED)`.
2. `jwt.verify(token, jwtSecret, { algorithms: ['HS256'], clockTimestamp: Math.floor(clock.now().getTime() / 1000) })`. Time comes from the **injected Clock**. Any verify error (bad signature, expired, malformed) → the same `401 UNAUTHENTICATED`.
3. `findPublicUserById(db, Number(payload.sub))`. If no row is found → the same `401 UNAUTHENTICATED`.
4. Return the `PublicUser`. It contains the D-6 fields only.

### 9 — Accounts module: routes

**Create file: `app/api/modules/accounts/auth.routes.ts`**

```ts
export function authRouter(deps: AuthDeps & { limiter: LoginRateLimiter }): Router
```

- `POST /login`:
  1. If `limiter.isBlocked(req.ip ?? 'unknown')`, throw `ProblemError(429, 'RATE_LIMITED', …)`.
  2. Validate the body, reading it as `const body = req.body ?? {}`. In Express 5, `req.body` is `undefined` when no JSON body was parsed, for example on a `text/plain` request. `email` and `password` must both be strings, and `email.trim()` and `password` must be non-empty. Otherwise throw `ProblemError(400, 'VALIDATION_ERROR', …)`. This does **not** call `recordFailure` (Q-14 (d)).
  3. Call `authenticate`. If it throws `INVALID_CREDENTIALS`, call `limiter.recordFailure(ip)` and rethrow.
  4. On success, `res.cookie(SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_SECONDS * 1000 })`, then `res.status(200).json(user)`.
- `POST /logout`: `res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })`, then `res.status(204).end()`. It needs no authentication and can be repeated safely.
- `GET /me`: `res.status(200).json(resolveSession(deps, req.cookies?.[SESSION_COOKIE]))`. Errors go to `problemMiddleware`. **Not** rate-limited, because D-10 covers `/login` only.
- **No** other routes: no register or reset.

### 10 — App factory and server

**Create file: `app/api/app.ts`**

```ts
export interface AppDeps { db: Database; clock: Clock; jwtSecret: string; limiter?: LoginRateLimiter }
export function createApp(deps: AppDeps): Express
```

- `const app = express()`.
- `app.use(express.json())`.
- `app.use(cookieParser())`, unsigned, used to read `khidma_session` for `/me`.
- `app.use('/api/v1/auth', authRouter({ ...deps, limiter: deps.limiter ?? createLoginRateLimiter(deps.clock) }))`.
- `app.use(problemMiddleware())`.
- **No** CORS middleware (see the CSRF note).

**Create file: `app/api/server.ts`**: `loadConfig(process.env)` → `openDatabase` → `createApp({ db, clock: systemClock, jwtSecret })` → `listen(port)` → log `Khidma API listening on :<port>`.

### 11 — Web package and app shell

**Create file: `app/web/package.json`**

```json
{
  "name": "khidma-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run"
  }
}
```

Run in `app/web/`:

```bash
npm install react react-dom react-router-dom
npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/user-event @types/react @types/react-dom
```

Versions at planning time: react 19.3.1, react-router-dom 7.18.4, vite 8.3.4, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3.

**Create file: `app/web/vite.config.ts`**

- Import `defineConfig` from `vitest/config`, so the `test` key type-checks.
- `plugins: [react()]`.
- `server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } }` makes requests same-origin, which the cookie and CSRF design require.
- `test: { environment: 'jsdom' }`.

**Create file: `app/web/tsconfig.json`**: `"jsx": "react-jsx"`, `"strict": true`, `"module": "ESNext"`, `"moduleResolution": "Bundler"`, `"types": ["vite/client"]`, `"include": ["src"]`.

**Create file: `app/web/index.html`**: a root `<div id="root">` and `<script type="module" src="/src/main.tsx">`. Title: "Khidma".

**Create file: `app/web/src/main.tsx`**: `createRoot(...).render(<BrowserRouter><SessionProvider><App /></SessionProvider></BrowserRouter>)`.

### 12 — Web: API client, session, pages, routing

**Create file: `app/web/src/api/auth.ts`**

```ts
export type Role = 'APPLICANT' | 'REVIEWER' | 'SUPERVISOR';
export interface SessionUser { id: number; name: string; email: string; role: Role; departmentId: number | null }
export class ApiProblem extends Error { constructor(readonly status: number, readonly code: string, title: string) { super(title); } }
export async function login(email: string, password: string): Promise<SessionUser>
export async function logout(): Promise<void>
export async function fetchMe(): Promise<SessionUser | null>
```

- `login` makes a `POST` to `/api/v1/auth/login` with `headers: { 'Content-Type': 'application/json' }` and `credentials: 'same-origin'`.
- If the response is not OK, parse the problem+json and throw `ApiProblem(status, code, title)`.
- `logout` makes a `POST` to `/api/v1/auth/logout`.
- `fetchMe` makes a `GET` to `/api/v1/auth/me` with `credentials: 'same-origin'`. A `200` returns the user; a `401` returns `null`. Any other status throws `ApiProblem`.
- **No** `localStorage` or `sessionStorage` anywhere (D-3). The cookie plus `/me` is the only persistence.

**Create file: `app/web/src/session/SessionContext.tsx`**

- A React context with `{ user: SessionUser | null; loading: boolean; setUser(u: SessionUser | null): void }`, plus a `useSession()` hook.
- On mount, `SessionProvider` calls `fetchMe()` **once**. It sets `user` to the result and then sets `loading = false`. If `fetchMe` throws, `user` stays `null`.
- While `loading` is true, the provider renders "Loading…" instead of its children. That way a reload on `/staff/review` shows the restored user instead of briefly showing "not signed in".
- It does **not** auto-redirect: a signed-in user who opens `/login` still sees the login page. Redirect and guard behaviour belongs to F-02.

**Create file: `app/web/src/session/roleHome.ts`**

```ts
export function roleHome(role: Role): string {
  switch (role) {
    case 'APPLICANT': return '/applicant';
    case 'REVIEWER': return '/staff/review';
    case 'SUPERVISOR': return '/staff/supervisor';
  }
}
```

**Create file: `app/web/src/pages/LoginPage.tsx`**

- Labelled inputs "Email" (`type="email"`) and "Password" (`type="password"`), and a button "Sign in".
- On submit: `login(email, password)` → `setUser(user)` → `navigate(roleHome(user.role))`.
- On `ApiProblem`, render its `title` in an element with `role="alert"`.
- **No** register, forgot-password or seeded-credential hints (D-7: credentials only in the developer README).

**Create file: `app/web/src/pages/PlaceholderArea.tsx`**: `PlaceholderArea({ heading })` renders `<h1>{heading}</h1>`, the text "Signed in as {user.name}" when the session has a user, and a "Sign out" button. The button calls `logout()`, then `setUser(null)`, then `navigate('/login')`.

**Create file: `app/web/src/App.tsx`**, with routes:

- `/login` → `LoginPage`
- `/applicant` → `PlaceholderArea heading="Applicant area"`
- `/staff/review` → `PlaceholderArea heading="Staff review area"`
- `/staff/supervisor` → `PlaceholderArea heading="Staff supervisor area"`
- `*` → `<Navigate to="/login" />`

These pages have **no** role guards; F-02 adds them.

### 13 — Project docs

**Create file: `app/AGENTS.md`**, with three sections:

- **Engineering rules:** PRD §06 engineering rules, verbatim (the six bullets quoted in the intake).
- **Simplicity rules:** PRD §00 simplicity rules, verbatim.
- **Commands:** the install, migrate, seed, test and dev commands from **Verification Steps**.

Nothing else.

**File: `app/README.md`**: replace the single line with these sections:

- **Khidma (training project)**
- **Prerequisites:** Node 24 and npm.
- **Setup:** `cp api/.env.example api/.env`, then the npm installs, `db:migrate` and `db:seed`.
- **Run:** API with `npm run dev` in `api/`, SPA with `npm run dev` in `web/`, then open `http://localhost:5173` in **Chrome or Firefox** (see the `Secure` cookie note).
- **Seeded accounts (development only):** the six-user table from **Design notes**, plus "Password for all: Passw0rd!". This is the **only** place credentials are documented (D-7).
- **Known limitations:**
  - Logout does not revoke the JWT; a copied token is valid for up to 1 hour.
  - Rate-limit counts are in memory and reset on restart.
  - Landing pages have no role guards yet (F-02).

---

## Edge Cases & Failure Modes

- **Wrong password, existing email:** `401 INVALID_CREDENTIALS`, Q-15 title, no `Set-Cookie`. Enforced in `app/api/modules/accounts/auth.service.ts` (Task 8 step 2).
- **Unknown email:** a response identical to the wrong-password case (status, code, title). Enforced in Task 8 step 2.
- **Mixed-case or space-padded email** (e.g. `"  NOURA@Khidma.TEST "`): succeeds. Enforced by `normalizeEmail` (Task 6) and `COLLATE NOCASE` (Task 4).
- **Missing, non-string or empty `email`/`password`:** `400 VALIDATION_ERROR`. Not counted by the limiter. Enforced in Task 9.
- **Invalid JSON body:** `400 VALIDATION_ERROR` through the `entity.parse.failed` mapping (Task 3).
- **Non-JSON content type** (e.g. a cross-site form post): the body is not parsed, so the request gets `400 VALIDATION_ERROR` (Task 9 validation).
- **6th attempt after 5 failures in 15 minutes:** `429 RATE_LIMITED`, even with correct credentials (Q-14 (a)). Enforced in Task 9 step 1.
- **Failures older than 15 minutes:** no longer counted, so the IP is unblocked. Enforced in Task 7 pruning. Tested by advancing the fake Clock.
- **Token expiry:** `exp - iat = 3600`, with `iat` taken from the injected Clock (Task 8).
- **`JWT_SECRET` missing:** startup fails with `JWT_SECRET is required` (Task 3).
- **Migration fails midway:** the transaction rolls back and the migration is not recorded in `schema_migrations` (Task 4).
- **Seed re-run:** counts stay at 2 departments and 6 users (`INSERT OR IGNORE`, Task 5).
- **Staff user without a department, or applicant with one:** rejected by the DB `CHECK` (Task 4).
- **`nationalId` leakage:** the repository query never selects it (Task 6), and the tests assert it is absent from the login response.
- **Logout without a cookie:** still `204` (Task 9).
- **`/me` with no cookie, a tampered or garbage token, a token signed with a different secret, or an expired token** (fake Clock advanced past `iat + 3600`): `401 UNAUTHENTICATED` problem+json. Enforced in `resolveSession` (Task 8).
- **`/me` with a valid token for a user id that does not exist:** `401 UNAUTHENTICATED` (Task 8 step 3).
- **`/me` response:** contains only the D-6 fields, never `nationalId` or `passwordHash` (Tasks 6, 8).
- **Page reload while signed in:** `SessionProvider` restores the user from `/me` before rendering routes (Task 12).
- **Page reload after logout or expiry:** `/me` gives `401`, so `user` is `null` (Task 12).
- **Native module install failure** (`argon2`, `better-sqlite3`): stop and report. Do not switch libraries (Task 2).
- **Safari dev testing:** the `Secure` cookie may not be stored on `http://localhost`. This is documented in the README and does not affect tests.

---

## Test Plan

All tests use Vitest. API tests use an in-memory SQLite database (`openDatabase(':memory:')`), plus `runMigrations` and `seedAccounts`. Time comes from a fake clock.

**Create file: `app/api/test/helpers.ts`**

- `fakeClock(start: Date)` returns `{ now, advance(ms) }`.
- `seededDb()` is an async helper that runs the migrations and seed into `:memory:` and returns the db.
- `TEST_SECRET = 'test-secret'`.

API unit tests:

1. **Create file: `app/api/modules/accounts/email.test.ts`**: `normalizeEmail` trims and lowercases. For example, `"  Noura@KHIDMA.test "` becomes `"noura@khidma.test"`.
2. **Create file: `app/api/modules/accounts/login-rate-limiter.test.ts`**:
   - Not blocked after 4 failures.
   - Blocked after 5.
   - Unblocked after `advance(15 * 60 * 1000 + 1)`.
   - Keys are independent: IP A blocked, IP B not.
   - Sliding window: 3 failures, then advance 10 minutes, then 2 failures → blocked. Advance 5 minutes and 1 ms → not blocked, because only 2 failures remain in the window.
3. **Create file: `app/api/modules/accounts/auth.service.test.ts`**:
   - Each seeded role authenticates and gets back the D-6 fields only. `Object.keys(user)` equals `['id', 'name', 'email', 'role', 'departmentId']`.
   - A wrong password and an unknown email both throw `ProblemError` with `status 401`, `code 'INVALID_CREDENTIALS'` and **equal** titles.
   - The JWT verifies with `TEST_SECRET` using `jwt.verify(token, TEST_SECRET, { clockTimestamp })`. It has `sub`, `role` and `exp - iat === 3600`, where `iat` equals the fake clock's seconds.
   - The JWT is rejected once `clockTimestamp` is past `iat + 3600`.
   - `resolveSession`:
     - A valid token returns exactly the D-6 keys.
     - These all throw `401 UNAUTHENTICATED`: `undefined`, `''`, a garbage string, a token signed with `'other-secret'`, the fake clock advanced `3600 * 1000 + 1000` ms, and a valid token for `sub: '999'`.

API integration tests, with supertest against `createApp`:

4. **Create file: `app/api/core/db/migrate.test.ts`**:
   - Applies `001_accounts.sql` once; a second run applies nothing.
   - The `CHECK` constraints reject an APPLICANT with a `departmentId`, a REVIEWER without one, and a 9-digit `nationalId`.
5. **Create file: `app/api/core/db/seed.test.ts`**:
   - Counts are 2 departments ("Licensing", "Events") and 2 APPLICANT, 3 REVIEWER and 1 SUPERVISOR users.
   - Every `passwordHash` starts with `$argon2id$` and `argon2.verify(hash, 'Passw0rd!')` is true.
   - No column contains the plaintext "Passw0rd!".
   - Every email equals its lowercase form.
   - Re-running the seed leaves the counts unchanged.
6. **Create file: `app/api/modules/accounts/auth.routes.test.ts`**:
   - **Success, one test per role:** `200`, the body has exactly the D-6 keys and no `nationalId`. `Set-Cookie` contains `khidma_session=`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` and `Max-Age=3600`.
   - **Wrong password / unknown email:** `401`, `Content-Type` matches `application/problem+json`, `code: 'INVALID_CREDENTIALS'`, identical bodies, no `Set-Cookie`. Assert **codes, not messages** (PRD §04).
   - **Malformed input** (missing email, empty password, non-string email, invalid JSON, `text/plain` body): each gives `400 VALIDATION_ERROR`.
   - **Rate limit:** 5 wrong-password posts, then a 6th with **correct** credentials → `429 RATE_LIMITED`. With a fresh app, 5 `VALIDATION_ERROR` posts followed by valid credentials → `200`. With the fake clock advanced 15 minutes and 1 ms after 5 failures → `200`.
   - **Logout:** `POST /api/v1/auth/logout` → `204`, and `Set-Cookie` clears `khidma_session` (an `Expires` in the past). Without a cookie it is still `204`.
   - **No registration or reset:** `POST /api/v1/auth/register`, `/api/v1/auth/reset-password` and `/api/v1/auth/forgot-password` all give `404`.
   - **No CORS:** a request with `Origin: http://evil.test` gets a response with no `Access-Control-Allow-Origin` header.
   - **`/me`:**
     - Log in, then `GET /api/v1/auth/me` with `Cookie: khidma_session=<token>` (set the header manually, because supertest does not resend `Secure` cookies over http) → `200` with exactly the D-6 keys and no `nationalId`.
     - Without a cookie → `401`, `application/problem+json`, `code: 'UNAUTHENTICATED'`.
     - With the fake clock advanced past expiry → `401 UNAUTHENTICATED`.
     - 10 `/me` calls without a cookie do not trigger `429` on a later valid login (the limiter is login-only).

Web tests (jsdom; `fetch` stubbed with `vi.stubGlobal`):

7. **Create file: `app/web/src/session/roleHome.test.ts`**: the three role-to-path mappings.
8. **Create file: `app/web/src/pages/LoginPage.test.tsx`**, rendering `<MemoryRouter initialEntries={['/login']}><SessionProvider><App /></SessionProvider></MemoryRouter>`. The `fetch` stub answers `GET /api/v1/auth/me` with `401` unless a test says otherwise.
   - **Success, one test per role:** fill Email and Password and click "Sign in". The matching heading appears: "Applicant area", "Staff review area" or "Staff supervisor area". `fetch` was called with `/api/v1/auth/login`, `POST` and a JSON body.
   - **401:** the `role="alert"` element shows the problem title, and the URL stays `/login`.
   - **429:** the alert shows the problem title.
   - `window.localStorage.setItem` is never called (use a spy).
   - The page contains no text matching `/register|forgot|reset|Passw0rd/i`.
9. **Create file: `app/web/src/pages/PlaceholderArea.test.tsx`**: "Sign out" calls `POST /api/v1/auth/logout`, clears the session and navigates to `/login`.
10. **Create file: `app/web/src/session/SessionContext.test.tsx`**:
    - Reload restore: render at `/staff/review` with `/me` stubbed `200` for Noura → "Staff review area" and "Signed in as Noura Demo" appear. "Loading…" shows first.
    - With `/me` stubbed `401` → the page renders with no "Signed in as" text.
    - `fetchMe` is called exactly once per mount.

Suite time: the API and web suites together must finish in **under one minute** (PRD §06).

---

## Verification Steps

1. **Install:** in `app/api/`, run `npm install`; in `app/web/`, run `npm install`. Both finish without errors, including the `argon2` and `better-sqlite3` native builds.
2. **Backend builds:** in `app/api/`, `npm run typecheck` reports no errors.
3. **Migrate and seed a fresh DB:**
   - In `app/api/`, run `cp .env.example .env`, then `npm run db:migrate`. It prints `001_accounts.sql`.
   - Then `npm run db:seed`. It prints `departments: 2, users: 6`.
   - Running `npm run db:seed` again prints the same counts.
4. **Tests pass:** run `npm test` in `app/api/` and `npm test` in `app/web/`. Everything is green, with combined time under 60 s.
5. **Frontend builds:** in `app/web/`, `npm run build` reports no errors.
6. **Manual API check**, with `npm run dev` running in `app/api/`:

   ```bash
   curl -i -X POST http://localhost:3000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":" Noura@khidma.test ","password":"Passw0rd!"}'
   ```

   Expect `200`, a `Set-Cookie: khidma_session=…; Max-Age=3600; Path=/; HttpOnly; Secure; SameSite=Lax`, and a body with no `nationalId`. Repeat with a wrong password and expect `401` problem+json with `"code":"INVALID_CREDENTIALS"`.

   Then copy the cookie value and call `/me`:

   ```bash
   curl -i http://localhost:3000/api/v1/auth/me -H 'Cookie: khidma_session=<token from above>'
   ```

   Expect `200` with the D-6 fields. Without the header, expect `401` with `"code":"UNAUTHENTICATED"`.
7. **Frontend runs:** with both dev servers running, open `http://localhost:5173/login` in Chrome or Firefox. Sign in as `faisal@khidma.test`, `noura@khidma.test` and `khalid@khidma.test` in turn; each lands on its area. **Reload the page:** the user and area are still shown. "Sign out" returns to `/login`, and a reload then shows no signed-in user.
8. **Regression:** `grep -ri "localStorage\|register\|reset-password" app/web/src app/api --include=*.ts --include=*.tsx --exclude-dir=node_modules` finds only test assertions.

---

## Done Criteria

- [ ] Given valid seeded credentials, when I submit login, then a token-based session is created (the `khidma_session` JWT cookie) and I enter the role-appropriate area (`/applicant`, `/staff/review`, `/staff/supervisor`).
- [ ] `POST /api/v1/auth/login` returns only `id, name, email, role, departmentId`.
- [ ] Wrong password and unknown email → identical `401 INVALID_CREDENTIALS`. Malformed input → `400 VALIDATION_ERROR`. All responses are problem+json.
- [ ] 5 failed attempts per IP within 15 minutes → `429 RATE_LIMITED`. The limiter uses the injected Clock and has its own tests.
- [ ] `POST /api/v1/auth/logout` clears the cookie. The README documents the no-revocation limitation.
- [ ] `GET /api/v1/auth/me` returns the D-6 fields for a valid session, and `401` problem+json for a missing, expired or invalid session. A page reload restores the signed-in user.
- [ ] Cookie attributes: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`. No token in `localStorage`.
- [ ] The schema comes from `app/db/migrations/001_accounts.sql` through the migration runner only.
- [ ] The seed has 2 departments and 6 fictional users with Argon2id hashes and lowercase emails. There are no services or requests.
- [ ] No registration, password reset, role guards or unrelated screens.
- [ ] `app/AGENTS.md` and `app/README.md` are written. Credentials appear only in the README.
- [ ] Both test suites pass in under one minute.
- [ ] `.squad/plans/login-with-seeded-users/00-overview.md` lists this story.

**STOP HERE. Report to the user and wait for confirmation before proceeding to the next story.**
