# CLAUDE.md

Guidance for Claude Code working in this repo.

## Product

Customer-facing brand: **Concussion Education Australia (CEA)** — concussion-education-australia.com. Folder name `ConcussionPro` is internal only.

Flagship product: Concussion Clinical Mastery — 14 CPD hours, Osteopathy Australia endorsed.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + Tailwind 4 + TypeScript
- Hosting: Vercel
- Payments: Stripe Checkout (one-time payment mode)
- Email: Resend
- Storage: Vercel Blob (`users.json`) with local JSON fallback in dev
- Analytics: custom Vercel Blob events + Vercel Analytics + Google Ads conversion API

## Conventions

- **Always push after committing.** Zac expects deploys to follow commits.
- **Kill `next dev` before starting a new one.** Dev server eats 200%+ CPU on a 16 GB Mac.
- **Don't enable Turbopack FS cache** in `next.config.ts` — `turbopackFileSystemCacheForDev: false` (Next 16+ default-on causes 230 MB/sec disk writes).
- **Don't touch `neurovision/`** — separate project living at the root, has its own lifecycle.
- **Read code before proposing changes.** No speculative refactors.

## Admin auth

- Primary: httpOnly cookie `admin_session`, set by `POST /api/admin/login`.
- Scripts/cron: header auth (`x-admin-key` or `Bearer`).
- Every `/api/admin/*` route delegates to `isAdminRequest()` in `lib/require-admin.ts`. Don't roll a new auth check.

## Key files

- `lib/email-sequences.ts` — all transactional + lifecycle email templates and cron-driven sequences. Largest single file; biggest test gap.
- `lib/email-scheduler.ts` — schedule/send orchestration.
- `lib/stripe.ts` — Stripe client + checkout session helpers.
- `lib/tax-invoice.ts` — GST-aware invoice generation, gated by env vars (see `EMAIL_AUTOMATION_GUIDE.md`).
- `lib/users.ts` — user CRUD against Vercel Blob.
- `lib/analytics.ts` + `lib/measurement-protocol.ts` — custom event store + Google Ads CAPI.
- `lib/require-admin.ts` — single source of truth for admin auth.
- `app/api/webhooks/stripe/route.ts` — Stripe webhook with idempotency.
- `app/api/webhooks/resend/route.ts` — Resend bounce/complaint events. Signature secret needs rotation in Vercel env (`RESEND_WEBHOOK_SECRET`).

## Workshops

- Melbourne: confirmed Sat 13 June 2026, CBD. Early bird cutoff 2026-05-31.
- Sydney + Byron Bay: status `collecting` (demand capture only).
- `workshopLocation` is required at full-course checkout — validate client-side.

## Operational guides at root

- `ANALYTICS.md` — event schema + Google Ads conversion mapping
- `MONITORING.md` — daily/weekly cron + alerts
- `EMAIL_AUTOMATION_GUIDE.md` — sequence map + GST cutover env vars
- `RESEND_SETUP_GUIDE.md` — domain auth + webhook config
- `STRIPE_INTEGRATION_GUIDE.md` — checkout + webhook flow
- `SCAT_FORMS_SPECIFICATION.md` + `SCAT6_FIELD_MAPPING.md` — clinical form schemas

## GST cutover

GST registration takes effect 2026-05-01. Tax-invoice pipeline is gated by env flags; see `EMAIL_AUTOMATION_GUIDE.md`. Changes affecting invoice fields, ABN display, or GST line items need extra care.

## Skills installed (May 2026)

Available via `/<skill>`:
- `email-write`, `email-sequence`, `email-review`, `email-audit`, `email-check`, `email-plan`, `email`
- `seo`, `seo-audit`, `seo-page`, `seo-technical`, `seo-content`, `seo-geo`, `seo-schema`
- `linkedin-post-writer`, `linkedin-hook-extractor`, `linkedin-post-audit`, `linkedin-comment-drafter`, `linkedin-reply-handler`, `linkedin-profile-optimizer`, `linkedin-content-planner`, `linkedin-engagement-monitor`, `linkedin-humanizer`, `linkedin-employee-advocacy`
- `doctor`, `simplify`, `review`, `security-review`, `init`
- `loop`, `schedule`, `update-config`, `fewer-permission-prompts`

## Pending / known issues

- Existing users have `signupSource: undefined` (display as "Unknown" in admin)
- Stripe webhook events: add `checkout.session.expired`
- Google Ads: conversion actions still pending for `scat_mastery_signup`, `free_course_complete`, `scat6_form_download`, `interest_registration`, `checkout_complete`
- Resend webhook secret in Vercel env drifted vs `.env` — rotate to align
