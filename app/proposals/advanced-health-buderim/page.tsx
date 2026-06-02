import type { Metadata } from 'next'
import Link from 'next/link'
import { PrintButton } from './PrintButton'

// Soft access gate. Paired with the unguessable clinic-name slug.
// Anyone with the full URL + key sees the full personalised hub.
// Without the key, render an access wall (no pricing leakage).
const ACCESS_KEY = 'ah2026'

// Single source of truth for this prospect's personalisation.
// In the engine version (`/p/[token]/page.tsx`), this is loaded
// from the `prospect_clinics` + `prospect_clinicians` tables.
const CLINIC = {
  name: 'Advanced Health Pain & Injury Clinic',
  shortName: 'Advanced Health',
  city: 'Buderim',
  region: 'Sunshine Coast',
  state: 'QLD',
  contactName: 'Lauren Kidston',
  team: {
    osteopaths: 9,
    exercisePhys: 3,
    myotherapists: 2,
    remedialMassage: 2,
    practiceManager: 1,
    admin: 2,
  },
}

const TEAM_TOTAL =
  CLINIC.team.osteopaths +
  CLINIC.team.exercisePhys +
  CLINIC.team.myotherapists +
  CLINIC.team.remedialMassage +
  CLINIC.team.practiceManager +
  CLINIC.team.admin

// Pricing — matches SCOPE_COLD_OUTREACH_PORTAL.md (one-time clinic license model)
const PRICING = {
  tier1: {
    osteo: { count: 9, seat: 397, subtotal: 3573 },
    ep: { count: 3, seat: 347, subtotal: 1041 },
    myo: { count: 2, seat: 197, subtotal: 394 },
    rmt: { count: 2, seat: 197, subtotal: 394 },
    pm: { count: 1, seat: 197, subtotal: 197 },
    admin: { count: 2, seat: 97, subtotal: 194 },
    subtotal: 5793,
    volumeDiscountPct: 20,
    volumeDiscountAud: 1159,
    total: 4634,
  },
  tier2: {
    onsite: 4500,
    templates: 1500,
    outreach: 1000,
    support: 500,
    travel: 300,
    total: 7800,
  },
  combined: 12434,
  individualRetail: 22400, // 16 clinicians × A$1,400 CCM Complete retail
}

export const metadata: Metadata = {
  title: 'Concussion Hub Program — Advanced Health Buderim',
  description:
    'Working preview portal: concussion training hub prepared for Advanced Health Pain & Injury Clinic, Buderim QLD. Clinical mastery + local-hub positioning.',
  robots: 'noindex, nofollow',
}

export default async function AdvancedHealthHubPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>
}) {
  const { k } = await searchParams
  const unlocked = k === ACCESS_KEY

  if (!unlocked) {
    return <AccessWall />
  }

  return <HubDemo />
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS WALL — shown when ?k query param is missing or wrong
// ─────────────────────────────────────────────────────────────────────────────

function AccessWall() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-teal-700 mb-2">
          Concussion Education Australia
        </p>
        <h1 className="text-xl font-bold text-slate-900 mb-3">
          Private proposal portal
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          This portal was prepared for <strong>Advanced Health Pain &amp; Injury Clinic</strong>, Buderim. Access requires the link from Zac&rsquo;s introductory email.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Lost the link? Reply to the introductory email and Zac will resend within 1 business day.
        </p>
        <a
          href="mailto:zac@concussion-education-australia.com?subject=Resend%20proposal%20portal%20access"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors"
        >
          Email Zac for access
        </a>
        <p className="text-[10px] text-slate-400 mt-6">
          zac@concussion-education-australia.com
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HUB DEMO — the working portal personalised for Advanced Health
// ─────────────────────────────────────────────────────────────────────────────

function HubDemo() {
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <TopBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 print:py-0 print:px-8 print:max-w-none">
        <HubHeader />
        <OpportunityBanner />
        <SectionNav />

        <div id="free-utility" className="scroll-mt-20">
          <FreeUtilitySection />
        </div>

        <div id="module-trial" className="scroll-mt-20 mt-6">
          <ModuleOneTrialSection />
        </div>

        <div id="pathways" className="scroll-mt-20 mt-6">
          <DisciplinePathwaysSection />
        </div>

        <div id="locked" className="scroll-mt-20 mt-6">
          <LockedPremiumSection />
        </div>

        <div id="flow" className="scroll-mt-20 mt-6">
          <HubFlowSection />
        </div>

        <div id="local-hub" className="scroll-mt-20 mt-6">
          <LocalHubSection />
        </div>

        <div id="investment" className="scroll-mt-20 mt-6">
          <InvestmentSection />
        </div>

        <div id="book" className="scroll-mt-20 mt-6">
          <CTASection />
        </div>

        <HubFooter />
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR (print bar + portal chrome)
// ─────────────────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="print:hidden bg-white border-b border-slate-200 sticky top-0 z-30 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-700">
            Live proposal portal · {CLINIC.shortName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="hidden sm:block text-[10px] text-slate-500">
            Tip: <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[9px] font-mono">Cmd+P</kbd> for PDF
          </p>
          <PrintButton />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER — Prepared for Advanced Health
// ─────────────────────────────────────────────────────────────────────────────

function HubHeader() {
  return (
    <header className="rounded-2xl bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700 text-white p-6 sm:p-8 shadow-lg">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-teal-100 mb-2">
            Concussion Education Australia · Prepared for
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-1">
            {CLINIC.name}
          </h1>
          <p className="text-sm text-teal-50">
            {CLINIC.city}, {CLINIC.state} · Hi {CLINIC.contactName.split(' ')[0]} — this is your team&rsquo;s working preview portal
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] uppercase tracking-wider text-teal-200 mb-0.5">Prepared</p>
          <p className="text-xs font-semibold">June 2026</p>
          <p className="text-[9px] uppercase tracking-wider text-teal-200 mt-2 mb-0.5">Valid until</p>
          <p className="text-xs font-semibold">02 Jul 2026</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3">
        <TeamPill label="Osteopaths" count={CLINIC.team.osteopaths} />
        <TeamPill label="Exercise Phys" count={CLINIC.team.exercisePhys} />
        <TeamPill label="Myotherapists" count={CLINIC.team.myotherapists} />
        <TeamPill label="Remedial Massage" count={CLINIC.team.remedialMassage} />
        <TeamPill label="Practice Mgr" count={CLINIC.team.practiceManager} />
        <TeamPill label="Admin" count={CLINIC.team.admin} />
      </div>
      <p className="text-[11px] text-teal-100 mt-3">
        {TEAM_TOTAL} staff identified across clinical + admin — discipline pathways below are curated to this exact composition.
      </p>
    </header>
  )
}

function TeamPill({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2">
      <p className="text-[20px] font-bold leading-none">{count}</p>
      <p className="text-[9px] uppercase tracking-wide text-teal-100 mt-1">{label}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// OPPORTUNITY BANNER
// ─────────────────────────────────────────────────────────────────────────────

function OpportunityBanner() {
  return (
    <section className="mt-5 rounded-xl border-2 border-teal-200 bg-teal-50/60 p-5">
      <p className="text-[10px] uppercase tracking-wider text-teal-800 font-bold mb-2">
        The opportunity
      </p>
      <p className="text-sm text-slate-800 leading-relaxed">
        Concussion is one of the most undertaught conditions in Australian healthcare — and one of the highest-volume sports injuries on the {CLINIC.region}. Most clinics aren&rsquo;t trained to manage it confidently. Your team can be the one that is. The Concussion Hub Program gives {CLINIC.shortName} <strong>clinical mastery in concussion diagnosis and structured rehab</strong>, and the positioning to become the {CLINIC.region}&rsquo;s referral destination for sports teams, schools and local GPs.
      </p>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION NAV — pseudo-dashboard tabs
// ─────────────────────────────────────────────────────────────────────────────

function SectionNav() {
  const items = [
    { href: '#free-utility', label: 'Free utility' },
    { href: '#module-trial', label: 'Module 1 trial' },
    { href: '#pathways', label: 'Discipline pathways' },
    { href: '#locked', label: 'Premium content' },
    { href: '#local-hub', label: 'Local hub' },
    { href: '#investment', label: 'Investment' },
    { href: '#book', label: 'Book a call' },
  ]
  return (
    <nav className="print:hidden mt-5 -mx-2 px-2 overflow-x-auto">
      <ul className="flex gap-2 min-w-max">
        {items.map((it) => (
          <li key={it.href}>
            <a
              href={it.href}
              className="inline-block px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-teal-400 hover:text-teal-700 transition-colors"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FREE UTILITY — visible, usable, real links to live tools
// ─────────────────────────────────────────────────────────────────────────────

function FreeUtilitySection() {
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="text-lg font-bold text-slate-900">Free utility — open + use right now</h2>
        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
          Unlocked
        </span>
      </div>
      <p className="text-xs text-slate-600 mb-4">
        These are the real fillable clinical tools and reference library CEA hosts. Anyone on your team can open and use them today — no login required.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <UtilityCard
          href="/scat-forms/scat6"
          title="SCAT6 fillable form"
          detail="Adult sideline assessment. Web-based + downloadable PDF. Auto-scoring on key sections."
        />
        <UtilityCard
          href="/scat-forms/scoat6"
          title="SCOAT6 fillable form"
          detail="Office-based follow-up assessment for ongoing care decisions."
        />
        <UtilityCard
          href="/scat-forms/child-scat6"
          title="Child SCAT6"
          detail="Paediatric (5-12 yr) version with age-appropriate cognitive items."
        />
        <UtilityCard
          href="/references"
          title="Reference library"
          detail="140+ peer-reviewed citations — Amsterdam 2023, AIS, RACGP, Cochrane. Searchable."
        />
      </div>

      <p className="text-[11px] text-slate-500 italic mt-4 leading-relaxed">
        Already free on the public CEA portal. Reception staff can bookmark these for triage; clinicians can fill them in-session and print to the patient&rsquo;s file. The Hub Program adds the <strong>clinical reasoning</strong> behind administering them and the <strong>discharge documentation</strong> built around the scores.
      </p>
    </section>
  )
}

function UtilityCard({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      className="block rounded-lg border-2 border-emerald-200 bg-emerald-50/30 p-3 hover:border-emerald-400 hover:bg-emerald-50/60 transition-colors group"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <span className="text-emerald-600 group-hover:translate-x-0.5 transition-transform text-xs">↗</span>
      </div>
      <p className="text-[11px] text-slate-600 leading-snug">{detail}</p>
      <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-700 mt-2">Open in new tab</p>
    </Link>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 TRIAL — partial content visible, rest locked
// ─────────────────────────────────────────────────────────────────────────────

function ModuleOneTrialSection() {
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-teal-100 font-bold">Concussion Clinical Mastery</p>
            <h2 className="text-lg font-bold">Module 1 — Introduction + diagnostic foundations</h2>
            <p className="text-xs text-teal-50 mt-0.5">First section unlocked as a sample · Modules 2-8 locked</p>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-900 bg-amber-200 px-2 py-1 rounded-full whitespace-nowrap">
            Trial sample
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid sm:grid-cols-[1fr_280px] gap-6">
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
            <h3 className="text-sm font-bold text-slate-900 mb-2">1.1 — Why concussion is the most undertaught condition in your scope</h3>
            <p className="text-[13px]">
              Most allied health clinicians have had between zero and three hours of formal concussion teaching across their entire undergraduate degree. The same clinician will see 4-8 concussions a year in private practice and not recognise three of them. The presentation is heterogeneous, the cognitive screening tools have a learning curve, and the cervical contribution that primary-care clinicians are best positioned to address is almost entirely absent from current consensus documents.
            </p>
            <p className="text-[13px]">
              The result: patients with sub-clinical post-concussion symptoms are getting reassurance instead of structured rehab, sports clubs are being told &ldquo;rest until symptoms resolve&rdquo; instead of being given the Amsterdam 2023 six-step return-to-play protocol, and the clinics that <em>do</em> know what they&rsquo;re doing become the obvious local referral destination almost by default.
            </p>
            <p className="text-[13px]">
              That positioning is what this program is built around. The clinical content first, the local-hub mechanics second, the documentation third. By the end of Module 1 you&rsquo;ll have a working differential model — what is a concussion, what looks like one but isn&rsquo;t, and what the four diagnostic decision points are at the first consultation.
            </p>

            <h3 className="text-sm font-bold text-slate-900 mt-5 mb-2">1.2 — The four decision points at consultation 1</h3>
            <p className="text-[13px]">
              Continued in the full module — covers the red-flag screen, the symptom-cluster differential (vestibular vs cervical vs cognitive vs autonomic), the decision to refer/manage, and the documentation that protects both clinician and patient. <strong>This section unlocks with Tier 1 portal access.</strong>
            </p>
          </div>

          <aside className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3">In this module</p>
            <ul className="space-y-2 text-[11px]">
              <ModuleSubItem label="1.1 Why concussion is undertaught" unlocked />
              <ModuleSubItem label="1.2 The four decision points" />
              <ModuleSubItem label="1.3 Red flag screen + ED criteria" />
              <ModuleSubItem label="1.4 Symptom cluster differential" />
              <ModuleSubItem label="1.5 Documentation standards" />
              <ModuleSubItem label="1.6 Module knowledge check" />
            </ul>
            <a
              href="#investment"
              className="block mt-4 text-center text-[11px] font-bold text-teal-700 hover:text-teal-800 underline"
            >
              Unlock the full module →
            </a>
          </aside>
        </div>
      </div>
    </section>
  )
}

function ModuleSubItem({ label, unlocked = false }: { label: string; unlocked?: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={unlocked ? 'text-emerald-600' : 'text-slate-400'}>
        {unlocked ? '✓' : '🔒'}
      </span>
      <span className={unlocked ? 'text-slate-700 font-semibold' : 'text-slate-500'}>{label}</span>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCIPLINE PATHWAYS — 4 cards aligned to Advanced Health's team
// ─────────────────────────────────────────────────────────────────────────────

function DisciplinePathwaysSection() {
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Your team&rsquo;s discipline pathways</h2>
      <p className="text-xs text-slate-600 mb-4">
        Curated content tracks built around each role&rsquo;s part of the concussion patient journey. Click any pathway to see what your team gets — content is locked until enrollment.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <PathwayCard
          discipline="Osteopath"
          count={CLINIC.team.osteopaths}
          colourClass="from-teal-600 to-teal-700"
          items={[
            'SCAT6 + SCOAT6 administration',
            'VOMS deep-dive',
            'BESS scoring + interpretation',
            'Cervical contribution (your wheelhouse)',
            'PPCS workup',
            'Paediatric concussion',
            '14 CPD hours per clinician',
          ]}
        />
        <PathwayCard
          discipline="Exercise Physiologist"
          count={CLINIC.team.exercisePhys}
          colourClass="from-emerald-600 to-emerald-700"
          items={[
            'Buffalo Concussion Treadmill Test',
            'Sub-threshold aerobic Rx',
            'VOR / gaze stability progression',
            'Amsterdam 2023 six-step RTP',
            'Return-to-school / return-to-work',
            'Symptom-tracking tools',
            'Escalation criteria',
          ]}
        />
        <PathwayCard
          discipline="Myo / RMT"
          count={CLINIC.team.myotherapists + CLINIC.team.remedialMassage}
          colourClass="from-amber-600 to-amber-700"
          items={[
            'Cervical soft tissue post-concussion',
            'Symptom tracking documentation',
            'Escalation criteria',
            'Role-appropriate scope content',
            'Lighter CPD load (4 hrs)',
          ]}
        />
        <PathwayCard
          discipline="Admin + reception"
          count={CLINIC.team.practiceManager + CLINIC.team.admin}
          colourClass="from-slate-600 to-slate-700"
          items={[
            '1-hour Concussion Workflow micro-course',
            'Phone-triage scripts',
            'Red-flag identification',
            'Intake form additions',
            'AI-safe documentation basics',
            'Template library walkthrough',
            'Booking flow for concussion priority',
          ]}
          b2bOnly
        />
      </div>

      <p className="text-[11px] text-slate-500 italic mt-4">
        B2B-only content (admin micro-course + outreach package) is exclusive to the Hub Program — never available as an individual purchase.
      </p>
    </section>
  )
}

function PathwayCard({
  discipline,
  count,
  items,
  colourClass,
  b2bOnly,
}: {
  discipline: string
  count: number
  items: string[]
  colourClass: string
  b2bOnly?: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white flex flex-col">
      <div className={`bg-gradient-to-br ${colourClass} text-white px-3 py-2.5`}>
        <p className="text-[9px] uppercase tracking-wider opacity-80">{count} of your team</p>
        <p className="text-sm font-bold">{discipline}</p>
      </div>
      <ul className="flex-1 p-3 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-slate-700 leading-snug flex gap-1.5">
            <span className="text-slate-400 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {b2bOnly && (
        <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200">
          <p className="text-[9px] uppercase tracking-wider font-bold text-amber-800">B2B exclusive</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCKED PREMIUM — greyed cards driving conversion
// ─────────────────────────────────────────────────────────────────────────────

function LockedPremiumSection() {
  return (
    <section className="rounded-xl bg-slate-100 border border-slate-200 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900">Premium content — locked</h2>
        <a
          href="#investment"
          className="text-xs font-bold text-teal-700 hover:text-teal-800 underline whitespace-nowrap"
        >
          Unlock with Hub Program →
        </a>
      </div>
      <p className="text-xs text-slate-600 mb-4">
        Activated for every clinician on enrollment. Click any tile to jump to investment.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <LockedCard title="CCM Modules 2-8" detail="Diagnosis, rehab, RTP, paediatric, PPCS, documentation, knowledge check + certificate." tier="Tier 1" />
        <LockedCard title="AI in Clinical Practice" detail="3 CPD hours · AHPRA AI code, APP, Heidi/Lyrebird tier framework." tier="Tier 1" />
        <LockedCard title="Admin micro-course (mods 2-8)" detail="Phone triage, red flags, intake, AI-safe workflow, templates, booking, knowledge check." tier="Tier 1" />
        <LockedCard title="Per-clinician CPD tracking" detail="Live dashboard. Completion certs auto-generated. Renewal reminders." tier="Tier 1" />
        <LockedCard title="Discharge templates (×6)" detail="GP letter, school RTP, parent plan, sports club cert, WorkCover, NDIS — clinic-branded." tier="Tier 2" />
        <LockedCard title="Outreach templates (×6)" detail="Schools, sports clubs, GPs, SLS, triathlon, generic — with email sequences + phone scripts." tier="Tier 2" />
        <LockedCard title="CEA-trained-clinic badge" detail="Website badge + waiting-room poster. Verifiable per-clinician certification." tier="Tier 2" />
        <LockedCard title="30-day implementation support" detail="Direct line to Zac after on-site delivery. Operational rollout coaching." tier="Tier 2" />
      </div>
    </section>
  )
}

function LockedCard({ title, detail, tier }: { title: string; detail: string; tier: 'Tier 1' | 'Tier 2' }) {
  const tierColor = tier === 'Tier 1' ? 'text-teal-700 bg-teal-50 border-teal-200' : 'text-amber-700 bg-amber-50 border-amber-200'
  return (
    <a href="#investment" className="block rounded-lg border border-slate-300 bg-white/60 p-3 relative opacity-80 hover:opacity-100 hover:border-teal-400 transition-all group">
      <div className="absolute top-2 right-2 text-slate-400 group-hover:text-teal-600 text-base">🔒</div>
      <p className="text-xs font-bold text-slate-700 pr-5">{title}</p>
      <p className="text-[10.5px] text-slate-500 leading-snug mt-1">{detail}</p>
      <span className={`inline-block mt-2 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${tierColor}`}>
        {tier}
      </span>
    </a>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4-STAGE HUB FLOW (retained from original pitch, lightly polished)
// ─────────────────────────────────────────────────────────────────────────────

function HubFlowSection() {
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">How it&rsquo;s delivered — role-by-role on-site at Buderim</h2>
      <p className="text-xs text-slate-600 mb-4">The Tier 2 on-site training day, sequenced across the patient flow.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <FlowStage
          num="01"
          roleLabel="Intake"
          team="Reception + admin"
          items={['Phone triage script', 'Red-flag ID', 'Intake form additions', 'Booking priority', '1-hr admin micro-course']}
        />
        <FlowStage
          num="02"
          roleLabel="Diagnosis"
          team={`The ${CLINIC.team.osteopaths} osteopaths — hands-on`}
          items={['SCAT6 + SCOAT6', 'VOMS deep-dive', 'BESS scoring', 'Cervical contribution', 'Acute RTA', 'Paediatric', '14 CPD hours']}
          highlight
        />
        <FlowStage
          num="03"
          roleLabel="Rehab"
          team={`The ${CLINIC.team.exercisePhys}-person EP team`}
          items={['Buffalo Treadmill Test', 'Sub-threshold aerobic Rx', 'VOR / gaze stability', 'Amsterdam 2023 RTP', 'RTW / RTS', 'Symptom tracking', 'Escalation criteria']}
          highlight
        />
        <FlowStage
          num="04"
          roleLabel="Discharge + referral"
          team="Whole team"
          items={['GP handover letter', 'School / coach RTP form', 'Parent plan', 'Sports club RTP cert', 'WorkCover + NDIS docs', 'Six clinic-licensed templates']}
        />
      </div>
    </section>
  )
}

function FlowStage({
  num,
  roleLabel,
  team,
  items,
  highlight,
}: {
  num: string
  roleLabel: string
  team: string
  items: string[]
  highlight?: boolean
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? 'border-teal-400 bg-teal-50/60' : 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{num}</p>
      <p className={`text-sm font-bold leading-tight ${highlight ? 'text-teal-800' : 'text-slate-900'}`}>{roleLabel}</p>
      <p className="text-[10px] text-slate-500 mb-2 leading-tight">{team}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-slate-700 leading-snug flex gap-1.5">
            <span className={highlight ? 'text-teal-600' : 'text-slate-400'}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL HUB — Sunshine Coast targets
// ─────────────────────────────────────────────────────────────────────────────

function LocalHubSection() {
  return (
    <section className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Become the {CLINIC.region}&rsquo;s concussion clinic</h2>
      <p className="text-sm text-slate-700 leading-relaxed mb-4">
        One trained clinic per region becomes the natural concussion referral destination. The Hub Program builds the relationships explicitly — not just the training, but the outreach kit that turns it into patient volume.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <LocalCard
          title="Sports teams + clubs"
          items={[
            'Sunshine Coast Falcons (Q-Cup rugby league)',
            'Junior rugby league + AFL + soccer programs',
            'Surf life saving (Maroochydore → Caloundra)',
            'Mooloolaba triathlon + cycling clubs',
            'Pre-season baseline testing as a paid service',
          ]}
        />
        <LocalCard
          title="Local schools + GPs"
          items={[
            'Matthew Flinders Anglican College',
            'Sunshine Coast Grammar',
            'Immanuel Lutheran, Pacific Lutheran',
            'Local GP practices needing a referral path',
            'University of the Sunshine Coast sports program',
          ]}
        />
      </div>

      <p className="text-xs text-slate-700 leading-snug mt-4 italic">
        Editable email templates, capability one-pagers, phone scripts and meeting agendas — your team starts building these relationships <strong>the week after training</strong>. No DIY work required.
      </p>
    </section>
  )
}

function LocalCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-white border border-amber-200 p-4">
      <p className="text-sm font-bold text-slate-900 mb-2">{title}</p>
      <ul className="space-y-1 text-xs text-slate-700">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-600">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVESTMENT — Tier 1 + Tier 2 + Combined, with per-clinician math
// ─────────────────────────────────────────────────────────────────────────────

function InvestmentSection() {
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Investment — built for {CLINIC.shortName}&rsquo;s exact team</h2>
      <p className="text-xs text-slate-600 mb-4">
        One-time clinic license. Lifetime access per seat. If a clinician leaves, the seat transfers to their replacement at no charge.
      </p>

      {/* Tier 1 seat breakdown */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-3">
          Tier 1 — Online clinic license (lifetime access per seat)
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11.5px] border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-1.5 font-semibold text-slate-700">Role</th>
                <th className="text-right py-1.5 px-2 font-semibold text-slate-700">Count</th>
                <th className="text-right py-1.5 px-2 font-semibold text-slate-700">Per seat</th>
                <th className="text-right py-1.5 px-2 font-semibold text-slate-700">Subtotal</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <SeatRow role="Osteopaths" count={PRICING.tier1.osteo.count} seat={PRICING.tier1.osteo.seat} subtotal={PRICING.tier1.osteo.subtotal} />
              <SeatRow role="Exercise Physiologists" count={PRICING.tier1.ep.count} seat={PRICING.tier1.ep.seat} subtotal={PRICING.tier1.ep.subtotal} />
              <SeatRow role="Myotherapists" count={PRICING.tier1.myo.count} seat={PRICING.tier1.myo.seat} subtotal={PRICING.tier1.myo.subtotal} />
              <SeatRow role="Remedial Massage" count={PRICING.tier1.rmt.count} seat={PRICING.tier1.rmt.seat} subtotal={PRICING.tier1.rmt.subtotal} />
              <SeatRow role="Practice Manager" count={PRICING.tier1.pm.count} seat={PRICING.tier1.pm.seat} subtotal={PRICING.tier1.pm.subtotal} />
              <SeatRow role="Admin" count={PRICING.tier1.admin.count} seat={PRICING.tier1.admin.seat} subtotal={PRICING.tier1.admin.subtotal} />
              <tr className="border-t-2 border-slate-300 font-semibold">
                <td className="py-1.5">Subtotal ({TEAM_TOTAL} seats)</td>
                <td></td><td></td>
                <td className="text-right py-1.5 px-2">A${PRICING.tier1.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-emerald-700">Volume discount (16-30 band)</td>
                <td></td><td></td>
                <td className="text-right py-1.5 px-2 text-emerald-700">−{PRICING.tier1.volumeDiscountPct}% (A${PRICING.tier1.volumeDiscountAud.toLocaleString()})</td>
              </tr>
              <tr className="border-t border-slate-300 bg-teal-50 font-bold">
                <td className="py-2 text-teal-800">Tier 1 one-time total</td>
                <td></td><td></td>
                <td className="text-right py-2 px-2 text-teal-800 text-base">A${PRICING.tier1.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10.5px] text-slate-500 italic mt-2 leading-snug">
          vs A${(497 * 16).toLocaleString()} of individual CCM Online at retail (A$497 × 16 clinicians) = 42% off + admin micro-course bundled + ongoing content updates.
        </p>
      </div>

      {/* Tier 2 + Combined */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-300 bg-white p-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-3">
            Tier 2 — On-site Hub upgrade (add-on)
          </p>
          <ul className="space-y-1.5 text-[11.5px] text-slate-700">
            <PriceLine label="On-site training day at Buderim" amount={PRICING.tier2.onsite} />
            <PriceLine label="6 discharge templates (clinic-licensed, branded)" amount={PRICING.tier2.templates} />
            <PriceLine label="Outreach package (templates + sequences + scripts)" amount={PRICING.tier2.outreach} />
            <PriceLine label="30-day implementation support" amount={PRICING.tier2.support} />
            <PriceLine label="Travel (Byron → Buderim, 2.5hr drive)" amount={PRICING.tier2.travel} />
          </ul>
          <div className="border-t-2 border-slate-300 mt-3 pt-2 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">Tier 2 total</p>
            <p className="text-base font-bold text-slate-900">A${PRICING.tier2.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="rounded-lg border-2 border-teal-700 bg-gradient-to-br from-teal-50 to-emerald-50 p-4 shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[10px] uppercase tracking-wider text-teal-800 font-bold">
              Combined Hub Program
            </p>
            <span className="text-[9px] uppercase tracking-wider font-bold text-white bg-teal-700 px-2 py-0.5 rounded-full">Recommended</span>
          </div>
          <ul className="space-y-1.5 text-[11.5px] text-slate-700">
            <PriceLine label="Tier 1 — Online clinic license" amount={PRICING.tier1.total} />
            <PriceLine label="Tier 2 — On-site + templates + outreach + support" amount={PRICING.tier2.total} />
          </ul>
          <div className="border-t-2 border-teal-300 mt-3 pt-2 flex items-center justify-between">
            <p className="text-sm font-bold text-teal-800">Combined one-time</p>
            <p className="text-xl font-bold text-teal-800">A${PRICING.combined.toLocaleString()}</p>
          </div>
          <p className="text-[10.5px] text-slate-700 mt-2 leading-snug">
            vs <strong>A${PRICING.individualRetail.toLocaleString()}</strong> at individual CCM Complete retail (A$1,400 × 16 clinicians, no clinic extras)
          </p>
          <p className="text-[10.5px] text-teal-700 font-semibold mt-1">
            = 44% off retail with the full local-hub package bundled. One purchase. Lifetime access. No renewals.
          </p>
        </div>
      </div>

      <p className="text-[10px] text-slate-500 italic mt-3 leading-snug">
        GST exclusive. Pricing rendered against {CLINIC.shortName}&rsquo;s identified team composition; any adjustment recalculated on the scoping call.
      </p>
    </section>
  )
}

function SeatRow({ role, count, seat, subtotal }: { role: string; count: number; seat: number; subtotal: number }) {
  return (
    <tr className="border-b border-slate-200">
      <td className="py-1.5">{role}</td>
      <td className="text-right py-1.5 px-2">{count}</td>
      <td className="text-right py-1.5 px-2">A${seat}</td>
      <td className="text-right py-1.5 px-2 font-semibold">A${subtotal.toLocaleString()}</td>
    </tr>
  )
}

function PriceLine({ label, amount }: { label: string; amount: number }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="leading-snug">{label}</span>
      <span className="font-semibold whitespace-nowrap">A${amount.toLocaleString()}</span>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA — book a call
// ─────────────────────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-teal-800 to-emerald-700 text-white p-6 sm:p-8 shadow-lg">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-teal-100 font-bold mb-1">
            Next step
          </p>
          <h2 className="text-xl font-bold mb-1">Book a 20-minute scoping call</h2>
          <p className="text-sm text-teal-50 leading-relaxed">
            Pick a window that suits — Tuesday or Wednesday afternoon QLD time works well. We&rsquo;ll walk through the pathways for your team, answer questions, and confirm a delivery date.
          </p>
        </div>
        <a
          href="https://cal.com/zac-lewis-so8zjs/30min"
          target="_blank"
          rel="noopener"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-lg bg-white text-teal-800 text-sm font-bold hover:bg-teal-50 transition-colors whitespace-nowrap shadow-md no-underline"
        >
          Book call → cal.com
        </a>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function HubFooter() {
  return (
    <footer className="mt-8 pt-5 border-t border-slate-200">
      <div className="flex items-start justify-between gap-4 flex-wrap text-xs text-slate-600">
        <div>
          <p className="font-bold text-slate-800">Zac Lewis · AHPRA-registered Osteopath</p>
          <p>Founder, Concussion Education Australia</p>
        </div>
        <div className="text-right">
          <p>zac@concussion-education-australia.com</p>
          <p className="text-teal-700">portal.concussion-education-australia.com</p>
        </div>
      </div>
      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold text-center mt-4">
        AHPRA-aligned · Osteopathy Australia endorsed · 140+ peer-reviewed references · Amsterdam 2023 + AIS 2024
      </p>
    </footer>
  )
}
