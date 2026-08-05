import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveClinicalAccess } from '@/lib/sst-trainer/access'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-session'

/**
 * /platform/app — the full SST Trainer (self-guided allowed). PAID surface:
 * the marketing funnel above went public for clinic pitching (2026-07-05),
 * but the app keeps a paid gate (access model 2026-07-04: self-guided is a
 * paid capability; the public patient entry is /sst-trainer with a clinic
 * code).
 *
 * The gate is CLINICAL entitlement — not the AI short course. It used to call
 * requireAiCourseAccess, which reads users.ai_course_enrolled (set only by
 * buying AI-in-Clinical-Practice), so every SST clinic, CCM buyer and CRM
 * buyer clicking "Get the app" was bounced to /login and then silently to
 * /dashboard (2026-08-05 crawl F1).
 */
export default async function PlatformAppLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies()
  if (jar.get('demo_key')?.value === DEMO_KEY) return <>{children}</>
  if (jar.get('clinic_demo')?.value === CLINIC_DEMO_KEY) return <>{children}</>
  if (verifyAdminSessionToken(jar.get(ADMIN_COOKIE_NAME)?.value)) return <>{children}</>

  const token = jar.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session) redirect('/login?redirect=%2Fplatform%2Fapp')

  const access = await resolveClinicalAccess({
    email: session.email,
    accessLevel: session.accessLevel,
  })
  // owner | course (CCM/online buyer) | sst (entitled clinic) all pass.
  if (access !== 'owner' && access !== 'course' && access !== 'sst') {
    redirect('/clinical-suite')
  }
  return <>{children}</>
}
