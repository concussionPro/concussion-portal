# Jane Integrations Partner — intake draft (2026-07-31)

Paste-ready blocks for https://integrations.jane.app/application_forms/jane-integrations-partner-interest-form/partner_applications/new
Ground rules this draft is engineered around (their published words): no single-use-case
integrations · no AI scheduling/scribes · no calendar posting · no credential sharing /
2FA workarounds · no scraping extensions · "The Jane 10" PHI security bar · community
interest and partner support weigh into selection.

---

## Company

Concussion Education Australia (CEA Pty Ltd), ABN 74 688 155 508 — an accredited
clinical-education and clinical-software provider. Founder-led by Zac Lewis (Osteopath).
Our courses are endorsed/accredited by Osteopathy Australia and Exercise & Sports
Science Australia; an ACSM education-provider application is in progress.

## Product (category framing — NOT single-use-case)

**SST Trainer — remote exertional and therapeutic monitoring with structured outcome
reporting for rehab.** A clinician prescribes a measured heart-rate ceiling from a
graded exertion assessment; the patient trains at home on the wearable they already own
(Garmin, Polar, any HR strap) with every session verified live; the platform builds the
recovery trajectory and renders structured clinical reports (GP letter,
return-to-activity data summary) from the episode.

One engine, multiple accredited protocols:
- **Live now — concussion**: sub-symptom-threshold aerobic rehab per our published,
  open-access clinical protocol (Lewis Z., 2026, Zenodo, DOI 10.5281/zenodo.21482634),
  the method named first-line in the current consensus literature.
- **Roadmap**: POTS/orthostatic-intolerance reconditioning (Levine/CHOP-pattern
  recumbent-first protocols) and post-operative graded return-to-activity — same
  measured-ceiling engine, new protocol modules.

## Safety by design (the differentiator)

Progression is symptom-contingent with automatic de-escalation — a measured ceiling
with backoff, not effort-guessed exercise. For fatigue-adjacent protocols the roadmap
includes a validated post-exertional-malaise screen as a **hard software gate**:
prescription is refused until the screen clears, and the engine refuses to generate a
progression when PEM flags, routing to pacing instead. Generic HEP platforms do not
gate this; it is why clinical directors adopt us for exertional populations.

## How the integration works (data flow)

- **Practitioner-authorized access only**, via Jane's partner OAuth — no credential
  sharing, no 2FA workarounds, no browser extensions, no scraping.
- **Write-back-shaped**: SST files finished clinical documents (reports) and episode
  summaries into the patient's chart. We do not post to Jane calendars, do not modify
  Jane clinical data, and read only what patient-matching requires (identity fields).
- No AI scribe or scheduling functionality exists in the product.
- Hosting: dedicated infrastructure, AES-256 at rest / TLS 1.2+ in transit, full
  subprocessor list available (Vercel, Neon/Postgres, Stripe, Resend, Cloudflare).
- **The Jane 10**: controls 2–10 substantially in place and documented on request;
  we are prepared to complete SOC 2 Type II and independent penetration testing as a
  condition of partnership. Data residency is disclosed transparently and we are open
  to a Canadian deployment as adoption warrants.

## Support model (partner support is weighed — lead with it)

Founder-clinician support with published response commitments; 1:1 onboarding for every
clinic (a threshold-assessment protocol deserves guided setup, not a help doc); a
proactive check-in before trial end; free trial with no card; demo workspace any
clinician can try without an account. Support does not land on Jane.

## Why Jane clinicians want this

Jane's rehab shelf (Physitrack, Wibbi) covers MSK exercise-video HEP. It has no
concussion, neuro, or exertional-threshold tool — yet Jane's physiotherapy and
chiropractic base manages concussion daily, and current digital options prescribe from
age-predicted formulas rather than each patient's measured threshold. SST is
complementary to the existing HEP partners, not competitive with them.

## Commercial

Per-clinician monthly subscription (local pricing; cancel anytime), free 3-patient
trial, education attach (accredited clinician certification) available but not required
for standard use. We fund our own demand generation and clinic onboarding — the ask of
Jane is the trusted in-product connection, not marketing.

## Contact

Zac Lewis · zac@concussion-education-australia.com ·
portal.concussion-education-australia.com · Integration page precedent:
portal.concussion-education-australia.com/integrations/cliniko
