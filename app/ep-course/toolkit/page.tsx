import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Activity, ClipboardList, Dumbbell, TrendingUp, Mail, CheckSquare, Download } from 'lucide-react'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'

export const metadata: Metadata = {
  title: 'Clinical Toolkit — Concussion Rehab for EPs',
  robots: 'noindex, nofollow',
}

const TOOLS = [
  { icon: Activity, title: 'Buffalo Treadmill Test — Record & Protocol Sheet', kind: 'Assessment', desc: 'Standardised BCTT administration sheet: pre-test screening, per-minute HR/RPE/symptom log, and the heart rate at symptom threshold (HRt).' },
  { icon: ClipboardList, title: 'Sub-Symptom-Threshold Aerobic Prescription', kind: 'Template', desc: 'Convert HRt into an individualised aerobic program — FITT, the 80–90% HRt band, and the progression schedule.' },
  { icon: TrendingUp, title: 'Session & Progression Tracking Sheet', kind: 'Template', desc: 'Per-session log: date, exercise, HR response, symptom score, RPE and adherence — for re-testing and progression decisions.' },
  { icon: Dumbbell, title: 'Phenotype Exercise Library', kind: 'Reference', desc: 'Vestibular (VOR x1, habituation), cervical (DNF, proprioception) and oculomotor (convergence, saccades) exercises with dosing and progression.' },
  { icon: CheckSquare, title: 'Graded Return-to-Sport Progression Ladder', kind: 'Reference', desc: 'The staged RTS framework with sport-specific reconditioning and the AIS/SMA stand-down checkpoints.' },
  { icon: Mail, title: 'EP → Referrer Communication Letter', kind: 'Template', desc: 'Report findings and progress to the referring GP/physician — recommend, don\'t clear. Worked example included.' },
  { icon: FileText, title: 'Return-to-Activity Progress Note (EP scope)', kind: 'Template', desc: 'Scope-appropriate progress note documenting exercise tolerance and graded reconditioning up to medical clearance.' },
]

const KIND_COLOR: Record<string, string> = {
  Assessment: 'bg-teal-50 text-teal-700 border-teal-200',
  Template: 'bg-blue-50 text-blue-700 border-blue-200',
  Reference: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default async function EpToolkitPage() {
  const access = await requireAiCourseAccess('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EpCourseNavigation />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <AdminPreviewBadge access={access} />
          <Link href="/ep-course/modules/1" className="text-sm font-semibold text-teal-700 hover:underline">
            ← Course
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Clinical Toolkit</h1>
          <p className="mt-2 text-slate-600">
            Fillable, scope-appropriate resources an Accredited Exercise Physiologist uses to deliver and document
            concussion exercise rehabilitation. Unlocks with enrolment.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {TOOLS.map((t) => {
              const Icon = t.icon
              return (
                <div key={t.title} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${KIND_COLOR[t.kind]}`}>
                      {t.kind}
                    </span>
                  </div>
                  <h2 className="font-semibold text-slate-900">{t.title}</h2>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{t.desc}</p>
                  <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400">
                    <Download className="h-3.5 w-3.5" /> Unlocks on enrolment
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
