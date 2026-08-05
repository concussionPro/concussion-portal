'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Building2, ChevronDown, Check } from 'lucide-react'

/**
 * Clinic master profile — the POPULATION ENGINE. Entered ONCE on the Clinical
 * Testing home (shared by both instruments), then merged into the default
 * fields of every document (letterhead, provider block, sign-off) so the
 * clinician never re-types them.
 *
 * BLANK + UNIQUE PER CLINIC (owner directive): fields start EMPTY — nothing is
 * seeded from the platform (no registry clinic name, no account name). Storage
 * is namespaced by clinic code so two clinics on one device never share a
 * profile. Field names match the templates' merge fields exactly.
 */

const KEY_PREFIX = 'cea:clinic-profile'
const keyFor = (clinicCode?: string | null) => `${KEY_PREFIX}:${(clinicCode || 'unset').toUpperCase()}`

export interface ClinicProfile {
  clinic_name: string
  clinician_name: string
  ahpra_number: string
  provider_number: string
  clinic_address: string
  clinic_phone: string
}

const EMPTY: ClinicProfile = {
  clinic_name: '',
  clinician_name: '',
  ahpra_number: '',
  provider_number: '',
  clinic_address: '',
  clinic_phone: '',
}

/** Blank profile — shared with every consumer so nobody re-declares the shape. */
export const EMPTY_CLINIC_PROFILE: ClinicProfile = EMPTY

/** Normalise a server profile (partial, possibly null) into a full profile. */
export function toClinicProfile(raw: unknown): ClinicProfile {
  if (!raw || typeof raw !== 'object') return EMPTY
  const src = raw as Partial<Record<keyof ClinicProfile, unknown>>
  const out = { ...EMPTY }
  for (const k of Object.keys(EMPTY) as (keyof ClinicProfile)[]) {
    if (typeof src[k] === 'string') out[k] = src[k] as string
  }
  return out
}

/** Write the offline cache for a clinic (server profile stays the master). */
export function cacheClinicProfile(clinicCode: string | null | undefined, profile: ClinicProfile): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(keyFor(clinicCode), JSON.stringify(profile))
  } catch {
    /* private mode / quota */
  }
}

const FIELDS: { key: keyof ClinicProfile; label: string; placeholder: string }[] = [
  { key: 'clinic_name', label: 'Clinic name', placeholder: 'Your clinic name' },
  { key: 'clinician_name', label: 'Practitioner name', placeholder: 'Your name' },
  { key: 'ahpra_number', label: 'AHPRA registration no.', placeholder: 'e.g. OST0001234567' },
  { key: 'provider_number', label: 'Provider number', placeholder: 'e.g. 1234567A' },
  { key: 'clinic_address', label: 'Clinic address', placeholder: 'Street, suburb, state, postcode' },
  { key: 'clinic_phone', label: 'Clinic phone', placeholder: 'e.g. (03) 9000 0000' },
]

/** Read a clinic's saved profile (blank if never set). */
export function loadClinicProfile(clinicCode?: string | null): ClinicProfile {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(keyFor(clinicCode))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return { ...EMPTY, ...parsed }
    }
  } catch {
    /* ignore */
  }
  return EMPTY
}

export function ClinicProfileCard({
  clinicCode,
  onChange,
}: {
  /** Namespaces the saved profile so it is unique per clinic. */
  clinicCode?: string | null
  onChange?: (p: ClinicProfile) => void
}) {
  const [profile, setProfile] = useState<ClinicProfile>(EMPTY)
  const [open, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  // Save state is SHOWN (2026-08-05 crawl #1): the PUT 400s outright when the
  // caller has no clinic yet, and the failure used to vanish into a bare
  // .catch — six fields typed, nothing stored, no warning.
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState('')

  // Load the saved profile for THIS clinic code (blank if unset). No seeding.
  useEffect(() => {
    const saved = loadClinicProfile(clinicCode)
    setProfile(saved)
    onChange?.(saved)
    // Server profile is the MASTER copy (one input, every seat/device);
    // localStorage is only the offline cache. Server state REPLACES local
    // (never merges — merging resurrected deliberately-cleared fields from
    // stale caches on other devices), and never clobbers keystrokes made
    // while the fetch was in flight (round-4 #3).
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dirtyRef.current) return
        if (d?.profile && typeof d.profile === 'object') {
          const server = { ...EMPTY, ...d.profile } as typeof saved
          setProfile(server)
          onChange?.(server)
          try { localStorage.setItem(keyFor(clinicCode), JSON.stringify(server)) } catch { /* private mode */ }
        }
      })
      .catch(() => {})
    // Open by default until the essentials are filled.
    setOpen(!saved.clinic_name || !saved.ahpra_number)
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicCode])

  const filledCount = useMemo(() => Object.values(profile).filter((v) => v.trim()).length, [profile])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirtyRef = useRef(false)
  const update = (key: keyof ClinicProfile, value: string) => {
    dirtyRef.current = true
    const next = { ...profile, [key]: value }
    setProfile(next)
    onChange?.(next)
    try {
      localStorage.setItem(keyFor(clinicCode), JSON.stringify(next))
    } catch {
      /* ignore quota */
    }
    // DEMO00 has no server profile (setClinicProfile refuses the demo code) —
    // the demo card stays local-only and silent, exactly as it was.
    if ((clinicCode || '').toUpperCase() === 'DEMO00') return
    // Debounced push to the server master copy — result surfaced, never swallowed.
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveState('saving')
    setSaveError('')
    saveTimer.current = setTimeout(() => {
      void fetch('/api/clinical-testing/clinic', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: next }),
      })
        .then(async (res) => {
          if (res.ok) {
            setSaveState('saved')
            return
          }
          const data = (await res.json().catch(() => ({}))) as { error?: string }
          setSaveState('error')
          setSaveError(
            res.status === 400 && /no clinic/i.test(data.error || '')
              ? 'Create your clinic code below first — these details save against it.'
              : data.error || 'Couldn’t save to your clinic. These details are on this device only until it does.',
          )
        })
        .catch(() => {
          setSaveState('error')
          setSaveError('Couldn’t reach the server. These details are on this device only until it saves.')
        })
    }, 800)
  }

  if (!hydrated) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#eef4f4] text-[#3c7681]">
          <Building2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[14px] font-bold text-slate-900">Clinic details</p>
          <p className="m-0 text-[12px] text-slate-500">
            Entered once — filled into every report’s letterhead, provider block and sign-off.
          </p>
        </div>
        <span className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              filledCount >= 4 ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {filledCount >= 4 && <Check className="h-3 w-3" />} {filledCount}/6
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-5 py-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{f.label}</span>
              <input
                type="text"
                value={profile[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-accent focus:outline-none"
              />
            </label>
          ))}
          {saveState === 'error' ? (
            <p className="col-span-full m-0 text-[11.5px] font-semibold text-amber-800">{saveError}</p>
          ) : (
            <p className="col-span-full m-0 text-[11px] text-slate-400">
              {(clinicCode || '').toUpperCase() === 'DEMO00'
                ? 'Demo workspace — these stay on this device.'
                : saveState === 'saving'
                  ? 'Saving to your clinic…'
                  : saveState === 'saved'
                    ? 'Saved to your clinic — every seat and device sees these.'
                    : 'Saved to your clinic, so every seat and device sees the same details.'}{' '}
              These fill the matching fields across every report; edit a field on a document to
              override it for that one document only.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
