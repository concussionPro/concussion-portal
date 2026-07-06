import Link from 'next/link'
import { PlatformNav, PlatformFooter, PLATFORM } from '@/components/platform/PlatformChrome'

// ─────────────────────────────────────────────────────────────────────────────
// SST Trainer — Pricing.  "Pricing built for clinics, not patients."
// Primary action: the FREE founding-clinic tier (real users = AU concussion /
// vestibular / POTS clinics). Hooks: patients never pay + first 20 founding
// clinics. Founding application → /platform/founding signup form (captures the
// lead in Postgres + notifies Zac; replaced the flaky mailto).
// Faithful to the CEA-Site build (navy #16243f, green #3c7a1f, Hanken Grotesk).
// ─────────────────────────────────────────────────────────────────────────────

const FOUNDING_HREF = '/platform/founding'

type Tier = {
  name: string
  who: string
  price: string
  full: string
  unit: string
  cta: string
  href: string
  popular: boolean
  cardBg: string
  border: string
  shadow: string
  priceColor: string
  subColor: string
  featColor: string
  rule: string
  tickBg: string
  tickFg: string
  ctaFg: string
  ctaBg: string
  ctaBorder: string
  features: string[]
}

const TIERS: Tier[] = [
  {
    name: 'Single',
    who: 'One clinician',
    price: 'A$49',
    full: 'A$98',
    unit: '/ month · both tools',
    cta: 'Start free',
    href: FOUNDING_HREF,
    popular: false,
    cardBg: '#fff',
    border: '1px solid #e2e8f0',
    shadow: '0 1px 3px rgba(22,36,63,.06)',
    priceColor: '#16243f',
    subColor: '#94a3b8',
    featColor: '#3b4f52',
    rule: '#eef2f6',
    tickBg: '#eef6e4',
    tickFg: PLATFORM.green,
    ctaFg: '#16243f',
    ctaBg: '#fff',
    ctaBorder: '1.5px solid #cbd5e1',
    features: [
      'SST Trainer + baseline testing — both tools',
      'First 3 patients free — no card, no time limit',
      'Measured-HRt trajectory, flare flags & the auto GP report',
      'Free through the founding period, then lock A$49 for life',
      'Patient app always free',
    ],
  },
  {
    name: 'Small clinic',
    who: 'Up to 5 clinicians',
    price: 'A$99',
    full: 'A$198',
    unit: '/ month · both tools',
    cta: 'Start a founding clinic',
    href: FOUNDING_HREF,
    popular: true,
    cardBg: '#fff',
    border: '2px solid #57a82e',
    shadow: '0 16px 40px -18px rgba(22,36,63,.28)',
    priceColor: PLATFORM.green,
    subColor: '#94a3b8',
    featColor: '#3b4f52',
    rule: '#eef2f6',
    tickBg: '#e6f3da',
    tickFg: PLATFORM.green,
    ctaFg: '#fff',
    ctaBg: '#16243f',
    ctaBorder: 'none',
    features: [
      'Everything in Single, for your whole team',
      'Up to 5 clinicians on one licence',
      'Priority onboarding + a direct line to our clinical team',
      'Free through the founding period, then lock A$99 for life',
      'Patients only ever reach the app through your clinic code',
    ],
  },
  {
    name: 'Enterprise',
    who: 'Up to 15 clinicians',
    price: 'A$149',
    full: 'A$298',
    unit: '/ month · both tools',
    cta: 'Talk to us',
    href: FOUNDING_HREF,
    popular: false,
    cardBg: '#16243f',
    border: '1.5px solid #16243f',
    shadow: '0 16px 40px -18px rgba(22,36,63,.3)',
    priceColor: '#fff',
    subColor: '#9fb0c8',
    featColor: '#dbe6f0',
    rule: 'rgba(255,255,255,.14)',
    tickBg: 'rgba(87,168,46,.2)',
    tickFg: '#bfe79a',
    ctaFg: '#16243f',
    ctaBg: '#bfe79a',
    ctaBorder: 'none',
    features: [
      'Everything in Small clinic, up to 15 clinicians',
      'Founding-clinic listing when our referral directory launches',
      'Clubs, leagues & payers — talk to us about squad rates',
      'Free through the founding period, then lock A$149 for life',
    ],
  },
]
const STEPS = [
  {
    n: '1',
    title: 'Start free',
    body: 'Join as a founding clinic — free during the founding period, no card, no commitment.',
  },
  {
    n: '2',
    title: 'Prescribe & progress',
    body: 'Patients train with their own watch or heart-rate strap; their measured threshold and session history flow back to your dashboard.',
  },
  {
    n: '3',
    title: 'Keep your founding rate',
    body: 'When paid plans launch, founding clinics lock their rate for life — from A$49/month. Everyone after joins on the standard plans.',
  },
]

const FAQS = [
  {
    q: 'Is this a regulated medical device?',
    a: 'SST Trainer is a training and monitoring tool used under the treating clinician’s direction — you set and oversee the sub-symptom threshold; the app delivers the plan and monitors heart rate. It does not diagnose or treat concussion, and it does not make clearance decisions — you do.',
  },
  {
    q: 'Who pays — clinic or patient?',
    a: 'The clinic does, once paid plans launch — one licence covering both tools, priced by team size (A$49 / A$99 / A$149). The patient app is always free to download and use, which is what keeps patients adherent.',
  },
  {
    q: 'What does “founding period” actually mean?',
    a: 'The platform is free during the founding period. When paid plans launch, founding clinics lock A$49/month for life — half the A$99 standard rate. No card is taken today, and nothing is billed until then.',
  },
  {
    q: 'Who owns the data?',
    a: 'Your clinic and your patient. You receive the reports; we never sell data. Clinical records stored with our Australian-region database provider; see the privacy policy for full hosting detail.',
  },
]

function isInternal(href: string) {
  return href.startsWith('/')
}

function Tick({ bg, fg }: { bg: string; fg: string }) {
  return (
    <span
      aria-hidden="true"
      className="mt-px flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full text-[9px] font-bold"
      style={{ background: bg, color: fg }}
    >
      ✓
    </span>
  )
}

function Cta({ tier }: { tier: Tier }) {
  const cls =
    'block w-full cursor-pointer rounded-[13px] py-[13px] text-center text-[14px] font-bold transition-opacity hover:opacity-90'
  const style = {
    color: tier.ctaFg,
    background: tier.ctaBg,
    border: tier.ctaBorder,
  } as const
  return isInternal(tier.href) ? (
    <Link href={tier.href} className={cls} style={style}>
      {tier.cta}
    </Link>
  ) : (
    <a href={tier.href} className={cls} style={style}>
      {tier.cta}
    </a>
  )
}

export default function PlatformPricingPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(120% 75% at 82% -8%, #f2f8eb 0%, #f8fafc 46%, #f1f5f9 100%)',
        color: PLATFORM.navy,
      }}
    >
      <PlatformNav active="/platform/pricing" />

      {/* Hero */}
      <header className="mx-auto flex max-w-[880px] flex-col items-center gap-4 px-8 pb-[30px] pt-12 text-center">
        <span
          className="flex items-center gap-[7px] rounded-full px-[14px] py-[7px] text-[12px] font-bold tracking-[0.02em]"
          style={{ background: '#e6f3da', color: PLATFORM.green }}
        >
          <span
            className="h-[7px] w-[7px] rounded-full"
            style={{ background: '#57a82e' }}
          />
          Patients always free · clinics start free
        </span>
        <h1
          className="m-0 font-extrabold tracking-[-0.03em]"
          style={{ fontSize: 'clamp(34px, 4.4vw, 52px)', lineHeight: 1.04 }}
        >
          Pricing built for clinics,
          <br />
          <span style={{ color: PLATFORM.green }}>not patients.</span>
        </h1>
        <p
          className="m-0 max-w-[560px] font-normal text-slate-500"
          style={{ fontSize: 'clamp(15px, 1.4vw, 17px)', lineHeight: 1.55 }}
        >
          Your patients download and use the app free. You prescribe, oversee,
          and see their recovery. Free during the founding period — and when
          paid plans launch, founding clinics lock their rate for life.
        </p>
      </header>

      {/* Tiers */}
      <section
        className="mx-auto grid max-w-[1140px] items-stretch gap-[18px] px-8 pb-5 pt-[14px]"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
      >
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className="relative flex flex-col gap-[14px] rounded-[20px] p-6"
            style={{
              background: tier.cardBg,
              border: tier.border,
              boxShadow: tier.shadow,
            }}
          >
            {tier.popular && (
              <span
                className="absolute -top-[11px] left-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white"
                style={{ background: '#57a82e' }}
              >
                Founding offer
              </span>
            )}

            <div className="flex flex-col gap-1">
              <span
                className="text-[13px] font-bold uppercase tracking-[0.04em]"
                style={{ color: tier.popular ? PLATFORM.green : tier.priceColor }}
              >
                {tier.name}
              </span>
              <span
                className="text-[12.5px] font-normal"
                style={{ color: tier.subColor, lineHeight: 1.4 }}
              >
                {tier.who}
              </span>
            </div>

            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-[16px] font-semibold" style={{ color: tier.subColor, textDecoration: 'line-through' }}>
                {tier.full}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: tier.popular ? 'rgba(255,255,255,.16)' : '#ecfdf5', color: tier.popular ? '#fff' : '#047857' }}
              >
                half price · founding
              </span>
            </div>
            <div className="flex items-baseline gap-[5px]">
              <span
                className="text-[34px] font-semibold"
                style={{ color: tier.priceColor }}
              >
                {tier.price}
              </span>
              <span
                className="text-[13px] font-medium"
                style={{ color: tier.subColor }}
              >
                {tier.unit}
              </span>
            </div>

            <Cta tier={tier} />

            <div
              className="flex flex-col gap-[9px] pt-[14px]"
              style={{ borderTop: `1px solid ${tier.rule}` }}
            >
              {tier.features.map((f) => (
                <div key={f} className="flex items-start gap-[9px]">
                  <Tick bg={tier.tickBg} fg={tier.tickFg} />
                  <span
                    className="text-[12.5px] font-normal"
                    style={{ color: tier.featColor, lineHeight: 1.4 }}
                  >
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <p className="mx-auto max-w-[1140px] px-8 pb-2 pt-1 text-center text-[12px] font-normal leading-[1.5] text-slate-400">
        All prices AUD, ex GST. Per-episode and club plans are planned pricing —
        nothing is billed during the founding period, and founding-clinic rates
        are locked when paid plans launch.
      </p>

      {/* Patients never pay band */}
      <section className="mx-auto mt-[30px] max-w-[1140px] px-8">
        <div
          className="flex flex-wrap items-center justify-between gap-6 rounded-[22px] px-9 py-[30px]"
          style={{ background: PLATFORM.navy }}
        >
          <div className="flex max-w-[600px] flex-col gap-[6px]">
            <span className="text-[21px] font-extrabold tracking-[-0.02em] text-white">
              Your patients never pay.
            </span>
            <span
              className="text-[14px] font-normal"
              style={{ color: '#a7c2c5', lineHeight: 1.45 }}
            >
              The app is free to install and use with the watch or heart-rate
              strap they already own. Zero cost and zero friction is what keeps
              them adherent — and adherence is what drives recovery.
            </span>
          </div>
          <span
            className="flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-[10px] text-[13px] font-bold"
            style={{
              background: 'rgba(87,168,46,.16)',
              border: '1px solid rgba(87,168,46,.4)',
              color: '#bfe79a',
            }}
          >
            Free for every athlete
          </span>
        </div>
      </section>

      {/* Start free, pay as it proves itself */}
      <section className="mx-auto mt-10 max-w-[1140px] px-8">
        <h2
          className="mb-[22px] text-center font-extrabold tracking-[-0.02em]"
          style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.1 }}
        >
          Start free, pay as it proves itself
        </h2>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}
        >
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-[18px] bg-white p-[22px]"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[14px] font-bold text-white"
                style={{ background: PLATFORM.navy }}
              >
                {s.n}
              </span>
              <h3 className="mb-[7px] mt-[14px] text-[16px] font-extrabold tracking-[-0.01em]">
                {s.title}
              </h3>
              <p
                className="m-0 text-[13px] font-normal text-slate-500"
                style={{ lineHeight: 1.5 }}
              >
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-[46px] max-w-[820px] px-8">
        <h2
          className="mb-[18px] text-center font-extrabold tracking-[-0.02em]"
          style={{ fontSize: 'clamp(22px, 2.6vw, 28px)', lineHeight: 1.1 }}
        >
          Questions clinicians ask
        </h2>
        <div className="flex flex-col gap-[11px]">
          {FAQS.map((f) => (
            <div
              key={f.q}
              className="rounded-[14px] bg-white px-[18px] py-4"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <p
                className="mb-[6px] mt-0 text-[14px] font-bold"
                style={{ color: PLATFORM.navy, lineHeight: 1.3 }}
              >
                {f.q}
              </p>
              <p
                className="m-0 text-[13px] font-normal text-slate-500"
                style={{ lineHeight: 1.5 }}
              >
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Founding program CTA */}
      <section className="mx-auto mt-11 max-w-[1140px] px-8 pb-2">
        <div
          className="flex flex-col items-center gap-[14px] rounded-[22px] p-[34px] text-center"
          style={{
            background: 'linear-gradient(135deg, #f2f8eb, #eef6e4)',
            border: '1px solid #d8ecc4',
          }}
        >
          <h2
            className="m-0 font-extrabold tracking-[-0.02em]"
            style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.1 }}
          >
            Be one of our first 20 founding clinics.
          </h2>
          <p
            className="m-0 max-w-[520px] text-[14.5px] font-normal text-slate-500"
            style={{ lineHeight: 1.55 }}
          >
            Free during the founding period. When paid plans launch, founding
            clinics lock A$49/month for life — half the A$99 standard rate.
            Priority onboarding, a direct line to our team, and a founding-clinic
            listing when the referral directory launches.
          </p>
          <Link
            href={FOUNDING_HREF}
            className="inline-block rounded-[13px] px-[26px] py-[15px] text-[15px] font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: PLATFORM.navy }}
          >
            Apply to the founding program
          </Link>
        </div>
      </section>

      <div className="mt-10">
        <PlatformFooter />
      </div>
    </main>
  )
}
