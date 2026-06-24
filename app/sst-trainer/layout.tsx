import { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import SstPwaRegister from '@/components/platform/SstPwaRegister'

// Hanken Grotesk = the design's UI typeface; Space Grotesk = the instrument /
// numeric face used for HR, scores and clocks (tabular figures).
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

// NOTE: this app is pre-launch and patient-facing. It must NOT be indexed and
// must NOT be linked from any public nav. Metadata can't live in the page
// because the page is a client component ('use client'), so the noindex
// directive lives here in the sibling server layout.
export const metadata: Metadata = {
  title: 'Sub-Symptom-Threshold Trainer',
  // Installable PWA — this PUBLIC route is the app-store entry (free with clinic
  // code), so it links the manifest + apple-touch icon and registers the SW.
  manifest: '/sst.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'SST Trainer' },
  icons: { apple: '/sst-apple-touch-180.png', icon: '/sst-icon-192.png' },
  // Pre-launch & patient-facing: not indexed, not in public nav.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export const viewport: Viewport = {
  themeColor: '#16243f',
}

export default function SstTrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${hanken.variable} ${spaceGrotesk.variable}`}>
      <SstPwaRegister />
      {children}
    </div>
  )
}
