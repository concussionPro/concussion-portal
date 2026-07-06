'use client'

import { useEffect, useState } from 'react'

/**
 * Client gate for /clinical-testing/* pages. Resolves the caller's access
 * door server-side (owner | course | sst | none) so the suite unlocks for
 * course buyers and SST-entitled clinics — not just the owner. 'loading'
 * until resolved. Replaces the synchronous isOwnerEmail check.
 */
import type { ClinicalAccess as Door } from '@/lib/sst-trainer/access'
export type ClinicalAccess = 'loading' | Door

export function useClinicalAccess(): ClinicalAccess {
  const [access, setAccess] = useState<ClinicalAccess>('loading')
  useEffect(() => {
    let alive = true
    void fetch('/api/clinical-testing/access', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { access: 'unreleased' }))
      .then((d) => {
        if (alive) setAccess((d?.access as ClinicalAccess) ?? 'unreleased')
      })
      .catch(() => {
        if (alive) setAccess('unreleased')
      })
    return () => {
      alive = false
    }
  }, [])
  return access
}
