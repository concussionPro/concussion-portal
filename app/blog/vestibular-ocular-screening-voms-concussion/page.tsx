import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, Eye, CheckCircle, BarChart3, Target, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const metadata: Metadata = {
  title: 'Beyond SCAT6: How Vestibular/Ocular Screening Improves Concussion Care',
  description: 'Learn why VOMS (Vestibular/Ocular Motor Screening) is essential for comprehensive concussion assessment. Evidence-based guide covering smooth pursuits, saccades, convergence, VOR, and visual motion sensitivity testing.',
  keywords: 'VOMS concussion, vestibular ocular motor screening, concussion assessment beyond SCAT6, VOMS test concussion, NPC concussion, VOR concussion',
  openGraph: {
    title: 'Beyond SCAT6: How Vestibular/Ocular Screening Improves Concussion Care',
    description: 'Learn why VOMS is essential for comprehensive concussion assessment. 50-80% of concussed athletes report dizziness, yet standard symptom checklists miss vestibular deficits.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/vestibular-ocular-screening-voms-concussion',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/vestibular-ocular-screening-voms-concussion',
  },
}

export default function VOMSConcussionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'Beyond SCAT6: How Vestibular/Ocular Screening Improves Concussion Care',
            description: 'Evidence-based guide to integrating VOMS into concussion assessment. Covers vestibular-ocular motor screening components, diagnostic accuracy, and clinical implementation.',
            datePublished: '2025-10-18',
            dateModified: '2025-10-18',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/vestibular-ocular-screening-voms-concussion',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Clinical Evidence Review
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Beyond SCAT6: How Vestibular/Ocular Screening Improves Concussion Care
            </h1>
            <p className="text-xl text-purple-100 mb-4">
              50-80% of concussed athletes report dizziness. 30% experience vision problems. Yet standard symptom checklists miss the underlying vestibular-ocular deficits driving these symptoms.
            </p>
            <div className="flex items-center gap-3 text-purple-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis -- October 18, 2025 -- 12 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              The Gap in Standard Concussion Assessment
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The SCAT6 is widely regarded as the gold-standard tool for acute sport-related concussion assessment, and rightly so. It provides a structured, validated framework for sideline evaluation including symptom scoring, cognitive screening (SAC), and balance testing (mBESS). However, clinicians who rely on SCAT6 alone are operating with a significant blind spot.
              </p>
              <p>
                The vestibular and oculomotor systems are among the most commonly affected domains following concussion. Between <strong>50% and 80% of concussed athletes report dizziness</strong> as a primary symptom, and approximately <strong>30% experience clinically significant vision problems</strong> including blurred vision, difficulty tracking objects, and sensitivity to visual motion (Mucha et al., 2014; Kontos et al., 2017).
              </p>
              <p>
                Despite this prevalence, the SCAT6 does not include formal vestibular-ocular motor testing. It captures symptoms through self-report and assesses balance via the mBESS, but it does not systematically evaluate the oculomotor pathways -- smooth pursuits, saccades, convergence, vestibulo-ocular reflex, and visual motion sensitivity -- that are critical for identifying the specific neural substrate of concussion-related dysfunction.
              </p>
              <p>
                This is where the <strong>Vestibular/Ocular Motor Screening (VOMS)</strong> becomes essential.
              </p>
            </div>
          </div>

          {/* Section: Why Add the VOMS? */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Eye className="w-8 h-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Why Add the VOMS?
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The VOMS was developed by Mucha et al. (2014) at the University of Pittsburgh Medical Center as a brief, clinician-administered screening tool for vestibular and oculomotor dysfunction following concussion. It takes <strong>approximately 5-10 minutes</strong> to administer and requires no specialised equipment beyond a target (pen tip or fingertip) and a ruler.
              </p>
              <p>
                The VOMS assesses five vestibular-ocular domains, each of which maps to specific neural pathways commonly disrupted by concussion:
              </p>

              <div className="space-y-4 my-6">
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-purple-900">1. Smooth Pursuits</h4>
                      <p className="text-sm text-slate-700 mt-1">The patient tracks a slowly moving target horizontally and vertically. Tests the frontal eye fields and pontine nuclei. Dysfunction manifests as &ldquo;jerky&rdquo; or saccadic pursuit movements and symptom provocation (headache, dizziness, nausea).</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-purple-900">2. Saccades</h4>
                      <p className="text-sm text-slate-700 mt-1">The patient makes rapid eye movements between two stationary targets held approximately 3 feet apart. Tests the superior colliculus and paramedian pontine reticular formation. Abnormalities include overshoot/undershoot and symptom provocation.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-purple-900">3. Near Point of Convergence (NPC)</h4>
                      <p className="text-sm text-slate-700 mt-1">A target is slowly moved toward the patient&apos;s nose. The distance at which one eye breaks convergence is measured in centimetres. Normal NPC is less than 5 cm. A receded NPC (5 cm or greater) is a hallmark of concussion-related convergence insufficiency.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-purple-900">4. Vestibulo-Ocular Reflex (VOR)</h4>
                      <p className="text-sm text-slate-700 mt-1">The patient fixates on a stationary target while rotating their head horizontally and then vertically at approximately 2 Hz. Tests the semicircular canal-ocular motor pathway. VOR dysfunction causes gaze instability, oscillopsia, and symptom provocation.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-purple-900">5. Visual Motion Sensitivity (VMS)</h4>
                      <p className="text-sm text-slate-700 mt-1">The patient fixates on an outstretched arm while rotating their trunk left and right. Tests central integration of visual and vestibular inputs. Provocation indicates sensory mismatch dysfunction common in concussion.</p>
                    </div>
                  </div>
                </div>
              </div>

              <p>
                For each domain, the clinician records symptom provocation on a 0-10 scale across headache, dizziness, nausea, and fogginess. This provides a quantitative, repeatable measure that can be tracked across serial assessments to monitor recovery.
              </p>
            </div>
          </div>

          {/* Evidence Box */}
          <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-8 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-indigo-600 flex-shrink-0" />
              <h2 className="text-2xl font-bold text-indigo-900">
                The Evidence for VOMS
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The diagnostic and prognostic value of the VOMS is supported by a growing body of high-quality research:
              </p>
              <div className="grid md:grid-cols-2 gap-4 my-4">
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <div className="text-3xl font-bold text-indigo-700 mb-1">.92</div>
                  <div className="text-sm text-slate-600">Cronbach alpha -- excellent internal consistency reliability (Mucha et al., 2014)</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <div className="text-3xl font-bold text-indigo-700 mb-1">61% vs 9%</div>
                  <div className="text-sm text-slate-600">VOR symptom provocation in concussed patients vs healthy controls (Mucha et al., 2014)</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <div className="text-3xl font-bold text-indigo-700 mb-1">96% / 84%</div>
                  <div className="text-sm text-slate-600">Sensitivity / specificity when using symptom score of 2 or more OR NPC of 5 cm or greater to identify concussion (Mucha et al., 2014)</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <div className="text-3xl font-bold text-indigo-700 mb-1">AUC 0.89</div>
                  <div className="text-sm text-slate-600">Area under the curve -- strong discriminative ability between concussed and non-concussed individuals</div>
                </div>
              </div>
              <p>
                Critically, Kontos et al. (2017) demonstrated that vestibular-ocular dysfunction identified by the VOMS is a <strong>significant predictor of prolonged recovery</strong>. Patients with abnormal VOMS findings had median recovery times approximately 2.5 times longer than those with normal screening results. This makes early VOMS assessment not just diagnostically useful, but prognostically essential.
              </p>
              <p>
                The integration of VOMS into the SCOAT6 by the Amsterdam 2023 Consensus group reflects this evidence base and signals that vestibular-ocular assessment is now considered a core competency for concussion management.
              </p>
            </div>
          </div>

          {/* Three Quick Wins */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Stethoscope className="w-8 h-8 text-purple-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Three Quick Wins for Your Practice
              </h2>
            </div>
            <div className="space-y-6 text-slate-700 leading-relaxed">

              <div className="border-l-4 border-purple-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">1. Establish Pre-Season Baselines</h3>
                <p>
                  Individual variation in vestibular-ocular function is significant. What is normal for one athlete may be abnormal for another. Conducting baseline VOMS testing before the season begins provides a personalised reference point that dramatically improves the sensitivity of post-injury assessment. A pre-season baseline takes 5-10 minutes per athlete and can be conducted during routine pre-participation examinations.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">2. Include VOMS in Every Initial Office Assessment</h3>
                <p>
                  When a concussed athlete presents for their first office-based follow-up (Day 3 or later), the VOMS should be a standard component of the assessment -- and indeed, it is built into the SCOAT6. Document the findings systematically: symptom provocation scores for each domain and the NPC distance in centimetres. An NPC of 5 cm or greater, or symptom provocation of 2 or more points above baseline on any subtest, warrants further investigation and likely specialist referral to vestibular physiotherapy or neuro-optometry.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">3. Reassess Before Return-to-Play Clearance</h3>
                <p>
                  Do not clear an athlete for return to full contact sport based on symptom resolution alone. Serial VOMS assessment should demonstrate normalisation of all domains to baseline levels before the athlete progresses to the final stages of the stepwise return-to-play protocol. Residual vestibular-ocular deficits, even in the absence of reported symptoms, may increase vulnerability to re-injury and impair the rapid visual processing required for safe sport participation.
                </p>
              </div>

            </div>
          </div>

          {/* Clinical Integration */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Integrating VOMS Into Your Workflow
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The practical integration of VOMS into clinical practice is straightforward. For clinicians already using the SCOAT6 for office-based follow-up (as mandated by the Amsterdam Consensus), the VOMS is built in. The key is to administer it systematically and document findings quantitatively.
              </p>
              <p>
                For pre-season baselines and acute sideline assessments where the full SCOAT6 is not appropriate, a standalone VOMS can be performed in 5-10 minutes. The critical steps are:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span>Record baseline symptoms (headache, dizziness, nausea, fogginess) before beginning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span>Administer each of the five domains in sequence, re-rating symptoms after each</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span>Measure NPC in centimetres using a ruler or tape measure (average of three trials)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span>Compare to baseline values where available; use normative data where not</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <span>Document and track findings longitudinally to monitor recovery trajectory</span>
                </li>
              </ul>
              <p>
                Digital assessment platforms that integrate VOMS scoring with SCAT6/SCOAT6 data provide the most efficient workflow, allowing clinicians to track vestibular-ocular recovery alongside symptom, cognitive, and balance domains in a single longitudinal record.
              </p>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                Mucha, A., Collins, M. W., Elbin, R. J., Furman, J. M., Troutman-Enseki, C., DeWolf, R. M., ... &amp; Kontos, A. P. (2014). A brief Vestibular/Ocular Motor Screening (VOMS) assessment to evaluate concussions: preliminary findings. <em>American Journal of Sports Medicine</em>, 42(10), 2479-2486.
              </li>
              <li>
                Kontos, A. P., Elbin, R. J., Schatz, P., Covassin, T., Henry, L., Pardini, J., &amp; Collins, M. W. (2012). A revised factor structure for the post-concussion symptom scale. <em>American Journal of Sports Medicine</em>, 40(10), 2375-2384.
              </li>
              <li>
                Kontos, A. P., Sufrinko, A., Elbin, R. J., Puskar, A., &amp; Collins, M. W. (2016). Reliability and associated risk factors for performance on the Vestibular/Ocular Motor Screening (VOMS) tool in healthy college students. <em>American Journal of Sports Medicine</em>, 44(6), 1400-1406.
              </li>
              <li>
                Kontos, A. P., Deitrick, J. M., Collins, M. W., &amp; Mucha, A. (2017). Review of vestibular and oculomotor screening and concussion rehabilitation. <em>Journal of Athletic Training</em>, 52(3), 256-261.
              </li>
              <li>
                Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport -- Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695-711.
              </li>
              <li>
                Echemendia, R. J., et al. (2023). Sport Concussion Office Assessment Tool - 6th Edition (SCOAT6). <em>British Journal of Sports Medicine</em>, 57(11), 651-665.
              </li>
            </ul>
          </div>

          <RelatedPosts slugs={['baseline-testing', 'bess-testing', 'return-to-play']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Take the Next Step</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Master VOMS administration, interpretation, and clinical integration. Our courses provide hands-on training in vestibular-ocular screening alongside SCAT6/SCOAT6 protocols, return-to-play decision-making, and medicolegal documentation.
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
