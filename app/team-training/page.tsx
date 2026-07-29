import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { TeamTrainingInquiryForm } from '@/components/TeamTrainingInquiryForm'
import { createMedicalWebPageSchema, organizationSchema } from '@/lib/schema-markup'
import { Users, MapPin, BookOpen, Calendar, ShieldCheck, Sparkles, Stethoscope } from 'lucide-react'

const TITLE = 'Train Your Team — In-House Concussion CPD for AU Clinics'
const DESCRIPTION = 'In-house concussion training for Australian clinics, sports organisations, hospital networks, and allied health groups. Concussion Clinical Mastery delivered on-site or via self-paced online team seats. AHPRA-aligned, Osteopathy Australia endorsed.'
const URL = 'https://portal.concussion-education-australia.com/team-training'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'in-house team training concussion, clinic group training ahpra, team cpd australian clinics, sports organisation concussion training, hospital network concussion training, allied health team training',
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
            about: 'In-house team training in concussion clinical mastery for AU healthcare organisations',
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
            Bring CEA&apos;s flagship Concussion Clinical Mastery training to your team — an on-site practical day, self-paced online seats, or both. Delivered around your workflow.
          </p>
          <p className="text-sm text-emerald-100 max-w-2xl mb-2">
            We train clinics to become the local hub for concussion management — the practice GPs, sports clubs, and schools refer to when a head injury happens.
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
                { i: Stethoscope, t: 'Multi-clinician private practices', d: 'Allied health and sports medicine groups wanting structured concussion training delivered to the whole clinic at once.' },
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
                  <p className="font-semibold text-slate-900">Concussion Clinical Mastery (full program — 16 CPD hours)</p>
                  <p className="text-xs text-slate-600 leading-relaxed">8 online modules + full-day hands-on workshop covering SCAT6, SCOAT6, VOMS, BESS, return-to-play protocols. AHPRA-aligned, Osteopathy Australia endorsed.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Discipline-specific tracks</p>
                  <p className="text-xs text-slate-600 leading-relaxed">Curated content for osteopaths, physiotherapists, GPs, exercise physiologists, and admin/reception — each clinician sees what&apos;s relevant to their role in the patient journey.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Sparkles className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">Custom curriculum</p>
                  <p className="text-xs text-slate-600 leading-relaxed">Adjust emphasis around your team&apos;s scope — paediatric, sports sideline, vestibular rehab, return-to-play, or PPCS workup. Sports orgs often combine clinical training + RTP decision-making. Discuss what fits.</p>
                </div>
              </li>
            </ul>
          </section>

          {/* Become the local hub — outreach + positioning */}
          <section className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 rounded-xl shadow-sm border-2 border-teal-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-700" />
              After training: become the local hub for concussion management
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              Most clinics in a given postcode don&apos;t have a single clinician with structured concussion training. That&apos;s a positioning advantage. After we train your team, we help you tell the local sports clubs, GPs, schools, and medical centres that there&apos;s now an AHPRA-aligned concussion-trained team in their area.
            </p>
            <p className="text-sm font-semibold text-slate-900 mb-2">Post-training outreach support includes:</p>
            <ul className="space-y-2 text-sm text-slate-700">
              {[
                { t: 'Referral pathway intro pack', d: 'Editable letter + capability one-pager for outreach to local GP practices, sports physios, and medical centres. Positions your clinic as the concussion-management referral destination in your radius.' },
                { t: 'Sports club + school outreach templates', d: 'Email + handout templates for introducing your clinic to local football, rugby, AFL, junior sports, and school sport programs. Includes a "concussion-trained clinic" briefing they can give parents and coaches.' },
                { t: 'Co-branded credibility assets', d: 'CEA-trained badge for your website + waiting-room poster. Verifiable certification per clinician. Listing on CEA’s referral page (when launched).' },
                { t: 'Optional LinkedIn / press launch kit', d: '"Our clinic now offers structured concussion management" announcement template — for clinics that want to lean into the positioning publicly.' },
              ].map((row, i) => (
                <li key={i} className="flex gap-3">
                  <div className="shrink-0 w-5 h-5 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</div>
                  <div>
                    <p className="font-semibold text-slate-900">{row.t}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{row.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-600 italic mt-4 leading-relaxed">
              The training is the credential. The outreach is what turns it into local referral flow. We&apos;ve seen this work best for clinics in regional towns and outer metro suburbs where there&apos;s no obvious &ldquo;concussion clinic&rdquo; nearby — and for sports-medicine-focused practices wanting to formalise relationships with local clubs.
            </p>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-700" />
              Format + logistics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <FormatCard title="In-person at your site" desc="Zac travels to your clinic / venue. Full-day hands-on workshop format. Best for ≥10 clinicians at one location." />
              <FormatCard title="Online team seats" desc="Self-paced online seats for the whole team (8 CPD hours each), with per-clinician progress and certification. Best for distributed or multi-site teams." />
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
