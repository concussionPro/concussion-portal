# Return-to-Sport / Return-to-Learn Pathway Tracker — Complete Build Spec

**Status:** pre-build. Built **gated (admin/demo) + noindex** behind the API until clean, then launched.
**Codename:** RTP Tracker (working). Public name TBD ("Concussion Pathway" / "Return Ready" / "CEA Pathway").

## 0. Why this, why now (the two weighted goals)

**Reputation goal:** become *the* Australian concussion pathway tool — AU-guideline-native (AIS/SMA 2024) RTP/RTL tracking that CCMI structurally cannot match (their timelines are Canadian). Every club, school, parent and clinician who touches it associates concussion management in Australia with CEA.

**Business goal (equally weighted):** recurring revenue. The free community layer is the funnel; **institutions (clubs/schools/associations) and clinicians pay annual subscriptions** for the management/compliance/oversight layer. This is also where CEA's first real **recurring-billing infrastructure** gets built — shared with the clinic-tools subscription.

**The wedge CCMI leaves open:** the entire **non-clinician community layer** (coaches, parents, schools, clubs). CCMI is clinician-walled. We own the top of the funnel — the moment of injury and the return journey — for free, and monetise the institutions and clinicians who need the management layer.

---

## 1. The evidence model (the moat — get this exactly right)

Grounded in the **AIS / SMA / ACSEP 2024 Australian Concussion Guidelines for Youth & Community Sport** + the **Amsterdam 2023 (6th) International Consensus**. This logic is the product's defensibility and its reputation — it must be precisely correct and AU-specific.

**Graded Return to Sport (GRTS) — 6 stages:**
1. Symptom-limited activity (daily activities that don't provoke symptoms)
2. Light aerobic exercise (walking/stationary cycling, <70% maxHR, no resistance)
3. Sport-specific exercise (running/skating drills, no head impact)
4. Non-contact training drills (harder training, may add resistance) — **progressive RTL must be complete by here**
5. **Full-contact practice** — *requires medical clearance to enter* (the gate)
6. Return to competition / sport

**Return to Learn (RTL) — 4 stages**, runs in parallel and **must precede contact** (stage 5): (1) daily activities at home that don't provoke symptoms → (2) school activities (homework, reading) → (3) return to school part-time → (4) return to school full-time.

**The hard AU rules the engine enforces:**
- **≥24 hours per stage** with no symptom worsening before advancing.
- **Minimum 21-day stand-down** before return to contact/collision for youth & community sport (the calendar clock).
- **≥14 days symptom-free** before commencing contact training (the symptom-free clock).
- The engine takes the **later of the two clocks** — symptom-free date + 14 days vs injury date + 21 days.
- **Symptom worsening at any stage → drop back one stage + reset that stage's 24h clock** (the 24-hour rule).
- **Red-flag symptoms → halt + emergency/medical referral** (no progression).
- **Stage 5 (contact) is gated by a recorded medical-practitioner clearance.** The tool *tracks and recommends*; it does **not** clear — scope-accurate, same discipline as the course.

The engine is a **pure, tested state machine** (`lib/rtp/protocol.ts`, mirroring `lib/sst-trainer/protocol.ts`): given injury date, daily symptom logs, current stage and timestamps, it returns the current state, whether advancement is eligible, the projected earliest return-to-contact date, and any red-flag/regression signal. Pure functions = unit-testable, reusable across surfaces, and the single source of truth.

---

## 2. Roles & surfaces

| Role | Surface | What they do |
|---|---|---|
| **Athlete / Parent** | `/rtp/a/[code]` (free) | Daily symptom check-in, see the pathway timeline + projected return date, advance a stage when eligible, get the clearance-ready summary. |
| **Coach / Club admin** | `/rtp/org/[code]` (paid) | Squad roster, who's concussed + their stage + earliest return date, compliance/audit dashboard, export records. Cannot override medical gating. |
| **School** | `/rtp/org/[code]` (paid, RTL view) | Student roster, RTL stage + academic accommodations, return-to-learn tracking. |
| **Clinician** | `/admin/hub` (the Applications Hub, paid) | Oversee assigned athletes' pathways, receive the structured summary, **record the medical clearance** sign-off for contact. |

All surfaces reached by **share code / QR** (the proven `/preseason` pattern) — zero-friction, no app install required.

---

## 3. Data model (Postgres)

- **organisations** — `id, name, type ('club'|'school'|'association'), sport, abn?, plan, plan_renews_at, created_at`
- **org_admins** — `org_id, email, role` (coach/admin/teacher)
- **athletes** — `id, org_id (nullable for free individuals), name, dob, sex, parent_email, share_code` — *reuses the `patients` entity from the Applications Hub spec so RTP, baseline and rehab thread to one person.*
- **episodes** — `id, athlete_id, injury_date, mechanism, sport, status ('active'|'cleared'|'referred')`
- **pathways** — `id, episode_id, rts_stage (0–6), rtl_stage (0–4), symptom_free_date (nullable), stage_entered_at, projected_contact_date, clearance_id (nullable)`
- **symptom_logs** — `id, episode_id, logged_at, pcss_total, dominant_symptoms[], red_flag (bool)` (22-item PCSS, the same scale as the SCAT/preseason tools)
- **clearances** — `id, episode_id, clinician_name, clinician_email, cleared_for ('contact training'|'competition'), cleared_at, note` (the medical sign-off record)
- **registry_events** (de-identified) — append-only outcome rows (injury→return days, sport, age band) feeding the AU registry moat. Written from day one, no PII.

---

## 4. Revenue model (optimise for recurring — this is the mandate)

**Free tier (the funnel + reputation):** individual athlete/parent self-tracking, unlimited. The viral community layer. Captures email + builds the brand as the AU standard. Costs ~$0 marginal.

**Institution subscription (the core recurring line):** clubs/schools/associations pay **annual** for the management + compliance layer:
- Squad/student roster, multi-athlete oversight, the compliance/audit dashboard, branded exportable records.
- **The sales hook is compliance + duty-of-care.** Australian clubs and schools now carry concussion-policy and duty-of-care obligations; an auditable "we managed every concussion to the national guideline, with records" is a **budget-backed, recurring B2B sale**, not a nice-to-have.
- Tiered: small club / large club / school / **association-enterprise** (roll out across all member clubs — the big recurring contract).

**Clinician subscription (bundled with the Applications Hub):** clinicians oversee their patients' pathways + run the clearance workflow; RTP is one module of the paid clinic hub. Recurring per-seat.

**Why it compounds:** free community use → the club needs the admin/compliance layer (subscribe) → clinicians are pulled in for clearance (course + clinic-hub funnel + the clinic directory) → associations standardise on it (enterprise recurring) → the registry grows → authority grows → more adoption. Each layer sells the next.

**Sales optimisation baked into the product:**
- Every athlete clearance summary is **CEA-branded** ("managed to the 2024 Australian guidelines via CEA") — viral reputation on every shared report.
- Free→paid prompts: when a club has ≥N athletes tracked free, prompt the admin to upgrade to the squad dashboard.
- Clearance step routes to **"find a CEA-certified clinician"** (the directory) → feeds the clinic network + course funnel.
- Email capture at every entry (parent, coach, athlete) → nurture into course / clinic tools / institution plans.

---

## 5. Build phases (all gated/noindex until clean)

- **Phase 0 — engine + data spine.** `lib/rtp/protocol.ts` (the AU-guideline state machine, pure + unit-tested) + the Postgres tables + the share-code/pairing endpoints (reuse `/api/preseason/clinic/[code]` patterns). *No clinical logic risk — it's deterministic and testable.*
- **Phase 1 — athlete/parent surface (free).** `/rtp/a/[code]`: symptom check-in, the live pathway timeline + projected return date, stage-advance gating, the clearance-ready summary PDF (reuse the `comparison-pdf` engine). The viral free layer.
- **Phase 2 — institution dashboard (paid).** `/rtp/org/[code]`: roster, status triage ("who needs attention"), compliance/audit export. **This is where Stripe subscription billing gets built** (shared with the clinic-tools subs).
- **Phase 3 — clinician oversight + clearance.** Integrate into the Applications Hub (`/admin/hub`); the clearance sign-off workflow; thread RTP to the patient's baseline + rehab record.
- **Phase 4 — association/enterprise + registry.** Multi-club rollout, the de-identified registry surface, the public AU clinic directory tie-in.

---

## 6. Tech architecture

- **Engine:** `lib/rtp/protocol.ts` — pure functions: `pathwayState(episode, logs)`, `canAdvance(pathway, logs)`, `projectedContactDate(injuryDate, symptomFreeDate)`, `redFlagCheck(log)`, `regressOnSymptomRise(...)`. Unit-tested like the SST protocol.
- **Routes:** `/rtp` (gated landing) · `/rtp/a/[code]` (athlete) · `/rtp/org/[code]` (institution) · `/admin/rtp` (admin) · `/api/rtp/*` (register-org, pair-athlete, log-symptom, advance, clearance, summary-pdf).
- **Gating pre-launch:** the same `DEMO_KEY` / admin pattern already in place; `noindex` everywhere; unlinked from public nav. Launch = remove the gate.
- **Reuse:** the share-code/QR pattern, the PDF report engine, the `patients`/`clinic_code` namespace from the Applications Hub, the 22-item PCSS from the SCAT/preseason tools, and the **recurring-billing infra** (Stripe `mode:'subscription'` + a `subscriptions` entitlement table + subscription webhook handlers) — built once here, reused for the clinic-tool seats.
- **Registry:** every state transition appends a de-identified `registry_events` row from day one.

---

## 7. How it ties to the rest of the platform

It is **not a standalone island** — it's the community front of one platform:
- **Applications Hub:** RTP shares the `patients` entity with the preseason baseline + the sub-threshold rehab tool — one person, one longitudinal record (baseline → injury → RTP → rehab → return-to-baseline).
- **The course:** RTP teaches clinicians *what* to do; CCM/EP teaches them *how*. The tool funnels clinicians into the course; the course graduates populate the clinic directory the tool routes clearances to.
- **The registry:** the compounding data moat CCMI took a decade to build — started here from event one.
- **Reputation:** the canonical AU-guideline RTP tool = the authority position, SEO, and the reason institutions standardise on CEA.

**Recommended first build: Phase 0 (the engine + data spine) + Phase 1 (the free athlete surface).** It's deterministic, reuses existing patterns, ships the viral free layer that builds reputation, and sets up Phase 2 (the paid institution dashboard + the recurring-billing infra) as the revenue turn.
