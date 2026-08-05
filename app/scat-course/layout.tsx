import { Metadata } from 'next'

export const metadata: Metadata = {
  // Page is a client component and can't export metadata, so without a title
  // here the route rendered the root layout's generic site title.
  title: 'Free SCAT6 Course',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
