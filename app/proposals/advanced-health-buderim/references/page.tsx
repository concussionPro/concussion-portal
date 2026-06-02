import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Home,
  BookOpen,
  Brain,
  Activity,
  FileText,
  Library,
  BookMarked,
  Lock,
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  Mail,
} from 'lucide-react'

const ACCESS_KEY = 'ah2026'

const CLINIC = {
  shortName: 'Advanced Health',
  city: 'Buderim',
  state: 'QLD',
}

interface Ref {
  authors: string
  year: string
  title: string
  journal: string
  doi?: string
  url?: string
}

// Curated subset for the prospect preview. The full library has 140+ entries
// across pathophysiology, assessment, PPCS, vestibular, exercise, paediatric,
// medicolegal, return-to-play, and AI/documentation categories.
const PROSPECT_REFS: Record<string, Ref[]> = {
  'Consensus statements + position papers': [
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
    {
      authors: 'McCrory, P., Meeuwisse, W. H., Aubry, M., et al.',
      year: '2017',
      title: 'Consensus statement on concussion in sport: 5th International Conference on Concussion in Sport, Berlin 2016',
      journal: 'British Journal of Sports Medicine, 51(11), 838-847',
      doi: '10.1136/bjsports-2017-097699',
    },
    {
      authors: 'Concussion in Sport Australia',
      year: '2023',
      title: 'Concussion guidelines for youth and community sport',
      journal: 'Concussion in Sport Australia',
      url: 'https://www.concussioninsport.gov.au',
    },
  ],
  'Pathophysiology + mechanisms': [
    {
      authors: 'Giza, C. C., & Hovda, D. A.',
      year: '2014',
      title: 'The new neurometabolic cascade of concussion',
      journal: 'Neurosurgery, 75(S4), S24-S33',
    },
    {
      authors: 'MacFarlane, M. P., & Glenn, T. C.',
      year: '2015',
      title: 'Neurochemical cascade of concussion',
      journal: 'Brain Injury, 29(2), 139-153',
      doi: '10.3109/02699052.2014.965208',
    },
    {
      authors: 'Maugans, T. A., Farley, C., Altaye, M., Leach, J., & Cecil, K. M.',
      year: '2012',
      title: 'Pediatric sports-related concussion produces cerebral blood flow alterations',
      journal: 'Pediatrics, 129(1), 28-37',
      doi: '10.1542/peds.2011-2083',
    },
    {
      authors: 'McKee, A. C., & Daneshvar, D. H.',
      year: '2015',
      title: 'The neuropathology of traumatic brain injury',
      journal: 'Handbook of Clinical Neurology, 127, 45-66',
      doi: '10.1016/B978-0-444-52892-6.00004-0',
    },
  ],
  'Assessment tools (VOMS, BESS, King-Devick)': [
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
    {
      authors: 'Galetta, K. M., Liu, M., Leong, D. F., Ventura, R. E., Galetta, S. L., & Balcer, L. J.',
      year: '2016',
      title: 'The King-Devick test of rapid number naming for concussion detection: Meta-analysis and systematic review',
      journal: 'Concussion, 1(2), cnc.15.8',
      doi: '10.2217/cnc.15.8',
    },
    {
      authors: 'Toong, T., Wilson, K. E., Hunt, A. W., et al.',
      year: '2021',
      title: 'Sensitivity and specificity of a multimodal approach for concussion assessment in youth athletes',
      journal: 'Journal of Sport Rehabilitation, 30(6), 850-859',
      doi: '10.1123/jsr.2020-0279',
    },
  ],
  'Persistent post-concussion symptoms + phenotypes': [
    {
      authors: 'Craton, N., Ali, H., & Lenoski, S.',
      year: '2017',
      title: 'COACH CV: The seven clinical phenotypes of concussion',
      journal: 'Cureus, 9(9), e1771',
      doi: '10.7759/cureus.1771',
    },
    {
      authors: 'Ellis, M. J., Leddy, J. J., & Willer, B.',
      year: '2015',
      title: 'Physiological, vestibulo-ocular and cervicogenic post-concussion disorders: An evidence-based classification system',
      journal: 'Brain Injury, 29(2), 238-248',
      doi: '10.3109/02699052.2014.965207',
    },
    {
      authors: 'Leddy, J. J., Sandhu, H., Sodhi, V., Baker, J. G., & Willer, B.',
      year: '2012',
      title: 'Rehabilitation of concussion and post-concussion syndrome',
      journal: 'Sports Health, 4(2), 147-154',
      doi: '10.1177/1941738111433673',
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
    {
      authors: 'Haider, M. N., Leddy, J. J., Pavlesen, S., et al.',
      year: '2018',
      title: 'A systematic review of criteria used to define recovery from sport-related concussion in youth athletes',
      journal: 'British Journal of Sports Medicine, 52(18), 1179-1190',
      doi: '10.1136/bjsports-2016-096551',
    },
    {
      authors: 'Buffalo Concussion Treadmill Test protocol',
      year: '2022',
      title: 'Standardised protocol for sub-symptom-threshold aerobic exercise prescription post-concussion',
      journal: 'University at Buffalo Concussion Management Clinic',
      url: 'https://medicine.buffalo.edu/departments/orthopaedics/divisions/concussion-clinic.html',
    },
  ],
  'Cervical contribution + vestibular rehab': [
    {
      authors: 'Schneider, K. J., Meeuwisse, W. H., Nettel-Aguirre, A., et al.',
      year: '2014',
      title: 'Cervicovestibular rehabilitation in sport-related concussion: A randomised controlled trial',
      journal: 'British Journal of Sports Medicine, 48(17), 1294-1298',
      doi: '10.1136/bjsports-2013-093267',
    },
    {
      authors: 'Cheever, K. M., McDevitt, J., Phillips, J., & Kawata, K.',
      year: '2021',
      title: 'The role of cervical symptoms in post-concussion management',
      journal: 'Sports Medicine, 51(9), 1875-1891',
      doi: '10.1007/s40279-021-01469-y',
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
      authors: 'Royal Children\'s Hospital, Melbourne',
      year: 'n.d.',
      title: 'Head injury clinical guideline',
      journal: 'RCH Clinical Guidelines',
      url: 'https://www.rch.org.au/clinicalguide/guideline_index/Head_injury',
    },
  ],
}

export const metadata: Metadata = {
  title: 'Reference Library Preview — Advanced Health',
  description: 'Curated peer-reviewed reference subset for Advanced Health Pain & Injury Clinic.',
  robots: 'noindex, nofollow',
}

export default async function ProspectReferences({
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

  const totalShown = Object.values(PROSPECT_REFS).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectSidebar />
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
            Reference Library · preview
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">
            Peer-reviewed concussion evidence
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            {totalShown} of 140+ references shown as a sample across {Object.keys(PROSPECT_REFS).length} categories. The full library is searchable and unlocked for every clinician with the Hub Program.
          </p>

          <div className="space-y-8">
            {Object.entries(PROSPECT_REFS).map(([category, refs]) => (
              <section key={category}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-foreground">{category}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    {refs.length} of many
                  </span>
                </div>
                <div className="space-y-2.5">
                  {refs.map((ref, i) => (
                    <ReferenceCard key={i} reference={ref} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 glass-premium rounded-2xl p-5 text-center">
            <p className="text-sm font-bold text-foreground mb-1">
              Full library · 140+ references
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Searchable by category, citation, author, year. Linked to clinical modules. Updated as consensus evolves. Available to every clinician at {CLINIC.shortName} with the Hub Program.
            </p>
          </div>
        </div>
      </main>
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
      <p className="text-sm font-semibold text-foreground leading-snug mb-1">
        {reference.title}
      </p>
      <p className="text-[11px] text-muted-foreground italic leading-snug">
        {reference.journal}
        {reference.doi && <span className="ml-2 text-accent not-italic">DOI: {reference.doi}</span>}
      </p>
    </>
  )
  if (linkHref) {
    return (
      <a
        href={linkHref}
        target="_blank"
        rel="noopener"
        className="block rounded-xl bg-white border border-accent/8 p-3 sm:p-4 hover:border-accent/30 hover:shadow-sm transition-all group"
      >
        {inner}
        <p className="text-[10px] font-bold text-accent mt-1 group-hover:underline">
          Open source ↗
        </p>
      </a>
    )
  }
  return (
    <div className="rounded-xl bg-white border border-accent/8 p-3 sm:p-4">
      {inner}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function ProspectSidebar() {
  return (
    <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex-col z-40">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md shadow-accent/15">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Concussion<span className="text-accent">Pro</span>
          </h1>
        </div>
        <p className="text-[0.65rem] text-muted-foreground ml-12 uppercase tracking-widest font-medium">
          Hub Program Preview
        </p>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{CLINIC.shortName}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{CLINIC.city}, {CLINIC.state}</p>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem href={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}`} label="Dashboard" icon={Home} />
        <SidebarItem href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`} label="Learning Suite" icon={BookOpen} />
        <SidebarItem href="/scat-forms" label="SCAT Forms" icon={Activity} external />
        <SidebarItem href="/preseason" label="Baseline Testing" icon={TrendingUp} external />
        <SidebarItem label="Reference Library" icon={Library} active />
        <SidebarItem href={`/proposals/advanced-health-buderim/toolkit/clinical?k=${ACCESS_KEY}`} label="Clinical Toolkit" icon={FileText} />
        <SidebarItem href={`/proposals/advanced-health-buderim/toolkit/outreach?k=${ACCESS_KEY}`} label="Outreach Kit" icon={Mail} />
        <SidebarItem href={`/proposals/advanced-health-buderim/toolkit/admin?k=${ACCESS_KEY}`} label="Admin Workflow" icon={BookMarked} />
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AHPRA Aligned</p>
        <p className="text-[10px] text-muted-foreground">OA Endorsed · 14 CPD hrs</p>
      </div>
    </div>
  )
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  locked,
  external,
}: {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  active?: boolean
  locked?: boolean
  external?: boolean
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative text-sm font-medium'
  if (locked) {
    return (
      <div className={`${base} opacity-50 text-muted-foreground cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
        <Lock className="w-3 h-3 ml-auto text-muted-foreground/60" />
      </div>
    )
  }
  if (active) {
    return (
      <div className={`${base} bg-accent/8 text-accent font-semibold cursor-default`}>
        <div className="nav-active-indicator" />
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        <span>{label}</span>
      </div>
    )
  }
  if (!href) {
    return (
      <div className={`${base} text-muted-foreground cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
      </div>
    )
  }
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className={`${base} text-muted-foreground hover:text-foreground hover:bg-white/40`}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
      <span>{label}</span>
      {external && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
    </a>
  )
}
