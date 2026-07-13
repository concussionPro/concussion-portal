'use client'

import type { ReactNode } from 'react'

/**
 * Shared design-system primitives for the Sub-Symptom-Threshold Trainer.
 * Reproduces the "SST Trainer" visual language: warm bg / teal accent, Hanken
 * Grotesk UI type + Space Grotesk for instrument numerals. Every colour is a
 * --sst-* token (app/globals.css): light values live on :root (identical to
 * the original hex palette), and a deep near-black dark set applies ONLY
 * inside the `.sst-app` scope under prefers-color-scheme: dark.
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
      <h1 className="m-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-(--sst-ink)">
        {title}
      </h1>
      {sub && <p className="m-0 text-[12.5px] leading-snug text-(--sst-muted)">{sub}</p>}
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
      className={`rounded-2xl bg-(--sst-accent) p-4 text-[15px] font-bold text-(--sst-on-accent) shadow-[0_8px_18px_-8px_rgba(91,154,166,0.8)] transition active:scale-[0.98] disabled:opacity-40 ${className}`}
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
      className={`rounded-2xl border-[1.5px] border-(--sst-line-strong) bg-(--sst-card) p-3.5 text-sm font-semibold text-(--sst-ink-2) transition active:scale-[0.98] disabled:opacity-40 ${className}`}
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
      <rect x={0} y={y} width={W} height={bh} rx={5.5} fill="var(--sst-track-2)" />
      <rect x={X(lower)} y={y} width={X(upper) - X(lower)} height={bh} rx={5.5} fill="var(--sst-accent)" />
      <line x1={X(hrt)} y1={6} x2={X(hrt)} y2={y + bh + 4} stroke="var(--sst-ink)" strokeWidth={2} />
      <text x={X(hrt)} y={H - 1} fill="var(--sst-ink)" fontSize={9} fontWeight={700} textAnchor="middle">
        {`HRt ${hrt}`}
      </text>
      <text x={X(lower)} y={14} fill="var(--sst-accent-ink)" fontSize={9} fontWeight={600} textAnchor="middle">
        {lower}
      </text>
      <text x={X(upper)} y={14} fill="var(--sst-accent-ink)" fontSize={9} fontWeight={600} textAnchor="middle">
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
  const col = danger ? 'var(--sst-warn)' : 'var(--sst-accent)'
  // Each segment button is a FULL-HEIGHT transparent hit area (>=44px touch
  // target); the slim visual bar is the inner span, so the control still reads
  // exactly as before. Flat strips centre the bar; ramp bars bottom-align.
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex w-full gap-1"
      style={{ height: variant === 'ramp' ? 48 : 44 }}
    >
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={i === value}
          aria-label={`${i}`}
          onClick={() => onChange(i)}
          className={`group flex h-full min-w-0 flex-1 basis-0 cursor-pointer border-none bg-transparent p-0 focus-visible:outline-none ${
            variant === 'ramp' ? 'items-end' : 'items-center'
          }`}
        >
          <span
            aria-hidden
            className="w-full rounded-[4px] transition-[height,background] duration-100 group-focus-visible:ring-2 group-focus-visible:ring-(--sst-ink) group-focus-visible:ring-offset-1"
            style={{
              height: variant === 'ramp' ? 13 + i * 2.6 : 18,
              background: i <= value ? col : 'var(--sst-seg-off)',
            }}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Symptom severity stepper — the tap-minimal 0–10 input used across the whole
 * trainer (graded test, readiness, training session) so the control is
 * identical everywhere. Two big touch targets (−/+) around a value box; far
 * easier than a slider mid-exercise. `compact` trims the height for inline use.
 */
export function SymptomStepper({
  value,
  onChange,
  danger = false,
  compact = false,
  ariaLabel,
}: {
  value: number
  onChange: (v: number) => void
  danger?: boolean
  compact?: boolean
  ariaLabel?: string
}) {
  const col = danger ? 'var(--sst-warn)' : 'var(--sst-accent)'
  const soft = danger ? 'var(--sst-warn-soft)' : 'var(--sst-accent-soft)'
  const h = compact ? 48 : 60
  const dim = compact ? 'text-[24px]' : 'text-[30px]'
  return (
    <div className="flex items-stretch gap-2.5" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        aria-label="Lower symptom level"
        style={{ height: h }}
        className={`flex flex-1 items-center justify-center rounded-[16px] border-[1.5px] border-(--sst-line) bg-(--sst-card) ${dim} font-bold leading-none text-(--sst-ink) transition active:scale-[0.97] disabled:opacity-35`}
      >
        −
      </button>
      <div
        className={`flex flex-none items-center justify-center rounded-[16px] ${dim} font-bold ${numFont}`}
        style={{ height: h, width: compact ? 64 : 76, background: soft, color: col }}
      >
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(10, value + 1))}
        disabled={value >= 10}
        aria-label="Raise symptom level"
        style={{ height: h }}
        className={`flex flex-1 items-center justify-center rounded-[16px] border-[1.5px] border-(--sst-line) bg-(--sst-card) ${dim} font-bold leading-none text-(--sst-ink) transition active:scale-[0.97] disabled:opacity-35`}
      >
        +
      </button>
    </div>
  )
}
