import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { ArrowRight, Award, BookOpen, Workflow, Activity, Layers, ShoppingBag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CEA · platform demo',
  robots: 'noindex, nofollow',
}

export default async function PreviewPage() {
  const access = await requireAiCourseAccess()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[100px] pb-20">
        <AdminPreviewBadge access={access} />

        {/* HERO — lead with the insight, not the feature list */}
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          Concussion Education Australia · partner preview
        </p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-[1.05] max-w-3xl">
          AU clinicians need 20–50 CPD hours a year.<br />
          <span className="text-muted-foreground">Most of what they actually earn never gets logged.</span>
        </h1>
        <p className="text-base text-foreground/85 max-w-2xl mb-10 leading-relaxed">
          <strong>We built the platform that closes the loop.</strong> OA-endorsed flagship course live. AHPRA-Board calibrated for all 17 Boards. Generic event-ingestion API any AI tool can plug into.
        </p>

        {/* WHAT PLUGGING IN UNLOCKS — Heidi-relevant value, above the courses */}
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
          What plugging in unlocks for your product
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          <Link
            href="/courses/cpd-record/passive"
            className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col"
          >
            <Activity className="w-5 h-5 text-accent mb-3" />
            <p className="text-sm font-bold text-foreground leading-tight mb-1.5">CPD logs while clinicians use your tool</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-3 flex-1">
              Scribe sessions + literature searches → categorised against the right AHPRA Board → audit-ready CPD record. Clinician confirms with one tap. Never leaves your app.
            </p>
            <span className="text-[11px] font-semibold text-accent inline-flex items-center gap-1">
              See the auto-log flow
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            href="/courses"
            className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col"
          >
            <ShoppingBag className="w-5 h-5 text-accent mb-3" />
            <p className="text-sm font-bold text-foreground leading-tight mb-1.5">In-product course catalogue</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-3 flex-1">
              Multi-course shell — OA-endorsed flagship live, short-course library shipping monthly. Designed to be embedded or white-labelled inside your app. Your users buy + complete CPD without leaving.
            </p>
            <span className="text-[11px] font-semibold text-accent inline-flex items-center gap-1">
              See the catalogue
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            href="/courses/integration"
            className="group rounded-xl border border-slate-200 bg-white p-5 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col"
          >
            <Workflow className="w-5 h-5 text-accent mb-3" />
            <p className="text-sm font-bold text-foreground leading-tight mb-1.5">Plug-in integration</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed mb-3 flex-1">
              POST /api/cpd/events — curlable today. Reads your existing event stream. No new UX, no replatforming.
            </p>
            <span className="text-[11px] font-semibold text-accent inline-flex items-center gap-1">
              See the API spec
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>

        {/* COURSES — proof the catalogue has substance */}
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
          What&rsquo;s in the catalogue today
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {/* AI course — LAUNCHING — placed first because partner-relevant */}
          <Link
            href="/courses/ai-in-clinical-practice"
            className="group rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/[0.04] to-white hover:border-accent/50 hover:shadow-md transition-all flex flex-col overflow-hidden"
          >
            <div className="px-5 pt-5 pb-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <BookOpen className="w-3 h-3" />
                  Launches 1 June 2026
                </span>
                <span className="text-[11px] font-bold text-slate-600">A$147</span>
              </div>
              <h2 className="text-lg font-bold text-foreground leading-tight mb-1.5">
                AI in Clinical Practice
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                3 CPD hours · 9 modules · Tier A/B/C framework. <strong className="text-foreground">Heidi recommended as Tier A AU scribe throughout Modules 5 &amp; 7.</strong>
              </p>
            </div>
            <div className="px-5 py-3 border-t border-accent/15 bg-accent/[0.03] flex items-center justify-between text-xs">
              <span className="text-slate-500">Click to preview the course</span>
              <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* CCM — LIVE — placed second; flagship credibility signal */}
          <Link
            href="/learning"
            className="group rounded-2xl border-2 border-emerald-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
          >
            <div className="px-5 pt-5 pb-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Award className="w-3 h-3" />
                  Live · OA-endorsed
                </span>
                <span className="text-[11px] font-bold text-slate-600">A$1,190</span>
              </div>
              <h2 className="text-lg font-bold text-foreground leading-tight mb-1.5">
                Concussion Clinical Mastery
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                14 CPD hours · 11 modules · SCAT6 + SCOAT6 · the only concussion training Osteopathy Australia endorses for osteopaths in Australia.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
              <span className="text-slate-500">Click to open the course</span>
              <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* BOOK CTA — placed after the walkthrough, not before */}
        <div className="mb-10 rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/[0.04] to-white p-6 md:p-7 text-center">
          <p className="text-sm font-semibold text-foreground mb-3">
            Want to talk it through?
          </p>
          <a
            href="mailto:zac@concussion-education-australia.com?subject=CEA%20%E2%80%94%2030%20min%20to%20discuss&body=Hi%20Zac%2C%0A%0AI%20had%20a%20look.%20Available%20%5Bday%5D%20AEST%20for%20a%2030-min%20call.%0A%0A%5Byour%20name%5D"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors"
          >
            Book a 30-min conversation →
          </a>
        </div>

        {/* MINIMAL FOOTER — credibility line */}
        <div className="pt-6 border-t border-slate-200 text-xs text-muted-foreground text-center">
          Zac Lewis · osteopath · AHPRA-registered · Osteopathy Australia Conference 2026 speaker (Gold Coast 16–17 October).
        </div>
      </div>
    </div>
  )
}
