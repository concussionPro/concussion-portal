# CEA Portal — All-Time Conversion LEAK BOARD

**Generated:** 2026-09-05, 09:23:08 ET (source clock UTC 2026-09-05T13:23:08.893Z)  
**Source:** Postgres `analytics_events` + `analytics_findings` via `POSTGRES_URL` (no secrets in this doc)  
**Repo:** `/Users/zaclewis/ConcussionPro/portal`  
**Scope:** All-time analytics history present in DB + last 90 days window  
**Data range:** 2026-03-22, 18:32:46 ET → 2026-09-05, 09:21:24 ET  
**Note:** Product code unchanged. No commit. Counts are event/session proxies, not Stripe ledger truth.

---

## 0. Executive leak snapshot

| Proxy stage (session-scoped) | All-time | Last 90d |
| --- | ---: | ---: |
| Distinct sessions | 4,957 | 2,936 |
| Money-page page_view sessions (`/pricing*`, `/pricing-international*`, `/uk*`, `/cata*`) | 635 (12.8% of sessions) | 351 (12.0%) |
| Pricing signal sessions (`pricing_page` / `international_pricing_view` / `pricing_cards_in_view`) | 542 | 285 |
| Checkout intent sessions (`checkout_start` / `enroll_button_click` / `shop_click`) | 67 | 39 |
| Purchased sessions (`purchase` / `purchase_complete`) | 24 | 10 |
| `checkout_expired` sessions | 23 | 14 |

**Biggest leaks (from these proxies):**
1. **Money page → checkout intent:** all-time 635 money-page sessions → 67 intent (10.6%). Last 90d: 11.1%.
2. **Checkout intent → purchase:** all-time 67 → 24 (35.8%). Last 90d: 25.6%.
3. **Expired checkouts rival purchases:** all-time `checkout_expired` 23 events / 23 sessions vs purchase-related ~15 `purchase` + 15 `purchase_complete`.
4. **Open finding:** money-path sessions dying on `/pricing-international` (see §5).
5. **Lead magnet volume is large, paid intent is thin:** `/scat-mastery` alone has 661 sessions all-time vs 67 checkout-intent sessions.

---

## 1. All-time + last 90 days — event counts, sessions, top 15 paths

### Overview

| Metric | All-time | Last 90 days |
| --- | ---: | ---: |
| Events | 15,832 | 11,195 |
| Distinct `session_id` | 4,957 | 2,936 |
| Earliest event | 2026-03-22, 18:32:46 ET | — |
| Latest event | 2026-09-05, 09:21:24 ET | — |

### Top 15 paths — all-time (by event count)

| Path | Events | Distinct sessions |
| --- | --- | --- |
| `/pricing` | 2,018 | 426 |
| `/scat-mastery` | 1,223 | 661 |
| `/` | 1,177 | 582 |
| `/scat6-download` | 815 | 329 |
| `/preview` | 644 | 343 |
| `/dashboard` | 478 | 169 |
| `/scat-forms` | 461 | 263 |
| `/modules/101` | 442 | 149 |
| `/pricing-international` | 402 | 164 |
| `/login` | 374 | 202 |
| `/courses` | 326 | 57 |
| `/scat-forms/scat6` | 316 | 167 |
| `/concussion-rehab-mastery` | 313 | 107 |
| `/preseason` | 306 | 206 |
| `/learning` | 262 | 104 |

### Top 15 paths — last 90 days

| Path | Events | Distinct sessions |
| --- | --- | --- |
| `/pricing` | 1,367 | 190 |
| `/scat6-download` | 811 | 325 |
| `/` | 748 | 196 |
| `/scat-mastery` | 369 | 127 |
| `/modules/101` | 350 | 89 |
| `/dashboard` | 344 | 73 |
| `/concussion-rehab-mastery` | 313 | 107 |
| `/courses` | 312 | 55 |
| `/login` | 302 | 136 |
| `/scat-forms` | 291 | 140 |
| `/clinical-suite` | 244 | 64 |
| `/scat-forms/scat6` | 235 | 107 |
| `/pricing-international` | 212 | 96 |
| `/sst-trainer` | 210 | 118 |
| `/api/signup-free` | 209 | 209 |

### Event-type volume (all-time, top types)

| Event type | Events | Sessions |
| --- | --- | --- |
| `page_view` | 7,752 | 3,932 |
| `page_exit` | 3,535 | 1,644 |
| `scroll_depth` | 854 | 499 |
| `pricing_page` | 695 | 464 |
| `pageview` | 663 | 381 |
| `pricing_cards_in_view` | 324 | 209 |
| `module_start` | 259 | 112 |
| `free_course_signup` | 249 | 249 |
| `quiz_submit` | 245 | 92 |
| `prospect_email_opened` | 121 | 121 |
| `workshop_city_select` | 116 | 30 |
| `scat6_form_download` | 115 | 113 |
| `international_pricing_view` | 110 | 80 |
| `checkout_start` | 75 | 58 |
| `module_complete` | 68 | 33 |
| `demo_tour_start` | 64 | 64 |
| `prospect_email_clicked` | 63 | 63 |
| `faq_section_in_view` | 59 | 44 |
| `faq_open` | 55 | 14 |
| `demo_pageview` | 53 | 4 |
| `free_course_complete` | 38 | 32 |
| `pricing_stream_switch` | 34 | 16 |
| `scat_export_signup` | 34 | 34 |
| `course_stream_toggle` | 33 | 21 |
| `toolkit_download` | 24 | 9 |

### Event-type volume (last 90 days, top types)

| Event type | Events | Sessions |
| --- | --- | --- |
| `page_view` | 4,986 | 2,439 |
| `page_exit` | 3,535 | 1,644 |
| `pricing_page` | 488 | 263 |
| `pricing_cards_in_view` | 324 | 209 |
| `scroll_depth` | 321 | 168 |
| `module_start` | 259 | 112 |
| `free_course_signup` | 209 | 209 |
| `quiz_submit` | 123 | 53 |
| `workshop_city_select` | 116 | 30 |
| `scat6_form_download` | 115 | 113 |
| `prospect_email_opened` | 99 | 99 |
| `module_complete` | 68 | 33 |
| `demo_tour_start` | 64 | 64 |
| `faq_section_in_view` | 59 | 44 |
| `faq_open` | 55 | 14 |
| `prospect_email_clicked` | 49 | 49 |
| `checkout_start` | 41 | 30 |
| `pricing_stream_switch` | 34 | 16 |
| `course_stream_toggle` | 33 | 21 |
| `international_pricing_view` | 27 | 23 |
| `free_course_complete` | 18 | 15 |
| `enroll_button_click` | 17 | 14 |
| `scat_export_signup` | 15 | 15 |
| `checkout_expired` | 14 | 14 |
| `toolkit_download` | 14 | 5 |

---

## 2. Funnel proxies — money pages, checkout/enrol/shop, purchase

### Money-page `page_view` / `pageview` volume

| Window | Page views | Distinct sessions |
| --- | ---: | ---: |
| All-time | 916 | 635 |
| Last 90 days | 491 | 351 |

Money paths included: `/pricing`, `/pricing-international`, `/uk`, `/cata` (+ subpaths).

### Conversion-ish event counts

| Event type | All-time events | All-time sessions | L90 events | L90 sessions |
| --- | --- | --- | --- | --- |
| `pricing_page` | 695 | 464 | 488 | 263 |
| `pricing_cards_in_view` | 324 | 209 | 324 | 209 |
| `international_pricing_view` | 110 | 80 | 27 | 23 |
| `checkout_start` | 75 | 58 | 41 | 30 |
| `enroll_button_click` | 17 | 14 | 17 | 14 |
| `shop_click` | 3 | 3 | 2 | 2 |
| `checkout_expired` | 23 | 23 | 14 | 14 |
| `purchase` | 15 | 14 | 8 | 7 |
| `purchase_complete` | 15 | 15 | 8 | 8 |
| `cross_sell_click` | 8 | 2 | 8 | 2 |
| `free_course_signup` | 249 | 249 | 209 | 209 |
| `scat_export_signup` | 34 | 34 | 15 | 15 |
| `ep_lead_capture` | 9 | 9 | 9 | 9 |
| `interest_registration` | 7 | 5 | 7 | 5 |
| `workshop_city_select` | 116 | 30 | 116 | 30 |
| `workshop_interest_submit` | 7 | 6 | 4 | 4 |

### Notes on funnel instrumentation
- `shop_click` is rare (3 all-time) — most CTA intent appears as `checkout_start` / `enroll_button_click`.
- `purchase` and `purchase_complete` both exist (~15 / 15 all-time); treat as purchase-related proxies, not necessarily unique buyers.
- Session funnel above uses OR across those event types per `session_id`.

---

## 3. `/pricing` vs `/pricing-international` vs `/uk` vs `/cata`

### All-time buckets

| Bucket | page_view/pageview | pricing_page events | international_pricing_view | All events | Sessions |
| --- | --- | --- | --- | --- | --- |
| `/pricing*` | 640 | 480 | 0 | 2,018 | 426 |
| `/pricing-international*` | 190 | 0 | 110 | 402 | 164 |
| `/uk*` | 60 | 0 | 0 | 135 | 57 |
| `/cata*` | 26 | 0 | 0 | 45 | 12 |

### Last 90 days buckets

| Bucket | page_view/pageview | pricing_page events | international_pricing_view | All events | Sessions |
| --- | --- | --- | --- | --- | --- |
| `/pricing*` | 299 | 273 | 0 | 1,367 | 190 |
| `/pricing-international*` | 106 | 0 | 27 | 212 | 96 |
| `/uk*` | 60 | 0 | 0 | 135 | 57 |
| `/cata*` | 26 | 0 | 0 | 45 | 12 |

### Exact money paths (all-time)

| Path | page_view/pageview | All events | Sessions |
| --- | --- | --- | --- |
| `/pricing` | 640 | 2,018 | 426 |
| `/pricing-international` | 190 | 402 | 164 |
| `/uk` | 60 | 135 | 57 |
| `/cata` | 26 | 45 | 12 |

**Read:** Domestic `/pricing` dominates volume. `/pricing-international` is the #2 money surface and is flagged open in findings for exit death. `/uk` and `/cata` are smaller niche lanes (all `/uk*` + `/cata*` traffic sits inside the last 90d window based on bucket equality all-time vs L90).

---

## 4. `scat-mastery` / free lead path volume

### Path buckets (exclusive CASE; `scat-mastery` separated first)

**All-time**

| Bucket | Events | page_views | Sessions |
| --- | --- | --- | --- |
| `scat*` | 2,041 | 1,216 | 786 |
| `scat-mastery` | 1,223 | 734 | 661 |
| `toolkit*` | 186 | 105 | 49 |
| `free*` | 13 | 9 | 7 |
| `lead*` | 5 | 0 | 5 |
| `other-matched` | 1 | 0 | 1 |

**Last 90 days**

| Bucket | Events | page_views | Sessions |
| --- | --- | --- | --- |
| `scat*` | 1,659 | 838 | 595 |
| `scat-mastery` | 369 | 163 | 127 |
| `toolkit*` | 155 | 85 | 41 |
| `free*` | 12 | 8 | 6 |
| `lead*` | 5 | 0 | 5 |
| `other-matched` | 1 | 0 | 1 |

### `/scat-mastery` specifically

| Path | Events | page_views | Sessions |
| --- | --- | --- | --- |
| `/scat-mastery` | 1,223 | 734 | 661 |

### Top lead / free / SCAT-related paths (all-time)

| Path | Events | page_views | Sessions |
| --- | --- | --- | --- |
| `/scat-mastery` | 1,223 | 734 | 661 |
| `/scat6-download` | 815 | 362 | 329 |
| `/scat-forms/scat6` | 316 | 217 | 167 |
| `/clinical-toolkit` | 79 | 34 | 23 |
| `/scat-forms/child-scat6` | 47 | 34 | 30 |
| `/ep-course/toolkit` | 42 | 22 | 8 |
| `/blog/how-to-use-scat6-clinicians-guide` | 13 | 11 | 11 |
| `/blog/scat6-vs-scoat6-difference` | 11 | 9 | 9 |
| `/blog/free-scat6-pdf-download` | 8 | 6 | 6 |
| `/proposals/advanced-health-buderim/toolkit/admin` | 8 | 6 | 4 |
| `/proposals/advanced-health-buderim/toolkit/outreach` | 7 | 5 | 4 |
| `/p/zac-preview-demo/toolkit/clinical` | 7 | 7 | 1 |
| `/p/zac-preview-demo/toolkit/admin` | 7 | 7 | 1 |
| `/proposals/advanced-health-buderim/toolkit/clinical` | 7 | 5 | 4 |
| `/free-training` | 5 | 3 | 1 |
| `/api/ep-lead` | 5 | 0 | 5 |
| `/p/zac-preview-demo/toolkit/outreach` | 4 | 4 | 1 |
| `/p/on-the-mend-health/toolkit` | 4 | 2 | 1 |
| `/proposals/advanced-health-buderim/toolkit` | 4 | 2 | 2 |
| `/courses/ai-in-clinical-practice/toolkit` | 3 | 2 | 2 |

### Lead / signup style events

| Event type | Events | Sessions |
| --- | --- | --- |
| `free_course_signup` | 249 | 249 |
| `scat6_form_download` | 115 | 113 |
| `free_course_complete` | 38 | 32 |
| `scat_export_signup` | 34 | 34 |
| `toolkit_download` | 24 | 9 |
| `ep_lead_capture` | 9 | 9 |
| `exit_popup_signup` | 2 | 2 |
| `cpd_export_generated` | 1 | 1 |

**Read:** Free/lead demand concentrates on `/scat-mastery` + `/scat6-download` + SCAT forms. Explicit `/free*` path volume is tiny; free conversion is mostly event-driven (`free_course_signup` 249 all-time).

---

## 5. Open rows in `analytics_findings`

Table **exists**. Status mix: resolved=8, open=3.

### Open findings (3)

#### 1. [open] severity 3 — GEO is working: 3 visitor(s) arrived from AI assistants
- **key:** `geo-llm-arriving`
- **first_seen:** 2026-07-27, 05:23:37 ET
- **last_seen:** 2026-09-05, 09:17:46 ET
- **evidence:** 3 AI/LLM-referred visitors this window; 0 reached a money surface.
- **proposed_change:** Double down on the pages being cited: check which paths AI-referred visitors land on and extend that page pattern (clear claims + named source + date) to the money pages.

#### 2. [open] severity 2 — Money-path sessions die on /pricing-international
- **key:** `exit-/pricing-international`
- **first_seen:** 2026-08-28, 11:11:29 ET
- **last_seen:** 2026-09-05, 09:17:46 ET
- **evidence:** 36 visitors reached a pricing surface, took no money action, and exited on /pricing-international.
- **proposed_change:** Rework /pricing-international: it is the last page buyers see before leaving. Cut length, restate the offer, put the next step at the exit point.

#### 3. [open] severity 2 — Prospects tour the workspace but never book
- **key:** `tour-no-booking`
- **first_seen:** 2026-08-11, 00:10:38 ET
- **last_seen:** 2026-09-05, 09:17:46 ET
- **evidence:** 7 tour entries, 0 cal.com clicks.
- **proposed_change:** The tour ends nowhere: add a persistent "Book 20 minutes" affordance inside the demo workspace (sidebar demo card + after the sample report).


---

## 6. Checkout expired style events

| Event type | Events | Sessions | First seen (ET) | Last seen (ET) |
| --- | ---: | ---: | --- | --- |
| `checkout_expired` | 23 | 23 | 2026-05-26, 19:56:10 ET | 2026-08-25, 07:51:00 ET |

- No `checkout.session.expired` Stripe-webhook-named event_type found in `analytics_events`.
- Product analytics uses `checkout_expired` (23 events / 23 sessions all-time; 14 in last 90d).
- Relative to purchase proxies, expired checkouts are a material leak (all-time expired sessions 23 vs purchased sessions 24).

### Purchase / checkout events by path (all-time sample)

| Event type | Path | Events |
| --- | --- | --- |
| `checkout_start` | `/pricing` | 48 |
| `checkout_expired` | `/api/webhooks/stripe` | 23 |
| `purchase_complete` | `/api/webhooks/stripe` | 15 |
| `checkout_start` | `/concussion-rehab-mastery` | 15 |
| `purchase` | `/checkout/success` | 15 |
| `checkout_start` | `/courses` | 4 |
| `checkout_start` | `/preview` | 3 |
| `checkout_start` | `/pricing-international` | 2 |
| `checkout_start` | `/p/instinct-health` | 1 |
| `checkout_start` | `/` | 1 |
| `checkout_start` | `/melbourne-nov7` | 1 |

---

## 7. Top referrers

### By host (all-time)

| Referrer host | Events | Sessions |
| --- | --- | --- |
| `(direct/empty)` | 8,144 | 2,843 |
| `portal.concussion-education-australia.com` | 2,805 | 693 |
| `www.google.com` | 1,624 | 746 |
| `concussion-education-australia.com` | 1,618 | 470 |
| `syndicatedsearch.goog` | 297 | 112 |
| `www.essa.org.au` | 284 | 63 |
| `checkout.stripe.com` | 278 | 83 |
| `osteopathy.org.au` | 165 | 18 |
| `www.csp.org.uk` | 117 | 39 |
| `localhost:3947` | 101 | 4 |
| `googleads.g.doubleclick.net` | 76 | 58 |
| `localhost:3000` | 40 | 4 |
| `concussion-education-australia.squarespace.com` | 35 | 12 |
| `chatgpt.com` | 27 | 7 |
| `android-app://com.google.android.googlequicksearchbox/` | 21 | 5 |
| `www.osteopathy.org.au` | 20 | 4 |
| `essa.org.au` | 20 | 4 |
| `android-app://com.google.android.gm/` | 20 | 7 |
| `catalog.dm.aws.g2dm.com` | 18 | 1 |
| `link.edgepilot.com` | 15 | 6 |
| `www.alliedhealthcpd.com.au` | 12 | 2 |
| `bing.com` | 11 | 11 |
| `l.instagram.com` | 8 | 4 |
| `email.telstra.com` | 5 | 3 |
| `gatsby.ecs.cliniko.io` | 4 | 1 |

### Top raw referrer strings (all-time)

| Referrer | Events | Sessions |
| --- | --- | --- |
| `(direct/empty)` | 8,144 | 2,843 |
| `https://www.google.com/` | 1,624 | 746 |
| `https://concussion-education-australia.com/` | 1,618 | 470 |
| `https://portal.concussion-education-australia.com/scat-mastery` | 315 | 64 |
| `https://syndicatedsearch.goog/` | 297 | 112 |
| `https://www.essa.org.au/` | 284 | 63 |
| `https://portal.concussion-education-australia.com/scat-mastery?utm_source=squarespace&utm_medium=referral&utm_campaign=b` | 282 | 60 |
| `https://checkout.stripe.com/` | 278 | 83 |
| `https://portal.concussion-education-australia.com/scat6-download?utm_source=squarespace&utm_medium=referral&utm_c%20%20%` | 168 | 165 |
| `https://osteopathy.org.au/` | 165 | 18 |
| `https://www.csp.org.uk/` | 117 | 39 |
| `https://portal.concussion-education-australia.com/dashboard` | 92 | 11 |
| `http://localhost:3947/` | 83 | 4 |
| `https://googleads.g.doubleclick.net/` | 76 | 58 |
| `https://portal.concussion-education-australia.com/modules/101` | 76 | 7 |
| `https://portal.concussion-education-australia.com/d/pw-x9k3m7q8n4` | 72 | 6 |
| `https://portal.concussion-education-australia.com/checkout/success?session_id=cs_live_[REDACTED]` | 65 | 1 |
| `https://portal.concussion-education-australia.com/modules/2` | 63 | 5 |
| `https://portal.concussion-education-australia.com/modules/4` | 54 | 5 |
| `https://portal.concussion-education-australia.com/settings` | 41 | 3 |

### Top raw referrer strings (last 90 days)

| Referrer | Events | Sessions |
| --- | --- | --- |
| `(direct/empty)` | 6,289 | 1,899 |
| `https://concussion-education-australia.com/` | 1,354 | 384 |
| `https://www.google.com/` | 406 | 128 |
| `https://www.essa.org.au/` | 284 | 63 |
| `https://portal.concussion-education-australia.com/scat-mastery` | 231 | 30 |
| `https://portal.concussion-education-australia.com/scat-mastery?utm_source=squarespace&utm_medium=referral&utm_campaign=b` | 206 | 41 |
| `https://portal.concussion-education-australia.com/scat6-download?utm_source=squarespace&utm_medium=referral&utm_c%20%20%` | 168 | 165 |
| `https://osteopathy.org.au/` | 165 | 18 |
| `https://checkout.stripe.com/` | 150 | 13 |
| `https://www.csp.org.uk/` | 117 | 39 |
| `http://localhost:3947/` | 83 | 4 |
| `https://portal.concussion-education-australia.com/dashboard` | 74 | 7 |
| `https://portal.concussion-education-australia.com/checkout/success?session_id=cs_live_[REDACTED]` | 65 | 1 |
| `https://portal.concussion-education-australia.com/modules/101` | 65 | 4 |
| `https://portal.concussion-education-australia.com/modules/2` | 61 | 5 |
| `https://portal.concussion-education-australia.com/modules/4` | 50 | 3 |
| `https://portal.concussion-education-australia.com/settings` | 41 | 3 |
| `https://portal.concussion-education-australia.com/api/auth/verify?token=[REDACTED]` | 41 | 1 |
| `https://portal.concussion-education-australia.com/clinical-testing/sst` | 41 | 2 |
| `https://portal.concussion-education-australia.com/modules/6` | 35 | 5 |

**Read:** Majority is direct/empty or self-referrals from portal/marketing site. External acquisition leaders: Google, ESSA, Stripe checkout return, Osteopathy Australia, CSP UK, Google Ads / syndicated search, ChatGPT (small but tied to open GEO finding).

---

## 8. Leak board callouts (actionable)

1. **Fix the money-page → checkout cliff.** ~10.6% of money-page sessions show checkout/enrol/shop intent all-time.
2. **Recover expired checkouts.** `checkout_expired` volume is comparable to purchase volume; prioritize reminder / resume-checkout UX and pricing friction audit.
3. **Treat `/pricing-international` as a known exit leak** (open finding `exit-/pricing-international`).
4. **Monetize SCAT lead magnets.** `/scat-mastery` + `/scat6-download` dominate acquisition; ensure hard bridges into `/pricing` and checkout.
5. **GEO/LLM arrivals are real but not monetizing yet** (open finding `geo-llm-arriving`).
6. **Demo tour → booking gap** remains open (`tour-no-booking`).
7. **Instrumentation gap:** `shop_click` nearly unused; rely on `checkout_start` / `enroll_button_click` for CTA analytics until shop tracking is restored.

---

## Appendix — method

- Loaded `.env.local` in-process; secrets not printed.
- Queried Neon/Vercel Postgres `analytics_events` and `analytics_findings` with `@vercel/postgres`.
- Windows: all-time = full table; last 90 days = `timestamp_ms >= now-90d`.
- Money paths: exact + prefix match on `/pricing`, `/pricing-international`, `/uk`, `/cata`.
- Times in this doc labeled **ET** = America/Toronto.
