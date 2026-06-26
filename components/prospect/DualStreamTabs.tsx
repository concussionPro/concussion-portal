'use client'

import { useState } from 'react'
import { GraduationCap, HeartPulse, Activity, ClipboardList, Stethoscope, Check, Lock } from 'lucide-react'

/**
 * PITCH-ONLY preview of the post-ESSA dual-stream clinic portal, embedded in the
 * prospect dash (ProspectLanding) and gated to the Purpose slug. Two large
 * side-by-side tabs for the two course streams — CCM (Concussion Clinical
 * Mastery) and CRM (Concussion Rehab Mastery) — each showing its REAL modules,
 * over the shared clinical tools + admin docs. Module titles are pulled from the
 * built courses (data/modules.ts for CCM, data/ep-modules for CRM). Static
 * preview — does NOT touch the live course/learning engine.
 */

type StreamId = 'ccm' | 'crm'
const STREAMS: Record<StreamId, {
  code: string; name: string; who: string; cpd: string; icon: typeof GraduationCap; modules: string[]
}> = {
  ccm: {
    code: 'CCM',
    name: 'Concussion Clinical Mastery',
    who: 'Assessment, diagnosis & return-to-play — for physios & allied health',
    cpd: '8 CPD hours online · Osteopathy Australia endorsed',
    icon: GraduationCap,
    modules: [
      'What is a Concussion?',
      'Concussion Diagnosis & Initial Assessment',
      'Practical Assessment & Acute Concussion Management',
      'Persistent Post-Concussive Symptoms & Long-Term Management',
      'Multidisciplinary Approach to Concussion Management',
      'Return to Play, Work, and School Protocols',
      'Rehabilitation Pathways by Phenotype',
      'Legal, Ethical, Communication & Documentation',
    ],
  },
  crm: {
    code: 'CRM',
    name: 'Concussion Rehab Mastery',
    who: 'The exercise-rehab pathway — built for exercise physiologists',
    cpd: '8 CPD hours online · ESSA-aligned (approval pending)',
    icon: HeartPulse,
    modules: [
      'Concussion for the Exercise Physiologist',
      'Recognition, Red Flags & Scope of Practice',
      'Assessment That Is the Treatment',
      'Sub-Symptom-Threshold Aerobic Rehabilitation',
      'Phenotype-Specific Exercise Rehabilitation',
      'Graded Return to Activity, Sport & Performance',
      'Persistent Symptoms & the Complex Case',
      'Documentation, Communication & Referral',
    ],
  },
}

const TOOLS = [
  { icon: ClipboardList, name: 'SCAT6 & SCOAT6 Forms' },
  { icon: Activity, name: 'Pre-Season Baseline Testing' },
  { icon: HeartPulse, name: 'SST Trainer' },
  { icon: Stethoscope, name: 'Clinical Hub' },
]
const DOCS = [
  'GP Referral & Handback Letters', 'NDIS / WorkCover Reports', 'School & Sport Return-to-Play Letters',
  'Return-to-Play Tracking Sheets', 'Billing & Item-Number Guide',
]

export function DualStreamTabs() {
  const [stream, setStream] = useState<StreamId>('ccm')
  const active = STREAMS[stream]

  return (
    <section className="mb-10" data-track-section="streams">
      <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-accent mb-1.5">Your clinic portal · two course streams</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">CCM &amp; CRM — one portal, two streams</h3>
      <p className="text-[15px] text-muted-foreground mb-6 max-w-2xl leading-relaxed">
        Your team gets both streams under one roof. Pick a stream to see its modules — the clinical tools, admin
        docs and the hands-on day are shared across both.
      </p>

      {/* TWO LARGE TABS, SIDE BY SIDE */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
        {(['ccm', 'crm'] as const).map((id) => {
          const s = STREAMS[id]
          const on = id === stream
          return (
            <button
              key={id}
              type="button"
              onClick={() => setStream(id)}
              aria-pressed={on}
              className={`group text-left rounded-2xl p-5 sm:p-6 cursor-pointer transition-all ${
                on ? 'bg-accent text-white shadow-xl shadow-accent/25 ring-2 ring-accent' : 'glass-premium hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${on ? 'bg-white/15' : 'bg-accent/10'}`}>
                  <s.icon className={`w-6 h-6 ${on ? 'text-white' : 'text-accent'}`} strokeWidth={1.7} />
                </div>
                {on ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full"><Check className="w-3 h-3" /> Viewing</span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2.5 py-1 rounded-full border border-border">View</span>
                )}
              </div>
              <p className={`text-2xl sm:text-3xl font-bold tracking-tight leading-none ${on ? 'text-white' : 'text-foreground'}`}>{s.code}</p>
              <p className={`text-sm font-semibold mt-1.5 ${on ? 'text-emerald-50' : 'text-accent'}`}>{s.name}</p>
              <p className={`text-xs mt-2 leading-snug ${on ? 'text-white/80' : 'text-muted-foreground'}`}>{s.who}</p>
            </button>
          )
        })}
      </div>

      {/* Selected stream's REAL modules */}
      <div className="glass-premium rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <active.icon className="w-5 h-5 text-accent" strokeWidth={1.8} />
            <h4 className="text-lg font-bold text-foreground">{active.code} · {active.name}</h4>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{active.cpd}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {active.modules.map((m, i) => (
            <div key={m} className="flex items-center gap-3 rounded-xl bg-black/[0.02] px-4 py-3 transition hover:bg-accent/[0.04]">
              <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent text-[13px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-foreground/90 font-medium leading-snug">{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shared layer */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-muted/30 border border-border p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Shared clinical tools</p>
          <div className="grid grid-cols-2 gap-2.5">
            {TOOLS.map((t) => (
              <div key={t.name} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0"><t.icon className="w-[16px] h-[16px] text-accent" strokeWidth={1.8} /></div>
                <span className="text-[12.5px] font-medium text-foreground/85 leading-tight">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-muted/30 border border-border p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Shared admin & docs</p>
          <ul className="space-y-2">
            {DOCS.map((d) => (
              <li key={d} className="flex items-center gap-2 text-[13px] text-foreground/85"><Check className="w-3.5 h-3.5 text-accent flex-shrink-0" strokeWidth={2.4} />{d}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 inline-flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Preview of the live clinic portal · CRM goes live once ESSA approval lands. Both streams train together on the practical day — 14 CPD hours total.
      </p>
    </section>
  )
}
