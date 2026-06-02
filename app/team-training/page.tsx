import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { TeamTrainingInquiryForm } from '@/components/TeamTrainingInquiryForm'
import { createMedicalWebPageSchema, organizationSchema } from '@/lib/schema-markup'
import { Users, MapPin, BookOpen, Calendar, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'

const TITLE = 'Train Your Team — In-House Concussion + AI Clinical Practice CPD for AU Clinics'
const DESCRIPTION = 'In-house team training for Australian clinics, sports organisations, hospital networks, and allied health groups. Concussion Clinical Mastery + AI in Clinical Practice delivered on-site or live online. AHPRA-aligned, Osteopathy Australia endorsed.'
const URL = 'https://portal.concussion-education-australia.com/team-training'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'in-house team training concussion, clinic group training ahpra, team cpd australian clinics, sports organisation concussion training, hospital network ai compliance training, allied health team training',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', url: URL },
  alternates: { canonical: URL },
}

export default function TeamTrainingLanding() {
  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createMedicalWebPageSchema({
            title: TITLE,
            description: DESCRIPTION,
            url: URL,
            lastReviewed: '2026-06-02',
            about: 'In-house team training in concussion clinical mastery and AI in clinical practice for AU healthcare organisations',
            reviewedBy: 'Zac Lewis',
          })),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      <SiteNav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-800 to-emerald-800 text-white pt-[120px] pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-block bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-4">
            For clinics, sports organisations, and hospital networks
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Train your team in-house
          </h1>
          <p className="text-lg text-emerald-50 mb-2 max-w-2xl">
            Bring CEA&apos;s flagship training to your team — on-site, live online, or hybrid. Concussion Clinical Mastery + AI in Clinical Practice delivered around your workflow.
          </p>
          <p className="text-sm text-emerald-100 max-w-2xl">
            AHPRA-aligned. Osteopathy Australia endorsed. Per-clinician certification and CPD records included.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_minmax(0,420px)] gap-8">

        <div className="space-y-6">
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-700" />
              Who this is for
            </h2>
            <ul className="space-y-3 text-sm text-slate-700">
              {[
                { i: Stethoscope, t: 'Multi-clinician private practices', d: 'Allied health and sports medicine groups wanting concussion or AI compliance training delivered to the whole clinic at once.' },
                { i: Sparkles, t: 'Sports organisations', d: 'AFL / NRL / NSWRL clubs, NSWIS / VIS / AIS programs, school sports academies needing structured concussion management capability.' },
                { i: ShieldCheck, t: 'Hospital networks + rehab groups', d: 'Emergency departments, mTBI clinics, brain injury rehab services — standardised concussion + AI documentation training across staff.' },
                { i: BookOpen, t: 'University clinical placement programs', d: 'Concussion training built into final-year clinical education for osteopathy / physiotherapy / sports medicine programs.' },
              ].map((row, i) => (
                <li key={i} className="flex gap-3">
                  <row.i className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">{row.t}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{row.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-4">What gets delivered</h2>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <BookOpen className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Concussion Clinical Mastery (full programme — 14 CPD hours)</p>
                  <p className="text-xs text-slate-600 leading-relaxed">8 online modules + full-day hands-on workshop covering SCAT6, SCOAT6, VOMS, BESS, return-to-play protocols. AHPRA-aligned, Osteopathy Australia endorsed.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">AI in Clinical Practice (3 CPD hours)</p>
                  <p className="text-xs text-slate-600 leading-relaxed">AHPRA AI guidelines + Australian Privacy Principles + NDIS audit-safe documentation + Tier A/B/C tool framework (Heidi, Lyrebird, ChatGPT, Claude).</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Sparkles className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Custom curriculum</p>
                  <p className="text-xs text-slate-600 leading-relaxed">Mix concussion + AI + specialty modules around your team&apos;s scope. Sports orgs often combine concussion + return-to-play decision-making. Hospital networks combine concussion + AI documentation. Discuss what fits.</p>
                </div>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-700" />
              Format + logistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <FormatCard title="In-person at your site" desc="Zac travels to your clinic / venue. Full-day hands-on workshop format. Best for ≥10 clinicians at one location." />
              <FormatCard title="Live online cohort" desc="Multi-session live online delivery over 2-4 weeks. Best for distributed teams or multi-site clinics. Recorded for asynchronous catch-up." />
              <FormatCard title="Hybrid" desc="Online modules at clinicians' own pace + in-person workshop day. Best for mixed-availability teams." />
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-700" />
              How it works
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700 leading-relaxed">
              <li>Submit the inquiry form. Zac (AHPRA-registered osteopath, course author) responds personally within 1-2 business days.</li>
              <li>Short scoping call — team size, clinician mix, preferred topics, format, timeline.</li>
              <li>Tailored proposal + pricing sent within a few days. No public list price — every engagement is scoped to your team&apos;s scale and topics.</li>
              <li>Delivery scheduled around your team&apos;s availability. Per-clinician CPD certificates issued on completion.</li>
            </ol>
          </section>
        </div>

        <aside>
          <div className="bg-white rounded-xl shadow-md border-2 border-teal-300 p-6 sticky top-24">
            <h3 className="text-base font-bold text-slate-900 mb-2">Send a team-training inquiry</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">Zac responds to every team inquiry personally. Pricing depends on team size, topics, and format — discussed privately on the scoping call.</p>
            <TeamTrainingInquiryForm />
          </div>
        </aside>
      </div>
    </div>
  )
}

function FormatCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-900 mb-1">{title}</p>
      <p className="text-[11px] text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}
