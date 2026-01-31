import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free SCAT6 PDF Download | Fillable SCAT6 & SCOAT6 Forms | Auto-Calculating',
  description: 'Download FREE fillable SCAT6 and SCOAT6 PDFs with auto-calculating scores. 2026 updated, Berlin Consensus aligned. Includes free training course. No printing required.',
  keywords: 'SCAT6 PDF, SCAT6 download, fillable SCAT6, SCAT6 fillable PDF, SCOAT6 PDF, SCOAT6 download, fillable SCOAT6, free SCAT6, SCAT6 form download, SCAT6 PDF free, concussion assessment form, SCAT6 fillable form, SCOAT6 fillable form, SCAT6 2026, Berlin Consensus SCAT6',
  openGraph: {
    title: 'Free SCAT6 & SCOAT6 PDF Download | Fillable Forms',
    description: 'Get FREE fillable SCAT6 and SCOAT6 PDFs with auto-calculating scores. Instant download + free training course.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat6-download',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SCAT6 & SCOAT6 PDF Download',
    description: 'Fillable PDFs with auto-calculating scores. 2026 updated. Instant download.',
  },
  alternates: {
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
