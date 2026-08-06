import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, Activity, Stethoscope, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "Cervicogenic Drivers in Chronic Concussion — Why Every PPCS Patient Needs a Cervical Assessment [2026]"
const DESCRIPTION = "Cervicogenic contribution to persistent post-concussion symptoms — a treatable driver that is routinely missed at acute presentation. Clinical assessment, cervicogenic dizziness vs headache, differential diagnosis, manual therapy applications for AU/UK/US/CA clinicians."
const URL = 'https://portal.concussion-education-australia.com/blog/cervicogenic-drivers-chronic-concussion'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'cervicogenic post-concussion, cervical contribution to concussion, whiplash post-concussion, cervicogenic dizziness, cervicogenic headache, chronic concussion cervical, ppcs cervical, neck contribution concussion symptoms',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL, images: ['/og-image.jpg'], publishedTime: '2026-05-27' },
  alternates: { canonical: URL },
}

export default function CervicogenicChronicConcussionPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createBlogPostSchema({ title: TITLE, description: DESCRIPTION, datePublished: '2026-05-27', dateModified: '2026-05-27', author: 'Zac Lewis', url: URL })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Why is the cervical spine relevant in chronic concussion?', acceptedAnswer: { '@type': 'Answer', text: 'Any head-impact mechanism is also a cervical-acceleration mechanism. Whiplash-type forces transmit through the cervical spine on impact, often injuring soft tissue and joint structures simultaneously with the brain injury. A cervical contribution to ongoing dizziness, headache, or both is common in persistent post-concussion symptom (PPCS) cases. Because acute clinical attention focuses on the brain injury, cervical assessment is routinely missed at first presentation — leaving a treatable driver active in chronic cases.' } },
          { '@type': 'Question', name: 'How do you tell cervicogenic dizziness from vestibular dizziness?', acceptedAnswer: { '@type': 'Answer', text: 'Cervicogenic dizziness is provoked by neck position or movement, often without nystagmus. Vestibular dizziness is typically associated with nystagmus, may follow head position changes (BPPV) or vestibular hypofunction patterns, and is reproduced by vestibular-specific testing (Dix-Hallpike, head-impulse test). The cervical relocation test and neck torsion test can help differentiate. Both can coexist in PPCS.' } },
          { '@type': 'Question', name: 'What is cervicogenic headache?', acceptedAnswer: { '@type': 'Answer', text: 'Cervicogenic headache is unilateral headache referred from cervical spine structures (typically C0-C3 joints, sub-occipital musculature). Diagnostic features include reproduction by cervical movement or palpation, restricted cervical range of motion, and absence of migraine-typical features. Common after head-trauma mechanisms with whiplash component.' } },
          { '@type': 'Question', name: 'When should I assess the cervical spine after concussion?', acceptedAnswer: { '@type': 'Answer', text: 'At every presentation. Acute assessment should include at minimum a cervical screen even when the head injury dominates. For any patient with persistent symptoms beyond 2 weeks (children) or 4 weeks (adults), a full cervical workup is essential — this is one of the most commonly missed treatable drivers in PPCS.' } },
        ],
      }) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-rose-700 to-pink-700 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">Chronic Concussion Management</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Cervicogenic Drivers in Chronic Concussion — Why Every PPCS Patient Needs a Cervical Assessment [2026]</h1>
            <p className="text-lg text-rose-100 mb-4">Any concussion mechanism is also a whiplash mechanism. The cervical spine is the most commonly missed driver of persistent post-concussion symptoms — here&apos;s the clinical workup.</p>
            <div className="flex items-center gap-3 text-rose-200 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 7 min read</span></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          <div className="bg-white rounded-xl shadow-sm border-2 border-rose-300 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3">A <strong>cervical contribution to ongoing dizziness, headache, or both is common in persistent post-concussion symptom (PPCS) cases</strong>. The mechanism is straightforward — any head-impact mechanism is also a cervical-acceleration mechanism. What&apos;s missing is the assessment habit: clinical attention at acute presentation goes to the brain injury, and the cervical spine doesn&apos;t get examined until the patient is still symptomatic weeks later.</p>
            <p className="text-slate-700 leading-relaxed">Cervicogenic contribution shows up as cervicogenic dizziness, cervicogenic headache, restricted cervical motion, or all three. It is highly treatable with manual therapy + deep neck flexor strengthening — but only if it&apos;s identified.</p>
          </div>

          <Section icon={Activity} title="Why the cervical spine matters in concussion">
            <p>Concussion biomechanics involve linear and rotational acceleration of the head. The neck transmits and absorbs those forces. The same impact that produces brain injury produces cervical soft-tissue strain, facet joint irritation, and (in higher-velocity injuries) ligamentous injury. Concurrent cervical injury occurs in up to 70% of sport-related concussions (Schneider et al., 2014, <em>British Journal of Sports Medicine</em> 48(17), 1294-1298).</p>
            <p>This is anatomically inevitable. Yet at acute presentation:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Clinical attention focuses on the head — SCAT6, GCS, red flag screening</li>
              <li>The patient&apos;s primary complaint is usually headache, nausea, dizziness — none of which automatically point the clinician toward the cervical spine</li>
              <li>If the cervical exam happens at all, it&apos;s often a brief range-of-motion check, not a structured workup</li>
            </ul>
            <p>The result is that the cervical contribution is identified only later — usually when the patient hasn&apos;t resolved and someone with a chronic-case framework finally looks for it.</p>
          </Section>

          <Section icon={Stethoscope} title="Cervicogenic dizziness — what it is and how to spot it">
            <p>Cervicogenic dizziness is dizziness arising from afferent input mismatch — proprioceptive signals from injured cervical structures conflict with vestibular and visual signals, producing the subjective sensation of imbalance or vertigo.</p>
            <p>Clinical features that differentiate it from vestibular dizziness:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Provoked by neck position/movement</strong> rather than head movement specifically</li>
              <li><strong>No typical nystagmus pattern</strong> on positional testing (vs BPPV which has stereotyped patterns)</li>
              <li><strong>Associated with cervical pain or restriction</strong></li>
              <li><strong>Improves with cervical treatment</strong> (manual therapy, mobilisation) — diagnostic-therapeutic test</li>
            </ul>
            <p>Targeted tests:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Neck torsion test (Norré)</strong> — patient sitting, head held stationary, body rotated. If symptoms reproduce, cervicogenic involvement is likely.</li>
              <li><strong>Cervical relocation test</strong> — patient closes eyes, head rotated to target, asked to return to neutral. Increased error suggests cervical proprioceptive dysfunction.</li>
            </ul>
            <p>Note: cervicogenic dizziness and vestibular dysfunction frequently coexist in PPCS. Identifying the cervical contribution doesn&apos;t rule out the need for vestibular workup — see our <Link href="/blog/vestibulo-ocular-workup-ppcs" className="text-rose-700 underline">vestibulo-ocular workup article</Link>.</p>
          </Section>

          <Section icon={Stethoscope} title="Cervicogenic headache — clinical features">
            <p>Cervicogenic headache is unilateral headache referred from cervical structures, most commonly the upper cervical joints (C0-C3) and sub-occipital musculature.</p>
            <p>Diagnostic features:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Unilateral</strong> (almost always) and side-locked (stays on the same side over time)</li>
              <li><strong>Reproduced by cervical movement or palpation</strong> of upper cervical structures</li>
              <li><strong>Restricted cervical ROM</strong>, particularly in rotation to the symptomatic side</li>
              <li><strong>Absence of migraine-typical features</strong> (photophobia, phonophobia, aura) — though overlap can occur</li>
              <li><strong>May radiate to ipsilateral forehead, eye, or temple</strong></li>
            </ul>
            <p>Differential with migraine, tension-type headache, and post-traumatic headache is important — see the <Link href="/blog/persistent-post-concussion-symptoms-clinician-workup" className="text-rose-700 underline">full PPCS workup</Link> for the wider headache assessment framework.</p>
          </Section>

          <Section icon={Activity} title="The cervical workup for PPCS — clinical exam">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Active cervical range of motion</strong>, quantified. Flexion, extension, lateral flexion (both sides), rotation (both sides). Compare to expected for age. Pain provocation pattern at end-range.</li>
              <li><strong>Cervical flexor endurance test</strong> — supine, head retracted and lifted, hold time recorded. Reduced endurance is a near-universal finding post-whiplash and is highly trainable.</li>
              <li><strong>Passive segmental assessment</strong> — particularly upper cervical (C0-C3 joints). Assess passive intervertebral motion, end-feel, pain reproduction.</li>
              <li><strong>Sub-occipital muscle palpation</strong> — trigger points, tone, tenderness. Sub-occipital + scalenes + sternocleidomastoid are the consistent involvement pattern.</li>
              <li><strong>Neurological screen</strong> — myotomes, dermatomes, reflexes — to rule out radiculopathy or other red flags.</li>
              <li><strong>Provocation tests</strong> — neck torsion (described above), upper cervical flexion-rotation test for C1-C2 mobility.</li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="Cervical red flags after head trauma">
            <p>The cervical workup must always start with red-flag exclusion in any post-trauma presentation. Refer urgently for imaging if any of:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Persistent neurological deficit (motor, sensory, reflex)</li>
              <li>Bladder/bowel symptoms or saddle anaesthesia (suspect cord/cauda equina)</li>
              <li>Severe persistent pain unresponsive to first-line management</li>
              <li>High-energy mechanism (motor vehicle, fall from height, sport with significant force) — apply Canadian C-Spine Rule</li>
              <li>Age &gt;65 with any cervical complaint after fall</li>
            </ul>
            <p>If red flags are absent and the patient is in the chronic-symptom window, the cervical workup is safe to proceed.</p>
          </Section>

          <Section icon={Stethoscope} title="Treatment principles">
            <p>Cervical contribution to PPCS responds well to multi-modal treatment:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Manual therapy</strong> — joint mobilisation (upper + lower cervical), soft tissue work for sub-occipitals + scalenes</li>
              <li><strong>Deep neck flexor strengthening</strong> — craniocervical flexion exercise (Jull protocol). Build endurance progressively.</li>
              <li><strong>Postural retraining</strong> — particularly relevant for screen-heavy occupational profiles</li>
              <li><strong>Sensorimotor retraining</strong> — cervical relocation training, gaze stability with cervical input</li>
              <li><strong>Patient education</strong> — explain the cervical contribution; patients often have only been told they have a &ldquo;concussion that won&apos;t resolve&rdquo; and don&apos;t know cervical involvement is the missing piece</li>
            </ul>
            <p>Expect noticeable improvement within 4-6 sessions if cervical contribution is a primary driver. If no improvement, the cervical is contributing but not primary — escalate to the broader PPCS workup.</p>
          </Section>

          <section className="bg-gradient-to-br from-rose-700 to-pink-700 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">PPCS course in development — join the waitlist</h2>
            <p className="text-rose-100 leading-relaxed mb-5">We&apos;re developing a dedicated PPCS course covering the chronic-case workup in depth — vestibulo-ocular, cervical, autonomic, and headache drivers, with worked clinical scenarios. There&apos;s no launch date yet. Join the waitlist and you&apos;ll be the first to hear when it opens.</p>
            <Link href="/ppcs-waitlist" className="inline-flex items-center gap-2 bg-white text-rose-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-rose-50 transition-colors">Join the PPCS waitlist</Link>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm font-semibold text-rose-100 mb-3">Available now:</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors text-center">Free SCAT Mastery course</Link>
                <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors text-center">Concussion Clinical Mastery — {CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hrs online, up to {CONFIG.COURSE.TOTAL_CPD_POINTS} with the in-person day · from ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} early-bird</Link>
              </div>
            </div>
          </section>

          {/* Headache differential replaces the acute SCAT6 admin guide here:
              this post's own body defers the migraine / tension-type differential
              elsewhere, and a dedicated article for it now exists. */}
          <RelatedPosts slugs={['persistent-post-concussion-symptoms-clinician-workup', 'vestibulo-ocular-workup-ppcs', 'cervicogenic-vs-migraine-vs-tension-headache-differential']} />
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
      <div className="flex items-center gap-3 mb-4"><Icon className="w-7 h-7 text-rose-700" /><h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  )
}
