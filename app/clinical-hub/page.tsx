'use client'

import { useEffect, useState } from 'react'
import { SstLivePanel } from '@/components/sst-trainer/SstLivePanel'
import {
  HeartPulse, Activity, Plus, Search, Calendar, TrendingDown, ClipboardList,
  AlertTriangle, Check, ChevronRight, ChevronLeft, Stethoscope, ArrowUpRight, Clock, NotebookPen,
} from 'lucide-react'

/* ───────────────────────────────────────────────────────────────────
   CLINICAL HUB — pre-launch preview.
   Clinician-facing patient-management surface: roster + per-patient SST
   (sub-symptom-threshold) program and SCAT6 baseline. Demo data only — the
   real version reads sessions keyed by clinic code (SST is already wired to
   receive patient info that way).
─────────────────────────────────────────────────────────────────── */

type Stage = { n: number; label: string }
type Session = { date: string; avgHr: number; peakHr: number; mins: number; symptomDelta: number; status: 'clean' | 'flag' }
type Patient = {
  id: string
  name: string
  age: number
  sport: string
  code: string
  injuryDate: string
  daysPost: number
  stage: Stage
  hrt: number | null
  bandLow: number
  bandHigh: number
  restSymptoms: number
  baseline: 'captured' | 'due' | 'none'
  baselineDate?: string
  trend: number[]          // symptom score over weeks (lower = better)
  sessions: Session[]
  flag?: string
  notes?: string
}

const PATIENTS: Patient[] = [
  {
    id: 'p1', name: 'Liam Carter', age: 17, sport: 'Rugby union', code: 'CEA-4827',
    injuryDate: '2 Jun 2026', daysPost: 22, stage: { n: 4, label: 'Sub-symptom aerobic' },
    hrt: 148, bandLow: 118, bandHigh: 133, restSymptoms: 2, baseline: 'captured', baselineDate: '14 Mar 2026',
    trend: [38, 31, 22, 14, 9, 5],
    sessions: [
      { date: 'Today', avgHr: 126, peakHr: 134, mins: 18, symptomDelta: 0, status: 'clean' },
      { date: '22 Jun', avgHr: 124, peakHr: 131, mins: 18, symptomDelta: 1, status: 'clean' },
      { date: '20 Jun', avgHr: 121, peakHr: 129, mins: 16, symptomDelta: 0, status: 'clean' },
      { date: '18 Jun', avgHr: 118, peakHr: 142, mins: 9, symptomDelta: 3, status: 'flag' },
    ],
  },
  {
    id: 'p2', name: 'Ava Nguyen', age: 24, sport: 'Netball', code: 'CEA-5193',
    injuryDate: '17 Jun 2026', daysPost: 7, stage: { n: 2, label: 'Threshold test pending' },
    hrt: null, bandLow: 0, bandHigh: 0, restSymptoms: 6, baseline: 'due',
    trend: [44, 41],
    sessions: [],
    flag: 'No threshold test yet — symptoms still elevated at rest (6/10).',
  },
  {
    id: 'p3', name: 'Marcus Webb', age: 31, sport: 'Cycling', code: 'CEA-3340',
    injuryDate: '9 May 2026', daysPost: 46, stage: { n: 6, label: 'Return-to-sport progression' },
    hrt: 171, bandLow: 154, bandHigh: 162, restSymptoms: 0, baseline: 'captured', baselineDate: '2 Feb 2026',
    trend: [29, 20, 12, 6, 2, 0, 0],
    sessions: [
      { date: 'Today', avgHr: 158, peakHr: 168, mins: 30, symptomDelta: 0, status: 'clean' },
      { date: '23 Jun', avgHr: 156, peakHr: 165, mins: 28, symptomDelta: 0, status: 'clean' },
      { date: '21 Jun', avgHr: 152, peakHr: 163, mins: 26, symptomDelta: 0, status: 'clean' },
    ],
  },
  {
    id: 'p4', name: 'Sophie Reid', age: 14, sport: 'AFL', code: 'CEA-6011',
    injuryDate: '13 Jun 2026', daysPost: 11, stage: { n: 3, label: 'Sub-symptom aerobic' },
    hrt: 139, bandLow: 111, bandHigh: 125, restSymptoms: 3, baseline: 'none',
    trend: [40, 33, 27],
    sessions: [
      { date: 'Today', avgHr: 117, peakHr: 126, mins: 14, symptomDelta: 1, status: 'clean' },
      { date: '22 Jun', avgHr: 114, peakHr: 122, mins: 12, symptomDelta: 2, status: 'clean' },
    ],
  },
]

/* Baseline & serial testing — SCAT6/SCOAT6 domain scores: the athlete's
   pre-season baseline vs their latest post-injury test. `better` says which
   direction is recovery. baseline === null → no pre-season test on file. */
type Domain = { name: string; unit?: string; baseline: number | null; latest: number | null; better: 'higher' | 'lower' }
type Baseline = { tool: 'SCAT6' | 'SCOAT6'; status: 'captured' | 'due' | 'none'; capturedDate?: string; lastTest?: string; domains: Domain[] }

const BASELINES: Record<string, Baseline> = {
  p1: {
    tool: 'SCAT6', status: 'captured', capturedDate: '14 Mar 2026', lastTest: 'Today',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: 4, latest: 7, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: 28, latest: 27, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: 4, latest: 4, better: 'higher' },
      { name: 'Delayed recall', unit: '/10', baseline: 9, latest: 8, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: 3, latest: 5, better: 'lower' },
      { name: 'VOMS provocation', unit: 'pts', baseline: 0, latest: 2, better: 'lower' },
    ],
  },
  p2: {
    tool: 'SCAT6', status: 'due', capturedDate: '—', lastTest: 'Pending',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: 6, latest: null, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: 27, latest: null, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: 4, latest: null, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: 4, latest: null, better: 'lower' },
    ],
  },
  p3: {
    tool: 'SCAT6', status: 'captured', capturedDate: '2 Feb 2026', lastTest: 'Today',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: 2, latest: 0, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: 29, latest: 30, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: 5, latest: 5, better: 'higher' },
      { name: 'Delayed recall', unit: '/10', baseline: 9, latest: 10, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: 2, latest: 1, better: 'lower' },
      { name: 'VOMS provocation', unit: 'pts', baseline: 0, latest: 0, better: 'lower' },
    ],
  },
  p4: {
    tool: 'SCOAT6', status: 'none', lastTest: 'Today',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: null, latest: 18, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: null, latest: 25, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: null, latest: 3, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: null, latest: 8, better: 'lower' },
      { name: 'VOMS provocation', unit: 'pts', baseline: null, latest: 4, better: 'lower' },
    ],
  },
}

/* Return-to-activity ladder — the clinician advances/holds the patient along it.
   Mirrors a sub-symptom graded-exertion progression; final clearance is the
   treating doctor's call, not the app's. */
const STAGES: { n: number; label: string }[] = [
  { n: 1, label: 'Intake — symptom-limited' },
  { n: 2, label: 'Threshold test' },
  { n: 3, label: 'Sub-symptom aerobic (light)' },
  { n: 4, label: 'Sub-symptom aerobic (moderate)' },
  { n: 5, label: 'Sport-specific / non-contact' },
  { n: 6, label: 'Return-to-sport progression' },
  { n: 7, label: 'Cleared — refer to MD' },
]

/** Recovery status of a domain vs its own baseline. */
function domainState(d: Domain): 'recovered' | 'off' | 'pending' | 'nobaseline' {
  if (d.latest === null) return 'pending'
  if (d.baseline === null) return 'nobaseline'
  const recovered = d.better === 'higher' ? d.latest >= d.baseline : d.latest <= d.baseline
  return recovered ? 'recovered' : 'off'
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('')
}

function Trend({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[var(--accent)] to-[var(--accent-light)]"
          style={{ height: `${Math.max(6, (v / max) * 100)}%`, opacity: 0.35 + (i / data.length) * 0.65 }} />
      ))}
    </div>
  )
}

function BaselinePanel({ base }: { base: Baseline }) {
  const hasBaseline = base.status !== 'none'
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
          <h3 className="text-sm font-bold text-foreground">Baseline &amp; serial testing</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/[0.04] text-muted-foreground border border-black/5">
            {base.tool}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {base.status === 'captured' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]">
              <Check className="w-3.5 h-3.5" /> Baseline {base.capturedDate}
            </span>
          )}
          {base.status === 'due' && <span className="text-[11px] font-semibold text-amber-600">Serial re-test due</span>}
          {base.status === 'none' && <span className="text-[11px] font-semibold text-muted-foreground">No pre-season baseline</span>}
          <button className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/5 transition">
            {hasBaseline ? 'Run serial test' : 'Capture baseline'} <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.4fr_repeat(3,0.8fr)] gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
        <span>Domain</span><span className="text-right">Baseline</span><span className="text-right">Latest</span><span className="text-right">Status</span>
      </div>
      <div className="space-y-1">
        {base.domains.map((d, i) => {
          const st = domainState(d)
          const delta = d.baseline !== null && d.latest !== null ? d.latest - d.baseline : null
          const sign = delta === null ? '' : delta > 0 ? `+${delta}` : `${delta}`
          return (
            <div key={i} className="grid grid-cols-[1.4fr_repeat(3,0.8fr)] gap-2 items-center rounded-xl px-3 py-2.5 bg-black/[0.015]">
              <span className="text-xs font-medium text-foreground">{d.name} <span className="text-muted-foreground/50 font-normal">{d.unit}</span></span>
              <span className="text-xs text-right font-mono text-muted-foreground">{d.baseline ?? '—'}</span>
              <span className="text-xs text-right font-mono font-semibold text-foreground">{d.latest ?? '—'}</span>
              <span className="text-right">
                {st === 'recovered' && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]"><Check className="w-3 h-3" />at base</span>}
                {st === 'off' && <span className="text-[11px] font-semibold text-amber-600">{sign} off base</span>}
                {st === 'pending' && <span className="text-[11px] text-muted-foreground/60">pending</span>}
                {st === 'nobaseline' && <span className="text-[11px] text-muted-foreground/60">no base</span>}
              </span>
            </div>
          )
        })}
      </div>

      {base.status === 'none' && (
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-3">
          No pre-season baseline on file — scores are read against normative ranges only. Capturing a baseline (ideally pre-season) makes every future test a same-athlete comparison.
        </p>
      )}
    </div>
  )
}

// A clinic code identifies the CLINIC; each patient also needs a patient-level
// key so sessions attach to the right card. We mint <CLINIC>-<id> per patient.
function mintPatientCode(clinic: string, seq: number) {
  return `${clinic}-${String(seq).padStart(2, '0')}`
}

/* Real data from /api/sst/clinic-sessions → the Hub's display shape. Real SST
   intake captures fewer fields than the demo (no age/sport/injury date yet), so
   those show as placeholders; the clinical signal — HRt, band, sessions, the
   clearance flag — is real. */
type ApiPatient = {
  name?: string
  condition?: string | null
  hrt?: number | null
  bandLow?: number | null
  bandHigh?: number | null
  hrtTrajectory?: { hrt?: number | null }[]
  sessions?: { date?: string; avgHr?: number; peakHr?: number; minutes?: number; mins?: number; symptomDelta?: number }[]
  clearanceReady?: boolean
}

function mapRealPatient(p: ApiPatient, clinicCode: string, i: number): Patient {
  const stage: Stage = p.clearanceReady
    ? { n: 7, label: 'Cleared — refer to MD' }
    : p.hrt
      ? { n: 4, label: 'Sub-symptom aerobic' }
      : { n: 2, label: 'Threshold test pending' }
  const sessions: Session[] = (p.sessions ?? []).map((s) => ({
    date: s.date ? new Date(s.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—',
    avgHr: Number(s.avgHr) || 0,
    peakHr: Number(s.peakHr) || 0,
    mins: Number(s.minutes ?? s.mins) || 0,
    symptomDelta: Number(s.symptomDelta) || 0,
    status: Number(s.symptomDelta) >= 2 ? 'flag' : 'clean',
  }))
  return {
    id: `real-${i}`,
    name: p.name || 'Unidentified',
    age: 0,
    sport: p.condition || '—',
    code: clinicCode,
    injuryDate: '—',
    daysPost: 0,
    stage,
    hrt: p.hrt ?? null,
    bandLow: p.bandLow ?? 0,
    bandHigh: p.bandHigh ?? 0,
    restSymptoms: 0,
    baseline: 'none',
    trend: (p.hrtTrajectory ?? []).map((t) => Number(t.hrt) || 0).filter(Boolean), // serial HRt = recovery curve
    sessions,
    flag: p.clearanceReady
      ? 'Recovered — no-intolerance on re-test. Ready for your clearance review.'
      : undefined,
  }
}

export default function ClinicalHubPage() {
  const [roster, setRoster] = useState<Patient[]>(PATIENTS)
  const [selectedId, setSelectedId] = useState('p1')
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [clinicCode, setClinicCode] = useState('')

  // Real data: ?clinic=<code> loads that clinic's actual SST sessions from
  // /api/sst/clinic-sessions (additive — without the param the Hub shows the
  // demo roster). window.location avoids a Suspense boundary for useSearchParams.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('clinic')
    if (!code) return
    setClinicCode(code.toUpperCase())
    fetch(`/api/sst/clinic-sessions?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data: { patients?: ApiPatient[] }) => {
        if (data?.patients && data.patients.length) {
          setRoster(data.patients.map((pp, i) => mapRealPatient(pp, code.toUpperCase(), i)))
          setSelectedId('real-0')
        }
      })
      .catch(() => {})
  }, [])
  const patients = roster.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
  const p = roster.find((x) => x.id === selectedId) ?? roster[0]

  function addPatient(form: { name: string; age: string; sport: string; injuryDate: string }) {
    const seq = roster.length + 1
    const id = `p${seq}-${form.name.replace(/\s+/g, '').toLowerCase()}`
    const next: Patient = {
      id, name: form.name.trim() || 'New patient', age: Number(form.age) || 0,
      sport: form.sport.trim() || '—', code: mintPatientCode('CEA-CLN', seq),
      injuryDate: form.injuryDate || 'Today', daysPost: 0,
      stage: { n: 1, label: 'Intake — threshold test pending' },
      hrt: null, bandLow: 0, bandHigh: 0, restSymptoms: 0, baseline: 'none',
      trend: [], sessions: [],
      flag: 'New patient — capture a baseline and run the graded threshold test to begin.',
    }
    setRoster((r) => [next, ...r])
    setSelectedId(id)
    setAddOpen(false)
  }

  function updatePatient(id: string, partial: Partial<Patient>) {
    setRoster((r) => r.map((pt) => (pt.id === id ? { ...pt, ...partial } : pt)))
  }
  const setStage = (n: number) => {
    const s = STAGES.find((x) => x.n === n)
    if (s) updatePatient(p.id, { stage: s, daysPost: p.daysPost })
  }

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Preview banner */}
      <div className="bg-[var(--accent)] text-white text-center text-xs py-1.5 px-4 font-medium">
        Clinical Hub — pre-launch preview · demo data · not visible to enrolled users
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Live in-session monitor — only with a real ?clinic=<code> */}
        {clinicCode && <SstLivePanel code={clinicCode} />}
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#0b6165] flex items-center justify-center">
              <Stethoscope className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">Clinical Hub</h1>
              <p className="text-xs text-muted-foreground mt-1">Carter Sports &amp; Spinal · {roster.length} active patient{roster.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition">
            <Plus className="w-4 h-4" /> Add patient
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          {/* ── Roster ── */}
          <aside className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-premium text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              />
            </div>
            {patients.map((pt) => {
              const active = pt.id === selectedId
              return (
                <button key={pt.id} onClick={() => setSelectedId(pt.id)}
                  className={`w-full text-left glass-premium rounded-2xl p-4 transition group ${active ? 'ring-2 ring-[var(--accent)]/40' : 'hover:-translate-y-0.5'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
                      {initials(pt.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{pt.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{pt.age} · {pt.sport}</p>
                    </div>
                    {pt.flag
                      ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[var(--accent)] flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                      Stage {pt.stage.n}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{pt.daysPost}d post-injury</span>
                  </div>
                </button>
              )
            })}
          </aside>

          {/* ── Detail ── */}
          <section className="space-y-5">
            {/* Patient header */}
            <div className="glass-premium rounded-2xl p-5 sm:p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                    {initials(p.name)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{p.name}</h2>
                    <p className="text-sm text-muted-foreground">{p.age} yrs · {p.sport} · clinic code <span className="font-mono text-foreground">{p.code}</span></p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Injured {p.injuryDate}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.daysPost} days post</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                  Stage {p.stage.n} — {p.stage.label}
                </span>
              </div>

              {p.flag && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">{p.flag}</p>
                </div>
              )}
            </div>

            {/* Return-to-activity stage management */}
            <div className="glass-premium rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                  <h3 className="text-sm font-bold text-foreground">Return-to-activity stage</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStage(Math.max(1, p.stage.n - 1))} disabled={p.stage.n <= 1}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-black/10 text-muted-foreground hover:bg-black/[0.03] transition disabled:opacity-40">
                    <ChevronLeft className="w-3.5 h-3.5" /> Step back
                  </button>
                  <button onClick={() => setStage(Math.min(7, p.stage.n + 1))} disabled={p.stage.n >= 7}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-40">
                    Advance <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* clickable ladder */}
              <div className="flex items-center gap-1.5">
                {STAGES.map((s) => {
                  const done = s.n < p.stage.n, current = s.n === p.stage.n
                  return (
                    <button key={s.n} onClick={() => setStage(s.n)} title={s.label}
                      className={`flex-1 h-2 rounded-full transition ${current ? 'bg-[var(--accent)]' : done ? 'bg-[var(--accent)]/35' : 'bg-black/[0.06] hover:bg-black/10'}`} />
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs font-semibold text-foreground">Stage {p.stage.n} · {p.stage.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.stage.n < 7 ? `Next: ${STAGES.find((s) => s.n === p.stage.n + 1)?.label}` : 'Refer to treating doctor for clearance'}
                </p>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="glass-premium rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2"><HeartPulse className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /><p className="stat-label mb-0">HR threshold</p></div>
                <p className="stat-value">{p.hrt ? <>{p.hrt}<span className="text-base font-medium text-muted-foreground"> bpm</span></> : <span className="text-base text-muted-foreground">Not set</span>}</p>
              </div>
              <div className="glass-premium rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2"><Activity className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /><p className="stat-label mb-0">Training band</p></div>
                <p className="stat-value">{p.hrt ? <>{p.bandLow}–{p.bandHigh}<span className="text-base font-medium text-muted-foreground"> bpm</span></> : <span className="text-base text-muted-foreground">—</span>}</p>
              </div>
              <div className="glass-premium rounded-2xl p-5 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /><p className="stat-label mb-0">Symptoms at rest</p></div>
                <p className="stat-value">{p.restSymptoms}<span className="text-base font-medium text-muted-foreground"> / 10</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SST program */}
              <div className="glass-premium rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                    <h3 className="text-sm font-bold text-foreground">SST program</h3>
                  </div>
                  <button className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline">
                    Open session <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {p.sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground leading-relaxed py-6 text-center">
                    No sessions yet. Run the graded threshold test to set this patient&apos;s HRt and training band.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {p.sessions.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl bg-black/[0.015] px-3 py-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === 'flag' ? 'bg-amber-500' : 'bg-[var(--accent)]'}`} />
                        <p className="text-xs font-medium text-foreground w-14 flex-shrink-0">{s.date}</p>
                        <p className="text-xs text-muted-foreground flex-1">avg {s.avgHr} · peak {s.peakHr} bpm · {s.mins} min</p>
                        <span className={`text-[11px] font-semibold ${s.symptomDelta > 2 ? 'text-amber-600' : 'text-[var(--accent)]'}`}>
                          {s.symptomDelta === 0 ? 'no Δ' : `+${s.symptomDelta}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recovery trajectory */}
              <div className="glass-premium rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                    <h3 className="text-sm font-bold text-foreground">Recovery trajectory</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">symptom score / week</span>
                </div>
                <Trend data={p.trend} />
              </div>
            </div>

            {/* Baseline & serial testing — the SCAT6/SCOAT6 tool */}
            <BaselinePanel base={BASELINES[p.id] ?? { tool: 'SCAT6', status: 'none', domains: [] }} />

            {/* Clinical notes */}
            <div className="glass-premium rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <NotebookPen className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                <h3 className="text-sm font-bold text-foreground">Clinical notes</h3>
              </div>
              <textarea
                value={p.notes ?? ''}
                onChange={(e) => updatePatient(p.id, { notes: e.target.value })}
                placeholder="Session observations, symptom triggers, RTP decisions, referrals…"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl glass-premium text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              />
            </div>
          </section>
        </div>
      </div>

      {addOpen && <AddPatientModal onClose={() => setAddOpen(false)} onAdd={addPatient} />}
    </div>
  )
}

function AddPatientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (f: { name: string; age: string; sport: string; injuryDate: string }) => void }) {
  const [form, setForm] = useState({ name: '', age: '', sport: '', injuryDate: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass-premium rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold text-foreground mb-1">Add patient</h3>
        <p className="text-xs text-muted-foreground mb-5">
          Each patient gets a unique code under your clinic. Share it with them for the SST app so their sessions flow back to this card.
        </p>
        <div className="space-y-3">
          {([['name', 'Full name', 'text'], ['age', 'Age', 'number'], ['sport', 'Sport', 'text'], ['injuryDate', 'Date of injury', 'text']] as const).map(([k, label, type]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-foreground">{label}</label>
              <input type={type} value={form[k]} onChange={set(k)}
                placeholder={k === 'injuryDate' ? 'e.g. 24 Jun 2026' : ''}
                className="mt-1 w-full px-3 py-2 rounded-xl glass-premium text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg text-muted-foreground hover:bg-black/[0.03] transition">Cancel</button>
          <button onClick={() => onAdd(form)} disabled={!form.name.trim()}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add to roster
          </button>
        </div>
      </div>
    </div>
  )
}
