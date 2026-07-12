# Paper 2 — Submission Pack + Manuscript (submission-ready DRAFT)

Manuscript body begins at **"— MANUSCRIPT —"** below.
Author: Zac Lewis, Concussion Education Australia. ORCID 0009-0002-4267-0451. z.lew87@gmail.com.

**Strategy (from `04-venues.md`): this is a write-and-submit development paper — NO preprint step and NOT JOSS.**
Target venue: **JMIR mHealth and uHealth** (closed-source development/implementation paper). Code stays CLOSED (`11-venue-ip-decision.md`): the architecture is described rigorously; implementation and tuned signal-processing constants remain trade-secret and are not disclosed. The paper benefits from citing Papers 1 (clinical review) and 3 (protocol framework) as clinical/workflow context — add those DOIs once live.

---

## TARGET VENUE & ARTICLE TYPE

- **Venue:** *JMIR mHealth and uHealth* (JMU). Primary. It is the leading indexed venue for mobile-health tool descriptions and accepts a software/development description **without efficacy data**.
- **Article type:** Original Paper, framed as a **development and implementation report** (design rationale + standards-conformance + verification-by-design; no outcome data).
- **Fallback (only if a code-release venue is ever wanted):** *SoftwareX* or *JOSS* — both require public code, so reserved only if the closed-source decision is reversed. Not the speed/IP-optimal path.
- **No preprint step.** Unlike Paper 1 (OSF Preprints) and Paper 3 (protocols.io), this paper has no fast-public-output step; it is submitted directly.

---

## COVER LETTER (JMIR mHealth and uHealth)

> Dear Editors,
>
> Please consider the enclosed development and implementation report, "SST Trainer: a hardware-agnostic, no-fabricated-signal engine for clinician-supervised sub-symptom-threshold aerobic exercise in concussion," for publication in *JMIR mHealth and uHealth*.
>
> Sub-symptom-threshold aerobic exercise (SSTAE), prescribed below an individualised heart-rate threshold measured on a standardised graded test, accelerates recovery and reduces persistent symptoms after sport-related concussion, and is endorsed by the 6th International Consensus Statement (Amsterdam 2022/2023). Faithful delivery, however, depends on the patient respecting an invisible heart-rate ceiling on every between-visit session and on the clinician monitoring what happened between visits — neither of which routine workflows support.
>
> The paper describes SST Trainer: a software system whose clinical logic is a small, pure-function, condition-parameterised engine (heart-rate-threshold detection, individualised band prescription, and a fail-closed progression decision), sourcing heart rate through a single capability-detected abstraction over the standard Bluetooth Heart Rate profile, with camera photoplethysmography as a resting spot-check and clinician manual entry as a floor. Its defining safety property is that no heart rate is ever fabricated: every value originates from a real broadcast packet or a real photoplethysmography estimate that passes a signal-quality gate, and the system shows "no reading" rather than a guess.
>
> This is explicitly a *development* paper. It makes **no efficacy claim** and reports no patient data. Two limits are stated in the manuscript and not glossed: efficacy is out of scope (deferred to a future retrospective observational analysis), and the concurrent validity of the home-administered graded test against the clinic Buffalo Concussion Treadmill Test is unvalidated and is the subject of a separate registered study. The claimed novelty is deliberately narrow and construct-level — the *combination* of a measured (not age-predicted) threshold, verification-gated progression, and a serial measured-threshold clinician trajectory — and is bounded throughout against named prior art (the Rhea app; mHealth remote monitoring; the Buffalo wearable-monitored trials; the commercial CCMI+Wibbi module). We do not claim first-to-digital.
>
> **Declaration.** I am the developer of the SST Trainer software and founder of Concussion Education Australia, which develops it. The conflict is disclosed in the manuscript and in the enclosed COI statement; no efficacy claim is made for the software. The source code is a closed commercial product and is not released; the manuscript describes the architecture and verification approach rigorously without disclosing tuned signal-processing constants. The pure-function clinical engine, which encodes only published clinical constants, can be made available to editors and reviewers on request for verification. The manuscript is not under consideration elsewhere and has not been posted as a preprint.
>
> Thank you for your consideration.
>
> Zac Lewis
> Osteopath; Founder, Concussion Education Australia
> z.lew87@gmail.com · ORCID 0009-0002-4267-0451

---

## STANDALONE COI STATEMENT (paste into COI fields)

> The author (ZL) is the developer of the SST Trainer software described in this paper and is the founder of Concussion Education Australia, which develops and commercialises it. This is a development and verification report of that software; the author therefore has a direct commercial interest in it. To limit overclaiming: the paper makes no efficacy, accuracy, or clinical-outcome claim for the software; the established clinical protocol it implements is fully attributed to its originators (Leddy and colleagues) and separated from the engineering contribution; every differentiation claim is bounded ("to our knowledge") against named prior art rather than asserted as a bare "first" or "only"; and the two principal unproven items (delivered-programme efficacy, and concurrent validity of the home graded test against the clinic Buffalo Concussion Treadmill Test) are explicitly scoped as out-of-scope future work. No external funding was received for this work.

## DATA AVAILABILITY STATEMENT

> No new empirical or patient data were generated or analysed for this report; all clinical evidence is cited in the reference list. SST Trainer is a closed-source commercial product and its source code is not publicly available. The pure-function clinical engine — which encodes only the published clinical constants and contains no proprietary signal-processing parameters — can be made available to editors and reviewers on request for verification. Tuned signal-processing parameters are retained as trade secrets and are not disclosed.

## ETHICS STATEMENT

> Not applicable. This is a software development and verification report. It involved no human participants, no human data, and no patient data; it reports no pilot, usage, or outcome study. The planned empirical studies named in the Limitations (camera-photoplethysmography resting concurrent validity; concurrent validity of the home graded test against the clinic Buffalo Concussion Treadmill Test; heuristic usability evaluation) and any future retrospective outcome analysis of de-identified routine-care data will each require their own ethics review before they are conducted, and none of their data appear in this paper.

## METADATA (for the portal forms)

- **Title:** SST Trainer: a hardware-agnostic, no-fabricated-signal engine for clinician-supervised sub-symptom-threshold aerobic exercise in concussion
- **Keywords:** concussion; mild traumatic brain injury; mHealth; digital health; wearable; heart rate; Bluetooth Low Energy; photoplethysmography; sub-symptom-threshold aerobic exercise; Buffalo Concussion Treadmill Test; heart-rate threshold; exercise rehabilitation; clinical decision support; software architecture
- **Article type:** Original Paper — development and implementation report
- **Corresponding author:** Zac Lewis, Concussion Education Australia, z.lew87@gmail.com, ORCID 0009-0002-4267-0451
- **Suggested reviewers (optional):** researchers publishing on digital delivery of concussion exercise / BCTT-derived HRt, and mHealth signal-quality/verification methodologists — do not suggest anyone with a prior working relationship, and avoid direct commercial competitors (CCMI/Wibbi, Rhea Health).

---
---

# — MANUSCRIPT —

# SST Trainer: a hardware-agnostic, no-fabricated-signal engine for clinician-supervised sub-symptom-threshold aerobic exercise in concussion

**Zac Lewis**¹

¹ Concussion Education Australia, Australia. ORCID: 0009-0002-4267-0451.

**Corresponding author:** Zac Lewis, Concussion Education Australia. Email: z.lew87@gmail.com

**Article type:** Original Paper — development and implementation report

**Keywords:** concussion; mild traumatic brain injury; mHealth; digital health; wearable; heart rate; Bluetooth Low Energy; photoplethysmography; sub-symptom-threshold aerobic exercise; Buffalo Concussion Treadmill Test; heart-rate threshold; exercise rehabilitation; clinical decision support; software architecture

> **Scope of claim.** This is a *development* paper. It describes the design and verification of a software system that *delivers* an established, evidence-based clinical prescription. It makes **no efficacy claim** and reports no patient data. The contribution is the engineering — a pure-function clinical engine, a hardware-agnostic heart-rate abstraction, and a set of explicit safety guardrails — that lets the sub-symptom-threshold aerobic exercise (SSTAE) protocol of Leddy and colleagues be carried faithfully between clinical visits. The physiology and the protocol it implements are not novel and are fully attributed. Digital delivery of heart-rate-targeted concussion exercise is also not new; several research and commercial tools predate this work (§2a), so the claimed novelty is narrow, specific, and construct-level, and is bounded throughout against named comparators.

---

## Abstract

**Background:** Sub-symptom-threshold aerobic exercise (SSTAE), prescribed below an individualised heart-rate threshold (HRt) measured on a standardised graded test, accelerates recovery and reduces persistent symptoms after sport-related concussion, and is endorsed by the 6th International Consensus Statement on Concussion in Sport. Faithful delivery depends on the patient respecting an invisible beats-per-minute (bpm) ceiling on every home session and on the clinician monitoring what happened between visits — neither of which routine workflows support. Digital delivery of HR-targeted concussion exercise is not itself new; several research and commercial tools already deliver parts of this workflow.

**Objective:** To describe the design and verification of SST Trainer — a software system that delivers the established SSTAE prescription with a specific safety architecture (a measured rather than estimated threshold as prescription input, verification-gated dose progression, a serial measured-HRt clinician trajectory, hardware-agnostic heart-rate sourcing, and a signal layer that never fabricates a heart rate) — and to state precisely what such a system can and cannot claim.

**Methods:** We describe the system architecture, the clinical algorithms, the multi-source heart-rate abstraction, three safety guardrails, and a verification-by-construction approach. The clinical logic is a small, pure-function, condition-parameterised engine (HRt detection, individualised band prescription, and a progression decision) with no input/output, making it exhaustively unit-testable. Heart rate is sourced through a single capability-detected abstraction over the standard Bluetooth Low Energy (BLE) Heart Rate profile — read via Web Bluetooth on Android/desktop browsers and via a native Bluetooth bridge in the iOS and Android apps — with rear-camera photoplethysmography (PPG) as a resting spot-check and clinician manual entry as a floor. No human-subjects, usage, or outcome data were collected.

**Results (system built):** The engine detects HRt as the heart rate at the first graded-test stage whose symptom score rises by the published provocation amount above rest, prescribes the individualised sub-threshold band from the cited constants, and returns a fail-closed progression decision in which only live-verified wearable sessions can advance the training band, the band is capped at the measured HRt (a fresh graded test being the only path higher), and safety-driven regression counts every session regardless of verification. The defining property is that no heart rate is ever fabricated: every bpm originates from a validated real BLE packet or a real PPG estimate that passes a periodicity-confidence gate, and the system shows "no reading" rather than a guess. We frame this as a **provenance and signal-quality guarantee, not an accuracy guarantee**. Camera-PPG is corrupted by motion and is therefore confined to rest and can never mark a session verified; the engine surfaces the measurement source (electrical chest strap > optical wrist > camera-PPG, in descending accuracy) to inform clinical interpretation. Each guardrail is specified as verifiable by construction over the total, deterministic engine.

**Conclusions:** SST Trainer's contribution is integration and verifiable delivery of an established treatment, not new physiology and not first-to-digital. To our knowledge no commercially available concussion product combines a *measured* (BCTT-derived, not age-predicted-max) heart-rate threshold, live verification-gated heart-rate-zone training, and a serial measured-HRt clinician trajectory in one standardised, clinician-supervised, hardware-agnostic workflow delivered on a fail-closed signal layer — but each element exists somewhere in prior art, so the claim is the combination, bounded by named comparators. Two limits are stated explicitly: efficacy is out of scope (deferred to a future retrospective observational analysis of de-identified routine-care data), and the concurrent validity of the home-administered graded test against the clinic BCTT is unvalidated and is the subject of a separate registered study. We claim a verification *architecture*, a *measured* threshold as a prescription input, and a serial-HRt trajectory instrument; we do **not** claim measurement accuracy equal to the clinic gold standard, nor improved recovery.

---

## 1. Statement of need

Two independent randomised controlled trials and the 6th International Consensus Statement establish that early SSTAE is an effective, low-risk treatment for sport-related concussion (Leddy JJ, et al. *JAMA Pediatr.* 2019;173(4):319–325; Leddy JJ, et al. *Lancet Child Adolesc Health* 2021;5(11):792–799; Patricios JS, et al. *Br J Sports Med.* 2023;57(11):695–711). The treatment is delivered mostly at home, most days, for weeks, and depends on the patient training inside an individualised heart-rate band — typically 80–90% of HRt for concussion (Leddy JJ, et al. Practical Management, *Clin J Sport Med.* 2021;31(2):e89–e94).

This creates a delivery problem that software addresses — and several tools already do, in part (see §2a). The contribution here is not first-ness but a specific safety architecture applied to the delivery problem:

- The prescribed ceiling is a number the patient cannot feel; without a live heart-rate read, self-dosing is guesswork, and both under-dosing and threshold over-shoot are undesirable.
- The clinician prescribes once and then cannot observe adherence, heart rates achieved, completed minutes, symptom deltas, or next-day flares until (and unless) the next visit.
- The progression decision (advance / hold / regress / refer) and the serial-HRt recovery curve both require structured session data that paper diaries do not reliably capture.

The need is therefore for a system that (1) makes the band live and visible, (2) sources heart rate from whatever **consumer wearable the patient already owns** (a fitness tracker, chest strap, or camera-PPG — not a listed medical device), (3) never substitutes a fabricated number for a real measurement, (4) carries the protocol's safety logic between visits, and (5) reports structured data back to the supervising clinician. SST Trainer is built to that specification. Its intended users are **registered allied-health clinicians supervising exercise rehabilitation within their scope of practice** — exercise physiologists (the exemplar scope for graded exercise-tolerance assessment as a rehabilitation baseline), and osteopaths, physiotherapists and sports physicians working within theirs — together with their already-diagnosed, exercise-cleared patients executing the program between visits.

---

## 2a. Prior art — what this work extends, not invents

Digital delivery of heart-rate-targeted concussion exercise is **not new**, and we do not claim it. Several published and commercial systems already deliver parts of this workflow, and SST Trainer is positioned as an *extension* of them on a specific axis (signal-integrity safety and measured-threshold anchoring), not as a first mover:

- **Heart-rate-targeted concussion rehab apps already exist.** *Rhea Health* — a **University of Toronto spin-out** (founder Michael Hutchison), *not* affiliated with the Buffalo group — delivers HR-based aerobic prescription, but guides users to a **fixed ~60% ± 5% of age-predicted maximal HR** (220 − age) with **no graded test**; its only individualisation is in-app same/better/worse symptom feedback, and its published formative papers report **no dedicated clinician dashboard** (Chizuk et al., usability study, *JMIR Form Res* 2025;e67275; CARE feasibility study, *JMIR Form Res* 2023;e45321). A separate RCT delivered early aerobic exercise after concussion using a **progressive percentage of age-predicted maximal HR** (*PLOS One*, 2022).
- **Between-visit mHealth monitoring with data return already exists.** Remote patient monitoring of concussed adolescents via an mHealth app (daily symptom reporting, structured return to clinicians) is published (*JMIR-family*, 2024).
- **Wearable-HR-monitored sub-threshold prescription is the trial standard.** The Buffalo RCTs delivered individualised HRt-based home exercise with wearable HR monitoring — 80% of HRt with a Polar HR monitor (*JAMA Pediatr.* 2019) and serial-HRt-updated prescription with weekly BCTT recheck (*Lancet Child Adolesc Health* 2021) — but the Buffalo programme is a research method with no commercial app.
- **A commercial concussion exercise-prescription module exists and reaches Australia.** The **CCMI + Wibbi** partnership (announced 4 December 2025) embeds Complete Concussions' concussion protocols in a digital home-exercise-program platform with care-pathway building and outcome tracking, marketed to CCMI-affiliated clinics including in Australia. CCMI's clinic battery *does* measure HRt via an in-clinic BCTT; the HRt is a one-off, clinic-administered prescription input set on paper, and the digital delivery is exercise-video and rate-of-perceived-exertion (RPE) guided with symptom/outcome tracking, rather than a live wearable-HR-verified zone-training tool or a serial measured-HRt curve.
- **Remote graded testing has one supervised precedent.** The **MOVE protocol** (Teel et al., *J Neurotrauma* 2023; PMID 37212272) delivers a graded exertion test *virtually but under live clinician supervision*, for binary return-to-exercise clearance rather than HRt measurement. Telehealth concussion consensus holds that exertional tolerance testing cannot currently be performed *unsupervised* remotely — a position this paper does **not** claim to have overturned.

What this work contributes, ranked by the weight each claim can bear:

1. **Measured, not estimated, individualised HRt (vs the leading digital app).** Rhea targets a fixed 60% ± 5% of age-predicted maximal HR (220 − age); SST Trainer **delivers** the established sub-threshold band computed from a *measured* symptom-limited HRt (applying Leddy's published 80–90%-of-HRt formula — it executes the consensus protocol, it does not independently prescribe). A measured individualised threshold is, by construction, a more individualised input to that established protocol than a population age estimate. This is a **construct-superiority claim, not an outcome claim** — we do not assert faster recovery.
2. **Clinician-gated, home-capable digital administration of the graded test.** Graded HRt determination is otherwise clinic-administered; the only remote adaptation (MOVE) is clinician-supervised and for binary clearance. We therefore do **not** claim to have made *unsupervised* remote HRt testing valid. We provide a clinician-gated digital administration whose **concurrent validity against the clinic BCTT is the explicit subject of a registered validation study, not a result of this paper.** Validity is scoped as future work, not asserted.
3. **Serial measured HRt as a continuous recovery-trajectory instrument.** Research measures HRt serially to re-prescribe and to predict recovery (Leddy; Haider); commercial tools track symptom/balance scores. We operationalise serial, provenance-verified *measured* HRt as a recovery-trajectory artifact in its own right — making no claim that the trajectory predicts or guarantees recovery.
4. **Verification-gated progression (a genuine pillar) on a fail-closed signal layer (supporting).** Two distinct things sit here. The *pillar*: dose escalation is gated on provenance — only a live-verified wearable session advances the training band, the band is capped at the measured HRt (returning a retest signal at the cap), and regression stays ungated (§4.3). To our knowledge no concussion product ties band progression to per-session heart-rate verification in this way. The *supporting layer*: the fail-closed signal architecture beneath it — non-interpolating (unlike consumer wearables that interpolate gaps) emission gated on validated provenance across BLE / camera-PPG / manual. The signal-quality components are established prior art; the contribution is their *composition* and their coupling to the progression gate, not the invention of signal-quality gating or of the "no reading" state.

None of these is an open-source or "first/only" claim; each is scoped to exactly what the cited record supports (see §9).

---

## 2. The protocol it implements (attribution)

The clinical engine is a faithful encoding of the published SSTAE protocol; it invents no physiology. Specifically:

- **Graded test → HRt.** Modelled on the Buffalo Concussion Treadmill Test (BCTT), a standardised graded test built on the cardiac Balke ramp: the patient walks at a fixed starting speed while the treadmill incline is raised by **1 degree each minute** through fifteen stages, after which the **speed** is increased (by a fixed small increment per minute), with heart rate, RPE (Borg) and a 0–10 symptom-severity score recorded every minute (Leddy JJ, Willer B. *Curr Sports Med Rep.* 2013;12(6):370–376). HRt is the heart rate at the first stage where symptoms rise ≥3 points above resting — the validated provocation criterion. The test terminates on symptom provocation (yielding HRt), on voluntary exhaustion (RPE >17 with no provocation), on reaching ≥90% of age-predicted maximal heart rate, or on any red flag.
- **Prescription.** Train at 80–90% of HRt for concussion, ~20 min, most days, with an in-session symptom-stop rule (Leddy JJ, et al. *Clin J Sport Med.* 2021;31(2):e89–e94; standardised-programme variant, *Clin J Sport Med.* 2023).
- **Tolerance band.** The ≤2-point transient symptom worsening tolerated during exercise comes directly from the consensus statement (Patricios et al., 2023); the within-session stop is set at a ≥2-point rise.
- **Serial testing.** Repeating the graded test yields a recovery curve and a return-to-activity signal; the BCTT is reliable as a repeated measure (Leddy JJ, et al. *Clin J Sport Med.* 2011;21(2):89–94).

The clinical constants in code are therefore *citations*, not tunables: a 3-point symptom rise as the provocation criterion, a 2-point within-session stop, an RPE exhaustion marker of 17, and the concussion band of 80–90% of HRt. These published values are stated here; the tuned signal-processing parameters (camera-PPG confidence and periodicity bounds, staleness intervals, progression increments) are implementation trade secrets and are not disclosed.

---

## 3. Architecture overview

The system separates a pure clinical core from all input/output so the same logic runs identically in the web application, the installable progressive web app (PWA), the clinician dashboard, and (future) native wearable apps.

- **The clinical engine** (`lib/sst-trainer/protocol.ts`) — pure functions, no I/O, fully unit-testable: `detectThreshold()`, `computePrescription()`, `progressionDecision()`, provenance-gating (`isVerifiedReading()` / `sessionVerification()`), and serial-test spacing (`canRetest()`), plus the exported clinical constants and the condition-defaults table.
- **The heart-rate hardware abstraction** (`lib/sst-trainer/hr-live.ts`) — capability detection plus real connectors returning a common `LiveHrConnection` interface (`subscribe`, `stop`, `label`): a single Bluetooth entry point dispatches to a native Bluetooth bridge inside the iOS/Android app shell or to Web Bluetooth in a browser, and a camera-PPG connector provides a resting-only estimate.
- **The symptom inventory** (`lib/sst-trainer/symptoms.ts`) — the standard 22-item post-concussion symptom inventory (SCAT6/PCSS) and the SCAT6 emergency red-flag list.
- **Clinic sync** (`lib/sst-trainer/clinic-sync.ts`) — best-effort, fire-and-forget sync of threshold and training events to the prescribing clinic, plus a live in-session tick. Only fires when a clinic code is present.
- **The patient-facing state machine** (`app/platform/app/page.tsx`) — welcome → symptoms → readiness → test → prescription → home → live session → progress, driving the engine with a real live-HR feed.
- **An ephemeral live-monitoring endpoint** (`app/api/sst/live/route.ts`) — short-TTL key-value store so a clinician dashboard can watch active patients in real time.
- **A durable session-history endpoint** (`app/api/sst/clinic-sessions/route.ts`) — session history per clinic, grouped by patient into HRt trajectories, session logs, and a derived clearance-ready flag.

The condition table is parameterised (`concussion`, `mtbi`, `tbi`, `neuro-other`, and conservative expansion presets) so only band/dose *defaults* differ across conditions while the safety logic is shared.

### 3.1 PMS-integration and jurisdiction-toggled reporting

The same separation-of-concerns is applied to output. The clinical core is *payer-neutral*: it produces only measured facts — the serial heart-rate-threshold trajectory, the individualised training band, the verified-session share, and every stop-rule event. A thin **jurisdiction resolver** then maps a locale (AU / NZ / international) to the set of report *skins* a clinician may emit, and each **report skin** is a pure function that renders a structured content model (headings, labelled fields, and narrative) rather than final bytes — so a new report type is a single new function and a new output format (PDF, HTML, or a note written back into a practice-management system) is a single new renderer, neither of which touches the engine. Practice-management-system connectivity sits behind one small **adapter interface** (find patient, read demographics, write note, attach document, and — because no clinical webhooks are assumed — poll appointment attendance), so supporting an additional system such as Cliniko (Australia) or Gensolve (New Zealand, ACC-integrated) is an isolated adapter file registered in one place. Consistent with the claim discipline of this paper, every skin reports only provenance and signal quality (measured versus manually entered heart rate, verified-session share, and which decisions were clinician-directed); no skin asserts an efficacy or diagnostic claim, and all recovery or clearance language is construct-level and explicitly left to the treating clinician. This layer is described here as an architectural property only; the code is closed and no repository link is provided.

---

## 4. The clinical algorithms

### 4.1 HRt detection (`detectThreshold`)

Input is the resting symptom score, the per-minute stages (each with end-of-stage heart rate and 0–10 symptom score), and a termination reason. The algorithm:

1. If the test was terminated for a **red flag**, return immediately with interpretation `red-flag` and a "stop and seek review" message — *no* HRt is produced from an unsafe stop.
2. If there are no stages, return `invalid`.
3. Find the **first** stage whose symptom score minus the resting symptom score is ≥3 points (the published provocation criterion). If found, HRt = that stage's heart rate; interpretation `physiologic` (exercise intolerance present → prescribe SSTAE).
4. Otherwise (reached limit with no ≥3-point provocation): interpretation `no-intolerance` — the symptoms are unlikely to be exercise-driven; redirect the workup (cervical / vestibular / mood). On a *re-test*, this same branch is the recovered/clearance signal.

The function is total and deterministic: every input maps to exactly one of four interpretations, which makes it exhaustively testable.

### 4.2 Individualised band prescription (`computePrescription`)

Given an HRt and a condition, the band is `round(HRt × lowerPct)` to `round(HRt × upperPct)` with a condition-specific dose. For concussion this is 80–90% of HRt, ~20 min, most days of the week, with a within-session stop at a ≥2-point symptom rise. The upper bpm is the explicit *do-not-exceed ceiling*. A human-readable summary string is generated for the patient. No value is hidden or derived by magic — the prescription is a pure function of HRt and the cited published constants.

### 4.3 Progression decision (`progressionDecision`)

Given the current prescription and a recent session history, the engine returns `advance | hold | regress | refer | retest` with an optional new ceiling. Three fail-closed rules make this more than a clean-run counter:

- **Advance is gated on *verified* sessions only.** The clean run that unlocks an advance (ceiling up by a small fixed increment) is counted only over recent sessions whose heart rate was **live-verified against a broadcasting Bluetooth wearable** (`hrVerified !== false`): no next-day flare, within-session rise below the stop threshold, and a required proportion of prescribed minutes completed. A manual, camera-PPG, or stale-feed session (`hrVerified === false`) can *never* count toward the clean run — it cannot push the ceiling up on an unverified number.
- **Regression is never gated.** Flare/safety evidence is counted from *every* session, verified or not: within a recent window, repeated next-day flares or within-session rises reaching the stop threshold trigger a **regress** (ceiling down by the same increment), and a single recent flare forces a **hold**. The window is deliberately *recent-only* so an old, long-resolved flare cannot ratchet the ceiling down forever once the patient is running clean.
- **The ceiling is capped at the measured HRt.** An advance is clamped so the ceiling can never exceed the measured HRt; once the band reaches that threshold the engine returns **retest** rather than advancing — a fresh graded test is the only path to a higher band, so the ceiling never ratchets past the last real measurement.
- **Hold** otherwise, degrading safely on sparse data ("log a few sessions first").

This encodes the clinical rule "advance only after clean *verified* runs; ease back on repeated provocation from any session; and re-measure — never extrapolate — to go higher."

---

## 5. The multi-source heart-rate abstraction

Heart rate is the load-bearing measurement, so sourcing it must be frictionless *and* trustworthy. The abstraction exposes a single `LiveHrConnection` contract and three ways to satisfy it; consuming screens are identical regardless of source.

### 5.1 Bluetooth heart rate (`connectBluetoothHr`)

Uses the **standard** BLE Heart Rate Service (`0x180D`) / Heart Rate Measurement characteristic (`0x2A37`) — the same profile on every platform. A single `connectBluetoothHr()` entry point dispatches to whichever transport is present: a **native Bluetooth bridge** inside the app shell (an iOS/Android Bluetooth-LE plugin under a Capacitor native wrapper, so the web bundle carries no native dependency), or **Web Bluetooth** in an Android/desktop Chrome browser. This is what makes "hardware-agnostic" literally true across platforms — including on iPhone, where Web Bluetooth does not exist and the native bridge is required.

Because the chooser filters on the standard *service* rather than a brand, the operating-system device list shows *any* compliant broadcaster and the user picks theirs; there is no brand lock-in and no per-vendor SDKs. This defines the **verified (live) heart-rate tier**: any device emitting a live standard BLE heart-rate broadcast — chest straps, and wrist/arm wearables placed in broadcast mode (for example Garmin's "Broadcast Heart Rate" mode, Polar, a WHOOP broadcast, Coros, Suunto, Amazfit). Stated honestly, two widely owned wrist devices — **Apple Watch and Fitbit — do not expose a standard BLE heart-rate broadcast**, so those users fall back to a chest strap or manual entry; the tool does not pretend to read them, and it integrates no proprietary vendor cloud API (no HealthKit, Connect IQ, or Fitbit Web API path exists in the live path). The characteristic parser respects the flags byte (8- vs 16-bit value), **guards against malformed/short packets** (returns `null` rather than throwing or emitting garbage) and rejects physiologically implausible values; the native path decodes the plugin's hex-string frames through the same parser. The connection auto-reconnects on a transient GATT drop and tears the hardware down cleanly on `stop()`. The device request is invoked first inside the user-gesture handler, as both APIs require.

### 5.2 Camera PPG — a resting spot-check only (`connectCameraPpg`)

Camera PPG is deliberately scoped to a **resting spot-check**; it is *not* a live-session heart-rate source and can **never** be the verified live source during training. Optical camera PPG is corrupted by motion and is validated only for resting spot measurements, so it is unreliable at exactly the exercising heart rates the training band governs. The engine therefore never uses a camera reading to drive a live training session and — by construction (§4.3; `sessionVerification` marks a session verified only when the source is a live BLE broadcast) — a camera session can never be marked *verified* or advance the band. Used at rest, an estimate is derived from the mean red-channel value per frame (a downscaled frame, with the torch enabled where supported). A rolling buffer is detrended (mean-removed) and analysed by **normalised autocorrelation** over the lag range mapping to a physiologically plausible resting heart-rate band. Two design choices are safety-relevant:

- **Normalisation removes short-lag bias.** Dividing each lag's sum by the number of overlapping terms *and* by signal energy yields a 0–1 coefficient, so the estimate is not biased toward high bpm.
- **A confidence gate refuses weak signals.** A flat/noise-only window (variance below a floor — e.g. the camera isn't covered) and any best-coefficient below the confidence cutoff return `null`. The module emits at roughly 1 Hz with light smoothing, and a periodicity that isn't convincingly present produces *no reading at all*.

This is camera-PPG as used by mainstream consumer health apps, but tuned to *fail closed* and confined to rest. The exact confidence cutoff, lag bounds, buffer length and smoothing are implementation trade secrets and are not disclosed here.

### 5.3 Manual entry

When no wearable is present, the clinician enters bpm by hand and the same engine consumes it. This guarantees the protocol is runnable in any clinic with no hardware at all. A manually entered value is, by design, in the **unverified tier**: it can trigger a hold or regression but can never advance the ceiling.

---

## 6. Safety guardrails (verification-by-design)

The system's safety claims are **structural** — they follow from how the engine is built and unit-tested, not from a trial outcome. To keep them externally checkable despite a closed commercial codebase, the **pure clinical engine** (`detectThreshold`, `computePrescription`, `progressionDecision` and the cited clinical constants — which encode only the published Leddy arithmetic and contain no proprietary signal-processing parameters) is made **available to editors and reviewers for inspection on request**; the tuned signal-processing constants remain proprietary and are not disclosed publicly or in this paper. The properties below are therefore stated as *design-and-test* guarantees a reviewer can verify against that core, not as claims to be taken on trust.

### 6.1 Never fabricate a bpm

There is **no simulated or interpolated heart rate anywhere in the live path.** A bpm is emitted only from (a) a parsed real BLE packet that passed range/length validation, or (b) a real PPG estimate that passed the variance and confidence gates. When neither is available the surface shows an explicit "no reading" state and the dependent logic pauses. This is the central safety property because the prescription is a heart-rate *ceiling*: a fabricated number could wave a patient past their provocation threshold. The threshold test and the live session therefore run on real signal or they wait. We frame this precisely as a **provenance and signal-quality guarantee, not an accuracy guarantee** — the architecture ensures the dependent logic uses only provenance-verified, signal-quality-gated live data; it makes no claim that any individual bpm is accurate to a clinical reference standard, and it surfaces the source (electrical chest strap > optical wrist > camera-PPG, descending accuracy) so the clinician can weight it.

### 6.2 The symptom-threshold stop rule

The within-session stop mirrors the consensus tolerance band: a transient ≤2-point worsening is acceptable, so a rise *reaching* 2 points triggers the stop prompt. Independently, the *red-flag* path (SCAT6 emergency list — worsening headache, repeated vomiting, seizure, focal neurology, slurred speech, increasing confusion/drowsiness, loss of consciousness) halts any test or session and routes to urgent review; a red-flag stop never yields an HRt. These are encoded in the engine and the readiness gate, so they travel with the patient between visits rather than living only in the clinician's verbal instructions.

### 6.3 Staleness watchdog

Liveness is treated as a first-class safety concern at two layers. On the device, the HR feed carries a status so a stale or dropped signal is shown as such rather than silently freezing on the last value. On the server, the live-monitoring endpoint writes each tick to a short-TTL key-value store: if a patient stops ticking they automatically drop off the clinician's live view and stale index members are pruned on read. The clinician therefore sees "currently training" only when the patient genuinely is, never a ghost session. (The exact TTLs are implementation details and are not disclosed.)

### 6.4 Other defensive properties

- **Clinic sync is best-effort and non-blocking.** Clinic sync uses fire-and-forget `fetch` with `keepalive` and swallowed errors: a failed sync can never break or block the patient's session UI. Self-guided users (no clinic code) transmit nothing.
- **Server-side validation.** The live endpoint re-validates bpm into a plausible window and clamps/labels string fields, so a malformed client cannot poison the dashboard.
- **Verified-only advancement (fail-closed progression).** The training band advances only on live-verified Bluetooth sessions and never exceeds the measured HRt (§4.3); manual, camera, or stale-feed sessions can trigger a hold or regression but can never raise the ceiling, and the ceiling never ratchets past the last real threshold measurement. Safety (regression) is ungated; dose escalation is gated on provenance.
- **Totality.** The engine functions are total and deterministic over their input types, enabling exhaustive unit testing of the clinical branches (provoked / exhaustion / red-flag / invalid; advance / hold / regress / refer / retest).

---

## 7. Verification approach

Because efficacy is out of scope, verification targets *correctness of delivery*:

1. **Unit tests of the engine** covering every interpretation and progression branch, the provocation boundary (exactly a 3-point rise), the stop boundary (exactly a 2-point rise), the regression window (recency, repeated flares), and the advance gate (all-clean plus the minutes threshold).
2. **Verification-gating tests** asserting that an unverified session (`hrVerified === false`) never contributes to an advance, that regression counts unverified sessions, that a camera/manual source can never mark a session verified (`sessionVerification`), and that an advance is clamped to the measured HRt — returning `retest` at the cap.
3. **Parser tests** for the BLE Heart Rate Measurement characteristic (8-bit vs 16-bit flag, short-packet rejection, out-of-range rejection).
4. **PPG estimator tests** asserting `null` on flat/noise input, on too-short windows, and on sub-threshold confidence; correct bpm on a synthetic periodic signal.
5. **Endpoint validation tests** for the live and session routes (bpm windowing, field clamping, TTL/staleness behaviour).
6. **Property checks** that no code path can emit a bpm without a corresponding real measurement (no simulated or random source in the live path).

---

## 8. Limitations and scope

Camera-PPG is an estimate and is the least precise source; it is offered as a resting fallback, gated to fail closed, with strap-based measurement preferred. The tool delivers an evidence-based prescription but is **not** itself evidence of a clinical outcome. The strongest underlying SSTAE evidence is in adolescents with early sport-related concussion; adults and persistent-symptom populations are supported but less strongly (see the companion clinical review). The empirical work this development report defers — accuracy, validity, usability, and outcomes — is set out concretely in §8.2.

### 8.1 Regulatory positioning: a clinician-directed assistant, not a medical device

**Intended Use.** SST Trainer is a **clinician-directed, hardware-agnostic exercise-rehabilitation delivery and monitoring tool.** Its primary intended user is a **registered clinician operating within scope — an ESSA-accredited Exercise Physiologist (or equivalent allied-health practitioner)** — working from a diagnosis and an exercise-rehabilitation clearance already made by a GP or sports physician. In that context the graded exercise-tolerance assessment is a **rehabilitation baseline measure** — the intensity an already-cleared patient can train at *now* — **not** a diagnostic or return-to-play determination. The clinician holds all clinical judgement: patient appropriateness, threshold interpretation, band approval/override, progression, and clearance. The software **executes** the published Leddy 80–90%-of-HRt protocol on the measured value and **logs** the trajectory; it does not diagnose, treat, determine medical clearance, or make return-to-play decisions. Heart rate is accepted from **consumer wearables the patient already owns** (BLE fitness trackers, chest straps, or rear-camera PPG) — **none of which are listed medical devices**; the tool does not require or process a signal from a *listed medical device*, but applies its fail-closed verification layer to assess the trustworthiness of consumer-grade input before clinical use.

The argument for staying outside FDA SaMD / TGA medical-device classification rests on the **clinical-decision-support carve-out** (FDA 21st Century Cures Act §3060; TGA's CDS exclusion): the qualified clinician independently makes every clinical decision — interpreting the threshold, approving the heart-rate band, approving each progression, and clearing return to activity — while the software only executes, paces, monitors, and records. It **informs; it never decides.**

Several design choices documented above are deliberately the ones that *support* the non-device argument:

- **The clinician approves the band.** The band is a pure function of a clinician-owned HRt and the cited published constants (§4.2), surfaced for the clinician to approve or override; the software does not autonomously derive a treatment dose from raw patient data.
- **No dependency on a listed medical device.** Heart rate is accepted from consumer wearables or camera-PPG — consumer wellness products, **not** listed medical devices — so the tool does not process a signal from another *medical* device (the relevant CDS-exemption criterion). It is hardware-agnostic by design: no specific listed device is required, assumed, or relied upon.
- **Never fabricate a heart rate (§6.1).** The tool only ever displays a measured bpm and shows "no reading" otherwise, so it presents data rather than synthesising a clinical signal.
- **Symptom-stop and red-flag halt-and-refer (§6.2).** These route the patient back to care rather than the software making a treatment or triage *decision*.
- **Supervision is structural.** Progression is *proposed* for clinician review (§4.3), not applied autonomously; clearance surfaces as a clinician *review flag*, not an automated determination; self-guided use transmits nothing and carries no clinician relationship to monitor.

Honestly stated: this positioning **reduces but does not guarantee** non-device status. Classification is ultimately driven by the **claims made and the stated intended use**, not by architecture alone — which is why the Intended Use statement above is conservative and why no surface claims the tool treats, diagnoses, or clears concussion. A formal **SaMD scoping opinion should be obtained before launch.**

### 8.2 Planned empirical validation

This paper reports a *design and verification* contribution; we state plainly that it carries no efficacy, accuracy, or usability data, and that this is the principal limitation of a development paper at this stage. Three empirical studies are planned as the immediate next work, each scoped to a specific unproven claim above and each requiring its own ethics review before it is conducted:

1. **Camera-PPG resting concurrent validity.** A within-subject agreement study of the *resting* camera-PPG spot-check against a reference electrical chest strap (the accepted ambulatory standard), analysed by Bland–Altman limits of agreement and concordance, with the *fail-closed* "no-reading" rate reported as a primary safety metric. Because camera PPG is scoped to rest only (§5.2), the study validates the resting spot-check and separately *characterises the motion-artefact failure* across the graded-test intensity range — documenting empirically *why* camera PPG is confined to rest and never verifies a session, rather than proposing it as an exercise source.
2. **Concurrent validity of the home/digital graded test against the clinic BCTT.** A registered study comparing the HRt obtained via the digital administration against a same-week clinician-run BCTT — the explicit validity gap named in §1 and §9. Until it reports, home HRt determination is presented as *administration*, not validated *measurement*.
3. **Heuristic usability evaluation** with clinicians and patients (System Usability Scale plus task completion), since faithful delivery depends on the live in-zone feedback being usable under exertion.

Efficacy of the *delivered* programme remains out of scope here and is deferred to a future **retrospective observational analysis** of de-identified routine-care data (serial HRt trajectories, adherence, time-to-clearance) accumulated through normal clinical use — the appropriate, lower-burden vehicle for an outcome signal, and one that does not require a prospective interventional trial. Whether such an analysis qualifies for low/negligible-risk ethics review depends on the data capture not being designed *as* prospective research; that classification question is to be resolved with a research-ethics advisor before any research-purpose data capture is built.

---

## 9. Statement of need (summary)

Clinicians have a replicated, consensus-endorsed treatment (SSTAE) whose effectiveness depends on faithful between-visit delivery within an individualised, invisible heart-rate band and on structured monitoring that ordinary workflows do not provide. Digital tools that deliver HR-targeted concussion exercise, monitor between visits, and return data to clinicians **already exist** (§2a: the Rhea app; mHealth remote monitoring; the wearable-monitored Buffalo trials; the commercial CCMI+Wibbi concussion module). SST Trainer is not the first such tool and does not claim to be. Its contribution is narrower and specific: a pure-function clinical core (HRt detection, band prescription, progression), a hardware-agnostic heart-rate abstraction (BLE / camera-PPG / manual), and explicit verification-by-design safety guardrails.

**Our contribution is the integration, not any one part: to our knowledge no commercially available concussion product combines a *measured* (BCTT-derived, not age-predicted-max) heart-rate threshold, live verification-gated heart-rate-zone training (only real, live-verified wearable sessions advance the band, which is capped at the measured threshold), and a serial measured-HRt clinician trajectory in one hardware-agnostic, clinician-supervised workflow — delivered on a fail-closed layer that refuses to surface a fabricated heart rate.** The closest comparators each hold one or two of these but not the combination: Rhea estimates the HR target and delivers zone work without a measured threshold or a clinician dashboard; CCMI+Wibbi measures HRt once in clinic on paper but delivers the programme as RPE/exercise-video home exercise, not live HR-verified zone training, and does not render serial measured HRt as a trajectory; the Buffalo research protocol measures HRt serially but only to re-prescribe, and has no commercial app; assessment platforms (Sway, C3 Logix, HeadCheck, ImPACT) track symptoms/cognition/balance and none provide HR-guided exertion therapy. What is new is the *combination* — measured-HRt anchoring, verification-gated progression, a serial measured-HRt trajectory, hardware-agnostic sourcing, clinician-gated administration, and fail-closed signal provenance, assembled as one standardised supervised workflow — none of whose individual parts we claim to have invented. The fail-closed verification layer is one honest component of that integration, not, on its own, the headline.

Stated as a **design claim, not a truth claim**: the contribution is *an architecture that ensures progression decisions use only provenance-verified, signal-quality-gated live data*. It is explicitly **not** a claim that the data are accurate to a clinical reference standard, that the right patient was measured, or that the prescribed exercise was performed — provenance and signal quality are verifiable by construction; accuracy, identity, and adherence are not, and we do not assert them. SST Trainer is developed by Concussion Education Australia as the Australian-market instantiation of an established protocol for an endorsed allied-health network, not as a global platform.

---

## Declarations

**Competing interests.** The author (ZL) is the developer of the SST Trainer software and founder of Concussion Education Australia, which develops and commercialises it, and therefore has a direct commercial interest in the software this paper describes. To limit overclaiming, no efficacy, accuracy, or clinical-outcome claim is made for the software; the underlying clinical protocol is fully attributed to Leddy and colleagues and separated from the engineering contribution; and every differentiation claim is bounded against named prior art (§2a, §9) rather than asserted as a bare "first" or "only." No other competing interests are declared.

**Funding.** This work received no specific grant from any funding agency in the public, commercial, or not-for-profit sectors; it was conducted independently by the author.

**Ethics approval.** Not applicable. This is a software development and verification report involving no human participants, no human data, and no patient data. It reports no pilot, usage, or outcome study; the empirical studies named in §8.2 will each require their own ethics review before they are conducted.

**Data availability.** No new empirical or patient data were generated or analysed; all clinical sources are cited in the reference list. SST Trainer is a closed-source commercial product and its source code is not publicly available. The pure-function clinical engine — encoding only the published clinical constants and containing no proprietary signal-processing parameters — can be made available to editors and reviewers on request for verification; tuned signal-processing parameters are retained as trade secrets.

**Author contributions.** ZL is the sole author and designed the software, conceived the verification approach, and wrote the manuscript.

---

## Key references

1. Leddy JJ, Haider MN, Ellis MJ, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial. *JAMA Pediatr.* 2019;173(4):319–325.
2. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799.
3. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711.
4. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376.
5. Leddy JJ, Haider MN, Hinds AL, Willer B. Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting. *Clin J Sport Med.* 2021;31(2):e89–e94.
6. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. Reliability of a graded exercise test for assessing recovery from concussion. *Clin J Sport Med.* 2011;21(2):89–94.
7. Chizuk HM, et al. [Rhea concussion rehabilitation app — usability study]. *JMIR Form Res.* 2025;e67275.
8. Teel EF, et al. [MOVE protocol — virtually supervised graded exertion test]. *J Neurotrauma.* 2023. PMID 37212272.
9. Haider MN, Leddy JJ, et al. The Predictive Capacity of the Buffalo Concussion Treadmill Test After Sport-Related Concussion in Adolescents. *Front Neurol.* 2019;10:395.

---

## ⚠️ CLAIMS TO VERIFY BEFORE SUBMISSION

Every item below is a factual, statistical, technical, or bibliographic claim in the manuscript that could **not** be tied to a citation present in the source docs, or that depends on a fast-moving external fact. A human should confirm each before submitting.

**Statistical / quantitative**
1. **Rhea target "60% ± 5% of age-predicted maximal HR (220 − age)."** Attributed in the novelty doc to Chizuk et al. 2025 / CARE 2023, but the exact percentage and ± band should be confirmed against the primary papers before it goes in print.
2. **"Age-predicted maximum can deviate from an individual's true maximum by ±10–12 bpm"** — this magnitude appears in `09-novelty-verification.md` without a primary citation. It is NOT stated in the manuscript body (removed to avoid an uncited statistic) but confirm you do not want it added with a source (e.g. Tanaka/Nes HRmax literature). If added, it needs a citation.
3. **BCTT speed increment after the incline stages** — the manuscript says "speed is increased (by a fixed small increment per minute)." The exact value (memory notes +0.4 mph/min) was deliberately left non-specific; confirm whether to state the precise +0.4 mph/min and cite Leddy 2013.

**Technical / factual (fast-moving; verify at submission date)**
4. **"Apple Watch and Fitbit do not expose a standard BLE heart-rate broadcast."** True as of writing per the claim rules, but this is a device-capability claim that firmware can change — reverify before print.
5. **Named broadcasters (Garmin "Broadcast Heart Rate" mode, Polar, WHOOP broadcast, Coros, Suunto, Amazfit).** Confirm each currently exposes a standard BLE HR broadcast (some only in a specific mode). WHOOP "Broadcast" and Garmin "Broadcast Heart Rate" mode specifically should be double-checked.
6. **BLE Heart Rate Service `0x180D` / Heart Rate Measurement characteristic `0x2A37` and the 8/16-bit flags-byte behaviour.** Standard GATT (public Bluetooth SIG spec) — accurate, but worth a final cross-check against the current spec.
7. **"Camera-PPG as used by mainstream consumer health apps."** The draft's earlier reference to a specific named product (Visible) for HRV estimation has been generalised to "mainstream consumer health apps" to avoid an uncited third-party product claim. Confirm you are comfortable with the generalised wording, or add a citation if you want a named example back.

**Bibliographic (complete before submission — JMIR requires full Vancouver references with DOIs)**
8. **Full reference details for Chizuk et al. 2025 (ref 7), Teel et al. 2023 / MOVE (ref 8), and the CARE 2023 feasibility study** — author lists, article titles, volumes, and DOIs are placeholders and must be completed.
9. **CCMI + Wibbi partnership date "4 December 2025"** — cited to the wibbi.com announcement in the source docs; add the formal citation/URL and confirm the date.
10. **PLOS One 2022 age-predicted-max RCT, and the 2024 JMIR-family mHealth remote-monitoring study** — referenced in §2a without full bibliographic detail; complete or drop.
11. **Companion papers (Paper 1 clinical review; Paper 3 protocol framework)** — the manuscript refers to "the companion clinical review"; insert their DOIs/citations once those are live (per venue strategy, Paper 2 cites Papers 1 and 3).

**Editorial / positional decisions (not factual errors, but confirm intent)**
12. **JMIR article-type label.** The pack uses "Original Paper — development and implementation report." Confirm the exact article type JMIR mHealth and uHealth expects for a code-closed software-development description (JMIR's current type list should be checked on the submission portal).
13. **Offer to share the pure clinical engine with editors/reviewers on request (§6, Data availability).** This is a deliberate reviewer-transparency device that discloses only the non-secret published-constant arithmetic. Confirm you accept even this limited disclosure given the closed-code / trade-secret posture.
14. **File/module paths** (e.g. `lib/sst-trainer/protocol.ts`) are named for rigor. They reveal internal structure but no repository location and no tuned constants. Confirm you are comfortable keeping them, or replace with prose component names.
15. **Intended-use / regulatory language (§8.1).** The FDA §3060 / TGA CDS carve-out positioning is legal-adjacent; consider a compliance/regulatory read before submission (a SaMD scoping opinion is already flagged as pre-launch, but the *paper's* framing should be sanity-checked too).
