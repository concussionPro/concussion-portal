import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, Brain, Stethoscope, AlertTriangle, GitCompare } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "Cervicogenic vs Migraine vs Tension Headache — The Post-Concussion Differential [2026]"
const DESCRIPTION = "Post-concussion headache is a timing category, not a diagnosis. How to phenotype cervicogenic vs migraine vs tension-type headache after concussion — distinguishing features, a side-by-side comparison table, and why the phenotype (not the concussion label) drives management. For AU/UK/US/CA clinicians."
const URL = 'https://portal.concussion-education-australia.com/blog/cervicogenic-vs-migraine-vs-tension-headache-differential'
const PUBLISHED = '2026-07-12'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'post-concussion headache, cervicogenic vs migraine, post-traumatic headache, headache differential concussion, cervicogenic headache, post-traumatic migraine, tension-type headache concussion, headache phenotype concussion, ICHD-3 post-traumatic headache',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL, images: ['/og-image.jpg'], publishedTime: PUBLISHED },
  alternates: { canonical: URL },
}

export default function HeadacheDifferentialPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createBlogPostSchema({ title: TITLE, description: DESCRIPTION, datePublished: PUBLISHED, dateModified: PUBLISHED, author: 'Zac Lewis', url: URL })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Is post-concussion headache a diagnosis?', acceptedAnswer: { '@type': 'Answer', text: 'No. "Post-traumatic headache" is a timing category, not a headache type — the ICHD-3 definition is simply a headache that begins within 7 days of the injury (or of regaining consciousness). It tells you when the headache started, not what is driving it. The clinically useful step is to phenotype it: the same post-concussion headache is usually cervicogenic, migraine-phenotype, tension-type, or a mixture. The phenotype — not the concussion label — is what determines treatment.' } },
          { '@type': 'Question', name: 'How do you tell cervicogenic headache from migraine after concussion?', acceptedAnswer: { '@type': 'Answer', text: 'Cervicogenic headache is usually unilateral and side-locked, starts in the neck or occiput and refers forward, is reproduced by neck movement or palpation of the upper cervical spine, and comes with reduced cervical range of motion (often a positive flexion-rotation test). Migraine-phenotype headache is throbbing and moderate-to-severe, is aggravated by routine activity, and carries migraine features — photophobia, phonophobia, nausea, and sometimes aura. Cervical provocation and restricted neck motion point to cervicogenic; light and sound sensitivity with nausea point to migraine. The two frequently coexist after a head-and-neck mechanism.' } },
          { '@type': 'Question', name: 'Can a patient have more than one headache type after concussion?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — mixed pictures are common. Any concussion mechanism is also a cervical-acceleration (whiplash) mechanism, so a cervicogenic component sits alongside a migraine or tension-type phenotype in a large proportion of persistent cases. Treating only the dominant phenotype and missing the coexisting driver is a common reason headaches fail to resolve. Assess for each phenotype rather than assigning a single label.' } },
          { '@type': 'Question', name: 'When should a post-concussion headache be referred or imaged?', acceptedAnswer: { '@type': 'Answer', text: 'Escalate urgently for a thunderclap or first-and-worst headache, a progressively worsening headache, new focal neurological signs, headache with fever and neck stiffness, or any red flag on trauma screening. Also review medication use: analgesic or triptan use on more than 10-15 days per month can drive medication-overuse headache and mimic a non-resolving post-concussion headache.' } },
        ],
      }) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-indigo-700 to-violet-700 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">Concussion Clinical Assessment</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Cervicogenic vs Migraine vs Tension Headache — The Post-Concussion Differential</h1>
            <p className="text-lg text-indigo-100 mb-4">&ldquo;Post-concussion headache&rdquo; is a timing category, not a diagnosis. The phenotype underneath it &mdash; not the concussion label &mdash; is what decides the treatment.</p>
            <div className="flex items-center gap-3 text-indigo-200 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 12 Jul 2026 &mdash; 8 min read</span></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-300 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3">Headache is the most common persistent symptom after concussion &mdash; but <strong>&ldquo;post-traumatic headache&rdquo; is a timing category, not a headache type.</strong> The ICHD-3 definition is simply a headache that starts within 7 days of the injury. It tells you <em>when</em> the headache began, not <em>what is driving it</em>.</p>
            <p className="text-slate-700 leading-relaxed mb-3">The clinically useful move is to <strong>phenotype it</strong>. The same post-concussion headache is usually one of three patterns &mdash; <strong>cervicogenic</strong>, <strong>migraine-phenotype</strong>, or <strong>tension-type</strong> &mdash; or a mixture. Each responds to a different treatment. The concussion label doesn&rsquo;t point you anywhere; the phenotype does.</p>
            <p className="text-slate-700 leading-relaxed">Get the phenotype wrong and the headache doesn&rsquo;t resolve: blanket analgesia risks medication-overuse headache, a cervicogenic driver keeps firing until the neck is treated, and a migraine phenotype needs migraine-directed management. This article gives you the differential framework and the side-by-side signs; the full workup and management protocol is covered in the course.</p>
          </div>

          <Section icon={Brain} title="Why the concussion label isn't a diagnosis">
            <p>Under ICHD-3, an acute post-traumatic headache is defined purely by timing &mdash; onset within 7 days of the head injury, of regaining consciousness, or of regaining the ability to sense and report pain. It becomes <em>persistent</em> post-traumatic headache when it continues beyond 3 months. Nothing in that definition specifies a mechanism or a phenotype.</p>
            <p>That matters because the treatment lives in the phenotype, not the timing. Two patients with identical &ldquo;post-concussion headache&rdquo; on the referral letter can need completely different plans: one a course of cervical manual therapy and deep neck flexor work, the other a migraine-directed strategy. Assigning the single label &ldquo;post-concussion headache&rdquo; and prescribing rest plus analgesia is where a treatable headache quietly becomes a chronic one.</p>
          </Section>

          <Section icon={GitCompare} title="The differential at a glance">
            <p>The three phenotypes separate cleanly on a handful of features. Use this as a first-pass screen, then confirm with targeted examination.</p>
            <div className="overflow-x-auto -mx-2 mt-2">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-indigo-50 text-slate-900">
                    <th className="text-left font-bold p-3 border border-slate-200">Feature</th>
                    <th className="text-left font-bold p-3 border border-slate-200">Cervicogenic</th>
                    <th className="text-left font-bold p-3 border border-slate-200">Migraine-phenotype</th>
                    <th className="text-left font-bold p-3 border border-slate-200">Tension-type</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 align-top">
                  <tr>
                    <td className="p-3 border border-slate-200 font-semibold">Laterality</td>
                    <td className="p-3 border border-slate-200">Unilateral, side-locked</td>
                    <td className="p-3 border border-slate-200">Unilateral or bilateral</td>
                    <td className="p-3 border border-slate-200">Bilateral</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 border border-slate-200 font-semibold">Quality &amp; severity</td>
                    <td className="p-3 border border-slate-200">Dull, aching, non-throbbing; moderate</td>
                    <td className="p-3 border border-slate-200">Throbbing/pulsating; moderate&ndash;severe</td>
                    <td className="p-3 border border-slate-200">Pressing/tightening &ldquo;band&rdquo;; mild&ndash;moderate</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-slate-200 font-semibold">Origin / pattern</td>
                    <td className="p-3 border border-slate-200">Starts occiput/neck, refers frontotemporal</td>
                    <td className="p-3 border border-slate-200">Discrete attacks, 4&ndash;72 h</td>
                    <td className="p-3 border border-slate-200">Diffuse, often daily background</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 border border-slate-200 font-semibold">Provoked by</td>
                    <td className="p-3 border border-slate-200">Neck movement, sustained posture, upper-cervical palpation</td>
                    <td className="p-3 border border-slate-200">Routine physical activity, sensory load, triggers</td>
                    <td className="p-3 border border-slate-200">Stress, fatigue, poor sleep &mdash; not routine activity</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-slate-200 font-semibold">Associated features</td>
                    <td className="p-3 border border-slate-200">Neck pain/stiffness; usually no nausea or aura</td>
                    <td className="p-3 border border-slate-200">Photophobia + phonophobia, nausea, &plusmn; aura</td>
                    <td className="p-3 border border-slate-200">No nausea; not both photo- and phonophobia</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-3 border border-slate-200 font-semibold">Cervical signs</td>
                    <td className="p-3 border border-slate-200">Reduced ROM, positive flexion-rotation test, tender C0&ndash;C3</td>
                    <td className="p-3 border border-slate-200">Usually normal (may coexist)</td>
                    <td className="p-3 border border-slate-200">Often tender pericranial muscles</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-slate-200 font-semibold">Management direction</td>
                    <td className="p-3 border border-slate-200">Cervical: manual therapy + deep neck flexor training</td>
                    <td className="p-3 border border-slate-200">Migraine-directed; trigger &amp; load management</td>
                    <td className="p-3 border border-slate-200">Load, sleep, stress, posture; manual therapy adjunct</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-500 mt-1">Screening aid, not a substitute for examination. Mixed presentations are common &mdash; assess for each phenotype rather than forcing one label.</p>
          </Section>

          <Section icon={Stethoscope} title="Cervicogenic headache — the one most often missed">
            <p>Any concussion mechanism is also a cervical-acceleration mechanism, so the neck is injured in the same event as the brain. That makes cervicogenic headache common after concussion &mdash; and the phenotype most often missed, because acute attention goes to the head injury.</p>
            <p>The signal to look for: a <strong>unilateral, side-locked</strong> headache that <strong>starts in the neck or occiput and refers forward</strong>, is <strong>reproduced by neck movement or palpation</strong> of the upper cervical joints, and sits with <strong>restricted cervical range of motion</strong> (a positive cervical flexion-rotation test points to C1&ndash;C2). Migraine-typical features are usually absent. Because it is driven by a treatable structural source, it responds to cervical management once identified &mdash; but only if it&rsquo;s identified. We cover the cervical workup in depth in the <Link href="/blog/cervicogenic-drivers-chronic-concussion" className="text-indigo-700 underline">cervicogenic drivers in chronic concussion</Link> article.</p>
          </Section>

          <Section icon={Brain} title="Migraine-phenotype and tension-type after concussion">
            <p><strong>Migraine-phenotype (post-traumatic migraine)</strong> is the most disabling of the three and is frequently under-recognised after concussion. Look for a <strong>throbbing, moderate-to-severe</strong> headache that is <strong>aggravated by routine activity</strong> and carries <strong>photophobia, phonophobia, and nausea</strong>, sometimes with aura. It matters clinically because it overlaps with the exercise-intolerance picture of concussion &mdash; light and sound sensitivity and activity aggravation can blur with the wider symptom set &mdash; and because it needs migraine-directed management rather than generic analgesia.</p>
            <p><strong>Tension-type</strong> is a <strong>bilateral, pressing/tightening &ldquo;band&rdquo;</strong> of mild-to-moderate intensity that is <strong>not aggravated by routine activity</strong> and lacks nausea. It is the most benign phenotype and responds to load management, sleep and stress work, posture, and manual therapy as an adjunct &mdash; but it is also the easiest to over-attribute to, so confirm you haven&rsquo;t mislabelled a cervicogenic or migraine phenotype as &ldquo;just tension.&rdquo;</p>
          </Section>

          <Section icon={AlertTriangle} title="Red flags and medication-overuse headache">
            <p>Phenotyping assumes you have already cleared the dangerous causes. Escalate urgently for any of:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Thunderclap or first-and-worst headache</strong> &mdash; suspect haemorrhage</li>
              <li><strong>Progressively worsening</strong> headache over days to weeks</li>
              <li><strong>New focal neurological signs</strong>, seizure, or reduced consciousness</li>
              <li><strong>Fever with neck stiffness</strong> or systemic features</li>
              <li>Any positive item on standard post-trauma / cervical red-flag screening</li>
            </ul>
            <p>Then check the medication history. <strong>Medication-overuse headache</strong> &mdash; from analgesic or triptan use on more than roughly 10&ndash;15 days per month &mdash; is a common reason a post-concussion headache stops resolving and mimics a treatment-resistant phenotype. It won&rsquo;t improve until the overused medication is addressed, no matter how good the rest of the plan is.</p>
          </Section>

          <Section icon={GitCompare} title="Why the phenotype changes the plan">
            <p>The whole point of the differential is that the three phenotypes diverge on treatment. A cervicogenic headache managed as &ldquo;rest and paracetamol&rdquo; keeps firing until the neck is loaded and retrained. A migraine phenotype treated as a neck problem gets manual therapy it doesn&rsquo;t need and misses migraine-directed care. And a headache managed with escalating analgesia risks becoming a medication-overuse headache on top of the original driver.</p>
            <p>This is also why the concussion often <em>looks</em> like it isn&rsquo;t resolving: the recovery is on track, but an untreated headache phenotype &mdash; usually cervicogenic, often mixed &mdash; keeps the patient symptomatic. Phenotype first, treat the phenotype, and reassess for a coexisting driver. The structured headache workup and the phenotype-specific management pathways are exactly what the <Link href="/blog/persistent-post-concussion-symptoms-clinician-workup" className="text-indigo-700 underline">persistent post-concussion symptoms workup</Link> builds out.</p>
          </Section>

          <section className="bg-gradient-to-br from-indigo-700 to-violet-700 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">Go from &ldquo;post-concussion headache&rdquo; to a phenotype-specific plan</h2>
            <p className="text-indigo-100 leading-relaxed mb-5">Concussion Clinical Mastery takes you through the full headache workup &mdash; phenotyping, the cervical and vestibulo-ocular examinations, and the management pathway for each driver &mdash; alongside the complete assessment-to-rehab framework. Endorsed by Osteopathy Australia.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors text-center">Concussion Clinical Mastery &mdash; 8 CPD hrs online, up to 16 with the in-person day &middot; from $1,190 early-bird</Link>
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors text-center">Start with the free SCAT Mastery course</Link>
            </div>
          </section>

          <RelatedPosts slugs={['cervicogenic-drivers-chronic-concussion', 'persistent-post-concussion-symptoms-clinician-workup', 'how-to-use-scat6-clinicians-guide']} />
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
      <div className="flex items-center gap-3 mb-4"><Icon className="w-7 h-7 text-indigo-700" /><h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  )
}
