import type { Metadata } from 'next'
import Link from 'next/link'
import {
  FileText,
  ArrowLeft,
  Mail,
  GraduationCap,
  Lock,
} from 'lucide-react'
import { ToolkitSidebar } from './_sidebar'
import { DISCHARGE_TEMPLATE_COUNT, OUTREACH_TEMPLATE_COUNT } from '@/data/hub-program-content'

const ACCESS_KEY = 'ah2026'

export const metadata: Metadata = {
  title: 'Hub Program Toolkit — Advanced Health',
  description: 'Clinical, outreach, and admin toolkit for Advanced Health Pain & Injury Clinic.',
  robots: 'noindex, nofollow',
}

export default async function ToolkitLauncher({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>
}) {
  const { k } = await searchParams
  if (k !== ACCESS_KEY) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-premium rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-foreground mb-3">Private proposal portal</h1>
          <p className="text-sm text-muted-foreground">Access requires the link from Zac&rsquo;s introductory email.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ToolkitSidebar active="root" />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>

          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
            Hub Program · Asset Library
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Toolkit &amp; resources
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            The clinical toolkit, outreach kit and front-desk micro-course included with the Concussion Hub Program. Each document is fillable on screen and exports to a clean, branded PDF.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ToolkitCard
              href={`/proposals/advanced-health-buderim/toolkit/clinical?k=${ACCESS_KEY}`}
              kind="Clinical"
              kindTone="accent"
              title="Clinical Toolkit"
              detail={`${DISCHARGE_TEMPLATE_COUNT} discharge & handover templates — GP, school, parent, sports club, WorkCover, NDIS, ACC884 and medicolegal record. AHPRA-aligned, clinician sign-off built in.`}
              meta={`${DISCHARGE_TEMPLATE_COUNT} templates`}
              icon={FileText}
            />
            <ToolkitCard
              href={`/proposals/advanced-health-buderim/toolkit/outreach?k=${ACCESS_KEY}`}
              kind="Outreach"
              kindTone="slate"
              title="Outreach Kit"
              detail={`${OUTREACH_TEMPLATE_COUNT} referral-building templates for schools, clubs, GPs, surf life saving and endurance sport, plus a capability one-pager.`}
              meta={`${OUTREACH_TEMPLATE_COUNT} templates`}
              icon={Mail}
            />
            <ToolkitCard
              href={`/proposals/advanced-health-buderim/toolkit/admin?k=${ACCESS_KEY}`}
              kind="Training"
              kindTone="amber"
              title="Front-Desk Micro-Course"
              detail="Eight modules for reception & admin. View only — full course + downloadable certificate activates on enrolment."
              meta="8 modules · ~1 hr"
              icon={GraduationCap}
            />
          </div>

          <div className="mt-8 rounded-xl bg-accent/5 border border-accent/15 border-l-2 border-l-accent p-4 sm:p-5">
            <p className="text-sm font-bold text-foreground mb-1">Fillable &amp; compliant</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Type into the highlighted fields — matching fields (e.g. clinic name) fill together and persist on reload. Every clinical template carries a clinician checklist, sign-off block, and a compliance &amp; disclaimer note covering scope of practice, emergency red flags, and privacy / consent handling.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function ToolkitCard({
  href,
  kind,
  kindTone,
  title,
  detail,
  meta,
  icon: Icon,
}: {
  href: string
  kind: string
  kindTone: 'accent' | 'slate' | 'amber'
  title: string
  detail: string
  meta: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}) {
  const kindClass = {
    accent: 'bg-accent text-white',
    slate: 'bg-slate-800 text-white',
    amber: 'bg-amber-500 text-white',
  }[kindTone]
  const iconBg = {
    accent: 'from-accent/15 to-accent/5',
    slate: 'from-slate-200/60 to-slate-100/40',
    amber: 'from-amber-500/15 to-amber-400/5',
  }[kindTone]
  const iconText = {
    accent: 'text-accent',
    slate: 'text-slate-700',
    amber: 'text-amber-600',
  }[kindTone]
  return (
    <Link
      href={href}
      className="block glass-premium rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded ${kindClass}`}>
          {kind}
        </span>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-[18px] h-[18px] ${iconText}`} strokeWidth={1.8} />
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{detail}</p>
      <div className="flex items-center justify-between pt-3 border-t border-accent/8">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{meta}</span>
        <span className="text-xs font-bold text-accent group-hover:translate-x-0.5 transition-transform">Open →</span>
      </div>
    </Link>
  )
}

function LockedCard({
  kind,
  title,
  detail,
  meta,
}: {
  kind: string
  title: string
  detail: string
  meta: string
}) {
  return (
    <div className="block glass-premium rounded-2xl p-5 opacity-80 relative">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
          {kind}
        </span>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200/60 to-slate-100/40 flex items-center justify-center">
          <Lock className="w-[18px] h-[18px] text-slate-400" strokeWidth={1.8} />
        </div>
      </div>
      <h3 className="text-lg font-bold text-muted-foreground mb-2 leading-tight">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{detail}</p>
      <div className="flex items-center justify-between pt-3 border-t border-accent/8">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{meta}</span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700">Hub Program</span>
      </div>
    </div>
  )
}

