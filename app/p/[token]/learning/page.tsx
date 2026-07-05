import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { ArrowLeft, Lock, Clock } from 'lucide-react'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'
import { ProspectSidebar } from '@/components/prospect/ProspectSidebar'
import { TalkToZacFooter } from '@/components/prospect/TalkToZacFooter'
import { getModulesMeta } from '@/data/module-meta'
import { getEpModulesMeta } from '@/data/ep-modules'
import { DualStreamTabs } from '@/components/prospect/DualStreamTabs'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}

export const metadata: Metadata = {
  title: 'Learning Suite',
  robots: 'noindex, nofollow',
}

export default async function ProspectLearningSuite({ params, searchParams }: PageProps) {
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
    section: 'learning-suite',
    utmSource: 'cold_outreach',
    utmCampaign: 'prospect_portal_email',
    utmTerm: clinic.slug,
  }).catch((err) => console.error('[Portal view tracking failed]', err))

  const modules = getModulesMeta()
  const m1 = modules.find((m) => m.id === 1)!
  const locked = modules.filter((m) => m.id !== 1)
  const isPurpose = clinic.slug === 'purpose-healthcare'
  // Access key is optional (keyless URLs) — guard so links never emit a
  // literal "?k=undefined".
  const kq = clinic.accessKey ? `?k=${clinic.accessKey}` : ''

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey ?? ''} />
      <ProspectSidebar
        slug={clinic.slug}
        accessKey={clinic.accessKey}
        clinicShortName={clinic.shortName}
        clinicCity={clinic.city}
        clinicState={clinic.state}
        active="learning"
      />
      <main className="flex-1 ml-0 md:ml-64">
        <div data-track-section="learning-suite" className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/p/${clinic.slug}${kq}#pricing`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>

          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
            {isPurpose ? 'Two course streams' : 'Concussion Clinical Mastery'} · {clinic.shortName} preview
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Learning Suite
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isPurpose
              ? 'Two streams — CCM (allied health) and CRM (exercise physiology), 8 modules each. 8 CPD hrs online per stream (+6 in-person = 14 total). Pick a stream below to see its modules.'
              : '8 modules · 8 CPD hrs online (+6 in-person = 14 total) · AHPRA-aligned · OA endorsed. Module 1 is open as a trial — 2-8 unlock with the Hub Program.'}
          </p>

          {isPurpose ? (
            /* Purpose (dual-discipline): ONE tab-driven suite. The CCM/CRM tabs
               drive the clickable module list below — CCM module 1 is the live
               trial, CRM is preview-only until ESSA approval. No duplicate list. */
            <DualStreamTabs
              detailed={{
                slug: clinic.slug,
                accessKey: clinic.accessKey ?? '',
                ccm: modules,
                crm: getEpModulesMeta(),
              }}
            />
          ) : (
            <>
              <Link
                href={`/p/${clinic.slug}/learning/module-1${kq}`}
                className="block glass-premium rounded-2xl p-5 sm:p-6 mb-4 border-l-2 border-l-accent hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                    <span className="text-base font-bold text-accent">M1</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{m1.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        Trial open
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{m1.subtitle}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{m1.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m1.duration}</span>
                      <span>·</span>
                      <span>{m1.points} CPD hr</span>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="space-y-2.5">
                {locked.map((m) => (
                  <div key={m.id} className="glass-premium rounded-2xl p-5 opacity-75 relative">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-200/50 to-slate-100/50 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-slate-400" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">M{m.id}. {m.title}</p>
                        <p className="text-xs text-muted-foreground mb-1">{m.subtitle}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{m.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-premium rounded-2xl p-4 mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Modules 2-8 unlock for every {clinic.shortName} clinician with the Hub Program · 8 CPD hrs online each (14 with the in-person day).
                </p>
              </div>
            </>
          )}
          <div className="h-20" />
        </div>
      </main>
      <TalkToZacFooter clinicShortName={clinic.shortName} context="learning" />
    </div>
  )
}
