import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Join your clinic — SST Trainer',
  robots: { index: false, follow: false },
}

/**
 * /j/[code] — the smart patient join link (QR target). Owner directive
 * 2026-08-03: clinicians need a quick QR/download path for patients.
 *
 * iPhone/iPad scanners get a one-screen chooser: the native app (TestFlight
 * now; the App Store link takes over automatically when SST_IOS_APP_LIVE
 * flips) — because iOS Safari has no Web Bluetooth, so live HR pairing needs
 * the app — plus an honest continue-in-browser fallback (manual HR entry).
 * Every other platform 307s straight into the web app with the code
 * prefilled, exactly as the old direct QR did.
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: raw } = await params
  const code = decodeURIComponent(raw).toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 12)
  const webUrl = `/sst-trainer?clinic=${encodeURIComponent(code)}`

  const ua = (await headers()).get('user-agent') || ''
  const isIos = /iPhone|iPad|iPod/i.test(ua)
  if (!isIos) redirect(webUrl)

  const appHref = CONFIG.FEATURES.SST_IOS_APP_LIVE
    ? CONFIG.SST_APP_STORE_URL
    : CONFIG.SST_TESTFLIGHT_URL || CONFIG.SST_APP_STORE_URL
  const appLabel = CONFIG.FEATURES.SST_IOS_APP_LIVE
    ? 'Get the app on the App Store'
    : 'Get the app (TestFlight)'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f9f9] px-6 py-10">
      <div className="w-full max-w-[420px] rounded-[20px] border border-slate-200 bg-white p-7 shadow-[0_18px_44px_-22px_rgba(22,36,63,.35)]">
        <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">SST Trainer</p>
        <h1 className="m-0 mt-1 text-[22px] font-extrabold leading-tight text-[#16243f]">
          Your clinic invited you
        </h1>
        <div className="mt-4 rounded-[12px] bg-slate-50 px-4 py-3 text-center">
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">Your clinic code</p>
          <p className="m-0 font-mono text-[30px] font-extrabold tracking-[0.14em] text-[#16243f]">{code}</p>
        </div>
        <p className="m-0 mt-4 text-[13.5px] leading-[1.55] text-slate-600">
          On iPhone, the <strong>SST Trainer app</strong> pairs your watch or heart-rate strap live —
          which iPhone browsers can&rsquo;t do. Install it, then enter your clinic code.
        </p>
        <a
          href={appHref}
          className="mt-4 block rounded-[13px] bg-[#16243f] px-5 py-[15px] text-center text-[15px] font-bold text-white"
        >
          {appLabel}
        </a>
        <a
          href={webUrl}
          className="mt-2.5 block rounded-[13px] border border-slate-300 px-5 py-[13px] text-center text-[13.5px] font-bold text-[#16243f]"
        >
          Continue in the browser instead
        </a>
        <p className="m-0 mt-2.5 text-center text-[11.5px] leading-snug text-slate-400">
          The browser version works too — you&rsquo;ll type your heart rate each minute instead of live pairing.
        </p>
      </div>
    </main>
  )
}
