# SCAT6 PDF Complete Field Mapping

This document maps ALL PDF fields from SCAT6_Fillable.pdf to the SCAT6FormData TypeScript type.

## Demographics (Page 1)

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Text1 | Text | athleteName | ✓ |
| Text2 | Text | idNumber | ✓ |
| Text3 | Text | dateOfBirth | ✓ |
| Text4 | Text | dateOfExamination | ✓ |
| Text5 | Text | dateOfInjury | ✓ |
| Text6 | Text | timeOfInjury | ✓ |
| Sex / Sex_V2 | Radio | sex | ✓ |
| Text7 | Text | sportTeamSchool | ✓ |
| Text8 | Text | currentYear | ✓ |
| Text9 | Text | yearsEducation | ✓ |
| Text10 | Text | firstLanguage | ✓ |
| Text11 | Text | preferredLanguage | ✓ |
| Text12 | Text | examiner | ✓ |
| Text13 / Radio1 | Text/Radio | dominantHand | ✓ |

## Concussion History

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Text14 | Text | previousConcussions | ✓ |
| Text15 | Text | mostRecentConcussion | ✓ |
| Text16 | Text | primarySymptoms | ✓ |
| Text17 | Text | recoveryTime | ✓ |

## Athlete Background

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Check Box1 | Button | hospitalizedForHeadInjury | ✓ |
| Check Box2 | Button | headacheDisorder | ✓ |
| Check Box3 | Button | learningDisability | ✓ |
| Check Box4 | Button | adhd | ✓ |
| Check Box5 | Button | psychologicalDisorder | ✓ |
| Text18 | Text | athleteBackgroundNotes | ✓ |
| Text19 | Text | currentMedications | ✓ |

## Symptoms (22 items, 0-6 scale)

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| s1 | Radio (0-6) | symptoms.headaches | ✓ |
| s2 | Radio (0-6) | symptoms.pressureInHead | ✓ |
| s3 | Radio (0-6) | symptoms.neckPain | ✓ |
| s4 | Radio (0-6) | symptoms.nauseaVomiting | ✓ |
| s5 | Radio (0-6) | symptoms.dizziness | ✓ |
| s6 | Radio (0-6) | symptoms.blurredVision | ✓ |
| s7 | Radio (0-6) | symptoms.balanceProblems | ✓ |
| s8 | Radio (0-6) | symptoms.sensitivityLight | ✓ |
| s9 | Radio (0-6) | symptoms.sensitivityNoise | ✓ |
| s10 | Radio (0-6) | symptoms.feelingSlowedDown | ✓ |
| s11 | Radio (0-6) | symptoms.feelingInFog | ✓ |
| s12 | Radio (0-6) | symptoms.dontFeelRight | ✓ |
| s13 | Radio (0-6) | symptoms.difficultyConcentrating | ✓ |
| s14 | Radio (0-6) | symptoms.difficultyRemembering | ✓ |
| s15 | Radio (0-6) | symptoms.fatigueOrLowEnergy | ✓ |
| s16 | Radio (0-6) | symptoms.confusion | ✓ |
| s17 | Radio (0-6) | symptoms.drowsiness | ✓ |
| s18 | Radio (0-6) | symptoms.moreEmotional | ✓ |
| s19 | Radio (0-6) | symptoms.irritability | ✓ |
| s20 | Radio (0-6) | symptoms.sadness | ✓ |
| s21 | Radio (0-6) | symptoms.nervousAnxious | ✓ |
| s22 | Radio (0-6) | symptoms.troubleFallingAsleep | ✓ |
| Text26 | Text | percentOfNormal | ✓ |

## Orientation (5 items)

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| ori1 | Button (/0, /1) | orientationMonth | ✓ |
| ori2 | Button (/0, /1) | orientationDate | ✓ |
| ori3 | Button (/0, /1) | orientationDayOfWeek | ✓ |
| ori4 | Button (/0, /1) | orientationYear | ✓ |
| ori5 | Button (/0, /1) | orientationTime | ✓ |

## Immediate Memory (3 trials, 10 words each)

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Tri1a-Tri1j | Button (/0, /1) | immediateMemoryTrial1[0-9] | ✓ |
| Tri2a-Tri2j | Button (/0, /1) | immediateMemoryTrial2[0-9] | ✓ |
| Tri3a-Tri3j | Button (/0, /1) | immediateMemoryTrial3[0-9] | ✓ |
| Text11a | Text | immediateMemoryTimeCompleted | ✓ |
| A, B, C | Button | wordListUsed | ✓ |

## Concentration

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| A_2, B_2, C_2 | Button | digitListUsed | ✓ |
| Text20 | Text | digitsBackward | ⚠️ VERIFY |
| Text21 | Text | monthsReverseTime | ⚠️ VERIFY |
| Text22 | Text | monthsReverseErrors | ⚠️ VERIFY |

## Balance - mBESS

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Foot | Button (/0, /1) | footTested | ✓ |
| Text37 | Text (RICH TEXT) | - | ⚠️ SKIP (Rich Text) |
| Text38 | Text | mBessDoubleErrors | ✓ |
| Text39 | Text | mBessTandemErrors | ✓ |
| Text40 | Text (RICH TEXT) | testingSurface | ⚠️ SKIP (Rich Text) |
| Text41 | Text | footwear | ✓ |

## Tandem Gait

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Text42 | Text (RICH TEXT) | - | ⚠️ SKIP (Rich Text) |
| Text42A | Text (RICH TEXT) | - | ⚠️ SKIP (Rich Text) |
| Text43 | Text | tandemGaitTrial1 | ⚠️ VERIFY |
| Text43C | Text | - | ⚠️ VERIFY |
| Text44 | Text | tandemGaitTrial2 | ⚠️ VERIFY |
| Text45 | Text (RICH TEXT) | - | ⚠️ SKIP (Rich Text) |

## Delayed Recall (10 words)

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| DEL3 | Button (/0, /1) | delayedRecall[0] | ✓ |
| DEL4 | Button (/0, /1) | delayedRecall[1] | ✓ |
| DEL5 | Button (/0, /1) | delayedRecall[2] | ✓ |
| DEL6 | Button (/0, /1) | delayedRecall[3] | ✓ |
| DEL7 | Radio (/0-/3) | delayedRecall[4] | ⚠️ VERIFY (Radio not Button) |
| DEL4A | Button (/0, /1) | delayedRecall[5] | ✓ |
| DEL8 | Button (/0, /1) | delayedRecall[6] | ✓ |
| DEL9 | Radio (/0-/3) | delayedRecall[7] | ⚠️ VERIFY (Radio not Button) |
| Text27 | Text | delayedRecallStartTime | ✓ |

## Different From Usual

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Check Box6 | Button | differentFromUsual | ✓ |
| Text87 | Text (RICH TEXT) | differentFromUsualDescription | ⚠️ SKIP (Rich Text) |

## Disposition

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Concussion diagnosed | Radio (/Yes_3, /No_3, /Deferred) | concussionDiagnosed | ✓ |

## HCP Attestation

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Text88 | Text | hcpName | ✓ |
| Text89 | Text | hcpTitle | ✓ |
| Text90 | Text | hcpRegistration | ✓ |
| Text91 | Text | hcpDate | ✓ |

## Clinical Notes

| PDF Field | Type | FormData Field | Status |
|-----------|------|----------------|--------|
| Text93 | Text | additionalClinicalNotes | ✓ |

## Rich Text Fields (UNSUPPORTED by pdf-lib)

These fields CANNOT be filled programmatically:
- Text28
- Text31
- Text32
- Text37
- Text40 (testing surface)
- Text42, Text42A (tandem gait)
- Text45
- Text84D
- Text87 (different from usual description)

## Unmapped Fields (Not in FormData type)

- Glasgow Coma Scale (Glasscoma1-15)
- Dual Task fields (prac1-4, 100 series fields)
- Decision tracking (multiple consultations)
- Additional checkboxes (Check Box7-22)
- Various other text fields (Text23-25, Text29-36, Text46-93)

These need to be added to the FormData type if they should be collected.
