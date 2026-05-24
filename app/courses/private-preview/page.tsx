import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { ArrowRight, Award, BookOpen, Workflow, Activity, Database } from 'lucide-react'

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
          <span className="text-muted-foreground">Almost none of the hours they actually earn get logged.</span>
        </h1>
        <p className="text-base text-foreground/85 max-w-2xl mb-3 leading-relaxed">
          AHPRA already accepts literature review, clinical reasoning, and tool-assisted documentation as CPD. AU clinicians do <strong>100–400 hours</strong> of this per year. Almost none of it makes it into their record.
        </p>
        <p className="text-base text-foreground/85 max-w-2xl mb-6 leading-relaxed">
          <strong>We built the platform that closes the loop.</strong> AHPRA-Board calibrated for all 17 Boards, OA-endorsed flagship course already live, and a generic event-ingestion API any AI tool can plug into in ~2 engineer-weeks. You&rsquo;re seeing this because your product surface and our infrastructure could compound.
        </p>
        <a
          href="mailto:zac@concussion-education-australia.com?subject=CEA%20%E2%80%94%2030%20min%20to%20discuss&body=Hi%20Zac%2C%0A%0AI%20had%20a%20look.%20Available%20%5Bday%5D%20AEST%20for%20a%2030-min%20call.%0A%0A%5Byour%20name%5D"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors mb-10"
        >
          Book a 30-min conversation →
        </a>

        {/* COURSES — above fold, visible immediately */}
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
          Available courses
        </p>
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {/* CCM — LIVE */}
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

          {/* AI course — LAUNCHING */}
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
                3 CPD hours · 9 modules · tool-agnostic Tier A/B/C framework. Heidi appears alongside Lyrebird, Halo, Dragon as worked examples of Tier A AU scribes.
              </p>
            </div>
            <div className="px-5 py-3 border-t border-accent/15 bg-accent/[0.03] flex items-center justify-between text-xs">
              <span className="text-slate-500">Click to preview the course</span>
              <ArrowRight className="w-4 h-4 text-accent group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* DEEPER SURFACES — three click-throughs, no walls of text */}
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
          The platform behind the courses
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mb-12">
          <Link
            href="/courses/integration"
            className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col"
          >
            <Workflow className="w-5 h-5 text-accent mb-2" />
            <p className="text-sm font-bold text-foreground leading-tight mb-1">Integration API</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 flex-1">
              POST /api/cpd/events. Curlable today. ~2 engineer-weeks vendor-side.
            </p>
            <span className="text-[11px] font-semibold text-accent inline-flex items-center gap-1">
              See the spec
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            href="/courses/cpd-record/passive"
            className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col"
          >
            <Activity className="w-5 h-5 text-accent mb-2" />
            <p className="text-sm font-bold text-foreground leading-tight mb-1">Passive-CPD vision</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 flex-1">
              How AI-tool events become AHPRA-audit-ready CPD hours. Mock data, illustrative.
            </p>
            <span className="text-[11px] font-semibold text-accent inline-flex items-center gap-1">
              See the demo
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>

          <Link
            href="/courses/cpd-record/requirements"
            className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 hover:shadow-sm transition-all flex flex-col"
          >
            <Database className="w-5 h-5 text-accent mb-2" />
            <p className="text-sm font-bold text-foreground leading-tight mb-1">17 AHPRA Boards</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3 flex-1">
              All National Boards + RACGP + ACRRM CPD Homes. Per-Board calibration encoded.
            </p>
            <span className="text-[11px] font-semibold text-accent inline-flex items-center gap-1">
              See the reference
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        </div>

        {/* MINIMAL FOOTER — credibility line */}
        <div className="pt-6 border-t border-slate-200 text-xs text-muted-foreground text-center">
          Zac Lewis · osteopath · AHPRA-registered · Osteopathy Australia Conference 2026 speaker (Gold Coast 16–17 October).
        </div>
      </div>
    </div>
  )
}
