import { Metadata } from 'next'

// Pre-launch preview of the Clinical Hub (clinician patient-management surface
// for SST + baseline). NOT indexed and NOT linked from any public nav — current
// paid users must not see the new structure yet. Zac previews it by URL.
export const metadata: Metadata = {
  title: 'Clinical Hub — Preview',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default function ClinicalHubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
