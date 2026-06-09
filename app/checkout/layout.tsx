import { Metadata } from 'next'

// Post-purchase confirmation surfaces — never index checkout pages.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
