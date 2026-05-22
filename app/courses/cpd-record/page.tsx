import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { COURSES, findProvider } from '@/lib/ai-course/provider-catalogue'
import { Download, Check, AlertCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CPD Record — Audit-ready export',
  robots: 'noindex, nofollow',
}

/**
 * CPD tracking dashboard mock. In a live marketplace this would
 * aggregate completions across all providers; in the admin preview
 * the table is intentionally illustrative — it shows the SHAPE of
 * audit-ready CPD reporting, with the data sourced from the
 * platform's certificate records.
 *
 * The pitch claim is: "one-click export, direct integration to RACGP
 * / ACRRM CPD Homes". This page demonstrates the export-ready format
 * and surfaces the integration roadmap.
 */
export default async function CpdRecordPage() {
  const access = await requireAiCourseAccess()
  const liveCourses = COURSES.filter((c) => c.status === 'live')
  const totalHours = liveCourses.reduce((s, c) => s + c.cpdHours, 0)

  // For the demo, we mock "completed" status as if the admin viewer
  // has worked through everything. Real implementation queries the
  // users table for issued certificates.
  const completions = liveCourses.map((c) => ({
    course: c,
    provider: findProvider(c.providerId),
    completedAt: '2026-05-22',
    certificateId: 'demo-' + c.id.slice(0, 8),
    status: 'demo-record' as const,
  }))

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <div className="mb-2 flex items-center gap-2">
          <Link href="/courses" className="text-xs text-accent hover:underline">← All courses</Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          CPD Record
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-2">
          Audit-ready CPD tracking — every completion logged automatically with verifiable certificates.
        </p>
        <p className="text-xs text-muted-foreground mb-8 italic">
          Demo view. In production, this dashboard aggregates completions across every marketplace provider, with one-click export to RACGP CPD Home (planned) and ACRRM CPD Home (planned).
        </p>

        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          <div className="card rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Total CPD hours</p>
            <p className="text-3xl font-bold text-foreground">{totalHours}</p>
            <p className="text-xs text-muted-foreground">across {liveCourses.length} courses</p>
          </div>
          <div className="card rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">AHPRA reporting period</p>
            <p className="text-3xl font-bold text-foreground">2026</p>
            <p className="text-xs text-muted-foreground">1 Jan – 31 Dec</p>
          </div>
          <div className="card rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Verification status</p>
            <p className="text-3xl font-bold text-emerald-700">All verified</p>
            <p className="text-xs text-muted-foreground">Each certificate has a public ID</p>
          </div>
        </div>

        {/* Export actions */}
        <div className="card rounded-xl p-5 mb-8 flex flex-wrap items-center gap-3 justify-between">
          <div>
            <p className="text-sm font-bold text-foreground mb-1">Audit-ready export</p>
            <p className="text-xs text-muted-foreground">PDF transcript, CSV, or direct submit to your College CPD Home.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-lg bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-foreground text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-l border-slate-200 pl-3">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>RACGP / ACRRM CPD Home integration on roadmap</span>
            </div>
          </div>
        </div>

        {/* Completion table */}
        <div className="card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Course</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Provider</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right">Hours</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Recognition</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Completed</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Verification</th>
              </tr>
            </thead>
            <tbody>
              {completions.map((c) => (
                <tr key={c.course.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-foreground">{c.course.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.provider?.shortName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.course.cpdHours}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.course.cpdRecognition.slice(0, 1).join(', ')}
                    {c.course.cpdRecognition.length > 1 && ' +' + (c.course.cpdRecognition.length - 1)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.completedAt}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <Check className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
          <strong>How this works in production:</strong> Every course completion (across every provider in the marketplace) issues a verifiable certificate. Hours auto-aggregate here. When AHPRA requests records, the clinician exports a single PDF transcript with every certificate ID resolvable to a public verification URL. RACGP and ACRRM CPD Home integration is the next-step roadmap item — once a single provider partnership is signed and the platform has multi-provider supply, the auto-submit feature is the moat.
        </p>
      </div>
    </div>
  )
}
