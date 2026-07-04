import { redirect } from 'next/navigation'

/**
 * RETIRED SALES PAGE (owner, 2026-07-05): the A$97 Reference+Toolkit bundle
 * is no longer sold — old links/ads land on /pricing. Legacy owners keep
 * their content via isBookOwner on the gated portal surfaces, and their
 * A$100 course credit still applies at checkout.
 */
export default function RetiredReferencePage() {
  redirect('/pricing')
}
