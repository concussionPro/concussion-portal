import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'
import { PreseasonBaselineDemo } from '@/components/PreseasonBaselineDemo'

// Design fonts (faithful to the provided visual): Hanken Grotesk as the base
// type and Space Grotesk for tabular/numeric accents.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-hanken',
  display: 'swap',
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
})

const ACCENT = '#0d9488'

const STEPS = [
  {
    n: '1',
    title: 'Register your clinic',
    body: 'Enter your clinic name and email. Get a unique link in seconds — completely free.',
  },
  {
    n: '2',
    title: 'Share with clubs',
    body: 'Send the link to your sports clubs and teams. Athletes complete the baseline on any computer.',
  },
  {
    n: '3',
    title: 'Receive reports',
    body: 'A PDF report with full SCAT6 baseline scores is emailed to your clinic for each athlete.',
  },
]

const COVERS = [
  { icon: '22', title: 'Symptom evaluation', body: 'All 22 symptoms rated 0–6, with symptom number and severity score.' },
  { icon: '?', title: 'Orientation', body: 'Month, date, day of week, year, and time assessment.' },
  { icon: '10', title: 'Immediate memory', body: '10-word recall using standard SCAT6 word lists.' },
  { icon: '#', title: 'Concentration', body: 'Digits backward and months in reverse order.' },
  { icon: '5′', title: 'Delayed recall', body: '10-word recall after a minimum 5-minute delay.' },
  { icon: '+', title: 'Medical history', body: 'Concussion history, medical conditions, current medications.' },
]

const INCLUDES = [
  'Step-by-step SCAT6 & SCOAT6 training',
  'Fillable, auto-scoring forms',
  'Clinical toolkit & RTP forms',
  'Certificate of completion',
]

export default function PreseasonLandingPage() {
  return (
    <div
      className={`${hanken.className} ${spaceGrotesk.variable} min-h-screen w-full text-slate-900`}
      style={{
        background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)',
      }}
    >
      {/* Shared site nav (fixed) — real routes + auth-aware Login/Enrol */}
      <SiteNav />

      {/* ===== HERO ===== */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-6 pb-16 pt-[100px] md:px-8 md:pt-[120px]">
        <div className="flex flex-1 basis-[420px] flex-col gap-[22px]">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none tracking-[0.02em]"
            style={{ background: '#ccfbf1', color: '#0f766e' }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            Free for clinics — no account required
          </span>

          <h1 className="m-0 text-[clamp(36px,4.7vw,60px)] font-extrabold leading-[1.01] tracking-[-0.03em]">
            Pre-season baseline testing, <span style={{ color: ACCENT }}>made simple.</span>
          </h1>

          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-slate-600">
            Let athletes self-administer the SCAT6 baseline remotely — no appointment needed. A PDF report
            is emailed to your clinic for every athlete, and records are stored for repeat-test tracking.
          </p>

          <div className="mt-0.5 flex flex-wrap gap-3">
            <Link
              href="/preseason/register"
              className="flex items-center gap-2 rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.7)' }}
            >
              Register your clinic
            </Link>
            <Link
              href="/preseason/b/DEMO00"
              className="flex items-center gap-2 rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              Try the demo →
            </Link>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-[18px]">
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">
              Self-administered SCAT6 sections
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">
              ~5 minutes on any computer
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">
              Endorsed by Osteopathy Australia
            </span>
          </div>
        </div>

        {/* Loom-style demo */}
        <div className="flex min-w-0 flex-1 basis-[540px] justify-center">
          <PreseasonBaselineDemo />
        </div>
      </header>

      {/* ===== HOW IT WORKS ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 pt-2 md:px-8">
        <h2 className="mb-[26px] text-center text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[18px] border border-slate-200 bg-white p-[26px]">
              <span
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-slate-900 text-[15px] font-bold leading-none text-white"
                style={{ fontFamily: 'var(--font-space), sans-serif' }}
              >
                {s.n}
              </span>
              <h3 className="mb-2 mt-4 text-[18px] font-extrabold leading-[1.15] tracking-[-0.01em]">
                {s.title}
              </h3>
              <p className="m-0 text-[14px] leading-[1.55] text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHAT IT COVERS ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[60px] md:px-8">
        <div className="mb-[26px] text-center">
          <h2 className="mb-2 text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            What the baseline covers
          </h2>
          <p className="mx-auto m-0 max-w-[560px] text-[15px] leading-[1.5] text-slate-500">
            The self-administered sections of the SCAT6, matching the official assessment tool.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COVERS.map((c) => (
            <div key={c.title} className="rounded-[16px] border border-slate-200 bg-white p-5">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] text-[15px] font-bold leading-none text-teal-700"
                style={{ background: '#ccfbf1', fontFamily: 'var(--font-space), sans-serif' }}
              >
                {c.icon}
              </span>
              <h3 className="mb-1.5 mt-[13px] text-[16px] font-bold leading-[1.15]">{c.title}</h3>
              <p className="m-0 text-[13px] leading-[1.5] text-slate-500">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-[18px] text-center text-[12.5px] leading-[1.5] text-slate-400">
          Sections requiring clinical observation (balance, coordination, cervical spine, GCS) are excluded
          and noted on the report.
        </p>
      </section>

      {/* ===== STATS BAND ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-[22px] bg-slate-900 px-9 py-[34px]">
          <div className="flex flex-wrap gap-11">
            <div>
              <div className="text-[34px] font-semibold leading-none text-white" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                5<span className="text-[16px] text-teal-300"> min</span>
              </div>
              <div className="mt-[5px] text-[12px] font-medium leading-[1.3] text-slate-400">
                Athlete completion
              </div>
            </div>
            <div>
              <div className="text-[34px] font-semibold leading-none text-white" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                $0
              </div>
              <div className="mt-[5px] text-[12px] font-medium leading-[1.3] text-slate-400">
                Completely free
              </div>
            </div>
            <div>
              <div className="text-[34px] font-semibold leading-none text-white" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                PDF
              </div>
              <div className="mt-[5px] text-[12px] font-medium leading-[1.3] text-slate-400">
                Emailed to your clinic
              </div>
            </div>
          </div>
          <Link
            href="/preseason/register"
            className="rounded-[13px] px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
          >
            Register your clinic — free
          </Link>
        </div>
      </section>

      {/* ===== MASTERY CROSS-SELL + FINAL CTA ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[72px] md:px-8">
        <div
          className="flex flex-wrap items-center justify-between gap-[30px] rounded-[22px] border p-[38px]"
          style={{ background: 'linear-gradient(135deg,#f0fdfa,#ecfeff)', borderColor: '#cffafe' }}
        >
          <div className="flex-1 basis-[420px]">
            <span className="text-[12px] font-bold uppercase leading-none tracking-[0.1em]" style={{ color: ACCENT }}>
              Free SCAT6 / SCOAT6 mastery
            </span>
            <h2 className="mb-2 mt-2.5 text-[clamp(24px,2.6vw,32px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
              Know how to use the baseline when it matters.
            </h2>
            <p className="m-0 max-w-[560px] text-[14.5px] leading-[1.55] text-slate-600">
              Collecting baselines is step one. Our free Mastery course teaches you to administer and
              interpret every section — fillable auto-scoring forms, clinical toolkit, and a
              certificate with 1 CPD hour on completion.
            </p>
            <div className="mt-[18px] flex flex-wrap gap-3">
              <Link
                href="/scat-mastery"
                className="rounded-[12px] bg-slate-900 px-5 py-[14px] text-[14px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              >
                Get the free course
              </Link>
              <Link
                href={CONFIG.SHOP_URL}
                className="rounded-[12px] border-[1.5px] border-slate-300 bg-white px-5 py-[14px] text-[14px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
              >
                View full course ({CONFIG.COURSE.TOTAL_CPD_POINTS} CPD)
              </Link>
            </div>
          </div>
          <div className="flex flex-none flex-col gap-[9px]">
            {INCLUDES.map((i) => (
              <span key={i} className="flex items-center gap-[9px] text-[13px] font-semibold leading-[1.3] text-slate-900">
                <span
                  className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] text-white"
                  style={{ background: ACCENT }}
                >
                  ✓
                </span>
                {i}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer rendered globally by FooterWrapper -> SiteFooter in the root
          layout (carries Terms / Privacy links). Not duplicated here. */}
    </div>
  )
}
