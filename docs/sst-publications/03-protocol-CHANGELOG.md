# Protocol paper — changes from the prior draft

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
