import { Metadata } from 'next'
import { CONFIG } from '@/lib/config'
import HomeClient from './HomeClient'

// Server wrapper so the homepage can export metadata (HomeClient is a client
// component — onClick analytics handlers — and can't). Canonical prevents
// query-string / tracking-param variants of "/" splitting indexing signals.
export const metadata: Metadata = {
  alternates: {
    canonical: CONFIG.SEO.SITE_URL,
  },
}

export default function HomePage() {
  return <HomeClient />
}
