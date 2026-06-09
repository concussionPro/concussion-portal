import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, CheckCircle, ClipboardList, Brain, Activity, Layers, Monitor } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const metadata: Metadata = {
  title: 'Safe Return-to-Play Decisions After Concussion: 5 Quick Wins for Clinicians',
  description: 'Five evidence-based strategies to improve return-to-play decisions after concussion. Covers digital symptom tracking, cognitive screening, balance testing, stepwise RTP protocols, and holistic SCAT6 integration.',
  keywords: 'return to play concussion, RTP concussion protocol, concussion clearance, safe return to sport concussion, SCAT6 return to play, concussion stepwise protocol',
  openGraph: {
    title: 'Safe Return-to-Play Decisions After Concussion: 5 Quick Wins for Clinicians',
    description: 'Five evidence-based strategies to improve your return-to-play decisions after concussion. Digital tracking, cognitive screening, balance testing, stepwise protocols, and holistic assessment.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/return-to-play-decisions-concussion-clinicians',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/return-to-play-decisions-concussion-clinicians',
  },
}

export default function ReturnToPlayPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'Safe Return-to-Play Decisions After Concussion: 5 Quick Wins for Clinicians',
            description: 'Five evidence-based strategies to improve return-to-play decisions after concussion. Digital tracking, cognitive screening, balance testing, stepwise protocols, and holistic SCAT6 integration.',
            datePublished: '2025-09-15',
            dateModified: '2025-09-15',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/return-to-play-decisions-concussion-clinicians',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Clinical Practice Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Safe Return-to-Play Decisions After Concussion: 5 Quick Wins for Clinicians
            </h1>
            <p className="text-xl text-emerald-100 mb-4">
              Practical, evidence-based strategies you can implement immediately to improve return-to-play decision-making in your practice.
            </p>
            <div className="flex items-center gap-3 text-emerald-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis -- September 15, 2025 -- 11 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Return-to-play (RTP) decisions are among the most consequential clinical judgments in sport-related concussion management. Clear an athlete too early and you risk second impact syndrome, prolonged recovery, and medicolegal liability. Keep them out too long and you face deconditioning, psychological harm, and unnecessary disruption to their sporting career.
              </p>
              <p>
                The Amsterdam 2023 Consensus Statement provides a clear framework for RTP decision-making, but implementing it effectively in a busy clinical setting requires practical strategies. Here are five evidence-based quick wins that will immediately improve the quality and safety of your RTP decisions.
              </p>
            </div>
          </div>

          {/* Quick Win 1 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-emerald-100 rounded-lg p-2">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-600 mb-1">Quick Win 1</div>
                <h2 className="text-2xl font-bold text-slate-900">Track Symptoms Digitally</h2>
              </div>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The SCAT6 symptom evaluation comprises 22 items, each rated on a 7-point Likert scale (0-6). This generates a symptom severity score ranging from 0 to 132 and a total symptom count from 0 to 22. Tracking these scores manually across multiple assessments is tedious and error-prone. It also makes it difficult to visualise trends.
              </p>
              <p>
                <strong>Digital symptom logging solves this.</strong> When symptom scores are captured electronically, you gain automatic calculation (eliminating arithmetic errors), longitudinal trend visualisation, and the ability to compare current scores against the athlete&apos;s pre-injury baseline. This transforms symptom data from a static snapshot into a dynamic recovery trajectory.
              </p>
              <p>
                The clinical value is significant. A symptom severity score that has plateaued for several days despite stepwise progression suggests the athlete may have hit an exacerbation threshold. A score that is trending downward but has not yet returned to baseline indicates continued recovery. These patterns are difficult to detect from paper forms alone.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mt-4">
                <h4 className="font-bold text-emerald-900 mb-2">Implementation</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Log SCAT6 symptom scores at every assessment using a digital platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Compare each assessment to baseline and to the previous assessment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Use automated trend charts to identify recovery trajectory</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Win 2 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-emerald-100 rounded-lg p-2">
                <Brain className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-600 mb-1">Quick Win 2</div>
                <h2 className="text-2xl font-bold text-slate-900">Cognitive Screening for Hidden Deficits</h2>
              </div>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Athletes are notoriously unreliable reporters of their own symptoms, particularly when clearance for return to sport is the perceived goal. Research consistently shows that up to 50% of athletes underreport concussion symptoms when they believe it will affect their playing status (Meier et al., 2015). This is why symptom scores alone are insufficient for RTP decisions.
              </p>
              <p>
                <strong>Cognitive screening provides an objective measure that is resistant to sandbagging.</strong> The Standardized Assessment of Concussion (SAC), embedded within the SCAT6, tests orientation, immediate memory, concentration (including digits backward), and delayed recall. These tasks are sensitive to the neurocognitive effects of concussion and are difficult to &ldquo;fake&rdquo; a normal performance on.
              </p>
              <p>
                Pay particular attention to:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Immediate and Delayed Recall:</strong> Memory consolidation is one of the most sensitive markers of concussion. Deficits in 5- and 10-word list recall often persist after symptom resolution. Delayed recall (administered after a minimum 5-minute interval) is particularly sensitive.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Digits Backward:</strong> This working memory task requires the athlete to repeat increasingly long number sequences in reverse order. It tests executive function and processing speed -- domains that are frequently impaired following concussion, even when self-reported symptoms have resolved.</span>
                </li>
              </ul>
              <p>
                An athlete who reports being &ldquo;symptom free&rdquo; but scores 2-3 points below their baseline on immediate recall or fails to complete the 6-digit backward sequence should not be cleared for return to full contact activity. The cognitive deficit represents ongoing neurophysiological dysfunction regardless of subjective symptom reporting.
              </p>
            </div>
          </div>

          {/* Quick Win 3 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-emerald-100 rounded-lg p-2">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-600 mb-1">Quick Win 3</div>
                <h2 className="text-2xl font-bold text-slate-900">Balance and Vestibular Testing</h2>
              </div>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Postural stability is frequently impaired following concussion, and balance deficits can persist well beyond symptom resolution. The SCAT6 includes the modified Balance Error Scoring System (mBESS), which tests three stances (double leg, single leg, tandem) on a firm surface for 20 seconds each.
              </p>
              <p>
                Additionally, the <strong>tandem gait test</strong> assesses dynamic balance by requiring the athlete to walk heel-to-toe along a 3-metre line as quickly as possible. This is a highly sensitive test that challenges both static and dynamic postural control systems.
              </p>
              <p>
                For RTP decisions, balance scores should return to within normal limits of the athlete&apos;s baseline. Key considerations include:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>mBESS:</strong> Total errors across three stances. A baseline is essential, as individual variation is significant. An increase of 3+ errors from baseline warrants caution.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Tandem gait:</strong> Best time of four trials. Normative data suggests less than 14 seconds for most athletic populations. Times significantly above baseline or normative values indicate persistent postural control deficits.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Dual-task testing:</strong> Where feasible, adding a cognitive task (such as counting backward by 7s) during balance testing increases sensitivity by loading both motor and cognitive systems simultaneously.</span>
                </li>
              </ul>
              <p>
                An athlete with residual balance deficits -- even in the absence of symptoms -- should not be cleared for full contact sport. Impaired postural control increases the risk of falls, musculoskeletal injury, and vulnerability to a further head impact.
              </p>
            </div>
          </div>

          {/* Quick Win 4 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-emerald-100 rounded-lg p-2">
                <Layers className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-600 mb-1">Quick Win 4</div>
                <h2 className="text-2xl font-bold text-slate-900">Stepwise Return-to-Play Protocol</h2>
              </div>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The Amsterdam 2023 Consensus reaffirmed the graduated, stepwise return-to-sport strategy as the standard of care. Each stage must be completed without symptom exacerbation before progressing to the next. A minimum of 24 hours at each stage is required, meaning the fastest possible progression from symptom resolution to full competition clearance is a minimum of 6 days.
              </p>

              <div className="space-y-3 my-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Symptom-Limited Activity</h4>
                      <p className="text-sm text-slate-600">Activities of daily living that do not provoke symptoms. Gradual reintroduction of school/work.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Light Aerobic Exercise</h4>
                      <p className="text-sm text-slate-600">Walking, swimming, or stationary cycling at sub-symptom threshold intensity. No resistance training. Heart rate below 70% of maximum.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Sport-Specific Exercise</h4>
                      <p className="text-sm text-slate-600">Running drills, skating, throwing. No head impact activities. Progressive increase in intensity.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">4</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Non-Contact Training Drills</h4>
                      <p className="text-sm text-slate-600">Harder training drills. Resistance training may resume. Coordination and cognitive loading.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">5</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Full-Contact Practice</h4>
                      <p className="text-sm text-slate-600">Full training with contact. Requires medical clearance. Confidence restoration and functional assessment.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">6</div>
                    <div>
                      <h4 className="font-bold text-slate-900">Return to Competition</h4>
                      <p className="text-sm text-slate-600">Normal game play. Athlete has completed all stages without symptom recurrence. Final clearance documented.</p>
                    </div>
                  </div>
                </div>
              </div>

              <p>
                The critical principle is that <strong>if symptoms recur at any stage, the athlete must return to the previous asymptomatic stage and attempt progression again after a further 24-hour rest period</strong>. Document each stage transition, the date, symptom scores, and any recurrence.
              </p>
            </div>
          </div>

          {/* Quick Win 5 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <div className="bg-emerald-100 rounded-lg p-2">
                <Monitor className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-emerald-600 mb-1">Quick Win 5</div>
                <h2 className="text-2xl font-bold text-slate-900">Integrate SCAT6 with Holistic Assessment</h2>
              </div>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The SCAT6 and SCOAT6 are standardised screening tools, not diagnostic instruments. The Amsterdam Consensus is explicit on this point: <strong>no single assessment tool should be used in isolation to diagnose concussion or make RTP decisions</strong>. The SCAT6 must be integrated within a broader clinical assessment that includes:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Clinical history:</strong> Mechanism of injury, previous concussion history, pre-existing conditions (migraine, ADHD, mood disorders, learning disabilities), and recovery trajectory</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Neurological examination:</strong> Cranial nerves, reflexes, coordination, gait, and cervical spine assessment</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Age-specific considerations:</strong> Children and adolescents require longer minimum rest periods and may need more conservative progression. The Child SCAT6 should be used for athletes under 13 years.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                  <span><strong>Psychosocial factors:</strong> Anxiety, depression, fear of re-injury, academic/work pressures, and external pressure to return to sport (from coaches, parents, or the athlete themselves)</span>
                </li>
              </ul>
              <p>
                The RTP decision is ultimately a clinical judgment that synthesises objective assessment data (SCAT6/SCOAT6 scores, VOMS, balance testing) with clinical history, examination findings, and contextual factors. No algorithm or scoring system can replace this. The tools inform the decision; the clinician makes it.
              </p>
            </div>
          </div>

          {/* Why Go Digital */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Why Go Digital?
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Each of the five strategies above is significantly enhanced by digital assessment platforms. The clinical rationale for transitioning from paper-based to digital concussion management is not about technology for its own sake -- it is about improving clinical accuracy, efficiency, and medicolegal defensibility.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
                  <h4 className="font-bold text-teal-900 mb-2">Accuracy</h4>
                  <p className="text-sm text-slate-700">Automatic scoring eliminates calculation errors. Standardised prompts ensure no assessment components are missed. Validation checks flag inconsistent responses.</p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
                  <h4 className="font-bold text-teal-900 mb-2">Efficiency</h4>
                  <p className="text-sm text-slate-700">Digital assessments are completed up to 40% faster than paper equivalents. Longitudinal data is immediately accessible without pulling files.</p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
                  <h4 className="font-bold text-teal-900 mb-2">Trend Tracking</h4>
                  <p className="text-sm text-slate-700">Automated charts showing symptom, cognitive, and balance trajectories across serial assessments. Pattern recognition that is impossible with paper forms.</p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
                  <h4 className="font-bold text-teal-900 mb-2">Documentation</h4>
                  <p className="text-sm text-slate-700">Timestamped, unalterable records that demonstrate standard of care. Exportable reports for medical records, insurance, and legal proceedings.</p>
                </div>
              </div>
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
                Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool - 6th Edition (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622-631.
              </li>
              <li>
                Meier, T. B., et al. (2015). Thresholds for detecting awareness of symptoms after concussion. <em>Journal of Neurotrauma</em>, 32(17), 1305-1310.
              </li>
              <li>
                McCrory, P., et al. (2017). Consensus statement on concussion in sport -- the 5th international conference on concussion in sport. <em>British Journal of Sports Medicine</em>, 51(11), 838-847.
              </li>
            </ul>
          </div>

          <RelatedPosts slugs={['scat6-guide', 'bess-testing', 'voms-screening']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Take the Next Step</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Learn to implement the complete Amsterdam Consensus return-to-play framework with confidence. Our training covers every aspect of RTP decision-making, from SCAT6 administration to stepwise progression protocols and medicolegal documentation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
                Full Course (14 CPD) — ${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
