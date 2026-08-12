# Sub-symptom-threshold aerobic exercise for concussion: from the Buffalo test to digital, clinician-supervised delivery

**Zac Lewis**¹

¹ Concussion Education Australia, Australia. ORCID: 0009-0002-4267-0451.

**Corresponding author:** Zac Lewis, Concussion Education Australia. Email: z.lew87@gmail.com

**Article type:** Narrative review

**Keywords:** concussion; mild traumatic brain injury; sub-symptom-threshold aerobic exercise; Buffalo Concussion Treadmill Test; heart-rate threshold; exercise intolerance; digital health; wearable

## Abstract

For two decades the default management of concussion was rest until symptom-free. A coherent body of physiological and randomised-trial evidence has overturned that doctrine. Concussion produces a measurable, exercise-provocable autonomic phenotype — exercise intolerance — that can be quantified with a standardised graded treadmill test (the Buffalo Concussion Treadmill Test, BCTT) to a heart-rate threshold (HRt) at which symptoms are reproducibly exacerbated. Prescribing aerobic exercise just below that threshold (sub-symptom-threshold aerobic exercise, SSTAE) accelerated recovery in a randomised controlled trial of adolescents and, in a subsequent multicentre randomised trial, roughly halved the incidence of persistent post-concussive symptoms; the approach is now endorsed by the 6th International Consensus Statement on Concussion in Sport (Amsterdam 2022/2023). Yet the prescription remains hard to deliver: it depends on an individualised heart-rate ceiling that must be respected on every between-visit session, in the patient's own time, away from the clinic and the treadmill. This review traces the paradigm shift, summarises the threshold-test and SSTAE evidence with effect sizes where published, and names the implementation gap between an evidence-based prescription and faithful between-visit delivery. It then proposes a set of delivery requirements derived from the trial procedures: a live, verified heart-rate signal displayed against the prescribed band; hardware-agnostic sourcing of that signal; refusal to fabricate readings; progression gated on verified sessions; and structured reporting back to the prescribing clinician. Existing tools, including one developed by the author (a disclosed competing interest), are located against those requirements. The defensible contribution of such tools is faithful, verifiable delivery of an established treatment: not new physiology, and not the first digital delivery.

## Key messages

- Sub-symptom-threshold aerobic exercise, dosed from a measured heart-rate threshold on a standardised graded test, is consensus-endorsed care for concussion — but its efficacy depends on an individualised, invisible heart-rate ceiling being respected on every unsupervised home session.
- Routine practice loses exactly the data that make the prescription safe to progress: live heart rate against the prescribed band, completed-session records, next-day symptom responses, and serial thresholds.
- Digital delivery tools are candidate instruments for closing this gap only if they never fabricate the heart-rate signal, gate progression on verified sessions, and report structured records back to the prescribing clinician; whether they improve real-world delivery remains to be demonstrated.

## Methods

This is a narrative clinical review. PubMed and Google Scholar were searched (inception to July 2026) for English-language literature on concussion exercise intolerance, sub-symptom-threshold aerobic exercise (SSTAE), the Buffalo Concussion Treadmill Test, and digital or wearable delivery of heart-rate-targeted exercise, combining the terms *concussion*, *sub-symptom threshold*, *aerobic exercise*, *exercise intolerance*, *Buffalo Concussion Treadmill Test*, *heart-rate threshold*, *wearable*, and *digital therapeutic*. Randomised controlled trials, the international consensus statement, and primary methodological papers were prioritised, supplemented by reviews. The commercial and digital landscape discussed in Section 4.2 was mapped separately (to August 2026) from published app evaluations, vendor documentation, regulatory listings, and partnership announcements; that mapping is descriptive rather than exhaustive, and the comparative statements in Section 4.2 are limited to the tools identified by it. As a narrative synthesis, this is not a systematic review: it includes no formal protocol, screening flow, or risk-of-bias appraisal, and effect estimates are reported as published rather than pooled. Its aim is to map the evidence and the delivery gap, not to derive a new quantitative summary.

**Conflict of interest and its mitigation.** The author developed the SST Trainer software, which appears in Section 4.2 as one disclosed instance of the delivery requirements — not as the review's conclusion. To limit advocacy bias: the clinical evidence (Sections 1–3) is presented independently of any product; the delivery requirements (Section 4) are stated as condition-general design principles before any tool is named in the review's argument (this disclosure excepted); existing tools, including the author's, are then located against those principles with the interest disclosed (Section 4.2); and no efficacy claim is made for the author's software.

## 1. Introduction: the rest-to-active paradigm shift

### 1.1 The old doctrine and why it failed

Historically, concussion guidance prescribed *cognitive and physical rest until symptom resolution* — "cocoon therapy." The intuition was mechanical: an injured brain should be protected from load. But prolonged rest has costs. Deconditioning, sleep disruption, mood disturbance, social isolation and nocebo-style symptom focus all compound the original injury, and there was never randomised evidence that strict rest shortened recovery. By the mid-2010s, the rest prescription was being actively questioned.

The reframing that replaced it is captured in the title of Leddy and colleagues' influential synthesis, *Exercise is Medicine for Concussion* [1]. The argument is that a meaningful proportion of post-concussion symptom burden is not structural but a disorder of physiological regulation — autonomic and cerebrovascular dysregulation that is provoked by exertion and, crucially, is responsive to a graded aerobic stimulus delivered below the provocation threshold. Exercise, correctly dosed, is not a risk to be avoided; it is the treatment.

### 1.2 The physiological substrate: exercise intolerance

The clinical fingerprint of this phenotype is *exercise intolerance*: a reproducible exacerbation of concussion symptoms at a sub-maximal level of exertion that would be unremarkable in a healthy person. Mechanistically it is attributed to autonomic nervous system dysfunction and impaired cerebral autoregulation after the injury [2]. Exercise intolerance is common and clinically meaningful: in adults with persistent post-concussive symptoms, roughly 81% test positive for exercise intolerance, and a higher symptom burden is associated with higher odds of testing positive [3]. This matters because it means the phenotype is (a) frequent, (b) measurable, and (c) the direct target of the treatment.

### 1.3 What the consensus now says

The 6th International Consensus Statement on Concussion in Sport [4] codified the shift. Its position can be summarised:

- **Relative rest for only 24–48 hours.** Light physical activity that does not risk a second head impact (e.g. walking) is encouraged within the first 48 hours.
- **Early prescribed aerobic exercise.** Sub-symptom-threshold aerobic exercise initiated within roughly 2–10 days of injury is recommended; it reduces the incidence of persisting symptoms and facilitates recovery, including in those whose symptoms already exceed a month.
- **A symptom-tolerance rule, not a symptom-free rule.** A mild, transient worsening of up to 2 points on a 0–10 scale during exercise is acceptable provided it settles within about an hour. This explicit tolerance band is what makes graded progression operable.

The remainder of this review establishes the evidence underneath each component of this doctrine — the test, the prescription, and the progression — and then names why faithful delivery is still hard.

## 2. The evidence

### 2.1 The Buffalo Concussion Treadmill Test (BCTT): turning a phenotype into a number

The instrument that operationalised exercise intolerance is the BCTT, a standardised graded treadmill test built on the cardiac Balke protocol [5]. The protocol — walk at a fixed starting speed, then increase the incline by 1° each minute for 15 stages, after which the speed increases — was chosen precisely because the Balke ramp is gentle, well-validated and proven safe even in cardiac patients. Heart rate, rating of perceived exertion (Borg RPE) and a symptom-severity score are recorded every minute.

The test ends in one of three ways, and the distinction is the clinical signal:

- **Symptom-limited termination.** When symptoms rise by a defined amount above baseline, the test stops; the heart rate at that minute is the *heart-rate threshold (HRt)*. This is the exercise-intolerance phenotype, and HRt is the anchor for everything that follows.
- **Voluntary exhaustion without symptom provocation.** The patient reaches volitional fatigue (high RPE) without provoking concussion symptoms — that is, *no* exercise intolerance. This is itself informative: it suggests the symptom driver is something other than the physiological phenotype (e.g. cervicogenic, vestibular, or mood) and should redirect the workup.
- **Red-flag termination.** Any emergency sign halts the test and routes to medical review.

The BCTT is reliable as a repeated measure [6], which is what justifies serial testing as a recovery curve.

### 2.2 HRt and the slope are also prognostic

Beyond prescribing, the threshold test forecasts recovery. In adolescents with sport-related concussion, an absolute HRt below ~135 bpm has been associated with prolonged (>21-day) recovery, and Haider and colleagues found that a blunted heart-rate response — a change in heart rate of ≤50 bpm across the test — predicted delayed (>30-day) recovery with roughly 73% sensitivity and 78% specificity in adolescents managed with the then-standard prescribed rest [7]. A single test that both prescribes the dose and stratifies recovery risk is clinically valuable — and serial HRt becomes an objective recovery trajectory rather than a subjective symptom diary.

### 2.3 SSTAE works: the randomised evidence and its effect sizes

The therapeutic claim rests on a coherent chain of randomised trials, led largely by the originating Buffalo group.

**Origin and proof of concept.** A preliminary sub-symptom-threshold treadmill-training programme for refractory post-concussion syndrome demonstrated feasibility and symptom improvement when patients exercised most days at ~80% of their symptom-threshold heart rate [8].

**Pivotal RCT (JAMA Pediatrics, 2019).** In a randomised clinical trial of 103 adolescents (ages 13–18) in the acute phase of sport-related concussion, sub-symptom-threshold aerobic exercise versus a placebo-like stretching programme accelerated recovery: median recovery 13 days versus 17 days, a statistically significant difference [9].

**Multicentre extension (Lancet Child & Adolescent Health, 2021).** A larger, three-site RCT of 118 adolescents presenting within 10 days of injury, led by the originating group with collaborating sites, reproduced and extended the finding: targeted-heart-rate sub-symptom-threshold aerobic exercise shortened recovery (the trial's reported hazard ratio for stretching versus aerobic exercise was 0.52, 95% CI 0.28–0.97, p=0.039) and roughly halved the incidence of persistent post-concussive symptoms, with good adherence and no adverse events [10]. Extension across multiple sites, with prevention of *persistence* (the costly outcome) rather than only speed, is what moved SSTAE from promising to recommended.

**Supporting comparative work.** A comparison of rest versus aerobic exercise versus placebo-like treatment in male and female adolescents further supported active over rest management [11]. Systematic synthesis for the Amsterdam process concluded that early rest beyond 24–48 hours confers no benefit and that prescribed sub-symptom-threshold aerobic exercise is beneficial [12]. A separate review noted that, while the adolescent evidence is strong, good-quality trials in adults and on broader outcomes are still needed [13].

### 2.4 Prescribing without a treadmill

A practical obstacle is that not every clinician has a treadmill, a heart-rate monitor and the time to run a staged treadmill test with per-minute logging. The Buffalo group addressed this in two practical-management papers: one detailing how to prescribe SSTAE in the outpatient setting from an HRt [14], and one giving a standardised programme in the absence of graded exercise testing [15]. Together they establish that the prescription — a heart-rate-anchored band, ~20 minutes, most days, with a within-session symptom-stop rule and graded progression — is meant to be portable and repeatable.

### 2.5 What "the prescription" actually is

Distilling the above into the operational dose:

- **Anchor:** HRt from a symptom-limited graded test (the validated provocation criterion is a symptom rise of ≥3 points from rest) [5].
- **Band:** train at ~80–90% of HRt for concussion — a floor intended to preserve a training stimulus and a do-not-exceed ceiling that keeps the patient below provocation [8–10,13].
- **Dose:** ~20 minutes, most days of the week [9,10].
- **Within-session stop rule:** stop if symptoms rise more than 2 points (>2) above pre-session — the complement of the consensus's up-to-2-point tolerance band [4].
- **Progression:** advance the ceiling only after clean sessions (no within-session provocation, no next-day flare); regress on repeated provocation; re-test HRt to update precisely [14,15]. Serial HRt is the recovery curve; a re-test that no longer provokes symptoms is a key input to the return-to-activity decision.

## 3. The implementation gap

Here is the problem the evidence does not solve. The trials worked because participants were carefully prescribed an individualised heart-rate ceiling and adhered to it on every home session, with clinician oversight. In routine practice, three things break:

1. **The ceiling is individualised and invisible.** "Keep your heart rate between 124 and 140 bpm" is not something a patient can feel. Without a live read on heart rate, the patient is guessing — and the two failure modes are opposite and both harmful: under-dosing (no therapeutic stimulus, slow recovery) or over-shooting the ceiling (symptom provocation, a flare, loss of confidence in active rehabilitation).

2. **The treatment happens between visits, unobserved.** Unlike a clinic-based modality, SSTAE is delivered mostly at home, most days, for weeks. The clinician prescribes once and then loses sight of what actually happened — heart rates achieved, minutes completed, symptom deltas, next-day flares — until the next appointment, if it happens.

3. **The data needed to progress safely are exactly the data that are lost.** The progression decision (advance / hold / regress / refer) depends on a structured session history. On paper diaries this is incomplete, recalled, and rarely makes it into the record in a usable form. Serial HRt — the objective recovery curve and the clearance signal — is almost never captured outside a research setting.

The result is an *evidence-practice gap*: a recommended, replicated, consensus-endorsed treatment whose efficacy depends on faithful between-visit delivery and monitoring that ordinary clinical workflows do not provide.

## 4. What faithful delivery requires (design principles)

The implementation gap defines a set of requirements for delivery that is faithful to the trialled protocol. They are proposed here by the author, derived from the trial procedures [8–10] and the gap analysis in Section 3, and stated at the level of requirements, independent of any vendor or product; Section 4.2 then locates the existing tools — including, with disclosed interest, the author's — against them. The portable, repeatable prescription of Section 2.4 is exactly what a guided tool could carry between visits, provided it carries it faithfully. The argument is deliberately modest: the physiology is not new; what the field lacks is faithful, verifiable, monitored delivery between visits.

- **Make the invisible ceiling visible and live.** A continuous heart-rate read, shown against the prescribed band in real time — the trials themselves delivered the band on a worn heart-rate monitor [9,10] — converts an abstract bpm range into a moment-to-moment "in zone / over / under" signal. This is the most direct available means of making the ceiling self-dosable — though whether live feedback improves real-world fidelity is itself an empirical question (Section 5).

- **Be hardware-agnostic so the ceiling is always available.** Friction is the main threat to adherence. A tool should accept any wearable that broadcasts the standard Bluetooth Heart Rate profile — chest straps and most sports watches — and should fall back to clinician manual entry, meeting the patient where they are rather than mandating a purchase. Heart rate is the load-bearing measurement; sourcing it must never be the blocker. Two honest limits attach to any implementation: phone-camera photoplethysmography is unreliable during exercise because of motion artefact, so it should never drive a live training session; and some widely owned wrist devices do not broadcast the standard Bluetooth Heart Rate profile, so those users need a chest strap or manual entry.

- **Refuse to fabricate the signal, and let only verified signal advance the dose.** This is a safety property, not a feature. Because the prescription is a heart-rate ceiling, a wrong or invented bpm is a clinical hazard — it can allow a patient to exceed their provocation threshold undetected. A tool should only ever display a heart rate it actually measured and should show "no reading" rather than estimate. A second, stronger rule should govern progression: only a session whose heart rate was live-verified against a real sensor should advance the training band, and the band should never ratchet past the measured threshold — a fresh graded re-test being the only way to raise it further. Manual or unverified sessions can still count fully for safety (they can trigger a hold or regression) but should never push the ceiling up on trust alone.

- **Carry the safety logic, not just the timer.** The within-session >2-point symptom-stop rule, the red-flag halt-and-refer path, and the requirement for a symptom-limited (not exhaustion-limited) test to yield an HRt at all should be encoded, so the guardrails travel with the patient between visits.

- **Let the treatment follow the patient and report back.** Each threshold test and training session should return to the prescribing clinician in structured form — HRt trajectory, prescribed band, minutes, symptom deltas, next-day flares — so that serial HRt becomes the recovery curve in the record, and a re-test that no longer provokes symptoms surfaces as a key input to the return-to-activity decision rather than disappearing into a home diary. Structured between-visit return of concussion data to clinicians is already an established mobile-health pattern (Section 4.2).

- **Stay inside the prescriber relationship.** A delivery tool of this kind should be a clinician-directed assistant, not a consumer self-diagnosis product: the qualified clinician runs or oversees the threshold test, interprets it, sets the heart-rate band, owns the prescription, approves progression, and clears return to activity; the software executes, paces, monitors, and records. It informs; it never decides. Even so, software that analyses a live physiological signal and is operated by the patient may fall outside clinical-decision-support carve-outs — such as those under the US 21st Century Cures Act §3060 and the TGA's clinical-decision-support exclusion, which are drafted around clinician-facing software that does not process device signals — and be regulated as software as a medical device. Classification turns on claims and intended use, and a formal regulatory scoping opinion should precede any launch.

### 4.1 Why "active" and not "pacing"

It is worth distinguishing this from the better-known consumer category. Pacing apps for ME/CFS and long COVID (e.g. Visible) are built to help users *avoid* exertion and stay under an energy ceiling to prevent post-exertional malaise. That is the right goal in those conditions. The SSTAE prescription is the active-rehabilitation counterpart: the heart-rate band is a therapeutic target to train within, not merely a ceiling to stay under, and the explicit aim is to progressively raise it as tolerance recovers. Same wearable substrate; opposite therapeutic intent. Conflating the two would be a clinical error, which is why a delivery tool must frame the band as a prescribed training zone with clinician-owned progression, not as an exertion alarm. The distinction also runs the other way: a minority of exertion-intolerant patients present with post-exertional-malaise-pattern responses (including comorbid postural orthostatic tachycardia presentations) for whom train-up-to-the-band framing is inappropriate — a delivery tool should screen for such responses and divert them to clinician review rather than train through them.

### 4.2 What already exists — and the narrow, honest novelty

It would be wrong to imply that no one has digitised this prescription. The honest claim must be made against the existing prior art, which this review extends rather than ignores:

- A concussion rehabilitation app (Rhea Health, a University of Toronto spin-out) already delivers heart-rate-targeted aerobic prescription [16]. Its published protocol, however, guides users to a fixed ~60% ± 5% of age-predicted maximal heart rate (220 − age), with no graded test to individualise the threshold; individualisation is limited to in-app same/better/worse symptom feedback [17]. The published descriptions do not report a dedicated clinician dashboard [16,17]. An RCT from the same group has likewise delivered early aerobic exercise using a progressive percentage of age-predicted-maximum heart rate [18]. (Neither Rhea nor the author's product is affiliated with the Buffalo group.)
- Between-visit mobile-health symptom monitoring with structured return of data to clinicians is published [19].
- The pivotal Buffalo trials themselves delivered individualised HRt-based home exercise with wearable heart-rate monitoring — 80% of HRt with a home heart-rate monitor [9], and a serial-HRt-updated prescription with weekly BCTT recheck [10]. The Buffalo programme, however, is a research protocol; this review's mapping identified no commercial implementation of it apart from the author's disclosed attempt described below, and the measured-threshold approach is not proprietary to any group.
- A commercial concussion exercise-prescription module exists and is reaching Australia: the Complete Concussion Management Inc. (CCMI) and Wibbi partnership (announced December 2025) embeds concussion protocols in a digital home-exercise-programme platform with outcome tracking [20]. The published description reports symptom and outcome-score tracking; it does not describe digital delivery of a serial measured-HRt curve [20].
- Concussion *assessment* platforms (e.g. Sway [21]) digitise symptom, balance and cognitive testing; their published descriptions include no exertion- or heart-rate-guided therapy. Supervised heart-rate-zone training is an established pattern in app-based cardiac rehabilitation; this review's mapping identified no equivalently supervised, at-scale commercial implementation for concussion.

Against that backdrop, the defensible finding is not "first digital delivery." It is narrower and construct-level: none of the third-party tools identified in this review combines a *measured* heart-rate threshold (BCTT-derived, not age-predicted-maximum), *live verification-gated* heart-rate-zone training, and a *serial measured-HRt clinician trajectory* in one clinician-supervised workflow. The closest comparators each lack at least one element: the Rhea protocol uses a fixed age-predicted-maximum percentage with no graded test and no reported clinician dashboard [16,17]; the CCMI–Wibbi module's published description reports outcome-score tracking rather than a serial measured-HRt curve [20]. Each element exists somewhere in the prior art; the observation concerns their combination — and it is made against criteria the author framed, so the disclosed interest applies to the comparison as much as to the product.

The author's software (SST Trainer, developed by Concussion Education Australia — the competing interest disclosed in the Methods and Declarations) is one attempt to implement the Section 4 requirements as stated. Whether it achieves that combination in practice is a product claim this review does not adjudicate; it is asserted here only as design intent. The software is named for transparency and located against the same criteria as its comparators; consistent with Section 5, no efficacy claim is made for it.

## 5. Limitations and honest scope

The strongest randomised evidence for SSTAE is in adolescents with sport-related concussion in the early window; the adult and persistent-symptom evidence, while supportive, is thinner and calls for better trials [13]. A digital delivery tool inherits this evidence base — it can make faithful delivery of an evidence-based prescription easier and more measurable, but it does not, by itself, constitute new efficacy evidence. The honest claim for such software is verification-by-design and faithful delivery, not a new clinical outcome. A retrospective, observational analysis of de-identified routine-care data (serial HRt trajectories, adherence, time-to-clearance) accumulated through normal clinical use is the appropriate first step toward outcome evidence; an efficacy claim would additionally require prospective controlled evaluation.

Digital delivery is also not a free good, and the case for it should not be made one-sidedly. Whether a wearable-guided app actually improves between-visit delivery is itself an empirical question, not a given: app-based adherence commonly decays over weeks; live heart-rate feedback can be misread under exertion or anxiety; consumer optical sensors are least accurate at exactly the exercising heart rates that matter; and any tool introduces equity and access concerns — the cost of a wearable, smartphone and data, and a digital-literacy and language barrier that can widen rather than narrow disparities in who receives faithful rehabilitation. Privacy and data-governance obligations attach to any between-visit clinical data flow. These are the reasons the contribution is framed as verification-by-design and a measurable delivery substrate — and why its real-world value, like its efficacy, is deferred to evaluation rather than asserted.

The delivery argument also inherits the boundaries of the test and the prescription themselves. Graded exercise testing has standard contraindications and requires clinical pre-screening and supervision; nothing here extends to unsupervised, self-administered threshold testing. Between-visit sessions depend on honest, accurate symptom self-report for the stop rule. And the prescription addresses only the physiological phenotype — cervicogenic and vestibulo-ocular symptom drivers require their own assessment and targeted treatment, which a heart-rate band does not provide.

## 6. Conclusion

Concussion management has completed a genuine paradigm shift: from rest-until-symptom-free to early, individualised, sub-symptom-threshold aerobic exercise, anchored to a heart-rate threshold from a standardised graded test, and endorsed by the field's consensus statement. The remaining problem is not what to prescribe but how to deliver it faithfully between visits, when the therapeutic ceiling is invisible, the sessions are unobserved, and the data needed to progress safely are the data that get lost. Tools that are clinician-prescribed, wearable-delivered, hardware-agnostic in how they read heart rate, uncompromising in never fabricating that signal, and built to carry the safety logic and report back to the prescriber are candidate instruments for closing that gap. The contribution such tools offer is integration and faithful, verifiable delivery of an established treatment — not new physiology, and not, on their own, new outcome evidence. Whether they deliver that promise in practice — improving adherence and real-world delivery without widening access disparities — is precisely the question the next phase of evaluation, set out above, must answer.

## Declarations

**Competing interests.** The author (ZL) is the developer and founder of the SST Trainer software and of Concussion Education Australia, which is referenced in Section 4.2 as one disclosed instance of the delivery requirements discussed. No other competing interests are declared. The steps taken to mitigate this interest are described in the Methods.

**Funding.** This work received no specific grant from any funding agency in the public, commercial, or not-for-profit sectors; it was conducted independently by the author.

**Ethics approval.** Not applicable. This is a narrative review of previously published literature and involved no human participants, human data, or animal subjects.

**Data availability.** Not applicable. No new data were generated or analysed; all sources are cited in the reference list.

**Author contributions.** ZL is the sole author and conceived, researched, and wrote the manuscript.

## References

1. Leddy JJ, Haider MN, Ellis M, Willer BS. Exercise is Medicine for Concussion. *Curr Sports Med Rep.* 2018;17(8):262–270. doi:10.1249/JSR.0000000000000505
2. Pelo R, Suttman E, Fino PC, McFarland MM, Dibble LE, Cortez MM. Autonomic dysfunction and exercise intolerance in concussion: a scoping review. *Clin Auton Res.* 2023;33(2):149–163. doi:10.1007/s10286-023-00937-x
3. Valaas LV, Soberg HL, Rasmussen MS, Steenstrup SE, Kleffelgård I. Exploring exercise intolerance in adult patients with persistent post-concussion symptoms after mild traumatic brain injury. *J Rehabil Med.* 2025;57:jrm43931. doi:10.2340/jrm.v57.43931
4. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711. doi:10.1136/bjsports-2023-106898
5. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376. doi:10.1249/JSR.0000000000000008
6. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. Reliability of a graded exercise test for assessing recovery from concussion. *Clin J Sport Med.* 2011;21(2):89–94. doi:10.1097/JSM.0b013e3181fdc721
7. Haider MN, Leddy JJ, Wilber CG, et al. The Predictive Capacity of the Buffalo Concussion Treadmill Test After Sport-Related Concussion in Adolescents. *Front Neurol.* 2019;10:395. doi:10.3389/fneur.2019.00395
8. Leddy JJ, Kozlowski K, Donnelly JP, Pendergast DR, Epstein LH, Willer B. A preliminary study of subsymptom threshold exercise training for refractory post-concussion syndrome. *Clin J Sport Med.* 2010;20(1):21–27. doi:10.1097/JSM.0b013e3181c6c22c
9. Leddy JJ, Haider MN, Ellis MJ, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial. *JAMA Pediatr.* 2019;173(4):319–325. doi:10.1001/jamapediatrics.2018.4397
10. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799. doi:10.1016/S2352-4642(21)00267-4
11. Willer BS, Haider MN, Bezherano I, et al. Comparison of Rest to Aerobic Exercise and Placebo-like Treatment of Acute Sport-Related Concussion in Male and Female Adolescents. *Arch Phys Med Rehabil.* 2019;100(12):2267–2275. doi:10.1016/j.apmr.2019.07.003
12. Leddy JJ, Burma JS, Toomey CM, et al. Rest and exercise early after sport-related concussion: a systematic review and meta-analysis. *Br J Sports Med.* 2023;57(12):762–770. doi:10.1136/bjsports-2022-106676
13. Haider MN, Bezherano I, Wertheimer A, et al. Exercise for Sport-Related Concussion and Persistent Postconcussive Symptoms. *Sports Health.* 2021;13(2):154–160. doi:10.1177/1941738120946015
14. Bezherano I, Haider MN, Willer BS, Leddy JJ. Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting. *Clin J Sport Med.* 2021;31(5):465–468. doi:10.1097/JSM.0000000000000809
15. Chizuk HM, Haider MN, Edmonds JQ, Rawlings A, Willer BS, Leddy JJ. Practical Management: A Standardized Aerobic Exercise Program for Adolescents With Concussion in the Absence of Graded Exercise Testing. *Clin J Sport Med.* 2023;33(3):276–279. doi:10.1097/JSM.0000000000001116
16. Hutchison MG, Di Battista AP, Pyndiura KL. Evaluating User Experience and Satisfaction in a Concussion Rehabilitation App: Usability Study. *JMIR Form Res.* 2025;9:e67275. doi:10.2196/67275
17. Hutchison MG, Di Battista AP, Loenhart MM. A Continuous Aerobic Resistance Exercise Protocol for Concussion Rehabilitation Delivered Remotely via a Mobile App: Feasibility Study. *JMIR Form Res.* 2023;7:e45321. doi:10.2196/45321
18. Hutchison MG, Di Battista AP, Lawrence DW, Pyndiura K, Corallo D, Richards D. Randomized controlled trial of early aerobic exercise following sport-related concussion: Progressive percentage of age-predicted maximal heart rate versus usual care. *PLoS One.* 2022;17(12):e0276336. doi:10.1371/journal.pone.0276336
19. Ren S, McDonald CC, Corwin DJ, Wiebe DJ, Master CL, Arbogast KB. Response Rate Patterns in Adolescents With Concussion Using Mobile Health and Remote Patient Monitoring: Observational Study. *JMIR Pediatr Parent.* 2024;7:e53186. doi:10.2196/53186
20. Complete Concussion Management Inc. and Wibbi. Complete Concussions × Wibbi partnership announcement. December 2025. https://wibbi.com/resource/complete-concussions-wibbi-partnership/ (accessed 12 August 2026).
21. Sway Medical Inc. Sway Medical announces FDA 510(k) clearance of its comprehensive concussion management system (K241737). February 2025. https://www.prnewswire.com/news-releases/sway-medical-inc-announces-fda-510k-clearance-of-its-comprehensive-concussion-management-system-302385941.html (accessed 12 August 2026).
