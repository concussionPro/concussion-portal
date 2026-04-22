'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, CheckCircle2, Download, FileText, ShieldCheck, Infinity, ArrowRight, Loader2, Wrench, AlertTriangle, FileSignature, Clipboard, Mail, GitBranch, Workflow } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { BOOK_CONFIG } from '@/lib/book'
import { CONFIG } from '@/lib/config'

export default function ReferencePage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleBuy = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/create-book-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || undefined }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <SiteNav />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-[120px] pb-20 px-5">
        <div className="max-w-6xl mx-auto">
          {/* ── HERO: two-product visual proof ────────────────────────────── */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full mb-5">
              <BookOpen className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                Clinical Reference + Toolkit · 2026
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-3 max-w-3xl mx-auto">
              Everything you need to assess, manage, and document a concussion —
              <span className="text-gradient"> in two downloads.</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              The 256-page clinical reference <strong>and</strong> the 10-piece Clinical Toolkit 2026. One price. Lifetime access.
            </p>
          </div>

          {/* Visual split — BOOK on left, TOOLKIT grid on right.
              Capped at 880px so the preview thumbnails don't stretch past their native resolution. */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-stretch mb-10 max-w-[880px] mx-auto">
            {/* Part 1 — Book */}
            <div className="relative">
              <div className="absolute -top-3 left-4 z-10 bg-accent text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-lg">
                Part 1 · Reference Text
              </div>
              <div className="aspect-[3/4] rounded-2xl shadow-2xl overflow-hidden relative bg-slate-100 h-full">
                <Image
                  src="/ccm-cover.png"
                  alt="Concussion Clinical Mastery — Complete Reference Text 2026 cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                  <p className="text-white text-sm font-bold mb-1">256 pages · Fully referenced</p>
                  <p className="text-white/80 text-xs">Pathophysiology → assessment → phenotype-directed rehab → RTP/RTW → documentation</p>
                </div>
              </div>
            </div>

            {/* Part 2 — Toolkit grid */}
            <div className="relative">
              <div className="absolute -top-3 left-4 z-10 bg-orange-500 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-lg">
                Part 2 · 10-piece Toolkit
              </div>
              <div className="grid grid-cols-2 gap-3 h-full">
                {[
                  { src: '/toolkit-previews/01_cheat_sheet.png', label: 'Cheat Sheet', icon: AlertTriangle },
                  { src: '/toolkit-previews/04_pcs_flowchart.png', label: 'PPCS Flowchart', icon: Workflow },
                  { src: '/toolkit-previews/05_referral_flowchart.png', label: 'Referral Map', icon: GitBranch },
                  { src: '/toolkit-previews/07_rehab_flow.png', label: 'RehabFlow', icon: Clipboard },
                ].map(({ src, label, icon: Icon }) => (
                  <div key={src} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-white border border-slate-200 group hover:shadow-xl transition-shadow">
                    <Image
                      src={src}
                      alt={label}
                      fill
                      sizes="(max-width: 768px) 50vw, 200px"
                      className="object-cover object-top"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-2 py-1.5 border-t border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3 h-3 text-orange-600 flex-shrink-0" />
                        <p className="text-[11px] font-bold text-slate-900 truncate">{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                + 6 more: myth-buster, patient handout, RTP/RTL/RTW ladder, return-to-school plan, employer letter, email template pack
              </p>
            </div>
          </div>

          {/* ── "What you can use THIS WEEK" — clinical practice framing ─── */}
          <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-10 mb-10">
            <p className="text-[10px] font-bold tracking-[3px] text-orange-400 uppercase mb-3">What this does for your practice today</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              By Monday morning, in your clinic:
            </h2>
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
              {[
                { icon: AlertTriangle, headline: 'Red-flag cheat sheet on the consult-room wall', detail: 'Visual one-pager. Scan in 10 seconds during a concussion presentation. Never miss a GCS, anticoagulant, or cervical red flag.' },
                { icon: FileText, headline: 'Patient handout in their hands before they leave', detail: '"What to Expect After a Concussion" — branded with your letterhead, filled in with their specific advice.' },
                { icon: FileSignature, headline: 'Employer / school letter drafted in 3 minutes', detail: 'Editable DOCX. Tick accommodations, fill in patient-specific fields, send. No writing from scratch.' },
                { icon: Workflow, headline: 'PPCS flowchart when you\'re stuck at 4 weeks', detail: 'Visual decision tree — red flags → SCOAT6 → phenotype ID → targeted rehab. Know exactly what to do next.' },
                { icon: GitBranch, headline: 'Referral map for every PPCS presentation', detail: 'Who to refer to, when, how to write the letter. Tier 1/2/3 disciplines + public-system pathways.' },
                { icon: Mail, headline: '12 pre-written clinical emails, copy-paste ready', detail: 'Initial follow-up, multidisciplinary referrals, clearance letters, PPCS pivot, discharge summary. Adapt once, use forever.' },
              ].map(({ icon: Icon, headline, detail }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm leading-tight mb-1">{headline}</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Price + CTA bar ──────────────────────────────────────────── */}
          <div className="rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-teal-50 to-white p-8 mb-16 shadow-xl">
            <div className="grid md:grid-cols-5 gap-6 items-center">
              <div className="md:col-span-2">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-5xl font-bold text-slate-900">A${BOOK_CONFIG.priceAud}</span>
                  <span className="text-sm text-slate-500">one-time</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Reference text + 10-piece toolkit. Lifetime access and free updates. Aligned with Amsterdam 2023 + AIS/SMA 2024.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Instant download
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Infinity className="w-3.5 h-3.5 text-emerald-600" />
                    Lifetime access
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    7-day money-back
                  </span>
                </div>
              </div>
              <div className="md:col-span-3 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com (optional, pre-fills checkout)"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-accent focus:outline-none text-sm"
                />
                <button
                  onClick={handleBuy}
                  disabled={loading}
                  className="w-full btn-primary px-6 py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 shadow-xl disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Opening secure checkout...
                    </>
                  ) : (
                    <>
                      Get the Reference + Toolkit — A${BOOK_CONFIG.priceAud}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            </div>
          </div>

          {/* The Reference Text */}
          <div className="glass rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Part 1 — The 256-page Reference Text</h2>
                <p className="text-xs text-slate-500">The clinical foundation. Read it once, reference forever.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-700">
              {[
                'Pathophysiology: neurometabolic cascade, CBF, DMN, autonomic dysfunction',
                'Phenotype-directed management framework',
                'Cervical spine examination + upper cervical syndrome',
                'VOMS, BPPV, cranial nerve examination',
                'BCTT, MOVE Protocol, graded exertion prescription',
                'Return to play / school / work — staged protocols',
                'PPCS — assessment, triage, rehabilitation',
                'Multidisciplinary referral frameworks',
                'AHPRA Code + medico-legal documentation',
                'Cultural safety + special populations',
                'Three worked case studies with clinical commentary',
                'Fully referenced — 60+ citations, APA 7th edition',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* The Toolkit */}
          <div className="glass rounded-2xl p-8 mb-12 bg-gradient-to-br from-orange-50/40 to-amber-50/40 border border-orange-200/40">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Part 2 — The 2026 Clinical Toolkit</h2>
                <p className="text-xs text-slate-500">10 ready-to-use clinical documents. All updated for Amsterdam 2023.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Clinical Cheat Sheet', desc: 'Visual one-pager — red flags, phenotypes, RTP ladder, SOAP. Print and pin on the consult-room wall.' },
                { title: 'Myth-Buster', desc: '10 corrected myths. Hand to patients and families.' },
                { title: '"What to Expect After a Concussion"', desc: 'Patient handout with clinic letterhead space + fillable clinician notes at the end.' },
                { title: 'PPCS Flowchart', desc: 'Visual 6-stage decision pathway with phenotype matrix.' },
                { title: 'Referral Flowchart', desc: 'Hub-and-spoke map — Tier 1/2/3 disciplines, public-system pathways, referral letter template.' },
                { title: 'RTP / RTL / RTW Ladder', desc: 'All three staged return protocols + BCTT exercise prescription.' },
                { title: 'RehabFlow', desc: 'Landscape 5-phase pipeline from acute to discharge.' },
                { title: 'Return-to-School Plan', desc: 'Editable DOCX — letterhead space, checkbox accommodations, signature lines.' },
                { title: 'Employer / School Letter', desc: 'Editable DOCX — patient-specific fields, accommodation checkboxes.' },
                { title: 'Email Template Pack', desc: '12 copy-paste clinical emails — initial follow-up, referrals, clearance, discharge.' },
              ].map((tool, i) => (
                <div key={i} className="bg-white rounded-lg border border-orange-200/60 p-4">
                  <p className="text-sm font-bold text-slate-900 mb-1">{tool.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Who it's for */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-2">For practising clinicians</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Physios, osteos, chiros, GPs, EPs, OTs. If you see a concussion every month or two and want a reference that sits on your desk and answers what the guidelines gloss over.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-2">For students</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Final-year undergrads and new graduates. Fills the gap between academic texts and clinical reality. Student pricing available — email zac@concussion-education-australia.com.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-2">For clinic teams</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Multi-user licensing for practices wanting all clinicians aligned on concussion protocols. Contact for clinic-rate pricing.
              </p>
            </div>
          </div>

          {/* Sample TOC */}
          <div className="glass rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Table of contents (abridged)</h2>
            <div className="grid md:grid-cols-2 gap-x-10 gap-y-2 text-sm">
              {[
                ['1', 'Introduction: The Clinical Problem'],
                ['2', 'Neuropathophysiology of mTBI'],
                ['3', 'Classification, Phenotypes, Modifying Factors'],
                ['4', 'Clinical History & Red Flag Recognition'],
                ['5', 'SCAT6 and SCOAT6 in Clinical Practice'],
                ['6', 'Cervical Spine Examination'],
                ['7', 'Vestibular & Ocular Motor Screening'],
                ['8', 'Balance, Coordination, Modified BESS'],
                ['9', 'Cognitive & Neuropsychological Screening'],
                ['10', 'Acute Management & First 72 Hours'],
                ['11', 'Persistent Post-Concussive Symptoms'],
                ['12', 'Rehabilitation by Phenotype'],
                ['13', 'Return to Play, Work, and School'],
                ['14', 'Multidisciplinary Referral'],
                ['15', 'Legal, Ethical & Documentation'],
                ['16', 'Cultural Safety & Special Populations'],
              ].map(([n, title]) => (
                <div key={n} className="flex gap-3 py-1 border-b border-slate-200/50">
                  <span className="text-slate-400 font-mono text-xs w-6">{n}.</span>
                  <span className="text-slate-700">{title}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Plus 6 appendices (assessment matrix, decision flowcharts, worked case studies, glossary, bibliography).
            </p>
          </div>

          {/* Upgrade path */}
          <div className="rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-teal-50 to-sky-50 p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Already own the reference + toolkit? Save A$100 on the course.
                </h2>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  Once you&apos;ve bought the reference and toolkit, you already own the clinical framework. The online course adds 8 comprehensive modules with interactive quizzes, a curated clinical video library, a CPD-accredited certificate, and {CONFIG.COURSE.ONLINE_CPD_POINTS} AHPRA CPD points. Bundle owners get A$100 off automatically at checkout — effective price A${CONFIG.COURSE.PRICE_ONLINE - 100}.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/80"
                >
                  See the course →
                </Link>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-4">
              Instant PDF download after purchase · Lifetime access via your ConcussionPro account · 7-day satisfaction guarantee.
            </p>
            <button
              onClick={handleBuy}
              disabled={loading}
              className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 shadow-2xl disabled:opacity-60"
            >
              <Download className="w-5 h-5" />
              Get the Reference + Toolkit — A${BOOK_CONFIG.priceAud}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
