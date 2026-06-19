# Sub-Symptom-Threshold Trainer — UI scaffold + design brief

This folder is a **functional scaffold awaiting a visual-design pass**. The logic
is correct and wired to the engine; the styling is deliberately plain. Every spot
that needs design attention is marked inline with a `{/* DESIGN: ... */}` comment
(and `{/* DESIGN+TODO: ... */}` where a future capability also needs building).

## The product

A home-based, paced-exercise app for concussion → broader neurorehab. It finds the
patient's **heart-rate threshold (HRt)** — the HR at which their symptoms start —
via a guided per-minute graded ramp (Buffalo Concussion Treadmill Test logic), then
prescribes a **sub-symptom-threshold aerobic training band** (≈80–90% of HRt) and
manages day-to-day progression within that symptom-defined ceiling. Set up and
overseen by the patient's clinician; not a diagnosis or return-to-play clearance.

## Design intent

- **Premium, calm, reassuring.** This is a recovering brain-injury patient. No
  clutter, no alarm except where genuinely warranted (red flags).
- **Instrument-grade clarity.** The HR readout, the training band, and the symptom
  scales should read like a precision instrument — large, legible, unambiguous.
- **One-handed, mid-exercise usability.** Patients use this while walking/cycling.
  Big tap targets, bottom-reachable primary actions, glanceable live HR + zone.
- **Accessible / high-contrast.** WCAG AA minimum; never rely on colour alone for
  the in-band / over-ceiling / flare states (pair with text/icon).
- **Brand teal `#5b9aa6`** is the accent. Red is reserved for red-flag / over-ceiling
  stop states; amber for within-session symptom-rise warnings.

## Screen flow (state machine in `app/sst-trainer/page.tsx`)

1. **WelcomeMode** — self-guided vs clinic-code, condition picker.
2. **SymptomSelect** — preselect the symptoms the patient actually gets.
3. **Readiness** — red-flag/contraindication check (blocks on any tick), resting
   symptom score, consent/scope acknowledgement.
4. **GuidedTest** — per-minute ramp: HR entry + "any symptoms?" chips + 0–10 score;
   stop-symptoms / exhausted / red-flag controls. → runs `detectThreshold`.
5. **ResultPrescription** — HRt + training band + plan (or the no-intolerance /
   red-flag branch). → runs `computePrescription` when physiologic.
6. **TrainingSession** — daily session: band reminder, live HR zone, mid-session
   symptom check (`SESSION_STOP_RISE` rule), records a `SessionLog`.
7. **ProgressDashboard** — session history + recovery trend + progression call. →
   runs `progressionDecision`.

## Engine (do not reimplement)

All clinical logic lives in `lib/sst-trainer/protocol.ts`
(`detectThreshold`, `computePrescription`, `progressionDecision`, constants
`PROVOCATION_RISE`, `SESSION_STOP_RISE`, `EXHAUSTION_RPE`). Symptom + red-flag
vocabularies live in `lib/sst-trainer/symptoms.ts`. The UI only collects inputs
and renders the engine's outputs.

## Conventions for the design pass

- Treat every `{/* DESIGN: ... */}` marker as a brief for that element.
- `{/* DESIGN+TODO: ... */}` markers also flag a backend/capability gap
  (live HealthKit/Web Bluetooth HR, clinic-code pairing) — design the surface, but
  the wiring is a separate task.
- Keep the engine wiring intact; this is a styling/UX elevation, not a logic change.

## Status

- Route `app/sst-trainer` is **noindex/nofollow** (see `layout.tsx`) and is **not
  linked from any nav** — pre-launch, patient-facing.
- State is in-memory only; no persistence/pairing backend yet.
