# A standardised clinician-supervised digital workflow for sub-symptom-threshold aerobic exercise after concussion

**A protocol / framework paper**

Concussion Education Australia (CEA)
Draft v1.0 · 2026

> **What this is.** A described, standardised *workflow* (not a trial protocol seeking ethics approval, and not an efficacy claim) for delivering sub-symptom-threshold aerobic exercise (SSTAE) under clinician supervision using a wearable-delivered, live-monitored digital tool. It operationalises the published SSTAE prescription and the Amsterdam 2023 consensus into a repeatable sequence: baseline → heart-rate threshold (HRt) → individualised band → live-monitored between-visit rehabilitation → graded return. It is positioned explicitly against consumer *pacing* apps, which are built to help users avoid exertion; this is the *active-rehabilitation* counterpart.

---

## Abstract

Early sub-symptom-threshold aerobic exercise is an effective, low-risk treatment for sport-related concussion and is recommended by the 6th International Consensus Statement (Patricios et al., *Br J Sports Med.* 2023), supported by two randomised controlled trials in adolescents (Leddy et al., *JAMA Pediatr.* 2019; *Lancet Child Adolesc Health* 2021). Despite this, the treatment is difficult to deliver faithfully because it depends on an individualised heart-rate ceiling respected on every unsupervised home session. We describe a standardised, clinician-supervised digital workflow that closes this delivery gap. The workflow has five stages — (1) baseline and safety screen, (2) graded threshold test to an HRt, (3) individualised band prescription, (4) live-monitored between-visit rehabilitation with structured return of data to the prescriber, and (5) graded return integrated with the consensus return-to-sport/return-to-learn strategy — each anchored to a published evidence source and each carrying explicit safety logic (no-fabricated-heart-rate, the within-session ≤2-point symptom-stop rule, and red-flag halt-and-refer). We define roles, decision rules, data captured, and stopping criteria, and we contrast the framework with the consumer pacing paradigm (e.g. Visible) to make clear that the heart-rate band here is a therapeutic *target to train within and progressively raise*, not an exertion ceiling to stay under. Digital delivery of HR-targeted concussion exercise is not new — research apps and a commercial concussion module already exist (§1a) — so this paper does not claim a first tool. Its contribution is **standardisation**: a defined, repeatable, safety-anchored five-stage workflow built on a fail-closed verification principle and BCTT-derived (not age-predicted-max) HRt. The framework is intended to standardise practice across CEA's endorsed Australian concussion-rehabilitation network and to generate the structured, de-identified routine-care dataset needed for a future retrospective outcome study.

---

## 1. Background and rationale

The management of concussion has shifted from rest-until-symptom-free to early, individualised active rehabilitation (Leddy JJ, Haider MN, Ellis M, Willer BS. *Exercise is Medicine for Concussion.* Curr Sports Med Rep. 2018;17(8):262–270). The mechanism is a provocable autonomic/cerebrovascular phenotype — exercise intolerance — quantifiable as a heart-rate threshold on a standardised graded test (Leddy JJ, Willer B. *Curr Sports Med Rep.* 2013;12(6):370–376) and treatable by aerobic exercise dosed just below that threshold. The consensus position is relative rest for 24–48 hours, then early prescribed sub-symptom-threshold aerobic exercise within ~2–10 days, with a tolerated transient symptom worsening of ≤2 points on a 0–10 scale (Patricios et al., 2023).

The unsolved problem is *delivery fidelity*. The trials worked because participants adhered to an individualised heart-rate ceiling on home sessions under oversight. In routine care the ceiling is invisible to the patient, the home sessions are unobserved, and the structured data needed to progress safely (heart rates achieved, minutes, symptom deltas, next-day flares, serial HRt) is lost. A standardised digital workflow that makes the band live, sources heart rate from any wearable, never fabricates it, and reports back to the prescriber is the instrument to close that gap. This paper specifies that workflow.

---

## 1a. Prior art and the nature of the contribution

This is a *standardisation* paper, and that framing is deliberate because digital delivery of heart-rate-targeted concussion exercise already exists. We do not claim a first tool:

- Concussion rehab apps already deliver HR-targeted aerobic prescription using **age-predicted maximal HR** (the *Rhea* app, *JMIR Formative Research*, Apr 2025; a progressive-%-of-age-predicted-max-HR RCT, *PLOS One*, 2022).
- Between-visit mHealth monitoring with data return to clinicians is published (remote patient monitoring of concussed adolescents, 2024).
- The Buffalo RCTs delivered HRt-based home exercise with **wearable HR monitoring** and serial BCTT re-testing (*JAMA Pediatr.* 2019; *Lancet Child Adolesc Health* 2021).
- A **commercial** concussion exercise-prescription module is in market and reaching Australia (CCMI + Wibbi, Dec 2025).

Against that, the safest and most honest contribution is **not first-ness but standardisation**: defining a single, repeatable, safety-anchored sequence — and tying it to two specific properties the prior art does not standardise around: a **fail-closed, no-fabricated-signal** rule (heart rate is shown only when actually measured, else the workflow pauses) and a **BCTT-derived HRt** anchor rather than an age-predicted-max formula. The narrow novelty statement for the wider programme — *no published tool combines a fail-closed HR-verification engine that refuses to fabricate a reading + hardware-agnostic, clinician-supervised, BCTT-derived-HRt delivery as a standardised five-stage workflow* — is carried here as a **workflow standard**, which is the lowest-risk form of the claim.

---

## 2. Design principles

1. **Clinician-owned, not consumer self-managed — a clinician-directed assistant, not a medical device.** A clinician runs/oversees the threshold test, *interprets* it, sets the heart-rate band, owns the prescription, approves each progression, and makes the clearance and return-to-activity decision. The tool only executes, paces, monitors, and records — it **informs; it never decides.** This is the division that positions the workflow as a **clinician-directed rehab-assistance and monitoring/data tool rather than a diagnostic or treatment medical device**, intended to sit within the clinical-decision-support carve-out (FDA 21st Century Cures Act §3060; TGA's CDS exclusion). Each downstream design choice — the clinician setting the band (Stage 3), the never-fabricate-heart-rate rule (principle 3), the symptom-stop and red-flag halt-and-refer paths (principle 5), and progression *proposed for clinician review* rather than applied autonomously (Stage 4) — is deliberately one that supports the non-device argument. It extends the clinician's reach between visits; it does not replace clinical judgement or enable self-diagnosis.
2. **Heart-rate-anchored and individualised.** Every dose is derived from the patient's own HRt, not an age-predicted formula, where a graded test is available. (A standardised programme exists for when graded testing is not available — Leddy JJ, et al. *Clin J Sport Med.* 2023 — and can seed the band conservatively.)
3. **Real signal or no signal.** Heart rate is shown only when actually measured (real BLE packet or confidence-gated camera-PPG estimate); the workflow pauses on "no reading" rather than acting on a guess.
4. **Hardware-agnostic.** Any standard Bluetooth heart-rate wearable, the phone camera (PPG), or clinician manual entry can drive the identical workflow.
5. **Safety logic travels with the patient.** The within-session symptom-stop rule and the red-flag halt-and-refer path are encoded in the tool, not left to recalled verbal instruction.
6. **Active rehabilitation, not pacing.** The band is a training target to be progressively raised, not an exertion alarm (see §6).

---

## 3. The five-stage workflow

### Stage 1 — Baseline and safety screen

- **Symptom profile.** The patient selects the post-concussion symptoms they actually experience from the standard 22-item SCAT6/PCSS inventory, so subsequent prompts ask only about relevant symptoms.
- **Readiness / red-flag gate.** Before any exertion, the patient (with clinician oversight) screens against the SCAT6 emergency red-flag list (severe/worsening headache, repeated vomiting, seizure, focal weakness/numbness, slurred speech, increasing confusion/drowsiness, loss of consciousness). Any positive blocks the test and routes to urgent medical review.
- **Resting symptom score.** A 0–10 baseline is captured immediately pre-test; it is the reference for the provocation criterion.
- **Heart-rate source pairing.** The patient pairs a Bluetooth wearable, enables camera-PPG, or the clinician selects manual entry.

*Role:* clinician confirms appropriateness and supervises; patient executes. *Stopping criterion:* any red flag → exit to medical review.

### Stage 2 — Graded threshold test to an HRt

- A standardised graded ramp modelled on the Buffalo Concussion Treadmill Test (Balke protocol) increases workload each minute. Heart rate, RPE (Borg) and a 0–10 symptom score are recorded **every minute/stage**.
- **HRt = the heart rate at the first stage where the symptom score rises ≥3 points above the resting baseline** — the validated provocation criterion.
- **Three terminations, three meanings:**
  - *Symptom-limited* → HRt obtained; interpretation **physiologic** (exercise intolerance present → proceed to prescription).
  - *Voluntary exhaustion without provocation* (high RPE, no ≥3-point rise) → interpretation **no-intolerance**: symptoms unlikely exercise-driven; redirect workup (cervicogenic / vestibular / mood). On a *re-test*, this is the recovery/clearance signal.
  - *Red flag* → halt and refer; no HRt is produced from an unsafe stop.

*Role:* clinician interprets the termination. *Output:* HRt (bpm) + interpretation, synced to the clinic record as the first point on the recovery curve.

### Stage 3 — Individualised band prescription

- For concussion, the band is **80–90% of HRt**, ~**20 minutes**, **most days of the week**, with a within-session stop if symptoms rise ≥2 points above pre-session (Leddy JJ, et al. *Clin J Sport Med.* 2021;31(2):e89–e94; consensus tolerance band, Patricios et al. 2023).
- The **upper bound is an explicit do-not-exceed ceiling.** The lower bound guarantees a therapeutic stimulus.
- Conservative presets exist for moderate/severe TBI and other neuro conditions (wider safety margin, lower/narrower band, shorter sessions); the *safety logic is identical*, only the dose defaults change.

*Output:* a plain-language prescription the patient can follow and a structured band (low/high bpm) the tool enforces live.

### Stage 4 — Live-monitored between-visit rehabilitation

This is the stage no paper prescription can deliver.

- **Live band feedback.** During each home session the measured heart rate is shown against the band in real time as *under / in-zone / over*, so the patient self-doses to an otherwise invisible ceiling.
- **Within-session stop rule.** If symptoms rise ≥2 points above pre-session, the tool prompts the patient to stop — encoding the consensus tolerance band rather than relying on recall.
- **Structured session log.** Each session records average and peak heart rate, completed minutes, pre- and peak-symptom scores, and a next-day flare flag.
- **Return to the prescriber.** When the patient entered a clinic code, every threshold test and training session syncs to the clinician dashboard (HRt trajectory, band, minutes, symptom deltas, flares). While a session is running, a live tick (short-TTL) lets the clinician watch in real time and drop the patient off the live view automatically when they stop. Self-guided patients (no code) transmit nothing.
- **Progression decision (clinician-reviewable).** From the recent session history the tool proposes *advance / hold / regress / refer*:
  - **Advance** the ceiling (e.g. +5 bpm) only after a run of clean sessions (no within-session provocation, no next-day flare, ≥80% of prescribed minutes completed).
  - **Regress** the ceiling on recent repeated provocation (≥2 flares in the recent window), then rebuild.
  - **Hold** otherwise; **re-test** HRt for a precise update.
  The recency-windowed regression prevents an old, resolved flare from ratcheting the ceiling down indefinitely once the patient is running clean.

*Role:* patient executes; clinician monitors and approves progression. *Stopping criteria:* red flag at any point; repeated provocation → regress/refer.

### Stage 5 — Graded return

- **Serial HRt is the objective recovery curve.** Re-testing at intervals tracks the threshold rising toward (or reaching) no-provocation.
- **Clearance signal.** A re-test that returns *no-intolerance* (exhaustion without provoking symptoms) surfaces automatically as a clinician clearance-review flag.
- **Integration with the consensus return strategy.** Clearance to progress aerobic load is then fed into the consensus graded **Return-to-Sport** and **Return-to-Learn** strategy (Patricios et al., 2023) — symptom-limited stepwise progression through activity stages with the same ≤2-point tolerance rule — which remains a clinician-led decision. The digital workflow supplies the objective aerobic-tolerance evidence; it does not, by itself, clear an athlete for contact.

---

## 4. Roles, data, and governance

- **Prescriber (clinician).** Confirms suitability, oversees the threshold test, owns the prescription, reviews progression, makes the clearance and return-to-sport decisions.
- **Patient.** Executes home sessions inside the band, logs symptoms, reports flares.
- **Data captured.** HRt and serial re-tests; prescribed band; per-session average/peak HR, minutes, pre/peak symptom scores, next-day flare; interpretation labels; timestamps.
- **Data flow.** Patient → clinic (only with a clinic code), best-effort and non-blocking; live ticks are ephemeral (short TTL), session history is durable. (Patient consent and clinic data-contribution terms are specified in the companion data/consent document.)

---

## 5. Decision rules at a glance

| Situation | Rule | Action |
|---|---|---|
| Red flag at screen or mid-test | SCAT6 emergency list positive | Halt, no HRt, urgent medical review |
| Symptom rise ≥3 pts above rest during graded test | Provocation criterion | Record HRt at that stage; prescribe band |
| Exhaustion, no ≥3-pt rise (initial) | No exercise-intolerance phenotype | Redirect workup (cervical/vestibular/mood) |
| Exhaustion, no ≥3-pt rise (re-test) | Recovered tolerance | Flag clearance review; graded return |
| Symptom rise ≥2 pts during a home session | Within-session stop rule | Stop session; log flare |
| ≥2 flares in recent window | Repeated provocation | Regress ceiling and rebuild; consider re-test/referral |
| Run of clean sessions + ≥80% minutes | Tolerance improving | Advance ceiling (e.g. +5 bpm) |

---

## 6. Positioning: active rehabilitation vs consumer pacing

A growing class of consumer apps uses wearable or camera-PPG heart-rate/HRV data to help people with ME/CFS and long-COVID **pace** — that is, stay *under* an energy/heart-rate ceiling to avoid post-exertional malaise (the most prominent being Visible, which likewise estimates heart-rate/HRV from a phone camera and pairs an arm-worn monitor). In those conditions, *avoiding* exertion is the therapeutic goal, and the ceiling is an alarm.

This framework is the deliberate inverse. For the concussion exercise-intolerance phenotype the evidence supports *training* — a prescribed aerobic stimulus delivered *within* a band whose upper edge sits just below the symptom-provocation threshold, with the explicit intent to **progressively raise that band as tolerance recovers** (Leddy et al., 2019; 2021). The heart-rate band is therefore a **therapeutic target**, not an exertion ceiling; "in-zone" is the goal, "under" is under-dosing, and "over" is the only state shared with pacing. Same wearable substrate, opposite therapeutic intent. The distinction is clinically load-bearing: applying a pacing/avoidance mindset to a patient whose recovery depends on a graded aerobic stimulus would withhold the treatment. The workflow is built so the framing — train within and raise the band, under clinician progression — is explicit at every step.

---

## 7. Scope, limitations, and the evidence pathway

This is a *delivery framework*, not an efficacy study. It standardises faithful delivery of an established prescription; it does not itself establish a new clinical outcome. The strongest underlying evidence is in adolescents with early sport-related concussion; adults and persistent-symptom populations are supported but less strongly. The framework's secondary purpose is to generate a structured, de-identified routine-care dataset (serial HRt, adherence, time-to-clearance, flares) that can power a **future retrospective observational study** — the appropriate, low-burden vehicle for a real-world effectiveness signal, requiring only de-identified-data ethics review rather than a prospective interventional trial.

**One critical caveat on that ethics pathway.** The low-burden de-identified-data review applies **only if the data arose from routine clinical care and is analysed retrospectively.** If the tool's data capture is instead designed *for the purpose of research* — collected prospectively with research consent baked into the clinic/in-app terms — a reviewer or HREC may treat it as **prospective research requiring full HREC review and prospective consent**, which would forfeit the low-burden pathway. This classification question must be resolved with a research-ethics advisor **before** the research-data capture is built (see the ⚠️ CRITICAL warnings in `04-venues.md` and `06-data-consent-copy.md`).

**Regulatory scope.** This framework describes a **clinician-directed rehab-assistance and monitoring/data tool, not a diagnostic or treatment medical device.** The clinician makes every clinical decision (interpretation, band, progression, clearance) and the software only executes, paces, monitors, and records — the basis for positioning it within the clinical-decision-support carve-out (FDA 21st Century Cures Act §3060; TGA's CDS exclusion). This positioning *reduces but does not guarantee* non-device status — claims and intended use drive classification — so a SaMD scoping opinion should be obtained before launch.

---

## Key references

1. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711.
2. Leddy JJ, Haider MN, Ellis MJ, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial. *JAMA Pediatr.* 2019;173(4):319–325.
3. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799.
4. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376.
5. Leddy JJ, Haider MN, Hinds AL, Willer B. Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting. *Clin J Sport Med.* 2021;31(2):e89–e94.
6. Leddy JJ, Haider MN, Ellis M, Willer BS. Exercise is Medicine for Concussion. *Curr Sports Med Rep.* 2018;17(8):262–270.
