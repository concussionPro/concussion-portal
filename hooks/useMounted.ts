'use client'

import { useEffect, useState } from 'react'

/**
 * True once the component has mounted in the browser.
 *
 * The server render and the client's FIRST render must produce identical
 * markup, so anything that depends on browser-only state (a live countdown, an
 * entry animation, `localStorage`) has to render its neutral form first and
 * only then switch. This is that switch, in one place instead of a hand-rolled
 * `const [mounted, setMounted] = useState(false)` + effect in every component.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the whole point:
  // this flag MUST flip after the first client render, never during it, or the
  // server and client markup diverge and React throws a hydration mismatch.
  useEffect(() => setMounted(true), [])
  return mounted
}
