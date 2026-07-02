'use client'

import { useModuleData, type UseModuleDataResult } from './useModuleData'

/**
 * EP-course (Concussion Rehab Mastery) module fetcher.
 *
 * Thin wrapper over useModuleData — this file used to be a byte-identical
 * fork of hooks/useModuleData.ts with only the endpoint changed; the shared
 * implementation is now parameterised by course instead.
 */
export function useEpModuleData(moduleId: number): UseModuleDataResult {
  return useModuleData(moduleId, 'ep')
}
