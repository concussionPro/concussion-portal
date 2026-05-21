import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'
import { isUserEnrolled } from '@/lib/ai-course/access'
import { MODULES } from '@/lib/ai-course/content'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'

export const metadata: Metadata = {
  title: 'AI in Clinical Practice — Admin Preview',
  description: 'Course preview, admin only.',
  robots: 'noindex, nofollow',
}

async function checkAccess(): Promise<{ ok: boolean; reason: string }> {
  if (process.env.AI_COURSE_PUBLIC === 'true') return { ok: true, reason: 'public' }
  const cookieStore = await cookies()
  const headerList = await headers()

  // Admin check via session cookie or x-admin-key header
  const adminSession = cookieStore.get('admin_session')?.value
  if (adminSession) return { ok: true, reason: 'admin' }
  const adminKey = headerList.get('x-admin-key')
  if (adminKey && process.env.ADMIN_API_KEY && adminKey === process.env.ADMIN_API_KEY) {
    return { ok: true, reason: 'admin-header' }
  }

  // User check
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return { ok: false, reason: 'no-session' }
  const session = verifySessionToken(sessionCookie)
  if (!session) return { ok: false, reason: 'invalid-session' }
  const enrolled = await isUserEnrolled(session.email)
  if (enrolled) return { ok: true, reason: 'enrolled' }
  return { ok: false, reason: 'not-enrolled' }
}

export default async function CoursePage() {
  const access = await checkAccess()
  if (!access.ok) {
    redirect('/login?from=/courses/ai-in-clinical-practice')
  }

  const totalMin = MODULES.reduce((sum, m) => sum + m.durationMin, 0)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            ADMIN PREVIEW · NOT PUBLIC
          </span>
          <span className="text-[10px] text-muted-foreground">Access: {access.reason}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          AI in Clinical Practice
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          For Australian clinicians using LLMs in patient care.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          {MODULES.length} modules · {totalMin} minutes total · Certificate of completion on passing the quiz.
        </p>

        <div className="grid gap-3 mb-12">
          {MODULES.map((m) => (
            <Link
              key={m.slug}
              href={`/courses/ai-in-clinical-practice/${m.slug}`}
              className="card rounded-xl p-5 hover:border-accent/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                      Module {m.number}
                    </span>
                    {m.loadBearing && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        Required
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{m.durationMin} min</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-snug">{m.description}</p>
                </div>
                <span className="text-accent shrink-0 mt-1">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <Link
            href="/courses/ai-in-clinical-practice/hub"
            className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">AI Practice Hub</p>
            <p className="text-sm text-foreground font-semibold">Prompts · Templates · Tools</p>
            <p className="text-xs text-muted-foreground mt-1">Post-course resources.</p>
          </Link>
          <Link
            href="/courses/ai-in-clinical-practice/quiz"
            className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">Quiz</p>
            <p className="text-sm text-foreground font-semibold">10 questions · 8/10 to pass</p>
            <p className="text-xs text-muted-foreground mt-1">Issues the certificate on pass.</p>
          </Link>
          <Link
            href="/courses/ai-in-clinical-practice/certificate"
            className="card rounded-xl p-4 hover:border-accent/40 transition-colors"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">My Certificate</p>
            <p className="text-sm text-foreground font-semibold">Download / verify</p>
            <p className="text-xs text-muted-foreground mt-1">12-month validity.</p>
          </Link>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
          <p className="font-semibold mb-2">Education, not legal advice.</p>
          <p>
            This course is general clinical education for Australian registered health practitioners. It does not constitute legal advice. For case-specific guidance, consult your professional indemnity insurer (Avant, MIPS, Guild, MIGA) and, where appropriate, a regulatory lawyer. AHPRA and OAIC guidance referenced throughout is current as of the last content refresh — see the Hub update feed for the latest.
          </p>
        </div>
      </div>
    </div>
  )
}
