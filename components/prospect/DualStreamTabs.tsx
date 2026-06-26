'use client'

import { useState } from 'react'
import {
  HeartPulse, Activity, GraduationCap, FileText, ClipboardList, Stethoscope, Check, Lock,
} from 'lucide-react'

/**
 * The discipline-tabbed course-stream view, embedded INTO the prospect dash
 * (ProspectLanding) — not a standalone page. Clean tabs between the Allied
 * (Clinical Mastery) and EP (Rehab Mastery) course streams with their modules,
 * plus the shared clinical tools and admin docs every clinician gets. Client
 * island purely because the dash is server-rendered and the tabs need state.
 * Currently shown only for Purpose (gated in ProspectLanding); generalises once
 * the EP/CRM stream clears ESSA.
 */

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

function ModuleGrid({ list, cpd }: { list: string[]; cpd: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-accent mb-3">{cpd}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {list.map((m, i) => (
          <div key={m} className="flex items-center gap-2.5 rounded-xl bg-black/[0.015] px-3 py-2.5">
            <span className="w-5 h-5 rounded-md bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <span className="text-[13px] text-foreground/85 leading-snug">{m}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DualStreamTabs() {
  const [tab, setTab] = useState<TabId>('physio')
  return (
    <div className="mt-8" data-track-section="streams">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">Your clinic portal · two streams</p>
      <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">A stream for each discipline</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Each clinician logs in and trains on their own online stream — physios and EPs see different modules
        matched to their scope, and share the clinical tools, admin docs and the hands-on day.
      </p>
      <div className="rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="flex flex-wrap gap-1 bg-muted/40 border-b border-border p-1.5">
          {TABS.map((t) => {
            const active = t.id === tab
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition ${active ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>
                <t.icon className={`w-4 h-4 ${active ? 'text-accent' : 'text-muted-foreground'}`} strokeWidth={1.8} />
                <span>
                  <span className={`block text-[12px] font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{t.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{t.sub}</span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="bg-white p-5 sm:p-6">
          {tab === 'physio' && <ModuleGrid list={PHYSIO_MODULES} cpd="8 CPD hours online · Osteopathy Australia endorsed" />}
          {tab === 'ep' && (
            <>
              <ModuleGrid list={EP_MODULES} cpd="8 CPD hours online · ESSA-aligned (approval pending)" />
              <p className="text-[12px] text-muted-foreground mt-3 inline-flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-accent" /> Concussion rehab is EP work — content built for their scope.
              </p>
            </>
          )}
          {tab === 'tools' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TOOLS.map((t) => (
                <div key={t.name} className="flex items-start gap-3 rounded-xl bg-black/[0.015] p-3.5">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0"><t.icon className="w-[18px] h-[18px] text-accent" strokeWidth={1.8} /></div>
                  <div><p className="text-sm font-semibold text-foreground">{t.name}</p><p className="text-xs text-muted-foreground leading-snug">{t.note}</p></div>
                </div>
              ))}
              <p className="sm:col-span-2 text-[11px] text-muted-foreground">Shared across every clinician at your practice — physios and EPs alike.</p>
            </div>
          )}
          {tab === 'admin' && (
            <div>
              <ul className="space-y-2">
                {DOCS.map((d) => (
                  <li key={d} className="flex items-center gap-2.5 text-sm text-foreground/85"><Check className="w-4 h-4 text-accent flex-shrink-0" strokeWidth={2.2} />{d}</li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3">Clinic-branded where it matters — ready for your front desk and reports.</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 inline-flex items-center gap-1.5">
        <Lock className="w-3 h-3" /> Preview of the live portal · the EP stream launches once ESSA approval lands. Everyone trains together on the practical day (14 CPD hours total).
      </p>
    </div>
  )
}
