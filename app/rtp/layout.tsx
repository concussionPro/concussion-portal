import { Metadata } from 'next'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'

// Shared SST design typefaces — Hanken for UI, Space Grotesk for numerals.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-hanken',
  display: 'swap',
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
})

// PRE-LAUCH: the entire RTP surface is gated + must NOT be indexed and must NOT
// be linked from public nav. This subtree-level noindex covers the landing page
// and every athlete pathway page (which are client components and can't export
// their own metadata).
export const metadata: Metadata = {
  title: 'Return-to-Sport Pathway — CEA',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function RtpLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${hanken.variable} ${spaceGrotesk.variable}`}>{children}</div>
}
