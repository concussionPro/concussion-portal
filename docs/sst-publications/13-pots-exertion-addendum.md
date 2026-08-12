# Addendum: Exertion-Intolerance Rehabilitation with PEM Safeguarding (POTS / Long COVID pathway)

**STATUS: DRAFT — Zac reviews before any Zenodo deposit. Do NOT publish.**

Addendum to: *SST Trainer delivery protocol*, DOI 10.5281/zenodo.21482633 (CC BY).
Author: Zac Lewis, Concussion Education Australia. ORCID 0009-0002-4267-0451.

---

## Scope and language

This addendum extends the published SST Trainer delivery protocol to
**exertion-intolerance rehabilitation** in postural orthostatic tachycardia
syndrome (POTS) and post-COVID condition (long COVID), under clinician
supervision.

**Language doctrine (binding on every product surface and document):** the
pathway is never described as "graded exercise therapy". NICE NG206 (2021)
withdrew graded exercise therapy as a recommendation for ME/CFS on the basis of
harm; a substantial fraction of the long-COVID population meets ME/CFS criteria.
The correct description is *exertion-intolerance rehabilitation with
post-exertional-malaise (PEM) safeguarding*: an individually measured
heart-rate ceiling, symptom-contingent stops, automatic regression, and a
screening interlock that refuses to issue an exertion prescription at all when
PEM is present.

## 1 · The PEM interlock (fail-closed)

Before any heart-rate band can be issued on a PEM-risk pathway (long COVID and
other conditions flagged PEM-risk in the protocol engine), the patient completes
the 5-item DSQ-PEM short form (Cotler J, Holtzman C, Dudun C, Jason LA.
*A Brief Questionnaire to Assess Post-Exertional Malaise.* Diagnostics 2018;8(3):66.
doi:10.3390/diagnostics8030066), with the published frequency and severity
anchors rendered verbatim.

- **Scoring:** an item is positive when frequency ≥ 2 AND severity ≥ 2
  (the published DSQ-PEM screening rule). Any positive item → screen positive.
- **Positive screen → no prescription.** The engine refuses to compute or store
  a training band; the patient-facing surface presents pacing / energy-envelope
  guidance and referral back to the treating clinician. There is no clinician
  override in-product.
- **Fail-closed on both sides:** an absent or incomplete screen is treated as
  blocking, never as a pass. The client routes an unscreened PEM-risk patient to
  the screen before the symptom profile; the server independently re-scores the
  screen carried on every clinical event and refuses to store a band without a
  clear one.
- **Re-screening** is patient-initiated from the refusal screen; the pathway
  opens only on a clear screen.

## 2 · Modified exertion parameters (relative to the concussion protocol)

The concussion protocol's parameters are modified where the evidence base
differs:

| Parameter | Concussion pathway | Exertion-intolerance pathway |
|---|---|---|
| Training band | 80–90 % of measured HRt | **70–80 % of measured HRt** (conservative start; the exertion-intolerance literature supports lower initial intensity and slower progression) |
| In-session stop rule | Stop when symptoms rise **> 2 points** above pre-session (rise of ≤ 2 tolerated) | Same rule (> 2 points) |
| Progression | 3 clean **verified** sessions → +5 bpm, capped at measured HRt | Same mechanics; the cap and the verified-only evidence rule are unchanged |
| Regression | Automatic on flare; two consecutive flares → rest + clinician review | Same, and a next-day PEM-pattern flare weighs as a flare (see §3) |
| Screening interlock | none required | **DSQ-PEM, fail-closed (§1)** |

The delivery substrate is identical to the published protocol: measured (never
age-predicted) thresholds, live verification-gated sessions on the patient's own
wearable, no fabricated signal, automatic safety regression, clinician
oversight of every flag.

## 3 · Next-day surveillance

PEM is characteristically **delayed** (typically 12–48 h post-exertion). The
protocol's next-day check-in window (12–36 h, published protocol v2 §5) is
therefore load-bearing on this pathway, not optional telemetry: a "worse"
next-day answer is treated as a flare for regression purposes even when the
session itself was symptom-clean. The daily (rest-day) check-in provides the
comparator that distinguishes post-exertional worsening from background
fluctuation.

## 4 · Orthostatic (NASA lean) measurement

The pathway adds a standing orthostatic test as a serial measurement for the
clinician, delivered through the same instrument-grade capture rules as the
graded test:

- **Protocol:** supine rest (≥ 2 min in-product; clinicians may extend), then
  stand leaning against a wall, still, with heart rate recorded at 1, 3, 5 and
  10 minutes.
- **Criterion reported:** a **sustained heart-rate rise ≥ 30 bpm within 10 min
  of standing** (≥ 40 bpm for adolescents), without orthostatic hypotension, is
  the consensus orthostatic-tachycardia criterion used in POTS assessment
  (Freeman R et al. *Consensus statement on the definition of orthostatic
  hypotension, neurally mediated syncope and the postural tachycardia
  syndrome.* Auton Neurosci 2011;161(1-2):46-48. doi:10.1016/j.autneu.2011.02.004;
  Sheldon RS et al. *2015 Heart Rhythm Society expert consensus statement on the
  diagnosis and treatment of postural tachycardia syndrome, inappropriate sinus
  tachycardia, and vasovagal syncope.* Heart Rhythm 2015;12(6):e41-e63.
  doi:10.1016/j.hrthm.2015.03.029). In-product, "sustained" is operationalised
  as the criterion rise present at both the 5- and 10-minute marks.
- **Honesty rails:** the product presents the result as a *screening
  measurement for the clinician, not a diagnosis*, in those words. Live-fed
  readings are captured at the mark; typed readings are stored unverified and
  labelled as such. The orthostatic record is stored as its own event type and
  is excluded from the graded-test threshold history — a lean test never
  masquerades as a graded exertion test.

## 5 · Data and reporting

Orthostatic results, PEM screens (including who screened and when), session
verification provenance, and next-day responses all ride the existing
registry-grade sync: clinic-scoped patient codes, on-device derivation of
days-since-onset (the date itself never leaves the device), consent flags on
every event, Australian data residency (stored and processed in the Sydney
region).

## References

1. Cotler J, Holtzman C, Dudun C, Jason LA. A Brief Questionnaire to Assess Post-Exertional Malaise. *Diagnostics*. 2018;8(3):66. doi:10.3390/diagnostics8030066
2. NICE. *Myalgic encephalomyelitis (or encephalopathy)/chronic fatigue syndrome: diagnosis and management.* NICE guideline NG206, 2021.
3. Freeman R, Wieling W, Axelrod FB, et al. Consensus statement on the definition of orthostatic hypotension, neurally mediated syncope and the postural tachycardia syndrome. *Auton Neurosci*. 2011;161(1-2):46-48. doi:10.1016/j.autneu.2011.02.004
4. Sheldon RS, Grubb BP, Olshansky B, et al. 2015 Heart Rhythm Society expert consensus statement on the diagnosis and treatment of postural tachycardia syndrome, inappropriate sinus tachycardia, and vasovagal syncope. *Heart Rhythm*. 2015;12(6):e41-e63. doi:10.1016/j.hrthm.2015.03.029
5. Lewis Z. *SST Trainer delivery protocol.* Zenodo. doi:10.5281/zenodo.21482633
