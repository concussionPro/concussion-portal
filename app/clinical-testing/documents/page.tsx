import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveClinicalAccess } from '@/lib/sst-trainer/access'
import {
  getSstClinicByEmail,
  adoptExistingClinicForEmail,
  getClinicUsage,
} from '@/lib/sst-trainer/clinic-registry'
import { DocumentsClient, type DocumentsContent } from './DocumentsClient'

/**
 * /clinical-testing/documents — the SST clinic DOCUMENT SUITE.
 *
 * PREMIUM: the ready-to-sign documents are the paid tier (owner 2026-07-08).
 * A trial clinic runs the tool + sees all data free; documents need an ACTIVE
 * plan.
 *
 * ISOLATION (owner: "no other content unlocked"): this surface renders ONLY the
 * the discharge templates + a link to the SST report — nothing from the course
 * modules / reference / wider toolkit — so an SST-entitled clinic gets exactly
 * these documents and no course access.
 *
 * SERVER component: entitlement (owner, or entitled clinic on an ACTIVE plan —
 * the same resolution as /api/clinical-testing/clinic) is decided here, and the
 * template content is only imported and passed to the client shell for an
 * entitled request. Previously the 'use client' page compiled the full paid
 * template set into a public static chunk and gated by render only. Fails
 * closed: any resolution error means no content.
 */
export default async function ClinicalTestingDocumentsPage() {
  let content: DocumentsContent | null = null
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    const session = sessionToken ? verifySessionToken(sessionToken) : null
    if (session) {
      const access = await resolveClinicalAccess({
        email: session.email,
        accessLevel: session.accessLevel,
      })
      let paid = access === 'owner'
      if (!paid && (access === 'course' || access === 'sst') && process.env.KV_REST_API_URL) {
        const email = session.email.toLowerCase()
        // Same lookup as /api/clinical-testing/clinic GET (incl. adopting a
        // preseason clinic) so page and API can't disagree about the plan.
        const clinic =
          (await getSstClinicByEmail(email)) ?? (await adoptExistingClinicForEmail(email))
        if (clinic) {
          const usage = await getClinicUsage(clinic.code)
          paid = usage?.plan === 'active'
        }
      }
      if (paid) {
        const { DISCHARGE_TEMPLATES, DOCUMENTATION_PRINCIPLES } = await import(
          '@/data/hub-program-content'
        )
        content = { templates: DISCHARGE_TEMPLATES, principles: DOCUMENTATION_PRINCIPLES }
      }
    }
  } catch (err) {
    console.error('[clinical-testing/documents] entitlement resolution failed:', err)
    content = null
  }

  return <DocumentsClient content={content} />
}
