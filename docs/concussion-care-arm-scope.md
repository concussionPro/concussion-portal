# Concussion Care Arm — Scope (DRAFT, nothing live)

Status: **SCOPING ONLY.** No Stripe live, no public telehealth booking, no athlete data collected yet. This documents the model, the regulatory reality, the data/system architecture, and a phased build. Owner (Zac) decisions flagged throughout. **NeuroVision is explicitly OUT of this arm** (separate patent-pending project) — the cognitive tool here is CEA's own (SCAT6 baseline / a dedicated repeatable test).

---

## 0. Market sizing — Australia (researched 2026-06, real figures)

Target = institutions with athlete cohorts at concussion risk (collision/contact sport). Three segments:

### A. Elite / sports-focused SCHOOLS — the core SOM
- **9,653 schools total** in AU (2024 ACARA): ~6,728 government, ~1,757 Catholic, ~1,168 independent.
- The high-fit subset = SECONDARY independent/Catholic schools with serious sport programs + government selective/sports high schools. Of the elite end, the formal inter-school sport associations are publicly named and enumerable:
  - **AAGPS NSW: 9** · **CAS NSW: 6** · **GPS QLD: 9** · **APS VIC: 11** — plus ISA, AGSV, ACS and state equivalents.
  - → **~50–80 "flagship" elite-sport private schools** nationally in the named associations (the obvious first-wave list).
  - Broader independent + Catholic SECONDARY schools with sport/high-performance programs: **~600–1,000**.

### B. SPORTS ACADEMIES — small, highest-fit
- **AIS + 8 state/territory institutes** (NSWIS, VIS, QAS, SASI, WAIS, TIS, NTSA, ACTAS) = 9.
- **Regional Academies of Sport**: NSW 9, VIC 6, + QLD/SA/WA regional academies → **~30–40 regional academies** nationally.
- → **~40–50 institutes + academies.** Tiny number, perfect ICP (athlete pathways, concussion-aware, duty of care). Hunter Academy of Sport sits here.

### C. Collision-sport CLUBS / associations — the long tail
- ~**70,000** community sporting clubs cited nationally (commonly quoted, not cleanly verified in ASC/AusPlay — treat as order-of-magnitude); **800+ state sporting organisations**.
- Realistic targets = larger **representative/junior clubs + regional associations** in rugby union, rugby league, AFL, football (the collision codes where concussion governance matters): order **~500–2,000** addressable bodies.

### TAM / SAM / SOM
- **TAM** (any institution with at-risk athletes): tens of thousands (incl. the club long tail).
- **SAM** (best-fit for a free-tool partnership): **~2,000–2,500** — independent/Catholic secondary + sports-focused gov schools (~1,500) + academies (~45) + larger collision-sport clubs/assocs (~500–1,000).
- **SOM** (first wave to prospect NOW): **~150–250** — the named elite-sport school associations (~50–80), all institutes + regional academies (~45), and a curated ~50–100 elite/representative clubs. **This is the list to build first.**

**Sourcing the list:** the named school associations (AAGPS/CAS/GPS/APS/ISA/AGSV) publish member rosters → directly enumerable. Academies are a fixed public list (~45). Clubs via state sporting bodies. No Apollo guesswork needed for the SOM — it's largely hand-enumerable and high-quality.

**Sources:** ACARA National Report on Schooling 2024 (school counts); ASC Clearinghouse — Regional Academies & National Institute Network; AAGPS/CAS/GPS-QLD/APS-VIC association rosters; ASC AusPlay (participation).

### Outreach track (separate from the clinic cold engine)
These institutions go in a **partner lane** with **partnership copy** (free athlete cognitive tool + duty-of-care + concussion-governance angle) — NOT the clinic Hub-Pack pitch, and NOT auto-fired through the clinic send cron. Needs its own template + a careful, deliberately-paced rollout (founder-led at the elite-school/academy end; the engine assists with sourcing + sequencing, not blasting). Build this as a distinct track so it can't destabilise the clinic engine.

---

## 1. One-liner

A B2B2C concussion-care arm: give sports **institutions** (academies, elite schools, clubs) the **free SCAT6/SCOAT6 docs + baseline cognitive testing + ongoing tool** for their athletes (pure give, zero cost to them). When a post-incident test drops below baseline it **triggers a private telehealth assessment with Zac** — who runs a **structured concussion care pathway** (initial assessment + written report + referral → mid-recovery check-in → final readiness assessment), booked via Cal.com, paid via Stripe. The free tool is the top of funnel; the **care pathway is a steady, recurring patient stream for Zac.**

Distinct from the cold-clinic outreach engine. **Founder-led partnership prospecting** to institutions, NOT cold email to clinics. (Hunter Academy of Sport is lead #1.)

---

## 1a. Service model — the concussion care pathway (Zac's vision, 2026-06-11)

The value isn't a one-off triage — it's an **episode-of-care pathway** per concussion, each touch a paid telehealth consult with a documented deliverable:

| Touch | What Zac does | Deliverable | When |
|---|---|---|---|
| **1. Initial assessment** | Telehealth concussion assessment (history, symptom load, the flagged cognitive scores, red-flag screen) | **Written concussion report + management plan + referral** to a curated local clinician | Within 24–72h of the flag |
| **2. Mid-recovery check-in** | Progress review against the plan, symptom/return-to-learn-and-train trajectory | Updated progress note to athlete/parent/institution | ~1–2 weeks in (as needed) |
| **3. Final readiness assessment** | Return-to-activity **readiness review** + repeat cognitive test vs baseline | **RTP-readiness report** supporting the treating clinician's medical clearance | End of graded return |

**Scope-of-practice note (important):** Zac (osteopath) **assesses, documents, monitors, coordinates, and reports** — the **medical RTP clearance is signed by the referred doctor/clinician** per the AIS/SMA protocol. Zac's "final assessment" is a *readiness report that supports* clearance, not the clearance itself. This keeps him in scope and limits liability. The written report + referral coordination is the premium differentiator (a one-off sports-physician consult rarely includes a structured report + a named local pathway).

The free tool **lead** = the existing **SCAT6/SCOAT6 fillable docs** (`/scat-forms`) + **baseline cognitive testing** (`/preseason`). Lead with the free value; the pathway is the back end.

---

## 1b. Who pays — the institution offer is FREE (Zac 2026-06-11)

**The institution pays nothing. The cost sits with the athlete/family at point of need** (unless the institution chooses to fund/subsidise it from an athlete-welfare budget). This makes the institution sell a **no-brainer**:

- **Institution gets, at $0:** free SCAT6/SCOAT6 docs + free season-long baseline + ongoing cognitive testing for every athlete + a named concussion expert their athletes can reach fast. Pure duty-of-care upgrade, nothing to approve up the chain, looks great to parents.
- **Athlete/family pays** for the telehealth pathway *if and when* their athlete is flagged/concussed — high willingness-to-pay at that moment (it's their kid's brain; the alternative is a weeks-long wait for a sports physician).
- **Optional institution funding:** academies/elite schools with welfare budgets can pre-fund a block of consults — upsell, not a barrier.

Pitch framing to the institution: *"A premium concussion resource for your athletes, at no cost to you."*

---

## 1c. Pricing — premium, athlete-pays (market-anchored, out-of-pocket)

Market anchors (AU, telehealth, Jan 2026): **Specialist Sport & Exercise Physician initial telehealth $320** (Medicare-rebated to ~$168 out-of-pocket *with a GP referral*); **Sports Doctor concussion extended consult $230**. Zac (osteo) has **no Medicare** here (acute condition — see §3) but is premium-positioned via CEA authority + OA endorsement + research + speaking, and **bundles a written report + referral** a one-off physician consult doesn't.

Proposed athlete pricing (out-of-pocket; possible *partial* private-health rebate the family self-claims, fund-dependent — never promised):

| Service | Price | Notes |
|---|---|---|
| **Initial assessment + written report + referral** | **$250** | Below the $320 physician initial; the report + named local referral is the value. Fast access is the hook. |
| **Mid-recovery check-in** | **$120** | As clinically needed. |
| **Final readiness assessment + RTP-readiness report** | **$160** | Supports the treating clinician's clearance. |
| **Full pathway bundle** | **$480** | vs $530 à la carte — optional, for families who want the whole episode handled. |

Rationale: priced **premium but below specialist** — positioned as *faster, concussion-specialised, fully-documented* care for a worried family, delivered by the body that trains the clinicians. The report/referral/coordination is what justifies it over a generic consult.

---

## 1d. Patient-stream economics — the actual business case

The free institution tool exists to generate a **steady, recurring, founder-delivered patient stream**. Order-of-magnitude (conservative; verify concussion-incidence assumptions clinically):

- A partner institution with **~300 contact-sport athletes** at a ~5–10% season concussion incidence → **~15–30 flagged concussions/season** → ~15–30 **initial assessments**.
- Per partner institution to Zac: **~20 initials × $250 = ~$5,000/season** on initials alone, more as families take the mid/final pathway.
- **At 30 active partner institutions** (well within the ~150–250 SOM): ~600 initials/yr × $250 = **~$150k/yr on initials**, materially more with pathway uptake — a steady clinical income stream *on top of* the CEA course business, with the institutions delivering athletes at no acquisition cost.

This is the reason the free tool is worth building: it's a zero-CAC patient-acquisition channel for a premium recurring service.

---

## 1e. Authority positioning — lean on CEA + OA + research + speaking

The whole pitch rides on Zac/CEA being the **concussion authority**, not just another telehealth osteo. Every institution-facing surface leads with:
- **Concussion Education Australia** — the CPD provider that *trains the clinicians* in concussion management (16 CPD hours, the flagship course).
- **Osteopathy Australia endorsed** — independent professional-body endorsement.
- **Research** — [Zac to supply: publications / studies / contributions — cite specifics].
- **Conference speaking** — [Zac to supply: named conferences / talks — cite specifics].

Line that sells it: *"The team that trains Australia's clinicians in concussion management — now supporting your athletes directly."* (Do NOT fabricate research/speaking specifics — placeholders above must be filled with real items before any send; AHPRA advertising rules apply.)

---

## 1f. The authority flywheel — partnerships feed the whole brand (Zac 2026-06-11)

Each institution partnership is also a **credibility asset for CEA itself**:
- **"Trusted by" wall** on the CEA site + course pages — elite school / academy / club names + logos as athlete-welfare partners. Powerful E-E-A-T for the YMYL healthcare niche (Google + buyers both weight it).
- **Compounds both businesses:** clinicians are more likely to buy CEA courses from a brand visibly trusted by elite institutions; and new institutions are easier to land when the wall already shows respected peers. Partners → authority → more partners AND more course sales.
- **Hard requirement:** written permission to use each institution's name/logo (their brand policy + AHPRA advertising). Elite schools are protective — bake a "we'd love to list you as a partner (with your OK)" line into the agreement; never display a name without sign-off.

This makes the free tool worth even more: it's a patient-acquisition channel **and** a brand-authority engine.

---

## 2. The funnel

```
Prospect institution (academy/club/school)
   → Free offer: baseline cognitive testing + ongoing tool use for all athletes (zero cost to them)
      → Athletes onboarded (with parental consent for minors)
         → Baseline cognitive score captured per athlete
            → Post-incident / routine re-test
               → Score drop vs baseline ≥ threshold  → FLAG
                  → Gated CTA: "Book a telehealth assessment with Zac" (private, athlete/institution-scoped)
                     → Cal.com booking + Stripe payment
                        → Zac telehealth triage assessment
                           → Referral to a LOCAL concussion clinician (curated per institution/region)
```

Value exchange: institution gets free risk-management + professionalism for parents; Zac gets a paid assessment touchpoint, a B2B2C channel (institution → its clinicians → CEA courses), athlete-safety credibility, and a flagship case study.

---

## 3. Regulatory & rebate reality — READ FIRST (honest, verify with an accountant/AHPRA)

This shapes pricing and messaging. Do **not** advertise rebates until each is confirmed.

### Medicare — almost certainly NOT available for this
- Zac is an **osteopath**. Allied-health Medicare access exists **only** via a GP **Chronic Disease Management (CDM)** plan (GP Management Plan + Team Care Arrangement) for a **chronic** (≥6 month) condition, capped at 5 services/year.
- **Concussion is acute, not chronic** → it does **not** meet CDM criteria. So a concussion telehealth assessment by an osteo **does not attract a Medicare rebate**. Treat Medicare as **unavailable** for this model and don't promise it.
- (A GP/sports physician under MBS telehealth items is different — not Zac's lane.)

### HICAPS / private health "extras" — POSSIBLE, fund-dependent, athlete-claimed
- Osteopathy **is** claimable under most private-health *extras* cover. BUT:
  - **HICAPS** is point-of-sale (in-person terminal) claiming — **telehealth is typically a manual claim**, not real-time HICAPS.
  - **Telehealth osteo rebates vary by fund** (some retained post-COVID, some not).
- Practical model: athlete **pays the full fee via Stripe**, receives a **tax invoice with Zac's provider number + the correct service item code**, and **self-claims** from their fund. Partial rebate possible for *some* athletes/funds; **not guaranteed, not real-time.**
- **Net:** budget this as **mostly out-of-pocket** with an optional athlete-claimed private rebate. Price accordingly.

### Scope of practice & liability — the defensible model is TRIAGE + REFERRAL
- The model is **assessment + appropriate referral**, NOT definitive return-to-play clearance. Zac triages, flags red flags, and routes to a local concussion clinician for ongoing management/clearance. Keeps Zac inside osteo scope and limits liability.
- **Verify** osteopathy's standing as a recognised provider in the 2024 AIS/SMA / relevant RTP frameworks before any clearance-adjacent language. (Physios + GPs are explicitly named; confirm osteo.)
- Professional indemnity insurance must cover **telehealth concussion triage**. Confirm with insurer.

### Minors & privacy — MAJOR build constraint
- Academy athletes are frequently **under 18** → **parental/guardian consent** required for testing AND telehealth, child-safe practice obligations, and a parent (or institution staff) present for a minor's consult.
- Cognitive scores = **health information** under the Australian Privacy Principles → consent, secure storage, access controls, breach obligations, retention policy. Minors' health data is the highest-sensitivity category.
- This is non-negotiable scaffolding before any athlete data is collected.

---

## 4. System architecture (scope, not built)

### Data model (new tables)
- `partner_institutions` — name, type (academy/club/school), region, primary contact, status (lead/active), referral-clinician list ref.
- `athletes` — institution_id, name/DOB (age → minor flag), consent_status, consent_doc ref, guardian contact (if minor). **No public access. Gated by institution.**
- `cognitive_tests` — athlete_id, type (baseline/re-test/post-incident), score(s), taken_at, device/method, is_baseline.
- `test_flags` — athlete_id, test_id, rule fired (score drop vs baseline ≥ threshold), status (open/booked/assessed/referred), created_at.
- `telehealth_bookings` — athlete_id, flag_id, cal_booking_id, stripe_payment_id, status, outcome, referral_clinician_id.
- `referral_clinicians` — curated per region/institution: name, discipline, location, contact, notes. (Zac curates / finds one per institution.)

### The trigger
- Rule: a re-test or post-incident score **below the athlete's own baseline by ≥ X** (X = clinically-set threshold, Zac defines) → create `test_flag` → surface the gated telehealth CTA to that athlete/institution. (Also a hard red-flag symptom checklist → urgent in-person, not telehealth.)
- **Decision needed (Zac):** which cognitive tool + score + threshold. Options: the existing SCAT6 cognitive components (`/preseason` baseline already exists), or a dedicated repeatable cognitive test. NeuroVision is a SEPARATE patent-pending project — do NOT conflate it into CEA without an explicit decision.

### Booking + payment
- **Booking:** Cal.com (Zac's existing `cal.com/zac-lewis-so8zjs`) — a **dedicated, non-public event type** for athlete telehealth, link gated behind the flag/institution (not a public URL). The existing Cal webhook (`/api/webhooks/cal`) already attributes bookings — extend to attribute athlete/flag.
- **Payment:** Stripe (Zac sets up the product/price). One-time consult fee. Invoice MUST carry provider number + item code for private-health self-claiming (reuse the tax-invoice pipeline — `lib/tax-invoice.ts`).

### Reuse of existing infra
- `/preseason` baseline-testing tool — already live, the door-opener.
- Per-prospect branded portal pattern (`/p/[slug]`) → becomes a **per-institution athlete dashboard** (gated, access-key model already exists).
- Cal webhook + Stripe checkout + tax-invoice pipeline — extend, don't rebuild.
- Prospect engine — reuse for **institution** prospecting in a **partner lane** (status `partner-lead`, founder-led, never auto-emailed).

### The per-institution PARTNER PORTAL PAGE (Zac 2026-06-11 — reuse the engine, new content)
**Decision: YES, wire it into the custom portal engine** — same mechanics as the clinic `/p/[slug]` portal (per-institution slug + access key + og-image screenshot hero + view tracking + the "something to view" email hook), but a **different content template**. NOT the clinic education portal (no learning suite / Hub-Pack pricing). The partner page shows the FREE athlete resources + the offer:

- **Hero:** "[Institution] — Concussion care for your athletes" (branded, their name).
- **Free SCAT6/SCOAT6 docs** — the fillable forms, free to download/use.
- **Free baseline cognitive testing** — how their athletes get set up (links the existing `/preseason` flow).
- **The free mini SCAT course / refresher** — the existing free SCAT mastery content, for their staff/trainers.
- **The care pathway** — what happens if an athlete is flagged: initial → report + referral → mid → final, booked with Zac (athlete-pays; institution free).
- **Authority block** — CEA / Osteopathy Australia endorsed / research / speaking.
- **CTA:** "Set [Institution] up — it's free" → a short call / the onboarding flow. NO public Stripe, NO public booking on this page (booking is gated behind a flagged athlete result).

Build as a **new route + content template** (e.g. `/partners/[slug]` or a `variant` on the existing portal), reusing the slug/access-key/og-image/tracking primitives. The partner email leads with the screenshot of *their* page — same proven hook, athlete-resource content. **Build live only on Zac's go — not shipped yet.**

---

## 5. Build phases (each gated on the prior; nothing live until Zac says)

- **Phase 0 — Scope & validate (now):** this doc. Confirm: Medicare/HICAPS reality with accountant, osteo clearance standing, PI insurance covers telehealth triage, minors/consent legal scaffolding, the cognitive tool + threshold decision. **No code.**
- **Phase 1 — Pilot data model + consent:** institutions/athletes/consent tables; baseline onboarding for ONE pilot institution (Hunter Academy). Consent flow (parental for minors) FIRST. Internal/admin only.
- **Phase 2 — Testing + trigger:** repeat/post-incident testing, baseline-drop trigger, flagged-result → gated telehealth CTA (Cal link). Still no payment.
- **Phase 3 — Payment + referral:** Stripe consult product, invoice with item codes, referral-clinician list + post-consult referral capture.
- **Phase 4 — Institution prospecting:** partner-lane prospecting engine for academies/clubs/schools like Hunter; founder-led outreach support (not cold email).

---

## 6. Open decisions for Zac
1. **Cognitive tool + score + threshold** — what test, what score, what drop triggers a booking. (Clinical call.)
2. **Consult fee** — out-of-pocket assumption; private rebate not guaranteed.
3. **Minor policy** — parental consent + supervision model before ANY athlete data.
4. **Referral-clinician sourcing** — curate a master list, or find one per institution as you said.
5. **Telehealth scope language** — triage+referral only; confirm insurance + osteo clearance standing.
6. **Is the cognitive tool CEA's own or NeuroVision** — keep separate unless you explicitly decide.

---

_Nothing in this arm is live. No athlete data, no payment, no public booking. This is the plan to review and iterate._
