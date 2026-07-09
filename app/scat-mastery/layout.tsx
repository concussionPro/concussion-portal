import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free SCAT6/SCOAT6 Mastery Course | Fillable PDFs Included',
  description: 'FREE ~1-hour SCAT6 & SCOAT6 training course. Master concussion assessment with fillable PDFs, step-by-step training, and clinical toolkit.',
  keywords: 'SCAT6 PDF, SCOAT6 PDF, fillable SCAT6, SCAT6 download, SCAT6 training, SCOAT6 training, concussion assessment tool, free SCAT6 course, AHPRA CPD concussion, SCAT6 fillable form, SCOAT6 fillable form, concussion management course, SCAT6 vs SCOAT6',
  openGraph: {
    title: 'Free SCAT6/SCOAT6 Mastery Course | Fillable PDFs Included',
    description: 'Master SCAT6 & SCOAT6 concussion assessment. FREE ~1-hour course with fillable PDFs and training modules.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat-mastery',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SCAT6/SCOAT6 Mastery Course',
    description: 'FREE concussion assessment training. Fillable PDFs, step-by-step SCAT6 & SCOAT6 instruction.',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/scat-mastery',
  },
}

export default function SCATMasteryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
