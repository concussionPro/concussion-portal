import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock, BookOpen, FileText, Scale, Lightbulb } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Concussion Management Blog | Expert Clinical Insights',
  description: 'Evidence-based concussion management articles for healthcare professionals. Covering SCAT6, SCOAT6, VOMS, return-to-play protocols, and the latest Amsterdam Consensus updates.',
  openGraph: {
    title: 'Concussion Management Blog | Expert Clinical Insights',
    description: 'Evidence-based concussion management articles for healthcare professionals. SCAT6, SCOAT6, VOMS, return-to-play protocols, and Amsterdam Consensus updates.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/blog',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog',
  },
}

type Category = 'clinical-tools' | 'policy' | 'practice' | 'resources'

const categoryConfig: Record<Category, { label: string; color: string; icon: typeof BookOpen }> = {
  'clinical-tools': { label: 'Clinical Tools', color: 'text-teal-600 bg-teal-50 border-teal-200', icon: FileText },
  'policy': { label: 'Policy & Regulation', color: 'text-violet-600 bg-violet-50 border-violet-200', icon: Scale },
  'practice': { label: 'Clinical Practice', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Lightbulb },
  'resources': { label: 'Resources', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: BookOpen },
}

const blogPosts: Array<{
  title: string
  description: string
  date: string
  href: string
  readTime: string
  category: Category
}> = [
  {
    title: 'AHPRA CPD Requirements for Allied Health: Where Concussion Education Fits',
    description: 'Annual CPD requirements for physiotherapists, osteopaths, chiropractors, and exercise physiologists — and how structured concussion education counts toward your obligations.',
    date: 'March 18, 2026',
    href: '/blog/ahpra-cpd-requirements-concussion-education',
    readTime: '8 min',
    category: 'policy',
  },
  {
    title: '21-Day Concussion Stand-Down in Youth Sport: What Every Australian Clinician Should Know',
    description: 'Australia\'s 21-day mandatory stand-down after concussion in youth and community sport is now the national standard. Understand the rules, which sports enforce them, and what clinicians need to do.',
    date: 'March 18, 2026',
    href: '/blog/21-day-concussion-stand-down-youth-sport-australia',
    readTime: '9 min',
    category: 'policy',
  },
  {
    title: 'AIS Concussion and Brain Health Position Statement 2024: Key Takeaways for Clinicians',
    description: 'The AIS Position Statement introduces a 21-day stand-down for youth sport, formally expands the role of physiotherapists, and aligns Australia with UK and NZ concussion guidelines.',
    date: 'March 18, 2026',
    href: '/blog/ais-concussion-brain-health-position-statement-2024',
    readTime: '10 min',
    category: 'policy',
  },
  {
    title: 'NSW Mandatory Concussion Training for Combat Sports: What Clinicians Need to Know',
    description: 'The Combat Sports Amendment Act 2024 requires all NSW combat sports participants to complete mandatory concussion training. Here\'s what changed, who it affects, and why it matters beyond the ring.',
    date: 'March 18, 2026',
    href: '/blog/nsw-mandatory-concussion-training-combat-sports',
    readTime: '8 min',
    category: 'policy',
  },
  {
    title: '7 Concussion Myths Clinicians Should Stop Believing in 2026',
    description: 'From loss of consciousness to prolonged rest — evidence-based debunking of the most persistent concussion misconceptions still affecting clinical practice.',
    date: 'March 9, 2026',
    href: '/blog/concussion-myths-clinicians-should-stop-believing',
    readTime: '9 min',
    category: 'practice',
  },
  {
    title: 'BESS Balance Testing for Concussion: A Clinician\'s Complete Guide',
    description: 'Step-by-step guide to administering and scoring the Balance Error Scoring System. Covers all 6 conditions, error types, common pitfalls, and clinical interpretation.',
    date: 'March 9, 2026',
    href: '/blog/bess-balance-testing-concussion-guide',
    readTime: '11 min',
    category: 'clinical-tools',
  },
  {
    title: 'Pre-Season Baseline Testing for Concussion: What Every Clinician Needs to Know',
    description: 'Why individual baselines dramatically improve concussion detection. Covers SCAT6, BESS, and VOMS baseline protocols, implementation workflow, and common pitfalls.',
    date: 'March 9, 2026',
    href: '/blog/pre-season-baseline-testing-concussion-guide',
    readTime: '10 min',
    category: 'practice',
  },
  {
    title: '2026 Concussion Update: Why "Wait Until Symptom Free" is Officially Obsolete',
    description: 'Two years since the Amsterdam Consensus, the evidence is clear: passive rest beyond 48 hours does more harm than good. Active recovery, the SCAT6/SCOAT6 two-tool system, and vestibular-ocular screening define the new standard.',
    date: 'January 5, 2026',
    href: '/blog/concussion-update-2026-wait-until-symptom-free-obsolete',
    readTime: '10 min',
    category: 'practice',
  },
  {
    title: 'Free SCAT6 PDF Download - Fillable Form with Auto-Scoring',
    description: 'Download free digitally fillable SCAT6 PDF with automatic scoring. Updated for Amsterdam 2023 Consensus protocols. Used by Australian healthcare professionals.',
    date: 'January 31, 2026',
    href: '/blog/free-scat6-pdf-download',
    readTime: '5 min',
    category: 'resources',
  },
  {
    title: 'SCAT6 vs SCOAT6: Which Tool to Use When?',
    description: 'Understand the critical differences between SCAT6 and SCOAT6. Learn when to use each tool to avoid below standard of care under AHPRA guidelines and the Amsterdam 2023 Consensus.',
    date: 'January 31, 2026',
    href: '/blog/scat6-vs-scoat6-difference',
    readTime: '7 min',
    category: 'clinical-tools',
  },
  {
    title: 'Beyond SCAT6: How Vestibular/Ocular Screening Improves Concussion Care',
    description: '50-80% of concussed athletes report dizziness, yet standard assessments miss the underlying vestibular-ocular deficits. Learn how VOMS screening fills this critical gap.',
    date: 'October 18, 2025',
    href: '/blog/vestibular-ocular-screening-voms-concussion',
    readTime: '12 min',
    category: 'clinical-tools',
  },
  {
    title: 'Safe Return-to-Play Decisions After Concussion: 5 Quick Wins for Clinicians',
    description: 'Five evidence-based strategies to improve return-to-play decisions. Digital symptom tracking, cognitive screening, balance testing, stepwise protocols, and holistic SCAT6 integration.',
    date: 'September 15, 2025',
    href: '/blog/return-to-play-decisions-concussion-clinicians',
    readTime: '11 min',
    category: 'practice',
  },
  {
    title: 'How to Use the SCAT6 for Concussion Management: A Clinician\'s Guide',
    description: 'Complete step-by-step guide to SCAT6 administration. Covers symptom evaluation, cognitive screening, neurological examination, balance assessment, and clinical caveats.',
    date: 'August 1, 2025',
    href: '/blog/how-to-use-scat6-clinicians-guide',
    readTime: '14 min',
    category: 'clinical-tools',
  },
]

export default function BlogIndexPage() {
  const featured = blogPosts[0]
  const rest = blogPosts.slice(1)

  return (
    <>
      <SiteNav />
      <div className="min-h-screen bg-[var(--background)] relative">

        {/* Ambient background */}
        <div className="absolute inset-0 hero-gradient pointer-events-none" aria-hidden="true" />
        <div className="ambient-glow -top-[200px] left-1/2 -translate-x-1/2" aria-hidden="true" />

        {/* Hero */}
        <section className="pt-[120px] md:pt-[150px] pb-10 px-5 md:px-8 relative z-10">
          <div className="max-w-[900px] mx-auto text-center">
            <div className="badge mb-5">
              Evidence-Based Insights
            </div>
            <h1 className="text-3xl md:text-[2.75rem] leading-[1.15] font-bold tracking-[-0.02em] text-[var(--foreground)] mb-4">
              Clinical concussion insights{' '}
              <span className="text-gradient">for practitioners</span>
            </h1>
            <p className="text-base text-[var(--muted-foreground)] leading-relaxed max-w-[540px] mx-auto">
              Practical articles on SCAT6 administration, assessment protocols, Australian policy updates, and evidence-based concussion management. Written by Zac Lewis.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        <section className="px-5 md:px-8 pb-8 relative z-10">
          <div className="max-w-[900px] mx-auto">
            <Link
              href={featured.href}
              className="group block card card-visible rounded-2xl p-6 md:p-8 hover:shadow-lg transition-all duration-300"
              style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.15)' }}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">Latest</span>
                    <CategoryBadge category={featured.category} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3 group-hover:text-[var(--accent)] transition-colors leading-snug">
                    {featured.title}
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4">
                    {featured.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--muted-foreground)]">{featured.date}</span>
                    <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Clock className="w-3 h-3" />
                      {featured.readTime}
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent)]/10 group-hover:bg-[var(--accent)]/20 transition-colors shrink-0 mt-1">
                  <ArrowRight className="w-5 h-5 text-[var(--accent)] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Post Grid */}
        <section className="px-5 md:px-8 pb-16 relative z-10">
          <div className="max-w-[900px] mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {rest.map((post) => (
                <Link
                  key={post.href}
                  href={post.href}
                  className="group glass rounded-xl p-5 flex flex-col hover:shadow-md transition-all duration-200 hover:border-[var(--accent)]/20"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <CategoryBadge category={post.category} />
                    <span className="flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-bold text-[var(--foreground)] mb-2 leading-snug group-hover:text-[var(--accent)] transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4 flex-1 line-clamp-3">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--muted-foreground)]">{post.date}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] group-hover:gap-1.5 transition-all">
                      Read
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-5 md:px-8 pb-16 relative z-10">
          <div className="max-w-[900px] mx-auto">
            <div className="card-accent rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                <div className="flex-1">
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                    Go Deeper
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] mb-2">
                    Ready to build clinical confidence?
                  </h2>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                    Our courses cover everything in these articles and more — with interactive assessments and AHPRA-aligned CPD certification.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 shrink-0">
                  <Link
                    href="/scat-mastery"
                    className="btn-primary px-6 py-3 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2"
                  >
                    Free SCAT6 Course (2 CPD)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="btn-secondary px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2"
                  >
                    Full Course — ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  const config = categoryConfig[category]
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.label}
    </span>
  )
}
