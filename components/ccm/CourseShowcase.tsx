'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SstWatchVisual, BaselineLaptopVisual } from '@/components/clinical/InstrumentVisuals'

/**
 * Loom-style auto-advancing showcase of the ONLINE course — for audience pages
 * whose buyers get the online component only (owner 2026-08-15: the live
 * AU-workshop photo "doesn't make sense — they are only signing up for the
 * online component… loom style slideshow on quizzes, infographics, sst clips").
 *
 * Every slide is a REAL asset: the actual course screenshot, two of the
 * course's own infographics, a quiz in the course's real single-best-answer
 * format (the sample uses the published BCTT ≥3-point criterion — never gated
 * answer-key content), and the animated SST Trainer visual. No stock, nothing
 * fabricated.
 */

const SLIDE_MS = 2250

const QUIZ_OPTIONS = [
  { label: 'Voluntary exhaustion with no symptom change', correct: false },
  { label: 'A symptom rise of ≥3 points from the pre-test rating', correct: true },
  { label: 'Reaching 85% of age-predicted max heart rate', correct: false },
]

function QuizSlide({ active }: { active: boolean }) {
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    if (!active) { setRevealed(false); return }
    const id = setTimeout(() => setRevealed(true), 700)
    return () => clearTimeout(id)
  }, [active])
  return (
    <div className="flex h-full w-full flex-col justify-center bg-slate-50 px-6 py-5 sm:px-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700 mb-2">Module 3 · checkpoint quiz</p>
      <p className="text-[14.5px] sm:text-base font-bold text-slate-900 leading-snug mb-3">
        During a BCTT, the test is stopped and the heart-rate threshold recorded when…
      </p>
      <div className="space-y-2">
        {QUIZ_OPTIONS.map((o) => (
          <div
            key={o.label}
            className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[12.5px] sm:text-[13.5px] transition-all duration-300 ${
              revealed && o.correct
                ? 'border-teal-500 bg-teal-50 text-teal-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <span
              className={`flex h-4.5 w-4.5 flex-none items-center justify-center rounded-full border transition-all duration-300 ${
                revealed && o.correct ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
              }`}
            >
              {revealed && o.correct && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            {o.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function InfographicSlide({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white p-3">
      <Image src={src} alt={alt} fill className="object-contain p-2" />
    </div>
  )
}

function ClipSlide({ active }: { active: boolean }) {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (active) { v.currentTime = 0; v.play().catch(() => {}) } else { v.pause() }
  }, [active])
  return (
    <video
      ref={ref}
      src="/sst-demo.mp4"
      muted
      loop
      playsInline
      preload="metadata"
      className="h-full w-full object-contain bg-slate-950"
    />
  )
}

const SLIDES: { key: string; caption: string; render: (active: boolean) => React.ReactNode }[] = [
  {
    key: 'course',
    caption: 'Inside the course — 8 self-paced online modules',
    render: () => (
      // objectPosition skips the screenshot's own nav bar (it carries the
      // retired internal "ConcussionPro" wordmark — internal name never public).
      <Image src="/ccm-online-preview.png" alt="Inside the online course — module lesson view" fill className="object-cover" style={{ objectPosition: '50% 18%' }} />
    ),
  },
  { key: 'scat6', caption: 'The SCAT6 family — which tool, when', render: () => <InfographicSlide src="/infographics/scat6-family.png" alt="SCAT6 assessment family infographic" /> },
  { key: 'voms', caption: 'The VOMS battery, step by step', render: () => <InfographicSlide src="/infographics/voms-battery.png" alt="VOMS battery infographic" /> },
  {
    key: 'quiz',
    caption: 'Checkpoint quizzes as you go — certificate at 75%',
    render: (active) => <QuizSlide active={active} />,
  },
  { key: 'redflag', caption: 'Red-flag decisions — when it is not a concussion', render: () => <InfographicSlide src="/infographics/red-flag-decision.png" alt="Red flag decision infographic" /> },
  { key: 'clusters', caption: 'Symptom clusters → phenotype-based rehab', render: () => <InfographicSlide src="/infographics/concussion-symptom-clusters.png" alt="Concussion symptom clusters infographic" /> },
  { key: 'phenotype', caption: 'The phenotype map — target what you find', render: () => <InfographicSlide src="/infographics/phenotype-map.png" alt="Concussion phenotype map infographic" /> },
  { key: 'rtp', caption: 'Graded return to sport — the full progression', render: () => <InfographicSlide src="/infographics/graded-return-to-sport.png" alt="Graded return-to-sport infographic" /> },
  { key: 'bctt', caption: 'The BCTT — test to threshold to prescription', render: () => <InfographicSlide src="/infographics/bctt-protocol.png" alt="Buffalo Concussion Treadmill Test protocol infographic" /> },
  { key: 'clip', caption: 'The SST Trainer in action — included with enrolment', render: (active) => <ClipSlide active={active} /> },
  {
    key: 'baseline',
    caption: 'SCAT6 baseline testing — one link per club, any computer',
    render: () => (
      <div className="h-full w-full [&>*]:h-full">
        <BaselineLaptopVisual />
      </div>
    ),
  },
  {
    key: 'sst',
    caption: 'Live heart-rate training on the wearable they own',
    render: () => (
      <div className="h-full w-full [&>*]:h-full">
        <SstWatchVisual />
      </div>
    ),
  },
]


export default function CourseShowcase({
  enrolHref = '#pricing-cards',
  trialHref = '/preview',
}: {
  /** Where a click on the showcase stage / Enrol button lands. */
  enrolHref?: string
  /** The free test-drive (Module 1, no signup). */
  trialHref?: string
} = {}) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), SLIDE_MS)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [paused])

  return (
    <div
      className="max-w-4xl mx-auto mb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-[0_18px_44px_-16px_rgba(15,23,42,0.5)]">
        {/* Loom-style chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-[11px] font-semibold text-slate-400 truncate">
            Concussion Clinical Mastery — course preview
          </span>
        </div>

        {/* Stage — clickable: exploring the preview routes to the free trial */}
        <Link href={trialHref} aria-label="Preview Module 1 free" className="relative block h-[240px] sm:h-[300px] md:h-[360px] bg-slate-950">
          {SLIDES.map((s, i) => (
            <div
              key={s.key}
              className={`absolute inset-0 transition-opacity duration-500 ${i === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              aria-hidden={i !== idx}
            >
              {s.render(i === idx)}
            </div>
          ))}
        </Link>

        {/* Caption + segment progress */}
        <div className="px-4 py-3">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] sm:text-[13.5px] font-semibold text-slate-200 m-0">
              {SLIDES[idx].caption}
            </p>
            <span className="flex items-center gap-2">
              <Link href={trialHref} className="inline-flex items-center gap-1 rounded-lg border border-white/25 px-3 py-1.5 text-[12px] font-bold text-slate-100 hover:bg-white/10 transition-colors">
                Preview free
              </Link>
              <Link href={enrolHref} className="inline-flex items-center gap-1 rounded-lg bg-teal-500 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-teal-400 transition-colors">
                Enrol <ArrowRight className="h-3 w-3" />
              </Link>
            </span>
          </div>
          <div className="flex gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Show: ${s.caption}`}
                onClick={() => setIdx(i)}
                className="flex-1 overflow-hidden rounded-full bg-white/15 border-0 p-0 appearance-none cursor-pointer"
                style={{ height: 6, minHeight: 6 }}
              >
                <span
                  className={`block h-full rounded-full bg-teal-400 ${
                    i < idx ? 'w-full' : i === idx ? 'w-full origin-left' : 'w-0'
                  }`}
                  style={
                    i === idx && !paused
                      ? { animation: `showcase-fill ${SLIDE_MS}ms linear forwards` }
                      : undefined
                  }
                />
              </button>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes showcase-fill {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
    </div>
  )
}
