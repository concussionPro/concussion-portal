import { DemoWatermark } from '@/components/ai-course/DemoWatermark'
import { DemoTrackingProvider } from '@/components/ai-course/DemoTrackingProvider'

/**
 * Layout wrapper for every route under /courses. Adds:
 * - DemoWatermark: visual confidentiality stripe (only renders when
 *   demo_org cookie is present)
 * - DemoTrackingProvider: analytics events attributed to the partner
 *   organisation, so behaviour can be reviewed at /admin/demo-activity
 * Both no-op for admin sessions and real users.
 */
export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoWatermark />
      <DemoTrackingProvider />
      {children}
    </>
  )
}
