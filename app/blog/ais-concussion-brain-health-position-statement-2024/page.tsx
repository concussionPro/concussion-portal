import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, CheckCircle, Users, Activity, Brain, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const metadata: Metadata = {
  title: 'AIS Concussion and Brain Health Position Statement 2024: Key Takeaways for Clinicians',
  description: 'The Australian Institute of Sport released its Concussion and Brain Health Position Statement in February 2024, introducing a 21-day stand-down for youth sport and expanding the role of physiotherapists. Here\'s what clinicians need to know.',
  keywords: 'AIS concussion position statement 2024, concussion brain health australia, 21 day stand down concussion, physiotherapist concussion role, concussion guidelines australia 2024, sport concussion australia',
  openGraph: {
    title: 'AIS Concussion and Brain Health Position Statement 2024: Key Takeaways for Clinicians',
    description: 'The AIS Position Statement introduces a 21-day stand-down for youth sport and formally expands the role of physiotherapists in concussion management.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/ais-concussion-brain-health-position-statement-2024',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/ais-concussion-brain-health-position-statement-2024',
  },
}

export default function AISPositionStatementPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'AIS Concussion and Brain Health Position Statement 2024: Key Takeaways for Clinicians',
            description: 'The Australian Institute of Sport released its Concussion and Brain Health Position Statement in February 2024, introducing a 21-day stand-down for youth sport and expanding the role of physiotherapists in concussion management.',
            datePublished: '2026-03-18',
            dateModified: '2026-03-18',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/ais-concussion-brain-health-position-statement-2024',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-600 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Policy Analysis -- March 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AIS Concussion and Brain Health Position Statement 2024: Key Takeaways for Clinicians
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              Released in February 2024, the Position Statement aligns Australia with the UK and New Zealand on concussion management &mdash; and formally recognises physiotherapists as first-line concussion care providers.
            </p>
            <div className="flex items-center gap-3 text-blue-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis -- March 18, 2026 -- 10 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Australia&apos;s Concussion Framework, Explained
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                On 1 February 2024, the Australian Institute of Sport (AIS) released the <strong>Concussion and Brain Health Position Statement 2024</strong> (CBHPS24). Developed in collaboration with the Australian Physiotherapy Association and Sports Medicine Australia, and funded by the Australian Government, this document has become the reference framework for concussion management across Australian sport.
              </p>
              <p>
                Since its release, <strong>more than 30 National Sporting Organisations</strong> &mdash; including the AFL, Rugby Australia, Football Australia, Equestrian Australia, and Athletics Australia &mdash; have endorsed and adopted the guidelines. Sport Integrity Australia&apos;s CEO publicly stated that the guidelines &ldquo;should be adopted by all National Sporting Organisations.&rdquo;
              </p>
              <p>
                For allied health practitioners, this is the single most important Australian concussion policy document of the past decade. Here are the key changes you need to understand.
              </p>
            </div>
          </div>

          {/* Key Change 1: 21-day stand-down */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                1. Minimum 21-Day Stand-Down for Youth and Community Sport
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The headline change: athletes under 19 and <strong>all community-level athletes</strong> (regardless of age) must observe a minimum 21-day stand-down from the date of concussion before returning to competitive contact or collision sport. This aligns Australia with the UK and New Zealand guidelines.
              </p>
              <p>
                Within this window, athletes must be <strong>symptom-free at rest for 14 consecutive days</strong> before progressing to contact training, and must obtain written medical clearance before returning to competition.
              </p>
              <p>
                Elite athletes with access to &ldquo;Advanced Care Settings&rdquo; &mdash; defined as constant medical monitoring by club-employed professionals &mdash; may follow a shorter minimum 12-day protocol with an 11-step graded return process.
              </p>
              <p>
                For a detailed breakdown of the stand-down rules by sport, see our article on the <Link href="/blog/21-day-concussion-stand-down-youth-sport-australia" className="text-blue-600 hover:underline font-medium">21-day stand-down in youth sport</Link>.
              </p>
            </div>
          </div>

          {/* Key Change 2: Physiotherapist role */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-emerald-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                2. Expanded Role of Physiotherapists
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                This is perhaps the most significant change for allied health professionals. The 2024 Position Statement explicitly expands the recognised role of physiotherapists in concussion management to include:
              </p>
              <div className="space-y-3 my-6">
                {[
                  { label: 'First point of contact', desc: 'Especially in community sport where team doctors are not available' },
                  { label: 'Early detection', desc: 'Observing evolving concussion symptoms on the field and sideline' },
                  { label: 'Guiding return to sport', desc: 'Managing athletes through the Graded Return to Sport protocol in uncomplicated cases' },
                  { label: 'Vestibular and oculomotor assessment', desc: 'Management of VOM dysfunction in initial and early post-concussion assessment' },
                  { label: 'Clinical review', desc: 'Reviewing cases that are not progressing as expected through the graded return' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900">{item.label}:</strong>{' '}
                      <span className="text-slate-600">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p>
                The Position Statement describes physiotherapists as &ldquo;indispensable&rdquo; in both the immediate response and long-term management of concussion. This language is notable because it goes well beyond previous guidelines, which positioned allied health practitioners primarily in supporting roles.
              </p>
              <p>
                While the Position Statement names physiotherapists specifically, the clinical skills involved &mdash; SCAT6 administration, VOMS screening, BESS testing, and graded return protocols &mdash; are relevant across allied health disciplines including osteopathy, chiropractic, and exercise physiology.
              </p>
            </div>
          </div>

          {/* Key Change 3: Graded Return */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                3. Active Recovery Replaces Complete Rest
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Consistent with the Amsterdam Consensus, the Position Statement recommends a graded approach to recovery rather than strict rest:
              </p>
              <ol className="space-y-3 my-6 list-decimal list-inside">
                <li>Initial 24&ndash;48 hours of relative rest (not total sensory deprivation)</li>
                <li>Introduction of light exercise (walking, swimming) as tolerated</li>
                <li>Gradual reintroduction of cognitive stimulation after 48 hours</li>
                <li>Progressive increase in exercise intensity with symptom monitoring</li>
                <li>14 days symptom-free at rest before any contact training</li>
                <li>Written medical clearance before competitive return</li>
              </ol>
              <p>
                An important clinical nuance: the guidelines acknowledge that <strong>temporary, mild symptom exacerbation during exercise is acceptable</strong>, provided symptoms resolve quickly after cessation. This represents a shift from the historical approach where any symptom provocation was grounds for regression.
              </p>
            </div>
          </div>

          {/* Key Change 4: Broader scope */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-700" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                4. New Guidance for Specific Populations
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The 2024 Position Statement includes new guidance on populations that were underserved by previous concussion frameworks:
              </p>
              <ul className="space-y-3 my-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div><strong>Female athletes:</strong> Recognition that concussion may present differently and that management protocols should account for sex-based differences in symptom profiles and recovery trajectories.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div><strong>Para-athletes:</strong> Specific guidance for managing concussion in athletes with disabilities, acknowledging unique diagnostic and management considerations.</div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div><strong>Multiple concussions:</strong> Best practice for athletes with repeated concussions, including long-term brain health considerations.</div>
                </li>
              </ul>
              <p>
                The Position Statement also recommends the establishment of a &ldquo;Concussion Officer&rdquo; role in schools and community clubs &mdash; a designated point person for implementing concussion policy and coordinating return-to-play decisions.
              </p>
            </div>
          </div>

          {/* What this means for practitioners */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              What This Means for Your CPD Planning
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The Position Statement creates clear expectations for clinicians working with active populations. The explicit recognition of physiotherapists as first-line concussion care providers &mdash; and the expansion of assessment responsibilities to include vestibular-ocular screening &mdash; makes concussion education a defensible, high-value CPD investment.
              </p>
              <p>
                For AHPRA-registered practitioners, logging concussion education as CPD under &ldquo;Educational Activity &mdash; Reviewing &amp; Reflecting&rdquo; is straightforward and directly aligns with the evolving scope of practice expectations outlined in this document.
              </p>
              <p>
                For more on CPD requirements across disciplines, see our guide to <Link href="/blog/ahpra-cpd-requirements-concussion-education" className="text-blue-600 hover:underline font-medium">AHPRA CPD requirements and concussion education</Link>.
              </p>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                Australian Institute of Sport (2024). Concussion and Brain Health Position Statement 2024.{' '}
                <a href="https://www.ausport.gov.au/concussion" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ausport.gov.au</a>
              </li>
              <li>
                Australian Physiotherapy Association (2024). New guidelines &ldquo;game-changing&rdquo; for concussion and brain health care.{' '}
                <a href="https://australian.physio/media/new-guidelines-game-changing-concussion-and-brain-health-care-launched" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">australian.physio</a>
              </li>
              <li>
                Sports Medicine Australia (2024). New concussion guidelines launched today.{' '}
                <a href="https://sma.org.au/new-concussion-guidelines-launched-today/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sma.org.au</a>
              </li>
              <li>
                Sport Integrity Australia (2024). Concussion guidelines should be adopted by all National Sporting Organisations.{' '}
                <a href="https://www.sportintegrity.gov.au/news/media-statements/2024-02/concussion-guidelines-should-be-adopted-all-national-sporting-organisations-sport-integrity-australia-ceo" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sportintegrity.gov.au</a>
              </li>
              <li>
                Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport -- Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695-711.
              </li>
            </ul>
          </div>

          <RelatedPosts slugs={['21-day-stand-down', 'ahpra-cpd', 'nsw-combat-sports']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Master the Skills These Guidelines Expect</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Our courses cover SCAT6 administration, VOMS screening, BESS balance testing, and the graded return-to-sport protocol &mdash; the exact skills the AIS Position Statement identifies as essential for frontline concussion care.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
                Full Course ({CONFIG.COURSE.TOTAL_CPD_POINTS} CPD) &mdash; ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
