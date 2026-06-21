import type { Metadata } from 'next'
import {
  Award,
  Check,
  X,
  ArrowRight,
  BookOpen,
  Activity,
  ClipboardList,
  FileText,
  Brain,
} from 'lucide-react'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import CrmWorkshopInterest from '@/components/CrmWorkshopInterest'
import { SiteNav } from '@/components/SiteNav'

// ─────────────────────────────────────────────────────────────────────────────
// Concussion Rehab Mastery — PUBLIC sales/landing page (EP-scoped course).
//
// IMPORTANT: this page is built ahead of launch. It MUST stay unlisted and
// unindexed until the founder flips it live — hence noindex/nofollow and no
// link from any nav/homepage. Marketing page only; course content stays gated.
//
// Design system mirrors app/course/page.tsx (the CCM landing): SiteNav, glass
// cards, container-*/section-padding, btn-primary, text-gradient, icon-container.
// No infographics, no bento, no big photos, no custom CSS-var styling.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — Built for Exercise Physiologists',
  description:
    'The only concussion-rehabilitation course scoped for Accredited Exercise Physiologists and Exercise Scientists. 8 online modules · 8 CPD hours · designed to ESSA CPD standards (accreditation pending).',
  robots: 'noindex, nofollow',
}

// Interest capture — no live checkout. A mailto keeps this self-contained.
const INTEREST_HREF =
  'mailto:hello@concussion-education-australia.com?subject=Concussion%20Rehab%20Mastery%20%E2%80%94%20Register%20my%20interest&body=Hi%20Zac%2C%20I%27d%20like%20to%20register%20my%20interest%20in%20Concussion%20Rehab%20Mastery.%0A%0AName%3A%0AProfession%20(AEP%20%2F%20AES)%3A%0AESSA%20number%20(optional)%3A%0A'

const INCLUDED = [
  { icon: BookOpen, title: '8 Online Modules', desc: '8 CPD hours of structured, video-supported learning' },
  { icon: Activity, title: 'Live Baseline & Serial Testing', desc: 'A working assessment tool, not a static PDF' },
  { icon: ClipboardList, title: 'The Clinical Toolkit', desc: 'BCTT sheet, SSTAE templates, phenotype library' },
  { icon: FileText, title: 'Document Pack', desc: 'NDIS, WorkCover & GP report templates' },
  { icon: Award, title: 'Certificate', desc: 'Issued on passing — 80% pass mark' },
  { icon: Brain, title: 'Lifetime Access', desc: 'One-time payment · revisit any time' },
]

const SCOPE_IN = [
  'Assess exercise tolerance & the symptom-limited threshold (BCTT)',
  'Prescribe and progress sub-symptom-threshold aerobic exercise (SSTAE)',
  'Deliver phenotype-specific reconditioning within EP scope',
  'Guide graded return-to-activity and sport-specific reconditioning',
  'Monitor heart rate, workload, RPE and symptom response — and adjust dose',
  'Recognise red flags, stop, and escalate to the medical team',
]

const SCOPE_OUT = [
  'Diagnose or re-diagnose concussion',
  'Determine medical readiness to commence rehabilitation',
  'Grant return-to-sport or medical clearance',
  'Manage red-flag presentations beyond stop-and-refer',
]

const FAQ = [
  {
    q: 'Is it ESSA accredited?',
    a: 'ESSA CPD accreditation is pending — the course is in application and has been designed to ESSA CPD standards. We don’t claim accreditation we don’t yet hold; this page will be updated the moment it’s confirmed.',
  },
  {
    q: 'How many CPD points is it worth?',
    a: '8 CPD hours, mapped to 8 ESSA CPD points across the eight modules — enough to cover most of a member’s annual Further-Education requirement.',
  },
  {
    q: 'Do I need the in-person workshop?',
    a: 'No — the online course is complete and standalone. You finish it at your own pace and sit the assessment entirely online. If you also want the hands-on skills, you can add the same full-day practical workshop every clinician takes (SCAT6, VOMS, BESS and cervicogenic assessment) — the standard optional upgrade. There is no fixed workshop date yet; register your interest and we’ll place you in the next one in your region.',
  },
  {
    q: 'Is concussion rehab within my scope?',
    a: 'Yes. AEPs implement graded exertion and exercise prescription — exactly what evidence-based concussion rehab now requires. You implement and progress the rehabilitation; you do not diagnose or grant clearance. The course is comprehensive within that scope.',
  },
]

export default async function ConcussionRehabMasteryPage() {
  // GATED PRE-LAUNCH (Zac 2026-06): admin / demo-key / enrolled only — must NOT
  // be publicly reachable until launch. Remove this line to go live.
  await requireAiCourseAccess('/login')

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="section-padding pt-[120px]">
        <div className="container-lg px-6 md:px-8 text-center">
          <div className="badge mb-5">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            For Accredited Exercise Physiologists &amp; Exercise Scientists
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight leading-[1.1]">
            Concussion <span className="text-gradient">Rehab</span> Mastery
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-gradient mb-6">
            Built for Exercise Physiologists
          </p>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Concussion care has moved from rest to active rehabilitation. The Buffalo treadmill test,
            then a sub-symptom-threshold aerobic prescription progressed against an objective heart-rate
            ceiling, is the AEP&apos;s core skill — applied to a condition you were never trained for.
            This course closes that gap.
          </p>

          <div className="flex items-center justify-center gap-6 md:gap-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">8</div>
              <div className="text-xs text-muted-foreground font-medium">Online Modules</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">8</div>
              <div className="text-xs text-muted-foreground font-medium">CPD Hours</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">14</div>
              <div className="text-xs text-muted-foreground font-medium">With Workshop</div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            ESSA CPD accreditation pending — designed to ESSA CPD standards.
          </p>
        </div>
      </section>

      {/* What's Included */}
      <section className="section-padding bg-muted/30">
        <div className="container-lg px-6 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              What&apos;s included
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run a concussion-rehab caseload — scoped for exercise physiology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {INCLUDED.map((item, index) => (
              <div
                key={item.title}
                className="glass rounded-2xl p-6 animate-scale-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="icon-container w-12 h-12 mb-5">
                  <item.icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scope */}
      <section className="section-padding">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Scope-accurate by design
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              You implement the rehabilitation. You don&apos;t diagnose or clear.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-accent mb-4">
                Inside your scope
              </h3>
              <ul className="space-y-3">
                {SCOPE_IN.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-foreground leading-snug">
                    <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
                Outside your scope
              </h3>
              <ul className="space-y-3">
                {SCOPE_OUT.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted-foreground leading-snug">
                    <X className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="section-padding bg-muted/30">
        <div className="container-md px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            One course. Lifetime access.
          </h2>
          <p className="text-base text-muted-foreground mb-6">
            Online course A$497 AUD · one-time payment, lifetime access · add the optional hands-on
            workshop to take it to 14 CPD hours.
          </p>
          <a
            href={INTEREST_HREF}
            className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
          >
            Register your interest
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-xs text-muted-foreground mt-4">
            Be first to know when enrolment opens and pricing is confirmed.
          </p>
        </div>
      </section>

      {/* Workshop / in-person */}
      <section className="section-padding">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Want the skills in your hands?
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              The online course is complete on its own. The hands-on day is optional — and it&apos;s the
              same full-day practical workshop every clinician takes (SCAT6, VOMS, BESS and cervicogenic
              assessment), in the same room as osteopaths, physiotherapists and GPs. There&apos;s no fixed
              EP date yet — register your interest and we&apos;ll place you in the next workshop in your region.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 max-w-2xl mx-auto">
            <CrmWorkshopInterest />
          </div>
        </div>
      </section>

      {/* Your Facilitator */}
      <section className="section-padding bg-muted/30">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Who built it
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Learn from a clinician with real-world concussion management experience
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div
              className="glass rounded-2xl p-6 md:p-8"
              style={{ borderWidth: '2px', borderImage: 'linear-gradient(135deg, rgba(13,115,119,0.3), rgba(91,154,166,0.1)) 1' }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#64a8b0] to-[#5b9aa6] flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-xl font-bold text-white">ZL</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight text-center sm:text-left">
                    Zac Lewis
                  </h3>
                  <p className="text-sm font-semibold text-accent mb-3 text-center sm:text-left">
                    Registered Osteopath, B.Clin.Sci., M.Ost.Med &middot; Concussion Researcher
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Concussion rehab is, by its nature, an exercise-physiology problem — a functional,
                    energy-starved, autonomically-dysregulated injury that responds to precisely-dosed
                    exertion. Zac is a registered Osteopath with over a decade of clinical experience in
                    neurological health, rehabilitation and concussion management, including work with
                    national and professional ice hockey leagues across New Zealand and Canada. The course
                    is grounded in the Leddy / Buffalo evidence base and the Amsterdam 2023 international
                    consensus, translated specifically for the exercise-physiology scope of practice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="container-md px-6 md:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
              Frequently asked
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="glass rounded-2xl p-6">
                <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href={INTEREST_HREF}
              className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2"
            >
              Register your interest
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              ESSA CPD accreditation pending · designed to ESSA CPD standards
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
