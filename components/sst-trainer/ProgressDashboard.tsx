'use client'

import {
  progressionDecision,
  SESSION_STOP_RISE,
  type Prescription,
  type ProgressionDecision,
  type SessionLog,
} from '@/lib/sst-trainer/protocol'
import { PrimaryButton, ScreenHeading, SecondaryButton, numFont } from './shell'

const DECISION_META: Record<
  ProgressionDecision,
  { label: string; icon: string; color: string; border: string; bg: string }
> = {
  advance: { label: 'Advance', icon: '↑', color: '#3c7681', border: '#5b9aa6', bg: '#e7f2f3' },
  hold: { label: 'Hold steady', icon: '→', color: '#3b4f52', border: '#cdd9da', bg: '#eef4f4' },
  regress: { label: 'Ease back', icon: '↓', color: '#a06a1c', border: '#d79a3a', bg: '#fbf2e1' },
  // NOTE: progressionDecision() only ever returns advance/hold/regress today —
  // it never emits `refer`. This entry is a harmless fallback kept in case the
  // engine adds a referral decision later; it currently never renders.
  refer: {
    label: 'Check in with your clinician',
    icon: '!',
    color: '#b1392e',
    border: '#d2463a',
    bg: '#fbeae8',
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
  const peaks = sessions.map((s) => s.peakHeartRate)
  const minV = Math.min(lo - 8, ...(peaks.length ? peaks : [lo]))
  const maxV = Math.max(up + 8, ...(peaks.length ? peaks : [up]))
  const X = (i: number) =>
    sessions.length <= 1 ? W / 2 : padL + (i * (W - padL - padR)) / (sessions.length - 1)
  const Y = (v: number) => padT + (1 - (v - minV) / (maxV - minV)) * (H - padT - padB)
  const yc = Y(up)
  const yl = Y(lo)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
      <rect x={0} y={yc} width={W} height={Math.max(0, yl - yc)} fill="#5b9aa6" opacity={0.09} />
      <line x1={0} y1={yc} x2={W} y2={yc} stroke="#d2463a" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
      {peaks.length > 1 && (
        <path
          d={sessions.map((s, i) => `${i ? 'L' : 'M'} ${X(i)} ${Y(s.peakHeartRate)}`).join(' ')}
          fill="none"
          stroke="#5b9aa6"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {sessions.map((s, i) => {
        const flare = s.nextDayFlare || s.peakSymptom - s.preSymptom >= SESSION_STOP_RISE
        return (
          <circle
            key={`${s.date}-${i}`}
            cx={X(i)}
            cy={Y(s.peakHeartRate)}
            r={4.5}
            fill={flare ? '#d79a3a' : '#5b9aa6'}
            stroke="#fff"
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
  onHome,
  onNewSession,
  onApplyCeiling,
  canApply = true,
}: {
  rx: Prescription
  sessions: SessionLog[]
  onHome: () => void
  onNewSession: () => void
  /** apply an advance/regress decision — shifts the live band to the new ceiling */
  onApplyCeiling?: (newCeilingBpm: number) => void
  /**
   * Whether a band change may be applied right now. Gated to NEW clean sessions
   * since the last apply so the ceiling can't be ratcheted by repeated clicks
   * against the same data (a band change must be earned by fresh sessions).
   */
  canApply?: boolean
}) {
  // engine decides advance / hold / regress / refer from recent sessions
  const decision = progressionDecision(rx, sessions)
  const dm = DECISION_META[decision.decision]
  const maxHr = Math.max(rx.upperBpm, ...sessions.map((s) => s.peakHeartRate), 1)

  return (
    <section className="flex flex-col gap-3.5 pt-1.5">
      <ScreenHeading
        title="Your progress"
        sub={`Band ${rx.lowerBpm}–${rx.upperBpm} bpm · ${sessions.length} session${
          sessions.length === 1 ? '' : 's'
        } logged`}
      />

      <div
        className="rounded-[18px] border-2 p-3.5"
        style={{ borderColor: dm.border, background: dm.bg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold leading-none" style={{ color: dm.color }}>
            {dm.icon} {dm.label}
          </span>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-[#3b4f52]">{decision.message}</p>
        {decision.newCeilingBpm !== undefined && (
          <p className="mt-2.5 text-[12.5px] font-semibold leading-snug" style={{ color: dm.color }}>
            Suggested new ceiling: {decision.newCeilingBpm} bpm
          </p>
        )}
        {/* advance / regress only — hold + refer never shift the band */}
        {decision.newCeilingBpm !== undefined && onApplyCeiling && canApply && (
          <button
            type="button"
            onClick={() => onApplyCeiling(decision.newCeilingBpm as number)}
            className="mt-3 w-full rounded-[14px] p-3 text-[13.5px] font-bold text-white transition active:scale-[0.98]"
            style={{ background: dm.color }}
          >
            Apply new ceiling — {decision.newCeilingBpm} bpm
          </button>
        )}
        {decision.newCeilingBpm !== undefined && onApplyCeiling && !canApply && (
          <p className="mt-3 text-[12px] font-medium leading-snug text-[#5d7174]">
            Log a new session before adjusting your ceiling again.
          </p>
        )}
      </div>

      <div className="rounded-[18px] border border-[#dde7e7] bg-white p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-[#3b4f52]">Peak HR vs ceiling</span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#9bafb0]">
            <span className="inline-block h-0 w-3.5 border-t-2 border-dashed border-[#d2463a]" />
            ceiling
          </span>
        </div>
        <Trend rx={rx} sessions={sessions} />
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-[#3b4f52]">Sessions</span>
        {sessions.length === 0 && (
          <p className="m-0 text-xs leading-snug text-[#9bafb0]">
            No sessions yet. Log your first to see progress.
          </p>
        )}
        {sessions.map((s, i) => {
          const flare = s.nextDayFlare || s.peakSymptom - s.preSymptom >= SESSION_STOP_RISE
          const tagColor = flare ? '#d79a3a' : '#5b9aa6'
          const barW = Math.min(100, (s.peakHeartRate / maxHr) * 100)
          return (
            <div
              key={`${s.date}-${i}`}
              className="flex flex-col gap-1.5 rounded-[13px] border border-[#e4eded] px-3 py-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#16282b]">{s.date}</span>
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
              <div className="h-2 w-full overflow-hidden rounded-[5px] bg-[#eef4f4]">
                <div
                  className="h-full rounded-[5px]"
                  style={{ width: `${barW}%`, background: tagColor }}
                />
              </div>
              <div
                className={`flex justify-between text-[10px] text-[#9bafb0] ${numFont}`}
              >
                <span>
                  avg {s.avgHeartRate} · peak {s.peakHeartRate} bpm
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
