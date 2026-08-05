import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { PpcsWaitlistForm } from '@/components/PpcsWaitlistForm'
import { createMedicalWebPageSchema, createFAQSchema, organizationSchema } from '@/lib/schema-markup'
import { Clock, Eye, Activity, ShieldCheck, Stethoscope, AlertTriangle } from 'lucide-react'

const TITLE = "Persistent Post-Concussion Symptoms (PPCS) Course — Join the Demand-Validation List"
const DESCRIPTION = 'Persistent post-concussion symptoms management course for AU/UK/US/CA clinicians. The minority of concussions that don\'t resolve in standard timeframes — vestibulo-ocular workup, cervical contribution, escalation pathways. Gauging demand before building. Waitlist gets first-look access + launch-week discount once the course is complete.'
const URL = 'https://portal.concussion-education-australia.com/ppcs-waitlist'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'persistent post-concussion symptoms, ppcs management course, chronic concussion training, post concussion syndrome treatment, ppcs vestibulo-ocular, cervicogenic post-concussion, chronic concussion physiotherapy, ppcs clinician course',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', url: URL },
  alternates: { canonical: URL },
}

export default function PpcsWaitlistLanding() {
  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createMedicalWebPageSchema({
            title: TITLE,
            description: DESCRIPTION,
            url: URL,
            lastReviewed: '2026-05-27',
            about: 'Persistent post-concussion symptoms, chronic concussion management, vestibulo-ocular workup, cervical contribution to chronic concussion',
            reviewedBy: 'Zac Lewis',
          })),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createFAQSchema([
            {
              question: 'What are persistent post-concussion symptoms (PPCS)?',
              answer: 'A minority of concussion cases develop persistent post-concussive symptoms — symptoms that fail to resolve within the expected timeframe (typically >4 weeks in adults, >2 weeks in children). PPCS commonly involves vestibulo-ocular dysfunction and cervical contribution. Standard acute concussion training focuses on the first 4 weeks; PPCS requires a different clinical workup.',
            },
            {
              question: 'When will the PPCS course launch?',
              answer: 'The PPCS course is in the planning phase. We are gauging demand via this waitlist before committing to a build. If ≥100 clinicians sign up, we proceed; if fewer, we do not. Waitlist members get a launch announcement with a 50% off launch-week price code on the day the course goes live.',
            },
            {
              question: 'Who is this course for?',
              answer: 'Clinicians who manage post-concussion patients beyond the acute phase: physiotherapists, osteopaths, GPs, sports medicine doctors, exercise physiologists. Particularly valuable for clinicians already familiar with acute concussion assessment (SCAT6, SCOAT6, VOMS) who want to deepen into chronic case management.',
            },
          ])),
        }}
      />
      <SiteNav />

      <section className="bg-gradient-to-br from-purple-800 to-indigo-800 text-white pt-[120px] pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-block bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Demand-validation waitlist · Course in planning
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Persistent Post-Concussion Symptoms (PPCS) — The Cases That Don&apos;t Resolve
          </h1>
          <p className="text-lg text-purple-100 mb-6 max-w-2xl">
            Clinical mastery for the concussion cases that don&apos;t resolve in standard timeframes. Vestibulo-ocular workup, cervical contribution, escalation pathways. For clinicians who already work in acute concussion and want the chronic-case framework.
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-purple-100">
            <span className="bg-white/10 px-3 py-1 rounded-full">Beyond the standard timeframe</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Vestibulo-ocular workup</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Cervical contribution</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">Waitlist gets 50% off launch week</span>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_minmax(0,360px)] gap-8">

        <div>
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">What the course will cover</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {[
                { i: Stethoscope, t: 'Identifying PPCS early', d: 'Clinical criteria, when "this isn\'t resolving" should change your plan, common missed presentations.' },
                { i: Eye, t: 'Vestibulo-ocular workup beyond VOMS', d: 'The PPCS cases that need it — a frequent and frequently missed driver. Full clinical workup, treatment frameworks, when to refer.' },
                { i: Activity, t: 'Cervical contribution to chronic symptoms', d: 'The PPCS cases with cervical drivers. Differential, manual therapy applications, when whiplash overlap matters.' },
                { i: AlertTriangle, t: 'Escalation criteria + referral pathways', d: 'Who needs neurology, neuropsychology, vestibular specialist, headache clinic. When to refer and how to position the handoff.' },
                { i: ShieldCheck, t: 'Active rehabilitation protocols', d: 'Beyond "wait until symptom-free" (now obsolete under Amsterdam 2023). Sub-threshold exercise, graded exposure, return-to-school/work.' },
              ].map((row, i) => (
                <li key={i} className="flex gap-3">
                  <row.i className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{row.t}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{row.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Why this course exists</h2>
            <div className="text-sm text-slate-700 leading-relaxed space-y-3">
              <p>
                Most concussion CPD is acute-focused — the first 4 weeks, SCAT6, return-to-play. That training is essential, but it doesn&apos;t prepare clinicians for the cases that don&apos;t resolve.
              </p>
              <p>
                A 2018 scoping review explicitly identified persistent post-concussion symptoms as a clinician knowledge gap. The clinicians most affected aren&apos;t the sports-medicine specialists — they&apos;re the generalist physios, osteos, and GPs who see PPCS in the second week and don&apos;t have a framework for what comes next.
              </p>
              <p>
                This course is for them. Built on the same evidence base as Concussion Clinical Mastery (Amsterdam 2023, AIS 2024 brain health), with a chronic-case clinical workup that leverages vestibulo-ocular + cervical depth.
              </p>
            </div>
          </section>
        </div>

        <aside>
          <div className="bg-white rounded-xl shadow-md border-2 border-purple-300 p-6 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 mb-1">Join the waitlist</h3>
            <p className="text-xs text-slate-600 mb-1">We&apos;re gauging demand before building this course. If interest is strong, waitlist members get first access + <strong>50% off launch week</strong>.</p>
            <p className="text-[11px] text-slate-500 mb-4">One confirmation email now. One launch email when the course is built and ready. No spam in between. Final pricing, CPD hours and launch date confirmed once the course is fully scoped and built.</p>
            <PpcsWaitlistForm />
            <p className="text-[10px] text-slate-500 mt-4 italic">
              We commit to building this course only if waitlist demand is strong (≥100 signups). You&apos;ll be notified either way — including if we decide not to proceed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
