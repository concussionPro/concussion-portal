import Link from 'next/link'
import { Hanken_Grotesk } from 'next/font/google'
import { CONFIG } from '@/lib/config'
import { SstTrainerDemo } from '@/components/platform/SstTrainerDemo'
import { CompetencyGapEvidence } from '@/components/clinical/CompetencyGapEvidence'
import { TrackedOutbound } from '@/components/TrackedOutbound'

/**
 * /clinics — the AU neurorehab/vestibular/concussion-clinic pitch (the
 * 'aus neuro' outreach stream). /acc reworked for the AUSTRALIAN model —
 * /acc itself stays untouched for NZ ACC suppliers.
 *
 * THE AU BUYER'S WORLD (what compliance means here — NOT ACC):
 *  - NDIS progress reports that must evidence capacity-building against goals
 *  - CTP / workers-comp insurer approvals — objective progress measures keep
 *    treatment funding flowing (AHTR-style justifications)
 *  - AHPRA record-keeping standards + medicolegal RTP defensibility
 *  - Cliniko as the PMS — where our report write-back is tenant-validated
 *
 * Disciplines as /acc: STRUCTURE not prose; live artifacts; trial cited once
 * with population limits; no outcome claims; clinician-led always (TGA).
 */
export const metadata = { robots: 'noindex, nofollow' } as const

const hanken = Hanken_Grotesk({ subsets: ['latin'] })
const ACCENT = '#0d9488'
const CAL = 'https://cal.com/zac-lewis-so8zjs/30min'
const RTP_SAMPLE = '/api/sst/report?code=DEMO00&patient=Demo%20Patient&skin=rtp-clearance&first=Alex&last=Demo&clinician=Reviewing%20Clinician'
const GP_SAMPLE = '/api/sst/report?code=DEMO00&patient=Demo%20Patient&skin=gp-report&first=Alex&last=Demo&clinician=Reviewing%20Clinician'

/** Funder/obligation → what the episode record evidences. The AU compliance map. */
const FUNDERS = [
  {
    k: 'Insurer-funded care (CTP · workers comp)',
    need: 'Case managers approve further treatment on objective progress evidence and clear clinical justification.',
    ans: 'A serial measured threshold is exactly that — a physiological trajectory, session by session, attached to your treatment request instead of a symptom narrative.',
  },
  {
    k: 'NDIS progress reporting',
    need: 'Reports must evidence capacity-building against plan goals, from auditable records.',
    ans: 'Every home session is recorded against the prescribed band — dose, adherence and progression documented as they happen, ready to draw into the progress report.',
  },
  {
    k: 'AHPRA records + medicolegal',
    need: 'Records that stand up: what was prescribed, what was done, what changed — especially behind a return-to-play decision.',
    ans: 'The structured episode record (threshold, band, minutes, symptom deltas, progressions) is clinician-signed and exportable — the file a defensible RTP call stands on.',
  },
]

/** The workflow shift — before/after, mirroring /acc's SHIFT table. */
const SHIFT = [
  { step: 'Between appointments', before: 'Home program adherence unknown — you find out what happened at the next visit', after: 'Every session verified on the patient’s own watch; flare-ups visible the day they happen' },
  { step: 'Progress-report time', before: 'Reconstruct the episode from appointment notes', after: 'Draw from the structured record — GP report and RTP summary render from the episode data' },
  { step: 'Filing', before: 'Write, export, attach, upload to the PMS', after: 'Reports file into the patient’s Cliniko record as clinical notes — no re-keying' },
]

const PACKAGE = [
  {
    tag: 'Instrument 1 — the episode',
    title: 'SST Trainer',
    body: 'A guided test measures each patient’s symptom threshold; home sessions run against the prescribed band on the patient’s own watch — verified, not self-reported. The serial measured threshold is your objective recovery record.',
  },
  {
    tag: 'Instrument 2 — the front door',
    title: 'Pre-season Baseline',
    body: 'One link covers a whole club: athletes self-complete the SCAT6 baseline in ~5 minutes, no appointment. Baselines on file are the referral relationship when the injury happens.',
  },
  {
    tag: 'The competency layer',
    title: 'Accredited training',
    body: 'Concussion Clinical Mastery — endorsed by Osteopathy Australia, with the exercise stream ESSA-accredited. Your clinicians certificated to prescribe measured sub-threshold rehab properly, with the tools as their instruments.',
  },
]

export default function AuClinicsPage() {
  return (
    <div
      className={`${hanken.className} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-6 pb-12 pt-14 md:px-8">
        <div className="flex flex-1 basis-[420px] flex-col gap-5">
          <span className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none" style={{ background: '#ccfbf1', color: '#0f766e' }}>
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            For Australian neuro, vestibular &amp; concussion clinics
          </span>
          <h1 className="m-0 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
            The rehab happens at home.{' '}
            <span style={{ color: ACCENT }}>Now it&rsquo;s measured.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,17.5px)] leading-[1.55] text-slate-600">
            Sub-symptom-threshold aerobic exercise is the consensus first-line treatment for
            concussion — prescribed here from a <strong>measured</strong> heart-rate threshold and
            verified on the patient&rsquo;s own watch between visits, with the reports your funders
            ask for drawing straight from the episode record.{' '}
            <strong className="text-slate-800">And your team trained and certificated to run it</strong> —
            OA-endorsed, ESSA-accredited.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              '17 → 13 days median recovery (Leddy 2019)',
              'Threshold measured, never estimated',
              'Every home session verified',
              'Reports file into Cliniko',
            ].map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500">
                <span className="h-[6px] w-[6px] rounded-full" style={{ background: ACCENT }} />
                {c}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a href={RTP_SAMPLE} target="_blank" rel="noopener noreferrer"
              className="rounded-[13px] px-[22px] py-[14px] text-[14.5px] font-bold leading-none text-white"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}>
              See a sample RTP data summary
            </a>
            <Link href="/demo/clinic"
              className="rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[14px] text-[14.5px] font-bold leading-none text-slate-900">
              Tour the clinician workspace
            </Link>
          </div>
          <p className="m-0 max-w-[520px] text-[12.5px] leading-[1.5] text-slate-500">
            Live demos, no sign-in — every patient shown is fabricated. Ready to talk?{' '}
            <TrackedOutbound href={CAL} event="cal_click" source="auneuro-hero" className="font-bold underline" style={{ color: ACCENT }}>
              Book 30 minutes
            </TrackedOutbound>.
          </p>
        </div>
        <div className="min-w-[320px] flex-1 basis-[380px]">
          <SstTrainerDemo />
        </div>
      </header>

      {/* ── COMPLIANCE: funder → evidence map ───────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-12 md:px-8">
        <h2 className="m-0 mb-1.5 text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-0.02em]">
          What your funders ask for — and what the episode record answers
        </h2>
        <p className="m-0 mb-5 max-w-[760px] text-[14.5px] leading-[1.55] text-slate-600">
          Neuro caseloads run on funded care, and funded care runs on evidence of progress. The
          measured episode is that evidence, compiled as care is delivered.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {FUNDERS.map((f) => (
            <div key={f.k} className="rounded-[18px] border border-slate-200 bg-white p-5">
              <p className="m-0 text-[14.5px] font-bold text-slate-900">{f.k}</p>
              <p className="m-0 mt-1.5 text-[12.5px] leading-[1.5] text-slate-500">{f.need}</p>
              <p className="m-0 mt-2 border-t border-slate-100 pt-2 text-[13px] leading-[1.55] text-slate-700">{f.ans}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORKFLOW SHIFT ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-12 md:px-8">
        <h2 className="m-0 mb-5 text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-0.02em]">
          The workflow, before and after
        </h2>
        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-200">
                <th className="px-5 py-3">Step</th>
                <th className="px-5 py-3">Today</th>
                <th className="px-5 py-3">With SST Trainer</th>
              </tr>
            </thead>
            <tbody>
              {SHIFT.map((r, i) => (
                <tr key={r.step} className={`border-t border-slate-200 align-top ${i % 2 === 1 ? 'bg-slate-50/70' : ''}`}>
                  <td className="px-5 py-4 text-[13px] font-bold text-slate-900">{r.step}</td>
                  <td className="px-5 py-4 text-[13px] leading-[1.5] text-slate-500">{r.before}</td>
                  <td className="px-5 py-4 text-[13px] leading-[1.5] text-slate-800">{r.after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12.5px] text-slate-500">
          Report set for Australian practice:{' '}
          <a href={GP_SAMPLE} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: ACCENT }}>GP report</a>,{' '}
          <a href={RTP_SAMPLE} target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: ACCENT }}>RTP data summary</a>{' '}
          and a full clinical record — each rendered from the episode and filed into the
          patient&rsquo;s{' '}
          <a href="/integrations/cliniko" className="font-semibold underline" style={{ color: ACCENT }}>Cliniko record</a>{' '}
          as a clinical note. Your clinician reviews and signs;
          the software never decides.
        </p>
      </section>

      {/* ── ONE PACKAGE ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-12 md:px-8">
        <h2 className="m-0 mb-1.5 text-[clamp(22px,2.6vw,30px)] font-extrabold tracking-[-0.02em]">
          One package — instruments plus the competency to run them
        </h2>
        <p className="m-0 mb-5 max-w-[760px] text-[14.5px] leading-[1.55] text-slate-600">
          Tools without competency produce records a clinician can&rsquo;t defend; competency without
          instruments leaves the treatment unmeasured. Both run on one clinic code.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PACKAGE.map((p) => (
            <div key={p.title} className="rounded-[18px] border border-slate-200 bg-white p-5">
              <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">{p.tag}</p>
              <p className="m-0 mt-1.5 text-[16px] font-extrabold text-slate-900">{p.title}</p>
              <p className="m-0 mt-1.5 text-[13px] leading-[1.55] text-slate-600">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BEYOND CONCUSSION — the same engine across the neuro caseload ── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-12 md:px-8">
        <div className="rounded-[18px] border border-slate-200 bg-white p-6">
          <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Beyond concussion</p>
          <p className="m-0 mt-1.5 max-w-[860px] text-[14.5px] leading-[1.55] text-slate-700">
            The engine is condition-agnostic: <strong>you set the band, the watch verifies the dose.</strong>{' '}
            Post-stroke aerobic conditioning, Parkinson&rsquo;s intensity programs and MS pacing all run on
            prescribed heart-rate zones — and all run at home, unverified. SST carries the prescription,
            verifies every session, and documents the trajectory. The concussion protocol — guided
            symptom-threshold testing included — is the flagship; the delivery layer serves the caseload.
          </p>
          <p className="m-0 mt-2 text-[11.5px] leading-[1.5] text-slate-400">
            Dose fidelity and verification claims only — treatment prescriptions remain the clinician&rsquo;s,
            anchored to their own guidelines. Clinician-directed decision support throughout.
          </p>
        </div>
      </section>

      {/* ── COMPETENCY EVIDENCE ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-12 md:px-8">
        <CompetencyGapEvidence heading="Why the training layer is part of the package" />
      </section>

      {/* ── COMMERCIALS + PATH ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-12 md:px-8">
        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
          <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="p-6">
              <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Commercials</p>
              <p className="m-0 mt-2 text-[22px] font-extrabold tracking-tight text-slate-900">
                A${CONFIG.COURSE.PRICE_ONLINE}
                <span className="text-[13px] font-semibold text-slate-500"> / clinician — CCM online, tools included</span>
              </p>
              <p className="m-0 mt-1 text-[12.5px] leading-[1.5] text-slate-600">
                Every enrolled clinician gets the full course (8 CPD, OA-endorsed) with SST Trainer and
                Baseline included on your clinic code. Complete with the practical day from
                A${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}. Multi-clinician terms agreed per clinic.
              </p>
            </div>
            <div className="p-6">
              <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">How this moves forward</p>
              <ol className="m-0 mt-2 list-none space-y-2.5 p-0">
                {[
                  ['1', 'Tour the workspace and open the sample reports — no login, on this page.'],
                  ['2', 'A 30-minute call: your caseload, your funders, your referral pathways.'],
                  ['3', 'Full onboarding: clinicians enrolled, instruments live on your clinic code, Cliniko connected.'],
                ].map(([n, t]) => (
                  <li key={n} className="flex gap-2.5 text-[13px] leading-[1.5] text-slate-700">
                    <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: ACCENT }}>{n}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-col items-start justify-center gap-3 p-6" style={{ background: '#f0fdfa' }}>
              <p className="m-0 text-[14px] font-bold leading-[1.4] tracking-tight text-slate-900">
                Thirty minutes with your clinical lead — nothing sold in it.
              </p>
              <TrackedOutbound href={CAL} event="cal_click" source="auneuro-commercials"
                className="flex cursor-pointer items-center rounded-[13px] px-[22px] py-[14px] text-[14.5px] font-bold leading-none text-white"
                style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}>
                Book 30 minutes
              </TrackedOutbound>
              {/* Self-serve trial door (2026-08-04 readiness sweep: this page had
                  NO path to /clinical-suite/start — influx traffic dead-ended at
                  the demo + a call link). */}
              <a href="/clinical-suite/start"
                className="text-[13px] font-bold underline"
                style={{ color: ACCENT }}>
                Or start now — 3 patients free, no card, no call
              </a>
            </div>
          </div>
        </div>
        <p className="mt-4 text-[12px] leading-[1.6] text-slate-400">
          Evidence: in the pivotal randomised trial, adolescent athletes prescribed sub-symptom-threshold
          aerobic exercise recovered in a median 13 days versus 17 (Leddy et al., <em>JAMA Pediatrics</em> 2019;
          n=103, adolescent sport-related concussion — populations differ; no outcome claim is made for this
          software). Clinician-directed decision support — no diagnostic, prognostic or clearance claim.
          {' '}{CONFIG.CONTACT_EMAIL}
        </p>
      </section>
    </div>
  )
}
