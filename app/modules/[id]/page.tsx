'use client'

import { useParams, useRouter } from 'next/navigation'
import { CourseNavigation } from '@/components/course/CourseNavigation'
import { getModuleById } from '@/data/modules'
import { useProgress } from '@/contexts/ProgressContext'
import React, { useState, useEffect } from 'react'
import { CheckCircle2, Award, AlertCircle, ArrowRight, BookOpen, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { QuickCheck, ClinicalInsight, KeyConcept, Flowchart } from '@/components/course/InteractiveElements'
import { DynamicContentRenderer } from '@/components/course/DynamicContentRenderer'
import { DownloadableResources } from '@/components/course/DownloadableResources'
import { ApplyTomorrow } from '@/components/course/ApplyTomorrow'
import { LockedModuleOverlay } from '@/components/course/LockedModuleOverlay'
import { ContentLockedBanner } from '@/components/course/ContentLockedBanner'
import { useModuleAccess } from '@/hooks/useModuleAccess'

export default function ModulePage() {
  return (
    <ProtectedRoute>
      <ModulePageContent />
    </ProtectedRoute>
  )
}

function ModulePageContent() {
  const params = useParams()
  const router = useRouter()
  const moduleId = parseInt(params.id as string)
  const module = getModuleById(moduleId)
  const {
    updateVideoProgress,
    markVideoComplete,
    updateQuizScore,
    markModuleComplete,
    getModuleProgress,
    canMarkModuleComplete,
    isModuleComplete,
  } = useProgress()

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [showCompleteButton, setShowCompleteButton] = useState(false)
  const [lastViewedSection, setLastViewedSection] = useState<number>(0)
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0)

  const moduleProgress = getModuleProgress(moduleId)
  const { hasFullAccess, loading: accessLoading } = useModuleAccess(moduleId)

  // CRITICAL FIX: Sync quizSubmitted with persisted progress
  useEffect(() => {
    if (moduleProgress.quizCompleted) {
      setQuizSubmitted(true)
    }
  }, [moduleProgress.quizCompleted])

  // Auto-save checkpoint: Save last viewed section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section-index]')
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect()
        if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
          const sectionIndex = parseInt(section.getAttribute('data-section-index') || '0')
          setLastViewedSection(sectionIndex)
          localStorage.setItem(`module-${moduleId}-checkpoint`, sectionIndex.toString())
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [moduleId])

  // Restore checkpoint: Scroll to last viewed section
  useEffect(() => {
    const savedCheckpoint = localStorage.getItem(`module-${moduleId}-checkpoint`)
    if (savedCheckpoint && module) {
      const sectionIndex = parseInt(savedCheckpoint)
      setTimeout(() => {
        const targetSection = document.querySelector(`[data-section-index="${sectionIndex}"]`)
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [moduleId, module])

  useEffect(() => {
    if (module && moduleProgress) {
      const canComplete = canMarkModuleComplete(moduleId, module.videoRequiredMinutes)
      setShowCompleteButton(canComplete && !isModuleComplete(moduleId))
    }
  }, [module, moduleProgress, moduleId, canMarkModuleComplete, isModuleComplete])

  if (!module) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <CourseNavigation />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Module not found</h1>
          </div>
        </main>
      </div>
    )
  }

  const handleVideoTimeUpdate = (time: number) => {
    const minutes = Math.floor(time / 60)
    setCurrentVideoTime(time)
    updateVideoProgress(moduleId, minutes)

    if (minutes >= module.videoRequiredMinutes && !moduleProgress.videoCompleted) {
      markVideoComplete(moduleId)
    }
  }

  const handleQuizSubmit = () => {
    if (Object.keys(quizAnswers).length !== module.quiz.length) {
      alert('Please answer all questions before submitting.')
      return
    }

    let correctCount = 0
    module.quiz.forEach((question) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correctCount++
      }
    })

    updateQuizScore(moduleId, correctCount, module.quiz.length)
    setQuizSubmitted(true)
  }

  const handleCompleteModule = () => {
    if (canMarkModuleComplete(moduleId, module.videoRequiredMinutes)) {
      markModuleComplete(moduleId)
      router.push('/learning')
    }
  }

  const getQuizResult = () => {
    if (!quizSubmitted || moduleProgress.quizScore === null) return null
    // Use saved total questions if available, otherwise use current module quiz length
    const totalQuestions = moduleProgress.quizTotalQuestions || module.quiz.length
    const percentage = (moduleProgress.quizScore / totalQuestions) * 100
    const passed = percentage >= 75
    return { percentage, passed, score: moduleProgress.quizScore }
  }

  const quizResult = getQuizResult()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CourseNavigation />
      <main className="flex-1 w-full md:ml-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 md:py-12 px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Module Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Module {module.id}
                  </span>
                  {isModuleComplete(moduleId) && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                      <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Completed
                    </div>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight leading-tight">
                  {module.title}
                </h1>
                <p className="text-sm sm:text-base text-slate-600 font-medium mb-3">{module.subtitle}</p>
                <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
                  {module.description}
                </p>
              </div>
            </div>

            {/* Module Meta */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-slate-700">{module.points} CPD Points</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{module.duration}</span>
              </div>
            </div>
          </div>

          {/* Checkpoint Resume Banner */}
          {lastViewedSection > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300 p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Continue Where You Left Off</h4>
                  <p className="text-xs text-amber-700">
                    Last viewed: Section {lastViewedSection + 1} - {module.sections[lastViewedSection]?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const targetSection = document.querySelector(`[data-section-index="${lastViewedSection}"]`)
                  if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-all flex items-center gap-2"
              >
                Jump to Section
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Learning Path Card */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl shadow-sm border-2 border-teal-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-teal-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Interactive Learning Experience</h3>
                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                  This module combines clinical content with interactive infographics, decision flowcharts, and knowledge checks. Complete all sections and pass the final quiz (2/3 correct) to earn {module.points} AHPRA CPD points.
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <span className="text-slate-600">Interactive Content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600">Visual Infographics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-slate-600">Quick Knowledge Checks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Content Sections */}
          {module.sections?.map((section, index) => {
            // Show first TWO sections for free users, all sections for paid users
            const isPreviewSection = index === 0 || index === 1
            const shouldShow = hasFullAccess || isPreviewSection

            if (!shouldShow) return null

            return (
            <React.Fragment key={section.id}>
            <div>
              <div
                id={section.id}
                data-section-index={index}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6"
              >
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-md relative">
                    <span className="text-lg font-bold text-white">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    {index < lastViewedSection && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">
                      {section.title}
                    </h2>
                    <DynamicContentRenderer content={section.content} sectionIndex={index} />

                    {/* Add interactive elements based on section content */}
                    {/* Module 1: Myths Quiz in Section 1 - From Course_Content.md */}
                    {moduleId === 1 && section.id === 'myths-intro' && (
                      <>
                        <QuickCheck
                          question="A person must lose consciousness to be diagnosed with a concussion."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. Only about 10% of concussions involve loss of consciousness. Most concussions occur without LOC, and the presence or absence of unconsciousness does not correlate with injury severity or recovery time."
                        />
                        <QuickCheck
                          question="Most concussions show up clearly on standard CT or MRI scans."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. Concussion is a functional brain injury, not a structural one. Standard CT and MRI typically appear normal in concussion cases. These imaging tools are primarily used to rule out more serious pathologies like skull fractures or intracranial bleeding."
                        />
                        <QuickCheck
                          question="Concussion symptoms usually resolve within 24-48 hours in all cases."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. While some concussions resolve quickly, recovery times vary significantly. In adults, recovery typically ranges from 10-14 days, but can be longer. In children, recovery can take 4+ weeks due to their developing brains."
                        />
                        <QuickCheck
                          question="Only contact sports athletes are at risk of concussion."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. Falls, motor vehicle accidents, bicycle crashes, and occupational injuries are leading causes of concussions outside of sport. In older adults, falls account for over 60% of TBIs requiring hospitalization."
                        />
                        <QuickCheck
                          question="A clear head CT scan rules out a concussion."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. A normal CT scan does NOT rule out concussion. CT scans detect structural damage (bleeding, fractures), but concussion is a functional disturbance. Diagnosis relies on clinical history, observed signs, and symptom assessment."
                        />
                        <QuickCheck
                          question="Children recover more quickly from concussion than adults."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. Children actually experience slower recovery and are more susceptible to cognitive and behavioral disturbances post-injury. The developing brain has higher metabolic demands and a longer period of vulnerability to neurometabolic disruption."
                        />
                        <QuickCheck
                          question="You have to 'rest completely' (no activity at all) for two weeks post-concussion."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. Current evidence shows 24-48 hours of relative rest followed by gradual return to activity is optimal. Prolonged strict rest beyond 72 hours is associated with increased symptom burden and delayed recovery."
                        />
                        <QuickCheck
                          question="Helmets and mouthguards can prevent concussion."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. While helmets and mouthguards reduce the risk of skull fractures and dental injuries, they cannot prevent concussion. Concussion results from rotational forces on the brain, which protective equipment cannot eliminate."
                        />
                        <QuickCheck
                          question="It's safe to return to work or sport once symptoms subside, even without clearance."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. Even when symptoms resolve, the brain may still be in a vulnerable state. Medical clearance and graduated return-to-activity protocols are essential to prevent second impact syndrome and ensure full neurometabolic recovery."
                        />
                        <QuickCheck
                          question="Concussion only affects cognition — emotional and physical symptoms are unrelated."
                          options={["True", "False"]}
                          correctAnswer={1}
                          explanation="FALSE. Concussion affects multiple domains: cognitive (memory, concentration), emotional (mood changes, irritability), physical (headaches, dizziness), and sleep patterns. The neurometabolic cascade impacts the entire brain, not just cognitive centers."
                        />
                      </>
                    )}

                    {moduleId === 1 && index === 1 && (
                      <ClinicalInsight
                        type="tip"
                        title="Clinical Pearl"
                        content="Rotational forces are MORE damaging than linear forces. This is why some 'minor' impacts can cause significant symptoms while major linear impacts may not."
                      />
                    )}

                    {moduleId === 1 && index === 2 && (
                      <>
                        <KeyConcept
                          title="The Neurometabolic Cascade"
                          points={[
                            "Ionic flux (K+ out, Ca²+ in) disrupts cellular balance",
                            "Increased glucose metabolism + decreased blood flow = energy crisis",
                            "Typical resolution: 7-10 days (but varies significantly)",
                            "Brain is vulnerable to repeat injury during this period"
                          ]}
                        />
                        <QuickCheck
                          question="What creates the 'energy crisis' in concussion?"
                          options={[
                            "Decreased glucose metabolism",
                            "Increased blood flow with normal metabolism",
                            "Increased energy demand with decreased energy supply",
                            "Complete cessation of cellular activity"
                          ]}
                          correctAnswer={2}
                          explanation="The energy crisis occurs because neurons increase glucose metabolism to restore ionic balance, but simultaneously cerebral blood flow decreases, creating a mismatch between supply and demand."
                        />
                      </>
                    )}

                    {moduleId === 1 && section.id === 'neuroanatomy-regions' && (
                      <>
                        <ClinicalInsight
                          type="insight"
                          title="Free Brain Anatomy Resource"
                          content="Interactive 3D brain anatomy resource: https://www.innerbody.com/image/nerv02.html - Use this to visualize the structures discussed in this section."
                        />
                        <QuickCheck
                          question="TRUE or FALSE: The frontal lobe controls only motor functions"
                          options={[
                            "True - frontal lobe is purely motor",
                            "False - frontal lobe also controls executive function, personality, and decision-making"
                          ]}
                          correctAnswer={1}
                          explanation="The frontal lobe includes both the prefrontal cortex (executive function, personality, emotional regulation) and the motor cortex (voluntary movement control). Concussion affecting the frontal lobe can cause cognitive and behavioral changes, not just motor deficits."
                        />
                      </>
                    )}

                    {moduleId === 1 && section.id === 'mechanism-rotational' && (
                      <QuickCheck
                        question="TRUE or FALSE: Direct head contact is required for concussion to occur"
                        options={[
                          "True - concussion requires direct impact",
                          "False - rotational forces alone can cause concussion without contact"
                        ]}
                        correctAnswer={1}
                        explanation="Rotational acceleration can cause concussion even without direct head contact. Whiplash injuries, rapid rotation from tackles, or acceleration-deceleration in MVAs can all produce concussion through rotational forces alone."
                      />
                    )}

                    {moduleId === 1 && section.id === 'biochemistry-cascade-detailed' && (
                      <QuickCheck
                        question="The neurometabolic cascade typically resolves within:"
                        options={[
                          "24-48 hours",
                          "7-10 days",
                          "4-6 weeks",
                          "3-6 months"
                        ]}
                        correctAnswer={1}
                        explanation="The acute neurometabolic cascade typically resolves in 7-10 days for uncomplicated concussions. However, this varies significantly by individual, and the brain remains vulnerable to repeat injury during this period."
                      />
                    )}

                    {moduleId === 1 && section.id === 'imaging-modalities' && (
                      <QuickCheck
                        question="TRUE or FALSE: A normal CT scan rules out concussion"
                        options={[
                          "True - normal imaging means no concussion",
                          "False - concussion is a functional injury; imaging is typically normal"
                        ]}
                        correctAnswer={1}
                        explanation="CT and MRI scans detect structural damage. Concussion is a functional disturbance of cellular activity, so standard imaging appears normal. Imaging is used to rule out structural complications (bleeds, fractures), not to diagnose concussion."
                      />
                    )}

                    {moduleId === 2 && section.id === 'acute-assessment-protocol' && (
                      <>
                        <Flowchart
                          title="On-Field Assessment Protocol"
                          steps={[
                            { label: "ABCs First", description: "Ensure airway, breathing, circulation before concussion assessment" },
                            { label: "Red Flag Screen", description: "LOC >1 min, seizures, worsening symptoms, neurological deficits → Emergency referral" },
                            { label: "GCS Assessment", description: "Score 13-15 = mild TBI; Score ≤12 requires immediate medical referral" },
                            { label: "Maddocks Questions", description: "Rapid cognitive screening for orientation and memory" },
                            { label: "Remove from Play", description: "Any positive findings = immediate removal and comprehensive SCAT6" }
                          ]}
                        />
                        <QuickCheck
                          question="An athlete is dazed but passes the on-field assessment. Can they return to play?"
                          options={[
                            "Yes - they passed the assessment",
                            "No - 'When in doubt, sit them out' - comprehensive SCAT6 required",
                            "Yes, but monitor closely",
                            "Only if no headache reported"
                          ]}
                          correctAnswer={1}
                          explanation="'When in doubt, sit them out' is the gold standard. On-field screening is NOT diagnostic. Any suspicion of concussion requires immediate removal from play and comprehensive assessment with SCAT6. Symptoms may be delayed."
                        />
                      </>
                    )}

                    {moduleId === 2 && section.id === 'scat6-overview' && (
                      <QuickCheck
                        question="TRUE or FALSE: SCAT6 can be used as a standalone diagnostic tool"
                        options={[
                          "True - SCAT6 definitively diagnoses concussion",
                          "False - SCAT6 is a screening tool, not a standalone diagnostic"
                        ]}
                        correctAnswer={1}
                        explanation="SCAT6 is a standardized assessment tool, NOT a diagnostic instrument. Concussion diagnosis requires clinical judgment integrating SCAT6 results with history, examination, and monitoring. SCAT6 helps quantify deficits but doesn't replace medical evaluation."
                      />
                    )}

                    {moduleId === 3 && section.id === 'voms-methodology' && (
                      <>
                        <ClinicalInsight
                          type="warning"
                          title="Common VOMS Error"
                          content="Many clinicians test eye movements too quickly or with excessive range. Move the target smoothly at moderate speed, and keep movements within comfortable range to avoid false positives."
                        />
                        <QuickCheck
                          question="A patient has +3 dizziness with smooth pursuit but negative VOR. What does this indicate?"
                          options={[
                            "Vestibular-only dysfunction",
                            "Cervicogenic dizziness only",
                            "Oculomotor dysfunction (central processing issue)",
                            "Normal finding"
                          ]}
                          correctAnswer={2}
                          explanation="Positive smooth pursuit with negative VOR suggests oculomotor/central processing dysfunction rather than vestibular pathology. Smooth pursuit requires intact frontal-parietal circuits and cerebellar function. This phenotype requires oculomotor rehabilitation, not vestibular therapy."
                        />
                      </>
                    )}

                    {moduleId === 3 && section.id === 'bess-methodology' && (
                      <QuickCheck
                        question="BESS testing assesses:"
                        options={[
                          "Visual acuity only",
                          "Static balance and postural stability",
                          "Dynamic balance during movement",
                          "Cognitive function"
                        ]}
                        correctAnswer={1}
                        explanation="BESS (Balance Error Scoring System) assesses static balance across 6 conditions. It tests postural stability by challenging proprioception, vestibular, and visual systems. Errors indicate impaired sensorimotor integration common in concussion."
                        />
                    )}

                    {/* MODULE 4: Persistent Post-Concussive Symptoms */}
                    {moduleId === 4 && section.id === 'pcs-definition' && (
                      <>
                        <KeyConcept
                          title="PCS Definition & Timeframe"
                          content="Persistent Post-Concussive Symptoms (PPCS) = symptoms persisting beyond 4 weeks post-injury in adults. Affects 10-20% of cases. NOT a single disorder - it's a heterogeneous collection requiring phenotype-specific treatment."
                        />
                        <QuickCheck
                          question="Persistent post-concussive symptoms (PPCS) is defined as symptoms lasting beyond:"
                          options={[
                            "7 days",
                            "4 weeks",
                            "3 months",
                            "6 months"
                          ]}
                          correctAnswer={1}
                          explanation="PPCS is defined as symptoms persisting beyond 4 weeks (28 days) post-injury. However, symptom duration alone doesn't determine prognosis - phenotype identification and targeted treatment are key."
                        />
                      </>
                    )}

                    {moduleId === 4 && section.id === 'risk-factors' && (
                      <>
                        <ClinicalInsight
                          type="warning"
                          title="Strongest PCS Predictors"
                          content="Pre-existing MIGRAINE is the strongest predictor (3-5x increased risk). Psychosocial factors (stress, poor social support, litigation) and treatment factors (delayed diagnosis, prolonged strict rest) are MODIFIABLE - focus intervention here."
                        />
                        <QuickCheck
                          question="Which pre-existing condition is the STRONGEST predictor of post-concussion syndrome?"
                          options={[
                            "ADHD",
                            "Anxiety/Depression",
                            "Migraine headaches",
                            "Previous concussion"
                          ]}
                          correctAnswer={2}
                          explanation="Pre-existing MIGRAINE is the strongest predictor of PCS, increasing risk 3-5x. Migraine mechanisms (sensitization, photophobia, dizziness) overlap with concussion symptoms. History of migraine should trigger aggressive early intervention."
                        />
                      </>
                    )}

                    {moduleId === 4 && section.id === 'symptom-domains' && (
                      <>
                        <KeyConcept
                          title="6 Clinical Phenotypes (Ellis Classification)"
                          content="1) Physiological (autonomic), 2) Vestibulo-ocular, 3) Cervicogenic, 4) Cognitive-fatigue, 5) Post-traumatic migraine, 6) Anxiety/mood. Most patients have MIXED phenotypes requiring multimodal treatment."
                        />
                        <QuickCheck
                          question="A patient reports headache, dizziness with head movement, and neck pain. This suggests:"
                          options={[
                            "Single vestibular phenotype only",
                            "Mixed phenotype (vestibular + cervicogenic + migraine)",
                            "Purely psychological symptoms",
                            "Malingering"
                          ]}
                          correctAnswer={1}
                          explanation="Headache + dizziness + neck pain = MIXED phenotype requiring combined treatment (vestibular rehab + cervical physio + headache management). Single-approach treatment will fail. Address all contributors simultaneously."
                        />
                      </>
                    )}

                    {moduleId === 4 && section.id === 'diagnostic-approach' && (
                      <Flowchart
                        title="PCS Diagnostic Workflow"
                        steps={[
                          { label: "Comprehensive History", description: "Injury mechanism, symptom evolution, treatment history, red flag screen" },
                          { label: "Symptom Inventory", description: "SCAT6 Post-Concussion Scale, quantify severity/triggers" },
                          { label: "Phenotype Assessment", description: "VOMS (vestibular), cervical exam, Buffalo Treadmill (autonomic), mood screening" },
                          { label: "Differential Diagnosis", description: "Rule out structural injury, cervical pathology, primary headache, mood disorders" },
                          { label: "Targeted Treatment Plan", description: "Phenotype-directed multimodal rehabilitation" }
                        ]}
                      />
                    )}

                    {moduleId === 4 && section.id === 'treatment-strategies' && (
                      <>
                        <ClinicalInsight
                          type="success"
                          title="Evidence-Based PCS Treatment"
                          content="Aerobic exercise therapy (Buffalo Protocol) has STRONG evidence for persistent symptoms. Target 80% of symptom threshold HR, 20-30 min daily. Improves autonomic function, CBF, mood, and sleep. Combine with phenotype-specific rehab."
                        />
                        <QuickCheck
                          question="Buffalo Concussion Treadmill Test prescribes exercise at:"
                          options={[
                            "50% maximum heart rate",
                            "80% of symptom exacerbation threshold",
                            "100% effort - push through symptoms",
                            "Resting heart rate only"
                          ]}
                          correctAnswer={1}
                          explanation="Buffalo Protocol: Exercise at 80% of the heart rate that triggered symptoms during testing. This sub-threshold training improves autonomic regulation and cerebral blood flow WITHOUT worsening symptoms. Daily 20-30 minute sessions."
                        />
                      </>
                    )}

                    {moduleId === 4 && section.id === 'cte-overview' && (
                      <>
                        <KeyConcept
                          title="CTE: Key Facts"
                          content="Chronic Traumatic Encephalopathy = progressive neurodegenerative disease from repetitive head impacts. Can ONLY be diagnosed at autopsy (tau protein deposits). NO validated biomarkers or imaging for living patients. Risk factors: boxing, football, repeated subconcussive hits."
                        />
                        <QuickCheck
                          question="TRUE or FALSE: CTE can be definitively diagnosed with advanced MRI imaging"
                          options={[
                            "True - DTI and tau PET scans diagnose CTE",
                            "False - CTE can only be diagnosed post-mortem at autopsy"
                          ]}
                          correctAnswer={1}
                          explanation="CTE can ONLY be diagnosed at autopsy through identification of pathognomonic tau protein deposits. No validated biomarkers, imaging, or clinical criteria exist for living patients. Claims of clinical CTE diagnosis are premature and not evidence-based."
                        />
                      </>
                    )}

                    {/* MODULE 5: Multidisciplinary Approach */}
                    {moduleId === 5 && section.id === 'multidisciplinary-rationale' && (
                      <>
                        <KeyConcept
                          title="Why Multidisciplinary Care?"
                          content="Phenotype-directed treatment REQUIRES specialists. Vestibular dysfunction → vestibular physio. Vision problems → optometry. Mood issues → psychology. Cervical dysfunction → manual therapy. NO single provider has all expertise. Early appropriate referrals prevent prolonged disability."
                        />
                        <QuickCheck
                          question="Evidence shows multidisciplinary care leads to:"
                          options={[
                            "No difference vs single provider",
                            "Faster recovery and better outcomes, especially for PCS >4 weeks",
                            "Higher costs with no benefit",
                            "Worse outcomes due to conflicting advice"
                          ]}
                          correctAnswer={1}
                          explanation="Studies show FASTER recovery, better functional outcomes, and higher patient satisfaction with coordinated multidisciplinary care vs single-provider management, particularly for persistent symptoms >4 weeks. Early appropriate specialist referrals are cost-effective."
                        />
                      </>
                    )}

                    {moduleId === 5 && section.id === 'primary-care-role' && (
                      <>
                        <ClinicalInsight
                          type="info"
                          title="Primary Care as Hub"
                          content="GP/Sports Medicine is the COORDINATOR: initial diagnosis, gatekeeper for specialist referrals, communication hub, synthesis of specialist recommendations, liaison with schools/employers, FINAL clearance authority. Don't delay referrals - persistent symptoms >2-4 weeks trigger specialist involvement."
                        />
                        <Flowchart
                          title="When to Refer from Primary Care"
                          steps={[
                            { label: "Week 2-4: Symptoms Persist", description: "Evaluate for specific phenotypes needing specialist input" },
                            { label: "Positive VOMS/BESS", description: "→ Vestibular physiotherapy" },
                            { label: "NPC >6cm or Visual Symptoms", description: "→ Optometry/neuro-ophthalmology" },
                            { label: "Neck Pain or Cervicogenic Headache", description: "→ Cervical physiotherapy" },
                            { label: "PHQ-9 ≥10 or GAD-7 ≥10", description: "→ Psychology/psychiatry" },
                            { label: "Complex/Atypical Case", description: "→ Neurology or concussion specialist" }
                          ]}
                        />
                      </>
                    )}

                    {moduleId === 5 && section.id === 'physiotherapy-role' && (
                      <>
                        <KeyConcept
                          title="Physiotherapy Scope"
                          content="Vestibular Assessment & Rehab: VOR exercises, gaze stabilization, habituation, balance training. Cervical Treatment: C1-C2 mobilization, proprioceptive retraining, deep neck flexor strengthening. Exercise Prescription: Buffalo Protocol, graduated RTP progressions."
                        />
                        <QuickCheck
                          question="A patient has positive VOMS (≥2 point symptom increase), elevated BESS score, and neck stiffness. Which specialist?"
                          options={[
                            "Optometry for vision therapy",
                            "Psychology for anxiety",
                            "Physiotherapy for combined vestibular + cervical dysfunction",
                            "Neurology for medication"
                          ]}
                          correctAnswer={2}
                          explanation="Positive VOMS + elevated BESS + neck symptoms = combined VESTIBULAR and CERVICAL dysfunction. Refer to physiotherapy with expertise in BOTH domains. Many patients have mixed phenotypes requiring integrated vestibular-cervical treatment."
                        />
                      </>
                    )}

                    {moduleId === 5 && section.id === 'optometry-vision-therapy' && (
                      <>
                        <ClinicalInsight
                          type="warning"
                          title="Vision Dysfunction is Common & Overlooked"
                          content="40-50% of concussions involve convergence insufficiency. NPC >6cm, difficulty reading, headache with visual tasks, photophobia = OPTOMETRY REFERRAL. Vision therapy typically 6-12 weeks, dramatically improves function. Don't miss this!"
                        />
                        <QuickCheck
                          question="Near point of convergence (NPC) of 9cm indicates:"
                          options={[
                            "Normal - no referral needed",
                            "Convergence insufficiency - refer to optometry",
                            "Vestibular dysfunction - refer to physio",
                            "Cervical problem - refer to manual therapy"
                          ]}
                          correctAnswer={1}
                          explanation="NPC >6cm = convergence insufficiency requiring OPTOMETRY/vision therapy referral. Normal NPC is <6cm. Convergence insufficiency causes difficulty reading, headache with visual tasks, words jumping on page. Responds well to vision therapy (pencil push-ups, convergence exercises)."
                        />
                      </>
                    )}

                    {moduleId === 5 && section.id === 'psychology-role' && (
                      <>
                        <KeyConcept
                          title="Psychology Indications"
                          content="PHQ-9 ≥10 (depression), GAD-7 ≥10 (anxiety), PTSD symptoms, catastrophic thinking, fear-avoidance, adjustment difficulties. CBT has STRONG evidence for PCS outcomes. Also: neuropsych testing for cognitive symptoms affecting work/school, medico-legal documentation needs."
                        />
                        <QuickCheck
                          question="TRUE or FALSE: Neuropsychological testing should be routine for all concussions"
                          options={[
                            "True - all concussions need baseline + post-injury testing",
                            "False - only when cognitive symptoms affect function or documentation needed"
                          ]}
                          correctAnswer={1}
                          explanation="Neuropsych testing is NOT routine. Only indicated when: (1) Cognitive symptoms interfere with work/school, (2) Need objective data for accommodations, (3) Medico-legal context, (4) Suspected learning disability, (5) No improvement with treatment. Overuse wastes resources."
                        />
                      </>
                    )}

                    {moduleId === 5 && section.id === 'communication-strategies' && (
                      <>
                        <Flowchart
                          title="Effective Team Communication Model"
                          steps={[
                            { label: "Centralized Records", description: "Shared electronic platform or primary care as information hub" },
                            { label: "Regular Team Huddles", description: "Weekly case review for complex patients (can be virtual)" },
                            { label: "Structured Referral", description: "Clear clinical question, relevant findings, specific ask" },
                            { label: "Timely Reporting Back", description: "Specialist reports back to referring clinician within 48-72h" },
                            { label: "Patient as Partner", description: "Patient receives copy of all reports, understands plan" }
                          ]}
                        />
                        <QuickCheck
                          question="Best practice for specialist-to-primary care communication:"
                          options={[
                            "Wait until treatment is complete before reporting back",
                            "Only communicate if findings are abnormal",
                            "Report back to referring clinician within 48-72 hours with findings and plan",
                            "Communicate directly with patient only, skip referring clinician"
                          ]}
                          correctAnswer={2}
                          explanation="Best practice: Specialist reports back to REFERRING CLINICIAN within 48-72 hours with assessment findings, treatment plan, and recommendations. Keeps primary care as central coordinator, ensures continuity, allows synthesis of multidisciplinary input. Patient also receives copy."
                        />
                      </>
                    )}

                    {/* MODULE 6: Return-to-Play/Work/School */}
                    {moduleId === 6 && section.id === 'rtp-overview' && (
                      <>
                        <KeyConcept
                          title="6-Stage RTS Protocol - Key Rules"
                          content="1) Minimum 24h between stages, 2) Must be symptom-free at REST before Stage 2, 3) If symptoms return → drop back to previous stage, 4) Pediatric: may need 48-72h per stage, 5) Medical clearance required before Stage 5."
                        />
                        <ClinicalInsight
                          type="warning"
                          title="Never Same-Day Return"
                          content="SAME-DAY RETURN TO PLAY is NEVER permitted (except professional sports with immediate specialist assessment). Standard practice: immediate removal, evaluation, staged return over days-weeks. Risk of re-injury is 3-5x higher in first 10 days."
                        />
                      </>
                    )}

                    {moduleId === 6 && section.id === 'rtp-protocol-stages' && (
                      <>
                        <Flowchart
                          title="6-Stage Return-to-Sport Protocol"
                          steps={[
                            { label: "Stage 1: Symptom-Limited Activity", description: "Daily activities that don't provoke symptoms. Gradual reintroduction of work/school." },
                            { label: "Stage 2: Light Aerobic Exercise", description: "Walking, swimming, stationary cycling at <70% max HR. NO resistance training." },
                            { label: "Stage 3: Sport-Specific Exercise", description: "Running drills, skating drills. NO head impact activities." },
                            { label: "Stage 4: Non-Contact Training Drills", description: "Harder training drills (passing, shooting). May start progressive resistance training." },
                            { label: "Stage 5: Full Contact Practice", description: "Full participation in normal training after medical clearance." },
                            { label: "Stage 6: Return to Sport", description: "Normal game play with full medical clearance." }
                          ]}
                        />
                        <QuickCheck
                          question="An athlete develops mild headache during Stage 3 (sport-specific drills). Proper response:"
                          options={[
                            "Push through - mild symptoms are acceptable",
                            "Continue Stage 3 with lower intensity",
                            "Drop back to Stage 2, rest 24h, then retry Stage 3",
                            "Skip to Stage 5 after 24h rest"
                          ]}
                          correctAnswer={2}
                          explanation="ANY symptom return during a stage → DROP BACK to previous stage, rest 24 hours, then retry the symptomatic stage. Document triggers. Never push through symptoms - this delays recovery and increases re-injury risk."
                        />
                      </>
                    )}

                    {moduleId === 6 && section.id === 'rtp-medical-clearance' && (
                      <>
                        <KeyConcept
                          title="Clearance Criteria (All Must Be Met)"
                          content="1) Symptom-free at rest AND with exertion, 2) Normal clinical exam (VOMS, BESS, cognitive), 3) Completed full 6-stage protocol without symptoms, 4) Return to academic baseline (if student), 5) Medical provider documentation. NPC >6cm = absolute contraindication."
                        />
                        <QuickCheck
                          question="An athlete progresses through Stages 1-5 but has residual near-point convergence (NPC) of 10cm. Your decision:"
                          options={[
                            "Clear for full return - protocol complete",
                            "Withhold clearance - refer vision therapy first",
                            "Clear with restrictions - no contact initially",
                            "Repeat BESS testing only"
                          ]}
                          correctAnswer={1}
                          explanation="Convergence insufficiency (NPC >6cm) is an absolute contraindication to clearance regardless of symptom status or protocol completion. Refer to vision therapy/optometry first. Clearing with unresolved visual dysfunction creates serious re-injury risk."
                        />
                      </>
                    )}

                    {moduleId === 6 && section.id === 'rtl-overview' && (
                      <>
                        <ClinicalInsight
                          type="info"
                          title="Return-to-Learn Takes Priority"
                          content="RTL must begin BEFORE and progress ALONGSIDE RTS. Academic success and cognitive recovery are primary concerns for student-athletes. Don't progress to RTS Stage 5 (full contact) until RTL is complete or near-complete."
                        />
                        <Flowchart
                          title="5-Stage Return-to-Learn Protocol"
                          steps={[
                            { label: "Stage 1: Daily Activities at Home", description: "Short periods (15-30 min) of reading, screen time with breaks" },
                            { label: "Stage 2: School Activities at Home", description: "Homework, reading 30-60 min sessions before rest" },
                            { label: "Stage 3: Return to School Part-Time", description: "Half-day or specific classes only with accommodations" },
                            { label: "Stage 4: Full-Time with Accommodations", description: "Full attendance with support (extended time, breaks, etc)" },
                            { label: "Stage 5: Full Academic Load", description: "No accommodations needed, all activities tolerated" }
                          ]}
                        />
                      </>
                    )}

                    {moduleId === 6 && section.id === 'academic-accommodations' && (
                      <>
                        <KeyConcept
                          title="Common Academic Accommodations"
                          content="Extended time (50-100% extra), reduced course load, quiet testing room, permission to leave if symptomatic, excused absences, no PE, reduced screen time, note-taking assistance, preferential seating, elevator access. Formalize via Section 504 Plan (USA) or equivalent."
                        />
                        <QuickCheck
                          question="A student reports increased headache and fatigue after 3 hours of class. Best accommodation:"
                          options={[
                            "No accommodations - push through symptoms",
                            "Reduce to part-time (half-day) with rest breaks",
                            "Home tutoring only",
                            "Complete school suspension until asymptomatic"
                          ]}
                          correctAnswer={1}
                          explanation="Cognitive fatigue after 3h → reduce to PART-TIME school day (half-day) with strategic rest breaks. Allows gradual cognitive retraining without prolonged symptom exacerbation. Complete isolation delays recovery; pushing through worsens symptoms."
                        />
                      </>
                    )}

                    {moduleId === 6 && section.id === 'rtw-overview' && (
                      <>
                        <Flowchart
                          title="Graduated Return-to-Work Protocol"
                          steps={[
                            { label: "Step 1: Work Tasks at Home", description: "Light work activities at home in short sessions (30-60 min)" },
                            { label: "Step 2: Part-Time Work from Home", description: "Increased hours (2-4h/day) from home with breaks" },
                            { label: "Step 3: Part-Time On-Site Work", description: "Gradual workplace reintegration, modified duties" },
                            { label: "Step 4: Full-Time with Modifications", description: "Full hours with workplace accommodations" },
                            { label: "Step 5: Full Duties", description: "Unrestricted return to pre-injury role" }
                          ]}
                        />
                        <ClinicalInsight
                          type="success"
                          title="Workplace Accommodations"
                          content="Flexible hours, frequent breaks, reduced screen time, quiet workspace, modified lighting, permission to work from home, temporary reassignment from high-risk duties (driving, heights, machinery). Medical documentation supports accommodations under disability laws."
                        />
                      </>
                    )}

                    {/* MODULE 7: Rehabilitation by Phenotype */}
                    {moduleId === 7 && section.id === 'phenotype-framework' && (
                      <>
                        <KeyConcept
                          title="6 Clinical Phenotypes (Ellis Classification)"
                          content="1) Physiological/Autonomic (Buffalo Test), 2) Vestibular-Ocular (VOMS+), 3) Cervicogenic (neck pain), 4) Cognitive-Fatigue (concentration), 5) Post-traumatic Migraine (headache), 6) Anxiety/Mood (PHQ-9/GAD-7). MOST patients have MIXED phenotypes - treat all contributors."
                        />
                        <ClinicalInsight
                          type="info"
                          title="Mixed Phenotypes Are the Norm"
                          content="Most patients have 2-3 dominant phenotypes. Single-approach treatment FAILS. Example: headache + dizziness + neck pain = migraine + vestibular + cervicogenic → requires combined pharmacotherapy + vestibular rehab + cervical physio."
                        />
                        <QuickCheck
                          question="Patient has positive VOMS, neck stiffness, and PHQ-9 score of 12. This represents:"
                          options={[
                            "Single vestibular phenotype",
                            "Mixed phenotype: vestibular + cervicogenic + mood",
                            "Malingering",
                            "Normal post-concussion recovery"
                          ]}
                          correctAnswer={1}
                          explanation="Positive VOMS (vestibular) + neck stiffness (cervicogenic) + PHQ-9≥10 (depression) = MIXED PHENOTYPE requiring: vestibular physio + cervical treatment + psychology referral. Address all three simultaneously for optimal outcomes."
                        />
                      </>
                    )}

                    {moduleId === 7 && section.id === 'vestibular-rehab-detailed' && (
                      <>
                        <Flowchart
                          title="Vestibular Rehabilitation Protocol"
                          steps={[
                            { label: "Week 1-2: VOR x1 Exercises", description: "Gaze stabilization: hold target, rotate head. 30 sec × 3 sets, 2-3x/day" },
                            { label: "Week 2-3: Add Habituation", description: "Controlled exposure to symptom triggers (head rolls, bending)" },
                            { label: "Week 3-4: Progress to VOR x2", description: "Head and target move opposite directions. More challenging." },
                            { label: "Week 4-6: Dynamic Balance", description: "Standing on foam, walking with head turns, sport-specific drills" },
                            { label: "Week 6-8: Visual Motion Desensitization", description: "Exposure to busy environments, scrolling screens" }
                          ]}
                        />
                        <QuickCheck
                          question="VOR x1 exercises involve:"
                          options={[
                            "Patient closes eyes and rotates head",
                            "Patient holds target steady, rotates head while maintaining focus",
                            "Patient rotates entire body, not head",
                            "Patient tracks moving target with eyes only"
                          ]}
                          correctAnswer={1}
                          explanation="VOR x1 = hold target at arm's length, rotate head side-to-side while maintaining focus on target. Goal: visual stability during head movement. Start sitting, 30 sec × 3 sets, progress to faster movements and standing."
                        />
                      </>
                    )}

                    {moduleId === 7 && section.id === 'vision-therapy-detailed' && (
                      <>
                        <KeyConcept
                          title="Vision Therapy Exercises"
                          content="Convergence: Pencil push-ups (15x, 2x/day), Brock string. Accommodation: Near-far focus, Hart charts. Saccades: Rapid target jumps. Smooth Pursuit: Track moving objects. Goal: NPC from >6cm to <5cm in 6-12 weeks."
                        />
                        <ClinicalInsight
                          type="success"
                          title="Convergence Insufficiency Treatment"
                          content="Pencil push-ups: Slowly bring pencil toward nose until diplopia (double vision) occurs, then back away slightly. Hold 15 seconds. Repeat 15x, 2x/day. 70-80% success rate in 6-12 weeks. Combine with Brock string and computer-based training."
                        />
                        <QuickCheck
                          question="Goal of convergence exercises (pencil push-ups):"
                          options={[
                            "Improve distance vision",
                            "Reduce NPC from >6cm to <5cm",
                            "Treat vestibular dysfunction",
                            "Eliminate all headaches"
                          ]}
                          correctAnswer={1}
                          explanation="Convergence exercises aim to improve NPC from >6cm (convergence insufficiency) to <5cm (normal). Treats difficulty reading, headache with near work, words jumping on page. Typically 6-12 weeks of daily exercises."
                        />
                      </>
                    )}

                    {moduleId === 7 && section.id === 'cervicogenic-rehab-detailed' && (
                      <>
                        <Flowchart
                          title="Cervicogenic Treatment Protocol"
                          steps={[
                            { label: "Week 1-2: Manual Therapy", description: "C1-C2 mobilization, soft tissue release. 1-2x/week" },
                            { label: "Week 2-4: Proprioceptive Retraining", description: "Joint position sense, laser pointer exercises" },
                            { label: "Week 3-6: Deep Neck Flexor Strengthening", description: "Chin tucks with pressure biofeedback. 10 sec × 10 reps daily" },
                            { label: "Week 4-8: Postural Correction", description: "Scapular retraction, thoracic extension, ergonomics" },
                            { label: "Ongoing: Home Exercise Program", description: "Daily DNF exercises, ROM, posture awareness" }
                          ]}
                        />
                        <QuickCheck
                          question="C1-C2 flexion-rotation test shows 25° right, 42° left. This indicates:"
                          options={[
                            "Normal - within expected asymmetry",
                            "Right-sided C1-C2 dysfunction",
                            "Left-sided pathology",
                            "Non-specific finding"
                          ]}
                          correctAnswer={1}
                          explanation=">10° asymmetry indicates C1-C2 dysfunction on the RESTRICTED side. The right side shows reduced rotation (25° vs 42°), indicating right C1-C2 dysfunction. This strongly correlates with cervicogenic headache and requires targeted cervical treatment."
                        />
                        <ClinicalInsight
                          type="warning"
                          title="Deep Neck Flexor Weakness"
                          content="Forward head posture weakens deep neck flexors, increases suboccipital tension. Chin tuck exercises with pressure biofeedback (target 22-30 mmHg) restores proper activation. Essential for cervicogenic headache resolution. Daily compliance required."
                        />
                      </>
                    )}

                    {moduleId === 7 && section.id === 'cognitive-rehab-detailed' && (
                      <>
                        <KeyConcept
                          title="Graduated Cognitive Activation"
                          content="Start 15-20 min cognitive work, gradually increase. Use Pomodoro (25 min work, 5 min break). Avoid 'boom-bust' cycles. Environmental mods: quiet space, dim lights, blue-light filters. Compensatory strategies: planners, reminders, task breakdown."
                        />
                        <QuickCheck
                          question="'Boom-bust cycle' in cognitive rehabilitation refers to:"
                          options={[
                            "Gradually increasing cognitive load over time",
                            "Overdoing on good days, then crashing → worsens symptoms",
                            "Taking frequent breaks during work",
                            "Complete cognitive rest for 4 weeks"
                          ]}
                          correctAnswer={1}
                          explanation="Boom-bust = overdoing activity on good days (boom), leading to symptom flare and extended rest (bust). This pattern DELAYS recovery. Solution: PACING - consistent daily structure with work-rest ratios (e.g., 25 min work, 5 min break) regardless of how you feel."
                        />
                      </>
                    )}

                    {moduleId === 7 && section.id === 'migraine-management' && (
                      <>
                        <ClinicalInsight
                          type="info"
                          title="Post-Traumatic Migraine vs Tension Headache"
                          content="PTM: Pulsating, photophobia, phonophobia, nausea, worse with activity. Tension: Band-like pressure, no nausea, not worse with activity. PTM requires migraine-specific treatment (triptans, preventatives). History of migraine increases PTM risk 3-5x."
                        />
                        <QuickCheck
                          question="First-line abortive treatment for post-traumatic migraine:"
                          options={[
                            "Opioids",
                            "Paracetamol/acetaminophen only",
                            "Triptans (sumatriptan, rizatriptan)",
                            "Caffeine only"
                          ]}
                          correctAnswer={2}
                          explanation="Triptans (e.g., sumatriptan 50-100mg, rizatriptan 10mg) are FIRST-LINE for post-traumatic migraine with severe attacks. Contraindicated in uncontrolled HTN, cardiovascular disease. Avoid opioids. Limit triptan use to <10 days/month to prevent medication overuse headache."
                        />
                      </>
                    )}

                    {/* MODULE 8: Legal, Ethical, Documentation */}
                    {moduleId === 8 && section.id === 'duty-of-care' && (
                      <>
                        <KeyConcept
                          title="Duty of Care Fundamentals"
                          content="Legal obligation to provide care meeting professional standards. Failure = negligence if harm results. REMOVE from play when suspected. TIMELY specialist referral. PREMATURE clearance = potential liability. Document objective findings supporting all decisions."
                        />
                        <ClinicalInsight
                          type="warning"
                          title="'When in Doubt, Sit Them Out'"
                          content="Legal AND ethical obligation to remove athlete when concussion suspected. Returning athlete with suspected concussion = BREACH OF DUTY. Even if athlete/coach/parent pressures return, YOU are legally responsible. Document removal decision and reasoning."
                        />
                        <QuickCheck
                          question="An athlete is dazed after collision but wants to continue. Coach says 'he's fine.' Your obligation:"
                          options={[
                            "Allow return if athlete feels okay",
                            "Defer to coach's judgment - they know the athlete",
                            "Remove from play immediately - 'when in doubt, sit them out'",
                            "Allow return but monitor closely"
                          ]}
                          correctAnswer={2}
                          explanation="REMOVE FROM PLAY immediately. Legal and ethical obligation trumps athlete/coach preferences. 'When in doubt, sit them out' is the medicolegal standard. Comprehensive SCAT6 evaluation required before any consideration of return (typically not same-day). Document decision."
                        />
                      </>
                    )}

                    {moduleId === 8 && section.id === 'informed-consent' && (
                      <>
                        <Flowchart
                          title="Informed Consent Elements"
                          steps={[
                            { label: "1. Diagnosis & Condition", description: "Explain concussion, expected recovery, potential complications" },
                            { label: "2. Treatment Options", description: "Proposed plan with risks/benefits of each option" },
                            { label: "3. Alternatives", description: "Include option of no treatment and its implications" },
                            { label: "4. Material Risks", description: "What reasonable person would want to know (re-injury risk, prolonged symptoms)" },
                            { label: "5. Opportunity to Ask", description: "Answer questions, ensure understanding (teach-back)" },
                            { label: "6. Voluntary Agreement", description: "No coercion. Patient free to decline or withdraw consent" }
                          ]}
                        />
                        <QuickCheck
                          question="TRUE or FALSE: Parental consent is sufficient for treating a 16-year-old athlete"
                          options={[
                            "True - parent consent covers all minors",
                            "False - mature minor doctrine may apply; adolescents should provide assent"
                          ]}
                          correctAnswer={1}
                          explanation="While parental consent is legally required for minors, best practice includes obtaining the adolescent's assent (agreement). The mature minor doctrine recognizes that teenagers can participate in healthcare decisions. Document both parent consent and athlete assent."
                        />
                        <ClinicalInsight
                          type="info"
                          title="Shared Decision-Making for RTS"
                          content="Return-to-sport decisions in youth involve athlete, parents, healthcare team. Balance benefits (return to valued activity) vs risks (re-injury). Particularly important when athlete eager to return but medical team cautious. DOCUMENT discussions thoroughly."
                        />
                      </>
                    )}

                    {moduleId === 8 && section.id === 'medico-legal-contexts' && (
                      <>
                        <KeyConcept
                          title="Medico-Legal Contexts"
                          content="Workers Comp: Timely reporting (<48h), detailed functional restrictions, objective documentation. Litigation (MVA): Assume records will be scrutinized, avoid speculation about causation early. IME: No treatment relationship, objective assessment only."
                        />
                        <QuickCheck
                          question="Documentation in litigation contexts should be:"
                          options={[
                            "Brief and minimal to avoid legal scrutiny",
                            "Detailed, objective, as if will be read in court",
                            "Include speculation about long-term prognosis",
                            "Omit subjective patient complaints"
                          ]}
                          correctAnswer={1}
                          explanation="Write as if it WILL be read in court. Detailed, objective, contemporaneous. Objective findings > subjective impressions. Avoid speculation (especially early about causation/permanence). No alterations. Explain jargon. Include patient reports (subjective) AND your findings (objective)."
                        />
                      </>
                    )}

                    {moduleId === 8 && section.id === 'documentation-standards' && (
                      <>
                        <Flowchart
                          title="Initial Concussion Assessment Documentation"
                          steps={[
                            { label: "Injury Details", description: "Date/time/location, mechanism, forces involved" },
                            { label: "Immediate Symptoms", description: "LOC duration, PTA duration, initial symptom severity" },
                            { label: "Red Flag Screen", description: "Worsening headache, seizures, focal deficits, altered consciousness" },
                            { label: "Physical Examination", description: "VOMS (scores), BESS (errors), cervical exam, cranial nerves" },
                            { label: "Cognitive Screening", description: "Orientation, memory, Maddocks questions" },
                            { label: "Diagnosis & Plan", description: "Diagnosis, initial management, return precautions, follow-up date" }
                          ]}
                        />
                        <ClinicalInsight
                          type="success"
                          title="Clearance Documentation Essentials"
                          content="Must include: (1) Date symptom-free, (2) Completion of graduated protocol without recurrence, (3) Normal exam (VOMS, BESS, cognitive), (4) Clearance for unrestricted activities with effective date, (5) Any ongoing recommendations. Keep copy for your records."
                        />
                        <QuickCheck
                          question="Best practice for clinical documentation:"
                          options={[
                            "Document when convenient, can be days later",
                            "Use abbreviations without explanation to save time",
                            "Contemporaneous (documented when occurred), objective, legible",
                            "Alter notes if you remember additional details later"
                          ]}
                          correctAnswer={2}
                          explanation="CONTEMPORANEOUS (document when occurred, not retrospectively), OBJECTIVE findings prioritized, LEGIBLE (typed preferred), NO alterations (if error: single line through, date/initial, write correction). Explain abbreviations. Write as if will be read in court years later."
                        />
                      </>
                    )}

                    {moduleId === 8 && section.id === 'communication-strategies' && (
                      <>
                        <KeyConcept
                          title="Stakeholder Communication Strategies"
                          content="Patients: Plain language, teach-back method, written info, realistic expectations. Schools: Medical letter with SPECIFIC accommodations (50-100% extended time). Employers: Functional capacity, specific restrictions, timeline. Athletes: United front with coaches/trainers."
                        />
                        <ClinicalInsight
                          type="warning"
                          title="Be Specific in Accommodation Letters"
                          content="VAGUE: 'Student needs accommodations.' SPECIFIC: 'Extended time 50-100% on tests, reduced course load (4 instead of 6 classes), quiet testing room, permission to leave if symptoms worsen, no PE/sports, rest breaks every 60 minutes.' Specificity ensures implementation."
                        />
                        <QuickCheck
                          question="School accommodation letter should include:"
                          options={[
                            "Diagnosis only",
                            "Specific accommodations (extended time %), restrictions, timeline, review date",
                            "Vague recommendation to 'take it easy'",
                            "No mention of restrictions to avoid stigma"
                          ]}
                          correctAnswer={1}
                          explanation="Must be SPECIFIC: exact accommodations needed (50-100% extended time, reduced load, quiet room, breaks), explicit restrictions (no PE/sports), expected timeline, review/update plan, contact person. Vague letters lead to poor implementation and unmet student needs."
                        />
                      </>
                    )}

                    {moduleId === 8 && section.id === 'ethical-considerations' && (
                      <>
                        <ClinicalInsight
                          type="info"
                          title="Ethical Principles in Concussion Care"
                          content="BENEFICENCE: Act in patient's best interest (sometimes means withholding clearance despite pressure). NON-MALEFICENCE: Do no harm (premature clearance = harm). AUTONOMY: Respect patient decisions while providing guidance. JUSTICE: Equitable access to care regardless of ability to pay."
                        />
                        <QuickCheck
                          question="An athlete's parent offers payment to expedite return-to-play clearance. Ethical response:"
                          options={[
                            "Accept if it doesn't affect clinical judgment",
                            "Decline - clearance based on clinical criteria only, not payment",
                            "Provide faster appointments but maintain clinical standards",
                            "Refer to colleague who can make decision"
                          ]}
                          correctAnswer={1}
                          explanation="DECLINE. Clearance decisions must be based SOLELY on clinical criteria (symptom resolution, normal exam, completed protocol). Financial incentives create conflict of interest. Maintain professional boundaries. Ethical principles (beneficence, non-maleficence) trump financial gain."
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Add section divider with icon - only for paid users between sections */}
                {hasFullAccess && index < module.sections.length - 1 && (
                  <div className="flex items-center justify-center my-6">
                    <div className="flex items-center gap-3 px-6 py-2 bg-slate-100 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Next Section
                      </span>
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Show lock banner after second section for non-paid users */}
            {!hasFullAccess && index === 1 && (
              <>
                <ContentLockedBanner />

                {/* Blurred preview of additional locked content */}
                <div className="relative pointer-events-none select-none mb-6">
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10"></div>
                  <div className="opacity-30 blur-sm">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
                      <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                        <div className="flex-1">
                          <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                            <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                            <div className="h-4 bg-slate-100 rounded w-4/6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                      <div className="flex items-start gap-6">
                        <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                        <div className="flex-1">
                          <div className="h-6 bg-slate-200 rounded w-2/3 mb-4"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-100 rounded w-full"></div>
                            <div className="h-4 bg-slate-100 rounded w-4/5"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            </React.Fragment>
          )
        })}

          {/* Rest of content only for paid users */}
          {hasFullAccess && (
            <>
              {/* Downloadable Resources */}
              <DownloadableResources moduleId={moduleId} />

          {/* Apply Tomorrow */}
          <ApplyTomorrow moduleId={moduleId} />

          {/* Quiz Section */}
          <div id="quiz" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <div className="flex items-start gap-6 mb-8">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 border border-teal-200 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-teal-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Knowledge Check</h2>
                <p className="text-[15px] text-slate-600 leading-relaxed">
                  Test your understanding of the clinical content. You need at least {Math.ceil(module.quiz.length * 0.67)} out of {module.quiz.length} questions correct to pass and earn your CPD points.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {module.quiz?.map((question, qIndex) => (
                <div key={question.id} className="space-y-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {qIndex + 1}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Question {qIndex + 1} of {module.quiz?.length || 0}
                      </span>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-900 text-base leading-relaxed ml-11">
                    {question.question}
                  </p>
                  <div className="space-y-3 ml-12">
                    {question.options?.map((option, oIndex) => {
                      const isSelected = quizAnswers[question.id] === oIndex
                      const isCorrect = question.correctAnswer === oIndex
                      const showResult = quizSubmitted

                      return (
                        <label
                          key={oIndex}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2',
                            !showResult && 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                            isSelected && !showResult && 'border-teal-500 bg-teal-50/50',
                            showResult && isCorrect && 'border-teal-500 bg-teal-50',
                            showResult && isSelected && !isCorrect && 'border-red-400 bg-red-50'
                          )}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            checked={isSelected}
                            onChange={() =>
                              !quizSubmitted &&
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [question.id]: oIndex,
                              }))
                            }
                            disabled={quizSubmitted}
                            className="mt-0.5 w-4 h-4 text-teal-600 flex-shrink-0"
                          />
                          <span className="text-[15px] text-slate-700 leading-relaxed">{option}</span>
                          {showResult && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-teal-600 ml-auto flex-shrink-0" strokeWidth={2.5} />
                          )}
                        </label>
                      )
                    })}
                  </div>
                  {quizSubmitted && (
                    <div className="ml-12 mt-4 p-5 rounded-xl bg-blue-50 border border-blue-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Explanation</p>
                      <p className="text-[15px] text-slate-700 leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 my-8" />

            {!quizSubmitted ? (
              <button
                onClick={handleQuizSubmit}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                Submit Knowledge Check
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className={cn(
                "p-6 rounded-xl border-2",
                quizResult?.passed
                  ? "bg-teal-50 border-teal-500"
                  : "bg-amber-50 border-amber-500"
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    quizResult?.passed ? "bg-teal-100" : "bg-amber-100"
                  )}>
                    {quizResult?.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-teal-700" strokeWidth={2.5} />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-700" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-slate-900 mb-1">
                      {quizResult?.passed ? 'Knowledge Check Passed!' : 'Review Required'}
                    </p>
                    <p className="text-[15px] text-slate-700 mb-4">
                      You scored {quizResult?.score} out of {module.quiz.length} ({quizResult?.percentage.toFixed(0)}%)
                      {!quizResult?.passed && '. Please review the content and try again.'}
                    </p>
                    {!quizResult?.passed && (
                      <button
                        onClick={() => {
                          setQuizSubmitted(false)
                          setQuizAnswers({})
                          // Scroll to quiz section
                          const quizSection = document.getElementById('quiz')
                          if (quizSection) {
                            quizSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        }}
                        className="px-6 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                        </svg>
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Complete Module Section */}
          {showCompleteButton && (
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl shadow-sm border-2 border-teal-200 p-8 mb-6">
              <div className="flex items-start gap-6">
                <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Complete</h3>
                  <p className="text-[15px] text-slate-700 mb-6 leading-relaxed">
                    Congratulations! You've met all the requirements for this module. Mark it as complete to earn your {module.points} CPD points.
                  </p>
                  <button
                    onClick={handleCompleteModule}
                    className="px-8 py-3.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                    Complete Module & Earn CPD Points
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showCompleteButton && !isModuleComplete(moduleId) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">
                Completion Requirements
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50">
                  <div className="flex-shrink-0 mt-0.5">
                    {moduleProgress.quizCompleted &&
                     moduleProgress.quizScore !== null &&
                     moduleProgress.quizTotalQuestions !== null &&
                     (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= 0.75 ? (
                      <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-slate-900 mb-1">
                      Pass Final Knowledge Check
                    </p>
                    <p className="text-sm text-slate-600">
                      Score at least 75% to demonstrate mastery
                      {moduleProgress.quizCompleted &&
                       moduleProgress.quizScore !== null &&
                       moduleProgress.quizTotalQuestions !== null &&
                       (moduleProgress.quizScore / moduleProgress.quizTotalQuestions) >= 0.75 && ' ✓ Completed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical References */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6 tracking-tight">Clinical References</h3>
            <div className="space-y-4">
              {module.clinicalReferences?.map((ref, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pt-0.5">
                    {ref}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="bg-slate-50 rounded-xl p-5">
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">AHPRA Accredited:</span> All clinical content is evidence-based and regularly updated to reflect current best practices in concussion management. These references support AHPRA Continuing Professional Development (CPD) requirements for Australian health practitioners.
                </p>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
