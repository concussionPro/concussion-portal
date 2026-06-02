import type { EmailTemplate, Discipline, ProspectClinic } from './types'
import { dominantDiscipline, teamBreakdownString, teamTotal } from './pricing'

/**
 * Discipline-aware T1 opening-line variants. The cold email's first line
 * is the strongest "looks personalised, not template" signal — it's
 * specific to the principal's discipline.
 *
 * Variables: {clinic_short_name}, {region}, plus discipline-specific tokens.
 */
const T1_OPENING_VARIANTS: Record<Discipline, string> = {
  osteopaths:
    'Saw your team page — {osteo_count} osteopaths is the kind of clinical depth that makes structured concussion training land properly across the practice.',
  physiotherapists:
    'Saw your team page — {physio_count} physios working sideline and return-to-play means concussion presentations are on the books regularly.',
  generalPractitioners:
    'Saw your practice page — running a primary-care practice positioned to manage concussion locally needs the diagnostic side tight, and the referral pathway clear.',
  sportsMedicineDoctors:
    'Saw your practice page — sports medicine sits at the centre of concussion decisions on the {region}, and your team is well-positioned to own that.',
  exercisePhys:
    'Saw your team page — EP-led concussion rehab (sub-symptom-threshold aerobic, vestibular progression) is the underbuilt half of the recovery pathway; structured training closes the gap.',
  myotherapists:
    'Saw your team page — a multi-disciplinary practice with strong manual-therapy depth is exactly the kind of team that benefits from a coordinated concussion pathway.',
  remedialMassage:
    'Saw your team page — a multi-disciplinary practice with strong manual-therapy depth is exactly the kind of team that benefits from a coordinated concussion pathway.',
  practiceManager:
    'Saw your team page — {clinic_short_name} has the multi-disciplinary mix concussion management is designed for.',
  admin:
    'Saw your team page — {clinic_short_name} has the multi-disciplinary mix concussion management is designed for.',
}

/**
 * The three production cold email templates. Production sends will FAIL
 * for any template whose `signedOffAt` is null — see /api/admin/prospect-send.
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    slug: 'initial',
    subjectTemplate: '{clinic_short_name} concussion training — {region} focus',
    bodyTemplate: `Hi {contact_first_name},

{opening_line}

Concussion is one of the most undertaught conditions in Australian healthcare, and one of the highest-volume sports injuries in {region}. Most clinics in your catchment aren't formally positioned to manage it. {clinic_short_name} could be.

I'm Zac Lewis — AHPRA-registered osteopath, founder of Concussion Education Australia. Our flagship Concussion Clinical Mastery is Osteopathy Australia–endorsed, 14 CPD hours, used in clinics across AU.

For multi-clinician practices like yours, we run on-site cohort training — your whole team trains together on your own cases. I've put together a private working preview portal for {clinic_short_name} so you can see exactly what's in it before deciding:

{portal_url}

(Access key: {access_key} — paste into the link if prompted.)

20-minute scoping call when it suits: https://cal.com/zac-lewis-so8zjs/30min

Cheers,
Zac

--
Zac Lewis · B.Clin.Sci., M.Ost.Med.
AHPRA-registered Osteopath
Founder, Concussion Education Australia
{unsubscribe_link}`,
    openingVariants: T1_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
  {
    slug: 'followup',
    subjectTemplate: 'Re: {clinic_short_name} concussion training — {region} focus',
    bodyTemplate: `Hi {contact_first_name},

Wanted to check this hadn't gone to your spam folder. Two things you might find useful even if a cohort isn't right for {clinic_short_name} this year:

1. Our Module 1 trial is open inside the preview portal — first sections plus the interactive myth-quiz checkpoint. Worth a 5-min skim for any clinician seeing head injuries: {portal_url}

2. We surfaced our concussion reference library — 140+ peer-reviewed sources across Amsterdam 2023, AIS 2024, RACGP and Cochrane. Free to browse in the portal.

If timing isn't right, no need to reply. If it is, 20 mins on https://cal.com/zac-lewis-so8zjs/30min.

Cheers,
Zac

{unsubscribe_link}`,
    openingVariants: T1_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
  {
    slug: 'final',
    subjectTemplate: 'Closing the loop — {clinic_short_name}',
    bodyTemplate: `Hi {contact_first_name},

Last one from me — happy to leave it there if this isn't a fit. If you'd rather get the materials direct without a call, here's the full preview portal: {portal_url}

Module 1 trial + the reference library are useful even without the on-site program.

Either way, all the best with the practice.

Cheers,
Zac

{unsubscribe_link}`,
    openingVariants: T1_OPENING_VARIANTS,
    signedOffAt: null,
    signedOffBy: null,
  },
]

/**
 * Merge a clinic's data into a template. Returns { subject, body } ready
 * to hand to Resend.
 *
 * @param baseUrl absolute origin, e.g. 'https://portal.concussion-education-australia.com'
 */
export function mergeTemplate(
  template: EmailTemplate,
  clinic: ProspectClinic,
  baseUrl: string,
  unsubscribeToken: string,
): { subject: string; body: string } {
  const discipline = clinic.contactDiscipline
  const opening = template.openingVariants[discipline]
    .replace(/\{clinic_short_name\}/g, clinic.shortName)
    .replace(/\{region\}/g, clinic.region)
    .replace(/\{osteo_count\}/g, String(clinic.team.osteopaths))
    .replace(/\{physio_count\}/g, String(clinic.team.physiotherapists))
    .replace(/\{ep_count\}/g, String(clinic.team.exercisePhys))

  const portalUrl = `${baseUrl}/p/${clinic.slug}?k=${clinic.accessKey}`
  const unsubscribeLink = `Reply STOP to unsubscribe — or one-click: ${baseUrl}/api/prospect/unsubscribe?t=${unsubscribeToken}`

  const variables: Record<string, string> = {
    clinic_name: clinic.name,
    clinic_short_name: clinic.shortName,
    region: clinic.region,
    contact_first_name: clinic.contactFirstName,
    contact_full_name: clinic.contactFullName,
    team_breakdown: teamBreakdownString(clinic.team),
    team_total: String(teamTotal(clinic.team)),
    opening_line: opening,
    portal_url: portalUrl,
    access_key: clinic.accessKey,
    unsubscribe_link: unsubscribeLink,
  }

  const subject = mergeVariables(template.subjectTemplate, variables)
  const body = mergeVariables(template.bodyTemplate, variables)
  return { subject, body }
}

function mergeVariables(str: string, vars: Record<string, string>): string {
  return str.replace(/\{([a-z_]+)\}/g, (m, key) => (key in vars ? vars[key] : m))
}

/**
 * Helper for ad-hoc rendering — accepts a clinic and returns the merged
 * T1 preview without needing a base URL (used in admin UI previews).
 */
export function previewInitialEmail(
  clinic: ProspectClinic,
  baseUrl: string = 'https://portal.concussion-education-australia.com',
): { subject: string; body: string } {
  const tpl = EMAIL_TEMPLATES.find((t) => t.slug === 'initial')!
  return mergeTemplate(tpl, clinic, baseUrl, 'preview-token')
}

// Re-export for convenience
export { dominantDiscipline }
