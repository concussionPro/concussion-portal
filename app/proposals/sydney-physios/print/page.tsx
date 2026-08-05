import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'On-site Proposal — Sydney Physios',
  robots: 'noindex, nofollow',
}

// ─────────────────────────────────────────────────────────────────────────────
// Brand tokens
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT = '#0f766e' // teal
const ACCENT_SOFT = '#5b9aa6'
const INK = '#1e293b' // slate-800
const INK_SOFT = '#475569' // slate-600
const LINE = '#e2e8f0' // slate-200
const PAPER = '#ffffff'
const DARK = '#0f2a2e' // deep teal-slate for dark boxes

// ─────────────────────────────────────────────────────────────────────────────
// Small presentational helpers (plain, print-safe)
// ─────────────────────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div
      className="flex items-center justify-between text-[10px] tracking-wide"
      style={{ color: INK_SOFT, borderBottom: `2px solid ${ACCENT}`, paddingBottom: 10 }}
    >
      <span style={{ fontWeight: 700, color: INK }}>
        Concussion Education Australia{' '}
        <span style={{ color: ACCENT, fontWeight: 600 }}>· Concussion Clinical Mastery</span>
      </span>
      <span className="text-right">
        Endorsed by Osteopathy Australia · AHPRA-aligned · 16 CPD hours
      </span>
    </div>
  )
}

function Footer() {
  return (
    <div
      className="text-[9px] tracking-wide text-center"
      style={{ color: INK_SOFT, borderTop: `1px solid ${LINE}`, paddingTop: 8 }}
    >
      Concussion Education Australia · Concussion Clinical Mastery —{' '}
      <span style={{ color: ACCENT, fontWeight: 600 }}>portal.concussion-education-australia.com</span>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-bold tracking-[0.18em]"
      style={{ color: ACCENT }}
    >
      {children}
    </div>
  )
}

function SectionHeading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="mb-3">
      {kicker && (
        <div className="text-[10px] font-bold tracking-[0.16em] mb-1" style={{ color: ACCENT }}>
          {kicker}
        </div>
      )}
      <h2 className="text-[17px] font-bold leading-tight" style={{ color: INK }}>
        {title}
      </h2>
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block text-[10px] font-medium rounded-full px-2.5 py-1"
      style={{ background: '#ecfdf5', color: ACCENT, border: `1px solid #cdeee6` }}
    >
      {children}
    </span>
  )
}

// Reusable A4 page shell. Each page is a flex column with header/footer.
function Page({
  children,
  breakBefore,
}: {
  children: React.ReactNode
  breakBefore?: boolean
}) {
  return (
    <div
      className="mx-auto bg-white flex flex-col print:shadow-none"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 16mm 12mm',
        boxShadow: '0 0 0 1px #e5e7eb, 0 10px 30px rgba(0,0,0,0.06)',
        breakBefore: breakBefore ? 'page' : undefined,
        background: PAPER,
      }}
    >
      <TopBar />
      <div className="flex-1 flex flex-col" style={{ paddingTop: 18 }}>
        {children}
      </div>
      <Footer />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1
// ─────────────────────────────────────────────────────────────────────────────

function PageOne() {
  const stats = [
    { big: '1 day', label: 'Full practical day delivered in-clinic in Sydney' },
    { big: '8 hrs', label: 'Online pre-work modules, completed before the day' },
    { big: '16 CPD', label: 'CPD hours per clinician, certificate issued' },
  ]
  const chips = [
    'Rugby & league clubs',
    'GPS & CAS schools',
    'Surf Life Saving (Sydney beaches)',
    'Sydney FC & A-League',
    'City2Surf & endurance events',
    'Junior & community codes',
  ]
  return (
    <Page>
      {/* Eyebrow + hero */}
      <Eyebrow>ON-SITE CLINICAL TRAINING · PROPOSAL</Eyebrow>
      <h1
        className="font-extrabold leading-[1.05] mt-3"
        style={{ color: INK, fontSize: 34, letterSpacing: '-0.02em' }}
      >
        Become the first call for concussion across{' '}
        <span style={{ color: ACCENT }}>Sydney</span>.
      </h1>
      <p className="mt-4 text-[12.5px] leading-relaxed" style={{ color: INK_SOFT, maxWidth: '95%' }}>
        A single on-site training day takes your physiotherapists to one evidence-based standard of
        concussion care — assessment, management and safe return-to-sport on the same SCAT6/SCOAT6
        tools the codes and schools rely on — while your front desk gets the forms and a short primer
        to match. Few physio groups in Sydney are positioned for this.
      </p>

      {/* PREPARED FOR box */}
      <div
        className="rounded-xl mt-6 px-6 py-5 flex items-start justify-between"
        style={{ background: DARK, color: '#e2e8f0' }}
      >
        <div>
          <div className="text-[9px] font-bold tracking-[0.18em]" style={{ color: ACCENT_SOFT }}>
            PREPARED FOR
          </div>
          <div className="text-[16px] font-bold mt-1" style={{ color: '#ffffff' }}>
            Sydney Physios and Allied Health Service
          </div>
          <div className="text-[11px] mt-1" style={{ color: '#9fb6bb' }}>
            Sydney NSW · Physiotherapy (14) · Front-of-House
          </div>
        </div>
        <div className="text-right text-[10.5px] leading-snug" style={{ color: '#9fb6bb' }}>
          <div className="font-bold" style={{ color: ACCENT_SOFT }}>JUNE 2026</div>
          <div className="mt-1" style={{ color: '#cbd5e1' }}>
            Dr Zac Lewis,
            <br />
            Osteopath & Course Director
          </div>
        </div>
      </div>

      {/* Local opportunity */}
      <div className="mt-7">
        <SectionHeading kicker="THE LOCAL OPPORTUNITY" title="Become Sydney's concussion-ready physio group." />
        <p className="text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>
          Every Sydney code, school and club now needs a clinician-led return-to-play decision for
          each concussion — and few physio practices are equipped to make one. Train your team and
          those referrals have an obvious home.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {chips.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
        </div>
      </div>

      {/* Stat blocks */}
      <div className="grid grid-cols-3 gap-4 mt-auto pt-8">
        {stats.map((s) => (
          <div
            key={s.big}
            className="rounded-xl px-4 py-4"
            style={{ border: `1px solid ${LINE}`, background: '#f8fafc' }}
          >
            <div className="text-[24px] font-extrabold leading-none" style={{ color: ACCENT }}>
              {s.big}
            </div>
            <div className="text-[10.5px] mt-2 leading-snug" style={{ color: INK_SOFT }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2
// ─────────────────────────────────────────────────────────────────────────────

function NumberBadge({ n }: { n: string }) {
  return (
    <span
      className="inline-flex items-center justify-center text-[11px] font-bold rounded-md mr-2 shrink-0"
      style={{ width: 22, height: 22, background: ACCENT, color: '#ffffff' }}
    >
      {n}
    </span>
  )
}

function PageTwo() {
  const clinicalItems = [
    { t: '8 hours of online modules', d: 'self-paced theory before the day' },
    { t: 'Full practical day, in your clinic', d: 'live skills at your Sydney clinic on real presentations' },
    { t: 'Full assessment battery', d: 'SCAT6 & SCOAT6 plus VOMS, BESS and oculomotor screening' },
    { t: 'Targeted neuro rehab', d: 'progressive oculomotor, vestibular (VOMS) and balance (BESS), acute through PCS' },
    { t: 'Return-to-sport, work & learn', d: 'graded progression frameworks and discharge protocols' },
    { t: '16 CPD hours + certification', d: 'certificate of completion, endorsed by Osteopathy Australia' },
  ]
  const roles = [
    {
      h: 'SENIOR / SPORTS PHYSIOS',
      d: 'Own the return-to-play call: lead SCAT6/SCOAT6, VOMS, cervical/vestibular/ocular screening and own the clearance decision.',
    },
    {
      h: 'TREATING PHYSIOS',
      d: 'Deliver the rehab: progressive oculomotor, vestibular and balance rehab plus graded return-to-sport.',
    },
    {
      h: 'MSK PHYSIOS',
      d: 'Cervicogenic & load: address concurrent cervicogenic and headache symptom load within the plan.',
    },
    {
      h: 'ADMIN / FRONT DESK',
      d: 'Forms + triage: equipped with the concussion forms and a short primer to triage calls and book cases.',
    },
  ]
  const steps = [
    { n: '1', t: 'Calibrate', d: 'team baseline & case review so the day runs on your own presentations' },
    { n: '2', t: 'Assess', d: 'SCAT6/SCOAT6, VOMS, BESS and oculomotor at hands-on stations' },
    { n: '3', t: 'Manage', d: 'acute, persistent (PCS) and targeted neuro-rehab pathways' },
    { n: '4', t: 'Embed', d: "your clinic's referral & discharge workflow, locked in." },
  ]
  return (
    <Page breakBefore>
      {/* 01 Clinical track */}
      <SectionHeading kicker="01" title="The clinical track — every physio" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {clinicalItems.map((it) => (
          <div key={it.t} className="flex">
            <span
              className="mt-1.5 mr-2 shrink-0 rounded-full"
              style={{ width: 6, height: 6, background: ACCENT }}
            />
            <div className="text-[11px] leading-snug" style={{ color: INK_SOFT }}>
              <span className="font-bold" style={{ color: INK }}>{it.t}</span> — {it.d}
            </div>
          </div>
        ))}
      </div>

      {/* 02 Front of house (highlighted box) */}
      <div
        className="rounded-xl px-5 py-4 mt-6"
        style={{ background: '#ecfdf5', border: `1px solid #cdeee6` }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-bold" style={{ color: INK }}>
            <span style={{ color: ACCENT }}>02</span> Top to bottom — your front-of-house too
          </h3>
          <span
            className="text-[8.5px] font-bold tracking-[0.12em] rounded-full px-2 py-1"
            style={{ background: ACCENT, color: '#ffffff' }}
          >
            INCLUDED · NO EXTRA COST
          </span>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="text-[11px] leading-snug" style={{ color: INK_SOFT }}>
            <span className="font-bold" style={{ color: INK }}>&lsquo;AI in Concussion&rsquo; short course</span> — brief
            non-clinical primer for your admin team, enough to triage and reassure
          </div>
          <div className="text-[11px] leading-snug" style={{ color: INK_SOFT }}>
            <span className="font-bold" style={{ color: INK }}>Forms & outreach access</span> — ready-to-use
            concussion intake & discharge forms + a school/club/code outreach kit
          </div>
        </div>
      </div>

      {/* 03 Roles */}
      <div className="mt-6">
        <SectionHeading kicker="03" title="How each role uses it" />
        <div className="grid grid-cols-2 gap-4">
          {roles.map((r) => (
            <div
              key={r.h}
              className="rounded-xl px-4 py-3"
              style={{ border: `1px solid ${LINE}`, background: '#f8fafc' }}
            >
              <div className="text-[10px] font-bold tracking-[0.1em] mb-1" style={{ color: ACCENT }}>
                {r.h}
              </div>
              <div className="text-[10.5px] leading-snug" style={{ color: INK_SOFT }}>
                {r.d}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 04 The day */}
      <div className="mt-6 mb-auto">
        <SectionHeading kicker="04" title="The day at your Sydney clinic" />
        <div className="grid grid-cols-4 gap-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-xl px-3 py-3" style={{ border: `1px solid ${LINE}` }}>
              <div className="flex items-center mb-2">
                <NumberBadge n={s.n} />
                <span className="text-[12px] font-bold" style={{ color: INK }}>{s.t}</span>
              </div>
              <div className="text-[10px] leading-snug" style={{ color: INK_SOFT }}>
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3
// ─────────────────────────────────────────────────────────────────────────────

function PricingCard({
  label,
  badge,
  highlighted,
  count,
  perHead,
  total,
}: {
  label: string
  badge?: string
  highlighted?: boolean
  count: string
  perHead: string
  total: string
}) {
  return (
    <div
      className="rounded-xl px-4 py-4 relative flex flex-col"
      style={{
        border: highlighted ? `2px solid ${ACCENT}` : `1px solid ${LINE}`,
        background: highlighted ? '#ecfdf5' : '#ffffff',
      }}
    >
      {badge && (
        <span
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-bold tracking-[0.12em] rounded-full px-2.5 py-1"
          style={{ background: ACCENT, color: '#ffffff' }}
        >
          {badge}
        </span>
      )}
      <div className="text-[9.5px] font-bold tracking-[0.12em] mt-1" style={{ color: ACCENT }}>
        {label}
      </div>
      <div className="text-[22px] font-extrabold mt-2 leading-none" style={{ color: INK }}>
        {count}
      </div>
      <div className="text-[11px] mt-2" style={{ color: INK_SOFT }}>
        {perHead}
      </div>
      <div
        className="text-[12px] font-bold mt-2 pt-2"
        style={{ color: ACCENT, borderTop: `1px solid ${highlighted ? '#cdeee6' : LINE}` }}
      >
        {total}
      </div>
    </div>
  )
}

function InfoBlock({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ border: `1px solid ${LINE}`, background: '#f8fafc' }}>
      <div className="text-[9.5px] font-bold tracking-[0.14em]" style={{ color: ACCENT }}>{k}</div>
      <div className="text-[11px] mt-1 leading-snug" style={{ color: INK }}>{v}</div>
    </div>
  )
}

function PageThree() {
  return (
    <Page breakBefore>
      {/* 05 Investment */}
      <SectionHeading kicker="05" title="Investment — you choose the cohort" />
      <p className="text-[11.5px] leading-relaxed" style={{ color: INK_SOFT }}>
        The public course is $1,400 per clinician. Run it on-site and your whole team trains together
        on your own cases — and the per-head rate drops the more of you train. Minimum 10; 12–14 is
        the sweet spot for a team your size.
      </p>

      <div className="grid grid-cols-3 gap-4 mt-5">
        <PricingCard
          label="ESSENTIAL · MINIMUM"
          count="10 clinicians"
          perHead="$950 / clinician"
          total="$9,500 + GST total"
        />
        <PricingCard
          label="RECOMMENDED"
          badge="RECOMMENDED"
          highlighted
          count="12 clinicians"
          perHead="$900 / clinician"
          total="$10,800 + GST total"
        />
        <PricingCard
          label="FULL TEAM · BEST VALUE"
          count="14 clinicians"
          perHead="$870 / clinician"
          total="$12,180 + GST total"
        />
      </div>

      <p className="text-[10.5px] mt-3 leading-snug" style={{ color: INK_SOFT }}>
        Every tier includes the 8-hour online modules, the full practical day on-site, all clinical
        materials and toolkit, and 16 CPD hours per clinician.
      </p>

      <div
        className="rounded-xl px-4 py-3 mt-3 flex items-center justify-between"
        style={{ background: '#ecfdf5', border: `1px solid #cdeee6` }}
      >
        <div className="text-[10.5px] leading-snug pr-4" style={{ color: INK_SOFT }}>
          <span className="font-bold" style={{ color: INK }}>Front-of-house access</span> — included with
          every cohort: Concussion forms toolkit + the short &lsquo;AI in Concussion&rsquo; course for your
          admin team.
        </div>
        <span className="text-[11px] font-bold shrink-0" style={{ color: ACCENT }}>Included</span>
      </div>

      {/* Delivered by */}
      <div className="rounded-xl px-6 py-5 mt-6" style={{ background: DARK }}>
        <div className="text-[9px] font-bold tracking-[0.18em]" style={{ color: ACCENT_SOFT }}>
          DELIVERED BY
        </div>
        <div className="text-[16px] font-bold mt-1" style={{ color: '#ffffff' }}>
          Dr Zac Lewis
        </div>
        <div className="text-[10.5px] mt-1" style={{ color: '#9fb6bb' }}>
          Osteopath · B.Clin.Sci., M.Ost.Med
        </div>
        <p className="text-[10.5px] mt-2 leading-relaxed" style={{ color: '#cbd5e1' }}>
          Over a decade of clinical practice specialising in neurological health, rehabilitation and
          concussion management — including work with national and professional ice-hockey leagues
          across New Zealand and Canada. Course director and clinical mentor to early-career
          clinicians Australia-wide.
        </p>
      </div>

      {/* Info blocks */}
      <div className="grid grid-cols-3 gap-4 mt-5">
        <InfoBlock k="WHERE" v="On-site at your Sydney clinic" />
        <InfoBlock k="WHEN" v="One weekday that suits the clinic" />
        <InfoBlock k="PREP" v="Online modules open ~3 weeks prior" />
      </div>

      {/* Badge row */}
      <div
        className="text-[10px] text-center font-medium mt-5 py-2.5 rounded-lg"
        style={{ background: '#f8fafc', color: INK_SOFT, border: `1px solid ${LINE}` }}
      >
        Endorsed by Osteopathy Australia · 16 CPD hours each · Certificate of completion · AHPRA-aligned
      </div>

      {/* Next step */}
      <div
        className="rounded-xl px-6 py-5 mt-5 mb-auto"
        style={{ border: `2px solid ${ACCENT}`, background: '#ecfdf5' }}
      >
        <div className="text-[10px] font-bold tracking-[0.16em]" style={{ color: ACCENT }}>
          NEXT STEP
        </div>
        <div className="text-[16px] font-bold mt-1" style={{ color: INK }}>
          Book a 20-minute scoping call.
        </div>
        <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: INK_SOFT }}>
          We confirm your cohort size and a date that suits the clinic — then lock in the day in
          Sydney.
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-1 mt-3 text-[11.5px] font-semibold" style={{ color: ACCENT }}>
          <span>cal.com/zac-lewis-so8zjs</span>
          <span>zac@concussion-education-australia.com</span>
        </div>
      </div>
    </Page>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Document
// ─────────────────────────────────────────────────────────────────────────────

// Same access key as the non-print proposal. This page shipped UNGATED
// (2026-08-05 live crawl): anyone hitting the URL got the full private
// proposal — named client, headcount and negotiated per-clinician pricing.
// robots.txt is not access control.
const ACCESS_KEY = 'syd2026'

export default async function SydneyPhysiosPrintProposal({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>
}) {
  const { k } = await searchParams
  if (k !== ACCESS_KEY) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: INK, margin: '0 0 8px' }}>This proposal is private</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: INK_SOFT, margin: 0 }}>
            Open it from the link you were sent. If you need a fresh link, reply to the
            email it came from.
          </p>
        </div>
      </div>
    )
  }
  return renderSydneyPhysiosPrintProposal()
}

function renderSydneyPhysiosPrintProposal() {
  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        html, body {
          background: #f1f5f9;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          html, body { background: #ffffff; }
          .proposal-doc { gap: 0 !important; padding: 0 !important; }
          .proposal-doc > div {
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
      <div
        className="proposal-doc flex flex-col items-center"
        style={{ gap: '24px', padding: '24px 0' }}
      >
        <PageOne />
        <PageTwo />
        <PageThree />
      </div>
    </>
  )
}
