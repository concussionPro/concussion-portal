import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Activity, Gauge, Lock } from 'lucide-react'
import { ToolkitSidebar } from '../_sidebar'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'
import { TalkToZacFooter } from '@/components/prospect/TalkToZacFooter'
import { DISCHARGE_TEMPLATES, DOCUMENTATION_PRINCIPLES } from '@/data/hub-program-content'
import { ClinicalToolkitDoc } from '@/components/toolkit/ClinicalToolkitDoc'
import { headers } from 'next/headers'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

// Flagship live, browser-based instruments included with the program — mirrors
// the "Interactive clinical tools" bento on /clinical-toolkit. Prospects are not
// paid, so these are framed as preview / what-you-get and route to the unlock
// CTA (pricing), NOT a deep-link into the live tool.
const FLAGSHIP_TOOLS = [
  {
    icon: Activity,
    track: 'sst-trainer',
    title: 'Sub-Symptom-Threshold Trainer',
    blurb: 'Heart-rate-guided sub-symptom-threshold exertion rehab — keep patients training inside the safe Buffalo-protocol band.',
    chips: ['Live HR (Bluetooth + camera)', 'Buffalo protocol band', 'Session & symptom tracking'],
    from: 'from-rose-500',
    to: 'to-teal-600',
  },
  {
    icon: Gauge,
    track: 'preseason',
    title: 'Preseason Baseline Testing',
    blurb: 'SCAT6 baseline cognitive & symptom testing for athletes and teams — establish individual baselines for accurate post-injury comparison.',
    chips: ['SCAT6 baseline', 'Team / squad testing', 'Pre-injury comparison'],
    from: 'from-teal-600',
    to: 'to-blue-600',
  },
]

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Clinical Toolkit — ${clinic.shortName}` : 'Clinical Toolkit',
    description: 'Six concussion discharge and handover templates — AHPRA-aligned, fillable, pre-branded for the prospect clinic.',
    robots: 'noindex, nofollow',
  }
}

export default async function ClinicalToolkitPage({ params, searchParams }: PageProps) {
  const { token } = await params
  await searchParams
  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()
  // Keyless per-clinic URL (Zac 2026-06-11): cold emails link to /p/<slug>
  // with NO access key. This is non-sensitive marketing content, so any valid
  // clinic slug renders. The key is honoured when present (legacy links) but
  // no longer required.

  // Engagement signal — fire-and-forget. Failures don't block the render.
  const h = await headers()
  const userAgent = h.get('user-agent') ?? undefined
  const forwarded = h.get('x-forwarded-for') ?? undefined
  const viewerIp = forwarded?.split(',')[0]?.trim()
  recordPortalView({
    clinicId: clinic.id,
    viewerIp,
    userAgent,
    section: 'toolkit-clinical',
    utmSource: 'cold_outreach',
    utmCampaign: 'prospect_portal_email',
    utmTerm: clinic.slug,
  }).catch((err) => console.error('[Portal view tracking failed]', err))

  const accessKey = clinic.accessKey
  const baseHref = `/p/${clinic.slug}`
  const cityKnown = clinic.city && !/unknown/i.test(clinic.city)

  return (
    <div className="flex min-h-screen dashboard-bg print:bg-white print:min-h-0">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey} />
      <ToolkitSidebar clinic={clinic} active="clinical" />
      <main className="flex-1 ml-0 md:ml-64 print:ml-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 print:py-0 print:px-8 print:max-w-none">
          <Link
            href={`${baseHref}/toolkit?k=${accessKey}`}
            data-track-cta="toolkit-back-to-launcher"
            className="print:hidden inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to toolkit
          </Link>

          {/* Interactive clinical tools — included with the program (preview, no deep-link) */}
          <div data-track-section="toolkit-interactive-tools" className="print:hidden mb-8">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Interactive clinical tools
              </span>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Live, browser-based instruments your clinic unlocks with the program — not downloads.
            </p>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {FLAGSHIP_TOOLS.map((tool) => {
                const Icon = tool.icon
                return (
                  <Link
                    key={tool.track}
                    href={`${baseHref}?k=${accessKey}#pricing`}
                    data-track-cta={`toolkit-tool-${tool.track}`}
                    className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all hover:border-teal-300 hover:shadow-xl"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${tool.from} ${tool.to}`} />
                    <div className="mb-4 flex items-start justify-between">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ${tool.from} ${tool.to}`}>
                        <Icon className="h-7 w-7 text-white" strokeWidth={2} />
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                        <Lock className="h-3.5 w-3.5" />
                        WITH PROGRAM
                      </span>
                    </div>
                    <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900">{tool.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600">{tool.blurb}</p>
                    <div className="mb-5 flex flex-wrap gap-2">
                      {tool.chips.map((chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                        Included with your cohort
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div data-track-section="toolkit-clinical">
            {/* Preview policy (title/structure-only — no copyable content):
                  - The 3 "visible" templates render as the structure-only lock
                    (title, branded letterhead, section outline) — NOT the full
                    copyable body, sign-off, or compliance text. Forced by
                    ClinicalToolkitDoc whenever previewedSlugs is set.
                  - The other 3 render as locked teaser cards.
                  - FillableDoc previewMode (auto-on because previewedSlugs is
                    an array) adds `select-none` (text can't be selected/copied)
                    AND blocks print/PDF via the @media print CSS in
                    PreviewPrintBlock.
                  - Download API (`/api/toolkit/download`) is PAID-ONLY: it
                    ignores prospect access keys and 403s anyone without an
                    admin or paid session, so prospects can't pull the files.
            */}
            <ClinicalToolkitDoc
              templates={DISCHARGE_TEMPLATES}
              principles={DOCUMENTATION_PRINCIPLES}
              previewedSlugs={[
                'gp-handover-letter',
                'school-rtp-authorisation',
                'parent-symptom-management-plan',
              ]}
              unlockHref={`${baseHref}?k=${accessKey}#pricing`}
              defaultValues={{
                clinic_name: clinic.name,
                clinic_short_name: clinic.shortName,
                ...(cityKnown ? { clinic_address: `${clinic.city} ${clinic.state}` } : {}),
              }}
            />
          </div>
          {/* Padding to keep last content above the sticky footer */}
          <div className="h-20 print:hidden" />
        </div>
      </main>
      <TalkToZacFooter clinicShortName={clinic.shortName} context="clinical-toolkit" />
    </div>
  )
}
