'use client'

import { useSession } from '@/contexts/SessionContext'

/**
 * Which course stream the signed-in user actually belongs to.
 *
 * WHY THIS EXISTS: CCM entitlement lives in `users.access_level`, CRM (the
 * exercise-physiology stream) lives in `course_purchases` — the two are
 * deliberately isolated (lib/crm-course.ts). A CRM buyer therefore carries
 * `access_level = 'preview'`, so the `isPreview = accessLevel === 'preview'`
 * idiom that was copy-pasted across the dashboard classified a PAYING EP
 * customer as a free-trial lead: SCAT stats, SCAT module targets, the
 * 'scat-mastery' certificate type, and the CCM upgrade funnel.
 *
 * Flipping that flag off wholesale is equally wrong — it would unlock the CCM
 * paid tools they never bought. There are THREE tiers, not two:
 *
 *   'ccm'  — bought CCM (online-only / full-course): CCM content + CCM tools
 *   'crm'  — bought CRM: /ep-course ONLY; CCM content + tools stay locked
 *   'free' — bought neither: the free SCAT trial funnel
 *
 * Use this instead of testing accessLevel directly.
 */
export type CourseTier = 'free' | 'ccm' | 'crm'

export interface CourseTierState {
  tier: CourseTier
  /** Holds CCM (online-only or full-course) — gates all CCM paid surfaces. */
  isCcmPaid: boolean
  /** Holds the CRM/EP stream. */
  ownsCrm: boolean
  /** Holds NEITHER paid stream — the only cohort the free funnel applies to. */
  isFreeTier: boolean
  /** Online-only CCM buyer — the audience for the in-person upgrade. */
  isOnlineOnly: boolean
  /** Where "my course" is for this user. */
  courseHref: string
  /** Certificate type this user's course issues. */
  certType: 'scat-mastery' | 'online-course' | 'crm-course'
}

export function useCourseTier(accessLevelOverride?: string): CourseTierState {
  const { user } = useSession()
  const accessLevel = user?.accessLevel || accessLevelOverride || ''
  const ownsCrm = user?.ownsCrm === true
  const isCcmPaid = accessLevel === 'online-only' || accessLevel === 'full-course'
  const isFreeTier = !isCcmPaid && !ownsCrm
  const tier: CourseTier = isCcmPaid ? 'ccm' : ownsCrm ? 'crm' : 'free'
  return {
    tier,
    isCcmPaid,
    ownsCrm,
    isFreeTier,
    isOnlineOnly: accessLevel === 'online-only',
    courseHref: isCcmPaid ? '/learning' : ownsCrm ? '/ep-course' : '/scat-course',
    certType: isCcmPaid ? 'online-course' : ownsCrm ? 'crm-course' : 'scat-mastery',
  }
}

/** EP/CRM modules are namespaced 201-208 in the shared progress store. */
export const CRM_MODULE_MIN = 201
export const CRM_MODULE_MAX = 208
