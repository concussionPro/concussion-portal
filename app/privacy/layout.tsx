import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Health Information',
  description:
    'How Concussion Education Australia collects, uses, stores and discloses personal and health information through its clinical tools, including concussion baseline testing. Australian Privacy Principles aligned.',
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/privacy',
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
