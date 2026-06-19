import type { Module } from '@/data/modules'

export const module8: Module = {
  id: 8,
  title: 'Documentation, Communication & Referral',
  subtitle: 'Recording, Reporting and Closing the Loop With the Care Team',
  duration: '30 min',
  points: 0.5,
  description:
    'The shortest module in the program, and the one that protects everything you do in the other six. Concussion rehabilitation is a shared-care activity: an Accredited Exercise Physiologist (AEP) almost never works alone, and the value of your reconditioning work is only realised when it is recorded clearly and communicated back to the referring clinician. This module covers the specific documents an AEP actually produces — a BCTT/assessment record, a session and progression tracking sheet, an EP-to-referrer communication letter, and an EP-scope return-to-activity progress note — plus sound record-keeping and Australian Privacy Principles compliance, and a brief, tool-neutral note on AI-assisted clinical documentation. The governing principle throughout: within your scope you recommend and report; you do not diagnose and you do not grant medical clearance for return to contact.',
  sections: [
    {
      id: 'learning-outcomes',
      title: 'Learning Outcomes',
      content: [
        'By the end of this module you will be able to:',
        '   - Produce the core EP-scope concussion-rehabilitation documents: an assessment/BCTT record, a session and progression tracking sheet, a communication letter to the referrer, and a return-to-activity progress note.',
        '   - Communicate your findings, prescription rationale and progress to the referring clinician clearly, objectively and within scope.',
        '   - Record within scope — framing your conclusions as recommendations and observations, never as a diagnosis or as medical clearance for return to contact.',
        '   - Apply sound record-keeping and privacy standards consistent with ESSA professional standards, AHPRA/National Law record-keeping expectations and the Australian Privacy Principles.',
        '   - Use AI-assisted documentation tools, where you choose to, as an efficiency aid while remaining personally responsible for the accuracy of the clinical record.',
        '[CALLOUT: scope | Scope of practice for AEPs: You document what you assessed, prescribed, observed and recommended. You do NOT record a concussion diagnosis as your own, and you do NOT issue clearance for return to contact or collision sport — that is a medical decision. Your documents should make this boundary visible to every reader.]',
      ],
    },
    {
      id: 'why-documentation',
      title: 'Why Documentation Matters in Shared-Care Concussion Rehab',
      content: [
        'Concussion management is multidisciplinary by design. The patient in front of you has usually been diagnosed by a doctor or assessed by a physiotherapist, and they will return to that clinician — or to a sports physician — for the decisions that sit outside your scope, including final clearance for contact. You are one link in that chain. Your documentation is what holds the chain together.',
        'Good records do three jobs at once. They are a clinical tool (so you, or a covering colleague, can pick up the program next session and know exactly where the patient is). They are a communication tool (so the referrer can see what you found and what you are doing). And they are a medico-legal and professional record (so that, if your management is ever reviewed, your reasoning is visible and defensible).',
        '### The professional obligations behind the record',
        '   - ESSA professional standards require AEPs to maintain accurate, contemporaneous and legible clinical records for every patient interaction, and to communicate appropriately with referring and other treating practitioners.',
        '   - The National Law and AHPRA-aligned record-keeping expectations (which set the benchmark Australian allied health practitioners are held to) require records that are made at the time of the consultation or as soon as practicable afterwards, are sufficient to allow another practitioner to continue care, and are not altered after the fact except by clear, dated, attributed correction.',
        '   - The Australian Privacy Principles (APPs), under the Privacy Act 1988, govern how you collect, store, use and disclose the patient\'s health information — which is "sensitive information" attracting the highest level of protection.',
        '[CALLOUT: key | Write every entry as though a colleague will read it next week and an auditor might read it next year. Objective, dated, attributable observations carry far more weight than vague impressions. If it is not documented, for practical purposes it did not happen.]',
        'For the concussion AEP specifically, one principle sits above the rest: record within scope. When you write up a treadmill test result, you are recording an exercise-tolerance finding, not making a diagnosis. When you write a progress note, you are reporting reconditioning progress, not certifying fitness for contact. Keeping that framing consistent across every document protects the patient, the referrer and your own registration.',
      ],
    },
    {
      id: 'assessment-record',
      title: 'The Assessment / BCTT Record',
      content: [
        'Your first document on any concussion referral is the assessment record. Where your scope and the referral pathway include administering a Buffalo Concussion Treadmill Test (BCTT) or Buffalo Concussion Bike Test (BCBT), this record captures the test and the baseline measures you will progress against. Where the heart-rate threshold was handed to you by the referrer, you record that you received it, from whom, and on what date — you do not re-badge someone else\'s test as your own.',
        '### What the assessment record must capture',
        '   - Patient identifiers and the referral details: who referred, the stated reason for referral, the working diagnosis as provided by the referrer (recorded as theirs, e.g. "referring GP\'s working diagnosis: concussion, injury date 12/06"), and the date of injury.',
        '   - Consent: that the patient (or parent/guardian for a minor) consented to assessment, and to your communicating with the referrer and other named treating practitioners.',
        '   - Baseline subjective measures: the patient\'s current symptom burden, ideally using a structured scale (e.g. a Post-Concussion Symptom Scale total and the dominant symptoms), and their current activity tolerance.',
        '   - The test itself: protocol used (BCTT/BCBT), stage-by-stage heart rate, the symptom score at each stage, the heart rate at symptom threshold (HRt) or the finding that the test was exhaustion/RPE-limited with no symptom provocation, blood pressure and RPE where taken, and the reason the test was stopped.',
        '   - Your interpretation, framed within scope: e.g. "Symptom-limited treadmill test, HRt 148 bpm — findings consistent with an exercise-intolerance (physiological) presentation; suitable for sub-symptom-threshold aerobic reconditioning." This is an exercise-physiology interpretation of a tolerance test, not a medical diagnosis.',
        '   - The resulting prescription and the plan: the training heart-rate band derived from HRt, session duration and frequency, monitoring instructions, and the review/re-test interval.',
        '[CALLOUT: scope | Note the language in the worked interpretation above: "findings consistent with", "suitable for". You are describing what the test showed and what it makes the patient a candidate for. You are not writing "the patient has post-concussion syndrome" — that conclusion belongs to the diagnosing clinician.]',
        'A clean assessment record means that, weeks later, you and the referrer can both see exactly where the patient started: the threshold, the baseline symptom load, and the prescription that flowed from them. Every progress note from then on measures against this anchor.',
      ],
    },
    {
      id: 'tracking-sheet',
      title: 'The Session & Progression Tracking Sheet',
      content: [
        'Sub-symptom-threshold aerobic rehabilitation is a near-daily, data-driven program, and the tracking sheet is where that data lives. It is partly your own working document and partly the raw material for the progress notes and letters you send to the referrer. Keep it simple enough that it gets filled in every session, but structured enough that the trajectory is visible at a glance.',
        '### Columns to capture each session',
        '   - Date and session number.',
        '   - Exercise / modality and the prescribed target (e.g. "treadmill, target HR band 118–133 bpm, 20 min").',
        '   - Heart-rate response: average and peak HR achieved, and whether the HR cap was respected.',
        '   - Symptom score before and after the session (e.g. 0–10), and any symptoms provoked during it.',
        '   - RPE for the session (Borg 6–20 or 0–10).',
        '   - Duration completed versus prescribed.',
        '   - Adherence: home sessions completed since last contact (e.g. "5/6 prescribed home sessions completed").',
        '   - A short free-text note: tolerance, any session regression or progression you made and why, sleep/stress context if relevant.',
        '[CALLOUT: key | The single most informative pattern in the sheet is the relationship between heart rate, symptom score and duration over time. A rising tolerated HR ceiling with a falling or stable symptom score is the signature of a recovering physiological phenotype — and it is exactly the trend the referrer wants to see in your letters.]',
        'The tracking sheet also documents adherence, which matters for two reasons. Clinically, a patient who is not completing home sessions will progress slowly for reasons that have nothing to do with their injury, and the sheet lets you show that. Medico-legally, a contemporaneous record of what was prescribed and what was actually done protects you if outcomes are later questioned.',
        'Because the sheet accumulates a detailed picture of the patient\'s health over time, it is health information under the Australian Privacy Principles. Store it within your clinic\'s secure record system, not in an unsecured spreadsheet on a personal device, and apply the same access controls you would to any clinical note.',
      ],
    },
    {
      id: 'referrer-letter',
      title: 'The EP-to-Referrer Communication Letter',
      content: [
        'This is the document that closes the loop. The referring clinician sent the patient to you for reconditioning; they need to know what you found, what you are doing, how the patient is tolerating it, and — crucially — when they should re-enter the picture for the decisions that are theirs to make. Send an initial letter after assessment, and update letters at meaningful milestones or when something changes.',
        '### Structure of an effective referrer letter',
        '   - Salutation and reference: patient name, date of injury, your assessment date, and the referrer\'s stated reason for referral.',
        '   - What you assessed and found, objectively: the test result and threshold, the baseline symptom load.',
        '   - What you are prescribing and why: the training band, dose, and the autonomic-reconditioning rationale in one plain sentence.',
        '   - Current progress, against the baseline: the trajectory in HR, symptom score and stage tolerated.',
        '   - Your recommendation and the hand-back point: what you suggest happens next, and explicitly where a medical decision is required.',
        'Here is a worked example of the clinical core of such a letter:',
        '"Thank you for referring [patient] following their concussion of 12 June. On treadmill testing the patient reached a symptom threshold at 148 bpm (symptoms rose from 2/10 to 5/10), consistent with an exercise-intolerance presentation. I have commenced sub-symptom-threshold aerobic reconditioning, prescribing steady-state aerobic work at approximately 125 bpm (around 85% of threshold) to drive autonomic recovery without provoking symptoms. The patient is now tolerating Stage 2–3 reconditioning with good adherence and a falling symptom score (12/22 at baseline, 5/22 this week). I will continue to progress the heart-rate ceiling as tolerance improves and update you at the next milestone. As the patient approaches return to full training, I recommend medical review to consider clearance for return-to-contact, which sits outside my scope as an exercise physiologist."',
        '[CALLOUT: scope | Read the last sentence of that letter again. It does three things: it signals the patient is improving, it names the next decision, and it explicitly returns that decision to the medical practitioner. A good referrer letter always tells the doctor where your scope ends and theirs begins.]',
        'Keep the tone collegial and the content objective. Avoid speculating about causation, prognosis beyond your evidence, or anything that reads as a diagnosis. Obtain and record the patient\'s consent before sending the letter, and send it only to the named recipient(s) the patient has agreed to.',
      ],
    },
    {
      id: 'progress-note-and-ai',
      title: 'The Return-to-Activity Progress Note, AI-Assisted Documentation & Privacy',
      content: [
        'The return-to-activity progress note is the EP-scope analogue of a clearance document — with one essential difference: it reports progress through reconditioning stages, it does not certify fitness for contact. It is the note you write as a patient moves up the graduated activity ladder, and it is read by the patient, sometimes by a coach or employer (with consent), and by the referrer.',
        '### What the progress note records',
        '   - The stages of graded activity the patient has tolerated symptom-free under your supervision (e.g. light aerobic exercise, then sport-specific exercise without head impact, then non-contact drills).',
        '   - The objective evidence for each step: the HR tolerated, symptom scores, the ≥24-hour symptom-free interval before each progression.',
        '   - The current status and what remains.',
        '   - An explicit scope statement: that you supervise and progress non-contact reconditioning, and that clearance for full-contact return is a medical decision made by the treating doctor or sports physician.',
        '[CALLOUT: key | The defining sentence of an EP progress note is some version of: "The patient has completed supervised non-contact graded reconditioning and is tolerating Stage 4 symptom-free. Clearance for return to full-contact participation is a medical decision and is recommended via the referring/treating medical practitioner." Recommend, don\'t clear.]',
        '### AI-assisted documentation as an efficiency aid',
        'Clinicians across allied health are increasingly using AI-assisted "clinical scribe" tools that listen to a consultation (with consent) or take dictation and draft a structured note. Used well, these tools save time and let you spend more of the session with the patient rather than the keyboard. This section is deliberately tool-neutral — the principle matters more than the product.',
        '   - You remain personally and professionally responsible for the record. An AI draft is a starting point; you must read, correct and approve every note before it enters the clinical record. The accountability for accuracy is yours, not the tool\'s.',
        '   - Patient consent and privacy come first. If a tool records or transmits the consultation, the patient must consent, and you must know where the data goes. Health information is sensitive information under the Australian Privacy Principles — using a tool that sends audio to an offshore server, or that retains recordings, may breach APP obligations around disclosure and cross-border data flows. Check this before you adopt any tool.',
        '   - Watch for AI errors. Scribe tools can fabricate plausible detail, mis-hear numbers (a transposed heart rate or symptom score matters), or smooth over the scope language that must stay precise. Your review is where "recommend, don\'t clear" gets protected.',
        '### Privacy and record-keeping standards in summary',
        '   - Collect only the health information you need, and tell the patient why you are collecting it (APP 3 and 5).',
        '   - Keep records secure — controlled access, secure clinic systems, no patient data on unsecured personal devices (APP 11).',
        '   - Disclose to other practitioners only with the patient\'s consent and only to the named recipients (APP 6).',
        '   - Make entries contemporaneously, keep them legible and attributable, and correct errors transparently (single dated, initialled amendment — never delete or overwrite).',
        '   - Retain records for the period required for adult and paediatric patients under your jurisdiction\'s health-records legislation.',
        'Across all four documents — assessment record, tracking sheet, referrer letter and progress note — the through-line is the same. Be objective, be contemporaneous, protect the patient\'s privacy, and keep your scope visible: you recommend and report; you do not diagnose and you do not clear for contact.',
      ],
    },
  ],
  quiz: [
    {
      id: 'm8q1',
      question:
        'When an AEP writes up a Buffalo Concussion Treadmill Test result in the assessment record, how should the interpretation be framed?',
      options: [
        'As a formal concussion diagnosis, since the EP administered the test',
        'As an exercise-tolerance finding — e.g. "symptom-limited test, findings consistent with an exercise-intolerance presentation, suitable for sub-symptom-threshold aerobic reconditioning"',
        'As a statement that the patient is cleared to return to contact sport',
        'It should not be written down at all unless the referring doctor approves the wording first',
      ],
      correctAnswer: 1,
      explanation:
        'The BCTT gives an exercise-tolerance finding, and the EP records and interprets it within scope ("findings consistent with", "suitable for"). It is not a diagnosis (that belongs to the diagnosing clinician) and it is certainly not contact clearance (a medical decision). The record should always be made — within scope.',
    },
    {
      id: 'm8q2',
      question:
        'Which set of data points belongs on the session and progression tracking sheet?',
      options: [
        'Date, exercise/target, HR response, symptom score before/after, RPE, duration completed, and home-session adherence',
        'Only the final heart rate achieved and whether the patient liked the session',
        'The patient\'s diagnosis, prognosis and a prediction of their return-to-contact date',
        'Nothing — session details are kept verbally and only summarised at discharge',
      ],
      correctAnswer: 0,
      explanation:
        'The tracking sheet is a structured, contemporaneous record of each session: date, exercise and target, HR response, pre/post symptom score, RPE, duration completed versus prescribed, and adherence. The HR–symptom–duration trend over time is the most clinically informative pattern and feeds your referrer letters.',
    },
    {
      id: 'm8q3',
      question:
        'In an EP-to-referrer letter, what is the correct way to handle return-to-contact clearance?',
      options: [
        'State that the EP is clearing the patient for full-contact return',
        'Avoid mentioning clearance entirely so as not to confuse the referrer',
        'Recommend medical review for return-to-contact clearance, explicitly noting it sits outside EP scope',
        'Tell the patient they are cleared and ask the referrer to sign off afterwards',
      ],
      correctAnswer: 2,
      explanation:
        'Clearance for return to contact is a medical decision. The EP letter signals progress, names the next decision, and explicitly returns that decision to the medical practitioner — for example, "I recommend medical review to consider clearance for return-to-contact, which sits outside my scope as an exercise physiologist." Recommend, don\'t clear.',
    },
    {
      id: 'm8q4',
      question:
        'An AEP wants to use an AI clinical-scribe tool to draft session notes. Which statement reflects correct practice?',
      options: [
        'Once the AI generates the note, the EP can file it unread because the tool is responsible for accuracy',
        'The EP remains personally responsible: every AI-drafted note must be reviewed and corrected, the patient must consent to any recording, and the tool must comply with Australian Privacy Principles',
        'AI scribe tools remove the need for patient consent because no human is taking notes',
        'Any AI tool is fine to use as long as it is free of charge',
      ],
      correctAnswer: 1,
      explanation:
        'AI scribes are an efficiency aid, not a transfer of accountability. The clinician must review and approve every note (tools can mishear numbers or fabricate detail), the patient must consent to any recording, and because health information is sensitive information under the APPs, the EP must know where the data is sent and stored before adopting the tool.',
    },
    {
      id: 'm8q5',
      question:
        'Under sound record-keeping and Australian Privacy Principles standards, how should an AEP handle an error discovered in an earlier clinical note?',
      options: [
        'Delete the original entry and retype the corrected version so the record looks clean',
        'Leave the error in place because notes must never be touched once written',
        'Make a single dated, initialled amendment that corrects the error while leaving the original entry legible',
        'Ask the patient to decide whether the correction should be recorded',
      ],
      correctAnswer: 2,
      explanation:
        'Records must be contemporaneous and not altered after the fact except by transparent correction: a single dated, attributable amendment that leaves the original legible. Deleting or overwriting destroys the audit trail and breaches record-keeping standards. The integrity of the record is the clinician\'s responsibility, not the patient\'s.',
    },
  ],
  clinicalReferences: [
    'Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport, Amsterdam, October 2022. British Journal of Sports Medicine. 2023;57(11):695-711. https://doi.org/10.1136/bjsports-2023-106898',
    'Exercise & Sports Science Australia (ESSA). Accredited Exercise Physiologist Professional Standards and Code of Professional Conduct and Ethical Practice — record-keeping, scope of practice and communication with referring practitioners.',
    'Australian Health Practitioner Regulation Agency (AHPRA) and National Boards. Guidelines and Code of Conduct — clinical records: requirements for accurate, contemporaneous, legible and securely stored records (benchmark for registered allied health practice under the Health Practitioner Regulation National Law).',
    'Office of the Australian Information Commissioner (OAIC). Australian Privacy Principles (APPs), Privacy Act 1988 (Cth) — handling of health information as sensitive information, including collection, use, disclosure, data security (APP 11) and cross-border disclosure (APP 8).',
    'Leddy JJ, Haider MN, Ellis MJ, et al. Early subthreshold aerobic exercise for sport-related concussion: a randomized clinical trial. JAMA Pediatrics. 2019;173(4):319-325. (Source of the sub-symptom-threshold prescription and re-test progression that the assessment and tracking documents record.) https://doi.org/10.1001/jamapediatrics.2018.4397',
    'Leddy JJ, Willer B. Use of graded exercise testing in concussion and return-to-activity management. Current Sports Medicine Reports. 2013;12(6):370-376. (Buffalo Concussion Treadmill Test protocol and heart-rate-threshold interpretation underpinning the assessment record.) https://doi.org/10.1249/JSR.0000000000000008',
    'Australian Institute of Sport (AIS) and Australian Medical Association. Concussion and Brain Health Position Statement 2024 — shared-care pathways and the requirement for medical clearance prior to return to contact/collision activity.',
  ],
}
