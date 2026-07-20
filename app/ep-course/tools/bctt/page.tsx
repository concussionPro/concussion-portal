import { Metadata } from 'next'
import Link from 'next/link'
import { Activity } from 'lucide-react'
import { AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { requireCrmCourseAccess } from '@/components/ep-course/CrmCourseGate'
import { EpCourseNavigation } from '@/components/ep-course/EpCourseNavigation'
import BctcCalculatorClient from './BctcCalculatorClient'

export const metadata: Metadata = {
  title: 'BCTT Calculator & HRt → Prescription Engine — Concussion Rehab for EPs',
  robots: 'noindex, nofollow',
}

export default async function BcttToolPage() {
  const access = await requireCrmCourseAccess()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EpCourseNavigation />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <AdminPreviewBadge access={access} />
          <Link href="/ep-course/toolkit" className="text-sm font-semibold text-[#5b9aa6] hover:underline">
            ← Clinical Toolkit
          </Link>

          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5b9aa6] text-white">
              <Activity className="h-6 w-6" />
            </span>
            <div>
              <span className="rounded-full bg-[#5b9aa6] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Live tool
              </span>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                BCTT Calculator &amp; HRt → Prescription Engine
              </h1>
            </div>
          </div>

          <p className="mt-3 text-slate-600">
            The digital companion to the Buffalo Concussion Treadmill Test. Enter the graded test data and the tool
            identifies the heart-rate threshold (HRt) — the heart rate at the first stage symptoms are provoked — then
            converts it into the sub-symptom-threshold aerobic prescription (the 80–90% HRt training band) you deliver as
            an Accredited Exercise Physiologist.
          </p>

          <BctcCalculatorClient />
        </div>
      </main>
    </div>
  )
}
