import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { VagusCourseSidebar } from '@/components/ai-course/VagusCourseSidebar'
import { AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { requireCourseAccess } from '@/lib/course-access'
import { getCourseCertificate } from '@/lib/course-certificates'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Certificate — The Vagus Nerve in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function VagusCertificatePage() {
  const access = await requireCourseAccess('vagus-nerve')
  const cert = access.email
    ? await getCourseCertificate(access.email, 'vagus-nerve').catch(() => null)
    : null

  if (!cert) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <VagusCourseSidebar />
        <main className="md:pl-72">
          <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
            <AdminPreviewBadge access={access} />
            <h1 className="text-3xl font-bold tracking-tight mb-3">Certificate</h1>
            <p className="text-muted-foreground mb-8">
              No certificate has been issued yet. Pass the quiz (8/10) to receive one.
            </p>
            <Link
              href="/courses/vagus-nerve/quiz"
              className="inline-block px-5 py-2.5 rounded-lg bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 transition-colors"
            >
              Take the quiz →
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const verifyUrl = `${CONFIG.SEO.SITE_URL}/verify/${cert.certificateId}`
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const expiresDate = new Date(cert.expiresAt).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <VagusCourseSidebar />
      <main className="md:pl-72">
        <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />
          <h1 className="text-3xl font-bold tracking-tight mb-8">Your certificate</h1>

          {/* Certificate display */}
          <div className="rounded-2xl border-4 border-double border-slate-300 bg-white p-10 mb-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Concussion Education Australia
            </p>
            <p className="text-sm text-muted-foreground mb-8">Certificate of Completion</p>
            <h2 className="text-2xl font-bold text-foreground mb-2">{cert.courseTitle}</h2>
            <p className="text-xs text-muted-foreground mb-8">
              Evidence-based assessment and defensible interventions for autonomic dysfunction · {cert.cpdHours} CPD hours
            </p>

            <p className="text-xs text-muted-foreground mb-1">Awarded to</p>
            <p className="text-2xl font-bold text-foreground mb-10">{cert.name || cert.email}</p>

            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">{issuedDate}</p>
                <p>Issued</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{expiresDate}</p>
                <p>Valid until</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">{cert.certificateId.slice(0, 12)}</p>
                <p>Certificate ID</p>
              </div>
            </div>

            <p className="mt-8 text-[10px] text-muted-foreground">
              Verify at: <span className="font-mono">{verifyUrl}</span>
            </p>
          </div>

          {!cert.isValid && (
            <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-sm text-amber-900 mb-6">
              This certificate has expired. Re-take the (refreshed) quiz to renew for another 12 months.
            </div>
          )}

          {/* LinkedIn share — the /verify URL is public, so the post resolves for anyone */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-[#0A66C2] px-5 py-4 text-white shadow-sm hover:bg-[#004182] transition-colors"
          >
            <span>
              <span className="block text-sm font-semibold">Share this certificate on LinkedIn</span>
              <span className="block text-xs text-white/80 mt-0.5">Posts your public verification page — colleagues and employers can confirm it in one click.</span>
            </span>
            <span aria-hidden className="text-lg font-bold shrink-0">in</span>
          </a>

          {/* AHPRA logging guidance */}
          <section className="rounded-xl bg-slate-50 border border-slate-200 p-5 mb-6">
            <p className="text-sm font-bold text-foreground mb-2">Logging this in your AHPRA CPD record</p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Most AHPRA boards expect each CPD activity to be logged with: activity name, provider, hours, date, and a brief reflection on relevance to practice. The reflection element is what differentiates &quot;attended&quot; from &quot;learned&quot; — most boards explicitly require it.
            </p>
            <div className="rounded-lg bg-white border border-slate-200 p-3 text-xs text-foreground/85 leading-relaxed">
              <p className="font-bold mb-1">Suggested log entry</p>
              <p className="font-mono text-[11px] leading-relaxed">
                Activity: {cert.courseTitle}<br />
                Provider: Concussion Education Australia<br />
                Hours: {cert.cpdHours}<br />
                Date completed: {issuedDate}<br />
                Certificate ID: {cert.certificateId}<br />
                Reflection: [Add 2–3 sentences here — what changed in your practice / which patient population this applies to / one specific intervention you&apos;ll use]
              </p>
            </div>
          </section>

          {/* Cross-sell — more CPD from CEA */}
          <section className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
              More CPD from CEA
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                href="/courses/ai-in-clinical-practice"
                className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Short course · 2 CPD hours · A$99</p>
                <p className="text-sm font-semibold text-foreground leading-tight">AI in Clinical Practice</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">AHPRA-aligned AI compliance for Australian clinicians — scribes, privacy, documentation, indemnity positions.</p>
              </Link>
              <Link
                href="/pricing"
                className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Flagship · 8 CPD hours online · up to 16 with the workshop day</p>
                <p className="text-sm font-semibold text-foreground leading-tight">Concussion Clinical Mastery</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Osteopathy Australia–endorsed concussion assessment and management — SCAT6, VOMS, BESS, return-to-sport protocols.</p>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
