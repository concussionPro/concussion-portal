// NO metadata export here.
//
// This layout used to carry a full CRM-only metadata block from when
// /pricing-international was the EP landing page. The route is now the
// DUAL-STREAM (CCM + CRM) tabbed page, and page.tsx declares its own metadata —
// but Next merges per key, so title/description/canonical were overridden while
// the stale `openGraph` block survived. Every share and AI crawl of the
// dual-stream page rendered "Concussion Rehab Mastery — International (for
// Exercise Physiologists)" plus a live USD price, and the dead description
// appended "ESSA-accredited" to a page that now leads with CCM (ESSA accredits
// the CRM stream only). Metadata for this route lives in page.tsx.

export default function PricingInternationalLayout({ children }: { children: React.ReactNode }) {
  return children
}
