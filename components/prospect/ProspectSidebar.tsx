/**
 * Single source of truth for the prospect-portal sidebar.
 *
 * Replaces the four near-identical inline copies that were drifting
 * apart. Renders as a fixed sidebar on desktop and as a slide-in
 * drawer behind a hamburger button on mobile (60%+ of healthcare
 * professional traffic is mobile — previously this audience had no
 * navigation at all on prospect demo sub-pages).
 */
'use client'

import { useState } from 'react'
import { CONFIG } from '@/lib/config'
import {
  Home, BookOpen, Brain, Activity, FileText, Library, BookMarked,
  ExternalLink, TrendingUp, Stethoscope, Lock, Menu, X, Tag,
} from 'lucide-react'

export type ActiveSection =
  | 'dashboard'
  | 'learning'
  | 'references'
  | 'clinical-toolkit'
  | 'outreach-kit'
  | 'admin-workflow'

export function ProspectSidebar({
  slug,
  accessKey,
  clinicShortName,
  clinicCity,
  clinicState,
  active,
  accreditation = 'ahpra',
}: {
  slug: string
  accessKey: string
  clinicShortName: string
  clinicCity?: string | null
  clinicState?: string | null
  active?: ActiveSection
  accreditation?: 'ahpra' | 'essa'
}) {
  const portalBase = `/p/${slug}`
  // Access key is optional (keyless per-clinic URLs since 2026-06-11) —
  // guard so hrefs never emit a literal "?k=undefined".
  const ak = accessKey ? `?k=${accessKey}` : ''
  const cityKnown = Boolean(clinicCity && !/unknown/i.test(clinicCity))
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <>
      {/* Mobile hamburger — only visible on small screens */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl bg-white/95 backdrop-blur shadow-md border border-slate-200 flex items-center justify-center print:hidden"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`md:hidden fixed left-0 top-0 h-screen w-72 sidebar-premium p-6 flex flex-col z-50 transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden`}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute top-3 right-3 w-9 h-9 rounded-lg hover:bg-white/40 flex items-center justify-center"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <SidebarBody
          slug={slug}
          portalBase={portalBase}
          ak={ak}
          clinicShortName={clinicShortName}
          clinicCity={clinicCity}
          clinicState={clinicState}
          cityKnown={cityKnown}
          active={active}
          accreditation={accreditation}
          onLinkClick={() => setMobileOpen(false)}
        />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex-col z-40 print:hidden">
        <SidebarBody
          slug={slug}
          portalBase={portalBase}
          ak={ak}
          clinicShortName={clinicShortName}
          clinicCity={clinicCity}
          clinicState={clinicState}
          cityKnown={cityKnown}
          active={active}
          accreditation={accreditation}
        />
      </div>
    </>
  )
}

function SidebarBody({
  slug, portalBase, ak, clinicShortName, clinicCity, clinicState, cityKnown, active, onLinkClick, accreditation = 'ahpra',
}: {
  slug: string
  portalBase: string
  ak: string
  clinicShortName: string
  clinicCity?: string | null
  clinicState?: string | null
  cityKnown: boolean
  active?: ActiveSection
  onLinkClick?: () => void
  accreditation?: 'ahpra' | 'essa'
}) {
  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md shadow-accent/15">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-base font-bold text-foreground tracking-tight leading-tight">
            Concussion Education<br /><span className="text-accent">Australia</span>
          </h1>
        </div>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{clinicShortName}</p>
        {cityKnown ? (
          <p className="text-[11px] text-muted-foreground mt-0.5">{clinicCity}, {clinicState}</p>
        ) : clinicState ? (
          <p className="text-[11px] text-muted-foreground mt-0.5">{clinicState}</p>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1">
        <Item label="Dashboard" icon={Home}
          href={active === 'dashboard' ? undefined : `${portalBase}${ak}`}
          active={active === 'dashboard'} onClick={onLinkClick} />
        <Item label="Learning Suite" icon={BookOpen}
          href={active === 'learning' ? undefined : `${portalBase}/learning${ak}`}
          active={active === 'learning'} onClick={onLinkClick} />
        {/* Persistent pricing path (2026-07-05): pricing sat ~7 sections deep
            with the dominant CTAs navigating away first — real prospects
            (106s dwell) left without EVER seeing it. Pricing LOUD doctrine. */}
        <Item label="Investment & Pricing" icon={Tag}
          href={`${portalBase}${ak}#pricing`} onClick={onLinkClick} />
        {/* Free tools carry ?prospect={slug} so the engagement engine can
            attribute signups back to this clinic (users.source_prospect_slug). */}
        <Item label="SCAT Forms" icon={Activity} href={`/scat-forms?prospect=${encodeURIComponent(slug)}`} external onClick={onLinkClick} />
        <Item label="Baseline Testing" icon={TrendingUp} href={`/preseason?prospect=${encodeURIComponent(slug)}`} external onClick={onLinkClick} />
        <Item label="Reference Library" icon={Library}
          href={active === 'references' ? undefined : `${portalBase}/references${ak}`}
          active={active === 'references'} onClick={onLinkClick} />
        <Item label="Clinical Toolkit" icon={FileText}
          href={active === 'clinical-toolkit' ? undefined : `${portalBase}/toolkit/clinical${ak}`}
          active={active === 'clinical-toolkit'} onClick={onLinkClick} />
        <Item label="Outreach Kit" icon={Stethoscope}
          href={active === 'outreach-kit' ? undefined : `${portalBase}/toolkit/outreach${ak}`}
          active={active === 'outreach-kit'} onClick={onLinkClick} />
        <Item label="Admin Workflow" icon={BookMarked}
          href={active === 'admin-workflow' ? undefined : `${portalBase}/toolkit/admin${ak}`}
          active={active === 'admin-workflow'} onClick={onLinkClick} />
      </nav>

      <div className="pt-5 border-t border-white/30">
        {/* Body-per-stream: ESSA ACCREDITED the CRM (No. PDNF26077); Osteopathy
            Australia ENDORSES the CCM. Never cross the two — "ESSA endorsed" and
            "OA endorsed" on the exercise-physiology stream were both wrong. */}
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{accreditation === 'essa'
          ? (CONFIG.FEATURES.ESSA_ACCREDITED
              ? `ESSA Accredited · No. ${CONFIG.ESSA_ACCREDITATION.NUMBER}`
              : 'ESSA Accreditation Pending')
          : 'AHPRA Aligned'}</p>
        <p className="text-[10px] text-muted-foreground">{accreditation === 'essa'
          ? `${CONFIG.ESSA_ACCREDITATION.ONLINE_POINTS} ESSA CPD points online (${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} with the practical day)`
          : `Endorsed by Osteopathy Australia · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hrs online (${CONFIG.COURSE.TOTAL_CPD_POINTS} with the practical day)`}</p>
      </div>
    </>
  )
}

function Item({
  href, label, icon: Icon, active, locked, external, onClick,
}: {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  active?: boolean
  locked?: boolean
  external?: boolean
  onClick?: () => void
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative text-sm font-medium'
  if (locked) {
    return (
      <div className={`${base} opacity-50 text-muted-foreground cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
        <Lock className="w-3 h-3 ml-auto text-muted-foreground/60" />
      </div>
    )
  }
  if (active) {
    return (
      <div className={`${base} bg-accent/8 text-accent font-semibold cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        <span>{label}</span>
      </div>
    )
  }
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      onClick={onClick}
      className={`${base} text-muted-foreground hover:text-foreground hover:bg-white/40`}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
      <span>{label}</span>
      {external && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
    </a>
  )
}
