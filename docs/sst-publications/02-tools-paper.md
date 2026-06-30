# SST Trainer: a hardware-agnostic, no-fabricated-signal engine for clinician-supervised sub-symptom-threshold aerobic exercise in concussion

**A software / methods ("tools") paper**

Concussion Education Australia (CEA)
Draft v1.0 · 2026

> **Scope of claim.** This is a *tools* paper. It describes the design and verification of a software system that *delivers* an established, evidence-based clinical prescription. It makes **no efficacy claim**. The contribution is the engineering — a pure-function clinical engine, a hardware-agnostic heart-rate abstraction, and a set of explicit safety guardrails — that lets the sub-symptom-threshold aerobic exercise (SSTAE) protocol of Leddy and colleagues be carried faithfully between clinical visits. The physiology and the protocol it implements are not novel and are fully attributed below.

> **Intended Use.** SST Trainer is a **clinician-directed, hardware-agnostic exercise-rehabilitation delivery and monitoring tool; it does not diagnose, treat, or replace clinical judgment; the clinician makes all clinical decisions, including return to activity.** Its primary intended user is a **registered clinician within scope** (e.g. an ESSA-accredited Exercise Physiologist), for whom the graded test is a *rehabilitation baseline measure*, not a diagnostic determination. Heart rate is accepted from **consumer wearables the patient already owns** (not a listed medical device). It is positioned as a rehab-assistance and monitoring/data tool, **not** a diagnostic or treatment medical device, and is designed to sit within the clinical-decision-support carve-out (FDA 21st Century Cures Act §3060; TGA's CDS exclusion) — see §8.1.

---

## Abstract

Sub-symptom-threshold aerobic exercise (SSTAE), prescribed below an individualised heart-rate threshold (HRt) measured on a standardised graded test, accelerates recovery and reduces persistent symptoms after sport-related concussion (Leddy et al., *JAMA Pediatr.* 2019; Leddy et al., *Lancet Child Adolesc Health* 2021; endorsed in Patricios et al., *Br J Sports Med.* 2023). Faithful delivery, however, requires the patient to respect an invisible bpm ceiling on every home session and the clinician to monitor what happened between visits — neither of which routine workflows support. We describe **SST Trainer**, a software system whose clinical logic is a small, pure-function, condition-parameterised TypeScript engine (`lib/sst-trainer/protocol.ts`) implementing HRt detection, individualised band prescription, and a session-history progression decision, surfaced through an installable web/PWA application and a clinician dashboard. Heart rate is sourced through a single capability-detected abstraction (`lib/sst-trainer/hr-live.ts`) over the Web Bluetooth Heart Rate Service, rear-camera photoplethysmography (PPG), or clinician manual entry. The design's defining safety property is that **no heart rate is ever fabricated**: every bpm originates from a real packet broadcast by a consumer-wearable HR sensor or a real PPG estimate that passes a periodicity-confidence gate, and the system shows "no reading" rather than a guess. We frame this precisely as a **provenance and signal-quality guarantee, not an accuracy guarantee** — the architecture ensures progression decisions use only provenance-verified, signal-quality-gated live data; it makes no claim that any individual bpm is accurate to a clinical reference standard. Wrist-optical PPG has known error during exercise, so the engine surfaces the measurement source (electrical chest strap > optical wrist > camera-PPG, in descending accuracy) to inform clinical interpretation. We describe the algorithms, the multi-source abstraction, and the three guardrails (no-fabricated-bpm, the symptom-threshold stop rule, and a staleness watchdog), and we specify how each component is verifiable by construction. Digital delivery of HR-targeted concussion exercise is not new — several research and commercial tools predate this work (§2a) — so the claimed novelty is narrow and specific: the combination of a fail-closed, no-fabricated-signal verification engine with hardware-agnostic, BCTT-derived-HRt (not age-predicted-max) delivery as a single standardised supervised workflow. SST Trainer is developed by Concussion Education Australia (CEA) as the Australian-market instantiation of an established protocol for CEA's endorsed allied-health network, not as a global platform. Statement of need, architecture, and verification approach are given. Two limits are stated explicitly and not glossed: (i) **efficacy is out of scope**, deferred to a future retrospective observational study on de-identified routine-care data; and (ii) the **concurrent validity of the home-administered graded test against the clinic BCTT is unvalidated**, and is the subject of a separate registered study — the threshold-finding test is **clinician-gated** rather than freely self-initiated, reflecting the higher risk of provocative exertion testing. We claim a verification *architecture*, a *measured* (not estimated) threshold as a prescription input, and a serial-HRt trajectory instrument; we do **not** claim measurement accuracy equal to the clinic gold standard, nor improved recovery.

---

## 1. Statement of need

Two independent randomised controlled trials and the 6th International Consensus Statement establish that early SSTAE is an effective, low-risk treatment for sport-related concussion (Leddy JJ, et al. *JAMA Pediatr.* 2019;173(4):319–325; Leddy JJ, et al. *Lancet Child Adolesc Health* 2021;5(11):792–799; Patricios JS, et al. *Br J Sports Med.* 2023;57(11):695–711). The treatment is delivered mostly at home, most days, for weeks, and depends on the patient training inside an individualised heart-rate band — typically 80–90% of HRt for concussion (Leddy JJ, et al. Practical Management, *Clin J Sport Med.* 2021;31(2):e89–e94).

This creates a delivery problem that software addresses — and several tools already do, in part (see §2a). The contribution here is not first-ness but a specific safety architecture applied to the delivery problem:

- The prescribed ceiling is a number the patient cannot feel; without a live heart-rate read, self-dosing is guesswork, and both under-dosing and threshold over-shoot are harmful.
- The clinician prescribes once and then cannot observe adherence, heart rates achieved, completed minutes, symptom deltas, or next-day flares until (and unless) the next visit.
- The progression decision (advance / hold / regress / refer) and the serial-HRt recovery curve both require structured session data that paper diaries do not reliably capture.

The need is therefore for a system that (1) makes the band live and visible, (2) sources heart rate from whatever **consumer wearable the patient already owns** (a fitness tracker, chest strap, or camera-PPG — not a listed medical device), (3) never substitutes a fabricated number for a real measurement, (4) carries the protocol's safety logic between visits, and (5) reports structured data back to the supervising clinician. SST Trainer is built to that specification. Its intended users are **registered allied-health clinicians supervising exercise rehabilitation within their scope of practice** — exercise physiologists (the exemplar scope for graded exercise-tolerance assessment as a rehabilitation baseline), and osteopaths, physiotherapists and sports physicians working within theirs — together with their already-diagnosed, exercise-cleared patients executing the program between visits.

---

## 2a. Prior art — what this work extends, not invents

Digital delivery of heart-rate-targeted concussion exercise is **not new**, and we do not claim it. Several published and commercial systems already deliver parts of this workflow, and SST Trainer is positioned as an *extension* of them on a specific axis (signal-integrity safety), not as a first mover:

- **Heart-rate-targeted concussion rehab apps already exist.** The *Rhea* concussion rehabilitation app delivers HR-based aerobic prescription, guiding users to a percentage of their **age-predicted maximal HR** (usability study, *JMIR Formative Research*, 11 Apr 2025; [PMC12007725](https://pmc.ncbi.nlm.nih.gov/articles/PMC12007725/)). A separate RCT delivered early aerobic exercise after concussion using a **progressive percentage of age-predicted maximal HR** (*PLOS One*, 2022; [PMC9778585](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9778585/)).
- **Between-visit mHealth monitoring with data return already exists.** Remote patient monitoring of concussed adolescents via an mHealth app (daily symptom reporting, structured return to clinicians) is published (*JMIR-family*, 2024; [PMC11089889](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11089889/)).
- **Wearable-HR-monitored sub-threshold prescription is the trial standard.** The Buffalo RCTs delivered individualised HRt-based home exercise with wearable HR monitoring — 80% of HRt with a Polar HR monitor (NCT02710123 → *JAMA Pediatr.* 2019), and serial-HRt-updated prescription with weekly BCTT recheck (NCT02959216 → *Lancet Child Adolesc Health* 2021).
- **A commercial concussion exercise-prescription module exists and reaches Australia.** The **CCMI + Wibbi** partnership (4 Dec 2025; [wibbi.com](https://wibbi.com/resource/complete-concussions-wibbi-partnership/)) embeds CCMI's concussion protocols in a digital home-exercise-program platform with care-pathway building and outcome tracking, marketed to CCMI-affiliated clinics including in Australia. CCMI's clinic software *does* measure HRt via an in-clinic BCTT; the HRt is a one-off, clinic-administered prescription input, and tracking is of symptom/outcome scores rather than a serial measured-HRt curve.
- **Remote graded testing has one supervised precedent.** The **MOVE protocol** (Teel et al., *J Neurotrauma* 2023; [PMID 37212272](https://pubmed.ncbi.nlm.nih.gov/37212272/)) delivers a graded exertion test *virtually but under live clinician supervision*, for binary return-to-exercise clearance rather than HRt measurement. Telehealth SRC consensus holds that exertional tolerance testing cannot currently be performed *unsupervised* remotely — a position this paper does **not** claim to have overturned.

What this work contributes, ranked by the weight each claim can bear:

1. **Measured, not estimated, individualised HRt (vs the leading digital app).** Rhea targets a fixed 60% ± 5% of age-predicted maximal HR (220 − age); SST Trainer **delivers** the established sub-threshold band computed from a *measured* symptom-limited HRt (applying Leddy's published 80–90%-of-HRt formula — it executes the consensus protocol, it does not independently prescribe). A measured individualised threshold is, by construction, a more individualised input to that established protocol than a population age estimate (which can deviate from an individual's true maximum by ±10–12 bpm). This is a **construct-superiority claim, not an outcome claim** — we do not assert faster recovery.
2. **Clinician-gated, home-capable digital administration of the graded test.** Graded HRt determination is otherwise clinic-administered; the only remote adaptation (MOVE) is clinician-supervised and for binary clearance. We therefore do **not** claim to have made *unsupervised* remote HRt testing valid. We provide a clinician-gated digital administration whose **concurrent validity against the clinic BCTT is the explicit subject of a registered validation study, not a result of this paper.** Validity is scoped as future work, not asserted.
3. **Serial measured HRt as a continuous recovery-trajectory instrument.** Research measures HRt serially to re-prescribe and to predict recovery (Leddy; Haider); commercial tools track symptom/balance scores. We operationalise serial, provenance-verified *measured* HRt as a recovery-trajectory artifact in its own right — making no claim that the trajectory predicts or guarantees recovery.
4. **(Supporting layer — not a central pillar.)** A fail-closed, provenance-gated signal architecture. The components of signal-quality gating are established prior art; the contribution is their *composition* — fail-closed (non-interpolating, unlike consumer wearables that interpolate gaps) emission gated on validated provenance across BLE / camera-PPG / manual, tied to a do-not-exceed clinical ceiling, halting the dependent logic. A supporting integration, not the paper's central novelty.

None of these is an open-source or "first/only" claim; each is scoped to exactly what the cited record supports (see §9).

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

The system's safety claims are **structural** — they follow from how the engine is built and unit-tested, not from a trial outcome. To keep them externally checkable despite a closed commercial codebase, the **pure clinical engine** (`detectThreshold`, `computePrescription`, `progressionDecision` and the cited clinical constants — which encode only the published Leddy arithmetic and contain no proprietary signal-processing parameters) is made **available to editors and reviewers for inspection on request**; only the tuned camera-PPG signal-processing constants (confidence cutoff, autocorrelation lag bounds, smoothing) remain proprietary. The properties below are therefore stated as *design-and-test* guarantees a reviewer can verify against that core, not as claims to be taken on trust.

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

Camera-PPG is an estimate and is the least precise source; it is offered as a fallback, gated to fail closed, with strap-based measurement preferred. The tool delivers an evidence-based prescription but is **not** itself evidence of a clinical outcome. The strongest underlying SSTAE evidence is in adolescents with early sport-related concussion; adults and persistent-symptom populations are supported but less strongly (see companion clinical review). The empirical work this design report defers — accuracy, validity, usability, and outcomes — is set out concretely in §8.2.

### 8.1 Regulatory positioning: a clinician-directed assistant, not a medical device

**Intended Use (the statement a reviewer and a TGA classifier both read — every word is load-bearing).** SST Trainer is a **clinician-directed, hardware-agnostic exercise-rehabilitation delivery and monitoring tool.** Its primary intended user is a **registered clinician operating within scope — an ESSA-accredited Exercise Physiologist (or equivalent allied-health practitioner)** — working from a diagnosis and an exercise-rehabilitation clearance already made by a GP or sports physician. In that context the graded exercise-tolerance assessment is a **rehabilitation baseline measure** — the intensity an already-cleared patient can train at *now* — **not** a diagnostic or return-to-play determination. The clinician holds all clinical judgement: patient appropriateness, threshold interpretation, band approval/override, progression, and clearance. The software **executes** the published Leddy 80–90%-of-HRt protocol on the measured value and **logs** the trajectory; it does not diagnose, treat, determine medical clearance, or make return-to-play decisions. Heart rate is accepted from **consumer wearables the patient already owns** (BLE fitness trackers, chest straps, or rear-camera PPG) — **none of which are TGA-listed medical devices**; the tool does not require or process a signal from a *listed medical device*, but applies its fail-closed verification layer to assess the trustworthiness of consumer-grade input before clinical use.

The argument for staying outside FDA SaMD / TGA medical-device classification rests on the **clinical-decision-support carve-out** (FDA 21st Century Cures Act §3060; TGA's CDS exclusion): the qualified clinician independently makes every clinical decision — interpreting the threshold, approving the heart-rate band, approving each progression, and clearing return to activity — while the software only executes, paces, monitors, and records. It **informs; it never decides.**

Several design choices documented above are deliberately the ones that *support* the non-device argument, and are worth making explicit:

- **The clinician approves the band.** The band is a pure function of a clinician-owned HRt and the cited published constants (§4.2), surfaced for the clinician to approve or override; the software does not autonomously derive a treatment dose from raw patient data.
- **No dependency on a listed medical device.** Heart rate is accepted from consumer wearables (BLE fitness trackers / chest straps) or camera-PPG — consumer wellness products, **not** TGA-listed medical devices — so the tool does not process a signal from another *medical* device (the relevant CDSS-exemption criterion). It is hardware-agnostic by design: no specific listed device is required, assumed, or relied upon.
- **Never fabricate a heart rate (§6.1).** The tool only ever displays a measured bpm and shows "no reading" otherwise, so it presents data rather than synthesising a clinical signal the clinician would act on.
- **Symptom-stop and red-flag halt-and-refer (§6.2).** These route the patient back to care rather than the software making a treatment or triage *decision*.
- **Supervision is structural.** Progression is *proposed* for clinician review (§4.3), not applied autonomously; clearance surfaces as a clinician *review flag*, not an automated determination; self-guided use transmits nothing and carries no clinician relationship to monitor.

Honestly stated: this positioning **reduces but does not guarantee** non-device status. Classification is ultimately driven by the **claims made and the stated intended use**, not by architecture alone — which is why the Intended Use statement above is conservative and why no surface claims the tool treats, diagnoses, or clears concussion. A formal **SaMD scoping opinion should be obtained before launch.**

### 8.2 Planned empirical validation

This paper reports a *design and verification* contribution; we state plainly that it carries no efficacy, accuracy, or usability data, and that this is the principal limitation of a tools paper at this stage. Three empirical studies are planned as the immediate next work, each scoped to a specific unproven claim above:

1. **Camera-PPG concurrent validity.** A within-subject agreement study of the camera-PPG estimate against a reference electrical chest strap (the accepted ambulatory standard) across rest and the graded-test intensity range, analysed by Bland–Altman limits of agreement and concordance, with the *fail-closed* "no-reading" rate reported as a primary safety metric. This directly tests §5.2's accuracy boundary; the architecture already declares PPG the least precise source, and this study quantifies *how* imprecise and *how often it correctly refuses* rather than misleads.
2. **Concurrent validity of the home/digital graded test against the clinic BCTT.** A registered study comparing the HRt obtained via the digital administration against a same-week clinician-run BCTT — the explicit validity gap named in §1 and §9. Until it reports, home HRt determination is presented as *administration*, not validated *measurement*.
3. **Heuristic usability evaluation** with clinicians and patients (System Usability Scale + task-completion), since faithful delivery depends on the live in-zone feedback being usable under exertion.

Efficacy of the *delivered* programme remains out of scope here and is deferred to a future **retrospective observational analysis** of de-identified routine-care data (serial HRt trajectories, adherence, time-to-clearance) accumulated through normal clinical use — the appropriate, lower-burden vehicle for an outcome signal, and one that does not require a prospective interventional trial.

---

## 9. Statement of need (summary, JOSS-style)

Clinicians have a replicated, consensus-endorsed treatment (SSTAE) whose effectiveness depends on faithful between-visit delivery within an individualised, invisible heart-rate band and on structured monitoring that ordinary workflows do not provide. Digital tools that deliver HR-targeted concussion exercise, monitor between visits, and return data to clinicians **already exist** (§2a: the Rhea app; mHealth remote monitoring; the wearable-monitored Buffalo trials; the commercial CCMI+Wibbi concussion module). SST Trainer is not the first such tool and does not claim to be. Its contribution is narrower and specific: a pure-function clinical core (HRt detection, band prescription, progression), a hardware-agnostic heart-rate abstraction (BLE / camera-PPG / manual), and explicit verification-by-design safety guardrails. **Our contribution is the integration, not any one part: faithful between-visit delivery of a *measured* (BCTT-derived, not age-predicted-max) sub-threshold prescription through a single hardware-agnostic, clinician-supervised workflow, with a fail-closed verification layer that refuses to surface a fabricated heart rate.** What is new is the *combination* — measured-HRt anchoring, hardware-agnostic sourcing, clinician-gated administration, and fail-closed signal provenance, assembled as one standardised supervised workflow — none of whose individual parts we claim to have invented. The fail-closed verification layer is one honest component of that integration, not, on its own, the headline; prior systems already deliver HR-targeted concussion exercise (§2a). Stated as a **design claim, not a truth claim**: the contribution is *an architecture that ensures progression decisions use only provenance-verified, signal-quality-gated live data*. It is explicitly **not** a claim that the data are accurate to a clinical reference standard, that the right patient was measured, or that the prescribed exercise was performed — provenance and signal quality are verifiable by construction; accuracy, identity, and adherence are not, and we do not assert them.

---

## Key references

1. Leddy JJ, Haider MN, Ellis MJ, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial. *JAMA Pediatr.* 2019;173(4):319–325.
2. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799.
3. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711.
4. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376.
5. Leddy JJ, Haider MN, Hinds AL, Willer B. Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting. *Clin J Sport Med.* 2021;31(2):e89–e94.
6. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. Reliability of a graded exercise test for assessing recovery from concussion. *Clin J Sport Med.* 2011;21(2):89–94.
