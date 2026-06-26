/**
 * Dynamic Reference Library preview for every prospect.
 *
 * Same curated content set as Lauren's hardcoded portal, but the clinic
 * branding + back-links are parameterised from the prospect_clinics row
 * keyed by token + access key. Stops the "Reference Library is greyed
 * out" failure on the sidebar — every prospect now has a working
 * Reference Library page.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Home, BookOpen, Brain, Activity, FileText, Library, BookMarked, Lock,
  ArrowLeft, ExternalLink, TrendingUp, Stethoscope,
} from 'lucide-react'
import { headers } from 'next/headers'
import { getClinicBySlug, recordPortalView } from '@/lib/prospect/repo'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'
import { ProspectSidebar } from '@/components/prospect/ProspectSidebar'
import { TalkToZacFooter } from '@/components/prospect/TalkToZacFooter'

interface Ref {
  authors: string
  year: string
  title: string
  journal: string
  doi?: string
  url?: string
}

const CATEGORY_TOTALS: Record<string, number> = {
  'Consensus statements': 12,
  'Pathophysiology': 26,
  'Assessment tools': 22,
  'PPCS + phenotypes': 19,
  'Exercise + return-to-play': 16,
  'Cervical + vestibular rehab': 11,
  'Paediatric concussion': 14,
}

const PROSPECT_REFS: Record<string, Ref[]> = {
  'Consensus statements': [
    {
      authors: 'Patricios, J. S., et al.',
      year: '2023',
      title: 'Consensus statement on concussion in sport: The 6th International Conference on Concussion in Sport — Amsterdam, October 2022',
      journal: 'British Journal of Sports Medicine, 57(11), 695-711',
      doi: '10.1136/bjsports-2023-106898',
    },
    {
      authors: 'Echemendia, R. J., Brett, B. L., Broglio, S., et al.',
      year: '2023',
      title: 'Sport Concussion Assessment Tool 6 (SCAT6)',
      journal: 'British Journal of Sports Medicine, 57(11), 622-631',
      doi: '10.1136/bjsports-2023-107036',
    },
  ],
  'Pathophysiology': [
    {
      authors: 'Giza, C. C., & Hovda, D. A.',
      year: '2014',
      title: 'The new neurometabolic cascade of concussion',
      journal: 'Neurosurgery, 75(S4), S24-S33',
    },
  ],
  'Assessment tools': [
    {
      authors: 'Mucha, A., Collins, M. W., Elbin, R. J., Furman, J. M., & Coppel, D. B.',
      year: '2014',
      title: 'A brief vestibular/ocular motor screening (VOMS) assessment to evaluate concussions: Preliminary findings',
      journal: 'American Journal of Sports Medicine, 42(10), 2479-2486',
      doi: '10.1177/0363546514545282',
    },
    {
      authors: 'Bell, D. R., Guskiewicz, K. M., Clark, M. A., & Padua, D. A.',
      year: '2011',
      title: 'Systematic review of the Balance Error Scoring System',
      journal: 'Sports Health, 3(3), 287-295',
      doi: '10.1177/1941738111403122',
    },
  ],
  'PPCS + phenotypes': [
    {
      authors: 'Craton, N., Ali, H., & Lenoski, S.',
      year: '2017',
      title: 'COACH CV: The seven clinical phenotypes of concussion',
      journal: 'Cureus, 9(9), e1771',
      doi: '10.7759/cureus.1771',
    },
  ],
  'Exercise + return-to-play': [
    {
      authors: 'Leddy, J. J., Haider, M. N., Ellis, M. J., et al.',
      year: '2019',
      title: 'Early subthreshold aerobic exercise for sport-related concussion: A randomized clinical trial',
      journal: 'JAMA Pediatrics, 173(4), 319-325',
      doi: '10.1001/jamapediatrics.2018.4397',
    },
  ],
  'Cervical + vestibular rehab': [
    {
      authors: 'Schneider, K. J., Meeuwisse, W. H., Nettel-Aguirre, A., et al.',
      year: '2014',
      title: 'Cervicovestibular rehabilitation in sport-related concussion: A randomised controlled trial',
      journal: 'British Journal of Sports Medicine, 48(17), 1294-1298',
      doi: '10.1136/bjsports-2013-093267',
    },
  ],
  'Paediatric concussion': [
    {
      authors: 'Davis, G. A., Anderson, V., Babl, F. E., et al.',
      year: '2017',
      title: 'What is the difference in concussion management in children as compared with adults? A systematic review',
      journal: 'British Journal of Sports Medicine, 51(12), 949-957',
      doi: '10.1136/bjsports-2016-097415',
    },
    {
      authors: "Royal Children's Hospital, Melbourne",
      year: 'n.d.',
      title: 'Head injury clinical guideline',
      journal: 'RCH Clinical Guidelines',
      url: 'https://www.rch.org.au/clinicalguide/guideline_index/Head_injury',
    },
  ],
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Reference Library — ${clinic.shortName}` : 'Reference Library',
    description: clinic
      ? `Peer-reviewed concussion references prepared for ${clinic.name}.`
      : 'Peer-reviewed concussion references.',
    robots: 'noindex, nofollow',
  }
}

export default async function ProspectReferences({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}) {
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
    section: 'reference-library',
    utmSource: 'cold_outreach',
    utmCampaign: 'prospect_portal_email',
    utmTerm: clinic.slug,
  }).catch((err) => console.error('[Portal view tracking failed]', err))

  const totalShown = Object.values(PROSPECT_REFS).reduce((acc, arr) => acc + arr.length, 0)
  const slug = clinic.slug
  const ak = clinic.accessKey

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectTracker token={clinic.slug} accessKey={clinic.accessKey ?? ''} />
      <ProspectSidebar
        slug={slug}
        accessKey={ak}
        clinicShortName={clinic.shortName}
        clinicCity={clinic.city}
        clinicState={clinic.state}
        active="references"
      />
      <main className="flex-1 ml-0 md:ml-64">
        <div data-track-section="reference-library" className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/p/${slug}?k=${ak}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>

          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
            Reference Library · preview
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Peer-reviewed concussion evidence
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            {totalShown} of 140+ references shown as a sample across {Object.keys(PROSPECT_REFS).length} categories.
            The full library is searchable and unlocked for every clinician with the Hub Program.
          </p>

          <div className="space-y-8">
            {Object.entries(PROSPECT_REFS).map(([category, refs]) => (
              <section key={category}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-foreground">{category}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    {refs.length} of {CATEGORY_TOTALS[category] ?? refs.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {refs.map((ref, i) => <ReferenceCard key={i} reference={ref} />)}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 glass-premium rounded-2xl p-5 text-center">
            <p className="text-sm font-bold text-foreground mb-1">
              Full library · 140+ references
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Searchable by category, citation, author, year. Linked to clinical modules. Updated as
              consensus evolves. Available to every clinician at {clinic.shortName} with the Hub Program.
            </p>
          </div>
          <div className="h-20" />
        </div>
      </main>
      <TalkToZacFooter clinicShortName={clinic.shortName} context="references" />
    </div>
  )
}

function ReferenceCard({ reference }: { reference: Ref }) {
  const linkHref = reference.doi ? `https://doi.org/${reference.doi}` : reference.url
  const inner = (
    <>
      <p className="text-xs text-muted-foreground leading-snug mb-0.5">
        {reference.authors} <span className="text-foreground/60">({reference.year})</span>
      </p>
      <p className="text-sm font-semibold text-foreground leading-snug mb-1">{reference.title}</p>
      <p className="text-[11px] text-muted-foreground italic">
        {reference.journal}
        {linkHref && (
          <span className="inline-flex items-center gap-1 ml-2 text-accent not-italic">
            <ExternalLink className="w-3 h-3" />
            {reference.doi ? `doi.org/${reference.doi}` : 'link'}
          </span>
        )}
      </p>
    </>
  )
  if (linkHref) {
    return (
      <a
        href={linkHref}
        target="_blank"
        rel="noopener noreferrer"
        className="block glass-premium rounded-xl p-4 hover:shadow-md transition-shadow"
      >
        {inner}
      </a>
    )
  }
  return <div className="glass-premium rounded-xl p-4">{inner}</div>
}

// Sidebar/SidebarItem removed — replaced by shared <ProspectSidebar>
// imported from components/prospect (gains the mobile hamburger drawer).
