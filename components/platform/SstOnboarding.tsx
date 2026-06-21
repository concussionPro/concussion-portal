'use client'

import { useEffect, useState } from 'react'
import type { Condition } from '@/lib/sst-trainer/protocol'
import type { WelcomeSelection, TrainerMode } from '@/components/sst-trainer/WelcomeMode'
import { HR_SOURCES, type HrSource } from '@/components/sst-trainer/hr-source'
import {
  bluetoothSupported,
  cameraSupported,
  connectBluetoothHr,
  connectCameraPpg,
  type LiveHrConnection,
} from '@/lib/sst-trainer/hr-live'
import { PrimaryButton } from '@/components/sst-trainer/shell'

/**
 * Chapter 1 ("Welcome") of the device-framed /platform/app onboarding.
 *
 * Faithful to /tmp/sst_app.png — target lockup + title, subcopy, the
 * "How are you using this?" Self-guided / Clinic-code toggle, and the
 * "What are you working back to?" goal chip grid — plus the two pieces the
 * platform app needs before handing into the engine-backed flow: a clinic-code
 * field (clinic mode) and heart-rate-source pairing.
 *
 * Emits { welcome, goal, goalLabel } on Continue; lifts the paired device AND
 * its real heart-rate connection up via onPair (Web Bluetooth / camera PPG,
 * established from the tap so the permission gesture is preserved).
 */

const GOALS: { id: string; label: string }[] = [
  { id: 'sport', label: 'Sport' },
  { id: 'work', label: 'Work' },
  { id: 'study', label: 'Study' },
  { id: 'family', label: 'Family life' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'feeling-right', label: 'Just feeling right' },
]

export interface OnboardingResult {
  welcome: WelcomeSelection
  goal: string | null
  goalLabel: string | null
}

type PairStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'unavailable'

function TargetIcon() {
  return (
    <span className="relative h-[34px] w-[34px] flex-none rounded-full border-[2.5px] border-[#5b9aa6]">
      <span className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b9aa6]" />
    </span>
  )
}

export default function SstOnboarding({
  device,
  onPair,
  onStart,
}: {
  device: HrSource
  /** lifts the chosen source + the REAL connection (or null for manual) up to the page */
  onPair: (d: HrSource, connection: LiveHrConnection | null) => void
  onStart: (result: OnboardingResult) => void
}) {
  const [mode, setMode] = useState<TrainerMode>('self-guided')
  const [clinicCode, setClinicCode] = useState('')
  const [goal, setGoal] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pairStatus, setPairStatus] = useState<PairStatus>('connected')
  const [pairError, setPairError] = useState<string | null>(null)
  // capability detection runs on the client only (navigator isn't on the server).
  const [caps, setCaps] = useState({ bt: false, cam: false })

  useEffect(() => {
    setCaps({ bt: bluetoothSupported(), cam: cameraSupported() })
  }, [])

  /**
   * Pair a heart-rate source. Triggered from the tap (a user gesture), which is
   * REQUIRED for Web Bluetooth + camera permission. On rejection / failure we
   * fall back to manual entry — never a fabricated reading.
   */
  const pair = async (d: HrSource) => {
    setPickerOpen(false)
    setPairError(null)

    if (d.connect === 'manual') {
      onPair(d, null)
      setPairStatus('connected') // manual entry is "ready" — there is just nothing to stream
      return
    }

    if (d.connect === 'bluetooth') {
      if (!caps.bt) {
        onPair(d, null)
        setPairStatus('unavailable')
        setPairError('Bluetooth pairing needs Chrome / Edge / Android — use the phone camera or enter your heart rate manually.')
        return
      }
      setPairStatus('connecting')
      try {
        // connectBluetoothHr() calls requestDevice() first, preserving the gesture.
        const conn = await connectBluetoothHr()
        onPair(d, conn)
        setPairStatus('connected')
      } catch {
        onPair(d, null) // user cancelled the chooser or pairing failed → manual
        setPairStatus('error')
        setPairError('Couldn’t connect that sensor — you can try again or enter your heart rate manually.')
      }
      return
    }

    // camera PPG
    if (!caps.cam) {
      onPair(d, null)
      setPairStatus('unavailable')
      setPairError('Camera HR needs a secure (HTTPS) browser with camera access — enter your heart rate manually instead.')
      return
    }
    setPairStatus('connecting')
    try {
      const conn = await connectCameraPpg()
      onPair(d, conn)
      setPairStatus('connected')
    } catch {
      onPair(d, null)
      setPairStatus('error')
      setPairError('Couldn’t start the camera — check the permission, or enter your heart rate manually.')
    }
  }

  const sourceDisabled = (s: HrSource) =>
    (s.connect === 'bluetooth' && !caps.bt) || (s.connect === 'camera' && !caps.cam)

  const codeMissing = mode === 'clinic-code' && clinicCode.trim().length === 0
  const blocked = codeMissing || goal === null

  const condition: Condition = 'concussion'

  return (
    <section className="flex flex-col gap-4 pt-1">
      {/* product lockup */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <TargetIcon />
          <h1 className="m-0 text-[21px] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#16243f]">
            Sub-Symptom
            <br />
            Threshold Trainer
          </h1>
        </div>
        <p className="m-0 text-[13px] leading-snug text-[#5d7174]">
          Symptom-guided exercise rehab. We find the heart rate your symptoms allow, then build a
          training plan that grows as you recover — overseen by your clinician.
        </p>
      </div>

      {/* mode segmented control */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849c9c]">
          How are you using this?
        </span>
        <div className="flex gap-1 rounded-[14px] bg-[#e7eeee] p-1">
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
                    ? 'bg-white text-[#16243f] shadow-[0_1px_2px_rgba(20,36,63,0.14)]'
                    : 'bg-transparent text-[#7d9092]'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'clinic-code' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="clinic-code" className="text-xs font-semibold text-[#3b4f52]">
            Clinic code
          </label>
          <input
            id="clinic-code"
            type="text"
            value={clinicCode}
            onChange={(e) => setClinicCode(e.target.value.toUpperCase())}
            placeholder="e.g. CEA-4827"
            autoCapitalize="characters"
            className="w-full rounded-[14px] border-[1.5px] border-[#cfdbdc] bg-white px-3.5 py-3 text-base tracking-[0.06em] text-[#16243f] outline-none font-[family-name:var(--font-space)] focus:border-[#5b9aa6]"
          />
          <span className="text-[10.5px] leading-tight text-[#9bafb0]">
            Links you to your clinician&apos;s dashboard — they set and oversee your threshold.
          </span>
        </div>
      )}

      {/* goal chip grid */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849c9c]">
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
                    ? 'border-[#5b9aa6] bg-[#e7f2f3] text-[#16243f]'
                    : 'border-[#d4e0e1] bg-white text-[#3b4f52]'
                }`}
              >
                {g.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* heart-rate source pairing */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#849c9c]">
          Heart-rate source
        </span>

        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-[#d4e0e1] bg-white px-3 py-2.5 text-left transition active:scale-[0.99]"
        >
          <span
            className="flex h-9 w-9 flex-none items-center justify-center rounded-[11px] text-[17px] text-white"
            style={{ background: device.tint }}
          >
            {device.glyph}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px] font-bold leading-tight text-[#16243f]">{device.name}</span>
            <span className="text-[10.5px] leading-tight text-[#7d9092]">{device.method}</span>
          </span>
          {device.live ? (
            pairStatus === 'connecting' ? (
              <span className="flex-none text-[10px] font-bold uppercase tracking-[0.04em] text-[#9bafb0]">
                Connecting…
              </span>
            ) : pairStatus === 'connected' ? (
              <span className="flex flex-none items-center gap-1 text-[10px] font-bold uppercase tracking-[0.04em] text-[#3c7a1f]">
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#3c7a1f]" />
                Live
              </span>
            ) : (
              <span className="flex-none text-[10px] font-bold uppercase tracking-[0.04em] text-[#d2463a]">
                Manual
              </span>
            )
          ) : (
            <span className="flex-none text-[10px] font-bold uppercase tracking-[0.04em] text-[#b58a32]">
              Manual
            </span>
          )}
          <span className="flex-none text-[#a7c0c2]" aria-hidden="true">
            {pickerOpen ? '▾' : '▸'}
          </span>
        </button>

        {pickerOpen && (
          <div className="flex flex-col gap-1.5 rounded-[14px] border border-[#e2ecec] bg-white p-1.5">
            {HR_SOURCES.map((s) => {
              const on = s.id === device.id
              const disabled = sourceDisabled(s)
              const tag = disabled ? 'Unavailable' : s.tag
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pair(s)}
                  disabled={disabled}
                  className={`flex items-center gap-2.5 rounded-[11px] px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    on ? 'bg-[#e7f2f3]' : 'bg-transparent hover:bg-[#f1f6f6]'
                  }`}
                >
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-[9px] text-[13px] text-white"
                    style={{ background: s.tint }}
                  >
                    {s.glyph}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[12.5px] font-semibold leading-tight text-[#16243f]">{s.name}</span>
                    <span className="text-[10px] leading-tight text-[#7d9092]">
                      {disabled && s.connect === 'bluetooth'
                        ? 'Needs Chrome / Edge / Android'
                        : disabled && s.connect === 'camera'
                          ? 'Needs camera access (HTTPS)'
                          : s.method}
                    </span>
                  </span>
                  <span
                    className="flex-none text-[9px] font-bold uppercase tracking-[0.04em]"
                    style={{ color: disabled ? '#9bafb0' : s.live ? '#3c7a1f' : '#b58a32' }}
                  >
                    {tag}
                  </span>
                </button>
              )
            })}
          </div>
        )}
        {pairError ? (
          <span className="text-[10.5px] leading-snug text-[#b5462f]">{pairError}</span>
        ) : (
          <span className="text-[10.5px] leading-snug text-[#9bafb0]">
            {device.connect === 'camera'
              ? 'No wearable needed — your phone camera reads your pulse during the test (cover the rear lens with a fingertip).'
              : device.connect === 'bluetooth'
                ? 'Your strap streams live heart rate into every session. The browser will ask you to pick your sensor.'
                : device.id === 'apple-watch'
                  ? 'Apple Watch can’t feed live heart rate to a web app yet — pair a Bluetooth strap or use the camera for live HR, or enter it manually.'
                  : 'Fitbit syncs after each session — enter your heart rate during the test.'}
          </span>
        )}
        {!caps.bt && (
          <span className="text-[10px] leading-snug text-[#9bafb0]">
            Bluetooth pairing needs Chrome / Edge / Android. On iPhone/Safari, use the phone camera or enter HR manually.
          </span>
        )}
      </div>

      <PrimaryButton
        disabled={blocked}
        onClick={() =>
          onStart({
            welcome: {
              mode,
              clinicCode: mode === 'clinic-code' ? clinicCode.trim() : null,
              condition,
            },
            goal,
            goalLabel: GOALS.find((g) => g.id === goal)?.label ?? null,
          })
        }
      >
        {goal === null ? 'Pick a goal to continue' : 'Continue'}
      </PrimaryButton>

      <a
        href="/preseason"
        className="group -mt-0.5 flex items-center justify-center gap-1.5 px-1 py-1 text-[12px] font-semibold text-[#5d7174] no-underline transition hover:text-[#3c7681]"
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
