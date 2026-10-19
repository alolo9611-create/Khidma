# Login with seeded users

## Feature

- **Feature name (display):** Login with seeded users
- **Feature slug (folder under `plans/`):** `login-with-seeded-users`
- **PRD reference:** F-01 (Epic E-01 Accounts & access) — `Khidma-PRD-Lite.pdf` v2.0-lite

## Tracker (metadata only)

- **Tracker type:** `azure`
- **Work item id:** `28`

---

## Description

As a seeded user, I want to sign in with my email and password so that I can access the portal according to my role.

No registration or password reset in Lite.

Scope note: The PRD marks F-01 as BASELINE ("Already in the sandbox repo"). For this training project the repository (`app/`) is intentionally empty except for `README.md`, so **login must be implemented from scratch**. `Khidma-PRD-Lite.pdf` is the source of truth. Where the PRD is silent, the item is listed under **Open questions** below — do not decide it in the plan.

---

## Acceptance Criteria

Given valid seeded credentials, when I submit login, then a token-based session is created and I enter the role-appropriate area.

*(Note: "role-appropriate area" is not defined by the PRD — see Open questions.)*

---

## PRD requirements (quoted from `Khidma-PRD-Lite.pdf`)

- **F-01 (§05 backlog):** "Login with seeded users — Email + password, token-based session. No registration or reset." Rule column: "—" (no BR cited).
- **Simplicity rule (§00):** "Seeded logins — no registration, no password reset." — "If an agent's plan adds any of these, the plan is rejected at review."
- **Roles (§01):** Three roles — APPLICANT, REVIEWER, SUPERVISOR. "Each staff user belongs to one department."
- **User entity (§01):** `User` — key fields `id, nationalId, name, email, role, departmentId`. "10-digit national ID, masked by default (BR-16)."
- **API surface (§06):** base `/api/v1`; `POST /auth/login` — "Sign in" — F-01.
- **Seed data (§06):** "2 departments (Licensing · Events) · 3 services · 2 applicants, 3 reviewers, 1 supervisor (password Passw0rd!) · 20 requests across all states, incl. 2 overdue."
- **Repo layout (§06):** `api/` (`modules/` one folder per epic, `rules/` pure BR logic + tests, `activity/` single activity writer), `web/` (SPA: applicant + staff), `db/` (migrations + seed), `AGENTS.md` (project rules), `.squad/`.
- **Engineering rules (§06):**
  - "Relational DB (SQLite is fine), migrations only."
  - "Business rules live in api/rules as pure functions."
  - "An injected Clock — no direct now() — so SLA tests run instantly."
  - "Errors as problem+json with a stable code."
  - "Every BR has ≥ 1 test; test suite runs in under a minute."
  - "No real personal data anywhere — including prompts and plans."
- **Golden rule (§00):** "Where this document is silent, write an open question — never let the agent decide product behaviour."

---

## Open questions

*Questions 1–12 were answered by the product owner on 2026-10-18 — see **Approved decisions** below (D-n answers question n). Original wording kept for traceability.*

1. **Tech stack** — The PRD names no language, framework, test runner or SQL engine beyond "Relational DB (SQLite is fine)" and "SPA" for `web/`. (`.squad/config.yaml` lists `primaryLanguage: typescript`; confirm whether that is the chosen stack and which frameworks to use.)
2. **Role-appropriate area** — The PRD does not define where each role lands after login (APPLICANT / REVIEWER / SUPERVISOR).
3. **Token format and session lifetime** — "token-based session" only; format (e.g. signed token vs opaque), expiry, refresh, and where the SPA stores it are unspecified.
4. **Logout** — Not mentioned in the PRD (no logout endpoint in §06). In scope or not?
5. **Failed-login behaviour** — The PRD requires problem+json with a stable code but names no code for invalid credentials, unknown email, or malformed input; HTTP status unspecified.
6. **Login response payload** — What user fields are returned (and whether `nationalId` is included / masked per BR-16).
7. **Seeded user identities** — The PRD gives counts and one shared password, plus persona names (Faisal — applicant, Noura — reviewer, Khalid — supervisor), but no emails, names for the other users, department membership of each staff user, or national IDs. Must be fictional ("No real personal data anywhere").
8. **Password storage** — Hashing approach for seeded passwords is unspecified.
9. **Email matching** — Case sensitivity / trimming of the email on login is unspecified.
10. **Brute-force protection / rate limiting** — Not mentioned.
11. **Seed scope for this story** — §06 seed includes departments, services and 20 requests; confirm this story seeds only what login needs (users, and departments for `departmentId`) and leaves services/requests to their own stories.
12. **Project scaffolding** — The repo is empty; confirm whether this story also creates the initial `api/`, `web/`, `db/` skeleton and `AGENTS.md`, or whether that is a separate story. Story #28 does **not** assume ownership of the project skeleton; if the plan needs any scaffolding, it must call that out as a decision requiring approval.

---

## Approved decisions (product owner, 2026-10-18)

- **D-1 Tech stack:** TypeScript. API: Node.js + Express. SPA: React + Vite. SQL engine: SQLite. Migrations: SQL migration files executed by a small Node.js migration runner. Tests: Vitest. Package manager: npm. Keep the setup simple; separate `package.json` files for `api` and `web` if needed.
- **D-2 Landing area after login:** APPLICANT → applicant home/requests area. REVIEWER → staff review area. SUPERVISOR → staff supervisor area. These are initial placeholder routes until their detailed screens are defined by their own features.
- **D-3 Token:** Signed JWT access token, valid for 1 hour. No refresh token for Lite. Stored in a Secure, HttpOnly, SameSite=Lax cookie; not in localStorage. If the cookie approach needs an additional CSRF measure, the plan explains the minimal required approach.
- **D-4 Logout:** In scope as a basic client action that clears the session cookie through a server endpoint, `POST /api/v1/auth/logout`. No token revocation infrastructure unless required by the chosen implementation; document the limitation.
- **D-5 Failed login:** Wrong password or unknown email → HTTP 401, stable code `INVALID_CREDENTIALS`, same public message for both. Malformed input → HTTP 400, stable code `VALIDATION_ERROR`. problem+json responses as required by the PRD.
- **D-6 Login response fields:** Only `id`, `name`, `email`, `role`, `departmentId`. `nationalId` is not included.
- **D-7 Seeded users:** Six fully fictional users, no real personal data: 2 APPLICANT, 3 REVIEWER, 1 SUPERVISOR. Shared password "Passw0rd!" from the PRD. Fictional emails and names; staff users assigned to the two PRD departments (Licensing and Events). Applicants have `departmentId = null` unless the PRD's User schema or validation requires otherwise. Obviously fictional 10-digit national IDs if required by the schema. Seeded login credentials documented in the developer README only, not in public-facing UI.
- **D-8 Password storage:** Argon2id. Hashes stored in a `passwordHash` column; never plaintext in the database.
- **D-9 Email matching:** Trim surrounding whitespace and match case-insensitively. Seeded emails stored in normalized lowercase form.
- **D-10 Rate limiting:** Basic rate limiting on `POST /api/v1/auth/login`: 5 failed attempts per IP within 15 minutes, then HTTP 429 with stable code `RATE_LIMITED`. Isolated and testable.
- **D-11 Seed scope:** Story #28 seeds the two departments and six users required for login only. The three services and twenty requests are left to their own stories.
- **D-12 Scaffolding:** Story #28 may create the minimum initial `app/api`, `app/web`, `app/db` structure and `AGENTS.md` needed to implement and test login. No unrelated screens or features; placeholders minimal.

## New open questions (raised while planning, 2026-10-18)

13. **Session restore after page reload** — With an HttpOnly cookie the SPA cannot read the token, and the PRD API surface (§06) has no "current user" endpoint. Without one, a page reload loses the user's role and the SPA cannot return them to their area. Options: (a) add `GET /api/v1/auth/me` (not in the PRD API list) returning the D-6 fields; (b) keep the login-response user only in memory, so a reload sends the user back to the login page. Not decided.
14. **Rate-limit semantics** — D-10 says "5 failed attempts per IP within 15 minutes, then 429". Not decided: (a) once blocked, are *correct* credentials also refused with 429 until the window passes; (b) does a successful login reset the IP's failure count; (c) is the window fixed (starts at the first failure) or sliding (last 15 minutes); (d) do malformed requests (`VALIDATION_ERROR`) count as failed attempts?
15. **Public error wording** — D-5 requires the same public message for wrong password and unknown email but does not give the text; the PRD gives none for `INVALID_CREDENTIALS`, `VALIDATION_ERROR` or `RATE_LIMITED`. Not decided.

*Questions 13–15 were answered by the product owner on 2026-10-18 — see **Approved decisions (round 2)** below.*

## Approved decisions — round 2 (product owner, 2026-10-18)

- **Q-13 Session restore:** Add `GET /api/v1/auth/me` to restore the signed-in user after a page reload, using the existing HttpOnly session cookie. Return the same safe user fields defined in D-6. Return 401 if the session is missing, expired, or invalid. This is a minimal supporting endpoint for the approved session design, not a new product feature.
- **Q-14 Rate-limit semantics:** (a) While an IP is blocked, all login attempts from it — including correct credentials — get `429 RATE_LIMITED` until the window passes. (b) A successful login does not reset the failure count. (c) Sliding window: failures in the last 15 minutes are counted. (d) Only `INVALID_CREDENTIALS` outcomes count; `VALIDATION_ERROR` does not.
- **Q-15 Public error wording:** `INVALID_CREDENTIALS` → "Invalid email or password." · `VALIDATION_ERROR` → "Email and password are required." · `RATE_LIMITED` → "Too many failed login attempts. Try again later."

## New open questions — round 3 (raised while planning, 2026-10-18)

16. **`/auth/me` 401 error code and wording** — Q-13 sets HTTP 401 for a missing, expired or invalid session but no stable code (PRD: "Errors as problem+json with a stable code") and no public message. Reusing `INVALID_CREDENTIALS` would mislabel the cause. Not decided.

*Question 16 was answered by the product owner on 2026-10-18 — see **Approved decisions — round 3** below.*

## Approved decisions — round 3 (product owner, 2026-10-18)

- **Q-16 `/me` 401 code and wording:** `GET /api/v1/auth/me` returns HTTP 401 with stable code `UNAUTHENTICATED` and title "Not signed in." for a missing, expired or invalid session.

All open questions (1–16) are resolved. The plan is ready to execute.

---

## Attachments

None. Source document: `Khidma-PRD-Lite.pdf` at the workspace root (relevant text quoted above).

---

## Dependencies

- **Blocked by / related ids:** Unspecified — the PRD does not establish an order between stories.
- **Depends on code areas or other stories:** Unspecified. The repository (`app/`) currently contains only `README.md`. Related PRD features in the same epic: F-02 (Role guards, BR-18); its ordering relative to this story is not defined by the PRD.

## Technical hints (optional)

- Repo root for application code: `app/` (cloned from `https://github.com/alolo9611-create/Khidma.git`, contains only `README.md`).
- Endpoint: `POST /api/v1/auth/login`.

## Out of scope

- Registration and password reset (PRD simplicity rule).
- Role guards on API and UI — F-02 (BR-18).
- National ID masking — F-21 (BR-16).
- Any feature beyond F-01.
