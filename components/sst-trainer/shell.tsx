'use client'

import type { ReactNode } from 'react'

/**
 * Shared design-system primitives for the Sub-Symptom-Threshold Trainer.
 * Reproduces the "SST Trainer" visual language: warm bg (#f4f8f8), teal accent
 * (#5b9aa6), Hanken Grotesk UI type + Space Grotesk for instrument numerals.
 *
 * (The old card-style AppShell + status-bar clock lived here until July 2026 —
 * dead code once /platform/app moved to SstAppShell; verified unmounted and
 * deleted.)
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

/** Space Grotesk numeral class — tabular figures for HR / scores / clocks. */
export const numFont = 'font-[family-name:var(--font-space)] [font-variant-numeric:tabular-nums]'

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
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex w-full gap-1 ${variant === 'ramp' ? 'items-end' : 'items-center'}`}
      style={{ height: variant === 'ramp' ? 48 : 18 }}
    >
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={i === value}
          aria-label={`${i}`}
          onClick={() => onChange(i)}
          className="min-w-0 flex-1 basis-0 cursor-pointer rounded-[4px] border-none p-0 transition-[height,background] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16282b] focus-visible:ring-offset-1"
          style={{
            height: variant === 'ramp' ? 13 + i * 2.6 : 18,
            background: i <= value ? col : '#d8e4e4',
          }}
        />
      ))}
    </div>
  )
}
