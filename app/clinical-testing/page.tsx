'use client'

import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import { Lock, ArrowRight, HeartPulse, ClipboardList, ExternalLink } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * /clinical-testing — the live patient tools, primary in the paid toolkit
 * (owner directive 2026-07-04): the SST Trainer (full self-guided version on
 * the gated /platform/app surface) and pre-season SCAT6 baseline testing.
 * These are the instruments the course teaches clinicians to use — they lead
 * the toolkit rather than hiding behind document templates.
 */
export default function ClinicalTestingPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

const TOOLS: {
  icon: typeof HeartPulse
  title: string
  tag: string
  body: string
  href: string
  cta: string
  external?: boolean
}[] = [
  {
    icon: HeartPulse,
    title: 'SST Trainer',
    tag: 'Exercise rehab — measured threshold',
    body: 'Run the Buffalo-protocol graded test to measure a patient’s heart-rate threshold, prescribe the 80–90% sub-symptom training band, and track verified sessions and the serial-HRt recovery trajectory. Works with the patient’s own watch (Garmin, Polar, WHOOP, straps) — live heart rate, verified progression, clinician oversight via your clinic code.',
    href: '/platform/app',
    cta: 'Open the SST Trainer',
  },
  {
    icon: ClipboardList,
    title: 'Pre-Season Baseline Testing',
    tag: 'SCAT6 baseline — self-administered',
    body: 'Register your clinic, share one link with your sports clubs, and athletes complete the self-administered SCAT6 baseline on any computer in about five minutes. A PDF report lands in your clinic inbox for every athlete, and records are stored for repeat-test comparison when it matters.',
    href: '/preseason',
    cta: 'Set up baseline testing',
    external: true,
  },
]

function Shell() {
  const { user, isLoading } = useSession()
  const isPreview = !user || user.accessLevel === 'preview'

  if (isLoading) {
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </div>
    )
  }

  if (isPreview) {
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="glass-premium rounded-2xl p-8 sm:p-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-700 mb-2">
                Paid course content
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-3">
                Clinical Testing
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-lg mx-auto">
                The live patient instruments — the SST Trainer (measured heart-rate-threshold
                exercise rehab) and self-administered pre-season SCAT6 baseline testing for your
                clubs and teams.
              </p>
              <a
                href={CONFIG.SHOP_URL}
                className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
              >
                Unlock with Concussion Clinical Mastery
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
            Clinical testing
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Your patient instruments
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-xl">
            The tools the course trains you on, live and ready for patients — exercise-rehab
            prescription from a measured threshold, and baseline testing for the clubs you cover.
          </p>

          <div className="grid grid-cols-1 gap-5">
            {TOOLS.map((t) => (
              <div key={t.title} className="glass-premium rounded-2xl p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-none">
                    <t.icon className="w-5 h-5 text-accent" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
                      {t.tag}
                    </p>
                    <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
                      {t.title}
                    </h2>
                    <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                      {t.body}
                    </p>
                    <a
                      href={t.href}
                      target={t.external ? '_blank' : undefined}
                      rel={t.external ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors shadow-sm"
                    >
                      {t.cta}
                      {t.external ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
