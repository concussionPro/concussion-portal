import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { AiSafetyChecklistSignupForm } from '@/components/AiSafetyChecklistSignupForm'
import { ShieldCheck, FileText, ClipboardList, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react'

const TITLE = 'Free: AI Safety Checklist for Allied Health Documentation'
const DESCRIPTION = 'A 1-page AHPRA-aligned AI Safety Checklist for Australian allied health clinicians. NDIS-audit-safe documentation, Heidi vs Lyrebird tool reference, Privacy Act mini-cheatsheet. Free PDF.'
const URL = 'https://portal.concussion-education-australia.com/ai-safety-checklist'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'ai safety checklist, ai healthcare checklist, ahpra ai guidelines, ndis ai documentation, heidi vs lyrebird, ai scribe ahpra, australian privacy principles healthcare, ai clinical notes checklist',
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'article',
    url: URL,
  },
  alternates: { canonical: URL },
}

export default function AiSafetyChecklistLanding() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-700 to-emerald-700 text-white pt-[120px] pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-block bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Free for AU Allied Health
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            The AI Safety Checklist for Allied Health Documentation
          </h1>
          <p className="text-lg text-emerald-50 mb-6 max-w-2xl">
            A 1-page AHPRA-aligned, NDIS-audit-safe checklist for clinicians using Heidi, Lyrebird, ChatGPT or any AI tool in patient documentation. Pre-consult, during-consult, post-consult. Tier A / B / C tool reference. Australian Privacy Principles mini-cheatsheet.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-emerald-100">
            <span className="bg-white/10 px-3 py-1 rounded-full">AHPRA AI guidelines</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">NDIS audit-safe</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Heidi vs Lyrebird vs ChatGPT</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Privacy Act compliant</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_minmax(0,360px)] gap-8">

        {/* Left: what's inside + value */}
        <div>
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-teal-600" />
              What&apos;s inside
            </h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {[
                { i: ShieldCheck, t: 'Pre-consult checklist', d: 'Consent script, tool selection (Tier A vs B vs C), documentation plan.' },
                { i: FileText, t: 'During-consult checklist', d: 'Verbal consent recorded, AI scribe activation, patient questions handled.' },
                { i: CheckCircle, t: 'Post-consult checklist', d: 'Note review against AHPRA standards, audit trail, secure storage.' },
                { i: AlertTriangle, t: 'NDIS report-specific safeguards', d: 'Templating-flag check, clinical reasoning verification, NDIA audit-defence sign-off.' },
                { i: BookOpen, t: 'AHPRA + Privacy Act mini-cheatsheet', d: 'The 4 obligations every AU clinician must meet when using AI in patient care.' },
              ].map((row, i) => (
                <li key={i} className="flex gap-3">
                  <row.i className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{row.t}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{row.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Why this matters now</h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-3">
              <p>
                AHPRA has published AI guidelines. The TGA has issued specific guidance on digital scribes. The NDIA has become noticeably more alert to AI-generated allied health reports as part of fraud-and-assurance work. Indemnity insurers (Avant, Guild, MIPS, MIGA) have all published their own checklists.
              </p>
              <p>
                A 2024 survey of 231 Australian allied health professionals found that <strong>80% had never used AI</strong> and <strong>87% had little to no knowledge about it</strong>. The greatest challenge they identified was workforce knowledge and skills.
              </p>
              <p>
                This checklist is the 1-page version of the framework taught in the upcoming AI in Clinical Practice short course. It&apos;s free because every AU clinician using AI should have it in their pocket today.
              </p>
            </div>
          </section>
        </div>

        {/* Right: signup form */}
        <aside>
          <div className="bg-white rounded-xl shadow-md border-2 border-teal-200 p-6 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 mb-1">Get the checklist</h3>
            <p className="text-xs text-slate-600 mb-4">Sent to your inbox in under 60 seconds. No spam.</p>
            <AiSafetyChecklistSignupForm />
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              You&apos;ll also get a short email series (3 emails over 2 weeks) on AI documentation safety. Unsubscribe any time.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
