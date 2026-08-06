'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SessionProvider, useSession } from '@/contexts/SessionContext'
import {
  Lock,
  ArrowRight,
  ChevronLeft,
  ClipboardList,
  Copy,
  Check,
  ExternalLink,
  Mail,
  Repeat,
  Share2,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { useClinicalAccess } from '@/components/clinical/useClinicalAccess'
import { ClinicalTestingComingSoon } from '@/components/clinical/ClinicalTestingComingSoon'
import { BaselineLaptopVisual } from '@/components/clinical/InstrumentVisuals'

/**
 * /clinical-testing/baseline — the pre-season baseline tool's own portal page
 * (owner: each instrument gets a baked-in portal inside the main CEA portal;
 * this pair is flagship). Club link management + the athlete-flow preview;
 * reports are delivered to the clinic inbox by design.
 */
export default function BaselinePortalPage() {
  return (
    <SessionProvider>
      <ProtectedRoute>
        <Shell />
      </ProtectedRoute>
    </SessionProvider>
  )
}

interface Clinic {
  code: string
  clinicName: string
  viewKey: string
}

function CopyChip({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1800)
        })
      }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  )
}

const STEPS = [
  {
    icon: Share2,
    title: 'Share your club link',
    body: 'Send it to team managers, coaches or parents — athletes open it on any computer, no app, no account.',
  },
  {
    icon: ClipboardList,
    title: 'Athletes self-complete (~5 min)',
    body: 'Symptom scale, orientation, immediate memory, concentration, delayed recall and oculomotor screening — the self-administrable SCAT6 sections.',
  },
  {
    icon: Mail,
    title: 'Reports land in your inbox',
    body: 'A PDF report per athlete is emailed to your clinic, and every record is stored against your code.',
  },
  {
    icon: Repeat,
    title: 'Repeat-test when it matters',
    body: 'Post-injury, the athlete’s baseline is on file for comparison — the reason pre-season testing exists.',
  },
]

function Shell() {
  const { user, isLoading } = useSession()
  const access = useClinicalAccess()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loaded, setLoaded] = useState(false)
  // A FAILED lookup is not "you have no clinic code". Collapsing the two told
  // an established club-testing clinic to "create your clinic code first" and
  // pushed them at a form that would have minted nothing — while their real
  // club link sat one reload away.
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    // Gate on the resolved access DOOR — 'sst' trial clinics are
    // accessLevel 'preview' but must load their clinic; demo viewers get
    // the synthetic DEMO00 (2026-08-05 round-3 #2).
    const canFetch = access === 'owner' || access === 'course' || access === 'sst' || access === 'demo'
    if (!canFetch) return
    void fetch('/api/clinical-testing/clinic', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => setClinic(d?.clinic ?? null))
      .catch(() => setLoadFailed(true))
      .finally(() => setLoaded(true))
  }, [access])

  if (isLoading || access === 'loading') {
    return (
      <div className="flex min-h-screen dashboard-bg">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </div>
    )
  }

  // PRE-RELEASE (owner directive 2026-07-05): only the owner's test dash
  // sees the suite until the subscription launch — regardless of tier.
  if (access === 'unreleased') {
    return <ClinicalTestingComingSoon />
  }

  if (access === 'locked') {
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
                Pre-Season Baseline Testing
              </h1>
              <div className="mx-auto mb-5 max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-left">
                <BaselineLaptopVisual />
                <p className="mt-3 mb-0 text-xs text-slate-500">One club link · ~5 min per athlete · PDF report to your clinic inbox.</p>
                <a href="/preseason/b/DEMO00" target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-bold text-[#b45309]">Run the athlete demo →</a>
              </div>
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

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://portal.concussion-education-australia.com'
  const baselineUrl = clinic ? `${origin}/preseason/b/${encodeURIComponent(clinic.code)}` : ''

  return (
    <div className="flex min-h-screen dashboard-bg">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/clinical-testing"
            className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Clinical Testing
          </Link>

          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
            SCAT6 baseline — self-administered
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-2">
            Pre-Season Baseline Testing
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xl">
            One link covers your whole club. Athletes self-complete the baseline; you get the
            report and the record for the day you need to compare.
          </p>

          {/* club link card */}
          <div className="glass-premium rounded-2xl p-6 sm:p-8 mb-5">
            {clinic ? (
              <>
                <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-accent mb-0.5">
                  {clinic.clinicName}
                </p>
                <h2 className="text-lg font-bold text-foreground tracking-tight mb-3">
                  Your club link
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="max-w-full truncate rounded-lg bg-slate-100 px-3 py-2 text-[12px] text-slate-700">
                    {baselineUrl}
                  </code>
                  <CopyChip text={baselineUrl} label="Copy club link" />
                  <CopyChip text={clinic.code} label="Copy code" />
                </div>
                <p className="mt-2 text-[11.5px] text-muted-foreground">
                  Reports go to the email your clinic code was set up with.
                </p>
              </>
            ) : loadFailed ? (
              <>
                <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
                  Couldn&rsquo;t load your clinic
                </h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-0">
                  This is a loading failure, not a missing clinic code — refresh to retry. If you
                  already run baseline testing, your existing club link is unchanged.
                </p>
              </>
            ) : loaded ? (
              <>
                <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
                  Create your clinic code first
                </h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                  Your baseline club link is generated from your clinic code — one field on the
                  Clinical Testing page sets up both tools.
                </p>
                <Link
                  href="/clinical-testing"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors shadow-sm"
                >
                  Create my clinic code
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Loading your clinic…</p>
            )}
          </div>

          {/* how it works */}
          <div className="glass-premium rounded-2xl p-6 sm:p-8 mb-5">
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">How it runs</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {STEPS.map((s) => (
                <div key={s.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-none">
                    <s.icon className="w-4 h-4 text-accent" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground mb-0.5">{s.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* try it */}
          <div className="glass-premium rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1.5">
              See what your athletes see
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
              Run the demo baseline yourself — same flow, nothing saved against your clinic.
            </p>
            <a
              href="/preseason/b/DEMO00"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 transition-colors shadow-sm"
            >
              Preview the athlete flow
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
