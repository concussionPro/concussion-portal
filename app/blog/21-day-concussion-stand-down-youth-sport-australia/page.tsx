import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, CheckCircle, AlertTriangle, Timer, Users } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const metadata: Metadata = {
  title: '21-Day Concussion Stand-Down in Youth Sport: What Every Australian Clinician Should Know',
  description: 'Australia\'s 21-day mandatory stand-down after concussion in youth and community sport is now the national standard. Understand the rules, which sports enforce them, and what clinicians need to do.',
  keywords: '21 day concussion stand down australia, concussion return to play youth sport, AFL concussion protocol, rugby concussion stand down, community sport concussion rules, concussion management australia',
  openGraph: {
    title: '21-Day Concussion Stand-Down in Youth Sport: What Every Australian Clinician Should Know',
    description: 'Australia\'s 21-day mandatory stand-down after concussion in youth and community sport is now the national standard. Here\'s what clinicians need to know.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/21-day-concussion-stand-down-youth-sport-australia',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/21-day-concussion-stand-down-youth-sport-australia',
  },
}

export default function StandDownPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: '21-Day Concussion Stand-Down in Youth Sport: What Every Australian Clinician Should Know',
            description: 'Australia\'s 21-day mandatory stand-down after concussion in youth and community sport is now the national standard. Understand the rules, which sports enforce them, and what clinicians need to do.',
            datePublished: '2026-03-18',
            dateModified: '2026-03-18',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/21-day-concussion-stand-down-youth-sport-australia',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white pt-[80px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Clinical Guide -- March 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              21-Day Concussion Stand-Down in Youth Sport: What Every Australian Clinician Should Know
            </h1>
            <p className="text-xl text-emerald-100 mb-4">
              Since the AIS Position Statement in February 2024, a minimum 21-day stand-down after concussion has become the national standard for youth and community sport. Here&apos;s how it works and what it means for your clinical decisions.
            </p>
            <div className="flex items-center gap-3 text-emerald-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis -- March 18, 2026 -- 9 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Rule and Why It Exists
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The <strong>Concussion and Brain Health Position Statement 2024</strong>, released by the Australian Institute of Sport (AIS) in collaboration with the Australian Physiotherapy Association and Sports Medicine Australia, established a clear minimum recovery timeline for concussion in non-elite settings:
              </p>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 my-6">
                <div className="flex items-start gap-4">
                  <Timer className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-bold text-slate-900 text-lg mb-2">Minimum 21 days from the date of concussion to return to competitive contact/collision sport</p>
                    <p className="text-slate-600">Applies to all athletes under 19 years of age AND all community-level athletes regardless of age.</p>
                  </div>
                </div>
              </div>
              <p>
                This guideline aligns Australia with the UK and New Zealand, both of which adopted similar stand-down periods. The rationale is straightforward: community and youth athletes typically do not have access to the constant medical monitoring available at elite level. The 21-day minimum provides a safety margin that accounts for this difference.
              </p>
            </div>
          </div>

          {/* The requirements in detail */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              The Requirements in Detail
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The 21-day figure is the minimum time to competitive return. Within that window, several conditions must be met:
              </p>
              <div className="space-y-4 my-6">
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <strong className="text-slate-900">14 days symptom-free at rest</strong>
                    <p className="text-slate-600 mt-1">The athlete must be completely symptom-free at rest for 14 consecutive days before progressing to contact training.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <strong className="text-slate-900">Graded return to sport</strong>
                    <p className="text-slate-600 mt-1">Each step in the graded return requires a minimum of 24 hours before progression. Any return of symptoms during a step requires regression and re-assessment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <strong className="text-slate-900">Written medical clearance</strong>
                    <p className="text-slate-600 mt-1">A healthcare professional must provide written clearance before the athlete returns to competitive contact or collision sport.</p>
                  </div>
                </div>
              </div>
              <p>
                It&apos;s worth noting that temporary, mild symptom provocation during graduated exercise is considered acceptable under the guidelines &mdash; provided symptoms resolve quickly after stopping. This is consistent with the Amsterdam Consensus position on active recovery.
              </p>
            </div>
          </div>

          {/* Sport by sport */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              How Major Sports Have Adopted the Guidelines
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Over 30 National Sporting Organisations have adopted the AIS guidelines. Here is how the major contact sports have implemented them:
              </p>
              <div className="overflow-x-auto my-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-4 font-bold text-slate-900">Sport</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-900">Elite/Professional</th>
                      <th className="text-left py-3 px-4 font-bold text-slate-900">Community/Youth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-medium">AFL / AFLW</td>
                      <td className="py-3 px-4">12-day minimum (Advanced Care Settings, 11-step protocol)</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">21-day minimum</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-3 px-4 font-medium">Rugby Australia</td>
                      <td className="py-3 px-4">12 days (adults 19+)</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">21 days (under 18s)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">NRL</td>
                      <td className="py-3 px-4">11-day minimum stand-down</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700">Extended protocols (children/adolescents)</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-3 px-4 font-medium">Equestrian Australia</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700" colSpan={2}>21-day minimum at all levels</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium">Football Australia</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700" colSpan={2}>AIS framework adopted</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="py-3 px-4 font-medium">Athletics Australia</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700" colSpan={2}>AIS 21-day guidelines endorsed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The distinction between elite and community timelines exists because elite athletes have access to constant medical monitoring by club doctors and sports medicine professionals (&ldquo;Advanced Care Settings&rdquo;). Community and youth athletes typically do not have this level of oversight.
              </p>
            </div>
          </div>

          {/* Why clubs need qualified assessors */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Why Clubs Need Access to Qualified Assessors</h3>
                <div className="space-y-3 text-slate-700 leading-relaxed">
                  <p>
                    The 21-day rule creates a practical problem for community clubs: someone needs to make the initial concussion assessment, guide the athlete through the graded return, and provide the written medical clearance at the end. At elite level, this is handled by team doctors. At community level, it often falls to the nearest available health professional.
                  </p>
                  <p>
                    This is why the <Link href="/blog/ais-concussion-brain-health-position-statement-2024" className="text-blue-600 hover:underline font-medium">AIS Position Statement</Link> explicitly expanded the role of physiotherapists as first-line concussion care providers. In practice, osteopaths, chiropractors, and exercise physiologists working with community sports teams are also being asked to fill this role.
                  </p>
                  <p>
                    If you&apos;re a clinician connected to a community sports club, you&apos;re likely the person parents and coaches will turn to. Being confident in SCAT6 administration, symptom monitoring, and graded return protocols is becoming an expectation, not a specialisation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* If in doubt, sit them out */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              The &ldquo;If in Doubt, Sit Them Out&rdquo; Principle
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The AIS Position Statement reinforces a simple decision rule: <strong>if there is any suspicion of concussion, the athlete must be immediately removed from the field of play</strong>. They must not return to activity that day.
              </p>
              <p>
                This is not new guidance, but the formalisation of the 21-day minimum gives it practical teeth. Previously, &ldquo;sit them out&rdquo; could mean anything from 48 hours to several weeks, depending on who was making the call. Now, it means a minimum of 21 days for anyone outside an Advanced Care Setting &mdash; with structured requirements at each stage.
              </p>
              <p>
                For the clinician, the message is clear: conservative early management is not just best practice &mdash; it&apos;s the documented national standard.
              </p>
            </div>
          </div>

          {/* Clinical skills you need */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Clinical Skills the 21-Day Protocol Demands
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Managing an athlete through the 21-day stand-down protocol requires competency in several assessment areas:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-6">
                {[
                  'SCAT6 / SCOAT6 administration and interpretation',
                  'VOMS (Vestibular/Ocular Motor Screening)',
                  'BESS (Balance Error Scoring System)',
                  'Graded return-to-sport protocol management',
                  'Symptom tracking and clinical documentation',
                  'Recognising red flags for specialist referral',
                ].map((skill) => (
                  <div key={skill} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{skill}</span>
                  </div>
                ))}
              </div>
              <p>
                These are not specialised neurology skills &mdash; they are structured assessment protocols that any allied health practitioner can learn and apply. The challenge is not complexity; it&apos;s having formal training in the standardised approach, which is what the AIS guidelines now expect.
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
                AFL (2024). Community football to adopt minimum 21-day return to play protocols.{' '}
                <a href="https://www.afl.com.au/news/1082723/community-football-to-adopt-minimum-21-day-return-to-play-protocols" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">afl.com.au</a>
              </li>
              <li>
                Equestrian Australia (2024). New concussion stand-down periods.{' '}
                <a href="https://www.equestrian.org.au/news/new-concussion-stand-down-periods" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">equestrian.org.au</a>
              </li>
              <li>
                Rugby Australia. Concussion Management.{' '}
                <a href="https://australia.rugby/about/codes-and-policies/safety-and-welfare/concussion-management" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">australia.rugby</a>
              </li>
              <li>
                Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport -- Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695-711.
              </li>
            </ul>
          </div>

          <RelatedPosts slugs={['ais-position-statement', 'return-to-play', 'ahpra-cpd']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Confident Concussion Assessment Starts Here</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Learn the structured assessment skills the 21-day protocol requires &mdash; SCAT6 administration, VOMS screening, BESS testing, and graded return-to-sport management. AHPRA-aligned CPD with Osteopathy Australia endorsement.
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
