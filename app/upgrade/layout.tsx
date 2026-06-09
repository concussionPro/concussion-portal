import { Metadata } from 'next'

// Thin authenticated upsell surface — keep it out of search indexes.
// (page.tsx is a client component, so robots metadata lives here.)
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return children
}
