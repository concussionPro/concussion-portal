import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { verifyCertificate } from '@/lib/ai-course/certificate'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'

interface PageParams {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Verify Certificate — AI in Clinical Practice',
  robots: 'noindex, nofollow',
}

/**
 * Verification page — admin-gated during preview. Once AI_COURSE_PUBLIC
 * is set, this becomes accessible to anyone with a certificate ID URL.
 * Until then, third-party verification (insurers, employers) requires
 * the admin key — by design, since the course is not yet public.
 */
export default async function VerifyCertificatePage({ params }: PageParams) {
  const access = await requireAiCourseAccess()
  const { id } = await params
  if (!id || id.length < 8) notFound()
  const cert = await verifyCertificate(id)
  if (!cert) notFound()

  const emailDomain = cert.email.includes('@') ? cert.email.split('@')[1] : 'unknown'
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiresDate = new Date(cert.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />
        <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">
          Certificate verification
        </p>

        <div className={`rounded-2xl border-2 p-8 mb-6 ${
          cert.isValid
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-red-300 bg-red-50'
        }`}>
          <p className="text-xs font-bold uppercase tracking-wide mb-2">
            {cert.isValid ? '✓ Valid' : '✗ Expired'}
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-1">{cert.name}</h1>
          <p className="text-sm text-muted-foreground">@{emailDomain}</p>
        </div>

        <div className="card rounded-xl p-6 mb-4">
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Course</dt>
            <dd className="font-semibold">AI in Clinical Practice</dd>

            <dt className="text-muted-foreground">Issuer</dt>
            <dd className="font-semibold">Concussion Education Australia</dd>

            <dt className="text-muted-foreground">Certificate ID</dt>
            <dd className="font-mono text-xs">{cert.certificateId}</dd>

            <dt className="text-muted-foreground">Issued</dt>
            <dd>{issuedDate}</dd>

            <dt className="text-muted-foreground">Expires</dt>
            <dd>{expiresDate}</dd>

            <dt className="text-muted-foreground">Status</dt>
            <dd className={cert.isValid ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
              {cert.isValid ? 'Current' : 'Expired — re-certification required'}
            </dd>
          </dl>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          This certificate attests that the holder has completed the AI in Clinical Practice course covering AHPRA-aligned AI use, Australian Privacy Principles, TGA boundaries, and documentation standards. The course is education for Australian registered health practitioners and does not replace legal or indemnity advice.
        </p>
      </div>
    </div>
  )
}
