# Cold Outreach Engine + Bespoke Prospect Portal — Full Scope

**Purpose:** A B2B outbound machine that auto-researches regional Australian allied health clinics, generates a bespoke training portal per prospect (discipline-curated content, region-specific marketing, per-clinician pricing math), and delivers cold outreach emails containing the prospect's unique gated URL.

The system optimises for **convertibility** at every step. Each prospect sees content that feels hand-built for their clinic without a single hand-built page.

---

## ⚠️ Critical gate — no live sends until signoff

**Nothing goes out to a real prospect until tests are sent to Zac and signed off.**

Every email template (T1 initial, T2 follow-up, T3 final, any custom) must be sent to `zac@concussion-education-australia.com` as a test send first. Zac reviews:
- Subject line + opening line
- Personalisation accuracy (clinic name, team count, region)
- Portal URL renders correctly
- Tone matches peer-to-peer voice
- No compliance issues (unsubscribe, sender ID)

Only after explicit signoff per template does it become available for production sends. The admin UI gates this with a `signed_off_at` flag per template — production sends fail if the flag is null.

Live sends are also gated by:
- A per-prospect `Approve send` button (no bulk-fire by default)
- A daily volume cap (configurable, starts at 5/day during ramp)
- A "test mode" toggle that redirects all production sends to Zac's inbox

---

## The two-tier offering (positioning)

This is a new B2B outreach motion. The pitch architecture is two-tier:

### Tier 1 — Online Portal Access (Cold-Pitch Entry Point)

The cold pitch sells **online concussion training delivered via the CEA portal** to the clinic's clinicians. Lower friction, no travel, no scheduling. Per-clinician seat pricing makes the math easy.

- Each clinician gets a portal login
- Discipline-curated content track (osteopath / physio / GP / EP / admin) — see §6
- CCM modules + AI in Clinical Practice + SCAT6/SCOAT6 forms + reference library
- CPD tracking + certificate generation
- Admin micro-course included for reception staff
- Sample discharge templates (partial / preview) visible
- Marketing section showing local outreach opportunities (preview)

Lower pricing tier, easier yes. **This is what the cold pitch leads with.**

### Tier 1 pricing model — per-clinician seats with discipline weighting

Individual CCM Online = A$497 retail. Clinic-level Tier 1 is volume-discounted seat pricing, weighted by discipline because each role gets a different content depth.

**Per-clinician annual seat prices (Tier 1)**

| Discipline | Seat price | What's included |
|---|---|---|
| Osteopath | A$397 | Full CCM, AI in Clinical Practice, discipline-curated track (diagnosis + cervical + PPCS emphasis) |
| Physiotherapist | A$397 | Full CCM, AI in Clinical Practice, discipline-curated track (assessment + early rehab emphasis) |
| GP / Sports Med | A$397 | Full CCM, discipline-curated track (diagnosis + MBS items + return-to-play sign-off) |
| Exercise Physiologist | A$347 | CCM with rehab emphasis, AI in Clinical Practice, discipline-curated track (BCTT + sub-threshold + RTP-six-step + RTS/RTW) |
| Myotherapist / RMT | A$197 | Subset content (cervical soft tissue, symptom tracking, escalation criteria) — adjunct role |
| Admin / Reception | A$97 | 1-hour Admin Concussion Workflow micro-course only |
| Practice Manager | A$197 | Admin micro-course + clinic-management overview + reporting access |

**Team volume discount** (applied to total subtotal)

| Total clinicians | Discount on subtotal |
|---|---|
| 1-7 | Standard rates |
| 8-15 | 10% off |
| 16-30 | 20% off |
| 30+ | 30% off |

**Worked example — Advanced Health (16 staff identified)**

| Role | Count | Seat | Subtotal |
|---|---|---|---|
| Osteopath | 9 | A$397 | A$3,573 |
| Exercise Physiologist | 3 | A$347 | A$1,041 |
| Myotherapist / RMT | 2 | A$197 | A$394 |
| Admin / Reception | 3 | A$97 | A$291 |
| **Subtotal** | **17 seats** | | **A$5,299** |
| Volume discount (16-30 band) | | -20% | -A$1,060 |
| **Tier 1 annual total** | | | **A$4,239 / year** |

vs A$7,952 if every clinician bought CCM Online individually at retail = 47% savings + admin micro-course bundled + ongoing updates.

The pricing renders dynamically per prospect inside the portal — the math table shows their actual roster, their actual subtotal, their actual discount tier.

### Tier 2 — Full Local Concussion Hub (Upgrade for Engaged Clinics)

For clinics that engage with Tier 1 and want to become the local concussion hub:

- Tier 1 portal access stays
- **Plus** full on-site training day (Zac travels in)
- **Plus** complete discharge template library (6 documents, clinic-licensed)
- **Plus** complete outreach package (schools / sports clubs / GPs — 6 templates with email sequences)
- **Plus** 30-day implementation support
- **Plus** CEA-trained-clinic badge + waiting-room poster

This is the upsell after a clinic has clinicians using the portal and wants to formalise the local positioning.

**Tier 2 pricing — on-site upgrade add-on (one-time)**

| Component | Price |
|---|---|
| On-site training day at clinic | A$4,500 |
| Discharge template library (6 templates, clinic-licensed + branded) | A$1,500 |
| Outreach package (6 templates, sequences, scripts, follow-up tracker) | A$1,000 |
| 30-day post-training implementation support | A$500 |
| CEA-trained-clinic badge + waiting-room poster | included |
| Travel surcharge | Variable by distance band (see below) |
| **Tier 2 base total** | **A$7,500** |

**Travel surcharge bands** (Byron Bay departure)

| Distance | Surcharge |
|---|---|
| Within 2 hrs drive (Northern Rivers, Gold Coast, southern Brisbane) | A$0 included |
| 2-4 hrs drive (Brisbane, Sunshine Coast) | A$300 |
| 4-6 hrs drive (Toowoomba, mid-NSW coast) | A$600 |
| 6-10 hrs drive (Hunter, Newcastle, Coffs) | A$1,000 |
| Domestic flight required (Sydney, Melbourne) | A$1,500 |
| Far flight (Cairns, Townsville, Perth, Tas) | A$2,500 |

**Worked example — Advanced Health (Buderim QLD = 2-4 hr drive band)**

Tier 2 base A$7,500 + travel A$300 = **A$7,800 one-time** on top of Tier 1 annual.

### "Best case" — Tier 1 + Tier 2 combined pitch

For clinics with serious local-hub ambition, the cold pitch shows BOTH tiers and the combined total. This is the highest-value path and the most defensible pitch ("the cheapest way to own concussion management in your region").

**Combined offering for Advanced Health (worked example)**

| Item | Cost |
|---|---|
| Tier 1 — Online Hub subscription (17 seats, year 1) | A$4,239 |
| Tier 2 — On-site training day + templates + outreach + support + travel | A$7,800 |
| **Year 1 total — Online + In-Person Hub Program** | **A$12,039** |
| Ongoing — annual portal access only (year 2+) | A$4,239/year |

vs A$22,400 of individual retail at 16 × A$1,400 CCM Complete + no clinic-level extras = 46% off retail with the complete local-hub package bundled.

The portal renders all three pricing views side by side: Tier 1 alone, Tier 2 alone (assumes Tier 1 in place), Combined. The combined column is visually emphasised as "the way most engaged clinics buy."

### Pricing engine implementation

`getProspectPricing(clinic)` returns:
```typescript
{
  tier1: {
    seatBreakdown: [{ discipline, count, seatPrice, subtotal }],
    subtotalBeforeDiscount,
    volumeDiscountBand,
    volumeDiscountPct,
    annualTotal,
  },
  tier2: {
    onSiteTraining: 4500,
    templates: 1500,
    outreach: 1000,
    support: 500,
    travelSurcharge: number,
    onceOffTotal,
  },
  combined: {
    year1Total,
    year2OnwardsAnnual,
    vsIndividualRetail,
    discountPctVsRetail,
  },
}
```

Per-prospect overrides are supported (e.g. a custom Tier 2 base price for a specific clinic, or a sponsor discount).

### Pitch flow

```
Cold email → Bespoke portal (Tier 1 framing) → 20-min call → 
  ↓
  Path A: Smaller clinic / pilot interest → Tier 1 portal subscription
  Path B: Engaged clinic / sees the hub opportunity → Tier 2 full Hub Program
```

The portal renders BOTH tiers but leads visually with Tier 1 (the entry point). Tier 2 is the obvious "and once you're ready to own the local market, here's the full program" upsell.

---

## 1. The user journey (what the prospect actually experiences)

```
[1] Cold email lands in clinic principal's inbox
    "Hi {first_name} — saw your team page at {clinic_name}, with {osteo_count} osteos + {ep_count} EPs. 
     Concussion is undertaught and over-presented; your team is exactly the setup to own it locally.
     I've put together a program overview specifically for {clinic_name} → {portal_url}"

[2] They click the gated portal URL → /p/{token}
    ↓
[3] Land on a portal that ALREADY KNOWS:
    - Their clinic name, location, team composition
    - Per-clinician pricing math at their team size
    - Local outreach targets specific to their region
    - A dashboard organized into "your team's pathways"
    ↓
[4] They explore discipline tracks:
    - "Osteopath pathway" (9 of you)
    - "Exercise Physiologist pathway" (3 of you)
    - "Admin + reception pathway" (3 of you)
    Each track shows discipline-curated content
    ↓
[5] They visit the marketing section:
    Pre-built outreach kit personalised to THEIR region:
    "Schools we'd help you reach: [actual schools in their catchment]
     Sports clubs: [actual local clubs]
     GP practices: [actual local GP networks]"
    ↓
[6] CTA: Cal.com 20-min scoping call embed → one-click booking
```

Every prospect, every email, every portal page — generated from one template + one prospect-data row. Conversion levers compound because every prospect sees a page that feels custom-built.

---

## 2. Data model

### `prospect_clinics`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `token` | TEXT UNIQUE | 16-char unguessable random string. URL fragment: `/p/{token}` |
| `clinic_name` | TEXT NOT NULL | Display name |
| `trading_name` | TEXT | Legal entity if different |
| `website_url` | TEXT NOT NULL | Source for research |
| `location_city` | TEXT | |
| `location_state` | TEXT | |
| `location_postcode` | TEXT | |
| `region_classification` | TEXT | regional / outer_metro / metro |
| `drive_time_hours_from_byron` | NUMERIC(4,2) | Calculated from postcode |
| `travel_cost_band` | TEXT | byron_local / drive_short / drive_long / domestic_flight / remote |
| `travel_surcharge_aud` | INTEGER | Computed from band |
| `principal_name` | TEXT | Owner / clinical lead |
| `principal_email` | TEXT | Direct if findable |
| `principal_title` | TEXT | "Owner & Lead Osteopath" |
| `principal_linkedin` | TEXT | URL |
| `general_email` | TEXT | Fallback contact |
| `phone` | TEXT | |
| `hub_foundation_price_aud` | INTEGER | Default 8000, per-prospect override |
| `hub_complete_price_aud` | INTEGER | Default 12500, per-prospect override |
| `valid_until` | DATE | Portal expires 30 days from creation |
| `status` | TEXT | researched / contacted / followup_sent / engaged / demo_held / quoted / won / lost / archived |
| `research_source` | TEXT | manual / scraped / api |
| `research_notes` | TEXT | Internal-only; not rendered in portal |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `prospect_clinicians`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `clinic_id` | INT FK → prospect_clinics | |
| `name` | TEXT | "Dr Greg Oliver" |
| `discipline` | TEXT | osteopath / physio / gp / sports_med / exercise_phys / myo / rmt / admin / practice_mgr |
| `role_title` | TEXT | Display |
| `is_principal` | BOOLEAN | |
| `extracted_from` | TEXT | URL of the team page row |

### `prospect_local_targets`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `clinic_id` | INT FK | |
| `target_type` | TEXT | school / sports_club / gp_practice / surf_life_saving / triathlon / cycling / other |
| `target_name` | TEXT | "Matthew Flinders Anglican College" |
| `target_url` | TEXT | Their website, if found |
| `notes` | TEXT | "Major QLD junior rugby pathway" |
| `priority` | INTEGER | 1-3 |

### `prospect_portal_views`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `clinic_id` | INT FK | |
| `viewer_ip` | TEXT | |
| `user_agent` | TEXT | |
| `viewed_at` | TIMESTAMPTZ | |
| `section_visited` | TEXT | overview / track:{discipline} / marketing / pricing / book |
| `duration_seconds` | INTEGER | |

### `prospect_outreach_log`

| Column | Type | Notes |
|---|---|---|
| `id` | SERIAL PK | |
| `clinic_id` | INT FK | |
| `email_template` | TEXT | initial / followup / final_check / custom |
| `email_subject` | TEXT | |
| `email_body` | TEXT | snapshot of sent content |
| `sent_at` | TIMESTAMPTZ | |
| `resend_email_id` | TEXT | for Resend webhook correlation |
| `opened_count` | INTEGER | |
| `clicked_count` | INTEGER | |
| `replied_at` | TIMESTAMPTZ | |
| `reply_sentiment` | TEXT | positive / neutral / negative / blocker (LLM-inferred) |
| `reply_text` | TEXT | |

---

## 3. The bespoke portal — page architecture

### `/p/{token}` — Overview

Hero shows clinic name, team composition, region. Per-clinician pricing math rendered against THEIR team size.

```
┌────────────────────────────────────────────────────────────────────┐
│ Prepared for Advanced Health Pain & Injury Clinic — Buderim QLD    │
│ June 2026 · Valid until 16 July 2026                                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Your team (16 staff identified):                                   │
│   9 osteopaths · 3 exercise physiologists · 2 myo/RMT · 3 admin    │
│                                                                    │
│ The opportunity ────────────────────────────────────────────────── │
│ Concussion is one of the most undertaught conditions...            │
│                                                                    │
│ Your team's training pathways ─────────────────────────────────── │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Osteo    │ │ Ex Phys  │ │ Myo/RMT  │ │ Admin    │               │
│ │ 9 of you │ │ 3 of you │ │ 2 of you │ │ 3 of you │               │
│ │ Click →  │ │ Click →  │ │ Click →  │ │ Click →  │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                    │
│ Local hub positioning ────────────────────────────────────────── │
│ The 8 schools, 5 sports clubs, and 12 GP practices in your        │
│ catchment we'd help you build referral relationships with...      │
│                                                                    │
│ Investment ──────────────────────────────────────────────────── │
│ Hub Foundation: A$8,000 — A$500 per clinician                      │
│ Hub Complete:   A$12,500 — A$781 per clinician                     │
│ (vs A$1,400 individual retail = 64% / 44% discount)                │
│                                                                    │
│ Book a 20-min call → cal.com/zac-lewis-so8zjs/30min                │
└────────────────────────────────────────────────────────────────────┘
```

### `/p/{token}/track/{discipline}` — Discipline-specific pathways

Each discipline track reorders + curates CEA's content for that role's part of the patient journey.

| Track | Content curated for the discipline |
|---|---|
| **`gp`** | Diagnosis emphasis: SCAT6, red flags, when-to-refer, return-to-play sign-off authority, MBS item numbers for concussion mgmt, medicolegal docs |
| **`osteopath`** | Diagnosis + manual therapy: SCAT6/SCOAT6, VOMS, BESS, cervical contribution, PPCS workup, paediatric concussion, manual therapy applications |
| **`physio`** | Assessment + early rehab: VOMS, BESS, vestibular rehab basics, return-to-play / return-to-school, when to escalate |
| **`sports_med`** | Hybrid clinical: SCAT6 + Buffalo treadmill + RTP decision authority, medicolegal sign-off |
| **`exercise_phys`** | Active rehab focus: Buffalo Concussion Treadmill Test, sub-symptom threshold aerobic Rx, VOR/gaze stability progression, Amsterdam 2023 6-step RTP, RTW/RTS programs |
| **`myo` / `rmt`** | Adjunct support: cervical soft tissue post-concussion, symptom tracking, escalation criteria |
| **`admin` / `practice_mgr`** | The 1-hour Concussion Workflow micro-course: phone triage, red flags, intake form, AI-safe handling, template library, booking priority |

Each track is rendered from a single `<DisciplineTrack discipline={...} clinic={...} />` component that pulls a discipline-specific content map.

### `/p/{token}/marketing` — Local outreach kit preview

Shows the prospect what the outreach package gives their team — but pre-populated with THEIR local targets:

```
┌────────────────────────────────────────────────────────────────────┐
│ Your local outreach kit — what we'd help you set up                │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ Schools in your catchment (8 identified):                          │
│ • Matthew Flinders Anglican College — preview intro letter →       │
│ • Sunshine Coast Grammar — preview intro letter →                  │
│ • Immanuel Lutheran College — preview intro letter →               │
│ ...                                                                │
│                                                                    │
│ Sports clubs (5 identified):                                       │
│ • Sunshine Coast Falcons (Q-Cup rugby league) — coach brief →      │
│ • Maroochydore Surf Life Saving — partnership template →           │
│ ...                                                                │
│                                                                    │
│ GP practices (12 identified within 10km):                          │
│ • Buderim Family Medical Practice — referral letter template →     │
│ • Maroochy Doore Medical Centre — referral letter template →       │
│ ...                                                                │
│                                                                    │
│ Each template renders pre-filled with "Advanced Health Pain &      │
│ Injury Clinic — Buderim QLD". Editable on delivery.                │
└────────────────────────────────────────────────────────────────────┘
```

### `/p/{token}/sample/{template_slug}` — Live preview of an outreach template

Shows what the actual intro-letter / coach-brief / referral-letter looks like, pre-filled with their clinic data. Builds confidence that the templates aren't vapor.

### `/p/{token}/book` — Cal.com embed

Iframe to `cal.com/zac-lewis-so8zjs/30min` — one-click booking from within the portal.

### `/p/{token}/preview-platform` — Magic-link to a real CEA portal account

For high-engagement prospects: a button that auto-creates a `preview` access user with full course read access, magic-link signs them in, lets them BROWSE the actual CCM modules they'd give their team. Real platform, not screenshot.

---

## Demo dashboard — what's visible vs locked

The bespoke portal is a sales surface, not a free product. Visibility decisions follow one rule: **show enough free value to make the offering obviously worth pursuing; lock enough premium content to make conversion easy.**

### ✓ Always visible (free utility — builds trust + value perception)

| Content | Why visible |
|---|---|
| **Fillable SCAT6, SCOAT6, Child SCAT6 forms** | Already free on the public portal; high practical utility; demonstrates CEA's clinical-tool credibility |
| **Reference library — 140+ peer-reviewed citations** | Pure reading content, no proprietary value lost. Shows depth. |
| **Free AI Safety Checklist** | Already free public. Shows the AI compliance side of CEA's expertise. |
| **Course curriculum / syllabus** | Module titles, durations, what's covered — shows the structure. Builds anticipation. |
| **Discipline track structure (overview only)** | "Here's how the osteopath pathway is organised" — shows the curation logic |
| **Module 1 partial trial — first 5 min video + first text section** | Real content sample. Hooks them on quality. |
| **Per-clinician pricing math + tier comparison** | Transparent value framing |
| **Local outreach kit preview (target list)** | Show the names of schools / sports clubs / GPs we'd help them reach — demonstrates research depth |
| **Sample template thumbnails** | Watermarked / cropped preview of the GP handover letter, school RTP form — shows quality without giving the full template away |
| **Admin micro-course outline + first module** | Section titles + first module's content. Reception staff can see what they'd get. |

### 🔒 Locked / greyed (drives conversion)

| Content | Lock state | Conversion CTA |
|---|---|---|
| **Modules 2-8 of CCM** | Greyed with lock icon + "Unlock with Tier 1 portal subscription" | Button → pricing tiers |
| **AI in Clinical Practice — full modules** | Locked overlay | Same |
| **Full discharge template library (6 templates)** | Watermarked previews with "Available with Hub Complete (Tier 2)" | Button → Tier 2 detail |
| **Full outreach template library (6 templates)** | Same as discharge | Same |
| **Admin micro-course — modules 2-8** | Greyed | "Included in Tier 1 portal" |
| **Quiz + certificate generation** | Locked | "Activates on enrollment" |
| **CPD tracking dashboard** | Greyed mock | "Activates per clinician on enrollment" |
| **Platform preview magic-link** | Disabled until reply received | "Reply to Zac's email to unlock" — gating prevents account-spam abuse |
| **CEA-trained-clinic badge + waiting-room poster download** | Locked | "Activated after on-site training day (Tier 2)" |

### B2B-only content boundary

Two of the demo sections are **B2B-exclusive** — they only render inside the bespoke prospect portal (`/p/{token}/*`) and are never exposed to individual consumer-portal users:

1. **Admin micro-course** (the 1-hour Concussion Workflow for Reception)
2. **Local marketing / outreach kit** (regional outreach templates + scripts + follow-up tracker + preview discharge templates)

These two content blocks:
- Never appear in `/courses` public catalogue
- Never link from public navigation
- Never indexed in `sitemap.ts` or `llms.txt`
- Never available via individual purchase
- Only render inside `/p/{token}` after token resolves to a valid `prospect_clinic`
- Protected by the same noindex/nofollow + robots.txt block as the portal itself

This protects the public catalogue from B2B-only content leaking out as a publicly-discoverable course or asset. It also makes the B2B pitch genuinely differentiated — "you don't get this anywhere else, only as part of the Hub Program."

Public consumer portal content (CCM, AI in Clinical Practice, AI Safety Checklist, SCAT6 forms, references) **does** appear in both the prospect portal and the public catalogue — same content, different framing per surface.

### Greying-state UI pattern

Premium content shows:
1. Title + duration + brief description (visible, no lock)
2. A small lock icon in the top-right corner
3. On hover (desktop) or tap (mobile): tooltip says "Unlock with [tier name]"
4. Clicking the locked card scrolls smoothly to the pricing section with the relevant tier highlighted
5. CTA button below the lock: "See what's included in [tier name] →"

The pattern is consistent across all locked content. Never use a hard wall ("Login required" / 401) — always show value first, then friction-light CTA to unlock.

### Free trial mechanics

A small free-trial pathway exists inside the portal for clinicians who want to test before recommending to their principal:

- Visit `/p/{token}/preview-platform`
- Enter email
- Get a magic link to a `preview` access account
- Preview account has: Module 1 full content, all free utility (forms, references, checklist), but Modules 2-8 still locked
- After 7 days: preview account expires (course access reverts to landing-page-only)
- Email sequence during the 7 days nurtures toward enrollment

This is OPTIONAL — gated behind a "Reply to unlock platform preview" CTA on the main portal so we don't auto-create accounts for every cold-email recipient (deliverability + abuse protection).

---

## 4. Cold outreach engine

### Research phase

**Endpoint:** `POST /api/admin/prospect-research`

Input:
```json
{ "website_url": "https://advancedhealth.com.au" }
```

Pipeline:
1. Fetch the homepage + look for `/team`, `/our-team`, `/about-us`, `/staff`, `/people` routes
2. Extract the team page HTML
3. LLM-parse: name → discipline → role_title triples (uses Anthropic API; structured output schema)
4. Extract principal: name + email (if listed) or fallback to general email
5. Extract location: city, state, postcode
6. Compute travel band from Byron Bay (postcode → drive-hours lookup table)
7. Suggest local outreach targets:
   - Schools within 15km (Google Places API)
   - Sports clubs within 30km (Google Places API)
   - GP practices within 5km (Google Places API)
8. Generate token (`crypto.randomBytes(12).toString('base64url')`)
9. Insert clinic + clinicians + local_targets rows
10. Return preview of the bespoke portal URL

**Admin review step:**
Admin UI (`/admin/prospects/[id]`) shows the auto-extracted data, lets Zac:
- Edit clinic_name, principal_name, principal_email
- Add/remove clinicians (if extraction missed some)
- Override travel_surcharge if estimate is off
- Approve / reject local targets
- Click "Approve & enable portal"

Approval flips `status` to `researched_approved` and the portal URL becomes live.

### Outreach phase

**Endpoint:** `POST /api/admin/prospect-send-email`

Input:
```json
{ "clinic_id": 42, "template_slug": "initial", "scheduled_at": "2026-06-03T09:00:00+10:00" }
```

Pipeline:
1. Load prospect_clinic + clinicians
2. Load the email template
3. Merge variables:
   - `{first_name}` from principal_name
   - `{clinic_name}`, `{clinic_short_name}`
   - `{discipline_summary}` ("9 osteopaths + 3 EPs + 2 myo + 3 admin")
   - `{portal_url}` = `https://portal.concussion-education-australia.com/p/{token}`
   - `{primary_local_target}` (e.g. "Matthew Flinders")
   - `{drive_time_from_byron}` for the "we'd drive up from Byron Bay" hook
4. Send via Resend from `partnerships@concussion-education-australia.com`
5. Insert `prospect_outreach_log` row
6. Set audit_key `outreach_{template}_{clinic_id}` for idempotency

### Reply detection

Resend inbound webhook already exists. New handler:
- Match incoming reply to a recent outreach via `In-Reply-To` header or `email_id`
- Set `replied_at` on the outreach_log row
- LLM-classify sentiment (positive / neutral / negative / blocker) using a single Anthropic call
- Update clinic status to `engaged`
- Email Zac a notification with the reply text + suggested next action

### Sender domain

- **Cold outreach**: `partnerships@concussion-education-australia.com` (alias, configured in Resend Domains)
- **Transactional** (course access, magic links, lead-magnet confirmation): `zac@concussion-education-australia.com` (unchanged)
- Separation protects transactional deliverability if cold campaign hits a complaint spike

---

## 5. Convertibility levers (the conversion design)

Every component of the system is designed around one or more of these levers:

| Lever | How it's implemented |
|---|---|
| **Personalisation depth** | Clinic name + team count + local targets baked into every page. No generic "your team" language. |
| **Discipline-specific value** | Each clinician sees content curated for THEIR role. GP doesn't waste time on EP rehab pathway; EP doesn't waste time on MBS billing. |
| **Anchored pricing** | Per-clinician math vs A$1,400 individual retail. At Advanced Health's 16 staff: Hub Complete = A$781/clinician = 44% off retail with extras bundled. |
| **Engagement tracking** | Beacon fires on every portal page load + section visit. Zac sees "viewed pricing 3 times in last 24h" → calls them. |
| **Soft urgency** | Portal expires 30 days from creation. Renders "Valid until [date]". Implies scarcity without aggression. |
| **Embedded booking** | Cal.com embed for one-click 20-min scoping call. No back-and-forth scheduling. |
| **Magic-link platform preview** | High-engagement prospects can launch a real preview account on the CEA portal. Demonstrates the platform instead of describing it. |
| **Multiple visit tracking** | Re-engagement signal. If prospect viewed portal twice but didn't book → send a personalised follow-up referencing the section they spent time on. |
| **Email reply intelligence** | LLM-classified sentiment routes replies. Positive → instant Zac notification. Negative → suppression list. |
| **Print-to-PDF** | Same portal renders as a polished one-pager when printed. Lauren forwards the PDF to her partners; the URL still works for them too. |
| **Static portal URL on the email** | URL is the same every visit. Prospect can revisit, partners can share, no expiring magic links. |

---

## 6. Discipline content map (what reorders per track)

Source content (existing in CEA portal):
- CCM modules 1-8 (concussion fundamentals)
- AI in Clinical Practice modules
- SCAT6/SCOAT6/Child SCAT6 fillable forms
- VOMS, BESS, Buffalo Treadmill protocol docs
- Reference library (140+ peer-reviewed)

Mapping per discipline (the key reorganisation principle):

```
                  GP   Osteo  Physio  Sports Med  Ex Phys  Myo/RMT  Admin
Diagnostic
  - SCAT6        ●●●   ●●●    ●●●     ●●●          ●        ○        ●
  - SCOAT6       ●●    ●●●    ●●●     ●●           ○        ○        ○
  - VOMS          ○    ●●●    ●●●     ●●           ●        ○        ○
  - BESS          ○    ●●●    ●●●     ●●           ●        ○        ○
  - Cervical       ○    ●●●    ●●      ●            ○        ●●       ○

Acute mgmt
  - Red flags    ●●●   ●●     ●●      ●●●          ●        ●●       ●●●
  - RTA decision ●●●   ●●     ●●      ●●●          ●●       ○        ○
  - Paediatric   ●●    ●●     ●●      ●●●          ●        ○        ●

Rehab
  - BCTT          ○    ●      ●●      ●●           ●●●      ○        ○
  - Sub-threshold ○    ●      ●●      ●●●          ●●●      ○        ○
  - VOR / gaze    ○    ●●     ●●      ●●           ●●●      ○        ○
  - RTP 6-step   ●●●   ●●     ●●●     ●●●          ●●●      ●        ○
  - RTS / RTW    ●●    ●      ●●●     ●●           ●●●      ○        ●

Discharge
  - GP handover  ●●●   ●●     ●●      ●●●          ●●       ●        ●●●
  - School RTP   ●●    ●●     ●●●     ●●           ●●●      ○        ●●●
  - NDIS reports  ○    ●●     ●●●     ●●           ●●●      ●        ●

Admin
  - Triage        ○    ○      ○        ○            ○        ○        ●●●
  - Intake form   ○    ●      ●        ●            ●        ●        ●●●
  - AI workflow   ●    ●      ●        ●            ●        ●        ●●●
  - Templates    ●●    ●●     ●●       ●●           ●●       ●        ●●●
```

●●● = priority content for this track; ●● = covered; ● = brief mention; ○ = excluded

This drives the discipline-specific dashboard reordering. The component reads the clinic's `prospect_clinicians` rows, groups by discipline, and renders track cards for each discipline present.

---

## 7. The 1-hour Admin micro-course content

(This is what populates the `admin` track — a real micro-course, not just a placeholder.)

| Module | Duration | Content |
|---|---|---|
| **1. Recognising concussion at the front desk** | 8 min | What a concussion is in plain English; common presentations; why your role matters |
| **2. Phone triage script** | 10 min | The "is this happening now / today / this week" decision tree. Fast-track vs schedule. Sample scripts for parent, coach, GP referral. |
| **3. Red flags — when to send to ED immediately** | 8 min | The five no-negotiable red flags. Verbal script for redirecting to ED. Documentation on the booking. |
| **4. Intake form additions** | 7 min | Three fields to add to your existing intake: mechanism, last symptom-free, prior concussions. Why these matter. |
| **5. AI-assisted documentation — the safe basics** | 10 min | Quick overview of Heidi/Lyrebird/ChatGPT. What admin should do vs not do. Privacy Act considerations in plain English. |
| **6. Template library walkthrough** | 8 min | Where the templates live. How to merge in patient data. When to use which template. |
| **7. Booking flow for concussion priority** | 5 min | Calendar templates for concussion-priority appointments. How to slot a SCOAT follow-up. |
| **8. Knowledge check + certificate** | 4 min | 10-question quiz. Pass = certificate that goes in their HR file. |

Total: 60 minutes. Not a full CPD course — a tight operational training.

---

## 8. Admin UI surfaces

### `/admin/prospects` — pipeline dashboard

Columns: clinic name, region, team size, status, last_contacted, view_count, primary_signal.

Filters: status, region, drive_band, discipline mix, score.

Bulk actions: send T2 follow-up to all "contacted >5 days ago no reply".

### `/admin/prospects/[id]` — per-clinic detail

Sections:
- Clinic data (editable)
- Clinician roster (editable)
- Local targets (editable)
- Portal URL (with view-event log)
- Outreach history (sent emails + replies)
- "Send T1" / "Send T2" / "Compose custom email" buttons
- "Open portal preview" → loads `/p/{token}` in a new tab
- "Generate platform preview magic link" → creates a `preview` user, sends magic link

### `/admin/prospects/new` — research a new prospect

- Paste clinic URL
- "Research" button → runs the research pipeline
- Review extracted data
- Approve → status flips to `researched_approved` and portal goes live

### `/admin/prospects/metrics` — funnel reporting

- Researched → contacted → engaged → demo → quoted → won
- Conversion rates per stage
- Revenue per closed deal
- Time-in-stage averages

---

## 9. Compliance + deliverability

### SPAM Act 2003 (Australia)

- B2B inferred consent applies (clinic owner / clinical lead role-relevant message)
- Each email must include sender identification (Zac Lewis, CEA, registered address)
- Each email must include functional unsubscribe (one-click, no acknowledgement required)
- Honest subject lines (no "Re:" unless replying)

### Resend / Google bulk sender rules

- Domain reputation: separate `partnerships@` alias for cold outreach
- Volume cap: max 50 sends/day initially, warm up over weeks
- Complaint rate must stay <0.3% (Google bulk sender requirement)
- DMARC enforced (already in place for CEA)
- Reply-to monitoring — bounces, complaints automatically suppress

### Privacy Act

- Clinic data is publicly-listed business contact info (not personal info beyond name/title)
- Suppression on request
- Clinic owners can request data deletion (rare for B2B but support it)

---

## 10. Build phases (ordered by dependency, no wall-clock)

### Phase 0 — Foundation
- DB schema migration (5 tables)
- Token generation utility
- Travel-band lookup table (postcode → drive hours from Byron Bay)
- Sender alias setup in Resend
- Admin auth extensions for new routes

### Phase 1 — Bespoke portal renderer
- `/p/[token]/page.tsx` — overview
- `/p/[token]/track/[discipline]/page.tsx` — discipline tracks (7 disciplines)
- `/p/[token]/marketing/page.tsx` — local outreach kit preview
- `/p/[token]/sample/[template]/page.tsx` — template previews with merged clinic data
- `/p/[token]/book/page.tsx` — Cal.com embed
- View tracking beacon
- noindex/nofollow + robots.txt block

### Phase 2 — Research engine
- `POST /api/admin/prospect-research` (website URL → structured data)
- LLM team-page parser
- Google Places integration for local targets
- Manual review UI

### Phase 3 — Discipline content map
- Curate CEA's existing content into 7 discipline tracks
- Build the discipline-specific component renderer

### Phase 4 — Admin micro-course
- Build the 1-hour content (8 modules per the spec above)
- Render it inside the `admin` track
- Knowledge check + certificate generation

### Phase 5 — Outreach engine
- Email templates (T1 initial, T2 follow-up, T3 final-check, custom)
- `POST /api/admin/prospect-send-email` with merge field engine
- Suppression list
- Domain warm-up tracking

### Phase 6 — Reply detection
- Resend inbound webhook handler
- LLM-classify sentiment
- Auto-status updates
- Zac notification email

### Phase 7 — Admin UI
- `/admin/prospects` pipeline
- `/admin/prospects/[id]` detail
- `/admin/prospects/new` research flow
- `/admin/prospects/metrics` reporting

### Phase 8 — Platform preview magic link
- Endpoint that creates a `preview` user + magic link from a prospect
- Embedded in portal "Preview the actual platform" button

### Phase 9 — Local outreach asset library
- 6 discharge templates (clinic-licensed, branded variants)
- 6 outreach templates (school / sports / GP / SLS / triathlon / generic)
- Email sequences for each outreach type
- Phone scripts
- Follow-up tracker (Google Sheet template)

---

## 11. Open decisions

| Decision | Default if no input |
|---|---|
| **Pricing on the portal** — show explicit prices, or "from A$8,000" + force a call? | Show explicit per-clinician math + tiered prices. Lauren proves this lands better than vague pricing. |
| **Portal expiry behaviour** — hard expire or just show "Valid until" warning? | Soft — render warning past valid_until date but page still works. Allows revisits months later. |
| **Discipline track for "admin" — show price + business case?** | Yes — practice managers care about per-clinician math + ROI |
| **Platform preview — auto-create accounts or gate behind call?** | Gate behind reply (don't auto-create for everyone — protects deliverability). Once they reply, create + link. |
| **Cold outreach sender — `partnerships@` or `zac@`?** | `partnerships@` for separation. Switch to `zac@` for warm replies. |
| **Research throughput** — manual review per prospect, or batch approval? | Manual per prospect early. Build batch flow once volume justifies. |
| **Markup language for templates** — Mustache, Handlebars, or simple JS templates? | Simple TS template literals with merge function. No new dep. |

---

## 12. Convertibility scorecard (what we measure)

Per prospect, track:
- Email opens (T1, T2)
- Portal first-view timestamp
- Portal section visits (overview / discipline-tracks / marketing / pricing / book)
- Multi-visit count (engagement signal)
- Reply received (yes/no)
- Booking made via Cal.com link
- Demo / scoping call held
- Quote sent
- Deal closed

Per cohort, track:
- T1 open rate (target: 35%+)
- Portal click-through rate (target: 15%+ of opens)
- Section engagement (target: 40%+ visit >2 sections)
- Reply rate (target: 8%+)
- Meeting rate from replies (target: 40%+)
- Close rate from meetings (target: 30%+)
- Average deal value
- CAC (cost per closed deal — Zac's time + travel + tooling)

Surface these on `/admin/prospects/metrics` so the engine self-tunes over time.

---

## 13. Summary

A single page template + a single data model generates a polished, personalized portal per cold-outreach prospect. The prospect sees a page that feels custom-built for their clinic. The portal is gated by an unguessable token (not auth — chains-of-command can share the link internally). Each prospect's portal contains:

- A team breakdown showing their identified clinicians
- Discipline-specific content tracks reorganised for each role's part of the patient flow
- A local outreach kit pre-populated with their region's schools, sports clubs, and GPs
- Per-clinician pricing math vs individual retail
- Cal.com embed for one-click scoping call booking
- Optional magic-link to a real CEA platform preview account

The outreach engine sends personalized cold emails that drop the unique portal URL. Replies are LLM-classified and surface to Zac with sentiment + suggested next action. View events, multi-visit tracking, and section-engagement metrics let Zac know exactly when to call.

The whole system reuses CEA's existing infrastructure: Resend for sending, the magic-link auth flow, the schema/portal components, the content library. New surfaces are additive — they don't disturb the consumer-facing portal that serves SCAT6 Mastery / AI Safety Checklist / paid courses.

Built once. Generates indefinitely. Conversion levers compound. Each new prospect costs Zac's research time + Resend's per-email cost — nothing more.
