import { Metadata } from 'next'
import { createBlogPostSchema, createFAQSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, CheckCircle, ClipboardCheck, Brain, Activity, AlertTriangle, BarChart3, Users, Monitor, Shield } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const metadata: Metadata = {
  title: 'Pre-Season Baseline Testing for Concussion: What Every Clinician Needs to Know',
  description: 'Evidence-based guide to pre-season concussion baseline testing. Covers SCAT6 symptom baselines, SAC cognitive assessment, mBESS balance testing, VOMS vestibular-ocular screening, implementation strategies, and reliable change indices for post-injury comparison.',
  keywords: 'concussion baseline testing, pre-season concussion assessment, SCAT6 baseline, BESS baseline, VOMS baseline, concussion pre-participation exam',
  openGraph: {
    title: 'Pre-Season Baseline Testing for Concussion: What Every Clinician Needs to Know',
    description: 'Why normative data alone is not enough. How pre-season baselines across symptoms, cognition, balance, and vestibular-ocular domains dramatically improve post-injury concussion assessment.',
    type: 'article',
    publishedTime: '2026-03-09',
    images: ['/og-image.jpg'],
    url: 'https://portal.concussion-education-australia.com/blog/pre-season-baseline-testing-concussion-guide',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/pre-season-baseline-testing-concussion-guide',
  },
}

const faqs = [
  {
    question: 'Why does pre-season baseline testing matter?',
    answer: 'Concussion assessment is fundamentally a comparison exercise. Individual variation in symptoms, cognition, balance, and vestibular-ocular function is substantial — healthy baseline SAC scores range from 23 to 30, and a majority of healthy athletes endorse at least one symptom at baseline. Relying on population normative data alone inflates false positives and false negatives. An individualised pre-season baseline lets the clinician detect genuine change from that athlete\'s normal, dramatically improving the sensitivity and specificity of post-injury assessment.',
  },
  {
    question: 'What should be tested at a pre-season baseline?',
    answer: 'A comprehensive baseline covers four domains: the 22-item SCAT6 symptom checklist (symptom count and severity score), the SAC cognitive assessment (orientation, immediate memory, concentration, delayed recall), the mBESS balance assessment plus tandem gait time, and the full VOMS vestibular-ocular motor screening (including near point of convergence in centimetres). The King-Devick test is an optional but valuable addition for saccadic eye movement speed.',
  },
  {
    question: 'When should baseline testing be conducted?',
    answer: 'Conduct baselines 2-4 weeks before competition begins, repeat them annually (particularly for developing adolescent athletes), and consider re-baselining after full recovery from any concussion. Do not test within 24 hours of vigorous exertion, after fewer than 7 hours of sleep, while acutely unwell, under the influence of substances, or during recovery from an uncleared concussion — these conditions invalidate the data.',
  },
  {
    question: 'How long does baseline testing take per athlete?',
    answer: 'Allow 15-20 minutes per athlete for the full battery (symptoms, SAC, mBESS, VOMS), administered one-on-one in a quiet, distraction-free environment. A team of 30 athletes can typically be baselined across 2-3 dedicated sessions, and the battery can be folded into a pre-participation medical examination for individual athletes.',
  },
]

export default function PreSeasonBaselineTestingPage() {
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
            title: 'Pre-Season Baseline Testing for Concussion: What Every Clinician Needs to Know',
            description: 'Evidence-based guide to pre-season concussion baseline testing. Covers SCAT6 symptom baselines, SAC cognitive assessment, mBESS balance testing, VOMS vestibular-ocular screening, implementation workflows, and reliable change indices for clinical decision-making.',
            datePublished: '2026-03-09',
            dateModified: '2026-07-02',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/pre-season-baseline-testing-concussion-guide',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-500 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Clinical Practice Guide -- March 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Pre-Season Baseline Testing for Concussion: What Every Clinician Needs to Know
            </h1>
            <p className="text-xl text-sky-100 mb-4">
              Individual variation in symptoms, cognition, balance, and vestibular-ocular function means normative data alone is not enough. Pre-season baselines transform post-injury assessment from guesswork into precision medicine.
            </p>
            <div className="flex items-center gap-3 text-sky-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis — Osteopath (AHPRA-registered) — March 9, 2026 — 10 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction: Why Baselines Matter */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Why Baseline Testing Matters
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Concussion assessment is fundamentally a comparison exercise. When an athlete sustains a head injury, the clinician&apos;s task is to determine whether their current neurocognitive, vestibular, and postural function has declined from their normal state. Without knowing what &ldquo;normal&rdquo; looks like for that individual, this determination relies on population-based normative data -- and that is where the problem begins.
              </p>
              <p>
                Individual variation across the domains assessed by the SCAT6 is substantial. McCrea et al. (2003) demonstrated that healthy, uninjured athletes show a wide range of performance on the Standardized Assessment of Concussion (SAC), with baseline scores ranging from 23 to 30 out of 30. An athlete who scores 26 post-injury might be performing normally -- or might have dropped 4 points from their personal baseline. Without that baseline, the clinician cannot tell.
              </p>
              <p>
                The same principle applies to symptom endorsement. Healthy athletes frequently endorse symptoms at baseline: <strong>a majority of healthy, uninjured athletes endorse at least one symptom on the SCAT symptom checklist</strong> at pre-season testing. Common baseline symptoms include fatigue, difficulty concentrating, and sleep disturbance. If a clinician interprets any symptom endorsement as evidence of concussion without knowing the athlete&apos;s baseline symptom profile, false positive rates increase dramatically.
              </p>
              <p>
                <strong>Pre-season baseline testing solves this problem.</strong> By establishing individualised reference values before the season begins, clinicians gain the ability to detect genuine change from normal function after injury -- dramatically improving both the sensitivity and specificity of post-injury concussion assessment (Broglio et al., 2007).
              </p>
            </div>
          </div>

          {/* Section: What to Test at Baseline */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <ClipboardCheck className="w-8 h-8 text-sky-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                What to Test at Baseline
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                A comprehensive pre-season baseline should capture function across all four domains assessed in post-injury concussion evaluation. Each component provides a distinct piece of the clinical puzzle, and collectively they form a personalised reference profile that transforms post-injury interpretation.
              </p>

              <div className="space-y-4 my-6">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sky-900">1. SCAT6 Symptom Checklist</h4>
                      <p className="text-sm text-slate-700 mt-1">Record the athlete&apos;s baseline symptom endorsement using the full 22-item SCAT6 symptom checklist. Document both the number of symptoms endorsed (0-22) and the total severity score (0-132). This establishes their &ldquo;normal&rdquo; symptom profile. Many healthy athletes endorse 1-3 symptoms at baseline, particularly fatigue, difficulty concentrating, and trouble falling asleep. Knowing this prevents false positive identification of concussion based on pre-existing symptom endorsement.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sky-900">2. SAC Cognitive Assessment</h4>
                      <p className="text-sm text-slate-700 mt-1">Administer the full Standardized Assessment of Concussion (SAC) embedded within the SCAT6: orientation (5 points), immediate memory -- 5- and 10-word lists (15 or 30 points), concentration including digits backward (5 points), and delayed recall (5 or 10 points). Baseline SAC scores vary considerably between individuals. McCrea et al. (2003) reported a mean baseline SAC score of approximately 26.3 with a standard deviation of 2.1. A post-injury score of 24 might be unremarkable for one athlete but represent a clinically significant decline for another.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sky-900">3. mBESS Balance Assessment</h4>
                      <p className="text-sm text-slate-700 mt-1">Complete the modified Balance Error Scoring System (mBESS): three stances (double leg, single leg, tandem) on a firm surface, each held for 20 seconds. Record total errors for each stance and the composite score. Individual variation in baseline mBESS is significant -- baseline error counts range from 0 to 15+ depending on the athlete&apos;s age, sport, and innate postural stability. Also record tandem gait time (best of four trials over 3 metres). These individual baselines are essential for determining whether a post-injury balance score represents genuine impairment (Broglio et al., 2007).</p>
                    </div>
                  </div>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sky-900">4. VOMS Vestibular-Ocular Motor Screening</h4>
                      <p className="text-sm text-slate-700 mt-1">Administer the full VOMS battery: smooth pursuits, saccades, near point of convergence (NPC), vestibulo-ocular reflex (VOR horizontal and vertical), and visual motion sensitivity (VMS). Record symptom provocation scores (headache, dizziness, nausea, fogginess on a 0-10 scale) for each domain and NPC distance in centimetres. Baseline VOMS establishes each athlete&apos;s normal vestibular-ocular response profile. Post-injury, a symptom provocation increase of 2 or more points above baseline on any subtest, or an NPC of 5 cm or greater (if baseline was normal), is clinically significant (Mucha et al., 2014).</p>
                    </div>
                  </div>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sky-900">5. King-Devick Test (Optional but Valuable)</h4>
                      <p className="text-sm text-slate-700 mt-1">The King-Devick test measures saccadic eye movements and attention by timing the athlete as they read aloud a series of single-digit numbers displayed on cards. Baseline establishes the individual&apos;s normal reading speed. Post-injury slowing of 3-5 seconds or more from baseline is associated with concussion. While not part of the SCAT6, the King-Devick is a rapid (2-minute), validated sideline screening tool that complements the standard assessment battery (Galetta et al., 2011).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: When to Do Baselines */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Clock className="w-8 h-8 text-sky-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                When to Conduct Baseline Testing
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The timing and conditions of baseline testing directly affect data validity. A baseline conducted under suboptimal conditions is worse than no baseline at all, because it creates a false reference point that can lead to incorrect post-injury interpretation.
              </p>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 my-6">
                <h3 className="text-lg font-bold text-sky-900 mb-3">Timing Guidelines</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <span><strong>Pre-season:</strong> Conduct baselines during the pre-season period, ideally 2-4 weeks before competition begins. This allows time for retesting if data validity is questionable.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <span><strong>Annual renewal:</strong> Baselines should be repeated annually. Neurocognitive function, postural stability, and vestibular-ocular profiles change over time -- particularly in developing adolescent athletes. A two-year-old baseline may no longer be representative (Echemendia et al., 2023).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-1" />
                    <span><strong>Post-concussion re-baseline:</strong> After an athlete has fully recovered from a concussion and been cleared to return to sport, consider establishing a new baseline. Their &ldquo;normal&rdquo; may have shifted, and the pre-injury baseline may no longer be valid.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 my-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-900 mb-2">Conditions That Invalidate Baseline Data</h4>
                    <p className="text-sm text-slate-700 mb-3">
                      Testing under any of the following conditions produces unreliable baselines that should not be used for post-injury comparison:
                    </p>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>Within 24 hours of vigorous physical exertion or competition</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>Following a night of fewer than 7 hours of sleep</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>Under the influence of alcohol, cannabis, or other substances (including residual effects)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>While acutely unwell (e.g. upper respiratory tract infection, migraine episode)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>While recovering from a previous concussion that has not been fully cleared</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <p>
                Document the conditions of testing: date, time, hours of sleep the previous night, time since last physical activity, and any current symptoms or illnesses. This contextual data is essential for interpreting the baseline and determining its validity if it is later used for post-injury comparison.
              </p>
            </div>
          </div>

          {/* Section: Implementation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Users className="w-8 h-8 text-sky-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                How to Implement in Practice
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The practical implementation of baseline testing differs significantly between team-based settings and individual athlete consultations. Both require systematic planning, but the logistics vary.
              </p>

              <div className="grid md:grid-cols-2 gap-4 my-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-blue-900 mb-2">Team-Based Workflow</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Schedule dedicated baseline sessions 2-4 weeks pre-season</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Allow 15-20 minutes per athlete for the full battery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Test in a quiet, distraction-free environment -- not on the field during training</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Stagger athletes to avoid group testing effects on cognitive measures</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Instruct athletes on the importance of genuine effort before testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>A team of 30 athletes can be baselined across 2-3 sessions</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <h4 className="text-lg font-bold text-blue-900 mb-2">Individual Athlete Workflow</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Integrate into the pre-participation medical examination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Allocate an additional 15-20 minutes to the standard consultation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Screen for invalidating conditions before commencing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Store baseline data where it can be accessed rapidly if a concussion occurs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Provide the athlete with a summary of their baseline results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>Flag in clinical records that a baseline exists and its date</span>
                    </li>
                  </ul>
                </div>
              </div>

              <p>
                Regardless of setting, the critical requirement is that <strong>baseline data must be securely stored and readily accessible at the point of care when a concussion occurs</strong>. A baseline sitting in a filing cabinet at the clinic while the athlete is being assessed on the sideline is of limited value. Digital platforms that store baseline and post-injury data in a single accessible system provide a significant workflow advantage.
              </p>
            </div>
          </div>

          {/* Section: Common Pitfalls */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-sky-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Common Pitfalls &amp; Validity Threats
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Baseline testing is only useful if the data is valid. Several well-documented threats to validity must be actively managed by the clinician.
              </p>

              <div className="space-y-4 my-6">
                <div className="border-l-4 border-red-400 pl-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Sandbagging (Deliberate Underperformance)</h3>
                  <p>
                    This is the most frequently cited concern with baseline testing. Athletes may deliberately perform poorly at baseline in the belief that a low baseline score will make it easier to &ldquo;pass&rdquo; post-injury testing and return to play faster. Research by Erdal (2012) confirmed that motivated athletes can intentionally suppress their scores on neurocognitive tests, particularly on memory and processing speed tasks.
                  </p>
                  <p className="mt-2">
                    <strong>Mitigation strategies:</strong> Educate athletes about why honest baseline performance protects them (a falsely low baseline means genuine impairment may be missed after injury, putting them at risk). Use embedded validity indicators -- the SCAT6 SAC includes performance patterns that can flag implausible scores (e.g. perfect orientation but very low immediate recall). Compare baseline scores to normative ranges; scores that fall well below expected norms without explanation should trigger retesting.
                  </p>
                </div>

                <div className="border-l-4 border-amber-400 pl-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Suboptimal Testing Conditions</h3>
                  <p>
                    Testing in noisy environments, immediately after physical exertion, in group settings where athletes can overhear each other&apos;s responses, or when athletes are fatigued or distracted produces unreliable data. The testing environment must be controlled: quiet, one-on-one administration, with the athlete rested and attentive.
                  </p>
                </div>

                <div className="border-l-4 border-blue-400 pl-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Practice Effects &amp; Word List Management</h3>
                  <p>
                    The SAC uses standardised word lists for immediate and delayed recall. If the same word list is used at baseline and at post-injury assessment, practice effects inflate the post-injury score, masking genuine impairment. The SCAT6 provides multiple alternate word lists specifically to mitigate this. Clinicians must track which word list was used at baseline and ensure a different list is used for each subsequent assessment.
                  </p>
                </div>

                <div className="border-l-4 border-purple-400 pl-5">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Outdated Baselines</h3>
                  <p>
                    A baseline from two or more years ago may no longer be representative. Adolescent neurocognitive development, ageing-related changes, new medications, and changes in training status all affect performance across domains. Annual re-baseline is the recommended standard (Echemendia et al., 2023). A stale baseline can lead to both false positives (if the athlete&apos;s function has improved since baseline) and false negatives (if it has declined).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Digital vs Paper */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Monitor className="w-8 h-8 text-sky-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Digital vs Paper-Based Baselines
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Both paper-based and digital baseline testing can produce valid data. However, the practical advantages of digital platforms are significant, particularly for clinicians managing baselines across multiple athletes or teams.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                  <h4 className="font-bold text-sky-900 mb-2">Digital Advantages</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <span>Automatic scoring eliminates calculation errors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <span>Baseline-to-post-injury comparison is instant</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <span>Longitudinal trend visualisation across serial assessments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <span>Secure cloud storage -- accessible at sideline, clinic, or hospital</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                      <span>Built-in validity checks flag anomalous scores</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="font-bold text-slate-900 mb-2">Paper-Based Considerations</h4>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      <span>No technology requirements -- pen, paper, stopwatch, ruler</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                      <span>Lower upfront cost for individual practitioners</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Manual scoring increases error risk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>Storage and retrieval challenges -- forms can be lost or misfiled</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>No automated comparison or trend tracking</span>
                    </li>
                  </ul>
                </div>
              </div>
              <p>
                The Amsterdam Consensus Statement does not mandate digital testing, but the practical and clinical advantages are clear. For clinicians managing team baselines, the efficiency gains alone typically justify the investment. For individual practitioners, a digital platform that combines baseline storage with post-injury assessment creates a seamless clinical workflow. If you prefer to start with paper, you&apos;ll find the assessment forms and supporting clinical tools in our <Link href="/resources" className="text-sky-600 hover:underline font-semibold">resources library</Link>.
              </p>
            </div>
          </div>

          {/* Section: Using Baseline Data Post-Injury */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-8 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <h2 className="text-2xl font-bold text-blue-900">
                Using Baseline Data Post-Injury: Reliable Change Indices
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Having a baseline is only useful if you know how to interpret the difference between baseline and post-injury scores. Not every numerical change represents a clinically meaningful decline. This is where <strong>reliable change indices (RCIs)</strong> become essential.
              </p>
              <p>
                An RCI accounts for the test-retest reliability of the assessment instrument, measurement error, and practice effects to determine whether an observed change is statistically meaningful -- that is, whether it exceeds what would be expected from normal test-retest variation alone (Broglio et al., 2007).
              </p>

              <div className="grid md:grid-cols-2 gap-4 my-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700 mb-1">SAC Total Score</div>
                  <div className="text-sm text-slate-600">A decline of 3 or more points from baseline is generally considered clinically significant, accounting for the SAC&apos;s test-retest reliability of approximately .53-.78 (McCrea et al., 2003)</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700 mb-1">mBESS Total Errors</div>
                  <div className="text-sm text-slate-600">An increase of 3 or more errors from baseline warrants clinical concern, based on published RCI values accounting for moderate test-retest reliability (Broglio et al., 2007)</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700 mb-1">Symptom Severity</div>
                  <div className="text-sm text-slate-600">An increase of 10 or more points in total severity score from baseline is associated with clinically meaningful symptom exacerbation</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700 mb-1">VOMS Provocation</div>
                  <div className="text-sm text-slate-600">An increase of 2 or more points above baseline on any VOMS subtest symptom score, or NPC recession to 5 cm or greater, is considered clinically significant (Mucha et al., 2014)</div>
                </div>
              </div>

              <p>
                These thresholds are guidelines, not absolute cut-offs. Clinical judgment remains paramount. An athlete whose SAC score has dropped by 2 points but who also shows a receded NPC, elevated symptom severity, and increased mBESS errors is likely concussed despite no single domain exceeding the RCI threshold in isolation. The convergence of subthreshold changes across multiple domains is itself clinically significant.
              </p>
            </div>
          </div>

          {/* Section: Cost-Benefit */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Cost-Benefit for Clinics &amp; Teams
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                The most common objection to baseline testing is cost -- both in time and money. However, when evaluated against the consequences of inadequate concussion assessment, the investment is strongly favourable.
              </p>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 my-6">
                <h3 className="text-lg font-bold text-sky-900 mb-3">The Investment</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Time:</strong> 15-20 minutes per athlete for a comprehensive baseline battery (symptoms, SAC, mBESS, VOMS)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Personnel:</strong> Can be administered by trained allied health professionals, sports trainers, or nursing staff under clinical oversight</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Equipment:</strong> Minimal -- stopwatch, ruler/tape measure, SCAT6 forms (or digital platform)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-6 my-6">
                <h3 className="text-lg font-bold text-sky-900 mb-3">The Return</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Improved diagnostic accuracy:</strong> Individualised comparison dramatically improves sensitivity and specificity of post-injury assessment versus normative data alone</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Safer return-to-play decisions:</strong> Objective evidence that the athlete has returned to their individual baseline, not just &ldquo;within normal limits&rdquo;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Medicolegal protection:</strong> Documented baseline data demonstrates standard of care and provides defensible evidence for clearance decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Clinical efficiency:</strong> Post-injury assessment is faster and more decisive when individual baselines are available for comparison</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <span><strong>Competitive advantage:</strong> For sports medicine clinics and team medical staff, baseline testing is an expected service that differentiates comprehensive providers from those offering minimum standard care</span>
                  </li>
                </ul>
              </div>

              <p>
                For teams, baseline testing can be offered as a bundled service alongside pre-participation medical examinations. For clinics, it can be billed as a structured assessment with appropriate Medicare or private health item numbers where applicable. The per-athlete cost is modest; the clinical and medicolegal value is substantial.
              </p>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                Broglio, S. P., Macciocchi, S. N., &amp; Ferrara, M. S. (2007). Sensitivity of the concussion assessment battery. <em>Neurosurgery</em>, 60(6), 1050-1058.
              </li>
              <li>
                McCrea, M., Barr, W. B., Guskiewicz, K., Randolph, C., Marshall, S. W., Cantu, R., ... &amp; Kelly, J. P. (2005). Standard regression-based methods for measuring recovery after sport-related concussion. <em>Journal of the International Neuropsychological Society</em>, 11(1), 58-69.
              </li>
              <li>
                McCrea, M., Guskiewicz, K. M., Marshall, S. W., Barr, W., Randolph, C., Cantu, R. C., ... &amp; Kelly, J. P. (2003). Acute effects and recovery time following concussion in collegiate football players. <em>JAMA</em>, 290(19), 2556-2563.
              </li>
              <li>
                Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool - 6th Edition (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622-631.
              </li>
              <li>
                Mucha, A., Collins, M. W., Elbin, R. J., Furman, J. M., Troutman-Enseki, C., DeWolf, R. M., ... &amp; Kontos, A. P. (2014). A brief Vestibular/Ocular Motor Screening (VOMS) assessment to evaluate concussions. <em>American Journal of Sports Medicine</em>, 42(10), 2479-2486.
              </li>
              <li>
                Erdal, K. (2012). Neuropsychological testing for sports-related concussion: how athletes can sandbag their baseline testing without detection. <em>Archives of Clinical Neuropsychology</em>, 27(5), 473-479.
              </li>
              <li>
                Galetta, K. M., Brandes, L. E., Maki, K., Dziemianowicz, M. S., Laudano, E., Allen, M., ... &amp; Balcer, L. J. (2011). The King-Devick test and sports-related concussion: study of a rapid visual screening tool in a collegiate cohort. <em>Journal of the Neurological Sciences</em>, 309(1-2), 34-39.
              </li>
              <li>
                Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport -- Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695-711.
              </li>
            </ul>
          </div>

          <RelatedPosts slugs={['bess-testing', 'voms-screening', 'scat6-guide']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Take the Next Step</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Master baseline testing, SCAT6/SCOAT6 administration, and post-injury comparison. Our courses cover the complete concussion assessment workflow -- from pre-season baselines through return-to-play clearance -- with hands-on training in all assessment domains.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
                Full Course — 8 CPD hrs online, up to 16 with the in-person day · from $1,190 early-bird
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
