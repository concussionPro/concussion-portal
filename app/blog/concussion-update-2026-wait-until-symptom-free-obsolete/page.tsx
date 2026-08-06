import { Metadata } from 'next'
import { createBlogPostSchema, createFAQSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, Activity, Eye, Brain, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const metadata: Metadata = {
  title: '2026 Concussion Update: Why "Wait Until Symptom Free" is Officially Obsolete',
  description: 'Since the Amsterdam consensus statement, concussion management has shifted from passive rest to active rehabilitation. Learn why strict rest beyond 48 hours is now considered harmful, how SCAT6 and SCOAT6 work together, and why vestibular-ocular screening is the new vital sign.',
  keywords: 'concussion management 2026, symptom free concussion, active recovery concussion, SCAT6 vs SCOAT6, vestibular ocular screening, concussion update australia',
  openGraph: {
    title: '2026 Concussion Update: Why "Wait Until Symptom Free" is Officially Obsolete',
    description: 'Since the Amsterdam consensus statement, concussion management has shifted from passive rest to active rehabilitation. Strict rest beyond 48 hours is now considered harmful.',
    type: 'article',
    publishedTime: '2026-01-05',
    images: ['/og-image.jpg'],
    url: 'https://portal.concussion-education-australia.com/blog/concussion-update-2026-wait-until-symptom-free-obsolete',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/concussion-update-2026-wait-until-symptom-free-obsolete',
  },
}

const faqs = [
  {
    question: 'Why is "wait until symptom-free" obsolete in concussion management?',
    answer: 'The Amsterdam 2023 Consensus Statement moved decisively away from prolonged rest. Evidence shows strict rest beyond 48 hours increases the risk of persistent post-concussion symptoms via deconditioning, social isolation, anxiety, and sleep disruption. Randomised controlled trials (Leddy et al., 2019; Willer et al., 2019) demonstrate that early sub-symptom threshold aerobic exercise reduces symptom duration by an average of 4-5 days compared to strict rest. The current standard is 24-48 hours of relative rest, then structured active recovery.',
  },
  {
    question: 'When should clinicians use the SCAT6 versus the SCOAT6?',
    answer: 'SCAT6 is for the acute phase only — sideline, change room, and emergency assessment within 0-72 hours of injury (10-15 minutes). SCOAT6 is the tool for every office-based follow-up from Day 3 onwards (20-30 minutes) and adds the full VOMS battery, neuro-ophthalmological assessment, and cervical spine examination, none of which are in the SCAT6.',
  },
  {
    question: 'What is sub-symptom threshold exercise?',
    answer: 'Physical activity at an intensity that does not provoke or significantly worsen concussion symptoms — for example heart-rate-monitored walking or light stationary cycling at 50-70% of age-predicted maximum heart rate from around Day 3 post-injury. The Buffalo Concussion Treadmill Test (BCTT) provides a validated method for determining an individual patient\'s symptom-exacerbation threshold and prescribing exercise accordingly.',
  },
  {
    question: 'Why is vestibular-ocular screening (VOMS) considered essential?',
    answer: 'Ocular-motor dysfunction is one of the strongest predictors of prolonged concussion recovery — patients with vestibular and oculomotor deficits recover 2-3 times more slowly, yet these deficits are invisible to symptom checklists and cognitive screening. The VOMS takes 5-10 minutes, needs only a target and a ruler, is embedded in the SCOAT6, and identifies patients who need early referral to vestibular physiotherapy or neuro-optometry.',
  },
]

export default function ConcussionUpdate2026Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createFAQSchema(faqs))
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: '2026 Concussion Update: Why "Wait Until Symptom Free" is Officially Obsolete',
            description: 'Since the Amsterdam consensus statement, concussion management has shifted from passive rest to active rehabilitation. Learn the latest evidence on active recovery, SCAT6/SCOAT6 protocols, and vestibular-ocular screening.',
            datePublished: '2026-01-05',
            dateModified: '2026-07-02',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/concussion-update-2026-wait-until-symptom-free-obsolete',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Clinical Update -- January 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              2026 Concussion Update: Why &ldquo;Wait Until Symptom Free&rdquo; is Officially Obsolete
            </h1>
            <p className="text-xl text-amber-100 mb-4">
              Since the Amsterdam consensus statement, the evidence is clear: passive rest beyond 48 hours does more harm than good. Active recovery is the new standard.
            </p>
            <div className="flex items-center gap-3 text-amber-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis — Osteopath (AHPRA-registered) — January 5, 2026 — 10 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Landscape Has Changed
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The 6th International Conference on Concussion in Sport (Amsterdam, October 2022) produced the updated consensus statement, published in the British Journal of Sports Medicine in June 2023. Since then, the global approach to sport-related concussion (SRC) management has undergone a fundamental shift -- one that Australian clinicians must understand and implement.
              </p>
              <p>
                The central message is this: <strong>the era of &ldquo;sit in a dark room until your symptoms go away&rdquo; is over</strong>. In its place, we now have a structured, evidence-based framework that moves from documentation to active rehabilitation. This article summarises the three most important clinical changes that define concussion management in 2026.
              </p>
              <p>
                If your current protocol still centres on complete rest until symptom resolution, you are not only behind the evidence -- you may be inadvertently prolonging your patients&apos; recovery.
              </p>
            </div>
          </div>

          {/* Section 1: 48-Hour Rest Rule is Dead */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Activity className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                The 48-Hour Rest Rule is Dead
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                For over a decade, the standard advice following concussion was strict physical and cognitive rest until all symptoms resolved. The Amsterdam 2023 Consensus Statement changed this decisively. The evidence now shows that <strong>strict rest beyond 48 hours increases the risk of persistent post-concussion symptoms</strong> (formerly &ldquo;post-concussion syndrome&rdquo;).
              </p>
              <p>
                The physiological rationale is straightforward. Prolonged inactivity leads to cardiovascular deconditioning, social isolation, anxiety, depression, and disruption to sleep-wake cycles -- all of which worsen concussion symptoms rather than alleviating them. In other words, the treatment itself becomes the disease.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
                <h3 className="text-lg font-bold text-amber-900 mb-3">The New Timeline</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                    <span><strong>Hours 0-24:</strong> Relative rest. Limit physical and cognitive exertion. Allow light activities of daily living.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                    <span><strong>Hours 24-48:</strong> Gradual reintroduction of light cognitive activity. Screen time as tolerated in short intervals.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                    <span><strong>Day 3 onwards:</strong> Sub-symptom threshold aerobic exercise. Heart-rate-monitored walking. Light stationary cycling at 50-70% of age-predicted maximum heart rate.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                    <span><strong>Day 3-5 onwards:</strong> Structured return-to-learn and return-to-play protocols begin, following the stepwise progression outlined in the Amsterdam Consensus.</span>
                  </li>
                </ul>
              </div>

              <p>
                The key concept is <strong>sub-symptom threshold exercise</strong>. This means physical activity at an intensity that does not provoke or significantly worsen symptoms. Multiple randomised controlled trials (Leddy et al., 2019; Willer et al., 2019) have demonstrated that early, controlled aerobic exercise reduces the duration of concussion symptoms by an average of 4-5 days compared to strict rest protocols.
              </p>
              <p>
                For clinicians, this means prescribing heart-rate-monitored walking by 72 hours post-injury should now be the standard. The Buffalo Concussion Treadmill Test (BCTT) provides a validated method for determining the individual symptom-exacerbation threshold and prescribing exercise accordingly.
              </p>
            </div>
          </div>

          {/* Section 2: SCAT6 vs SCOAT6 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Brain className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                SCAT6 vs SCOAT6: The 72-Hour Switch
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                One of the most significant -- and most commonly misunderstood -- changes from the Amsterdam Consensus is the introduction of a two-tool system. Previously, the SCAT (in its various editions) was used as a single instrument from sideline to follow-up. This is no longer appropriate.
              </p>

              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-blue-900 mb-2">SCAT6: Acute Phase (0-72 hours)</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Sideline and emergency department assessment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Remove-from-play decisions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Red flags, Maddocks, SAC, mBESS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>10-15 minute administration</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-purple-900 mb-2">SCOAT6: Office Phase (Day 3-30)</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Mandatory for all office-based follow-up visits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Full VOMS (Vestibular/Ocular Motor Screening)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>Neuro-ophthalmological and cervical spine assessment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span>20-30 minute comprehensive evaluation</span>
                    </li>
                  </ul>
                </div>
              </div>

              <p>
                The critical rule is simple: <strong>SCAT6 is for the acute phase (sideline to 72 hours). SCOAT6 is mandatory for every office follow-up from Day 3 onwards.</strong> The SCOAT6 is significantly more comprehensive, incorporating a structured neuro-ophthalmological assessment, cervical spine examination, and the full VOMS battery -- none of which are included in the SCAT6.
              </p>
              <p>
                Despite this clear delineation, audit data from Australian primary care suggests that a substantial proportion of GPs continue to use SCAT6 (or older SCAT versions) for all follow-up visits. This represents below standard of care. It misses vestibular and oculomotor dysfunction, cervical spine involvement, and structured return-to-play progression -- all of which are critical for safe management.
              </p>
              <p>
                For any clinician seeing concussed athletes in an office setting after Day 3, the SCOAT6 is not optional. It is the Amsterdam Consensus standard.
              </p>
            </div>
          </div>

          {/* Section 3: Vestibular-Ocular Screening */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Eye className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Vestibular-Ocular Screening: The New Vital Sign
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                If there is a single clinical skill that defines modern concussion management, it is vestibular-ocular motor screening (VOMS). Developed by Mucha et al. (2014) at the University of Pittsburgh, the VOMS has emerged as perhaps the most important advancement in concussion assessment since the introduction of symptom checklists.
              </p>
              <p>
                The rationale is compelling. Research consistently demonstrates that <strong>ocular-motor dysfunction is one of the strongest predictors of prolonged concussion recovery</strong>. Patients with vestibular and oculomotor deficits have recovery times 2-3 times longer than those without. Yet these deficits are entirely invisible to standard symptom checklists and cognitive screening.
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 my-6">
                <h3 className="text-lg font-bold text-orange-900 mb-3">VOMS Components</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-orange-600 flex-shrink-0 mt-1" />
                    <span className="text-sm"><strong>Smooth Pursuits:</strong> Track a moving target horizontally and vertically</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-orange-600 flex-shrink-0 mt-1" />
                    <span className="text-sm"><strong>Saccades:</strong> Rapid eye movements between two fixed targets</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-orange-600 flex-shrink-0 mt-1" />
                    <span className="text-sm"><strong>Near Point of Convergence (NPC):</strong> Ability to converge eyes on an approaching target</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-orange-600 flex-shrink-0 mt-1" />
                    <span className="text-sm"><strong>Vestibulo-Ocular Reflex (VOR):</strong> Gaze stability during head movement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-orange-600 flex-shrink-0 mt-1" />
                    <span className="text-sm"><strong>Visual Motion Sensitivity (VMS):</strong> Response to optic flow stimuli</span>
                  </div>
                </div>
              </div>

              <p>
                The VOMS takes approximately 5-10 minutes to administer and requires no specialised equipment -- only a target (pen tip or fingertip) and a ruler for NPC measurement. It is entirely feasible in a standard clinical setting.
              </p>
              <p>
                Critically, VOMS allows early identification of patients who require specialist referral to vestibular physiotherapy, neuro-optometry, or a multidisciplinary concussion clinic. Without VOMS, these patients are often left on &ldquo;wait and see&rdquo; protocols that delay appropriate treatment by weeks or months.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-slate-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Note</h4>
                    <p className="text-sm text-slate-700">
                      The VOMS is now embedded within the SCOAT6, making it a standard component of every office-based concussion follow-up. However, clinicians should also consider baseline VOMS testing pre-season, as individual variation in vestibular-ocular function is significant. A provoked NPC of 5 cm or greater, or symptom provocation of 2 or more points above baseline on any VOMS subtest, should prompt specialist referral.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                The 2026 position is clear: <strong>VOMS is not an optional add-on. It is a fundamental component of competent concussion assessment.</strong> Clinicians who are not performing vestibular-ocular screening are missing a critical diagnostic domain and potentially delaying appropriate care.
              </p>
            </div>
          </div>

          {/* Closing Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The 2026 Standard: From Rest to Active Recovery
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The trajectory of concussion management since the Amsterdam consensus statement has been clear and consistent. The field has moved decisively away from passive, rest-based protocols toward structured, evidence-based active recovery. The three pillars of this transition are:
              </p>
              <ol className="space-y-3 list-decimal list-inside">
                <li><strong>Early controlled exercise</strong> replaces prolonged rest. Sub-symptom threshold aerobic activity by Day 3 is the new standard.</li>
                <li><strong>Two-tool assessment</strong> replaces the single-instrument approach. SCAT6 for acute assessment, SCOAT6 for all office follow-up.</li>
                <li><strong>Vestibular-ocular screening</strong> replaces symptom-only monitoring. VOMS identifies the patients most at risk of prolonged recovery and directs them to appropriate specialist care.</li>
              </ol>
              <p>
                For Australian healthcare professionals, these changes are not theoretical. They represent the current standard of care as defined by the Amsterdam Consensus, endorsed by Concussion in Sport Australia, and aligned with AHPRA continuing professional development requirements.
              </p>
              <p>
                The clinicians who adopt these practices will deliver measurably better outcomes for their patients. Those who do not will find themselves increasingly out of step with both the evidence and their regulatory obligations.
              </p>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport -- Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695-711.
              </li>
              <li>
                Leddy, J. J., et al. (2019). Early subthreshold aerobic exercise for sport-related concussion: a randomized clinical trial. <em>JAMA Pediatrics</em>, 173(4), 319-325.
              </li>
              <li>
                Mucha, A., et al. (2014). A brief Vestibular/Ocular Motor Screening (VOMS) assessment to evaluate concussions. <em>American Journal of Sports Medicine</em>, 42(10), 2479-2486.
              </li>
              <li>
                Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool - 6th Edition (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622-631.
              </li>
              <li>
                Australian Institute of Sport (2024). AIS Concussion and Brain Health Position Statement.{' '}
                <a href="https://www.concussioninsport.gov.au/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">concussioninsport.gov.au</a>
              </li>
            </ul>
          </div>

          {/* PPCS retrofit — for patients who DON'T resolve under active recovery */}
          <div className="bg-purple-50 border-l-4 border-purple-600 rounded-lg p-5 mt-12">
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong className="text-purple-900">Patient not resolving under active recovery?</strong> A minority of concussion cases become persistent (PPCS). The chronic-case workup is different from the acute one — vestibulo-ocular, cervical, autonomic. See our <Link href="/blog/persistent-post-concussion-symptoms-clinician-workup" className="text-purple-700 underline font-semibold">PPCS clinical workup guide</Link>. A dedicated PPCS Clinical Mastery course is in development — <Link href="/ppcs-waitlist" className="text-purple-700 underline font-semibold">join the waitlist</Link>. In the meantime, start with the free <Link href="/scat-mastery" className="text-purple-700 underline font-semibold">SCAT Mastery course</Link> or the full <Link href="/pricing" className="text-purple-700 underline font-semibold">Concussion Clinical Mastery course</Link>.
            </p>
          </div>

          <RelatedPosts slugs={['voms-screening', 'scat6-vs-scoat6', 'return-to-play']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Take the Next Step</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Ready to implement the 2026 concussion management standard in your practice? Our courses cover active recovery protocols, SCAT6/SCOAT6 administration, VOMS screening, and return-to-play decision-making -- all aligned with the Amsterdam Consensus and AHPRA requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
                Full Course — {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hrs online, up to {CONFIG.COURSE.TOTAL_CPD_POINTS} with the in-person day · from ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early-bird
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
