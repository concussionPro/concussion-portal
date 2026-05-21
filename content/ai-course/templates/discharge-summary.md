---
title: Discharge Summary
specialty: all
useCase: Closing an episode of care, communicating to referrer and patient
fields: [{patient_name}, {dob}, {gp_name}, {gp_clinic}, {referral_date}, {referral_reason}, {assessment_summary}, {interventions}, {sessions_attended}, {outcomes}, {outcome_measures}, {recommendations}, {follow_up}, {clinician_name}, {qualification}, {ahpra_number}, {clinic_name}, {clinic_phone}, {date}]
---

# Discharge Summary

**To:** Dr {gp_name}, {gp_clinic}
**Re:** {patient_name}
**Date:** {date}

---

## Patient details

- **Name:** {patient_name}
- **Date of birth:** {dob}

## Episode of care

- **Referral date:** {referral_date}
- **Reason for referral:** {referral_reason}
- **Sessions attended:** {sessions_attended}

## Assessment summary

{assessment_summary}

## Interventions provided

{interventions}

## Outcomes

{outcomes}

**Outcome measures (where used):**

{outcome_measures}

## Recommendations

{recommendations}

## Follow-up

{follow_up}

---

The patient has been advised of the discharge plan and has consented to this summary being shared with you. Should you wish to discuss any aspect of this episode of care, please contact me directly.

Yours sincerely,

{clinician_name}
{qualification}
AHPRA Registration: {ahpra_number}
{clinic_name} | {clinic_phone}

---

**Compliance attestation footer** (copy verbatim onto every issued document):

> This document was prepared with AI assistance and has been reviewed for clinical accuracy by {clinician_name}, {qualification}, AHPRA Registration: {ahpra_number}. Date: {date}.
