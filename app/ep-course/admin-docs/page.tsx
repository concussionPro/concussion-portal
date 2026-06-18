import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, FileSignature, ClipboardList, Receipt, GraduationCap, Briefcase, ShieldCheck, Download } from 'lucide-react'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'

export const metadata: Metadata = {
  title: 'Admin Documents — Concussion Rehab for EPs',
  robots: 'noindex, nofollow',
}

const DOCS = [
  { icon: FileSignature, title: 'GP / Referrer Report Letter', kind: 'Template', desc: 'Report assessment findings and exercise-rehab progress back to the referring GP or physician — recommend, don\'t clear. Worked example included.' },
  { icon: ClipboardList, title: 'NDIS Functional Capacity & Progress Report', kind: 'Template', desc: 'Plan-review-ready report mapping concussion exercise rehab to functional goals — for participants funded under capacity building.' },
  { icon: Briefcase, title: 'WorkCover / CTP Progress Report', kind: 'Template', desc: 'Return-to-work focused progress report for insurer and case manager, documenting exercise tolerance and graded reconditioning.' },
  { icon: GraduationCap, title: 'Return-to-Work / Return-to-School Plan', kind: 'Template', desc: 'Staged participation plan with activity pacing and cognitive-load considerations, coordinated with the clearance provider.' },
  { icon: ShieldCheck, title: 'Patient Intake & Consent Form', kind: 'Form', desc: 'Concussion-specific intake, red-flag screen and informed consent for exercise-based rehabilitation.' },
  { icon: FileText, title: 'Symptom & Outcome Tracking (PCSS)', kind: 'Form', desc: 'Post-Concussion Symptom Scale and session-by-session outcome tracking for progression and reporting.' },
  { icon: Receipt, title: 'Funding & Billing Quick Reference', kind: 'Reference', desc: 'Pathways an EP can bill concussion rehab against — NDIS, WorkCover/CTP, DVA, Medicare CDM and private health — with practical notes.' },
]

const KIND_COLOR: Record<string, string> = {
  Template: 'bg-blue-50 text-blue-700 border-blue-200',
  Form: 'bg-teal-50 text-teal-700 border-teal-200',
  Reference: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default async function EpAdminDocsPage() {
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

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">Admin Documents</h1>
          <p className="mt-2 text-slate-600">
            The clinic-ready administrative pack — referral letters, funder reports, intake and billing references — so an
            Accredited Exercise Physiologist can run concussion rehab end-to-end. Fillable for your clinic; unlocks with enrolment.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {DOCS.map((t) => {
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
