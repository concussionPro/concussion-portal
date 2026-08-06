import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, CheckCircle, BookOpen, Award, FileText } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

// Regulator-published annual CPD requirements. These are NOT CEA numbers — they
// come from the Board / ESSA guidelines linked in the References block below.
// Held as named constants so the worked percentages in the copy can never drift
// from the figures in the "At a Glance" table (they were three independent
// literals, and the osteopathy one shipped stale after the practical day was
// re-rated to CONFIG.COURSE.IN_PERSON_CPD_POINTS).
const PHYSIO_ANNUAL_HOURS = 20
const OSTEO_ANNUAL_HOURS = 25
const OSTEO_MANDATORY_HOURS = 4
const CHIRO_ANNUAL_HOURS = 20
const ESSA_ANNUAL_POINTS = 20
const ESSA_FURTHER_ED_POINTS = 15

export const metadata: Metadata = {
  title: 'AHPRA CPD Requirements for Allied Health: Where Concussion Education Fits',
  description: 'A practical guide to annual CPD requirements for physiotherapists, osteopaths, chiropractors, and exercise physiologists — and how concussion management training counts toward your obligations.',
  keywords: 'AHPRA CPD requirements, physiotherapy CPD hours, osteopathy CPD requirements, chiropractic CPD australia, ESSA CPD hours, concussion CPD australia, allied health CPD, AHPRA audit CPD',
  openGraph: {
    title: 'AHPRA CPD Requirements for Allied Health: Where Concussion Education Fits',
    description: 'Annual CPD requirements for physios, osteos, chiros, and EPs — and how concussion education counts toward your obligations.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/ahpra-cpd-requirements-concussion-education',
    images: ['/og-image.jpg'],
    publishedTime: '2026-03-18',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/ahpra-cpd-requirements-concussion-education',
  },
}

export default function AHPRACPDPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'AHPRA CPD Requirements for Allied Health: Where Concussion Education Fits',
            description: 'A practical guide to annual CPD requirements for physiotherapists, osteopaths, chiropractors, and exercise physiologists — and how concussion management training counts toward your obligations.',
            datePublished: '2026-03-18',
            dateModified: '2026-03-18',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/ahpra-cpd-requirements-concussion-education',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-500 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              CPD Guide -- March 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AHPRA CPD Requirements for Allied Health: Where Concussion Education Fits
            </h1>
            <p className="text-xl text-violet-100 mb-4">
              A practical guide to annual CPD obligations for physiotherapists, osteopaths, chiropractors, and exercise physiologists &mdash; and how structured concussion education counts toward them.
            </p>
            <div className="flex items-center gap-3 text-violet-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis &mdash; Osteopath (AHPRA-registered) &mdash; March 18, 2026 &mdash; 8 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              CPD Is Not Just a Box to Tick
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Every AHPRA-registered practitioner knows they need to complete continuing professional development each year. But with annual renewal approaching (registration runs 1 December to 30 November for most disciplines), the practical questions are always the same: how many hours do I need? What counts? And how do I choose CPD that actually improves my clinical practice rather than just meeting the minimum?
              </p>
              <p>
                This guide covers the CPD requirements for the four allied health disciplines most commonly involved in concussion management &mdash; physiotherapy, osteopathy, chiropractic, and exercise physiology &mdash; and explains how concussion education fits within each framework.
              </p>
            </div>
          </div>

          {/* Requirements by profession */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              CPD Requirements by Profession
            </h2>

            {/* Physiotherapy */}
            <div className="mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Physiotherapists</h3>
                  <p className="text-sm text-slate-500">Physiotherapy Board of Australia / AHPRA</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Minimum:</strong> {PHYSIO_ANNUAL_HOURS} hours of CPD per year (pro rata: 5 hours per 3-month period for mid-cycle registrants)</span>
                </div>
                <p>
                  CPD activities can be <strong>formal</strong> (accredited courses, conferences, seminars, online learning, in-service education) or <strong>non-formal</strong> (reflective practice, journal reading, quality assurance activities, peer discussion). A CPD portfolio must be maintained for 5 years and is subject to Board audit.
                </p>
                <p>
                  <strong>How concussion education fits:</strong> Structured online courses with assessment components qualify as formal learning activities. A {CONFIG.COURSE.ONLINE_CPD_POINTS}-hour online course covering SCAT6, VOMS, BESS, and return-to-play protocols would count as {CONFIG.COURSE.ONLINE_CPD_POINTS} hours of formal CPD &mdash; {Math.round((CONFIG.COURSE.ONLINE_CPD_POINTS / PHYSIO_ANNUAL_HOURS) * 100)}% of the annual requirement in a single activity.
                </p>
              </div>
            </div>

            {/* Osteopathy */}
            <div className="mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Osteopaths</h3>
                  <p className="text-sm text-slate-500">Osteopathy Board of Australia / AHPRA</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                  <Award className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Minimum:</strong> {OSTEO_ANNUAL_HOURS} hours of CPD per year (including {OSTEO_MANDATORY_HOURS} mandatory hours on Board standards, codes, and the National Law)</span>
                </div>
                <p>
                  CPD is categorised as <strong>Learning with Others</strong> (courses, conferences, webinars, coaching, peer review) and <strong>Learning by Oneself</strong> (journal reading, distance learning, publications). Osteopaths must also hold a current Senior First Aid (Level 2) certificate, renewed every 3 years &mdash; this does not count toward the {OSTEO_ANNUAL_HOURS} hours. Portfolios are retained for 5 years.
                </p>
                <p>
                  <strong>How concussion education fits:</strong> Online concussion courses qualify under &ldquo;Learning by Oneself&rdquo; (distance learning). A hands-on workshop qualifies under &ldquo;Learning with Others.&rdquo; Combined, a {CONFIG.COURSE.ONLINE_CPD_POINTS}-hour online + {CONFIG.COURSE.IN_PERSON_CPD_POINTS}-hour workshop covers {CONFIG.COURSE.TOTAL_CPD_POINTS} of the {OSTEO_ANNUAL_HOURS} required hours &mdash; {Math.round((CONFIG.COURSE.TOTAL_CPD_POINTS / OSTEO_ANNUAL_HOURS) * 100)}% of annual obligations.
                </p>
              </div>
            </div>

            {/* Chiropractic */}
            <div className="mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Chiropractors</h3>
                  <p className="text-sm text-slate-500">Chiropractic Board of Australia / AHPRA</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <Award className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Minimum:</strong> {CHIRO_ANNUAL_HOURS} hours of CPD per year (reduced from 25 hours under the revised standard effective December 2019)</span>
                </div>
                <p>
                  The Chiropractic Board no longer categorises CPD into &ldquo;formal&rdquo; and &ldquo;informal&rdquo; learning. Instead, practitioners must develop learning goals, plan CPD activities to meet those goals, and reflect on how the learning will improve their practice. Chiropractors must also hold a current Level 2 / Senior First Aid certificate.
                </p>
                <p>
                  <strong>How concussion education fits:</strong> If you treat active or sporting populations, concussion management directly aligns with defensible learning goals. The goal-oriented CPD framework makes it straightforward to justify: &ldquo;improve my ability to recognise and manage sport-related concussion using standardised assessment tools.&rdquo;
                </p>
              </div>
            </div>

            {/* Exercise Physiology */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-rose-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Exercise Physiologists</h3>
                  <p className="text-sm text-slate-500">ESSA (Exercise & Sports Science Australia) &mdash; self-regulated</p>
                </div>
              </div>
              <div className="space-y-3 text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg">
                  <Award className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Minimum:</strong> {ESSA_ANNUAL_POINTS} CPD hours per calendar year (1 hour = 1 point). At least {ESSA_FURTHER_ED_POINTS} points must be from the Further Education category.</span>
                </div>
                <p>
                  <strong>Important distinction:</strong> Exercise physiologists are <strong>not AHPRA-regulated</strong>. They are self-regulated through ESSA, which is part of the National Alliance of Self-Regulating Health Professions (NASRHP). ESSA uses standards closely modelled on AHPRA&apos;s framework. The registration period runs on a calendar year (January to December), not the December&ndash;November AHPRA cycle.
                </p>
                <p>
                  <strong>How concussion education fits:</strong> Structured courses with assessments qualify under the Further Education category. A {CONFIG.COURSE.ONLINE_CPD_POINTS}-hour online course would count as {CONFIG.COURSE.ONLINE_CPD_POINTS} of the required {ESSA_FURTHER_ED_POINTS} Further Education points &mdash; over half the mandatory category in a single activity.
                </p>
              </div>
            </div>
          </div>

          {/* Summary table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              At a Glance
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 font-bold text-slate-900">Profession</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">Regulator</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">Annual Requirement</th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">Registration Cycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-medium">Physiotherapist</td>
                    <td className="py-3 px-4">AHPRA</td>
                    <td className="py-3 px-4">{PHYSIO_ANNUAL_HOURS} hours</td>
                    <td className="py-3 px-4">1 Dec &ndash; 30 Nov</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-3 px-4 font-medium">Osteopath</td>
                    <td className="py-3 px-4">AHPRA</td>
                    <td className="py-3 px-4">{OSTEO_ANNUAL_HOURS} hours (incl. {OSTEO_MANDATORY_HOURS} mandatory)</td>
                    <td className="py-3 px-4">1 Dec &ndash; 30 Nov</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Chiropractor</td>
                    <td className="py-3 px-4">AHPRA</td>
                    <td className="py-3 px-4">{CHIRO_ANNUAL_HOURS} hours</td>
                    <td className="py-3 px-4">Annual</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-3 px-4 font-medium">Exercise Physiologist</td>
                    <td className="py-3 px-4">ESSA (self-regulated)</td>
                    <td className="py-3 px-4">{ESSA_ANNUAL_POINTS} points ({ESSA_FURTHER_ED_POINTS} Further Ed)</td>
                    <td className="py-3 px-4">Jan &ndash; Dec</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Why concussion education is high-value CPD */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Why Concussion Education Is Particularly High-Value CPD Right Now
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Not all CPD is equal in terms of clinical impact. Here&apos;s why concussion management sits at the intersection of regulatory relevance, clinical need, and professional opportunity:
              </p>
              <div className="space-y-4 my-6">
                <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-lg border border-violet-100">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Regulatory momentum:</strong>{' '}
                    <span className="text-slate-600">
                      The <Link href="/blog/ais-concussion-brain-health-position-statement-2024" className="text-blue-600 hover:underline">AIS Position Statement</Link> and <Link href="/blog/nsw-mandatory-concussion-training-combat-sports" className="text-blue-600 hover:underline">NSW combat sports legislation</Link> signal a clear trajectory toward mandatory concussion competency.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-lg border border-violet-100">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Clinical demand:</strong>{' '}
                    <span className="text-slate-600">
                      The <Link href="/blog/21-day-concussion-stand-down-youth-sport-australia" className="text-blue-600 hover:underline">21-day stand-down rule</Link> means community clubs need local clinicians who can assess concussion and manage the graded return. If you treat active populations, the referrals are coming whether you&apos;re ready or not.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-lg border border-violet-100">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Efficient CPD coverage:</strong>{' '}
                    <span className="text-slate-600">
                      A structured concussion course can cover {CONFIG.COURSE.ONLINE_CPD_POINTS} hours of your annual requirement online &mdash; or up to {CONFIG.COURSE.TOTAL_CPD_POINTS} hours with an added in-person workshop day &mdash; in a single, cohesive learning activity, rather than cobbling together unrelated webinars.
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-violet-50 rounded-lg border border-violet-100">
                  <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Audit-ready documentation:</strong>{' '}
                    <span className="text-slate-600">
                      Courses that issue certificates with CPD hours and completion dates make AHPRA audit compliance straightforward &mdash; no need to self-document informal learning.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How to log it */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                How to Log Concussion Education for AHPRA
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                When adding concussion education to your CPD portfolio, log it as:
              </p>
              <div className="bg-violet-50 border-2 border-violet-200 rounded-xl p-6 my-6">
                <ul className="space-y-2 text-sm">
                  <li><strong>Activity type:</strong> Educational Activity &mdash; Reviewing &amp; Reflecting</li>
                  <li><strong>Category:</strong> Formal learning (for accredited/structured courses with assessment)</li>
                  <li><strong>Hours:</strong> As per course certificate (e.g., {CONFIG.COURSE.ONLINE_CPD_POINTS} hours for online, {CONFIG.COURSE.TOTAL_CPD_POINTS} hours for online + workshop)</li>
                  <li><strong>Evidence:</strong> Certificate of completion with CPD hours, certificate ID, and completion date</li>
                  <li><strong>Retention:</strong> Keep certificates in your CPD portfolio for at least 5 years</li>
                </ul>
              </div>
              <p>
                For exercise physiologists logging through ESSA, structured online courses count under the Further Education category. The same completion certificate serves as evidence.
              </p>
              <p>
                Looking for practical tools to pair with your CPD? Browse our <Link href="/resources" className="text-blue-600 hover:underline font-medium">free clinical resources</Link> &mdash; including the <Link href="/scat6-download" className="text-blue-600 hover:underline font-medium">fillable SCAT6 PDF</Link> and the answers to common questions in our <Link href="/faq/scat-assessment" className="text-blue-600 hover:underline font-medium">SCAT assessment FAQ</Link>.
              </p>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                AHPRA (2024). Continuing Professional Development.{' '}
                <a href="https://www.ahpra.gov.au/Registration/Continuing-Professional-Development.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ahpra.gov.au</a>
              </li>
              <li>
                Physiotherapy Board of Australia. CPD Guidelines.{' '}
                <a href="https://www.physiotherapyboard.gov.au/codes-guidelines/cpd-guidelines.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">physiotherapyboard.gov.au</a>
              </li>
              <li>
                Osteopathy Board of Australia. CPD Resources.{' '}
                <a href="https://www.osteopathyboard.gov.au/Registration-Standards/CPD-resources.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">osteopathyboard.gov.au</a>
              </li>
              <li>
                Chiropractic Board of Australia. Continuing Professional Development FAQ.{' '}
                <a href="https://www.chiropracticboard.gov.au/Codes-guidelines/FAQ/Continuing-professional-development.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">chiropracticboard.gov.au</a>
              </li>
              <li>
                ESSA. CPD Hours Guidelines.{' '}
                <a href="https://www.essa.org.au/Public/Public/PROFESSIONAL_DEVELOPMENT/Continuing_Professional_Development__CPD__Points_Guidelines.aspx" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">essa.org.au</a>
              </li>
            </ul>
          </div>

          <RelatedPosts slugs={['21-day-stand-down', 'ais-position-statement', 'nsw-combat-sports']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Make Your CPD Count</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Concussion Education Australia delivers structured concussion education with CPD hours that count toward your AHPRA registration requirements &mdash; and certificates that are ready for your CPD portfolio. Endorsed by Osteopathy Australia.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all text-center">
                Full Course &mdash; {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hrs online, up to {CONFIG.COURSE.TOTAL_CPD_POINTS} with the in-person day &middot; from ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early-bird
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
