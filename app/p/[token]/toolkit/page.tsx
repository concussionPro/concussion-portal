import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FileText, ArrowLeft, Mail, GraduationCap } from 'lucide-react'
import { ToolkitSidebar } from './_sidebar'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'
import { AccessWall } from '@/components/prospect/ProspectLanding'
import { getClinicBySlug } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Toolkit — ${clinic.shortName}` : 'Toolkit',
    description: clinic
      ? `Clinical, outreach, and admin toolkit prepared for ${clinic.name}.`
      : 'Private proposal portal.',
    robots: 'noindex, nofollow',
  }
}

export default async function ToolkitLauncherPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { k } = await searchParams
  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()
  if (k !== clinic.accessKey) return <AccessWall clinicName={clinic.name} />

  const accessKey = clinic.accessKey
  const baseHref = `/p/${clinic.slug}`

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <ToolkitSidebar clinic={clinic} active="root" />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`${baseHref}?k=${accessKey}`}
            data-track-cta="toolkit-back-to-dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>

          <div data-track-section="toolkit-launcher">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
              Hub Program · Asset Library
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
              Toolkit &amp; resources for {clinic.shortName}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
              The clinical toolkit, outreach kit and front-desk micro-course included with the Concussion Hub Program. Each document is fillable on screen and exports to a clean PDF — pre-populated with {clinic.shortName}&apos;s details.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToolkitCard
                href={`${baseHref}/toolkit/clinical?k=${accessKey}`}
                trackId="toolkit-clinical"
                kind="Clinical"
                kindTone="accent"
                title="Clinical Toolkit"
                detail="Six AHPRA-aligned discharge & handover templates: GP, school RTP, parent plan, sports club, WorkCover, NDIS. 3 visible in preview."
                meta="6 templates · 3 in preview"
                icon={FileText}
              />
              <ToolkitCard
                href={`${baseHref}/toolkit/outreach?k=${accessKey}`}
                trackId="toolkit-outreach"
                kind="Outreach"
                kindTone="slate"
                title="Outreach Kit"
                detail={`Six referral-building templates: schools, clubs, GPs, surf life saving, endurance sport, plus ${clinic.shortName}'s capability one-pager. 3 visible in preview.`}
                meta="6 templates · 3 in preview"
                icon={Mail}
              />
              <ToolkitCard
                href={`${baseHref}/toolkit/admin?k=${accessKey}`}
                trackId="toolkit-admin"
                kind="Training"
                kindTone="amber"
                title="Front-Desk Micro-Course"
                detail="Eight modules for reception & admin. All 8 visible in structure; body content + knowledge checks + certificate activate on enrolment."
                meta="8 modules · structure preview"
                icon={GraduationCap}
              />
            </div>

            <div className="mt-8 rounded-xl bg-accent/5 border border-accent/15 border-l-2 border-l-accent p-4 sm:p-5">
              <p className="text-sm font-bold text-foreground mb-1">Fillable &amp; branded for {clinic.shortName}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every clinical and outreach template loads pre-populated with {clinic.shortName}&apos;s name and (where known) location. Type into the highlighted fields — matching fields fill together and persist on reload. Every clinical template carries a clinician checklist, sign-off block, and a compliance &amp; disclaimer note covering scope of practice, emergency red flags, and privacy / consent handling.
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-2 leading-relaxed">
                Preview only — printing / PDF export is disabled until the Hub Program is in place.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function ToolkitCard({
  href,
  trackId,
  kind,
  kindTone,
  title,
  detail,
  meta,
  icon: Icon,
}: {
  href: string
  trackId: string
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
      data-track-cta={trackId}
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
