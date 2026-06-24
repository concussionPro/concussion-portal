'use client'

import { useState } from 'react'
import {
  HeartPulse, Activity, Plus, Search, Calendar, TrendingDown, ClipboardList,
  AlertTriangle, Check, ChevronRight, Stethoscope, ArrowUpRight, Clock,
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

export default function ClinicalHubPage() {
  const [selectedId, setSelectedId] = useState('p1')
  const [query, setQuery] = useState('')
  const patients = PATIENTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
  const p = PATIENTS.find((x) => x.id === selectedId)!

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Preview banner */}
      <div className="bg-[var(--accent)] text-white text-center text-xs py-1.5 px-4 font-medium">
        Clinical Hub — pre-launch preview · demo data · not visible to enrolled users
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#0b6165] flex items-center justify-center">
              <Stethoscope className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">Clinical Hub</h1>
              <p className="text-xs text-muted-foreground mt-1">Carter Sports &amp; Spinal · 4 active patients</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition">
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

              {/* Baseline + trajectory */}
              <div className="space-y-5">
                <div className="glass-premium rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                    <h3 className="text-sm font-bold text-foreground">SCAT6 baseline</h3>
                  </div>
                  {p.baseline === 'captured' && (
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[var(--accent)]" />
                      <p className="text-xs text-muted-foreground">Baseline on file — captured {p.baselineDate}. Serial comparison available.</p>
                    </div>
                  )}
                  {p.baseline === 'due' && <p className="text-xs text-amber-700">Serial re-test due — compare against pre-season baseline.</p>}
                  {p.baseline === 'none' && <p className="text-xs text-muted-foreground">No pre-season baseline. Symptom-based tracking only.</p>}
                </div>

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
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
