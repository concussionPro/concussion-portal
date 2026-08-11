'use client'

import { useEffect, useState } from 'react'
import { SessionProvider } from '@/contexts/SessionContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'

/**
 * /clinical-testing/hub — sidebar-reachable door to the Clinical Hub.
 *
 * The hub itself is keyed (clinic code + viewKey in the URL), which a static
 * sidebar link can't carry. This page resolves the signed-in clinician's
 * clinic — the same GET the SST workspace uses — and forwards:
 *   real clinic → /clinical-hub?clinic=CODE&k=VIEWKEY
 *   DEMO00     → /clinical-hub?clinic=DEMO00 (keyless by design)
 *   no clinic  → explain + point at the workspace where the code is minted.
 */
export default function ClinicalTestingHubPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <HubRedirect />
      </ProtectedRoute>
    </SessionProvider>
  )
}

function HubRedirect() {
  const [noClinic, setNoClinic] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        const code = typeof d?.clinic?.code === 'string' ? d.clinic.code.trim() : ''
        const key = typeof d?.clinic?.viewKey === 'string' ? d.clinic.viewKey : ''
        if (!code) {
          setNoClinic(true)
          return
        }
        const url = `/clinical-hub?clinic=${encodeURIComponent(code)}${key ? `&k=${encodeURIComponent(key)}` : ''}`
        window.location.replace(url)
      })
      .catch(() => {
        if (!cancelled) setNoClinic(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center dashboard-bg p-8">
      {noClinic ? (
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
      ) : (
        <p className="text-sm text-muted-foreground">Opening your Live Hub…</p>
      )}
    </div>
  )
}
