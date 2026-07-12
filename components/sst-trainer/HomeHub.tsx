'use client'

import { useSyncExternalStore } from 'react'
import type { Condition, Prescription } from '@/lib/sst-trainer/protocol'
import type { PersistedTest, TrainerMode } from '@/lib/sst-trainer/store'
import { TrajectoryCompact } from './PatientTrajectory'
import { BandBar, PrimaryButton, SecondaryButton, numFont } from './shell'

function greetingForHour(h: number) {
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const PATHWAY_LABEL: Record<Condition, string> = {
  concussion: 'Concussion',
  mtbi: 'Concussion',
  tbi: 'Neuro rehab',
  'neuro-other': 'Neuro rehab',
  cancer: 'Cancer rehab',
  'long-covid': 'POTS · Long COVID',
  cardiac: 'Cardiac rehab',
}

/**
 * The daily home / hub (added by the design between result and training). Shows
 * the prescribed band, this week's adherence, and the entry to a session.
 */
export default function HomeHub({
  rx,
  condition,
  mode,
  clinicCode,
  clinicName,
  patientName,
  welcomeBack = false,
  sessionsThisWeek,
  onStartSession,
  onProgress,
  onRetest,
  retestBlockedReason,
  onStartOver,
  goalLabel,
  deviceName,
  history,
}: {
  rx: Prescription
  condition: Condition
  mode: TrainerMode
  clinicCode: string | null
  /** validated clinic name — shown in the badge instead of the raw code */
  clinicName?: string | null
  /** the patient's name (clinic mode) — greeted by name */
  patientName?: string | null
  /** true on a rehydrated relaunch — "Welcome back" instead of the time greeting */
  welcomeBack?: boolean
  sessionsThisWeek: number
  onStartSession: () => void
  onProgress: () => void
  onRetest: () => void
  /** when re-testing is blocked (spacing / red-flag), why — shown inline */
  retestBlockedReason?: string | null
  /** the "Start over" escape — the page confirms before clearing the store */
  onStartOver?: () => void
  /** what the patient is working back to, from onboarding (e.g. "Sport") */
  goalLabel?: string
  /** paired heart-rate source name, from onboarding (e.g. "Polar H10") */
  deviceName?: string
  /** persisted threshold-test history — the compact recovery-curve entry */
  history?: PersistedTest[]
}) {
  // Client-only greeting without an effect: useSyncExternalStore returns the
  // server snapshot ('Welcome back') during SSR/hydration, then the client
  // snapshot once mounted — no hydration mismatch, no set-state-in-effect.
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const firstName = patientName?.trim().split(/\s+/)[0] ?? null
  const greetingBase =
    welcomeBack || !isClient ? 'Welcome back' : greetingForHour(new Date().getHours())
  const greeting = firstName ? `${greetingBase}, ${firstName}` : greetingBase

  const badge = `${PATHWAY_LABEL[condition]} · ${
    mode === 'clinic-code' ? `Linked to ${clinicName || clinicCode || 'your clinic'}` : 'Self-guided'
  }${deviceName ? ` · ${deviceName}` : ''}`

  const target = rx.daysPerWeek
  const done = Math.min(sessionsThisWeek, target)

  return (
    <section className="flex flex-col gap-[15px] pt-2 lg:flex-1 lg:justify-center lg:pt-0">
      {/* Phone: single vertical stack (unchanged). Desktop (lg+): a centered,
          width-constrained landscape — left column (who + today's band + start)
          beside a right column (adherence, recovery curve, secondary actions),
          vertically centred so it fills the frame, not a phone strip in a void. */}
      <div className="flex flex-col gap-[15px] lg:mx-auto lg:w-full lg:max-w-[900px] lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:items-start lg:gap-x-7 lg:gap-y-4">
        {/* LEFT — identity, the hero band, primary action */}
        <div className="flex flex-col gap-[15px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-(--sst-accent)">
              {badge}
            </span>
            <h1 className="m-0 text-[25px] font-extrabold leading-[1.05] tracking-[-0.025em] text-(--sst-ink) lg:text-[30px]">
              {greeting}
            </h1>
            <p className="m-0 text-[13.5px] leading-snug text-(--sst-muted)">
              {goalLabel ? `Working back to ${goalLabel.toLowerCase()} — no rush.` : 'Ready when you are — no rush.'}
            </p>
          </div>

          <div
            className="rounded-[20px] border-2 border-(--sst-accent) px-4 pb-3.5 pt-3.5 lg:px-5 lg:pb-5 lg:pt-4"
            style={{ background: 'linear-gradient(180deg,var(--sst-tint-a),var(--sst-tint-b))' }}
          >
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-(--sst-accent-ink)">
              Today&apos;s band
            </span>
            <div className="mb-3 mt-1.5 flex items-baseline gap-1.5">
              <span className={`text-[36px] text-(--sst-ink) lg:text-[46px] ${numFont}`}>
                {rx.lowerBpm}–{rx.upperBpm}
              </span>
              <span className="text-[13px] font-semibold text-(--sst-muted)">bpm</span>
            </div>
            <BandBar hrt={rx.hrt} lower={rx.lowerBpm} upper={rx.upperBpm} />
          </div>

          <PrimaryButton onClick={onStartSession} className="rounded-[20px] py-[19px] text-base">
            Start today&apos;s session
          </PrimaryButton>
        </div>

        {/* RIGHT — adherence, the recovery instrument, secondary actions */}
        <div className="flex flex-col gap-[15px]">
          <div className="flex items-center justify-between rounded-[16px] border border-(--sst-line-soft) bg-(--sst-card) px-4 py-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-[12.5px] font-bold text-(--sst-ink)">Sessions logged</span>
              <span className="text-[11px] text-(--sst-muted)">
                {done} of {target} toward your weekly goal
              </span>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: target }, (_, i) => (
                <span
                  key={i}
                  className="h-[13px] w-[13px] rounded-full border-[1.5px]"
                  style={{
                    background: i < done ? 'var(--sst-accent)' : 'var(--sst-card)',
                    borderColor: i < done ? 'var(--sst-accent)' : 'var(--sst-line-strong)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* the adherence lever: their own measured threshold rising — taps
              through to the full curve on Progress */}
          {history && history.some((t) => t.hrt != null) && (
            <TrajectoryCompact tests={history} onOpen={onProgress} />
          )}

          <div className="flex gap-2.5">
            <SecondaryButton onClick={onProgress} className="flex-1 p-3">
              Progress
            </SecondaryButton>
            <SecondaryButton onClick={onRetest} className="flex-1 p-3">
              Re-test
            </SecondaryButton>
          </div>

          {retestBlockedReason && (
            <p className="m-0 -mt-1 rounded-[12px] bg-(--sst-surface-2) px-3.5 py-2.5 text-[11.5px] leading-snug text-(--sst-muted)">
              {retestBlockedReason}
            </p>
          )}

          {/* Quiet link across to the SCAT6 baseline & serial-testing instrument. */}
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
        </div>
      </div>

      {/* Start-over escape — quiet, at the very bottom; the page confirms first. */}
      {onStartOver && (
        <button
          type="button"
          onClick={onStartOver}
          className="mx-auto mt-1 rounded-[10px] px-2 py-1 text-[11px] font-semibold text-(--sst-muted) transition hover:text-(--sst-danger-alt)"
        >
          Start over
        </button>
      )}

      <p className="m-0 mt-1 text-center text-[10px] leading-snug text-(--sst-muted)">
        A clinician-directed coaching tool — not a diagnosis or return-to-play clearance. Follow your
        clinician&rsquo;s guidance.
      </p>
    </section>
  )
}
