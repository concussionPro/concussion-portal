import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, CheckCircle, AlertTriangle, ShieldCheck, FileText, Building2 } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "Heidi vs Lyrebird vs ChatGPT for Clinical Notes: An Australian Clinician's 2026 Comparison"
const DESCRIPTION = 'Heidi vs Lyrebird vs ChatGPT for clinical notes — which AI scribe fits your Australian practice? Side-by-side: AHPRA AI guidelines, Australian Privacy Principles, NDIS audit risk, indemnity insurer positions.'
const URL = 'https://portal.concussion-education-australia.com/blog/heidi-vs-lyrebird-ai-scribe-australian-clinicians'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'heidi vs lyrebird, ai scribe australia, chatgpt clinical notes, ahpra ai guidelines, ai medical scribe australia, ai scribe ahpra, ndis ai documentation, ai scribe privacy act, heidi health review, lyrebird health review',
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: URL,
  },
  alternates: {
    canonical: URL,
  },
}

export default function HeidiVsLyrebirdPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: TITLE,
            description: DESCRIPTION,
            datePublished: '2026-05-27',
            dateModified: '2026-05-27',
            author: 'Zac Lewis',
            url: URL,
          }))
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Is Heidi or Lyrebird better for Australian clinicians?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Both are healthcare-purpose-built AI scribes with Australian data residency. Heidi has wider adoption (around half of AU GPs by founder claims) and broader allied-health workflow support. Lyrebird is leaner and integrates well with smaller practices. The right choice depends on your specialty, practice software, and how much workflow customisation you need.',
                },
              },
              {
                '@type': 'Question',
                name: 'Can I use ChatGPT for clinical notes in Australia?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'ChatGPT is not a clinical AI scribe and does not meet AHPRA AI guidelines or Australian Privacy Principles for patient health information by default. Consumer ChatGPT sends data to OpenAI servers in the US, which is a notifiable disclosure under the Privacy Act unless you obtain explicit patient consent. Healthcare-purpose-built tools like Heidi and Lyrebird are designed for compliance from the start.',
                },
              },
              {
                '@type': 'Question',
                name: 'Does the NDIS audit AI-generated allied health reports?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. The NDIA has become noticeably more alert to AI-generated allied health reports as part of fraud detection and assurance work. Templated AI output with generic clinical reasoning and recycled phrasing carries audit and reputational risk even when the underlying clinical view is sound.',
                },
              },
            ],
          })
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              AI in Clinical Practice
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Heidi vs Lyrebird vs ChatGPT for Clinical Notes: An Australian Clinician&apos;s 2026 Comparison
            </h1>
            <p className="text-xl text-emerald-50 mb-4">
              A practical comparison of the three AI tools Australian clinicians are actually using — what each one is, where each one fits, and how AHPRA AI guidelines plus the Australian Privacy Principles change the picture.
            </p>
            <div className="flex items-center gap-3 text-emerald-50 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 9 min read</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* AIO-optimal: quick answer in first 100 words */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-teal-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <div className="space-y-3 text-slate-700 leading-relaxed">
              <p>
                <strong>Heidi vs Lyrebird:</strong> both are healthcare-purpose-built AI scribes with Australian data residency, and either is a defensible choice for AHPRA-registered clinicians. Heidi has the larger market position (Heidi&apos;s founders claim roughly half of Australian GPs as users) and broader workflow support across allied health. Lyrebird is leaner, focused on fast transcription, and well-suited to smaller practices.
              </p>
              <p>
                <strong>ChatGPT for clinical notes</strong> is a different category — it is a general-purpose LLM, not a clinical scribe. It does not meet AHPRA AI guidelines or the Australian Privacy Principles for patient health information by default, and using it without explicit patient consent and significant workflow redesign is a Privacy Act risk.
              </p>
              <p className="text-sm text-slate-600 italic">
                The rest of this article walks through what each tool actually does, where they sit against AHPRA and NDIS scrutiny, and how to pick the right one for your scope of practice.
              </p>
            </div>
          </div>

          {/* What is Heidi */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-7 h-7 text-teal-600" />
              <h2 className="text-3xl font-bold text-slate-900">What is Heidi Health?</h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Heidi Health is an Australian-founded ambient AI medical scribe. It listens to the consultation in real time (with patient consent), generates structured clinical notes in the format the clinician wants, and integrates with the major Australian practice-management systems. Heidi&apos;s founders publicly state that the platform is used by approximately half of Australian general practitioners, and it has expanded across allied health, including physiotherapy, osteopathy, psychology and speech pathology.
              </p>
              <p>
                What makes Heidi a healthcare-purpose-built tool (rather than a general LLM with a wrapper) is the combination of:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Australian data residency.</strong> Patient audio and transcripts are processed on infrastructure that satisfies Australian Privacy Principles around offshore disclosure.</li>
                <li><strong>Specialty-tuned templates.</strong> The note structure follows actual AU clinical conventions (SOAP, problem-orientated, NDIS-aligned, mental health care plans, etc.), not generic prose.</li>
                <li><strong>Consent and audit trail features</strong> built into the workflow — important for AHPRA scrutiny and any future Medicare or NDIS audit.</li>
              </ul>
            </div>
          </section>

          {/* What is Lyrebird */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-7 h-7 text-teal-600" />
              <h2 className="text-3xl font-bold text-slate-900">What is Lyrebird Health?</h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Lyrebird Health is the other Australian-built AI scribe most commonly compared with Heidi. It is also an ambient transcription tool that records the consultation, produces structured notes, and stores data on Australian infrastructure. Lyrebird is smaller than Heidi by market position but well-regarded in solo and small-group practices.
              </p>
              <p>
                Practitioners typically choose Lyrebird when they value:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>A leaner, faster workflow</strong> with fewer template-customisation knobs to learn.</li>
                <li><strong>Lower price point</strong> for solo practitioners and small clinics.</li>
                <li><strong>Direct transcript-to-notes</strong> output without the larger workflow surface area Heidi offers.</li>
              </ul>
              <p>
                Both Heidi and Lyrebird sit in what we call <strong>Tier A</strong> in the course framework — healthcare-purpose-built tools with AU data residency, clinical templates, and consent/audit features baked in. Either is defensible against AHPRA AI guidelines.
              </p>
            </div>
          </section>

          {/* What about ChatGPT */}
          <section className="bg-white rounded-xl shadow-sm border-2 border-amber-300 p-8 mb-8 bg-amber-50/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-700" />
              <h2 className="text-3xl font-bold text-slate-900">Can I use ChatGPT for clinical notes?</h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong>The short answer: not without significant workflow redesign, explicit patient consent, and a real understanding of where the data goes.</strong>
              </p>
              <p>
                Consumer ChatGPT (the free or Plus version most clinicians know) sends inputs to OpenAI&apos;s servers in the United States. Pasting any patient health information into that interface is an offshore disclosure of personal information under Australian Privacy Principle 8 — which is permitted only with the patient&apos;s explicit informed consent, or under a narrow set of exceptions that rarely apply in routine clinical work.
              </p>
              <p>
                Beyond Privacy Act exposure, ChatGPT is a general-purpose LLM. It was not designed for clinical documentation, and several real-world failure modes follow:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Template drift and recycled phrasing</strong> — outputs read as templated, which the NDIA has flagged in recent fraud-and-assurance work as a red flag for AI-generated NDIS reports.</li>
                <li><strong>No consent or audit trail</strong> — you cannot demonstrate to an AHPRA investigator how the note was generated.</li>
                <li><strong>No specialty templates</strong> — the output requires manual cleanup against clinical conventions every time, which often defeats the time-saving rationale.</li>
              </ul>
              <p>
                ChatGPT (and Claude, and Gemini) <em>can</em> be used safely as a general-purpose tool for clinical writing — translation, patient information sheets, exercise programs — when the inputs are stripped of personal information. That is not the same as using it as a clinical scribe.
              </p>
            </div>
          </section>

          {/* Side-by-side */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Side-by-side comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-teal-700">Heidi</th>
                    <th className="text-center py-3 px-4 font-semibold text-teal-700">Lyrebird</th>
                    <th className="text-center py-3 px-4 font-semibold text-amber-700">ChatGPT (consumer)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Built for clinical use</td><td className="text-center text-emerald-600 font-bold">Yes</td><td className="text-center text-emerald-600 font-bold">Yes</td><td className="text-center text-red-600 font-bold">No</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">AU data residency</td><td className="text-center text-emerald-600 font-bold">Yes</td><td className="text-center text-emerald-600 font-bold">Yes</td><td className="text-center text-red-600 font-bold">No (US)</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Privacy Act fit (default)</td><td className="text-center text-emerald-600 font-bold">Compliant</td><td className="text-center text-emerald-600 font-bold">Compliant</td><td className="text-center text-red-600 font-bold">Requires explicit consent</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Ambient transcription</td><td className="text-center">Yes</td><td className="text-center">Yes</td><td className="text-center">No</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Specialty templates (AU)</td><td className="text-center">Extensive</td><td className="text-center">Moderate</td><td className="text-center">None (DIY)</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Practice software integrations</td><td className="text-center">Broad</td><td className="text-center">Focused</td><td className="text-center">None</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Audit trail / consent log</td><td className="text-center text-emerald-600 font-bold">Built-in</td><td className="text-center text-emerald-600 font-bold">Built-in</td><td className="text-center text-red-600 font-bold">None</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Suitable for NDIS allied health reports</td><td className="text-center text-emerald-600 font-bold">Yes (with workflow)</td><td className="text-center text-emerald-600 font-bold">Yes (with workflow)</td><td className="text-center text-red-600 font-bold">High audit risk</td></tr>
                  <tr><td className="py-3 px-4 font-medium text-slate-800">Tier (course framework)</td><td className="text-center font-bold">A</td><td className="text-center font-bold">A</td><td className="text-center font-bold">C</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* AHPRA + Privacy Act */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-7 h-7 text-teal-600" />
              <h2 className="text-3xl font-bold text-slate-900">AHPRA AI guidelines and the Australian Privacy Principles</h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                AHPRA has published guidance on meeting your professional obligations when using AI in healthcare, and the TGA has issued specific guidance on digital scribes. Indemnity insurers (Avant, MIPS, Guild, MIGA) have published their own checklists. The common themes:
              </p>
              <ol className="list-decimal pl-6 space-y-2">
                <li><strong>Patient consent is mandatory.</strong> Verbal consent at the start of the consult, documented in the notes. Heidi and Lyrebird build this into the workflow; with ChatGPT you have to build it yourself.</li>
                <li><strong>The clinician remains responsible</strong> for the final note. AI-assisted does not mean AI-authored. You read, edit, and sign.</li>
                <li><strong>Data location matters.</strong> Offshore processing of patient information is a notifiable disclosure under APP 8 without explicit consent.</li>
                <li><strong>The note must reflect the clinical encounter.</strong> Templated AI output that recycles phrases across patients is a documentation-integrity problem and a flag for NDIS or Medicare audit.</li>
              </ol>
              <p>
                Choosing a Tier A tool (Heidi or Lyrebird) handles items 1, 3, and 4 by design. You still own item 2 — reading and signing the note — no AI changes that.
              </p>
            </div>
          </section>

          {/* Decision framework */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Which one should you pick?</h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>A practical decision tree:</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                  <span><strong>Solo practice or 2&ndash;3 clinician clinic, simpler workflow:</strong> Lyrebird is often a better fit.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                  <span><strong>Larger practice, broad specialty mix, integration with existing practice-management software:</strong> Heidi&apos;s wider surface area pays off.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                  <span><strong>NDIS-heavy allied health practice:</strong> Either Tier A tool works, but the audit-risk angle makes a structured workflow with audit logging essential. Either tool meets this; ChatGPT does not.</span>
                </li>
                <li className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
                  <span><strong>Considering ChatGPT or Claude as your scribe:</strong> don&apos;t. Use them for non-PHI clinical writing tasks (patient info sheets, exercise programs in plain language) where you can strip identifiers, and use a Tier A tool for actual note-taking.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA to course */}
          <section className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">Want the full framework?</h2>
            <p className="text-emerald-50 leading-relaxed mb-5">
              This article covers the headlines. Our short course <strong>AI in Clinical Practice</strong> walks through the AHPRA AI guidelines, Australian Privacy Principles, NDIS audit-safe documentation workflows, and the full Tier A/B/C framework with worked examples for physiotherapy, osteopathy, GP and naturopathy. 3 CPD hours, fully online, certificate on completion. Launching <strong>17 June 2026</strong>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-white text-teal-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-colors"
              >
                Get the launch-week price (A$99, 50% off)
              </Link>
            </div>
          </section>

          <RelatedPosts slugs={[
            'ahpra-cpd-requirements-concussion-education',
            'how-to-use-scat6-clinicians-guide',
            'concussion-update-2026-wait-until-symptom-free-obsolete',
          ]} />
        </div>
      </div>
    </>
  )
}
