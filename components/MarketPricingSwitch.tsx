'use client'

/**
 * Discreet cross-market links so travellers / VPN users can escape geo routing.
 *
 * Sets `cea_market` in the browser FIRST, then navigates to the clean pricing
 * URL. Middleware still honours `?market=au|intl` for no-JS / shared links, but
 * the click path must not depend on a Set-Cookie-on-302 race — that race was
 * dropping some overseas visitors off AU pricing (P1 2026-09-05).
 */
import { MARKET_COOKIE } from '@/lib/geo'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function setMarketCookie(market: 'au' | 'intl') {
  try {
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `${MARKET_COOKIE}=${market}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
  } catch {
    // private mode / cookie blocked — middleware ?market= fallback still runs
  }
}

export function AustraliaPricingLink({ className }: { className?: string }) {
  return (
    <p className={className ?? 'mt-6 text-center text-xs text-muted-foreground'}>
      <a
        href="/pricing?market=au"
        className="underline underline-offset-2 hover:text-accent font-medium"
        onClick={(e) => {
          setMarketCookie('au')
          // Full navigation with cookie already set — stay on AUD /pricing.
          e.preventDefault()
          window.location.assign('/pricing')
        }}
      >
        Australia / NZ pricing →
      </a>
    </p>
  )
}

export function InternationalPricingLink({ className }: { className?: string }) {
  return (
    <p className={className ?? 'mt-4 text-center text-xs text-muted-foreground'}>
      <a
        href="/pricing-international?market=intl"
        className="underline underline-offset-2 hover:text-accent font-medium"
        onClick={(e) => {
          setMarketCookie('intl')
          e.preventDefault()
          window.location.assign('/pricing-international')
        }}
      >
        International pricing →
      </a>
    </p>
  )
}
