import type { Metadata } from 'next'

// Pre-release page: list-only, never indexed, never in sitemaps or navs.
export const metadata: Metadata = {
  title: 'Melbourne hands-on day — pre-release',
  robots: 'noindex, nofollow',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
