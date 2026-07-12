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

  const hasCurve = !!history && history.some((t) => t.hrt != null)

  return (
    // Phone (base): the single vertical stack — UNCHANGED. Desktop (lg+): a
    // bounded, bordered dashboard PANEL, centred in the frame, with two balanced
    // columns of cards that fill it (modelled on the baseline tool). All desktop
    // rules are lg:-scoped, so phone + watch are untouched.
    <section className="flex flex-col gap-[15px] pt-2 lg:flex lg:h-full lg:items-center lg:justify-center lg:pt-0">
      <div className="flex w-full flex-col gap-[15px] lg:max-w-[1020px] lg:gap-6 lg:rounded-[26px] lg:border lg:border-(--sst-hairline) lg:bg-(--sst-surface-2) lg:p-8 lg:shadow-[0_28px_70px_-34px_rgba(0,0,0,0.55)]">
        {/* header — full width */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-(--sst-accent)">
            {badge}
          </span>
          <h1 className="m-0 text-[25px] font-extrabold leading-[1.05] tracking-[-0.025em] text-(--sst-ink) lg:text-[32px]">
            {greeting}
          </h1>
          <p className="m-0 text-[13.5px] leading-snug text-(--sst-muted)">
            {goalLabel ? `Working back to ${goalLabel.toLowerCase()} — no rush.` : 'Ready when you are — no rush.'}
          </p>
        </div>

        {/* main grid — two equal-height columns on desktop */}
        <div className="flex flex-col gap-[15px] lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-5">
          {/* LEFT — the hero band + primary action, filling the column height */}
          <div className="flex flex-col gap-[15px]">
            <div
              className="rounded-[20px] border-2 border-(--sst-accent) px-4 pb-3.5 pt-3.5 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-6 lg:py-6"
              style={{ background: 'linear-gradient(180deg,var(--sst-tint-a),var(--sst-tint-b))' }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-(--sst-accent-ink)">
                Today&apos;s band
              </span>
              <div className="mb-3 mt-1.5 flex items-baseline gap-1.5 lg:mb-5 lg:mt-3">
                <span className={`text-[36px] text-(--sst-ink) lg:text-[58px] lg:leading-none ${numFont}`}>
                  {rx.lowerBpm}–{rx.upperBpm}
                </span>
                <span className="text-[13px] font-semibold text-(--sst-muted) lg:text-[16px]">bpm</span>
              </div>
              <BandBar hrt={rx.hrt} lower={rx.lowerBpm} upper={rx.upperBpm} />
            </div>

            <PrimaryButton onClick={onStartSession} className="rounded-[20px] py-[19px] text-base lg:py-[22px] lg:text-[17px]">
              Start today&apos;s session
            </PrimaryButton>
          </div>

          {/* RIGHT — recovery instrument (anchors the column) + adherence + actions */}
          <div className="flex flex-col gap-[15px]">
            {/* Desktop recovery card — ALWAYS present so the column is balanced;
                shows the live curve when there's data, a placeholder before the
                first re-test. Hidden on phone (phone keeps its own conditional). */}
            <button
              type="button"
              onClick={onProgress}
              className="hidden text-left lg:flex lg:flex-1 lg:flex-col lg:rounded-[18px] lg:border lg:border-(--sst-line-soft) lg:bg-(--sst-card) lg:px-5 lg:py-4 lg:transition hover:lg:border-(--sst-accent)"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-(--sst-accent)">
                  Recovery curve
                </span>
                <span className="text-[11px] font-semibold text-(--sst-muted)">Open ›</span>
              </div>
              <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-2 text-center">
                <svg viewBox="0 0 120 40" className="h-12 w-40" fill="none" aria-hidden="true">
                  <path
                    d={hasCurve ? 'M4 34 L34 26 L64 20 L94 10 L116 6' : 'M4 30 C 30 28, 60 22, 116 12'}
                    stroke="var(--sst-accent)"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={hasCurve ? 1 : 0.4}
                    strokeDasharray={hasCurve ? undefined : '4 5'}
                  />
                </svg>
                <p className="m-0 text-[12px] leading-snug text-(--sst-muted)">
                  {hasCurve ? 'Your measured threshold over time — tap to open.' : 'Your first re-test will draw this line.'}
                </p>
              </div>
            </button>

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

            {/* Phone recovery card — only when there's data (phone layout unchanged). */}
            {hasCurve && (
              <div className="lg:hidden">
                <TrajectoryCompact tests={history!} onOpen={onProgress} />
              </div>
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
            className="mx-auto mt-1 rounded-[10px] px-2 py-1 text-[11px] font-semibold text-(--sst-muted) transition hover:text-(--sst-danger-alt) lg:mt-0"
          >
            Start over
          </button>
        )}

        <p className="m-0 mt-1 text-center text-[10px] leading-snug text-(--sst-muted) lg:mt-0">
          A clinician-directed coaching tool — not a diagnosis or return-to-play clearance. Follow your
          clinician&rsquo;s guidance.
        </p>
      </div>
    </section>
  )
}
