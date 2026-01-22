// Trial access management
import { getCurrentUser } from './auth'

export function isTrialUser(): boolean {
  if (typeof window === 'undefined') return false

  const trialStarted = localStorage.getItem('trialStarted')
  const isPaidUser = localStorage.getItem('isPaidUser')
  const user = getCurrentUser()

  return trialStarted === 'true' && isPaidUser !== 'true' && !user
}

export function hasModuleAccess(moduleId: number): boolean {
  if (typeof window === 'undefined') return false

  const isPaidUser = localStorage.getItem('isPaidUser')

  // ONLY paid users have full module access
  // Demo/authenticated users and trial users get preview access only (first 2 sections)
  return isPaidUser === 'true'
}

export function hasFullModuleAccess(moduleId: number): boolean {
  if (typeof window === 'undefined') return false

  const isPaidUser = localStorage.getItem('isPaidUser')

  // ONLY paid users have full module access
  // Demo/authenticated users only get preview access (first 2 sections)
  return isPaidUser === 'true'
}

export function upgradeToPaid(): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('isPaidUser', 'true')
  localStorage.removeItem('trialStarted')
}

export function getTrialEmail(): string | null {
  if (typeof window === 'undefined') return null

  return localStorage.getItem('trialEmail')
}
