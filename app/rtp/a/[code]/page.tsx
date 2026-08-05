import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import { RtpAthleteApp } from '@/components/rtp/RtpAthleteApp'

/**
 * Athlete / parent pathway surface (pre-launch, gated + noindex).
 *
 * GATING: server-side requireAiCourseAccess() runs BEFORE the client app loads
 * — admin / demo-key / enrolled only. noindex is set at the /rtp layout. The
 * client app enforces the consent gate before any health data is collected.
 *
 * `[code]` is the athlete share code; the special value `new` starts onboarding
 * (optionally `?org=CODE` to pair to a club/school).
 */
interface PageProps {
  params: Promise<{ code: string }>
  searchParams: Promise<{ org?: string }>
}

export default async function RtpAthletePage({ params, searchParams }: PageProps) {
  // `redirect` — NOT `from`: /login only ever reads ?redirect=.
  await requireAiCourseAccess('/login?redirect=%2Frtp')
  const { code } = await params
  const { org } = await searchParams
  return <RtpAthleteApp code={code} orgCode={org} />
}
