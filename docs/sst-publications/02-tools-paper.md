# SST Trainer: a hardware-agnostic, no-fabricated-signal engine for clinician-supervised sub-symptom-threshold aerobic exercise in concussion

**A software / methods ("tools") paper**

Concussion Education Australia (CEA)
Draft v1.0 · 2026

> **Scope of claim.** This is a *tools* paper. It describes the design and verification of a software system that *delivers* an established, evidence-based clinical prescription. It makes **no efficacy claim**. The contribution is the engineering — a pure-function clinical engine, a hardware-agnostic heart-rate abstraction, and a set of explicit safety guardrails — that lets the sub-symptom-threshold aerobic exercise (SSTAE) protocol of Leddy and colleagues be carried faithfully between clinical visits. The physiology and the protocol it implements are not novel and are fully attributed below.

> **Intended Use.** SST Trainer is a **clinician-directed exercise-pacing and monitoring assistant; it does not diagnose, treat, or replace clinical judgment; the clinician makes all clinical decisions, including return to activity.** It is positioned as a clinician-directed rehab-assistance and monitoring/data tool, **not** a diagnostic or treatment medical device, and is designed to sit within the clinical-decision-support carve-out (FDA 21st Century Cures Act §3060; TGA's CDS exclusion) — see §8.1.

---

## Abstract

Sub-symptom-threshold aerobic exercise (SSTAE), prescribed below an individualised heart-rate threshold (HRt) measured on a standardised graded test, accelerates recovery and reduces persistent symptoms after sport-related concussion (Leddy et al., *JAMA Pediatr.* 2019; Leddy et al., *Lancet Child Adolesc Health* 2021; endorsed in Patricios et al., *Br J Sports Med.* 2023). Faithful delivery, however, requires the patient to respect an invisible bpm ceiling on every home session and the clinician to monitor what happened between visits — neither of which routine workflows support. We describe **SST Trainer**, a software system whose clinical logic is a small, pure-function, condition-parameterised TypeScript engine (`lib/sst-trainer/protocol.ts`) implementing HRt detection, individualised band prescription, and a session-history progression decision, surfaced through an installable web/PWA application and a clinician dashboard. Heart rate is sourced through a single capability-detected abstraction (`lib/sst-trainer/hr-live.ts`) over the Web Bluetooth Heart Rate Service, rear-camera photoplethysmography (PPG), or clinician manual entry. The design's defining safety property is that **no heart rate is ever fabricated**: every bpm originates from a real device packet or a real PPG estimate that passes a periodicity-confidence gate, and the system shows "no reading" rather than a guess. We describe the algorithms, the multi-source abstraction, and the three guardrails (no-fabricated-bpm, the symptom-threshold stop rule, and a staleness watchdog), and we specify how each component is verifiable by construction. Digital delivery of HR-targeted concussion exercise is not new — several research and commercial tools predate this work (§2a) — so the claimed novelty is narrow and specific: the combination of a fail-closed, no-fabricated-signal verification engine with hardware-agnostic, BCTT-derived-HRt (not age-predicted-max) delivery as a single standardised supervised workflow. SST Trainer is developed by Concussion Education Australia (CEA) as the Australian-market instantiation of an established protocol for CEA's endorsed allied-health network, not as a global platform. Statement of need, architecture, and verification approach are given; efficacy is explicitly out of scope and is deferred to a future retrospective observational study on de-identified routine-care data.

---

## 1. Statement of need

Two independent randomised controlled trials and the 6th International Consensus Statement establish that early SSTAE is an effective, low-risk treatment for sport-related concussion (Leddy JJ, et al. *JAMA Pediatr.* 2019;173(4):319–325; Leddy JJ, et al. *Lancet Child Adolesc Health* 2021;5(11):792–799; Patricios JS, et al. *Br J Sports Med.* 2023;57(11):695–711). The treatment is delivered mostly at home, most days, for weeks, and depends on the patient training inside an individualised heart-rate band — typically 80–90% of HRt for concussion (Leddy JJ, et al. Practical Management, *Clin J Sport Med.* 2021;31(2):e89–e94).

This creates a delivery problem that software addresses — and several tools already do, in part (see §2a). The contribution here is not first-ness but a specific safety architecture applied to the delivery problem:

- The prescribed ceiling is a number the patient cannot feel; without a live heart-rate read, self-dosing is guesswork, and both under-dosing and threshold over-shoot are harmful.
- The clinician prescribes once and then cannot observe adherence, heart rates achieved, completed minutes, symptom deltas, or next-day flares until (and unless) the next visit.
- The progression decision (advance / hold / regress / refer) and the serial-HRt recovery curve both require structured session data that paper diaries do not reliably capture.

The need is therefore for a system that (1) makes the band live and visible, (2) sources heart rate from whatever hardware the patient already has, (3) never substitutes a fabricated number for a real measurement, (4) carries the protocol's safety logic between visits, and (5) reports structured data back to the prescriber. SST Trainer is built to that specification. Its intended users are **concussion-treating clinicians** (osteopaths, physiotherapists, exercise physiologists, sports physicians) who prescribe and supervise SSTAE, and their patients executing it between visits.

---

## 2a. Prior art — what this work extends, not invents

Digital delivery of heart-rate-targeted concussion exercise is **not new**, and we do not claim it. Several published and commercial systems already deliver parts of this workflow, and SST Trainer is positioned as an *extension* of them on a specific axis (signal-integrity safety), not as a first mover:

- **Heart-rate-targeted concussion rehab apps already exist.** The *Rhea* concussion rehabilitation app delivers HR-based aerobic prescription, guiding users to a percentage of their **age-predicted maximal HR** (usability study, *JMIR Formative Research*, 11 Apr 2025; [PMC12007725](https://pmc.ncbi.nlm.nih.gov/articles/PMC12007725/)). A separate RCT delivered early aerobic exercise after concussion using a **progressive percentage of age-predicted maximal HR** (*PLOS One*, 2022; [PMC9778585](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9778585/)).
- **Between-visit mHealth monitoring with data return already exists.** Remote patient monitoring of concussed adolescents via an mHealth app (daily symptom reporting, structured return to clinicians) is published (*JMIR-family*, 2024; [PMC11089889](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11089889/)).
- **Wearable-HR-monitored sub-threshold prescription is the trial standard.** The Buffalo RCTs delivered individualised HRt-based home exercise with wearable HR monitoring — 80% of HRt with a Polar HR monitor (NCT02710123 → *JAMA Pediatr.* 2019), and serial-HRt-updated prescription with weekly BCTT recheck (NCT02959216 → *Lancet Child Adolesc Health* 2021).
- **A commercial concussion exercise-prescription module exists and reaches Australia.** The **CCMI + Wibbi** partnership (4 Dec 2025; [wibbi.com](https://wibbi.com/resource/complete-concussions-wibbi-partnership/)) embeds CCMI's concussion protocols in a digital home-exercise-program platform with care-pathway building and outcome tracking, marketed to CCMI-affiliated clinics including in Australia.

What is *not* established in that prior art, and what SST Trainer contributes, is the **fail-closed, no-fabricated-signal verification architecture**: an engine that emits a heart rate only when it originates from a validated real measurement and otherwise pauses, combined with hardware-agnostic sourcing and **BCTT-derived HRt** (not age-predicted-max) delivery, as a single standardised supervised workflow. That is the narrow, honest novelty this paper claims (see §9).

---

## 2. The protocol it implements (attribution)

The clinical engine is a faithful encoding of the published SSTAE protocol; it invents no physiology. Specifically:

- **Graded test → HRt.** Modelled on the Buffalo Concussion Treadmill Test (Balke ramp), with heart rate, RPE and a 0–10 symptom-severity score recorded every minute/stage (Leddy JJ, Willer B. *Curr Sports Med Rep.* 2013;12(6):370–376). HRt is the heart rate at the first stage where symptoms rise ≥3 points above resting — the validated provocation criterion.
- **Prescription.** Train at 80–90% of HRt for concussion, ~20 min, most days, with an in-session symptom-stop rule (Leddy JJ, et al. *Clin J Sport Med.* 2021;31(2):e89–e94; standardised-programme variant, *Clin J Sport Med.* 2023).
- **Tolerance band.** The ≤2-point transient symptom worsening tolerated during exercise comes directly from the consensus statement (Patricios et al., 2023); the within-session stop is set at a ≥2-point rise.
- **Serial testing.** Repeating the graded test yields a recovery curve and a return-to-activity signal; the BCTT is reliable as a repeated measure (Leddy JJ, et al. *Clin J Sport Med.* 2011;21(2):89–94).

Constants in code are therefore *citations*, not tunables: `PROVOCATION_RISE = 3`, `SESSION_STOP_RISE = 2`, `EXHAUSTION_RPE = 17`, and the concussion band `0.8–0.9 × HRt`.

---

## 3. Architecture overview

The system separates a pure clinical core from all I/O so the same logic runs identically in the web MVP, the PWA, the clinician dashboard, and (future) native wearable apps.

- **`lib/sst-trainer/protocol.ts`** — the clinical engine. Pure functions, no I/O, fully unit-testable: `detectThreshold()`, `computePrescription()`, `progressionDecision()`, plus the exported clinical constants and the condition-defaults table. This is the JOSS-style "core library."
- **`lib/sst-trainer/hr-live.ts`** — the heart-rate hardware abstraction. Capability detection plus two real connectors (`connectBluetoothHr()`, `connectCameraPpg()`) returning a common `LiveHrConnection` interface (`subscribe`, `stop`, `label`).
- **`lib/sst-trainer/symptoms.ts`** — the standard 22-item post-concussion symptom inventory (SCAT6/PCSS) and the SCAT6 emergency red-flag list.
- **`lib/sst-trainer/clinic-sync.ts`** — best-effort, fire-and-forget sync of threshold and training events to the prescribing clinic, plus a live in-session tick. Only fires when a clinic code is present.
- **`app/platform/app/page.tsx`** — the patient-facing state machine (welcome → symptoms → readiness → test → prescription → home → live session → progress), driving the engine with a real live-HR feed.
- **`app/api/sst/live/route.ts`** — ephemeral live-monitoring endpoint (Vercel KV, short TTL) so a clinician dashboard can watch active patients in real time.
- **`app/api/sst/clinic-sessions/route.ts`** — durable session history per clinic, grouped by patient into HRt trajectories, session logs, and a derived clearance-ready flag.

The condition table is parameterised (`concussion`, `mtbi`, `tbi`, `neuro-other`, and conservative expansion presets) so only band/dose *defaults* differ across conditions while the safety logic is shared.

---

## 4. The clinical algorithms

### 4.1 HRt detection (`detectThreshold`)

Input is the resting symptom score, the per-minute stages (each with end-of-stage heart rate and 0–10 symptom score), and a termination reason. The algorithm:

1. If the test was terminated for a **red flag**, return immediately with interpretation `red-flag` and a "stop and seek review" message — *no* HRt is produced from an unsafe stop.
2. If there are no stages, return `invalid`.
3. Find the **first** stage whose `symptomScore − restingSymptomScore ≥ 3` (`PROVOCATION_RISE`). If found, HRt = that stage's heart rate; interpretation `physiologic` (exercise intolerance present → prescribe SSTAE).
4. Otherwise (reached limit with no ≥3-point provocation): interpretation `no-intolerance` — the symptoms are unlikely to be exercise-driven; redirect the workup (cervical / vestibular / mood). On a *re-test*, this same branch is the recovered/clearance signal.

The function is total and deterministic: every input maps to exactly one of four interpretations, which makes it exhaustively testable.

### 4.2 Individualised band prescription (`computePrescription`)

Given an HRt and a condition, the band is `round(HRt × lowerPct)` to `round(HRt × upperPct)` with condition-specific dose. For concussion this is 80–90% of HRt, 20 min, 6 days/week, with `stopRisePoints = 2`. The upper bpm is the explicit *do-not-exceed ceiling*. A human-readable summary string is generated for the patient. No value is hidden or derived by magic — the prescription is a pure function of HRt and the cited constants.

### 4.3 Progression decision (`progressionDecision`)

Given the current prescription and a recent `SessionLog[]`, the engine returns `advance | hold | regress | refer` with an optional new ceiling:

- **Regress** if, within a recent window (last *max(cleanNeeded,3)* sessions), ≥2 sessions show a next-day flare or a within-session rise ≥`SESSION_STOP_RISE`. The window is deliberately *recent-only* so an old, long-resolved flare cannot ratchet the ceiling down forever once the patient is running clean.
- **Advance** (ceiling +step, default 5 bpm) only if the last `cleanNeeded` (default 3) sessions are *all* clean: no next-day flare, within-session rise < stop threshold, and ≥80% of prescribed minutes completed.
- **Hold** otherwise.

This encodes the clinical rule "advance only after clean runs; ease back on repeated provocation; re-test for a precise update," and it degrades safely on sparse data (returns `hold` with "log a few sessions first").

---

## 5. The multi-source heart-rate abstraction

Heart rate is the load-bearing measurement, so sourcing it must be frictionless *and* trustworthy. `hr-live.ts` exposes a single `LiveHrConnection` contract and three ways to satisfy it; consuming screens are identical regardless of source.

### 5.1 Web Bluetooth (`connectBluetoothHr`)

Uses the **standard** BLE Heart Rate Service (`0x180D`) / Heart Rate Measurement characteristic (`0x2A37`). Because it filters on the standard service rather than a brand, the OS chooser lists *any* compliant device — Polar, Wahoo, Garmin broadcast, WHOOP, generic chest straps — and the user picks theirs; there is no brand lock-in and no need for per-vendor SDKs. The characteristic parser respects the flags byte (8- vs 16-bit value), and — importantly for safety — **guards against malformed/short packets** (returns `null` rather than throwing or emitting garbage) and rejects implausible values (≤0 or >250 bpm). The connection auto-reconnects on a transient GATT drop and tears the hardware down cleanly on `stop()`. `requestDevice` is invoked first inside the user-gesture handler, as the API requires.

### 5.2 Camera PPG (`connectCameraPpg`)

When no strap is available, a rear-camera photoplethysmography estimate is derived from the mean red-channel value per frame (64×64 downscale, torch enabled where supported). A rolling buffer (up to 256 samples) is detrended (mean-removed) and analysed by **normalised autocorrelation** over the lag range mapping to 40–200 bpm. Two design choices are safety-relevant:

- **Normalisation removes short-lag bias.** Dividing each lag's sum by the number of overlapping terms *and* by signal energy yields a 0–1 coefficient, so the estimate is not biased toward high bpm.
- **A confidence gate refuses weak signals.** A flat/noise-only window (variance below threshold — e.g. the camera isn't covered) and any best-coefficient below 0.3 return `null`. The module emits ~1 Hz with light smoothing, and a periodicity that isn't convincingly present produces *no reading at all*.

This is camera-PPG as used by mainstream health apps (the same photoplethysmography technique underlies, e.g., Visible's HRV estimation), but tuned to *fail closed*.

### 5.3 Manual entry

When no wearable is present, the clinician enters bpm by hand and the same engine consumes it. This guarantees the protocol is runnable in any clinic with no hardware at all.

---

## 6. Safety guardrails (verification-by-design)

The system's safety claims are structural — provable from the code's shape rather than from a trial outcome.

### 6.1 Never fabricate a bpm

There is **no simulated or interpolated heart rate anywhere in the live path.** A bpm is emitted only from (a) a parsed real BLE packet that passed range/length validation, or (b) a real PPG estimate that passed the variance and confidence gates. When neither is available the surface shows an explicit "no reading" state and the dependent logic pauses. This is the central safety property because the prescription is a heart-rate *ceiling*: a fabricated number could wave a patient past their provocation threshold. The threshold test and the live session therefore run on real signal or they wait.

### 6.2 The symptom-threshold stop rule

The within-session stop (`SESSION_STOP_RISE = 2`) mirrors the consensus tolerance band: a transient ≤2-point worsening is acceptable, so a rise *reaching* 2 points triggers the stop prompt. Independently, the *red-flag* path (SCAT6 emergency list — worsening headache, repeated vomiting, seizure, focal neurology, slurred speech, increasing confusion/drowsiness, loss of consciousness) halts any test or session and routes to urgent review; a red-flag stop never yields an HRt. These are encoded in the engine and the readiness gate, so they travel with the patient between visits rather than living only in the clinician's verbal instructions.

### 6.3 Staleness watchdog

Liveness is treated as a first-class safety concern at two layers. On the device, the HR feed carries a status so a stale or dropped signal is shown as such rather than silently freezing on the last value. On the server, the live-monitoring endpoint (`/api/sst/live`) writes each tick to Vercel KV with a short TTL (~15 s per patient tick, ~90 s per-clinic index): if a patient stops ticking they automatically drop off the clinician's live view and stale index members are pruned on read. The clinician therefore sees "currently training" only when the patient genuinely is, never a ghost session.

### 6.4 Other defensive properties

- **Clinic sync is best-effort and non-blocking.** `clinic-sync.ts` uses fire-and-forget `fetch` with `keepalive` and swallowed errors: a failed sync can never break or block the patient's session UI. Self-guided users (no clinic code) transmit nothing.
- **Server-side validation.** The live endpoint re-validates bpm into a plausible window (30–240) and clamps/labels string fields, so a malformed client cannot poison the dashboard.
- **Totality.** The three engine functions are total and deterministic over their input types, enabling exhaustive unit testing of the clinical branches (provoked / exhaustion / red-flag / invalid; advance / hold / regress / refer).

---

## 7. Verification approach

Because efficacy is out of scope, verification targets *correctness of delivery*:

1. **Unit tests of the engine** covering every interpretation and progression branch, the provocation boundary (exactly +3), the stop boundary (exactly +2), the regression window (recency, ≥2 flares), and the advance gate (all-clean + ≥80% minutes).
2. **Parser tests** for the BLE Heart Rate Measurement characteristic (8-bit vs 16-bit flag, short-packet rejection, out-of-range rejection).
3. **PPG estimator tests** asserting `null` on flat/noise input, on too-short windows, and on sub-threshold confidence; correct bpm on a synthetic periodic signal.
4. **Endpoint validation tests** for the live and session routes (bpm windowing, field clamping, TTL/staleness behaviour).
5. **Property checks** that no code path can emit a bpm without a corresponding real measurement (no `Math.random`/simulated source in the live path).

---

## 8. Limitations and scope

Camera-PPG is an estimate and is the least precise source; it is offered as a fallback, gated to fail closed, with strap-based measurement preferred. The tool delivers an evidence-based prescription but is **not** itself evidence of a clinical outcome. The strongest underlying SSTAE evidence is in adolescents with early sport-related concussion; adults and persistent-symptom populations are supported but less strongly (see companion clinical review). Efficacy of the *delivered* programme is deferred to a planned retrospective observational analysis of de-identified routine-care data accumulated through normal clinical use.

### 8.1 Regulatory positioning: a clinician-directed assistant, not a medical device

The system is positioned as a **clinician-directed rehab-assistance and monitoring/data tool, not a diagnostic or treatment medical device.** The argument for staying outside FDA SaMD / TGA medical-device classification rests on the **clinical-decision-support carve-out** (FDA 21st Century Cures Act §3060; TGA's CDS exclusion): the qualified clinician independently makes every clinical decision — interpreting the threshold, setting the heart-rate band, approving each progression, and clearing return to activity — while the software only executes, paces, monitors, and records. It **informs; it never decides.**

Several design choices documented above are deliberately the ones that *support* the non-device argument, and are worth making explicit:

- **The clinician sets the band.** The prescription is a pure function of a clinician-owned HRt and the cited constants (§4.2); the software does not autonomously derive a treatment dose from raw patient data.
- **Never fabricate a heart rate (§6.1).** The tool only ever displays a measured bpm and shows "no reading" otherwise, so it presents data rather than synthesising a clinical signal the clinician would act on.
- **Symptom-stop and red-flag halt-and-refer (§6.2).** These route the patient back to care rather than the software making a treatment or triage *decision*.
- **Supervision is structural.** Progression is *proposed* for clinician review (§4.3), not applied autonomously; clearance surfaces as a clinician *review flag*, not an automated determination; self-guided use transmits nothing and carries no clinician relationship to monitor.

Honestly stated: this positioning **reduces but does not guarantee** non-device status. Classification is ultimately driven by the **claims made and the stated intended use**, not by architecture alone — which is why the Intended Use statement above is conservative and why no surface claims the tool treats, diagnoses, or clears concussion. A formal **SaMD scoping opinion should be obtained before launch.**

---

## 9. Statement of need (summary, JOSS-style)

Clinicians have a replicated, consensus-endorsed treatment (SSTAE) whose effectiveness depends on faithful between-visit delivery within an individualised, invisible heart-rate band and on structured monitoring that ordinary workflows do not provide. Digital tools that deliver HR-targeted concussion exercise, monitor between visits, and return data to clinicians **already exist** (§2a: the Rhea app; mHealth remote monitoring; the wearable-monitored Buffalo trials; the commercial CCMI+Wibbi concussion module). SST Trainer is not the first such tool and does not claim to be. Its contribution is narrower and specific: a pure-function clinical core (HRt detection, band prescription, progression), a hardware-agnostic heart-rate abstraction (BLE / camera-PPG / manual), and explicit verification-by-design safety guardrails. **To our knowledge, no published tool combines a fail-closed HR-verification engine that refuses to fabricate a reading + hardware-agnostic, clinician-supervised, BCTT-derived-HRt (not age-predicted-max) delivery as a single standardised supervised workflow.** That combination — the verification architecture, not the use of heart rate or the fact of digital delivery — is the honest novelty.

---

## Key references

1. Leddy JJ, Haider MN, Ellis MJ, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial. *JAMA Pediatr.* 2019;173(4):319–325.
2. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799.
3. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711.
4. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376.
5. Leddy JJ, Haider MN, Hinds AL, Willer B. Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting. *Clin J Sport Med.* 2021;31(2):e89–e94.
6. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. Reliability of a graded exercise test for assessing recovery from concussion. *Clin J Sport Med.* 2011;21(2):89–94.
