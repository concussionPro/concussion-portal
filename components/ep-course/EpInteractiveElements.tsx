'use client'

/**
 * EP-course supplementary infographic, keyed by (moduleId, section.id).
 *
 * NOTE: the primary infographics now render INLINE at their exact content
 * position via the `[INFOGRAPHIC: <id>]` marker → ep-infographics registry
 * (DynamicContentRenderer). This component therefore only renders the ONE
 * diagram that has no inline marker: Module 3 "threshold-to-prescription".
 * The Module 1 neurometabolic-cascade and Module 3 baseline-and-protocol
 * handlers were removed — they duplicated the inline registry components
 * (two copies of the same diagram in one section). Accessible: role="img" +
 * an aria-label describing the diagram for screen readers.
 */
import type { Section } from '@/data/modules'

export function EpInteractiveElements({ moduleId, section }: { moduleId: number; section: Section }) {
  if (moduleId === 3 && section.id === 'threshold-to-prescription') return <ThresholdToRx />
  return null
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`my-6 rounded-xl border border-slate-200 bg-white p-5 ${className}`}>{children}</div>
}

function ThresholdToRx() {
  return (
    <Card className="bg-gradient-to-br from-teal-50 to-blue-50">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">Infographic · Test = treatment</p>
      <div role="img" aria-label="From threshold to prescription: the heart rate at symptom threshold, for example 148 beats per minute, is multiplied by 80 to 90 percent to set the training heart rate, about 118 to 133 beats per minute, prescribed for roughly 20 minutes on most days." className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 text-center">
          <p className="text-xs text-slate-500">HR at symptom threshold</p>
          <p className="text-2xl font-bold text-slate-900">HRt = 148<span className="text-sm font-normal"> bpm</span></p>
        </div>
        <span aria-hidden className="text-center text-2xl text-teal-500">→ ×80–90% →</span>
        <div className="flex-1 rounded-lg border border-teal-300 bg-teal-600 p-4 text-center text-white">
          <p className="text-xs opacity-90">Training prescription</p>
          <p className="text-2xl font-bold">~118–133<span className="text-sm font-normal"> bpm</span></p>
          <p className="mt-0.5 text-[11px] opacity-90">~20 min · most days</p>
        </div>
      </div>
    </Card>
  )
}
