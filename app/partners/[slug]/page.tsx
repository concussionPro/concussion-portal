/**
 * Public per-institution PARTNER page for the Concussion Care arm.
 *
 * Visual-first, value-prop-obvious page for elite sports institutions.
 * Leads with the differentiator (direct specialist assessment with Zac) +
 * an EXPLAINED free baseline test, real imagery (Zac, OA endorsement,
 * training), and a clean care pathway. NOT the clinic education portal.
 *
 * Fully isolated from the cold-clinic engine (lib/prospect/*).
 */
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import {
  Brain,
  FileText,
  Activity,
  GraduationCap,
  Stethoscope,
  ClipboardCheck,
  CalendarCheck,
  ArrowRight,
  ArrowUpRight,
  Phone,
  Mail,
  Check,
} from 'lucide-react'
import { getPartnerBySlug, recordPartnerView } from '@/lib/partners/repo'
import { ProspectTracker } from '@/components/prospect/ProspectTracker'

const ZAC_EMAIL = 'zac@concussion-education-australia.com'
const ZAC_CAL = 'https://cal.com/zac-lewis-so8zjs'

// Real credentials only — Zac fills these with specific items when ready.
// Empty entries are NOT rendered (no broken "[research]" placeholders).
const RESEARCH_LINE = '' // e.g. 'Published concussion research — [journal, year]'
const SPEAKING_LINE = '' // e.g. 'Speaker — [SMA / OA national conference]'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const partner = await getPartnerBySlug(slug)
  if (!partner) return { title: 'Concussion care for your athletes', robots: 'noindex, nofollow' }
  return {
    title: `${partner.name} — Concussion care for your athletes`,
    description: `Free baseline testing + specialist concussion assessment for ${partner.name}'s athletes, from Concussion Education Australia.`,
    robots: 'noindex, nofollow',
  }
}

export default async function PartnerPage({ params }: PageProps) {
  const { slug } = await params
  const partner = await getPartnerBySlug(slug)
  if (!partner) notFound()

  const name = partner.name
  const orgWord = partner.type === 'school' ? 'school' : partner.type === 'club' ? 'club' : 'academy'

  // Server-side landing view — fire-and-forget, never blocks render. Same pipe
  // as the prospect portal, into partner_portal_views (Zac 2026-06-27).
  const h = await headers()
  const userAgent = h.get('user-agent') ?? undefined
  const viewerIp = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  recordPartnerView({ partnerId: partner.id, viewerIp, userAgent, section: 'landing' })
    .catch((err) => console.error('[Partner view tracking failed]', err))

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Same engagement tracker as every prospect surface — section scroll, CTA
          clicks and dwell POST to the partner track route → partner_portal_views. */}
      <ProspectTracker token={partner.slug} accessKey={partner.accessKey} endpoint={`/api/partners/${partner.slug}/track`} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section data-track-section="hero" className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-accent">
              Concussion Education Australia
            </span>
            <Image
              src="/osteopathy-australia-endorsed.png"
              alt="Osteopathy Australia endorsed"
              width={108}
              height={36}
              className="h-7 w-auto opacity-90"
            />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.03] mb-5 bg-gradient-to-br from-foreground via-foreground to-accent bg-clip-text text-transparent">
            {name}&rsquo;s athletes,
            <br className="hidden sm:block" /> concussion-covered.
          </h1>
          <p className="text-base sm:text-xl text-foreground/80 font-medium max-w-2xl leading-relaxed">
            <span className="text-accent font-semibold">Free</span>{' '}
            pre-season baseline testing, the clinical SCAT tools, and a concussion refresher for your
            trainers &mdash; set up for every athlete, from the team that trains Australia&rsquo;s
            concussion clinicians. Nothing for {name} to pay or run.
          </p>
        </section>

        {/* ── 1. The FREE give — leads, so it doesn't read as asking for patients ── */}
        <section data-track-section="free-give" className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            Set up free for every {name} athlete
          </h2>
          <p className="text-sm text-foreground/60 mb-5">No cost to the {orgWord}. No admin to run.</p>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Baseline — the one that needs explaining, given the most room */}
            <ImageBento
              href="/preseason"
              image="/workshop-training.jpg"
              icon={<Activity className="w-4 h-4" />}
              eyebrow="The smart bit"
              title="Free pre-season baseline testing"
              body="Every athlete does a 10-minute cognitive baseline before the season. If they're concussed later, we compare against their own normal — so returning them to play is an objective medical call, not a guess. This is what turns a knock into a managed decision."
            />
            {/* SCAT tools */}
            <ImageBento
              href="/scat-forms"
              image="/online-course-preview.jpg"
              icon={<FileText className="w-4 h-4" />}
              eyebrow="Clinical tools"
              title="Free SCAT6 & SCOAT6 assessment tools"
              body="The fillable clinical concussion assessment forms your sideline and medical staff use — auto-scoring, free to use."
            />
          </div>

          <div className="mt-4">
            <MiniCard
              href="/scat-mastery"
              icon={<GraduationCap className="w-4 h-4" />}
              title="Free SCAT6 mini-course for your trainers"
              body="Our 1-hour SCAT6 mastery course — recognise concussion, run a sideline SCAT6/SCOAT6, and know when to pull an athlete. Free for your trainers and staff; the same curriculum we teach clinicians."
            />
          </div>
        </section>

        {/* ── 2. Authority ─────────────────────────────────────────────── */}
        <section data-track-section="authority" className="mb-12">
          <div className="rounded-2xl border border-accent/15 bg-gradient-to-br from-accent/5 via-white to-white px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Image
              src="/osteopathy-australia-endorsed.png"
              alt="Osteopathy Australia endorsed"
              width={150}
              height={50}
              className="h-12 w-auto shrink-0"
            />
            <div>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                We train Australia&rsquo;s clinicians in concussion management.
              </p>
              <p className="text-xs sm:text-sm text-foreground/65 mt-0.5">
                Concussion Clinical Mastery &mdash; 14 CPD hours, Osteopathy Australia endorsed.
                {RESEARCH_LINE ? ` ${RESEARCH_LINE}.` : ''}
                {SPEAKING_LINE ? ` ${SPEAKING_LINE}.` : ''}
              </p>
            </div>
          </div>
        </section>

        {/* ── 3. The expert backup — LAST, framed as a safety net not a sales pitch ── */}
        <section data-track-section="expert-backup" className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            Use the baseline to inform an expert assessment
          </h2>
          <p className="text-sm text-foreground/60 mb-5">
            If an athlete&rsquo;s knocked, Zac assesses them against their own pre-season baseline &mdash; so
            the return-to-play call is objective and expert, not a guess. The {orgWord} doesn&rsquo;t carry
            the clinical risk.
          </p>

          <div className="grid md:grid-cols-5 gap-0 rounded-3xl overflow-hidden border border-accent/20 bg-white shadow-sm mb-4">
            <div className="md:col-span-2 relative min-h-[240px] md:min-h-full">
              <Image
                src="/zac-lewis.jpg"
                alt="Zac Lewis, Osteopath — Concussion Education Australia"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover object-top"
              />
            </div>
            <div className="md:col-span-3 p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
                A concussion specialist your athletes can reach
              </h3>
              <p className="text-sm sm:text-base text-foreground/75 leading-relaxed mb-4">
                If a flagged athlete&rsquo;s family wants it, they can book a telehealth assessment with
                <strong> Zac Lewis</strong> &mdash; osteopath and the educator behind Australia&rsquo;s
                leading concussion CPD course &mdash; in <strong>days, not the weeks</strong> it takes to
                get a sports-physician appointment.
              </p>
              <ul className="grid sm:grid-cols-2 gap-y-1.5 gap-x-4 text-sm text-foreground/80">
                {[
                  'Fast telehealth — no waitlist',
                  'Written report + management plan',
                  'Referral to a local clinician',
                  'Recovery & return-to-play follow-up',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur px-5 py-6 sm:px-7 sm:py-7">
            <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              <PathwayStep n={1} icon={<Stethoscope className="w-4 h-4" />} title="Initial assessment" body="Fast telehealth concussion assessment of the flagged athlete." />
              <PathwayStep n={2} icon={<FileText className="w-4 h-4" />} title="Report + referral" body="A written report and management plan, with a referral to a local clinician." />
              <PathwayStep n={3} icon={<ClipboardCheck className="w-4 h-4" />} title="Mid-recovery check-in" body="A progress review against the plan as the athlete recovers." />
              <PathwayStep n={4} icon={<CalendarCheck className="w-4 h-4" />} title="Return-to-play readiness" body="A readiness review that supports the treating clinician's clearance." />
            </ol>
            <p className="mt-6 text-xs text-foreground/55 border-t border-slate-100 pt-4">
              Assessments are billed privately to the family &mdash; there&rsquo;s nothing for {name} to
              fund or administer. (If your {orgWord} prefers to fund athlete assessments, we can set that up too.)
            </p>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section data-track-section="cta" className="mb-14">
          <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 via-white to-white px-6 py-8 sm:px-10 sm:py-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Set {name} up &mdash; it&rsquo;s free
            </h2>
            <p className="text-sm text-foreground/70 max-w-xl mx-auto mb-6">
              Ten minutes to give your athletes pre-season baselines, the clinical tools, and a specialist
              on call &mdash; at no cost to the {orgWord}.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a data-track-cta="partner-book-call" href={ZAC_CAL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent-light transition-colors">
                <Phone className="w-4 h-4" /> Book a 10-min call <ArrowRight className="w-4 h-4" />
              </a>
              <a data-track-cta="partner-email-zac" href={`mailto:${ZAC_EMAIL}?subject=${encodeURIComponent(`Concussion resource for ${name}`)}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-foreground hover:border-accent transition-colors">
                <Mail className="w-4 h-4" /> Email Zac
              </a>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 pt-6 text-center">
          <p className="text-xs font-bold text-accent flex items-center justify-center gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Concussion Education Australia
          </p>
          <p className="text-[11px] text-foreground/50 mt-1">
            Training Australia&rsquo;s clinicians in concussion management &middot; Osteopathy Australia endorsed
          </p>
        </footer>
      </main>
    </div>
  )
}

function ImageBento({
  href, image, icon, eyebrow, title, body,
}: { href: string; image: string; icon: React.ReactNode; eyebrow: string; title: string; body: string }) {
  return (
    <Link href={href} data-track-cta={`partner-tool-${href.replace(/^\//, '')}`} className="group flex flex-col rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-accent hover:shadow-md transition-all">
      <div className="relative h-40 w-full overflow-hidden">
        <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
          {icon} {eyebrow}
        </span>
      </div>
      <div className="p-5">
        <p className="text-base font-bold text-foreground mb-1.5 flex items-center gap-1">
          {title}
          <ArrowUpRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
        </p>
        <p className="text-sm text-foreground/65 leading-relaxed">{body}</p>
      </div>
    </Link>
  )
}

function MiniCard({
  href, external, icon, title, body,
}: { href: string; external?: boolean; icon: React.ReactNode; title: string; body: string }) {
  const inner = (
    <>
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10 text-accent mb-2.5">{icon}</span>
      <p className="text-sm font-bold text-foreground mb-1">{title}</p>
      <p className="text-xs text-foreground/60 leading-relaxed">{body}</p>
    </>
  )
  const cls = 'group flex flex-col rounded-2xl border border-slate-200 bg-white/70 backdrop-blur p-5 hover:border-accent hover:shadow-sm transition-all'
  const cta = `partner-tool-${href.replace(/^\//, '')}`
  return external ? (
    <a href={href} data-track-cta={cta} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
  ) : (
    <Link href={href} data-track-cta={cta} className={cls}>{inner}</Link>
  )
}

function PathwayStep({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="relative flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-accent/10 text-accent">
        {icon}
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold">{n}</span>
      </span>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        <p className="text-xs text-foreground/60 leading-relaxed mt-0.5">{body}</p>
      </div>
    </li>
  )
}
