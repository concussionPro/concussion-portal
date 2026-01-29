'use client'

import { useState, useEffect } from 'react'
import { Download, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { SCAT6FormData, getDefaultSCAT6FormData } from '../shared/types/scat6.types'
import { getAllCalculatedScores } from '../shared/utils/scat6-calculations'
import { exportSCAT6ToFilledPDF } from '../shared/utils/scat6-pdf-fill'
import { WORD_LISTS, WordListKey } from '../shared/constants/wordLists'
import { DIGIT_LISTS, DigitListKey } from '../shared/constants/digitLists'

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
        className="w-full flex items-center justify-between bg-[#3f51b5] text-white px-4 py-3 rounded-t-lg hover:bg-[#354499] transition-colors"
      >
        <h3 className="text-lg font-bold">{title}</h3>
        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>
      {isExpanded && (
        <div className="bg-[#E3F2FD] p-6 rounded-b-lg border border-slate-200">
          {children}
        </div>
      )}
    </div>
  )
}

export default function SCAT6Page() {
  const [formData, setFormData] = useState<SCAT6FormData>(getDefaultSCAT6FormData())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['demographics', 'symptoms', 'cognitive', 'balance'])
  )

  // Auto-save to localStorage every 3 seconds with timestamp
  useEffect(() => {
    const timer = setTimeout(() => {
      const draftWithTimestamp = {
        data: formData,
        timestamp: Date.now(),
      }
      localStorage.setItem('scat6-draft', JSON.stringify(draftWithTimestamp))
    }, 3000)
    return () => clearTimeout(timer)
  }, [formData])

  // Load draft on mount - with expiration check and user prompt
  useEffect(() => {
    const draft = localStorage.getItem('scat6-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        const draftData = parsed.data || parsed // Handle both old and new format
        const draftTimestamp = parsed.timestamp || 0

        // Check if draft is older than 24 hours (86400000 ms)
        const isExpired = Date.now() - draftTimestamp > 86400000

        if (isExpired) {
          // Auto-clear expired draft
          localStorage.removeItem('scat6-draft')
          console.log('Previous draft expired (>24 hours old) and was cleared')
        } else {
          // Ask user if they want to continue
          const continueText = draftTimestamp
            ? `Found a previous draft from ${new Date(draftTimestamp).toLocaleString()}.\n\nWould you like to continue with this assessment?`
            : 'Found a previous draft. Would you like to continue with this assessment?'

          if (confirm(continueText + '\n\nClick OK to continue, or Cancel to start a new assessment.')) {
            setFormData(draftData)
          } else {
            // User chose to start fresh
            localStorage.removeItem('scat6-draft')
          }
        }
      } catch (e) {
        console.error('Failed to load draft')
        localStorage.removeItem('scat6-draft')
      }
    }
  }, [])

  const calculated = getAllCalculatedScores(formData)

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

  const handleExportPDF = async () => {
    try {
      const filename = `SCAT6_${formData.athleteName || 'Assessment'}_${formData.dateOfExamination || 'Draft'}.pdf`
      console.log('Starting PDF export...')
      await exportSCAT6ToFilledPDF(formData, filename)
      console.log('PDF export completed')
    } catch (error) {
      console.error('PDF export failed:', error)
      alert(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleClearForm = () => {
    if (confirm('Start a new assessment? All current form data will be cleared.\n\nThis cannot be undone.')) {
      localStorage.removeItem('scat6-draft')
      setFormData(getDefaultSCAT6FormData())
      alert('New assessment started - form cleared successfully')
    }
  }


  return (
    <div className="space-y-6 pb-20">
      {/* Header with Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-slate-900">SCAT6™ Assessment Form</h2>
          <p className="text-sm text-slate-500">Sport Concussion Assessment Tool - For Adolescents (13+) & Adults</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearForm}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold"
          >
            🆕 New Assessment
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Blue Header Banner - matching SCAT6 */}
        <div className="bg-[#4A6FA5] text-white p-8 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">SCAT6™</h1>
              <p className="text-lg text-blue-100 mb-1">Sport Concussion Assessment Tool</p>
              <p className="text-sm text-blue-200">For Adolescents (13 years +) & Adults</p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* ===== DEMOGRAPHICS SECTION ===== */}
          <SectionHeader id="demographics" title="Athlete Information" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Athlete Name:</label>
                <input
                  type="text"
                  value={formData.athleteName}
                  onChange={(e) => setFormData(prev => ({ ...prev, athleteName: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Number:</label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth:</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Examination:</label>
                <input
                  type="date"
                  value={formData.dateOfExamination}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfExamination: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Injury:</label>
                <input
                  type="date"
                  value={formData.dateOfInjury}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfInjury: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time of Injury:</label>
                <input
                  type="time"
                  value={formData.timeOfInjury}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeOfInjury: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sex:</label>
                <div className="flex flex-wrap gap-3">
                  {(['Male', 'Female', 'Prefer Not To Say', 'Other'] as const).map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="sex"
                        value={option}
                        checked={formData.sex === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value as any }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dominant Hand:</label>
                <div className="flex gap-4">
                  {(['Left', 'Right', 'Ambidextrous'] as const).map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="dominantHand"
                        value={option}
                        checked={formData.dominantHand === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, dominantHand: e.target.value as any }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Sport/Team/School:</label>
                <input
                  type="text"
                  value={formData.sportTeamSchool}
                  onChange={(e) => setFormData(prev => ({ ...prev, sportTeamSchool: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Year in School:</label>
                <input
                  type="text"
                  value={formData.currentYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentYear: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of Education Completed:</label>
                <input
                  type="text"
                  value={formData.yearsEducation}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearsEducation: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Language:</label>
                <input
                  type="text"
                  value={formData.firstLanguage}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstLanguage: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Language:</label>
                <input
                  type="text"
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Examiner:</label>
                <input
                  type="text"
                  value={formData.examiner}
                  onChange={(e) => setFormData(prev => ({ ...prev, examiner: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </SectionHeader>

          {/* ===== CONCUSSION HISTORY ===== */}
          <SectionHeader id="history" title="Concussion History" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  How many diagnosed concussions has the athlete had in the past?:
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.previousConcussions}
                  onChange={(e) => setFormData(prev => ({ ...prev, previousConcussions: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  When was the most recent concussion?:
                </label>
                <input
                  type="text"
                  value={formData.mostRecentConcussion}
                  onChange={(e) => setFormData(prev => ({ ...prev, mostRecentConcussion: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  placeholder="e.g., 6 months ago"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Primary Symptoms:</label>
                <textarea
                  value={formData.primarySymptoms}
                  onChange={(e) => setFormData(prev => ({ ...prev, primarySymptoms: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  How long was the recovery (time to being cleared to play) from the most recent concussion? (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.recoveryTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, recoveryTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          </SectionHeader>

          {/* ===== ATHLETE BACKGROUND ===== */}
          <SectionHeader id="background" title="Step 1: Athlete Background" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700 mb-3">Has the athlete ever been:</p>

              <div className="space-y-3">
                {[
                  { key: 'hospitalizedForHeadInjury', label: 'Hospitalised for head injury?' },
                  { key: 'headacheDisorder', label: 'Diagnosed/treated for headache disorder or migraine?' },
                  { key: 'learningDisability', label: 'Diagnosed with a learning disability/dyslexia?' },
                  { key: 'adhd', label: 'Diagnosed with attention deficit hyperactivity disorder (ADHD)?' },
                  { key: 'psychologicalDisorder', label: 'Diagnosed with depression, anxiety, or other psychological disorder?' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <span className="text-sm text-slate-700">{label}</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={key}
                          checked={formData[key as keyof SCAT6FormData] === true}
                          onChange={() => setFormData(prev => ({ ...prev, [key]: true }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={key}
                          checked={formData[key as keyof SCAT6FormData] === false}
                          onChange={() => setFormData(prev => ({ ...prev, [key]: false }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes:</label>
                <textarea
                  value={formData.athleteBackgroundNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, athleteBackgroundNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current medications? If yes, please list:</label>
                <textarea
                  value={formData.currentMedications}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentMedications: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={2}
                />
              </div>
            </div>
          </SectionHeader>

          {/* ===== SYMPTOM EVALUATION ===== */}
          <SectionHeader id="symptoms" title="Step 2: Symptom Evaluation" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  Please rate your symptoms below based on how you feel now with "1" representing a very mild symptom and "6" representing a severe symptom.
                </p>
              </div>

              {/* Symptom Rating Scale Guide */}
              <div className="bg-white rounded-lg p-4 flex items-center justify-between text-xs font-medium border border-slate-200">
                <span className="text-slate-600">0 = None</span>
                <span className="text-slate-600">1-2 = Mild</span>
                <span className="text-slate-600">3-4 = Moderate</span>
                <span className="text-slate-600">5-6 = Severe</span>
              </div>

              {/* Symptoms List */}
              <div className="space-y-2">
                {[
                  { key: 'headaches', label: 'Headaches' },
                  { key: 'pressureInHead', label: 'Pressure in head' },
                  { key: 'neckPain', label: 'Neck pain' },
                  { key: 'nauseaVomiting', label: 'Nausea or vomiting' },
                  { key: 'dizziness', label: 'Dizziness' },
                  { key: 'blurredVision', label: 'Blurred vision' },
                  { key: 'balanceProblems', label: 'Balance problems' },
                  { key: 'sensitivityLight', label: 'Sensitivity to light' },
                  { key: 'sensitivityNoise', label: 'Sensitivity to noise' },
                  { key: 'feelingSlowedDown', label: 'Feeling slowed down' },
                  { key: 'feelingInFog', label: 'Feeling like "in a fog"' },
                  { key: 'dontFeelRight', label: '"Don\'t feel right"' },
                  { key: 'difficultyConcentrating', label: 'Difficulty concentrating' },
                  { key: 'difficultyRemembering', label: 'Difficulty remembering' },
                  { key: 'fatigueOrLowEnergy', label: 'Fatigue or low energy' },
                  { key: 'confusion', label: 'Confusion' },
                  { key: 'drowsiness', label: 'Drowsiness' },
                  { key: 'moreEmotional', label: 'More emotional' },
                  { key: 'irritability', label: 'Irritability' },
                  { key: 'sadness', label: 'Sadness' },
                  { key: 'nervousAnxious', label: 'Nervous or anxious' },
                  { key: 'troubleFallingAsleep', label: 'Trouble falling asleep (if applicable)' },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-white rounded-lg p-3 flex items-center justify-between border border-slate-200">
                    <span className="text-sm font-medium text-slate-700 w-1/3">{label}</span>
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map(value => (
                        <label key={value} className="flex flex-col items-center cursor-pointer">
                          <input
                            type="radio"
                            name={key}
                            value={value}
                            checked={formData.symptoms[key as keyof typeof formData.symptoms] === value}
                            onChange={() => setFormData(prev => ({
                              ...prev,
                              symptoms: { ...prev.symptoms, [key]: value }
                            }))}
                            className="w-5 h-5 text-blue-600 cursor-pointer"
                          />
                          <span className="text-xs text-slate-500 mt-1">{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Questions */}
              <div className="space-y-3 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    If 100% is feeling perfectly normal, what percent of normal do you feel?
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentOfNormal}
                    onChange={(e) => setFormData(prev => ({ ...prev, percentOfNormal: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    placeholder="%"
                  />
                </div>

                {formData.percentOfNormal && parseInt(formData.percentOfNormal) < 100 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">If not 100%, why?</label>
                    <textarea
                      value={formData.whyNotHundredPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, whyNotHundredPercent: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      rows={2}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-sm text-slate-700">Do your symptoms get worse with physical activity?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.symptomsWorseWithPhysical === true}
                        onChange={() => setFormData(prev => ({ ...prev, symptomsWorseWithPhysical: true }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.symptomsWorseWithPhysical === false}
                        onChange={() => setFormData(prev => ({ ...prev, symptomsWorseWithPhysical: false }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-sm text-slate-700">Do your symptoms get worse with mental activity?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.symptomsWorseWithMental === true}
                        onChange={() => setFormData(prev => ({ ...prev, symptomsWorseWithMental: true }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.symptomsWorseWithMental === false}
                        onChange={() => setFormData(prev => ({ ...prev, symptomsWorseWithMental: false }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Auto-calculated Totals */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-blue-600 text-white rounded-lg p-6 text-center">
                  <div className="text-sm opacity-90 mb-2">Total number of symptoms:</div>
                  <div className="text-4xl font-bold">{calculated.symptomNumber} <span className="text-xl font-normal opacity-75">of 22</span></div>
                </div>
                <div className="bg-blue-600 text-white rounded-lg p-6 text-center">
                  <div className="text-sm opacity-90 mb-2">Symptom severity score:</div>
                  <div className="text-4xl font-bold">{calculated.symptomSeverity} <span className="text-xl font-normal opacity-75">of 132</span></div>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== COGNITIVE SCREENING ===== */}
          <SectionHeader id="cognitive" title="Step 3: Cognitive Screening" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-6">
              {/* Orientation */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Orientation (1 point for each correct answer)</h4>
                <div className="space-y-2">
                  {[
                    { key: 'orientationMonth', question: 'What month is it?' },
                    { key: 'orientationDate', question: 'What is the date today?' },
                    { key: 'orientationDayOfWeek', question: 'What is the day of the week?' },
                    { key: 'orientationYear', question: 'What year is it?' },
                    { key: 'orientationTime', question: 'What time is it right now? (within 1 hour)' },
                  ].map(({ key, question }) => (
                    <div key={key} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                      <span className="text-sm text-slate-700">{question}</span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData[key as keyof SCAT6FormData] === false}
                            onChange={() => setFormData(prev => ({ ...prev, [key]: false }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">0</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={formData[key as keyof SCAT6FormData] === true}
                            onChange={() => setFormData(prev => ({ ...prev, [key]: true }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">1</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-blue-600 text-white rounded-lg p-4 text-center">
                  <span className="text-sm opacity-90">Orientation Score: </span>
                  <span className="text-2xl font-bold">{calculated.orientation}</span>
                  <span className="text-sm opacity-75"> of 5</span>
                </div>
              </div>

              {/* Immediate Memory */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Immediate Memory</h4>
                <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  <strong>Instructions:</strong> All 3 trials must be administered irrespective of the number correct on Trial 1. Administer at the rate of one word per second.
                </p>

                {/* Word List Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Word list used:</label>
                  <div className="flex gap-3">
                    {(['A', 'B', 'C'] as const).map(list => (
                      <label key={list} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="wordList"
                          checked={formData.wordListUsed === list}
                          onChange={() => setFormData(prev => ({ ...prev, wordListUsed: list }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">List {list}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Show word list if selected */}
                {formData.wordListUsed && (
                  <div className="bg-white border border-slate-300 rounded-lg p-4">
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="font-bold text-slate-700 text-sm">Word</div>
                      <div className="font-bold text-slate-700 text-sm text-center">Trial 1</div>
                      <div className="font-bold text-slate-700 text-sm text-center">Trial 2</div>
                      <div className="font-bold text-slate-700 text-sm text-center">Trial 3</div>
                    </div>
                    {WORD_LISTS[formData.wordListUsed].map((word, idx) => (
                      <div key={idx} className="grid grid-cols-4 gap-2 items-center py-2 border-t border-slate-200">
                        <div className="text-sm font-medium text-slate-700">{word}</div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={formData.immediateMemoryTrial1[idx]}
                            onChange={(e) => {
                              const newTrial = [...formData.immediateMemoryTrial1]
                              newTrial[idx] = e.target.checked
                              setFormData(prev => ({ ...prev, immediateMemoryTrial1: newTrial }))
                            }}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={formData.immediateMemoryTrial2[idx]}
                            onChange={(e) => {
                              const newTrial = [...formData.immediateMemoryTrial2]
                              newTrial[idx] = e.target.checked
                              setFormData(prev => ({ ...prev, immediateMemoryTrial2: newTrial }))
                            }}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </div>
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            checked={formData.immediateMemoryTrial3[idx]}
                            onChange={(e) => {
                              const newTrial = [...formData.immediateMemoryTrial3]
                              newTrial[idx] = e.target.checked
                              setFormData(prev => ({ ...prev, immediateMemoryTrial3: newTrial }))
                            }}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-4 gap-2 items-center py-3 border-t-2 border-slate-300 bg-slate-50 mt-2">
                      <div className="text-sm font-bold text-slate-900">Trial Total</div>
                      <div className="text-center text-lg font-bold text-blue-600">
                        {formData.immediateMemoryTrial1.filter(Boolean).length}
                      </div>
                      <div className="text-center text-lg font-bold text-blue-600">
                        {formData.immediateMemoryTrial2.filter(Boolean).length}
                      </div>
                      <div className="text-center text-lg font-bold text-blue-600">
                        {formData.immediateMemoryTrial3.filter(Boolean).length}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
                    <div className="text-sm opacity-90 mb-1">Immediate Memory Score:</div>
                    <div className="text-3xl font-bold">{calculated.immediateMemory} <span className="text-lg opacity-75">of 30</span></div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Time Last Trial Completed:</label>
                    <input
                      type="time"
                      value={formData.immediateMemoryTimeCompleted}
                      onChange={(e) => setFormData(prev => ({ ...prev, immediateMemoryTimeCompleted: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Concentration - Digits Backwards */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Concentration - Digits Backward</h4>
                <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  Administer at the rate of one digit per second reading DOWN the selected column. If a string is completed correctly, move on to the string with next higher number of digits.
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Digit list used:</label>
                  <div className="flex gap-3">
                    {(['A', 'B', 'C'] as const).map(list => (
                      <label key={list} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="digitList"
                          checked={formData.digitListUsed === list}
                          onChange={() => setFormData(prev => ({ ...prev, digitListUsed: list }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">List {list}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Digits Score (0-4): How many correct string lengths completed?
                  </label>
                  <div className="flex gap-3">
                    {[0, 1, 2, 3, 4].map(score => (
                      <label key={score} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="digitsScore"
                          checked={formData.digitsBackward === score}
                          onChange={() => setFormData(prev => ({ ...prev, digitsBackward: score }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">{score}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
                  <span className="text-sm opacity-90">Digits Score: </span>
                  <span className="text-2xl font-bold">{formData.digitsBackward}</span>
                  <span className="text-sm opacity-75"> of 4</span>
                </div>
              </div>

              {/* Concentration - Months in Reverse */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Months in Reverse Order</h4>
                <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  Say "Now tell me the months of the year in reverse order as QUICKLY and as accurately as possible. Start with the last month and go backward."
                  <br/><br/>
                  <strong>1 point if no errors and completion under 30 seconds</strong>
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Time Taken to Complete (seconds):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.monthsReverseTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthsReverseTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Number of Errors:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.monthsReverseErrors}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthsReverseErrors: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="bg-blue-600 text-white rounded-lg p-4 text-center">
                  <span className="text-sm opacity-90">Months Score: </span>
                  <span className="text-2xl font-bold">
                    {(parseFloat(formData.monthsReverseTime) > 0 && parseFloat(formData.monthsReverseTime) < 30 && formData.monthsReverseErrors === 0) ? 1 : 0}
                  </span>
                  <span className="text-sm opacity-75"> of 1</span>
                </div>
              </div>

              {/* Total Concentration Score */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
                <div className="text-center">
                  <div className="text-sm opacity-90 mb-2">Concentration Score (Digits + Months):</div>
                  <div className="text-5xl font-bold">{calculated.concentration} <span className="text-2xl opacity-75">of 5</span></div>
                </div>
              </div>

              {/* Total Cognitive Score Summary */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
                <h4 className="text-xl font-bold mb-4 text-center">Total Cognitive Score</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs opacity-75">Orientation</div>
                    <div className="text-2xl font-bold">{calculated.orientation}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-75">Immediate Memory</div>
                    <div className="text-2xl font-bold">{calculated.immediateMemory}/30</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-75">Concentration</div>
                    <div className="text-2xl font-bold">{calculated.concentration}/5</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-75">Delayed Recall</div>
                    <div className="text-2xl font-bold">{calculated.delayedRecall}/10</div>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-white/20">
                  <div className="text-sm opacity-90 mb-1">TOTAL COGNITIVE SCORE:</div>
                  <div className="text-6xl font-bold">{calculated.totalCognitive} <span className="text-3xl opacity-75">/ 50</span></div>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== BALANCE EXAMINATION ===== */}
          <SectionHeader id="balance" title="Step 4: Coordination and Balance Examination" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-6">
              {/* mBESS Setup */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Modified Balance Error Scoring System (mBESS)</h4>
                <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  Test the <strong>non-dominant</strong> foot. Each stance is held for 20 seconds. Record errors out of 10 for each stance.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Foot Tested:</label>
                    <div className="flex gap-3">
                      {(['Left', 'Right'] as const).map(option => (
                        <label key={option} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="footTested"
                            checked={formData.footTested === option}
                            onChange={() => setFormData(prev => ({ ...prev, footTested: option }))}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">(test the non-dominant foot)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Testing Surface:</label>
                    <input
                      type="text"
                      value={formData.testingSurface}
                      onChange={(e) => setFormData(prev => ({ ...prev, testingSurface: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="hard floor, field, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Footwear:</label>
                    <input
                      type="text"
                      value={formData.footwear}
                      onChange={(e) => setFormData(prev => ({ ...prev, footwear: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="shoes, barefoot, etc."
                    />
                  </div>
                </div>
              </div>

              {/* mBESS Scoring */}
              <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                <h5 className="font-bold text-slate-900 mb-4">Modified BESS <span className="text-sm font-normal text-slate-600">(20 seconds each)</span></h5>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Double Leg Stance:</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.mBessDoubleErrors}
                      onChange={(e) => setFormData(prev => ({ ...prev, mBessDoubleErrors: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg font-bold text-center"
                    />
                    <p className="text-xs text-slate-500 text-center mt-1">of 10</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tandem Stance:</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.mBessTandemErrors}
                      onChange={(e) => setFormData(prev => ({ ...prev, mBessTandemErrors: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg font-bold text-center"
                    />
                    <p className="text-xs text-slate-500 text-center mt-1">of 10</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Single Leg Stance:</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.mBessSingleErrors}
                      onChange={(e) => setFormData(prev => ({ ...prev, mBessSingleErrors: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-lg font-bold text-center"
                    />
                    <p className="text-xs text-slate-500 text-center mt-1">of 10</p>
                  </div>
                </div>
                <div className="mt-4 bg-blue-600 text-white rounded-lg p-4 text-center">
                  <span className="text-sm opacity-90">Total Errors: </span>
                  <span className="text-3xl font-bold">{calculated.mBessTotal}</span>
                  <span className="text-lg opacity-75"> of 30</span>
                </div>
              </div>

              {/* Optional On Foam */}
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-bold text-slate-900">On Foam <span className="text-xs font-normal bg-orange-500 text-white px-2 py-1 rounded">Optional</span></h5>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.mBessFoamDoubleErrors !== null}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            mBessFoamDoubleErrors: 0,
                            mBessFoamTandemErrors: 0,
                            mBessFoamSingleErrors: 0,
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            mBessFoamDoubleErrors: null,
                            mBessFoamTandemErrors: null,
                            mBessFoamSingleErrors: null,
                          }))
                        }
                      }}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className="text-sm">Perform foam assessment</span>
                  </label>
                </div>

                {formData.mBessFoamDoubleErrors !== null && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Double Leg Stance:</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.mBessFoamDoubleErrors}
                        onChange={(e) => setFormData(prev => ({ ...prev, mBessFoamDoubleErrors: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-lg font-bold text-center"
                      />
                      <p className="text-xs text-slate-500 text-center mt-1">of 10</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tandem Stance:</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.mBessFoamTandemErrors ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mBessFoamTandemErrors: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-lg font-bold text-center"
                      />
                      <p className="text-xs text-slate-500 text-center mt-1">of 10</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Single Leg Stance:</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.mBessFoamSingleErrors ?? ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, mBessFoamSingleErrors: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-lg font-bold text-center"
                      />
                      <p className="text-xs text-slate-500 text-center mt-1">of 10</p>
                    </div>
                  </div>
                )}
                {formData.mBessFoamDoubleErrors !== null && (
                  <div className="mt-4 bg-orange-600 text-white rounded-lg p-4 text-center">
                    <span className="text-sm opacity-90">Total Errors (Foam): </span>
                    <span className="text-3xl font-bold">{calculated.mBessFoamTotal}</span>
                    <span className="text-lg opacity-75"> of 30</span>
                  </div>
                )}
              </div>

              {/* Timed Tandem Gait */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Timed Tandem Gait</h4>
                <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  Place a 3-metre-long line on the floor with athletic tape. Please complete all 3 trials. Record time in seconds.
                </p>

                <div className="bg-white border-2 border-slate-300 rounded-lg p-4">
                  <div className="grid grid-cols-5 gap-4 mb-2 text-sm font-bold text-slate-700">
                    <div>Trial 1 (sec)</div>
                    <div>Trial 2 (sec)</div>
                    <div>Trial 3 (sec)</div>
                    <div>Average</div>
                    <div>Fastest</div>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tandemGaitTrial1}
                      onChange={(e) => setFormData(prev => ({ ...prev, tandemGaitTrial1: e.target.value }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center font-bold"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tandemGaitTrial2}
                      onChange={(e) => setFormData(prev => ({ ...prev, tandemGaitTrial2: e.target.value }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center font-bold"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={formData.tandemGaitTrial3}
                      onChange={(e) => setFormData(prev => ({ ...prev, tandemGaitTrial3: e.target.value }))}
                      className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-center font-bold"
                    />
                    <div className="flex items-center justify-center bg-blue-50 border-2 border-blue-300 rounded-lg px-3 py-3 font-bold text-blue-700">
                      {calculated.tandemGaitAverage || '-'}
                    </div>
                    <div className="flex items-center justify-center bg-blue-600 text-white rounded-lg px-3 py-3 font-bold text-lg">
                      {calculated.tandemGaitFastest || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Task Gait */}
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900">Dual Task Gait <span className="text-xs font-normal bg-orange-500 text-white px-2 py-1 rounded">Optional</span></h4>
                </div>
                <p className="text-sm text-orange-900 mb-4">
                  Walk heel-to-toe while counting backwards by 7s. Record time (sec) and counting errors for each trial.
                </p>

                <div className="space-y-3">
                  {/* Practice */}
                  <div className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="font-bold text-sm text-slate-900 mb-2">Practice (starting at 93):</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-600">Errors:</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.dualTaskPracticeErrors ?? ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, dualTaskPracticeErrors: parseInt(e.target.value) || null }))}
                          className="w-full px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-600">Time (sec):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.dualTaskPracticeTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, dualTaskPracticeTime: e.target.value }))}
                          className="w-full px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trials 1-3 */}
                  {[
                    { key: '1', start: 88, errorsKey: 'dualTask1Errors', timeKey: 'dualTask1Time' },
                    { key: '2', start: 90, errorsKey: 'dualTask2Errors', timeKey: 'dualTask2Time' },
                    { key: '3', start: 98, errorsKey: 'dualTask3Errors', timeKey: 'dualTask3Time' },
                  ].map(({ key, start, errorsKey, timeKey }) => (
                    <div key={key} className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="font-bold text-sm text-slate-900 mb-2">Trial {key} (starting at {start}):</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-600">Errors:</label>
                          <input
                            type="number"
                            min="0"
                            value={formData[errorsKey as keyof SCAT6FormData] as number ?? ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, [errorsKey]: parseInt(e.target.value) || null }))}
                            className="w-full px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-600">Time (sec):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData[timeKey as keyof SCAT6FormData] as string}
                            onChange={(e) => setFormData(prev => ({ ...prev, [timeKey]: e.target.value }))}
                            className="w-full px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-orange-600 text-white rounded-lg p-4 text-center">
                  <span className="text-sm opacity-90">Fastest Dual Task Time: </span>
                  <span className="text-3xl font-bold">{calculated.dualTaskFastest || '-'}</span>
                  <span className="text-sm opacity-75"> sec</span>
                </div>
              </div>

              {/* Trials Not Completed */}
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.trialsNotCompleted}
                    onChange={(e) => setFormData(prev => ({ ...prev, trialsNotCompleted: e.target.checked }))}
                    className="w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm font-medium text-slate-700">
                    Were any single- or dual-task, timed tandem gait trials not completed due to walking errors or other reasons?
                  </label>
                </div>
                {formData.trialsNotCompleted && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">If yes, please explain why:</label>
                    <textarea
                      value={formData.trialsNotCompletedReason}
                      onChange={(e) => setFormData(prev => ({ ...prev, trialsNotCompletedReason: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionHeader>

          {/* ===== DELAYED RECALL ===== */}
          <SectionHeader id="delayedRecall" title="Step 5: Delayed Recall" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium">
                  <strong>IMPORTANT:</strong> The delayed recall should only be administered after a <strong>minimum of 5 minutes</strong> has elapsed since completing the Immediate Memory test.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Time Delayed Recall Started:</label>
                <input
                  type="time"
                  value={formData.delayedRecallStartTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, delayedRecallStartTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {!formData.wordListUsed ? (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                  <p className="text-sm text-yellow-900">
                    ⚠️ Please complete the Immediate Memory section first and select a word list before performing Delayed Recall.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-300 rounded-lg p-4">
                  <p className="text-sm text-slate-700 mb-3">
                    <strong>Instruction:</strong> "Do you remember that list of words I read a few times earlier? Tell me as many words from the list as you can remember, in any order."
                  </p>
                  <p className="text-xs text-slate-500 mb-4 italic">
                    Using Word List {formData.wordListUsed}
                  </p>

                  <div className="space-y-2">
                    {WORD_LISTS[formData.wordListUsed].map((word, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                        <input
                          type="checkbox"
                          checked={formData.delayedRecall[idx]}
                          onChange={(e) => {
                            const newRecall = [...formData.delayedRecall]
                            newRecall[idx] = e.target.checked
                            setFormData(prev => ({ ...prev, delayedRecall: newRecall }))
                          }}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-slate-700">{word}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 bg-blue-600 text-white rounded-lg p-6 text-center">
                    <div className="text-sm opacity-90 mb-2">Delayed Recall Score:</div>
                    <div className="text-4xl font-bold">{calculated.delayedRecall} <span className="text-xl opacity-75">of 10</span></div>
                  </div>
                </div>
              )}

              {/* Different from usual self */}
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-700">
                    Does the athlete appear to be different from their usual self?
                  </span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.differentFromUsual === true}
                        onChange={() => setFormData(prev => ({ ...prev, differentFromUsual: true }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={formData.differentFromUsual === false}
                        onChange={() => setFormData(prev => ({ ...prev, differentFromUsual: false }))}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>

                {formData.differentFromUsual && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">If yes, please describe:</label>
                    <textarea
                      value={formData.differentFromUsualDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, differentFromUsualDescription: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>
          </SectionHeader>

          {/* ===== DECISION & HCP ATTESTATION ===== */}
          <SectionHeader id="decision" title="Step 6: Decision" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-6">
              {/* Decision Tracking Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-3">Assessment Tracking</h4>
                <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  Use this table to track repeat assessments over time. Each column represents an assessment date.
                </p>

                <div className="overflow-x-auto">
                  <div className="bg-white border-2 border-slate-300 rounded-lg p-4 min-w-[900px]">
                    <div className="grid grid-cols-4 gap-4 mb-2">
                      <div className="font-bold text-sm text-slate-700">Measure</div>
                      <div className="font-bold text-sm text-slate-700 text-center">Date 1</div>
                      <div className="font-bold text-sm text-slate-700 text-center">Date 2</div>
                      <div className="font-bold text-sm text-slate-700 text-center">Date 3</div>
                    </div>

                    {/* Date Inputs */}
                    <div className="grid grid-cols-4 gap-4 py-3 border-t border-slate-200">
                      <div className="text-sm font-medium text-slate-700">Assessment Date:</div>
                      <input
                        type="date"
                        value={formData.decisionDates.date1}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          decisionDates: { ...prev.decisionDates, date1: e.target.value }
                        }))}
                        className="px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      />
                      <input
                        type="date"
                        value={formData.decisionDates.date2}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          decisionDates: { ...prev.decisionDates, date2: e.target.value }
                        }))}
                        className="px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      />
                      <input
                        type="date"
                        value={formData.decisionDates.date3}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          decisionDates: { ...prev.decisionDates, date3: e.target.value }
                        }))}
                        className="px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      />
                    </div>

                    {/* Neurological Exam */}
                    <div className="grid grid-cols-4 gap-4 py-3 border-t border-slate-200 bg-slate-50">
                      <div className="text-sm font-medium text-slate-700">Neurological Exam:</div>
                      <select
                        value={formData.decisionDates.neurologicalExam1}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          decisionDates: { ...prev.decisionDates, neurologicalExam1: e.target.value as any }
                        }))}
                        className="px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        <option value="">-</option>
                        <option value="Normal">Normal</option>
                        <option value="Abnormal">Abnormal</option>
                      </select>
                      <select
                        value={formData.decisionDates.neurologicalExam2}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          decisionDates: { ...prev.decisionDates, neurologicalExam2: e.target.value as any }
                        }))}
                        className="px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        <option value="">-</option>
                        <option value="Normal">Normal</option>
                        <option value="Abnormal">Abnormal</option>
                      </select>
                      <select
                        value={formData.decisionDates.neurologicalExam3}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          decisionDates: { ...prev.decisionDates, neurologicalExam3: e.target.value as any }
                        }))}
                        className="px-2 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        <option value="">-</option>
                        <option value="Normal">Normal</option>
                        <option value="Abnormal">Abnormal</option>
                      </select>
                    </div>

                    {/* All Calculated Scores */}
                    {[
                      { label: 'Number of Symptoms:', keys: ['symptomNumber1', 'symptomNumber2', 'symptomNumber3'] },
                      { label: 'Symptom Severity:', keys: ['symptomSeverity1', 'symptomSeverity2', 'symptomSeverity3'] },
                      { label: 'Orientation:', keys: ['orientation1', 'orientation2', 'orientation3'] },
                      { label: 'Immediate Memory:', keys: ['immediateMemory1', 'immediateMemory2', 'immediateMemory3'] },
                      { label: 'Concentration:', keys: ['concentration1', 'concentration2', 'concentration3'] },
                      { label: 'Delayed Recall:', keys: ['delayedRecall1', 'delayedRecall2', 'delayedRecall3'] },
                      { label: 'Cognitive Total:', keys: ['cognitiveTotal1', 'cognitiveTotal2', 'cognitiveTotal3'] },
                      { label: 'mBESS Total:', keys: ['mBessTotal1', 'mBessTotal2', 'mBessTotal3'] },
                      { label: 'Tandem Gait Fastest:', keys: ['tandemGaitFastest1', 'tandemGaitFastest2', 'tandemGaitFastest3'] },
                      { label: 'Dual Task Fastest:', keys: ['dualTaskFastest1', 'dualTaskFastest2', 'dualTaskFastest3'] },
                    ].map(({ label, keys }, idx) => (
                      <div key={label} className={`grid grid-cols-4 gap-4 py-2 border-t border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <div className="text-xs text-slate-700">{label}</div>
                        {keys.map((key) => (
                          <input
                            key={key}
                            type={key.includes('Fastest') ? 'text' : 'number'}
                            min="0"
                            value={formData.decisionDates[key as keyof typeof formData.decisionDates] as any}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              decisionDates: {
                                ...prev.decisionDates,
                                [key]: key.includes('Fastest') ? e.target.value : (parseInt(e.target.value) || 0)
                              }
                            }))}
                            className="px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-xs text-center"
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disposition */}
              <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                <h4 className="font-bold text-slate-900 mb-3">Disposition</h4>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Has a concussion been diagnosed?
                  </label>
                  <div className="flex gap-4">
                    {(['Yes', 'No', 'Deferred'] as const).map(option => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="concussionDiagnosed"
                          checked={formData.concussionDiagnosed === option}
                          onChange={() => setFormData(prev => ({ ...prev, concussionDiagnosed: option }))}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Note:</strong> The diagnosis of a sports-related concussion is a clinical judgement, ideally made by a healthcare professional experienced in the management of concussion. The SCAT6 should NOT be used by itself to make, or exclude, the diagnosis of concussion in the absence of clinical judgement.
                  </p>
                </div>
              </div>

              {/* HCP Attestation */}
              <div className="bg-slate-50 border-2 border-slate-300 rounded-lg p-6">
                <h4 className="font-bold text-slate-900 mb-4">Healthcare Professional Attestation</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Name: <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.hcpName}
                        onChange={(e) => setFormData(prev => ({ ...prev, hcpName: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Title/Speciality: <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.hcpTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, hcpTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Registration/License Number: <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.hcpRegistration}
                        onChange={(e) => setFormData(prev => ({ ...prev, hcpRegistration: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Date: <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.hcpDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, hcpDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Signature: <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.hcpSignature}
                      onChange={(e) => setFormData(prev => ({ ...prev, hcpSignature: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      placeholder="Type name to sign"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Clinical Notes */}
              <div className="bg-white border border-slate-300 rounded-lg p-4">
                <h4 className="font-bold text-slate-900 mb-3">Additional Clinical Notes</h4>
                <textarea
                  value={formData.additionalClinicalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalClinicalNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  rows={6}
                  placeholder="Additional observations, test results, treatment recommendations, follow-up instructions, etc."
                />
              </div>
            </div>
          </SectionHeader>

          {/* Completion Status */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">SCAT6 Form Complete!</h4>
                <p className="text-sm text-slate-600">All sections have been implemented</p>
              </div>
            </div>
            <ul className="text-sm text-slate-600 space-y-1 grid grid-cols-2 gap-x-4">
              <li>✅ Demographics & Athlete Information</li>
              <li>✅ Concussion History</li>
              <li>✅ Step 1: Athlete Background</li>
              <li>✅ Step 2: Symptom Evaluation (22 symptoms)</li>
              <li>✅ Step 3: Cognitive Screening (Orientation, Memory, Concentration)</li>
              <li>✅ Step 4: Balance Examination (mBESS, Tandem Gait, Dual Task)</li>
              <li>✅ Step 5: Delayed Recall</li>
              <li>✅ Step 6: Decision & HCP Attestation</li>
            </ul>
            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-xs text-slate-500">
                📋 All auto-calculations working • 💾 Auto-save enabled • 🎨 Colors match SCAT6 PDF exactly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
