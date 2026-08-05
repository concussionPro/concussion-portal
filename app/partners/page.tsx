import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import {
  ShieldCheck, Activity, HeartPulse, GraduationCap, Stethoscope,
  Building2, Trophy, ArrowRight, Check,
} from 'lucide-react'

export const metadata = {
  title: 'Custom Concussion Portal for Sports Organisations & Health Systems | CEA',
  description:
    'A custom-branded concussion portal for your organisation — pre-season SCAT6/SCOAT6 baselines, serial testing against each athlete or patient’s own baseline, heart-rate-paced return-to-sport, and your team trained and CPD-credentialed.',
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/partners',
  },
}

const CAL = 'https://cal.com/zac-lewis-so8zjs/30min?utm_source=partners&utm_medium=cta&utm_campaign=custom-portal'

const PILLARS: {
  icon: typeof Building2
  title: string
  body: string
  /** Self-serve demo on the shared DEMO00 clinic — sample data, no sign-in. */
  demo?: { label: string; href: string }
}[] = [
  {
    icon: Building2,
    title: 'Your own custom portal',
    body: 'A concussion portal branded for your organisation. Your medical and performance team manages your people inside it — one place, one process, your name on it.',
  },
  {
    icon: ShieldCheck,
    title: 'Pre-season baselines',
    body: 'SCAT6 and SCOAT6 baselines captured for every athlete or patient and held against their profile — so a later test means something.',
    demo: { label: 'Try the baseline flow', href: '/preseason/b/DEMO00' },
  },
  {
    icon: Activity,
    title: 'Serial testing vs their own baseline',
    body: 'After a head knock, compare against that individual’s own baseline — not a generic norm. Domain-by-domain, with the gaps that haven’t cleared shown clearly.',
  },
  {
    icon: HeartPulse,
    title: 'Heart-rate-paced return-to-sport',
    body: 'Our SST tool prescribes sub-symptom-threshold exercise rehab paced to each person’s heart-rate threshold — a safe, objective path back instead of guesswork.',
  },
  {
    icon: GraduationCap,
    title: 'Your team trained & credentialed',
    body: 'Every clinician trained on the protocol — 8 CPD hours each online (16 with the in-person practical day), Osteopathy Australia endorsed — so your whole team runs concussion the same way.',
  },
  {
    icon: Stethoscope,
    title: 'One standardised pathway',
    body: 'The same baseline, the same objective read, the same return-to-activity logic across every site, team or clinic in your organisation.',
  },
]

const AUDIENCE = [
  { icon: Trophy, label: 'Sports organisations', sub: 'Pro clubs, national programs, performance teams' },
  { icon: Building2, label: 'Health systems & clinic networks', sub: 'A consistent concussion pathway across every site' },
  { icon: GraduationCap, label: 'Universities', sub: 'Athletics, sports medicine and student-athlete programs' },
]

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--accent)] via-[#0b6165] to-slate-900 text-white pt-[120px] pb-20">
        <div className="absolute right-[-120px] top-[-120px] w-[480px] h-[480px] rounded-full border border-white/10" />
        <div className="absolute right-[-40px] bottom-[-200px] w-[360px] h-[360px] rounded-full border border-white/10" />
        <div className="relative max-w-4xl mx-auto px-6">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-emerald-200 mb-3">
            For sports organisations & health systems
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-5">
            Concussion management for your whole program — in one custom portal.
          </h1>
          <p className="text-lg text-emerald-50/90 leading-relaxed max-w-2xl mb-8">
            Baselines, objective serial testing, a safe return-to-sport pathway, and your team trained
            to one protocol — branded for your organisation, run by your people.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={CAL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl bg-white text-[var(--accent)] hover:opacity-90 transition"
            >
              Book a 15-minute call <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/team-training"
              className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl border border-white/30 text-white hover:bg-white/10 transition"
            >
              Team training options
            </Link>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
          What your organisation gets
        </h2>
        <p className="text-muted-foreground mb-10 max-w-2xl">
          End to end — from a clean pre-season baseline to a defensible return-to-play decision — for
          every athlete or patient your team looks after.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PILLARS.map((p) => (
            <div key={p.title} className="glass-premium rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 flex items-center justify-center mb-4">
                <p.icon className="w-[22px] h-[22px] text-[var(--accent)]" strokeWidth={1.8} />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1.5">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              {p.demo && (
                <Link
                  href={p.demo.href}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  {p.demo.label} <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Who it's for */}
      <section className="bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-8">Built for</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {AUDIENCE.map((a) => (
              <div key={a.label} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <a.icon className="w-5 h-5 text-[var(--accent)]" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founding partner band */}
      <section className="max-w-4xl mx-auto px-6 py-16 md:py-20">
        <div className="rounded-2xl border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/5 to-white p-8">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[var(--accent)] mb-2">
            Founding programs
          </p>
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-3">
            We&apos;re onboarding a small number of founding partners now.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
            We set the portal up with you and shape it around how your program actually works. In return
            you help define the standard — and your organisation runs concussion on a system built for it,
            not a generic course.
          </p>
          <ul className="space-y-2 mb-7">
            {[
              'Custom-branded portal configured for your organisation',
              'Direct onboarding and setup with the founder',
              'Your team trained, credentialed and supported',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-foreground/85">
                <Check className="w-4 h-4 text-[var(--accent)] mt-0.5 flex-shrink-0" strokeWidth={2.2} />
                {line}
              </li>
            ))}
          </ul>
          <a
            href={CAL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition"
          >
            Book a 15-minute call <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  )
}
