import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Concussion Knowledge Test | Test Your Clinical Skills',
  description: 'Test your concussion assessment knowledge with 6 expert-level clinical questions. Identify gaps in vestibular assessment, differential diagnosis, and return-to-play decisions.',
  openGraph: {
    title: 'Free Concussion Knowledge Test',
    description: 'Test your concussion assessment knowledge with 6 expert-level clinical questions. Identify your learning gaps.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/assessment',
  },
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
