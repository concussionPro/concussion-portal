/**
 * Discreet cross-market links so travellers / VPN users can escape geo routing.
 * Hits middleware (`?market=au|intl`), which sets `cea_market` and redirects.
 */
export function AustraliaPricingLink({ className }: { className?: string }) {
  return (
    <p className={className ?? 'mt-6 text-center text-xs text-muted-foreground'}>
      <a
        href="/pricing?market=au"
        className="underline underline-offset-2 hover:text-accent font-medium"
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
      >
        International pricing →
      </a>
    </p>
  )
}
