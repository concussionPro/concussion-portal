import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CONFIG } from '@/lib/config'
import { SiteNav } from '@/components/SiteNav'
import { CourseStreams } from '@/components/cpd/CourseStreams'

// ─────────────────────────────────────────────────────────────────────────────
// /cpd — dual-tab course hub toggling the two CEA concussion CPD streams:
//   Allied Health (Concussion Clinical Mastery) ↔ Exercise Physiologists
//   (Concussion Rehab Mastery). The ESSA newsletter links to /cpd?stream=ep.
//
// Gating: the page is safe to deploy now and renders fine in both flag states
// (the EP tab shows the "accreditation pending" language while ESSA_ACCREDITED
// is false). We keep it OUT of the search index until the EP stream is truly
// live — robots flips to index,follow only when the flag is true. Do NOT add
// this route to any nav until the flag flips; the route simply existing is
// enough for the newsletter deep-link.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Concussion CPD Streams | Allied Health & Exercise Physiology | CEA',
  description:
    'Two concussion CPD streams from Concussion Education Australia: Concussion Clinical Mastery for allied health (8 CPD online, up to 16 with the workshop, endorsed by Osteopathy Australia) and Concussion Rehab Mastery scoped for Exercise Physiologists (8 CPD hours).',
  robots: CONFIG.FEATURES.ESSA_ACCREDITED ? 'index, follow' : 'noindex, nofollow',
}

export default function CpdPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <section className="section-padding pt-[120px]">
        <div className="container-lg px-6 md:px-8">
          <div className="text-center mb-10">
            <div className="badge mb-5">
              <span className="mr-1.5">🎓</span>
              Concussion CPD for Australian clinicians
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight leading-[1.1]">
              Two concussion CPD streams,
              <br className="hidden sm:block" /> one clinical standard
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Pick the stream scoped to your profession. Each is evidence-based, self-paced online,
              and built to count toward your CPD.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Suspense fallback={<div className="h-[520px]" aria-hidden="true" />}>
              <CourseStreams />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  )
}
