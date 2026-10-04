import { redirect } from 'next/navigation'

/**
 * /melbourne — the short link used in personal (Gmail-lane) notes about the
 * Melbourne practical day. Reads as a plain URL in the email; lands on the
 * city page tagged so GA4 (utm_*) and our own attribution (src) credit the
 * note. Lives as a route rather than a next.config redirect because the
 * route-config parser rejects query strings in destinations.
 */
export const dynamic = 'force-static'

export default function MelbourneShortLink() {
  redirect('/courses/melbourne?utm_source=zac&utm_medium=email&utm_campaign=melb-nov7&src=melb-nov7-note')
}
