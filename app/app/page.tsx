import type { Metadata } from 'next'
import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { Play, Globe, ArrowRight, Plus, Apple } from 'lucide-react'

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

// "Get the app" front door — demo + all-platform install.
// Unlisted pre-launch; not linked from public nav.
export const metadata: Metadata = {
  title: 'Get the Sub-Symptom-Threshold Trainer',
  robots: 'noindex, nofollow',
}

// ── Drop your Loom share URL here once recorded. ──────────────────────────────
// Use the loom.com/share/<id> link. We render it as a click-out card (opens in a
// new tab) — reliable. If you'd rather embed it inline, switch to the
// loom.com/embed/<id> iframe AFTER verifying it renders in a real browser
// (some embeds are X-Frame-blocked — see the no-unverified-iframes rule).
const LOOM_URL = '' // e.g. 'https://www.loom.com/share/xxxxxxxx'

function Logo({ size = 30 }: { size?: number }) {
  return (
    <span
      className="relative inline-block rounded-full border-[2.5px] border-[#5b9aa6]"
      style={{ width: size, height: size }}
    >
      <span className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5b9aa6]" />
    </span>
  )
}

export default function GetAppPage() {
  return (
    <div
      className={`${hanken.variable} ${spaceGrotesk.variable} min-h-screen w-full font-[family-name:var(--font-hanken)] text-[#16282b]`}
      style={{
        background:
          'radial-gradient(120% 80% at 80% -10%, #eaf3f3 0%, #f4f8f8 45%, #eef4f4 100%)',
      }}
    >
      {/* ===== NAV ===== */}
      <nav className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-[18px] font-extrabold tracking-[-0.02em]">SST&nbsp;Trainer</span>
        </div>
        <div className="flex items-center gap-5 sm:gap-7">
          <span className="hidden text-sm font-semibold text-[#3b4f52] sm:inline">For clinicians</span>
          <span className="hidden text-sm font-semibold text-[#3b4f52] sm:inline">Evidence</span>
          <span className="hidden text-sm font-semibold text-[#3b4f52] sm:inline">Pricing</span>
          <Link
            href="/sst-trainer"
            className="rounded-xl bg-[#5b9aa6] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_-8px_rgba(91,154,166,0.8)]"
          >
            Open the app
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-6 pb-16 pt-8 sm:px-8 lg:gap-14">
        {/* left: copy */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#5b9aa6]">
            Prescribed exercise-rehab platform
          </span>
          <h1 className="m-0 text-[clamp(36px,4.6vw,58px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Recovery, paced to your threshold.
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-relaxed text-[#42565a]">
            One platform finds your heart-rate threshold, prescribes a safe training band, and steps
            it up as you recover — across concussion, cancer rehab, dysautonomia and cardiac care. Set
            up and overseen by your clinician.
          </p>

          {/* live web app CTA */}
          <Link
            href="/sst-trainer"
            className="group inline-flex w-fit items-center gap-3 rounded-2xl bg-[#16282b] px-5 py-3 text-white transition-transform hover:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5b9aa6]">
              <Globe className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="flex items-center gap-2 text-[11px] opacity-80">
                Runs in any browser
                <span className="rounded-full bg-[#5b9aa6] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                  Live
                </span>
              </span>
              <span className="text-base font-bold">Open the web app</span>
            </span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>

          {/* store badges — coming soon */}
          <div className="flex flex-wrap gap-3">
            {[
              { icon: Apple, top: 'Coming soon to the', label: 'App Store' },
              { icon: Play, top: 'Coming soon on', label: 'Google Play' },
            ].map((b) => {
              const Icon = b.icon
              return (
                <div
                  key={b.label}
                  className="flex items-center gap-3 rounded-2xl bg-[#16282b]/85 px-4 py-2.5 text-white opacity-80"
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex flex-col leading-tight">
                    <span className="text-[10px] opacity-80">{b.top}</span>
                    <span className="text-[15px] font-bold">{b.label}</span>
                  </span>
                </div>
              )
            })}
          </div>
          <p className="m-0 text-[13px] font-medium text-[#849c9c]">
            Free to start. No clinic hardware required.
          </p>
        </div>

        {/* right: Loom-style player */}
        <div className="min-w-0 flex-1 basis-[420px] overflow-hidden rounded-3xl border border-[#e2ecec] bg-white shadow-[0_40px_80px_-30px_rgba(22,40,43,0.35),0_12px_28px_-16px_rgba(22,40,43,0.18)]">
          {/* player top bar */}
          <div className="flex items-center justify-between border-b border-[#eef4f4] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full bg-[#fbeae8] px-2 py-1 text-[10px] font-bold tracking-[0.06em] text-[#d2463a]">
                <span className="h-[7px] w-[7px] animate-pulse rounded-full bg-[#d2463a]" />
                DEMO
              </span>
              <span className="text-[13px] font-semibold text-[#3b4f52]">
                SST Trainer · product tour
              </span>
            </div>
            <span className="text-xs text-[#849c9c] font-[family-name:var(--font-space)]">0:00 / 1:30</span>
          </div>

          {/* stage — Loom click-out (or placeholder until LOOM_URL is set) */}
          {LOOM_URL ? (
            <a
              href={LOOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex aspect-video items-center justify-center bg-gradient-to-b from-[#e7f2f3] to-[#dbe7e7] transition-transform hover:scale-[1.005]"
            >
              <span className="flex flex-col items-center gap-3">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#5b9aa6] shadow-[0_12px_28px_-10px_rgba(91,154,166,0.9)]">
                  <Play className="h-7 w-7 text-white" fill="currentColor" />
                </span>
                <span className="text-sm font-bold text-[#16282b]">Watch the 90-second tour</span>
              </span>
            </a>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#e7f2f3] to-[#dbe7e7] text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70">
                <Play className="h-7 w-7 text-[#5b9aa6]" fill="currentColor" />
              </span>
              {/* TODO: set LOOM_URL above to your Loom share link */}
              <span className="text-sm font-semibold text-[#5d7174]">Demo tour — add your Loom link</span>
            </div>
          )}

          {/* player control bar */}
          <div className="flex items-center gap-3.5 border-t border-[#eef4f4] bg-white px-4 py-3.5">
            <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[#5b9aa6]">
              <Play className="h-3.5 w-3.5 text-white" fill="currentColor" />
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e2ecec]">
              <div className="h-full w-0 rounded-full bg-[#5b9aa6]" />
            </div>
            <span className="whitespace-nowrap text-[11px] text-[#849c9c] font-[family-name:var(--font-space)]">
              0:00 / 1:30
            </span>
          </div>
        </div>
      </header>

      {/* ===== PLATFORM STRIP ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-[22px] bg-[#16282b] px-9 py-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-[22px] font-extrabold tracking-[-0.02em] text-white">
              Works on what you already wear.
            </span>
            <span className="text-sm leading-snug text-[#a7c2c5]">
              Live heart rate from the device you own. Download once, install in seconds.
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {['Apple Watch', 'Garmin', 'iPhone', 'Android', 'Web'].map((p) => (
              <span
                key={p}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[13px] font-semibold text-[#eaf3f3]"
              >
                <span className="h-[7px] w-[7px] rounded-full bg-[#5b9aa6]" />
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== INSTALL (PWA) ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 sm:px-8">
        <div className="rounded-[18px] border border-[#e2ecec] bg-white p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e7f2f3]">
              <Plus className="h-5 w-5 text-[#3c7681]" />
            </span>
            <p className="m-0 text-[17px] font-extrabold tracking-[-0.01em]">
              Install it on your phone (no app store needed)
            </p>
          </div>
          <div className="mt-3 grid gap-3 text-sm text-[#5d7174] sm:grid-cols-2">
            <p className="m-0">
              <span className="font-semibold text-[#16282b]">iPhone / iPad:</span> open in Safari → tap
              the Share button → <em>Add to Home Screen</em>.
            </p>
            <p className="m-0">
              <span className="font-semibold text-[#16282b]">Android:</span> open in Chrome → menu (⋮) →{' '}
              <em>Install app / Add to Home screen</em>.
            </p>
          </div>
        </div>
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section className="mx-auto grid max-w-[1180px] grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 px-6 pb-[72px] sm:px-8">
        {[
          {
            mark: '℞',
            title: 'Prescribe & progress',
            body: 'Not a tracker. We find your threshold, prescribe the band, and step it up as you recover — within a symptom-defined ceiling.',
          },
          {
            mark: '⇄',
            title: 'The clinician loop',
            body: 'Your exercise physiologist sets and oversees the threshold; your recovery curve flows straight back to them.',
          },
          {
            mark: '✓',
            title: 'Built on the evidence',
            body: 'The Buffalo protocol and sub-symptom-threshold training, delivered one-handed to the wrist — mid-exercise.',
          },
        ].map((c) => (
          <div key={c.title} className="rounded-[18px] border border-[#e2ecec] bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#e7f2f3] text-lg font-bold text-[#3c7681] font-[family-name:var(--font-space)]">
              {c.mark}
            </span>
            <h3 className="mb-1.5 mt-3.5 text-[17px] font-extrabold leading-tight tracking-[-0.01em]">
              {c.title}
            </h3>
            <p className="m-0 text-[13.5px] leading-relaxed text-[#5d7174]">{c.body}</p>
          </div>
        ))}
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#e2ecec]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3.5 px-6 py-6 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="text-sm font-bold">SST Trainer</span>
          </div>
          <span className="text-xs leading-snug text-[#849c9c]">
            Not a diagnosis or a return-to-play clearance. Set up and overseen by your clinician.
          </span>
        </div>
      </footer>
    </div>
  )
}
