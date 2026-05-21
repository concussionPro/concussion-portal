# Workflow & Admin Prompts

Prompts for the non-clinical layer of practice — admin, marketing, billing, CPD logging. Low clinical risk, but AHPRA advertising rules still apply.

---

---
title: Appointment Reminder
specialty: all
useCase: workflow
riskTier: low
toolTier: A,B,C
---

**When to use:** Drafting SMS or email reminder templates for upcoming appointments.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft appointment reminder templates for an Australian allied health practice. Three formats:

1. SMS 48 hours before (under 320 chars): practice name, date, time, reschedule link or number, no patient-identifying info beyond first name
2. Email 24 hours before: confirmation, what to bring, location/parking, reschedule policy, easy cancellation link
3. Day-of SMS: friendly check-in, address, contact number

Tone: warm, brief, professional. Australian English. Include a brief privacy line confirming we don't include health details in messages.
```

**Required de-identification:** No patient identifiers in the templates.

**Clinician review checklist:**
- No health condition or treatment type referenced
- Practice details accurate
- Reschedule pathway works as described
- Patient has consented to channel (SMS or email)
- Compliant with practice cancellation policy

**Medicolegal note:** Appointment reminders are routine but become privacy issues when they include health information. Keep the message generic.

---

---
title: Billing Follow-up
specialty: all
useCase: workflow
riskTier: low
toolTier: A,B
---

**When to use:** Drafting a polite follow-up for an unpaid account or outstanding gap fee.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft a billing follow-up letter or email for an Australian allied health practice. Three escalation tiers:

1. Tier 1 (14 days overdue): friendly reminder, easy payment options, offer of payment plan
2. Tier 2 (30 days overdue): firmer but professional, payment plan option, notice that the account will be referred to collections if not actioned
3. Tier 3 (60 days overdue): formal final notice before debt collection

Each tier under 200 words. Australian English. Include payment methods (direct deposit, card, BPAY). Comply with Australian consumer protection — no threats, no excessive late fees, no contact outside reasonable hours.
```

**Required de-identification:** No patient identifiers needed.

**Clinician review checklist:**
- Language is professional, not threatening
- Payment options accurate and current
- Practice details correct
- Compliant with ACCC debt collection guidelines
- No reference to health condition or treatment type

**Medicolegal note:** Billing communications must not pressure the patient or reveal health information. ACCC and OAIC both monitor this space.

---

---
title: Marketing Copy
specialty: all
useCase: workflow
riskTier: medium
toolTier: A,B
---

**When to use:** Drafting copy for a website page, social post, or practice flyer.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Draft marketing copy for an Australian [specialty] practice. Purpose: [website service page / Instagram caption / clinic flyer / Google Business profile].

Constraints from AHPRA advertising guidelines:
- No testimonials about clinical outcomes
- No claims of cure, guarantee, or "best"
- No comparisons claiming superiority over other providers
- No creating unreasonable expectations
- No exploiting vulnerability or fear

Tone: warm, professional, informational. Focus on what the patient experiences in the clinic, not promised outcomes. Australian English. [Specify length].

Topic: [topic]
```

**Required de-identification:** No patient data.

**Clinician review checklist:**
- No clinical outcome testimonials
- No prohibited language ("cure", "guarantee", "best", "world-class")
- No fear-based framing
- No therapeutic claims for products
- Aligns with AHPRA advertising guidelines
- Aligns with your specialty board's advertising rules

**Medicolegal note:** AHPRA actively investigates advertising breaches. A single non-compliant social post can trigger a notification. Run all marketing copy through this check before posting.

---

---
title: CPD Log Helper
specialty: all
useCase: workflow
riskTier: low
toolTier: A,B,C
---

**When to use:** Drafting a CPD reflection entry from a course, conference, or journal article you've engaged with.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Help me draft a CPD reflection entry for my Australian [specialty] CPD log. Structure:

- Activity: [name and type]
- Date and duration
- Provider (if any)
- Key learning points (3-5 bullets)
- How I will apply this in practice (be specific)
- What I will do differently this week
- What further learning this prompts

Activity summary I want to reflect on:
[paste notes]

Reflection should be specific to my practice context, not generic. Australian English. Approximately 200 words.
```

**Required de-identification:** No patient data.

**Clinician review checklist:**
- Reflection is genuine, not generic
- Application to practice is specific
- Entry meets your board's CPD format expectations
- Hours logged match actual engagement
- Supporting evidence (certificate, notes) attached
- Entry signed and dated

**Medicolegal note:** CPD logs are audited. A fabricated or inflated reflection is a professional conduct issue. Use AI to structure your real reflection, not to invent one.

---

---
title: Practice Email Drafts
specialty: all
useCase: workflow
riskTier: low
toolTier: A,B,C
---

**When to use:** Drafting routine practice emails — to other clinicians, to suppliers, to insurers — where you want a polished version of a quick brief.

**The prompt:**

```
All identifiable patient details have been removed before this prompt.

Polish the following rough email into a professional, concise Australian English email. Purpose: [GP collegial update / supplier query / insurer enquiry / referral acknowledgement]. Keep under 150 words. Maintain the original intent. Do not add information not in the original.

Rough draft:
[paste rough draft]
```

**Required de-identification:** Strip patient names, third-party identifiers. Re-add on send.

**Clinician review checklist:**
- Polished email preserves original intent
- No information added that wasn't in the rough draft
- Identifiers re-added before sending
- Recipient correct
- Tone appropriate to the relationship
- Sent from clinic email, not personal

**Medicolegal note:** Practice email is part of your professional record. Polish for clarity; don't let AI add commitments or claims you didn't make.
