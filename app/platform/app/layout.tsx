import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'

/**
 * /platform/app — the full SST Trainer (self-guided allowed). PAID surface:
 * the marketing funnel above went public for clinic pitching (2026-07-05),
 * but the app keeps the enrolled/admin/demo gate (access model 2026-07-04:
 * self-guided is a paid capability; the public patient entry is /sst-trainer
 * with a clinic code).
 */
export default async function PlatformAppLayout({ children }: { children: React.ReactNode }) {
  await requireAiCourseAccess('/login')
  return <>{children}</>
}
