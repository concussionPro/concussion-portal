import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, Eye, Activity, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "Vestibulo-Ocular Workup for Persistent Post-Concussion Symptoms — Beyond VOMS [2026]"
const DESCRIPTION = 'Vestibulo-ocular dysfunction is a frequent — and frequently missed — driver of persistent post-concussion symptoms (PPCS). Full clinical workup beyond acute VOMS — convergence insufficiency, BPPV after head trauma, gaze stability, VOR exercises, when to refer for vestibular specialist.'
const URL = 'https://portal.concussion-education-australia.com/blog/vestibulo-ocular-workup-ppcs'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'vestibulo-ocular dysfunction ppcs, vestibular rehab concussion, voms for chronic concussion, convergence insufficiency concussion, bppv after concussion, gaze stability concussion, vor exercises concussion, vestibular workup chronic concussion',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL, images: ['/og-image.jpg'], publishedTime: '2026-05-27' },
  alternates: { canonical: URL },
}

export default function VestibuloOcularWorkupPpcsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createBlogPostSchema({ title: TITLE, description: DESCRIPTION, datePublished: '2026-05-27', dateModified: '2026-05-27', author: 'Zac Lewis', url: URL })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'How common is vestibulo-ocular dysfunction in persistent post-concussion symptoms?', acceptedAnswer: { '@type': 'Answer', text: 'Vestibulo-ocular dysfunction is a frequent finding in PPCS and one of the highest-yield workup targets in chronic concussion — when present and treated, symptom improvement is often substantial. The acute VOMS (Vestibular/Ocular Motor Screening) is your starting point, but PPCS requires going deeper.' } },
          { '@type': 'Question', name: 'What is the difference between acute VOMS and the chronic vestibulo-ocular workup?', acceptedAnswer: { '@type': 'Answer', text: 'Acute VOMS is a screen — provoke-and-observe through smooth pursuits, saccades, convergence, VOR, and visual motion sensitivity. The chronic workup adds: quantified near-point convergence, dedicated BPPV testing (Dix-Hallpike, supine roll), gaze stability exercise tolerance, oculomotor screening for convergence insufficiency, and exercise prescription. Acute VOMS identifies dysfunction; chronic workup characterises and treats it.' } },
          { '@type': 'Question', name: 'Can BPPV occur after concussion?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. BPPV (benign paroxysmal positional vertigo) after head trauma is common. The mechanism — otoliths dislodged into semicircular canals — is exactly what head-impact mechanisms can produce. BPPV is highly treatable with positional manoeuvres (Epley, Semont). Missing it leaves a fixable cause of persistent dizziness active. Always include Dix-Hallpike and supine roll tests in any PPCS dizziness workup.' } },
          { '@type': 'Question', name: 'When should I refer for vestibular specialist assessment?', acceptedAnswer: { '@type': 'Answer', text: 'Refer when: BPPV-negative persistent vertigo, suspected vestibular hypofunction (positive head-impulse test, persistent gaze-evoked nystagmus), no improvement after 6-8 sessions of structured vestibulo-ocular rehab, complex bilateral involvement, or when instrumented testing (vHIT, caloric, posturography) is needed to characterise the dysfunction further.' } },
        ],
      }) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">Chronic Concussion Management</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Vestibulo-Ocular Workup for Persistent Post-Concussion Symptoms — Beyond VOMS [2026]</h1>
            <p className="text-lg text-emerald-100 mb-4">Vestibulo-ocular dysfunction is a frequent driver of persistent symptoms. Acute VOMS is the screen — here&apos;s the chronic-case workup that characterises and treats it.</p>
            <div className="flex items-center gap-3 text-emerald-200 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 8 min read</span></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-300 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3"><strong>Vestibulo-ocular dysfunction is one of the findings you should expect to have to rule in or out in every persistent post-concussion symptom (PPCS) case.</strong> The acute VOMS is your starting point but doesn&apos;t characterise the dysfunction enough to drive treatment. The chronic workup adds:</p>
            <ul className="list-disc pl-6 space-y-1 text-slate-700">
              <li>Quantified near-point convergence (NPC)</li>
              <li>Dedicated BPPV testing (Dix-Hallpike + supine roll)</li>
              <li>Gaze stability exercise tolerance benchmarking</li>
              <li>Oculomotor screening for convergence insufficiency</li>
              <li>Structured VOR exercise prescription</li>
            </ul>
            <p className="text-sm text-slate-600 italic mt-4">When vestibulo-ocular dysfunction is present and treated, symptom improvement is often substantial. Missing it is the most common reason a PPCS case fails to progress.</p>
          </div>

          <Section icon={Eye} title="Acute VOMS vs chronic vestibulo-ocular workup">
            <p>The acute VOMS — Vestibular/Ocular Motor Screening — is a 5-minute provocation screen across smooth pursuits, saccades, convergence, VOR (horizontal + vertical), and visual motion sensitivity. It produces a yes/no signal: is there vestibulo-ocular involvement worth pursuing? See our full guide: <Link href="/blog/vestibular-ocular-screening-voms-concussion" className="text-emerald-700 underline">VOMS in Concussion Care</Link>.</p>
            <p>For chronic cases, the answer is almost always yes — which is why VOMS alone is insufficient. The chronic workup characterises:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Which subsystem(s)</strong> — vestibular, oculomotor (convergence), or both</li>
              <li><strong>What severity</strong> — provoking threshold, symptom intensity, recovery time</li>
              <li><strong>What treatment-responsive</strong> — does sub-threshold exercise produce adaptation, or does it provoke without progress?</li>
              <li><strong>What&apos;s missed</strong> — BPPV, vestibular hypofunction, ocular motor disease unrelated to concussion</li>
            </ul>
          </Section>

          <Section icon={Eye} title="Quantified near-point convergence (NPC)">
            <p>Convergence insufficiency is a common and treatable chronic driver. It&apos;s easy to miss on the acute VOMS because the patient may converge once or twice without obvious failure — but with sustained reading or screen use it produces headache, blurred vision, and fatigue.</p>
            <p>Workup:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>NPC measurement</strong> — patient focuses on a target moving toward the nose. Record distance at which fusion breaks (double vision appears) and recovery distance.</li>
              <li><strong>Normal NPC:</strong> &lt;6 cm break, &lt;8 cm recovery. Persistent NPC &gt;6 cm break indicates convergence insufficiency.</li>
              <li><strong>Repeated measure</strong> — assess once, rest, repeat 3-5 times. Worsening over repeats suggests fatigue contribution.</li>
            </ul>
            <p>Treatment: pencil push-ups, Brock string, near-far focus training. 5-10 minutes 2-3 times daily. Most patients improve in 4-6 weeks.</p>
          </Section>

          <Section icon={Eye} title="BPPV screening — the fixable miss">
            <p>BPPV after head trauma is common, treatable, and routinely missed. Otoliths get dislodged into the semicircular canals during the impact, producing position-provoked vertigo that the patient may not connect to the original injury.</p>
            <p>Every PPCS dizziness workup needs:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Dix-Hallpike test</strong> (both sides) — for posterior canal BPPV, the most common type</li>
              <li><strong>Supine roll test</strong> — for horizontal canal BPPV</li>
              <li><strong>If positive:</strong> Epley manoeuvre (posterior) or Lempert / Gufoni (horizontal). Repositioning frequently resolves the vertigo, sometimes after a single treatment.</li>
            </ul>
            <p>Don&apos;t assume the patient&apos;s chronic dizziness can&apos;t be BPPV because it&apos;s been months. BPPV doesn&apos;t spontaneously resolve in everyone — repositioning treatment can produce dramatic improvement in patients who&apos;ve been managed unsuccessfully for months as &ldquo;chronic concussion dizziness.&rdquo;</p>
          </Section>

          <Section icon={Activity} title="Gaze stability + VOR exercise prescription">
            <p>If VOMS provokes symptoms with VOR testing (horizontal or vertical), the patient needs vestibular adaptation work — not symptom avoidance.</p>
            <p>Structured prescription:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>VOR ×1</strong> — fixed target, head moves. Start at the velocity the patient tolerates without symptom flare for 2 minutes.</li>
              <li><strong>VOR ×2</strong> — target moves opposite to head (more demanding). Add once VOR ×1 is symptom-free at 2 minutes.</li>
              <li><strong>Symptom-threshold prescription</strong> — exercise to the point of mild provocation, recover, repeat. Avoid both the &ldquo;never provoke&rdquo; trap and the &ldquo;push through severe symptoms&rdquo; trap.</li>
              <li><strong>Weekly progression</strong> — increase velocity, duration, and complexity (standing → walking, eyes-open → eyes-closed transitions).</li>
            </ul>
            <p>Expected timeframe to substantial improvement: 4-8 weeks of consistent practice. If no improvement at 8 weeks, escalate to vestibular specialist for instrumented testing.</p>
          </Section>

          <Section icon={AlertTriangle} title="When to refer for vestibular specialist assessment">
            <p>Most vestibulo-ocular PPCS responds to structured rehab by a competent generalist clinician with the workup framework. Refer when:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>BPPV-negative persistent vertigo</strong> — Dix-Hallpike and supine roll tests negative, but vertigo continues</li>
              <li><strong>Suspected vestibular hypofunction</strong> — positive head-impulse test, persistent gaze-evoked nystagmus, asymmetric VOR</li>
              <li><strong>No improvement after 6-8 sessions</strong> of structured vestibulo-ocular rehab</li>
              <li><strong>Complex bilateral involvement</strong> — bilateral hypofunction, oscillopsia</li>
              <li><strong>Need for instrumented testing</strong> — video head-impulse test (vHIT), caloric testing, posturography</li>
              <li><strong>Ocular motor findings unrelated to concussion</strong> — internuclear ophthalmoplegia, persistent nystagmus types not consistent with peripheral vestibular pathology — these warrant neurology referral, not vestibular specialist</li>
            </ul>
          </Section>

          <Section icon={Activity} title="Putting it all together — assessment session structure">
            <p>A typical PPCS vestibulo-ocular assessment session takes 40-60 minutes:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>10 min</strong> — history, prior treatment, current functional impact</li>
              <li><strong>5 min</strong> — acute VOMS (smooth pursuits, saccades, NPC, VOR, visual motion sensitivity)</li>
              <li><strong>10 min</strong> — BPPV screening (Dix-Hallpike both sides, supine roll)</li>
              <li><strong>5 min</strong> — quantified NPC, repeated measures</li>
              <li><strong>10 min</strong> — gaze stability exercise tolerance benchmark (VOR ×1 starting prescription)</li>
              <li><strong>5 min</strong> — home program prescription, written instructions, expected timeframe</li>
              <li><strong>5 min</strong> — review at 2 weeks, adjust prescription</li>
            </ul>
            <p>Don&apos;t skip steps. Each is high-yield in a different subset of patients, and the workup is what separates effective PPCS care from &ldquo;keep doing VOR exercises and see how you go.&rdquo;</p>
          </Section>

          <section className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">PPCS course in development — join the waitlist</h2>
            <p className="text-emerald-100 leading-relaxed mb-5">We&apos;re developing a dedicated PPCS course covering the chronic-case workup in depth — vestibulo-ocular, cervical, autonomic, and headache drivers, with worked clinical scenarios. There&apos;s no launch date yet. Join the waitlist and you&apos;ll be the first to hear when it opens.</p>
            <Link href="/ppcs-waitlist" className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-colors">Join the PPCS waitlist</Link>
            <div className="mt-6 pt-6 border-t border-white/20">
              <p className="text-sm font-semibold text-emerald-100 mb-3">Available now:</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors text-center">Free SCAT Mastery course</Link>
                <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 border border-white/25 text-white rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors text-center">Concussion Clinical Mastery — 8 CPD hrs online, up to 16 with the in-person day · from $1,190 early-bird</Link>
              </div>
            </div>
          </section>

          <RelatedPosts slugs={['persistent-post-concussion-symptoms-clinician-workup', 'cervicogenic-drivers-chronic-concussion', 'vestibular-ocular-screening-voms-concussion']} />
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
      <div className="flex items-center gap-3 mb-4"><Icon className="w-7 h-7 text-emerald-700" /><h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  )
}
