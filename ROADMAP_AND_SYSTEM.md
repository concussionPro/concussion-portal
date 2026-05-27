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

### Stage 3 — Lead magnet MVP (1 week)

**Before** building the full course, ship the lead magnet:
- 1-page free PDF/checklist (using the search-validated exact keywords)
- Landing page (`/[course-slug]-checklist` or similar)
- POST email-gate signup → preview user creation
- 3-email nurture sequence (Day 0 delivery, Day 3 value-add, Day 7 social proof / comparison)
- Single pillar blog post on the highest-volume query, linking to the lead magnet

**Track for 4 weeks.** Kill criteria:
- <50 signups in 4 weeks → kill the course concept
- 50-150 signups → re-scope (smaller course, A$97 tier, narrower audience)
- 150+ signups → build the full course

This is the **anti-bloat gate**. Most ideas die here cheaply (~10 hours of work each) instead of dying expensively after a full course build.

### Stage 4 — Full course build (only if MVP validated, 2-3 weeks)

Follow the **build template** in §4. Every course must produce:

- Course landing page (`/courses/[slug]`)
- Module markdown content (`/content/[slug]/`)
- Stripe checkout integration (extend `provider-catalogue.ts`)
- 5 pillar blog posts (the same 5 keyword clusters: comparison, regulatory, how-to, risk/red-flag, decision-framework)
- 4-email nurture sequence (Day 0/3/7/14)
- Free lead magnet (already shipped in Stage 3)
- Engaged-user launch blast endpoint (templated)
- Sitemap entries + schema markup
- Dashboard card surface (when access purchased)

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

### 12-month schedule (only commits past Course #2)

| When | Course / lead magnet | Tier | Status |
|---|---|---|---|
| 2026-06-01 | **AI in Clinical Practice** — LAUNCH | A$197 (A$99 launch wk) | Building, code shipped, content live |
| 2026-06-08 | AI launch week ends | — | Auto |
| 2026-06-15 → 07-15 | **MBS Billing for Allied Health** — lead magnet MVP | Free | Validation gate first |
| 2026-08-01 | **MBS Billing for Allied Health** — full course (IF validated) | A$197 | Build only if >150 signups on lead magnet |
| 2026-09-01 → 09-30 | Demand sensing window for Course #3 | — | Spreadsheet review + Stage 2 gate |
| 2026-10-01 → 10-31 | Course #3 lead magnet MVP — candidates: Cultural Safety, NDIS Report Writing, AHPRA Advertising Compliance, Telehealth/MyMedicare | TBD | Pick ONE based on demand-sensing data |
| 2026-12-01 | Course #3 full course (IF validated) | A$127 or A$197 | TBD |
| 2027-Q1 | Course #4 OR Cultural Safety (if AHPRA standard finalises) | TBD | Re-evaluate Q4 2026 |

**Hard rule: max 2 paid courses launched per quarter.** Anything faster and the nurture sequences cannibalise each other.

---

## 3. Anti-bloat protocol

The dashboard already has 3 products visible. By end of 2026 it could have 6+. Without discipline that's a mess.

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

## 6. The system in one sentence

**Every new course follows: validated query → lead-magnet MVP → only-if-validated full build → templated launch → performance-gated keep/retire.**

The lead-magnet MVP is the kill switch. The build template is the consistency mechanism. The performance gate is the bloat prevention. The pricing ladder rules are the catalogue discipline.

Once all four are in place, the system runs without you having to think about quality on each individual course — quality is enforced by the pattern.
