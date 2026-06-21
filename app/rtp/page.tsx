import Link from 'next/link'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'

/**
 * Gated landing for the RTP / RTL Pathway Tracker (pre-launch).
 *
 * GATING: server-side requireAiCourseAccess() — admin, demo-key holders, or
 * enrolled users only. The public cannot reach this yet, even though the
 * athlete surface will be free at launch. noindex is set at the /rtp layout.
 */
export default async function RtpLandingPage() {
  await requireAiCourseAccess('/login?from=/rtp')

  return (
    <main
      className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-10 font-[family-name:var(--font-hanken)] text-[#16282b]"
      style={{
        background:
          'radial-gradient(125% 95% at 50% -5%, #f5f9f9 0%, #e7eeee 52%, #dbe5e5 100%)',
      }}
    >
      <div className="w-full max-w-[480px] rounded-[34px] border border-[#e2ecec] bg-[#f4f8f8] p-7 shadow-[0_30px_60px_-24px_rgba(20,40,42,0.4),0_6px_18px_rgba(20,40,42,0.12)]">
        <div className="mb-5 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[#5b9aa6]">
          <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-[#5b9aa6]" />
          CEA · RETURN-TO-SPORT PATHWAY
        </div>

        <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
          PRE-LAUNCH · NOT PUBLIC
        </span>

        <h1 className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.02em]">
          Track the return journey, to the Australian guidelines.
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#3b4f52]">
          A guided Return-to-Sport (GRTS) and Return-to-Learn (RTL) pathway for athletes,
          parents and clubs after a concussion. Daily symptom check-ins, the 24-hour
          stage rule, the 21-day stand-down and 14-day symptom-free clocks, and the
          medical-clearance contact gate — all managed to the{' '}
          <strong>2024 Australian Concussion Guidelines for Youth &amp; Community Sport</strong>.
        </p>

        <ul className="mt-5 space-y-2.5 text-[13.5px] text-[#3b4f52]">
          {[
            'Daily 22-item symptom check-in with red-flag screening',
            'Live GRTS + RTL stage timeline with projected return dates',
            'Stage advancement only when the guideline rules allow it',
            'A clearance-ready, CEA-branded pathway summary',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-[6px] inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#5b9aa6]" />
              {t}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col gap-2.5">
          <Link
            href="/rtp/a/new"
            className="rounded-2xl bg-[#5b9aa6] p-4 text-center text-[15px] font-bold text-white shadow-[0_8px_18px_-8px_rgba(91,154,166,0.8)] transition active:scale-[0.98]"
          >
            Start a pathway
          </Link>
          <p className="text-center text-[11px] text-[#5d7174]">
            This tool tracks and recommends — it does not provide a medical clearance.
            Red-flag symptoms mean stop and seek urgent medical review.
          </p>
        </div>
      </div>
    </main>
  )
}
