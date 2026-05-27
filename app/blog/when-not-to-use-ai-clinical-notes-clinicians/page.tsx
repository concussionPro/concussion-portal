import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, AlertTriangle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "When NOT to Use AI for Clinical Notes — 7 Red Flags for Australian Clinicians [2026]"
const DESCRIPTION = 'When NOT to use AI for clinical notes — 7 red flags for Australian clinicians. Mental health, mandatory reporting, family violence, complex medicolegal cases, paediatric consults: when to switch off the AI scribe.'
const URL = 'https://portal.concussion-education-australia.com/blog/when-not-to-use-ai-clinical-notes-clinicians'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'when not to use ai clinical notes, ai red flags healthcare, ai mistakes clinical documentation, ai scribe limitations, ai healthcare risks, when ai is wrong clinical',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL },
  alternates: { canonical: URL },
}

export default function WhenNotToUseAiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createBlogPostSchema({ title: TITLE, description: DESCRIPTION, datePublished: '2026-05-27', dateModified: '2026-05-27', author: 'Zac Lewis', url: URL })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'When should I NOT use AI for clinical notes?', acceptedAnswer: { '@type': 'Answer', text: 'Switch off the AI scribe for: mental health disclosures and suicide risk conversations, mandatory reporting situations (child safety, family violence, elder abuse), complex medicolegal cases likely to attract scrutiny, paediatric consults where consent is mixed, patients who decline AI use, sensitive sexual or reproductive health consults, and any situation where transcript accuracy matters more than note-writing speed.' } },
        ],
      }) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-red-700 to-rose-700 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">Clinical Judgment</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">When NOT to Use AI for Clinical Notes — 7 Red Flags for Australian Clinicians [2026]</h1>
            <p className="text-xl text-rose-50 mb-4">AI scribes (Heidi, Lyrebird) are powerful, but there are situations where running an AI tool during a consult adds clinical, legal, or ethical risk. Here are the 7 red flags every AU clinician should know.</p>
            <div className="flex items-center gap-3 text-rose-50 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 6 min read</span></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3">There are 7 scenarios where switching off the AI scribe is the right call:</p>
            <ol className="list-decimal pl-6 space-y-1 text-slate-700 text-sm">
              <li>Mental health disclosures and suicide risk conversations</li>
              <li>Mandatory reporting situations (child safety, family violence, elder abuse)</li>
              <li>Complex medicolegal cases likely to attract scrutiny</li>
              <li>Paediatric consults where consent is mixed</li>
              <li>Patients who decline AI use</li>
              <li>Sensitive sexual or reproductive health consults</li>
              <li>Any situation where transcript accuracy matters more than note-writing speed</li>
            </ol>
            <p className="text-sm text-slate-600 italic mt-3">For each one, the right call is to pause or stop the AI scribe and take manual notes for that portion of the consult.</p>
          </div>

          <RedFlag n={1} title="Mental health disclosures and suicide risk conversations">
            <p>When a patient discloses suicidal ideation, self-harm, or significant mental health distress, the AI scribe should be paused. Two reasons:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Clinical safety.</strong> Documentation of suicide risk requires precise, deliberate phrasing. AI drafts often soften or template critical wording (&ldquo;patient expressed concerns&rdquo; when the patient said &ldquo;I want to die&rdquo;).</li>
              <li><strong>Patient trust.</strong> Patients disclosing mental health crises may not realise a tool is recording the consult. Even with prior consent, pausing the scribe in this moment is the trauma-informed move.</li>
            </ul>
          </RedFlag>

          <RedFlag n={2} title="Mandatory reporting — child safety, family violence, elder abuse">
            <p>Mandatory reporting obligations (Children and Young Persons Act in your jurisdiction, family violence schemes, elder abuse frameworks) require precise documentation. AI drafts that template the language put the report at risk of being challenged.</p>
            <p>Manual notes for the disclosure conversation; AI scribe back on for the rest of the consult. Document both the substance and the fact that you switched off the scribe.</p>
          </RedFlag>

          <RedFlag n={3} title="Complex medicolegal cases likely to attract scrutiny">
            <p>If the consult is likely to end up in front of a coroner, court, or AHPRA panel — write the note yourself. Examples:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Post-MVA / workplace injury cases with complex causation</li>
              <li>Disputed return-to-play decisions in sport</li>
              <li>Discharge of a patient against medical advice</li>
              <li>Suspected drug-seeking behaviour</li>
            </ul>
            <p>AI scribes are great for high-volume routine consults. They are a liability in low-volume high-scrutiny ones.</p>
          </RedFlag>

          <RedFlag n={4} title="Paediatric consults where consent is mixed">
            <p>For paediatric consults the consent for AI use needs to come from both the parent/guardian AND (for older children with capacity) the child themselves. If you can&apos;t get both, default to manual notes. Documenting AI consent from a 9-year-old is contentious; better to skip.</p>
          </RedFlag>

          <RedFlag n={5} title="Patients who decline AI use">
            <p>The first AHPRA AI guidelines obligation: explicit patient consent. If the patient says no — or hesitates and gives reluctant consent — take manual notes. A patient who feels coerced into accepting an AI scribe is one complaint away from an AHPRA notification.</p>
          </RedFlag>

          <RedFlag n={6} title="Sensitive sexual or reproductive health consults">
            <p>Reproductive health, STI testing, contraception, abortion counselling, intimate partner violence screening — all involve disclosures where the patient may not want a third-party tool recording.</p>
            <p>Best practice: ask explicitly at the start of these consults: <em>&ldquo;I usually use an AI scribe but for today&apos;s consult, would you prefer I take notes by hand?&rdquo;</em> Most patients in these contexts will choose manual.</p>
          </RedFlag>

          <RedFlag n={7} title="When transcript accuracy matters more than speed">
            <p>AI scribes are good at producing structured notes that capture the gist. They are not perfect transcription tools. For consults where every word matters — informed-consent conversations for high-risk procedures, mediation conversations, multi-disciplinary case conferences — take detailed manual notes or use a dedicated transcription tool with a human reviewer.</p>
          </RedFlag>

          <section className="bg-gradient-to-br from-red-700 to-rose-700 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">The full safe-use framework</h2>
            <p className="text-rose-50 leading-relaxed mb-5">The AI in Clinical Practice short course (3 CPD hours, A$99 launch week) walks through the full framework — when to use AI, when to switch it off, and how to document either way. Free 1-page checklist available now.</p>
            <Link href="/ai-safety-checklist" className="inline-flex items-center gap-2 bg-white text-red-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-rose-50 transition-colors">Get the AI Safety Checklist (free)</Link>
          </section>

          <RelatedPosts slugs={['ahpra-ai-guidelines-explained-australian-clinicians', 'heidi-vs-lyrebird-ai-scribe-australian-clinicians', 'ai-scribe-privacy-act-compliance-australia']} />
        </div>
      </div>
    </>
  )
}

function RedFlag({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center text-red-700 font-bold">{n}</div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900 leading-tight flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
            {title}
          </h2>
        </div>
      </div>
      <div className="space-y-3 text-slate-700 leading-relaxed text-sm">{children}</div>
    </section>
  )
}
