import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CourseSidebar } from '@/components/ai-course/CourseSidebar'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { getUserCertificate } from '@/lib/ai-course/certificate'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Certificate — AI in Clinical Practice',
  robots: 'noindex, nofollow',
}

export default async function CertificatePage() {
  const access = await requireAiCourseAccess()
  const cert = access.email ? await getUserCertificate(access.email) : null

  if (!cert) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <CourseSidebar />
        <main className="md:pl-64">
        <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
          <AdminPreviewBadge access={access} />
          <h1 className="text-3xl font-bold tracking-tight mb-3">Certificate</h1>
          <p className="text-muted-foreground mb-8">
            No certificate has been issued yet. Pass the quiz to receive one.
          </p>
          <Link
            href="/courses/ai-in-clinical-practice/quiz"
            className="inline-block px-5 py-2.5 rounded-lg bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 transition-colors"
          >
            Take the quiz →
          </Link>
        </div>
        </main>
      </div>
    )
  }

  const verifyUrl = `${CONFIG.SEO.SITE_URL}/courses/ai-in-clinical-practice/verify/${cert.certificateId}`
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiresDate = new Date(cert.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <CourseSidebar />
      <main className="md:pl-64">
      <div className="max-w-3xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />
        <h1 className="text-3xl font-bold tracking-tight mb-8">Your certificate</h1>

        {/* Certificate display */}
        <div className="rounded-2xl border-4 border-double border-slate-300 bg-white p-10 mb-8 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Concussion Education Australia
          </p>
          <p className="text-sm text-muted-foreground mb-8">Certificate of Completion</p>
          <h2 className="text-2xl font-bold text-foreground mb-2">AI in Clinical Practice</h2>
          <p className="text-xs text-muted-foreground mb-8">Aligned with AHPRA&apos;s 2025 AI guidance, Australian Privacy Principles, and TGA Therapeutic Goods Advertising Code</p>

          <p className="text-xs text-muted-foreground mb-1">Awarded to</p>
          <p className="text-2xl font-bold text-foreground mb-10">{cert.name}</p>

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

        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href={`/api/ai-course/certificate/pdf/${cert.certificateId}`}
            className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground">Download PDF</p>
            <p className="text-xs text-muted-foreground mt-1">A4, single-page, print-ready</p>
          </a>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-sm font-semibold text-foreground">Public verification URL</p>
            <p className="text-xs text-muted-foreground mt-1">Share with insurers, employers, clinics</p>
          </a>
        </div>
      </div>
      </main>
    </div>
  )
}
