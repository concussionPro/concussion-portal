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
 * Palette: navy #16243f text/brand, teal #5b9aa6 accent, green #3c7a1f live
 * indicator, warm #f7fafa surface (matches the in-app SST design language and
 * the PWA theme/background colours).
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
  return <span className={`text-[12px] font-semibold text-[#7d9092] ${numFont}`}>{label || ' '}</span>
}

/** The SST target lockup mark. */
function BrandMark() {
  return (
    <span className="relative inline-block h-[22px] w-[22px] flex-none rounded-full border-[2.5px] border-[#5b9aa6]">
      <span className="absolute left-1/2 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b9aa6]" />
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

  const dot = streaming ? '#3c7a1f' : connecting ? '#b58a32' : '#aebcbc'

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(20,36,63,0.08)]">
      <span
        className={`inline-block h-[7px] w-[7px] flex-none rounded-full ${streaming ? 'animate-pulse' : ''}`}
        style={{ background: dot }}
      />
      {streaming ? (
        <span className="flex items-baseline gap-1">
          <span className={`text-[13px] font-bold leading-none text-[#16243f] ${numFont}`}>{bpm}</span>
          <span className="text-[9px] font-semibold leading-none text-[#9bafb0]">BPM</span>
        </span>
      ) : (
        <span className="max-w-[110px] truncate text-[11px] font-semibold leading-none text-[#5d7174]">
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
  bpm = null,
  hrStatus = 'manual',
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
  /** live bpm from the paired connection (shown glanceably when streaming) */
  bpm?: number | null
  /** feed state driving the live/connecting/manual indicator */
  hrStatus?: HrStatus
  children: ReactNode
}) {
  const pct = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0
  return (
    <main
      className="flex min-h-[100dvh] w-full flex-col font-[family-name:var(--font-hanken)] text-[#16243f]"
      style={{ background: '#f7fafa' }}
    >
      {/* app header */}
      <header className="sticky top-0 z-30 border-b border-[#e2ecec] bg-[#f7fafa]/95 backdrop-blur supports-[backdrop-filter]:bg-[#f7fafa]/80">
        <div className="mx-auto flex w-full max-w-[480px] flex-col gap-2.5 px-5 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <BrandMark />
              <span className="text-[14px] font-extrabold tracking-[-0.01em] text-[#16243f]">
                SST Trainer
              </span>
            </span>
            <span className="flex items-center gap-2.5">
              <HeaderClock />
              <HrPill deviceName={deviceName} connected={connected} bpm={bpm} hrStatus={hrStatus} />
            </span>
          </div>

          {/* slim step-progress header (not a tour) */}
          <div className="flex flex-col gap-1.5">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#dfeaea]">
              <div
                className="h-full rounded-full bg-[#5b9aa6] transition-[width] duration-300"
                style={{ width: `${Math.max(6, pct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.01em] text-[#5d7174]">
                {caption}
              </span>
              <span className={`text-[10px] font-semibold text-[#9bafb0] ${numFont}`}>
                Step {stepIndex + 1} / {totalSteps}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* app body */}
      <div className="mx-auto w-full max-w-[480px] flex-1 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-3">
        {children}
      </div>
    </main>
  )
}
