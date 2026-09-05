'use client'

import { useCallback, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  GraduationCap,
  HeartPulse,
  Check,
  ArrowRight,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Wrench,
} from 'lucide-react'
import { CONFIG } from '@/lib/config'

// ─────────────────────────────────────────────────────────────────────────────
// Dual-tab course hub — toggles between the two CEA concussion CPD streams.
//   • Allied Health  → Concussion Clinical Mastery (CCM), OA-endorsed
//   • Exercise Phys. → Concussion Rehab Mastery   (CRM), EP-scoped, ESSA-gated
//
// Deep-link: ?stream=ep opens the EP tab (the ESSA newsletter links here);
// ?stream=allied (or absent) opens the Allied tab. Switching tabs rewrites the
// URL via replaceState so the current view is shareable without a reload.
//
// ESSA claim is flag-gated (CONFIG.FEATURES.ESSA_ACCREDITED): NEVER claim
// accredited while the flag is false — show the "accreditation pending" line.
// All prices derive from CONFIG, never hardcoded.
// ─────────────────────────────────────────────────────────────────────────────

type StreamId = 'allied' | 'ep'

const PRICE_ONLINE = CONFIG.COURSE.PRICE_ONLINE.toLocaleString()
const PRICE_EARLY_BIRD = CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()

// CPD hours derive from CONFIG (the header contract said prices did; the CPD
// numbers were still literals, which is exactly how the stale 6/14 grid on
// /assessment survived the 2026-07-30 OA re-rate).
const CPD_LINE = `${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours online · ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours with the workshop`

// ESSA line depends ONLY on the real flag — pending until the certificate lands.
const ESSA_LINE = CONFIG.FEATURES.ESSA_ACCREDITED
  ? `ESSA-accredited · ${CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS} ESSA CPD points`
  : 'Built to ESSA CPD standards · accreditation pending'

type Stream = {
  id: StreamId
  tabLabel: string
  courseName: string
  code: string
  icon: typeof GraduationCap
  whoFor: string
  format: string
  cpd: string
  credential: string
  covers: string[]
  priceLine: string
  ctas: { label: string; href: string; primary?: boolean }[]
}

const STREAMS: Record<StreamId, Stream> = {
  allied: {
    id: 'allied',
    tabLabel: 'Allied Health',
    courseName: 'Concussion Clinical Mastery',
    code: 'CCM',
    icon: GraduationCap,
    whoFor:
      'Osteopaths, physiotherapists, chiropractors and allied-health clinicians managing concussion in multidisciplinary teams.',
    format: `${CONFIG.COURSE.TOTAL_MODULES} online modules, self-paced, plus an optional full-day hands-on workshop.`,
    cpd: CPD_LINE,
    credential: 'Endorsed by Osteopathy Australia · AHPRA-aligned',
    covers: [
      'SCAT6 & SCOAT6 assessment',
      'VOMS & BESS testing',
      'Return-to-play, work and school protocols',
      'Phenotype-based rehabilitation pathways',
      'Hands-on practical examination (workshop)',
    ],
    priceLine: `From $${PRICE_ONLINE} online · $${PRICE_EARLY_BIRD} early-bird complete`,
    ctas: [
      { label: 'View pricing & enrol', href: '/pricing', primary: true },
      { label: 'Explore the course', href: '/course' },
      { label: 'Try Module 1 free', href: '/preview' },
    ],
  },
  ep: {
    id: 'ep',
    tabLabel: 'Exercise Physiologists',
    courseName: 'Concussion Rehab Mastery',
    code: 'CRM',
    icon: HeartPulse,
    whoFor:
      'Accredited Exercise Physiologists and Exercise Scientists delivering concussion rehabilitation within EP scope.',
    format: `${CONFIG.COURSE.TOTAL_MODULES} modules online and self-paced, plus the shared full-day hands-on workshop.`,
    cpd: CPD_LINE,
    credential: ESSA_LINE,
    covers: [
      'Sub-symptom-threshold aerobic exercise as first-line rehab',
      'Concussion rehab as exercise medicine, EP-scoped',
      'BCTT calculator for graded exercise testing',
      'SSTAE prescription templates',
      'Turnkey documentation & referral pack',
    ],
    priceLine: `From $${PRICE_ONLINE} online`,
    ctas: [{ label: 'See the EP course', href: '/concussion-rehab-mastery', primary: true }],
  },
}

const TAB_ORDER: StreamId[] = ['allied', 'ep']

function parseStream(raw: string | null): StreamId {
  return raw === 'ep' ? 'ep' : 'allied'
}

export function CourseStreams() {
  const searchParams = useSearchParams()
  const [stream, setStream] = useState<StreamId>(() => parseStream(searchParams.get('stream')))

  const selectStream = useCallback((id: StreamId) => {
    setStream(id)
    // Keep the URL shareable — reflect the active tab without a navigation.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('stream', id)
      window.history.replaceState(null, '', url.toString())
    }
  }, [])

  const active = STREAMS[stream]

  return (
    <div>
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8" role="tablist" aria-label="Course streams">
        {TAB_ORDER.map((id) => {
          const s = STREAMS[id]
          const on = id === stream
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => selectStream(id)}
              className={`group text-left rounded-2xl p-5 sm:p-6 cursor-pointer transition-all ${
                on
                  ? 'bg-accent text-white shadow-xl shadow-accent/25 ring-2 ring-accent'
                  : 'glass-premium hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    on ? 'bg-white/15' : 'bg-accent/10'
                  }`}
                >
                  <s.icon className={`w-6 h-6 ${on ? 'text-white' : 'text-accent'}`} strokeWidth={1.7} />
                </div>
                {on ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                    <Check className="w-3 h-3" /> Viewing
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-2.5 py-1 rounded-full border border-border">
                    View
                  </span>
                )}
              </div>
              <p className={`text-lg sm:text-2xl font-bold tracking-tight leading-tight ${on ? 'text-white' : 'text-foreground'}`}>
                {s.tabLabel}
              </p>
              <p className={`text-xs sm:text-sm font-semibold mt-1 ${on ? 'text-emerald-50' : 'text-accent'}`}>
                {s.courseName}
              </p>
              <p className={`text-[10px] font-bold tracking-[0.14em] mt-1 ${on ? 'text-white/60' : 'text-muted-foreground'}`}>
                {s.code}
              </p>
            </button>
          )
        })}
      </div>

      {/* Active stream card */}
      <div
        role="tabpanel"
        className="glass-premium rounded-2xl p-6 sm:p-8 md:p-10 animate-scale-in"
        key={active.id}
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <active.icon className="w-6 h-6 text-accent" strokeWidth={1.7} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-accent mb-1">
              {active.tabLabel}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
              {active.courseName}
            </h2>
            <p className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground mt-1">{active.code}</p>
          </div>
        </div>

        {/* Who it's for */}
        <p className="text-[15px] sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
          {active.whoFor}
        </p>

        {/* Facts row */}
        <div className="grid sm:grid-cols-3 gap-3 mb-7">
          <div className="rounded-xl bg-black/[0.02] border border-border p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <BookOpen className="w-4 h-4 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Format</span>
            </div>
            <p className="text-sm text-foreground/90 font-medium leading-snug">{active.format}</p>
          </div>
          <div className="rounded-xl bg-black/[0.02] border border-border p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Award className="w-4 h-4 text-accent" strokeWidth={1.8} />
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CPD</span>
            </div>
            <p className="text-sm text-foreground/90 font-medium leading-snug">{active.cpd}</p>
          </div>
          <div className="rounded-xl bg-black/[0.02] border border-border p-4">
            <div className="flex items-center gap-2 mb-1.5">
              {active.id === 'ep' && !CONFIG.FEATURES.ESSA_ACCREDITED ? (
                <Clock className="w-4 h-4 text-accent" strokeWidth={1.8} />
              ) : (
                <Check className="w-4 h-4 text-accent" strokeWidth={2.2} />
              )}
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {active.id === 'ep' ? 'Accreditation' : 'Endorsement'}
              </span>
            </div>
            <p className="text-sm text-foreground/90 font-medium leading-snug">{active.credential}</p>
          </div>
        </div>

        {/* What's covered */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-accent" strokeWidth={1.8} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">What&apos;s covered</h3>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {active.covers.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90 leading-snug">
                <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2.4} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Price line */}
        <div className="flex items-center gap-2 rounded-xl bg-accent/[0.06] border border-accent/15 px-4 py-3 mb-7">
          <Calendar className="w-4 h-4 text-accent flex-shrink-0" strokeWidth={1.8} />
          <p className="text-sm font-semibold text-foreground">{active.priceLine}</p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          {active.ctas.map((cta) =>
            cta.primary ? (
              <Link
                key={cta.href}
                href={cta.href}
                className="btn-primary px-7 py-3.5 rounded-xl text-[15px] font-bold inline-flex items-center justify-center gap-2"
              >
                {cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                key={cta.href}
                href={cta.href}
                className="px-6 py-3.5 rounded-xl text-[15px] font-semibold text-accent border border-accent/25 bg-white/40 hover:bg-accent/[0.06] transition-colors inline-flex items-center justify-center gap-2"
              >
                {cta.label}
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  )
}
