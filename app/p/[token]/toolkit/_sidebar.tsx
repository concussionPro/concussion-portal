/**
 * ToolkitSidebar — thin wrapper around the shared ProspectSidebar so
 * toolkit sub-pages get the mobile hamburger drawer + identical nav
 * order/state as the rest of the prospect portal.
 *
 * Active-section mapping:
 *   root      → no active (the /toolkit launcher is its own page)
 *   clinical  → 'clinical-toolkit'
 *   outreach  → 'outreach-kit'
 *   admin     → 'admin-workflow'
 */
import type { ProspectClinic } from '@/lib/prospect/types'
import { ProspectSidebar, type ActiveSection } from '@/components/prospect/ProspectSidebar'

export function ToolkitSidebar({
  clinic,
  active,
}: {
  clinic: ProspectClinic
  active: 'root' | 'clinical' | 'outreach' | 'admin'
}) {
  const map: Record<typeof active, ActiveSection | undefined> = {
    root: undefined,
    clinical: 'clinical-toolkit',
    outreach: 'outreach-kit',
    admin: 'admin-workflow',
  }
  return (
    <ProspectSidebar
      slug={clinic.slug}
      accessKey={clinic.accessKey}
      clinicShortName={clinic.shortName}
      clinicCity={clinic.city}
      clinicState={clinic.state}
      active={map[active]}
    />
  )
}
