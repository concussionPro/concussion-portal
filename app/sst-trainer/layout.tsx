import { Metadata } from 'next'

// NOTE: this app is pre-launch and patient-facing. It must NOT be indexed and
// must NOT be linked from any public nav. Metadata can't live in the page
// because the page is a client component ('use client'), so the noindex
// directive lives here in the sibling server layout.
export const metadata: Metadata = {
  title: 'Sub-Symptom-Threshold Trainer',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function SstTrainerLayout({ children }: { children: React.ReactNode }) {
  return children
}
