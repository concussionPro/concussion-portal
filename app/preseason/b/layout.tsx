import type { Metadata } from 'next'

/**
 * Per-prospect preseason pitch pages (private).
 * noindex layout: this segment must never appear in search or AI-crawl
 * corpora (pages here are client components and cannot export metadata).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  // Next INHERITS `alternates` down the tree, so these private per-prospect
  // pages were emitting the parent's canonical (…/preseason) — pointing a
  // noindexed private surface at a public marketing page. Clear it explicitly.
  alternates: { canonical: null },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
