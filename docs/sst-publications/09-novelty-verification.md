# SST Trainer — novelty verification record

**Prepared:** 2026-06-29. **Purpose:** an auditable, searched, cited record of which differentiation claims survive contact with the published literature and the live commercial field — so nothing goes into a paper, a pitch, or marketing as a bare "first/only" that a reviewer who knows the space can torpedo. Each claim was tested by trying to **disprove** it.

> **Discipline applied throughout:** claim the *construct* (we measure the actual thing; others estimate a proxy / track a different thing), **not** the *outcome* (patients recover faster — unproven). Bound every negative with "to our knowledge" + the named closest comparator. Never assert a bare negative about the whole field.

---

## 1. vs Rhea — ✅ HOLDS (the sharpest true claim)

**Verified:** The Rhea concussion rehabilitation app (Rhea Health Inc., a University of Toronto spin-out — *not* the Buffalo group) prescribes aerobic exercise at a fixed **60% ± 5% of age-predicted maximal heart rate (220 − age)** and does **not** administer any graded exertion test to measure an individualised threshold; individualisation comes only from in-app "same/better/worse" symptom feedback. Its published formative papers describe no dedicated clinician dashboard.

**Sources:** Chizuk et al., usability study, *JMIR Form Res* 2025 e67275 / [PMC12007725](https://pmc.ncbi.nlm.nih.gov/articles/PMC12007725/); CARE feasibility study, *JMIR Form Res* 2023 e45321.

**Defensible paper sentence (construct superiority only):**
> "The Rhea concussion rehabilitation app prescribes aerobic exercise at a fixed percentage of age-predicted maximal heart rate (60% ± 5% of 220 − age; Chizuk et al. 2025; CARE 2023), rather than an individually measured symptom-limited heart-rate threshold. A measured, symptom-limited HRt is by construction a more individualised prescription input than a population age estimate, which can deviate from an individual's true maximum by ±10–12 bpm."

**Do NOT write:** "patients recover faster on a measured threshold" — that is an outcome claim we have no data for. The defensible claim is *better-individualised input*, not *better outcome*.

---

## 2. Home / self-administered digital graded HRt test — ✅ HOLDS (cite MOVE explicitly)

**Verified:** HRt determination via graded exertion (BCTT/BCBT) is otherwise **clinic-administered and clinician-supervised**. The single remote adaptation found is the **MOVE protocol** (Teel et al., *J Neurotrauma* 2023, [PMID 37212272](https://pubmed.ncbi.nlm.nih.gov/37212272/)) — a 7-stage, no-equipment graded exertion test delivered **live over video with clinician supervision**, whose declared purpose is **binary clearance to high-intensity exercise**, not measuring an individualised HRt for sub-threshold prescription. Telehealth SRC consensus explicitly states exertional tolerance testing "cannot be performed remotely."

**Defensible paper sentence:**
> "To our knowledge, the symptom-limited heart-rate threshold has been determined via clinician-supervised, in-clinic graded exertion (BCTT/BCBT); the only remote adaptation, the virtually-supervised MOVE protocol (Teel et al., 2023), targets binary return-to-exercise clearance rather than measuring an individualised HRt. We operationalise graded HRt testing as a self-administered, home-based digital test — with concurrent validation against clinic BCTT as future work (see validation design, doc 10)."

**Bound:** "home-administered; validation against clinic BCTT is future work." Do NOT let "we measure" imply "we measure as accurately as the clinic gold standard." That is the accuracy-overclaim in a new costume.

---

## 3. vs CCMI + Wibbi — ⚠️ ASSUMPTION CORRECTED

**My original assumption ("CCMI doesn't measure HRt") was FALSE — but a second assumption ("Wibbi delivers measured-HR zone training digitally") was ALSO false and must not be repeated.** CCMI **does** measure HRt via an **in-clinic** BCTT (their battery: BCTT + SCAT6 + sway + King-Devick + orthostatic vitals), but the **prescription is set on paper in clinic**. The **Wibbi** app leg (Dec 2025 partnership) is a home-exercise-program platform: it delivers **exercise-video + RPE-guided** home programs with **symptom/outcome tracking** inside a **closed, certification-gated, proprietary** platform. It is **not** a live measured-heart-rate zone-training tool — it does not stream a wearable HR feed and gate the training band against the measured HRt. So HRt is a **one-off, in-clinic, paper prescription input**, not a serially re-measured instrument, and the digital delivery is RPE/video, not HR-verified; outcome tracking is symptom/balance scores, not a measured-HRt physiological curve.

**Sources:** [Wibbi×CCMI partnership](https://wibbi.com/resource/complete-concussions-wibbi-partnership/); [CCMI BCTT guide](https://completeconcussions.com/concussion-treatment/how-to-perform-a-buffalo-concussion-treadmill-test/); [CCMI clinic software](https://members.completeconcussions.com/courses/ccmi-concussion-testing-management-software/).

**Defensible paper sentence (attributed, no bare negative):**
> "Complete Concussions administers the Buffalo Concussion Treadmill Test to identify a patient's heart-rate threshold in-clinic and, via its December 2025 Wibbi partnership, delivers individualised sub-threshold programs as RPE- and exercise-video-guided home-exercise prescriptions with symptom/outcome tracking inside a certification-gated proprietary platform; its digital leg is not a live heart-rate-monitored zone-training tool. SST Trainer differs on three axes: (a) between-visit training is delivered as **live wearable-HR-verified sub-threshold zone work** gated against the measured HRt, rather than RPE/video with the HRt held in clinic; (b) HRt is treated as a *serial, provenance-verified physiological recovery trajectory* rather than a one-off prescription input; (c) the graded test is *clinician-gated but home-capable* rather than clinic-bound — and the whole engine is purpose-built for the Australian allied-health lane."

**Decision (2026-06-29):** publish via **JMIR mHealth, code closed** — architecture described rigorously, implementation + tuned constants held proprietary. "Open/auditable" is **dropped as a differentiator** (it was contingent on a JOSS/open-source path now declined for commercial reasons — see doc 11). This also de-risks the provisional gate: no public code = no irreversible implementation disclosure.

---

## 4. Serial measured-HRt recovery trajectory — ⚠️ ASSUMPTION CORRECTED → bounded novelty

**My original assumption ("nobody measures serial HRt") was FALSE.** The Buffalo group **does** measure HRt at serial weekly BCTT and documents HRt change over time *as a recovery marker* — but uses it to **re-prescribe** the next training HR and as a **baseline prognostic predictor**, never rendered as a trajectory instrument. Commercial tools (Complete Concussions NeuroLogic; Sway) track **symptom/balance** longitudinally, not measured HRt.

**Sources:** [PMC6492460](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6492460/); RCT [PMC9778585](https://pmc.ncbi.nlm.nih.gov/articles/PMC9778585/); [NeuroLogic](https://completeconcussions.com/neurologic-concussion-software/); [Sway BCTT](https://www.swaymedical.com/articles/buffalo-concussion-treadmill-test).

**Defensible paper sentence (the operationalisation gap, bounded):**
> "To our knowledge, while HRt is measured serially in research protocols — most notably weekly BCTT re-testing to re-prescribe sub-threshold exercise and to predict recovery (Leddy et al.; Haider et al.) — and commercial platforms track symptom and balance scores longitudinally (e.g. Complete Concussions NeuroLogic, Sway), no published study or commercial product presents serial, provenance-verified, *measured* HRt as a continuous physiological recovery-trajectory instrument in its own right. Operationalising that is our contribution; we make no claim that the trajectory predicts or guarantees recovery."

---

## 5. Fail-closed verification engine — ◐ COMPOSITION-NOVEL only (concede the components)

**Honest position:** every *ingredient* is prior art. PPG signal-quality indices that discard noisy segments and refuse to emit HR are mature; "no reading" UX states exist in consumer wearables; BLE Heart Rate Measurement packet validation is a published GATT standard; quality-flagged clinical DSS is established; HR-ceiling exercise prescription is the Buffalo protocol itself.

**The one citable distinction:** consumer wearables **interpolate** gaps (fail-**open**) — Apple Watch interpolates missing HR. SST Trainer **fails closed**: it halts the threshold-dependent logic rather than filling the gap, *because the prescription is a do-not-exceed ceiling and a fabricated value is a defined safety hazard.*

**Sources:** PPG SQI ([PMC9692103](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9692103/)); Apple interpolation/no-reading ([Apple Support](https://support.apple.com/en-qa/105002)); BLE HRP standard; quality-flagged DSS ([PMC7198064](https://pmc.ncbi.nlm.nih.gov/articles/PMC7198064/)).

**Defensible framing — "novel integration/application," NOT "novel method":**
> "The components of signal-quality gating are established. Our contribution is their composition into a safety architecture: fail-closed (non-interpolating) HR emission gated on validated provenance across heterogeneous sources (range/length-checked BLE packet, periodicity-confidence-gated camera-PPG, or manual entry), coupled to a do-not-exceed clinical ceiling, halting the dependent clinical logic on a 'no reading', with a staleness/liveness watchdog. We do not claim invention of signal-quality gating or of the 'no reading' state."

---

## 6. The corrected wedge, in one paragraph

SST Trainer's defensible differentiation is a **stack of bounded, construct-level claims**, not a single "first/only": (1) it **measures** an individualised symptom-limited HRt where the leading digital tool (Rhea) **estimates** a population proxy — a construct-superiority claim, not an outcome claim; (2) it **operationalises HRt measurement as a home/self-administered digital test**, where prior measurement is clinic-bound and the only remote adaptation (MOVE) is supervised and for binary clearance — with clinic-BCTT validation scoped as future work; (3) it treats HRt as a **serial, provenance-verified recovery trajectory**, where research measures it serially only to re-prescribe and commercial tools track symptoms instead; (4) it enforces a **fail-closed, provenance-gated** signal architecture (a novel composition, not a novel method) where consumer devices fail open by interpolating. The moat underneath all four is distribution + data + the AU credentialed network — none of which a paper or a patent protects, and none of which a fast-follower can copy from the published method.

**The single consolidated novelty statement (bounded, combination-level):**
> "To our knowledge, no commercial concussion product delivers measured-HRt + live verification-gated sub-threshold zone training + a serial measured-HRt clinician trajectory in one tool. The closest comparators each hold one or two of these but not the combination: Rhea estimates the HR target (age-predicted max) and delivers zone training without a measured threshold or a clinician dashboard; Complete Concussions + Wibbi measures HRt in clinic but delivers the program as RPE/exercise-video home exercise, not live HR-verified zone training, and does not render serial measured HRt as a trajectory instrument; the Buffalo research protocol measures HRt serially but only to re-prescribe, and has no commercial app; assessment platforms (Sway, C3 Logix, HeadCheck, ImPACT) track symptoms/cognition/balance and none provide HR-guided exertion therapy at all (HeadCheck outsourced rehab to Rhea, i.e. to the estimated-HR model)." — This is the load-bearing claim; it is a *combination* claim bounded by named comparators, never a bare "first."
