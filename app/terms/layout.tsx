import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Refund Policy | ConcussionPro',
  description: 'Refund policy, terms of service, and Australian Consumer Law rights for ConcussionPro concussion management courses.',
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/terms',
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
