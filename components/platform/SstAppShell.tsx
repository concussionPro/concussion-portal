'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Device-framed shell for /platform/app — the only marketing route that is a
 * full-screen app experience (no PlatformNav / PlatformFooter).
 *
 * Faithful to /tmp/sst_app.png: an Apple-Watch-Ultra-style titanium bezel with a
 * digital crown + side button, a watch status bar (paired HR source · clock ·
 * battery), and below the device the 8 flow dots + the chapter caption.
 *
 * Palette: navy #16243f frame/text, green #3c7a1f connected indicator, teal
 * #5b9aa6 interactive accent (matching the in-app SST design language).
 */

const numFont = 'font-[family-name:var(--font-space)] [font-variant-numeric:tabular-nums]'

/** Watch wall-clock (client-only to avoid hydration drift) — H:MM, 12-hour. */
function WatchClock() {
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
  return <span className={`text-[15px] font-semibold text-[#16243f] ${numFont}`}>{label || ' '}</span>
}

function BatteryGlyph({ pct = 86 }: { pct?: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`text-[12px] font-semibold text-[#16243f] ${numFont}`}>{pct}</span>
      <svg width="22" height="12" viewBox="0 0 22 12" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="18" height="11" rx="3" stroke="#16243f" strokeOpacity="0.45" />
        <rect x="2" y="2" width={Math.max(2, (pct / 100) * 15)} height="8" rx="1.5" fill="#16243f" />
        <rect x="20" y="3.5" width="2" height="5" rx="1" fill="#16243f" fillOpacity="0.45" />
      </svg>
    </span>
  )
}

export function SstAppShell({
  deviceName,
  connected,
  stepIndex,
  totalSteps,
  caption,
  children,
}: {
  /** paired HR source shown top-left in the status bar */
  deviceName: string
  /** green = a live source is paired; grey otherwise */
  connected: boolean
  /** 0-based index of the active flow step */
  stepIndex: number
  /** total flow steps (pagination dot count) */
  totalSteps: number
  /** chapter caption under the device */
  caption: string
  children: ReactNode
}) {
  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-4 py-8 font-[family-name:var(--font-hanken)] text-[#16243f]"
      style={{
        background: 'radial-gradient(130% 100% at 50% -8%, #f1f6f6 0%, #e6eeee 55%, #d8e3e3 100%)',
      }}
    >
      {/* device */}
      <div className="relative">
        {/* digital crown + side button on the right edge */}
        <span className="absolute right-[-5px] top-[34%] h-12 w-[6px] rounded-full bg-[#0e1622] shadow-[inset_0_0_2px_rgba(255,255,255,0.18)]" />
        <span className="absolute right-[-4px] top-[52%] h-9 w-[5px] rounded-full bg-[#1a2533]" />

        {/* titanium bezel */}
        <div
          className="rounded-[46px] p-[14px] shadow-[0_40px_70px_-26px_rgba(15,22,34,0.55),0_8px_22px_rgba(15,22,34,0.18)]"
          style={{ background: 'linear-gradient(160deg,#2b3645 0%,#161f2b 48%,#0d141d 100%)' }}
        >
          {/* screen */}
          <div className="flex h-[560px] w-full max-w-[348px] flex-col overflow-hidden rounded-[34px] bg-[#f7fafa] sm:w-[348px]">
            {/* status bar */}
            <div className="sticky top-0 z-30 flex items-center justify-between bg-gradient-to-b from-[#f7fafa] to-[#f7fafa]/0 px-5 pb-2 pt-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold leading-none text-[#5d7174]">
                <span
                  className="inline-block h-[8px] w-[8px] rounded-full"
                  style={{ background: connected ? '#3c7a1f' : '#aebcbc' }}
                />
                {deviceName}
              </span>
              <WatchClock />
              <BatteryGlyph />
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto px-5 pb-7 pt-0.5">{children}</div>
          </div>
        </div>
      </div>

      {/* flow dots + caption */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-[7px]">
          {Array.from({ length: totalSteps }, (_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-200"
              style={{
                width: i === stepIndex ? 18 : 6,
                background: i === stepIndex ? '#5b9aa6' : i < stepIndex ? '#a7c7cc' : '#c4d2d2',
              }}
            />
          ))}
        </div>
        <p className="m-0 text-xs font-medium tracking-[0.02em] text-[#5d7174]">{caption}</p>
      </div>
    </main>
  )
}
