import type { Metadata } from 'next'
import Link from 'next/link'
import { Play, Globe, Smartphone, Apple, ArrowRight, Plus } from 'lucide-react'

// "Get the app" front door — demo + all-platform install.
// Unlisted pre-launch; not linked from public nav.
export const metadata: Metadata = {
  title: 'Get the Sub-Threshold Trainer',
  robots: 'noindex, nofollow',
}

// ── Drop your Loom share URL here once recorded. ──────────────────────────────
// Use the loom.com/share/<id> link. We render it as a click-out card (opens in a
// new tab) — reliable. If you'd rather embed it inline, switch to the
// loom.com/embed/<id> iframe AFTER verifying it renders in a real browser
// (some embeds are X-Frame-blocked — see the no-unverified-iframes rule).
const LOOM_URL = '' // e.g. 'https://www.loom.com/share/xxxxxxxx'

const APP_NAME = 'Sub-Threshold Trainer'

export default function GetAppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/40 via-white to-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* Hero */}
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">Concussion Education Australia</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">{APP_NAME}</h1>
        <p className="mt-3 max-w-xl text-lg leading-relaxed text-slate-600">
          Guided sub-symptom-threshold aerobic rehab — find your threshold, train safely in your band, and progress as you
          recover. Works on any device.
        </p>

        {/* Loom-style demo */}
        <div className="mt-8">
          <p className="mb-2 text-sm font-semibold text-slate-700">Watch the 90-second demo</p>
          {LOOM_URL ? (
            <a
              href={LOOM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex aspect-video items-center justify-center rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-sm transition-transform hover:scale-[1.01]"
            >
              <span className="flex flex-col items-center gap-2">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                  <Play className="h-7 w-7" fill="currentColor" />
                </span>
                <span className="text-sm font-semibold">Play the walkthrough</span>
              </span>
            </a>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-400">
              {/* DESIGN+TODO: set LOOM_URL above to your Loom share link */}
              Demo video — add your Loom link
            </div>
          )}
        </div>

        {/* Install — all platforms */}
        <h2 className="mt-12 text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Get it on your device</h2>

        {/* Web — live now */}
        <Link
          href="/sst-trainer"
          className="group mt-4 flex items-center justify-between gap-4 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white"><Globe className="h-6 w-6" /></span>
            <div>
              <p className="font-semibold text-slate-900">Open the web app <span className="ml-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Live</span></p>
              <p className="text-sm text-slate-500">No install — runs in any browser, desktop, tablet or phone.</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-teal-600 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Install to home screen (PWA) */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><Plus className="h-5 w-5 text-slate-600" /></span>
            <p className="font-semibold text-slate-900">Install it on your phone (no app store needed)</p>
          </div>
          <div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <p><span className="font-semibold text-slate-800">iPhone / iPad:</span> open in Safari → tap the Share button → <em>Add to Home Screen</em>.</p>
            <p><span className="font-semibold text-slate-800">Android:</span> open in Chrome → menu (⋮) → <em>Install app / Add to Home screen</em>.</p>
          </div>
        </div>

        {/* App stores — coming soon */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { icon: Apple, label: 'iPhone & Apple Watch', sub: 'App Store — coming soon' },
            { icon: Smartphone, label: 'Android & Wear OS', sub: 'Google Play — coming soon' },
          ].map((p) => {
            const Icon = p.icon
            return (
              <div key={p.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 opacity-80">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-600"><Icon className="h-6 w-6" /></span>
                <div>
                  <p className="font-semibold text-slate-700">{p.label}</p>
                  <p className="text-xs text-slate-400">{p.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          The native Apple Watch / Garmin apps (on-wrist HR + haptics) follow once the web app is validated. The web app
          already reads heart rate from a connected monitor where supported.
        </p>
      </div>
    </div>
  )
}
