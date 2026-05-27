import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, Stethoscope, AlertTriangle, Activity, Eye, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "Persistent Post-Concussion Symptoms (PPCS): A Clinician's Workup [2026]"
const DESCRIPTION = "Persistent post-concussion symptoms management — the chronic 5-20% who don't resolve in standard timeframes. PPCS criteria, vestibulo-ocular + cervical workup, escalation pathways, active rehabilitation protocols for AU/UK/US/CA clinicians."
const URL = 'https://portal.concussion-education-australia.com/blog/persistent-post-concussion-symptoms-clinician-workup'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'persistent post-concussion symptoms, ppcs management, chronic concussion symptoms, post concussion syndrome, ppcs workup, ppcs treatment, concussion not resolving, chronic concussion rehab',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL },
  alternates: { canonical: URL },
}

export default function PpcsWorkupPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createBlogPostSchema({ title: TITLE, description: DESCRIPTION, datePublished: '2026-05-27', dateModified: '2026-05-27', author: 'Zac Lewis', url: URL })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'What are persistent post-concussion symptoms (PPCS)?', acceptedAnswer: { '@type': 'Answer', text: 'PPCS describes the 5-20% of concussion cases where symptoms fail to resolve within the expected timeframe — typically >4 weeks in adults and >2 weeks in children. Common features include persistent headache, vestibulo-ocular dysfunction (about 70% of cases), cervical contribution (about 54%), cognitive fog, sleep disturbance, and mood symptoms. PPCS is not a single disease — it is a clinical syndrome with multiple contributing drivers requiring a multi-modal workup.' } },
          { '@type': 'Question', name: 'When does a concussion become PPCS?', acceptedAnswer: { '@type': 'Answer', text: 'Standard recovery timeframes are 4 weeks for adults and 2 weeks for children. Symptoms persisting beyond these points warrant a chronic-case workup, not just continued acute management. Earlier action (around week 2-3 if recovery has stalled) often improves outcomes vs waiting for the formal 4-week threshold.' } },
          { '@type': 'Question', name: 'Why do some concussions become persistent?', acceptedAnswer: { '@type': 'Answer', text: 'Multiple drivers contribute, often in combination: unresolved vestibulo-ocular dysfunction, cervical injury that was not assessed at acute presentation, autonomic dysregulation, post-traumatic headache with sensitisation, sleep disturbance feeding back into all of the above, and psychosocial factors (anxiety, fear-avoidance, return-to-work pressure). A workup must address each plausible driver, not just the most obvious symptom.' } },
          { '@type': 'Question', name: 'Who should manage PPCS — GP, physio, or specialist?', acceptedAnswer: { '@type': 'Answer', text: 'PPCS is best managed multi-modally. A primary clinician (physio with vestibular + cervical depth, or a GP coordinating) leads. Specialist referrals (neurology, vestibular specialist, neuropsychology, headache clinic, sports physician) are appropriate when red flags appear or when first-line management plateaus. The clinician seeing the patient most often is usually the right hub — they need a workup framework, not just a referral pad.' } },
        ],
      }) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-purple-800 to-indigo-800 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">Chronic Concussion Management</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Persistent Post-Concussion Symptoms (PPCS): A Clinician&apos;s Workup [2026]</h1>
            <p className="text-lg text-purple-100 mb-4">The 5-20% of concussion cases that don&apos;t resolve in standard timeframes. Here&apos;s the clinical workup framework — vestibulo-ocular, cervical, autonomic, and when to escalate.</p>
            <div className="flex items-center gap-3 text-purple-200 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 10 min read</span></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          <div className="bg-white rounded-xl shadow-sm border-2 border-purple-300 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3">Persistent post-concussion symptoms (PPCS) describes the <strong>5-20% of concussion cases</strong> where symptoms fail to resolve within the standard timeframe — typically &gt;4 weeks in adults, &gt;2 weeks in children. A PPCS workup must cover four contributing systems:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-700">
              <li><strong>Vestibulo-ocular dysfunction</strong> — present in ~70% of PPCS cases</li>
              <li><strong>Cervical contribution</strong> — present in ~54%, often missed at acute presentation</li>
              <li><strong>Autonomic dysregulation</strong> — exercise intolerance, orthostatic symptoms</li>
              <li><strong>Post-traumatic headache + sensitisation</strong> — primary or migraine-overlap phenotype</li>
            </ul>
            <p className="text-sm text-slate-600 italic mt-4">Standard acute concussion training (SCAT6, return-to-play) doesn&apos;t cover this. The full clinical workup framework is below — and we&apos;ve built a forthcoming course around it.</p>
          </div>

          <Section icon={Stethoscope} title="PPCS criteria and timing">
            <p>The clinical definition is not a single rule. Different consensus statements use different thresholds, but the practical line most clinicians work to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Adults:</strong> symptoms persisting &gt;4 weeks post-injury</li>
              <li><strong>Children + adolescents:</strong> symptoms persisting &gt;2 weeks post-injury (faster threshold reflects faster expected recovery in younger patients)</li>
              <li><strong>Functional impairment</strong> — not just the presence of symptoms, but the impact on daily activity, school, work, or sport</li>
            </ul>
            <p>Earlier action matters. If recovery has clearly stalled by week 2-3 in an adult, starting the PPCS workup then improves outcomes vs waiting for the formal 4-week threshold. Don&apos;t use the timeframe as an excuse to do nothing.</p>
          </Section>

          <Section icon={Eye} title="The vestibulo-ocular workup (~70% of PPCS)">
            <p>Up to 70% of PPCS cases involve unresolved vestibulo-ocular dysfunction. The acute VOMS (Vestibular/Ocular Motor Screening) is your starting point, but PPCS requires going deeper.</p>
            <p>Full workup includes:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>VOMS components in detail</strong> — smooth pursuits, saccades, near-point convergence (NPC), VOR (horizontal + vertical), visual motion sensitivity. Provoking symptom + objective sign on each.</li>
              <li><strong>Quantified NPC</strong> — convergence insufficiency is a common chronic driver; persistent NPC &gt;6cm indicates dysfunction that benefits from targeted treatment.</li>
              <li><strong>BPPV screening</strong> — Dix-Hallpike and supine roll test. BPPV after head trauma is common and treatable; missing it leaves a fixable cause active.</li>
              <li><strong>Gaze stability training tolerance</strong> — VOR ×1 and ×2 exercises with symptom and performance benchmarks.</li>
            </ul>
            <p>See our existing guide: <Link href="/blog/vestibular-ocular-screening-voms-concussion" className="text-purple-700 underline">Vestibular/Ocular Motor Screening (VOMS) in Concussion Care</Link>.</p>
          </Section>

          <Section icon={Activity} title="The cervical workup (~54% of PPCS)">
            <p>Cervical contribution is the most commonly missed driver in chronic concussion. Mechanism makes it inevitable — any head-impact mechanism is also a cervical-acceleration mechanism. But cervical assessment is rarely done at acute presentation because the head injury dominates clinical attention.</p>
            <p>Cervical workup for PPCS:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Active cervical range of motion</strong> — quantified, comparing to expected for age + sex. Pain provocation patterns.</li>
              <li><strong>Cervical flexor endurance test</strong> — deep neck flexor strength + endurance commonly reduced after whiplash-type mechanism.</li>
              <li><strong>Cervicogenic dizziness screening</strong> — neck torsion test, cervical relocation test. See our dedicated article: <Link href="/blog/cervicogenic-drivers-chronic-concussion" className="text-purple-700 underline">Cervicogenic Drivers in Chronic Concussion</Link>.</li>
              <li><strong>Joint segmental assessment</strong> — upper cervical (C0-C3) is the primary contributor to cervicogenic headache + dizziness; assess passive intervertebral motion.</li>
              <li><strong>Trigger point + soft tissue</strong> — sub-occipitals, scalenes, trapezius, sternocleidomastoid.</li>
            </ul>
          </Section>

          <Section icon={Activity} title="Autonomic dysregulation + exercise intolerance">
            <p>A subset of PPCS cases present with exercise intolerance disproportionate to other symptoms — the patient feels OK at rest but symptoms flare with mild aerobic activity. This is autonomic dysregulation, not deconditioning.</p>
            <p>Assessment:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Buffalo Concussion Treadmill Test (BCTT)</strong> or equivalent — graded aerobic exercise to symptom threshold, captures heart rate at symptom onset.</li>
              <li><strong>Orthostatic vitals</strong> — lying vs standing BP + HR. Persistent orthostatic intolerance points to autonomic involvement.</li>
              <li><strong>Subjective exercise tolerance log</strong> — patient-reported activity + symptom diary for 2 weeks.</li>
            </ul>
            <p>Treatment is sub-symptom-threshold aerobic exercise prescribed at a heart rate just below symptom provocation. This is the active-rehabilitation approach that replaced the now-obsolete &ldquo;wait until symptom-free&rdquo; doctrine: see <Link href="/blog/concussion-update-2026-wait-until-symptom-free-obsolete" className="text-purple-700 underline">2026 Concussion Update — Why &ldquo;Wait Until Symptom Free&rdquo; is Obsolete</Link>.</p>
          </Section>

          <Section icon={AlertTriangle} title="Escalation criteria — when to refer">
            <p>Red flags warranting specialist referral from a primary-care PPCS workup:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Neurology:</strong> new focal neurological signs, progressive cognitive decline, seizure, severe persistent headache unresponsive to first-line management, suspected second-impact syndrome.</li>
              <li><strong>Vestibular specialist / audiology:</strong> persistent BPPV-negative vertigo, suspected vestibular hypofunction needing instrumented testing (caloric, vHIT).</li>
              <li><strong>Headache clinic:</strong> chronic daily headache, medication overuse headache risk, migraine-overlap phenotype not responding to standard care.</li>
              <li><strong>Neuropsychology:</strong> persistent cognitive symptoms (memory, attention, processing speed) impacting function &gt;3 months, return-to-school/work planning support.</li>
              <li><strong>Sports medicine / mTBI clinic:</strong> persistent symptoms &gt;3 months not responding to multi-modal management, complex return-to-play decisions.</li>
              <li><strong>Mental health:</strong> mood, anxiety, sleep disturbance moving from secondary to primary problem.</li>
            </ul>
          </Section>

          <Section icon={CheckCircle} title="Active rehabilitation — the integrated plan">
            <p>The active-rehabilitation principle (rather than passive symptom-waiting) applies to PPCS too. A typical multi-modal plan:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Vestibulo-ocular rehab</strong> — VOR exercises, gaze stability, NPC training, BPPV repositioning if positive</li>
              <li><strong>Cervical management</strong> — manual therapy, deep neck flexor strengthening, segmental mobilisation</li>
              <li><strong>Sub-threshold aerobic exercise</strong> — heart-rate-prescribed, progressed weekly</li>
              <li><strong>Headache education + medication review</strong> — avoid medication overuse, consider migraine pathways if phenotype fits</li>
              <li><strong>Sleep + cognitive pacing</strong> — sleep hygiene, return-to-work/school graded re-exposure</li>
              <li><strong>Psychoeducation</strong> — recovery expectations, fear-avoidance counselling</li>
            </ul>
            <p>The art is sequencing — not every patient needs everything in week one. Identify the dominant driver, address it, reassess at 2-week intervals.</p>
          </Section>

          <section className="bg-gradient-to-br from-purple-800 to-indigo-800 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">PPCS Clinical Mastery course — joining the waitlist</h2>
            <p className="text-purple-100 leading-relaxed mb-5">We&apos;re building a dedicated course on PPCS — the chronic-case workup in depth, with worked clinical scenarios across vestibulo-ocular, cervical, autonomic, and headache subtypes. Target launch August 2026. Waitlist members get 50% off launch week.</p>
            <Link href="/ppcs-waitlist" className="inline-flex items-center gap-2 bg-white text-purple-800 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-purple-50 transition-colors">Join the PPCS waitlist (50% off launch)</Link>
          </section>

          <RelatedPosts slugs={['cervicogenic-drivers-chronic-concussion', 'vestibulo-ocular-workup-ppcs', 'concussion-update-2026-wait-until-symptom-free-obsolete']} />
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
      <div className="flex items-center gap-3 mb-4"><Icon className="w-7 h-7 text-purple-700" /><h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  )
}
