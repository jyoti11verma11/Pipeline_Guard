# PipelineGuard

**AI-powered CRM data hygiene for sales teams.**
Paste a call transcript or email → PipelineGuard suggests the CRM field updates → rep approves in one click. Managers get a dashboard showing how "fresh" the pipeline data really is.

![Stack](https://img.shields.io/badge/stack-React_·_FastAPI_·_MongoDB-6366f1) ![Auth](https://img.shields.io/badge/auth-JWT-22c55e) ![AI](https://img.shields.io/badge/AI-rule--based_(no_external_cost)-f59e0b)

---

## Why

Sales reps hate manually logging calls and updating deal stages, so CRM data goes stale and forecasting breaks. PipelineGuard removes the typing: extract → review → confirm.

---

## Features

- **Ingest** — paste any transcript/email, get suggested `stage`, `next step`, `sentiment`, `stakeholders`. Auto-matches the related deal by company name. Every field is editable before saving.
- **Pipeline** — Kanban across 5 stages (Prospecting → Closed Lost) with green/yellow/red **freshness dots** (<7d / 7–14d / >14d) and a "no next step set" warning.
- **Health Dashboard** — Overall hygiene score, stale-deal count, missing-next-step count, and a **Recharts leaderboard** of hygiene by rep (best first).
- **Deal Detail** — Full activity timeline (newest first) showing every logged interaction with the AI-extracted metadata.
- **Auth** — JWT email/password login gating the whole app. Demo account seeded on startup.

---

## Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 19, React Router, Tailwind, Shadcn UI, Recharts, lucide-react, sonner |
| Backend | FastAPI, Motor (async MongoDB), PyJWT, bcrypt |
| Database | MongoDB (auto-seeded on first boot) |
| AI | Rule-based mock extractor (keyword matching + regex) — **zero external API cost** |

Fonts: Outfit (headings) + Manrope (body) + JetBrains Mono (accents). Dark indigo theme.

---

## Project Structure

```
/app
├── backend/
│   ├── server.py           # FastAPI app, auth, extractor, seed
│   ├── .env                # MONGO_URL, DB_NAME, JWT_SECRET, ADMIN_*
│   └── tests/backend_test.py
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── FreshnessDot.jsx
│   │   ├── lib/{api.js, freshness.js, utils.js}
│   │   └── pages/{Login, Ingest, Pipeline, Health, DealDetail}.jsx
│   └── .env                # REACT_APP_BACKEND_URL
└── memory/
    ├── PRD.md
    └── test_credentials.md
```

---

## Getting Started

Backend, frontend, and MongoDB are managed by supervisor and hot-reload automatically.

```bash
# Restart backend after .env / dependency changes
sudo supervisorctl restart backend

# Backend logs
tail -f /var/log/supervisor/backend.*.log

# Frontend logs
tail -f /var/log/supervisor/frontend.*.log
```

Environment variables (already configured):

- `backend/.env` — `MONGO_URL`, `DB_NAME`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `frontend/.env` — `REACT_APP_BACKEND_URL`

On startup the backend:
1. Creates a unique index on `users.email`
2. Seeds the admin account (`demo@pipelineguard.io` / `demo123`) if missing
3. Seeds 3 reps + 12 deals if the `deals` collection is empty

---

## Demo Login

| Email | Password |
| --- | --- |
| `demo@pipelineguard.io` | `demo123` |

The login page has a one-click **"Try the demo account"** button that pre-fills the fields.

---

## API

All data endpoints require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | `{ email, password, name }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/api/auth/me` | — | `user` |

### Data
| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/reps` | List sales reps |
| GET | `/api/deals` | List deals (newest updated first) |
| GET | `/api/deals/{id}` | Single deal |
| GET | `/api/deals/{id}/activities` | Timeline (newest first) |
| POST | `/api/extract` | `{ text }` → suggested fields + matched deal |
| POST | `/api/deals/{id}/confirm` | Save extracted fields + log activity |
| GET | `/api/health/summary` | Dashboard metrics + rep leaderboard |
| POST | `/api/seed/reset` | Reset demo data (auth required) |

### Sample cURL

```bash
API=$REACT_APP_BACKEND_URL

# Login
TOKEN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@pipelineguard.io","password":"demo123"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

# Fetch deals
curl -s "$API/api/deals" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Extract from a transcript
curl -s -X POST "$API/api/extract" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Great call with Diana Cross at Globex. She wants to move forward. Next step: send contract."}'
```

---

## How the "AI" Works

The extractor is a fully self-contained rule engine — **no external calls, no API keys, no cost**:

- **Stage** — keyword bank per stage, priority Closed Won > Closed Lost > Negotiation > Qualified > Prospecting.
- **Sentiment** — positive/negative word lists; forced to `negative` for Closed Lost and `positive` for Closed Won.
- **Next step** — first sentence containing "next", "next step", "follow up", or "follow-up".
- **Stakeholders** — regex for capitalized `First Last` names and titles like `CFO`, `VP of Legal`.
- **Deal auto-match** — substring match on company name in the transcript.

Swapping this for a real LLM later is a drop-in change inside `extract_from_text()`.

---

## Testing

```bash
cd /app && pytest backend/tests/backend_test.py -v
```

Current status: **8/8 backend tests passing, 100% frontend flows verified.**

---

## Roadmap

- [ ] Bulk paste — multiple transcripts at once
- [ ] CSV import/export of deals
- [ ] Weekly hygiene digest email (rep leaderboard + stalest deals)
- [ ] Slack / email nudges for stale deals
- [ ] Real CRM sync (Salesforce, HubSpot)
- [ ] Opt-in LLM-backed extraction
- [ ] Per-rep ownership (each rep sees their own deals)
- [ ] Google OAuth as an alternate sign-in
