'use client'

import { useState, useEffect } from 'react'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'
import { ChildSCAT6FormData, getDefaultChildSCAT6FormData } from '../shared/types/child-scat6.types'
import { getAllCalculatedScores } from '../shared/utils/child-scat6-calculations'
import { exportChildSCAT6ToFlatPDF } from '../shared/utils/child-scat6-pdf-flat'
import { WORD_LISTS, WordListKey } from '../shared/constants/wordLists'
import { DIGIT_LISTS, DigitListKey } from '../shared/constants/digitLists'
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

export default function ChildSCAT6Page() {
  const [formData, setFormData] = useState<ChildSCAT6FormData>(getDefaultChildSCAT6FormData())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['demographics', 'childSymptoms', 'cognitive', 'balance'])
  )
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showEmailGate, setShowEmailGate] = useState(false)

  // Check auth status on mount
  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.success && data?.user) setIsAuthenticated(true) })
      .catch(() => {})
  }, [])

  // Auto-save to localStorage every 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      const draftWithTimestamp = {
        data: formData,
        timestamp: Date.now(),
      }
      localStorage.setItem('child-scat6-draft', JSON.stringify(draftWithTimestamp))
    }, 3000)
    return () => clearTimeout(timer)
  }, [formData])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('child-scat6-draft')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        const draftData = parsed.data || parsed
        const draftTimestamp = parsed.timestamp || 0
        const isExpired = Date.now() - draftTimestamp > 86400000

        if (isExpired) {
          localStorage.removeItem('child-scat6-draft')
        } else {
          const continueText = draftTimestamp
            ? `Found a previous draft from ${new Date(draftTimestamp).toLocaleString()}.\n\nWould you like to continue with this assessment?`
            : 'Found a previous draft. Would you like to continue with this assessment?'

          if (confirm(continueText + '\n\nClick OK to continue, or Cancel to start a new assessment.')) {
            setFormData(draftData)
          } else {
            localStorage.removeItem('child-scat6-draft')
          }
        }
      } catch (e) {
        console.error('Failed to load draft')
        localStorage.removeItem('child-scat6-draft')
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

  // Child symptom display names
  const childSymptomLabels: { key: keyof ChildSCAT6FormData['childSymptoms']; label: string }[] = [
    { key: 'headache', label: 'I have a headache' },
    { key: 'pressureInHead', label: 'I feel pressure in my head' },
    { key: 'neckPain', label: 'My neck hurts' },
    { key: 'feelingSickOrNausea', label: 'I feel sick to my stomach' },
    { key: 'dizziness', label: 'I feel dizzy' },
    { key: 'blurredVision', label: 'I have blurry eyes' },
    { key: 'balanceProblems', label: 'I have trouble with my balance' },
    { key: 'sensitivityLight', label: 'Lights bother me' },
    { key: 'sensitivityNoise', label: 'Noise bothers me' },
    { key: 'feelingSlowedDown', label: 'I feel slowed down' },
    { key: 'feelingInFog', label: 'I feel like I\'m "in a fog"' },
    { key: 'dontFeelRight', label: 'I don\'t feel right' },
    { key: 'difficultyConcentrating', label: 'It is hard to pay attention' },
    { key: 'difficultyRemembering', label: 'I forget things' },
    { key: 'tiredOrLowEnergy', label: 'I feel tired' },
    { key: 'confused', label: 'I get confused' },
    { key: 'drowsy', label: 'I feel drowsy' },
    { key: 'moreEmotional', label: 'I feel more emotional' },
    { key: 'irritable', label: 'I feel grumpy' },
    { key: 'sad', label: 'I feel sad' },
    { key: 'nervousOrAnxious', label: 'I feel nervous or worried' },
  ]

  const parentSymptomLabels: { key: keyof ChildSCAT6FormData['parentSymptoms']; label: string }[] = [
    { key: 'headache', label: 'Headache' },
    { key: 'pressureInHead', label: 'Pressure in head' },
    { key: 'neckPain', label: 'Neck pain' },
    { key: 'sickOrNausea', label: 'Nausea / vomiting' },
    { key: 'dizziness', label: 'Dizziness' },
    { key: 'blurredVision', label: 'Blurred vision' },
    { key: 'balanceProblems', label: 'Balance problems' },
    { key: 'sensitivityLight', label: 'Sensitivity to light' },
    { key: 'sensitivityNoise', label: 'Sensitivity to noise' },
    { key: 'feelingSlowedDown', label: 'Feeling slowed down' },
    { key: 'feelingInFog', label: 'Feeling like "in a fog"' },
    { key: 'doesntFeelRight', label: 'Doesn\'t feel right' },
    { key: 'difficultyConcentrating', label: 'Difficulty concentrating' },
    { key: 'difficultyRemembering', label: 'Difficulty remembering' },
    { key: 'tiredOrLowEnergy', label: 'Fatigue / low energy' },
    { key: 'confused', label: 'Confusion' },
    { key: 'drowsy', label: 'Drowsiness' },
    { key: 'moreEmotional', label: 'More emotional' },
    { key: 'irritable', label: 'Irritability' },
    { key: 'sad', label: 'Sadness' },
    { key: 'nervousOrAnxious', label: 'Nervous / anxious' },
  ]

  const ratingLabels = ['Not at all', 'A little bit', 'Somewhat', 'A lot']

  return (
    <div className="space-y-6 pb-20">
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
          <p className="text-sm text-slate-500">Sport Concussion Assessment Tool - For Children Aged 5-12</p>
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
              <p className="text-sm text-green-200">For Children Aged 5–12 Years</p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-white"></div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* ===== DEMOGRAPHICS ===== */}
          <SectionHeader id="demographics" title="Athlete Information" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Athlete Name:</label>
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
                  {(['Male', 'Female', 'Prefer Not To Say', 'Other'] as const).map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="sex" value={option} checked={formData.sex === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value as any }))} className="w-4 h-4 text-green-600" />
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
                        onChange={(e) => setFormData(prev => ({ ...prev, dominantHand: e.target.value as any }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Sport/Team/School:</label>
                <input type="text" value={formData.sportTeamSchool} onChange={(e) => setFormData(prev => ({ ...prev, sportTeamSchool: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Current Year in School:</label>
                <input type="text" value={formData.currentYear} onChange={(e) => setFormData(prev => ({ ...prev, currentYear: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Years of Education:</label>
                <input type="text" value={formData.yearsEducation} onChange={(e) => setFormData(prev => ({ ...prev, yearsEducation: e.target.value }))} className={inputClass} />
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
                <label className={labelClass}>How many diagnosed concussions has the child had?</label>
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
                <label className={labelClass}>Typical recovery time:</label>
                <input type="text" value={formData.recoveryTime} onChange={(e) => setFormData(prev => ({ ...prev, recoveryTime: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </SectionHeader>

          {/* ===== ATHLETE BACKGROUND ===== */}
          <SectionHeader id="background" title="Athlete Background" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 font-medium">Has the child ever:</p>
              {[
                { key: 'hospitalizedForHeadInjury' as const, label: 'Been hospitalized for a head injury?' },
                { key: 'headacheDisorder' as const, label: 'Been diagnosed with headache disorder?' },
                { key: 'learningDisability' as const, label: 'Been diagnosed with a learning disability?' },
                { key: 'adhd' as const, label: 'Been diagnosed with ADHD?' },
                { key: 'psychologicalDisorder' as const, label: 'Been diagnosed with a psychological disorder?' },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-4">
                  <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                  <div className="flex gap-4">
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
                  </div>
                </div>
              ))}
              <div>
                <label className={labelClass}>Notes:</label>
                <textarea value={formData.athleteBackgroundNotes} onChange={(e) => setFormData(prev => ({ ...prev, athleteBackgroundNotes: e.target.value }))} className={inputClass} rows={2} />
              </div>
              <div>
                <label className={labelClass}>Current Medications:</label>
                <textarea value={formData.currentMedications} onChange={(e) => setFormData(prev => ({ ...prev, currentMedications: e.target.value }))} className={inputClass} rows={2} />
              </div>
            </div>
          </SectionHeader>

          {/* ===== CHILD SYMPTOM REPORT ===== */}
          <SectionHeader id="childSymptoms" title="Child Symptom Report (0-3 Scale)" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 mb-4">Ask the child: "Do you have any of these problems right now?" Rate each: <strong>Not at all (0), A little bit (1), Somewhat (2), A lot (3)</strong></p>

              {/* Header row */}
              <div className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-1 mb-2 text-center">
                <div></div>
                {ratingLabels.map(label => (
                  <div key={label} className="text-xs font-medium text-slate-500">{label}</div>
                ))}
              </div>

              {childSymptomLabels.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-1 items-center py-1 border-b border-slate-100">
                  <span className="text-sm text-slate-700">{label}</span>
                  {[0, 1, 2, 3].map(val => (
                    <div key={val} className="flex justify-center">
                      <input
                        type="radio"
                        name={`child-${key}`}
                        checked={formData.childSymptoms[key] === val}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          childSymptoms: { ...prev.childSymptoms, [key]: val }
                        }))}
                        className="w-4 h-4 text-green-600"
                      />
                    </div>
                  ))}
                </div>
              ))}

              {/* Totals */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-slate-700">Total Symptoms:</span>
                    <span className="ml-2 text-lg font-bold text-green-700">{calculated.childSymptomNumber} / 21</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">Severity Score:</span>
                    <span className="ml-2 text-lg font-bold text-green-700">{calculated.childSymptomSeverity} / 63</span>
                  </div>
                </div>
              </div>

              {/* Overall rating */}
              <div className="mt-4">
                <label className={labelClass}>Child Overall Rating: "On a scale of 0-10, how do you feel?" (0 = worst, 10 = best)</label>
                <input type="number" min="0" max="10" value={formData.childOverallRating}
                  onChange={(e) => setFormData(prev => ({ ...prev, childOverallRating: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>
            </div>
          </SectionHeader>

          {/* ===== PARENT SYMPTOM REPORT ===== */}
          <SectionHeader id="parentSymptoms" title="Parent/Guardian Symptom Report (0-3 Scale)" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-2">
              <p className="text-sm text-slate-600 mb-4">Ask the parent/guardian to rate the child's symptoms: <strong>Not at all (0), A little bit (1), Somewhat (2), A lot (3)</strong></p>

              <div className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-1 mb-2 text-center">
                <div></div>
                {ratingLabels.map(label => (
                  <div key={label} className="text-xs font-medium text-slate-500">{label}</div>
                ))}
              </div>

              {parentSymptomLabels.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[1fr_56px_56px_56px_56px] gap-1 items-center py-1 border-b border-slate-100">
                  <span className="text-sm text-slate-700">{label}</span>
                  {[0, 1, 2, 3].map(val => (
                    <div key={val} className="flex justify-center">
                      <input
                        type="radio"
                        name={`parent-${key}`}
                        checked={formData.parentSymptoms[key] === val}
                        onChange={() => setFormData(prev => ({
                          ...prev,
                          parentSymptoms: { ...prev.parentSymptoms, [key]: val }
                        }))}
                        className="w-4 h-4 text-green-600"
                      />
                    </div>
                  ))}
                </div>
              ))}

              <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-slate-700">Total Symptoms:</span>
                    <span className="ml-2 text-lg font-bold text-green-700">{calculated.parentSymptomNumber} / 21</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">Severity Score:</span>
                    <span className="ml-2 text-lg font-bold text-green-700">{calculated.parentSymptomSeverity} / 63</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass}>Parent Overall Rating: (0 = worst, 10 = best)</label>
                <input type="number" min="0" max="10" value={formData.parentOverallRating}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentOverallRating: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white" />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Symptoms worse with physical activity?</label>
                  <div className="flex gap-4">
                    {[true, false].map(val => (
                      <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="worsePhysical" checked={formData.symptomsWorseWithPhysical === val}
                          onChange={() => setFormData(prev => ({ ...prev, symptomsWorseWithPhysical: val }))} className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{val ? 'Yes' : 'No'}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Symptoms worse with mental activity?</label>
                  <div className="flex gap-4">
                    {[true, false].map(val => (
                      <label key={String(val)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="worseMental" checked={formData.symptomsWorseWithMental === val}
                          onChange={() => setFormData(prev => ({ ...prev, symptomsWorseWithMental: val }))} className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{val ? 'Yes' : 'No'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== COGNITIVE SCREENING ===== */}
          <SectionHeader id="cognitive" title="Cognitive Screening" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-6">
              {/* Orientation */}
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-3">Orientation (Score 0 or 1 for each)</h4>
                {[
                  { key: 'orientationMonth' as const, label: 'What month is it?' },
                  { key: 'orientationDate' as const, label: 'What is the date today?' },
                  { key: 'orientationDayOfWeek' as const, label: 'What day of the week is it?' },
                  { key: 'orientationYear' as const, label: 'What year is it?' },
                  { key: 'orientationTime' as const, label: 'What time is it right now? (within 1 hour)' },
                ].map(item => (
                  <div key={item.key} className="flex items-center gap-4 py-1">
                    <span className="text-sm text-slate-700 flex-1">{item.label}</span>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={item.key} checked={formData[item.key] === true}
                          onChange={() => setFormData(prev => ({ ...prev, [item.key]: true }))} className="w-4 h-4 text-green-600" />
                        <span className="text-sm">1</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name={item.key} checked={formData[item.key] === false}
                          onChange={() => setFormData(prev => ({ ...prev, [item.key]: false }))} className="w-4 h-4 text-green-600" />
                        <span className="text-sm">0</span>
                      </label>
                    </div>
                  </div>
                ))}
                <div className="mt-2 p-3 bg-white rounded-lg border border-green-200 inline-block">
                  <span className="text-sm font-medium text-slate-700">Orientation Score: </span>
                  <span className="text-lg font-bold text-green-700">{calculated.orientation} / 5</span>
                </div>
              </div>

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
                        {WORD_LISTS[formData.wordListUsed as WordListKey].map((word, i) => (
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
                  <div className="p-3 bg-white rounded-lg border border-green-200 inline-block">
                    <span className="text-sm font-medium text-slate-700">Immediate Memory Score: </span>
                    <span className="text-lg font-bold text-green-700">{calculated.immediateMemory} / 30</span>
                  </div>
                  <div>
                    <label className={labelClass}>Time Completed:</label>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className={labelClass}>Digits Backward Score (0-4):</label>
                    <input type="number" min="0" max="4" value={formData.digitsBackward}
                      onChange={(e) => setFormData(prev => ({ ...prev, digitsBackward: parseInt(e.target.value) || 0 }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Months in Reverse - Time (sec):</label>
                    <input type="text" value={formData.monthsReverseTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthsReverseTime: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Months in Reverse - Errors:</label>
                    <input type="number" min="0" value={formData.monthsReverseErrors}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthsReverseErrors: parseInt(e.target.value) || 0 }))} className={inputClass} />
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-green-200 inline-block">
                  <span className="text-sm font-medium text-slate-700">Concentration Score: </span>
                  <span className="text-lg font-bold text-green-700">{calculated.concentration} / 5</span>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== BALANCE ===== */}
          <SectionHeader id="balance" title="Balance Examination (mBESS)" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Foot Tested (non-dominant):</label>
                  <div className="flex gap-4">
                    {(['Left', 'Right'] as const).map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="footTested" value={option} checked={formData.footTested === option}
                          onChange={(e) => setFormData(prev => ({ ...prev, footTested: e.target.value as any }))} className="w-4 h-4 text-green-600" />
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

              <h4 className="text-sm font-bold text-slate-800">Firm Surface (errors out of 10)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Double Leg:</label>
                  <input type="number" min="0" max="10" value={formData.mBessDoubleErrors}
                    onChange={(e) => setFormData(prev => ({ ...prev, mBessDoubleErrors: parseInt(e.target.value) || 0 }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tandem:</label>
                  <input type="number" min="0" max="10" value={formData.mBessTandemErrors}
                    onChange={(e) => setFormData(prev => ({ ...prev, mBessTandemErrors: parseInt(e.target.value) || 0 }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Single Leg:</label>
                  <input type="number" min="0" max="10" value={formData.mBessSingleErrors}
                    onChange={(e) => setFormData(prev => ({ ...prev, mBessSingleErrors: parseInt(e.target.value) || 0 }))} className={inputClass} />
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-green-200 inline-block">
                <span className="text-sm font-medium text-slate-700">mBESS Total Errors: </span>
                <span className="text-lg font-bold text-green-700">{calculated.mBessTotal} / 30</span>
              </div>

              {/* Tandem Gait */}
              <h4 className="text-sm font-bold text-slate-800 mt-4">Tandem Gait (seconds)</h4>
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
                  <label className={labelClass}>Average:</label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700">
                    {calculated.tandemGaitAverage || '—'}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Fastest:</label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-bold text-green-700">
                    {calculated.tandemGaitFastest || '—'}
                  </div>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== DELAYED RECALL ===== */}
          <SectionHeader id="delayed" title="Delayed Recall" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div className="flex gap-4 items-center mb-3">
                <label className={labelClass}>Start Time:</label>
                <input type="time" value={formData.delayedRecallStartTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, delayedRecallStartTime: e.target.value }))} className={inputClass} />
              </div>

              {formData.wordListUsed && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Words recalled (same list as Immediate Memory - List {formData.wordListUsed}):</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {WORD_LISTS[formData.wordListUsed as WordListKey].map((word, i) => (
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

              <div className="p-3 bg-white rounded-lg border border-green-200 inline-block">
                <span className="text-sm font-medium text-slate-700">Delayed Recall Score: </span>
                <span className="text-lg font-bold text-green-700">{calculated.delayedRecall} / 10</span>
              </div>

              {/* Total Cognitive Score */}
              <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h4 className="text-base font-bold text-slate-800 mb-2">Total Cognitive Score</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div><span className="text-slate-600">Orientation:</span> <span className="font-bold">{calculated.orientation}/5</span></div>
                  <div><span className="text-slate-600">Memory:</span> <span className="font-bold">{calculated.immediateMemory}/30</span></div>
                  <div><span className="text-slate-600">Concentration:</span> <span className="font-bold">{calculated.concentration}/5</span></div>
                  <div><span className="text-slate-600">Delayed Recall:</span> <span className="font-bold">{calculated.delayedRecall}/10</span></div>
                  <div><span className="text-slate-600">Total:</span> <span className="text-lg font-bold text-green-700">{calculated.totalCognitive}/50</span></div>
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== DISPOSITION ===== */}
          <SectionHeader id="disposition" title="Disposition" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Concussion Diagnosed:</label>
                <div className="flex gap-4">
                  {(['Yes', 'No', 'Deferred'] as const).map(option => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="concussion" value={option} checked={formData.concussionDiagnosed === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, concussionDiagnosed: e.target.value as any }))} className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </SectionHeader>

          {/* ===== HCP ATTESTATION ===== */}
          <SectionHeader id="hcp" title="HCP Attestation" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>HCP Name:</label>
                <input type="text" value={formData.hcpName} onChange={(e) => setFormData(prev => ({ ...prev, hcpName: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Title/Designation:</label>
                <input type="text" value={formData.hcpTitle} onChange={(e) => setFormData(prev => ({ ...prev, hcpTitle: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Registration Number:</label>
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
        </div>
      </div>
    </div>
  )
}
