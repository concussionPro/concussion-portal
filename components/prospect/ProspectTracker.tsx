'use client'

import { useEffect, useRef } from 'react'

/**
 * Client-side interaction tracker for the prospect portal.
 *
 * Mounts once at the top of <ProspectLanding>. Wires up three signal types:
 *
 *  1. SECTION SCROLL — IntersectionObserver fires once per section the
 *     first time it crosses 50% viewport visibility. Identifies which
 *     sections each viewer actually consumed. Section ids are read from
 *     `data-track-section` attributes on the landing markup.
 *
 *  2. CTA CLICK — single delegated click handler scans up from the click
 *     target for `data-track-cta`. Any link/button with that attribute
 *     emits a cta_click event with `target = data-track-cta` value.
 *
 *  3. EXIT — beforeunload + visibilitychange capture the last visible
 *     section + total dwell ms so the engagement API can see where
 *     the viewer dropped out. Uses navigator.sendBeacon for reliability
 *     since the tab is closing.
 *
 * All events POST to /api/prospect/{token}/track. Failures are silent —
 * tracking is best-effort.
 */
export function ProspectTracker({
  token,
  accessKey,
}: {
  token: string
  accessKey: string
}) {
  const startTimeRef = useRef<number>(Date.now())
  const lastVisibleSectionRef = useRef<string>('hero')
  const sentSectionsRef = useRef<Set<string>>(new Set())
  const exitedRef = useRef(false)

  useEffect(() => {
    const endpoint = `/api/prospect/${token}/track`

    function emit(payload: Record<string, unknown>): void {
      // Best-effort fetch — silent on failure
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey, ...payload }),
        keepalive: true,
      }).catch(() => {})
    }

    function emitBeacon(payload: Record<string, unknown>): void {
      // sendBeacon for tab-close — survives navigation
      try {
        const blob = new Blob([JSON.stringify({ accessKey, ...payload })], {
          type: 'application/json',
        })
        navigator.sendBeacon(endpoint, blob)
      } catch {
        // Fall back to keepalive fetch
        emit(payload)
      }
    }

    // ─── SECTION OBSERVER ──────────────────────────────────────────────
    const sectionElements = document.querySelectorAll<HTMLElement>('[data-track-section]')
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const section = entry.target.getAttribute('data-track-section') || 'unknown'
          lastVisibleSectionRef.current = section
          if (sentSectionsRef.current.has(section)) continue
          sentSectionsRef.current.add(section)
          emit({ interactionType: 'section_view', section })
        }
      },
      { threshold: 0.5 },
    )
    sectionElements.forEach((el) => observer.observe(el))

    // ─── CTA CLICK DELEGATION ──────────────────────────────────────────
    function onClick(ev: MouseEvent) {
      const t = ev.target
      if (!(t instanceof Element)) return
      const ctaEl = t.closest<HTMLElement>('[data-track-cta]')
      if (!ctaEl) return
      const target = ctaEl.getAttribute('data-track-cta') || 'unknown'
      // Use the closest section ancestor for context
      const sectionEl = ctaEl.closest<HTMLElement>('[data-track-section]')
      const section = sectionEl?.getAttribute('data-track-section') || lastVisibleSectionRef.current
      emit({ interactionType: 'cta_click', section, target })
    }
    document.addEventListener('click', onClick, { capture: true })

    // ─── EXIT TRACKING ─────────────────────────────────────────────────
    function emitExit(via: string): void {
      if (exitedRef.current) return
      exitedRef.current = true
      const dwellMs = Date.now() - startTimeRef.current
      emitBeacon({
        interactionType: 'exit',
        section: lastVisibleSectionRef.current,
        target: via,
        dwellMs,
      })
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') emitExit('visibility-hidden')
    }
    window.addEventListener('pagehide', () => emitExit('pagehide'))
    window.addEventListener('beforeunload', () => emitExit('beforeunload'))
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('click', onClick, { capture: true } as AddEventListenerOptions)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [token, accessKey])

  return null
}
