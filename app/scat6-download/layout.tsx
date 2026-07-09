import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free SCAT6 & SCOAT6 Fillable PDF Download',
  description: 'Download free fillable SCAT6 and SCOAT6 PDF forms — enter your email for instant download. 2026 updated, Amsterdam 2023 Consensus aligned. Free ~1-hour SCAT6 training course also available.',
  keywords: 'SCAT6 PDF, SCAT6 download, fillable SCAT6, SCOAT6 PDF, SCOAT6 download, free SCAT6, SCAT6 form, concussion assessment tool, SCAT6 2026, Amsterdam Consensus SCAT6',
  openGraph: {
    title: 'Free SCAT6 & SCOAT6 Fillable PDF Download',
    description: 'Free fillable SCAT6 and SCOAT6 PDF forms — instant download after entering your email. 2026 updated.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat6-download',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SCAT6 & SCOAT6 Fillable PDF Download',
    description: 'Free fillable SCAT6 and SCOAT6 PDFs — instant download. 2026 updated.',
  },
  alternates: {
    // Self-canonical: this page targets PDF-download intent; /scat-mastery
    // targets the free-course intent. Distinct queries, distinct pages.
    canonical: 'https://portal.concussion-education-australia.com/scat6-download',
  },
}

export default function SCAT6DownloadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
