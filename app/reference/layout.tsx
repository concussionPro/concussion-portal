import { Metadata } from 'next'

// Post-purchase confirmation surface (/reference/success) — never index, same
// discipline as app/checkout/layout.tsx. Without this it inherited the root
// layout's `robots: { index: true, follow: true }` and was crawlable.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
  return children
}
