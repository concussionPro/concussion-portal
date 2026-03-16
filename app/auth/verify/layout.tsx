import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Login | ConcussionPro',
  description: 'Verifying your login to ConcussionPro.',
}

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return children
}
