import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { CONFIG } from '@/lib/config'
import { SstTrainerDemo } from '@/components/platform/SstTrainerDemo'
import { CompetencyGapEvidence } from '@/components/clinical/CompetencyGapEvidence'

/**
 * NOT INDEXABLE — a PARTNER NEGOTIATION document for Guild Insurance (via the
 * Osteopathy Australia relationship), reached by direct link only.
 *
 * Rebuilt 2026-07-27 on the /acc page pattern (owner: the generic SstPitch
 * variant was rejected; pitch pages follow the proven structure, never from
 * scratch). Same structure discipline as /acc: every block is a table, strip,
 * card row or live artifact — prose survives only in the evidence footnote and
 * the legal disclosure.
 *
 * BUYER: Guild's risk / partnerships team. The product sold is RISK REDUCTION
 * across their insured allied-health book: accredited member education + the
 * documented, HR-measured record behind every management and return-to-play
 * decision. The tool is the mechanism, never the pitch.
 *
 * CLAIM DISCIPLINE: OA endorsement belongs to CCM. ESSA accreditation
 * (PDNF26077, valid to 24 Jul 2027) belongs to CRM — REAL, never "pending".
 * No diagnostic/prognostic/clearance claim; the clinician holds all judgement.
 * CEA holds no claims-outcome data and claims none. No PMS write-back claim.
 */
export const metadata = { robots: 'noindex, nofollow' } as const

const hanken = Hanken_Grotesk({ subsets: ['latin'] })
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

const ACCENT = '#0d9488'
const CONTACT_EMAIL = CONFIG.CONTACT_EMAIL
const REPORT_URL =
  '/api/sst/report?code=DEMO00&patient=Demo%20Patient&skin=gp-report&first=Alex&last=Demo&clinician=Reviewing%20Clinician'

const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Concussion risk resource for Guild — via Osteopathy Australia',
)}&body=${encodeURIComponent(
  'Hi Zac — I look after risk / partnerships at Guild and would like 20 minutes on the concussion education and documented-decision record.\n\nRole:\nBest time:',
)}`

/** The claim file, before and after — the whole pitch in one strip. */
const SHIFT: { step: string; before: string; after: string }[] = [
  {
    step: 'The clearance decision',
    before: '“Cleared on clinical judgement” — a consult note, written after the fact',
    after: 'A timestamped, heart-rate-measured recovery trajectory behind the decision',
  },
  {
    step: 'The rehab between visits',
    before: 'Patient-reported: “I did the sessions and felt fine”',
    after: 'Every home session recorded against the prescribed band — verified wearable data',
  },
  {
    step: 'When a claim is questioned',
    before: 'Reconstruct the episode from memory and notes',
    after: 'Print the record: threshold tests, session log, stop-rule events, signed report',
  },
]

export default function GuildPartnerPage() {
  return (
    <div
      className={`${hanken.className} ${space.variable} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-6 pb-12 pt-14 md:px-8">
        <div className="flex flex-1 basis-[420px] flex-col gap-5">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none"
            style={{ background: '#ccfbf1', color: '#0f766e' }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            For Guild Insurance — via Osteopathy Australia
          </span>
          <h1 className="m-0 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
            The record that makes a concussion claim{' '}
            <span style={{ color: ACCENT }}>defensible.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,17.5px)] leading-[1.55] text-slate-600">
            The concussion standard of care changed in 2022, and return-to-play decisions fall to
            the clinicians Guild insures. The exposure isn&rsquo;t the exercise — it&rsquo;s whether
            the decision was <strong>measured and documented</strong>. Independently recognised
            education closes the competency gap; the instrument produces the record.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={MAILTO}
              className="flex cursor-pointer items-center rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.7)' }}
            >
              Start the conversation
            </a>
            <Link
              href="/clinical-hub?clinic=DEMO00"
              className="flex items-center rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              See the clinician view
            </Link>
          </div>
          <p className="m-0 text-[12.5px] font-medium text-slate-500">
            Live demos, no sign-in. Every patient and episode shown is fabricated for illustration.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 basis-[520px] justify-center">
          <SstTrainerDemo />
        </div>
      </header>

      {/* ── THE SHIFT — the claim file, before and after ───────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr] sm:grid-cols-[minmax(150px,0.8fr)_1fr_1fr]">
            <div className="hidden bg-slate-50 px-5 py-3 sm:block" />
            <div className="hidden bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 sm:block">The file today</div>
            <div className="hidden bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] sm:block" style={{ color: ACCENT }}>With the documented record</div>
            {SHIFT.map((r) => (
              <div key={r.step} className="contents">
                <div className="border-t border-slate-100 px-5 pb-1 pt-4 text-[13px] font-bold text-slate-900 sm:py-4">{r.step}</div>
                <div className="px-5 pb-1 text-[13.5px] leading-[1.5] text-slate-500 sm:border-t sm:border-slate-100 sm:py-4">{r.before}</div>
                <div className="px-5 pb-4 text-[13.5px] font-medium leading-[1.5] text-slate-800 sm:border-t sm:border-slate-100 sm:py-4">{r.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE ARTIFACT — the report a clinician signs ────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
              This is the record, rendered live
            </h2>
            <p className="m-0 mt-2 max-w-[660px] text-[14.5px] leading-[1.55] text-slate-600">
              A fabricated example episode — the report the treating clinician reviews and signs:
              measured threshold trajectory, session adherence, and a clearance-or-extend
              recommendation the data supports.
            </p>
          </div>
          <a
            href={REPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center rounded-[12px] border-[1.5px] border-slate-300 bg-white px-4 py-2.5 text-[13.5px] font-bold leading-none text-slate-900"
          >
            Open full screen →
          </a>
        </div>
        <div
          className="overflow-hidden rounded-[18px] border border-slate-200 bg-white"
          style={{ boxShadow: '0 30px 60px -30px rgba(15,23,42,.25)' }}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11.5px] font-medium text-slate-400">
              Clinical report — fabricated example episode
            </span>
          </div>
          <iframe
            src={REPORT_URL}
            title="Example clinical report, rendered live from fabricated demonstration data"
            className="block h-[560px] w-full border-0"
            loading="lazy"
            sandbox="allow-same-origin"
          />
        </div>
      </section>

      {/* ── THE COMPETENCY GAP — published evidence, not opinion ───────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <CompetencyGapEvidence heading="The claims problem is a competency problem — published, not anecdotal" />
      </section>

      {/* ── THE EXPOSURE — bento ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-1 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          Why this lands on Guild&rsquo;s book
        </h2>
        <p className="mb-5 max-w-[680px] text-[14px] leading-[1.5] text-slate-600">
          Amsterdam 2022 made sub-symptom-threshold aerobic exercise first-line — most practising
          clinicians were trained on the model it replaced.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border-2 p-6 md:col-span-2" style={{ borderColor: ACCENT, background: '#f0fdfa' }}>
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>
              The decision your insureds must defend
            </span>
            <p className="m-0 mt-2 text-[19px] font-extrabold leading-[1.3] text-slate-900">
              Return-to-play clearance — increasingly scrutinised, mostly undocumented beyond a consult note
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-6">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              The mandate driving volume
            </span>
            <p className="m-0 mt-2 text-[14.5px] font-semibold leading-[1.45] text-slate-800">
              The 21-day community-sport stand-down names clinician clearance as the gate
            </p>
            <p className="m-0 mt-2 text-[13px] leading-[1.45] text-slate-500">
              More clearance decisions, by more of your insureds, every season.
            </p>
          </div>
          <div className="rounded-[18px] bg-slate-900 p-6 md:col-span-3">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              The line that decides a claim
            </span>
            <p className="m-0 mt-3 text-[15px] font-semibold leading-[1.5] text-white">
              &ldquo;Cleared on clinical judgement&rdquo; is an{' '}
              <strong style={{ color: '#5eead4' }}>arguable</strong> file entry. A measured
              heart-rate-threshold trajectory with timestamped decisions and stop-rule events is a{' '}
              <strong style={{ color: '#5eead4' }}>defensible</strong> one.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT GUILD GETS ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-5 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          What Guild gets
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-[18px] border border-slate-200 bg-white p-[26px]">
            <p className="m-0 text-[20px] font-extrabold leading-[1.25] text-slate-900">
              Member education for both professions
            </p>
            <p className="m-0 mt-2 text-[13.5px] leading-[1.5] text-slate-500">
              An Australian concussion program carrying independent recognition across both
              bodies — ready to run as a member-discount campaign.
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {[
                // CPD hours are NEVER hardcoded in copy (CLAUDE.md) — derive from
                // CONFIG so an accreditation re-rate can't leave a partner-facing
                // document quoting a stale number.
                `Concussion Clinical Mastery — endorsed by Osteopathy Australia, up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours`,
                `Concussion Rehab Mastery — ESSA-accredited (No. ${CONFIG.ESSA_ACCREDITATION.NUMBER}), up to ${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} CPD hours`,
                'Assessment, graded return-to-play and documentation taught to the current consensus',
                'Member-discount campaign ready to run each quarter',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-slate-600">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: ACCENT }} />
                  {f}
                </li>
              ))}
            </ul>
            <p className="m-0 mt-auto pt-4 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Education · closes the competency gap
            </p>
          </div>

          <div className="flex flex-col rounded-[18px] border border-slate-200 bg-white p-[26px]">
            <p className="m-0 text-[20px] font-extrabold leading-[1.25] text-slate-900">
              A documented decision record for every episode
            </p>
            <p className="m-0 mt-2 text-[13.5px] leading-[1.5] text-slate-500">
              When an insured clinician runs SST, every management and clearance decision sits on
              measured data — clinician-directed end to end.
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {[
                'Threshold measured by guided graded test — never estimated',
                'Home sessions verified on the patient’s own wearable',
                'Timestamped decisions and stop-rule events in the episode log',
                'A signed clinical report at episode end — the artifact above',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-slate-600">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: ACCENT }} />
                  {f}
                </li>
              ))}
            </ul>
            <p className="m-0 mt-auto pt-4 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              SST Trainer · the record behind the decision
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-[820px] text-[13px] leading-[1.55] text-slate-500">
          <strong className="text-slate-700">The simplest start is neither.</strong> A concussion
          risk-management piece for RiskHQ — the changed standard of care, what a defensible
          clearance decision looks like, what belongs in the file — costs Guild nothing and fits the
          format your risk team already publishes.
        </p>
      </section>

      {/* ── CLOSE ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[72px] md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-[22px] bg-slate-900 px-9 py-[32px]">
          <div className="flex-1 basis-[420px]">
            <h2 className="m-0 mb-2.5 text-[clamp(21px,2.3vw,28px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-white">
              Twenty minutes, with OA in the room
            </h2>
            <p className="m-0 max-w-[540px] text-[14.5px] leading-[1.55] text-slate-300">
              This comes through the Osteopathy Australia partnership, not around it. The natural
              first step is a RiskHQ contribution; the member-discount campaign is ready whenever
              Guild wants it.
            </p>
          </div>
          <a
            href={MAILTO}
            className="cursor-pointer rounded-[13px] px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
          >
            Email Zac
          </a>
        </div>
        <p className="mt-5 text-center text-[11.5px] leading-[1.6] text-slate-400">
          Clinician-directed: the tool presents measured data and paces a published protocol — no
          diagnostic, prognostic or clearance claim; all clinical judgement rests with the treating
          practitioner. Concussion Clinical Mastery is endorsed by Osteopathy Australia; that
          endorsement belongs to that course. Concussion Rehab Mastery is accredited by Exercise
          &amp; Sports Science Australia (Accreditation No. {CONFIG.ESSA_ACCREDITATION.NUMBER}, valid
          to{' '}
          {new Date(CONFIG.ESSA_ACCREDITATION.VALID_UNTIL).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}); that accreditation belongs to that course. The programmes are authored
          by a registered osteopath. CEA holds no claims-outcome data and makes no claim that any
          product reduces claims frequency or cost. Patient data is stored in Australia.
        </p>
        <p className="mt-2 text-center text-[11px] leading-[1.5] text-slate-400">
          Concussion Education Australia Pty Ltd · ACN 688 155 508 · ABN 74 688 155 508 · 2
          Wordsworth St, Byron Bay NSW 2481 · Director: Zac Lewis, Registered Osteopath
          (AHPRA-registered), B.Clin.Sci, M.Ost.Med
        </p>
      </section>
    </div>
  )
}
