import { Metadata } from 'next'
import Link from 'next/link'
import { FileSignature, ClipboardList, GraduationCap, Briefcase, ArrowRight } from 'lucide-react'
import { AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { requireCrmCourseAccess } from '@/components/ep-course/CrmCourseGate'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'

export const metadata: Metadata = {
  title: 'Admin Documents — Concussion Rehab for EPs',
  robots: 'noindex, nofollow',
}

// Each links to a real, gated, printable document at /ep-course/documents/[slug].
const DOCS = [
  { icon: ClipboardList, slug: 'ndis-progress-report', title: 'NDIS Allied Health Progress Report', kind: 'Template', desc: 'Plan-review-ready report mapping concussion exercise rehabilitation to NDIS functional goals (improved daily living / capacity building) — objective exercise-tolerance measures, functional outcomes and goal progression, structured the way plan reviewers expect. The single biggest funded pathway for an AEP, made fast.' },
  { icon: Briefcase, slug: 'workcover-ctp-report', title: 'WorkCover / CTP Progress Report', kind: 'Template', desc: 'Return-to-work-focused progress report for the insurer and case manager: documented exercise tolerance, graded reconditioning delivered, objective response, current capacity and the next-review recommendation — in the format claims managers action without back-and-forth.' },
  { icon: FileSignature, slug: 'gp-referrer-letter', title: 'GP / Referrer Letter', kind: 'Template', desc: 'Report your BCTT findings, the heart-rate-threshold-derived prescription rationale and graded-rehab progress back to the referring GP or sports physician. Written as recommendation, never clearance — with the scope-safe language and a fully worked example so the loop closes cleanly within AEP scope.' },
  { icon: GraduationCap, slug: 'return-to-activity-note', title: 'Return-to-Activity Progress Note', kind: 'Template', desc: 'The EP-scope analogue of a clearance document: the graded reconditioning stages tolerated symptom-free under your supervision, the objective evidence and ≥24-hour symptom-free intervals behind each step — and the explicit "recommend, don\'t clear" language that returns the contact-clearance decision to the treating doctor.' },
]

const KIND_COLOR: Record<string, string> = {
  Template: 'bg-blue-50 text-blue-700 border-blue-200',
  Form: 'bg-teal-50 text-teal-700 border-teal-200',
  Reference: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default async function EpAdminDocsPage() {
  const access = await requireCrmCourseAccess()

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
            The clinic-ready administrative pack — funder reports, referrer letters and the return-to-activity note — so an
            Accredited Exercise Physiologist can run concussion rehab end-to-end. Every document opens as a real,
            printable template: view, fill in, and save as PDF for your clinic.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {DOCS.map((t) => {
              const Icon = t.icon
              return (
                <Link
                  key={t.slug}
                  href={`/ep-course/documents/${t.slug}`}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:border-teal-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${KIND_COLOR[t.kind]}`}>
                      {t.kind}
                    </span>
                  </div>
                  <h2 className="font-semibold text-slate-900 group-hover:text-teal-700">{t.title}</h2>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{t.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                    Open &amp; print <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
