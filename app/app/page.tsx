import type { Metadata } from 'next'
import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { SstHomepageDemo } from '@/components/sst-trainer/SstHomepageDemo'

// HR-source devices for the "Compatible devices" strip (static — kept server-side
// so the array isn't a client-reference proxy when imported into this server component).
const DEVICES = [
  { name: 'Apple Watch', method: 'On-watch app · HealthKit', tag: 'Live HR', live: true, glyph: '⌚', tint: '#1d2325' },
  { name: 'Garmin', method: 'Connect IQ · on-watch', tag: 'Live HR', live: true, glyph: '⌚', tint: '#0b7fab' },
  { name: 'WHOOP', method: 'Bluetooth HR broadcast', tag: 'Live HR', live: true, glyph: '▬', tint: '#0f172a' },
  { name: 'Polar / Wahoo', method: 'Bluetooth chest strap', tag: 'Most accurate', live: true, glyph: '◍', tint: '#d2463a' },
  { name: 'Fitbit', method: 'Web API sync', tag: 'Near-real-time', live: false, glyph: '◆', tint: '#3c7681' },
  { name: 'Phone camera', method: 'Camera PPG · no wearable', tag: 'Live HR', live: true, glyph: '◎', tint: '#5d7174' },
]

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

// "Get the app" front door — animated product tour + install.
// Unlisted pre-launch; not linked from public nav.
export const metadata: Metadata = {
  title: 'Get the Sub-Symptom-Threshold Trainer',
  robots: 'noindex, nofollow',
}

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
        background: 'radial-gradient(120% 80% at 80% -10%, #eaf3f3 0%, #f4f8f8 45%, #eef4f4 100%)',
      }}
    >
      {/* ===== NAV ===== */}
      <nav className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-8 py-[22px]">
        <div className="flex items-center gap-[11px]">
          <Logo />
          <span className="text-[18px] font-extrabold leading-none tracking-[-0.02em]">SST&nbsp;Trainer</span>
        </div>
        <div className="flex items-center gap-[30px]">
          <Link href="/preseason" className="text-sm font-semibold leading-none text-[#3b4f52]">
            For clinicians
          </Link>
          <a href="#" className="text-sm font-semibold leading-none text-[#3b4f52]">
            Evidence
          </a>
          <a href="#" className="text-sm font-semibold leading-none text-[#3b4f52]">
            Pricing
          </a>
          <Link
            href="/sst-trainer"
            className="rounded-xl bg-[#5b9aa6] px-[18px] py-[11px] text-sm font-bold leading-none text-white shadow-[0_8px_18px_-8px_rgba(91,154,166,0.8)] transition-transform active:scale-[0.98]"
          >
            Get the app
          </Link>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-8 pb-16 pt-10">
        {/* left: copy */}
        <div className="flex min-w-0 flex-1 basis-[400px] flex-col gap-[22px]">
          <span className="text-xs font-bold uppercase leading-none tracking-[0.14em] text-[#5b9aa6]">
            Prescribed exercise-rehab platform
          </span>
          <h1 className="m-0 text-[clamp(36px,4.6vw,58px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Recovery, paced to your threshold.
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-[#42565a]">
            One platform finds your heart-rate threshold, prescribes a safe training band, and steps it up as you
            recover — across concussion, cancer rehab, dysautonomia and cardiac care. Set up and overseen by your
            clinician.
          </p>

          {/* store badges */}
          <div className="mt-1 flex flex-wrap gap-3">
            <Link
              href="/sst-trainer"
              className="flex items-center gap-[11px] rounded-[14px] bg-[#16282b] px-[18px] py-[11px] text-white transition-transform active:scale-[0.98]"
            >
              <svg viewBox="0 0 384 512" width="22" height="22" fill="#fff" aria-hidden="true">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C40.6 141.9-.1 184.7-.1 273.1c0 26.1 4.8 53.1 14.4 80.9 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.6-90-61.6-91.2zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
              <span className="flex flex-col leading-none">
                <span className="text-[10px] font-medium leading-[1.3] opacity-80">Download on the</span>
                <span className="text-[16px] font-bold leading-[1.1]">App Store</span>
              </span>
            </Link>
            <Link
              href="/sst-trainer"
              className="flex items-center gap-[11px] rounded-[14px] bg-[#16282b] px-[18px] py-[11px] text-white transition-transform active:scale-[0.98]"
            >
              <svg viewBox="0 0 512 512" width="20" height="20" aria-hidden="true">
                <path d="M48 32 296 256 48 480c-9 4-32-2-32-26V58C16 34 39 28 48 32z" fill="#5b9aa6" />
                <path d="M48 32l180 158 52-52L96 24C72 12 56 22 48 32z" fill="#7fc0c9" />
                <path d="M48 480l180-158 52 52L96 488c-24 12-40 2-48-8z" fill="#3c7681" />
                <path d="M380 196l48 30c22 14 22 46 0 60l-48 30-60-60 60-60z" fill="#a9d6db" />
              </svg>
              <span className="flex flex-col leading-none">
                <span className="text-[10px] font-medium leading-[1.3] opacity-80">Get it on</span>
                <span className="text-[16px] font-bold leading-[1.1]">Google Play</span>
              </span>
            </Link>
          </div>
          <p className="m-0 text-[13px] font-medium leading-[1.5] text-[#849c9c]">
            Free to start. Installs in seconds — and no clinic hardware required.
          </p>
        </div>

        {/* right: animated product tour */}
        <SstHomepageDemo />
      </header>

      {/* ===== DEVICES / HR SOURCES ===== */}
      <section className="mx-auto max-w-[1180px] px-8 pb-14 pt-2">
        <div className="rounded-[22px] bg-[#16282b] px-9 py-8">
          <div className="mb-[22px] flex max-w-[660px] flex-col gap-1.5">
            <span className="text-xs font-bold uppercase leading-none tracking-[0.1em] text-[#5eead4]">
              Compatible devices
            </span>
            <span className="text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
              Works with the wearable you already own.
            </span>
            <span className="text-sm leading-[1.45] text-[#a7c2c5]">
              Live heart rate streams straight into every session — no clinic hardware. Download once, install in
              seconds.
            </span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(178px,1fr))' }}>
            {DEVICES.map((d) => {
              const tagColor = d.live ? '#5eead4' : '#f0c674'
              return (
                <div
                  key={d.name}
                  className="flex flex-col gap-[9px] rounded-2xl p-[15px]"
                  style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.13)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="flex flex-none items-center justify-center text-[17px] text-white"
                      style={{ width: 34, height: 34, borderRadius: 10, background: d.tint }}
                    >
                      {d.glyph}
                    </span>
                    <span
                      className="flex items-center gap-[5px] text-[9px] font-bold uppercase leading-none tracking-[0.04em]"
                      style={{ color: tagColor }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: tagColor }} />
                      {d.tag}
                    </span>
                  </div>
                  <span className="text-[14px] font-bold leading-[1.1] text-white">{d.name}</span>
                  <span className="text-[11.5px] leading-[1.35] text-[#a7c2c5]">{d.method}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-[18px] text-[11.5px] leading-[1.4] text-[#7c9598]">
            A Bluetooth chest strap gives the most accurate reading; Fitbit syncs near-real-time via its API. No
            wearable? Your phone camera reads your pulse.
          </p>
        </div>
      </section>

      {/* ===== VALUE PROPS ===== */}
      <section
        className="mx-auto grid max-w-[1180px] gap-5 px-8 pb-[72px]"
        style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}
      >
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
            <span
              className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#e7f2f3] text-[18px] font-bold leading-none text-[#3c7681]"
              style={{ fontFamily: 'var(--font-space)' }}
            >
              {c.mark}
            </span>
            <h3 className="mb-[7px] mt-3.5 text-[17px] font-extrabold leading-[1.15] tracking-[-0.01em]">{c.title}</h3>
            <p className="m-0 text-[13.5px] leading-[1.5] text-[#5d7174]">{c.body}</p>
          </div>
        ))}
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-[#e2ecec]">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3.5 px-8 py-[26px]">
          <div className="flex items-center gap-[9px]">
            <Logo size={22} />
            <span className="text-sm font-bold leading-none">SST Trainer</span>
          </div>
          <span className="text-xs leading-[1.4] text-[#849c9c]">
            Not a diagnosis or a return-to-play clearance. Set up and overseen by your clinician.
          </span>
        </div>
      </footer>
    </div>
  )
}
