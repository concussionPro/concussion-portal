'use client'

import { useEffect, useState, type ReactNode } from 'react'
import type { HrStatus } from '@/components/sst-trainer/hr-source'

/**
 * Real full-screen app shell for /platform/app.
 *
 * This is NOT a product tour — there is no device bezel and no chapter/pagination
 * "tour" affordance. It is the chrome of an app you USE: a slim sticky header
 * with the SST wordmark, a glanceable live-HR / source status pill, and a thin
 * step-progress bar. The body fills the viewport and is one-handed, big-tap
 * friendly per components/sst-trainer/README.md.
 *
 * Palette: routed through the --sst-* tokens in app/globals.css (light: navy
 * ink / teal accent / warm #f7fafa surface, matching the PWA theme colours;
 * dark: calm near-black surfaces for a light-sensitive population). The
 * `sst-app` class on <main> scopes the dark token set to the patient app.
 */

const numFont = 'font-[family-name:var(--font-space)] [font-variant-numeric:tabular-nums]'

/** Wall clock for the header (client-only to avoid hydration drift) — H:MM am/pm. */
function HeaderClock() {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let hh = d.getHours() % 12
      if (hh === 0) hh = 12
      const ap = d.getHours() < 12 ? 'am' : 'pm'
      setLabel(`${hh}:${String(d.getMinutes()).padStart(2, '0')} ${ap}`)
    }
    tick()
    const iv = setInterval(tick, 10_000)
    return () => clearInterval(iv)
  }, [])
  return <span className={`text-[12px] font-semibold text-(--sst-faint) ${numFont}`}>{label || ' '}</span>
}

/** The SST target lockup mark. */
function BrandMark() {
  return (
    <span className="relative inline-block h-[22px] w-[22px] flex-none rounded-full border-[2.5px] border-(--sst-accent)">
      <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--sst-accent)" />
    </span>
  )
}

/**
 * Glanceable HR-source pill in the header — live bpm when a real source is
 * streaming, otherwise the paired source + its connection state. Never fabricates
 * a reading: when manual, it just names the source.
 */
function HrPill({
  deviceName,
  connected,
  bpm,
  hrStatus,
}: {
  deviceName: string
  connected: boolean
  bpm: number | null
  hrStatus: HrStatus
}) {
  const streaming = hrStatus === 'streaming' && typeof bpm === 'number' && Number.isFinite(bpm)
  const connecting = hrStatus === 'connecting' || (connected && hrStatus !== 'streaming')

  const dot = streaming ? 'var(--sst-good)' : connecting ? 'var(--sst-warn-dim)' : 'var(--sst-ghost-2)'

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-(--sst-card) px-2.5 py-1 shadow-[0_1px_2px_rgba(20,36,63,0.08)]">
      <span
        className={`inline-block h-[7px] w-[7px] flex-none rounded-full ${streaming ? 'animate-pulse' : ''}`}
        style={{ background: dot }}
      />
      {streaming ? (
        <span className="flex items-baseline gap-1">
          <span className={`text-[13px] font-bold leading-none text-(--sst-navy) ${numFont}`}>{bpm}</span>
          <span className="text-[9px] font-semibold leading-none text-(--sst-ghost)">BPM</span>
        </span>
      ) : (
        <span className="max-w-[110px] truncate text-[11px] font-semibold leading-none text-(--sst-muted)">
          {connecting ? 'Connecting…' : deviceName}
        </span>
      )}
    </span>
  )
}

export function SstAppShell({
  deviceName,
  connected,
  stepIndex,
  totalSteps,
  caption,
  showProgress = true,
  bpm = null,
  hrStatus = 'manual',
  forceLight = false,
  children,
}: {
  /** paired HR source shown in the header status pill */
  deviceName: string
  /** true = a live source is paired */
  connected: boolean
  /** 0-based index of the active flow step */
  stepIndex: number
  /** total flow steps */
  totalSteps: number
  /** short label for the current step (shown in the progress header) */
  caption: string
  /** show the slim step-progress header — only during first-run onboarding.
   *  A returning patient on their daily band is NOT in an 8-step wizard, so we
   *  hide the "Step X / N" chrome once a prescription exists (and on lock/checkin). */
  showProgress?: boolean
  /** live bpm from the paired connection (shown glanceably when streaming) */
  bpm?: number | null
  /** feed state driving the live/connecting/manual indicator */
  hrStatus?: HrStatus
  /** force the light palette regardless of prefers-color-scheme (clinician desktop) */
  forceLight?: boolean
  children: ReactNode
}) {
  const pct = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0
  return (
    <main
      // `sst-app` scopes the patient dark palette (see globals.css): under
      // prefers-color-scheme: dark every --sst-* token inside this subtree
      // swaps to the deep near-black set. Nothing outside the shell changes.
      className={`sst-app${forceLight ? ' sst-light' : ''} flex h-[100dvh] w-full flex-col overflow-hidden font-[family-name:var(--font-hanken)] text-(--sst-navy)`}
      style={{ background: 'var(--sst-bg)' }}
    >
      {/* app header */}
      <header className="sticky top-0 z-30 border-b border-(--sst-hairline) bg-(--sst-bg)/95 backdrop-blur supports-[backdrop-filter]:bg-(--sst-bg)/80">
        <div className="mx-auto flex w-full max-w-[480px] lg:max-w-[900px] flex-col gap-2.5 px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <BrandMark />
              <span className="text-[14px] font-extrabold tracking-[-0.01em] text-(--sst-navy)">
                SST Trainer
              </span>
            </span>
            <span className="flex items-center gap-2.5">
              <HeaderClock />
              <HrPill deviceName={deviceName} connected={connected} bpm={bpm} hrStatus={hrStatus} />
            </span>
          </div>

          {/* slim step-progress header — first-run onboarding only (not a tour,
              and never on the daily home/session/lock screens) */}
          {showProgress && (
            <div className="flex flex-col gap-1.5">
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-(--sst-track)">
                <div
                  className="h-full rounded-full bg-(--sst-accent) transition-[width] duration-300"
                  style={{ width: `${Math.max(6, pct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.01em] text-(--sst-muted)">
                  {caption}
                </span>
                <span className={`text-[10px] font-semibold text-(--sst-ghost) ${numFont}`}>
                  Step {stepIndex + 1} / {totalSteps}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* app body — fills the viewport (no page scroll); wide on desktop so
          screens can lay out in landscape/grid instead of a phone column */}
      <div className="mx-auto flex w-full max-w-[480px] lg:max-w-[900px] min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        {children}
      </div>
    </main>
  )
}
