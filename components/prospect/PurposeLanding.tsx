import Link from 'next/link'
import {
  HeartPulse, Activity, Users, Trophy, ShieldCheck, GraduationCap,
  ArrowRight, Check, MapPin, Plane,
} from 'lucide-react'

/**
 * Bespoke pitch page for Purpose Healthcare (Illawarra) — ~18 clinicians across
 * 4 clinics, BOTH physiotherapists and exercise physiologists, elite athletes +
 * NDIS + WorkCover. Tailored to the dual online streams (physios → CCM, EPs →
 * CRM) on the SAME in-person practical day, with two prices: $950pp group at a
 * Sydney course, or $800pp on-site (Zac travels, min 8). Rendered directly by
 * app/p/[token]/page.tsx before the DB lookup. Synthetic — never in the queue.
 */

const CAL = 'https://cal.com/zac-lewis-so8zjs/30min?utm_source=portal&utm_medium=purpose_pitch&utm_campaign=purpose-healthcare'
const PER_ONSITE = 900
const PER_SYDNEY = 950
const TEAM = 18

export function PurposeLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--accent)] via-[#0b6165] to-slate-900 text-white pt-16 pb-16">
        <div className="absolute right-[-120px] top-[-120px] w-[460px] h-[460px] rounded-full border border-white/10" />
        <div className="absolute right-[-40px] bottom-[-200px] w-[340px] h-[340px] rounded-full border border-white/10" />
        <div className="relative max-w-4xl mx-auto px-6">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-emerald-200 mb-3">
            For the Purpose Healthcare team · Illawarra
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-5">
            Concussion training built for your physios <span className="text-emerald-200">and</span> your EPs.
          </h1>
          <p className="text-lg text-emerald-50/90 leading-relaxed max-w-2xl mb-8">
            One program, two tailored online streams, the same hands-on day — so your whole team
            manages concussion the same way, from sideline assessment through to exercise rehab.
          </p>
          <a href={CAL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl bg-white text-[var(--accent)] hover:opacity-90 transition">
            Book a 15-minute call <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Why Purpose */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, stat: '~18', label: 'clinicians · 4 clinics' },
            { icon: Trophy, stat: 'Elite', label: 'athletes on your books' },
            { icon: Activity, stat: 'Physio + EP', label: 'two disciplines, one pathway' },
            { icon: ShieldCheck, stat: 'WorkCover · NDIS', label: 'defensible RTP decisions matter' },
          ].map((s) => (
            <div key={s.label} className="glass-premium rounded-2xl p-4">
              <s.icon className="w-5 h-5 text-[var(--accent)] mb-2" strokeWidth={1.8} />
              <p className="text-lg font-bold text-foreground leading-none">{s.stat}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The two streams */}
      <section className="max-w-4xl mx-auto px-6 pb-4">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Two online streams, one practical day</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Your physios and EPs do different self-paced online content matched to their scope, then
          train together on the hands-on day.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-premium rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-[20px] h-[20px] text-[var(--accent)]" strokeWidth={1.8} />
              <h3 className="text-base font-bold text-foreground">Physiotherapists</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Concussion Clinical Mastery — assessment, SCAT6/SCOAT6, VOMS &amp; oculomotor screening,
              return-to-play decision-making. 8 CPD hours online, OA-endorsed.
            </p>
          </div>
          <div className="glass-premium rounded-2xl p-6 border border-[var(--accent)]/20">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className="w-[20px] h-[20px] text-[var(--accent)]" strokeWidth={1.8} />
              <h3 className="text-base font-bold text-foreground">Exercise Physiologists</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Concussion Rehab Mastery — the exercise side: sub-symptom-threshold aerobic rehab,
              heart-rate-paced return-to-sport, graded progression. EP-specific, 8 CPD hours online.
              <span className="block mt-1.5 text-[var(--accent)] font-semibold">Concussion rehab is EP work — this is your team's lane.</span>
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-muted/40 border border-border p-5 flex items-start gap-3">
          <Activity className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={1.8} />
          <p className="text-sm text-foreground/85 leading-relaxed">
            <strong>Then the hands-on day, together.</strong> Both disciplines train side by side on the
            full-day practical — the multidisciplinary handoff (assess → rehab → clear) is the point.
            <strong> 14 CPD hours total</strong> with the in-person day · Osteopathy Australia endorsed.
          </p>
        </div>
      </section>

      {/* Pricing — two options */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Two ways to do it</h2>
        <p className="text-muted-foreground mb-6">Group rate either way — you pick what suits the team.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* On-site — recommended */}
          <div className="rounded-2xl glass-premium border border-[var(--accent)]/30 ring-1 ring-[var(--accent)]/20 p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--accent)]">Recommended</p>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">Best value</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 inline-flex items-center gap-2">
              <Plane className="w-4 h-4 text-[var(--accent)]" /> On-site — I come to you
            </h3>
            <p className="text-3xl font-bold text-[var(--accent)] leading-none mt-2">A${PER_ONSITE}<span className="text-base font-medium text-muted-foreground"> / clinician</span></p>
            <p className="text-[12px] text-muted-foreground mt-1">≈ A${(PER_ONSITE * TEAM).toLocaleString()} for ~{TEAM} clinicians · minimum 8</p>
            <ul className="space-y-2 mt-4">
              {['Whole team trained at your clinic — no travel for anyone', 'Trained on your own cases, in your own rooms', 'Lower per-head rate, and no travel cost or lost day to get to Sydney', 'Both streams + the practical day, on a date that suits you'].map((l) => (
                <li key={l} className="flex items-start gap-2 text-sm text-foreground/85"><Check className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" strokeWidth={2.2} />{l}</li>
              ))}
            </ul>
          </div>
          {/* Sydney group */}
          <div className="rounded-2xl glass-premium p-6">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Public course</p>
            <h3 className="text-lg font-bold text-foreground mb-1 inline-flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--accent)]" /> Group rate — Sydney course
            </h3>
            <p className="text-3xl font-bold text-foreground leading-none mt-2">A${PER_SYDNEY}<span className="text-base font-medium text-muted-foreground"> / clinician</span></p>
            <p className="text-[12px] text-muted-foreground mt-1">Your team attends a scheduled Sydney course together</p>
            <ul className="space-y-2 mt-4">
              {['Both online streams + the in-person day', 'Train alongside other clinics', 'Good if a date already suits your roster', '14 CPD hours · OA-endorsed'].map((l) => (
                <li key={l} className="flex items-start gap-2 text-sm text-foreground/85"><Check className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" strokeWidth={2.2} />{l}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--accent)]/5 to-white border border-[var(--accent)]/25 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">Train the Purpose team together</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Fifteen minutes to walk through how it&apos;d run for your physios and EPs, and lock a format and date.
          </p>
          <a href={CAL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition">
            Book a 15-minute call <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-muted-foreground mt-4">
            Concussion Education Australia · Osteopathy Australia endorsed ·{' '}
            <Link href="/partners" className="text-[var(--accent)] hover:underline">how the program works</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
