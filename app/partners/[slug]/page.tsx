/**
 * Public per-institution PARTNER page for the Concussion Care arm.
 *
 * Reuses the proven per-prospect portal *visual language* (dashboard-bg,
 * glass cards, accent) but with entirely DIFFERENT content: free athlete
 * concussion resources + the care pathway. NOT the clinic education portal
 * — no pricing tables, no public Stripe, no public booking widget.
 *
 * Fully isolated from the cold-clinic engine (lib/prospect/*).
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Brain,
  ShieldCheck,
  GraduationCap,
  FileText,
  Activity,
  Stethoscope,
  ArrowRight,
  ArrowUpRight,
  ClipboardCheck,
  CalendarCheck,
  Phone,
  Mail,
} from 'lucide-react'
import { getPartnerBySlug } from '@/lib/partners/repo'

const ZAC_EMAIL = 'zac@concussion-education-australia.com'
const ZAC_CAL = 'https://cal.com/zac-lewis-so8zjs'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const partner = await getPartnerBySlug(slug)
  if (!partner) {
    return { title: 'Concussion care for your athletes', robots: 'noindex, nofollow' }
  }
  return {
    title: `${partner.name} — Concussion care for your athletes`,
    description: `A free concussion resource for ${partner.name}'s athletes, from Concussion Education Australia.`,
    robots: 'noindex, nofollow',
  }
}

export default async function PartnerPage({ params }: PageProps) {
  const { slug } = await params
  const partner = await getPartnerBySlug(slug)
  if (!partner) notFound()

  const name = partner.name

  return (
    <div className="min-h-screen dashboard-bg">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-3 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Concussion Education Australia
          </p>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.03] mb-4 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
            {name} — Concussion care for your athletes
          </h1>
          <p className="text-base sm:text-lg text-foreground/80 font-medium max-w-2xl">
            A free concussion resource for {name}&rsquo;s athletes, from Concussion Education
            Australia.
          </p>
        </section>

        {/* ── Authority strip ──────────────────────────────────────── */}
        <section className="mb-12">
          <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/5 via-white to-white px-5 py-5 sm:px-7 sm:py-6">
            <p className="text-sm sm:text-base font-semibold text-foreground flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <span>
                We train Australia&rsquo;s clinicians in concussion management
                <span className="text-foreground/40"> · </span>
                Osteopathy Australia endorsed
              </span>
            </p>
            {/* TODO(Zac): fill the authority strip with REAL research +
                speaking credentials before any send — AHPRA advertising
                rules apply, do not fabricate. */}
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500">
                {/* TODO(Zac): research — e.g. named publications/studies */}
                [research]
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-500">
                {/* TODO(Zac): speaking — e.g. named conferences/talks */}
                [speaking]
              </span>
            </div>
          </div>
        </section>

        {/* ── Free resources ───────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            Free for {name}&rsquo;s athletes
          </h2>
          <p className="text-sm text-foreground/60 mb-5">
            Three concussion resources, set up at no cost to the {partner.type === 'school' ? 'school' : partner.type}.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <ResourceCard
              href="/scat-forms"
              icon={<FileText className="w-5 h-5" />}
              title="SCAT6 & SCOAT6 forms — free"
              body="The fillable concussion assessment forms, free to download and use sideline and in clinic."
            />
            <ResourceCard
              href="/preseason"
              icon={<Activity className="w-5 h-5" />}
              title="Baseline cognitive testing — free for your athletes"
              body="Season-long baseline testing so a post-knock result can be compared against each athlete's own normal."
            />
            <ResourceCard
              href="/scat-mastery"
              icon={<GraduationCap className="w-5 h-5" />}
              title="Concussion refresher for your trainers — free"
              body="A short concussion refresher for the staff and trainers on your sidelines."
            />
          </div>
        </section>

        {/* ── If an athlete's flagged: the care pathway ────────────── */}
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            If an athlete&rsquo;s flagged
          </h2>
          <p className="text-sm text-foreground/60 mb-5">
            A clear concussion care pathway — booked directly with Zac if and when it&rsquo;s needed.
          </p>
          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur px-5 py-6 sm:px-7 sm:py-7">
            <ol className="space-y-4">
              <PathwayStep
                n={1}
                icon={<Stethoscope className="w-4 h-4" />}
                title="Initial assessment"
                body="A telehealth concussion assessment of the flagged athlete."
              />
              <PathwayStep
                n={2}
                icon={<FileText className="w-4 h-4" />}
                title="Written report + referral"
                body="A concussion report and management plan, with a referral to a local clinician for ongoing care."
              />
              <PathwayStep
                n={3}
                icon={<ClipboardCheck className="w-4 h-4" />}
                title="Mid-recovery check-in"
                body="A progress review against the plan as the athlete recovers."
              />
              <PathwayStep
                n={4}
                icon={<CalendarCheck className="w-4 h-4" />}
                title="Final readiness assessment"
                body="A return-to-activity readiness review that supports the treating clinician's clearance."
              />
            </ol>
            <div className="mt-6 rounded-xl bg-accent/5 border border-accent/15 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                Cost sits with the family, not {name}.
              </p>
              <p className="text-xs text-foreground/60 mt-1">
                The pathway is booked directly with Zac if/when an athlete is flagged — there&rsquo;s
                nothing to pay or book here, and nothing for {name} to fund.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="mb-14">
          <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-white to-white px-6 py-8 sm:px-10 sm:py-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Set {name} up — it&rsquo;s free
            </h2>
            <p className="text-sm text-foreground/70 max-w-xl mx-auto mb-6">
              Ten minutes to switch on a premium concussion resource for your athletes, at no cost to
              the {partner.type === 'school' ? 'school' : partner.type}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={ZAC_CAL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent-light transition-colors"
              >
                <Phone className="w-4 h-4" />
                Book a 10-min call
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={`mailto:${ZAC_EMAIL}?subject=${encodeURIComponent(`Concussion resource for ${name}`)}`}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-foreground hover:border-accent transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Zac
              </a>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="border-t border-slate-200 pt-6 text-center">
          <p className="text-xs font-bold text-accent flex items-center justify-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            Concussion Education Australia
          </p>
          <p className="text-[11px] text-foreground/50 mt-1">
            Training Australia&rsquo;s clinicians in concussion management · Osteopathy Australia
            endorsed
          </p>
        </footer>
      </main>
    </div>
  )
}

function ResourceCard({
  href,
  icon,
  title,
  body,
}: {
  href: string
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-5 hover:border-accent hover:shadow-sm transition-all"
    >
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10 text-accent mb-3">
        {icon}
      </span>
      <p className="text-sm font-bold text-foreground mb-1 flex items-center gap-1">
        {title}
        <ArrowUpRight className="w-3.5 h-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
      <p className="text-xs text-foreground/60 leading-relaxed">{body}</p>
    </Link>
  )
}

function PathwayStep({
  n,
  icon,
  title,
  body,
}: {
  n: number
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <li className="flex items-start gap-4">
      <span className="relative flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent">
        {icon}
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold">
          {n}
        </span>
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-foreground/60 leading-relaxed mt-0.5">{body}</p>
      </div>
    </li>
  )
}
