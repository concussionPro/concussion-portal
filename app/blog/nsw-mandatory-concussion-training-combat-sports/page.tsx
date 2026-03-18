import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, CheckCircle, AlertTriangle, FileText, Shield } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'NSW Mandatory Concussion Training for Combat Sports: What Clinicians Need to Know',
  description: 'The Combat Sports Amendment Act 2024 requires all NSW combat sports participants to complete mandatory concussion training by 31 December 2025. Here\'s what it means for healthcare professionals working in combat sports.',
  keywords: 'NSW concussion training, combat sports concussion, mandatory concussion training australia, Combat Sports Amendment Act 2024, combat sports medical practitioner, concussion education NSW',
  openGraph: {
    title: 'NSW Mandatory Concussion Training for Combat Sports: What Clinicians Need to Know',
    description: 'The Combat Sports Amendment Act 2024 requires all NSW combat sports participants to complete mandatory concussion training by 31 December 2025.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/nsw-mandatory-concussion-training-combat-sports',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/nsw-mandatory-concussion-training-combat-sports',
  },
}

export default function NSWConcussionTrainingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'NSW Mandatory Concussion Training for Combat Sports: What Clinicians Need to Know',
            description: 'The Combat Sports Amendment Act 2024 requires all NSW combat sports participants to complete mandatory concussion training by 31 December 2025. Here\'s what it means for healthcare professionals.',
            datePublished: '2026-03-18',
            dateModified: '2026-03-18',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/nsw-mandatory-concussion-training-combat-sports',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-red-600 to-orange-500 text-white pt-[80px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Regulation Update -- March 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              NSW Mandatory Concussion Training for Combat Sports: What Clinicians Need to Know
            </h1>
            <p className="text-xl text-red-100 mb-4">
              The Combat Sports Amendment Act 2024 introduced mandatory concussion training for everyone involved in combat sports in NSW. Here&apos;s what changed, who it affects, and why it matters beyond the ring.
            </p>
            <div className="flex items-center gap-3 text-red-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis -- March 18, 2026 -- 8 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              A Regulatory First for Australian Sport
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                On 3 April 2024, the NSW Government passed the <strong>Combat Sports Amendment Act 2024</strong>, amending the Combat Sports Act 2013. Among the reforms is a requirement that caught the attention of the broader sports medicine community: <strong>mandatory concussion training for all registered combat sports participants</strong>.
              </p>
              <p>
                This is significant not because the training itself is onerous &mdash; it&apos;s free and takes about 20 minutes &mdash; but because it represents the first time an Australian jurisdiction has legislated compulsory concussion education for sports participants. For clinicians working in or around combat sports, understanding these changes is essential. For those working in other sports, it signals where regulation may be heading.
              </p>
            </div>
          </div>

          {/* Who is affected */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Who Is Affected?
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The training requirement applies to <strong>every registered individual</strong> within NSW combat sports. That includes:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-6">
                {[
                  'Registered combatants',
                  'Trainers and seconds',
                  'Managers and matchmakers',
                  'Promoters',
                  'Accredited Attending Medical Practitioners',
                  'Registered referees and inspectors',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <p>
                The sports covered by the NSW Combat Sports Authority include <strong>boxing, kickboxing, Muay Thai, mixed martial arts (including Pankration)</strong>, and any other form of martial arts that falls within the definition of &ldquo;combat sport&rdquo; under the Act.
              </p>
            </div>
          </div>

          {/* What the training involves */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              What the Training Involves
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The mandatory concussion training is delivered through the NSW Combat Sports Authority and covers the fundamentals: recognising, managing, and responding to concussion risks. The training is structured into modules:
              </p>
              <ul className="space-y-3 my-6">
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Modules 1&ndash;4:</strong> Required for all general participants (combatants, trainers, managers, promoters)</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Module 5:</strong> Additional module for Accredited Attending Medical Practitioners and referees</span>
                </li>
              </ul>
              <p>
                The training is free and takes approximately 20 minutes. If an individual is registered in multiple roles (e.g., both combatant and trainer), the training only needs to be completed once.
              </p>
            </div>
          </div>

          {/* The deadline */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">The Deadline: 31 December 2025</h3>
                <div className="space-y-3 text-slate-700 leading-relaxed">
                  <p>
                    The concussion training provisions commenced on <strong>27 June 2025</strong> (Phase 4 of the reform rollout). All registered individuals had until <strong>31 December 2025</strong> to complete the training.
                  </p>
                  <p>
                    Individuals who did not complete the training by the deadline had their <strong>registration automatically suspended</strong> until they do so. New applicants and those renewing registration must complete the training as part of their application.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Other concussion provisions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Other Concussion Provisions in the Act
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The training requirement sits alongside several other concussion-related reforms introduced by the Amendment Act:
              </p>
              <ul className="space-y-4 my-4">
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Pre-contest medical declaration:</strong> Combatants must declare at their pre-contest medical examination whether they have suffered a concussion in the preceding 30 days.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Automatic medical suspensions after knockouts:</strong> 30, 60, or 90-day stand-downs depending on the frequency and severity of knockout events.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Immediate stoppage for Category 1 head injury signs:</strong> Referees must stop the contest immediately if they observe signs consistent with a serious head injury.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Interstate contest reporting:</strong> Combatants must notify the Authority of any contests held outside NSW within 5 days.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Why this matters beyond combat sports */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Why This Matters Beyond Combat Sports
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The NSW reforms are part of a broader national shift. In February 2024, the Australian Institute of Sport released its <Link href="/blog/ais-concussion-brain-health-position-statement-2024" className="text-blue-600 hover:underline font-medium">Concussion and Brain Health Position Statement</Link>, which introduced a <Link href="/blog/21-day-concussion-stand-down-youth-sport-australia" className="text-blue-600 hover:underline font-medium">minimum 21-day stand-down for youth and community sport</Link>. Over 30 National Sporting Organisations have adopted these guidelines.
              </p>
              <p>
                For clinicians, the direction is clear: concussion education is transitioning from &ldquo;nice to have&rdquo; to &ldquo;required knowledge.&rdquo; Whether you&apos;re an osteopath treating fighters, a physiotherapist working with community rugby teams, or a chiropractor treating weekend athletes, the regulatory environment is increasingly expecting you to demonstrate competence in concussion recognition and management.
              </p>
              <p>
                This aligns with <Link href="/blog/ahpra-cpd-requirements-concussion-education" className="text-blue-600 hover:underline font-medium">AHPRA&apos;s annual CPD requirements</Link>, which expect practitioners to pursue learning activities relevant to their scope of practice. If you&apos;re treating athletes or active populations, concussion management is within that scope.
              </p>
            </div>
          </div>

          {/* What clinicians should do */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              What This Means for Your Practice
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                If you treat athletes in combat sports in NSW, you should already be across the new requirements. But even if your caseload is broader, these reforms are worth noting:
              </p>
              <ol className="space-y-4 my-4 list-decimal list-inside">
                <li>
                  <strong>Regulatory expectations are rising.</strong> State governments are beginning to legislate concussion education. NSW is first, but it&apos;s unlikely to be last.
                </li>
                <li>
                  <strong>Athletes and parents are asking better questions.</strong> Increased media coverage and regulatory action mean your patients are more informed &mdash; and more likely to expect evidence-based management.
                </li>
                <li>
                  <strong>Structured assessment competency is becoming the standard.</strong> Knowing how to administer the SCAT6, conduct a VOMS screen, and apply the BESS is increasingly expected, not optional.
                </li>
              </ol>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                NSW Government (2024). Combat Sports Amendment Act 2024.{' '}
                <a href="https://www.sport.nsw.gov.au/combatsports/legislation/combat-sports-amendment-act-2024" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sport.nsw.gov.au</a>
              </li>
              <li>
                NSW Government (2025). Mandatory Concussion Training for Combat Sports Individuals.{' '}
                <a href="https://www.sport.nsw.gov.au/combatsports/mandatory-concussion-training-for-combat-sports-individuals" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">sport.nsw.gov.au</a>
              </li>
              <li>
                Australian Institute of Sport (2024). Concussion and Brain Health Position Statement.{' '}
                <a href="https://www.ausport.gov.au/concussion" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ausport.gov.au</a>
              </li>
            </ul>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Build Your Concussion Assessment Skills</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Our courses cover SCAT6 administration, VOMS screening, BESS balance testing, and return-to-play protocols &mdash; aligned with AHPRA CPD requirements and the latest Australian guidelines.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training (2 CPD)
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
