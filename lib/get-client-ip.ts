/**
 * Cloudflare IPv4 ranges (from https://www.cloudflare.com/ips-v4/)
 * Used to filter out proxy IPs from x-forwarded-for.
 * Each entry: [network as 32-bit int, mask as 32-bit int]
 */
const CF_RANGES: [number, number][] = [
  [ipToInt('173.245.48.0'), cidrMask(20)],
  [ipToInt('103.21.244.0'), cidrMask(22)],
  [ipToInt('103.22.200.0'), cidrMask(22)],
  [ipToInt('103.31.4.0'), cidrMask(22)],
  [ipToInt('141.101.64.0'), cidrMask(18)],
  [ipToInt('108.162.192.0'), cidrMask(18)],
  [ipToInt('190.93.240.0'), cidrMask(20)],
  [ipToInt('188.114.96.0'), cidrMask(20)],
  [ipToInt('197.234.240.0'), cidrMask(22)],
  [ipToInt('198.41.128.0'), cidrMask(17)],
  [ipToInt('162.158.0.0'), cidrMask(15)],
  [ipToInt('104.16.0.0'), cidrMask(13)],
  [ipToInt('104.24.0.0'), cidrMask(14)],
  [ipToInt('172.64.0.0'), cidrMask(13)],
  [ipToInt('131.0.72.0'), cidrMask(22)],
]

function ipToInt(ip: string): number {
  const parts = ip.split('.')
  return ((+parts[0] << 24) | (+parts[1] << 16) | (+parts[2] << 8) | +parts[3]) >>> 0
}

function cidrMask(bits: number): number {
  return bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
}

function isCloudflareIp(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  const n = ipToInt(ip)
  return CF_RANGES.some(([network, mask]) => (n & mask) === network)
}

/**
 * Extract the real client IP from a request behind Cloudflare + Vercel.
 *
 * Priority:
 *  1. cf-connecting-ip (Cloudflare sets this to the real client IP)
 *  2. true-client-ip (Cloudflare Enterprise / Akamai)
 *  3. x-real-ip
 *  4. x-forwarded-for — first non-Cloudflare IP
 *  5. 'unknown'
 */
export function getClientIp(request: { headers: { get(name: string): string | null } }): string {
  const cfIp = request.headers.get('cf-connecting-ip')?.trim()
  if (cfIp && !isCloudflareIp(cfIp)) return cfIp

  const trueClientIp = request.headers.get('true-client-ip')?.trim()
  if (trueClientIp && !isCloudflareIp(trueClientIp)) return trueClientIp

  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp && !isCloudflareIp(realIp)) return realIp

  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const ips = xff.split(',').map(s => s.trim()).filter(Boolean)
    // First non-Cloudflare IP is the real client
    const clientIp = ips.find(ip => !isCloudflareIp(ip))
    if (clientIp) return clientIp
    // All are Cloudflare? Return first entry (better than 'unknown')
    if (ips.length > 0) return ips[0]
  }

  return 'unknown'
}
