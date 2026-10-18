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

## Known limitations

- Logout does not revoke the JWT. It only clears the cookie, so a copied token stays valid for up to 1 hour.
- Login rate-limit counts are kept in memory and reset when the API restarts.
- Landing pages have no role guards yet (F-02).
