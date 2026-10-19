# Khidma (training project)

All data in this project is fictional.

## Prerequisites

- Node 24 and npm.

## Setup

```bash
cp api/.env.example api/.env
(cd api && npm install)
(cd web && npm install)
(cd api && npm run db:migrate)
(cd api && npm run db:seed)
```

## Run

- API: `npm run dev` in `api/` (listens on `http://localhost:3000`).
- SPA: `npm run dev` in `web/`. It proxies `/api` to the API, so requests stay same-origin.
- Open `http://localhost:5173` in **Chrome or Firefox**. The session cookie is `Secure`. Chrome and Firefox accept that on `http://localhost`, but Safari may not store it over plain http.

## Seeded accounts (development only)

| id | name | email | role | department |
|----|------|-------|------|------------|
| 1 | Faisal Demo | faisal@khidma.test | APPLICANT | — |
| 2 | Huda Demo | huda@khidma.test | APPLICANT | — |
| 3 | Noura Demo | noura@khidma.test | REVIEWER | Licensing |
| 4 | Omar Demo | omar@khidma.test | REVIEWER | Licensing |
| 5 | Layla Demo | layla@khidma.test | REVIEWER | Events |
| 6 | Khalid Demo | khalid@khidma.test | SUPERVISOR | Licensing |

Password for all: `Passw0rd!`

## What's in the app

All 22 PRD features (F-01 … F-22). UI follows the Khidma design handoff (`web/src/styles/khidma-ui.css` is the design system, unchanged).

| Area | Routes (SPA) | API (`/api/v1`) |
|------|--------------|-----------------|
| Public | `/catalog`, `/catalog/:code`, `/verify`, `/verify/:certificateNo`, `/login` | `GET /services[/:code]`, `GET /verify/:certificateNo`, `POST /auth/login` |
| Applicant | `/applicant` (my requests), `/applicant/requests/new/:code`, `/applicant/requests/:id/edit`, `/applicant/requests/:id/submitted`, `/applicant/requests/:id` | `POST /requests`, `PATCH /requests/:id`, `POST /requests/:id/{submit,respond,withdraw,comments}`, `GET /requests/mine`, `GET /requests/:id` |
| Reviewer | `/staff/review` (queue), `/staff/requests/:id` | `GET /queue`, `GET /me/load`, `POST /requests/:id/{pick,request-info,approve,reject,comments}` |
| Supervisor | `/staff/supervisor` (dashboard), `/staff/supervisor/services`, plus the queue | `GET /dashboard`, `GET /accounts/reviewers`, `GET /services/mine`, `PATCH /services/:id`, `POST /requests/:id/assign` |
| Everyone signed in | bell popover | `GET /notifications`, `POST /notifications/:id/read`, `GET /auth/me`, `POST /auth/logout` |

Product decisions behind open PRD details are recorded in `.squad/plans/00-open-questions.md` (outside this repo). Items still awaiting the product owner are implemented with the recommended default and marked `⛔ PQ-nn` / `provisional` in code: PQ-10 (drafts are not "open"), PQ-12 (withdrawn requests have no SLA status), PQ-19 (applicants may post public comments).

The PRD seed of 20 demo requests is not included (PQ-03: no story owns it). Use the app or the API to create requests.

## Deploying

The app runs as one Node process that serves the API and the built SPA from the same origin (required by the cookie and CSRF design).

```bash
(cd web && npm ci && npm run build)          # → web/dist
(cd api && npm ci)
(cd api && npm run db:migrate && npm run db:seed)   # additive migrations; seeding is idempotent
(cd api && NODE_ENV=production STATIC_DIR=../web/dist npm start)
```

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | yes | ≥ 32 random characters; the API refuses the example value in production |
| `NODE_ENV` | yes | `production` |
| `DATABASE_PATH` | yes | path of the SQLite file |
| `STATIC_DIR` | yes | path to `web/dist` |
| `PORT` | no | default 3000 (hosts usually inject it) |
| `HOST` | on hosts | `0.0.0.0` on Render and similar hosts |
| `TIMEZONE` | no | default `Asia/Riyadh` (PRD §01) |
| `TRUST_PROXY` | behind a proxy | e.g. `1`, so the per-IP login rate limit sees client IPs |
| `PREVIEW_PASSWORD` | trial only | turns on the preview-access gate (≥ 16 characters) |
| `PREVIEW_USER` | trial only | gate user name, default `khidma` |

Serve over HTTPS: the session cookie is `Secure`.

### Free team preview on Render

`render.yaml` is a Render Blueprint for a **free** web service built from `feature/khidma-full-app`. Render's Free plan needs no payment method.

- **Create it once:** Render Dashboard → **New → Blueprint** → connect this GitHub repository → choose branch `feature/khidma-full-app` → **Apply**. Render generates `JWT_SECRET` and `PREVIEW_PASSWORD`. Their values never appear in Git.
- **Team access:** every page, file and API call is behind a shared login (HTTP Basic). User `khidma`. The password is shown on the service's **Environment** page in the Render Dashboard; share it with the team privately. After that, sign in to Khidma with a seeded account (see above).
- **Data is disposable.** Free instances have an ephemeral filesystem and sleep after 15 minutes without traffic. On every start (wake-up, restart, redeploy) the database is rebuilt: migrations run and the six demo accounts and three services are seeded again. **Requests, comments and notifications created in the preview are lost** each time. The first visit after sleeping takes about a minute.
- **Not private at the network level:** the URL is public; the shared login is the only barrier. An IP allow-list needs a paid Render plan.
- **Limits:** 750 free instance hours per month per workspace; builds stop (no charge) if the free build minutes run out.

## Known limitations

- Logout does not revoke the JWT. It only clears the cookie, so a copied token stays valid for up to 1 hour.
- Login rate-limit counts are kept in memory and reset when the API restarts.
- The bell refreshes on navigation (no push, by design: F-19).
- Draft deletion is not supported (not in the PRD).
