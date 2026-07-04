import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'

// ─────────────────────────────────────────────────────────────────────────────
// SST Trainer platform site (/platform/*) — the clinic-facing funnel.
//
// PUBLIC funnel (2026-07-05): marketing pages are open for clinic pitching;
// noindex retained for now (direct-link outreach, SEO decision separate).
// The app itself (/platform/app) is gated in its own nested layout.
// ─────────────────────────────────────────────────────────────────────────────

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-hanken',
  display: 'swap',
})
// Space Grotesk = the "instrument" / numeric face the device-framed app
// (/platform/app) uses for HR, scores and clocks (tabular figures), matching the
// /sst-trainer flow. Exposed here as --font-space for the whole platform group.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SST Trainer — Concussion Education Australia',
  description:
    'Prescribed exercise-rehab platform. Reads the patient’s heart-rate threshold, prescribes a safe sub-symptom training band, and steps it up as they recover — clinician-set and overseen.',
  robots: 'noindex, nofollow',
  // Installable PWA (see public/sst.webmanifest + public/sw.js). start_url is
  // /demo/sst so an install lands authenticated. Gating stays in place.
  manifest: '/sst.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'SST Trainer',
    statusBarStyle: 'default',
  },
  icons: {
    apple: [{ url: '/sst-apple-touch-180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16243f',
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // PUBLIC since 2026-07-05 (owner: "we want to start pitching to clinics") —
  // the pre-launch requireAiCourseAccess gate is lifted for the marketing
  // funnel (/platform, /clinicians, /evidence, /pricing, /founding: self-serve
  // clinic provisioning). The APP stays gated: app/platform/app/layout.tsx.
  return (
    <div
      className={`${hanken.variable} ${spaceGrotesk.variable}`}
      style={{ fontFamily: 'var(--font-hanken), ui-sans-serif, system-ui, -apple-system, sans-serif' }}
    >
      {children}
    </div>
  )
}
