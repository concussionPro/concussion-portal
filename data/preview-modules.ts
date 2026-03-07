/**
 * Preview-safe module data for the /preview marketing page.
 *
 * SECURITY: This file must NOT import from './modules' or './scat-modules'.
 * It uses the metadata-only module-meta.ts to prevent full course content,
 * quiz answers, and clinical references from leaking into client JS bundles.
 */

import { getModulesMeta, type ModuleMeta } from './module-meta'

export type PreviewModule = ModuleMeta

/**
 * Returns module metadata only — safe for client-side use.
 */
export function getPreviewModules(): PreviewModule[] {
  return getModulesMeta()
}
