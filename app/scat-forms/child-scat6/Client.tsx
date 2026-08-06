'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import {
  ChildSCAT6FormData,
  ChildSCAT6SymptomKey,
  CHILD_SCAT6_SYMPTOM_COUNT,
  CHILD_SCAT6_WORD_LIST_SOURCE,
  getDefaultChildSCAT6FormData,
  normalizeChildSCAT6Draft,
} from '../shared/types/child-scat6.types'
import { getAllCalculatedScores, CHILD_SCAT6_MAX } from '../shared/utils/child-scat6-calculations'
import { exportChildSCAT6ToFlatPDF } from '../shared/utils/child-scat6-pdf-flat'
import { WORD_LISTS } from '../shared/constants/wordLists'
import { EmailGateModal } from '@/components/scat-forms/EmailGateModal'

const SectionHeader = ({
  id,
  title,
  children,
  expandedSections,
  toggleSection
}: {
  id: string
  title: string
  children?: React.ReactNode
  expandedSections: Set<string>
  toggleSection: (id: string) => void
}) => {
  const isExpanded = expandedSections.has(id)
  return (
    <div className="mb-4">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between bg-[#2E7D32] text-white px-4 py-3 rounded-t-lg hover:bg-[#256a28] transition-colors"
      >
        <h3 className="text-lg font-bold">{title}</h3>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isExpanded && (
        <div className="bg-[#E8F5E9] p-6 rounded-b-lg border border-slate-200">
          {children}
        </div>
      )}
    </div>
  )
}

/** A score that has not been recorded prints as a dash — never as 0. */
const score = (value: number | null) => (value === null ? '—' : String(value))

/**
 * Parse a numeric input into `number | null`. An empty field stays null ("not
 * recorded"); a real 0 is kept. Values are clamped to the instrument's range so
 * a typo cannot produce 12 errors out of a possible 10.
 */
/**
 * Age in whole years at the examination date (today if no exam date is set).
 * null when the dates are missing or nonsensical, so nothing is asserted.
 */
const ageAtExam = (dateOfBirth: string, dateOfExamination: string): number | null => {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const exam = dateOfExamination ? new Date(dateOfExamination) : new Date()
  if (isNaN(dob.getTime()) || isNaN(exam.getTime()) || exam < dob) return null
  let years = exam.getFullYear() - dob.getFullYear()
  const monthDelta = exam.getMonth() - dob.getMonth()
  if (monthDelta < 0 || (monthDelta === 0 && exam.getDate() < dob.getDate())) years -= 1
  return years
}

const numOrNull = (raw: string, min: number, max: number): number | null => {
  if (raw.trim() === '') return null
  const parsed = parseInt(raw, 10)
  if (isNaN(parsed)) return null
  return Math.max(min, Math.min(max, parsed))
}

export default function ChildSCAT6Client() {
  const [formData, setFormData] = useState<ChildSCAT6FormData>(getDefaultChildSCAT6FormData())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['demographics', 'childSymptoms', 'cognitive', 'balance'])
  )
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [pendingDraft, setPendingDraft] = useState<{ data: ChildSCAT6FormData; timestamp: number } | null>(null)

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.success && data?.user) setIsAuthenticated(true) })
      .catch(() => {})
  }, [])

  /** Serialised empty form, for "has the clinician touched anything yet?". */
  const pristineForm = useRef<string>(JSON.stringify(getDefaultChildSCAT6FormData()))

  // Auto-save to localStorage every 3 seconds
  // (paused while a restore prompt is pending so the saved draft isn't overwritten)
  useEffect(() => {
    // Only hold off while the form is still PRISTINE. Pausing for as long
    // as the restore banner sits there meant a clinician who ignored the
    // banner and worked through a whole assessment had nothing auto-saved:
    // one refresh and the entry was gone, replaced by the older draft.
    if (pendingDraft && JSON.stringify(formData) === pristineForm.current) return
    const timer = setTimeout(() => {
      const draftWithTimestamp = {
        data: formData,
        timestamp: Date.now(),
      }
      localStorage.setItem('child-scat6-draft', JSON.stringify(draftWithTimestamp))
    }, 3000)
    return () => clearTimeout(timer)
  }, [formData, pendingDraft])

  // Load draft on mount - non-blocking restore banner
  useEffect(() => {
    const draft = localStorage.getItem('child-scat6-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        const draftTimestamp = parsed.timestamp || 0
        const isExpired = Date.now() - draftTimestamp > 86400000

        if (isExpired) {
          localStorage.removeItem('child-scat6-draft')
        } else {
          // Normalised against the current shape: a draft written by an older
          // build stored the adult symptom keys and 0/false where nothing had
          // been recorded, and restoring it verbatim would reinstate those
          // fabricated zeros.
          setPendingDraft({
            data: normalizeChildSCAT6Draft(parsed.data ?? parsed),
            timestamp: draftTimestamp,
          })
        }
      } catch {
        console.error('Failed to load draft')
        localStorage.removeItem('child-scat6-draft')
      }
    }
  }, [])

  const calculated = getAllCalculatedScores(formData)
  const age = ageAtExam(formData.dateOfBirth, formData.dateOfExamination)
  const outsideAgeBand = age !== null && (age < 8 || age > 12)

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const doExportPDF = async () => {
    try {
      const filename = `Child_SCAT6_${formData.athleteName || 'Assessment'}_${formData.dateOfExamination || 'Draft'}.pdf`
      await exportChildSCAT6ToFlatPDF(formData, filename)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleExportPDF = async () => {
    if (isAuthenticated) {
      await doExportPDF()
    } else {
      setShowEmailGate(true)
    }
  }

  const handleClearForm = () => {
    if (confirm('Start a new assessment? All current form data will be cleared.\n\nThis cannot be undone.')) {
      localStorage.removeItem('child-scat6-draft')
      setFormData(getDefaultChildSCAT6FormData())
      alert('New assessment started - form cleared successfully')
    }
  }

  // Input class shorthand
  const inputClass = 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white'
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1'
  const scoreBoxClass = 'p-3 bg-white rounded-lg border border-green-200 inline-block'

  // Child SCAT6 symptom items, in the order they are printed on the form.
  // These are the CHILD SCAT6 items — they are not the adult SCAT6 list.
  const childSymptomLabels: { key: ChildSCAT6SymptomKey; label: string }[] = [
    { key: 'headaches', label: 'I have headaches' },
    { key: 'dizzy', label: 'I feel dizzy' },
    { key: 'roomSpinning', label: 'I feel like the room is spinning' },
    { key: 'goingToFaint', label: 'I feel like I\'m going to faint' },
    { key: 'thingsBlurry', label: 'Things are blurry when I look at them' },
    { key: 'seeDouble', label: 'I see double' },
    { key: 'sickToStomach', label: 'I feel sick to my stomach' },
    { key: 'tiredALot', label: 'I get tired a lot' },
    { key: 'tiredEasily', label: 'I get tired easily' },
    { key: 'troublePayingAttention', label: 'I have trouble paying attention' },
    { key: 'distractedEasily', label: 'I get distracted easily' },
    { key: 'hardTimeConcentrating', label: 'I have a hard time concentrating' },
    { key: 'problemsRemembering', label: 'I have problems remembering what people tell me' },
    { key: 'problemsFollowingDirections', label: 'I have problems following directions' },
    { key: 'daydreams', label: 'I daydream too much' },
    { key: 'getsConfused', label: 'I get confused' },
    { key: 'forgetful', label: 'I forget things' },
    { key: 'problemsFinishingThings', label: 'I have problems finishing things' },
    { key: 'problemSolving', label: 'I have trouble figuring things out' },
    { key: 'problemsLearning', label: 'It\'s hard for me to learn new things' },
    { key: 'neckHurts', label: 'My neck hurts' },
  ]

  const parentSymptomLabels: { key: ChildSCAT6SymptomKey; label: string }[] = [
    { key: 'headaches', label: 'has headaches' },
    { key: 'dizzy', label: 'feels dizzy' },
    { key: 'roomSpinning', label: 'has a feeling that the room is spinning' },
    { key: 'goingToFaint', label: 'feels faint' },
    { key: 'thingsBlurry', label: 'has blurred vision' },
    { key: 'seeDouble', label: 'has double vision' },
    { key: 'sickToStomach', label: 'experiences nausea' },
    { key: 'tiredALot', label: 'gets tired a lot' },
    { key: 'tiredEasily', label: 'gets tired easily' },
    { key: 'troublePayingAttention', label: 'has trouble sustaining attention' },
    { key: 'distractedEasily', label: 'is distracted easily' },
    { key: 'hardTimeConcentrating', label: 'has difficulty concentrating' },
    { key: 'problemsRemembering', label: 'has problems remembering what he/she is told' },
    { key: 'problemsFollowingDirections', label: 'has difficulty following directions' },
    { key: 'daydreams', label: 'tends to daydream' },
    { key: 'getsConfused', label: 'gets confused' },
    { key: 'forgetful', label: 'is forgetful' },
    { key: 'problemsFinishingThings', label: 'has difficulty completing tasks' },
    { key: 'problemSolving', label: 'has poor problem-solving skills' },
    { key: 'problemsLearning', label: 'has problems learning' },
    { key: 'neckHurts', label: 'has a sore neck' },
  ]

  const ratingLabels = ['Not at all/never', 'A little/rarely', 'Somewhat/sometimes', 'A lot/often']

  const setSymptom = (scale: 'childSymptoms' | 'parentSymptoms', key: ChildSCAT6SymptomKey, val: number) =>
    setFormData(prev => ({ ...prev, [scale]: { ...prev[scale], [key]: val } }))

  const clearSymptom = (scale: 'childSymptoms' | 'parentSymptoms', key: ChildSCAT6SymptomKey) =>
    setFormData(prev => ({ ...prev, [scale]: { ...prev[scale], [key]: null } }))

  const renderSymptomScale = (
    scale: 'childSymptoms' | 'parentSymptoms',
    labels: { key: ChildSCAT6SymptomKey; label: string }[]
  ) => (
    <>
      {/* MOBILE LAYOUT (2026-08-06, 375px sweep of all 158 public routes).
          The fixed grid below needs 1fr + 4×72px + 56px + gaps ≈ 364px of
          COLUMNS alone, so on a 375px viewport this row ran 150px past the
          edge with no scroll container — the "A lot/often" column and the
          clear button were simply unreachable.

          Same defect the adult SCAT6 symptom scale had (its "6" column sat
          off-screen), fixed there on the same day. This is the CHILD SCAT6,
          a SEPARATE instrument with a 0–3 scale and its own verbal anchors,
          so it has its own copy of the layout and was missed.

          Fix mirrors the adult form: stack the symptom name above the scale
          on mobile and distribute the four targets with flex-1, which lands
          each at ~44px wide — the minimum touch target — while the desktop
          grid is untouched at sm and above.

          The verbal anchors are the instrument and must stay visible, so on
          mobile they move to a legend above the scale and each option keeps
          its number. Nothing about the scoring changes. */}
      <div className="sm:hidden mb-3 rounded-lg bg-slate-50 border border-slate-200 p-2">
        <p className="text-[11px] font-semibold text-slate-600 mb-1">Rating scale</p>
        <ul className="text-[11px] text-slate-500 leading-snug space-y-0.5">
          {ratingLabels.map((label, i) => (
            <li key={label}><span className="font-semibold text-slate-700">{i}</span> — {label}</li>
          ))}
        </ul>
      </div>

      <div className="hidden sm:grid grid-cols-[1fr_72px_72px_72px_72px_56px] gap-1 mb-2 text-center">
        <div></div>
        {ratingLabels.map(label => (
          <div key={label} className="text-[11px] font-medium text-slate-500 leading-tight">{label}</div>
        ))}
        <div className="text-[11px] font-medium text-slate-500">Clear</div>
      </div>

      {labels.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_72px_72px_72px_72px_56px] sm:gap-1 sm:items-center py-2 sm:py-1 border-b border-slate-100">
          <span className={`text-sm ${formData[scale][key] === null ? 'text-slate-400 italic' : 'text-slate-700'}`}>
            {label}
          </span>
          {/* On mobile this wrapper becomes the scale row; on sm+ it unwraps
              via `display: contents` so the original grid columns are exactly
              as they were. */}
          <div className="flex items-center gap-1 sm:contents">
            {[0, 1, 2, 3].map(val => (
              <div key={val} className="flex flex-1 sm:flex-none justify-center">
                <label className="min-h-[44px] w-full sm:w-auto flex flex-col items-center justify-center gap-0.5 cursor-pointer rounded-lg hover:bg-slate-50">
                  <input
                    type="radio"
                    name={`${scale}-${key}`}
                    checked={formData[scale][key] === val}
                    onChange={() => setSymptom(scale, key, val)}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-[10px] text-slate-400 sm:hidden">{val}</span>
                </label>
              </div>
            ))}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => clearSymptom(scale, key)}
                disabled={formData[scale][key] === null}
                className="min-h-[44px] px-2 text-[11px] text-slate-500 underline underline-offset-2 disabled:opacity-30 disabled:no-underline"
              >
                clear
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  )

  const renderSymptomTotals = (
    numberScore: number | null,
    severityScore: number | null,
    rated: number,
    complete: boolean
  ) => (
    <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm font-medium text-slate-700">Total Symptoms:</span>
          <span className="ml-2 text-lg font-bold text-green-700">
            {score(numberScore)} / {CHILD_SCAT6_MAX.symptomNumber}
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-slate-700">Severity Score:</span>
          <span className="ml-2 text-lg font-bold text-green-700">
            {score(severityScore)} / {CHILD_SCAT6_MAX.symptomSeverity}
          </span>
        </div>
      </div>
      {!complete && (
        <p className="mt-2 text-xs text-amber-700">
          {rated} of {CHILD_SCAT6_SYMPTOM_COUNT} items rated — an unrated item is not scored as
          &ldquo;not at all&rdquo;. The exported form shows the rated count alongside any partial total.
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-6 pb-20">
      {/* Draft Restore Banner (non-blocking) */}
      {pendingDraft && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4">
          <p className="text-sm text-amber-900 flex-1">
            {pendingDraft.timestamp
              ? `A saved draft from ${new Date(pendingDraft.timestamp).toLocaleString()} was found.`
              : 'A saved draft was found.'}
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setFormData(pendingDraft.data)
                setPendingDraft(null)
              }}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors"
            >
              Restore draft
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('child-scat6-draft')
                setPendingDraft(null)
              }}
              className="px-4 py-2 bg-white border border-amber-300 text-amber-800 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-colors"
            >
              Start fresh
            </button>
          </div>
        </div>
      )}

      {/* Email Gate Modal */}
      <EmailGateModal
        isOpen={showEmailGate}
        onClose={() => setShowEmailGate(false)}
        onSuccess={() => {
          setIsAuthenticated(true)
          setShowEmailGate(false)
          doExportPDF()
        }}
        accentColor="green"
      />

      {/* Header with Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Child SCAT6 Assessment Form</h2>
          <p className="text-sm text-slate-500">Sport Concussion Assessment Tool - For Children Aged 8-12</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearForm}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold"
          >
            New Assessment
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Green Header Banner */}
        <div className="bg-[#2E7D32] text-white p-8 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Child SCAT6</h1>
              <p className="text-lg text-green-100 mb-1">Sport Concussion Assessment Tool</p>
              <p className="text-sm text-green-200">For Children Aged 8–12 Years</p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
            Fields left blank are exported as <strong>not administered</strong> (a dash), never as a
            score of zero. Record a genuine zero by entering 0.
          </div>

          {/* Age band. Printed on the Child SCAT6: "The Child SCAT6 is used for
              evaluating children aged 8-12 years. For athletes aged 13 years or
              older, please use the SCAT6." Advisory only — it never blocks. */}
          {outsideAgeBand && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
              This child is <strong>{age}</strong> at the examination date. The Child SCAT6 is used
              for evaluating children aged 8–12 years.{' '}
              {age !== null && age >= 13 ? (
                <>
                  For athletes aged 13 years or older, use the{' '}
                  <Link href="/scat-forms/scat6" className="underline font-semibold">SCAT6</Link>.
                </>
              ) : (
                <>Below 8 years, the instrument is outside its stated age band — clinical judgement applies.</>
              )}
            </div>
          )}

          {/* ===== DEMOGRAPHICS ===== */}
          <SectionHeader id="demographics" title="Athlete Information" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Child Name:</label>
                <input type="text" value={formData.athleteName} onChange={(e) => setFormData(prev => ({ ...prev, athleteName: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>ID Number:</label>
                <input type="text" value={formData.idNumber} onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date of Birth:</label>
                <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date of Examination:</label>
                <input type="date" value={formData.dateOfExamination} onChange={(e) => setFormData(prev => ({ ...prev, dateOfExamination: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date of Injury:</label>
                <input type="date" value={formData.dateOfInjury} onChange={(e) => setFormData(prev => ({ ...prev, dateOfInjury: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Time of Injury:</label>
                <input type="time" value={formData.timeOfInjury} onChange={(e) => setFormData(prev => ({ ...prev, timeOfInjury: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Sex:</label>
                <div className="flex flex-wrap gap-3">
                  {(['Male', 'Female', 'Prefer Not To Say'] as const).map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sex" value={option} checked={formData.sex === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value as ChildSCAT6FormData['sex'] }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Dominant Hand:</label>
                <div className="flex gap-4">
                  {(['Left', 'Right', 'Ambidextrous'] as const).map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="dominantHand" value={option} checked={formData.dominantHand === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, dominantHand: e.target.value as ChildSCAT6FormData['dominantHand'] }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Sport/Team/School:</label>
                <input type="text" value={formData.sportTeamSchool} onChange={(e) => setFormData(prev => ({ ...prev, sportTeamSchool: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Current Year/Grade Level in School:</label>
                <input type="text" value={formData.currentYear} onChange={(e) => setFormData(prev => ({ ...prev, currentYear: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>First Language:</label>
                <input type="text" value={formData.firstLanguage} onChange={(e) => setFormData(prev => ({ ...prev, firstLanguage: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Preferred Language:</label>
                <input type="text" value={formData.preferredLanguage} onChange={(e) => setFormData(prev => ({ ...prev, preferredLanguage: e.target.value }))} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Examiner:</label>
                <input type="text" value={formData.examiner} onChange={(e) => setFormData(prev => ({ ...prev, examiner: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </SectionHeader>

          {/* ===== CONCUSSION HISTORY ===== */}
          <SectionHeader id="history" title="Concussion History" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>How many diagnosed concussions has the child had in the past?</label>
                <input type="number" min="0" value={formData.previousConcussions} onChange={(e) => setFormData(prev => ({ ...prev, previousConcussions: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>When was the most recent concussion?</label>
                <input type="text" value={formData.mostRecentConcussion} onChange={(e) => setFormData(prev => ({ ...prev, mostRecentConcussion: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Primary symptoms reported:</label>
                <textarea value={formData.primarySymptoms} onChange={(e) => setFormData(prev => ({ ...prev, primarySymptoms: e.target.value }))} className={inputClass} rows={2} />
              </div>
              <div>
                <label className={labelClass}>How long was the recovery from the most recent concussion? (days)</label>
                <input type="text" value={formData.recoveryTime} onChange={(e) => setFormData(prev => ({ ...prev, recoveryTime: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </SectionHeader>

          {/* ===== CHILD BACKGROUND ===== */}
          <SectionHeader id="background" title="Child Background" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 font-medium">Has the child ever been:</p>
              {([
                { key: 'hospitalizedForHeadInjury', label: 'Hospitalised for head injury?' },
                { key: 'headacheDisorder', label: 'Diagnosed/treated for headache disorder or migraine?' },
                { key: 'learningDisability', label: 'Diagnosed with a learning disability/dyslexia?' },
                { key: 'adhd', label: 'Diagnosed with attention deficit hyperactivity disorder (ADHD)?' },
                { key: 'psychologicalDisorder', label: 'Diagnosed with depression, anxiety, or other psychological disorder?' },
              ] as const).map(item => (
                <div key={item.key} className="flex items-center gap-4">
                  <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name={item.key} checked={formData[item.key] === true}
                        onChange={() => setFormData(prev => ({ ...prev, [item.key]: true }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name={item.key} checked={formData[item.key] === false}
                        onChange={() => setFormData(prev => ({ ...prev, [item.key]: false }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm">No</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, [item.key]: null }))}
                      disabled={formData[item.key] === null}
                      className="text-[11px] text-slate-500 underline underline-offset-2 disabled:opacity-30 disabled:no-underline"
                    >
                      clear
                    </button>
                  </div>
                </div>
              ))}
              <div>
                <label className={labelClass}>Notes:</label>
                <textarea value={formData.athleteBackgroundNotes} onChange={(e) => setFormData(prev => ({ ...prev, athleteBackgroundNotes: e.target.value }))} className={inputClass} rows={2} />
              </div>
              <div>
                <label className={labelClass}>Is the child on any medications? If yes, please list:</label>
                <textarea value={formData.currentMedications} onChange={(e) => setFormData(prev => ({ ...prev, currentMedications: e.target.value }))} className={inputClass} rows={2} />
              </div>
            </div>
          </SectionHeader>

          {/* ===== CHILD SYMPTOM REPORT ===== */}
          <SectionHeader id="childSymptoms" title="Symptom Evaluation — Child Report (0-3 Scale)" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 mb-4">Hand the form to the child. Rate each item: <strong>Not at all/never (0), A little/rarely (1), Somewhat/sometimes (2), A lot/often (3)</strong></p>

              {renderSymptomScale('childSymptoms', childSymptomLabels)}

              {renderSymptomTotals(
                calculated.childSymptomNumber,
                calculated.childSymptomSeverity,
                calculated.childSymptomsRated,
                calculated.childSymptomScaleComplete
              )}

              <div className="mt-4">
                <label className={labelClass}>
                  On a scale of 0 to 10 (where <strong>10 is normal</strong>), how do you feel now?
                </label>
                <input type="number" min="0" max="10" value={formData.childOverallRating ?? ''}
                  placeholder="—"
                  onChange={(e) => setFormData(prev => ({ ...prev, childOverallRating: numOrNull(e.target.value, 0, 10) }))}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key: 'childSymptomsWorseWithPhysical', label: 'Do the symptoms get worse with physical activity?' },
                  { key: 'childSymptomsWorseWithMental', label: 'Do the symptoms get worse with trying to think?' },
                ] as const).map(item => (
                  <div key={item.key}>
                    <label className={labelClass}>{item.label}</label>
                    <div className="flex gap-4 items-center">
                      {[true, false].map(val => (
                        <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={item.key} checked={formData[item.key] === val}
                            onChange={() => setFormData(prev => ({ ...prev, [item.key]: val }))} className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{val ? 'Yes' : 'No'}</span>
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, [item.key]: null }))}
                        disabled={formData[item.key] === null}
                        className="text-[11px] text-slate-500 underline underline-offset-2 disabled:opacity-30 disabled:no-underline"
                      >
                        clear
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionHeader>

          {/* ===== PARENT SYMPTOM REPORT ===== */}
          <SectionHeader id="parentSymptoms" title="Symptom Evaluation — Parent Report (0-3 Scale)" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 mb-4">Hand the form to the parent/guardian/carer. <em>The child…</em> <strong>Not at all/never (0), A little/rarely (1), Somewhat/sometimes (2), A lot/often (3)</strong></p>

              {renderSymptomScale('parentSymptoms', parentSymptomLabels)}

              {renderSymptomTotals(
                calculated.parentSymptomNumber,
                calculated.parentSymptomSeverity,
                calculated.parentSymptomsRated,
                calculated.parentSymptomScaleComplete
              )}

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {([
                  { key: 'parentSymptomsWorseWithPhysical', label: 'Do the symptoms get worse with physical activity?' },
                  { key: 'parentSymptomsWorseWithMental', label: 'Do the symptoms get worse with trying to think?' },
                ] as const).map(item => (
                  <div key={item.key}>
                    <label className={labelClass}>{item.label}</label>
                    <div className="flex gap-4 items-center">
                      {[true, false].map(val => (
                        <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name={item.key} checked={formData[item.key] === val}
                            onChange={() => setFormData(prev => ({ ...prev, [item.key]: val }))} className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{val ? 'Yes' : 'No'}</span>
                        </label>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, [item.key]: null }))}
                        disabled={formData[item.key] === null}
                        className="text-[11px] text-slate-500 underline underline-offset-2 disabled:opacity-30 disabled:no-underline"
                      >
                        clear
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <label className={labelClass}>
                  On a scale of 0 to 100% (where <strong>100% is normal</strong>), how would you rate the child now?
                </label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" max="100" value={formData.parentOverallPercent ?? ''}
                    placeholder="—"
                    onChange={(e) => setFormData(prev => ({ ...prev, parentOverallPercent: numOrNull(e.target.value, 0, 100) }))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                  <span className="text-sm font-semibold text-slate-700">%</span>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== COGNITIVE SCREENING ===== */}
          <SectionHeader id="cognitive" title="Cognitive Screening (SAC)" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-6">
              {/* Immediate Memory */}
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-3">Immediate Memory</h4>
                <div className="mb-3">
                  <label className={labelClass}>Word List Used:</label>
                  <div className="flex gap-4">
                    {(['A', 'B', 'C'] as const).map(list => (
                      <label key={list} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="wordList" value={list} checked={formData.wordListUsed === list}
                          onChange={() => setFormData(prev => ({ ...prev, wordListUsed: list }))} className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">List {list}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {formData.wordListUsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="px-3 py-2 text-left">Word</th>
                          <th className="px-3 py-2 text-center">Trial 1</th>
                          <th className="px-3 py-2 text-center">Trial 2</th>
                          <th className="px-3 py-2 text-center">Trial 3</th>
                        </tr>
                      </thead>
                      <tbody>
                        {WORD_LISTS[CHILD_SCAT6_WORD_LIST_SOURCE[formData.wordListUsed]].map((word, i) => (
                          <tr key={i} className="border-b border-slate-100">
                            <td className="px-3 py-2 font-medium">{word}</td>
                            {[formData.immediateMemoryTrial1, formData.immediateMemoryTrial2, formData.immediateMemoryTrial3].map((trial, t) => (
                              <td key={t} className="px-3 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={trial[i]}
                                  onChange={() => {
                                    const trialKey = `immediateMemoryTrial${t + 1}` as 'immediateMemoryTrial1' | 'immediateMemoryTrial2' | 'immediateMemoryTrial3'
                                    setFormData(prev => {
                                      const updated = [...prev[trialKey]]
                                      updated[i] = !updated[i]
                                      return { ...prev, [trialKey]: updated }
                                    })
                                  }}
                                  className="w-4 h-4 text-green-600 rounded"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-bold">
                          <td className="px-3 py-2">Total</td>
                          <td className="px-3 py-2 text-center">{formData.immediateMemoryTrial1.filter(Boolean).length}</td>
                          <td className="px-3 py-2 text-center">{formData.immediateMemoryTrial2.filter(Boolean).length}</td>
                          <td className="px-3 py-2 text-center">{formData.immediateMemoryTrial3.filter(Boolean).length}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-3 flex gap-4 items-center">
                  <div className={scoreBoxClass}>
                    <span className="text-sm font-medium text-slate-700">Immediate Memory Score: </span>
                    <span className="text-lg font-bold text-green-700">
                      {score(calculated.immediateMemory)} / {CHILD_SCAT6_MAX.immediateMemory}
                    </span>
                  </div>
                  <div>
                    <label className={labelClass}>Time last trial completed:</label>
                    <input type="time" value={formData.immediateMemoryTimeCompleted}
                      onChange={(e) => setFormData(prev => ({ ...prev, immediateMemoryTimeCompleted: e.target.value }))} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Concentration */}
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-3">Concentration</h4>
                <div className="mb-3">
                  <label className={labelClass}>Digit List Used:</label>
                  <div className="flex gap-4">
                    {(['A', 'B', 'C'] as const).map(list => (
                      <label key={list} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="digitList" value={list} checked={formData.digitListUsed === list}
                          onChange={() => setFormData(prev => ({ ...prev, digitListUsed: list }))} className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">List {list}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Read the digit strings from the printed Child SCAT6 — the child list starts at
                    two digits and scores out of 5.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className={labelClass}>Digits Backward Score (0-{CHILD_SCAT6_MAX.digitsBackward}):</label>
                    <input type="number" min="0" max={CHILD_SCAT6_MAX.digitsBackward} value={formData.digitsBackward ?? ''}
                      placeholder="—"
                      onChange={(e) => setFormData(prev => ({ ...prev, digitsBackward: numOrNull(e.target.value, 0, CHILD_SCAT6_MAX.digitsBackward) }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Days in Reverse — Time (sec):</label>
                    <input type="text" value={formData.daysReverseTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, daysReverseTime: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Days in Reverse — Errors:</label>
                    <input type="number" min="0" max="7" value={formData.daysReverseErrors ?? ''}
                      placeholder="—"
                      onChange={(e) => setFormData(prev => ({ ...prev, daysReverseErrors: numOrNull(e.target.value, 0, 7) }))} className={inputClass} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Days of the week in reverse (Sunday → Monday). 1 point if no errors and completed
                  under 30 seconds. The Child SCAT6 does not use months in reverse.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className={scoreBoxClass}>
                    <span className="text-sm font-medium text-slate-700">Days Score: </span>
                    <span className="text-lg font-bold text-green-700">
                      {score(calculated.daysReverse)} / {CHILD_SCAT6_MAX.daysReverse}
                    </span>
                  </div>
                  <div className={scoreBoxClass}>
                    <span className="text-sm font-medium text-slate-700">Concentration Score (Digits + Days): </span>
                    <span className="text-lg font-bold text-green-700">
                      {score(calculated.concentration)} / {CHILD_SCAT6_MAX.concentration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== BALANCE ===== */}
          <SectionHeader id="balance" title="Coordination and Balance Examination" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Foot Tested (non-dominant):</label>
                  <div className="flex gap-4">
                    {(['Left', 'Right'] as const).map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="footTested" value={option} checked={formData.footTested === option}
                          onChange={(e) => setFormData(prev => ({ ...prev, footTested: e.target.value as ChildSCAT6FormData['footTested'] }))} className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Testing Surface:</label>
                  <input type="text" value={formData.testingSurface}
                    onChange={(e) => setFormData(prev => ({ ...prev, testingSurface: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Footwear:</label>
                  <input type="text" value={formData.footwear}
                    onChange={(e) => setFormData(prev => ({ ...prev, footwear: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-800">Modified BESS — errors out of {CHILD_SCAT6_MAX.mBessPerStance} per stance (20 seconds each)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-600">Firm surface</p>
                  {([
                    { key: 'mBessDoubleErrors', label: 'Double Leg Stance' },
                    { key: 'mBessTandemErrors', label: 'Tandem Stance' },
                    { key: 'mBessSingleErrors', label: 'Single Leg Stance' },
                  ] as const).map(item => (
                    <div key={item.key}>
                      <label className={labelClass}>{item.label}:</label>
                      <input type="number" min="0" max={CHILD_SCAT6_MAX.mBessPerStance} value={formData[item.key] ?? ''}
                        placeholder="—"
                        onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: numOrNull(e.target.value, 0, CHILD_SCAT6_MAX.mBessPerStance) }))} className={inputClass} />
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-600">On foam (optional)</p>
                  {([
                    { key: 'mBessFoamDoubleErrors', label: 'Double Leg Stance' },
                    { key: 'mBessFoamTandemErrors', label: 'Tandem Stance' },
                    { key: 'mBessFoamSingleErrors', label: 'Single Leg Stance' },
                  ] as const).map(item => (
                    <div key={item.key}>
                      <label className={labelClass}>{item.label}:</label>
                      <input type="number" min="0" max={CHILD_SCAT6_MAX.mBessPerStance} value={formData[item.key] ?? ''}
                        placeholder="—"
                        onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: numOrNull(e.target.value, 0, CHILD_SCAT6_MAX.mBessPerStance) }))} className={inputClass} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className={scoreBoxClass}>
                  <span className="text-sm font-medium text-slate-700">mBESS Total Errors: </span>
                  <span className="text-lg font-bold text-green-700">
                    {score(calculated.mBessTotal)} / {CHILD_SCAT6_MAX.mBessTotal}
                  </span>
                </div>
                <div className={scoreBoxClass}>
                  <span className="text-sm font-medium text-slate-700">On Foam Total Errors: </span>
                  <span className="text-lg font-bold text-green-700">
                    {score(calculated.mBessFoamTotal)} / {CHILD_SCAT6_MAX.mBessTotal}
                  </span>
                </div>
              </div>

              {/* Tandem Gait */}
              <h4 className="text-sm font-bold text-slate-800 mt-4">Timed Tandem Gait (seconds)</h4>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <div>
                  <label className={labelClass}>Trial 1:</label>
                  <input type="text" value={formData.tandemGaitTrial1}
                    onChange={(e) => setFormData(prev => ({ ...prev, tandemGaitTrial1: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Trial 2:</label>
                  <input type="text" value={formData.tandemGaitTrial2}
                    onChange={(e) => setFormData(prev => ({ ...prev, tandemGaitTrial2: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Trial 3:</label>
                  <input type="text" value={formData.tandemGaitTrial3}
                    onChange={(e) => setFormData(prev => ({ ...prev, tandemGaitTrial3: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Average 3 Trials:</label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700">
                    {calculated.tandemGaitAverage || '—'}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Fastest Trial:</label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700">
                    {calculated.tandemGaitFastest || '—'}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                The average is reported only once all three trials are timed.
              </p>

              {/* Complex Tandem Gait */}
              <h4 className="text-sm font-bold text-slate-800 mt-4">Complex Tandem Gait (points: 1 per step off the line, 1 for truncal sway)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  { key: 'complexTandemForwardEyesOpen', label: 'Forward — Eyes Open' },
                  { key: 'complexTandemForwardEyesClosed', label: 'Forward — Eyes Closed' },
                  { key: 'complexTandemBackwardEyesOpen', label: 'Backward — Eyes Open' },
                  { key: 'complexTandemBackwardEyesClosed', label: 'Backward — Eyes Closed' },
                ] as const).map(item => (
                  <div key={item.key}>
                    <label className={labelClass}>{item.label}:</label>
                    <input type="number" min="0" max="20" value={formData[item.key] ?? ''}
                      placeholder="—"
                      onChange={(e) => setFormData(prev => ({ ...prev, [item.key]: numOrNull(e.target.value, 0, 20) }))} className={inputClass} />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <div className={scoreBoxClass}>
                  <span className="text-sm font-medium text-slate-700">Forward Total: </span>
                  <span className="text-lg font-bold text-green-700">{score(calculated.complexTandemForward)}</span>
                </div>
                <div className={scoreBoxClass}>
                  <span className="text-sm font-medium text-slate-700">Backward Total: </span>
                  <span className="text-lg font-bold text-green-700">{score(calculated.complexTandemBackward)}</span>
                </div>
                <div className={scoreBoxClass}>
                  <span className="text-sm font-medium text-slate-700">Total Points: </span>
                  <span className="text-lg font-bold text-green-700">{score(calculated.complexTandemTotal)}</span>
                </div>
              </div>

              {/* Trials not completed */}
              <div className="mt-4">
                <label className={labelClass}>
                  Were any single- or dual-task timed tandem gait trials not completed (walking errors or other reasons)?
                </label>
                <div className="flex gap-4 items-center">
                  {[true, false].map(val => (
                    <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="trialsNotCompleted" checked={formData.trialsNotCompleted === val}
                        onChange={() => setFormData(prev => ({ ...prev, trialsNotCompleted: val }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{val ? 'Yes' : 'No'}</span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, trialsNotCompleted: null }))}
                    disabled={formData.trialsNotCompleted === null}
                    className="text-[11px] text-slate-500 underline underline-offset-2 disabled:opacity-30 disabled:no-underline"
                  >
                    clear
                  </button>
                </div>
                {formData.trialsNotCompleted === true && (
                  <textarea value={formData.trialsNotCompletedReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, trialsNotCompletedReason: e.target.value }))}
                    className={`${inputClass} mt-2`} rows={2} placeholder="If yes, please explain why" />
                )}
              </div>
            </div>
          </SectionHeader>

          {/* ===== DELAYED RECALL ===== */}
          <SectionHeader id="delayed" title="Delayed Recall" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Perform at least 5 minutes after the end of Immediate Memory. Score 1 point for each
                correct response.
              </p>
              <div className="flex gap-4 items-center mb-3">
                <label className={labelClass}>Time started:</label>
                <input type="time" value={formData.delayedRecallStartTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, delayedRecallStartTime: e.target.value }))} className={inputClass} />
              </div>

              {formData.wordListUsed && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Words recalled (same list as Immediate Memory - List {formData.wordListUsed}):</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {WORD_LISTS[CHILD_SCAT6_WORD_LIST_SOURCE[formData.wordListUsed]].map((word, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-lg border border-slate-200 hover:bg-green-50">
                        <input
                          type="checkbox"
                          checked={formData.delayedRecall[i]}
                          onChange={() => {
                            setFormData(prev => {
                              const updated = [...prev.delayedRecall]
                              updated[i] = !updated[i]
                              return { ...prev, delayedRecall: updated }
                            })
                          }}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="text-sm">{word}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className={scoreBoxClass}>
                <span className="text-sm font-medium text-slate-700">Delayed Recall Score: </span>
                <span className="text-lg font-bold text-green-700">
                  {score(calculated.delayedRecall)} / {CHILD_SCAT6_MAX.delayedRecall}
                </span>
              </div>

              {/* Total Cognitive Score */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h4 className="text-base font-bold text-slate-800 mb-2">Cognitive Total Score</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><span className="text-slate-600">Immediate Memory:</span> <span className="font-bold">{score(calculated.immediateMemory)}/{CHILD_SCAT6_MAX.immediateMemory}</span></div>
                  <div><span className="text-slate-600">Concentration:</span> <span className="font-bold">{score(calculated.concentration)}/{CHILD_SCAT6_MAX.concentration}</span></div>
                  <div><span className="text-slate-600">Delayed Recall:</span> <span className="font-bold">{score(calculated.delayedRecall)}/{CHILD_SCAT6_MAX.delayedRecall}</span></div>
                  <div><span className="text-slate-600">Total:</span> <span className="text-lg font-bold text-green-700">{score(calculated.totalCognitive)}/{CHILD_SCAT6_MAX.cognitiveTotal}</span></div>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  The Child SCAT6 has no orientation subtest; the cognitive total is out of {CHILD_SCAT6_MAX.cognitiveTotal}
                  {' '}and is reported only when all three subtests were administered.
                </p>
              </div>
            </div>
          </SectionHeader>

          {/* ===== DISPOSITION ===== */}
          <SectionHeader id="disposition" title="Decision" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Concussion Diagnosed:</label>
                <div className="flex gap-4">
                  {(['Yes', 'No', 'Deferred'] as const).map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="concussion" value={option} checked={formData.concussionDiagnosed === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, concussionDiagnosed: e.target.value as ChildSCAT6FormData['concussionDiagnosed'] }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== HCP ATTESTATION ===== */}
          <SectionHeader id="hcp" title="Health Care Professional Attestation" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name:</label>
                <input type="text" value={formData.hcpName} onChange={(e) => setFormData(prev => ({ ...prev, hcpName: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Signature (typed):</label>
                <input type="text" value={formData.hcpSignature} onChange={(e) => setFormData(prev => ({ ...prev, hcpSignature: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Title/Speciality:</label>
                <input type="text" value={formData.hcpTitle} onChange={(e) => setFormData(prev => ({ ...prev, hcpTitle: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Registration/License Number:</label>
                <input type="text" value={formData.hcpRegistration} onChange={(e) => setFormData(prev => ({ ...prev, hcpRegistration: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date:</label>
                <input type="date" value={formData.hcpDate} onChange={(e) => setFormData(prev => ({ ...prev, hcpDate: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </SectionHeader>

          {/* ===== CLINICAL NOTES ===== */}
          <SectionHeader id="notes" title="Additional Clinical Notes" expandedSections={expandedSections} toggleSection={toggleSection}>
            <textarea
              value={formData.additionalClinicalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalClinicalNotes: e.target.value }))}
              className={inputClass}
              rows={6}
              placeholder="Enter any additional clinical observations, notes, or follow-up plans..."
            />
          </SectionHeader>

          {/* SCAT6 Mastery Upsell */}
          <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-center">
            <p className="text-sm font-semibold text-slate-900 mb-1">Want to master the SCAT6 tools?</p>
            <p className="text-xs text-slate-600 mb-3">Free course: learn proper administration, scoring, and interpretation of the SCAT6 and SCOAT6.</p>
            <Link href="/scat-mastery" className="inline-block px-4 py-2 bg-[#5b9aa6] text-white text-sm font-semibold rounded-lg hover:bg-[#4a8a96] transition-colors">
              Start Free SCAT6 Mastery Course →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
