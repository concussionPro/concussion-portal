import type { Metadata } from 'next'

/**
 * Internal polling surface.
 * noindex layout: this segment must never appear in search or AI-crawl
 * corpora (pages here are client components and cannot export metadata).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
