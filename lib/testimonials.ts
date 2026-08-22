/**
 * Course testimonials — ONE source, both streams.
 *
 * WHY THIS FILE EXISTS. These lived inline in CcmPricingContent, where two
 * things went wrong: /pricing rendered `testimonials.slice(0, 3)` so two real
 * testimonials never appeared anywhere, and the CRM tab carried NONE at all —
 * the ESSA audience saw a $1,190 price with zero social proof next to it.
 *
 * WHY FIVE, EXACTLY. Spiegel Research Center (Northwestern; 57,000 + 65,000
 * reviews across 13,500 products) found purchase likelihood rises ~270% at five
 * reviews versus none — and the effect is far stronger on expensive items
 * (+380% high-price vs +190% low-price), with sharp diminishing returns after
 * about five. So five is the target, and truncating to three was leaving the
 * measured lift on the table. Adding a sixth buys almost nothing; fabricating
 * one would cost everything.
 *
 * EVERY ENTRY IS A REAL PAST ATTENDEE. Never invent one, never embellish a
 * quote, never promote an anonymous compliment to a named role. If a person
 * asks to be removed, delete the entry — do not anonymise and keep the words.
 */
export interface Testimonial {
  quote: string
  name: string
  /** Their real discipline and location — an EP reading the CRM page must be
   *  able to see these come from the multidisciplinary room, not from EPs. */
  role: string
  initials: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Before this training, our approach to concussion cases was uncertain. Now, my team has the confidence and proven skills to diagnose and manage them with clarity.',
    name: 'Andy',
    role: 'Clinic Owner, NSW',
    initials: 'A',
  },
  {
    quote:
      'An outstanding blend of evidence-based knowledge and practical skills. Directly applicable to concussion diagnosis and management in real-world settings.',
    name: 'Dean Hardy',
    role: 'University Clinical Educator, QLD',
    initials: 'D',
  },
  {
    quote:
      'Incredibly thorough and well structured. The hands-on component was invaluable — I left feeling genuinely confident in my concussion assessments.',
    name: 'Amelia',
    role: 'Physiotherapist',
    initials: 'A',
  },
  {
    quote:
      'Well organised — content explained in a way that was relevant and memorable. Changed how I approach concussion in clinic.',
    name: 'Alex',
    role: 'Osteopath, Melbourne',
    initials: 'A',
  },
  {
    quote:
      'A must for any health professional managing concussion. Relevant, applicable and easy to absorb.',
    name: 'Sarah',
    role: 'Physiotherapist',
    initials: 'S',
  },
]
