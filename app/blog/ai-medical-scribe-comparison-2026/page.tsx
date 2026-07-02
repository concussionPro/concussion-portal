import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { Clock, Globe, ShieldCheck, AlertTriangle, CheckCircle, MapPin } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

const TITLE = "AI Medical Scribe Comparison 2026 — Heidi vs Lyrebird vs Tortus vs Abridge vs Suki vs DAX"
const DESCRIPTION = 'AI medical scribe comparison 2026 — Heidi, Lyrebird, Tortus, Abridge, Suki, DAX Copilot side-by-side for AU/UK/US/CA clinicians. Data residency, privacy compliance (HIPAA, GDPR, Privacy Act), pricing, specialty fit.'
const URL = 'https://portal.concussion-education-australia.com/blog/ai-medical-scribe-comparison-2026'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'ai medical scribe comparison, heidi vs lyrebird, heidi vs abridge, abridge vs suki, dax copilot review, tortus ai nhs, ai scribe australia, ai scribe uk, ai scribe usa, ai scribe canada, best ai medical scribe 2026, ai scribe hipaa, ai scribe gdpr, ai scribe privacy act',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'article', url: URL },
  alternates: { canonical: URL },
}

export default function AiScribeComparisonPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(createBlogPostSchema({ title: TITLE, description: DESCRIPTION, datePublished: '2026-05-27', dateModified: '2026-05-27', author: 'Zac Lewis', url: URL })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'What is the best AI medical scribe in 2026?', acceptedAnswer: { '@type': 'Answer', text: 'No single AI scribe is best globally — it depends on your jurisdiction, practice type, and the regulatory framework you need to meet. In Australia and New Zealand, Heidi and Lyrebird lead with native AU data residency satisfying Australian Privacy Principle 8. In the UK, Tortus and Tandem Health are on NHS England\'s Ambient Voice supplier registry and satisfy NHS information governance. In the US, Abridge, Suki, and DAX Copilot (Microsoft Nuance) lead, with DAX dominating large hospital systems and Abridge gaining in primary care. ChatGPT and Claude are NOT clinical scribes regardless of jurisdiction.' } },
          { '@type': 'Question', name: 'Is Heidi available in the UK and US?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Heidi Health was founded in Australia but now operates in the UK, US, New Zealand, and Canada with regional data residency where required. In the US Heidi competes with Abridge and Suki for primary care market share. In the UK Heidi is one option among Tortus, Tandem, and others on the NHS England Ambient Voice registry.' } },
          { '@type': 'Question', name: 'Which AI scribes are HIPAA compliant?', acceptedAnswer: { '@type': 'Answer', text: 'Healthcare-purpose-built AI scribes operating in the US (Abridge, Suki, DAX Copilot, Heidi US, Lyrebird US) sign HIPAA Business Associate Agreements and are HIPAA-compliant. Consumer ChatGPT, Claude.ai, and Gemini are NOT HIPAA-compliant by default — they require explicit BAA negotiation or workflow safeguards.' } },
          { '@type': 'Question', name: 'What about ChatGPT for clinical notes?', acceptedAnswer: { '@type': 'Answer', text: 'ChatGPT is not a clinical AI scribe. It is a general-purpose LLM. It does not meet AHPRA AI guidelines, the Australian Privacy Principles, HIPAA, or GDPR for patient health information by default. Use it for non-PHI clinical writing only (patient information sheets, exercise programs in plain language, translation of de-identified content).' } },
        ],
      }) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-white pt-[120px] pb-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="inline-block bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">AI in Clinical Practice · Cross-Jurisdiction</div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">AI Medical Scribe Comparison 2026 — Heidi vs Lyrebird vs Tortus vs Abridge vs Suki vs DAX</h1>
            <p className="text-lg md:text-xl text-slate-200 mb-4">A clinician&apos;s side-by-side guide to the six AI scribes Australian, UK, US, and Canadian practitioners are actually using in 2026. Data residency, regulatory fit (Privacy Act, HIPAA, GDPR), specialty support, pricing, and which one fits which practice.</p>
            <div className="flex items-center gap-3 text-slate-300 text-sm"><Clock className="w-4 h-4" /><span>Zac Lewis, B.Clin.Sci., M.Ost.Med. (AHPRA-registered Osteopath) &mdash; 27 May 2026 &mdash; 11 min read</span></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">

          {/* Quick answer (AIO-optimal) */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-slate-300 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick answer</h2>
            <p className="text-slate-700 leading-relaxed mb-3">No single AI medical scribe is best globally. The right choice depends on your jurisdiction, practice type, and the regulatory framework you need to satisfy:</p>
            <ul className="space-y-2 text-slate-700">
              <li className="flex gap-3"><MapPin className="w-4 h-4 text-emerald-600 mt-1 shrink-0" /><span><strong>Australia + New Zealand:</strong> Heidi (largest market share, broadest workflow) or Lyrebird (leaner, solo-practice). Both AU-resident, Privacy Act-compliant by default.</span></li>
              <li className="flex gap-3"><MapPin className="w-4 h-4 text-blue-600 mt-1 shrink-0" /><span><strong>United Kingdom:</strong> Tortus or Tandem (on NHS England&apos;s Ambient Voice supplier registry). Heidi UK is a credible alternative for private practice.</span></li>
              <li className="flex gap-3"><MapPin className="w-4 h-4 text-red-600 mt-1 shrink-0" /><span><strong>United States:</strong> DAX Copilot (Microsoft Nuance — dominant in hospital systems), Abridge (gaining in primary care), Suki (mid-tier ambient). Heidi US is the newer entrant.</span></li>
              <li className="flex gap-3"><MapPin className="w-4 h-4 text-amber-600 mt-1 shrink-0" /><span><strong>Canada:</strong> Heidi has strong Canadian presence; Abridge and DAX also operate. Provincial colleges accept self-claim CPD with any compliant tool.</span></li>
              <li className="flex gap-3"><AlertTriangle className="w-4 h-4 text-red-600 mt-1 shrink-0" /><span><strong>ChatGPT, Claude.ai, Gemini:</strong> NOT clinical scribes. General-purpose LLMs, no jurisdiction-appropriate data residency by default. Use only for non-PHI clinical writing.</span></li>
            </ul>
          </div>

          {/* The 6 tools — detailed */}
          <Section icon={Globe} title="The six AI medical scribes clinicians are actually using in 2026">
            <p>Every one of these is a Tier A healthcare-purpose-built tool — designed for clinical documentation from the ground up, with regulatory compliance built into the workflow. They are not general-purpose LLMs with a clinical wrapper.</p>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">1. Heidi Health (AU founded; now AU, UK, US, NZ, CA)</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Headline:</strong> Founders publicly state roughly half of Australian GPs use Heidi. Now expanding into allied health and across the UK, US, NZ and Canada with regional data residency.</li>
              <li><strong>Specialty support:</strong> Strong AU clinical conventions (SOAP, problem-orientated, NDIS-aligned, mental health care plans, allied health, GP). Expanding US/UK templates.</li>
              <li><strong>Integrations:</strong> Broad — Best Practice, MedicalDirector, Genie, Bp Premier (AU); various UK + US practice-management platforms.</li>
              <li><strong>Privacy posture:</strong> AU data residency by default; US/UK regional residency available; HIPAA BAA available for US customers.</li>
              <li><strong>Best for:</strong> Larger practices, broad specialty mix, clinicians who want comprehensive workflow customisation.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">2. Lyrebird Health (AU founded; AU primary)</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Headline:</strong> Smaller market position than Heidi but well-regarded in solo and small-group practices. Australian-built, AU data residency.</li>
              <li><strong>Specialty support:</strong> Strong AU clinical templates; leaner customisation surface.</li>
              <li><strong>Integrations:</strong> Focused integration set; sufficient for typical solo practice.</li>
              <li><strong>Privacy posture:</strong> AU data residency by default. Privacy Act compliant.</li>
              <li><strong>Best for:</strong> Solo practitioners and small clinics who value speed and simplicity over template depth.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">3. Tortus (UK; NHS-focused)</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Headline:</strong> One of 19 vendors on NHS England&apos;s Ambient Voice supplier registry (January 2026). Trialled at Great Ormond Street Hospital with published outcomes data.</li>
              <li><strong>Specialty support:</strong> UK clinical conventions, NHS coding (SNOMED CT integration), GP and secondary-care templates.</li>
              <li><strong>Integrations:</strong> EMIS Web, SystmOne, NHS Spine compatibility paths.</li>
              <li><strong>Privacy posture:</strong> UK data residency. NHS information governance compliant. GDPR-compliant by default.</li>
              <li><strong>Best for:</strong> NHS clinicians and UK private practice that needs NHS-side integrations.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">4. Abridge (US; primary care + outpatient)</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Headline:</strong> Fast-growing US ambient scribe with strong primary-care adoption. Backed by major US health systems including UPMC and Kaiser.</li>
              <li><strong>Specialty support:</strong> US clinical conventions, ICD-10, CPT coding integration, US insurer documentation requirements.</li>
              <li><strong>Integrations:</strong> Epic, Cerner, Athenahealth EHR integrations.</li>
              <li><strong>Privacy posture:</strong> HIPAA BAA standard. US data residency. SOC 2 Type II compliant.</li>
              <li><strong>Best for:</strong> US primary care, outpatient specialties, mid-size health systems.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">5. Suki (US; physician documentation)</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Headline:</strong> Voice-first US ambient scribe, longer in market than Abridge. Used across primary care, internal medicine, specialty practices.</li>
              <li><strong>Specialty support:</strong> US clinical templates across most specialties; physician-focused (less allied-health emphasis).</li>
              <li><strong>Integrations:</strong> Epic, Cerner, eClinicalWorks, Athenahealth.</li>
              <li><strong>Privacy posture:</strong> HIPAA BAA, US data residency.</li>
              <li><strong>Best for:</strong> US physicians wanting a mature, physician-tuned scribe.</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mt-6 mb-3">6. DAX Copilot (Microsoft Nuance; US + UK)</h3>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Headline:</strong> Dragon Ambient eXperience, now branded DAX Copilot under Microsoft. The dominant enterprise scribe in large US hospital systems. Available in the UK via Microsoft&apos;s healthcare partnerships.</li>
              <li><strong>Specialty support:</strong> Broadest coverage of any scribe — physicians, nursing, allied health, multi-specialty hospital workflows.</li>
              <li><strong>Integrations:</strong> Native Epic + Cerner; Microsoft cloud integrations.</li>
              <li><strong>Privacy posture:</strong> HIPAA, HITRUST, ISO 27001. Microsoft enterprise security stack. UK NHS-compliant configurations available.</li>
              <li><strong>Best for:</strong> Large US health systems already on Microsoft + Epic/Cerner; enterprise UK deployments.</li>
            </ul>
          </Section>

          {/* Comparison table */}
          <Section icon={ShieldCheck} title="Side-by-side comparison">
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="min-w-[800px] w-full text-sm border-collapse mt-4">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-50">
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Tool</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Primary market</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Data residency</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Regulatory fit</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Best for</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <CompRow tool="Heidi" market="AU primary; now UK/US/NZ/CA" residency="Regional (AU, US, UK, etc.)" reg="AHPRA, HIPAA BAA, NHS-compatible" best="Broad workflow, multi-specialty, allied health" />
                  <CompRow tool="Lyrebird" market="AU primary" residency="AU" reg="Privacy Act (APP 8 compliant by default)" best="Solo practitioners, small clinics" />
                  <CompRow tool="Tortus" market="UK (NHS)" residency="UK" reg="NHS IG Toolkit, GDPR, Ambient Voice registry" best="NHS clinicians + UK private practice" />
                  <CompRow tool="Abridge" market="US" residency="US" reg="HIPAA BAA, SOC 2 Type II" best="US primary care, outpatient, mid-size systems" />
                  <CompRow tool="Suki" market="US" residency="US" reg="HIPAA BAA" best="US physicians, multi-specialty" />
                  <CompRow tool="DAX Copilot" market="US + UK + enterprise" residency="US (UK regional config available)" reg="HIPAA, HITRUST, ISO 27001, NHS-compatible" best="Large US health systems, enterprise UK" />
                  <tr className="bg-red-50/40"><td className="py-3 px-3 font-medium text-red-900">ChatGPT (consumer)</td><td className="text-red-800">Universal</td><td className="text-red-800">US</td><td className="text-red-800 font-semibold">NOT clinical-compliant by default</td><td className="text-red-800">Non-PHI writing only</td></tr>
                  <tr className="bg-red-50/40"><td className="py-3 px-3 font-medium text-red-900">Claude.ai</td><td className="text-red-800">Universal</td><td className="text-red-800">US</td><td className="text-red-800 font-semibold">NOT clinical-compliant by default</td><td className="text-red-800">Non-PHI writing only</td></tr>
                  <tr className="bg-red-50/40"><td className="py-3 px-3 font-medium text-red-900">Gemini</td><td className="text-red-800">Universal</td><td className="text-red-800">US</td><td className="text-red-800 font-semibold">NOT clinical-compliant by default</td><td className="text-red-800">Non-PHI writing only</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Privacy frameworks per jurisdiction */}
          <Section icon={ShieldCheck} title="Privacy frameworks — what changes between AU, UK, US, Canada">
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card title="🇦🇺 Australia — Privacy Act 1988 + AHPRA AI Guidelines">
                <p>Australian Privacy Principle 8 governs offshore disclosure. AU-resident scribes (Heidi AU, Lyrebird) don&apos;t trigger APP 8. Consumer LLMs (ChatGPT, Claude.ai) do — explicit patient consent required.</p>
              </Card>
              <Card title="🇬🇧 United Kingdom — UK GDPR + NHS Information Governance">
                <p>UK GDPR requires lawful basis + appropriate safeguards. NHS England&apos;s Ambient Voice supplier registry is the practical gate — using a registered scribe is the path of least resistance. GDPR offshore-transfer rules apply to US-only tools.</p>
              </Card>
              <Card title="🇺🇸 United States — HIPAA + State-by-State">
                <p>HIPAA Business Associate Agreement is the contractual mechanism. Every clinical scribe must have a signed BAA. Without it, the tool is not HIPAA-compliant regardless of marketing claims. Consumer LLMs do not sign BAAs by default.</p>
              </Card>
              <Card title="🇨🇦 Canada — PIPEDA + Provincial Privacy Acts">
                <p>PIPEDA covers federal commercial entities. Provinces (Ontario PHIPA, BC PIPA, Alberta HIA) add local rules. Cross-border data flows require notice + safeguards. Tools with Canadian data residency simplify this materially.</p>
              </Card>
            </div>
          </Section>

          {/* Decision framework */}
          <Section icon={CheckCircle} title="Which AI scribe should you pick — by jurisdiction + practice">
            <p className="font-semibold text-slate-900">Australia &amp; New Zealand:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong>Larger practice, multi-specialty:</strong> Heidi</li>
              <li><strong>Solo or small clinic:</strong> Lyrebird</li>
              <li><strong>Allied health (physio, osteo, etc.):</strong> Heidi has broader allied-health template depth</li>
              <li><strong>NDIS-heavy practice:</strong> Either Tier A scribe with the audit-safe documentation workflow (see our <Link href="/blog/chatgpt-ndis-reports-allied-health-australia" className="text-teal-700 underline">ChatGPT NDIS reports article</Link>)</li>
            </ul>

            <p className="font-semibold text-slate-900">United Kingdom:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong>NHS:</strong> Tortus or Tandem (Ambient Voice registry) — start here</li>
              <li><strong>UK private practice:</strong> Heidi UK or Tortus, depending on integration needs</li>
              <li><strong>Multi-site / hospital trust:</strong> DAX Copilot if already on Microsoft + Epic</li>
            </ul>

            <p className="font-semibold text-slate-900">United States:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong>Solo or small primary care:</strong> Abridge or Suki</li>
              <li><strong>Mid-size system:</strong> Abridge (Epic integration depth) or DAX Copilot</li>
              <li><strong>Large hospital system already on Microsoft + Epic:</strong> DAX Copilot</li>
              <li><strong>Allied health / specialty:</strong> Heidi US is the emerging option; Abridge has weaker allied-health templates</li>
            </ul>

            <p className="font-semibold text-slate-900">Canada:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li><strong>Family medicine + outpatient:</strong> Heidi CA or Abridge (US tools work but check provincial cross-border rules)</li>
              <li><strong>Hospital system:</strong> DAX Copilot (most enterprise deployments)</li>
            </ul>
          </Section>

          {/* When NOT to use AI scribes */}
          <Section icon={AlertTriangle} title="When NOT to use ANY AI scribe — universal across jurisdictions">
            <p>Switch off the AI scribe regardless of tool choice for: mental health disclosures, mandatory reporting (child safety, family violence, elder abuse), complex medicolegal cases, paediatric consults with mixed consent, patients who decline AI use, sensitive sexual/reproductive health consults, and any situation where transcript accuracy matters more than note-writing speed.</p>
            <p>See our full red-flags article: <Link href="/blog/when-not-to-use-ai-clinical-notes-clinicians" className="text-teal-700 underline">7 red flags for AI clinical documentation</Link>.</p>
          </Section>

          {/* CTA */}
          <section className="bg-gradient-to-br from-teal-700 to-emerald-700 text-white rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-3">Get the full framework — AI in Clinical Practice (now available)</h2>
            <p className="text-emerald-50 leading-relaxed mb-5">Our short course teaches the Tier A/B/C decision framework with worked examples across physio, osteo, GP and naturopathy. Includes AHPRA compliance, HIPAA-equivalent jurisdictional adaptations, and NDIS audit-safe documentation workflows. 3 CPD hours, fully online, certificate.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/courses/ai-in-clinical-practice" className="inline-flex items-center gap-2 bg-white text-teal-700 px-5 py-3 rounded-lg font-semibold text-sm hover:bg-emerald-50 transition-colors">Explore the course &mdash; A$99</Link>
              <Link href="/ai-safety-checklist" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 px-5 py-3 rounded-lg font-semibold text-sm transition-colors">Get the free AI Safety Checklist</Link>
              <Link href="/pricing-international" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 px-5 py-3 rounded-lg font-semibold text-sm transition-colors">International pricing (USD)</Link>
            </div>
          </section>

          <RelatedPosts slugs={['heidi-vs-lyrebird-ai-scribe-australian-clinicians', 'ahpra-ai-guidelines-explained-australian-clinicians', 'ai-scribe-privacy-act-compliance-australia']} />
        </div>
      </div>
    </>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
      <div className="flex items-center gap-3 mb-4"><Icon className="w-7 h-7 text-teal-600" /><h2 className="text-2xl font-bold text-slate-900">{title}</h2></div>
      <div className="space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  )
}

function CompRow({ tool, market, residency, reg, best }: { tool: string; market: string; residency: string; reg: string; best: string }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="py-3 px-3 font-semibold text-slate-900">{tool}</td>
      <td className="py-3 px-3 text-slate-700">{market}</td>
      <td className="py-3 px-3 text-slate-700">{residency}</td>
      <td className="py-3 px-3 text-slate-700">{reg}</td>
      <td className="py-3 px-3 text-slate-700">{best}</td>
    </tr>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <p className="font-semibold text-slate-900 mb-2 text-sm">{title}</p>
      <div className="text-xs text-slate-700 leading-relaxed">{children}</div>
    </div>
  )
}
