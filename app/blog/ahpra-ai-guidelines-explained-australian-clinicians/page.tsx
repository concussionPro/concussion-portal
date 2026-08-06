import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, ShieldCheck, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { COURSES, getEffectivePrice } from '@/lib/ai-course/provider-catalogue'

// AI-course price + CPD hours are catalogue-derived (lib/ai-course/provider-catalogue),
// never literals: /courses/ai-in-clinical-practice and /api/courses/checkout both
// read the same entry, so a hardcoded figure here could advertise a price the
// checkout does not charge.
const AI_COURSE = COURSES.find((c) => c.id === 'ai-in-clinical-practice')
const AI_CPD_HOURS = AI_COURSE?.cpdHours ?? 2
const AI_PRICE = AI_COURSE ? getEffectivePrice(AI_COURSE).price : null

const TITLE = "AHPRA AI Guidelines Explained: What Australian Clinicians Actually Need to Do [2026]"
const DESCRIPTION = 'AHPRA AI guidelines decoded — the 4 obligations every AU clinician must meet when using AI in patient care. Patient consent, clinician responsibility, data location, and documentation integrity.'
const URL = 'https://portal.concussion-education-australia.com/blog/ahpra-ai-guidelines-explained-australian-clinicians'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'ahpra ai guidelines, ahpra artificial intelligence, ai compliance ahpra, ai healthcare ahpra australia, ahpra ai code, ai scribe ahpra, ahpra ai obligations',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL },
  alternates: { canonical: URL },
}

export default function AhpraAiGuidelinesPage() {
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
            '@context': 'https://schema.org', '@type': 'FAQPage',
            mainEntity: [
              { '@type': 'Question', name: 'What do the AHPRA AI guidelines require?', acceptedAnswer: { '@type': 'Answer', text: 'AHPRA AI guidelines require 4 things: (1) explicit patient consent to AI use, documented in the record; (2) clinician responsibility for the final note — AI-assisted is not AI-authored; (3) appropriate data location (offshore disclosure of patient information without consent breaches Australian Privacy Principle 8); (4) documentation integrity — notes must reflect the specific encounter, not templated phrasing.' } },
              { '@type': 'Question', name: 'Do I need explicit patient consent to use an AI scribe?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. AHPRA AI guidelines and indemnity insurer guidance (Avant, Guild, MIPS, MIGA) treat patient consent as mandatory. Verbal consent at the start of the consult, documented in the note, is the minimum standard.' } },
              { '@type': 'Question', name: 'Can I use ChatGPT for clinical work under AHPRA AI guidelines?', acceptedAnswer: { '@type': 'Answer', text: 'Only with explicit patient consent for the offshore disclosure (ChatGPT runs on US servers — APP 8 applies) and only with workflow safeguards. Healthcare-purpose-built tools like Heidi and Lyrebird are AU-resident and Privacy Act-compliant by default.' } },
            ],
          })
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-teal-700 to-cyan-700 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">AI in Clinical Practice</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">AHPRA AI Guidelines Explained: What Australian Clinicians Actually Need to Do [2026]</h1>
            <p className="text-xl text-cyan-50 mb-4">AHPRA has published guidance on AI in healthcare. Most clinicians haven&apos;t read it. Here are the 4 obligations every AU clinician must meet when using AI in patient care — and what each one looks like in practice.</p>
            <div className="flex items-center gap-3 text-cyan-50 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 7 min read</span></div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">

          <div className="bg-white rounded-xl shadow-sm border-2 border-teal-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3">The AHPRA AI guidelines boil down to four obligations:</p>
            <ol className="list-decimal pl-6 space-y-1.5 text-slate-700">
              <li><strong>Patient consent</strong> — verbal, documented, mandatory.</li>
              <li><strong>Clinician responsibility</strong> — you read, edit, and sign the final note.</li>
              <li><strong>Data location</strong> — offshore processing is a notifiable disclosure without explicit consent.</li>
              <li><strong>Documentation integrity</strong> — notes must reflect the specific clinical encounter, not templated AI phrasing.</li>
            </ol>
            <p className="text-sm text-slate-600 italic mt-4">If your AI workflow meets all four, you&apos;re aligned with AHPRA. The rest of this article unpacks each one with worked examples.</p>
          </div>

          <Section icon={ShieldCheck} title="Obligation 1: Patient consent — verbal, documented, mandatory">
            <p>AHPRA AI guidelines treat patient consent as non-negotiable. The guidance is explicit: any use of AI in patient care that involves processing of personal information requires the patient&apos;s knowledge and consent.</p>
            <p>The minimum standard:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Verbal consent obtained at the start of the consult (or earlier — e.g. a pre-visit email)</li>
              <li>Documented in the clinical note — a single line is enough, e.g. <em>&ldquo;Verbal consent obtained for use of AI scribe (Heidi).&rdquo;</em></li>
              <li>Patient has the option to decline without it affecting care</li>
            </ul>
            <p>Sample consent script: <em>&ldquo;I use an AI tool to help with my notes — it listens during our consult and creates a draft that I review and edit before saving. Are you OK with that?&rdquo;</em></p>
          </Section>

          <Section icon={FileText} title="Obligation 2: Clinician responsibility — AI-assisted, not AI-authored">
            <p>You read, edit, and sign every note. The AHPRA AI guidelines are clear that AI is a tool that assists the clinician — it does not replace the clinician&apos;s professional judgment.</p>
            <p>What this looks like in practice:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>The AI-drafted note is reviewed in full before saving</li>
              <li>Any templated phrasing is edited so the note reflects this specific consult</li>
              <li>Clinical reasoning is expressed in your own voice — not the AI&apos;s default phrasing</li>
              <li>The note is signed by you (not the AI tool)</li>
            </ul>
            <p>If an AHPRA notification is ever lodged against a note, &ldquo;the AI wrote it&rdquo; is not a defence. You signed it; you own it.</p>
          </Section>

          <Section icon={AlertTriangle} title="Obligation 3: Data location — Australian Privacy Principle 8 applies">
            <p>This is where most clinicians using consumer AI tools (ChatGPT, Claude.ai, Gemini) are unknowingly in breach. Australian Privacy Principle 8 governs offshore disclosure of personal information. ChatGPT (free or Plus), Claude.ai, and Gemini all process inputs on US servers. Pasting any patient health information into those tools is an offshore disclosure.</p>
            <p>Under APP 8, offshore disclosure is permitted only when:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>The patient has given explicit, informed consent to the offshore disclosure, OR</li>
              <li>A narrow set of exceptions applies (rare in routine clinical work)</li>
            </ul>
            <p>The practical implication: <strong>healthcare-purpose-built AU-resident tools (Heidi, Lyrebird) avoid this entire problem.</strong> Their data stays on Australian infrastructure; APP 8 doesn&apos;t bite.</p>
            <p>If you want to use a Tier C tool (ChatGPT, Claude, Gemini) for clinical work, you need either:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Strip all personal information from the prompt (de-identified data is fine), OR</li>
              <li>Obtain explicit patient consent for the offshore disclosure (rarely practical at scale)</li>
            </ul>
          </Section>

          <Section icon={CheckCircle} title="Obligation 4: Documentation integrity — no templating across patients">
            <p>This is the obligation getting the most regulatory attention in 2026. The NDIA has become noticeably more alert to AI-generated allied health reports as part of fraud-and-assurance work. Templated AI output with generic clinical reasoning and recycled phrasing carries audit risk even when the underlying clinical view is sound.</p>
            <p>The integrity test: <strong>does your note reflect this specific clinical encounter?</strong></p>
            <p>Red flags an auditor (AHPRA, NDIA, Medicare) looks for:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Same paragraph structure across multiple unrelated patients</li>
              <li>Generic clinical reasoning that could apply to anyone</li>
              <li>Standardised goal language that doesn&apos;t reference the specific patient</li>
              <li>Long-form notes that are clearly AI-generated and not edited</li>
            </ul>
            <p>The fix is straightforward but requires discipline: <strong>edit every note before saving</strong>. The AI gives you a draft; you make it specific.</p>
          </Section>

          <section className="bg-gradient-to-br from-teal-700 to-cyan-700 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">The full framework in one course</h2>
            <p className="text-cyan-50 leading-relaxed mb-5">Our short course <strong>AI in Clinical Practice</strong> walks through each of the four AHPRA obligations with worked examples for physiotherapy, osteopathy, GP and naturopathy. Plus the Tier A / B / C tool framework (Heidi vs Lyrebird vs ChatGPT vs Claude), NDIS audit-safe documentation, and the Australian Privacy Principles for clinicians. {AI_CPD_HOURS} CPD hours, fully online, certificate on completion. Now <Link href="/courses/ai-in-clinical-practice" className="underline font-semibold text-white hover:text-cyan-100">available{AI_PRICE !== null ? ` for A$${AI_PRICE}` : ''}</Link>.</p>
            <Link href="/ai-safety-checklist" className="inline-flex items-center gap-2 bg-white text-teal-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-cyan-50 transition-colors">Get the free AI Safety Checklist first</Link>
          </section>

          <RelatedPosts slugs={['heidi-vs-lyrebird-ai-scribe-australian-clinicians', 'when-not-to-use-ai-clinical-notes-clinicians', 'ahpra-cpd-requirements-concussion-education']} />
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
      <div className="flex items-center gap-3 mb-4"><Icon className="w-7 h-7 text-teal-600" /><h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>
      <div className="space-y-4 text-slate-700 leading-relaxed">{children}</div>
    </section>
  )
}
