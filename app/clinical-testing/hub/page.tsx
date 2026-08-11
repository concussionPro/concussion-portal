'use client'

import { useEffect, useState } from 'react'
import { SessionProvider } from '@/contexts/SessionContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Sidebar } from '@/components/dashboard/Sidebar'
import ClinicalHubPage from '@/app/clinical-hub/page'
import Link from 'next/link'

/**
 * /clinical-testing/hub — the Live Hub INSIDE the portal shell (owner,
 * 2026-08-11: the sidebar item must show the hub embedded in the current
 * dash, not launch the standalone page).
 *
 * The hub component reads ?clinic=&k= from window.location, so this page
 * resolves the signed-in clinician's clinic — the same GET the SST workspace
 * uses — writes those params into the URL with history.replaceState (no
 * navigation, no remount loop), and only then mounts the hub. DEMO00 goes
 * keyless; a clinician with no code yet gets pointed at the workspace where
 * codes are minted. The standalone /clinical-hub keeps working for keyed
 * links shared outside the portal (welcome emails, ACC pitch).
 */
export default function ClinicalTestingHubPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <EmbeddedHub />
      </ProtectedRoute>
    </SessionProvider>
  )
}

function EmbeddedHub() {
  const [state, setState] = useState<'resolving' | 'ready' | 'no-clinic'>('resolving')

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search)
    if ((qs.get('clinic') || '').trim()) {
      setState('ready')
      return
    }
    let cancelled = false
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        const code = typeof d?.clinic?.code === 'string' ? d.clinic.code.trim() : ''
        const key = typeof d?.clinic?.viewKey === 'string' ? d.clinic.viewKey : ''
        if (!code) {
          setState('no-clinic')
          return
        }
        const url = `/clinical-testing/hub?clinic=${encodeURIComponent(code)}${key ? `&k=${encodeURIComponent(key)}` : ''}`
        window.history.replaceState(null, '', url)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('no-clinic')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="ml-0 min-w-0 flex-1 md:ml-64">
        {state === 'ready' ? (
          <ClinicalHubPage />
        ) : state === 'no-clinic' ? (
          <div className="flex min-h-screen items-center justify-center p-8">
            <div className="glass-premium max-w-md rounded-2xl p-8 text-center">
              <h1 className="text-lg font-bold tracking-tight text-foreground">No clinic code yet</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                The Live Hub shows every patient on your clinic code. Create your code in the SST
                workspace first — it takes under a minute.
              </p>
              <Link
                href="/clinical-testing/sst"
                className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white"
              >
                Open the SST workspace
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex min-h-screen items-center justify-center p-8">
            <p className="text-sm text-muted-foreground">Opening your Live Hub…</p>
          </div>
        )}
      </main>
    </div>
  )
}
