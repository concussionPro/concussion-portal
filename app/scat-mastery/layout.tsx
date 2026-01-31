import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free SCAT6/SCOAT6 Mastery Course | 2 CPD Hours | Fillable PDFs Included',
  description: 'FREE 2-hour SCAT6 & SCOAT6 training course. Master concussion assessment with fillable PDFs, step-by-step video training, and clinical toolkit. 2 AHPRA CPD hours. 3,247+ clinicians trained.',
  keywords: 'SCAT6 PDF, SCOAT6 PDF, fillable SCAT6, SCAT6 download, SCAT6 training, SCOAT6 training, concussion assessment tool, free SCAT6 course, AHPRA CPD concussion, SCAT6 fillable form, SCOAT6 fillable form, concussion management course, SCAT6 vs SCOAT6',
  openGraph: {
    title: 'Free SCAT6/SCOAT6 Mastery Course | Fillable PDFs Included',
    description: 'Master SCAT6 & SCOAT6 concussion assessment. FREE 2-hour course with fillable PDFs, video training, and 2 CPD hours.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat-mastery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SCAT6/SCOAT6 Mastery Course',
    description: 'FREE concussion assessment training. Fillable PDFs, 2 CPD hours, step-by-step SCAT6 & SCOAT6 instruction.',
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
