'use client'

import { usePathname } from 'next/navigation'
import { SiteFooter } from './SiteFooter'

/**
 * Public marketing surfaces that get the site footer.
 *
 * ALLOWLIST HAZARD (found 2026-08-06): because this is an allowlist, every
 * public page added since it was written silently shipped with NO footer at
 * all — no privacy link, no terms link, no contact address, no ABN, no way
 * back into the site but the top nav. Twenty-two live public pages were in
 * that state, including:
 *   /terms                     — the footer LINKS here, and landing on it was
 *                                a dead end (the only legal page with no way
 *                                back to the other legal page)
 *   /concussion-rehab-mastery  — the ESSA-accredited CRM landing, i.e. the
 *                                page ESSA's member listing points at
 *   /clinical-suite(/start)    — the SST paid-trial signup funnel
 *   /acsm /csep /cep-uk /cimspa /hpcsa /sesnz
 *                              — the pages shown to overseas accrediting
 *                                bodies as evidence
 *   /security /sst-privacy /delete-my-data /publications /partners /cases
 *   /about/zac-lewis /talk /concussion-update /team-training /clinics /uk
 *   /integrations/* /tools/* /outreach-kit /ppcs-waitlist
 *
 * ADD EVERY NEW PUBLIC PAGE HERE. Prefixes match the path exactly or as a
 * path segment (`route + '/'`), so '/partners' covers '/partners/[slug]'.
 * Gated/app/product surfaces are deliberately absent — the footer is course
 * marketing and has no business inside the dashboard, the course players,
 * the patient apps (/sst-trainer, /platform) or the prospect portals (/p/*).
 */
const PUBLIC_ROUTES = [
  // 2026-08-06 master clean, pass 2: an allowlist is a deny-by-default list,
  // so every public page added since it was written silently shipped with no
  // privacy link, no terms, no contact and no ABN. A first sweep added 22
  // routes; a live check of 64 public URLs found these three still bare —
  // including /acc, the ACC scheme pitch, and a lead-magnet funnel.
  // ADD EVERY NEW PUBLIC MARKETING PAGE HERE. App/clinician surfaces
  // (/clinical-testing/*, /auth/*, /checkout/*) are deliberately excluded —
  // they carry app chrome, not a marketing footer.
  '/acc',
  '/ai-safety-checklist',
  '/courses/about-the-founder',
  '/',
  '/preview',
  '/pricing',
  '/pricing-international',
  '/in-person',
  '/assessment',
  '/scat-forms',
  '/scat-mastery',
  '/resources',
  '/trial',
  '/preseason',
  '/scat6-download',
  '/blog',
  '/faq',
  '/courses',
  '/course',
  '/ready-to-train',
  '/checkout',
  '/privacy',
  // Legal / company — reachable from the footer, so they must carry it back.
  '/terms',
  '/security',
  '/sst-privacy',
  '/delete-my-data',
  '/about',
  '/publications',
  // Course + product marketing landings.
  '/concussion-rehab-mastery',
  '/clinical-suite',
  '/team-training',
  '/clinics',
  '/clinical-hub',
  '/partners',
  '/cases',
  '/talk',
  '/concussion-update',
  '/uk',
  '/integrations',
  '/tools',
  '/outreach-kit',
  '/ppcs-waitlist',
  // Accreditation-body landings.
  '/acsm',
  '/csep',
  '/cep-uk',
  '/cimspa',
  '/hpcsa',
  '/sesnz',
]

export function FooterWrapper() {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  )
  if (!isPublic) return null
  return <SiteFooter />
}
