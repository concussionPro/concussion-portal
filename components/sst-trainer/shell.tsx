'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Shared design-system primitives for the Sub-Symptom-Threshold Trainer.
 * Reproduces the "SST Trainer" visual language: warm bg (#f4f8f8), teal accent
 * (#5b9aa6), Hanken Grotesk UI type + Space Grotesk for instrument numerals.
 */

export const STEP_ORDER = [
  'welcome',
  'symptoms',
  'readiness',
  'test',
  'result',
  'home',
  'training',
  'progress',
] as const

export type Step = (typeof STEP_ORDER)[number]

const STEP_CAPTION: Record<Step, string> = {
  welcome: 'Welcome',
  symptoms: 'Symptom profile',
  readiness: 'Safety check',
  test: 'Threshold test',
  result: 'Your prescription',
  home: 'Home',
  training: 'Live session',
  progress: 'Progress',
}

/** Space Grotesk numeral class — tabular figures for HR / scores / clocks. */
export const numFont = 'font-[family-name:var(--font-space)] [font-variant-numeric:tabular-nums]'

/** Live wall clock for the status bar (client-only to avoid hydration drift). */
function StatusClock() {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let hh = d.getHours() % 12
      if (hh === 0) hh = 12
      setLabel(`${hh}:${String(d.getMinutes()).padStart(2, '0')}`)
    }
    tick()
    const iv = setInterval(tick, 10_000)
    return () => clearInterval(iv)
  }, [])
  return <span className={`text-sm text-[#16282b] ${numFont}`}>{label || ' '}</span>
}

/**
 * The app surface: warm radial backdrop, a centred phone-width card with the
 * SST status bar, scrollable content, and the flow-dot / caption chrome.
 */
export function AppShell({ step, children }: { step: Step; children: ReactNode }) {
  const cur = STEP_ORDER.indexOf(step)
  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center gap-5 px-4 py-8 font-[family-name:var(--font-hanken)] text-[#16282b]"
      style={{
        background:
          'radial-gradient(125% 95% at 50% -5%, #f5f9f9 0%, #e7eeee 52%, #dbe5e5 100%)',
      }}
    >
      <div className="flex w-full max-w-[440px] flex-1 flex-col overflow-hidden rounded-[34px] border border-[#e2ecec] bg-[#f4f8f8] shadow-[0_30px_60px_-24px_rgba(20,40,42,0.4),0_6px_18px_rgba(20,40,42,0.12)] sm:flex-none">
        {/* status bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-b from-[#f4f8f8] to-[#f4f8f8]/0 px-6 pb-2 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-[#5b9aa6]">
            <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-[#5b9aa6]" />
            SST
          </div>
          <StatusClock />
          <div className="flex items-center gap-1">
            <span className={`text-[10px] text-[#6c7e81] ${numFont}`}>86</span>
            <span className="relative inline-block h-[10px] w-[19px] rounded-[2px] border-[1.5px] border-[#97a7a9]">
              <span className="absolute inset-[1.5px] right-[5px] rounded-[1px] bg-[#5b9aa6]" />
            </span>
          </div>
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-0.5">{children}</div>
      </div>

      {/* flow dots + caption */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-[7px]">
          {STEP_ORDER.map((k, i) => (
            <span
              key={k}
              className="h-1.5 rounded-full transition-all duration-200"
              style={{
                width: i === cur ? 18 : 6,
                background: i === cur ? '#5b9aa6' : i < cur ? '#a7c7cc' : '#cdd9da',
              }}
            />
          ))}
        </div>
        <p className="m-0 text-xs font-medium tracking-[0.02em] text-[#7d9092]">
          {STEP_CAPTION[step]}
        </p>
      </div>
    </main>
  )
}

/** Section heading lockup used at the top of most screens. */
export function ScreenHeading({ title, sub }: { title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-[#16282b]">
        {title}
      </h1>
      {sub && <p className="m-0 text-[12.5px] leading-snug text-[#5d7174]">{sub}</p>}
    </div>
  )
}

/** Primary teal CTA. */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl bg-[#5b9aa6] p-4 text-[15px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(91,154,166,0.8)] transition active:scale-[0.98] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/** Quiet outlined / secondary button. */
export function SecondaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl border-[1.5px] border-[#cdd9da] bg-white p-3.5 text-sm font-semibold text-[#3b4f52] transition active:scale-[0.98] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * The training-band instrument bar: a track with the teal band, the HRt marker
 * and lower/upper labels. Used on the result and home screens.
 */
export function BandBar({ hrt, lower, upper }: { hrt: number; lower: number; upper: number }) {
  const min = Math.round(hrt * 0.55)
  const max = Math.round(hrt * 1.03)
  const W = 288
  const H = 46
  const X = (v: number) => Math.max(0, Math.min(W, ((v - min) / (max - min)) * W))
  const y = 20
  const bh = 11
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" style={{ overflow: 'visible' }}>
      <rect x={0} y={y} width={W} height={bh} rx={5.5} fill="#d4e3e3" />
      <rect x={X(lower)} y={y} width={X(upper) - X(lower)} height={bh} rx={5.5} fill="#5b9aa6" />
      <line x1={X(hrt)} y1={6} x2={X(hrt)} y2={y + bh + 4} stroke="#16282b" strokeWidth={2} />
      <text x={X(hrt)} y={H - 1} fill="#16282b" fontSize={9} fontWeight={700} textAnchor="middle">
        {`HRt ${hrt}`}
      </text>
      <text x={X(lower)} y={14} fill="#3c7681" fontSize={9} fontWeight={600} textAnchor="middle">
        {lower}
      </text>
      <text x={X(upper)} y={14} fill="#3c7681" fontSize={9} fontWeight={600} textAnchor="middle">
        {upper}
      </text>
    </svg>
  )
}

/**
 * The 0–10 segmented bar control from the design (replaces a plain range
 * slider). `variant="ramp"` = the histogram-style increasing-height bars;
 * `variant="flat"` = uniform-height compact bars used inline on the test screen.
 */
export function SegmentBars({
  value,
  onChange,
  variant = 'ramp',
  danger = false,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  variant?: 'ramp' | 'flat'
  danger?: boolean
  ariaLabel?: string
}) {
  const col = danger ? '#d79a3a' : '#5b9aa6'
  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuenow={value}
      className={`flex w-full gap-1 ${variant === 'ramp' ? 'items-end' : 'items-center'}`}
      style={{ height: variant === 'ramp' ? 48 : 18 }}
    >
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i}`}
          onClick={() => onChange(i)}
          className="flex-1 cursor-pointer rounded-[4px] border-none p-0 transition-[height,background] duration-100"
          style={{
            height: variant === 'ramp' ? 13 + i * 2.6 : 18,
            background: i <= value ? col : '#d8e4e4',
          }}
        />
      ))}
    </div>
  )
}
