import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteNav } from '@/components/SiteNav'
import { verifyCourseCertificate } from '@/lib/course-certificates'

interface PageParams {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: 'Certificate Verification — Concussion Education Australia',
  robots: 'noindex, nofollow',
}

/**
 * PUBLIC certificate verification — no auth. This is the /verify/:id URL
 * printed on every short-course certificate (course_certificates table,
 * e.g. The Vagus Nerve in Clinical Practice). The high-entropy certificate
 * ID is the bearer token: employers, insurers, and AHPRA auditors without
 * portal accounts can confirm a certificate directly.
 */
export default async function VerifyPage({ params }: PageParams) {
  const { id } = await params
  if (!id || id.length < 8 || !/^[A-Za-z0-9_-]+$/.test(id)) notFound()

  const cert = await verifyCourseCertificate(id)

  if (!cert) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-20">
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">
            Certificate verification
          </p>
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-8 mb-6">
            <p className="text-xs font-bold uppercase tracking-wide text-red-700 mb-2">
              ✗ Not found
            </p>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              No certificate matches this ID.
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              The certificate ID in this URL does not match any certificate issued by Concussion Education Australia. Check the URL was copied in full, or ask the certificate holder to re-share the verification link from their certificate page.
            </p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Questions about a certificate? Contact Concussion Education Australia via concussion-education-australia.com.
          </p>
        </div>
      </div>
    )
  }

  const holder = cert.name || cert.email
  const emailDomain = cert.email.includes('@') ? cert.email.split('@')[1] : 'unknown'
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const expiresDate = new Date(cert.expiresAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-20">
        <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">
          Certificate verification
        </p>

        <div className={`rounded-2xl border-2 p-8 mb-6 ${
          cert.isValid
            ? 'border-emerald-300 bg-emerald-50'
            : 'border-red-300 bg-red-50'
        }`}>
          {/* A refunded / charged-back certificate must NEVER read "Valid" —
              it is a CPD document someone may be lodging with ESSA or OA. */}
          <p className="text-xs font-bold uppercase tracking-wide mb-2">
            {cert.isValid ? '✓ Valid' : cert.invalidReason === 'revoked' ? '✗ Revoked' : '✗ Expired'}
          </p>
          <h1 className="text-2xl font-bold text-foreground mb-1">{holder}</h1>
          <p className="text-sm text-muted-foreground">@{emailDomain}</p>
        </div>

        <div className="card rounded-xl p-6 mb-4">
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Course</dt>
            <dd className="font-semibold">{cert.courseTitle}</dd>

            <dt className="text-muted-foreground">Issuer</dt>
            <dd className="font-semibold">Concussion Education Australia</dd>

            <dt className="text-muted-foreground">CPD hours</dt>
            <dd className="font-semibold tabular-nums">{cert.cpdHours}</dd>

            <dt className="text-muted-foreground">Certificate ID</dt>
            <dd className="font-mono text-xs">{cert.certificateId}</dd>

            <dt className="text-muted-foreground">Issued</dt>
            <dd>{issuedDate}</dd>

            <dt className="text-muted-foreground">Expires</dt>
            <dd>{expiresDate}</dd>

            <dt className="text-muted-foreground">Status</dt>
            <dd className={cert.isValid ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
              {cert.isValid
                ? 'Current'
                : cert.invalidReason === 'revoked'
                  ? 'Revoked — the enrolment behind this certificate was refunded or charged back. This certificate is not valid and should not be accepted as CPD evidence.'
                  : 'Expired — re-certification required'}
            </dd>
          </dl>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          This certificate attests that the holder completed the named continuing-education course from Concussion Education Australia and passed its assessment. It is a CPD completion record, not a regulator-issued credential, and does not replace legal or indemnity advice.
        </p>
      </div>
    </div>
  )
}
