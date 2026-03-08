import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, CheckCircle, FileText, Brain, Activity, AlertCircle, Stethoscope, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'How to Use the SCAT6 for Concussion Management: A Clinician\'s Guide',
  description: 'Complete clinician\'s guide to SCAT6 administration. Step-by-step instructions for symptom evaluation, cognitive screening, neurological examination, and balance assessment. Updated for Amsterdam 2023 Consensus.',
  keywords: 'how to use SCAT6, SCAT6 guide clinicians, SCAT6 assessment tool, digital SCAT6, concussion assessment guide, SCAT6 components',
  openGraph: {
    title: 'How to Use the SCAT6 for Concussion Management: A Clinician\'s Guide',
    description: 'Complete step-by-step guide to SCAT6 administration. Covers symptom evaluation, cognitive screening, neurological examination, and balance assessment.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/how-to-use-scat6-clinicians-guide',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/how-to-use-scat6-clinicians-guide',
  },
}

export default function HowToUseSCAT6Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: 'How to Use the SCAT6 for Concussion Management: A Clinician\'s Guide',
            description: 'Complete clinician guide to SCAT6 concussion assessment. Step-by-step instructions for all sections including symptom evaluation, cognitive screening, neurological examination, and balance testing.',
            datePublished: '2025-08-01',
            dateModified: '2025-08-01',
            author: 'Dr. Zac Lewis',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white pt-[80px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Clinical Reference Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              How to Use the SCAT6 for Concussion Management: A Clinician&apos;s Guide
            </h1>
            <p className="text-xl text-blue-100 mb-4">
              A comprehensive, step-by-step guide to administering, scoring, and interpreting the Sport Concussion Assessment Tool - 6th Edition.
            </p>
            <div className="flex items-center gap-3 text-blue-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Dr. Zac Lewis -- August 1, 2025 -- 14 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* What is the SCAT6 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                What is the SCAT6?
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The <strong>Sport Concussion Assessment Tool - 6th Edition (SCAT6)</strong> is the internationally accepted gold-standard tool for evaluating sport-related concussion in athletes aged 13 years and older. It was published in the British Journal of Sports Medicine in June 2023 following the 6th International Conference on Concussion in Sport, held in Amsterdam in October 2022.
              </p>
              <p>
                The SCAT6 is designed specifically for <strong>acute assessment within 0-72 hours post-injury</strong>. It is used on the sideline, in the change room, in the emergency department, and in early clinical settings during the first three days following a suspected concussion. It should not be used for office-based follow-up beyond Day 3 -- the SCOAT6 (Sport Concussion Office Assessment Tool - 6th Edition) is the appropriate instrument for that context.
              </p>
              <p>
                The tool provides a structured, multi-domain assessment covering:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <span><strong>Symptom scoring</strong> -- 22 symptoms rated on a 0-6 severity scale</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <span><strong>Cognitive screening</strong> -- orientation, immediate memory, concentration, and delayed recall</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <span><strong>Neurological screening</strong> -- red flags, cranial nerves, coordination, and observable signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <span><strong>Postural stability</strong> -- modified Balance Error Scoring System (mBESS) and tandem gait</span>
                </li>
              </ul>
              <p>
                Critically, the SCAT6 is a <strong>screening tool, not a diagnostic instrument</strong>. It informs clinical decision-making but does not replace clinical judgment. A normal SCAT6 score does not rule out concussion, and an abnormal score does not confirm it. The tool must be interpreted within the context of the full clinical picture.
              </p>
            </div>
          </div>

          {/* Why Use Digital SCAT6 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <ClipboardList className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Why Use a Digital SCAT6?
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                While the SCAT6 was published as a paper-based form, the transition to digital administration offers significant clinical advantages. These are not theoretical -- they have measurable impact on assessment quality and workflow efficiency.
              </p>
              <div className="grid md:grid-cols-3 gap-4 my-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">40%</div>
                  <p className="text-sm text-slate-700">Faster completion compared to paper forms</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">0</div>
                  <p className="text-sm text-slate-700">Arithmetic errors with automatic scoring</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">100%</div>
                  <p className="text-sm text-slate-700">Mobile accessibility -- assess anywhere</p>
                </div>
              </div>
              <p>
                <strong>Accuracy and efficiency</strong> are the primary drivers. The SCAT6 symptom severity score requires summing 22 individual symptom ratings (each 0-6) and calculating a total symptom count. The SAC requires tallying scores across four cognitive domains. The mBESS requires counting errors across three stances. Manual calculation of these scores under sideline pressure is a known source of error.
              </p>
              <p>
                <strong>Real-time data capture</strong> means assessment results are immediately available for comparison against baseline values and previous assessments. This is essential for tracking recovery trajectories and making informed RTP decisions.
              </p>
              <p>
                <strong>Mobile accessibility</strong> means the SCAT6 is available on the device already in the clinician&apos;s pocket. No more searching for paper forms, realising they are the wrong edition, or trying to read handwriting days later.
              </p>
            </div>
          </div>

          {/* Key Components */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Stethoscope className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Key Components of the SCAT6
              </h2>
            </div>
            <div className="space-y-6 text-slate-700 leading-relaxed">

              <div className="border-l-4 border-red-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">1. Red Flags and Observable Signs</h3>
                <p>
                  The assessment begins with an immediate safety screen. Red flags include neck pain or tenderness, double vision, weakness or tingling in the limbs, severe or increasing headache, seizure, loss of consciousness, and deteriorating conscious state. <strong>Any red flag requires immediate emergency department referral.</strong> Observable signs include lying motionless on the playing surface, disorientation or confusion, blank or vacant look, balance/gait difficulties, and facial injury suggesting head trauma.
                </p>
              </div>

              <div className="border-l-4 border-amber-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">2. Symptom Evaluation</h3>
                <p>
                  The athlete rates 22 symptoms on a 0-6 severity scale (0 = none, 6 = severe). This generates two scores: the <strong>symptom severity score</strong> (sum of all ratings, max 132) and the <strong>total number of symptoms</strong> endorsed (max 22). The symptom evaluation also captures whether the athlete feels &ldquo;not normal&rdquo; and whether physical or mental activity worsens symptoms. Where available, comparison to a pre-injury baseline dramatically improves interpretive accuracy.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">3. Cognitive Screening (SAC)</h3>
                <p>
                  The Standardized Assessment of Concussion (SAC) evaluates four cognitive domains. <strong>Orientation</strong> (month, date, day, year, time -- 5 points). <strong>Immediate Memory</strong> (three trials of a 5 or 10-word list -- 15 or 30 points). <strong>Concentration</strong> (digits backward starting at 3 digits and increasing, plus months of the year in reverse -- up to 5 points). <strong>Delayed Recall</strong> (recall of the word list after a minimum 5-minute interval -- 5 or 10 points). The delayed recall must be administered after the balance examination has been completed.
                </p>
              </div>

              <div className="border-l-4 border-emerald-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">4. Neurological Screen</h3>
                <p>
                  Includes assessment of speech (fluency, word-finding), eye movements (pursuit, saccades), coordination (finger-to-nose), and reading ability. The clinician documents any abnormalities observed. While brief, this screen can identify gross neurological deficits that require urgent investigation.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-5">
                <h3 className="text-xl font-bold text-slate-900 mb-2">5. Balance Assessment</h3>
                <p>
                  The modified Balance Error Scoring System (mBESS) tests three stances on a firm surface: double-leg (feet together), single-leg (non-dominant foot), and tandem (non-dominant foot behind dominant). Each stance is held for 20 seconds with eyes closed and hands on hips. Errors are counted for each stance (maximum 10 errors per stance, 30 total). The tandem gait test requires the athlete to walk heel-to-toe along a 3-metre line and back as quickly as possible; the best time of four trials is recorded.
                </p>
              </div>

            </div>
          </div>

          {/* Step-by-Step Guide */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Brain className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Step-by-Step Administration Guide
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">1</div>
                    <h4 className="font-bold text-blue-900">Prepare the Environment</h4>
                  </div>
                  <p className="text-sm text-slate-700 ml-11">
                    Ensure a quiet, controlled environment where possible. On the sideline, move the athlete to a quiet area away from crowd noise and coaching staff. Have a stopwatch or timer available for the mBESS (20-second intervals) and tandem gait. If using a digital platform, ensure the device is charged and the correct assessment form is loaded.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">2</div>
                    <h4 className="font-bold text-blue-900">Screen for Red Flags</h4>
                  </div>
                  <p className="text-sm text-slate-700 ml-11">
                    Before proceeding with the full assessment, screen for all red flags. If any are present, do not continue with the SCAT6 -- arrange immediate emergency department transfer. Document which red flags were identified and the time of assessment.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">3</div>
                    <h4 className="font-bold text-blue-900">Administer Symptom Evaluation</h4>
                  </div>
                  <p className="text-sm text-slate-700 ml-11">
                    Read each of the 22 symptoms aloud and ask the athlete to rate severity from 0 to 6. Do not lead the athlete or suggest ratings. Record the total symptom count and symptom severity score. Ask the additional questions about feeling &ldquo;not normal&rdquo; and symptom aggravation with physical/mental activity.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">4</div>
                    <h4 className="font-bold text-blue-900">Conduct Cognitive Screening</h4>
                  </div>
                  <p className="text-sm text-slate-700 ml-11">
                    Administer the SAC in sequence: orientation, immediate memory (three trials), concentration (digits backward, then months in reverse). Note the word list number used. Instruct the athlete to remember the words for later recall. Do NOT administer delayed recall at this point -- it must follow the balance examination with a minimum 5-minute interval from the last immediate memory trial.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">5</div>
                    <h4 className="font-bold text-blue-900">Perform Balance Assessment</h4>
                  </div>
                  <p className="text-sm text-slate-700 ml-11">
                    Administer the mBESS (double-leg, single-leg, tandem stance -- 20 seconds each) and the tandem gait test (four trials, record best time). Count and document errors for each mBESS stance. Ensure the athlete removes shoes for the mBESS if possible and stands on a firm surface.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">6</div>
                    <h4 className="font-bold text-blue-900">Complete Delayed Recall and Interpret</h4>
                  </div>
                  <p className="text-sm text-slate-700 ml-11">
                    After a minimum of 5 minutes from the final immediate memory trial, ask the athlete to recall the word list without prompting. Record the number of words correctly recalled. Review all scores, compare to baseline where available, and document your clinical impression. Remember: the SCAT6 informs your clinical judgment -- it does not replace it.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Clinical Caveats */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Clinical Caveats
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Effective use of the SCAT6 requires understanding its limitations as well as its strengths. The following caveats are essential for competent clinical practice:
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900">Not Diagnostic Alone</h4>
                    <p className="text-sm text-slate-700">The SCAT6 is a screening tool, not a standalone diagnostic instrument. A &ldquo;normal&rdquo; SCAT6 does not exclude concussion. An &ldquo;abnormal&rdquo; SCAT6 does not confirm it. Clinical judgment, informed by the full clinical picture, remains paramount.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900">Baseline Is Essential</h4>
                    <p className="text-sm text-slate-700">Without a pre-injury baseline, interpretation of SCAT6 scores relies on normative data, which has significant individual variation. Pre-season baseline testing dramatically improves the sensitivity and specificity of post-injury assessment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900">Acute Use Only (0-72 Hours)</h4>
                    <p className="text-sm text-slate-700">The SCAT6 is validated for use within 72 hours of injury. For office-based follow-up from Day 3 onwards, the SCOAT6 must be used. Continuing to use SCAT6 beyond the acute window misses critical assessment domains (VOMS, cervical spine, structured RTP) and is below standard of care.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900">Combine with Broader Clinical Approach</h4>
                    <p className="text-sm text-slate-700">The SCAT6 should be part of a comprehensive concussion management approach that includes clinical history, neurological examination, vestibular-ocular screening (via SCOAT6 or standalone VOMS), cervical spine assessment, and consideration of psychosocial factors. No single tool captures the full complexity of concussion.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900">Age-Appropriate Tools</h4>
                    <p className="text-sm text-slate-700">The SCAT6 is validated for athletes aged 13 years and older. For children aged 5-12 years, the Child SCAT6 must be used. It includes modified symptom lists, simplified cognitive tasks, and parent/carer report components appropriate for the developmental level.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool - 6th Edition (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622-631.{' '}
                <a href="https://bjsm.bmj.com/content/57/11/622" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  bjsm.bmj.com/content/57/11/622
                </a>
              </li>
              <li>
                Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport -- Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695-711.
              </li>
              <li>
                Echemendia, R. J., et al. (2023). Sport Concussion Office Assessment Tool - 6th Edition (SCOAT6). <em>British Journal of Sports Medicine</em>, 57(11), 651-665.
              </li>
              <li>
                Davis, G. A., et al. (2023). Child Sport Concussion Assessment Tool - 6th Edition (Child SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 632-650.
              </li>
              <li>
                Concussion in Sport Australia.{' '}
                <a href="https://www.concussioninsport.gov.au/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  concussioninsport.gov.au
                </a>
              </li>
            </ul>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Take the Next Step</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Move beyond reading about the SCAT6 -- learn to administer it with confidence. Our free training covers every section of the SCAT6 and SCOAT6 with video demonstrations, clinical scenarios, and common pitfalls to avoid. Earn 2 AHPRA-aligned CPD points.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training (2 CPD)
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
                Full Course (14 CPD) — $1,190
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
