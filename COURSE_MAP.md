# CEA Course Map — Single Source of Truth
**Date:** 2026-05-27
**Purpose:** One place that maps every course CEA has, plans to have, or has considered. Every other doc (`ROADMAP_AND_SYSTEM.md`, `STRATEGY_AUDIT_2026-05-27.md`, `COURSE_SCOPING_TRILOGY.md`, `llms-full.txt`) should defer to this for "what's the current state of each course?"

---

## The ladder at a glance (live + built only)

```
A$0      SCAT6 Mastery (free course)         ━━━ LIVE, lead-gen funnel for concussion
A$0      AI Safety Checklist (free PDF)      ━━━ LIVE, lead-gen funnel for AI compliance
A$97     Vagus Nerve                         ━━━ BUILT but HIDDEN — no funnel yet
A$197    AI in Clinical Practice             ━━━ LAUNCHING 17 JUNE 2026
A$497    CCM Online                          ━━━ LIVE
A$1,190  CCM Complete (online + workshop)    ━━━ LIVE
USD$197  CCM International                   ━━━ LIVE
```

Three planned courses (PPCS / Cervicogenic / Vestibular MSK) are NOT shown above because none have been built. They appear in §3 under "Planning / Validation."

---

## §1 — Currently live courses

### 1.1 SCAT6/SCOAT6 Mastery (free)
| Field | Value |
|---|---|
| **Status** | LIVE |
| **Price** | A$0 (no card required) |
| **Built** | Yes — 3 modules + fillable forms with auto-scoring |
| **CPD hours** | 1 (digital certificate on completion) |
| **Persona** | New-to-CEA clinicians; concussion-curious |
| **Funnel role** | #1 lead-gen for the concussion funnel. 4 of 18 hot clickers in 30-day window came from this (`signupSource = free-course`). Proven path to CCM Online conversion. |
| **Where it lives** | `/scat-mastery` |
| **Content location** | Existing `/modules/101`, `/modules/102`, `/modules/103` |

### 1.2 AI Safety Checklist for Allied Health Documentation (free PDF)
| Field | Value |
|---|---|
| **Status** | LIVE |
| **Price** | A$0 (email gate) |
| **Built** | Yes — 1-page checklist, served via print-optimized HTML page at `/ai-safety-checklist/checklist` |
| **CPD hours** | n/a (not a course — it's a clinical reference artefact) |
| **Persona** | AU allied-health clinician using AI tools; compliance-anxious |
| **Funnel role** | #1 lead-gen for the AI funnel. Day 0 transactional delivery + Day 3/7/14 nurture sequence wired into the cron. |
| **Where it lives** | `/ai-safety-checklist` (landing) → `/ai-safety-checklist/checklist` (content, magic-link gated) |
| **Content location** | `app/ai-safety-checklist/checklist/page.tsx` (built into the page, not a separate PDF file) |

### 1.3 Concussion Clinical Mastery (CCM) — Online tier
| Field | Value |
|---|---|
| **Status** | LIVE |
| **Price** | A$497 AUD |
| **Built** | Yes (lives in original concussion system, not `provider-catalogue.ts`) |
| **CPD hours** | 8 |
| **Persona** | Concussion-focused clinician — sports physio, osteo, GP, exercise physiologist |
| **Funnel role** | Flagship online tier. Natural upgrade from SCAT6 Mastery. |
| **Where it lives** | `/pricing` (purchase via `/api/create-checkout` with `courseType: 'online-only'`) |
| **Catalogue entry** | NO — lives in `lib/config.ts` (`PRICE_ONLINE: 497`). Pricing tech debt — should eventually migrate to `provider-catalogue.ts`. |
| **Content** | 8 modules, 23 video lessons, 90 quiz questions, 140+ peer-reviewed references |

### 1.4 Concussion Clinical Mastery (CCM) — Complete (online + workshop)
| Field | Value |
|---|---|
| **Status** | LIVE |
| **Price** | A$1,190 early-bird (until 2026-05-31) / A$1,400 regular |
| **Built** | Yes (online portion same as CCM Online; workshop is in-person) |
| **CPD hours** | 14 (8 online + 6 in-person workshop) |
| **Persona** | Concussion clinician + workshop-willing buyer |
| **Funnel role** | Highest-value tier. Workshop creates the premium. |
| **Where it lives** | `/pricing` (purchase via `/api/create-checkout` with `courseType: 'full-course'`) |
| **Catalogue entry** | YES — `id: 'concussion-clinical-mastery'`, `status: 'live'`, `priceAUD: 1190` |
| **Workshop confirmed** | Melbourne — Sat 13 June 2026, Rydges Exhibition St (CBD). Sydney + Byron Bay = `collecting` status (demand capture only). |

### 1.5 Concussion Clinical Mastery — International (USD)
| Field | Value |
|---|---|
| **Status** | LIVE |
| **Price** | USD $197 |
| **Built** | Yes (same content as CCM Online — jurisdiction-neutral framing on landing) |
| **CPD hours** | 8 (claimed as "8 structured contact hours" — recipients self-claim with their board) |
| **Persona** | International clinician — NZ / UK / US / Canada |
| **Funnel role** | Topic-driven content (AI scribe comparison, concussion blog cluster) → `/pricing-international` → conversion |
| **Where it lives** | `/pricing-international` |

---

## §2 — Built but not yet selling

### 2.1 AI in Clinical Practice
| Field | Value |
|---|---|
| **Status** | BUILT, `coming-soon` (auto-flips to `live` at `launchAt: 2026-06-17T00:01+10:00`) |
| **Price** | A$197 regular / A$99 launch week (auto-reverts at `earlyBirdEndsAt: 2026-06-24T23:59+10:00`) |
| **Built** | YES — 9 modules, 2,360 lines of markdown content + prompts library + templates library |
| **CPD hours** | 3 |
| **Persona** | AU allied-health clinician anxious about AHPRA/Privacy Act/NDIS audit risk when using AI tools |
| **Funnel role** | The AI compliance funnel flagship. AI Safety Checklist → this course. |
| **Where it lives** | `/courses/ai-in-clinical-practice` (gated by `requireAiCourseAccess()`) |
| **Catalogue entry** | YES — `id: 'ai-in-clinical-practice'`, `status: 'coming-soon'`, `launchAt: '2026-06-17T00:01+10:00'`, `earlyBirdEndsAt: '2026-06-24T23:59+10:00'` |
| **Content location** | `content/ai-course/module-1-compliance.md` through `module-6-hub-and-certification.md` + `content/ai-course/prompts/` + `content/ai-course/templates/` |
| **Modules** | 1. AHPRA AI Guidelines, Privacy Act & ChatGPT Clinical Notes Compliance · 2. AI Scribe Tool Selection — Heidi vs Lyrebird vs Halo vs Dragon · 3. Safe Documentation Workflows (NDIS audit-safe) · 4. Patient Communication & Documents · 5a. Specialty deep-dive: Physio · 5b. Naturopath · 5c. GP · 5d. Osteopath · 6. Hub Onboarding & Certification |
| **Pre-launch ready** | Engaged-user blast endpoint built (`/api/admin/ai-course-launch-blast`) + cron wired (`fire-launch-blasts`) to auto-fire on launchAt |

### 2.2 Vagus Nerve in Clinical Practice
| Field | Value |
|---|---|
| **Status** | BUILT but HIDDEN from public display (`status: 'pilot'`) |
| **Price** | A$97 (earlyBirdPriceAUD A$82, 15% off — currently not promoted) |
| **Built** | YES — 6 modules, 430 lines of dense clinical content |
| **CPD hours** | 1 (whole number; rounded conservatively from 75 minutes) |
| **Persona** | Clinician interested in autonomic dysfunction — POTS, post-concussion, long-COVID overlap |
| **Funnel role** | NONE — hidden until a proper funnel is built (lead magnet + blog cluster + waitlist) |
| **Where it lives** | `/courses/vagus-nerve` exists but not surfaced from /courses index |
| **Catalogue entry** | YES — `id: 'vagus-nerve'`, `status: 'pilot'` (deliberately hides from public marketplace) |
| **Content location** | `content/vagus-course/module-1-anatomy.md` through `module-6-hub-certification.md` |
| **What's missing** | Lead magnet, blog cluster, persona-specific funnel. Until that's built, the course is hidden. |

---

## §3 — Planning / Validation (NOT BUILT)

### 3.1 Persistent Post-Concussion Symptoms (PPCS): The Chronic 5-20%
| Field | Value |
|---|---|
| **Status** | DEMAND VALIDATION via waitlist — course content NOT YET BUILT |
| **Price** | TBD — set ONLY after content build is complete |
| **Built** | **No.** Zero modules. Only `/ppcs-waitlist` landing + 3 blog cluster posts exist. |
| **CPD hours** | TBD after build |
| **Persona** | Existing CCM Online buyer / concussion clinician who sees cases that don't resolve |
| **Funnel role** | Specialty follow-on from CCM Online (natural upsell) |
| **Waitlist URL** | `/ppcs-waitlist` |
| **Decision gate** | If ≥100 waitlist signups within 4-8 weeks → commit to build. If <50 → kill. |
| **Blog cluster live** | Yes — 3 pillar posts: PPCS clinical workup, cervicogenic drivers, vestibulo-ocular workup |
| **Retrofit internal links live** | Yes — `concussion-update-2026` + `how-to-use-scat6-clinicians-guide` both have purple-bordered CTAs to /ppcs-waitlist |
| **Content plan** | See `COURSE_SCOPING_TRILOGY.md` for the planned module structure. Treat as PLAN not COMMITMENT. |

### 3.2 Cervicogenic Dizziness + Headache
| Field | Value |
|---|---|
| **Status** | PLANNING ONLY — no waitlist, no course, no blog cluster |
| **Price** | TBD |
| **Built** | **No.** |
| **CPD hours** | TBD |
| **Persona** | Clinicians who treat cervical-driven dizziness or post-traumatic headache |
| **Decision gate** | Only spin up waitlist + blog cluster if PPCS validates AND ships AND there's bandwidth |
| **Content plan** | See `COURSE_SCOPING_TRILOGY.md` for the planned module structure |

### 3.3 Applied Vestibular Rehabilitation for the MSK Clinician
| Field | Value |
|---|---|
| **Status** | PLANNING ONLY — no waitlist, no course, no blog cluster |
| **Price** | TBD |
| **Built** | **No.** |
| **CPD hours** | TBD |
| **Persona** | MSK / sports / osteo clinicians who keep seeing dizzy patients (not vestibular specialists) |
| **Positioning** | Applied / screening course, NOT a competency replacement — avoids head-to-head with Vestibular Courses Australia (A$2,800 competency) |
| **Decision gate** | Only after PPCS validates AND ships, AND Cervicogenic Dizziness validates |

---

## §4 — Topics dropped from the roadmap (confirmed dead)

| Topic | Why dropped |
|---|---|
| MBS Billing for Allied Health under GPCCMP | Mandate-driven (have-to not want), AU-only, low willingness-to-pay |
| Cultural Safety ACPD | Mandate-driven, AHPRA standard still in draft, race-to-bottom pricing |
| AHPRA Advertising Compliance | Niche, mandate-driven, low ARPU |
| NDIS Report Writing standalone | Already covered by AI course's Module 3 — would cannibalise |
| Tendinopathy / Running injury | Jill Cook + Tom Goom own these globally; CEA no authority |
| Pelvic health, REDs, pain neuroscience | Out of Zac's scope or saturated by stronger incumbents |
| Long COVID standalone | Drifts into respiratory + dysautonomia; thin osteo overlap |
| Dedicated UK / US / Canada CPD streams | UK dominated by free incumbents (BMJ, e-LfH); US compliance overhead destroys margin; cross-jurisdiction topic content via /pricing-international is the winning play instead |
| Reference Manual + Toolkit standalone (A$97) | Never sold a single copy in production; retired |

---

## §5 — Free entry points (capped at 2 max)

Per the anti-bloat rule (`ROADMAP_AND_SYSTEM.md` §3 hard caps):

1. **SCAT6 Mastery (free course)** — proven (4 of 18 hot clickers came from this path)
2. **AI Safety Checklist (free PDF)** — testing, validate before extending pattern

**No third free entry point until data confirms #2 is pulling weight.** Future free PDFs are blocked by this cap.

---

## §6 — Funnel structure (two distinct funnels, intentionally separate)

```
CONCUSSION FUNNEL (proven)
   Free SCAT6 Mastery
        ↓
   CCM Online (A$497)
        ↓
   CCM Complete (A$1,190) ←— OR optional specialty branch:
        ↓                       ↓
                          PPCS (TBD price, after build) — when ready
                          Cervicogenic Dizziness (TBD)
                          Applied Vestibular MSK (TBD)


AI COMPLIANCE FUNNEL (new, validating)
   Free AI Safety Checklist
        ↓
   AI in Clinical Practice (A$197 / A$99 launch wk)
        ↓
   [end of funnel — no upsell into concussion stream by default]


CROSS-JURISDICTION TOPIC FUNNEL (for international traffic)
   AI Scribe Comparison blog post (global organic)
        ↓
   /pricing-international
        ↓
   CCM International (USD$197)
```

**The AI buyer is not the concussion buyer.** Don't force cross-sells between funnels.

---

## §7 — Pricing rules (locked)

1. **Whole-number CPD hours only** — no fractions in customer-facing claims
2. **Price reflects hours + content built** — not positioning, not aspiration
3. **No two products within A$50 of each other** — clear differentiation
4. **Max 4 products per price tier** — prevents catalogue choice paralysis
5. **No price or launch date on a course that isn't built** — waitlists validate demand only; pricing follows build completion
6. **Free entry points capped at 2** — currently SCAT6 Mastery + AI Safety Checklist

---

## §8 — What's actually committed for the next 90 days

| Date | Event | Pre-conditions |
|---|---|---|
| **2026-06-17** | AI in Clinical Practice launch | Course built ✓ · `launchAt` set ✓ · Engaged-user blast cron wired ✓ |
| **2026-06-24** | A$99 launch-week price ends, reverts to A$197 | Date-driven ✓ |
| 2026-06-12 onwards | Weekly Friday blog drops (calendar in `lib/blog-schedule.ts`) | Cron sends Zac a reminder Thursday 09:00 AEST |
| ongoing | PPCS waitlist accepts signups | Live |
| At ≥100 signups | DECISION POINT: commit to PPCS build? | Manual decision |
| After commit | PPCS build phase begins | Content production |
| After build complete | PPCS price set + launch date announced + waitlist gets 50% off launch email | Dependent on actual content delivered |

**Nothing else is committed.** Cervicogenic Dizziness and Vestibular MSK are PLANNING ONLY — they don't enter the validation phase until PPCS has shipped AND there's bandwidth.

---

## §9 — Cross-doc reference

| Question | Where to look |
|---|---|
| What's the current state of each course? | This doc (`COURSE_MAP.md`) — single source of truth |
| What's the publishing cadence? | `ROADMAP_AND_SYSTEM.md` §7 |
| Strategic audit of the whole business? | `STRATEGY_AUDIT_2026-05-27.md` |
| Forthcoming course content PLAN (not commitment)? | `COURSE_SCOPING_TRILOGY.md` |
| LLM citation pipeline + GEO strategy? | `GEO_LLM_PIPELINE.md` |
| Blog drop calendar (next 12 weeks)? | `lib/blog-schedule.ts` |
| Course catalogue source-of-truth (code)? | `lib/ai-course/provider-catalogue.ts` (for AI + Vagus + CCM Complete) + `lib/config.ts` (for CCM Online + CCM International — tech debt, eventual migration) |

If any other doc contradicts this one, **this one wins**. Pull request other docs into alignment with this map.
