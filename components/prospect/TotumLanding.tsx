/**
 * Bespoke prospect landing for Totum Life Science (Toronto & Muskoka, ON).
 *
 * Canada-specific sales dashboard — built on the same premium visual
 * language as ProspectLanding (teal-slate palette, glass-premium cards,
 * sidebar-premium shell, editorial type) but with entirely Canadian
 * pitch content (Parachute Canada guideline, WSIB, BCTT, R.Kin, etc).
 *
 * NOT driven by a ProspectClinic row — Totum's details are hardcoded.
 * Self-contained client component so the anchor sidebar can render a
 * mobile drawer. Public route, no access key.
 */
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Brain,
  ArrowUpRight,
  ShieldCheck,
  MapPin,
  Mail,
  Menu,
  X,
  TrendingUp,
  ClipboardList,
  Building2,
  Stethoscope,
  Dumbbell,
  GraduationCap,
  Target,
  CheckCircle2,
  Calendar,
  Scale,
  BookOpen,
  FileText,
} from 'lucide-react'

const SLUG = 'totum-life-science'

const CAL_URL = 'https://cal.com/zac-lewis-so8zjs'
const EMAIL = 'zac@concussion-education-australia.com'

const NAV = [
  { id: 'opportunity', label: 'Opportunity' },
  { id: 'rowans-law', label: "Rowan's Law" },
  { id: 'why-totum', label: 'Why Totum' },
  { id: 'format', label: 'Format' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'preview', label: 'Preview the course' },
  { id: 'practical-day', label: 'Practical Day' },
  { id: 'toolkit', label: 'Clinical tools' },
  { id: 'pricing', label: 'Pricing' },
]

export function TotumLanding() {
  return (
    <div className="flex min-h-screen dashboard-bg">
      <TotumSidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 pt-16 md:pt-8 pb-10 sm:pb-14">
          <Hero />
          <Opportunity />
          <RowansLaw />
          <WhyTotum />
          <Format />
          <Curriculum />
          <CoursePreview />
          <PracticalDay />
          <Toolkit />
          <Pricing />
          <Footer />
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR — bespoke anchor nav, same sidebar-premium shell as ProspectSidebar
// ─────────────────────────────────────────────────────────────────────────────

function TotumSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-white/95 backdrop-blur shadow-md border border-slate-200 flex items-center justify-center print:hidden"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={`md:hidden fixed left-0 top-0 h-screen w-72 sidebar-premium p-6 flex flex-col z-50 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-white/40 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <SidebarBody onLinkClick={() => setMobileOpen(false)} />
      </div>

      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex-col z-40 print:hidden">
        <SidebarBody />
      </div>
    </>
  )
}

function SidebarBody({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md shadow-accent/15">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight leading-tight">
            Concussion Education<br /><span className="text-accent">Australia</span>
          </h1>
        </div>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">Totum Life Science</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Toronto &amp; Muskoka, ON · 7 locations</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={onLinkClick}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/40"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Accredited &amp; CPD-recognised</p>
        <p className="text-[10px] text-muted-foreground">Canadian Guideline on Concussion in Sport, 2024</p>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="mb-8">
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-[10.5px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
          Built on the Canadian Guideline on Concussion in Sport, 2nd ed. 2024
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[10.5px] font-bold uppercase tracking-wider border border-amber-200/60">
          Accredited &amp; CPD-recognised
        </span>
      </div>

      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-3">
        Concussion Clinical Mastery — Concussion Hub Program
      </p>
      <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02] mb-4 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
        Turn every Totum location into a local concussion hub.
      </h2>
      <p className="text-base sm:text-lg text-foreground/80 font-medium leading-relaxed max-w-3xl mb-5">
        Concussion is one of the most common injuries in Canadian sport — and one of the most
        under-treated: a multi-week, multi-clinician rehab episode that&apos;s usually referred out.
        This hybrid program — 8 hours of online modules, then one on-site practical day — trains your
        team to run it end to end: assessment, graded-exertion rehab on your gym floor, and a staged
        return. Every Totum location becomes the hub that keeps those patients.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <a
          href={CAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-accent text-white px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
        >
          <Calendar className="w-4 h-4" strokeWidth={2} />
          Book a 20-min call
          <ArrowUpRight className="w-4 h-4" />
        </a>
        <a
          href={`mailto:${EMAIL}?subject=${encodeURIComponent('Concussion Hub Program — Totum Life Science')}`}
          className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-white text-accent border-2 border-accent/20 hover:border-accent/40 px-6 py-3.5 rounded-xl shadow-sm transition-all"
        >
          <Mail className="w-4 h-4" strokeWidth={2} />
          Email Zac
        </a>
      </div>

      <div className="rounded-xl glass-premium px-4 py-3 flex items-start gap-3 max-w-3xl">
        <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Prepared for <strong className="text-foreground">Totum Life Science</strong> · King West flagship,
          downtown Toronto &amp; Muskoka · 7 locations · Physiotherapy · Kinesiology (R.Kin) · Chiropractic ·
          Massage Therapy · June 2026 · Zac Lewis, Concussion Education Australia.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THE OPPORTUNITY
// ─────────────────────────────────────────────────────────────────────────────

function Opportunity() {
  const stats = [
    {
      headline: '1 in 10',
      body: 'youth athletes sustains a concussion every year; hockey, ringette & lacrosse lead the list.',
    },
    {
      headline: '~1 in 4',
      body: 'take longer than a month to recover, needing the structured rehab most clinics refer out.',
    },
    {
      headline: '3+',
      body: 'clinicians per episode: a physician to diagnose, an allied clinician to assess, a rehab clinician to return them to sport.',
    },
  ]
  return (
    <section id="opportunity" className="scroll-mt-8 mb-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">The opportunity</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-5 leading-tight">
        The volume is already in your catchment.
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {stats.map((s) => (
          <div key={s.headline} className="glass-premium rounded-2xl p-5">
            <p className="text-3xl sm:text-4xl font-bold text-accent leading-none mb-2">{s.headline}</p>
            <p className="text-[13px] text-foreground/85 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground italic">
        Source: Parachute Canada · Canadian Guideline on Concussion in Sport, 2024.
      </p>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-accent/8 via-white to-accent/4 border border-accent/15 p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">A proven model</p>
        <p className="text-sm text-foreground/85 leading-relaxed max-w-3xl">
          CEA trains individual clinicians and entire clinical teams; this model has made clinics across
          Australia their community&apos;s go-to hub for concussion referral &amp; management.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROWAN'S LAW — Ontario's #1 concussion demand driver
// ─────────────────────────────────────────────────────────────────────────────

function RowansLaw() {
  return (
    <section id="rowans-law" className="scroll-mt-8 mb-10">
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 via-white to-accent/5 border border-accent/20 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
            <Scale className="w-[15px] h-[15px] text-accent" strokeWidth={2.5} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">Ontario law · Rowan&apos;s Law</p>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 leading-tight">
          Ontario law created the demand. Most clinics refer it out.
        </h3>
        <p className="text-sm sm:text-base text-foreground/85 leading-relaxed max-w-3xl mb-5">
          Ontario&apos;s <strong className="text-foreground">Rowan&apos;s Law (Concussion Safety), 2018</strong> legally
          requires every sport organisation to maintain a Removal-from-Sport and Return-to-Sport protocol and a
          Concussion Code of Conduct — in force since 2019, with the removal and return-to-sport rules mandatory
          since January 2022. The law is named for Rowan Stringer, a 17-year-old Ottawa rugby player who died of
          Second Impact Syndrome in 2013.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="glass-premium rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-accent mb-2">What the law locks down</p>
            <p className="text-[13.5px] text-foreground/85 leading-relaxed">
              Only a physician or nurse practitioner can medically clear an athlete to return to competition. That
              final sign-off is the one step the law reserves.
            </p>
          </div>
          <div className="glass-premium rounded-xl p-5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-accent mb-2">What it leaves open</p>
            <p className="text-[13.5px] text-foreground/85 leading-relaxed">
              Every step <em>between</em> removal and that clearance — recognise, assess, rehabilitate, stage the
              graded return — is unregulated clinical work that&apos;s usually referred out. This program trains
              Totum&apos;s team to own that entire middle of the pathway, handing a clean, clearance-ready file to the
              physician.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#fbbf24,transparent_60%)]" />
          <p className="relative text-base sm:text-lg font-bold leading-snug">
            Ontario law created the demand. Most clinics refer it out.{' '}
            <span className="text-amber-300">Totum can be the clinic that runs it.</span>
          </p>
        </div>

        <p className="text-[11px] text-muted-foreground italic mt-4">
          Source: Government of Ontario — Rowan&apos;s Law (Concussion Safety), 2018.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WHY TOTUM — three columns
// ─────────────────────────────────────────────────────────────────────────────

function WhyTotum() {
  const columns = [
    {
      icon: Stethoscope,
      title: 'What your clinicians get',
      items: [
        'Assess any concussion, confidently',
        'Run the rehab on your gym floor',
        'Stage the return to sport, school & work',
        'Manage persistent post-concussion symptoms',
      ],
    },
    {
      icon: ClipboardList,
      title: 'What your front desk gets',
      items: [
        'A concussion intake & triage short course',
        'Funded-claim forms — extended health, auto/SABS & WSIB',
        'Ready-to-use file checklists & templates',
      ],
    },
    {
      icon: Building2,
      title: 'What it does for Totum',
      items: [
        'The local concussion hub at every site',
        'The full episode kept in-house',
        'A service no nearby clinic offers',
        'One standard across all 7 sites — King West to Muskoka',
      ],
    },
  ]
  return (
    <section id="why-totum" className="scroll-mt-8 mb-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">Why Totum</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 leading-tight">
        One program. Three sides of the business.
      </h3>
      <p className="text-sm sm:text-base text-foreground/80 leading-relaxed max-w-3xl mb-5">
        Totum already runs a Personalized Circle of Care — and, as Official Health &amp; Performance Partner of
        AFC Toronto, already manages athletes to a professional standard. Concussion is the one episode that circle
        still refers out, yet structured graded-exertion rehab sits squarely in the scope of your R.Kins (Registered
        Kinesiologists, regulated by the College of Kinesiologists of Ontario). This program completes Totum&apos;s
        concussion circle of care.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => {
          const Icon = col.icon
          return (
            <div key={col.title} className="glass-premium rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px] text-accent" strokeWidth={2} />
                </div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-accent leading-tight">{col.title}</p>
              </div>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-foreground/85 leading-snug">
                    <CheckCircle2 className="w-4 h-4 text-accent/70 shrink-0 mt-0.5" strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT · HYBRID
// ─────────────────────────────────────────────────────────────────────────────

function Format() {
  return (
    <section id="format" className="scroll-mt-8 mb-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">Format · hybrid</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-5 leading-tight">
        Theory online, hands-on in your clinic.
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="glass-premium rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <GraduationCap className="w-[18px] h-[18px] text-accent" strokeWidth={2} />
            </div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-accent">Online</p>
          </div>
          <p className="text-base font-bold text-foreground leading-tight">
            8 online modules
          </p>
          <p className="text-[13px] text-muted-foreground leading-relaxed mt-1">
            ~8 hours self-paced theory, completed before the day.
          </p>
        </div>
        <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#fbbf24,transparent_60%)]" />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 backdrop-blur flex items-center justify-center">
                <Dumbbell className="w-[18px] h-[18px] text-amber-300" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-amber-300">On-site</p>
            </div>
            <p className="text-base font-bold leading-tight">
              1 full practical day
            </p>
            <p className="text-[13px] text-white/85 leading-relaxed mt-1">
              On-site, hands-on, on your own gym floor.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-white border border-emerald-200/60 p-5 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-[18px] h-[18px] text-emerald-700" strokeWidth={2} />
        </div>
        <p className="text-[13px] text-foreground/85 leading-relaxed">
          Certificate + ~15 hours of CPD. Accredited in Australia (Osteopathy Australia–endorsed, 14 CPD
          hours) — a standard comparable to or exceeding Canadian CPD requirements.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CURRICULUM · 8 MODULES
// ─────────────────────────────────────────────────────────────────────────────

function Curriculum() {
  const modules = [
    ['Pathophysiology of concussion', 'Neurometabolic cascade.'],
    ['Acute & sideline assessment', 'SCAT6, red-flag screening, removal-from-sport.'],
    ['Sub-acute clinical evaluation', 'SCOAT6 + clinical phenotypes.'],
    ['Vestibulo-ocular assessment', 'VOMS & oculomotor screening + targeted rehab.'],
    ['Cervicogenic & balance assessment', 'Cervical spine exam + BESS.'],
    ['Graded exertion rehabilitation', 'BCTT + sub-symptom-threshold aerobic prescription.'],
    ['Graduated return-to-sport, -learn & -work', 'Staged progression + physician clearance hand-off.'],
    ['Persistent post-concussion symptoms', 'PPCS management, scope of practice, documentation.'],
  ]
  return (
    <section id="curriculum" className="scroll-mt-8 mb-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">Curriculum · 8 modules</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-5 leading-tight">
        The full clinical pathway, module by module.
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modules.map(([title, body], i) => (
          <div key={title} className="glass-premium rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark text-white flex items-center justify-center shrink-0 font-bold text-sm shadow-sm shadow-accent/20">
              {i + 1}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-foreground leading-tight">{title}</p>
              <p className="text-[12px] text-muted-foreground leading-snug mt-0.5">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICAL DAY · ON YOUR GYM FLOOR
// ─────────────────────────────────────────────────────────────────────────────

function PracticalDay() {
  const stages = [
    { icon: Target, name: 'Calibrate', body: 'Team baseline & real case review.' },
    { icon: ClipboardList, name: 'Assess', body: 'SCAT6, SCOAT6, VOMS & BESS stations.' },
    { icon: Dumbbell, name: 'Rehab', body: 'BCTT & graded exertion, live on your equipment.' },
    { icon: Building2, name: 'Embed', body: 'Referral, rehab & clearance workflow.' },
  ]
  return (
    <section id="practical-day" className="scroll-mt-8 mb-10">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#fbbf24,transparent_55%)]" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-300 mb-2">
            Practical day · on your gym floor
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-5 leading-tight">
            One day, four stages, your own equipment.
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stages.map((stage) => {
              const Icon = stage.icon
              return (
                <div key={stage.name} className="rounded-xl bg-white/8 backdrop-blur border border-white/10 p-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center mb-3">
                    <Icon className="w-[18px] h-[18px] text-amber-300" strokeWidth={2} />
                  </div>
                  <p className="text-base font-bold leading-tight mb-1">{stage.name}</p>
                  <p className="text-[12.5px] text-white/80 leading-snug">{stage.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE PREVIEW · MODULE 1 TRIAL
// Same accent-gradient course card as ProspectLanding's "Start here" trial CTA,
// linking into the live learning suite so Totum behaves like a normal demo.
// ─────────────────────────────────────────────────────────────────────────────

function CoursePreview() {
  return (
    <section id="preview" className="scroll-mt-8 mb-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">Preview the course</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-5 leading-tight">
        Open Module 1 and try it yourself.
      </h3>

      <Link
        href={`/p/${SLUG}/learning/module-1`}
        className="block rounded-2xl mb-3 relative overflow-hidden bg-gradient-to-br from-accent via-accent to-accent-dark text-white shadow-lg group hover:shadow-xl transition-shadow"
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <BookOpen className="w-4 h-4" strokeWidth={2} />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-white/90">Module 1 · open trial</p>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold mb-1 leading-tight">
              Module 1 — preview the course
            </h4>
            <p className="text-sm text-white/85 leading-relaxed">
              First sections + an interactive quiz checkpoint, exactly as your team will see it. ~15 CPD hrs total across all 8 modules.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 text-sm font-bold bg-white text-accent px-5 py-3 rounded-xl shadow-md group-hover:scale-[1.02] transition-transform">
            Open Module 1
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </Link>

      <Link
        href={`/p/${SLUG}/learning`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-2.5 transition-all"
      >
        See all 8 modules
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CLINICAL TOOLS & DOCUMENTS · TOOLKIT
// Two cards linking into the live toolkit — clinical templates and the
// admin / funded-claim (WSIB / SABS) document pack. Replaces the old static
// front-desk prose; the real pages carry the content now.
// ─────────────────────────────────────────────────────────────────────────────

function Toolkit() {
  const cards = [
    {
      href: `/p/${SLUG}/toolkit/clinical`,
      icon: Stethoscope,
      eyebrow: 'Clinical templates',
      title: 'Assessment, rehab & discharge templates',
      body: 'Fillable concussion templates — SCAT6/SCOAT6 capture, graded-exertion tracking, return-to-sport staging and clearance-ready discharge letters.',
    },
    {
      href: `/p/${SLUG}/toolkit/admin`,
      icon: ClipboardList,
      eyebrow: 'Admin & funded-claim docs',
      title: 'Front-desk pack & funded-claim forms',
      body: 'Intake & triage workflow plus the funded-claim form pack across all three streams — extended health, auto-insurance (SABS) and WSIB.',
    },
  ]
  return (
    <section id="toolkit" className="scroll-mt-8 mb-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">Clinical tools &amp; documents</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-5 leading-tight">
        The toolkit your team and front desk use from day one.
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="block rounded-2xl relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-accent/5 border border-amber-200 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-amber-700" strokeWidth={2} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700">{card.eyebrow}</p>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-foreground mb-1 leading-tight">{card.title}</h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">{card.body}</p>
                <div className="inline-flex items-center gap-1.5 text-sm font-bold bg-accent text-white px-4 py-2.5 rounded-lg shadow-sm group-hover:translate-x-0.5 transition-transform">
                  <FileText className="w-4 h-4" strokeWidth={2} />
                  Open documents
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING · IN-HOUSE TEAM-TRAINING MODEL (CAD)
// ─────────────────────────────────────────────────────────────────────────────

function Pricing() {
  const tiers = [
    {
      name: 'Team training',
      badge: '12+ clinicians',
      price: 'CAD $900',
      unit: '/ clinician',
      body: 'When 12 or more of your team train together — the full program per clinician: 8 online modules, the on-site practical day, toolkit and certification.',
      recommended: false,
    },
    {
      name: 'Your clinical team',
      badge: 'Most clinics',
      price: '≈ CAD $16k',
      unit: '~18 clinicians',
      body: 'Your full clinical team — physiotherapists, R.Kins, chiropractors and RMTs — trained on one protocol at the team rate.',
      recommended: true,
    },
    {
      name: 'The Total Package',
      badge: 'Every site a hub',
      price: 'Tailored',
      unit: 'top tier',
      body: 'The flagship: every clinician across all 7 sites, the front-desk intake, triage & funded-claim track, the complete toolkit and certification — every Totum location a certified concussion hub on one standard.',
      recommended: false,
    },
  ]
  return (
    <section id="pricing" className="scroll-mt-8 mb-10">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">Pricing</p>
      <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2 leading-tight">
        Priced for the whole team, not the seat.
      </h3>
      <p className="text-sm sm:text-base text-foreground/85 leading-relaxed max-w-2xl mb-6">
        Includes the 8 online modules, the on-site practical day, the toolkit and certification. Final scope
        is tailored on a 20-minute call.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-2xl p-5 sm:p-6 relative overflow-hidden ${
              tier.recommended
                ? 'bg-gradient-to-br from-accent/8 via-accent/3 to-white border border-accent/40 ring-1 ring-accent/30 shadow-md'
                : 'glass-premium border border-accent/10'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider font-bold text-accent">{tier.name}</p>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                  tier.recommended ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {tier.badge}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-3">
              <span className={`text-3xl font-bold leading-none ${tier.recommended ? 'text-accent' : 'text-foreground'}`}>
                {tier.price}
              </span>
              <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">{tier.unit}</span>
            </div>
            <p className="text-[13px] text-foreground/85 leading-relaxed">{tier.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-accent/8 via-white to-white border border-accent/15 p-6 sm:p-8">
        <h4 className="text-lg sm:text-xl font-bold text-foreground tracking-tight mb-2 leading-tight">
          Let&apos;s scope it to Totum.
        </h4>
        <p className="text-sm text-foreground/85 leading-relaxed max-w-2xl mb-5">
          A 20-minute call to confirm the cohort size across your sites and lock the final number — no contract, no slides.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={CAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-accent text-white px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
          >
            <Calendar className="w-4 h-4" strokeWidth={2} />
            Book a 20-min call
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent('Concussion Hub Program — Totum Life Science')}`}
            className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-white text-accent border-2 border-accent/20 hover:border-accent/40 px-6 py-3.5 rounded-xl shadow-sm transition-all"
          >
            <Mail className="w-4 h-4" strokeWidth={2} />
            {EMAIL}
          </a>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER — delivered-by credibility
// ─────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <section className="mt-2">
      <div className="glass-premium rounded-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <Image
            src="/zac-lewis.jpg"
            alt="Zac Lewis"
            width={88}
            height={88}
            className="rounded-xl w-[64px] h-[64px] sm:w-[80px] sm:h-[80px] object-cover shrink-0 border border-accent/15"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">Delivered by</p>
            <p className="text-base sm:text-lg font-bold text-foreground leading-tight">Zac Lewis, Osteopath</p>
            <p className="text-xs text-muted-foreground mb-2">Course Director, Concussion Education Australia</p>
            <p className="text-[12.5px] text-foreground/85 leading-relaxed">
              Over a decade specialising in concussion — including work with national and professional
              ice-hockey leagues across New Zealand and Canada, and upskilling allied-health teams on
              diagnosis, structured management, and return-to-play clearance.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-accent font-semibold">
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Built on the Canadian Guideline on Concussion in Sport, 2nd ed. 2024</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
