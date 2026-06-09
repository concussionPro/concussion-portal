import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login | Concussion Education Australia',
  description: 'Log in to your Concussion Education Australia account to access your concussion management CPD course.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
