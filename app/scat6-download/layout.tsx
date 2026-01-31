import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free SCAT6 & SCOAT6 Forms + Training | Web Forms & PDFs',
  description: 'FREE web-based SCAT6 & SCOAT6 forms with auto-calculating scores + downloadable fillable PDFs. 2026 updated, Berlin Consensus aligned. Includes free 2-hour training course.',
  keywords: 'SCAT6 online form, SCAT6 web form, SCAT6 PDF, SCAT6 download, fillable SCAT6, SCOAT6 online, SCOAT6 PDF, free SCAT6, SCAT6 form, concussion assessment tool, SCAT6 training, SCAT6 2026, Berlin Consensus SCAT6',
  openGraph: {
    title: 'Free SCAT6 & SCOAT6 Web Forms + PDFs + Training',
    description: 'Web-based forms with auto-calculating scores + downloadable fillable PDFs. FREE 2-hour training course included.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat6-download',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SCAT6 & SCOAT6 Web Forms + PDFs',
    description: 'Web forms with auto-calculating scores + fillable PDFs. 2026 updated. Free training included.',
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
