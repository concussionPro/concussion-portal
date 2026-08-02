'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider } from '@/contexts/SessionContext'
import { ChevronLeft, Paperclip, Trash2, FileText, Plus } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * /clinical-testing/cpd — the CPD Tracker "My records" page (spec §6: a
 * records page, not a dashboard). First run: pick your board(s) — the page
 * renders fully populated from pack data alone. Then: status card per
 * registration (requirement bars + artifact checklist + countdown), 60-second
 * quick-add, evidence attach, and the always-visible board export.
 *
 * Free for every signed-in user; no tier gate (spec §1).
 */

const ACCENT = '#0d9488'
const NAVY = '#16243f'

interface LineStatus { id: string; label: string; required: number; logged: number; shortfall: number; unit: string; per: string; sourceUrl: string }
interface ArtifactStatus { id: string; label: string; done: boolean }
interface RegStatus {
  packId: string
  window: { start: string; end: string; renewalDate: string; daysLeft: number }
  lines: LineStatus[]
  artifacts: ArtifactStatus[]
  overall: 'green' | 'amber' | 'red'
}
interface Registration {
  id: number
  packId: string
  regNumber: string | null
  pack: {
    id: string; body: string; profession: string; region: string; unit: string
    categories: { id: string; label: string }[]
    artifacts: { id: string; label: string; category: string }[]
    notes: string[]; beta: boolean; version: string
  } | null
  status: RegStatus | null
}
interface PackOption { id: string; body: string; profession: string; region: string; beta: boolean }
interface Activity {
  id: number; title: string; date: string; hours: number; points: number | null
  categories: string[]; provider: string | null; source: string; status: string; evidenceIds: number[]
}

const CHIP: Record<RegStatus['overall'], { bg: string; fg: string; label: string }> = {
  green: { bg: '#dcfce7', fg: '#166534', label: 'On track' },
  amber: { bg: '#fef3c7', fg: '#92400e', label: 'Behind' },
  red: { bg: '#fee2e2', fg: '#991b1b', label: 'Action needed' },
}

export default function CpdTrackerPage() {
  // PARKED (owner 2026-08-03) — flip CONFIG.FEATURES.CPD_TRACKER_LIVE to restore.
  if (!CONFIG.FEATURES.CPD_TRACKER_LIVE) {
    if (typeof window !== 'undefined') window.location.replace('/clinical-testing')
    return null
  }
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Records />
      </ProtectedRoute>
    </SessionProvider>
  )
}

function Records() {
  const [regs, setRegs] = useState<Registration[] | null>(null)
  const [packs, setPacks] = useState<PackOption[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [r, a] = await Promise.all([
        fetch('/api/cpd/registrations', { credentials: 'include' }).then((x) => x.json()),
        fetch('/api/cpd/activities', { credentials: 'include' }).then((x) => x.json()),
      ])
      setRegs(r.registrations ?? [])
      setPacks(r.packs ?? [])
      setActivities(a.activities ?? [])
    } catch {
      setError('Could not load your records. Refresh to retry.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="ml-0 flex-1 p-6 md:ml-64 md:p-8">
        <div className="mx-auto max-w-[980px]">
          <Link href="/clinical-testing" className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-slate-500 hover:text-slate-700">
            <ChevronLeft size={15} /> Clinical tools
          </Link>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.02em]" style={{ color: NAVY }}>CPD Tracker</h1>
              <p className="m-0 mt-1 text-[13.5px] text-slate-500">Your registration requirements, your evidence, one audit-ready export. Free.</p>
            </div>
          </div>

          {error && <p className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-700">{error}</p>}
          {regs === null ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : regs.length === 0 ? (
            <FirstRun packs={packs} onDone={load} />
          ) : (
            <>
              {regs.map((r) => r.pack && r.status && <StatusCard key={r.id} reg={r} />)}
              <QuickAdd regs={regs} onAdded={load} />
              <ActivityList activities={activities} onChanged={load} />
              <CredentialFile />
              <AddBoard packs={packs} existing={regs.map((r) => r.packId)} onDone={load} />
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function BoardSelect({ packs, value, onChange }: { packs: PackOption[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[10px] border border-slate-300 bg-white px-3 py-2.5 text-[14px]"
    >
      <option value="">Choose your board / body…</option>
      {(['AU', 'NZ'] as const).map((region) => (
        <optgroup key={region} label={region === 'AU' ? 'Australia' : 'New Zealand'}>
          {packs.filter((p) => p.region === region).map((p) => (
            <option key={p.id} value={p.id}>
              {p.body} — {p.profession}{p.beta ? ' (beta)' : ''}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}

function FirstRun({ packs, onDone }: { packs: PackOption[]; onDone: () => void }) {
  const [packId, setPackId] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8" style={{ boxShadow: '0 12px 32px -18px rgba(22,36,63,.25)' }}>
      <h2 className="m-0 text-[19px] font-extrabold" style={{ color: NAVY }}>Pick your board — that&rsquo;s the whole setup.</h2>
      <p className="m-0 mt-1.5 max-w-[560px] text-[13.5px] leading-[1.55] text-slate-500">
        Your requirements, cycle dates and renewal countdown come from the board&rsquo;s published standard — you supply nothing but the choice.
      </p>
      <div className="mt-5 flex max-w-[560px] flex-col gap-3">
        <BoardSelect packs={packs} value={packId} onChange={setPackId} />
        <input
          type="text"
          value={regNumber}
          onChange={(e) => setRegNumber(e.target.value)}
          placeholder="Registration number (optional — shown on your export)"
          className="rounded-[10px] border border-slate-300 px-3 py-2.5 text-[14px]"
        />
        <button
          disabled={!packId || busy}
          onClick={async () => {
            setBusy(true)
            await fetch('/api/cpd/registrations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ packId, regNumber }),
            })
            onDone()
          }}
          className="rounded-[11px] px-5 py-3 text-[14px] font-bold text-white disabled:opacity-50"
          style={{ background: NAVY }}
        >
          {busy ? 'Setting up…' : 'Start tracking'}
        </button>
      </div>
    </div>
  )
}

function StatusCard({ reg }: { reg: Registration }) {
  const pack = reg.pack!
  const s = reg.status!
  const chip = CHIP[s.overall]
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6" style={{ boxShadow: '0 12px 32px -20px rgba(22,36,63,.25)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-[17px] font-extrabold" style={{ color: NAVY }}>{pack.body}</h2>
            {pack.beta && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">beta</span>}
          </div>
          <p className="m-0 mt-0.5 text-[12.5px] text-slate-500">
            {pack.profession}{reg.regNumber ? ` · ${reg.regNumber}` : ''} · renews {s.window.renewalDate} ({s.window.daysLeft} days)
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="rounded-full px-3 py-1.5 text-[12px] font-bold" style={{ background: chip.bg, color: chip.fg }}>{chip.label}</span>
          <a
            href={`/api/cpd/export?pack=${pack.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-slate-300 bg-white px-3.5 py-2 text-[12.5px] font-bold"
            style={{ color: NAVY }}
          >
            <FileText size={14} /> Audit export
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {s.lines.map((l) => {
          const pct = Math.min(100, Math.round((l.logged / Math.max(l.required, 0.01)) * 100))
          return (
            <div key={l.id}>
              <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
                <span className="font-semibold text-slate-700">{l.label}{l.per === 'year' ? ' (this year)' : ''}</span>
                <span className="font-bold" style={{ color: l.shortfall > 0 ? '#92400e' : '#166534' }}>
                  {l.logged} / {l.required} {l.unit}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: l.shortfall > 0 ? '#f59e0b' : ACCENT }} />
              </div>
            </div>
          )
        })}
      </div>

      {s.artifacts.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.artifacts.map((a) => (
            <span
              key={a.id}
              className="rounded-full border px-2.5 py-1 text-[11.5px] font-semibold"
              style={a.done
                ? { borderColor: '#bbf7d0', background: '#f0fdf4', color: '#166534' }
                : { borderColor: '#e2e8f0', background: '#f8fafc', color: '#64748b' }}
            >
              {a.done ? '✓ ' : '○ '}{a.label}
            </span>
          ))}
        </div>
      )}
      {pack.notes.length > 0 && (
        <p className="m-0 mt-3 text-[11.5px] leading-[1.5] text-slate-400">{pack.notes.join(' ')}</p>
      )}
    </div>
  )
}

function QuickAdd({ regs, onAdded }: { regs: Registration[]; onAdded: () => void }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [hours, setHours] = useState('')
  const [points, setPoints] = useState('')
  const [provider, setProvider] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Tag options = every category + artifact across the user's registered
  // packs (an activity can satisfy lines/artifacts on multiple registrations).
  const tagOptions: { id: string; label: string }[] = []
  for (const r of regs) {
    if (!r.pack) continue
    for (const c of r.pack.categories) if (!tagOptions.some((t) => t.id === c.id)) tagOptions.push(c)
    for (const a of r.pack.artifacts) if (!tagOptions.some((t) => t.id === a.category)) tagOptions.push({ id: a.category, label: a.label })
  }
  const hasPoints = regs.some((r) => r.pack?.unit === 'points')

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="m-0 flex items-center gap-2 text-[15px] font-extrabold" style={{ color: NAVY }}>
        <Plus size={16} /> Log an activity
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What was it? (course, webinar, journal club…)" className="rounded-[10px] border border-slate-300 px-3 py-2.5 text-[14px] sm:col-span-2" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-[10px] border border-slate-300 px-3 py-2.5 text-[14px]" />
        <div className="flex gap-3">
          <input type="number" min="0.25" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Hours" className="w-full rounded-[10px] border border-slate-300 px-3 py-2.5 text-[14px]" />
          {hasPoints && (
            <input type="number" min="0" step="0.5" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="Points (if ≠ hours)" className="w-full rounded-[10px] border border-slate-300 px-3 py-2.5 text-[14px]" />
          )}
        </div>
        <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Provider (optional)" className="rounded-[10px] border border-slate-300 px-3 py-2.5 text-[14px] sm:col-span-2" />
      </div>
      {tagOptions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tagOptions.map((t) => {
            const on = cats.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setCats(on ? cats.filter((c) => c !== t.id) : [...cats, t.id])}
                className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                style={on
                  ? { borderColor: ACCENT, background: '#f0fdfa', color: '#0f766e' }
                  : { borderColor: '#e2e8f0', background: '#fff', color: '#64748b' }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      )}
      {err && <p className="m-0 mt-3 text-[12.5px] font-semibold text-red-600">{err}</p>}
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setErr(null)
          const res = await fetch('/api/cpd/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title, date, hours: Number(hours), points: points === '' ? null : Number(points), categories: cats, provider }),
          })
          const d = await res.json().catch(() => ({}))
          setBusy(false)
          if (!res.ok) {
            setErr(d?.error || 'Could not save.')
            return
          }
          setTitle(''); setHours(''); setPoints(''); setProvider(''); setCats([])
          onAdded()
        }}
        className="mt-4 rounded-[11px] px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        style={{ background: NAVY }}
      >
        {busy ? 'Saving…' : 'Add to my record'}
      </button>
    </div>
  )
}

function ActivityList({ activities, onChanged }: { activities: Activity[]; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [attachTo, setAttachTo] = useState<number | null>(null)
  const [uploadErr, setUploadErr] = useState<string | null>(null)

  async function onFile(file: File) {
    if (attachTo === null) return
    setUploadErr(null)
    const buf = await file.arrayBuffer()
    const b64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''))
    const res = await fetch('/api/cpd/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ activityId: attachTo, filename: file.name, mime: file.type, dataBase64: b64 }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) setUploadErr(d?.error || 'Upload failed.')
    setAttachTo(null)
    onChanged()
  }

  if (activities.length === 0) return null
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="m-0 text-[15px] font-extrabold" style={{ color: NAVY }}>Evidence vault</h3>
      {uploadErr && <p className="m-0 mt-2 text-[12.5px] font-semibold text-red-600">{uploadErr}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])}
      />
      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {activities.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-slate-100 bg-slate-50/60 px-4 py-3">
            <div className="min-w-0">
              <p className="m-0 truncate text-[13.5px] font-bold text-slate-800">{a.title}</p>
              <p className="m-0 text-[12px] text-slate-500">
                {a.date} · {a.hours} hrs{a.points !== null ? ` · ${a.points} pts` : ''}{a.provider ? ` · ${a.provider}` : ''}
                {a.evidenceIds.length > 0 && (
                  <>
                    {' · '}
                    {a.evidenceIds.map((id, i) => (
                      <a key={id} href={`/api/cpd/evidence?id=${id}`} className="font-semibold underline" style={{ color: ACCENT }}>
                        evidence {i + 1}
                      </a>
                    ))}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                title="Attach evidence"
                onClick={() => {
                  setAttachTo(a.id)
                  fileRef.current?.click()
                }}
                className="rounded-[8px] border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <Paperclip size={14} />
              </button>
              <button
                title="Delete activity"
                onClick={async () => {
                  await fetch('/api/cpd/activities', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id: a.id }),
                  })
                  onChanged()
                }}
                className="rounded-[8px] border border-slate-200 bg-white p-2 text-slate-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

const CREDENTIAL_KINDS: { id: string; label: string; hint: string; expires: boolean }[] = [
  { id: 'registration-cert', label: 'Registration certificate', hint: 'Your current registration record', expires: true },
  { id: 'indemnity', label: 'Professional indemnity', hint: 'Current certificate of currency', expires: true },
  { id: 'orientation', label: 'Orientation / induction', hint: 'e.g. NDIS worker orientation module', expires: false },
  { id: 'training', label: 'Role-specific training', hint: 'Mandatory + refresher training records', expires: false },
  { id: 'supervision', label: 'Supervision records', hint: 'Supervision notes / agreements', expires: false },
]

interface CredentialDoc { id: number; kind: string; filename: string; expiryDate: string | null }

/**
 * The credential file (owner research 2026-08-03): the documents an
 * NDIS/DVA/ACC auditor — and the owner's own AHPRA employer obligations —
 * actually ask for, kept beside the CPD record in the same vault. This is
 * the practitioner-side half; the clinic roster view arrives with the paid
 * tiers.
 */
function CredentialFile() {
  const [docs, setDocs] = useState<CredentialDoc[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [pendingKind, setPendingKind] = useState<string | null>(null)
  const [expiry, setExpiry] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/cpd/evidence?list=credentials', { credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    setDocs(d.documents ?? [])
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  async function onFile(file: File) {
    if (!pendingKind) return
    setErr(null)
    const buf = await file.arrayBuffer()
    const b64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''))
    const res = await fetch('/api/cpd/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ kind: pendingKind, filename: file.name, mime: file.type, dataBase64: b64, expiryDate: expiry || null }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) setErr(d?.error || 'Upload failed.')
    setPendingKind(null)
    setExpiry('')
    void load()
  }

  const today = new Date().toISOString().slice(0, 10)
  const soon = new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10)

  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="m-0 text-[15px] font-extrabold" style={{ color: NAVY }}>Credential file</h3>
      <p className="m-0 mt-1 text-[12.5px] text-slate-500">
        The documents audits actually ask for — kept beside your CPD record, included in your export.
      </p>
      {err && <p className="m-0 mt-2 text-[12.5px] font-semibold text-red-600">{err}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && void onFile(e.target.files[0])}
      />
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {CREDENTIAL_KINDS.map((k) => {
          const latest = docs.find((d) => d.kind === k.id)
          const expired = latest?.expiryDate ? latest.expiryDate < today : false
          const expiring = latest?.expiryDate ? !expired && latest.expiryDate <= soon : false
          return (
            <div key={k.id} className="flex items-center justify-between gap-2 rounded-[12px] border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-bold text-slate-800">{k.label}</p>
                <p className="m-0 truncate text-[11.5px] text-slate-500">
                  {latest ? (
                    <>
                      <a href={`/api/cpd/evidence?id=${latest.id}`} className="font-semibold underline" style={{ color: ACCENT }}>{latest.filename}</a>
                      {latest.expiryDate && (
                        <span className={`ml-1.5 font-bold ${expired ? 'text-red-600' : expiring ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {expired ? `expired ${latest.expiryDate}` : `to ${latest.expiryDate}`}
                        </span>
                      )}
                    </>
                  ) : (
                    k.hint
                  )}
                </p>
              </div>
              <div className="flex flex-none items-center gap-1.5">
                {k.expires && pendingKind === k.id && (
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="rounded-[8px] border border-slate-200 px-2 py-1.5 text-[11px]"
                    title="Expiry date (optional)"
                  />
                )}
                <button
                  onClick={() => {
                    if (pendingKind === k.id) {
                      fileRef.current?.click()
                    } else {
                      setPendingKind(k.id)
                      setExpiry('')
                      if (!k.expires) setTimeout(() => fileRef.current?.click(), 0)
                    }
                  }}
                  className="rounded-[8px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-bold text-slate-600 hover:text-slate-900"
                >
                  {pendingKind === k.id && k.expires ? 'Choose file' : latest ? 'Update' : 'Upload'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AddBoard({ packs, existing, onDone }: { packs: PackOption[]; existing: string[]; onDone: () => void }) {
  const [packId, setPackId] = useState('')
  const available = packs.filter((p) => !existing.includes(p.id))
  if (available.length === 0) return null
  return (
    <div className="mb-10 flex flex-wrap items-center gap-3">
      <BoardSelect packs={available} value={packId} onChange={setPackId} />
      <button
        disabled={!packId}
        onClick={async () => {
          await fetch('/api/cpd/registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ packId }),
          })
          setPackId('')
          onDone()
        }}
        className="rounded-[10px] border border-slate-300 bg-white px-4 py-2.5 text-[13px] font-bold disabled:opacity-50"
        style={{ color: NAVY }}
      >
        + Track another registration
      </button>
    </div>
  )
}
