'use client'

/**
 * EP-course infographics, keyed by (moduleId, section.id). Replaces the flagship
 * SectionInteractiveElements (which is keyed to flagship section ids and renders
 * nothing for EP). Design-only, representative for the demo. Each diagram is
 * accessible: role="img" + an aria-label describing it for screen readers.
 */
import type { Section } from '@/data/modules'

export function EpInteractiveElements({ moduleId, section }: { moduleId: number; section: Section }) {
  if (moduleId === 1 && section.id === 'neurometabolic-cascade') return <NeurometabolicTimeline />
  if (moduleId === 3 && section.id === 'baseline-and-protocol') return <BcttProtocolFlow />
  if (moduleId === 3 && section.id === 'threshold-to-prescription') return <ThresholdToRx />
  return null
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`my-6 rounded-xl border border-slate-200 bg-white p-5 ${className}`}>{children}</div>
}

function NeurometabolicTimeline() {
  const stages = [
    { t: 'Impact', d: 'Ionic flux, glutamate release', c: 'from-rose-500 to-red-600' },
    { t: 'Energy crisis', d: 'Hyperglycolysis → ATP demand ↑, blood flow ↓', c: 'from-amber-500 to-orange-600' },
    { t: 'Metabolic depression', d: 'Mismatch = exercise intolerance', c: 'from-teal-500 to-emerald-600' },
    { t: 'Recovery', d: 'Autoregulation restored — graded exercise aids it', c: 'from-blue-500 to-indigo-600' },
  ]
  return (
    <Card>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">Infographic · The energy crisis</p>
      <div role="img" aria-label="Neurometabolic cascade timeline: impact triggers ionic flux and glutamate release; an energy crisis follows as glucose demand rises while cerebral blood flow falls; this mismatch produces exercise intolerance; recovery restores autoregulation, and graded sub-symptom exercise supports it." className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        {stages.map((s, i) => (
          <div key={s.t} className="flex flex-1 items-center gap-2 sm:flex-col sm:items-stretch">
            <div className={`flex-1 rounded-lg bg-gradient-to-br ${s.c} p-3 text-white`}>
              <p className="text-sm font-bold">{s.t}</p>
              <p className="mt-0.5 text-[11px] leading-snug opacity-90">{s.d}</p>
            </div>
            {i < stages.length - 1 && <span aria-hidden className="text-slate-300 sm:hidden">↓</span>}
          </div>
        ))}
      </div>
    </Card>
  )
}

function BcttProtocolFlow() {
  const steps = ['Screen & baseline vitals', 'Walk start ~5.3 km/h', '+1% incline / min', 'Monitor HR · RPE · symptoms', 'Symptoms ↑ ≥3/10 → STOP', 'Record HR at threshold (HRt)']
  return (
    <Card>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">Infographic · Buffalo protocol</p>
      <ol role="img" aria-label="Buffalo Concussion Treadmill Test flow: screen and take baseline vitals; start walking at about 5.3 km/h; increase incline 1 percent each minute; continuously monitor heart rate, RPE and symptoms; stop when symptoms rise by 3 or more out of 10; record the heart rate at symptom threshold." className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 4 ? 'bg-red-100 text-red-700' : i === 5 ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{i + 1}</span>
            <span className="text-sm text-slate-700">{s}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function ThresholdToRx() {
  return (
    <Card className="bg-gradient-to-br from-teal-50 to-blue-50">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">Infographic · Test = treatment</p>
      <div role="img" aria-label="From threshold to prescription: the heart rate at symptom threshold, for example 148 beats per minute, is multiplied by 80 to 90 percent to set the training heart rate, about 125 to 133 beats per minute, prescribed for roughly 20 minutes on most days." className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs text-slate-500">HR at symptom threshold</p>
          <p className="text-2xl font-bold text-slate-900">HRt = 148<span className="text-sm font-normal"> bpm</span></p>
        </div>
        <span aria-hidden className="text-center text-2xl text-teal-500">→ ×80–90% →</span>
        <div className="flex-1 rounded-lg border border-teal-300 bg-teal-600 p-4 text-center text-white">
          <p className="text-xs opacity-90">Training prescription</p>
          <p className="text-2xl font-bold">~125–133<span className="text-sm font-normal"> bpm</span></p>
          <p className="mt-0.5 text-[11px] opacity-90">~20 min · most days</p>
        </div>
      </div>
    </Card>
  )
}
