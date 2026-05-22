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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-slate-900 text-slate-100 text-[11px] font-medium px-4 py-1.5 flex items-center justify-between gap-3 shadow-sm">
      <span className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
        Confidential preview · Issued to <strong className="text-white">{org}</strong>
      </span>
      <span className="hidden sm:inline text-slate-400">
        NDA-bound · 7-day access
      </span>
    </div>
  )
}
