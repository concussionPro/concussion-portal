// Trial access management - DEPRECATED: Use secure-access.ts instead
import { checkUserAccess } from './secure-access'

export function isTrialUser(): boolean {
  // DEPRECATED: Trial logic moved to server-side
  return false
}

// DEPRECATED: Use checkUserAccess() from secure-access.ts
export async function hasModuleAccess(moduleId: number): Promise<boolean> {
  const { accessLevel } = await checkUserAccess()
  // Full course users have full access
  // Online-only users get preview access (first 2 sections)
  return accessLevel === 'full-course'
}

// DEPRECATED: Use checkUserAccess() from secure-access.ts
export async function hasFullModuleAccess(moduleId: number): Promise<boolean> {
  const { accessLevel } = await checkUserAccess()
  return accessLevel === 'full-course'
}

// REMOVED: This function was a security vulnerability allowing payment bypass
// Access level is now controlled server-side only
// export function upgradeToPaid(): void {
//   // SECURITY RISK: Removed - use server-side validation only
// }

export function getTrialEmail(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('trialEmail')
}
