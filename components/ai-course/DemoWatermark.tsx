'use client'

import { useEffect, useState } from 'react'

/**
 * Confidentiality watermark for the demo-access experience.
 *
 * When the demo_org cookie is present (set by /api/ai-course/demo-access/
 * accept after NDA acceptance), this overlay renders a fixed banner at
 * the top of every AI-course page reminding the viewer that the preview
 * is confidential, who it was issued to, and that the access is
 * NDA-bound. Does NOT render for admin sessions — only when the
 * demo_org cookie is set.
 */
export function DemoWatermark() {
  const [org, setOrg] = useState<string | null>(null)

  useEffect(() => {
    if (typeof document === 'undefined') return
    const match = document.cookie.match(/(?:^|;\s*)demo_org=([^;]+)/)
    if (match) {
      try {
        setOrg(decodeURIComponent(match[1]))
      } catch {
        setOrg(match[1])
      }
    }
  }, [])

  if (!org) return null

  return (
    <>
      {/* Top stripe */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 text-[11px] font-semibold px-4 py-1.5 flex items-center justify-between gap-3 shadow-sm">
        <span>
          CONFIDENTIAL DEMO · Issued to <strong>{org}</strong> · Not for redistribution
        </span>
        <span className="hidden sm:inline">
          NDA-bound preview · Access expires 7 days from acceptance
        </span>
      </div>
      {/* Diagonal large-text watermark — subtle */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[99] pointer-events-none flex items-center justify-center"
        style={{
          background:
            'repeating-linear-gradient(-45deg, transparent 0 200px, rgba(217, 119, 6, 0.04) 200px 400px)',
        }}
      />
    </>
  )
}
