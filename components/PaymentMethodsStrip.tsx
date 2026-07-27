/**
 * Payment-method reassurance strip for pricing cards (owner 2026-07-28:
 * surface the Stripe checkout's real options ON the bentos). Two jobs:
 *  1. The instalment REFRAME — "or 4× A$124" does the converting; the
 *     Stripe checkout offers Afterpay/Zip/Klarna pay-in-4 at these amounts.
 *  2. Brand chips as trust signals (factual "we accept" display).
 * Pure CSS chips — no third-party logo assets to load or license.
 */
export function PaymentMethodsStrip({ price, className = '' }: { price?: number; className?: string }) {
  const chip = 'inline-flex h-[18px] items-center rounded-[4px] px-1.5 text-[9px] font-bold leading-none'
  return (
    <div className={`mt-3 ${className}`}>
      {typeof price === 'number' && price > 0 && (
        <p className="m-0 mb-1.5 text-[12px] font-semibold text-[var(--muted-foreground)]">
          or 4 payments of <span className="text-[var(--foreground)]">A${(price / 4).toFixed(2)}</span> — interest-free
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1" aria-label="Accepted payment methods">
        <span className={`${chip} bg-black text-white`}>Apple&nbsp;Pay</span>
        <span className={`${chip} bg-[#33d18f] text-black`}>link</span>
        <span className={`${chip} bg-[#ffb3c7] text-black`}>Klarna</span>
        <span className={`${chip} bg-[#b2fce4] text-black`}>afterpay</span>
        <span className={`${chip} bg-[#211a33] text-white`}>Zip</span>
        <span className={`${chip} border border-slate-200 bg-white text-[#1434cb] italic`}>VISA</span>
        <span className={`${chip} border border-slate-200 bg-white`} aria-label="Mastercard">
          <span className="h-2.5 w-2.5 rounded-full bg-[#eb001b]" />
          <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-[#f79e1b] opacity-90" />
        </span>
        <span className={`${chip} bg-[#016fd0] text-white`}>AMEX</span>
      </div>
    </div>
  )
}
