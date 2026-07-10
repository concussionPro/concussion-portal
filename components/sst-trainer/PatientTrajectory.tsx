'use client'

import { useMemo } from 'react'
import type { PersistedTest } from '@/lib/sst-trainer/store'
import { numFont } from './shell'

/**
 * Patient-facing recovery curve — the #1 adherence lever.
 *
 * The clinician hub has always plotted the measured heart-rate-threshold (HRt)
 * trajectory (SstTrajectory.tsx); the PATIENT never saw their own threshold
 * rising. This card shows it to them, in the patient design language.
 *
 * HONEST-SIGNALS RULES (same doctrine as the clinician curve):
 *  - Only MEASURED points: every dot is a real HRt from a completed graded
 *    test in the persisted thresholdHistory. Nothing is interpolated,
 *    projected or fabricated — with one test there is a dot, not a line.
 *  - The delta ('+14 bpm since your first test') renders only when ≥2 measured
 *    tests exist, and a fall is shown as honestly as a rise.
 *  - A trend to feel good about, not a recovery verdict — no claim beyond
 *    "your measured threshold moved".
 *
 * `variant="full"` = the hero card on the Progress screen (chart + re-test
 * cadence). `variant="compact"` = the one-row entry point on Home (sparkline +
 * delta, taps through to Progress).
 */

export interface RetestInfo {
  /** epoch ms when the re-test spacing gate opens (null = no prior test) */
  nextRetestAt: number | null
  /** red-flag lock suppresses any re-test prompt (the locked screen owns that) */
  redFlagLocked?: boolean
}

function fmtDate(at: number) {
  return new Date(at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

/** "opens tomorrow" / "in 2 days" / "available now" for the re-test gate. */
function retestLine(info: RetestInfo, lastMeasuredAt: number | null): string | null {
  if (info.redFlagLocked) return null
  if (info.nextRetestAt == null) return null
  const diff = info.nextRetestAt - Date.now()
  if (diff > 0) {
    const hours = Math.ceil(diff / 3_600_000)
    if (hours <= 24) return 'Next re-test opens tomorrow'
    return `Next re-test opens in ${Math.ceil(hours / 24)} days`
  }
  // Gate open. If it has been a while, nudge — serial measurement is the instrument.
  if (lastMeasuredAt != null) {
    const days = Math.floor((Date.now() - lastMeasuredAt) / 86_400_000)
    if (days >= 14) return `Re-test due — last measured ${days} days ago`
  }
  return 'Re-test available — a fresh test updates this line'
}

/** Shared geometry: measured points → x/y in a W×H viewBox. */
function useChart(measured: PersistedTest[], W: number, H: number, padX: number, padY: number) {
  return useMemo(() => {
    const hrts = measured.map((t) => t.hrt as number)
    const min = hrts.length ? Math.min(...hrts) : 0
    const max = hrts.length ? Math.max(...hrts) : 0
    const lo = min - Math.max(6, (max - min) * 0.25)
    const hi = max + Math.max(6, (max - min) * 0.25)
    const span = Math.max(1, hi - lo)
    const pts = measured.map((t, i) => ({
      x: measured.length === 1 ? W / 2 : padX + (i / (measured.length - 1)) * (W - padX * 2),
      y: H - padY - (((t.hrt as number) - lo) / span) * (H - padY * 2),
      t,
    }))
    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    return { pts, path }
  }, [measured, W, H, padX, padY])
}

/* ── compact: the Home entry point ─────────────────────────────────────────── */

function Sparkline({ measured }: { measured: PersistedTest[] }) {
  const W = 76
  const H = 30
  const { pts, path } = useChart(measured, W, H, 4, 5)
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-[30px] w-[76px]" aria-hidden>
      {pts.length > 1 && (
        <path d={path} fill="none" stroke="var(--sst-accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )}
      {last && <circle cx={last.x} cy={last.y} r={3.5} fill="var(--sst-accent)" stroke="var(--sst-card)" strokeWidth={1.5} />}
    </svg>
  )
}

export function TrajectoryCompact({
  tests,
  onOpen,
}: {
  tests: PersistedTest[]
  /** taps through to the Progress screen (where the full curve lives) */
  onOpen: () => void
}) {
  const measured = tests.filter((t) => t.hrt != null)
  if (measured.length === 0) return null
  const first = measured[0].hrt as number
  const latest = measured[measured.length - 1].hrt as number
  const delta = latest - first

  const sub =
    measured.length < 2
      ? 'Your first re-test will draw this line'
      : delta > 0
        ? `+${delta} bpm since your first test`
        : delta < 0
          ? `${delta} bpm since your first test`
          : 'Holding steady since your first test'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between gap-3 rounded-[16px] border border-(--sst-line-soft) bg-(--sst-card) px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[12.5px] font-bold text-(--sst-ink)">Your recovery curve</span>
        <span
          className={`text-[11px] leading-snug ${
            measured.length >= 2 && delta > 0 ? 'font-semibold text-(--sst-accent-ink)' : 'text-(--sst-muted)'
          }`}
        >
          {sub}
        </span>
      </div>
      <span className="flex flex-none items-center gap-2">
        <Sparkline measured={measured} />
        <svg viewBox="0 0 24 24" fill="none" className="h-[14px] w-[14px] text-(--sst-ghost)" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </button>
  )
}

/* ── full: the Progress hero card ──────────────────────────────────────────── */

export default function PatientTrajectory({
  tests,
  retest,
}: {
  /** the persisted threshold-test history, oldest first */
  tests: PersistedTest[]
  /** re-test timing (from the store's lastTestAt + the protocol spacing gate) */
  retest?: RetestInfo
}) {
  const measured = tests.filter((t) => t.hrt != null)
  const W = 320
  const H = 132
  const { pts, path } = useChart(measured, W, H, 16, 20)

  const first = measured[0]
  const latest = measured[measured.length - 1]
  const delta = first && latest ? (latest.hrt as number) - (first.hrt as number) : null
  const firstY = pts[0]?.y

  const cadence = retest
    ? retestLine(retest, measured.length ? measured[measured.length - 1].at : null)
    : null

  return (
    <div
      className="rounded-[20px] border-2 border-(--sst-accent) px-4 pb-4 pt-3.5"
      style={{ background: 'linear-gradient(180deg,var(--sst-tint-a),var(--sst-tint-b))' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-(--sst-accent-ink)">
            Your recovery curve
          </span>
          <span className="text-[11px] leading-snug text-(--sst-muted)">
            Your measured heart-rate threshold, test by test
          </span>
        </div>
        {measured.length >= 2 && delta != null && delta !== 0 && (
          <span
            className={`flex-none rounded-full px-2.5 py-1 text-[12px] font-bold ${numFont} ${
              delta > 0
                ? 'bg-(--sst-accent) text-(--sst-on-accent)'
                : 'bg-(--sst-surface-2) text-(--sst-muted)'
            }`}
          >
            {delta > 0 ? '+' : ''}
            {delta} bpm
          </span>
        )}
      </div>

      {measured.length === 0 ? (
        <p className="m-0 py-6 text-center text-[12px] leading-relaxed text-(--sst-muted)">
          No measured threshold yet — your graded test will start this line.
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mt-2 block w-full overflow-visible"
            role="img"
            aria-label={
              measured.length >= 2
                ? `Measured heart-rate threshold over time: from ${first.hrt} to ${latest.hrt} bpm across ${measured.length} tests`
                : `One measured heart-rate threshold: ${latest.hrt} bpm`
            }
          >
            {/* dotted reference line at the FIRST measured threshold — makes the
                rise legible without inventing an axis */}
            {measured.length > 1 && firstY != null && (
              <line
                x1={0}
                y1={firstY}
                x2={W}
                y2={firstY}
                stroke="var(--sst-accent)"
                strokeWidth={1}
                strokeDasharray="3 4"
                opacity={0.45}
              />
            )}
            {/* the measured line — draws itself in (CSS; static when reduced-motion) */}
            {pts.length > 1 && (
              <path
                d={path}
                fill="none"
                stroke="var(--sst-accent)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sst-draw"
                style={{ ['--sst-dash' as string]: '600' }}
              />
            )}
            {pts.map((p, i) => {
              const isLatest = i === pts.length - 1
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isLatest ? 5.5 : 4}
                    fill="var(--sst-accent)"
                    stroke="var(--sst-card)"
                    strokeWidth={2}
                  />
                  {isLatest && (
                    <circle cx={p.x} cy={p.y} r={9} fill="none" stroke="var(--sst-accent)" strokeWidth={1.5} opacity={0.4} />
                  )}
                </g>
              )
            })}
            {/* value labels on first + latest — the two numbers that tell the story */}
            {measured.length > 1 && (
              <text
                x={pts[0].x}
                y={pts[0].y + 16}
                fill="var(--sst-muted)"
                fontSize={10}
                fontWeight={600}
                textAnchor="start"
              >
                {first.hrt}
              </text>
            )}
            <text
              x={pts[pts.length - 1].x}
              y={pts[pts.length - 1].y - 12}
              fill="var(--sst-ink)"
              fontSize={12}
              fontWeight={700}
              textAnchor={measured.length === 1 ? 'middle' : 'end'}
            >
              {latest.hrt} bpm
            </text>
          </svg>

          <div className={`mt-1 flex justify-between text-[10px] font-medium text-(--sst-muted) ${numFont}`}>
            <span>{fmtDate(first.at)}</span>
            {measured.length > 1 && <span>{fmtDate(latest.at)}</span>}
          </div>

          {measured.length === 1 && (
            <p className="m-0 mt-2 text-center text-[11.5px] leading-snug text-(--sst-muted)">
              One measured threshold so far — your first re-test will draw this line.
            </p>
          )}

          {measured.length >= 2 && delta != null && (
            <p className="m-0 mt-2 text-[11.5px] leading-snug text-(--sst-ink-2)">
              {delta > 0 ? (
                <>
                  Your threshold has risen{' '}
                  <strong className={numFont}>{delta} bpm</strong> since your first test — measured, not
                  estimated.
                </>
              ) : delta < 0 ? (
                <>
                  Your threshold is <strong className={numFont}>{Math.abs(delta)} bpm</strong> below your
                  first test. Thresholds can dip during recovery — keep training in your band and talk to
                  your clinician if it keeps falling.
                </>
              ) : (
                <>Holding steady — keep training in your band and re-test to track the next move.</>
              )}
            </p>
          )}
        </>
      )}

      {cadence && (
        <div className="mt-3 flex items-center gap-1.5 rounded-[12px] bg-(--sst-card) px-3 py-2">
          <svg viewBox="0 0 24 24" fill="none" className="h-[13px] w-[13px] flex-none text-(--sst-accent-ink)" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <span className="text-[11px] font-semibold leading-snug text-(--sst-accent-ink)">{cadence}</span>
        </div>
      )}
    </div>
  )
}
