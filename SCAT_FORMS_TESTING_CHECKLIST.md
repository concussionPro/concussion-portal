# SCAT Forms Suite - Testing Checklist

## Testing Instructions

Compare the live forms at http://localhost:3000/scat-forms with the original PDF documents to verify 100% accuracy.

**CRITICAL**: These are world-standard assessment tools. Every field, calculation, label, and color must EXACTLY match the original PDFs.

---

## SCAT6 Testing Checklist

### Access & Navigation ✓
- [ ] SCAT Forms accessible from sidebar (Activity icon)
- [ ] Landing page loads at /scat-forms
- [ ] SCAT6 card visible with blue theme (#4A6FA5)
- [ ] SCAT6 form loads at /scat-forms/scat6
- [ ] Export PDF button present and functional
- [ ] Form auto-saves every 3 seconds to localStorage

### Visual Design ✓
- [ ] Header color matches PDF: #4A6FA5 (blue)
- [ ] Section headers use correct blue: #3f51b5
- [ ] Field backgrounds: #E3F2FD (light blue)
- [ ] Collapsible sections work (expand/collapse)
- [ ] Icons render correctly (ChevronUp/ChevronDown)
- [ ] Responsive layout (mobile/desktop)

### Step 1: Athlete Demographics ✓
- [ ] Athlete Name field
- [ ] Date of Birth field
- [ ] Age field (auto-calculated or manual)
- [ ] Sex dropdown: Male/Female/Prefer Not To Say/Other
- [ ] Sport/Team/School field
- [ ] Date of Injury field
- [ ] Time of Injury field
- [ ] Examiner Name field
- [ ] Assessment Date field
- [ ] All fields properly labeled
- [ ] All fields editable

### Step 2: Immediate/On-Field Assessment ✓

**Red Flags Checklist:**
- [ ] Neck pain or tenderness
- [ ] Double vision
- [ ] Weakness, tingling, or burning in arms/legs
- [ ] Severe or increasing headache
- [ ] Seizure or convulsion
- [ ] Loss of consciousness
- [ ] Deteriorating conscious state
- [ ] Vomiting
- [ ] Increasing restlessness, agitation, or combativeness
- [ ] All red flags have checkboxes
- [ ] Section prominently displayed

**Observable Signs:**
- [ ] Lying motionless on ground
- [ ] Facial injury after head trauma
- [ ] Slow to get up after direct/indirect blow
- [ ] Disorientation or confusion
- [ ] Blank or vacant look
- [ ] Balance or gait difficulties/falling down
- [ ] All signs have checkboxes

**Maddocks Questions (Memory Assessment):**
- [ ] "At what venue are we today?" - Correct/Incorrect
- [ ] "Which half is it now?" - Correct/Incorrect
- [ ] "Who scored last in this game?" - Correct/Incorrect
- [ ] "What team did you play last week/game?" - Correct/Incorrect
- [ ] "Did your team win the last game?" - Correct/Incorrect
- [ ] Score auto-calculated: [X] / 5
- [ ] Scoring formula: count of correct answers

### Step 3: Symptom Evaluation ✓

**22 Symptoms with 0-6 Rating Scale:**
- [ ] Headache
- [ ] Pressure in head
- [ ] Neck pain
- [ ] Nausea or vomiting
- [ ] Dizziness
- [ ] Blurred vision
- [ ] Balance problems
- [ ] Sensitivity to light
- [ ] Sensitivity to noise
- [ ] Feeling slowed down
- [ ] Feeling like "in a fog"
- [ ] "Don't feel right"
- [ ] Difficulty concentrating
- [ ] Difficulty remembering
- [ ] Fatigue or low energy
- [ ] Confusion
- [ ] Drowsiness
- [ ] Trouble falling asleep (if applicable)
- [ ] More emotional
- [ ] Irritability
- [ ] Sadness
- [ ] Nervous or anxious

**Auto-Calculations:**
- [ ] Number of Symptoms = count of symptoms > 0
- [ ] Symptom Severity = sum of all symptom ratings
- [ ] Maximum severity = 132 (22 symptoms × 6)
- [ ] Calculations update in real-time as ratings change

### Step 4: Cognitive & Physical Evaluation ✓

**Orientation (5 questions):**
- [ ] "What month is it?" - 0/1
- [ ] "What is the date today?" - 0/1
- [ ] "What is the day of the week?" - 0/1
- [ ] "What year is it?" - 0/1
- [ ] "What time is it now? (within 1 hour)" - 0/1
- [ ] Orientation Score auto-calculated: [X] / 5

**Immediate Memory (3 trials, Word List A/B/C):**
- [ ] Word list selection dropdown (Lists A, B, C)
- [ ] 10 words displayed for selected list
- [ ] Trial 1: 10 checkboxes
- [ ] Trial 2: 10 checkboxes
- [ ] Trial 3: 10 checkboxes
- [ ] Score per trial auto-calculated
- [ ] Total Immediate Memory = Trial1 + Trial2 + Trial3 / 30
- [ ] Word lists match standard SCAT6 lists:
  - List A: Jacket, Arrow, Pepper, Cotton, Movie, Dollar, Honey, Mirror, Saddle, Anchor
  - List B: Finger, Penny, Blanket, Lemon, Insect, Candle, Paper, Sugar, Sandwich, Wagon
  - List C: Baby, Monkey, Perfume, Sunset, Iron, Elbow, Apple, Carpet, Saddle, Bubble

**Concentration:**
- [ ] Digits Backward selection: 0-4
  - [ ] 3-1-7 (0 or 1 point)
  - [ ] 4-9-3 (0 or 1 point)
  - [ ] 6-2-9 (0 or 1 point)
  - [ ] 7-1-8-4 (0 or 1 point)
- [ ] Months in Reverse Order:
  - [ ] Time input field (seconds)
  - [ ] Errors input field (0-1)
  - [ ] 1 point if < 30 seconds with 0 errors
- [ ] Concentration Score = Digits + Months / 5
- [ ] Auto-calculated and displayed

**Neurological Screen:**
- [ ] Eye movements: Normal/Abnormal
- [ ] Pupils (size, symmetry, reaction): Normal/Abnormal
- [ ] Speech (slurred or normal): Normal/Abnormal
- [ ] Limb coordination: Normal/Abnormal
- [ ] All dropdowns functional

**Balance Examination (mBESS):**
- [ ] Double Leg Stance errors (0-10)
- [ ] Single Leg Stance errors (0-10)
- [ ] Tandem Stance errors (0-10)
- [ ] Total mBESS Errors = Double + Single + Tandem / 30
- [ ] Auto-calculated

**Tandem Gait Test:**
- [ ] Trial 1 time (seconds)
- [ ] Trial 2 time (seconds)
- [ ] Trial 3 time (seconds)
- [ ] Best Time = minimum of 3 trials
- [ ] Auto-calculated and displayed

### Step 5: Delayed Recall ✓
- [ ] Instruction: "Do you remember the word list from earlier?"
- [ ] Time started field
- [ ] Same 10 words from Immediate Memory (same list selected)
- [ ] 10 checkboxes for words recalled
- [ ] Delayed Recall Score = count of checked words / 10
- [ ] Auto-calculated
- [ ] "Is the athlete different from their usual self?" Yes/No radio
- [ ] Minimum 5 minutes instruction displayed

### Step 6: Decision & HCP Attestation ✓

**Tracking Table (3 date columns):**
- [ ] Date fields for Assessment 1, 2, 3
- [ ] Neurological exam results (Normal/Abnormal) for each date
- [ ] All cognitive scores displayed for each assessment:
  - [ ] Orientation score
  - [ ] Immediate Memory score
  - [ ] Concentration score
  - [ ] Delayed Recall score
  - [ ] Total Cognitive Score
  - [ ] Number of Symptoms
  - [ ] Symptom Severity
  - [ ] mBESS Total Errors
  - [ ] Tandem Gait Best Time

**Disposition:**
- [ ] Radio buttons: Concussion Diagnosed / Not Diagnosed / Deferred
- [ ] All options functional

**HCP Information:**
- [ ] Name field
- [ ] Signature field
- [ ] Title/Qualification field
- [ ] Registration Number field
- [ ] Date field
- [ ] All fields editable

**Additional Clinical Notes:**
- [ ] Large textarea for notes
- [ ] Multi-line capable

### PDF Export Functionality ✓
- [ ] Export PDF button visible (blue, top right)
- [ ] Clicking button generates PDF
- [ ] PDF filename format: SCAT6_[AthleteName]_[Date].pdf
- [ ] PDF contains all form sections
- [ ] PDF layout matches form structure
- [ ] All entered data appears in PDF
- [ ] Calculated scores appear in PDF
- [ ] PDF is downloadable

---

## SCOAT6 Testing Checklist

### Access & Navigation ✓
- [ ] SCOAT6 card visible on landing page with purple theme (#5E3C99)
- [ ] SCOAT6 form loads at /scat-forms/scoat6
- [ ] Export PDF button present (purple)
- [ ] Form auto-saves every 3 seconds

### Visual Design ✓
- [ ] Header color matches PDF: #5E3C99 (purple)
- [ ] Section headers use correct purple
- [ ] Field backgrounds: #E3F2FD (light blue)
- [ ] Collapsible sections work
- [ ] All sections expand/collapse correctly

### Pages 1-3: Demographics & History ✓

**Athlete Information:**
- [ ] Athlete Name
- [ ] ID Number
- [ ] Date of Birth
- [ ] Age
- [ ] Sex (Male/Female/Other)
- [ ] Years of Education
- [ ] Dominant Hand (Left/Right/Ambidextrous)
- [ ] Sport/Team
- [ ] Position/Event
- [ ] Years Playing
- [ ] Date of Injury
- [ ] Assessment Date
- [ ] Examiner Name
- [ ] Examiner Contact

**Concussion History:**
- [ ] Number of previous concussions
- [ ] Date of most recent concussion
- [ ] Total time lost from previous concussions
- [ ] Persistent symptoms (>3 months) checkbox
- [ ] All fields editable

**Current Injury Details:**
- [ ] Mechanism of injury (textarea)
- [ ] Loss of consciousness checkbox
- [ ] Duration of LOC (if checked)
- [ ] Retrograde amnesia checkbox
- [ ] Anterograde amnesia checkbox
- [ ] Seizure checkbox
- [ ] All fields functional

**Medications:**
- [ ] Current medications textarea
- [ ] Pre-existing conditions textarea

### Pages 4-5: Symptom Evaluation ✓

**Multi-Column Symptom Grid (24 symptoms × 5 dates):**

**Date Headers:**
- [ ] Pre-Injury date field
- [ ] Day Injured date field
- [ ] Consult 1 date field
- [ ] Consult 2 date field
- [ ] Consult 3 date field

**24 Symptoms (0-6 rating for each date column):**
1. [ ] Headaches
2. [ ] Pressure in head
3. [ ] Neck pain
4. [ ] Nausea or vomiting
5. [ ] Dizziness
6. [ ] Blurred vision
7. [ ] Balance problems
8. [ ] Sensitivity to light
9. [ ] Sensitivity to noise
10. [ ] Feeling slowed down
11. [ ] Feeling like "in a fog"
12. [ ] "Don't feel right"
13. [ ] Difficulty concentrating
14. [ ] Difficulty remembering
15. [ ] Fatigue or low energy
16. [ ] Confusion
17. [ ] Drowsiness
18. [ ] More emotional
19. [ ] Irritability
20. [ ] Sadness
21. [ ] Nervous or anxious
22. [ ] Trouble falling asleep
23. [ ] Sleeping more than usual
24. [ ] Sleeping less than usual

**Auto-Calculations (for each date column):**
- [ ] Number of Symptoms (Pre-Injury)
- [ ] Number of Symptoms (Day Injured)
- [ ] Number of Symptoms (Consult 1)
- [ ] Number of Symptoms (Consult 2)
- [ ] Number of Symptoms (Consult 3)
- [ ] Symptom Severity (Pre-Injury) / 144
- [ ] Symptom Severity (Day Injured) / 144
- [ ] Symptom Severity (Consult 1) / 144
- [ ] Symptom Severity (Consult 2) / 144
- [ ] Symptom Severity (Consult 3) / 144
- [ ] All calculations update in real-time

### Pages 5-6: Cognitive Testing ✓

**Immediate Memory (3 trials):**
- [ ] Word list selection (A/B/C)
- [ ] Trial 1: 10 checkboxes
- [ ] Trial 2: 10 checkboxes
- [ ] Trial 3: 10 checkboxes
- [ ] Score auto-calculated / 30

**Concentration:**
- [ ] Digits Backward (0-4)
- [ ] Months Reverse Time field
- [ ] Months Reverse Errors (0-1)
- [ ] Concentration Score = Digits + (1 if time<30s && errors=0) / 5

**Optional 15-Word List:**
- [ ] "15-Word List Not Done" checkbox
- [ ] If not checked, show 15 word checkboxes
- [ ] Score / 15
- [ ] Auto-calculated

### Pages 7-8: Physical Examination ✓

**Orthostatic Vital Signs:**
- [ ] Supine: Blood Pressure, Heart Rate, Symptoms
- [ ] Standing: Blood Pressure, Heart Rate, Symptoms
- [ ] Result: Normal/Abnormal
- [ ] All fields editable

**Cervical Spine Assessment:**

*Palpation:*
- [ ] Muscle Spasm: Yes/No
- [ ] Midline Tenderness: Yes/No
- [ ] Paravertebral Tenderness: Yes/No

*Range of Motion:*
- [ ] Flexion: Normal/Reduced/Painful
- [ ] Extension: Normal/Reduced/Painful
- [ ] Lateral Flexion (L): Normal/Reduced/Painful
- [ ] Lateral Flexion (R): Normal/Reduced/Painful
- [ ] Rotation (L): Normal/Reduced/Painful
- [ ] Rotation (R): Normal/Reduced/Painful

**Neurological Examination:**
- [ ] Cranial Nerves: Normal/Abnormal
- [ ] Limb Tone: Normal/Abnormal
- [ ] Strength (Upper/Lower): Normal/Abnormal
- [ ] Deep Tendon Reflexes: Normal/Abnormal
- [ ] Sensation: Normal/Abnormal
- [ ] Cerebellar (Finger-to-Nose, Heel-to-Shin): Normal/Abnormal

**Balance - mBESS (Modified Balance Error Scoring System):**
- [ ] Double Leg errors (0-10)
- [ ] Tandem errors (0-10)
- [ ] Single Leg errors (0-10)
- [ ] Total mBESS = Double + Tandem + Single / 30
- [ ] Auto-calculated

**mBESS on Foam (Optional):**
- [ ] Double Leg errors (0-10)
- [ ] Tandem errors (0-10)
- [ ] Single Leg errors (0-10)
- [ ] Total = Double + Tandem + Single / 30
- [ ] Auto-calculated (or null if not done)

**Timed Tandem Gait:**
- [ ] Trial 1 time
- [ ] Trial 2 time
- [ ] Trial 3 time
- [ ] Average time auto-calculated
- [ ] Fastest time auto-calculated
- [ ] Correct to 2 decimal places

### Page 9: Complex & Dual Task Gait ✓

**Complex Tandem Gait:**

*Forward (score per step):*
- [ ] Eyes Open (0-5)
- [ ] Eyes Closed (0-5)
- [ ] Forward Total = Eyes Open + Eyes Closed / 10

*Backward (score per step):*
- [ ] Eyes Open (0-5)
- [ ] Eyes Closed (0-5)
- [ ] Backward Total = Eyes Open + Eyes Closed / 10

- [ ] Complex Tandem Total = Forward + Backward / 10
- [ ] All calculations auto-update

**Dual Task Gait:**
- [ ] Trials Attempted (number)
- [ ] Trials Correct (number)
- [ ] Time (seconds)
- [ ] Cognitive Accuracy = Correct / Attempted
- [ ] Auto-calculated (or "-" if attempted = 0)

### Pages 10-11: Vestibular/Ocular & Mental Health ✓

**mVOMS (Vestibular/Ocular Motor Screening):**

*Baseline Symptoms (0-10 scale):*
- [ ] Headache
- [ ] Dizziness
- [ ] Nausea
- [ ] Fogginess

*4 Tests (each with symptoms 0-10 and comments):*
1. **Smooth Pursuits:**
   - [ ] Not Tested checkbox
   - [ ] Headache (0-10)
   - [ ] Dizziness (0-10)
   - [ ] Nausea (0-10)
   - [ ] Fogginess (0-10)
   - [ ] Comments field

2. **Saccades:**
   - [ ] Not Tested checkbox
   - [ ] Headache (0-10)
   - [ ] Dizziness (0-10)
   - [ ] Nausea (0-10)
   - [ ] Fogginess (0-10)
   - [ ] Comments field

3. **Convergence:**
   - [ ] Not Tested checkbox
   - [ ] Headache (0-10)
   - [ ] Dizziness (0-10)
   - [ ] Nausea (0-10)
   - [ ] Fogginess (0-10)
   - [ ] Near Point Convergence (cm)
   - [ ] Comments field

4. **VOR (Vestibulo-Ocular Reflex):**
   - [ ] Not Tested checkbox
   - [ ] Headache (0-10)
   - [ ] Dizziness (0-10)
   - [ ] Nausea (0-10)
   - [ ] Fogginess (0-10)
   - [ ] Comments field

**GAD-7 Anxiety Screen:**
- [ ] "Not Done" checkbox
- [ ] 7 questions with 4-point scale (Not at all / Several days / More than half / Nearly every day = 0/1/2/3):
  1. [ ] Feeling nervous, anxious, or on edge
  2. [ ] Not being able to stop or control worrying
  3. [ ] Worrying too much about different things
  4. [ ] Trouble relaxing
  5. [ ] Being so restless that it's hard to sit still
  6. [ ] Becoming easily annoyed or irritable
  7. [ ] Feeling afraid as if something awful might happen
- [ ] Total Score auto-calculated / 21
- [ ] Severity interpretation:
  - [ ] 0-4: Minimal anxiety
  - [ ] 5-9: Mild anxiety
  - [ ] 10-14: Moderate anxiety
  - [ ] 15-21: Severe anxiety
- [ ] Color-coded display (orange background)

**PHQ-2 Depression Screen:**
- [ ] "Not Done" checkbox
- [ ] 2 questions with 4-point scale (0-3):
  1. [ ] Little interest or pleasure in doing things
  2. [ ] Feeling down, depressed, or hopeless
- [ ] Total Score auto-calculated / 6
- [ ] Cutpoint: ≥3 warrants full PHQ-9
- [ ] Display indication if ≥3

**Sleep Screen:**
- [ ] "Not Done" checkbox
- [ ] 5 questions with different scales:
  1. [ ] Hours of sleep per night (0-2 points)
  2. [ ] Difficulty falling asleep (0-3 points)
  3. [ ] Difficulty staying asleep (0-3 points)
  4. [ ] Early morning awakening (0-3 points)
  5. [ ] Daytime sleepiness (0-6 points)
- [ ] Total Score auto-calculated / 17
- [ ] Severity levels:
  - [ ] 0-4: Normal
  - [ ] 5-7: Mild
  - [ ] 8-10: Moderate
  - [ ] 11+: Severe

### Pages 12-13: Delayed Recall & Computer Tests ✓

**Delayed Recall:**
- [ ] Same word list from Immediate Memory
- [ ] 10 checkboxes for recalled words
- [ ] Score / 10
- [ ] Auto-calculated

**Computerized Cognitive Testing:**
- [ ] Test Name field
- [ ] Date Completed field
- [ ] Results/Comments textarea
- [ ] Optional section

**Graded Aerobic Exercise Test:**
- [ ] Test Performed checkbox
- [ ] Date field
- [ ] Results textarea
- [ ] Optional section

### Pages 14-15: Overall Assessment & Management ✓

**Overall Assessment Summary:**
- [ ] Large textarea for clinical summary
- [ ] Multi-line capable

**Imaging:**
- [ ] Imaging Performed checkbox
- [ ] If checked, show:
  - [ ] Type of imaging
  - [ ] Reason for imaging
  - [ ] Findings

**Return Recommendations:**
- [ ] Class (text input)
- [ ] Work (text input)
- [ ] Driving (text input)
- [ ] Sport (text input)

**Referrals (14 specialist types with checkbox + name):**
1. [ ] Athletic Trainer/Therapist
2. [ ] Neurologist
3. [ ] Neurosurgeon
4. [ ] Sport & Exercise Medicine Physician
5. [ ] Physical Therapist
6. [ ] Neuropsychologist
7. [ ] Psychologist/Counselor
8. [ ] Occupational Therapist
9. [ ] Vestibular Therapist
10. [ ] Primary Care Physician
11. [ ] Emergency Department
12. [ ] Neuro-Optometrist
13. [ ] Speech Language Pathologist
14. [ ] Other Specialist

- [ ] Each has checkbox and name field
- [ ] All functional

**Pharmacotherapy:**
- [ ] Medications prescribed textarea

**Follow-up:**
- [ ] Date of Review field
- [ ] Follow-up Date field

**Final Notes:**
- [ ] Additional Clinical Notes textarea
- [ ] Large, multi-line

**HCP Information:**
- [ ] Name
- [ ] Title
- [ ] Registration Number
- [ ] Date
- [ ] Signature field
- [ ] All editable

### SCOAT6 PDF Export ✓
- [ ] Export PDF button visible (purple, top right)
- [ ] PDF generates on click
- [ ] Filename: SCOAT6_[AthleteName]_[Date].pdf
- [ ] All sections included in PDF
- [ ] Multi-column symptom table rendered
- [ ] All calculations appear in PDF
- [ ] Proper page breaks
- [ ] PDF downloadable

---

## Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile responsive (iOS/Android)

## Performance Testing
- [ ] Forms load within 2 seconds
- [ ] Auto-save doesn't cause lag
- [ ] Real-time calculations are instant
- [ ] No console errors
- [ ] PDF export completes within 5 seconds

## Data Integrity Testing
- [ ] Auto-save preserves all entered data
- [ ] Reload page → data persists from localStorage
- [ ] Clear form works
- [ ] Export → Import back → data matches
- [ ] Calculations remain accurate after reload

---

## Critical Verification Points

### Calculation Accuracy
Test with known values and verify:
1. SCAT6 Total Cognitive = Orientation + Immediate Memory + Concentration + Delayed Recall = X/50
2. SCOAT6 Symptom calculations across 5 date columns
3. mBESS totals (max 30)
4. Tandem gait average and fastest calculations
5. GAD-7 severity interpretations
6. Sleep screen weighted scoring

### Word Lists Match Original
Verify word lists match SCAT6 standard lists exactly:
- **List A**: Jacket, Arrow, Pepper, Cotton, Movie, Dollar, Honey, Mirror, Saddle, Anchor
- **List B**: Finger, Penny, Blanket, Lemon, Insect, Candle, Paper, Sugar, Sandwich, Wagon
- **List C**: Baby, Monkey, Perfume, Sunset, Iron, Elbow, Apple, Carpet, Saddle, Bubble

### Color Accuracy
- SCAT6 blue: #4A6FA5
- SCOAT6 purple: #5E3C99
- Use browser dev tools to verify exact hex values

---

## Testing Status

**Date Tested**: __________
**Tester**: __________
**Browser**: __________
**Device**: __________

**Overall Status**: ☐ Pass ☐ Fail ☐ Needs Review

**Notes**:
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________

**Issues Found**:
___________________________________________________________________________
___________________________________________________________________________
___________________________________________________________________________
