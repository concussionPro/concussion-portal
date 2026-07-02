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

## Screen flow (state machine in `app/platform/app/page.tsx`)

1. **SstOnboarding** (`components/platform/`) — clinic-code entry (validated,
   clinic name confirmed), patient name, goal, heart-rate source pairing.
   Self-guided mode is hidden behind `NEXT_PUBLIC_SST_SELF_GUIDED === 'true'`.
2. **SymptomSelect** — preselect the symptoms the patient actually gets.
3. **Readiness** — red-flag/contraindication check (blocks on any tick), resting
   symptom score (≥8 blocks the test), consent/scope acknowledgement.
4. **GuidedTest** — modality setup (treadmill / bike / walk), then the per-minute
   ramp: 60-second stage timer with end-of-stage chime, effort script, RPE, HR
   entry (live-verified per reading) + "any symptoms?" chips + 0–10 score;
   stop-symptoms / exhausted / red-flag controls. → runs `detectThreshold`.
5. **ResultPrescription** — HRt + training band + plan (or the no-intolerance /
   red-flag branch). → runs `computePrescription` when physiologic.
6. **TrainingSession** — daily session: countdown from the prescribed minutes,
   live HR zone with haptic band-exit/re-entry cues, symptom STOP (one logged
   override), wake lock, then a time-in-band summary + end-feel question.
7. **ProgressDashboard** — session history + recovery trend + progression call. →
   renders the page-computed `progressionDecision` (regress auto-applies).

The page also owns: persistence (`lib/sst-trainer/store.ts`, `sst:v1`), the
next-day check-in, the red-flag lock screen, re-test spacing, and clinic sync
(`lib/sst-trainer/clinic-sync.ts`, with an offline retry queue).

## Engine (do not reimplement)

All clinical logic lives in `lib/sst-trainer/protocol.ts`
(`detectThreshold`, `computePrescription`, `progressionDecision`, `canRetest`,
`isVerifiedReading`, `sessionVerification`, constants `PROVOCATION_RISE`,
`SESSION_STOP_RISE`, `EXHAUSTION_RPE`, `MAX_RESTING_TO_TEST`). Symptom +
red-flag vocabularies live in `lib/sst-trainer/symptoms.ts`. The UI only
collects inputs and renders the engine's outputs. Tests:
`tests/sst-trainer.test.ts` + `tests/sst-protocol.test.ts`.

## Conventions for the design pass

- Treat every `{/* DESIGN: ... */}` marker as a brief for that element.
- `{/* DESIGN+TODO: ... */}` markers also flag a backend/capability gap
  (live HealthKit/Web Bluetooth HR, clinic-code pairing) — design the surface, but
  the wiring is a separate task.
- Keep the engine wiring intact; this is a styling/UX elevation, not a logic change.

## Status

- Route `app/sst-trainer` is **noindex/nofollow** (see `layout.tsx`) and is **not
  linked from any nav** — pre-launch, patient-facing.
- State persists in localStorage (`sst:v1` via `lib/sst-trainer/store.ts`); the
  install UUID rides as `patientRef` on every clinic sync and live tick.
