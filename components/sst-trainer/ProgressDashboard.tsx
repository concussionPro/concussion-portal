'use client'

import type { ReactNode } from 'react'
import {
  SESSION_STOP_RISE,
  type Prescription,
  type ProgressionDecision,
  type ProgressionResult,
  type SessionLog,
} from '@/lib/sst-trainer/protocol'
import type { PersistedTest } from '@/lib/sst-trainer/store'
import PatientTrajectory, { type RetestInfo } from './PatientTrajectory'
import { PrimaryButton, ScreenHeading, SecondaryButton, numFont } from './shell'

const DECISION_META: Record<
  ProgressionDecision,
  { label: string; icon: string; color: string; border: string; bg: string }
> = {
  advance: { label: 'Advance', icon: '↑', color: 'var(--sst-accent-ink)', border: 'var(--sst-accent)', bg: 'var(--sst-accent-soft)' },
  hold: { label: 'Hold steady', icon: '→', color: 'var(--sst-ink-2)', border: 'var(--sst-line-strong)', bg: 'var(--sst-surface-2)' },
  regress: { label: 'Eased back', icon: '↓', color: 'var(--sst-warn-ink)', border: 'var(--sst-warn)', bg: 'var(--sst-warn-soft)' },
  // Two flares in a row → rest day + clinician check-in (owner rail 2026-07-06).
  rest: { label: 'Rest day — check in with your clinician', icon: '⏸', color: 'var(--sst-danger-ink)', border: 'var(--sst-danger)', bg: 'var(--sst-danger-soft)' },
  // At the HRt cap: the only safe way up is a fresh measurement.
  retest: { label: 'Time to re-test', icon: '◎', color: 'var(--sst-accent-ink)', border: 'var(--sst-accent)', bg: 'var(--sst-accent-soft)' },
  // NOTE: progressionDecision() never emits `refer` today. This entry is a
  // harmless fallback kept in case the engine adds a referral decision later.
  refer: {
    label: 'Check in with your clinician',
    icon: '!',
    color: 'var(--sst-danger-ink)',
    border: 'var(--sst-danger)',
    bg: 'var(--sst-danger-soft)',
  },
}

/** Peak-HR-vs-ceiling trend chart (ported from the design's trendEl). */
function Trend({ rx, sessions }: { rx: Prescription; sessions: SessionLog[] }) {
  const W = 290
  const H = 96
  const padL = 8
  const padR = 8
  const padT = 10
  const padB = 14
  const lo = rx.lowerBpm
  const up = rx.upperBpm
  // Sessions that recorded NO heart rate have no point on a heart-rate chart —
  // plotting them at 0 dragged the whole axis to the floor and drew a line to a
  // reading that never existed.
  const measured = sessions.filter((s) => typeof s.peakHeartRate === 'number')
  const peaks = measured.map((s) => s.peakHeartRate as number)
  const minV = Math.min(lo - 8, ...(peaks.length ? peaks : [lo]))
  const maxV = Math.max(up + 8, ...(peaks.length ? peaks : [up]))
  const X = (i: number) =>
    measured.length <= 1 ? W / 2 : padL + (i * (W - padL - padR)) / (measured.length - 1)
  const Y = (v: number) => padT + (1 - (v - minV) / (maxV - minV)) * (H - padT - padB)
  const yc = Y(up)
  const yl = Y(lo)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
      <rect x={0} y={yc} width={W} height={Math.max(0, yl - yc)} fill="var(--sst-accent)" opacity={0.09} />
      <line x1={0} y1={yc} x2={W} y2={yc} stroke="var(--sst-danger)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
      {peaks.length > 1 && (
        <path
          d={measured.map((s, i) => `${i ? 'L' : 'M'} ${X(i)} ${Y(s.peakHeartRate as number)}`).join(' ')}
          fill="none"
          stroke="var(--sst-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {measured.map((s, i) => {
        const flare = s.nextDayFlare || s.peakSymptom - s.preSymptom > SESSION_STOP_RISE
        return (
          <circle
            key={`${s.date}-${i}`}
            cx={X(i)}
            cy={Y(s.peakHeartRate as number)}
            r={4.5}
            fill={flare ? 'var(--sst-warn)' : 'var(--sst-accent)'}
            stroke="var(--sst-card)"
            strokeWidth={2}
          />
        )
      })}
    </svg>
  )
}

export default function ProgressDashboard({
  rx,
  sessions,
  decision,
  onHome,
  onNewSession,
  onApplyCeiling,
  onRetest,
  canApply = true,
  notice,
  history,
  retest,
}: {
  rx: Prescription
  sessions: SessionLog[]
  /**
   * The engine's decision, computed by the page (which also owns auto-applying
   * a regress — safety changes never wait for a tap here).
   */
  decision: ProgressionResult
  onHome: () => void
  onNewSession: () => void
  /** apply an ADVANCE decision — shifts the live band to the new ceiling */
  onApplyCeiling?: (newCeilingBpm: number) => void
  /** the 'retest' decision routes here (the page enforces re-test spacing) */
  onRetest?: () => void
  /**
   * Whether a band change may be applied right now. Gated to NEW sessions since
   * the last apply so the ceiling can't be ratcheted by repeated clicks against
   * the same data (a band change must be earned by fresh sessions).
   */
  canApply?: boolean
  /** page-level banner (e.g. "we eased your band back" with undo) */
  notice?: ReactNode
  /** persisted threshold-test history — draws the patient recovery curve */
  history?: PersistedTest[]
  /** re-test timing for the curve's cadence line */
  retest?: RetestInfo
}) {
  const dm = DECISION_META[decision.decision]
  const maxHr = Math.max(
    rx.upperBpm,
    ...sessions.map((s) => s.peakHeartRate).filter((v): v is number => typeof v === 'number'),
    1,
  )

  return (
    <section className="flex flex-col gap-3.5 pt-1.5">
      <ScreenHeading
        title="Your progress"
        sub={`Band ${rx.lowerBpm}–${rx.upperBpm} bpm · ${sessions.length} session${
          sessions.length === 1 ? '' : 's'
        } logged`}
      />

      {notice}

      <div
        className="rounded-[18px] border-2 p-3.5"
        style={{ borderColor: dm.border, background: dm.bg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold leading-none" style={{ color: dm.color }}>
            {dm.icon} {dm.label}
          </span>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-(--sst-ink-2)">{decision.message}</p>
        {decision.decision === 'advance' && decision.newCeilingBpm !== undefined && (
          <p className="mt-2.5 text-[12.5px] font-semibold leading-snug" style={{ color: dm.color }}>
            Suggested new ceiling: {decision.newCeilingBpm} bpm
          </p>
        )}
        {/* ADVANCE needs a tap (earned by fresh verified sessions). REGRESS is
            auto-applied by the page — never gated behind a button. */}
        {decision.decision === 'advance' && decision.newCeilingBpm !== undefined && onApplyCeiling && canApply && (
          <button
            type="button"
            onClick={() => onApplyCeiling(decision.newCeilingBpm as number)}
            className="mt-3 w-full rounded-[14px] p-3 text-[13.5px] font-bold text-(--sst-on-accent) transition active:scale-[0.98]"
            style={{ background: dm.color }}
          >
            Apply new ceiling — {decision.newCeilingBpm} bpm
          </button>
        )}
        {decision.decision === 'advance' && decision.newCeilingBpm !== undefined && onApplyCeiling && !canApply && (
          <p className="mt-3 text-[12px] font-medium leading-snug text-(--sst-muted)">
            Log a new session before adjusting your ceiling again.
          </p>
        )}
        {decision.decision === 'retest' && onRetest && (
          <button
            type="button"
            onClick={onRetest}
            className="mt-3 w-full rounded-[14px] p-3 text-[13.5px] font-bold text-(--sst-on-accent) transition active:scale-[0.98]"
            style={{ background: dm.color }}
          >
            Re-test my threshold
          </button>
        )}
      </div>

      {/* the hero metric: the patient's own measured HRt rising over time */}
      {history && history.length > 0 && <PatientTrajectory tests={history} retest={retest} />}

      <div className="rounded-[18px] border border-(--sst-line-soft) bg-(--sst-card) p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-(--sst-ink-2)">Peak HR vs ceiling</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-(--sst-muted)">
            <span className="inline-block h-0 w-3.5 border-t-2 border-dashed border-(--sst-danger)" />
            ceiling
          </span>
        </div>
        <Trend rx={rx} sessions={sessions} />
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-(--sst-ink-2)">Sessions</span>
        {sessions.length === 0 && (
          <p className="m-0 text-xs leading-snug text-(--sst-muted)">
            No sessions yet. Log your first to see progress.
          </p>
        )}
        {sessions.map((s, i) => {
          const flare = s.nextDayFlare || s.peakSymptom - s.preSymptom > SESSION_STOP_RISE
          const tagColor = flare ? 'var(--sst-warn)' : 'var(--sst-accent)'
          const barW =
            typeof s.peakHeartRate === 'number' ? Math.min(100, (s.peakHeartRate / maxHr) * 100) : 0
          return (
            <div
              key={`${s.date}-${i}`}
              className="flex flex-col gap-1.5 rounded-[13px] border border-(--sst-line-faint) px-3 py-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-(--sst-ink)">{s.date}</span>
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-semibold"
                  style={{ color: tagColor }}
                >
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: tagColor }}
                  />
                  {flare ? 'flare' : 'clean'}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-[5px] bg-(--sst-surface-2)">
                <div
                  className="h-full rounded-[5px]"
                  style={{ width: `${barW}%`, background: tagColor }}
                />
              </div>
              <div
                className={`flex justify-between text-[10px] text-(--sst-muted) ${numFont}`}
              >
                <span>
                  {typeof s.avgHeartRate === 'number' && typeof s.peakHeartRate === 'number'
                    ? `avg ${s.avgHeartRate} · peak ${s.peakHeartRate} bpm`
                    : 'no heart rate recorded'}
                  {s.hrVerified === true ? ' · ✓ live' : s.hrVerified === false ? ' · manual' : ''}
                </span>
                <span>
                  sx {s.preSymptom}→{s.peakSymptom} · {s.completedMinutes}m
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2.5">
        <SecondaryButton onClick={onHome} className="flex-1 p-3.5">
          Home
        </SecondaryButton>
        <PrimaryButton onClick={onNewSession} className="flex-[1.4] rounded-[16px]">
          New session
        </PrimaryButton>
      </div>
    </section>
  )
}
