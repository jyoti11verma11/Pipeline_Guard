# PipelineGuard — PRD

## Original Problem Statement
Full-stack web app "PipelineGuard" — AI-powered CRM data hygiene tool for sales teams.
Reps paste call transcripts/emails, a rule-based mock AI extractor suggests CRM field updates
(deal stage, next step, sentiment, stakeholders), rep reviews/accepts in one click.
Managers see a dashboard showing pipeline data health.

## Tech Stack (as built)
- React + Tailwind + Shadcn UI + Recharts (dark indigo theme, Outfit/Manrope fonts)
- FastAPI backend, MongoDB (platform mandated — used instead of SQLite from spec)
- Zero external API cost: mock rule-based extractor via keyword matching + regex

## Personas
- Sales rep — pastes call notes, reviews and confirms extracted fields
- Sales manager — reviews pipeline hygiene dashboard, leaderboard

## Core Requirements
- Sidebar nav across 4 pages: Ingest, Pipeline, Health, Deal Detail
- Seed data: 3 reps, 12 deals across 5 stages with mix of fresh/stale
- Freshness dot: green <7d, yellow 7-14d, red >14d
- Health metrics: hygiene score %, stale count, missing-next-step count, per-rep leaderboard

## What's Been Implemented (Feb 2026 — initial MVP)
- Backend: `/api/reps`, `/api/deals`, `/api/deals/{id}`, `/api/deals/{id}/activities`,
  `/api/extract`, `/api/deals/{id}/confirm`, `/api/health/summary`, `/api/seed`
- Auto-seed on first boot
- Mock extraction: stage keywords, sentiment word lists, next-step sentence detection,
  regex name + role extraction, deal auto-match by company name in text
- Frontend pages: Ingest (split textarea + AI card w/ editable fields), Pipeline (kanban),
  Health (3 stat cards + Recharts bar chart), Deal Detail (activity timeline)
- Sonner toasts, sticky sidebar, custom AI glow card, freshness dots with red-pulse

## Backlog (P1/P2)
- Bulk paste (multiple transcripts at once)
- CSV import/export of deals
- Slack/email nudge for stale deals
- Persist to real CRM (Salesforce/HubSpot integration)
- Auth + multi-team workspaces
- Better NLP model (LLM-backed suggestion mode as opt-in)

## Notes
- Environment mandates MongoDB, so SQLite from spec was substituted.
- No third-party integrations — fully self-contained.
