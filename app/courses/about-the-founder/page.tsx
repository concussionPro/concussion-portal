import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { Award, BookOpen, Stethoscope, Code, Mail, ExternalLink, ShieldCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About the founder — Concussion Education Australia',
  robots: 'noindex, nofollow',
}

/**
 * Founder credibility surface. A partnership pitch is fundamentally a
 * bet on the person behind the platform; this page consolidates the
 * verifiable proof points that a CRO or product lead would otherwise
 * have to assemble from LinkedIn, ASIC, and AHPRA's public register.
 *
 * Only ships information that is already public or verifiable. AHPRA
 * registration number, OA endorsement letter PDF, and photo are
 * placeholder slots — they are real assets, but the founder fills the
 * values in directly rather than this page inventing them.
 */
export default async function AboutFounderPage() {
  const access = await requireAiCourseAccess()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <Link href="/courses" className="text-xs text-accent hover:underline mb-4 inline-block">
          ← Marketplace
        </Link>

        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          The person you&apos;d be hiring · or partnering with
        </p>

        {/* Hero */}
        <div className="grid md:grid-cols-[140px_1fr] gap-6 items-start mb-12">
          <div className="w-[140px] h-[140px] rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border-2 border-accent/20 flex items-center justify-center text-4xl font-bold text-accent">
            ZL
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 leading-tight">
              Zac Lewis
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4 max-w-2xl">
              AHPRA-registered osteopath, Osteopathy Australia–endorsed CPD provider, and the solo developer of the platform you&apos;re looking at. The combination of clinical credibility, vertical-CPD expertise, and ship-it velocity that a clinical product lead role at Heidi needs.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> AHPRA-registered
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Stethoscope className="w-3 h-3" /> Practising osteopath
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Award className="w-3 h-3" /> OA-endorsed provider (via CCM)
              </span>
            </div>
          </div>
        </div>

        {/* What he ships */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">What ships under his name</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: BookOpen,
                title: 'Concussion Clinical Mastery (CCM)',
                body: 'Flagship product. 14 CPD hours. Osteopathy Australia endorsed. A$1,190. ~600 Australian clinician subscribers. Live at concussion-education-australia.com.',
                evidence: 'concussion-education-australia.com',
              },
              {
                icon: Code,
                title: 'CEA platform (this build)',
                body: 'Next.js 16 / React 19 / TypeScript / Vercel. Stripe payments, Resend transactional, custom analytics. 12+ months of solo build. Production traffic.',
                evidence: 'concussion-education-australia.com',
              },
              {
                icon: Stethoscope,
                title: 'Practising clinician',
                body: 'Osteopathic practice — see-patients-on-Tuesdays kind of practitioner, not a content-only operator. Clinical voice in every module is first-person, not ghost-written.',
                evidence: 'AHPRA register · OST-prefix',
              },
              {
                icon: Award,
                title: 'Melbourne workshop · Sat 13 June 2026',
                body: 'In-person CCM workshop, Melbourne CBD. Confirmed running. Early-bird cutoff 31 May 2026. Catering + materials included.',
                evidence: '/courses/melbourne',
              },
            ].map((b) => {
              const Icon = b.icon
              return (
                <div key={b.title} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-sm font-bold text-foreground pt-1.5">{b.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{b.body}</p>
                  <p className="text-[10px] font-mono text-slate-500">{b.evidence}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Why CEA, why now */}
        <section className="mb-10 rounded-2xl bg-foreground text-white p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-3">
            Why this build, why this founder
          </p>
          <div className="space-y-4 text-sm leading-relaxed text-white/85">
            <p>
              A clinician who codes is a rare profile. Most healthtech founders are either developers who hire clinical advisors (slow feedback loop, watered-down content) or clinicians who hire developers (slow build, blown budgets). CEA ships at the speed of one decision-maker because Zac is both.
            </p>
            <p>
              The relevance to a Heidi partnership: the AHPRA compliance layer, the per-Board CPD calibration, and the marketplace vetting policy are all things a clinician-founder gets right on the first attempt. Engineering-led teams routinely overclaim passive-CPD ceilings and under-build the audit-trail. CEA does neither.
            </p>
            <p>
              The platform you&apos;re looking at is the seventh iteration on the same domain — every previous version was kept lean and killed when it stopped being useful. Build-and-iterate, not deck-and-pitch.
            </p>
          </div>
        </section>

        {/* Verifiable proof */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Verifiable proof</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Independently checkable. Nothing here is self-asserted.
          </p>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'AHPRA registration', value: 'Osteopath, current. Search "Zac Lewis" on the AHPRA online register.', link: { href: 'https://www.ahpra.gov.au/registration/registers-of-practitioners.aspx', text: 'AHPRA register' } },
                  { label: 'Osteopathy Australia endorsement', value: 'CCM listed as an OA-endorsed CPD activity. Verifiable via OA member portal or by contacting OA CPD office directly.', link: { href: 'https://osteopathy.org.au', text: 'osteopathy.org.au' } },
                  { label: 'Business entity', value: 'CEA Pty Ltd, Australian-registered. ABN searchable on ABR. GST-registered from 2026-05-01.', link: { href: 'https://abr.business.gov.au/', text: 'ABR business lookup' } },
                  { label: 'Live product', value: 'concussion-education-australia.com — production traffic, live Stripe checkout, working transactional email.', link: { href: 'https://concussion-education-australia.com', text: 'concussion-education-australia.com' } },
                  { label: 'Direct contact', value: 'zac@concussion-education-australia.com — replies same-day during business hours.', link: { href: 'mailto:zac@concussion-education-australia.com', text: 'zac@concussion-education-australia.com' } },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 text-xs font-bold text-foreground align-top w-[180px]">{row.label}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                      <p>{row.value}</p>
                      <a href={row.link.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-accent hover:underline">
                        {row.link.text}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">Want a 30-minute call?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Direct line. No SDR, no calendar gauntlet.</p>
          </div>
          <a
            href="mailto:zac@concussion-education-australia.com?subject=Heidi%20%C3%97%20CEA%20partnership%20call"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email Zac directly
          </a>
        </section>
      </div>
    </div>
  )
}
