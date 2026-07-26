/**
 * CPD Certificate Generator
 * Generates AHPRA-aligned CPD completion certificates as PDF
 *
 * AHPRA Certificate Requirements (based on RACGP Appendix 8):
 * - Participant's full name
 * - Activity/course title
 * - Date of completion
 * - CPD hours awarded
 * - Provider organisation name
 * - Unique certificate ID
 * - Activity type (Educational Activity)
 * - Mode of delivery (Online)
 * - Learning outcomes
 * - Date of issue
 */

import jsPDF from 'jspdf'
import crypto from 'crypto'

export interface CertificateData {
  participantName: string
  participantEmail: string
  courseTitle: string
  courseDescription: string
  cpdPoints: number
  completionDate: Date
  learningOutcomes: string[]
  courseType: 'scat-mastery' | 'online-course' | 'full-course' | 'recognition-referral' | 'crm-online'
}

interface CertificateResult {
  pdfBuffer: Buffer
  certificateId: string
}

function generateCertificateId(email: string, courseType: string, date: Date): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${email}-${courseType}-${date.toISOString()}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase()
  const year = date.getFullYear()
  const prefix =
    courseType === 'scat-mastery' ? 'SCAT'
    : courseType === 'full-course' ? 'FULL'
    : courseType === 'recognition-referral' ? 'RR'
    : courseType === 'crm-online' ? 'CRM'
    : 'ONL'
  return `CEA-${prefix}-${year}-${hash}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function generateCertificatePDF(data: CertificateData): CertificateResult {
  const certificateId = generateCertificateId(data.participantEmail, data.courseType, data.completionDate)
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()   // 297
  const pageHeight = doc.internal.pageSize.getHeight()  // 210
  const centerX = pageWidth / 2

  // ── Background ──────────────────────────────────
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Decorative border (double-line)
  doc.setDrawColor(91, 154, 166)  // #5b9aa6
  doc.setLineWidth(1.5)
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20)
  doc.setLineWidth(0.5)
  doc.rect(13, 13, pageWidth - 26, pageHeight - 26)

  // Corner accents
  const accentSize = 15
  doc.setLineWidth(1.5)
  // Top-left
  doc.line(10, 10 + accentSize, 10, 10); doc.line(10, 10, 10 + accentSize, 10)
  // Top-right
  doc.line(pageWidth - 10 - accentSize, 10, pageWidth - 10, 10); doc.line(pageWidth - 10, 10, pageWidth - 10, 10 + accentSize)
  // Bottom-left
  doc.line(10, pageHeight - 10 - accentSize, 10, pageHeight - 10); doc.line(10, pageHeight - 10, 10 + accentSize, pageHeight - 10)
  // Bottom-right
  doc.line(pageWidth - 10 - accentSize, pageHeight - 10, pageWidth - 10, pageHeight - 10); doc.line(pageWidth - 10, pageHeight - 10 - accentSize, pageWidth - 10, pageHeight - 10)

  // ── Header ──────────────────────────────────
  let y = 30

  // Organisation name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(91, 154, 166)
  doc.text('CONCUSSION EDUCATION AUSTRALIA', centerX, y, { align: 'center' })
  y += 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139) // slate-500
  // Osteopathy Australia endorses Concussion Clinical Mastery ONLY (the CCM
  // online course + full workshop cert). The free SCAT course, the free
  // recognition-referral awareness cert, and CRM are NOT OA-endorsed — printing
  // the line on those certs is a false endorsement claim (AHPRA/ACL). Gate it.
  const isOaEndorsed = data.courseType === 'online-course' || data.courseType === 'full-course'
  if (isOaEndorsed) {
    doc.text('Endorsed by Osteopathy Australia', centerX, y, { align: 'center' })
  }
  // CRM is ESSA-accredited (approved 24 July 2026, 8 CPD points online). The
  // line prints ONLY on the CRM certificate — same false-claim rule as OA above.
  if (data.courseType === 'crm-online') {
    doc.text('Accredited by Exercise & Sports Science Australia (ESSA)', centerX, y, { align: 'center' })
  }

  // ── Certificate Title ──────────────────────────────────
  y += 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  doc.text('CERTIFICATE OF COMPLETION', centerX, y, { align: 'center' })

  y += 5
  // Decorative line
  doc.setDrawColor(91, 154, 166)
  doc.setLineWidth(0.8)
  doc.line(centerX - 40, y, centerX + 40, y)

  // ── This certifies that ──────────────────────────────────
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105) // slate-600
  doc.text('This is to certify that', centerX, y, { align: 'center' })

  // ── Participant Name ──────────────────────────────────
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(30, 41, 59) // slate-800
  doc.text(data.participantName, centerX, y, { align: 'center' })

  // Underline under name
  y += 3
  const nameWidth = doc.getTextWidth(data.participantName)
  doc.setDrawColor(91, 154, 166)
  doc.setLineWidth(0.5)
  doc.line(centerX - nameWidth / 2 - 5, y, centerX + nameWidth / 2 + 5, y)

  // ── Completion statement ──────────────────────────────────
  y += 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text('has successfully completed the following CPD activity:', centerX, y, { align: 'center' })

  // ── Course Title ──────────────────────────────────
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(91, 154, 166)
  doc.text(data.courseTitle, centerX, y, { align: 'center' })

  // ── Course description ──────────────────────────────────
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  const descLines = doc.splitTextToSize(data.courseDescription, 200)
  doc.text(descLines, centerX, y, { align: 'center' })
  y += descLines.length * 4

  // ── Details Grid ──────────────────────────────────
  y += 8
  const gridY = y
  const col1X = 50
  const col2X = centerX
  const col3X = pageWidth - 50

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)

  // Column 1 — CPD Hours (or completion badge for free course)
  if (data.cpdPoints > 0) {
    doc.text('CPD POINTS AWARDED', col1X, gridY, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(91, 154, 166)
    doc.text(`${data.cpdPoints}`, col1X, gridY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('AHPRA-Aligned', col1X, gridY + 13, { align: 'center' })
  } else {
    doc.text('STATUS', col1X, gridY, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(91, 154, 166)
    doc.text('Completed', col1X, gridY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('Certificate of Completion', col1X, gridY + 13, { align: 'center' })
  }

  // Column 2 — Date of Completion
  doc.setFontSize(8)
  doc.text('DATE OF COMPLETION', col2X, gridY, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  doc.text(formatDate(data.completionDate), col2X, gridY + 8, { align: 'center' })

  // Column 3 — Mode
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('MODE OF DELIVERY', col3X, gridY, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(30, 41, 59)
  const modeOfDelivery = data.courseType === 'full-course'
    ? 'Blended Learning — Online & In-Person Workshop'
    : 'Online — Self-Paced'
  doc.text(modeOfDelivery, col3X, gridY + 8, { align: 'center' })

  // ── Activity Type ──────────────────────────────────
  y = gridY + 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('ACTIVITY TYPE: Educational Activity — Reviewing & Reflecting', centerX, y, { align: 'center' })

  // ── Learning Outcomes ──────────────────────────────────
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text('LEARNING OUTCOMES:', 30, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  data.learningOutcomes.forEach((outcome) => {
    doc.text(`•  ${outcome}`, 34, y)
    y += 3.5
  })

  // ── Signature / Authorisation ──────────────────────────────────
  y += 6
  const sigY = y
  // Left: Signature
  doc.setDrawColor(100, 116, 139)
  doc.setLineWidth(0.3)
  doc.line(40, sigY, 100, sigY)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(12)
  doc.setTextColor(91, 154, 166)
  doc.text('Zac Lewis', 70, sigY - 3, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('Zac Lewis — Founder', 70, sigY + 4, { align: 'center' })
  doc.text('Concussion Education Australia', 70, sigY + 8, { align: 'center' })

  // Right: Certificate ID + Date of Issue
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`Certificate ID: ${certificateId}`, pageWidth - 40, sigY, { align: 'center' })
  doc.text(`Date of Issue: ${formatDate(new Date())}`, pageWidth - 40, sigY + 4, { align: 'center' })
  doc.text(`Verify: portal.concussion-education-australia.com`, pageWidth - 40, sigY + 8, { align: 'center' })

  // ── Footer ──────────────────────────────────
  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184) // slate-400
  doc.text(
    'This certificate confirms completion of a continuing professional development activity provided by Concussion Education Australia. CPD activities are AHPRA-aligned and developed in accordance with the registration standards for continuing professional development. Retain this certificate for your CPD portfolio — records should be kept for a minimum of 5 years for audit purposes.',
    centerX, pageHeight - 16, { align: 'center', maxWidth: pageWidth - 40 }
  )

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return { pdfBuffer, certificateId }
}

// SCAT6 Mastery course-specific certificate data
export function getSCATCertificateData(participantName: string, participantEmail: string, completionDate: Date): CertificateData {
  return {
    participantName,
    participantEmail,
    courseTitle: 'SCAT6/SCOAT6 Mastery Course',
    courseDescription: 'Comprehensive training in Sport Concussion Assessment Tool (SCAT6) and Sport Concussion Office Assessment Tool (SCOAT6) administration, scoring, interpretation, and clinical application for Australian health practitioners.',
    cpdPoints: 1,
    completionDate,
    learningOutcomes: [
      'Correctly administer and score the SCAT6 for acute/sideline concussion assessment',
      'Correctly administer and score the SCOAT6 for clinical office follow-up assessment',
      'Identify red flags requiring emergency referral',
      'Apply medicolegal documentation standards for concussion management in Australia',
      'Differentiate when to use SCAT6 vs SCOAT6 based on clinical context and timing',
    ],
    courseType: 'scat-mastery',
  }
}

// Paid online course certificate data (8 CPD hours)
export function getOnlineCourseCertificateData(participantName: string, participantEmail: string, completionDate: Date): CertificateData {
  return {
    participantName,
    participantEmail,
    courseTitle: 'Online Concussion Management Course',
    courseDescription: 'Comprehensive 8-module online course covering concussion science, SCAT6/SCOAT6 assessment, VOMS & BESS protocols, clinical phenotyping, return-to-activity frameworks, rehabilitation pathways, and medicolegal documentation for Australian health practitioners.',
    cpdPoints: 8,
    completionDate,
    learningOutcomes: [
      'Apply evidence-based concussion assessment using SCAT6, SCOAT6, VOMS, and BESS protocols',
      'Identify and manage concussion phenotypes (vestibular, cervicogenic, ocular-motor, mood/anxiety)',
      'Implement structured return-to-play and return-to-learn protocols',
      'Conduct comprehensive clinical documentation meeting AHPRA standards',
      'Recognise red flags and apply appropriate referral pathways',
    ],
    courseType: 'online-course',
  }
}

// Free awareness short course (module 104 — "Concussion Care Has Changed").
// This is a COMPLETION certificate, NOT a CPD-hours certificate: the module is
// awareness-level (recognise & refer), so it carries 0 CPD points and certifies
// exactly that — recognition and safe referral. Do not attach CPD hours unless
// the activity becomes genuinely accredited.
export function getRecognitionReferralCertificateData(participantName: string, participantEmail: string, completionDate: Date): CertificateData {
  return {
    participantName,
    participantEmail,
    courseTitle: 'Concussion Recognition & Referral',
    courseDescription: 'Completion of the free awareness module "Concussion Care Has Changed" — the modern first-line management paradigm, and how to recognise a suspected concussion and refer safely. An awareness activity; it does not confer clinical assessment or management competency.',
    cpdPoints: 0,
    completionDate,
    learningOutcomes: [
      'Recognise a suspected concussion, including presentations without loss of consciousness or direct head contact',
      'Identify red flags that require immediate emergency referral (000)',
      'Apply the recognise–remove–refer sideline principle, including no same-day return to play',
      'Match referral urgency (emergency, urgent within 24 hours, routine office review) to the clinical picture',
      'Understand which recognition tool (SCAT6 vs SCOAT6) applies and when, and the boundary between awareness and clinical method',
    ],
    courseType: 'recognition-referral',
  }
}

// CRM (Concussion Rehab Mastery, EP stream) — online course certificate.
// ESSA-accredited: 8 CPD points for the online course (approved 24 July 2026).
// The practical-day (16 CPD total) certificate is issued at the workshop, same
// as the CCM full-course rule.
export function getCrmCertificateData(participantName: string, participantEmail: string, completionDate: Date): CertificateData {
  return {
    participantName,
    participantEmail,
    courseTitle: 'Concussion Rehab Mastery',
    courseDescription: '8-module online course for exercise physiologists and clinical exercise practitioners: concussion pathophysiology and the neurometabolic cascade, recognition and red flags within EP scope, graded exercise testing and heart-rate-threshold determination, sub-symptom-threshold aerobic prescription, phenotype-specific exercise rehabilitation, graded return to activity and sport, persistent symptoms, and documentation and referral.',
    cpdPoints: 8,
    completionDate,
    learningOutcomes: [
      'Explain the neurometabolic cascade and why sub-symptom-threshold aerobic exercise is first-line treatment',
      'Recognise red flags and scope boundaries, and refer appropriately within the concussion care team',
      'Determine an individualised heart-rate threshold from graded exercise testing and prescribe against it',
      'Design and progress phenotype-specific exercise rehabilitation programs',
      'Deliver graded return-to-activity and return-to-sport progressions with documented, measured milestones',
    ],
    courseType: 'crm-online',
  }
}

// Full course certificate data (14 CPD hours — online + in-person workshop)
export function getFullCourseCertificateData(participantName: string, participantEmail: string, completionDate: Date): CertificateData {
  return {
    participantName,
    participantEmail,
    courseTitle: 'Complete Concussion Management Certification',
    courseDescription: '8-module online course plus full-day in-person practical workshop covering concussion science, SCAT6/SCOAT6 assessment, VOMS & BESS protocols, hands-on clinical assessment techniques, clinical phenotyping, return-to-activity frameworks, rehabilitation pathways, and medicolegal documentation for Australian health practitioners.',
    cpdPoints: 14,
    completionDate,
    learningOutcomes: [
      'Administer and interpret SCAT6, SCOAT6, VOMS, and BESS assessments with hands-on proficiency',
      'Perform cranial nerve examination and cervicogenic assessment for concussion patients',
      'Identify and manage concussion phenotypes with targeted, evidence-based treatment protocols',
      'Implement structured return-to-play, return-to-learn, and return-to-work frameworks',
      'Conduct AHPRA-aligned clinical documentation and navigate medicolegal requirements',
    ],
    courseType: 'full-course',
  }
}
