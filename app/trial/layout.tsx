import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Try Module 1 Free | Concussion Science Fundamentals | ConcussionPro',
  description: 'Try the first module of ConcussionPro free. Learn concussion science fundamentals including neurometabolic cascade, biomechanics, and risk factors. No credit card required. 45 minutes, 1 CPD point.',
  keywords: 'free concussion course, try concussion module, concussion science, neurometabolic cascade concussion, concussion risk factors, free CPD concussion',
  openGraph: {
    title: 'Try Module 1 Free — Concussion Science Fundamentals',
    description: 'Start learning concussion management for free. 45-minute module covering science fundamentals. No credit card required.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/trial',
  },
}

export default function TrialLayout({ children }: { children: React.ReactNode }) {
  return children
}
