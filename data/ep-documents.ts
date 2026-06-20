/**
 * EP-course clinical & administrative documents.
 *
 * These are the REAL, gated deliverables behind the "Clinical Toolkit" and
 * "Administrative document pack" cards. Each document is rendered as a clean,
 * printable web page (view → print / save-as-PDF) at /ep-course/documents/[slug],
 * gated by requireAiCourseAccess (enrolled / demo / admin only) and noindex.
 *
 * Content is derived directly from the EP modules so every figure is consistent
 * with the course:
 *   - module 3  — BCTT protocol, contraindications, HRt capture
 *   - module 4  — SSTAE FITT prescription, stop rule, progression
 *   - module 5  — phenotype exercise library, deliver-vs-refer boundary
 *   - module 8  — the four EP-scope documents, funding/scope language
 *
 * Scope rule baked into every document: the AEP implements, monitors, progresses
 * and RECOMMENDS — the AEP does NOT diagnose concussion and does NOT grant
 * medical clearance for return to contact.
 */

export type DocBlock =
  | { type: 'section'; title: string }
  | { type: 'sub'; title: string }
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; tone: 'key' | 'scope' | 'warning'; text: string }
  | { type: 'fields'; cols?: 1 | 2; items: { label: string; hint?: string }[] }
  | { type: 'checklist'; title?: string; items: string[] }
  | { type: 'grid'; columns: string[]; rows: number; note?: string }
  | { type: 'note'; text: string }
  | { type: 'signature' }

export interface EpDocument {
  slug: string
  category: 'toolkit' | 'admin'
  kind: 'Assessment' | 'Template' | 'Reference' | 'Form'
  title: string
  subtitle: string
  purpose: string
  blocks: DocBlock[]
}

const SCOPE_FOOTER =
  'Accredited Exercise Physiologists implement, monitor, progress and recommend. They do not diagnose concussion and do not grant medical clearance for return to contact — those decisions remain with the referring/treating medical practitioner.'

export const EP_DOCUMENTS: EpDocument[] = [
  // ───────────────────────────── CLINICAL TOOLKIT ─────────────────────────────
  {
    slug: 'bctt-testing-sheet',
    category: 'toolkit',
    kind: 'Assessment',
    title: 'Buffalo Concussion Treadmill Test — Recording Sheet',
    subtitle: 'BCTT / BCBT administration, symptom-threshold capture and HRt',
    purpose:
      'Administer and record the Buffalo test defensibly — from the contraindication screen to the heart rate at symptom threshold (HRt), the single number you carry into prescription.',
    blocks: [
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Patient name' },
          { label: 'DOB / ID' },
          { label: 'Date of test' },
          { label: 'Referrer' },
          { label: 'Date of injury' },
          { label: "Referrer's working diagnosis", hint: 'recorded as theirs' },
          { label: 'Modality', hint: 'BCTT treadmill / BCBT bike' },
          { label: 'Age-predicted max HR', hint: '208 − 0.7 × age' },
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'The AEP administers this test under a medical referral to quantify exercise tolerance. The HRt is an exercise-physiology finding, not a diagnosis. Diagnosis, imaging and clearance remain with the referring practitioner.',
      },
      { type: 'section', title: '1. Pre-test screen' },
      {
        type: 'checklist',
        title: 'Absolute red flags — do NOT test, refer back immediately (confirm all ABSENT)',
        items: [
          'Deteriorating / escalating symptoms, repeated vomiting, seizure activity, or progressively worsening headache',
          'Focal neurological signs: limb weakness, numbness, slurred speech, worsening diplopia, unequal / fixed pupils',
          'Suspected cervical spine injury or significant midline neck tenderness',
          'Any feature suggesting a structural intracranial injury rather than a physiological concussion',
        ],
      },
      {
        type: 'checklist',
        title: 'Relative cautions — modify or defer',
        items: [
          'Uncontrolled hypertension, symptomatic resting tachycardia, or unstable cardiac / respiratory disease (apply ESSA pre-exercise screening)',
          'Acute MSK injury preventing safe treadmill walking — use the bike variant (BCBT)',
          'Resting symptom score too high to register a ≥ 3-point rise — defer and liaise with the referrer',
          'Active migraine attack or acute BPPV — settle the dominant phenotype first',
        ],
      },
      {
        type: 'checklist',
        title: 'Pre-test confirmations',
        items: [
          '≥ 24–48 h post-injury; acute red flags excluded by the referrer; referral clears the client for graded exertion testing',
          'No exhaustive exercise, new sedating / HR-altering medication, caffeine or nicotine immediately before the test',
          'Continuous HR monitor (chest strap), BP cuff, 0–10 symptom VAS and Borg RPE (6–20) chart positioned in the client’s eyeline',
          'Quiet, low-stimulus room; handrail / spotter; emergency stop within reach',
          'Client briefed: report any change honestly — stopping early is a successful test, not a failure',
        ],
      },
      { type: 'section', title: '2. Baseline (record before the belt moves)' },
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Resting HR (bpm)', hint: 'after ≥ 2 min rest' },
          { label: 'Resting BP' },
          { label: 'Baseline symptom score (0–10)', hint: 'current overall intensity — the reference point for every reading' },
          { label: 'Dominant baseline symptom(s)' },
        ],
      },
      { type: 'section', title: '3. Graded protocol — per-minute log' },
      {
        type: 'note',
        text: 'Treadmill ~5.0–5.8 km/h; 0% incline for minute 1, then +1% incline each minute to ~15%; thereafter hold incline and +~0.4 km/h each minute. Capture HR, RPE and symptom score at the end of every minute without stopping the belt.',
      },
      {
        type: 'grid',
        columns: ['Min', 'Speed (km/h)', 'Incline %', 'HR (bpm)', 'RPE 6–20', 'Symptom 0–10', 'Symptom(s) provoked'],
        rows: 16,
      },
      { type: 'section', title: '4. Termination & HRt' },
      {
        type: 'checklist',
        title: 'Endpoint reached (tick one)',
        items: [
          'SYMPTOM THRESHOLD — symptom score rose ≥ 3 points vs baseline (primary, concussion-specific endpoint; stop the belt)',
          'VOLUNTARY EXHAUSTION / physical max — RPE 19–20 or volitional fatigue WITHOUT a ≥ 3-point symptom rise (normal / negative test)',
          'RED FLAG — ataxia, marked pallor, syncope / near-syncope, chest pain, or rapidly escalating symptom (stop immediately)',
        ],
      },
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'HRt (bpm)', hint: 'HR at the ≥ 3-point symptom rise — THE KEY NUMBER' },
          { label: 'RPE at threshold' },
          { label: 'Dominant provoked symptom' },
          { label: 'Time to threshold (min:sec)' },
          { label: 'HRt as % age-predicted max' },
          { label: 'Reason test stopped' },
        ],
      },
      { type: 'section', title: '5. Interpretation (within scope)' },
      {
        type: 'fields',
        cols: 1,
        items: [
          {
            label: 'Exercise-tolerance finding',
            hint: 'e.g. "Symptom-limited test, HRt 148 bpm — consistent with an exercise-intolerance (physiological) presentation; suitable for sub-symptom-threshold aerobic reconditioning."',
          },
          { label: 'Plan / next step' },
        ],
      },
      {
        type: 'callout',
        tone: 'key',
        text: 'Convert the HRt directly into the daily prescription: target training band = 80–90% of HRt. Use the SSTAE Prescription Template or the live BCTT Calculator to complete the conversion the same minute.',
      },
      { type: 'signature' },
    ],
  },
  {
    slug: 'sstae-prescription',
    category: 'toolkit',
    kind: 'Template',
    title: 'Sub-Symptom-Threshold Aerobic Exercise (SSTAE) Prescription',
    subtitle: 'Converting HRt into an individualised aerobic dose, FITT and progression',
    purpose:
      'Turn the Buffalo test HRt into a precise daily training band the patient can self-regulate — with the FITT prescription, the session stop rule, and the re-test / progression schedule.',
    blocks: [
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Patient name' },
          { label: 'ID / DOB' },
          { label: 'Date' },
          { label: 'Prescribing AEP' },
          { label: 'HRt (bpm)', hint: 'from BCTT / BCBT' },
          { label: 'Source of HRt', hint: 'administered by me / supplied by referrer' },
        ],
      },
      { type: 'section', title: '1. The conversion — 80–90% of HRt' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: '80% of HRt = ____ bpm', hint: 'lower bound — start nearer here if highly symptomatic / deconditioned' },
          { label: '90% of HRt = ____ bpm', hint: 'upper bound — HARD CAP, not a target to chase' },
          { label: 'Prescribed starting band (bpm)' },
        ],
      },
      {
        type: 'note',
        text: 'Worked example: HRt 150 bpm → 80% = 120 bpm, 90% = 135 bpm → train 120–135 bpm, beginning ~118–125 bpm for the first week.',
      },
      {
        type: 'callout',
        tone: 'key',
        text: 'Intensity is anchored to a percentage of the symptom-threshold HR — NOT age-predicted max, NOT %HRR, NOT a fixed RPE. The 10–20% buffer absorbs day-to-day threshold drift and keeps every session reliably sub-symptomatic.',
      },
      { type: 'section', title: '2. FITT prescription' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Frequency', hint: 'daily or 5–6×/week; ≤ 1 rest day; avoid clustering sessions' },
          { label: 'Intensity', hint: 'target HR band ____–____ bpm; do not exceed the upper cap; RPE ~11–13 as a secondary cross-check' },
          { label: 'Time', hint: '20 min continuous (10–15 min if very deconditioned, build to 20); +2–3 min warm-up & cool-down' },
          { label: 'Type', hint: 'stationary bike / treadmill / outdoor walk — no impact, no head-position challenge, low fall risk' },
        ],
      },
      { type: 'section', title: '3. The session stop rule' },
      {
        type: 'callout',
        tone: 'warning',
        text: 'Stop or reduce intensity if symptoms rise ≥ 2 points (0–10) above the pre-exercise baseline. A 0–1 point blip that settles is acceptable. Drop the HR band ~10 bpm; if symptoms do not settle within a minute or two, stop the session — do not push through.',
      },
      {
        type: 'list',
        items: [
          'Re-rate symptoms immediately after the session, at 30–60 min, and the next morning',
          'Delayed / next-morning exacerbation = dose too high → drop the HR ceiling 5–10 bpm for subsequent sessions',
          'Warm up gradually — a sudden HR jump is more provocative than a graded ramp',
        ],
      },
      { type: 'section', title: '4. Re-test & progression schedule' },
      {
        type: 'list',
        items: [
          'Re-evaluate every 1–2 weeks; if the full period is completed with no within- or next-day flares, step the HR ceiling up 5–10 bpm',
          'Progress duration toward 20–30 min FIRST, then intensity — never advance both at once',
          'Re-test the BCTT periodically for a fresh, higher HRt and a new 80–90% band',
          'Regress (drop ceiling 5–10 bpm, hold) on repeated flares; escalate / refer on a plateau > ~2 weeks despite good adherence',
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'The aerobic-recovery endpoint is a symptom-free exertion test to ~90% age-predicted max (or volitional exhaustion). That marks recovered exercise tolerance — it is NOT medical clearance for return to contact, which is the referring practitioner’s decision. Recommend, don’t clear.',
      },
      { type: 'section', title: '5. Patient copy — your daily target' },
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Your daily HR ceiling (do not exceed)' },
          { label: 'Session length' },
          { label: 'Sessions per week' },
          { label: 'Mode' },
          { label: 'Stop if symptoms rise', hint: '2 points or more' },
          { label: 'Next review / re-test date' },
        ],
      },
      { type: 'signature' },
    ],
  },
  {
    slug: 'session-tracking-sheet',
    category: 'toolkit',
    kind: 'Template',
    title: 'Session & Progression Tracking Sheet',
    subtitle: 'The contemporaneous per-session record behind every prescription change',
    purpose:
      'Log each session — HR response, pre/post symptoms, RPE, duration and adherence — so the HR ↔ symptom ↔ duration trend is visible at a glance and feeds your referrer letters.',
    blocks: [
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Patient name' },
          { label: 'ID / DOB' },
          { label: 'Prescribing AEP' },
          { label: 'Current prescription', hint: 'HR band & duration' },
          { label: 'HRt (bpm)' },
          { label: 'Date HRt obtained' },
        ],
      },
      { type: 'section', title: 'Per-session log' },
      {
        type: 'grid',
        columns: [
          'Date',
          'Session',
          'Modality & target (HR / time)',
          'Avg / Peak HR',
          'Symptom pre → post',
          'RPE',
          'Duration done / Rx',
          'Adherence (n/N)',
          'Note (tolerance / prog–regress + why)',
        ],
        rows: 12,
      },
      {
        type: 'callout',
        tone: 'key',
        text: 'The single most informative pattern is HR vs symptom vs duration over time. A rising tolerated HR ceiling with a falling or stable symptom score is the signature of a recovering physiological phenotype — and exactly what the referrer wants to see in your letters.',
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'This sheet is health information under the Australian Privacy Principles. Store it in your clinic’s secure record system, not an unsecured personal device. Record contemporaneously; correct errors only by a single dated, initialled amendment — never delete or overwrite.',
      },
      { type: 'signature' },
    ],
  },
  {
    slug: 'phenotype-exercise-library',
    category: 'toolkit',
    kind: 'Reference',
    title: 'Phenotype Exercise Library (EP Scope)',
    subtitle: 'Vestibular, cervical and oculomotor drills — dose, progression and the refer boundary',
    purpose:
      'A chairside reference for the non-aerobic phenotypes: each drill with sets / reps / frequency, the symptom-titrated dosing rule, and where AEP scope ends and the specialist begins.',
    blocks: [
      {
        type: 'callout',
        tone: 'scope',
        text: 'You deliver, monitor and progress exercise-based rehabilitation. You do NOT reposition otoconia (Dix-Hallpike / Epley), manipulate the spine, or prescribe lenses / prism — those sit with vestibular physiotherapy, medicine and behavioural optometry. Confirm the referrer has identified the phenotype and excluded red flags before loading.',
      },
      { type: 'section', title: 'Vestibular — gaze stabilisation, habituation, balance' },
      { type: 'sub', title: 'VOR ×1 (gaze stabilisation) — the foundation drill' },
      {
        type: 'list',
        items: [
          'Single-letter target at arm’s length; rotate the head horizontally (then vertically) keeping the letter in sharp focus — target stays still, only the head moves. If the letter blurs, the head is too fast — slow down',
          'Dose: 30–60 s × 3 per plane, 2–3×/day; pace with a metronome ~60–120 bpm',
          'Progress ONE dial at a time: posture (sit → stand → feet-together → tandem → single-leg); surface (firm → foam); background (plain → patterned → busy / moving); target size (large → small)',
        ],
      },
      { type: 'sub', title: 'VOR ×2 (advanced)' },
      {
        type: 'list',
        items: [
          'Target and head move in OPPOSITE directions simultaneously, eyes locked on the letter — doubles required eye velocity',
          'Introduce only once VOR ×1 is tolerated standing on foam with a busy background and no sustained symptom rise',
          'Dose: 30–60 s × 3, twice daily; begin seated and slow',
        ],
      },
      { type: 'sub', title: 'Habituation (sustained motion sensitivity — BPPV excluded)' },
      {
        type: 'list',
        items: [
          'List the movements that reproduce symptoms; select 2–4 that provoke a MILD response (~2–4/10), not the most provocative ones',
          'Dose: repeat each 3–5 times, 2–3×/day, resting to baseline between sets',
          'Titration: symptoms rise mildly and settle within 10–15 min; if not settled by ~20–30 min, reduce reps or pick a less provocative movement',
          'VMS exposure: brief (2–5 min) graded exposure to busy / optokinetic scenes, building duration as tolerance grows',
        ],
      },
      { type: 'sub', title: 'Dynamic balance' },
      {
        type: 'list',
        items: [
          'Progress one dial at a time: vision (eyes open → closed); surface (firm → foam); base / movement (double-leg → tandem → single-leg → dynamic gait with head turns); cognitive load (single → dual-task)',
          'Dose: 3–4 tasks/session, ~30–60 s each (or 10–20 m for gait), 3–5 sets, daily as tolerated',
          'Always with wall / rail / spotter — eyes-closed and foam tasks carry genuine fall risk',
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'Brief, intense, positionally-triggered spinning vertigo (rolling in bed, looking up) suggests BPPV → refer for Dix-Hallpike and repositioning before any habituation / balance program. Habituation is for sustained motion sensitivity, not otoconia in a canal.',
      },
      { type: 'section', title: 'Cervical — deep neck flexors, posture, proprioception' },
      {
        type: 'list',
        items: [
          'Deep neck flexor (cranio-cervical flexion): supine gentle chin-nod without lifting the head or firing SCM; with pressure biofeedback hold 22 → 30 mmHg targets ~10 s × 10, 1–2×/day; progress to upright chin-tucks and sustained postural holds',
          'Scapular / postural endurance: prone Y-T-W raises 8–10 reps/shape × 2–3 sets; banded rows 12–15 × 3 — endurance, not hypertrophy; 3–4×/week',
          'Joint-position-error retraining: head-laser relocation to a wall target eyes-closed, 10 reps/direction; traced shapes (letters, figure-8) 3–5, 1–2×/day',
          'Graded cervical strengthening: multi-directional isometric holds → light resisted range work, small increments, staying below symptom provocation',
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'Confirm cervical red flags are cleared (midline tenderness, arm neurology, vertebrobasilar features — drop attacks, diplopia, dysarthria, dysphagia, ataxia, nystagmus) before loading. No spinal manipulation / HVT thrust — physiotherapy / medicine.',
      },
      { type: 'section', title: 'Oculomotor — convergence, saccades, pursuit, accommodation' },
      {
        type: 'list',
        items: [
          'Convergence — near-point / pencil push-ups ~15 reps, 2×/day (goal: NPC > 6 cm → ≤ 5 cm); Brock string 5 min, 1–2×/day',
          'Saccades — two-target jumps ~10/set (progress separation, speed, vertical / diagonal pairs); near-far saccades; letter-chart saccades 1–2 min, 1–2×/day',
          'Smooth pursuit — track a slow target through horizontal / vertical / circular / figure-8 paths, head still, ~30–60 s/pattern, building speed and complexity',
          'Accommodative facility — near-far ("Hart chart") switching, holding clear focus at each, 1–2 min, 1–2×/day',
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'Persistent diplopia, NPC not improving after several weeks, or vision dominating function → refer to behavioural / neuro-optometry. Exercises continue ALONGSIDE — prism / lens prescription and in-office orthoptic therapy are the optometrist’s domain.',
      },
      { type: 'section', title: 'The unifying dosing rule' },
      {
        type: 'callout',
        tone: 'key',
        text: 'Load to a mild, settling symptom (0–2/10 that resolves in 10–15 min); monitor within AND between sessions (ask about the next morning); progress one dial at a time when sub-symptomatic; regress or refer when not. The same engine across all three phenotypes.',
      },
      {
        type: 'callout',
        tone: 'warning',
        text: 'Emergency red flags — refer immediately, do not exercise: progressively worsening severe headache, repeated vomiting, increasing confusion or drowsiness, seizure, focal neurological deficit, or clear fluid from the nose / ears.',
      },
    ],
  },
  {
    slug: 'progression-stop-criteria',
    category: 'toolkit',
    kind: 'Reference',
    title: 'Progression & Stop-Criteria Quick Reference',
    subtitle: 'Within- and between-session rules, the review algorithm and red-flag escalation',
    purpose:
      'The one-page decision aid that governs every session and every review — when to progress, hold, regress, or stop and refer.',
    blocks: [
      { type: 'section', title: 'Within-session rule' },
      {
        type: 'callout',
        tone: 'warning',
        text: 'Stop or reduce intensity if symptoms rise ≥ 2 points (0–10) above the pre-exercise baseline. A 0–1 point blip that settles = acceptable. Drop the HR band ~10 bpm; if symptoms settle and stay down, continue at the reduced load. If they keep climbing or do not settle, STOP — do not push through.',
      },
      { type: 'section', title: 'Between-session rule' },
      {
        type: 'list',
        items: [
          'Re-rate symptoms at 30–60 min post and the next morning',
          'Delayed / next-morning flare = previous dose too high → drop the HR ceiling 5–10 bpm and rebuild',
          'Cumulative fatigue, worsening sleep, or a downward multi-day symptom trend → hold or regress, do not push',
          'Repeated next-day flares = the HRt is stale → re-test the BCTT for a fresh HRt and band',
        ],
      },
      { type: 'section', title: 'Review algorithm (every 1–2 weeks)' },
      {
        type: 'list',
        items: [
          'Asymptomatic through the period AND tolerating full duration → PROGRESS: raise the HR ceiling 5–10 bpm (or re-test the BCTT for a new HRt)',
          'Tolerating with occasional minor blips that settle → HOLD the current prescription another week, then reassess',
          'Repeated ≥ 2-point or next-day flares → REGRESS: drop the ceiling 5–10 bpm, reduce duration, hold; consider a non-physiological phenotype as the rate-limiter and flag to the referrer',
          'Plateau > ~2 weeks despite good adherence → ESCALATE: re-refer for multidisciplinary review',
          'Progress duration to 20–30 min FIRST, then intensity — never both at once',
        ],
      },
      { type: 'section', title: 'Regress / pause triggers' },
      {
        type: 'list',
        items: [
          'A ≥ 2-point rise not settling with a small intensity drop',
          'Delayed or next-morning exacerbation after sessions',
          'A non-physiological phenotype emerging as dominant (positional vertigo, cervicogenic headache reproduced by neck movement, escalating mood symptoms)',
          'Persistent orthostatic intolerance / POTS-like features (sustained HR rise > 30 bpm on standing, recurrent pre-syncope) → medical review',
        ],
      },
      { type: 'section', title: 'STOP & escalate immediately — red flags' },
      {
        type: 'callout',
        tone: 'warning',
        text: 'Cease exercise and seek immediate medical assessment for: progressively worsening or thunderclap / severe headache; repeated vomiting; increasing drowsiness or confusion; focal neurological signs (weakness, numbness, slurred speech, visual loss); seizure; deteriorating conscious state; new / worsening neck pain with neurological symptoms; chest pain, exertional syncope or an arrhythmic / grossly abnormal HR response; clear fluid from the nose / ears.',
      },
      { type: 'section', title: 'Clearance endpoint' },
      {
        type: 'callout',
        tone: 'scope',
        text: 'The aerobic endpoint is a symptom-free exertion test to ~90% age-predicted max (or volitional exhaustion). That marks recovered exercise tolerance — NOT medical clearance for return to contact, which sits with the referring / treating medical practitioner. Recommend, don’t clear. Document the symptom data and your reasoning every time you regress or escalate.',
      },
    ],
  },

  // ──────────────────────── ADMINISTRATIVE DOCUMENT PACK ───────────────────────
  {
    slug: 'ndis-progress-report',
    category: 'admin',
    kind: 'Template',
    title: 'NDIS Allied Health Progress Report',
    subtitle: 'Exercise physiology — concussion reconditioning · plan-review ready',
    purpose:
      'Map concussion exercise rehabilitation to NDIS functional goals with objective exercise-tolerance outcomes, structured the way plan reviewers expect.',
    blocks: [
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Participant name' },
          { label: 'NDIS number' },
          { label: 'Date of birth' },
          { label: 'Plan management type' },
          { label: 'Report date' },
          { label: 'Reporting period' },
          { label: 'AEP name & ESSA accreditation no.' },
          { label: 'Provider / clinic' },
        ],
      },
      { type: 'section', title: '1. Background & referral' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Reason for engagement', hint: "referrer's working diagnosis, recorded as theirs — e.g. “referring GP's working diagnosis: concussion, injury date __”" },
          { label: 'Date of injury' },
          { label: 'Relevant history' },
        ],
      },
      { type: 'section', title: '2. NDIS goals addressed' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Participant goal(s) this support addresses', hint: 'e.g. improved independence in daily living / capacity building' },
          { label: 'How exercise physiology supports the goal' },
        ],
      },
      { type: 'section', title: '3. Assessment & objective measures' },
      {
        type: 'grid',
        columns: ['Measure', 'Baseline', 'Current', 'Change'],
        rows: 6,
        note: 'e.g. BCTT HRt (bpm), tolerated training HR band, continuous aerobic duration (min), PCSS total, VOMS provocation, NPC (cm), BESS errors, dual-task tandem-gait time.',
      },
      { type: 'section', title: '4. Intervention delivered' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Program summary', hint: 'sub-symptom-threshold aerobic + phenotype-specific exercise' },
          { label: 'Frequency / duration of sessions' },
          { label: 'Home program & adherence' },
        ],
      },
      { type: 'section', title: '5. Progress & functional outcomes' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Functional gains observed', hint: 'in daily-living / participation terms' },
          { label: 'Trajectory against baseline' },
          { label: 'Barriers / enablers' },
        ],
      },
      { type: 'section', title: '6. Recommendations & next period' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Recommended ongoing supports', hint: 'hours / frequency' },
          { label: 'Goals for next period' },
          { label: 'Referrals / escalations' },
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'This report describes exercise-tolerance and functional progress from exercise-physiology intervention. It is not a diagnosis and does not constitute medical clearance for return to contact sport. Diagnosis and clearance remain with the treating medical practitioner.',
      },
      { type: 'signature' },
    ],
  },
  {
    slug: 'workcover-ctp-report',
    category: 'admin',
    kind: 'Template',
    title: 'WorkCover / CTP Progress Report',
    subtitle: 'Exercise physiology — concussion reconditioning · return-to-work focus',
    purpose:
      'A return-to-work-focused progress report for the insurer / case manager: exercise tolerance, reconditioning delivered, current capacity and the next review.',
    blocks: [
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Worker / claimant name' },
          { label: 'Claim number' },
          { label: 'Date of birth' },
          { label: 'Insurer / scheme', hint: 'WorkCover / CTP' },
          { label: 'Employer (if applicable)' },
          { label: 'Case manager' },
          { label: 'Date of injury' },
          { label: 'Report date' },
          { label: 'Reporting period' },
          { label: 'AEP name & ESSA accreditation no.' },
        ],
      },
      { type: 'section', title: '1. Injury & referral' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: "Referrer's working diagnosis", hint: 'recorded as theirs' },
          { label: 'Mechanism / date of injury' },
          { label: 'Referral reason & goals' },
        ],
      },
      { type: 'section', title: '2. Objective findings' },
      {
        type: 'grid',
        columns: ['Measure', 'Baseline', 'Current'],
        rows: 6,
        note: 'e.g. BCTT HRt, tolerated HR band, aerobic duration, PCSS total, relevant phenotype measures.',
      },
      { type: 'section', title: '3. Intervention delivered' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Reconditioning program', hint: 'FITT, phenotype work' },
          { label: 'Sessions delivered & adherence' },
        ],
      },
      { type: 'section', title: '4. Current functional & work capacity' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Current exercise tolerance' },
          { label: 'Relevant work demands', hint: 'physical / cognitive' },
          { label: 'Current capacity tolerated', hint: 'hours / duties' },
          { label: 'Restrictions / graded upgrade recommended' },
        ],
      },
      { type: 'section', title: '5. Recommendation & review' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Recommended next steps', hint: 'graded RTW upgrade, ongoing sessions' },
          { label: 'Next review date' },
          { label: 'Referrals / escalations' },
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'Capacity statements here relate to exercise tolerance and graded reconditioning within exercise-physiology scope. Diagnosis, certificates of capacity, and clearance for full-contact or unrestricted duties are medical decisions made by the treating practitioner. Recommend, don’t clear.',
      },
      { type: 'signature' },
    ],
  },
  {
    slug: 'gp-referrer-letter',
    category: 'admin',
    kind: 'Template',
    title: 'GP / Referrer Letter',
    subtitle: 'Closing the loop — findings, prescription rationale and within-scope recommendations',
    purpose:
      'Report your assessment findings, prescription rationale and progress to the referrer — framed as recommendation, never clearance — with a worked example and scope-safe language.',
    blocks: [
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'To', hint: 'referrer name & practice' },
          { label: 'From', hint: 'AEP name & ESSA accreditation no.' },
          { label: 'Patient name' },
          { label: 'Date of injury' },
          { label: 'Assessment date' },
          { label: 'Date of letter' },
          { label: 'Re: reason for referral' },
        ],
      },
      { type: 'section', title: 'Letter structure' },
      {
        type: 'list',
        items: [
          'Thank the referrer and restate the reason for referral',
          'What you assessed and found, objectively (test result, HRt, baseline symptom load)',
          'What you are prescribing and why (the training band, dose, and the autonomic-reconditioning rationale in one plain sentence)',
          'Current progress against baseline (the trajectory in HR, symptom score and stage tolerated)',
          'Your recommendation and the explicit hand-back point for the decisions that are theirs to make',
        ],
      },
      { type: 'section', title: 'Worked example (clinical core)' },
      {
        type: 'p',
        text: '“Thank you for referring [patient] following their concussion of [date]. On treadmill testing the patient reached a symptom threshold at 148 bpm (symptoms rose from 2/10 to 5/10), consistent with an exercise-intolerance presentation. I have commenced sub-symptom-threshold aerobic reconditioning, prescribing steady-state aerobic work at approximately 125 bpm (around 85% of threshold) to drive autonomic recovery without provoking symptoms. The patient is now tolerating Stage 2–3 reconditioning with good adherence and a falling symptom score (12/22 at baseline, 5/22 this week). I will continue to progress the heart-rate ceiling as tolerance improves and update you at the next milestone. As the patient approaches return to full training, I recommend medical review to consider clearance for return-to-contact, which sits outside my scope as an exercise physiologist.”',
      },
      { type: 'section', title: 'Your letter' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Findings' },
          { label: 'Prescription & rationale' },
          { label: 'Progress against baseline' },
          { label: 'Recommendation & hand-back point' },
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'Keep the tone collegial and the content objective. Avoid speculating about causation or prognosis beyond your evidence, and anything that reads as a diagnosis. The closing recommendation must name the next medical decision and return it to the practitioner. Obtain and record patient consent before sending, and send only to the named recipient(s) the patient has agreed to.',
      },
      { type: 'signature' },
    ],
  },
  {
    slug: 'return-to-activity-note',
    category: 'admin',
    kind: 'Template',
    title: 'Return-to-Activity Progress Note',
    subtitle: 'EP-scope graded reconditioning record — recommend, don’t clear',
    purpose:
      'Document the graded activity stages tolerated symptom-free under supervision, with objective evidence — the EP analogue of a clearance note that recommends rather than certifies.',
    blocks: [
      {
        type: 'fields',
        cols: 2,
        items: [
          { label: 'Patient name' },
          { label: 'ID / DOB' },
          { label: 'Date' },
          { label: 'AEP name & ESSA accreditation no.' },
          { label: 'Referrer' },
          { label: 'Date of injury' },
        ],
      },
      { type: 'section', title: 'Graded reconditioning stages tolerated' },
      {
        type: 'grid',
        columns: ['Stage', 'Activity', 'Date tolerated symptom-free', 'HR tolerated', 'Symptom score', '≥ 24 h symptom-free before progressing? (Y/N)'],
        rows: 6,
        note: 'e.g. (1) symptom-limited daily activity → (2) light aerobic → (3) sport-specific exercise, no head impact → (4) non-contact training drills → (5) full-contact practice (medical clearance required) → (6) return to sport.',
      },
      { type: 'section', title: 'Current status' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Highest stage tolerated symptom-free' },
          { label: 'Objective evidence' },
          { label: 'What remains' },
        ],
      },
      { type: 'section', title: 'Adjunct outcome measures (if used)' },
      {
        type: 'grid',
        columns: ['Measure', 'Baseline', 'Current'],
        rows: 4,
        note: 'e.g. VOMS provocation, NPC (cm), BESS errors, single / dual-task tandem-gait time.',
      },
      {
        type: 'callout',
        tone: 'key',
        text: 'Defining sentence: “The patient has completed supervised non-contact graded reconditioning and is tolerating Stage 4 symptom-free. Clearance for return to full-contact participation is a medical decision and is recommended via the referring / treating medical practitioner.” Recommend, don’t clear.',
      },
      { type: 'section', title: 'Recommendation' },
      {
        type: 'fields',
        cols: 1,
        items: [
          { label: 'Recommended next step' },
          { label: 'Referral for medical review (date)' },
        ],
      },
      {
        type: 'callout',
        tone: 'scope',
        text: 'The AEP supervises and progresses non-contact reconditioning and documents the objective ≥ 24-hour symptom-free intervals between stages. Clearance for full-contact return is a medical decision made by the treating doctor or sports physician — explicitly recommended here, never granted.',
      },
      { type: 'signature' },
    ],
  },
]

export function getEpDocument(slug: string): EpDocument | undefined {
  return EP_DOCUMENTS.find((d) => d.slug === slug)
}

export function getEpDocumentsByCategory(category: EpDocument['category']): EpDocument[] {
  return EP_DOCUMENTS.filter((d) => d.category === category)
}

export { SCOPE_FOOTER }
