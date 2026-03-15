import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="max-w-3xl mx-auto px-6 pt-[80px] pb-16">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          Terms &amp; Refund Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: March 2026
        </p>

        {/* Online Course */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Online Course (${CONFIG.COURSE.PRICE_ONLINE} AUD)
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>
              <strong className="text-foreground">7-day refund window:</strong> If the course isn&apos;t right for you,
              email us within 7 days of purchase for a full refund, provided less than 25% of modules
              have been accessed (fewer than 2 modules completed).
            </li>
            <li>
              Once more than 25% of the online content has been accessed (2 or more modules completed),
              the digital product has been substantially consumed and no refund is available.
            </li>
            <li>
              Refunds are processed within 5–10 business days to your original payment method.
            </li>
          </ul>
        </section>

        {/* Complete Course */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Complete Course (${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}–${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} AUD)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            The complete course includes online modules and a hands-on workshop. Each component has its own refund terms:
          </p>

          <h3 className="text-base font-semibold text-foreground mb-2">Online modules</h3>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5 mb-6">
            <li>
              Same 7-day / less than 25% access policy as the online-only course above.
            </li>
          </ul>

          <h3 className="text-base font-semibold text-foreground mb-2">Workshop component</h3>
          <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc pl-5">
            <li>
              <strong className="text-foreground">Threshold-based scheduling:</strong> Workshop dates are confirmed
              once {CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD} registrants per city are locked in. You will receive at
              least {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks&apos; notice before your workshop date.
            </li>
            <li>
              <strong className="text-foreground">If your city does not reach the threshold:</strong> You may request
              a full refund of the workshop component, or transfer your registration to another city at no charge.
              Contact{' '}
              <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
                {CONFIG.CONTACT_EMAIL}
              </a>.
            </li>
            <li>
              <strong className="text-foreground">14+ days before workshop:</strong> Full refund of the workshop component.
            </li>
            <li>
              <strong className="text-foreground">7–13 days before workshop:</strong> 50% refund of the workshop component.
            </li>
            <li>
              <strong className="text-foreground">Less than 7 days before, or after attendance:</strong> No refund.
            </li>
            <li>
              <strong className="text-foreground">Attendee substitution:</strong> You may transfer your workshop spot to
              another person at any time at no charge. Email us the replacement attendee&apos;s details before the workshop date.
            </li>
          </ul>
        </section>

        {/* Free Course */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Free SCAT Mastery Course
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The SCAT Mastery course is provided at no cost. No payment is collected and no refund is applicable.
          </p>
        </section>

        {/* ACL */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Australian Consumer Law
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nothing in this policy limits your rights under the Australian Consumer Law (ACL).
            If the course has a major failure — for example, the content is substantially different
            from what was described — you are entitled to a refund regardless of the above timeframes.
            For more information, visit{' '}
            <a
              href="https://www.accc.gov.au/consumers/consumer-rights-guarantees"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              accc.gov.au
            </a>.
          </p>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Contact for Refunds
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To request a refund, email{' '}
            <a href={`mailto:${CONFIG.CONTACT_EMAIL}`} className="text-accent hover:underline">
              {CONFIG.CONTACT_EMAIL}
            </a>{' '}
            with your name and order details. We aim to respond within 1 business day.
          </p>
        </section>

        <div className="border-t border-border pt-6">
          <Link href="/pricing" className="text-sm text-accent hover:underline">
            &larr; Back to pricing
          </Link>
        </div>
      </div>
    </div>
  )
}
