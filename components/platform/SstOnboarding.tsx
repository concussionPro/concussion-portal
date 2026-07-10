'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Condition } from '@/lib/sst-trainer/protocol'
import { loadState } from '@/lib/sst-trainer/store'
import type { WelcomeSelection, TrainerMode } from '@/lib/sst-trainer/store'
import { HR_SOURCES, isNativeApp, type HrSource } from '@/components/sst-trainer/hr-source'
import {
  bluetoothSupported,
  cameraSupported,
  connectCameraPpg,
  type LiveHrConnection,
} from '@/lib/sst-trainer/hr-live'
import { validateClinicCode } from '@/lib/sst-trainer/clinic-sync'
import { PrimaryButton } from '@/components/sst-trainer/shell'
import SstConnectWizard from '@/components/platform/SstConnectWizard'

/**
 * Onboarding (the "Welcome" step) of the full-screen /platform/app.
 *
 * SELF-GUIDED IS SURFACE-GATED (owner decision 2026-07-04, superseding the
 * same-day default-on): the full no-code version is a PAID capability — it
 * renders only where the page passes `allowSelfGuided` (the gated
 * /platform/app surface). The public /sst-trainer entry is clinic-code only:
 * the code IS the paying clinic's distribution. QR deep links (?clinic=CODE)
 * land in clinic-code mode pre-filled. NEXT_PUBLIC_SST_SELF_GUIDED=true
 * force-enables self-guided everywhere (dev/testing).
 *
 * The clinic code is VALIDATED here (GET /api/sst/validate-code) and confirmed
 * with the clinic's real name — a typo can't silently orphan a patient's data.
 *
 * Heart-rate sourcing is honest about the verified tier: VERIFIED = a live
 * Bluetooth heart-rate stream (watch broadcast mode or chest strap). The phone
 * camera is a resting spot-check only — it never tracks a live session. Manual
 * entry always works (and is the Apple Watch / Fitbit path — those can't
 * broadcast standard BLE HR on any platform).
 *
 * The Bluetooth path adapts to the runtime (isNativeApp()):
 *  - native app (iOS OR Android): full BLE pairing, incl. iPhone → primary path.
 *  - web Chrome / Edge (Android / desktop): Web Bluetooth → primary path.
 *  - web iOS Safari (no Web Bluetooth): honestly points to our app or manual.
 */

const SELF_GUIDED_FORCED = process.env.NEXT_PUBLIC_SST_SELF_GUIDED === 'true'

const GOALS: { id: string; label: string }[] = [
  { id: 'sport', label: 'Sport' },
  { id: 'work', label: 'Work' },
  { id: 'study', label: 'Study' },
  { id: 'family', label: 'Family life' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'feeling-right', label: 'Just feeling right' },
]

/** One-line broadcast instructions for the common watches. */
const BROADCAST_HOW_TO: { brand: string; how: string }[] = [
  { brand: 'Garmin', how: 'hold the light/menu button → Settings → Sensors → Broadcast Heart Rate.' },
  { brand: 'Polar', how: 'Settings → General settings → Pair and sync → turn on "HR visible to other devices".' },
  { brand: 'WHOOP', how: 'open the WHOOP app → More → Device settings → Broadcast heart rate.' },
]

export interface OnboardingResult {
  welcome: WelcomeSelection
  /** the validated clinic name (shown as confirmation, synced for context) */
  clinicName: string | null
  goal: string | null
  goalLabel: string | null
}

type PairStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'unavailable'
type CodeStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error'

function TargetIcon() {
  return (
    <span className="relative h-[34px] w-[34px] flex-none rounded-full border-[2.5px] border-(--sst-accent)">
      <span className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--sst-accent)" />
    </span>
  )
}

export default function SstOnboarding({
  device,
  onPair,
  onStart,
  initialClinicCode,
  allowSelfGuided = false,
}: {
  device: HrSource
  /** lifts the chosen source + the REAL connection (or null for manual) up to the page */
  onPair: (d: HrSource, connection: LiveHrConnection | null) => void
  onStart: (result: OnboardingResult) => void
  /** pre-fill from a per-clinic QR deep link (/sst-trainer?clinic=CODE) */
  initialClinicCode?: string
  /** self-guided (no clinic code) is a paid-surface capability — see header */
  allowSelfGuided?: boolean
}) {
  const selfGuidedEnabled = allowSelfGuided || SELF_GUIDED_FORCED
  const [mode, setMode] = useState<TrainerMode>(
    selfGuidedEnabled && !initialClinicCode ? 'self-guided' : 'clinic-code',
  )
  const [clinicCode, setClinicCode] = useState(initialClinicCode ?? '')
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('idle')
  const [clinicName, setClinicName] = useState<string | null>(null)
  const [patientName, setPatientName] = useState('')
  const [dataConsent, setDataConsent] = useState(false)
  const [goal, setGoal] = useState<string | null>(null)
  const [pairStatus, setPairStatus] = useState<PairStatus>('connected')
  const [pairError, setPairError] = useState<string | null>(null)
  const [showBroadcastHelp, setShowBroadcastHelp] = useState(false)
  // Trial-cap gate: a full free trial blocks a BRAND-NEW patient self-enrolling
  // via the QR/code path (the cap otherwise only bound the clinician invite).
  const [trialFull, setTrialFull] = useState(false)
  // The source currently mid-pair (set on tap, BEFORE the async connect resolves
  // and updates `device`) so the tapped row shows "Connecting…" right away.
  const [pendingId, setPendingId] = useState<string | null>(null)
  // Bluetooth source the connect wizard is open for (null = closed).
  const [wizardSource, setWizardSource] = useState<HrSource | null>(null)
  // capability detection runs on the client only (navigator isn't on the server).
  const [caps, setCaps] = useState({ bt: false, cam: false })
  // running inside the native app shell? (Capacitor — real BLE on iPhone too).
  // Client-only, same as caps: window.Capacitor isn't present during SSR.
  const [native, setNative] = useState(false)

  useEffect(() => {
    setCaps({ bt: bluetoothSupported(), cam: cameraSupported() })
    setNative(isNativeApp())
  }, [])

  // Validate the code (on blur / continue / prefill). Sequenced so a slow first
  // response can't overwrite the result of a newer check.
  const checkSeq = useRef(0)
  const runValidation = useCallback(async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) {
      setCodeStatus('idle')
      setClinicName(null)
      return
    }
    const seq = ++checkSeq.current
    setCodeStatus('checking')
    setTrialFull(false)
    const result = await validateClinicCode(trimmed)
    if (seq !== checkSeq.current) return // superseded by a newer check
    if (result === null) {
      setCodeStatus('error') // couldn't check (offline / rate-limited) — retry
      setClinicName(null)
    } else if (result.valid) {
      setCodeStatus('valid')
      setClinicName(result.clinicName)
      // A returning patient on THIS device (already enrolled with this code) is
      // never blocked — only a genuinely new patient is capped. Fail OPEN on a
      // read error: never wrongly block care over an entitlement hiccup.
      const alreadyHere = loadState()?.clinicCode?.toUpperCase() === trimmed.toUpperCase()
      if (!alreadyHere) {
        try {
          const res = await fetch(`/api/sst/clinic-entitlement?code=${encodeURIComponent(trimmed)}`)
          if (seq !== checkSeq.current) return
          const ent = res.ok ? await res.json() : null
          setTrialFull(ent != null && ent.canAddPatient === false)
        } catch {
          if (seq === checkSeq.current) setTrialFull(false)
        }
      }
    } else {
      setCodeStatus('invalid')
      setClinicName(null)
    }
  }, [])

  // A QR-prefilled code validates immediately — the patient should see their
  // clinic's name confirmed without touching the field.
  useEffect(() => {
    if (initialClinicCode) void runValidation(initialClinicCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Pair a heart-rate source. Triggered from the tap (a user gesture), which is
   * REQUIRED for Web Bluetooth + camera permission. On rejection / failure we
   * fall back to manual entry — never a fabricated reading.
   */
  const pair = async (d: HrSource) => {
    setPairError(null)

    if (d.connect === 'manual') {
      onPair(d, null)
      setPairStatus('connected') // manual entry is "ready" — there is just nothing to stream
      return
    }

    if (d.connect === 'bluetooth') {
      // The guided wizard owns the whole bluetooth path now: environment check,
      // broadcast instructions, error-diagnosed pairing, live signal check.
      // It also handles the no-Web-Bluetooth browsers (explains + offers
      // manual) — no more "get our app" dead end.
      setWizardSource(d)
      return
    }

    // camera PPG — resting spot-check only
    if (!caps.cam) {
      onPair(d, null)
      setPairStatus('unavailable')
      setPairError('The camera spot-check needs a secure (HTTPS) browser with camera access — you can type your heart rate instead.')
      return
    }
    setPendingId(d.id)
    setPairStatus('connecting')
    try {
      const conn = await connectCameraPpg()
      onPair(d, conn)
      setPairStatus('connected')
    } catch {
      onPair(d, null)
      setPairStatus('error')
      setPairError('Couldn’t start the camera — check the permission, or type your heart rate instead.')
    } finally {
      setPendingId(null)
    }
  }

  // Bluetooth is never disabled: the wizard handles unsupported browsers with
  // an explanation + manual fallback instead of a greyed-out row.
  const sourceDisabled = (s: HrSource) => s.connect === 'camera' && !caps.cam

  const nameMissing = mode === 'clinic-code' && patientName.trim().length === 0
  const codeNotValid = mode === 'clinic-code' && codeStatus !== 'valid'
  const trialBlocked = mode === 'clinic-code' && trialFull
  const blocked = codeNotValid || nameMissing || goal === null || trialBlocked

  const continueLabel =
    goal === null
      ? 'Pick a goal to continue'
      : mode === 'clinic-code' && codeStatus !== 'valid'
        ? 'Enter your clinic code to continue'
        : nameMissing
          ? 'Add your name to continue'
          : trialBlocked
            ? 'Ask your clinic to activate your spot'
            : 'Continue'

  const condition: Condition = 'concussion'

  return (
    <section className="flex flex-col gap-4 pt-1">
      {/* product lockup */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <TargetIcon />
          <h1 className="m-0 text-[21px] font-extrabold leading-[1.05] tracking-[-0.02em] text-(--sst-navy)">
            Sub-Symptom
            <br />
            Threshold Trainer
          </h1>
        </div>
        <p className="m-0 text-[13px] leading-snug text-(--sst-muted)">
          Symptom-guided exercise rehab. We find the heart rate your symptoms allow, then build a
          training plan that grows as you recover — overseen by your clinician.
        </p>
      </div>

      {/* mode segmented control — paid surface only (public entry is clinic-code) */}
      {selfGuidedEnabled && (
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--sst-faint-2)">
            How are you using this?
          </span>
          <div className="flex gap-1 rounded-[14px] bg-(--sst-surface-3) p-1">
            {(
              [
                ['self-guided', 'Self-guided'],
                ['clinic-code', 'Clinic code'],
              ] as const
            ).map(([m, label]) => {
              const on = mode === m
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-[10px] p-2.5 text-[13px] font-semibold transition ${
                    on
                      ? 'bg-(--sst-card) text-(--sst-navy) shadow-[0_1px_2px_rgba(20,36,63,0.14)]'
                      : 'bg-transparent text-(--sst-faint)'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {mode === 'clinic-code' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clinic-code" className="text-xs font-semibold text-(--sst-ink-2)">
            Clinic code
          </label>
          <input
            id="clinic-code"
            type="text"
            value={clinicCode}
            onChange={(e) => {
              setClinicCode(e.target.value.toUpperCase())
              setCodeStatus('idle')
              setClinicName(null)
            }}
            onBlur={() => {
              if (codeStatus === 'idle') void runValidation(clinicCode)
            }}
            placeholder="e.g. CEA-4827"
            autoCapitalize="characters"
            aria-describedby="clinic-code-status"
            className={`w-full rounded-[14px] border-[1.5px] bg-(--sst-card) px-3.5 py-3 text-base tracking-[0.06em] text-(--sst-navy) outline-none font-[family-name:var(--font-space)] focus:border-(--sst-accent) ${
              codeStatus === 'invalid' ? 'border-(--sst-danger)' : codeStatus === 'valid' ? 'border-(--sst-good)' : 'border-(--sst-line-strong)'
            }`}
          />
          <span id="clinic-code-status" aria-live="polite" className="min-h-[16px] text-[11.5px] leading-tight">
            {codeStatus === 'checking' && <span className="text-(--sst-ghost)">Checking your code…</span>}
            {codeStatus === 'valid' && (
              <span className="font-semibold text-(--sst-good)">✓ {clinicName ?? 'Code confirmed'}</span>
            )}
            {codeStatus === 'invalid' && (
              <span className="font-semibold text-(--sst-danger-alt)">
                That code isn&rsquo;t recognised — check it against your clinic card.
              </span>
            )}
            {codeStatus === 'error' && (
              <span className="text-(--sst-danger-alt)">
                Couldn&rsquo;t check the code just now.{' '}
                <button
                  type="button"
                  onClick={() => void runValidation(clinicCode)}
                  className="font-semibold underline"
                >
                  Try again
                </button>
              </span>
            )}
          </span>

          <label htmlFor="patient-name" className="mt-1.5 text-xs font-semibold text-(--sst-ink-2)">
            Your name
          </label>
          <input
            id="patient-name"
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="First and last name"
            autoCapitalize="words"
            className="w-full rounded-[14px] border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) px-3.5 py-3 text-base text-(--sst-navy) outline-none focus:border-(--sst-accent)"
          />
          <span className="text-[10.5px] leading-tight text-(--sst-ghost)">
            So your clinician knows it&rsquo;s you.
          </span>
        </div>
      )}

      {/* goal chip grid */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--sst-faint-2)">
          What are you working back to?
        </span>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => {
            const on = goal === g.id
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                onClick={() => setGoal(on ? null : g.id)}
                className={`rounded-[14px] border-[1.5px] px-3.5 py-3 text-left text-[13px] font-semibold transition ${
                  on
                    ? 'border-(--sst-accent) bg-(--sst-accent-soft) text-(--sst-navy)'
                    : 'border-(--sst-line) bg-(--sst-card) text-(--sst-ink-2)'
                }`}
              >
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* heart-rate source — verified tier first (watch broadcast / strap) */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-(--sst-faint-2)">
          Heart-rate source
        </span>
        <p className="m-0 -mt-0.5 text-[11px] leading-snug text-(--sst-faint)">
          Use the watch you already own — turn on its heart-rate broadcast mode and pair in one tap.
          Chest straps work too. No watch on hand? You can type each reading in.
        </p>

        <div className="flex flex-col gap-2">
          {HR_SOURCES.map((s) => {
            const selected = s.id === device.id
            const disabled = sourceDisabled(s)
            const subtitle =
              disabled && s.connect === 'camera' ? 'Needs camera access (HTTPS)' : s.method
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={selected}
                onClick={() => pair(s)}
                disabled={disabled}
                className={`flex items-center gap-3 rounded-[14px] border-[1.5px] px-3 py-3 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected ? 'border-(--sst-accent) bg-(--sst-accent-soft)' : 'border-(--sst-line) bg-(--sst-card)'
                }`}
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] text-[17px] text-white"
                  style={{ background: s.tint }}
                >
                  {s.glyph}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-bold leading-tight text-(--sst-navy)">{s.name}</span>
                  <span className="text-[10.5px] leading-snug text-(--sst-faint)">{subtitle}</span>
                </span>
                <span className="flex-none text-right">
                  {pendingId === s.id ? (
                    <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-(--sst-ghost)">
                      Connecting…
                    </span>
                  ) : disabled ? (
                    <span className="text-[9px] font-bold uppercase tracking-[0.04em] text-(--sst-ghost)">
                      Unavailable
                    </span>
                  ) : selected ? (
                    s.connect === 'manual' ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-(--sst-accent-ink)">
                        ✓ Selected
                      </span>
                    ) : pairStatus === 'connecting' ? (
                      <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-(--sst-ghost)">
                        Connecting…
                      </span>
                    ) : pairStatus === 'connected' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.04em] text-(--sst-good)">
                        <span className="inline-block h-[6px] w-[6px] rounded-full bg-(--sst-good)" />
                        Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-(--sst-danger)">
                        Tap to retry
                      </span>
                    )
                  ) : (
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.04em]"
                      style={{ color: s.live ? 'var(--sst-good)' : 'var(--sst-accent-ink)' }}
                    >
                      {s.tag}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {/* device-specific broadcast one-liners */}
        <button
          type="button"
          onClick={() => setShowBroadcastHelp((v) => !v)}
          aria-expanded={showBroadcastHelp}
          className="self-start text-[11px] font-semibold text-(--sst-accent-ink) underline decoration-(--sst-underline) underline-offset-2"
        >
          How do I turn on my watch&rsquo;s broadcast?
        </button>
        {showBroadcastHelp && (
          <ul className="m-0 flex list-none flex-col gap-1 rounded-[12px] bg-(--sst-surface-2) px-3.5 py-2.5 pl-3.5">
            {BROADCAST_HOW_TO.map((b) => (
              <li key={b.brand} className="text-[11px] leading-snug text-(--sst-ink-3)">
                <strong>{b.brand}:</strong> {b.how}
              </li>
            ))}
            <li className="text-[11px] leading-snug text-(--sst-faint)">
              Apple Watch and Fitbit can&rsquo;t broadcast this way — type your heart rate in instead.
            </li>
          </ul>
        )}

        {pairError ? (
          <span className="text-[10.5px] leading-snug text-(--sst-danger-alt)">{pairError}</span>
        ) : (
          <span className="text-[10.5px] leading-snug text-(--sst-ghost)">
            {device.connect === 'camera'
              ? 'Good for a resting pulse check before and after a session (cover the rear lens with a fingertip). During exercise, use your watch broadcast or type your heart rate in.'
              : device.connect === 'bluetooth'
                ? 'Your watch or strap streams live heart rate into every session. The browser will ask you to pick your device.'
                : 'You’ll type the heart rate in each minute of the test and during sessions — every screen works this way too.'}
          </span>
        )}
        {native ? (
          <span className="text-[10px] leading-snug text-(--sst-ghost)">
            You&rsquo;re in the app — your watch or strap pairs directly over Bluetooth (iPhone
            included). Turn on its heart-rate broadcast, tap the top option and pick your device.
          </span>
        ) : null}
      </div>

      <SstConnectWizard
        open={wizardSource !== null}
        onClose={() => setWizardSource(null)}
        onConnected={(conn) => {
          if (wizardSource) onPair(wizardSource, conn)
          setPairStatus('connected')
          setPairError(null)
          setWizardSource(null)
        }}
        onManual={() => {
          const manual = HR_SOURCES.find((s) => s.connect === 'manual')
          if (manual) onPair(manual, null)
          setPairStatus('connected')
          setPairError(null)
          setWizardSource(null)
        }}
      />

      {/* Accurate collection notice (APP 5) + opt-in for the SECONDARY use only.
          Primary flow is stated as fact: name + results go to the patient's own
          clinician (that IS the service, not a revocable consent). The checkbox
          is the opt-in for CEA's de-identified service-improvement use, with an
          honourable opt-out (ask us to delete). "Research" is deliberately NOT
          claimed here — that requires separate HREC-gated consent. */}
      <div className="rounded-xl border border-(--sst-line) bg-(--sst-surface-4) px-3.5 py-3">
        <p className="m-0 mb-2 text-[11.5px] leading-snug text-(--sst-ink-3)">
          Your name and results go to <strong>your own clinician</strong> so they can review and guide
          your care.
        </p>
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={dataConsent}
            onChange={(e) => setDataConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-none accent-(--sst-accent-ink)"
          />
          <span className="text-[11.5px] leading-snug text-(--sst-ink-3)">
            {/* {' '} is load-bearing: the Turbopack prod build eats a plain
                space after an inline element (rendered "removedto") */}
            I also agree CEA may keep my session data, with my name{' '}<strong>removed</strong>, to check and
            improve how the service works. You can ask us to delete it any time. This is optional —
            declining doesn&rsquo;t affect your care.
          </span>
        </label>
      </div>

      {/* Patient-neutral wall: the trial cap is the CLINIC's billing state and
          never the patient's problem — no trial/payment framing here. */}
      {trialBlocked && (
        <div className="rounded-[14px] border-[1.5px] border-(--sst-warn) bg-(--sst-warn-soft) px-3.5 py-3">
          <p className="m-0 text-[12.5px] font-bold leading-snug text-(--sst-warn-ink)">
            One more step — your clinic needs to activate your spot
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-(--sst-warn-ink-2)">
            Ask {clinicName ?? 'your clinic'} to activate your spot — it takes them under a minute.
            As soon as they do, come back here and you can start straight away.
          </p>
        </div>
      )}

      <PrimaryButton
        disabled={blocked}
        onClick={() =>
          onStart({
            welcome: {
              mode,
              dataConsent,
              clinicCode: mode === 'clinic-code' ? clinicCode.trim() : null,
              patientName: mode === 'clinic-code' ? patientName.trim() || null : null,
              condition,
            },
            clinicName: mode === 'clinic-code' ? clinicName : null,
            goal,
            goalLabel: GOALS.find((g) => g.id === goal)?.label ?? null,
          })
        }
      >
        {continueLabel}
      </PrimaryButton>

      <a
        href="/preseason"
        className="group -mt-0.5 flex items-center justify-center gap-1.5 px-1 py-1 text-[12px] font-semibold text-(--sst-muted) no-underline transition hover:text-(--sst-accent-ink)"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[15px] w-[15px]"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 12h4l2 6 4-14 2 8h6" />
        </svg>
        Baseline &amp; serial testing
      </a>
    </section>
  )
}
