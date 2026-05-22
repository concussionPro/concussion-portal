import { DemoWatermark } from '@/components/ai-course/DemoWatermark'

/**
 * Layout wrapper for every route under /courses. Adds the DemoWatermark
 * globally — it only renders when the demo_org cookie is present (i.e.
 * the viewer is a partner using a demo-access key), so admin sessions
 * remain visually clean.
 */
export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoWatermark />
      {children}
    </>
  )
}
