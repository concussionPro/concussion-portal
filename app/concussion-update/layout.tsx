import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Concussion Care Has Changed — Free Clinician Module',
  description:
    'Free ~1-hour module for clinicians. Recognition, red flags, and the new first-line treatment concussion care now involves — the paradigm shift most clinicians were never trained on. Certificate of completion, no credit card.',
  keywords:
    'concussion training, concussion management course, concussion recognition, concussion red flags, sub-symptom-threshold aerobic exercise, Amsterdam consensus concussion, free concussion course, AHPRA concussion CPD, return to play, concussion first-line treatment',
  openGraph: {
    title: 'Concussion Care Has Changed — Free Clinician Module',
    description:
      'Rest is out; early sub-symptom-threshold aerobic exercise is first-line. Most clinicians were trained on the old model. Free ~1-hour module brings you up to date. Certificate on completion.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/concussion-update',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Concussion Care Has Changed — Free Clinician Module',
    description:
      'Recognition, red flags, and the new first-line treatment every clinician should know. Free ~1-hour module with a certificate of completion.',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/concussion-update',
  },
}

export default function ConcussionUpdateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
