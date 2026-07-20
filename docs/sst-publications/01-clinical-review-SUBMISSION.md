# Sub-symptom-threshold aerobic exercise for concussion: from the Buffalo test to digital, clinician-supervised delivery

**Zac Lewis**¹

¹ Concussion Education Australia, Australia. ORCID: 0009-0002-4267-0451.

**Corresponding author:** Zac Lewis, Concussion Education Australia. Email: z.lew87@gmail.com

**Article type:** Narrative review

**Keywords:** concussion; mild traumatic brain injury; sub-symptom-threshold aerobic exercise; Buffalo Concussion Treadmill Test; heart-rate threshold; exercise intolerance; digital health; wearable

---

## Abstract

For two decades the default management of concussion was rest until symptom-free. A coherent body of physiological and randomised-trial evidence has now overturned that doctrine. Concussion produces a measurable, exercise-provocable autonomic phenotype — *exercise intolerance* — that can be quantified with a standardised graded treadmill test (the Buffalo Concussion Treadmill Test, BCTT) to a *heart-rate threshold* (HRt) at which symptoms are reproducibly exacerbated. Prescribing aerobic exercise *just below* that threshold (sub-symptom-threshold aerobic exercise, SSTAE) accelerates recovery and reduces the incidence of persistent post-concussive symptoms in adolescents in two independent randomised controlled trials, and is now endorsed by the 6th International Consensus Statement on Concussion in Sport (Amsterdam 2022/2023). Yet the prescription remains hard to deliver: it depends on an individualised heart-rate ceiling that must be respected on every between-visit session, in the patient's own time, away from the clinic and the treadmill. This review traces the paradigm shift, summarises the threshold-test and SSTAE evidence with effect sizes where published, names the *implementation gap* between an evidence-based prescription and faithful delivery, and argues that a clinician-prescribed, wearable-delivered, live-monitored digital tool — with hardware-agnostic heart rate and an explicit no-fabricated-signal safety design — is the logical instrument to close it. Digital delivery of heart-rate-targeted concussion exercise is itself not new: research apps and a commercial concussion module already exist (§4.2). The contribution argued here is narrow and construct-level — a *measured* (BCTT-derived, not age-predicted-max) heart-rate threshold, combined with *live verification-gated* heart-rate-zone training (only sessions with a real, live-verified wearable heart rate advance the training band, which is itself capped at the measured threshold) and a serial measured-HRt clinician trajectory, delivered hardware-agnostically under clinician supervision on a *no-fabricated-signal* substrate — not new physiology and not first-to-digital. SST Trainer is developed by Concussion Education Australia as the endorsed Australian-market instantiation of an established protocol, not a global platform.

---

## Methods

This is a narrative clinical review. We searched PubMed and Google Scholar (inception to 2026) for English-language literature on concussion exercise intolerance, sub-symptom-threshold aerobic exercise, the Buffalo Concussion Treadmill Test, and digital or wearable delivery of heart-rate-targeted exercise, combining the terms *concussion*, *sub-symptom threshold*, *aerobic exercise*, *exercise intolerance*, *Buffalo Concussion Treadmill Test*, *heart-rate threshold*, *wearable*, and *digital therapeutic*. We prioritised randomised controlled trials, the international consensus statement, and primary methodological papers, supplemented by reviews and the identifiable prior-art digital tools (§4.2). As a narrative synthesis, this is **not a systematic review**: it includes no formal protocol, screening flow, or risk-of-bias appraisal, and effect estimates are reported as published rather than pooled. Its aim is to map the evidence and the delivery gap, not to derive a new quantitative summary.

**Conflict of interest and its mitigation.** The author developed the SST Trainer software, which appears in §4 as *one disclosed illustrative instance* of the delivery requirements — not as the review's conclusion. To limit advocacy bias: the clinical evidence (§§1–3) is presented independently of any product; the delivery requirements (§4) are stated as condition-general design principles *before* any tool is named; existing tools, including the author's, are then located against those principles with their interest disclosed (§4.2); and no efficacy claim is made for the author's software.

---

## 1. Introduction: the rest-to-active paradigm shift

### 1.1 The old doctrine and why it failed

Historically, concussion guidance prescribed *cognitive and physical rest until symptom resolution* — "cocoon therapy." The intuition was mechanical: an injured brain should be protected from load. But prolonged rest has costs. Deconditioning, sleep disruption, mood disturbance, social isolation and nocebo-style symptom focus all compound the original injury, and there was never randomised evidence that strict rest *shortened* recovery. By the mid-2010s, the rest prescription was being actively questioned.

The reframing that replaced it is captured in the title of Leddy and colleagues' influential synthesis: *Exercise is Medicine for Concussion* (Leddy JJ, Haider MN, Ellis M, Willer BS. *Curr Sports Med Rep.* 2018;17(8):262–270). The argument is that a meaningful proportion of post-concussion symptom burden is not structural but a disorder of *physiological regulation* — autonomic and cerebrovascular dysregulation that is provoked by exertion and, crucially, is *responsive to a graded aerobic stimulus delivered below the provocation threshold*. Exercise, correctly dosed, is not a risk to be avoided; it is the treatment.

### 1.2 The physiological substrate: exercise intolerance

The clinical fingerprint of this phenotype is *exercise intolerance*: a reproducible exacerbation of concussion symptoms at a sub-maximal level of exertion that would be unremarkable in a healthy person. Mechanistically it is attributed to autonomic nervous system dysfunction and impaired cerebral autoregulation after the injury (reviewed in *Autonomic Dysfunction and Exercise Intolerance in Concussion — A Scoping Review*, 2024, PMC10812884). Exercise intolerance is common and clinically meaningful: in adults with persistent post-concussive symptoms, roughly 81% test positive for exercise intolerance, and a higher symptom burden is associated with higher odds of testing positive (*Exploring Exercise Intolerance in Adult Patients with Persistent Post-Concussion Symptoms*, PMC12604302). This matters because it means the phenotype is (a) frequent, (b) measurable, and (c) the direct target of the treatment.

### 1.3 What the consensus now says

The 6th International Consensus Statement on Concussion in Sport (Patricios JS, Schneider KJ, Dvorak J, et al. *Br J Sports Med.* 2023;57(11):695–711) codified the shift. Its position can be summarised:

- **Relative rest for only 24–48 hours.** Light physical activity that does not risk a second head impact (e.g. walking) is encouraged within the first 48 hours.
- **Early prescribed aerobic exercise.** Sub-symptom-threshold aerobic exercise initiated within roughly 2–10 days of injury is recommended; it reduces the incidence of persisting symptoms and facilitates recovery, including in those whose symptoms already exceed a month.
- **A symptom-tolerance rule, not a symptom-free rule.** A *mild, transient* worsening of up to 2 points on a 0–10 scale during exercise is acceptable provided it settles within about an hour. This explicit tolerance band is what makes graded progression operable.

This is the doctrine the SST Trainer encodes. The remainder of this review establishes the evidence underneath each component — the test, the prescription, and the progression — and then names why faithful delivery is still hard.

---

## 2. The evidence

### 2.1 The Buffalo Concussion Treadmill Test (BCTT): turning a phenotype into a number

The instrument that operationalised exercise intolerance is the BCTT, a standardised graded treadmill test built on the cardiac Balke protocol (Leddy JJ, Willer B. *Use of graded exercise testing in concussion and return-to-activity management.* Curr Sports Med Rep. 2013;12(6):370–376). The protocol — walk at a fixed starting speed, then increase the incline by 1° each minute for fifteen stages, after which speed is increased — was chosen precisely because the Balke ramp is gentle, well-validated and proven safe even in cardiac patients. Heart rate, rate of perceived exertion (Borg) and a symptom-severity score are recorded *every minute*.

The test ends in one of three ways, and the distinction is the clinical signal:

- **Symptom-limited termination.** When symptoms rise by a defined amount above baseline, the test stops; the heart rate at that minute is the *heart-rate threshold (HRt)*. This is the exercise-intolerance phenotype, and HRt is the anchor for everything that follows.
- **Voluntary exhaustion without symptom provocation.** The patient reaches volitional fatigue (high RPE) without provoking concussion symptoms — i.e. *no* exercise intolerance. This is itself informative: it suggests the symptom driver is something other than the physiological phenotype (e.g. cervicogenic, vestibular, or mood) and should redirect the workup.
- **Red-flag termination.** Any emergency sign halts the test and routes to medical review.

The BCTT is reliable as a repeated measure (Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. *Reliability of a graded exercise test for assessing recovery from concussion.* Clin J Sport Med. 2011;21(2):89–94), which is what licences serial testing as a recovery curve.

### 2.2 HRt and the slope are also *prognostic*

Beyond prescribing, the threshold test forecasts recovery. In adolescents with sport-related concussion, an absolute HRt below ~135 bpm is associated with prolonged (>30-day) recovery, and a *blunted* heart-rate response — a change in HR of ≤50 bpm across the test — predicts prolonged recovery with roughly 73% sensitivity and 78% specificity (Haider MN, Leddy JJ, et al. *The Predictive Capacity of the Buffalo Concussion Treadmill Test After Sport-Related Concussion in Adolescents.* Front Neurol. 2019;10:395). A test that both *prescribes the dose* and *flags who is likely to be slow* is unusually high-value clinically — and serial HRt becomes an objective recovery trajectory rather than a subjective symptom diary.

### 2.3 SSTAE works: the randomised evidence and its effect sizes

The therapeutic claim rests on a clean, replicated chain of randomised trials.

**Origin / proof of concept.** A preliminary subsymptom-threshold treadmill-training programme for refractory post-concussion syndrome demonstrated feasibility and symptom improvement when patients exercised most days at ~80% of their symptom-threshold heart rate (Leddy JJ, Kozlowski K, Donnelly JP, Pendergast DR, Epstein LH, Willer B. *A preliminary study of subsymptom threshold exercise training for refractory post-concussion syndrome.* Clin J Sport Med. 2010;20(1):21–27).

**Pivotal RCT (JAMA Pediatrics, 2019).** In a randomised clinical trial of 103 adolescents (ages 13–18) in the acute phase of sport-related concussion, sub-symptom-threshold aerobic exercise vs a placebo-like stretching programme accelerated recovery: median recovery **13 days vs 17 days**, a statistically significant difference (Leddy JJ, Haider MN, Ellis MJ, et al. *Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial.* JAMA Pediatr. 2019;173(4):319–325). This was the result the University at Buffalo described as potentially changing the standard of care.

**Independent multi-site replication (Lancet Child & Adolescent Health, 2021).** A larger, three-site RCT of 118 adolescents presenting within 10 days of injury reproduced and extended the finding: targeted-HR sub-symptom-threshold aerobic exercise reduced median recovery time, increased the likelihood of recovery within four weeks, and **reduced the risk of persistent post-concussive symptoms by ~48%** (hazard ratio for stretching vs aerobic exercise 0·52, 95% CI 0·28–0·97, p=0·039), with good adherence and no adverse events (Leddy JJ, Master CL, Mannix R, et al. *Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial.* Lancet Child Adolesc Health. 2021;5(11):792–799). Replication across independent sites, with prevention of *persistence* (the costly outcome) rather than only speed, is what moved SSTAE from promising to recommended.

**Supporting comparative work.** A comparison of rest vs aerobic exercise vs placebo-like treatment in male and female adolescents further supported active over rest management (Willer BS, Haider MN, Bezherano I, et al. *Comparison of Rest to Aerobic Exercise and Placebo-like Treatment of Acute Sport-Related Concussion in Male and Female Adolescents.* Arch Phys Med Rehabil. 2019;100(12):2267–2275). Systematic synthesis for the Amsterdam process concluded that early rest beyond 24–48 hours confers no benefit and that prescribed sub-threshold aerobic exercise is beneficial (rest-and-exercise systematic review underpinning Patricios et al. 2023, *Br J Sports Med.* 2023). A separate review noted that, while the adolescent evidence is strong, good-quality trials in *adults* and on broader outcomes are still needed (*Exercise for Sport-Related Concussion and Persistent Postconcussive Symptoms*, PMC8167349).

### 2.4 Prescribing without a treadmill

A practical obstacle is that not every clinician has a treadmill, an ECG and the time to run a 15-minute staged test with per-minute logging. Leddy and colleagues addressed this in two practical-management papers: one detailing how to *prescribe SSTAE in the outpatient setting* from an HRt (Leddy JJ, Haider MN, Hinds AL, Willer B. *Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting.* Clin J Sport Med. 2021;31(2):e89–e94), and one giving a *standardised programme in the absence of graded exercise testing* (Leddy JJ, et al. *Practical Management: A Standardized Aerobic Exercise Program for Adolescents With Concussion in the Absence of Graded Exercise Testing.* Clin J Sport Med. 2023). These papers are important to the digital case: they establish that the *prescription* (a heart-rate-anchored band, ~20 min, most days, with a within-session symptom-stop rule and graded progression) is meant to be portable and repeatable — exactly the part that a guided app can carry between visits.

### 2.5 What "the prescription" actually is

Distilling the above into the operational dose that the SST Trainer encodes:

- **Anchor:** HRt from a symptom-limited graded test (the validated provocation criterion is a symptom rise of ≥3 points from rest).
- **Band:** train at ~80–90% of HRt for concussion — a floor that guarantees a training stimulus and a *do-not-exceed* ceiling that keeps the patient below provocation.
- **Dose:** ~20 minutes, most days of the week.
- **Within-session stop rule:** stop if symptoms rise ≥2 points above pre-session (mirroring the consensus ≤2-point tolerance band).
- **Progression:** advance the ceiling only after clean sessions (no within-session provocation, no next-day flare); regress on repeated provocation; re-test HRt to update precisely. Serial HRt is the recovery curve; a re-test that no longer provokes symptoms is the *return-to-activity / clearance* signal.

Every number here is taken from the cited literature, not invented.

---

## 3. The implementation gap

Here is the problem the evidence does not solve. The trials worked because participants were carefully prescribed an individualised HR ceiling and *adhered to it on every home session*, with clinician oversight. In routine practice, three things break:

1. **The ceiling is individualised and invisible.** "Keep your heart rate between 124 and 140 bpm" is not something a patient can feel. Without a live read on heart rate, the patient is guessing — and the two failure modes are opposite and both harmful: under-dosing (no therapeutic stimulus, slow recovery) or over-shooting the ceiling (symptom provocation, a flare, loss of confidence in active rehab).

2. **The treatment happens between visits, unobserved.** Unlike a clinic-based modality, SSTAE is delivered mostly at home, most days, for weeks. The clinician prescribes once and then loses sight of what actually happened — heart rates achieved, minutes completed, symptom deltas, next-day flares — until the next appointment, if it happens.

3. **The data needed to progress safely is exactly the data that is lost.** The progression decision (advance / hold / regress / refer) depends on a structured session history. On paper diaries this is incomplete, recalled, and rarely makes it into the record in a usable form. Serial HRt — the objective recovery curve and the clearance signal — is almost never captured outside a research setting.

The result is an *evidence-practice gap*: a recommended, replicated, consensus-endorsed treatment whose efficacy depends on faithful between-visit delivery and monitoring that ordinary clinical workflows do not provide.

---

## 4. What faithful delivery requires (design principles)

The implementation gap defines a set of *requirements* that any faithful delivery of SSTAE must meet — stated here independently of any vendor or product. We give them as design principles first; §4.2 then locates the existing tools (including, with disclosed interest, the author's) against them. The argument is deliberately modest: **the physiology is not new; what the field lacks is faithful, verifiable, monitored delivery between visits.**

- **Make the invisible ceiling visible and live.** A continuous heart-rate read, shown against the prescribed band in real time, converts an abstract bpm range into a moment-to-moment "in zone / over / under" signal. This is the single change that makes faithful self-dosing possible.

- **Be hardware-agnostic so the ceiling is *always* available.** Adherence dies on friction. A tool that accepts *any* wearable broadcasting the standard Bluetooth Heart Rate profile (Garmin, Polar, WHOOP, Coros, Suunto, Wahoo and any chest strap) — read via Web Bluetooth on Android/desktop browsers and via native CoreBluetooth/Android-BLE in the iOS and Android apps, so the same sensor works on every platform — *or* clinician manual entry meets the patient where they are rather than mandating a purchase. Two limits are stated honestly: a phone-camera photoplethysmography (PPG) estimate is offered only as a *resting spot-check*, because motion artefact makes camera PPG unreliable during exercise, so it is never used to drive a live training session; and two widely owned wrist devices — Apple Watch and Fitbit — do not broadcast standard BLE heart rate, so those users fall back to a chest strap or manual entry. Heart rate is the load-bearing measurement; sourcing it must never be the blocker.

- **Refuse to fabricate the signal, and let only verified signal advance the dose.** This is a safety property, not a feature. Because the prescription is a *heart-rate ceiling*, a wrong or invented bpm is a clinical hazard — it can wave a patient past their provocation threshold. The tool must only ever display a heart rate it actually measured (a real BLE packet, or a real resting-PPG estimate that passed a periodicity-confidence gate) and must show "no reading" rather than guess; there is no simulated number anywhere in the path. A second, stronger rule governs *progression*: only a session whose heart rate was live-verified against a broadcasting wearable may advance the training band, and the band never ratchets past the *measured* threshold — a fresh graded re-test is the only way to raise it further. Manual or unverified sessions still count fully for safety (they can trigger a hold or regression) but can never push the ceiling up on trust alone.

- **Carry the safety logic, not just the timer.** The within-session ≥2-point symptom-stop rule, the red-flag halt-and-refer path, and the requirement for a *symptom-limited* (not exhaustion-limited) test to even yield an HRt are all encoded so the guardrails travel with the patient between visits.

- **Let the treatment follow the patient and report back.** When the patient enters a clinic code, each threshold test and training session syncs to the clinician — HRt trajectory, prescribed band, minutes, symptom deltas, next-day flares — and, while a session is running, a live tick lets the clinician watch in real time. Serial HRt becomes the recovery curve in the record; a re-test that no longer provokes symptoms surfaces automatically as a *clearance-review* signal. Self-guided users (no clinic code) simply send nothing.

- **Stay inside the prescriber relationship — a clinician-directed assistant, not a medical device.** This is explicitly *not* a consumer self-diagnosis product, and it is positioned as a **clinician-directed rehab-assistance and monitoring/data tool rather than a diagnostic or treatment medical device.** The qualified clinician runs/oversees the threshold test, interprets it, sets the heart-rate band, owns the prescription, approves progression, and clears return to activity; the software only executes, paces, monitors, and records. It *informs; it never decides.* That division is what keeps the tool within the **clinical-decision-support carve-out** (FDA 21st Century Cures Act §3060; TGA's CDS exclusion) and out of FDA SaMD / TGA medical-device classification — analogous to the way an ambulatory blood-pressure monitor extends a cardiologist's reach without making the clinical decision. The tool makes no claim to *treat, diagnose, or clear* concussion; patient-facing it is a "heart-rate-guided exercise companion" with symptom-stop and seek-clinician disclaimers. This positioning *reduces but does not guarantee* non-device status — claims and intended use drive classification — so a SaMD scoping opinion should be obtained before launch.

### 4.1 Why "active" and not "pacing"

It is worth distinguishing this from the better-known consumer category. Pacing apps for ME/CFS and long-COVID (e.g. Visible, which also uses camera-PPG for heart-rate/HRV) are built to help users *avoid* exertion and stay under an energy ceiling to prevent post-exertional malaise. That is the right goal in those conditions. The SSTAE prescription is the *active-rehabilitation counterpart*: the heart-rate band is a therapeutic *target to train within*, not merely a ceiling to stay under, and the explicit aim is to progressively *raise* it as tolerance recovers. Same wearable substrate; opposite therapeutic intent. Conflating the two would be a clinical error, which is why the tool frames the band as a prescribed training zone with a clinician-owned progression, not as an exertion alarm.

---

### 4.2 What already exists — and the narrow, honest novelty

It would be wrong to imply that no one has digitised this prescription. The honest claim must be made *against* the existing prior art, which this review extends rather than ignores:

- A concussion rehabilitation app (*Rhea Health*, a University of Toronto spin-out — founder Michael Hutchison — *not* affiliated with the Buffalo group whose measured-threshold method is described above) already delivers heart-rate-targeted aerobic prescription, but guides users to a *fixed* ~60% ± 5% of **age-predicted maximal heart rate** (220 − age) with **no graded test to individualise the threshold**; its only individualisation is in-app same/better/worse symptom feedback, and it reports no dedicated clinician dashboard (Chizuk et al., *JMIR Form Res* 2025;e67275). An RCT has likewise delivered early aerobic exercise using a **progressive percentage of age-predicted-max HR** (*PLOS One*, 2022).
- Between-visit mHealth symptom monitoring with structured return of data to clinicians is published (remote patient monitoring of concussed adolescents, *JMIR-family*, 2024).
- The pivotal Buffalo trials themselves delivered individualised HRt-based home exercise with **wearable HR monitoring** (80% of HRt with a Polar monitor, *JAMA Pediatr.* 2019; serial-HRt-updated prescription with weekly BCTT recheck, *Lancet Child Adolesc Health* 2021) — but the Buffalo program is a research method with no commercial app; SST productises its measured-threshold approach rather than re-packaging a Buffalo product.
- A **commercial** concussion exercise-prescription module exists and is reaching Australia: the CCMI + Wibbi partnership (Dec 2025) embeds concussion protocols in a digital home-exercise-program platform with outcome tracking. CCMI's BCTT-derived HRt is, however, measured once *on paper in clinic*, not delivered digitally, and its tracking is of symptom/outcome scores rather than a serial measured-HRt curve.
- Concussion **assessment** platforms (Sway [FDA 510(k)-cleared], C3 Logix, HeadCheck, ImPACT) digitise symptom, balance and cognitive testing but carry **no exertion or heart-rate-guided therapy**; and supervised heart-rate-zone training is proven at scale in *cardiac* rehabilitation apps (e.g. Moving Analytics, Recora) but has not been applied to concussion.

Against that backdrop, the defensible contribution is *not* "first digital delivery." It is narrower and construct-level: **to our knowledge, no commercially available concussion product delivers a *measured* heart-rate threshold (BCTT-derived, not age-predicted-max) *plus* live verification-gated heart-rate-zone training *plus* a serial measured-HRt clinician trajectory in one tool** (closest comparators: the Rhea app — a fixed age-predicted-max percentage, no graded test, no clinician dashboard; and the CCMI + Wibbi module — a one-off on-paper in-clinic BCTT with symptom/outcome tracking, not a serial measured-HRt curve). The *measured* threshold, the verification-gated progression, and the serial-HRt trajectory — not the use of heart rate or the fact of an app — are the claim. No bare "first" or "only" is intended: each element exists somewhere in the prior art; the claim is their combination in one clinician-supervised workflow.

---

## 5. Limitations and honest scope

The strongest randomised evidence for SSTAE is in **adolescents with sport-related concussion** in the **early** window; the adult and persistent-symptom evidence, while supportive, is thinner and calls for better trials. A digital delivery tool inherits this evidence base — it can make faithful delivery of an evidence-based prescription easier and more measurable, but it does not, by itself, constitute new efficacy evidence. The honest claim for the software is **verification-by-design and faithful delivery**, not a new clinical outcome. The path to genuine outcome evidence is a future retrospective, observational analysis of de-identified routine-care data (serial HRt trajectories, adherence, time-to-clearance) accumulated through normal clinical use — a study that can be designed once a real-world dataset exists, and that is the appropriate vehicle for an efficacy claim.

Digital delivery is also not a free good, and the case for it should not be made one-sidedly. Whether a wearable-guided app *actually* improves between-visit delivery is itself an empirical question, not a given: app-based adherence commonly decays over weeks; live heart-rate feedback can be misread under exertion or anxiety; consumer optical sensors are least accurate at exactly the exercising heart rates that matter; and any tool introduces equity and access concerns — the cost of a wearable, smartphone and data, and a digital-literacy and language barrier that can widen rather than narrow disparities in who receives faithful rehabilitation. Privacy and data-governance obligations attach to any between-visit clinical data flow. These are reasons the contribution is framed as *verification-by-design and a measurable delivery substrate* — and why its real-world value, like its efficacy, is deferred to evaluation rather than asserted.

---

## 6. Conclusion

Concussion management has completed a genuine paradigm shift: from rest-until-symptom-free to early, individualised, sub-symptom-threshold aerobic exercise, anchored to a heart-rate threshold from a standardised graded test, and endorsed by the field's consensus statement. The remaining problem is not *what* to prescribe but *how to deliver it faithfully* between visits, when the therapeutic ceiling is invisible, the sessions are unobserved, and the data needed to progress safely is the data that gets lost. Tools that are clinician-prescribed, wearable-delivered, hardware-agnostic in how they read heart rate, uncompromising in never fabricating that signal, and built to carry the safety logic and report back to the prescriber are a natural instrument to close that gap. The contribution such tools offer is integration and faithful, verifiable delivery of an established treatment — not new physiology, and not, on their own, new outcome evidence. Whether they deliver that promise in practice — improving adherence and real-world delivery without widening access disparities — is precisely the question the next phase of evaluation, set out above, must answer.

---

## Declarations

**Competing interests.** The author (ZL) is the developer and founder of the SST Trainer software and of Concussion Education Australia, which is referenced in Section 4 as one disclosed, illustrative instance of the delivery requirements discussed. No other competing interests are declared. The steps taken to mitigate this interest are described in the Methods.

**Funding.** This work received no specific grant from any funding agency in the public, commercial, or not-for-profit sectors; it was conducted independently by the author.

**Ethics approval.** Not applicable. This is a narrative review of previously published literature and involved no human participants, human data, or animal subjects.

**Data availability.** Not applicable. No new data were generated or analysed; all sources are cited in the reference list.

**Author contributions.** ZL is the sole author and conceived, researched, and wrote the manuscript.

---

## Key references

1. Leddy JJ, Haider MN, Ellis MJ, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial. *JAMA Pediatr.* 2019;173(4):319–325.
2. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799.
3. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711.
4. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376.
5. Haider MN, Leddy JJ, et al. The Predictive Capacity of the Buffalo Concussion Treadmill Test After Sport-Related Concussion in Adolescents. *Front Neurol.* 2019;10:395.
6. Leddy JJ, Kozlowski K, Donnelly JP, Pendergast DR, Epstein LH, Willer B. A preliminary study of subsymptom threshold exercise training for refractory post-concussion syndrome. *Clin J Sport Med.* 2010;20(1):21–27.
7. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. Reliability of a graded exercise test for assessing recovery from concussion. *Clin J Sport Med.* 2011;21(2):89–94.
8. Leddy JJ, Haider MN, Ellis M, Willer BS. Exercise is Medicine for Concussion. *Curr Sports Med Rep.* 2018;17(8):262–270.
9. Leddy JJ, Haider MN, Hinds AL, Willer B. Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting. *Clin J Sport Med.* 2021;31(2):e89–e94.
10. Willer BS, Haider MN, Bezherano I, et al. Comparison of Rest to Aerobic Exercise and Placebo-like Treatment of Acute Sport-Related Concussion in Male and Female Adolescents. *Arch Phys Med Rehabil.* 2019;100(12):2267–2275.
