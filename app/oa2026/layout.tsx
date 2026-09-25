import type { Metadata } from 'next'

// Conference QR target. Event-scoped and goes stale after 16 Oct 2026, so it
// is kept out of search — it must never compete with /course or outlive the
// event in an index.
export const metadata: Metadata = {
  title: 'Concussion science in practice — Osteopathy Australia 2026',
  description:
    'Resources and enrolment for attendees of the Concussion Science in Practice workshop, Osteopathy Australia National Conference, 16 October 2026.',
  robots: 'noindex, nofollow',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
