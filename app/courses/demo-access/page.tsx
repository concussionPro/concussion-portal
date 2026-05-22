import { Metadata } from 'next'
import { Suspense } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { DemoAccessClient } from './DemoAccessClient'

export const metadata: Metadata = {
  title: 'Demo Access — Confidential',
  robots: 'noindex, nofollow',
}

/**
 * Demo-access landing page. The recipient (e.g. Heidi exec) lands here
 * via a URL containing a demo key. Page requires:
 *   1. Email entry (logged for accountability)
 *   2. Confidentiality / no-build acknowledgement (the checkbox NDA)
 * On acceptance, the demo_key cookie is set with a 7-day TTL and the
 * recipient is redirected to /courses.
 *
 * This page is public — no auth required to reach it. The page itself
 * does not expose any course content; it gates the cookie that does.
 */
export default function DemoAccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-2xl mx-auto px-6 pt-[120px] pb-20">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <DemoAccessClient />
        </Suspense>
      </div>
    </div>
  )
}
