/**
 * Single source of truth for "is this redirect target safe to honour".
 *
 * Only same-origin RELATIVE paths pass. Control characters (tab/CR/etc.) are
 * STRIPPED by the WHATWG URL parser, so '/\t/evil.com' resolves to
 * https://evil.com — reject anything < 0x20 outright.
 *
 * Safe for both client and server bundles (no imports).
 */
export function isSafeRelativePath(path: string | null | undefined): path is string {
  if (!path) return false
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && !/[\x00-\x1f]/.test(path)
}
