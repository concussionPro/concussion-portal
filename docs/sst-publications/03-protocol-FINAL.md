# A standardised, clinician-directed digital workflow for delivering sub-symptom-threshold aerobic exercise after concussion

**Zac Lewis**¹

¹ Concussion Education Australia Pty Ltd, Australia. ORCID: [0009-0002-4267-0451](https://orcid.org/0009-0002-4267-0451)

**Corresponding author:** Zac Lewis, Concussion Education Australia Pty Ltd, Australia. Email: z.lew87@gmail.com

**Article type:** Protocol / delivery-framework paper (a described clinical workflow; *not* a trial protocol, and *not* an effectiveness study)

**Target venue:** *JMIR Research Protocols*

**Keywords:** concussion; mild traumatic brain injury; sub-symptom-threshold aerobic exercise; Buffalo Concussion Treadmill Test; heart-rate threshold; exercise intolerance; digital health; wearable; exercise physiology; clinical workflow; return to sport; return to learn

**Version note.** This manuscript supersedes an earlier draft of the same workflow, including a version previously deposited to protocols.io. The earlier version described procedural detail that the reference implementation does not perform. Every operational statement in this version has been checked line-by-line against the implementing source code, and the corrections are enumerated in the appendix, "Changes from the prior draft." Where the implementation departs from the published Buffalo procedure, that departure is stated as a departure rather than smoothed over.

---

## Abstract

**Background.** Early sub-symptom-threshold aerobic exercise (SSTAE) is a consensus-endorsed treatment for sport-related concussion. In the pivotal randomised trial, adolescents aged 13–18 years (n=103) randomised to individualised sub-threshold aerobic exercise recovered in a median of 13 days (IQR 10–18.5) versus 17 days (IQR 13–23) for a placebo-like stretching programme (P=.009). The treatment nonetheless remains difficult to deliver faithfully in routine care, because it depends on an individualised heart-rate ceiling that must be respected on unsupervised between-visit sessions, and because the structured data required to progress the dose safely — heart rates achieved, minutes completed, symptom deltas, next-day flares, and serial threshold measurements — is routinely lost outside a research setting.

**Objective.** To specify a standardised, clinician-directed digital workflow for between-visit delivery of an already-established exercise prescription: its roles, its captured data, its decision rules, its safety logic, and its stopping criteria — and to state plainly what the workflow does *not* specify where the evidence is silent, and where the reference implementation departs from the published clinic procedure.

**Methods.** We operationalise the published SSTAE prescription and the 6th International Consensus Statement (Amsterdam 2022/2023) into a repeatable five-stage sequence, anchoring each stage and each prescription parameter to a primary published source. Parameters are cited exactly and are not ramped, interpolated, or severity-adjusted beyond what the sources state. Each operational claim below was verified against the implementing source code of one reference implementation; discrepancies were resolved in favour of the code and are disclosed.

**Results.** The workflow comprises five stages: (1) baseline and safety screen, including a red-flag gate and a resting-symptom gate; (2) an operator-executed graded ramp with standardised per-minute step-up prompts, modelled on the ordinal structure of the Buffalo Concussion Treadmill Test, to a *measured* heart-rate threshold (HRt) defined as the heart rate at the first minute whose 0–10 symptom score rises ≥3 points above the resting baseline; (3) an individualised band prescription of 80–90% of HRt, 20 minutes, most days, with a within-session stop at a ≥2-point symptom rise; (4) live-monitored between-visit rehabilitation with a structured session log, provenance-verified heart rate, structured return of data to the prescriber, and a clinician-reviewable advance/hold/regress/rest/refer/retest proposal; and (5) graded return, in which serial HRt forms an objective trajectory and a re-test that no longer provokes symptoms is surfaced as a clearance-*review* flag for the clinician. Three properties characterise the framework relative to the closest named comparators: a measured rather than age-predicted heart-rate anchor; verification-gated progression, in which only live-verified wearable sessions may raise the band and the band is capped at the measured threshold; and a fail-closed signal rule under which no heart-rate value is displayed unless it was actually measured.

**Conclusions.** Digital delivery of heart-rate-targeted concussion exercise is not new, and this paper makes no claim of being first. The contribution is standardisation: a defined, repeatable, safety-anchored workflow that makes an established prescription deliverable and auditable between visits. The workflow makes **no** effectiveness claim of any kind for the software; its scope is delivery and verification, not efficacy. Concurrent validity of the home-administered graded test against the clinic-administered Buffalo Concussion Treadmill Test is unvalidated and is the subject of a separate registered study.

**Trial registration:** Not applicable. **IRRID:** Not applicable.

---

## 1. Background and rationale

Concussion management has moved from rest-until-symptom-free to early, individualised active rehabilitation [1,2]. The mechanism most directly addressed by aerobic rehabilitation is a provocable autonomic and cerebrovascular phenotype — *exercise intolerance* — which is quantifiable as a heart-rate threshold (HRt) on a standardised graded exertion test [3], and which is treatable by aerobic exercise dosed just below that threshold. The 6th International Consensus Statement recommends relative rest for 24–48 hours followed by early prescribed sub-symptom-threshold aerobic activity, tolerating a transient symptom increase of no more than 2 points on a 0–10 scale that settles within approximately an hour [4].

The evidence for the treatment itself is reasonably strong in adolescents with acute sport-related concussion. In the pivotal randomised clinical trial, 103 adolescents aged 13–18 years were randomised within 10 days of injury to individualised sub-threshold aerobic exercise or to a placebo-like stretching programme; the exercise group recovered in a median of 13 days (IQR 10–18.5) versus 17 days (IQR 13–23), P=.009 [5]. A second, independent randomised trial subsequently reported a reduced incidence of persistent post-concussive symptoms with early targeted heart-rate exercise relative to placebo stretching [6].

What is *not* solved is delivery fidelity. Those trials worked because participants adhered to an individualised heart-rate ceiling during home sessions performed under structured oversight, with wearable heart-rate monitoring and serial re-testing. In routine care almost none of that survives. The ceiling is invisible to the patient the moment they leave the clinic; the home sessions are unobserved; adherence is self-reported at the next visit, if at all; and the structured data a clinician would need in order to progress the dose safely — heart rates actually achieved, minutes actually completed, symptom deltas, next-day flares, and serial HRt — is simply not captured. A clinician who prescribes "twenty minutes a day at 128–144 bpm" on paper has, in practice, no way of knowing what happened.

This paper specifies a workflow intended to close that delivery gap: one that makes the band live and visible during the session, sources heart rate from consumer wearables the patient already owns, never fabricates a heart-rate value, and returns structured session data to the prescriber. It is a delivery framework. It is not an efficacy study, and it makes no claim that delivering the prescription this way improves any clinical outcome.

---

## 1a. Prior art and the nature of the contribution

This is a *standardisation* paper, and that framing is deliberate rather than modest. Digital delivery of heart-rate-targeted concussion exercise already exists, and we make no first-of-its-kind claim of any sort.

- Concussion rehabilitation applications already deliver heart-rate-targeted aerobic prescription using **age-predicted maximal heart rate**. The Rhea concussion rehabilitation app (Rhea Health Inc., a University of Toronto spin-out — not affiliated with the Buffalo group) prescribes aerobic exercise at a fixed 60% ± 5% of 220 − age and does not administer a graded exertion test to measure an individualised threshold; individualisation comes from in-app same/better/worse symptom feedback, and its published formative papers describe no dedicated clinician dashboard [7]. A separate randomised controlled trial delivered early aerobic exercise using a progressive percentage of age-predicted maximal heart rate [8].
- Between-visit mHealth symptom monitoring with structured return of data to clinicians is published for concussed adolescents [9].
- The pivotal Buffalo trials themselves delivered HRt-based home exercise with wearable heart-rate monitoring and serial graded re-testing [5,6] — but as research methods, not as a deployable product.
- A commercial concussion exercise-prescription module is in market and reaching Australia: Complete Concussions administers the Buffalo Concussion Treadmill Test to identify a patient's heart-rate threshold in-clinic and, via its December 2025 Wibbi partnership, delivers individualised sub-threshold programmes as RPE- and exercise-video-guided home-exercise prescriptions with symptom and outcome tracking inside a certification-gated proprietary platform; its digital leg is not described as a live heart-rate-monitored zone-training tool.
- Remote *administration* of graded exertion testing has one published adaptation. The MOVE protocol (Teel et al., *J Neurotrauma* 2023; PMID 37212272) is a seven-stage, no-equipment graded exertion test delivered live over video with clinician supervision, whose declared purpose is binary clearance to high-intensity exercise rather than measurement of an individualised HRt for sub-threshold prescription.

Against that background, the defensible contribution is **standardisation, not first-ness**: a single, repeatable, safety-anchored sequence organised around three properties that the named comparators do not standardise around.

First, a **measured rather than estimated** heart-rate anchor. The Rhea app prescribes at a fixed percentage of age-predicted maximal heart rate (60% ± 5% of 220 − age) [7] rather than at a percentage of an individually measured, symptom-limited threshold. A measured symptom-limited HRt is *by construction* a more individualised prescription input than a population age estimate, which can deviate from an individual's true maximum by roughly ±10–12 bpm. This is a construct claim about the input, not an outcome claim; we do not assert that patients recover faster on a measured threshold, because we have no data for that.

Second, **verification-gated progression**: only sessions whose heart rate was verified against a live wearable stream may raise the training ceiling, and the ceiling may never exceed the measured HRt.

Third, a **fail-closed signal rule**: a heart-rate value is displayed only when it originates from a validated real measurement, and the threshold-dependent logic pauses on a "no reading" state rather than acting on an interpolated or estimated value. Every component of signal-quality gating is established prior art; the claim here is composition, not method. The one citable distinction is directional: consumer wearables generally fail *open*, interpolating across gaps, whereas here the dependent clinical logic halts, because the prescription is a do-not-exceed ceiling and a fabricated value is a defined safety hazard.

To our knowledge, and bounded by these named comparators, the symptom-limited heart-rate threshold has otherwise been determined by clinician-supervised, in-clinic graded exertion; the only remote adaptation, the virtually-supervised MOVE protocol (Teel et al., 2023; PMID 37212272), targets binary return-to-exercise clearance rather than measuring an individualised HRt. This workflow operationalises graded HRt testing as a clinician-enabled, home-capable digital test — with concurrent validation against the clinic Buffalo Concussion Treadmill Test explicitly scoped as future work (§7). We do not claim that a home-administered test measures HRt as accurately as the clinic reference standard. That question is open.

---

## 2. Design principles

**2.1 Clinician-directed, not consumer self-managed.** A registered clinician confirms that the patient is appropriate for graded exercise rehabilitation, enables and oversees the threshold test, interprets it, owns the prescription, reviews each progression, and makes every clearance and return-to-activity decision. The software executes, paces, monitors, and records. It informs; it does not decide.

The supervision model is clinician-*directed*, not clinician-*present*. As in all between-visit rehabilitation, the clinician exercises judgement at the point of direction — assessing appropriateness and instructing the programme — after which the patient implements it at home, unsupervised, and the clinician reviews at the next contact. The software's encoded stop rules (the symptom-provocation threshold, the within-session symptom-rise stop, and the red-flag halt-and-refer path) are guardrails that operate in the clinician's absence. They do not replace the clinician's appropriateness decision; they execute the limits the clinician directed.

**2.2 The intended primary user is a registered exercise physiologist, and the graded test is a rehabilitation baseline measure.** The framework assumes an ESSA-accredited exercise physiologist (or equivalently scoped clinician) working from a diagnosis already made by a general practitioner or sports physician, and from an existing clearance for exercise rehabilitation. In that context the graded test is *not* a diagnostic provocative test — the diagnostic question has already been answered — but a rehabilitation baseline measure answering a different question: at what intensity can this already-diagnosed, exercise-cleared patient safely train *now*? Same physical procedure; different clinical meaning and scope context. This framing is load-bearing for §7's regulatory positioning, and it is the accurate description of the intended workflow rather than a regulatory dress-up. The honest bound survives the reframe: the physical provocation is identical regardless of who supervises it and why, so the safety consideration does not disappear. What the framing settles is *who holds the clinical judgement about appropriateness* — clearly the clinician, not the software.

**2.3 Heart-rate-anchored and individualised on a measured threshold.** Every dose is derived from the patient's own HRt, not from an age-predicted formula. Where graded testing is unavailable, a published standardised programme exists and may seed the band conservatively [10]. The percentage-of-HRt band is the only individualisation the evidence supports (§7).

**2.4 Real signal or no signal, and only verified signal advances the dose.** Heart rate is displayed only when actually measured. Bluetooth Low Energy heart-rate packets are range- and length-checked before use. Camera photoplethysmography returns *no value* rather than a guess when its periodicity confidence falls below threshold, and is restricted to a resting spot-check: it is excluded from every exertion screen because motion artefact makes it unreliable during exercise. Loss of signal clears the on-screen value rather than holding the last-known number. Progression is stricter still: only a session sourced from a live Bluetooth stream, with at least 80% of its readings matching a fresh live feed at the moment of logging, may raise the ceiling. Manual entry can never be verified.

**2.5 Safety logic travels with the patient.** The within-session symptom-stop rule and the red-flag halt-and-refer path are encoded in the tool rather than left to recalled verbal instruction.

**2.6 Reduce, don't rest — with one declared departure.** After a single symptom flare, the response is to continue daily sub-threshold exercise at *reduced* intensity, not to prescribe a rest day; the only prohibition is sustained supra-threshold exercise [11]. The framework departs from this in one specific circumstance — two consecutive flaring sessions — and labels that departure as a design decision rather than an evidence-derived rule (§3, Stage 4; §7).

**2.7 Active rehabilitation, not pacing.** The band is a training target to be progressively raised, not an exertion alarm (§6).

---

## 3. The five-stage workflow

### Stage 1 — Baseline and safety screen

- **Symptom profile.** The patient selects, from the standard post-concussion symptom inventory, the symptoms they actually experience, so that subsequent per-minute prompts ask only about relevant symptoms.
- **Red-flag gate.** Before any exertion, the patient is screened against the emergency red-flag list (severe or worsening headache, repeated vomiting, seizure, focal weakness or numbness, slurred speech, increasing confusion or drowsiness, loss of consciousness). Any positive blocks the test and routes to urgent medical review. A red-flag termination additionally sets a lock that blocks all further testing until a clinician has reviewed the patient and cleared them to resume.
- **Resting-symptom gate.** A 0–10 resting symptom score is captured immediately pre-test. It is the reference value for the provocation criterion. A resting score of **8 or above blocks testing entirely** — today is not a test day.
- **Heart-rate source pairing.** The patient pairs a Bluetooth wearable (the only source that can support verified progression), or the clinician selects manual entry. Camera photoplethysmography is available as a resting spot-check only and is not offered on any exertion screen.
- **Re-test spacing.** Where this is not a first test, the spacing gate applies: at most one graded test per calendar day, with no exceptions, and a minimum of **48 hours** between tests unless the clinician directs otherwise or the patient's band was just regressed.

*Role:* clinician confirms appropriateness and enables the test; patient executes. *Stopping criterion:* any red flag, or a resting symptom score ≥8 → exit; no test.

### Stage 2 — Graded ramp to a measured heart-rate threshold

**What is implemented, stated precisely.** The test is an **operator-executed graded ramp with standardised per-minute step-up prompts, modelled on the ordinal structure of the Buffalo Concussion Treadmill Test** [3]. Stages are one minute long (60 seconds, fixed in production), to a maximum of 20 stages. At each stage boundary the tool issues a standardised instruction to increase the workload by one increment — in the reference implementation, "increase the incline one notch" for the first fifteen minutes, and thereafter an instruction to hold the incline and increase speed instead. The ordinal shape of the Buffalo ramp is therefore preserved.

**Two properties of this must be stated plainly rather than implied.** First, **the Balke ramp is not implemented as a quantified protocol**. No speed, gradient, or power value is set, verified, or recorded anywhere in the workflow. The workload is executed by the patient on whatever equipment they are using, and the magnitude of "one notch" is not standardised across patients or across sessions. The workload is therefore **unquantified and unrecorded**; the only recorded exposure variables are elapsed minutes and the physiological and symptom response. Second, the **exercise modality** (treadmill, bike, walk, or other) is recorded as metadata for the clinician and is *not* read by the threshold-detection logic; the same detection rule applies regardless of modality.

**What is recorded each minute.** Heart rate at the end of the stage, a 0–10 overall symptom severity score, and the specific symptoms the patient tapped from their pre-selected list. Rate of perceived exertion is **not** recorded per minute. Instead, an **exhaustion marker** is captured as a single end-of-test determination: the patient may declare that they have reached their limit, which stamps the test as exhaustion-limited (an RPE >17 equivalent on the Borg 6–20 scale [3]) and logs the current stage as final. This is a deliberate simplification of the clinic procedure and a departure from it; it means the workflow carries no per-minute perceived-exertion curve.

**Threshold definition.** HRt is the heart rate recorded at the **first stage at which the symptom score rises ≥3 points above the resting baseline** — the validated diagnostic provocation criterion [3]. Note the deliberate distinction from the ≥2-point within-session *training* stop rule of Stages 3 and 4: the two thresholds are different numbers serving different purposes and must not be conflated.

**Interpretation, and its limits.** Three interpretations are produced:

- **Physiologic** — a ≥3-point rise occurred; HRt is obtained; proceed to prescription.
- **Red flag** — the test was halted for a warning symptom. No HRt is produced from an unsafe stop, and the red-flag branch short-circuits before any threshold detection is attempted.
- **No-intolerance** — no ≥3-point rise occurred. On a first test this suggests the patient's symptoms are unlikely to be driven by exercise intolerance, and the workup should be redirected (cervicogenic, vestibular, mood). On a re-test, it is the recovery signal.

**An important limitation of the implemented classification must be disclosed here rather than in the limitations section alone.** Termination type does *not* gate the no-intolerance classification. A test that the patient voluntarily stopped early, a test that ran to the 20-stage maximum, and a test terminated at genuine volitional exhaustion all classify identically as **no-intolerance**, because the rule is simply the absence of a ≥3-point rise. Since a no-intolerance result on a re-test is what raises the clearance-review flag, an under-exerted test can in principle produce a spuriously reassuring result. Two mitigations apply, and neither eliminates the problem: the result is a *review flag* only, requiring a clinician to inspect the stage table and sign off before it carries any clearance meaning; and on ingest the server independently re-derives the interpretation and HRt from the raw stage data rather than trusting the client's claim, overwriting the client's interpretation, HRt, and band with the server-derived values. A clinician reviewing a no-intolerance result should therefore inspect the stage count, the peak heart rate, and the exhaustion marker before treating it as evidence of recovered tolerance.

**Prognostic flag (recorded; never a dose input).** An absolute HRt below **135 bpm** at presentation is associated with prolonged (>30-day) recovery [12]. The workflow surfaces this to the clinician as a prognostic signal. The published criterion also includes a blunted heart-rate response (threshold minus resting ≤50 bpm), and the reference implementation contains that arm of the rule — but no resting heart rate is captured anywhere in the current workflow, so **only the absolute HRt <135 bpm criterion is operative**. We state this rather than claiming the composite Haider criterion is applied, because it is not.

The flag is **prognostic only and is never a dose modifier**, by explicit design. There is no published rule that shortens the starting dose according to severity of exercise intolerance, so the workflow does not invent one; it surfaces the risk and hands dose judgement to the clinician (§7).

*Role:* clinician enables the test and interprets the termination. *Output:* HRt in bpm plus an interpretation, synced to the clinic record as the first point on the recovery trajectory.

### Stage 3 — Individualised band prescription

The concussion prescription, taken directly from the cited literature and not adjusted:

- **Intensity: 80–90% of HRt.** The 80% floor was the intensity used in the pivotal randomised trial [5]; the 80–90% band is the operational range in the practice literature [11,13]. The workflow computes the lower bound as 80% of HRt and the upper bound as 90% of HRt, each rounded to the nearest bpm. The upper bound is an explicit do-not-exceed ceiling; the lower bound guarantees a therapeutic stimulus. **No floor or clamp is applied**: a low measured HRt yields a correspondingly low absolute band, and that gentleness *is* the individualisation the evidence supports.
- **Duration: 20 minutes per day, fixed from day one.** Session length is not ramped over the programme. This is a common point of clinical error: progression is by heart rate, not by lengthening the session [13].
- **Frequency: most days.** The reference implementation prescribes 6 days per week, within the 5–7 days per week ("daily / most days") range used in the trials and the practice literature [5,13]. No rest days are scheduled.
- **Within-session stop rule: a ≥2-point symptom rise** above the pre-session score on the 0–10 scale [5], consistent with the consensus tolerance band [4]. This ≥2-point *training* threshold is deliberately lower than, and distinct from, the ≥3-point *diagnostic* threshold of Stage 2.
- **Other conditions.** The engine carries more conservative band and dose presets for moderate-to-severe traumatic brain injury and other neurological and non-neurological rehabilitation contexts, sharing the identical safety logic and differing only in the percentage band and dose defaults. **None of these presets is validated by the concussion trials**, and they are outside the scope of this paper.

*Output:* a plain-language prescription the patient can follow, and a structured band (lower and upper bpm) that the tool enforces live.

### Stage 4 — Live-monitored between-visit rehabilitation

This is the stage that no paper prescription can deliver.

- **Live band feedback.** During each home session the measured heart rate is displayed against the band in real time as *under / in-zone / over*, so the patient can self-dose to an otherwise invisible ceiling. If the signal is lost, the displayed value is cleared rather than held.
- **Within-session stop rule.** If symptoms rise ≥2 points above the pre-session score, the tool prompts the patient to stop, encoding the consensus tolerance band rather than relying on recall.
- **Structured session log.** Each session records average and peak heart rate, **actual elapsed minutes completed** (never the prescribed target), pre-session and peak symptom scores, whether the session ended on the stop rule, an immediate post-session self-report, a next-day check-in, time-in-zone, and the verification status and verified-reading percentage of the heart-rate data.
- **Return to the prescriber.** Where the patient has entered a clinic code, every threshold test and training session syncs to the clinician dashboard: HRt trajectory, band, minutes, symptom deltas, and flares. A short-lived live tick lets the clinician observe an in-progress session and drops the patient from the live view when the session ends. **Patients operating self-guided, without a clinic code, transmit nothing; all state remains local to the device.**
- **Progression: by heart rate, clinician-reviewable, and verification-gated.** In the trials, progression is by heart rate — the ceiling rises as tolerance improves while the session stays at approximately 20 minutes [5,6,13]. The workflow operationalises this as a proposal for clinician review, evaluated in the following order:
  1. **No session history** → hold.
  2. **Two consecutive flaring sessions** → **rest**. Take a rest day, reduce the ceiling by 5 bpm (floored at the lower bound of the band), and check in with the clinician before resuming. *This is a design decision, not a trial-specified rule* — see §7.
  3. **Two or more flaring sessions within the last three** → **regress**: reduce the ceiling by 5 bpm and continue daily exercise at the reduced intensity.
  4. **Any single recent flare** → **hold** until a clean run is achieved.
  5. **Otherwise, advance** if and only if the last **three verified** sessions were all clean *and* each completed at least **80% of the prescribed minutes**. The ceiling rises by **5 bpm**, capped at the measured HRt.
  6. **At the cap** — where the ceiling has reached the measured HRt — the proposal becomes **retest** rather than advance. A fresh graded test is the only route to a higher band.

  A session counts as a flare if the patient reported feeling worse at the next-day check-in, or if the peak symptom score rose ≥2 points above the pre-session score.

  **The verification gate is deliberately asymmetric.** Only sessions verified against a live Bluetooth wearable stream — at least 80% of readings matching a fresh live feed at the moment of logging — count as evidence for an *advance*. Manual and camera-sourced sessions can never advance the band. But *every* session, verified or not, counts as evidence for a *rest* or *regress* decision. Safety evidence is never gated on provenance; only dose escalation is.

  The regression window is bounded to recent sessions, so that an old, long-since-resolved flare cannot ratchet the ceiling downward indefinitely once a patient is running clean.

- **Re-test cadence.** Graded re-testing is weekly in the trial protocols and one-to-two-weekly in clinical practice, subject to the 48-hour minimum spacing and the one-test-per-day rule of Stage 1.

*Role:* patient executes; clinician monitors and approves progression. *Stopping criteria:* red flag at any point; repeated provocation → rest, regress, or referral.

### Stage 5 — Graded return

- **Serial HRt as the objective recovery trajectory.** Repeated graded testing tracks the threshold rising toward, or reaching, no-provocation. The Buffalo test is reliable as a repeated measure [14], which is what licenses serial testing as a trajectory rather than a series of unrelated snapshots.
- **Clearance-review signal, not clearance.** A re-test returning *no-intolerance* surfaces automatically as a clinician clearance-**review** flag. Given the classification limitation described in Stage 2, this flag is explicitly not a clearance determination and must be interpreted alongside the stage table.
- **Integration with the consensus return strategy.** Clearance to progress aerobic load feeds into the consensus graded return-to-sport and return-to-learn strategy [4] — stepwise, symptom-limited progression through activity stages with the same tolerance rule — which remains a clinician-led decision. The workflow supplies objective aerobic-tolerance evidence. It does not, by itself, clear an athlete for contact, and no output of the software should be read as doing so.

---

## 4. Roles, data, and governance

**Prescriber (clinician).** Confirms suitability for graded exercise rehabilitation; enables and oversees the threshold test; interprets the result including the termination context; owns the prescription and may override the computed band; reviews each progression proposal; makes the clearance and return-to-activity decisions.

**Patient.** Executes home sessions within the band, logs symptoms, answers the next-day check-in, and reports flares.

**Data captured.** HRt and serial re-tests with their interpretations and stage tables; the prognostic flag; the prescribed band; per-session average and peak heart rate, actual completed minutes, pre- and peak-symptom scores, end-of-session and next-day self-reports, time-in-zone, and the verification status and verified-reading percentage of each session; timestamps throughout.

**Data flow and integrity.** Patient-to-clinic transmission occurs **only** where a clinic code has been entered; it is best-effort and non-blocking, so a transmission failure never blocks the patient's session. Live session ticks are ephemeral and short-lived; session history is durable. On ingest of a threshold test, the server independently re-derives the interpretation and HRt from the raw stage data using the same detection function the client ran, and the server-derived values overwrite the client-supplied interpretation, HRt, and band; the band is recomputed from the server-derived HRt so the two cannot drift apart. Mismatches between the client's claim and the server's derivation are logged as warnings; this is a defence against a tampered or out-of-date client, and it should not be characterised as a durable audit trail — it is not one.

**Consent and governance.** Patient consent and clinic data-contribution terms are specified in a separate companion document and are referenced rather than reproduced here.

---

## 5. Decision rules at a glance

| Situation | Rule | Action |
|---|---|---|
| Red flag at screen or mid-test | Emergency red-flag list positive | Halt; no HRt produced; urgent medical review; testing locked until clinician clearance |
| Resting symptom score ≥8/10 pre-test | Readiness gate | Testing blocked; not a test day |
| Test within 48 h of the last, or same calendar day | Re-test spacing | Blocked (48 h overridable by clinician direction or a just-regressed band; the one-per-day rule is absolute) |
| Symptom score rises ≥3 points above rest during the graded ramp | Diagnostic provocation criterion | Record HRt at that minute; interpretation *physiologic*; prescribe band |
| No ≥3-point rise, any termination type | No exercise-intolerance phenotype detected | Interpretation *no-intolerance*; **not gated on termination type** — clinician must review the stage table before drawing any conclusion |
| No-intolerance on a re-test | Possible recovered tolerance | Raise clearance-**review** flag for the clinician; not a clearance |
| HRt <135 bpm | Prognostic flag (recorded; never a dose input) | Surface prolonged-recovery signal to the clinician |
| Symptom rise ≥2 points during a home session | Within-session **training** stop rule | Stop session; log as flare |
| Two consecutive flaring sessions | Design decision, not a trial rule | Rest day; ceiling −5 bpm (floored at band lower bound); clinician check-in |
| ≥2 flares in the last three sessions | Reduce, don't rest | Ceiling −5 bpm; continue daily at reduced intensity |
| One recent flare | Insufficient evidence to escalate | Hold the band |
| Three consecutive **verified** clean sessions, each ≥80% of prescribed minutes | Tolerance improving, on verified evidence only | Advance ceiling +5 bpm, capped at the measured HRt |
| Ceiling has reached the measured HRt | Ceiling cap | Propose re-test; never advance past the measurement |

---

## 6. Positioning: active rehabilitation, not consumer pacing

A growing class of consumer applications uses wearable or camera-derived heart-rate and heart-rate-variability data to help people with myalgic encephalomyelitis/chronic fatigue syndrome and long COVID **pace** — that is, to stay *under* an energy or heart-rate ceiling in order to avoid post-exertional malaise. In those conditions, avoiding exertion is the therapeutic goal, and the ceiling functions as an alarm.

This framework is the deliberate inverse. For the concussion exercise-intolerance phenotype, the evidence supports *training*: a prescribed aerobic stimulus delivered *within* a band whose upper edge sits just below the symptom-provocation threshold, with the explicit intent of progressively raising that band as tolerance recovers [5,6]. The heart-rate band is therefore a **therapeutic target**, not an exertion ceiling. "In-zone" is the goal; "under" is under-dosing; "over" is the only state the two paradigms share.

Same wearable substrate, opposite therapeutic intent. The distinction is clinically load-bearing, because applying a pacing and avoidance mindset to a patient whose recovery depends on a graded aerobic stimulus would withhold the treatment. The workflow is built so that the framing — train within the band, raise the band under clinician direction — is explicit at every step, including the language shown to the patient.

---

## 7. Scope, limitations, and evidence gaps

**Scope: delivery and verification, not efficacy.** This is a delivery framework. It standardises faithful delivery of an established prescription. It does not establish a clinical outcome, and **no effectiveness claim of any kind is made for the software**. Whether digital delivery improves outcomes over conventional paper prescription is an entirely open empirical question that this paper does not address and on which the author holds no data. The underlying treatment evidence is strongest in adolescents with acute sport-related concussion [5,6]; adults and persistent-symptom populations are supported but less strongly.

**The home-administered graded test is unvalidated.** Concurrent validity of the home-administered graded ramp against the clinician-administered, in-clinic Buffalo Concussion Treadmill Test has not been established. This is the single most consequential open question in the framework, because the entire measured-threshold rationale depends on the measurement being trustworthy. It is the subject of a separate, prospectively registered method-comparison study (Bland–Altman agreement and intraclass correlation, stratified by heart-rate source provenance), which requires full human-research ethics review and is out of scope here. Until that study reports, "we measure the threshold" should be read as a claim about the *construct being measured*, not as a claim that a home test measures it as accurately as the clinic reference standard.

**Workload is unquantified.** As stated in Stage 2, the graded ramp is delivered as standardised per-minute step-up *prompts*, not as a quantified Balke protocol. No speed, gradient, or power value is set or recorded. Consequently: the external workload at which a threshold occurred is unknown; the ramp rate is not standardised across patients, across equipment, or across serial tests within the same patient; and serial HRt comparisons carry an unquantified confounding from ramp-rate variability. A clinician should treat the serial HRt trajectory as informative but not as a controlled repeated measure in the way a clinic treadmill protocol would be.

**Perceived exertion is not captured as a curve.** The workflow records an exhaustion marker as a single end-of-test determination rather than a per-minute Borg rating. A clinician accustomed to reading the RPE trajectory alongside heart rate and symptoms will not find one here.

**Termination type does not gate classification.** As detailed in Stage 2, an early voluntary stop, a test reaching the 20-stage maximum, and a genuine volitional exhaustion all classify as *no-intolerance* when no ≥3-point rise occurred. Because a no-intolerance re-test raises the clearance-review flag, an under-exerted test can produce a spuriously reassuring signal. Mitigations — mandatory clinician review and sign-off, and server-side re-derivation from the raw stages — reduce but do not eliminate this. Tightening the classification to require evidence of adequate exertion is a known and unaddressed improvement.

**Only one arm of the prognostic criterion is operative.** The published prolonged-recovery criterion combines an absolute HRt <135 bpm with a blunted heart-rate response (threshold minus resting ≤50 bpm) [12]. No resting heart rate is captured in the current workflow, so only the absolute criterion can fire. The composite Haider criterion is *not* applied, and the flag should not be described as though it were.

**There is no validated severity-adjusted starting dose.** The percentage-of-HRt band is the only individualisation the evidence supports. A more cautious starting point for a highly symptomatic patient — a shorter first session, or starting at the low end of the band — is clinician judgement, and the workflow deliberately does not present it as evidence-derived. Deriving and validating a severity-adjusted starting dose is a distinct research question.

**The trials specify no next-day symptom-contingent rule.** The workflow records a next-day flare flag and acts on it, but the trials did not prescribe a specific "if next-day symptoms, then X" dose adjustment. The reduce-don't-rest response is drawn from the general management principle [11], not from a trial-specified next-day algorithm.

**There is no published protocol for a large or delayed flare.** Management of a substantial or late-onset symptom spike, as distinct from the transient tolerated worsening the consensus permits [4], is not specified in the literature. The workflow routes such events to clinician review rather than encoding an unvalidated automated response — with one exception, disclosed next.

**Digital conservatisms are design choices, not evidence.** The following are decisions of this workflow, not parameters any trial specifies: the requirement for a *run* of three clean sessions before an advance; the requirement that those sessions be live-verified; the 80%-of-prescribed-minutes completion gate; the specific 5 bpm progression increment; the two-consecutive-flares rest trigger, which is a deliberate departure from the reduce-don't-rest principle for repeated day-over-day provocation, a scenario the trials do not cover; and the 48-hour re-test spacing. They are stated as design decisions and should not be cited as findings.

**No washout interval is specified.** The evidence does not define an interval between the threshold test and the first training session; the framework leaves this to clinician timing.

**Regulatory scope, with its honest bound.** This framework describes a **clinician-directed rehabilitation-assistance and monitoring tool, not a diagnostic or treatment medical device**. The clinician makes every clinical decision — appropriateness, interpretation, band, progression, clearance — and the software executes, paces, monitors, and records a protocol the clinician selected and can override. The intended primary user is a registered exercise physiologist working from a diagnosis already made, which is what makes the graded test a rehabilitation baseline measure rather than a diagnostic provocative test (§2.2). This is the basis for positioning the tool within the clinical-decision-support carve-out (FDA 21st Century Cures Act §3060; TGA clinical-decision-support exclusion). **This positioning reduces but does not guarantee non-device status** — classification follows claims and intended use, and the provocative element of graded testing is a genuine residual exposure independent of how the band is computed. A software-as-a-medical-device scoping opinion should be obtained before launch.

---

## Declarations

**Competing interests.** The author (ZL) is the founder and a director of Concussion Education Australia Pty Ltd, which develops and commercialises software implementing the workflow described in this paper and which sells concussion education to clinicians. This is a direct financial interest in the adoption of the workflow described. To limit advocacy bias: the prescription parameters and safety logic are stated as evidence-anchored design principles with their primary sources cited; the delivery requirements are specified before any tool is named; existing tools, including comparators to the author's, are located against those principles with their interest disclosed (§1a); every negative claim about the field is bounded by "to our knowledge" and a named comparator; and **no effectiveness claim of any kind is made for the author's software**. Where the implementation departs from the published clinic procedure or from the cited evidence, the departure is disclosed rather than omitted (§3, §7). No other competing interests are declared.

**Funding.** This work received no specific grant from any funding agency in the public, commercial, or not-for-profit sectors. It was conducted independently by the author.

**Ethics approval.** Not applicable — this paper describes a workflow built on published evidence; no human participant data were collected. Patient consent and clinic data-contribution terms are specified in a separate companion governance document, which is referenced but not reproduced here.

**Data availability.** Not applicable. No new data were generated or analysed; all evidence sources are cited in the reference list.

**Author contributions.** ZL is the sole author and conceived, designed, and wrote the framework and the manuscript.

---

## References

1. Leddy JJ, Haider MN, Ellis M, Willer BS. Exercise is medicine for concussion. *Curr Sports Med Rep.* 2018;17(8):262–270.
2. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376.
3. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management (Buffalo Concussion Treadmill Test procedure and termination criteria). *Curr Sports Med Rep.* 2013;12(6):370–376.
4. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport — Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711.
5. Leddy JJ, Haider MN, Ellis MJ, et al. Early subthreshold aerobic exercise for sport-related concussion: a randomized clinical trial. *JAMA Pediatr.* 2019;173(4):319–325.
6. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799.
7. Chizuk HM, et al. Usability of a concussion rehabilitation mobile application (Rhea). *JMIR Form Res.* 2025;9:e67275.
8. Early aerobic exercise after sport-related concussion using a progressive percentage of age-predicted maximal heart rate: a randomised controlled trial. *PLOS One.* 2022. (PMC9778585)
9. Remote patient monitoring of concussed adolescents via mHealth: an observational study. *JMIR*-family, 2024. (PMC11089889)
10. Leddy JJ, et al. Practical management: a standardized aerobic exercise program for adolescents with concussion in the absence of graded exercise testing. *Clin J Sport Med.* 2023.
11. Haider MN, Leddy JJ, Willer B, et al. Exercise for sport-related concussion and persistent postconcussive symptoms. *Sports Health.* 2021. (PMC8167349)
12. Haider MN, Leddy JJ, et al. The predictive capacity of the Buffalo Concussion Treadmill Test after sport-related concussion in adolescents. *Front Neurol.* 2019;10:395. (PMC6492460)
13. Leddy JJ, Haider MN, Hinds AL, Willer B. Practical management: prescribing subsymptom threshold aerobic exercise for sport-related concussion in the outpatient setting. *Clin J Sport Med.* 2021;31(2):e89–e94.
14. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. Reliability of a graded exercise test for assessing recovery from concussion. *Clin J Sport Med.* 2011;21(2):89–94.
15. Teel EF, et al. The Montreal Objective Vestibular/Exertion (MOVE) protocol: a remotely delivered graded exertion test. *J Neurotrauma.* 2023. PMID 37212272.
16. Willer BS, Haider MN, Bezherano I, et al. Comparison of rest to aerobic exercise and placebo-like treatment of acute sport-related concussion in male and female adolescents. *Arch Phys Med Rehabil.* 2019;100(12):2267–2275.

---
---

# CHANGES FROM THE PRIOR DRAFT

This appendix lists every substantive correction made against `03-protocol-framework-SUBMISSION.md` and the version deposited to protocols.io. It exists so the differences are auditable rather than silently absorbed. Each entry states what the prior draft claimed, what the code actually does, and why the change matters.

### A. Corrections of fact against the implementation

**A1. The Balke ramp was described as implemented. It is not.**
The prior draft specified the full published Buffalo procedure — start speed 3.2 mph (≤5′10″) or 3.6 mph (>5′10″), 0° incline for minute one, +1° per minute to 15°, then +0.4 mph per minute, cool-down 2.0 mph/0°/2 min. **No speed, gradient, or power value exists anywhere in the implementation.** What ships is a per-minute text prompt to increase the incline one notch, switching after fifteen minutes to a prompt to increase speed instead. The ordinal shape is preserved; the workload is unquantified and unrecorded. Now described as "an operator-executed ramp with standardised per-minute step-up prompts, modelled on the ordinal structure of the BCTT," with the unquantified-workload consequence stated in both Stage 2 and the limitations. *Why it matters:* the prior text would have failed the first reviewer or clinician who tried to reproduce it, and it implied a standardisation of exposure that does not exist.

**A2. "HR, RPE and symptom score every minute" was false.**
RPE is not recorded per minute. The implementation exposes a single binary toggle that sets RPE to 8 or to the exhaustion value of 17 and stamps it across all stages. Corrected to: heart rate and a 0–10 symptom score are recorded every minute; an exhaustion marker (RPE >17 equivalent) is captured as a single end-of-test determination. Added to the limitations as "perceived exertion is not captured as a curve."

**A3. Termination criteria were overstated.**
The prior draft listed terminations including reaching ≥90% of age-predicted maximum heart rate, rapid clinical deterioration, and patient request, and described a cool-down stage. None of these is implemented as a termination rule. The implemented terminations are: a ≥3-point symptom rise (auto-ends the test), the patient declaring exhaustion, reaching the 20-stage maximum, or a red flag. Corrected throughout.

**A4. The no-intolerance classification limitation was entirely absent.**
The prior draft implied that "voluntary exhaustion without provocation (RPE >17)" is what produces a no-intolerance result. In fact the classification is driven solely by the absence of a ≥3-point rise; **termination type does not gate it**. An early voluntary stop, a 20-stage completion, and genuine exhaustion classify identically. Because a no-intolerance re-test raises the clearance-review flag, this is a safety-relevant looseness. Now disclosed in Stage 2, in the decision-rules table, and in the limitations, together with the two partial mitigations (mandatory clinician review and sign-off; server-side re-derivation from raw stages).

**A5. The prognostic flag was described as applying the composite Haider criterion. It does not.**
The prior draft stated the flag fires on "HRt <135 bpm AND ΔHR ≤50 bpm" and quoted 73% sensitivity / 78% specificity. The implementation contains the ΔHR arm, but **no resting heart rate is written anywhere in the application**, so that arm is dead code and only the absolute HRt <135 bpm criterion can ever fire. Corrected to state that only the absolute criterion is operative, with an explicit note that the composite criterion is *not* applied. The sensitivity/specificity figures, which describe the composite criterion, were removed rather than reattributed to a criterion they do not describe. Also note the prior draft's decision table used "AND" where the code uses OR — a second, independent error in the same row.

**A6. The progression rules were imprecise and incomplete.**
The prior draft described an advance of "+5–10 bpm after a run of clean verified sessions" and a regress, with no rest branch and no stated evaluation order. Corrected to the implemented rules, in evaluation order: empty history → hold; two consecutive flares → **rest** (ceiling −5 bpm, floored at the band's lower bound, clinician check-in); ≥2 flares in the last three → regress (−5 bpm); any single recent flare → hold; otherwise advance by **exactly 5 bpm** only if the last **three verified** sessions were clean *and* each completed ≥80% of prescribed minutes; ceiling capped at measured HRt, and at the cap the proposal becomes retest. The flare definition (next-day flare OR peak-minus-pre symptom rise ≥2) is now stated. The **rest branch is newly disclosed as a departure** from the reduce-don't-rest principle, and is listed among the design conservatisms rather than presented as evidence-derived.

**A7. Verification requirements were under-specified.**
Added: session verification requires source = Bluetooth *and* ≥80% of readings matching a fresh live feed exactly; camera PPG is excluded from **all** exertion screens, not merely "unreliable during exercise"; manual entry is never verified. The asymmetry — verified-only for advance, all sessions for rest/regress — is now stated as deliberate design.

**A8. Safety and readiness gates were missing.**
Added: the resting-symptom gate (score ≥8/10 blocks testing outright); the 48-hour minimum re-test spacing plus the absolute one-test-per-calendar-day rule plus the red-flag lock; the fact that loss of signal *clears* the displayed value; and the fact that completed minutes record actual elapsed time and never the prescribed target.

**A9. Server-side integrity was not described, and is now described without overclaiming.**
Added: on ingest of a threshold test, the server re-runs threshold detection from the raw stage data and overwrites the client-supplied interpretation, HRt, and band. Mismatches are logged as console warnings only — explicitly stated **not** to be a durable audit trail, to avoid an overclaim in the opposite direction.

**A10. Self-guided mode transmits nothing — now stated explicitly.**
The prior draft said self-guided patients "transmit nothing" only in passing. It is now stated as an architectural property: without a clinic code, all state remains local to the device.

**A11. Session frequency was vague.**
"Daily / 5–7 days per week" is now stated as what the implementation actually prescribes: 6 days per week, sitting within that published range.

**A12. Band computation clarified.**
Stated explicitly that the lower and upper bounds are 80% and 90% of HRt rounded to the nearest bpm, with **no floor or clamp** — a low HRt yields a correspondingly low absolute band, and that is the intended individualisation.

**A13. Modality is metadata only.**
The prior draft did not mention modality. It is now stated that treadmill/bike/walk/other is recorded for the clinician and is never read by the threshold-detection logic.

**A14. Stage duration and maximum stated.**
One-minute stages (60 seconds, fixed in production) to a maximum of 20 stages — neither appeared in the prior draft.

### B. Corrections of citation and claim discipline

**B1. The Leddy 2019 trial is now cited correctly, and the "4.6 days" figure is gone.**
The correct figures are: n=103, ages 13–18, median recovery 13 days (IQR 10–18.5) with exercise versus 17 days (IQR 13–23) with placebo-like stretching, P=.009, *JAMA Pediatrics* 2019;173(4):319–325. Any "4.6 days on average" formulation is unsourced and wrong; it does not appear anywhere in this version.

**B2. All first/only/no-existing-tool claims removed.**
Every remaining negative is bounded by "to our knowledge" plus a named comparator. Novelty is framed as **standardisation**, never as first-ness.

**B3. The Rhea comparison uses the approved construct-level sentence.**
Measured versus age-predicted (60% ± 5% of 220 − age), framed as a superior *input*, with an explicit statement that no outcome claim is being made.

**B4. MOVE is now cited explicitly wherever the home-capable test claim appears.**
Teel et al., *J Neurotrauma* 2023, PMID 37212272 — with the bound that MOVE is clinician-supervised and targets binary clearance, and with home-test concurrent validity scoped as future work.

**B5. Efficacy language removed throughout.**
The prior abstract's closing sentence — that the framework's "secondary purpose is to generate the structured, de-identified routine-care dataset that such a study would require" — has been **deleted entirely**, not softened. Framing dataset generation as a purpose of the workflow risks a prospective-research classification. The uniform scope phrase "delivery and verification, not efficacy" now appears in the limitations, and no effectiveness claim for the software appears anywhere.

**B6. Unverifiable BCTT parameters removed rather than cited.**
The prior draft carried a "claims to verify before submission" block flagging start speeds, the 0.4 mph step, the 90%-age-predicted-max termination, and the cool-down as uncited. Since none of them is implemented (A1, A3), they are simply gone. The problem was solved by accuracy rather than by citation-hunting.

**B7. The "+5–10 bpm" progression range was likewise unverified in the prior draft, and is now moot** — the implementation steps by exactly 5 bpm, which is what the paper states, disclosed as a design choice within the published range.

### C. Reframing

**C1. EP-scope framing adopted.** The primary intended user is stated as a registered exercise physiologist working from a diagnosis already made and an existing exercise clearance, which makes the graded test a **rehabilitation baseline measure** rather than a diagnostic provocative test. This makes the "does not replace clinical judgement" criterion genuinely true rather than asserted.

**C2. Clinician-directed, not clinician-present.** The supervision model is stated explicitly, with the encoded stop rules identified as the guardrails that operate in the clinician's absence.

**C3. The regulatory bound is stated honestly.** "This positioning reduces but does not guarantee non-device status; a SaMD scoping opinion should be obtained before launch" now appears verbatim, and the residual exposure from the provocative graded test is named rather than argued away.

**C4. Ethics statement rewritten.** Now: "Not applicable — describes a workflow built on published evidence; no human participant data collected." The consent/governance companion is referenced without reproducing it and without characterising its purpose.

**C5. The competing-interests statement is now plain.** It names Concussion Education Australia Pty Ltd, the author's role as founder and director, that the company develops and commercialises software implementing this workflow, and that it sells concussion education — stated as a direct financial interest rather than as a passing disclosure.

**C6. Trade-secret material excluded.** No PPG confidence cutoff, autocorrelation lag bounds, variance-gate values, TTL values, or ramp implementation detail appear. The clinical constants — the 3-point rise, the 2-point stop, the 80–90% band, RPE 17, the 5 bpm step, three clean sessions, 48 hours, the 80% completion gate, the ≥8/10 resting gate — are all stated, because they are citations and clinical parameters, not tunables.

**C7. A version note now appears at the head of the manuscript** recording that this supersedes the earlier deposit and that every operational statement was checked against source.
