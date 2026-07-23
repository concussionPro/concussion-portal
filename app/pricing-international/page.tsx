import { headers } from 'next/headers'
import { detectCountry } from '@/lib/geo'
import { intlPriceForCountry } from '@/lib/international-pricing'
import { CONFIG } from '@/lib/config'
import CrmInternationalContent from '@/components/crm/CrmInternationalContent'

/**
 * /pricing-international — CRM (Concussion Rehab Mastery), INTERNATIONAL ONLY.
 *
 * Owner 2026-07-22: rebuilt on the CRM-landing design system (the old build was
 * a plain text page). All content lives in CrmInternationalContent — hero,
 * skill chips, stat bento, SST/Baseline instrument visuals, geo-priced offer
 * card, tools grid, protocol DOI, honesty gate, instructor, FAQ, founding-
 * cohort capture.
 *
 * This server wrapper resolves the visitor's LOCAL price (lib/international-
 * pricing.ts via cf-ipcountry) — the SAME derivation the checkout charge uses,
 * so display and charge always match.
 *
 * International = 8 hours only (no in-person day overseas — never "14").
 * HONESTY: ACSM CECs pending, ESSA pending — never claim either as held.
 * Founding-cohort interest capture only; no live checkout during market review.
 */
export default async function PricingInternationalPage() {
  const price = intlPriceForCountry(detectCountry(await headers()))
  // `live` flips the founding-cohort interest capture over to a real geo-priced
  // checkout button. Inert (interest-capture) until the owner sets the flag.
  return (
    <CrmInternationalContent
      price={{ display: price.display, code: price.code }}
      live={CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE}
    />
  )
}
