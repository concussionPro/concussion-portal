import Link from 'next/link'
import { CONFIG } from '@/lib/config'
import { PlatformNav, PlatformFooter, PLATFORM } from '@/components/platform/PlatformChrome'

// ─────────────────────────────────────────────────────────────────────────────
// SST Trainer platform homepage (/platform).
// Faithful to the "CEA-Site" index build: navy #16243f, green #3c7a1f,
// teal-tint cream radial background, Hanken Grotesk (applied by parent layout).
// Server component — the hero device mockup is rendered as a static still of
// the "Find your threshold" screen. Gating + noindex live in layout.tsx.
// ─────────────────────────────────────────────────────────────────────────────

// Honest device story: wrist watches stream live HR via their standard
// Bluetooth heart-rate BROADCAST mode (readable by Web Bluetooth) — never
// imply HealthKit / Connect IQ / Fitbit API integrations (none exist).
const DEVICES = [
  { name: 'Garmin · broadcast', glyph: '⌚', tint: '#0b7fab' },
  { name: 'Polar · watch or strap', glyph: '◍', tint: '#d2463a' },
  { name: 'WHOOP · broadcast', glyph: '▬', tint: '#0f172a' },
  { name: 'Suunto / Coros · broadcast', glyph: '⌚', tint: '#1d2325' },
  { name: 'Any Bluetooth chest strap', glyph: '◍', tint: '#3c7a1f' },
  { name: 'Phone camera · resting check', glyph: '◎', tint: '#5d7174' },
]

const NAV_CARDS = [
  {
    href: '/platform/clinicians',
    title: 'For clinicians →',
    body: 'Prescribe, oversee & track recovery.',
    accent: false,
  },
  {
    href: '/platform/evidence',
    title: 'The evidence →',
    body: 'The Buffalo protocol, and the trials behind it.',
    accent: false,
  },
  {
    // /platform/pricing redirects to the course pricing — say so BEFORE the
    // click (Zac 2026-07-27: "its not implicit that its bundled"). The platform
    // isn't sold separately; it comes with enrolment.
    href: '/platform/pricing',
    title: 'Pricing →',
    body: 'Included with course enrolment — every CCM & CRM enrolment ships the full platform. Free for patients.',
    accent: true,
  },
]

const FEATURES = [
  {
    glyph: '℞',
    title: 'Prescribe & progress',
    body: 'Not a tracker. We find your threshold, prescribe the band, and step it up as you recover — within a symptom-defined ceiling.',
  },
  {
    glyph: '⇄',
    title: 'The clinician loop',
    body: 'Your exercise physiologist sets and oversees the threshold; your recovery curve flows straight back to them.',
  },
  {
    glyph: '✓',
    title: 'Built on the evidence',
    body: 'The Buffalo protocol and sub-symptom-threshold training, delivered live mid-exercise — your heart rate and band on screen for the whole session.',
  },
]

// Honest install CTA — no store badges until the listings are actually live.
// When SST_IOS_APP_LIVE flips (Apple ID 6792171738, auto-release on approval)
// the App Store link appears and the browser-install copy stops claiming "no
// app store needed" — the two claims must never coexist.
function InstallCta() {
  const iosLive = CONFIG.FEATURES.SST_IOS_APP_LIVE
  return (
    <div className="mt-1 flex flex-wrap items-center gap-3">
      <Link
        href="/platform/app"
        className="rounded-[14px] px-[22px] py-[15px] text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5"
        style={{ background: PLATFORM.navy }}
      >
        {iosLive ? 'Install in 60 seconds — Android & desktop' : 'Install in 60 seconds — no app store needed'}
      </Link>
      {iosLive && (
        <a
          href={CONFIG.SST_APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[14px] px-[22px] py-[15px] text-[15px] font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: '#000' }}
        >
           Download on the App Store
        </a>
      )}
      <Link
        href="/platform/clinicians"
        className="rounded-[14px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[14px] text-[15px] font-bold transition-colors hover:border-slate-400"
        style={{ color: PLATFORM.navy }}
      >
        For clinicians →
      </Link>
    </div>
  )
}

// Static still of the "Find your threshold" app screen shown in the device mockup.
function ThresholdScreen() {
  const arcEnd =
    'M 120 26 A 94 94 0 1 1 27.664998431503278 137.6138435710582'
  return (
    <div className="absolute inset-0 flex flex-col gap-3 px-[18px] pb-[14px] pt-[6px]">
      {/* HR ring + live heart rate */}
      <div className="flex items-center gap-3">
        <div className="relative h-24 w-24 flex-none">
          <svg viewBox="0 0 240 240" width="100%" height="100%" className="block">
            <circle cx="120" cy="120" r="94" fill="none" stroke="#dde7e7" strokeWidth="11" />
            <path d={arcEnd} fill="none" stroke="#16243f" strokeWidth="11" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[8px] font-bold leading-none tracking-[0.12em] text-[#849c9c]">MIN</span>
            <span className="font-['Space_Grotesk'] text-[34px] font-semibold leading-[0.9] text-[#16243f]">7</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-semibold uppercase leading-none tracking-[0.05em] text-[#849c9c]">
            Live heart rate
          </span>
          <span className="flex items-baseline gap-1">
            <span className="font-['Space_Grotesk'] text-[40px] font-semibold leading-[0.9] text-[#16243f]">139</span>
            <span className="text-[10px] font-semibold leading-none text-[#9bafb0]">BPM</span>
          </span>
          <span className="text-[10px] leading-[1.3] text-[#9bafb0]">rested 1/10 · from watch</span>
        </div>
      </div>

      <span className="text-[11px] font-semibold leading-none text-[#3b4f52]">Any of your symptoms now?</span>

      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[#16243f] px-3 py-[7px] text-[11px] font-semibold leading-none text-white">
          Headache
        </span>
        <span className="rounded-full border-[1.5px] border-[#d4e0e1] px-3 py-[7px] text-[11px] font-semibold leading-none text-[#5d7174]">
          Dizziness
        </span>
        <span className="rounded-full border-[1.5px] border-[#d4e0e1] px-3 py-[7px] text-[11px] font-semibold leading-none text-[#5d7174]">
          Light
        </span>
      </div>

      <div className="flex items-center gap-[9px]">
        <span className="text-[11px] font-semibold leading-none text-[#3b4f52]">Symptoms</span>
        <div className="flex flex-1 items-center gap-[3px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="h-4 flex-1 rounded-[3px]"
              style={{ background: i < 4 ? '#16243f' : '#d8e4e4' }}
            />
          ))}
        </div>
        <span className="font-['Space_Grotesk'] text-[13px] font-semibold leading-none text-[#3c7a1f]">4</span>
      </div>

      <div className="rounded-[13px] bg-[#3c7a1f] p-[13px] text-center text-[12px] font-bold leading-none text-white">
        Log — this reaches your threshold
      </div>
    </div>
  )
}

function DeviceMockupCard() {
  return (
    <div
      className="relative min-w-0 flex-[1_1_420px] overflow-hidden rounded-[24px] border border-[#e2ecec] bg-white"
      style={{
        boxShadow:
          'rgba(22, 40, 43, 0.35) 0px 40px 80px -30px, rgba(22, 40, 43, 0.18) 0px 12px 28px -16px',
      }}
    >
      {/* Demo header bar */}
      <div className="flex items-center justify-between border-b border-[#f2f8eb] px-[18px] py-[13px]">
        <div className="flex items-center gap-[9px]">
          <span className="flex items-center gap-1.5 rounded-full bg-[#fbeae8] px-[9px] py-1 text-[10px] font-bold leading-none tracking-[0.06em] text-[#d2463a]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#d2463a]" />
            DEMO
          </span>
          <span className="text-[13px] font-semibold leading-none text-[#3b4f52]">SST Trainer · product tour</span>
        </div>
        <span className="font-['Space_Grotesk'] text-[12px] font-medium leading-none text-[#849c9c] tabular-nums">
          0:03 / 0:16
        </span>
      </div>

      {/* Stage with the phone/watch device */}
      <div
        className="relative flex items-center justify-center"
        style={{
          height: 486,
          background: 'radial-gradient(120% 90% at 50% 0%, rgb(230, 243, 218), rgb(219, 231, 231))',
        }}
      >
        <div className="relative h-[340px] w-[280px]">
          {/* side buttons */}
          <div
            className="absolute"
            style={{
              right: -5,
              top: 120,
              width: 8,
              height: 40,
              borderRadius: 5,
              background: 'linear-gradient(rgb(90,102,105), rgb(43,49,51))',
            }}
          />
          <div
            className="absolute"
            style={{
              right: -4,
              top: 172,
              width: 6,
              height: 52,
              borderRadius: 4,
              background: 'linear-gradient(rgb(74,85,87), rgb(37,43,45))',
            }}
          />
          {/* device frame */}
          <div
            className="h-full w-full p-[11px]"
            style={{
              borderRadius: 64,
              background:
                'linear-gradient(148deg, rgb(69,79,81), rgb(29,35,37) 55%, rgb(51,59,61))',
              boxShadow:
                'rgba(20,40,42,0.6) 0px 22px 44px -18px, rgba(255,255,255,0.18) 0px 2px 3px inset',
            }}
          >
            <div className="relative h-full w-full overflow-hidden rounded-[54px] bg-[#f4f8f8]">
              {/* status bar */}
              <div className="absolute left-0 right-0 top-0 z-[5] flex items-center justify-between px-5 pb-1.5 pt-[9px]">
                <span className="flex items-center gap-[5px] text-[9px] font-bold leading-none tracking-[0.12em] text-[#16243f]">
                  <span className="inline-block h-[7px] w-[7px] rounded-full border-[1.5px] border-[#16243f]" />
                  SST
                </span>
                <span className="font-['Space_Grotesk'] text-[11px] font-medium leading-none text-[#16243f]">7:32</span>
                <span className="relative inline-block h-2 w-4 rounded-[2px] border-[1.5px] border-[#97a7a9]">
                  <span className="absolute inset-y-px left-px right-1 rounded-[1px] bg-[#16243f]" />
                </span>
              </div>
              {/* screen content */}
              <div className="absolute inset-x-0 bottom-0" style={{ top: 30 }}>
                <ThresholdScreen />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player scrubber */}
      <div className="flex items-center gap-3.5 border-t border-[#f2f8eb] bg-white px-[18px] py-3.5">
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-[#16243f]">
          <span
            className="ml-0.5 block h-0 w-0"
            style={{ borderStyle: 'solid', borderWidth: '6px 0 6px 10px', borderColor: 'transparent transparent transparent #fff' }}
          />
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[#e2ecec]">
          <div className="h-full rounded-[3px] bg-[#16243f]" style={{ width: '21.4%' }} />
        </div>
        <span className="whitespace-nowrap font-['Space_Grotesk'] text-[11px] font-medium leading-none text-[#849c9c] tabular-nums">
          0:03 / 0:16
        </span>
      </div>

      {/* chapter ticks */}
      <div className="flex gap-[7px] bg-white px-[18px] pb-4">
        {['Your daily home', 'Find your threshold', 'Your training band', 'Live, in-band', 'Progress'].map(
          (label, i) => (
            <div key={label} className="flex flex-1 flex-col gap-[5px]">
              <span
                className="h-[3px] rounded-[2px]"
                style={{ background: i <= 1 ? '#16243f' : '#dde7e7' }}
              />
              <span
                className="text-left text-[9px] font-semibold leading-[1.1]"
                style={{ color: i === 1 ? '#16243f' : '#9bafb0' }}
              >
                {label}
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

export default function PlatformHome() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          'radial-gradient(120% 80% at 80% -10%, rgb(234, 243, 243) 0%, rgb(244, 248, 248) 45%, rgb(242, 248, 235) 100%)',
        color: PLATFORM.navy,
      }}
    >
      <PlatformNav active="/platform" />

      {/* Hero */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-8 pb-16 pt-10">
        <div className="flex flex-[1_1_400px] flex-col gap-[22px]">
          <span className="text-[12px] font-bold uppercase leading-none tracking-[0.14em] text-[#16243f]">
            Prescribed exercise-rehab platform
          </span>
          <h1
            className="m-0 font-extrabold tracking-[-0.03em]"
            style={{ fontSize: 'clamp(36px, 4.6vw, 58px)', lineHeight: 1.02 }}
          >
            Recovery, paced to your threshold.
          </h1>
          <p
            className="m-0 max-w-[520px] font-normal text-[#42565a]"
            style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: 1.55 }}
          >
            One platform finds your heart-rate threshold, prescribes a safe training band, and steps it up
            as you recover — for concussion recovery, with further rehabilitation pathways in development.
            Set up and overseen by your clinician.
          </p>

          <InstallCta />
          <p className="m-0 text-[13px] font-medium leading-[1.5] text-[#849c9c]">
            Runs in your browser and installs to your home screen. Free to start — no clinic hardware
            required.
          </p>
        </div>

        <DeviceMockupCard />
      </header>

      {/* Measured, not estimated — the wedge */}
      <section className="mx-auto max-w-[1180px] px-8 pb-14 pt-2">
        <div className="rounded-[22px] border border-[#e2ecec] bg-white px-9 py-9">
          <div className="mb-7 flex max-w-[740px] flex-col gap-2.5">
            <span className="text-[12px] font-bold uppercase leading-none tracking-[0.14em] text-[#3c7a1f]">
              Measured, not estimated
            </span>
            <h2
              className="m-0 font-extrabold tracking-[-0.02em]"
              style={{ fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.1 }}
            >
              The dose is a heart-rate band. We measure where it sits.
            </h2>
            <p className="m-0 text-[15px] font-normal leading-[1.55] text-[#42565a]">
              Sub-symptom aerobic recovery works by training in a heart-rate band set just below the point
              where symptoms intensify. That threshold is individual to you — so SST Trainer measures it
              with a symptom-limited graded exertion test (the Buffalo test), rather than estimating it
              from your age.
            </p>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}
          >
            <div className="rounded-[16px] border border-[#e6d9d7] bg-[#fbf4f3] p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#b2564c]">
                Estimated from age
              </span>
              <p className="mt-3 text-[14px] leading-[1.55] text-[#5d7174]">
                The leading commercial concussion-rehab app, Rhea, prescribes the dose from an age formula
                — a fixed share of 220 − age — with no graded test to individualise it. An age estimate can
                sit 10+ bpm off a given person&apos;s true threshold.
              </p>
              <p className="mt-3 text-[11.5px] leading-[1.4] text-[#9bafb0]">
                Chizuk et al., JMIR Formative Research 2025; Hutchison et al., JMIR Formative Research 2023
              </p>
            </div>
            <div className="rounded-[16px] border border-[#d8ecc4] bg-[#f2f8eb] p-6">
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3c7a1f]">
                Measured from a graded test
              </span>
              <p className="mt-3 text-[14px] leading-[1.55] text-[#3b4f52]">
                SST Trainer finds your own heart-rate threshold on the Buffalo test, then sets the band
                just below it. Only live, verified wearable sessions advance the dose — the band never
                ratchets up on an unverified number, and is capped at your measured threshold.
              </p>
              <p className="mt-3 text-[11.5px] leading-[1.4] text-[#7c9598]">
                Leddy et al., JAMA Pediatrics 2019; Leddy &amp; Willer, Current Sports Medicine Reports 2013
              </p>
            </div>
          </div>

          <p className="mt-6 max-w-[880px] text-[13px] leading-[1.55] text-[#5d7174]">
            The sub-symptom-threshold protocol SST Trainer delivers is endorsed by international consensus
            and supported by randomised-trial evidence (Leddy et al., JAMA Pediatrics 2019; Patricios et
            al., British Journal of Sports Medicine 2023). To our knowledge, no other commercial concussion
            app combines a measured heart-rate threshold, verification-gated training, and a serial
            measured-HRt trajectory your clinician reviews.{' '}
            <Link
              href="/platform/evidence"
              className="font-semibold text-[#3c7a1f] underline underline-offset-2"
            >
              See the sources →
            </Link>
          </p>
        </div>
      </section>

      {/* Compatible devices (navy) + nav cards */}
      <section className="mx-auto max-w-[1180px] px-8 pb-14 pt-2">
        <div className="rounded-[22px] px-9 py-8" style={{ background: PLATFORM.navy }}>
          <div className="mb-[22px] flex max-w-[660px] flex-col gap-1.5">
            <span className="text-[12px] font-bold uppercase leading-none tracking-[0.1em] text-[#8ed35a]">
              Compatible devices
            </span>
            <span className="text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
              Works with the watch you already own.
            </span>
            <span className="text-[14px] font-normal leading-[1.45] text-[#a7c2c5]">
              Garmin, Polar, WHOOP, Suunto, Coros and more stream live heart rate via their heart-rate
              broadcast mode — or pair any Bluetooth chest strap.{' '}
              {CONFIG.FEATURES.SST_IOS_APP_LIVE
                ? 'iPhone (App Store), Android and desktop; no clinic hardware.'
                : 'On Android and desktop today; no clinic hardware.'}
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {DEVICES.map((d) => (
              <span
                key={d.name}
                className="flex items-center gap-[9px] rounded-[12px] border px-[13px] py-[9px]"
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.13)' }}
              >
                <span
                  className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] text-[14px] text-white"
                  style={{ background: d.tint }}
                >
                  {d.glyph}
                </span>
                <span className="text-[13px] font-bold leading-none text-white">{d.name}</span>
              </span>
            ))}
          </div>
          {/* NEVER offer manual HR entry as the iPhone path (owner directive
              2026-07-27) — a self-reported number mid-exercise is exactly what
              the measured-threshold product exists to replace. iPhone = the
              native app: store link when live, clinician-distributed beta
              until then. (Manual entry survives ONLY as an in-app fallback
              whose sessions can never plot as verified.) */}
          <p className="mt-[13px] text-[11.5px] font-normal leading-[1.4] text-[#7c9598]">
            Chest strap = most accurate ·{' '}
            {CONFIG.FEATURES.SST_IOS_APP_LIVE
              ? 'iPhone: native app on the App Store'
              : 'iPhone: native app in App Store review — beta access through your clinician'}{' '}
            · phone-camera pulse check for resting measurements.
          </p>

          {/* Nav cards */}
          <div
            className="mt-6 grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(178px, 1fr))' }}
          >
            {NAV_CARDS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="flex flex-col gap-[5px] rounded-[14px] border p-4 transition-transform hover:-translate-y-0.5"
                style={
                  c.accent
                    ? { background: '#57a82e', borderColor: '#57a82e' }
                    : { background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)' }
                }
              >
                <span className="text-[14px] font-bold leading-[1.1] text-white">{c.title}</span>
                <span
                  className="text-[11.5px] font-normal leading-[1.4]"
                  style={{ color: c.accent ? '#e6f3da' : '#a7c2c5' }}
                >
                  {c.body}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section
        className="mx-auto grid max-w-[1180px] gap-5 px-8 pb-[72px]"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-[18px] border border-[#e2ecec] bg-white p-6"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#e6f3da] font-['Space_Grotesk'] text-[18px] font-bold leading-none text-[#3c7a1f]">
              {f.glyph}
            </span>
            <h3 className="mb-[7px] mt-3.5 text-[17px] font-extrabold leading-[1.15] tracking-[-0.01em]">
              {f.title}
            </h3>
            <p className="m-0 text-[13.5px] font-normal leading-[1.5] text-[#5d7174]">{f.body}</p>
          </div>
        ))}
      </section>

      <PlatformFooter />
    </div>
  )
}
