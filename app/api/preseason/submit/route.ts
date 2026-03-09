import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { jsPDF } from 'jspdf'
import { sendEmail } from '@/lib/email'
import { CONFIG } from '@/lib/config'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface ClinicData {
  clinicName: string
  contactName: string
  email: string
  createdAt: string
}

interface SymptomData {
  ratings: number[]
  feelNormalPercent: string
  notNormalReason: string
  physicalWorsens: boolean
  mentalWorsens: boolean
}

interface CognitiveData {
  orientation: { month: string; date: string; dayOfWeek: string; year: string; time: string; score: number }
  immediateMemory: { listUsed: string; trial1: number; trial2: number; trial3: number; total: number }
  concentration: { digitsScore: number; monthsScore: number; total: number }
  delayedRecall: { score: number }
}

interface AthleteBackground {
  name: string
  dob: string
  idNumber: string
  sex: string
  dominantHand: string
  sport: string
  team: string
  position: string
  yearsOfEducation: string
  primaryLanguage: string
  previousConcussions: string
  mostRecentConcussionDate: string
  longestRecovery: string
  diagnosedMigraines: boolean
  medicalHistory: string[]
  currentMedications: string
}

interface OculomotorExerciseResult {
  symptoms: string[]
  severity: number
}

interface OculomotorData {
  horizontalSaccades: OculomotorExerciseResult
  verticalSaccades: OculomotorExerciseResult
  horizontalPursuit: OculomotorExerciseResult
  verticalPursuit: OculomotorExerciseResult
}

interface SubmitPayload {
  clinicCode: string
  athlete: AthleteBackground
  symptoms: SymptomData
  cognitive: CognitiveData
  oculomotor?: OculomotorData
}

const SYMPTOMS = [
  'Headache', 'Pressure in head', 'Neck pain', 'Nausea or vomiting', 'Dizziness',
  'Blurred vision', 'Balance problems', 'Sensitivity to light', 'Sensitivity to noise',
  'Feeling slowed down', 'Feeling like in a fog', "Don't feel right",
  'Difficulty concentrating', 'Difficulty remembering', 'Fatigue or low energy',
  'Confusion', 'Drowsiness', 'More emotional', 'Irritability', 'Sadness',
  'Nervous or anxious', 'Trouble falling asleep',
]

function generatePdf(data: SubmitPayload, clinicName: string): Buffer {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let y = 20

  const addText = (text: string, x: number, currentY: number, opts?: { fontSize?: number; fontStyle?: string; maxWidth?: number }) => {
    doc.setFontSize(opts?.fontSize || 10)
    if (opts?.fontStyle) doc.setFont('helvetica', opts.fontStyle)
    else doc.setFont('helvetica', 'normal')
    doc.text(text, x, currentY, { maxWidth: opts?.maxWidth || contentWidth })
  }

  const checkPage = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage()
      y = 20
    }
  }

  const drawLine = () => {
    doc.setDrawColor(200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  // Header
  doc.setFillColor(91, 154, 166)
  doc.rect(0, 0, pageWidth, 35, 'F')
  doc.setTextColor(255, 255, 255)
  addText('SCAT6 Pre-Season Baseline — Self-Administered', margin, 15, { fontSize: 16, fontStyle: 'bold' })
  addText(`Generated: ${new Date().toLocaleDateString('en-AU', { dateStyle: 'full' })} at ${new Date().toLocaleTimeString('en-AU', { timeStyle: 'short' })}`, margin, 25, { fontSize: 9 })
  doc.setTextColor(0, 0, 0)
  y = 45

  // Clinic info
  addText(`Clinic: ${clinicName}`, margin, y, { fontSize: 11, fontStyle: 'bold' })
  y += 10

  // Athlete details
  addText('ATHLETE INFORMATION', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 8

  const fields = [
    ['Name', data.athlete.name], ['Date of Birth', data.athlete.dob],
    ['ID/Jersey', data.athlete.idNumber], ['Sex', data.athlete.sex],
    ['Dominant Hand', data.athlete.dominantHand], ['Sport', data.athlete.sport],
    ['Team/Club', data.athlete.team], ['Position', data.athlete.position],
    ['Years of Education', data.athlete.yearsOfEducation], ['Primary Language', data.athlete.primaryLanguage],
  ]

  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i]
    const right = fields[i + 1]
    addText(`${left[0]}:`, margin, y, { fontSize: 9, fontStyle: 'bold' })
    addText(left[1] || '—', margin + 40, y, { fontSize: 9 })
    if (right) {
      addText(`${right[0]}:`, margin + contentWidth / 2, y, { fontSize: 9, fontStyle: 'bold' })
      addText(right[1] || '—', margin + contentWidth / 2 + 40, y, { fontSize: 9 })
    }
    y += 6
  }
  y += 5

  // Concussion & Medical History
  drawLine()
  addText('CONCUSSION & MEDICAL HISTORY', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 8

  addText(`Previous Concussions: ${data.athlete.previousConcussions || '0'}`, margin, y, { fontSize: 9 })
  y += 6
  addText(`Most Recent: ${data.athlete.mostRecentConcussionDate || 'N/A'}`, margin, y, { fontSize: 9 })
  addText(`Longest Recovery: ${data.athlete.longestRecovery || 'N/A'}`, margin + contentWidth / 2, y, { fontSize: 9 })
  y += 6
  addText(`Diagnosed Migraines: ${data.athlete.diagnosedMigraines ? 'Yes' : 'No'}`, margin, y, { fontSize: 9 })
  y += 6

  const medHistory = data.athlete.medicalHistory || []
  if (medHistory.length > 0) {
    addText(`Medical History: ${medHistory.join(', ')}`, margin, y, { fontSize: 9, maxWidth: contentWidth })
    y += Math.ceil(medHistory.join(', ').length / 90) * 5 + 3
  }
  if (data.athlete.currentMedications) {
    addText(`Current Medications: ${data.athlete.currentMedications}`, margin, y, { fontSize: 9, maxWidth: contentWidth })
    y += 8
  }
  y += 5

  // Symptom Evaluation
  checkPage(80)
  drawLine()
  addText('SYMPTOM EVALUATION', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 8

  const symptomCount = data.symptoms.ratings.filter(r => r > 0).length
  const symptomTotal = data.symptoms.ratings.reduce((a, b) => a + b, 0)

  addText(`Symptom Number: ${symptomCount}/22`, margin, y, { fontSize: 10, fontStyle: 'bold' })
  addText(`Severity Score: ${symptomTotal}/132`, margin + contentWidth / 2, y, { fontSize: 10, fontStyle: 'bold' })
  y += 8

  // Individual symptoms in 2 columns
  for (let i = 0; i < SYMPTOMS.length; i += 2) {
    checkPage(6)
    const left = `${SYMPTOMS[i]}: ${data.symptoms.ratings[i]}`
    addText(left, margin, y, { fontSize: 8 })
    if (i + 1 < SYMPTOMS.length) {
      const right = `${SYMPTOMS[i + 1]}: ${data.symptoms.ratings[i + 1]}`
      addText(right, margin + contentWidth / 2, y, { fontSize: 8 })
    }
    y += 5
  }
  y += 3

  addText(`Feels normal: ${data.symptoms.feelNormalPercent}%`, margin, y, { fontSize: 9 })
  y += 5
  if (data.symptoms.notNormalReason) {
    addText(`Reason: ${data.symptoms.notNormalReason}`, margin, y, { fontSize: 9, maxWidth: contentWidth })
    y += 6
  }
  addText(`Physical activity worsens symptoms: ${data.symptoms.physicalWorsens ? 'Yes' : 'No'}`, margin, y, { fontSize: 9 })
  y += 5
  addText(`Mental activity worsens symptoms: ${data.symptoms.mentalWorsens ? 'Yes' : 'No'}`, margin, y, { fontSize: 9 })
  y += 10

  // Cognitive Scores
  checkPage(60)
  drawLine()
  addText('COGNITIVE SCREENING', margin, y, { fontSize: 12, fontStyle: 'bold' })
  y += 10

  // Score table
  const scores = [
    ['Orientation', `${data.cognitive.orientation.score}`, '5'],
    ['Immediate Memory', `${data.cognitive.immediateMemory.total}`, '30'],
    ['  Trial 1', `${data.cognitive.immediateMemory.trial1}`, '10'],
    ['  Trial 2', `${data.cognitive.immediateMemory.trial2}`, '10'],
    ['  Trial 3', `${data.cognitive.immediateMemory.trial3}`, '10'],
    ['Concentration', `${data.cognitive.concentration.total}`, '5'],
    ['  Digits Backward', `${data.cognitive.concentration.digitsScore}`, '4'],
    ['  Months in Reverse', `${data.cognitive.concentration.monthsScore}`, '1'],
    ['Delayed Recall', `${data.cognitive.delayedRecall.score}`, '10'],
  ]

  // Table header
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y - 4, contentWidth, 8, 'F')
  addText('Component', margin + 2, y, { fontSize: 9, fontStyle: 'bold' })
  addText('Score', margin + contentWidth - 50, y, { fontSize: 9, fontStyle: 'bold' })
  addText('Max', margin + contentWidth - 20, y, { fontSize: 9, fontStyle: 'bold' })
  y += 8

  for (const row of scores) {
    checkPage(7)
    const isIndented = row[0].startsWith('  ')
    addText(row[0], margin + 2, y, { fontSize: isIndented ? 8 : 9, fontStyle: isIndented ? 'normal' : 'bold' })
    addText(row[1], margin + contentWidth - 50, y, { fontSize: 9 })
    addText(row[2], margin + contentWidth - 20, y, { fontSize: 9 })
    y += 6
  }

  y += 4
  doc.setFillColor(91, 154, 166)
  doc.rect(margin, y - 4, contentWidth, 10, 'F')
  doc.setTextColor(255, 255, 255)
  const totalCognitive = data.cognitive.orientation.score + data.cognitive.immediateMemory.total +
    data.cognitive.concentration.total + data.cognitive.delayedRecall.score
  addText('TOTAL COGNITIVE SCORE', margin + 2, y + 1, { fontSize: 11, fontStyle: 'bold' })
  addText(`${totalCognitive}/50`, margin + contentWidth - 50, y + 1, { fontSize: 11, fontStyle: 'bold' })
  doc.setTextColor(0, 0, 0)
  y += 15

  addText(`Word List Used: List ${data.cognitive.immediateMemory.listUsed}`, margin, y, { fontSize: 9 })
  y += 10

  // Orientation answers
  checkPage(30)
  addText('Orientation Responses:', margin, y, { fontSize: 9, fontStyle: 'bold' })
  y += 6
  const orient = data.cognitive.orientation
  for (const [label, val] of [['Month', orient.month], ['Date', orient.date], ['Day', orient.dayOfWeek], ['Year', orient.year], ['Time', orient.time]]) {
    addText(`  ${label}: ${val}`, margin, y, { fontSize: 8 })
    y += 5
  }
  y += 10

  // Oculomotor Screening
  if (data.oculomotor) {
    checkPage(60)
    drawLine()
    addText('OCULOMOTOR SCREENING', margin, y, { fontSize: 12, fontStyle: 'bold' })
    y += 10

    const oculomotorExercises: { key: keyof OculomotorData; label: string }[] = [
      { key: 'horizontalSaccades', label: 'Horizontal Saccades' },
      { key: 'verticalSaccades', label: 'Vertical Saccades' },
      { key: 'horizontalPursuit', label: 'Horizontal Smooth Pursuit' },
      { key: 'verticalPursuit', label: 'Vertical Smooth Pursuit' },
    ]

    // Table header
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y - 4, contentWidth, 8, 'F')
    addText('Exercise', margin + 2, y, { fontSize: 9, fontStyle: 'bold' })
    addText('Symptoms', margin + 60, y, { fontSize: 9, fontStyle: 'bold' })
    addText('Severity', margin + contentWidth - 25, y, { fontSize: 9, fontStyle: 'bold' })
    y += 8

    let exercisesWithSymptoms = 0
    for (const ex of oculomotorExercises) {
      checkPage(7)
      const result = data.oculomotor[ex.key]
      const hasSymptoms = result.symptoms.length > 0 && !result.symptoms.includes('None')
      if (hasSymptoms) exercisesWithSymptoms++

      addText(ex.label, margin + 2, y, { fontSize: 8 })
      addText(hasSymptoms ? result.symptoms.join(', ') : 'None', margin + 60, y, { fontSize: 8, maxWidth: contentWidth - 90 })
      addText(hasSymptoms ? `${result.severity}/10` : '—', margin + contentWidth - 25, y, { fontSize: 8 })
      y += 6
    }

    y += 4
    addText(`${exercisesWithSymptoms}/4 exercises provoked symptoms`, margin + 2, y, { fontSize: 9, fontStyle: 'bold' })
    y += 10
  }

  // Footer / Disclaimer
  checkPage(30)
  drawLine()
  doc.setFontSize(8)
  doc.setTextColor(100)
  const disclaimer = 'Self-administered baseline — not a clinical assessment. Sections requiring clinical observation (Red Flags, Observable Signs, Maddocks Questions, Glasgow Coma Scale, Cervical Spine Assessment, Modified BESS, Tandem Gait, Dual Task Gait, Decision & HCP Attestation) were not administered.'
  doc.text(disclaimer, margin, y, { maxWidth: contentWidth })
  y += 15

  doc.setTextColor(91, 154, 166)
  doc.setFontSize(9)
  doc.text('Powered by ConcussionPro — concussion-education-australia.com', margin, y)
  y += 6
  doc.text('Free SCAT6/SCOAT6 Mastery Course (2 CPD pts): portal.concussion-education-australia.com/scat-mastery', margin, y)

  return Buffer.from(doc.output('arraybuffer'))
}

export async function POST(request: Request) {
  try {
    if (!process.env.KV_REST_API_URL) {
      return NextResponse.json({ error: 'Preseason service not configured' }, { status: 503 })
    }

    const body: SubmitPayload = await request.json()

    if (!body.clinicCode || !body.athlete || !body.symptoms || !body.cognitive) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Demo mode — clinicians trying the test themselves
    const isDemo = body.clinicCode.toUpperCase() === 'DEMO00'

    let clinic: ClinicData | null = null
    if (isDemo) {
      clinic = { clinicName: 'Demo — Try It Yourself', contactName: 'Demo', email: '', createdAt: new Date().toISOString() }
    } else {
      // Validate clinic
      clinic = await kv.get<ClinicData>(`clinic:${body.clinicCode.toUpperCase()}`)
      if (!clinic) {
        return NextResponse.json({ error: 'Invalid clinic code' }, { status: 404 })
      }
    }

    // Rate limit: 50 submissions per clinic per day (skip for demo)
    if (!isDemo) {
      const today = new Date().toISOString().slice(0, 10)
      const submitRateKey = `rate:submit:${body.clinicCode.toUpperCase()}:${today}`
      const submitCount = await kv.get<number>(submitRateKey) || 0
      if (submitCount >= 50) {
        return NextResponse.json(
          { error: 'Daily submission limit reached. Please try again tomorrow.' },
          { status: 429 }
        )
      }
      await kv.set(submitRateKey, submitCount + 1, { ex: 86400 })
    }

    // Generate PDF
    const pdfBuffer = generatePdf(body, clinic.clinicName)
    const pdfBase64 = pdfBuffer.toString('base64')

    const athleteName = escapeHtml(body.athlete.name || 'Unknown Athlete')
    const date = new Date().toLocaleDateString('en-AU')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || CONFIG.APP_URL

    // Send email with PDF attachment via Resend API directly (need attachment support)
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const totalCognitive = body.cognitive.orientation.score + body.cognitive.immediateMemory.total +
      body.cognitive.concentration.total + body.cognitive.delayedRecall.score
    const symptomCount = body.symptoms.ratings.filter((r: number) => r > 0).length
    const symptomTotal = body.symptoms.ratings.reduce((a: number, b: number) => a + b, 0)

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #64a8b0 0%, #5b9aa6 100%); padding: 28px 24px; text-align: center; }
            .header h1 { margin: 0; color: white; font-size: 20px; font-weight: 700; }
            .content { padding: 28px 24px; }
            .score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
            .score-box { background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; }
            .score-value { font-size: 24px; font-weight: 800; color: #5b9aa6; }
            .score-label { font-size: 12px; color: #64748b; }
            .cta-box { background: linear-gradient(135deg, #f0f9ff, #ecfdf5); border: 1px solid #5b9aa6; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
            .cta-box a { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #64a8b0, #5b9aa6); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; }
            .footer { padding: 20px 24px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Baseline Report: ${athleteName}</h1>
            </div>
            <div class="content">
              <p>Hi ${escapeHtml(clinic.contactName)},</p>
              <p>A new pre-season baseline has been completed. The full report is attached as a PDF.</p>

              <p style="font-weight: 700; margin-bottom: 8px;">Quick Summary:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
                <tr>
                  <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; width: 50%;">
                    <div style="font-size: 24px; font-weight: 800; color: #5b9aa6;">${symptomCount}/22</div>
                    <div style="font-size: 12px; color: #64748b;">Symptom Number</div>
                  </td>
                  <td style="width: 12px;"></td>
                  <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center; width: 50%;">
                    <div style="font-size: 24px; font-weight: 800; color: #5b9aa6;">${symptomTotal}/132</div>
                    <div style="font-size: 12px; color: #64748b;">Severity Score</div>
                  </td>
                </tr>
                <tr><td colspan="3" style="height: 12px;"></td></tr>
                <tr>
                  <td style="background: #f8fafc; border-radius: 10px; padding: 14px; text-align: center;" colspan="3">
                    <div style="font-size: 28px; font-weight: 800; color: #5b9aa6;">${totalCognitive}/50</div>
                    <div style="font-size: 12px; color: #64748b;">Total Cognitive Score</div>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; color: #475569;"><strong>Athlete:</strong> ${athleteName} · <strong>Sport:</strong> ${escapeHtml(body.athlete.sport || '—')} · <strong>Team:</strong> ${escapeHtml(body.athlete.team || '—')}</p>

              <p style="font-size: 13px; color: #475569; margin: 20px 0 8px;">You've captured one dimension of baseline data. The SCAT6 protocol covers symptom evaluation, cognitive screening, neurological exam, balance testing, and more. Are you confident interpreting all 7 domains?</p>

              <div class="cta-box">
                <p style="margin: 0 0 8px; font-weight: 700; font-size: 15px;">Free: Master the Full SCAT6 Protocol (2 CPD Points)</p>
                <p style="margin: 0 0 16px; font-size: 13px; color: #475569;">Learn how to properly administer and interpret every SCAT6 section. Fillable forms, clinical toolkit &amp; certificate included. <strong>2 AHPRA CPD points — free.</strong></p>
                <a href="${baseUrl}/scat-mastery">Get Free Course →</a>
                <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">Want deeper training? Our <a href="${CONFIG.SHOP_URL}" style="color: #5b9aa6;">full ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD point course</a> covers VOMS, BESS, return-to-play &amp; more.</p>
              </div>
            </div>
            <div class="footer">
              <p>ConcussionPro — Concussion Education Australia</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Demo mode — skip email, just return success with score
    if (isDemo) {
      return NextResponse.json({ success: true })
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Would send baseline report email to:', clinic.email)
      console.log('PDF size:', pdfBuffer.length, 'bytes')
      return NextResponse.json({ success: true })
    }

    // Send via Resend with attachment
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ConcussionPro <noreply@concussion-education-australia.com>',
        to: [clinic.email],
        subject: `SCAT6 Baseline Report — ${athleteName} (${date})`,
        html: emailHtml,
        attachments: [
          {
            filename: `SCAT6-Baseline-${athleteName.replace(/\s+/g, '-')}-${date.replace(/\//g, '-')}.pdf`,
            content: pdfBase64,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return NextResponse.json({ error: 'Failed to send report' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Preseason submit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
