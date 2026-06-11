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

A B2B2C concussion-safety arm: give sports **institutions** (academies, clubs, schools) the **free cognitive baseline + ongoing testing tool** for their athletes; when a post-incident test drops below baseline it **triggers a private telehealth assessment with Zac** (booked via Cal.com, paid via Stripe), who **triages and refers the athlete to a local concussion clinician** from a curated list.

Distinct from the cold-clinic outreach engine. This is **founder-led partnership prospecting** to institutions, NOT cold email to clinics. (Hunter Academy of Sport is lead #1 — see [partner lead memory].)

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
