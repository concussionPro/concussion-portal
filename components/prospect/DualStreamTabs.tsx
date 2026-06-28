'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, HeartPulse, Activity, ClipboardList, Stethoscope, Check, Lock, Clock } from 'lucide-react'

/** Metadata-only module shape (mirrors data/module-meta ModuleMeta). */
export type StreamModule = { id: number; title: string; subtitle: string; duration: string; points: number; description: string }
/** When provided, the active tab drives a rich, clickable module list below. */
export type DetailedStreams = { slug: string; accessKey: string; ccm: StreamModule[]; crm: StreamModule[] }

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
  code: string; name: string; who: string; cpd: string; accredBody: string; accredNote: string; icon: typeof GraduationCap; modules: string[]
}> = {
  ccm: {
    code: 'CCM',
    name: 'Concussion Clinical Mastery',
    who: 'Assessment, diagnosis & return-to-play — for physios & allied health',
    cpd: '8 CPD hours online',
    accredBody: 'AHPRA-aligned · OA-endorsed',
    accredNote: 'Counts toward your AHPRA CPD',
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
    cpd: '8 CPD hours online',
    accredBody: 'ESSA-aligned · OA-endorsed',
    accredNote: 'Counts toward your ESSA CPD',
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

export function DualStreamTabs({ detailed, learningHref }: { detailed?: DetailedStreams; learningHref?: string }) {
  const [stream, setStream] = useState<StreamId>('ccm')
  const active = STREAMS[stream]
  const activeModules = detailed ? detailed[stream] : null

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
              <span className={`inline-flex items-center mt-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${on ? 'bg-white/15 text-white' : 'bg-accent/10 text-accent'}`}>{s.accredBody}</span>
            </button>
          )
        })}
      </div>

      {/* Selected stream's modules. When `detailed` is supplied (learning suite),
          the SAME tab drives a rich, clickable module list — CCM module 1 is the
          live trial, the rest are locked; CRM modules are preview-only until ESSA
          approval lands. Without `detailed` (home dash) we show the compact list. */}
      <div className="glass-premium rounded-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <active.icon className="w-5 h-5 text-accent" strokeWidth={1.8} />
            <h4 className="text-lg font-bold text-foreground">{active.code} · {active.name}</h4>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{active.cpd} · {active.accredBody}</span>
        </div>

        {activeModules ? (
          <div className="space-y-2.5">
            {activeModules.map((m, i) => {
              // Both streams open the EXISTING public locked-trial preview (no
              // login, already built): CCM → /preview, CRM → /preview?course=crm
              // (same preview architecture, EP course data). Module 1 unlocked,
              // the rest locked — handled entirely by /preview.
              const isLiveTrial = m.id === 1
              const trialHref = detailed
                ? stream === 'crm'
                  ? `/preview?course=crm`
                  : `/preview`
                : null
              const inner = (
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isLiveTrial ? 'bg-gradient-to-br from-accent/20 to-accent/5' : 'bg-black/[0.03]'}`}>
                    {isLiveTrial
                      ? <span className="text-sm font-bold text-accent">M1</span>
                      : <span className="text-[13px] font-bold text-muted-foreground/70">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{m.title}</p>
                      {isLiveTrial ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Trial open</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wider"><Lock className="w-2.5 h-2.5" /> Locked</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{m.subtitle}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{m.description}</p>
                    {isLiveTrial && (
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m.duration}</span>
                        <span>·</span><span>{m.points} CPD hr</span>
                      </div>
                    )}
                  </div>
                </div>
              )
              return isLiveTrial && trialHref ? (
                <Link
                  key={m.id}
                  href={trialHref}
                  className="block rounded-2xl p-4 sm:p-5 border-l-2 border-l-accent bg-black/[0.02] hover:bg-accent/[0.04] transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div key={m.id} className="rounded-2xl p-4 sm:p-5 bg-black/[0.02] opacity-90">{inner}</div>
              )
            })}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {active.modules.map((m, i) => {
              const row = (
                <>
                  <span className="w-7 h-7 rounded-lg bg-accent/10 text-accent text-[13px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-sm text-foreground/90 font-medium leading-snug">{m}</span>
                </>
              )
              return learningHref ? (
                <Link key={m} href={learningHref} className="flex items-center gap-3 rounded-xl bg-black/[0.02] px-4 py-3 transition hover:bg-accent/[0.06] hover:translate-x-0.5 cursor-pointer">
                  {row}
                </Link>
              ) : (
                <div key={m} className="flex items-center gap-3 rounded-xl bg-black/[0.02] px-4 py-3 transition hover:bg-accent/[0.04]">
                  {row}
                </div>
              )
            })}
          </div>
          {learningHref && (
            <Link href={learningHref} className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-accent hover:gap-2.5 transition-all">
              Open the full learning suite →
            </Link>
          )}
          </>
        )}
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
        <Lock className="w-3 h-3" /> Preview of the live clinic portal · two streams, one Concussion Clinical Mastery practical day. Each stream is 8 hrs online CPD; the shared practical day adds 6 — 14 CPD hours total.
      </p>
    </section>
  )
}
