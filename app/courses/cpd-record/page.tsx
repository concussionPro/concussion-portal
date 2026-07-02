import { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { COURSES, findCourse, findProvider } from '@/lib/ai-course/provider-catalogue'
import { getCourseCertificate } from '@/lib/course-certificates'
import { getUserCertificate } from '@/lib/ai-course/certificate'
import { verifySessionToken } from '@/lib/jwt-session'
import { Check, AlertCircle, Award } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CPD Record — Audit-ready export',
  robots: 'noindex, nofollow',
}

interface EarnedCert {
  courseTitle: string
  providerName: string
  cpdHours: number
  completedAt: string
  certificateId: string
  isValid: boolean
  /** Public verification page, where one exists for this certificate type */
  verifyHref: string | null
}

/**
 * CPD record — the viewer's GENUINELY earned certificates only.
 *
 * Sources (both real, no demo rows):
 *   - AI in Clinical Practice — certificate stored on users.* columns
 *     (lib/ai-course/certificate.ts, getUserCertificate)
 *   - Short courses (vagus-nerve etc.) — generic course_certificates table
 *     (lib/course-certificates.ts, getCourseCertificate per catalogue slug)
 *
 * Viewers with no session email (e.g. admin/demo-key) or no completions see
 * the honest empty state.
 */
export default async function CpdRecordPage() {
  const access = await requireAiCourseAccess()

  // Resolve the viewer's email: enrolled users carry it on the gate result;
  // otherwise fall back to the login session cookie (an admin or demo viewer
  // may also be logged in as a user).
  let email = access.email ?? null
  if (!email) {
    const sessionCookie = (await cookies()).get('session')?.value
    const session = sessionCookie ? verifySessionToken(sessionCookie) : null
    email = session?.email ?? null
  }

  const earned: EarnedCert[] = []
  if (email) {
    // AI course certificate (separate, older pipeline on the users table)
    const aiCert = await getUserCertificate(email).catch(() => null)
    if (aiCert) {
      const course = findCourse('ai-in-clinical-practice')
      earned.push({
        courseTitle: course?.title || 'AI in Clinical Practice',
        providerName: findProvider(course?.providerId || 'cea')?.shortName || 'CEA',
        cpdHours: course?.cpdHours ?? 2,
        completedAt: aiCert.issuedAt,
        certificateId: aiCert.certificateId,
        isValid: aiCert.isValid,
        verifyHref: `/courses/ai-in-clinical-practice/verify/${aiCert.certificateId}`,
      })
    }

    // Generic per-course certificate store (short courses)
    const courseCerts = await Promise.all(
      COURSES.filter((c) => c.id !== 'ai-in-clinical-practice').map((c) =>
        getCourseCertificate(email as string, c.id).catch(() => null)
      )
    )
    for (const cert of courseCerts) {
      if (!cert) continue
      const course = findCourse(cert.courseSlug)
      earned.push({
        courseTitle: cert.courseTitle,
        providerName: findProvider(course?.providerId || 'cea')?.shortName || 'CEA',
        cpdHours: cert.cpdHours,
        completedAt: cert.issuedAt,
        certificateId: cert.certificateId,
        isValid: cert.isValid,
        verifyHref: null,
      })
    }
  }

  const totalHours = earned.reduce((s, c) => s + c.cpdHours, 0)
  const validCount = earned.filter((c) => c.isValid).length
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <div className="mb-2 flex items-center gap-2">
          <Link href="/courses" className="text-xs text-accent hover:underline">← All courses</Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          CPD Record
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Your completed CEA courses — every certificate you&apos;ve earned, with hours and verification IDs.
        </p>

        {earned.length === 0 ? (
          /* Honest empty state — no demo rows, ever */
          <div className="card rounded-xl p-10 text-center">
            <Award className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-base font-semibold text-foreground mb-2">
              You haven&apos;t earned any certificates yet — complete a course quiz to generate one.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Certificates from completed CEA courses appear here automatically, with CPD hours and a verifiable certificate ID.
            </p>
            <Link
              href="/courses"
              className="inline-block px-5 py-2.5 rounded-lg bg-foreground text-white font-semibold text-sm hover:bg-foreground/90 transition-colors"
            >
              Browse courses →
            </Link>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <div className="card rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">CPD hours earned</p>
                <p className="text-3xl font-bold text-foreground">{totalHours}</p>
                <p className="text-xs text-muted-foreground">across {earned.length} {earned.length === 1 ? 'course' : 'courses'}</p>
              </div>
              <div className="card rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Certificates</p>
                <p className="text-3xl font-bold text-foreground">{earned.length}</p>
                <p className="text-xs text-muted-foreground">{validCount} currently valid</p>
              </div>
              <div className="card rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Verification</p>
                <p className="text-3xl font-bold text-foreground">Per certificate</p>
                <p className="text-xs text-muted-foreground">Each entry carries its own certificate ID</p>
              </div>
            </div>

            {/* Completion table — genuinely earned certificates only */}
            <div className="card rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Course</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Provider</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right">Hours</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Completed</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {earned.map((c) => (
                    <tr key={c.certificateId} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-foreground">{c.courseTitle}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{c.providerName}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.cpdHours}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(c.completedAt)}</td>
                      <td className="px-4 py-3 text-xs">
                        {c.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <Check className="w-3.5 h-3.5" />
                            {c.verifyHref ? (
                              <Link href={c.verifyHref} className="hover:underline font-mono">
                                {c.certificateId.slice(0, 12)}
                              </Link>
                            ) : (
                              <span className="font-mono">{c.certificateId.slice(0, 12)}</span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Expired — re-take the quiz to renew
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
              <strong>Logging with AHPRA:</strong> record each activity with the course name, provider (Concussion Education Australia), hours, completion date, certificate ID, and a brief reflection on relevance to your practice.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
