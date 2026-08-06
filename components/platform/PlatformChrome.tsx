import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// Shared chrome for the SST Trainer platform site (/platform/*).
// Faithful to the "CEA-Site" build: Hanken Grotesk, navy #16243f, green #3c7a1f.
// Nav: Home · For clinicians · Evidence · Pricing · Get the app (navy button).
// Gated + noindex via the route-group layout; not linked from public nav.
// ─────────────────────────────────────────────────────────────────────────────

export const PLATFORM = {
  navy: '#16243f',
  green: '#3c7a1f',
  greenBright: '#54a531',
  slate: '#334155',
  ink: '#0f172a',
  cream: '#f4f8f8',
} as const

export function PlatformLogo({ stroke = PLATFORM.navy, size = 30 }: { stroke?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 42" width={(size / 30) * 34} height={size} fill="none" stroke={stroke} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M24 9 C21.5 5.5 15.5 5 13 8.5 C9 8 6 11.5 7.5 15 C3.8 17 3.8 22.5 7.8 24 C6.5 28.5 10.5 32.5 15 30.8 C16.5 34 21.5 34 24 31" />
      <path d="M24 9 C26.5 5.5 32.5 5 35 8.5 C39 8 42 11.5 40.5 15 C44.2 17 44.2 22.5 40.2 24 C41.5 28.5 37.5 32.5 33 30.8 C31.5 34 26.5 34 24 31" />
      <path d="M24 9 V31" />
      <path d="M16 13 C19 14 19 17 16.5 18" />
      <path d="M32 13 C29 14 29 17 31.5 18" />
      <path d="M13 21 C16 21 17 23 15 25" />
      <path d="M35 21 C32 21 31 23 33 25" />
    </svg>
  )
}

// 'Home' and 'The suite' both pointed at /clinical-suite — two nav items to the
// same page, and (because the list is keyed by href) a duplicate React key. The
// wordmark on the left is already the home link, so the suite entry stands alone.
const NAV_LINKS = [
  { href: '/clinical-suite', label: 'The suite' },
  { href: '/clinical-suite/evidence', label: 'Evidence' },
  { href: '/clinical-suite/pricing', label: 'Pricing' },
]

// Normalise a path to its route segment so the active check works whichever
// prefix a caller passes — the pages historically pass `/platform/*` while the
// canonical hrefs are `/clinical-suite/*` (the /platform funnel now redirects
// here). Without this, `active === l.href` never matched and no item highlighted.
const navSeg = (p?: string) => (p ?? '').replace(/^\/(platform|clinical-suite)/, '') || '/'

export function PlatformNav({ active }: { active?: string }) {
  const activeSeg = navSeg(active)
  return (
    <nav className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-5">
      <Link href="/clinical-suite" className="flex items-center gap-[11px]">
        <PlatformLogo />
        <span className="flex flex-col leading-[1.05]">
          <span className="text-[15px] font-extrabold tracking-[-0.01em] text-[#16243f]">Concussion Education</span>
          <span className="text-[11px] font-bold tracking-[0.04em] text-[#3c7a1f]">AUSTRALIA</span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-6">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-[14px] ${activeSeg === navSeg(l.href) ? 'font-bold text-[#16243f]' : 'font-semibold text-slate-700 hover:text-[#16243f]'}`}
          >
            {l.label}
          </Link>
        ))}
        {/* /platform/app is the PAID self-guided surface — its layout redirects
            any visitor without a clinical entitlement to /login (verified live
            2026-08: 200 + NEXT_REDIRECT to /login?redirect=%2Fplatform%2Fapp),
            so a public "Get the app" button pointed at a sign-in wall. The
            public patient entry is /sst-trainer (installable PWA, clinic code,
            no account) — that is what this button promises. */}
        <Link
          href="/sst-trainer"
          className="rounded-full bg-[#16243f] px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-[#1f3357]"
        >
          Get the app
        </Link>
      </div>
    </nav>
  )
}

export function PlatformFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/40">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#16243f] text-[13px] font-extrabold tracking-tight text-white">
            CEA
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-[#16243f]">Concussion Education Australia</p>
            <p className="text-[11.5px] text-slate-500">Sub-Symptom-Threshold Trainer</p>
          </div>
        </div>
        <p className="max-w-md text-[11.5px] leading-relaxed text-slate-500 sm:text-right">
          A training and monitoring tool for clinician-supervised graded return. Not a diagnostic device;
          does not diagnose or treat concussion. Set up and overseen by your clinician.
        </p>
      </div>
    </footer>
  )
}
