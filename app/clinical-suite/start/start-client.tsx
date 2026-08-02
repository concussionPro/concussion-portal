'use client'

import { useSearchParams } from 'next/navigation'
import { SstTrialStart } from '@/components/platform/SstTrialStart'

const ACCENT = '#0d9488'

/**
 * The page shell around the trial form. ?src= (e.g. /clinical-suite/start?src=cliniko)
 * is passed through to the signup API so inbound channels are attributable in
 * the lead note and owner notification.
 */

const STEPS = [
  { n: '1', t: 'Get your clinic code', b: 'Instant — shown on screen and emailed with your login link.' },
  { n: '2', t: 'Run your first graded test', b: 'Buffalo protocol on the patient’s own watch or a typed reading — the measured threshold sets the training band.' },
  { n: '3', t: 'Reports write themselves', b: 'Sessions sync to your dashboard; the GP report generates from real data for you to review and sign.' },
]

export function SstTrialStartPage() {
  const params = useSearchParams()
  const src = params.get('src') || undefined

  return (
    <div className="pt-[92px] md:pt-[110px]">
      <section className="mx-auto max-w-[1180px] px-6 pb-20 md:px-8">
        <div className="flex flex-wrap items-start gap-12">
          <div className="flex min-w-0 flex-1 basis-[430px] flex-col gap-[18px] pt-4">
            <h1 className="m-0 text-[clamp(30px,4vw,48px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Start your free trial.<br />
              <span style={{ color: ACCENT }}>First 3 patients on us.</span>
            </h1>
            <p className="m-0 max-w-[500px] text-[clamp(15px,1.4vw,17px)] leading-[1.55] text-slate-600">
              Two minutes to a working clinic: you get a clinic code, your patients train on the
              wearable they already own, and the measured data and GP report come back to you.
              No card required for the trial.
            </p>
            <ul className="m-0 mt-2 flex list-none flex-col gap-4 p-0">
              {STEPS.map((s) => (
                <li key={s.n} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full text-[13px] font-extrabold text-white" style={{ background: ACCENT }}>{s.n}</span>
                  <div>
                    <p className="m-0 text-[15px] font-bold text-slate-800">{s.t}</p>
                    <p className="m-0 text-[13.5px] leading-[1.5] text-slate-500">{s.b}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-1 text-[12.5px] leading-[1.5] text-slate-400">
              Works standalone, and connects to Cliniko for patient matching and report filing.
              Included with CCM / CRM course enrolment.
            </p>
          </div>
          <div className="min-w-0 flex-1 basis-[420px]">
            <SstTrialStart source={src} />
          </div>
        </div>
      </section>
    </div>
  )
}
