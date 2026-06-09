import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Login',
  description: 'Verifying your login to Concussion Education Australia.',
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
