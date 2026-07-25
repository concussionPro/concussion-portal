/**
 * Google Analytics / Ads gtag, injected by the GA snippet at runtime.
 * Declared here so call sites don't each reach for `(window as any).gtag`.
 */
declare global {
  interface Window {
    gtag?: (command: string, ...params: unknown[]) => void
  }
}
export {}
