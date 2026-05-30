# CEA Roadmap & Reverse-Engineering Course System
**Date:** 2026-05-27
**Purpose:** A repeatable system for turning search demand into shippable courses without bloat or hand-holding.

---

## The core problem

We need a way to:
1. Detect what AU allied-health clinicians are searching for
2. Validate the demand is real BEFORE building
3. Ship courses on a consistent template (no design drift)
4. Kill bad ideas before they reach the dashboard
5. Keep pricing logical as the catalogue grows

This document is that system.

---

## 1. The reverse-engineering pipeline (6 stages)

```
[1] Demand sensing  →  [2] Validation gate  →  [3] Lead magnet MVP
                                                       ↓
                                              (kill or build)
                                                       ↓
[6] Performance gate ←  [5] Launch  ←  [4] Full course build
```

### Stage 1 — Demand sensing (continuous, ~1h/week)

**Inputs (run weekly):**
- Google Trends AU — track 10-15 candidate queries you're already watching
- Peak-body publication scan — APA, OA, ESSA, AHPA, Physio Board, Osteo Board newsletters and recent guidance
- AHPRA + TGA + NDIS Commission press releases (mandate signals)
- Competitor course listings on Medcast, APA enrol catalogue, Physio Network, ESSA PD
- LinkedIn AU healthcare engagement (which posts get >50 comments)

**Output:** a single tracking spreadsheet (or admin DB table — see §4 Design Structure) with:
- Query string
- Estimated monthly AU volume
- Mandate / audit pressure (high/med/low)
- Competitor saturation (1-5)
- CEA authority fit (Zac's credible voice on this? yes/no)
- Updated date

### Stage 2 — Validation gate (decision in 30 min)

Green-light a course concept only if **all four** pass:

| Gate | Threshold |
|---|---|
| Demand | Real search volume OR mandate-driven (e.g. AHPRA standard finalising) |
| Saturation | ≤3 incumbent providers with strong authority |
| Authority fit | Zac can credibly speak to it (AHPRA reg + specific clinical or technical credential) |
| Funnel coherence | Course buyer overlaps with existing CEA persona OR is reachable via the same channels |

**If any one fails → kill it.** Don't build a course you can't win, don't sell into a persona you can't reach, don't dilute the brand outside Zac's authority.

### Stage 3 — Waitlist validation (1 week)

**Before** building the full course, validate paid intent via a waitlist — NOT another free PDF.

The lead-magnet-per-course pattern was an over-generalisation from N=1 (SCAT6 Mastery worked → projected onto every course). The right pattern:

1. Write 1-3 pillar blog posts targeting the search-validated keyword cluster (using existing CEA brand + organic reach)
2. Add a "Notify me when [course name] launches + get 50% off launch week" email-only signup at the end of each post (no PDF, no nurture pre-launch beyond a single confirmation email)
3. Track for 4 weeks

**Kill criteria:**
- <50 waitlist signups in 4 weeks → kill or pivot
- 50-100 → re-scope smaller (A$97 tier, narrower audience)
- 100+ → build the full course; waitlist gets a 50%-off launch email

This validates **paid intent** (someone willing to be notified about a paid product) rather than free-content intent (someone willing to give email for a PDF). The signal is stronger and the brand stays focused on "CEA = clinical mastery courses" not "CEA = free content provider."

**Why this is better than free-lead-magnet-per-course:**
- Free signups are cheap intent — many are content-hunters who never convert
- Waitlist signups are warm intent — they've already committed to "yes I'd buy if it existed"
- No nurture-sequence proliferation (one new sequence per course = email fatigue + maintenance burden)
- Brand stays premium

**Free lead magnets remain appropriate ONLY when all 3 are true:**
- The persona is genuinely new (not an existing CEA buyer)
- The free artefact has independent clinical utility (e.g. fillable SCAT6 form, AI Safety Checklist)
- The persona needs to test a concrete skill before trusting CEA as educator

The current 2 lead magnets (SCAT6 Mastery free course + AI Safety Checklist) satisfy all three. **Cap free entry points at 2** until data proves the second one's pulling weight.

### Stage 4 — Full course build (only if waitlist validated, 2-3 weeks)

Follow the **build template** in §4. Every course must produce:

- Course landing page (`/courses/[slug]`)
- Module markdown content (`/content/[slug]/`)
- Stripe checkout integration (extend `provider-catalogue.ts`)
- 3-5 pillar blog posts (already partially shipped in Stage 3, expand as needed)
- 4-email post-purchase nurture sequence (Day 0/3/7/14)
- Engaged-user launch blast endpoint (templated)
- Sitemap entries + schema markup
- Dashboard card surface (when access purchased)
- Launch-week 50% discount mechanic

Note: NO new free lead magnet per course. The waitlist from Stage 3 IS the launch list.

### Stage 5 — Launch (1 day)

**Day -7:** Submit to peak-body member newsletters (APA, OA, AHPA, NDS where relevant).
**Day -3:** Indemnity insurer co-marketing pitch (Avant, Guild, MIPS) for high-compliance topics.
**Day 0:**
- Flip `status: 'coming-soon'` → `'live'` in catalogue
- Fire engaged-user blast (engaged + signupSource includes the lead magnet)
- LinkedIn organic post from Zac
- One outreach email to OA's CPD office
**Day +1 to +7:** Launch week 50% discount active (e.g. A$99 / A$197).
**Day +8:** Discount expires. Course settles at full price.

### Stage 6 — Performance gate (4 weeks post-launch)

Decide whether to:
- **Keep** — course pays for itself, slot it permanently
- **Re-position** — bad copy or wrong audience, fix and re-launch
- **Retire** — quietly, no announcement, leave it in catalogue marked `legacy`

| Metric | Keep threshold | Re-position | Retire |
|---|---|---|---|
| Sales | >20 units in launch month | 5-20 | <5 |
| Open rate on nurture | >40% | 25-40% | <25% |
| Refund rate | <5% | 5-15% | >15% |
| Cold-traffic signal | Organic from blog cluster > paid | Mixed | Zero organic |

---

## 2. Pricing ladder — rules + schedule

### Ladder rules (never break)

1. **No two products within A$50 of each other.** Buyers should feel each rung is a real step up.
2. **Max 4 products per price tier.** More than 4 dilutes value perception and crowds the catalogue.
3. **Every rung must lead to a clear upgrade path.** No dead-end products.
4. **Price = persona × depth.** Don't price by hours; price by who buys it and what they get out of it.

### Current ladder (May 2026)

| Tier | Products | Persona |
|---|---|---|
| A$0 (free) | SCAT6 Mastery | New-to-CEA clinicians, lead-gen |
| A$97 | Vagus Nerve | Clinical-content-curious, single-topic |
| A$197 | AI in Clinical Practice (A$99 launch) | Allied health, compliance-anxious |
| A$497 | CCM Online | Concussion-focused, online-only |
| A$1,190 | CCM Complete | Concussion-focused, workshop attendee |

### Forward ladder (post-MBS launch, August 2026)

| Tier | Products | Personas served |
|---|---|---|
| A$0 (free) | SCAT6 Mastery + 3 lead magnets (AI Safety Checklist, MBS Cheat Sheet, future) | Lead-gen across multiple funnels |
| A$97 | Vagus Nerve + 1 future single-topic | Clinical-curious browsers |
| A$197 | AI in Clinical Practice, MBS Billing for Allied Health | Compliance-anxious, clinic-owner persona |
| A$497 | CCM Online | Concussion-focused |
| A$1,190 | CCM Complete | Concussion-workshop attendee |

**Cap at this size for 2026.** Adding more rungs creates choice paralysis at the /pricing page.

### 12-month schedule (research-validated; supersedes the MBS Billing draft)

Two research agents (2026-05-27) validated the direction:
1. **International market agent:** Don't build UK/US/Canada-specific streams. Topic-driven content + existing `/pricing-international` funnel + GEO/LLM citation is the winning play.
2. **Clinical-want agent:** The highest-ROI courses are a **"Head, Neck & Vestibular Mastery" trilogy** above CCM. Same buyer, same authority, same funnel, cross-jurisdiction transferable. MBS Billing is dropped — boring, mandate-driven (have-to not want), AU-only, low willingness-to-pay.

| When | Event | Status |
|---|---|---|
| 2026-06-17 | **AI in Clinical Practice — LAUNCH** | BUILT (9 modules, 2,360 lines content + prompts + templates). A$197 / A$99 launch wk. Date-driven status flip via `launchAt`. (Moved from 2026-06-01 on 2026-05-30 to space from Melbourne early-bird blast.) |
| 2026-06-24 | AI launch week ends, price auto-reverts to A$197 | Date-driven via `earlyBirdEndsAt`. No manual action |
| 2026-06 → ongoing | PPCS demand validation (3 blog posts shipped + `/ppcs-waitlist` live) | Validates demand only. No course commitment. |
| If ≥100 waitlist signups | **DECISION POINT: commit to building PPCS course?** | If yes → enter build phase. CPD hours + price set once content is complete. Launch date follows build completion, not a fixed roadmap date. |
| If ≥100 PPCS signups + build completed | PPCS Clinical Mastery launch | Targeted at the end of build phase. No specific date until build is underway. |
| 2026-Q3 / Q4 | (Conditional) Cervicogenic Dizziness demand validation | Only spin up waitlist + blog cluster if PPCS validates AND ships AND there's bandwidth |
| 2027+ | (Conditional) Applied Vestibular for MSK Clinicians | Same gating |

**Hard rule (added after 2026-05-27 audit):** No course gets a price tag or launch date until the course content is *built*. Waitlists validate demand; build phase begins after the validation gate; pricing + date confirmed at end of build. Anything else is selling something that doesn't exist.

**Hard rule: max 2 paid courses launched per quarter.** Faster = nurture cannibalises, support overhead climbs.

**Hard rule: 1 blog post per week max** (Friday publish). See §7 for the cadence rules + 12-week content calendar.

**Why this trilogy works:**
- Same buyer persona as CCM (clinicians who manage head injuries) — built-in funnel
- Same Zac-authority lane (sports medicine + osteo + concussion specialty)
- Cross-jurisdiction transferable (clinical content, not regulator-locked) — sells via /pricing-international
- High-want clinical-skills topics (felt gap), not have-to mandates — higher willingness-to-pay

### Topics confirmed dropped from the roadmap

| Topic | Why dropped |
|---|---|
| MBS Billing for Allied Health | Boring, mandate-driven, AU-only, low willingness-to-pay |
| Cultural Safety ACPD | Mandate-driven (have-to), still in draft, race-to-bottom pricing |
| AHPRA Advertising Compliance | Niche, mandate-driven, low ARPU |
| NDIS Report Writing | Already covered by AI course's Module 3 — would cannibalise |
| Tendinopathy / Running injury | Jill Cook + Tom Goom own these globally; CEA has no authority |
| Pelvic health, REDs, pain neuroscience | Out of Zac's scope or saturated by stronger incumbents |
| Long COVID standalone | Drifts into respiratory + dysautonomia; thin osteo overlap |
| Dedicated UK/US/Canada CPD streams | UK dominated by free incumbents (BMJ, e-LfH); US compliance overhead destroys margin; Canada-only is too small for the lift |

---

## 3. Anti-bloat protocol

The dashboard already has 3 products visible. By end of 2026 it could have 6+. Without discipline that's a mess.

### Hard caps

| Category | Cap | Reason |
|---|---|---|
| **Free entry points** (lead magnets / free courses) | **2 max** | Each new freebie splits the nurture audience + dilutes brand premium signal. Currently: SCAT6 Mastery + AI Safety Checklist. Don't add a third unless data proves AI Safety Checklist's pulling weight. |
| **Paid courses per quarter (launches)** | **2 max** | Nurture sequences cannibalise + support overhead climbs above this rate |
| **Active courses per price tier** | **4 max** | Choice paralysis sets in past this |
| **Pillar blog posts per course** | **3-5** | Below 3 = thin topical cluster (LLMs won't see authority); above 5 = diminishing returns + content rot risk |

### Visibility tiers

| Tier | Where it shows | Criteria |
|---|---|---|
| **Hero** | Pricing page top + homepage primary CTA | Highest-margin, in-demand, current campaign |
| **Featured** | Pricing page secondary, homepage card | Active, selling, recent |
| **Catalogue** | Courses index page only | Selling but not promoting actively |
| **Legacy** | Hidden from new buyers, accessible to existing owners | Performance gate failed, but existing users still get access |

**Move courses DOWN the visibility tiers as they age, not UP.** Hero → Featured → Catalogue → Legacy. A 12-month-old course shouldn't be on the homepage unless it's an evergreen high-margin product (like CCM).

### Kill switches

A course gets retired (Legacy tier) if any of these are true:
- <5 sales in any 3-month period after launch month
- Refund rate >15% sustained over 3 months
- Open rate on linked nurture <20%
- Manual review: "is this still our authority area?" — if no, retire

The kill switch must be **automatic-ish** — a monthly admin email that says "these 2 courses are below threshold; retire?" so it doesn't need Zac thinking about it weekly.

### The "no-bloat" review

Run a 20-min review of the catalogue every 90 days:
- Is every product in the right visibility tier?
- Is anything stuck in Hero/Featured past its peak?
- Is anything in Legacy that should be retired entirely (removed from any UI surface)?
- Is the pricing ladder still ≤2 products per tier?

This review needs to be on Zac's calendar as a recurring event. Without it, drift wins.

---

## 4. Design structure — quality without hand-holding

The current approach is bespoke per course (AI course landing page is custom-coded, MBS course will be custom-coded). For 6-8 courses this works. Past that, drift happens.

### What to keep bespoke (DON'T abstract yet)

- The hero/landing copy — different keywords per course, different personas, different angles
- Module-level content — clinical/regulatory specifics
- The Stripe checkout (already abstracted, just config per course)

### What to template now (LIGHT structure)

**A. Course-build checklist as a markdown file** — every new course copies this, checks each box. Lives in `/CHECKLIST_COURSE_BUILD.md` (would create on first MBS scoping):
- [ ] Catalogue entry (`provider-catalogue.ts`) with status='coming-soon'
- [ ] Module markdown files (`/content/[slug]/`)
- [ ] Course landing page (`/app/courses/[slug]/page.tsx`)
- [ ] Stripe price ID in env
- [ ] 4-email nurture sequence in `email-sequences.ts`
- [ ] Lead magnet PDF/page + signup endpoint
- [ ] 5 pillar blog posts (`/app/blog/[slug]-*`)
- [ ] Sitemap entries (`app/sitemap.ts`)
- [ ] Blog index entry (`app/blog/page.tsx`)
- [ ] Launch blast template in `email-sequences.ts`
- [ ] Launch blast endpoint (clone of `ai-course-launch-blast`)
- [ ] Search keywords baked into BOTH course AND blog posts verbatim (the rule)

**B. Component patterns to clone (not abstract)**:
- `HomepageAiCourseCard.tsx` → clone to `HomepageMbsCourseCard.tsx` per course (each looks similar but copy is unique)
- `AiSafetyChecklistSignupForm.tsx` → clone per lead magnet
- Blog post template — copy the `heidi-vs-lyrebird` post structure; each post is ~250 lines of bespoke content following the same outline

**C. Schema discipline (mandatory for every post)**:
- BlogPostSchema (Article + Author with hasCredential + Reviewed-date)
- FAQPage schema (3 high-intent Q&As minimum)
- Year-stamped title + first 100 words = direct answer (AI Overview optimisation)
- Internal links: post → lead magnet → course
- Keyword verbatim in: title (first 60 chars), H1, first 100 words, body, slug, OG description, keywords meta tag

### What to build LATER (Q4 2026, only if needed)

- An **admin /course-pipeline page** that shows: candidate queries (Stage 1), MVPs in flight (Stage 3), live courses with performance metrics (Stage 6). Single dashboard surface. Saves the spreadsheet sprawl.
- A **GenericCourseLanding component** that takes a catalogue entry and renders the standard landing layout. Only build this when we have ≥4 active courses and the duplication cost actually bites.

### Design quality rules (non-negotiable)

1. Every course landing page has the same 5 sections in order: hero → module list → tier framework (or equivalent) → testimonials (when available) → CTA + price
2. Every blog post has the same 4 sections: quick-answer block → main content with H2 sub-sections → CTA to lead magnet/course → related posts
3. Every lead magnet has the same structure: PDF/page → email gate → Day 0 delivery → 3-email nurture
4. Every launch blast follows the `melbourne-warming-push` pattern (idempotent, dry-run default, confirm flag)

If a new course breaks any of these patterns, it's a sign the course is wrong for our brand — not a sign the patterns need to flex.

---

## 5. The "what to decide now" checklist

Things you'd benefit from deciding before MBS scoping starts (June 15):

| Decision | Default if no input | When you need to answer |
|---|---|---|
| Course #2: confirm MBS Billing for Allied Health? | Yes (research validated) | Before 2026-06-15 |
| MBS lead magnet format: PDF vs interactive web tool? | Static PDF + landing page (cheaper to build, A/B easy) | 2026-06-15 |
| Course #3 candidate: keep Cultural Safety or swap to NDIS Report Writing? | Cultural Safety (mandate-driven), with NDIS Report Writing as backup | Before 2026-09-01 |
| Do you want an admin /course-pipeline dashboard built? | No (skip until ≥4 courses) | Whenever 4th course in pipeline |
| Annual subscription / clinic-license tier — yes/no for 2027? | No commit yet; revisit Q1 2027 | Before 2027-01-01 |
| Refresh interval on demand-sensing (weekly vs monthly)? | Monthly cadence, with weekly during launch windows | Set as recurring calendar event |

---

## 6. The honest revenue thesis

This is a profit-generating business, not an education project. Revenue comes from converting the existing list and shipping the next paid course — NOT from adding more free signups.

### CEA's actual conversion data (30-day window, 2026-05)

| Metric | Value |
|---|---|
| Total recipients on email list | 237 |
| Engaged (hot clickers + warm openers) | 93 |
| Paying conversions in window | 5 |
| Conversion rate | 2.1% |
| Top conversion driver | SCAT6 Mastery free course nurture (4 of 18 hot clickers had `signupSource = free-course`) |

### Where the leverage actually is

| Lever | Math | Effort per A$1k revenue |
|---|---|---|
| Add 200 free signups (new lead magnet) | 200 × 2.1% × A$497 = +A$2k/month | 8-15 hours per build |
| Improve conversion of existing list by 1pp | 237 × 1% × A$497 + compounds on next month's intake | 4-8 hours per experiment |
| **Ship 1 new paid course to existing list** | 237 × 5% (warm-list conversion benchmark) × new course ARPU = **biggest lever** | 2-3 weeks per course |

**Shipping the next paid course is 3-5x more revenue per build-hour than another free lead magnet.** This is the empirical answer to "should we add another freebie."

### What this means for the system

1. Free entry points are a one-time investment per persona, not a recurring per-course pattern
2. New paid courses validate via waitlist (paid intent), not free PDF gates (content intent)
3. Improving conversion of the existing list (better nurture, better launch blasts, better landing copy) compounds — it works on every future signup too
4. Authority concentration > content sprawl. CEA = clinical mastery training authority. Every additional free PDF dilutes that signal in LLM training data.

## 7. Content publishing cadence (the discipline that's been missing)

Past mistake (2026-05-27): I pushed 5 AI blog posts + 3 PPCS blog posts + the AI Safety Checklist + the cross-jurisdiction post + the llms-full.txt rewrite — all in one day. Symptoms of doing this:
- Google sees 8 same-day posts = batch-indexing rate-limit + "content dump" signal
- LLMs may downweight as automated content
- No bandwidth left to promote any individual post on social / email
- Sitemap floods all at once
- Nurture sequences can't reference "this week's new article" because they're all simultaneous
- No reaction-time to see which posts are working before publishing the next

### Cadence rules going forward

| What | How often | Why |
|---|---|---|
| New blog posts | **1 per week max** | Healthcare YMYL content rewards depth + consistent freshness signal; 1/week = 52/year is plenty |
| Publishing day | **Friday morning AEST** | Highest AU healthcare-professional engagement day; gives 72h pre-weekend social distribution |
| Course launches | **1 per quarter max** | Existing rule; protects nurture sequences from cannibalising |
| Lead magnet updates | **When there's a real reason** | Don't update for cadence's sake |
| Email newsletter (founder digest) | **Weekly, Tuesday morning** | Stays separated from new-post Friday so each gets its own engagement window |

### Mechanism — how posts get scheduled without a code change

For the next 6 months, content lives in this repo in two states:
- **Live**: in `/app/blog/[slug]/page.tsx` and indexed in sitemap + blog index — visible to Google + LLMs
- **Drafted**: written and committed, but NOT yet in sitemap or blog index. Branch: `content-drafts` or kept as files prefixed `_draft_` until publish day.

Friday morning ritual (15 min):
1. Pick the post for this week from the drafts queue
2. Update `datePublished` + `dateModified` to today
3. Add to `app/blog/page.tsx` index + `app/sitemap.ts` + `public/llms.txt`
4. Commit + push
5. Send email newsletter referencing the post
6. LinkedIn organic post from Zac's profile (native, link in first comment)

If this gets enough use to justify it, automate step 1-4 with a Vercel cron + a `publishAt` field in post metadata. Skip until then — premature.

### Scheduled content calendar — next 12 weeks (2026-05-30 → 2026-08-22)

Posts dated by Friday publish day. Posts already shipped (this week's dump) get re-dated via `dateModified` to spread the freshness signal — adding `dateModified` of e.g. 2026-06-05 to one and 2026-06-12 to another doesn't change indexing but tells Google these aren't all simultaneous.

| Friday | Post / event | Why |
|---|---|---|
| 2026-05-29 | (already shipped: AI cluster + PPCS cluster — 8 posts, freeze) | Past |
| 2026-06-05 | **AI Course Launch Day (1 June)** + Engaged-user blast + LinkedIn launch post | Highest-impact week of the year; don't compete with new content |
| 2026-06-12 | "AHPRA AI Code Section-by-Section — Plain English for Australian Clinicians" | Deep-dive that LLMs cite; expands AHPRA AI cluster |
| 2026-06-19 | "How to Get Patient Consent for AI Scribe Use — Word-for-Word Scripts" | Practical / high-search-intent; complements course |
| 2026-06-26 | "Heidi Health Review 2026 — An Australian Clinician's Honest Take" | Targets "Heidi review" branded query; partnership pitch context |
| 2026-07-03 | "PPCS in Children + Adolescents — Different Timeline, Different Workup" | Expands PPCS cluster; paediatric angle (consult with credentialed reviewer first) |
| 2026-07-10 | "Cervicogenic Headache vs Migraine vs Tension — Differential for Clinicians" | Cervicogenic Dizziness validation begins — next course |
| 2026-07-17 | "Lyrebird vs Heidi — When Each Wins for Solo Practitioners" | Branded query targeting; complements June 26 Heidi post |
| 2026-07-24 | "Active Concussion Recovery — Sub-Threshold Exercise Prescription Guide" | High-intent practical post; complements CCM |
| 2026-07-31 | "PPCS waitlist status update + course preview" (assumes ≥100 signups) | PPCS validation gate decision week |
| 2026-08-07 | "Cervicogenic Dizziness — The Test That Differentiates It From BPPV" | Cervicogenic Dizziness validation post #2 |
| 2026-08-14 | "Vestibular Rehabilitation for the MSK Clinician — When to Refer vs Manage" | Vestibular MSK validation begins |
| 2026-08-21 | **PPCS Course Launch** (if validated) + launch blast | Targets August 2026 from roadmap |

Each post needs to be drafted ahead of time — minimum 2 weeks of buffer in the drafts queue so Friday never gets missed.

### Email newsletter cadence (Tuesday)

Separate from blog publishing. Weekly founder digest from Zac. Format:
- **One** clinical insight (≤300 words)
- **One** course / waitlist callout (the active one this week)
- **One** link to most recent blog post
- Sign-off

Sent to all opted-in CEA users (free + paid). Held to one per week max — emails are the highest-engagement channel CEA owns; over-mailing burns it.

### What to track for cadence health

- Days-between-posts (target: 7, accept: 5-9, alert: <4 or >14)
- Per-post organic traffic in first 7 days (rolling average)
- Per-post LLM citation rate at 30 days (from the GEO pipeline measurement)
- Email newsletter open rate (target: maintain >40%)

Drift signals: posts batched <4 days apart (content dump), no posts in 14+ days (stalled pipeline), open rate trending down (sending too often or content losing relevance).

## 8. The system in one sentence

**Every new course follows: validated query → 3 pillar blog posts + waitlist → only-if-validated full build → templated launch → performance-gated keep/retire.**

The waitlist (paid intent, not free intent) is the kill switch. The build template is the consistency mechanism. The performance gate is the bloat prevention. The pricing ladder rules are the catalogue discipline. The free-entry cap (2 max) protects the brand premium signal.

The thesis: **conversion of existing engaged users + premium paid course launches** is the profit lever. Free signups are not.

Once these gates are in place, the system runs without you having to think about quality on each individual course — quality is enforced by the pattern.
