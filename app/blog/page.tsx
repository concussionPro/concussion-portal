import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
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

const blogPosts = [
  {
    title: '7 Concussion Myths Clinicians Should Stop Believing in 2026',
    description: 'From loss of consciousness to prolonged rest — evidence-based debunking of the most persistent concussion misconceptions still affecting clinical practice.',
    date: 'March 9, 2026',
    href: '/blog/concussion-myths-clinicians-should-stop-believing',
    gradient: 'from-rose-500 to-pink-500',
    readTime: '9 min',
  },
  {
    title: 'BESS Balance Testing for Concussion: A Clinician\'s Complete Guide',
    description: 'Step-by-step guide to administering and scoring the Balance Error Scoring System. Covers all 6 conditions, error types, common pitfalls, and clinical interpretation.',
    date: 'March 9, 2026',
    href: '/blog/bess-balance-testing-concussion-guide',
    gradient: 'from-green-500 to-emerald-500',
    readTime: '11 min',
  },
  {
    title: 'Pre-Season Baseline Testing for Concussion: What Every Clinician Needs to Know',
    description: 'Why individual baselines dramatically improve concussion detection. Covers SCAT6, BESS, and VOMS baseline protocols, implementation workflow, and common pitfalls.',
    date: 'March 9, 2026',
    href: '/blog/pre-season-baseline-testing-concussion-guide',
    gradient: 'from-sky-500 to-blue-500',
    readTime: '10 min',
  },
  {
    title: '2026 Concussion Update: Why "Wait Until Symptom Free" is Officially Obsolete',
    description: 'Two years since the Amsterdam Consensus, the evidence is clear: passive rest beyond 48 hours does more harm than good. Active recovery, the SCAT6/SCOAT6 two-tool system, and vestibular-ocular screening define the new standard.',
    date: 'January 5, 2026',
    href: '/blog/concussion-update-2026-wait-until-symptom-free-obsolete',
    gradient: 'from-amber-500 to-orange-400',
    readTime: '10 min',
  },
  {
    title: 'Free SCAT6 PDF Download - Fillable Form with Auto-Scoring',
    description: 'Download free digitally fillable SCAT6 PDF with automatic scoring. Updated for Amsterdam 2023 Consensus protocols. Used by Australian healthcare professionals.',
    date: 'January 31, 2026',
    href: '/blog/free-scat6-pdf-download',
    gradient: 'from-blue-500 to-cyan-400',
    readTime: '5 min',
  },
  {
    title: 'SCAT6 vs SCOAT6: Which Tool to Use When?',
    description: 'Understand the critical differences between SCAT6 and SCOAT6. Learn when to use each tool to avoid below standard of care under AHPRA guidelines and the Amsterdam 2023 Consensus.',
    date: 'January 31, 2026',
    href: '/blog/scat6-vs-scoat6-difference',
    gradient: 'from-red-600 to-orange-600',
    readTime: '7 min',
  },
  {
    title: 'Beyond SCAT6: How Vestibular/Ocular Screening Improves Concussion Care',
    description: '50-80% of concussed athletes report dizziness, yet standard assessments miss the underlying vestibular-ocular deficits. Learn how VOMS screening fills this critical gap.',
    date: 'October 18, 2025',
    href: '/blog/vestibular-ocular-screening-voms-concussion',
    gradient: 'from-purple-500 to-indigo-500',
    readTime: '12 min',
  },
  {
    title: 'Safe Return-to-Play Decisions After Concussion: 5 Quick Wins for Clinicians',
    description: 'Five evidence-based strategies to improve return-to-play decisions. Digital symptom tracking, cognitive screening, balance testing, stepwise protocols, and holistic SCAT6 integration.',
    date: 'September 15, 2025',
    href: '/blog/return-to-play-decisions-concussion-clinicians',
    gradient: 'from-emerald-500 to-teal-500',
    readTime: '11 min',
  },
  {
    title: 'How to Use the SCAT6 for Concussion Management: A Clinician\'s Guide',
    description: 'Complete step-by-step guide to SCAT6 administration. Covers symptom evaluation, cognitive screening, neurological examination, balance assessment, and clinical caveats.',
    date: 'August 1, 2025',
    href: '/blog/how-to-use-scat6-clinicians-guide',
    gradient: 'from-blue-600 to-cyan-500',
    readTime: '14 min',
  },
]

export default function BlogIndexPage() {
  return (
    <>
      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-700 text-white pt-[80px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Blog | Concussion Education Australia
            </h1>
            <p className="text-xl text-slate-300">
              Evidence-based clinical insights for healthcare professionals managing sport-related concussion. Written by Zac Lewis.
            </p>
          </div>
        </div>

        {/* Blog Post Grid */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid gap-6">
            {blogPosts.map((post) => (
              <Link
                key={post.href}
                href={post.href}
                className="group bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Gradient Strip */}
                <div className={`h-2 bg-gradient-to-r ${post.gradient}`} />

                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                    <span>{post.date}</span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readTime} read
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {post.description}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition-colors">
                    Read article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Ready to Upskill?</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Our courses cover everything in these articles and more -- with video demonstrations, interactive assessments, and AHPRA-aligned CPD certification.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training (2 CPD)
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
                Full Course (14 CPD) — ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
