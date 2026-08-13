# Sub-symptom-threshold aerobic exercise for concussion: from the Buffalo test to digital, clinician-supervised delivery — a narrative review

**Zac Lewis**¹

¹ Concussion Education Australia, Australia. ORCID: 0009-0002-4267-0451.

**Corresponding author:** Zac Lewis, Concussion Education Australia. Email: z.lew87@gmail.com

**Article type:** Narrative review

**Keywords:** concussion; mild traumatic brain injury; sub-symptom-threshold aerobic exercise; Buffalo Concussion Treadmill Test; heart-rate threshold; exercise intolerance; digital health; wearable

## Abstract

For two decades the default management of concussion was rest until symptom-free. A coherent body of physiological and randomised-trial evidence has overturned that doctrine. Concussion produces a measurable, exercise-provocable autonomic phenotype — exercise intolerance — that can be quantified with a standardised graded treadmill test (the Buffalo Concussion Treadmill Test, BCTT) to a heart-rate threshold (HRt) at which symptoms are reproducibly exacerbated. Prescribing aerobic exercise just below that threshold (sub-symptom-threshold aerobic exercise, SSTAE) accelerated recovery in a randomised controlled trial in adolescents and, in a subsequent multicentre randomised trial, roughly halved the incidence of persistent post-concussive symptoms; the approach is now endorsed by the 6th International Consensus Statement on Concussion in Sport (Amsterdam 2022/2023). Yet delivery is hard: the prescription depends on an individualised, invisible heart-rate ceiling being respected in every unsupervised between-visit session. This narrative review traces the paradigm shift, summarises the threshold-test and SSTAE evidence — including the more equivocal adult trial evidence — and names the implementation gap between prescription and faithful between-visit delivery. It then proposes author-framed delivery requirements: a live, verified heart-rate signal displayed against the prescribed band; hardware-agnostic sourcing; refusal to fabricate readings; progression gated on verified sessions; and structured reporting back to the prescribing clinician. Existing tools, including one developed by the author (a disclosed competing interest), are located against those requirements. The defensible contribution of such tools is faithful, verifiable delivery of an established treatment: not new physiology, and not the first digital delivery.

## Summary box

**What is already known on this topic** — Sub-symptom-threshold aerobic exercise, dosed from a measured heart-rate threshold on a standardised graded test, is consensus-endorsed concussion care, and adherence to the home prescription predicts faster recovery.

**What this study adds** — It names the between-visit delivery gap — an invisible, individualised heart-rate ceiling and progression data that ordinary workflows do not capture — and proposes author-framed requirements for digital delivery: never fabricate the heart-rate signal, gate progression on verified sessions, and report structured records to the prescribing clinician.

**How this study might affect research, practice or policy** — Delivery fidelity is measurable and should be reported in future studies of exercise prescription for concussion; whether digital tools improve real-world delivery remains to be demonstrated.

## Methods

This is a narrative clinical review. PubMed and Google Scholar were searched (inception to July 2026) for English-language literature on concussion exercise intolerance, sub-symptom-threshold aerobic exercise (SSTAE), the Buffalo Concussion Treadmill Test, and digital or wearable delivery of heart-rate-targeted exercise, combining the terms *concussion*, *sub-symptom threshold*, *aerobic exercise*, *exercise intolerance*, *Buffalo Concussion Treadmill Test*, *heart-rate threshold*, *wearable*, and *digital therapeutic*. Randomised controlled trials, the international consensus statement, and primary methodological papers were prioritised, supplemented by reviews. The commercial and digital landscape discussed in Section 4.2 was mapped separately (to August 2026) from published app evaluations, vendor documentation, regulatory listings, and partnership announcements; that mapping is descriptive rather than exhaustive and rests partly on vendor grey literature; the comparative statements in Section 4.2 are limited to the tools identified by it. As a narrative synthesis, this is not a systematic review: it includes no formal protocol, screening flow, or risk-of-bias appraisal, and effect estimates are reported as published rather than pooled. Its aim is to map the evidence and the delivery gap, not to derive a new quantitative summary.

**Conflict of interest and its mitigation.** The author developed the SST Trainer software, which appears in Section 4.2 as one disclosed instance of the delivery requirements — not as the review's conclusion. To limit advocacy bias: the clinical evidence (Sections 1–3) is presented independently of any product; the delivery requirements (Section 4) are stated as product-independent design principles before any tool is named in the review's argument (this disclosure excepted); existing tools, including the author's, are then located against those principles with the interest disclosed (Section 4.2); and no efficacy claim is made for the author's software.

## 1. Introduction: the rest-to-active paradigm shift

### 1.1 The old doctrine and why it failed

Historically, concussion guidance prescribed *cognitive and physical rest until symptom resolution* — "cocoon therapy". The intuition was mechanical: an injured brain should be protected from load. But prolonged rest has costs. Deconditioning, sleep disruption, mood disturbance, social isolation and nocebo-style symptom focus all compound the original injury, and there was never randomised evidence that strict rest shortened recovery; a randomised trial of strict rest found a higher symptom burden and slower symptom resolution than usual care [1], and in a prospective cohort of 3,063 children and adolescents, physical activity within seven days of injury was associated with a significantly lower risk of persistent symptoms at 28 days than no activity (unadjusted 24.6% vs 43.5%; propensity-adjusted absolute risk difference 11.4%) [2]. By the mid-2010s, the rest prescription was being actively questioned.

The reframing that replaced it is captured in the title of Leddy and colleagues' influential synthesis, *Exercise is Medicine for Concussion* [3]. The argument is that a meaningful proportion of post-concussion symptom burden reflects not structural injury but a disorder of physiological regulation — autonomic and cerebrovascular dysregulation that is provoked by exertion and, crucially, is responsive to a graded aerobic stimulus delivered below the provocation threshold. Exercise, correctly dosed, is not a risk to be avoided; it is the treatment.

### 1.2 The physiological substrate: exercise intolerance

The clinical fingerprint of this phenotype is *exercise intolerance*: a reproducible exacerbation of concussion symptoms at a sub-maximal level of exertion that would be unremarkable in a healthy person. Mechanistically it is attributed to autonomic nervous system dysfunction and impaired cerebral autoregulation after the injury [4]. Exercise intolerance is common and clinically meaningful: in one exploratory cross-sectional study of 100 adults with persistent post-concussive symptoms, over 80% tested positive for exercise intolerance, and a higher symptom burden was associated with higher odds of testing positive [5]. The phenotype is thus apparently common, measurable, and the direct target of treatment.

### 1.3 What the consensus now says

The 6th International Consensus Statement on Concussion in Sport [6] codified the shift:

- **Relative rest for only 24–48 hours.** Light physical activity that does not more than mildly exacerbate symptoms (e.g. walking) is encouraged within the first 48 hours, provided it carries no risk of head impact.
- **Early prescribed aerobic exercise.** Sub-symptom-threshold aerobic exercise initiated within roughly 2–10 days of injury is recommended; it reduces the incidence of persisting symptoms and facilitates recovery, including in those whose symptoms have already persisted beyond a month.
- **A symptom-tolerance rule, not a symptom-free rule.** A mild, transient worsening of up to 2 points on a 0–10 scale during exercise is acceptable provided it settles within about an hour. This explicit tolerance band is what makes graded progression operable.

The consensus statement's scope is sport-related concussion. Convergent guidance exists beyond sport: the CDC guideline on paediatric mild traumatic brain injury likewise moved management away from prolonged rest toward gradual, symptom-guided activity [7], and the Ontario Neurotrauma Foundation's paediatric living guideline carries the same direction [8].

The remainder of this review establishes the evidence underneath each component of this doctrine — the test, the prescription, and the progression — and then names why faithful delivery is still hard.

## 2. The evidence

### 2.1 The Buffalo Concussion Treadmill Test (BCTT): turning a phenotype into a number

The instrument that operationalised exercise intolerance is the BCTT, a standardised graded treadmill test built on the cardiac Balke protocol [9]. The protocol — walk at a fixed starting speed, then increase the incline by 1° each minute for 15 stages, after which the speed increases — was chosen precisely because the Balke ramp is gentle, well-validated and established as safe, under clinical supervision, even in cardiac patients. Heart rate, rating of perceived exertion (Borg RPE) and a symptom-severity score are recorded every minute.

The test ends in one of three ways, and the distinction is the clinical signal:

- **Symptom-limited termination.** When symptoms rise by a defined amount above baseline, the test stops; the heart rate at that minute is the *heart-rate threshold (HRt)*. This is the exercise-intolerance phenotype, and HRt is the anchor for everything that follows.
- **Voluntary exhaustion without symptom provocation.** The patient reaches volitional fatigue (high RPE) without provoking concussion symptoms — that is, *no* exercise intolerance. This is informative: the symptom driver is likely something other than the physiological phenotype (cervicogenic, vestibular, or mood), and the workup should redirect.
- **Red-flag termination.** Any emergency sign halts the test and routes to medical review.

The BCTT is reliable as a repeated measure [10], which is what justifies serial testing as a recovery curve.

### 2.2 HRt and the heart-rate response are also prognostic

Beyond setting the dose, the threshold test forecasts recovery. In adolescents with sport-related concussion, an earlier randomised cohort from the same group found a low initial HRt strongly associated with prolonged (>21-day) recovery [11], summarised later as an HRt below ~135 bpm [12], and Haider and colleagues found that a blunted heart-rate response — a change in heart rate of ≤50 bpm across the test — predicted delayed (>30-day) recovery with roughly 73% sensitivity and 78% specificity in adolescents not treated with aerobic exercise (the rest and placebo-stretching arms) [12]. A single test both prescribes the dose and stratifies risk, and serial HRt becomes an objective recovery trajectory.

### 2.3 The randomised evidence for SSTAE and its effect sizes

The therapeutic claim rests on a coherent chain of trials, largely from the Buffalo group (Table 1).

**Origin.** A preliminary treadmill-training programme for refractory post-concussion syndrome demonstrated feasibility and symptom improvement at ~80% of the symptom-threshold heart rate [13].

**Pivotal RCT (JAMA Pediatrics, 2019).** In adolescents in the acute phase of sport-related concussion, sub-symptom-threshold aerobic exercise versus a placebo-like stretching programme accelerated recovery — median 13 versus 17 days [14].

**Multicentre extension (Lancet Child & Adolescent Health, 2021).** A three-site RCT by the originating group reproduced and extended the finding: targeted-heart-rate SSTAE roughly halved the risk of persistent post-concussive symptoms (the trial's reported hazard ratio for stretching versus aerobic exercise: 0.52, 95% CI 0.28–0.97, p=0.039) and shortened recovery, with good adherence and no adverse events [15]. Prevention of *persistence* — the costly outcome — rather than only speed is what moved SSTAE from promising to recommended.

**Supporting comparative work.** A comparison of rest versus aerobic exercise versus placebo-like treatment in male and female adolescents further supported active management over rest [16]. Systematic synthesis for the Amsterdam process concluded that early rest beyond 24–48 hours confers no benefit and that prescribed sub-symptom-threshold aerobic exercise is beneficial [17]. A separate review emphasised that the most effective method and dose of exercise, and whether early treatment can prevent persistent symptoms, remain open questions [18].

**Adults.** The randomised evidence in adults is thinner and more equivocal. In the one completed randomised trial in adults with persisting symptoms and exercise intolerance (Table 1), six weeks of sub-symptom-threshold aerobic exercise versus stretching produced no significant between-group difference in symptom burden; the programme was tolerated, and quality of life improved in some analyses [19].

**Table 1 — Key clinical trials of sub-symptom-threshold aerobic exercise discussed in this review**

| Study | Design | Population | Intervention | Comparator | Key result |
|---|---|---|---|---|---|
| Leddy 2010 [13] | Prospective case series (uncontrolled pilot) | Refractory post-concussion syndrome | Treadmill training at ~80% of symptom-threshold heart rate, most days | — (feasibility) | Feasible; symptom improvement |
| Leddy 2019 [14] | RCT | 103 adolescents, acute sport-related concussion (mean ~5 days post-injury) | Aerobic exercise at 80% of HRt, ~20 min/day | Placebo-like stretching | Median recovery 13 vs 17 days (p=0.009) |
| Leddy 2021 [15] | Multicentre RCT | 118 adolescents, within 10 days of injury, three sites | Aerobic exercise at 90% of HRt, weekly BCTT re-test | Placebo-like stretching | Risk of persistent symptoms roughly halved (hazard ratio for stretching vs aerobic 0.52, 95% CI 0.28–0.97) |
| Willer 2019 [16] | Quasi-experimental (non-randomised rest cohort, compared with matched RCT arms)* | Acute sport-related concussion, male and female adolescents | Sub-symptom-threshold aerobic exercise | Prescribed rest; placebo-like stretching | Active management supported over rest |
| Mercier 2025 [19] | RCT | 52 adults, persisting symptoms with exercise intolerance (~2 years post-injury) | 6-week sub-symptom-threshold aerobic programme | Stretching | No significant between-group symptom-burden difference; quality of life improved in some analyses |

\*The exercise and stretching arms of Willer 2019 are the randomised participants of the 2019 RCT; the samples overlap.

### 2.4 Prescribing without a treadmill

Not every clinician has a treadmill and the time for a staged test with per-minute logging. The Buffalo group addressed this in two practical-management papers: one detailing how to prescribe SSTAE in the outpatient setting from an HRt [20], and one giving a standardised programme in the absence of graded exercise testing [21]. A validated cycle-ergometer alternative also exists: the Buffalo Concussion Bike Test elicits an equivalent heart rate at symptom exacerbation to the treadmill test in adolescents (135 ± 25 vs 137 ± 28 bpm) [22], extending the measured threshold to settings without a treadmill. Together these establish that the prescription — a heart-rate-anchored band, ~20 minutes, most days, with a within-session symptom-stop rule and graded progression — is meant to be portable and repeatable.

### 2.5 What "the prescription" actually is

Distilling the above into the operational dose:

- **Anchor:** HRt from a symptom-limited graded test (the validated provocation criterion is a symptom rise of ≥3 points from rest) [9].
- **Band:** train at ~80–90% of HRt for concussion (80% in the pivotal adolescent trial; 90% in the multicentre trial) — a floor intended to preserve a training stimulus and a do-not-exceed ceiling that keeps the patient below provocation [13–15,18].
- **Dose:** ~20 minutes, most days of the week [14,15].
- **Within-session stop rule:** stop if symptoms rise more than 2 points above pre-session — the complement of the consensus's up-to-2-point tolerance band [6].
- **Progression:** advance the ceiling only after clean sessions (no within-session provocation, no next-day flare); regress on repeated provocation; re-test HRt to update precisely [20,21]. Serial HRt is the recovery curve; a re-test that no longer provokes symptoms is a key input to the return-to-activity decision.

## 3. The implementation gap

Here is the problem the evidence does not solve. The trials prescribed an individualised heart-rate ceiling and reported good adherence under clinician oversight [14,15]. In routine practice, three things break:

1. **The ceiling is individualised and invisible.** "Keep your heart rate between 124 and 140 bpm" is not something a patient can feel. Without a live read on heart rate, the patient is guessing — under-dosing (no stimulus, slow recovery) or overshooting the ceiling (provocation, a flare, lost confidence in active rehabilitation).

2. **The treatment happens between visits, unobserved.** Unlike a clinic-based modality, SSTAE is delivered mostly at home, most days, for weeks. The clinician prescribes once and then loses sight of what actually happened — heart rates achieved, minutes completed, symptom deltas, next-day flares — until the next appointment.

3. **The data needed to progress safely are exactly the data that are lost.** The progression decision (advance / hold / regress / refer) depends on a structured session history. Paper diaries are a demonstrably unreliable instrument in analogous self-report settings: actual compliance with paper symptom diaries is far lower than reported compliance, and entries are commonly backfilled [23]. Serial HRt — the objective recovery curve — has to date been captured mainly within research protocols and specialist programmes [14,15].

The gap is associated with an outcome cost: in a secondary analysis of randomised-trial participants, adolescents who adhered to their home aerobic prescription in the first week recovered in a median of 12 days versus 21.5 days for those who did not — and the initial degree of exercise intolerance, not symptom severity, predicted who adhered [24].

The result is an *evidence-practice gap*: a recommended, replicated, consensus-endorsed treatment whose efficacy depends on faithful between-visit delivery and monitoring that ordinary clinical workflows do not provide.

## 4. What faithful delivery requires (design principles)

The implementation gap defines a set of requirements for delivery that is faithful to the trialled protocol. They are proposed here by the author, informed by the trial procedures [13–15], the gap analysis in Section 3, and software-safety considerations, and stated at the level of requirements, independent of any vendor or product; Section 4.2 then locates the existing tools — including, with disclosed interest, the author's — against them. The argument is deliberately modest: the physiology is not new; what the field lacks is faithful, verifiable, monitored delivery between visits.

- **Make the invisible ceiling visible and live.** A continuous heart-rate read, shown against the prescribed band in real time — the trials themselves delivered the band on a worn heart-rate monitor [14,15] — converts an abstract bpm range into a moment-to-moment "in zone / over / under" signal. Whether live feedback improves real-world fidelity remains an empirical question (Section 5).

- **Be hardware-agnostic so the ceiling is always available.** Friction is a major threat to adherence. A tool should accept any wearable that broadcasts the standard Bluetooth Heart Rate profile — chest straps and most sports watches — and should fall back to clinician manual entry, meeting the patient where they are rather than mandating a purchase. Two limits attach to any implementation: optical heart-rate measurement degrades with motion — smartphone-camera apps show variable accuracy [25] and wrist-worn optical sensors are measurably less accurate during aerobic exercise [26] — so a phone-camera estimate should never drive a live training session; and some widely owned wrist devices do not broadcast the standard Bluetooth Heart Rate profile, so those users need a chest strap or manual entry.

- **Refuse to fabricate the signal, and let only verified signal advance the dose.** This is a safety property, not a feature. Because the prescription is a heart-rate ceiling, a wrong or invented bpm is a clinical hazard — it can allow a patient to exceed their provocation threshold undetected. A tool should only ever display a heart rate it actually measured and should show "no reading" rather than estimate. A stronger rule should govern progression: only sessions live-verified against a real sensor should advance the band, and the band should never ratchet past the measured threshold — only a fresh graded re-test raises it further. Manual or unverified sessions can still count fully for safety (they can trigger a hold or regression) but should never push the ceiling up on trust alone.

- **Carry the safety logic, not just the timer.** The within-session >2-point symptom-stop rule, the red-flag halt-and-refer path, and the requirement for a symptom-limited (not exhaustion-limited) test to yield an HRt at all should be encoded, so the guardrails travel with the patient between visits.

- **Let the treatment follow the patient and report back.** Each threshold test and training session should return to the prescribing clinician in structured form — HRt trajectory, prescribed band, minutes, symptom deltas, next-day flares — so that serial HRt becomes the recovery curve in the record, and a re-test that no longer provokes symptoms surfaces as a key input to the return-to-activity decision rather than disappearing into a home diary.

- **Stay inside the prescriber relationship.** A delivery tool of this kind should be a clinician-directed assistant, not a consumer self-diagnosis product: the qualified clinician runs or oversees the threshold test, interprets it, sets the heart-rate band, owns the prescription, approves progression, and clears return to activity; the software executes, paces, monitors, and records. It informs; it never decides. Even so, software that analyses a live physiological signal and is operated by the patient may fall outside clinical-decision-support carve-outs — such as the carve-out under the US 21st Century Cures Act §3060 and the TGA's clinical-decision-support exemption, both drafted around clinician-facing software that does not process device signals — and be regulated as software as a medical device. Classification turns on claims and intended use, and a formal regulatory scoping opinion should precede launch — or, for tools already in clinical use, be obtained without delay.

### 4.1 Why "active" and not "pacing"

It is worth distinguishing this from the better-known consumer category. Pacing apps for ME/CFS and long COVID are typically built to help users *avoid* exertion and stay under an energy ceiling to prevent post-exertional malaise. That is the right goal in those conditions. The SSTAE prescription is the active-rehabilitation counterpart: the heart-rate band is a therapeutic target to train within, not merely a ceiling to stay under, and the explicit aim is to progressively raise it as tolerance recovers. Same wearable substrate; opposite therapeutic intent. Conflating the two would be a clinical error, which is why a delivery tool must frame the band as a prescribed training zone with clinician-owned progression, not as an exertion alarm. The distinction also runs the other way: some exertion-intolerant patients may present with post-exertional-malaise-pattern responses (including comorbid postural orthostatic tachycardia presentations) for whom train-up-to-the-band framing is inappropriate — a delivery tool should screen for such responses and divert those patients to clinician review rather than train through the response.

### 4.2 What already exists — and the narrow residual claim

Any novelty claim must be made against the prior art, which this review extends rather than ignores:

- A concussion rehabilitation app (Rhea Health, a University of Toronto spin-out) already delivers heart-rate-targeted aerobic prescription [27]. Its published protocol, however, guides users to a fixed ~60% ± 5% of age-predicted maximal heart rate (220 − age), with no graded test to individualise the threshold; individualisation is limited to in-app same/better/worse symptom feedback [28]. The cited evaluations do not report a dedicated clinician dashboard [27,28]. An RCT from the same group has likewise delivered early aerobic exercise using a progressive percentage of age-predicted maximal heart rate [29]. (Neither Rhea nor the author's product is affiliated with the Buffalo group.)
- Between-visit mobile-health symptom monitoring with structured return of data to clinicians is published [30].
- The pivotal Buffalo trials themselves delivered individualised HRt-based home exercise with wearable heart-rate monitoring — 80% of HRt with a home heart-rate monitor [14], and a serial-HRt-updated prescription with weekly BCTT recheck [15]. The Buffalo programme, however, is a research protocol; this review's mapping identified no commercial implementation of it apart from the author's disclosed attempt described below, and the measured-threshold approach is not proprietary to any group.
- A commercial concussion exercise-prescription module exists: the Complete Concussion Management Inc. (CCMI) and Wibbi partnership (announced December 2025) embeds concussion protocols in a digital home-exercise-programme platform with real-time outcome monitoring and progress tracking [31]. The published description does not, however, describe digital delivery of a serial measured-HRt curve [31].
- Concussion *assessment* platforms digitise symptom, balance and cognitive testing — Sway's FDA-cleared scope, for example, covers cognitive and balance assessment only [32] — and none identified by the mapping delivers exertion- or heart-rate-guided therapy. Remotely monitored, app-supported exercise rehabilitation with structured clinician review is an established pattern in cardiac care [33]; this review's mapping identified no equivalent at-scale commercial implementation for concussion.

Against that backdrop, the defensible observation is not "first digital delivery". It is narrower and construct-level: none of the third-party tools identified in this review combines a *measured* heart-rate threshold (BCTT-derived, not age-predicted maximal), *live verification-gated* heart-rate-zone training, and a *serial measured-HRt clinician trajectory* in one clinician-supervised workflow. The closest comparators each lack at least one element: the Rhea protocol uses a fixed percentage of age-predicted maximal heart rate with no graded test and no reported clinician dashboard [27,28]; the CCMI–Wibbi module's published description reports outcome monitoring and progress tracking rather than a serial measured-HRt curve [31]. Each element exists somewhere in the prior art; the observation concerns their combination — and it is made against criteria the author framed, so the disclosed interest applies to the comparison as much as to the product. Two further qualifications: standardised and age-predicted programmes are themselves evidence-supported [21,29], and no trial has compared measured-threshold-anchored delivery with age-predicted delivery head-to-head. The case for the measured threshold is therefore fidelity to the trialled Buffalo protocol and the prognostic value of the serial measurement (Section 2.2) — not a demonstrated outcome advantage.

The author's software (SST Trainer, developed by Concussion Education Australia — the competing interest disclosed in the Methods and Declarations) is one attempt to implement the Section 4 requirements as stated. Whether it achieves that combination in practice is a product claim this review does not adjudicate; it is asserted here only as design intent. The software is in early, clinician-gated commercial release in Australia, supplied on the developer's self-assessment of the boundary described above, with regulatory guidance sought from the TGA; the formal scoping recommended above applies to it no less than to any other tool in the category. It is named for transparency, judged by the same criteria as its comparators, and carries no efficacy claim.

## 5. Limitations and scope

The strongest randomised evidence for SSTAE is in adolescents with sport-related concussion in the early window. In adults with persisting symptoms the evidence is thinner and more equivocal — the one completed randomised trial found no significant between-group symptom-burden benefit [19] — and the optimal dose and mode of exercise remain open questions [18]. A digital tool inherits this evidence base: it can make faithful delivery easier and more measurable, but does not, by itself, constitute new efficacy evidence. The defensible claim for such software is verification-by-design and faithful delivery, not a new clinical outcome. A retrospective, observational analysis of de-identified routine-care data (serial HRt trajectories, adherence, time-to-clearance) is the appropriate first step towards outcome evidence; an efficacy claim would additionally require prospective controlled evaluation.

Nor is digital delivery a free good. Whether a wearable-guided app actually improves between-visit delivery is itself an empirical question, not a given: app-based adherence commonly decays over weeks [34]; live heart-rate feedback can be misread under exertion or anxiety; consumer optical sensors are less accurate during exercise [26]; and any tool raises equity concerns — wearable, smartphone and data costs, plus digital-literacy and language barriers that can widen disparities. Privacy and data-governance obligations attach to any between-visit clinical data flow. Hence the framing: verification-by-design and a measurable delivery substrate, with real-world value deferred to evaluation rather than asserted.

The delivery argument also inherits the boundaries of the test and the prescription themselves. Graded exercise testing has standard contraindications and requires clinical pre-screening and supervision; nothing here extends to unsupervised, self-administered threshold testing. Between-visit sessions depend on honest, accurate symptom self-report for the stop rule. And the prescription addresses only the physiological phenotype — cervicogenic and vestibulo-ocular symptom drivers require their own assessment and targeted treatment, which a heart-rate band does not provide.

## 6. Conclusion

Concussion management has completed a genuine paradigm shift: from rest-until-symptom-free to early, individualised, sub-symptom-threshold aerobic exercise, anchored to a measured heart-rate threshold and endorsed by the field's consensus statement. The remaining problem is not what to prescribe but how to deliver it faithfully between visits, when the therapeutic ceiling is invisible, the sessions are unobserved, and the data needed to progress safely are the data that get lost. Tools that are clinician-prescribed, wearable-delivered, hardware-agnostic in how they read heart rate, strict in never fabricating that signal, and built to carry the safety logic and report back to the prescriber are candidate instruments for closing that gap. The contribution such tools offer is integration and faithful, verifiable delivery of an established treatment — not new physiology, and not, on their own, new outcome evidence. Whether they deliver that promise in practice — improving real-world delivery without widening disparities — is precisely the question the next phase of evaluation, set out above, must answer.

## Declarations

**Competing interests.** The author (ZL) is the founder of Concussion Education Australia and the developer of the SST Trainer software, which is referenced in Section 4.2 as one disclosed instance of the delivery requirements discussed. No other competing interests are declared. The steps taken to mitigate this interest are described in the Methods.

**Funding.** This work received no specific grant from any funding agency in the public, commercial, or not-for-profit sectors; it was conducted independently by the author.

**Ethics approval.** Not applicable. This is a narrative review of previously published literature and involved no human participants, human data, or animal subjects.

**Data availability.** Not applicable. No new data were generated or analysed; all sources are cited in the reference list.

**Author contributions.** ZL is the sole author and conceived, researched, and wrote the manuscript.

## References

1. Thomas DG, Apps JN, Hoffmann RG, McCrea M, Hammeke T. Benefits of strict rest after acute concussion: a randomized controlled trial. *Pediatrics.* 2015;135(2):213–223. doi:10.1542/peds.2014-0966
2. Grool AM, Aglipay M, Momoli F, et al. Association Between Early Participation in Physical Activity Following Acute Concussion and Persistent Postconcussive Symptoms in Children and Adolescents. *JAMA.* 2016;316(23):2504–2514. doi:10.1001/jama.2016.17396
3. Leddy JJ, Haider MN, Ellis M, Willer BS. Exercise is Medicine for Concussion. *Curr Sports Med Rep.* 2018;17(8):262–270. doi:10.1249/JSR.0000000000000505
4. Pelo R, Suttman E, Fino PC, McFarland MM, Dibble LE, Cortez MM. Autonomic dysfunction and exercise intolerance in concussion: a scoping review. *Clin Auton Res.* 2023;33(2):149–163. doi:10.1007/s10286-023-00937-x
5. Valaas LV, Soberg HL, Rasmussen MS, Steenstrup SE, Kleffelgård I. Exploring exercise intolerance in adult patients with persistent post-concussion symptoms after mild traumatic brain injury. *J Rehabil Med.* 2025;57:jrm43931. doi:10.2340/jrm.v57.43931
6. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711. doi:10.1136/bjsports-2023-106898
7. Lumba-Brown A, Yeates KO, Sarmiento K, et al. Centers for Disease Control and Prevention Guideline on the Diagnosis and Management of Mild Traumatic Brain Injury Among Children. *JAMA Pediatr.* 2018;172(11):e182853. doi:10.1001/jamapediatrics.2018.2853
8. Ontario Neurotrauma Foundation / PedsConcussion. Living guideline for paediatric concussion care. https://pedsconcussion.com/ (accessed 14 August 2026).
9. Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. *Curr Sports Med Rep.* 2013;12(6):370–376. doi:10.1249/JSR.0000000000000008
10. Leddy JJ, Baker JG, Kozlowski K, Bisson L, Willer B. Reliability of a graded exercise test for assessing recovery from concussion. *Clin J Sport Med.* 2011;21(2):89–94. doi:10.1097/JSM.0b013e3181fdc721
11. Leddy JJ, Hinds AL, Miecznikowski J, et al. Safety and Prognostic Utility of Provocative Exercise Testing in Acutely Concussed Adolescents: A Randomized Trial. *Clin J Sport Med.* 2018;28(1):13–20. doi:10.1097/JSM.0000000000000431
12. Haider MN, Leddy JJ, Wilber CG, et al. The Predictive Capacity of the Buffalo Concussion Treadmill Test After Sport-Related Concussion in Adolescents. *Front Neurol.* 2019;10:395. doi:10.3389/fneur.2019.00395
13. Leddy JJ, Kozlowski K, Donnelly JP, Pendergast DR, Epstein LH, Willer B. A preliminary study of subsymptom threshold exercise training for refractory post-concussion syndrome. *Clin J Sport Med.* 2010;20(1):21–27. doi:10.1097/JSM.0b013e3181c6c22c
14. Leddy JJ, Haider MN, Ellis MJ, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial. *JAMA Pediatr.* 2019;173(4):319–325. doi:10.1001/jamapediatrics.2018.4397
15. Leddy JJ, Master CL, Mannix R, et al. Early targeted heart rate aerobic exercise versus placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. *Lancet Child Adolesc Health.* 2021;5(11):792–799. doi:10.1016/S2352-4642(21)00267-4
16. Willer BS, Haider MN, Bezherano I, et al. Comparison of Rest to Aerobic Exercise and Placebo-like Treatment of Acute Sport-Related Concussion in Male and Female Adolescents. *Arch Phys Med Rehabil.* 2019;100(12):2267–2275. doi:10.1016/j.apmr.2019.07.003
17. Leddy JJ, Burma JS, Toomey CM, et al. Rest and exercise early after sport-related concussion: a systematic review and meta-analysis. *Br J Sports Med.* 2023;57(12):762–770. doi:10.1136/bjsports-2022-106676
18. Haider MN, Bezherano I, Wertheimer A, et al. Exercise for Sport-Related Concussion and Persistent Postconcussive Symptoms. *Sports Health.* 2021;13(2):154–160. doi:10.1177/1941738120946015
19. Mercier LJ, McIntosh SJ, Boucher C, et al. Effect of Aerobic Exercise on Symptom Burden and Quality of Life in Adults With Persisting Post-concussive Symptoms: The ACTBI Randomized Controlled Trial. *Arch Phys Med Rehabil.* 2025;106(2):195–205. doi:10.1016/j.apmr.2024.10.002
20. Bezherano I, Haider MN, Willer BS, Leddy JJ. Practical Management: Prescribing Subsymptom Threshold Aerobic Exercise for Sport-Related Concussion in the Outpatient Setting. *Clin J Sport Med.* 2021;31(5):465–468. doi:10.1097/JSM.0000000000000809
21. Chizuk HM, Haider MN, Edmonds JQ, Rawlings A, Willer BS, Leddy JJ. Practical Management: A Standardized Aerobic Exercise Program for Adolescents With Concussion in the Absence of Graded Exercise Testing. *Clin J Sport Med.* 2023;33(3):276–279. doi:10.1097/JSM.0000000000001116
22. Haider MN, Johnson SL, Mannix R, et al. The Buffalo Concussion Bike Test for Concussion Assessment in Adolescents. *Sports Health.* 2019;11(6):492–497. doi:10.1177/1941738119870189
23. Stone AA, Shiffman S, Schwartz JE, Broderick JE, Hufford MR. Patient non-compliance with paper diaries. *BMJ.* 2002;324(7347):1193–1194. doi:10.1136/bmj.324.7347.1193
24. Chizuk HM, Willer BS, Cunningham A, et al. Adolescents with Sport-Related Concussion Who Adhere to Aerobic Exercise Prescriptions Recover Faster. *Med Sci Sports Exerc.* 2022;54(9):1410–1416. doi:10.1249/MSS.0000000000002952
25. Coppetti T, Brauchlin A, Müggler S, et al. Accuracy of smartphone apps for heart rate measurement. *Eur J Prev Cardiol.* 2017;24(12):1287–1293. doi:10.1177/2047487317702044
26. Gillinov S, Etiwy M, Wang R, et al. Variable accuracy of wearable heart rate monitors during aerobic exercise. *Med Sci Sports Exerc.* 2017;49(8):1697–1703. doi:10.1249/MSS.0000000000001284
27. Hutchison MG, Di Battista AP, Pyndiura KL. Evaluating User Experience and Satisfaction in a Concussion Rehabilitation App: Usability Study. *JMIR Form Res.* 2025;9:e67275. doi:10.2196/67275
28. Hutchison MG, Di Battista AP, Loenhart MM. A Continuous Aerobic Resistance Exercise Protocol for Concussion Rehabilitation Delivered Remotely via a Mobile App: Feasibility Study. *JMIR Form Res.* 2023;7:e45321. doi:10.2196/45321
29. Hutchison MG, Di Battista AP, Lawrence DW, Pyndiura K, Corallo D, Richards D. Randomized controlled trial of early aerobic exercise following sport-related concussion: Progressive percentage of age-predicted maximal heart rate versus usual care. *PLoS One.* 2022;17(12):e0276336. doi:10.1371/journal.pone.0276336
30. Ren S, McDonald CC, Corwin DJ, Wiebe DJ, Master CL, Arbogast KB. Response Rate Patterns in Adolescents With Concussion Using Mobile Health and Remote Patient Monitoring: Observational Study. *JMIR Pediatr Parent.* 2024;7:e53186. doi:10.2196/53186
31. Complete Concussion Management Inc. and Wibbi. Complete Concussions × Wibbi partnership announcement. December 2025. https://wibbi.com/resource/complete-concussions-wibbi-partnership/ (accessed 12 August 2026).
32. US Food and Drug Administration. 510(k) premarket notification K241737 (Sway Medical, Inc.). Decision date February 2025. https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K241737 (accessed 12 August 2026).
33. Varnfield M, Karunanithi M, Lee CK, et al. Smartphone-based home care model improved use of cardiac rehabilitation in postmyocardial infarction patients: results from a randomised controlled trial. *Heart.* 2014;100(22):1770–1779. doi:10.1136/heartjnl-2014-305783
34. Eysenbach G. The law of attrition. *J Med Internet Res.* 2005;7(1):e11. doi:10.2196/jmir.7.1.e11
