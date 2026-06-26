'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HeartPulse, Activity, Users, Trophy, ShieldCheck, GraduationCap,
  ArrowRight, Check, MapPin, Plane, FileText, ClipboardList, Stethoscope, Lock,
} from 'lucide-react'

/**
 * Bespoke pitch for Purpose Healthcare (Illawarra) — ~18 clinicians across 4
 * clinics, BOTH physios and EPs. Doubles as a DEMO of the post-ESSA clinic
 * portal: an interactive tabbed preview of the discipline-routed course streams
 * (physios → Clinical Mastery, EPs → Rehab Mastery) over shared clinical tools +
 * admin docs. Two prices: A$900pp on-site (Zac travels, min 8) or A$950pp at a
 * Sydney course. Rendered directly by app/p/[token]/page.tsx; synthetic.
 */

const CAL = 'https://cal.com/zac-lewis-so8zjs/30min?utm_source=portal&utm_medium=purpose_pitch&utm_campaign=purpose-healthcare'
const PER_ONSITE = 900
const PER_SYDNEY = 950
const TEAM = 18

type TabId = 'physio' | 'ep' | 'tools' | 'admin'
const TABS: { id: TabId; label: string; sub: string; icon: typeof HeartPulse }[] = [
  { id: 'physio', label: 'Physiotherapists', sub: 'Clinical Mastery', icon: GraduationCap },
  { id: 'ep', label: 'Exercise Physiologists', sub: 'Rehab Mastery', icon: HeartPulse },
  { id: 'tools', label: 'Clinical Tools', sub: 'Shared', icon: Activity },
  { id: 'admin', label: 'Admin & Docs', sub: 'Shared', icon: FileText },
]

const PHYSIO_MODULES = [
  'The neuroscience of concussion', 'Diagnosis & initial assessment', 'SCAT6 & SCOAT6 in practice',
  'VOMS & oculomotor screening', 'Vestibular & cervical contributions', 'Sub-symptom exercise & return-to-play',
  'Persistent symptoms & complex cases', 'Documentation & medicolegal',
]
const EP_MODULES = [
  'Concussion physiology for exercise rehab', 'Interpreting screening results (EP scope)',
  'Sub-symptom-threshold exercise testing', 'Heart-rate-paced aerobic rehabilitation',
  'Graded return-to-sport progression', 'Monitoring, red flags & referral',
  'Special populations', 'Putting it into practice',
]
const TOOLS = [
  { icon: ClipboardList, name: 'SCAT6 & SCOAT6 forms', note: 'Fillable, printable assessment tools' },
  { icon: Activity, name: 'Pre-season baseline testing', note: 'Capture baselines, compare serial tests' },
  { icon: HeartPulse, name: 'SST Trainer', note: 'Sub-symptom-threshold exercise rehab app' },
  { icon: Stethoscope, name: 'Clinical Hub', note: 'Manage your patients across the team' },
]
const DOCS = [
  'GP referral & handback letters', 'NDIS / WorkCover report templates', 'School & sport return-to-play letters',
  'Return-to-play tracking sheets', 'Billing & item-number guide',
]

function Modules({ list, cpd }: { list: string[]; cpd: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] mb-3">{cpd}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map((m, i) => (
          <div key={m} className="flex items-center gap-2.5 rounded-xl bg-black/[0.015] px-3 py-2.5">
            <span className="w-5 h-5 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <span className="text-[13px] text-foreground/85 leading-snug">{m}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PurposeLanding() {
  const [tab, setTab] = useState<TabId>('ep')

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--accent)] via-[#0b6165] to-slate-900 text-white pt-16 pb-16">
        <div className="absolute right-[-120px] top-[-120px] w-[460px] h-[460px] rounded-full border border-white/10" />
        <div className="relative max-w-4xl mx-auto px-6">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-emerald-200 mb-3">For the Purpose Healthcare team · Illawarra</p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-5">
            Concussion training built for your physios <span className="text-emerald-200">and</span> your EPs.
          </h1>
          <p className="text-lg text-emerald-50/90 leading-relaxed max-w-2xl mb-8">
            Your clinic gets a concussion portal: each discipline trains on its own online stream, your whole
            team shares the clinical tools and admin docs, and everyone trains together on the hands-on day.
          </p>
          <a href={CAL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl bg-white text-[var(--accent)] hover:opacity-90 transition">
            Book a 15-minute call <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Why Purpose */}
      <section className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, stat: '~18', label: 'clinicians · 4 clinics' },
            { icon: Trophy, stat: 'Elite', label: 'athletes on your books' },
            { icon: Activity, stat: 'Physio + EP', label: 'two disciplines, one pathway' },
            { icon: ShieldCheck, stat: 'WorkCover · NDIS', label: 'defensible RTP matters' },
          ].map((s) => (
            <div key={s.label} className="glass-premium rounded-2xl p-4">
              <s.icon className="w-5 h-5 text-[var(--accent)] mb-2" strokeWidth={1.8} />
              <p className="text-lg font-bold text-foreground leading-none">{s.stat}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal preview — the interactive demo */}
      <section className="max-w-4xl mx-auto px-6 pb-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Your clinic portal — a look inside</h2>
        <p className="text-muted-foreground mb-5 max-w-2xl">
          Each clinician logs in and sees their own stream. Tap through what your physios and EPs each get,
          plus the tools and docs the whole clinic shares.
        </p>
        <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* tab bar */}
          <div className="flex flex-wrap gap-1 bg-muted/40 border-b border-border p-1.5">
            {TABS.map((t) => {
              const active = t.id === tab
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${active ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>
                  <t.icon className={`w-4 h-4 ${active ? 'text-[var(--accent)]' : 'text-muted-foreground'}`} strokeWidth={1.8} />
                  <span>
                    <span className={`block text-[12px] font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{t.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{t.sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {/* tab body */}
          <div className="bg-white p-5 sm:p-6">
            {tab === 'physio' && <Modules list={PHYSIO_MODULES} cpd="8 CPD hours · Osteopathy Australia endorsed" />}
            {tab === 'ep' && (
              <>
                <Modules list={EP_MODULES} cpd="8 CPD hours · ESSA-aligned (approval pending)" />
                <p className="text-[12px] text-muted-foreground mt-3 inline-flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-[var(--accent)]" /> Concussion rehab is EP work — your EPs get content built for their scope.
                </p>
              </>
            )}
            {tab === 'tools' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOOLS.map((t) => (
                  <div key={t.name} className="flex items-start gap-3 rounded-xl bg-black/[0.015] p-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0"><t.icon className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /></div>
                    <div><p className="text-sm font-semibold text-foreground">{t.name}</p><p className="text-xs text-muted-foreground leading-snug">{t.note}</p></div>
                  </div>
                ))}
                <p className="sm:col-span-2 text-[11px] text-muted-foreground">Shared across every clinician at Purpose — physios and EPs alike.</p>
              </div>
            )}
            {tab === 'admin' && (
              <div>
                <ul className="space-y-2">
                  {DOCS.map((d) => (
                    <li key={d} className="flex items-center gap-2.5 text-sm text-foreground/85"><Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0" strokeWidth={2.2} />{d}</li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground mt-3">Clinic-branded where it matters — ready for your front desk and reports.</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 inline-flex items-center gap-1.5">
          <Lock className="w-3 h-3" /> Preview of the live portal · launches with the EP stream once ESSA approval lands.
        </p>
      </section>

      {/* Same in-person day */}
      <section className="max-w-4xl mx-auto px-6 pb-8">
        <div className="rounded-2xl bg-muted/40 border border-border p-5 flex items-start gap-3">
          <Activity className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={1.8} />
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Then the hands-on day, together.</strong> Physios and EPs train side by side on the full-day
            practical — the multidisciplinary handoff (assess → rehab → clear) is the point.
            <strong> 14 CPD hours total</strong> with the in-person day · Osteopathy Australia endorsed.
          </p>
        </div>
      </section>

      {/* Pricing — two options */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Two ways to do it</h2>
        <p className="text-muted-foreground mb-6">Group rate either way — you pick what suits the team.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl glass-premium border border-[var(--accent)]/30 ring-1 ring-[var(--accent)]/20 p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--accent)]">Recommended</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">We come to you</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 inline-flex items-center gap-2"><Plane className="w-4 h-4 text-[var(--accent)]" /> On-site</h3>
            <p className="text-3xl font-bold text-[var(--accent)] leading-none mt-2">A${PER_ONSITE}<span className="text-base font-medium text-muted-foreground"> / clinician</span></p>
            <p className="text-[12px] text-muted-foreground mt-1">≈ A${(PER_ONSITE * TEAM).toLocaleString()} for ~{TEAM} clinicians · minimum 8</p>
            <ul className="space-y-2 mt-4">
              {['Whole team trained at your clinic — no travel for anyone', 'Trained on your own cases, in your own rooms', 'Lower per-head rate, and no day lost getting to Sydney', 'Both streams + the practical day, on a date that suits you'].map((l) => (
                <li key={l} className="flex items-start gap-2 text-sm text-foreground/85"><Check className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" strokeWidth={2.2} />{l}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl glass-premium p-6">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Public course</p>
            <h3 className="text-lg font-bold text-foreground mb-1 inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-[var(--accent)]" /> Group rate — Sydney course</h3>
            <p className="text-3xl font-bold text-foreground leading-none mt-2">A${PER_SYDNEY}<span className="text-base font-medium text-muted-foreground"> / clinician</span></p>
            <p className="text-[12px] text-muted-foreground mt-1">Your team attends a scheduled Sydney course together</p>
            <ul className="space-y-2 mt-4">
              {['Both online streams + the in-person day', 'Train alongside other clinics', 'Good if a date already suits your roster', '14 CPD hours · OA-endorsed'].map((l) => (
                <li key={l} className="flex items-start gap-2 text-sm text-foreground/85"><Check className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={2.2} />{l}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--accent)]/5 to-white border border-[var(--accent)]/25 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Train the Purpose team together</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Fifteen minutes to walk through how it&apos;d run for your physios and EPs, and lock a format and date.</p>
          <a href={CAL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition">
            Book a 15-minute call <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-muted-foreground mt-4">Concussion Education Australia · Osteopathy Australia endorsed</p>
        </div>
      </section>
    </div>
  )
}
