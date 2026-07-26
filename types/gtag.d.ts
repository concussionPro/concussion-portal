/**
 * Google Analytics / Ads gtag, injected by the GA snippet at runtime.
 *
 * ONE declaration for the whole app. This was previously re-declared inside
 * five different components (and reached for as `(window as any).gtag` in a
 * sixth) — five ambient copies of the same type is how they drift apart.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}
export {}
