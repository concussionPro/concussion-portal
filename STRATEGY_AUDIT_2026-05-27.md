# Strategy + Rollout + Pricing Audit
**Date:** 2026-05-27
**Purpose:** Single source-of-truth audit of every CEA strategic surface. Identifies gaps between docs and live state. Surfaces pricing clashes. Names the decisions you need to make before 1 June launch.

---

## 1. State-of-play — what's actually live vs what the docs claim

### Live in production (verified in code)

| Product | Price | Status (catalogue) | Reality |
|---|---|---|---|
| SCAT6 Mastery (free course) | A$0 | n/a — direct route `/scat-mastery` | LIVE, accepting signups |
| AI Safety Checklist (free PDF) | A$0 | n/a — `/ai-safety-checklist` | LIVE, accepting signups |
| Vagus Nerve | A$97 / A$82 early | **coming-soon** | NOT purchasable despite roadmap implying live |
| AI in Clinical Practice | A$197 / A$99 launch wk | **coming-soon** | Correctly gated; flips to `live` on 1 June |
| Concussion Clinical Mastery (CCM) Online | A$497 | **not in `provider-catalogue.ts`** — driven by `lib/config.ts:PRICE_ONLINE` | LIVE via the original `/pricing` flow |
| Concussion Clinical Mastery (CCM) Complete | A$1,190 early / A$1,400 reg | `live` in catalogue **but uses different data system** | LIVE |
| International CCM | USD $197 | n/a — separate page | LIVE |
| PPCS waitlist | n/a | n/a | LIVE, signups accepted |

### Documents that exist

- `SCOPE_2026-05-27.md` — **OUT OF DATE.** Still names MBS Billing as Course #2. Superseded by `ROADMAP_AND_SYSTEM.md`.
- `ROADMAP_AND_SYSTEM.md` — **current source of truth.** Latest version (this morning) includes cadence rules + research-validated trilogy.
- `GEO_LLM_PIPELINE.md` — current. The LLM citation pipeline.
- `STRATEGY_AUDIT_2026-05-27.md` (this file) — current.

### Blog cluster live

- 6 AI cluster posts (heidi-vs-lyrebird, ahpra-ai-guidelines, chatgpt-ndis-reports, ai-scribe-privacy-act, when-not-to-use-ai, ai-medical-scribe-comparison-2026)
- 3 PPCS cluster posts (ppcs-clinician-workup, cervicogenic-drivers-chronic-concussion, vestibulo-ocular-workup-ppcs)
- 14 pre-existing concussion blog posts
- 2 retrofit internal-link callouts on existing concussion posts → PPCS

### GEO infrastructure

- `public/llms.txt` (updated with all new content + 7 AI-cluster Q&As + 3 PPCS-cluster references)
- `public/llms-full.txt` (rewritten — both training streams)
- `lib/schema-markup.ts` (organizationSchema, MedicalWebPage, FAQPage, Course schemas; `knowsAbout` expanded to 17 entities including AI topics)
- `robots.txt` allows GPTBot, ChatGPT-User, ClaudeBot, anthropic-ai, PerplexityBot, Applebot-Extended, cohere-ai, Google-Extended

---

## 2. Pricing ladder audit — there ARE clashes

### Current ladder

| Tier | Product(s) | Persona |
|---|---|---|
| A$0 free | SCAT6 Mastery + AI Safety Checklist | Lead-gen across 2 personas |
| A$97 | Vagus Nerve (currently coming-soon, listed in catalogue) | Clinical-curious |
| A$197 | AI in Clinical Practice (launching 1 June) | Compliance-anxious clinician |
| A$497 | CCM Online | Concussion-focused |
| A$1,190–1,400 | CCM Complete (online + workshop) | Concussion-focused workshop attendee |

### Proposed trilogy from roadmap + the clashes

Roadmap proposes (without checking the live ladder):
- PPCS at A$497-697 → **clashes directly with CCM Online (A$497)**
- Cervicogenic Dizziness at A$297-397 → fits the A$197-A$497 gap cleanly
- Vestibular MSK at A$397-597 → **partially clashes with Cervicogenic + CCM Online**

### Recommended fix — re-tier the trilogy

```
A$0      Free          SCAT6 Mastery + AI Safety Checklist
A$97     Short          Vagus Nerve (+ future single-topics)
A$197    Compliance     AI in Clinical Practice
A$297    Specialty mid  Cervicogenic Dizziness + Headache
A$397    Specialty mid+ Applied Vestibular for MSK Clinicians
A$497    Flagship       CCM Online
A$697    Deep specialty PPCS (premium positioning above CCM Online — chronic-case mastery)
A$1,190  Flagship+      CCM Complete (online + workshop)
```

**Why this works:**
- Every rung is ≥A$100 from the next — clear differentiation
- PPCS at A$697 is the "you've finished CCM, here's the chronic-case mastery" upsell — natural premium tier
- Vestibular MSK at A$397 stays distinct from Cervicogenic at A$297 and CCM Online at A$497
- No "stuck" products with no upgrade path

### Pricing-system tech debt

Right now there are **two pricing data systems**:
- `lib/config.ts` (`PRICE_ONLINE`, `PRICE_EARLY_BIRD`, `PRICE_REGULAR`, `PRICE_INTERNATIONAL`) — for the original concussion product
- `lib/ai-course/provider-catalogue.ts` — for new courses (AI, Vagus, and the catalogue entry for CCM Complete)

This is fine for now but PPCS, Cervicogenic, Vestibular MSK should all live in `provider-catalogue.ts` (the unified system). Eventually CCM Online should migrate into the catalogue too. Defer migration — not blocking, but flag for Q3 2026.

---

## 3. Funnel coherence — two distinct funnels, don't try to merge

### Concussion funnel (proven)

```
Free SCAT6 Mastery → CCM Online A$497 → CCM Complete A$1,190
                ↓
            PPCS A$697 (forthcoming — natural upsell from CCM Online buyers)
                ↑
            Cervicogenic / Vestibular MSK (alternate specialty paths)
```

Evidence: 4 of 18 hot clickers in last 30 days are `signupSource=free-course` (SCAT6). The free→paid path works for this persona.

### AI compliance funnel (new, untested)

```
AI Safety Checklist (free PDF) → AI in Clinical Practice A$197
```

Evidence: too early to measure. Launch is 1 June. Validation window: 60 days post-launch (June 1 → August 1).

### Cross-funnel: DON'T

The AI buyer is rarely the same persona as the concussion buyer. AI buyer = compliance-anxious clinic owner / allied health pro who's mostly concerned about regulatory exposure. Concussion buyer = sports / generalist clinician who manages head injuries.

**Don't try to cross-sell aggressively between these.** AI buyer doesn't need CCM. CCM buyer may not care about AI. Let them coexist as two independent funnels.

### Orphaned funnels

- **Vagus Nerve** is in the catalogue at A$97 / `coming-soon` but has no associated lead magnet, no blog cluster, no waitlist. Either ship it properly or remove from the catalogue. Currently it just sits there confusing the pricing display.
- **International CCM** at USD$197 exists as a separate `/pricing-international` page but has no dedicated content cluster pulling international traffic. The cross-jurisdiction AI scribe comparison post is the only one — needs more.

---

## 4. Rollout timeline — what happens when

### Locked in (from roadmap §7 + course pipeline)

| Date | Event | Action required |
|---|---|---|
| 2026-05-29 (today/this week) | 8-post blog dump shipped + retrofit callouts | DONE |
| 2026-06-01 (Sun) | **AI in Clinical Practice launch day** | Flip `status: 'coming-soon'` → `'live'` in `provider-catalogue.ts:101`. Fire engaged-user blast endpoint with `?confirm=ai-course-launch-2026-06-01` |
| 2026-06-08 (Sun) | AI launch-week price ends | Manually remove `earlyBirdDiscountPct` + `earlyBirdPriceAUD` from AI course entry. Price reverts to A$197 |
| 2026-06-12 (Fri) | First scheduled post: "AHPRA AI Code Section-by-Section" | Draft this week |
| 2026-06-25 (~4 weeks post-launch) | AI course performance gate check | If <20 sales / <40% nurture open rate / >15% refunds → re-position. PPCS waitlist count check — kill if <50 signups |
| 2026-07-31 | PPCS validation-gate decision | Build full course only if ≥100 waitlist signups |
| 2026-08-21 (Fri) | **PPCS course launch** (if validated) | A$697 price point. Engaged-user blast cloned from AI launch endpoint |
| 2026-09-15 → 10-15 | Cervicogenic Dizziness waitlist validation | New waitlist page (clone of `/ppcs-waitlist`) |
| 2026-11-01 | **Cervicogenic Dizziness launch** (if validated) | A$297 price point |
| 2027-Q1 | Applied Vestibular for MSK Clinicians | A$397 price point |

### Gaps in the rollout mechanism

| Issue | Impact | Fix |
|---|---|---|
| AI course `status` flip is manual on June 1 | If you forget, course doesn't go live | Vercel cron to flip status at 2026-06-01T00:01 AEST OR calendar reminder |
| A$99 → A$197 reversion is manual on June 8 | If you forget, you keep selling at 50% off indefinitely | Same — cron or calendar reminder |
| Engaged-user blast fires manually with confirm flag | If you forget, your most-engaged users don't hear about launch | Cron job that POSTs with the confirm flag at launch time |
| No email newsletter infrastructure exists | Cadence calls for Tuesday digest but it's not built | Either build it (~4 hours) or remove from cadence rules |

---

## 5. GEO/LLM strategy — what's working, what's not yet measurable

### What's in place

- `llms.txt` (concise) + `llms-full.txt` (comprehensive) both reflect current content
- All blog posts have FAQPage schema with exact-match Q&As for the queries LLMs receive
- Organization schema `knowsAbout` expanded to 17 entities — LLMs will see CEA as topical authority across concussion + AI compliance + PPCS
- robots.txt allows all major AI crawlers + Google-Extended

### What's NOT in place

- **No `/about/zac-lewis` page** — LLMs cite Person schema with `hasCredential` heavily. AHPRA-registered clinician is the #1 trust signal for healthcare YMYL. Missing this is a real gap.
- **No automated LLM-citation-rate measurement** — the GEO_LLM_PIPELINE.md proposes a monthly query-testing process but it's manual today. Building automated testing (~4 hours) gives you "is GEO actually working?" answer monthly without thinking about it.
- **Squarespace cross-domain integration** — the marketing brand site `concussion-education-australia.com` doesn't currently link to `/ai-safety-checklist` or `/ppcs-waitlist`. Cross-domain authority is being left on the table. Should add at least 2 links from Squarespace.

---

## 6. Critical decisions you need to make before 1 June

| # | Decision | Default if no input |
|---|---|---|
| 1 | Confirm new pricing ladder (PPCS A$697, Cervicogenic A$297, Vestibular MSK A$397) | Apply these defaults |
| 2 | Automate the June 1 status flip + June 8 price reversion, or rely on calendar? | Build cron job (safer) |
| 3 | Automate the engaged-user blast firing on June 1, or fire manually? | Automate (eliminates "I forgot" risk) |
| 4 | Ship `/about/zac-lewis` author page now (E-E-A-T lift for LLM citation) | Yes — ~1 hour, high leverage |
| 5 | Build email newsletter infrastructure or drop from cadence? | Build — Tuesday digest is the highest-ROI channel CEA has |
| 6 | Vagus Nerve status: flip to live, ship lead-magnet funnel for it, or remove? | Remove from public pricing display until you have time to do it right |
| 7 | Delete or annotate `SCOPE_2026-05-27.md` (out of date)? | Annotate as superseded; don't delete (audit trail) |

---

## 7. Recommended priority order — what to ship next

If you authorise, in this order:

**P0 — Must ship before 1 June launch (this week)**
1. `/about/zac-lewis` author page with full Person schema + hasCredential (~1 hour) — biggest GEO lift available
2. Cron job for: AI course status flip June 1 + price reversion June 8 (~1 hour) — prevents launch-day mistakes
3. Cron job for: engaged-user blast firing on June 1 with confirm flag (~30 min) — auto-fires the launch announcement
4. Annotate `SCOPE_2026-05-27.md` as superseded (~5 min)
5. Hide Vagus Nerve from public pricing page until properly funneled (~10 min)

**P1 — Build during AI launch week (June 1-7)**
6. Email newsletter infrastructure — first Tuesday digest goes out 2026-06-09 (~4 hours)
7. Automated LLM-citation-rate testing — ChatGPT + Claude + Perplexity weekly queries (~4 hours)

**P2 — Ship after AI course validates (post-2026-06-25)**
8. Apply revised pricing ladder to PPCS course landing (when course goes into build)
9. Squarespace cross-domain links to `/ai-safety-checklist` + `/ppcs-waitlist`
10. Lead magnet + funnel for Vagus Nerve OR retire the product

---

## 8. What looks GOOD (no action needed)

- AI course content + 5 cluster blog posts + lead magnet + nurture sequence — production-ready for 1 June
- PPCS validation funnel — 3 pillar posts + waitlist + retrofit callouts on high-traffic concussion posts — wired correctly
- Cross-jurisdiction AI scribe comparison post — targets the highest-impact global query, links to /pricing-international
- Cadence discipline locked in (§7 of roadmap) — 1 post/week, Friday publish
- GEO foundation strong — robots.txt + llms.txt + llms-full.txt + schema markup
- Anti-bloat rules locked (2 free entry max, 2 courses/quarter max, 4 products/tier max)
- Two-funnel separation (concussion vs AI compliance) — clean

---

## TL;DR

Strategy is coherent. The 1 June launch is built and ready. The biggest risks are:
- **Manual steps on launch day** (status flip, price reversion, blast firing) — automate these in the next 4 days
- **Pricing ladder collision** (PPCS A$497 vs CCM Online A$497) — re-tier PPCS to A$697 in the roadmap
- **Missing author E-E-A-T page** for LLM citation — biggest single GEO improvement available

Everything else is fine and can wait until after the AI launch settles.
