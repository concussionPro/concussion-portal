import { redirect } from 'next/navigation'

// Consolidated into /admin/analytics → B2B Prospects tab on 2026-06-08.
// The HOT NOW panel, outreach-status traffic light, nurture-stage column,
// and unfakeable engagement signals (real sessions / distinct-URL clicks /
// cal-click-days) now live inside the existing Prospects design.
export default function B2BOutreachRedirect() {
  redirect('/admin/analytics?tab=prospects')
}
