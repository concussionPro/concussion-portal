import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, ShieldCheck, Globe, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "AI Scribe Privacy Act Compliance for Australian Clinicians — APP 8 Explained [2026]"
const DESCRIPTION = 'AI scribe Privacy Act compliance for AU clinicians — APP 8 explained. Why Heidi and Lyrebird (AU-resident) are compliant by default and ChatGPT/Claude (US-resident) need explicit patient consent for offshore disclosure.'
const URL = 'https://portal.concussion-education-australia.com/blog/ai-scribe-privacy-act-compliance-australia'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'ai scribe privacy act, australian privacy principles ai, app 8 healthcare, offshore disclosure clinical notes, privacy act ai scribe, heidi privacy act, lyrebird privacy act, chatgpt privacy act australia',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL },
  alternates: { canonical: URL },
}

export default function PrivacyActAiScribePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createBlogPostSchema({ title: TITLE, description: DESCRIPTION, datePublished: '2026-05-27', dateModified: '2026-05-27', author: 'Zac Lewis', url: URL })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Does the Privacy Act apply to AI scribes in Australia?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Patient health information is sensitive personal information under the Privacy Act 1988. Australian Privacy Principle 8 governs offshore disclosure, which applies to any AI scribe that processes data on servers outside Australia. AU-resident scribes (Heidi, Lyrebird) avoid APP 8 entirely; US-resident tools (ChatGPT, Claude.ai, Gemini) require explicit patient consent for offshore disclosure.' } },
          { '@type': 'Question', name: 'Is Heidi Health compliant with the Australian Privacy Principles?', acceptedAnswer: { '@type': 'Answer', text: 'Heidi Health stores and processes patient data on Australian infrastructure, which satisfies the offshore disclosure provisions of APP 8 by default. Heidi also builds patient consent capture into the workflow, satisfying the broader Privacy Act consent requirements.' } },
          { '@type': 'Question', name: 'What happens if I breach APP 8?', acceptedAnswer: { '@type': 'Answer', text: 'Breaches can be reported to the Office of the Australian Information Commissioner (OAIC). The OAIC can investigate, require remedial action, and impose civil penalties. For healthcare providers, AHPRA can also act on breaches as a fitness-to-practise matter.' } },
        ],
      }) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-indigo-700 to-blue-700 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">Privacy Act Compliance</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Scribe Privacy Act Compliance for Australian Clinicians — APP 8 Explained [2026]</h1>
            <p className="text-xl text-blue-50 mb-4">The Australian Privacy Principles apply to every AU clinician using AI in patient care. Here is how APP 8 changes the game between AU-resident AI scribes (Heidi, Lyrebird) and US-resident tools (ChatGPT, Claude.ai).</p>
            <div className="flex items-center gap-3 text-blue-50 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 8 min read</span></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          <div className="bg-white rounded-xl shadow-sm border-2 border-indigo-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3">Australian Privacy Principle 8 governs offshore disclosure of personal information. For AI scribes, it works like this:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-slate-700">
              <li><strong>AU-resident AI scribes (Heidi, Lyrebird)</strong> — data stays in Australia. APP 8 doesn&apos;t apply. Privacy Act-compliant by default.</li>
              <li><strong>US-resident AI tools (ChatGPT, Claude.ai, Gemini)</strong> — data is disclosed offshore. APP 8 applies. Requires explicit patient consent for the offshore disclosure, plus reasonable steps to ensure the overseas recipient handles it consistently with the Privacy Act.</li>
              <li><strong>Enterprise AU-residency LLMs (Microsoft Copilot for Healthcare, AWS HealthScribe with AU region)</strong> — middle tier. AU residency is configurable; check your specific subscription before assuming compliance.</li>
            </ul>
          </div>

          <Section icon={Globe} title="What APP 8 actually says">
            <p>Australian Privacy Principle 8 is short: before disclosing personal information to a person or entity outside Australia, the disclosing entity must take reasonable steps to ensure that the overseas recipient does not breach the Privacy Principles in relation to the information.</p>
            <p>The exceptions are narrow:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>The individual has consented to the disclosure</li>
              <li>The recipient is bound by a law or scheme substantially similar to the APPs</li>
              <li>A permitted general situation or permitted health situation applies (e.g. life-threatening emergency)</li>
              <li>The disclosure is required by an Australian law</li>
            </ul>
            <p>For routine clinical AI use, only the first exception (explicit patient consent) is practically available — and it must be informed consent, not buried in a consent-to-treatment form.</p>
          </Section>

          <Section icon={ShieldCheck} title="Why AU-resident AI scribes avoid the entire problem">
            <p>Heidi Health and Lyrebird Health are Australian-built AI scribes that store and process patient data on Australian infrastructure. Because no offshore disclosure occurs, APP 8 does not apply.</p>
            <p>This is the cleanest path to Privacy Act compliance:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>No need to document offshore-disclosure consent</li>
              <li>No need to assess the overseas recipient&apos;s Privacy Act compliance</li>
              <li>The audit trail is simpler — Australian-resident data, Australian-jurisdiction recourse</li>
            </ul>
            <p>Both vendors build the broader consent-to-AI-use process into the workflow as well, so the AHPRA AI guidelines obligations and the Privacy Act obligations are satisfied together.</p>
          </Section>

          <Section icon={AlertTriangle} title="If you must use ChatGPT, Claude, or Gemini for clinical work">
            <p>There are legitimate reasons to use general-purpose LLMs in clinical work — translation, patient information sheets, exercise programs in plain language. The trick is to do it without breaching APP 8.</p>
            <p>Two workable approaches:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li><strong>Strip all personal information from the input.</strong> De-identified data falls outside the Privacy Act&apos;s reach. Generic clinical scenarios for prompt-writing, anonymised case examples for education, exercise programs that reference a hypothetical patient — all fine.</li>
              <li><strong>Obtain explicit patient consent for the offshore disclosure.</strong> Document the consent clearly, including what data will be sent and which tool will be used. This is rarely practical at scale but workable for specific use cases (e.g. complex translation for a non-English-speaking patient where ChatGPT outperforms domestic options).</li>
            </ol>
            <p>What is <em>not</em> workable: pasting identifiable clinical material into ChatGPT for note-writing as a routine workflow. This is the most common practice we see and the highest-risk one.</p>
          </Section>

          <section className="bg-gradient-to-br from-indigo-700 to-blue-700 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">Compliance frameworks made practical</h2>
            <p className="text-blue-50 leading-relaxed mb-5">AHPRA AI guidelines + Privacy Act + indemnity insurer positions are interlocked. The AI in Clinical Practice short course walks through all three with worked examples. Get the free 1-page AI Safety Checklist first.</p>
            <Link href="/ai-safety-checklist" className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">Get the AI Safety Checklist (free)</Link>
          </section>

          <RelatedPosts slugs={['ahpra-ai-guidelines-explained-australian-clinicians', 'heidi-vs-lyrebird-ai-scribe-australian-clinicians', 'chatgpt-ndis-reports-allied-health-australia']} />
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
      <div className="flex items-center gap-3 mb-4"><Icon className="w-7 h-7 text-indigo-600" /><h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>
      <div className="space-y-4 text-slate-700 leading-relaxed">{children}</div>
    </section>
  )
}
