'use client'

import { useState } from 'react'
import { Download, Loader2, CheckCircle2 } from 'lucide-react'

export function DownloadButton({
  kit,
  label,
  prospectKey,
}: {
  kit: 'all' | 'clinical' | 'outreach' | 'admin'
  label?: string
  /** Optional prospect access key (cold-pitch portals). Omit on paid surfaces. */
  prospectKey?: string
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handle() {
    setState('loading')
    try {
      const url = new URL('/api/toolkit/download', window.location.origin)
      url.searchParams.set('kit', kit)
      if (prospectKey) url.searchParams.set('k', prospectKey)
      const res = await fetch(url.toString(), { credentials: 'include' })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match = /filename="([^"]+)"/.exec(disposition)
      const filename = match?.[1] ?? `Hub-Program-Toolkit-${kit}.zip`

      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)

      setState('done')
      setTimeout(() => setState('idle'), 2000)
    } catch (e) {
      console.error('Toolkit download failed', e)
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  const text = label ?? 'Download all as ZIP'
  return (
    <button
      onClick={handle}
      disabled={state === 'loading'}
      className="print:hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-sm"
    >
      {state === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {state === 'idle' && <Download className="w-3.5 h-3.5" />}
      {state === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
      {state === 'error' && <Download className="w-3.5 h-3.5" />}
      {state === 'idle' && text}
      {state === 'loading' && 'Preparing ZIP…'}
      {state === 'done' && 'Downloaded'}
      {state === 'error' && 'Failed — retry'}
    </button>
  )
}
