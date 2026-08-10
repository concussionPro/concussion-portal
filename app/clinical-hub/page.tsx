'use client'

import { useEffect, useState } from 'react'
import { SstLivePanel } from '@/components/sst-trainer/SstLivePanel'
import { PmsFileButton } from '@/components/clinical/PmsFileButton'
import { SstTrajectory, type TrajectoryPoint } from '@/components/sst-trainer/SstTrajectory'
import { PROTOCOL_STAGE_CAP, SESSION_STOP_RISE } from '@/lib/sst-trainer/protocol'
import {
  HeartPulse, Activity, Plus, Search, Calendar, TrendingDown, ClipboardList,
  AlertTriangle, AlertOctagon, Check, ChevronRight, ChevronLeft, Stethoscope, ArrowUpRight, Clock,
  NotebookPen, ShieldCheck, QrCode, KeyRound, FileText,
} from 'lucide-react'

/* ───────────────────────────────────────────────────────────────────
   CLINICAL HUB — the treating clinician's supervision surface for the
   SST Trainer: live in-session HR, each patient's serial MEASURED HRt
   recovery trajectory, session history, and the clearance-ready signal.

   Two modes:
   - DEMO (no ?clinic= param, or ?clinic=DEMO00): the fixture roster below,
     clearly banner-labelled. Un-wired features (add patient, notes, stage
     editing, SCAT6 baseline) render ONLY here.
   - REAL (?clinic=CODE&k=VIEWKEY): everything on screen comes from
     /api/sst/clinic-sessions. Zero patients → an honest empty state, never
     the demo roster. A missing/rejected view key shows a key state, never
     a silent fall-through to fake data.
─────────────────────────────────────────────────────────────────── */

type Stage = { n: number; label: string }

type Session = {
  date: string                    // display string
  dateIso?: string | null         // parseable date when known
  avgHr?: number | null
  peakHr?: number | null
  mins?: number | null
  symptomDelta?: number | null    // peakSymptom − preSymptom (null = unknown, shown as —)
  status: 'clean' | 'flare' | 'unknown'
  eventType?: string | null       // e.g. 'symptom-stopped' | 'abandoned' (new app versions)
  modality?: string | null        // treadmill / bike / walk
  verifiedReadingPct?: number | null
  hrVerified?: boolean
  nextDayFlare?: boolean
  overrodeStop?: boolean
  sessionEndFeel?: string | null
  timeInBandPct?: number | null
  deviceName?: string | null      // e.g. "Garmin Forerunner" — future payload field
}

type Patient = {
  id: string
  /** stable grouping key — patientRef UUID when the app sent one, else the normalised label */
  patientKey?: string
  name: string
  /** The stored patient_label — `name` may carry a display-only "(2)" suffix.
   *  Everything that QUERIES or PRINTS must use this. */
  label?: string
  age?: number | null
  sport?: string | null
  code: string
  injuryDate?: string | null
  daysPost?: number | null
  stage: Stage
  hrt: number | null
  bandLow: number
  bandHigh: number
  restSymptoms?: number | null
  baseline: 'captured' | 'due' | 'none'
  baselineDate?: string
  trend: number[]                 // symptom score over weeks (lower = better) — demo only
  hrtPoints?: TrajectoryPoint[]   // serial MEASURED HRt = the recovery-trajectory instrument
  sessions: Session[]             // newest first
  lastActivity?: string | null    // ISO
  clearanceReady?: boolean
  /** minutes of the graded ramp behind the clearance signal (null = not recorded) */
  clearanceRamp?: number | null
  flag?: string
  notes?: string
  /** DEMO only — which completed episode this row's reports render. */
  demoCase?: 'recovery' | 'adherence' | 'stalled'
}

/* ── Demo fixture helpers ───────────────────────────────────────────────────
   Dates are computed RELATIVE TO TODAY so the demo never goes stale — a pitch
   recipient opening this in six months still sees a live-looking caseload, not
   an abandoned one. Bands are DERIVED from HRt (80–90%, the prescribed range)
   so a hand-typed band can never contradict the threshold it came from — that
   bug shipped once (a 171 bpm HRt paired with a 154–162 band). */
const dayMs = 86_400_000
/** ISO date N days before today. */
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * dayMs).toISOString().slice(0, 10)
/** Short display date N days before today ("14 Jul"), or "Today". */
const short = (daysAgo: number) =>
  daysAgo === 0
    ? 'Today'
    : new Date(Date.now() - daysAgo * dayMs).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
/** Prescribed sub-symptom band: 80–90% of the measured threshold. */
const band = (hrt: number) => ({ bandLow: Math.round(hrt * 0.8), bandHigh: Math.round(hrt * 0.9) })

/* The demo caseload walks the WHOLE pathway, intake → ACC884-ready discharge,
   so a clinical or contract lead can see what managing a real cohort looks
   like rather than one patient in isolation. Each patient is a different
   moment in the protocol, and between them they exercise every decision rule:
   the prognostic HRt<135 flag, reduce-don't-rest after a flare, the
   verified-only progression gate, the ceiling cap forcing a re-test, and the
   no-intolerance re-test that surfaces clearance review. */
const PATIENTS: Patient[] = [
  /* ── The three COMPLETED episodes ───────────────────────────────────────
     These are the case set. Everything below them is the live pathway at
     earlier stages; these three are finished courses of care with a full
     serial-threshold trajectory and a signable report behind each one, and
     they are what a clinician is actually being shown.

     De-identified to initials, age band, sex and sport — enough clinical
     context for the case to read, nothing that resembles a person. Each row's
     report opens its own episode via `demoCase`. */
  {
    id: 'c-adherence', name: 'R.K. — 31F, recreational netball', age: 31,
    sport: 'Netball', code: 'CEA-8812', demoCase: 'adherence',
    injuryDate: short(30), daysPost: 30, stage: { n: 4, label: 'Sub-symptom aerobic — plateaued' },
    hrt: 131, ...band(131), restSymptoms: 3, baseline: 'none',
    trend: [52, 48, 45, 43],
    hrtPoints: [
      { date: iso(27), hrt: 124, source: 'bluetooth', verified: true, gated: true },
      { date: iso(18), hrt: 127, source: 'bluetooth', verified: true, gated: true },
      { date: iso(9), hrt: 129, source: 'bluetooth', verified: true, gated: true },
      { date: iso(1), hrt: 131, source: 'bluetooth', verified: true, gated: true },
    ],
    sessions: [
      { date: short(1), avgHr: 118, peakHr: 127, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 91, modality: 'Bike' },
      { date: short(3), avgHr: 121, peakHr: 133, mins: 20, symptomDelta: 1, status: 'clean', hrVerified: true, timeInBandPct: 84, modality: 'Bike' },
      { date: short(5), avgHr: 127, peakHr: 141, mins: 20, symptomDelta: 2, status: 'flare', hrVerified: true, nextDayFlare: true, timeInBandPct: 38, modality: 'Treadmill' },
      { date: short(8), avgHr: 116, peakHr: 124, mins: 18, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 96, modality: 'Bike' },
      { date: short(10), avgHr: 124, peakHr: 138, mins: 20, symptomDelta: 1, status: 'clean', hrVerified: true, timeInBandPct: 44, modality: 'Treadmill' },
      { date: short(12), avgHr: null, peakHr: null, mins: 20, symptomDelta: 0, status: 'unknown', hrVerified: false, modality: 'Bike' },
      { date: short(15), avgHr: 119, peakHr: 129, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 88, modality: 'Bike' },
      { date: short(17), avgHr: 126, peakHr: 140, mins: 20, symptomDelta: 2, status: 'flare', hrVerified: true, nextDayFlare: true, timeInBandPct: 41, modality: 'Treadmill' },
      { date: short(19), avgHr: 115, peakHr: 123, mins: 16, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 94, modality: 'Bike' },
      { date: short(22), avgHr: 123, peakHr: 136, mins: 20, symptomDelta: 1, status: 'clean', hrVerified: true, timeInBandPct: 47, modality: 'Treadmill' },
      { date: short(24), avgHr: null, peakHr: null, mins: 20, symptomDelta: 1, status: 'unknown', hrVerified: false, modality: 'Bike' },
      { date: short(26), avgHr: 117, peakHr: 126, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 92, modality: 'Bike' },
      { date: short(28), avgHr: 120, peakHr: 130, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 86, modality: 'Bike' },
    ],
    lastActivity: iso(1),
    flag: 'Adherent on paper — 11 of 13 sessions HR-verified, but only 7 held inside the band and 4 drifted above it. Threshold has moved 7 bpm in four weeks.',
  },
  {
    id: 'c-stalled', name: 'D.P. — 17M, school rugby', age: 17,
    sport: 'Rugby union', code: 'CEA-9034', demoCase: 'stalled',
    injuryDate: short(30), daysPost: 30, stage: { n: 4, label: 'Sub-symptom aerobic — flat since wk 3' },
    hrt: 142, ...band(142), restSymptoms: 3, baseline: 'captured',
    trend: [50, 40, 36, 35],
    hrtPoints: [
      { date: iso(27), hrt: 126, source: 'bluetooth', verified: true, gated: true },
      { date: iso(18), hrt: 141, source: 'bluetooth', verified: true, gated: true },
      { date: iso(9), hrt: 143, source: 'bluetooth', verified: true, gated: true },
      { date: iso(1), hrt: 142, source: 'bluetooth', verified: true, gated: true },
    ],
    sessions: [
      { date: short(1), avgHr: 122, peakHr: 131, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 95, modality: 'Bike' },
      { date: short(3), avgHr: 124, peakHr: 133, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 97, modality: 'Bike' },
      { date: short(6), avgHr: 123, peakHr: 132, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 93, modality: 'Bike' },
      { date: short(8), avgHr: 125, peakHr: 134, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 98, modality: 'Bike' },
      { date: short(11), avgHr: 124, peakHr: 133, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 96, modality: 'Treadmill' },
      { date: short(13), avgHr: 126, peakHr: 135, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 94, modality: 'Treadmill' },
      { date: short(16), avgHr: 125, peakHr: 134, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 97, modality: 'Bike' },
      { date: short(18), avgHr: 127, peakHr: 136, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 95, modality: 'Bike' },
      { date: short(20), avgHr: 126, peakHr: 135, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 99, modality: 'Treadmill' },
      { date: short(23), avgHr: 128, peakHr: 137, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 96, modality: 'Bike' },
      { date: short(25), avgHr: 127, peakHr: 136, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 98, modality: 'Bike' },
      { date: short(27), avgHr: 128, peakHr: 138, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 95, modality: 'Treadmill' },
      { date: short(29), avgHr: 127, peakHr: 137, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 97, modality: 'Bike' },
    ],
    lastActivity: iso(1),
    flag: 'Delivered exactly as prescribed — 13 of 13 verified, all in band, no flares — and the threshold has not moved since week three. Re-assess rather than progress.',
  },
  {
    id: 'c-recovery', name: 'M.T. — 24M, community football', age: 24,
    sport: 'Football (AFL)', code: 'CEA-7729', demoCase: 'recovery',
    injuryDate: short(30), daysPost: 30, stage: { n: 6, label: 'Clearance review' },
    hrt: 155, ...band(155), restSymptoms: 0, baseline: 'captured',
    trend: [48, 34, 20, 8],
    clearanceReady: true, clearanceRamp: 20,
    hrtPoints: [
      { date: iso(27), hrt: 128, source: 'bluetooth', verified: true, gated: true },
      { date: iso(18), hrt: 142, source: 'bluetooth', verified: true, gated: true },
      { date: iso(9), hrt: 155, source: 'bluetooth', verified: true, gated: true },
    ],
    sessions: [
      { date: short(2), avgHr: 141, peakHr: 152, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 96, modality: 'Treadmill' },
      { date: short(4), avgHr: 136, peakHr: 145, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 94, modality: 'Treadmill' },
      { date: short(7), avgHr: 134, peakHr: 143, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 97, modality: 'Bike' },
      { date: short(9), avgHr: 131, peakHr: 140, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 95, modality: 'Bike' },
      { date: short(12), avgHr: 128, peakHr: 137, mins: 20, symptomDelta: 0, status: 'clean', hrVerified: true, timeInBandPct: 98, modality: 'Bike' },
      { date: short(14), avgHr: 126, peakHr: 134, mins: 20, symptomDelta: 1, status: 'clean', hrVerified: true, timeInBandPct: 92, modality: 'Bike' },
      { date: short(17), avgHr: 122, peakHr: 130, mins: 18, symptomDelta: 1, status: 'clean', hrVerified: true, timeInBandPct: 96, modality: 'Bike' },
      { date: short(19), avgHr: 119, peakHr: 127, mins: 18, symptomDelta: 1, status: 'clean', hrVerified: true, timeInBandPct: 93, modality: 'Bike' },
      { date: short(22), avgHr: 116, peakHr: 124, mins: 16, symptomDelta: 2, status: 'clean', hrVerified: true, timeInBandPct: 97, modality: 'Bike' },
      { date: short(25), avgHr: 113, peakHr: 121, mins: 14, symptomDelta: 2, status: 'clean', hrVerified: true, timeInBandPct: 95, modality: 'Bike' },
      { date: short(28), avgHr: 111, peakHr: 118, mins: 12, symptomDelta: 3, status: 'clean', hrVerified: true, timeInBandPct: 91, modality: 'Bike' },
    ],
    lastActivity: iso(2),
    flag: 'Final graded re-test reached volitional exhaustion with no symptom provocation. Exercise tolerance recovered — clearance is a matter for the treating practitioner.',
  },

  {
    id: 'p0', name: 'P.R. — 29F, football (soccer)', age: 29, sport: 'Football (soccer)', code: 'CEA-7104',
    injuryDate: short(3), daysPost: 3, stage: { n: 1, label: 'Intake — symptom-limited' },
    hrt: null, bandLow: 0, bandHigh: 0, restSymptoms: 7, baseline: 'due',
    trend: [46, 43],
    sessions: [],
    lastActivity: iso(1),
    flag: 'Referred 3 days post-injury. Symptom-limited at rest (7/10) — screen and schedule the graded test.',
  },
  {
    id: 'p2', name: 'A.N. — 24F, netball', age: 24, sport: 'Netball', code: 'CEA-5193',
    injuryDate: short(9), daysPost: 9, stage: { n: 2, label: 'Threshold test pending' },
    hrt: null, bandLow: 0, bandHigh: 0, restSymptoms: 6, baseline: 'due',
    trend: [44, 41, 38],
    sessions: [],
    lastActivity: iso(2),
    flag: 'No threshold test yet — symptoms still elevated at rest (6/10).',
  },
  {
    id: 'p4', name: 'S.R. — 14F, AFL', age: 14, sport: 'AFL', code: 'CEA-6011',
    injuryDate: short(16), daysPost: 16, stage: { n: 3, label: 'Sub-symptom aerobic (light)' },
    hrt: 128, ...band(128), restSymptoms: 3, baseline: 'none',
    trend: [40, 33, 27],
    lastActivity: iso(0),
    hrtPoints: [
      { date: iso(11), hrt: 118, source: 'camera', verified: true, gated: true },
      { date: iso(4), hrt: 128, source: 'bluetooth', verified: true, gated: true },
    ],
    sessions: [
      { date: short(0), avgHr: 106, peakHr: 114, mins: 14, symptomDelta: 1, status: 'clean' },
      { date: short(2), avgHr: 104, peakHr: 112, mins: 12, symptomDelta: 2, status: 'flare' },
      { date: short(3), avgHr: 102, peakHr: 110, mins: 20, symptomDelta: 0, status: 'clean' },
    ],
    flag: 'Measured HRt 128 bpm is below the 135 bpm prognostic cut-off — associated with slower recovery. Oversee dosing and re-assess more often.',
  },
  {
    id: 'p1', name: 'L.C. — 17M, rugby union', age: 17, sport: 'Rugby union', code: 'CEA-4827',
    injuryDate: short(28), daysPost: 28, stage: { n: 4, label: 'Sub-symptom aerobic (moderate)' },
    hrt: 148, ...band(148), restSymptoms: 2, baseline: 'captured', baselineDate: short(128),
    trend: [38, 31, 22, 14, 9, 5],
    lastActivity: iso(0),
    hrtPoints: [
      { date: iso(26), hrt: 128, source: 'bluetooth', verified: true, gated: true },
      { date: iso(19), hrt: 135, source: 'camera', verified: true, gated: true },
      { date: iso(12), hrt: 142, source: 'bluetooth', verified: true, gated: true },
      { date: iso(9), hrt: 139, source: 'manual', verified: false, gated: true },
      { date: iso(5), hrt: 148, source: 'bluetooth', verified: true, gated: true },
    ],
    sessions: [
      { date: short(0), avgHr: 126, peakHr: 134, mins: 20, symptomDelta: 0, status: 'clean' },
      { date: short(2), avgHr: 124, peakHr: 131, mins: 20, symptomDelta: 1, status: 'clean' },
      { date: short(4), avgHr: 121, peakHr: 129, mins: 18, symptomDelta: 0, status: 'clean' },
      { date: short(6), avgHr: 118, peakHr: 142, mins: 9, symptomDelta: 3, status: 'flare' },
    ],
    notes: 'Flare six days ago at 9 min — ceiling reduced, daily sessions continued at the lower intensity. Three clean verified sessions since; band advanced.',
  },
  {
    id: 'p3', name: 'M.W. — 31M, cycling', age: 31, sport: 'Cycling', code: 'CEA-3340',
    injuryDate: short(52), daysPost: 52, stage: { n: 6, label: 'Return-to-sport progression' },
    hrt: 171, ...band(171), restSymptoms: 0, baseline: 'captured', baselineDate: short(168),
    trend: [29, 20, 12, 6, 2, 0, 0],
    lastActivity: iso(0),
    hrtPoints: [
      { date: iso(46), hrt: 142, source: 'bluetooth', verified: true, gated: true },
      { date: iso(32), hrt: 156, source: 'bluetooth', verified: true, gated: true },
      { date: iso(18), hrt: 164, source: 'bluetooth', verified: true, gated: true },
      { date: iso(4), hrt: 171, source: 'bluetooth', verified: true, gated: true },
    ],
    sessions: [
      { date: short(0), avgHr: 148, peakHr: 153, mins: 20, symptomDelta: 0, status: 'clean' },
      { date: short(1), avgHr: 146, peakHr: 152, mins: 20, symptomDelta: 0, status: 'clean' },
      { date: short(3), avgHr: 144, peakHr: 151, mins: 20, symptomDelta: 0, status: 'clean' },
    ],
    notes: 'Band has reached the measured threshold — a further advance would exceed it, so the next step is a re-test rather than a higher ceiling.',
  },
  {
    id: 'p5', name: 'D.O. — 22M, basketball', age: 22, sport: 'Basketball', code: 'CEA-2286',
    injuryDate: short(63), daysPost: 63, stage: { n: 7, label: 'Cleared — refer to MD' },
    hrt: 178, ...band(178), restSymptoms: 0, baseline: 'captured', baselineDate: short(201),
    trend: [34, 26, 17, 9, 3, 0, 0, 0],
    lastActivity: iso(2),
    clearanceReady: true,
    hrtPoints: [
      { date: iso(56), hrt: 131, source: 'bluetooth', verified: true, gated: true },
      { date: iso(42), hrt: 149, source: 'bluetooth', verified: true, gated: true },
      { date: iso(28), hrt: 163, source: 'bluetooth', verified: true, gated: true },
      { date: iso(14), hrt: 172, source: 'bluetooth', verified: true, gated: true },
      { date: iso(2), hrt: 178, source: 'bluetooth', verified: true, gated: true },
    ],
    sessions: [
      { date: short(2), avgHr: 156, peakHr: 164, mins: 20, symptomDelta: 0, status: 'clean' },
      { date: short(4), avgHr: 154, peakHr: 161, mins: 20, symptomDelta: 0, status: 'clean' },
      { date: short(6), avgHr: 152, peakHr: 159, mins: 20, symptomDelta: 0, status: 'clean' },
    ],
    notes: 'Latest re-test terminated at voluntary exhaustion (RPE >17) with no symptom provocation — no-intolerance. Episode outcome ready to compile; clearance for contact remains the treating doctor’s decision.',
  },
]

/* Baseline & serial testing — SCAT6/SCOAT6 domain scores: the athlete's
   pre-season baseline vs their latest post-injury test. `better` says which
   direction is recovery. baseline === null → no pre-season test on file.
   FIXTURE DATA — renders in demo mode only, never for a real clinic. */
type Domain = { name: string; unit?: string; baseline: number | null; latest: number | null; better: 'higher' | 'lower' }
type Baseline = { tool: 'SCAT6' | 'SCOAT6'; status: 'captured' | 'due' | 'none'; capturedDate?: string; lastTest?: string; domains: Domain[] }

const BASELINES: Record<string, Baseline> = {
  // Discharge-ready: every domain back at or better than the pre-season baseline
  // — the picture that supports an episode outcome of "recovered".
  p5: {
    tool: 'SCAT6', status: 'captured', capturedDate: short(201), lastTest: short(2),
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: 3, latest: 1, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: 28, latest: 29, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: 5, latest: 5, better: 'higher' },
      { name: 'Delayed recall', unit: '/10', baseline: 9, latest: 10, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: 3, latest: 2, better: 'lower' },
      { name: 'VOMS provocation', unit: 'pts', baseline: 0, latest: 0, better: 'lower' },
    ],
  },
  p1: {
    tool: 'SCAT6', status: 'captured', capturedDate: '14 Mar 2026', lastTest: 'Today',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: 4, latest: 7, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: 28, latest: 27, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: 4, latest: 4, better: 'higher' },
      { name: 'Delayed recall', unit: '/10', baseline: 9, latest: 8, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: 3, latest: 5, better: 'lower' },
      { name: 'VOMS provocation', unit: 'pts', baseline: 0, latest: 2, better: 'lower' },
    ],
  },
  p2: {
    tool: 'SCAT6', status: 'due', capturedDate: '—', lastTest: 'Pending',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: 6, latest: null, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: 27, latest: null, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: 4, latest: null, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: 4, latest: null, better: 'lower' },
    ],
  },
  p3: {
    tool: 'SCAT6', status: 'captured', capturedDate: '2 Feb 2026', lastTest: 'Today',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: 2, latest: 0, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: 29, latest: 30, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: 5, latest: 5, better: 'higher' },
      { name: 'Delayed recall', unit: '/10', baseline: 9, latest: 10, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: 2, latest: 1, better: 'lower' },
      { name: 'VOMS provocation', unit: 'pts', baseline: 0, latest: 0, better: 'lower' },
    ],
  },
  p4: {
    tool: 'SCOAT6', status: 'none', lastTest: 'Today',
    domains: [
      { name: 'Symptom severity', unit: '/132', baseline: null, latest: 18, better: 'lower' },
      { name: 'Immediate memory', unit: '/30', baseline: null, latest: 25, better: 'higher' },
      { name: 'Concentration', unit: '/5', baseline: null, latest: 3, better: 'higher' },
      { name: 'mBESS errors', unit: '/30', baseline: null, latest: 8, better: 'lower' },
      { name: 'VOMS provocation', unit: 'pts', baseline: null, latest: 4, better: 'lower' },
    ],
  },
}

/* Return-to-activity ladder — the clinician advances/holds the patient along it.
   Mirrors a sub-symptom graded-exertion progression; final clearance is the
   treating doctor's call, not the app's. */
const STAGES: { n: number; label: string }[] = [
  { n: 1, label: 'Intake — symptom-limited' },
  { n: 2, label: 'Threshold test' },
  { n: 3, label: 'Sub-symptom aerobic (light)' },
  { n: 4, label: 'Sub-symptom aerobic (moderate)' },
  { n: 5, label: 'Sport-specific / non-contact' },
  { n: 6, label: 'Return-to-sport progression' },
  { n: 7, label: 'Cleared — refer to MD' },
]

/** Recovery status of a domain vs its own baseline. */
function domainState(d: Domain): 'recovered' | 'off' | 'pending' | 'nobaseline' {
  if (d.latest === null) return 'pending'
  if (d.baseline === null) return 'nobaseline'
  const recovered = d.better === 'higher' ? d.latest >= d.baseline : d.latest <= d.baseline
  return recovered ? 'recovered' : 'off'
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('')
}

function fmtShort(d?: string | null): string | null {
  if (!d) return null
  const t = Date.parse(d)
  if (Number.isNaN(t)) return d
  return new Date(t).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function daysAgo(iso?: string | null): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (Number.isNaN(t)) return null
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000))
}

function BaselinePanel({ base }: { base: Baseline }) {
  const hasBaseline = base.status !== 'none'
  return (
    <div className="glass-premium rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
          <h3 className="text-sm font-bold text-foreground">Baseline &amp; serial testing</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/[0.04] text-muted-foreground border border-black/5">
            {base.tool}
          </span>
          {/* fixture panel — page renders it only in demo mode; badge it anyway */}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Demo preview
          </span>
        </div>
        <div className="flex items-center gap-2">
          {base.status === 'captured' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]">
              <Check className="w-3.5 h-3.5" /> Baseline {base.capturedDate}
            </span>
          )}
          {base.status === 'due' && <span className="text-[11px] font-semibold text-amber-600">Serial re-test due</span>}
          {base.status === 'none' && <span className="text-[11px] font-semibold text-muted-foreground">No pre-season baseline</span>}
          <button className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/5 transition">
            {hasBaseline ? 'Run serial test' : 'Capture baseline'} <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1.4fr_repeat(3,0.8fr)] gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
        <span>Domain</span><span className="text-right">Baseline</span><span className="text-right">Latest</span><span className="text-right">Status</span>
      </div>
      <div className="space-y-1">
        {base.domains.map((d, i) => {
          const st = domainState(d)
          const delta = d.baseline !== null && d.latest !== null ? d.latest - d.baseline : null
          const sign = delta === null ? '' : delta > 0 ? `+${delta}` : `${delta}`
          return (
            <div key={i} className="grid grid-cols-[1.4fr_repeat(3,0.8fr)] gap-2 items-center rounded-xl px-3 py-2.5 bg-black/[0.015]">
              <span className="text-xs font-medium text-foreground">{d.name} <span className="text-muted-foreground/50 font-normal">{d.unit}</span></span>
              <span className="text-xs text-right font-mono text-muted-foreground">{d.baseline ?? '—'}</span>
              <span className="text-xs text-right font-mono font-semibold text-foreground">{d.latest ?? '—'}</span>
              <span className="text-right">
                {st === 'recovered' && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)]"><Check className="w-3 h-3" />at base</span>}
                {st === 'off' && <span className="text-[11px] font-semibold text-amber-600">{sign} off base</span>}
                {st === 'pending' && <span className="text-[11px] text-muted-foreground/60">pending</span>}
                {st === 'nobaseline' && <span className="text-[11px] text-muted-foreground/60">no base</span>}
              </span>
            </div>
          )
        })}
      </div>

      {base.status === 'none' && (
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-3">
          No pre-season baseline on file — scores are read against normative ranges only. Capturing a baseline (ideally pre-season) makes every future test a same-athlete comparison.
        </p>
      )}
    </div>
  )
}

// Demo-mode helper: mints a display code for roster additions. Not wired to
// anything real — the Add patient flow renders only in demo mode.
function mintPatientCode(clinic: string, seq: number) {
  return `${clinic}-${String(seq).padStart(2, '0')}`
}

/* ───────────────────────────────────────────────────────────────────
   Real data: /api/sst/clinic-sessions → the Hub's display shape.

   The patient app writes session payloads with avgHeartRate / peakHeartRate /
   completedMinutes / preSymptom / peakSymptom (lib/sst-trainer/protocol.ts
   SessionLog), and newer app versions add eventType / patientRef /
   verifiedReadingPct / sessionEndFeel / nextDayFlare / overrode_stop /
   modality. The API spreads the payload straight into each session row, so we
   accept BOTH the old short keys and the real payload keys, defensively —
   any of these may be absent on old rows.
─────────────────────────────────────────────────────────────────── */
type ApiTrajectoryPoint = {
  date?: string
  hrt?: number | null
  source?: string
  verified?: boolean
  gated?: boolean
  interpretation?: string | null
  eventType?: string | null
  modality?: string | null
  verifiedReadingPct?: number | null
  stagesRecorded?: number | null
  patientRef?: string | null
}

type ApiSession = {
  date?: string
  eventType?: string
  avgHr?: number
  avgHeartRate?: number
  peakHr?: number
  peakHeartRate?: number
  minutes?: number
  mins?: number
  completedMinutes?: number
  symptomDelta?: number
  preSymptom?: number
  peakSymptom?: number
  nextDayFlare?: boolean
  overrode_stop?: boolean
  overrodeStop?: boolean
  sessionEndFeel?: string | null
  verifiedReadingPct?: number
  hrVerified?: boolean
  /** 'bluetooth' | 'camera' | 'manual' — the app stamps this on every sync */
  hrSource?: string
  modality?: string
  patientRef?: string
  deviceName?: string
  timeInBandPct?: number
  inBandPct?: number
  timeInBandSec?: number
  inBandSec?: number
}

type ApiPatient = {
  name?: string
  /** The REAL stored patient_label. `name` may carry the display-only "(2)"
   *  disambiguation suffix, which exists nowhere in the DB and must never reach
   *  a query or a printed clinical document (2026-08-05). */
  label?: string
  patientRef?: string
  condition?: string | null
  hrt?: number | null
  bandLow?: number | null
  bandHigh?: number | null
  hrtTrajectory?: ApiTrajectoryPoint[]
  sessions?: ApiSession[]
  clearanceReady?: boolean
  lastActivity?: string | null
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** The app sends namespaced eventTypes (lib/sst-trainer/clinic-sync.ts
 *  SyncEventType: 'session-symptom-stopped', 'threshold-red-flag',
 *  'test-aborted'…); accept both those and the bare forms defensively. */
function normEvent(e?: string | null): string | null {
  if (!e || typeof e !== 'string') return null
  const v = e.toLowerCase().trim()
  if (v === 'session-symptom-stopped' || v === 'symptom-stopped') return 'symptom-stopped'
  if (v === 'session-abandoned' || v === 'abandoned') return 'abandoned'
  if (v === 'session-completed' || v === 'completed') return 'completed'
  if (v === 'threshold-red-flag' || v === 'red-flag') return 'red-flag'
  if (v === 'test-aborted' || v === 'aborted') return 'aborted'
  if (v === 'red-flag-cleared') return 'red-flag-cleared'
  if (v === 'threshold-no-intolerance' || v === 'no-intolerance') return 'no-intolerance'
  if (v === 'threshold-physiologic' || v === 'physiologic') return 'physiologic'
  return v
}

function normLabel(s?: string | null): string {
  return (s || '').trim().toLowerCase()
}

/** patientRef may arrive at the patient level (future API) or buried in the
 *  spread payload of any session (how the app actually sends it today). */
function extractRef(p: ApiPatient): string | null {
  if (typeof p.patientRef === 'string' && p.patientRef.trim()) return p.patientRef.trim()
  for (const s of p.sessions ?? []) {
    if (typeof s.patientRef === 'string' && s.patientRef.trim()) return s.patientRef.trim()
  }
  for (const t of p.hrtTrajectory ?? []) {
    if (typeof t.patientRef === 'string' && t.patientRef.trim()) return t.patientRef.trim()
  }
  return null
}

/**
 * Group API patients by patientRef when present (falling back to the
 * case-insensitive trimmed label). The API groups rows by raw label, so
 * "Sam" / "sam " / a typo'd rename under the same install must merge into ONE
 * card — the merged card shows the LATEST name.
 */
function groupApiPatients(list: ApiPatient[]): ApiPatient[] {
  const groups = new Map<string, ApiPatient[]>()
  for (const p of list) {
    const key = extractRef(p) ?? `label:${normLabel(p.name) || 'unidentified'}`
    const g = groups.get(key)
    if (g) g.push(p)
    else groups.set(key, [p])
  }
  const latestTs = (p: ApiPatient) => {
    const times = [
      ...(p.sessions ?? []).map((s) => Date.parse(s.date ?? '')),
      ...(p.hrtTrajectory ?? []).map((t) => Date.parse(t.date ?? '')),
      Date.parse(p.lastActivity ?? ''),
    ].filter((n) => !Number.isNaN(n))
    return times.length ? Math.max(...times) : 0
  }
  return [...groups.values()].map((members) => {
    if (members.length === 1) return members[0]
    const byDate = (a?: string, b?: string) => (Date.parse(a ?? '') || 0) - (Date.parse(b ?? '') || 0)
    const primary = [...members].sort((a, b) => latestTs(a) - latestTs(b))[members.length - 1]
    const sessions = members.flatMap((m) => m.sessions ?? []).sort((a, b) => byDate(a.date, b.date))
    const hrtTrajectory = members.flatMap((m) => m.hrtTrajectory ?? []).sort((a, b) => byDate(a.date, b.date))
    const latestInterp = [...hrtTrajectory].reverse().find((t) => t.interpretation)?.interpretation ?? null
    return {
      ...primary, // latest name wins for merged variants
      sessions,
      hrtTrajectory,
      clearanceReady: latestInterp != null ? latestInterp === 'no-intolerance' : members.some((m) => m.clearanceReady === true),
      lastActivity: members.map((m) => m.lastActivity).filter(Boolean).sort().pop() ?? primary.lastActivity,
    }
  })
}

/**
 * STATUS DERIVATION (a flare must NEVER display as clean):
 *  - symptomDelta = explicit symptomDelta, else peakSymptom − preSymptom.
 *  - 'flare'   when symptomDelta EXCEEDS 2 (SESSION_STOP_RISE; a ≤2-pt rise
 *              is tolerated — Amsterdam 2023) OR eventType is
 *              'symptom-stopped' OR nextDayFlare is true.
 *  - 'clean'   only when we HAVE a symptom delta and none of the above fired.
 *  - 'unknown' when no symptom data exists (old/partial rows) — rendered
 *              neutrally, never as clean.
 */
function mapApiSession(s: ApiSession): Session {
  // A heart rate only if it is PLAUSIBLE. Older app builds saved 0 when a
  // session recorded no reading at all, and the row printed it verbatim as
  // "avg 0 · peak 0 bpm" — a measurement shown to a clinician for a session
  // that measured nothing. The app's own entry fields bound HR to 30–240 bpm.
  const bpm = (v: unknown): number | null => {
    const n = num(v)
    return n != null && n >= 30 && n <= 240 ? n : null
  }
  const avgHr = bpm(s.avgHr) ?? bpm(s.avgHeartRate)
  const peakHr = bpm(s.peakHr) ?? bpm(s.peakHeartRate)
  const mins = num(s.minutes) ?? num(s.mins) ?? num(s.completedMinutes)
  const pre = num(s.preSymptom)
  const peak = num(s.peakSymptom)
  const symptomDelta = num(s.symptomDelta) ?? (pre != null && peak != null ? peak - pre : null)
  const overrodeStop = s.overrode_stop === true || s.overrodeStop === true
  const nextDayFlare = s.nextDayFlare === true
  const eventType = normEvent(s.eventType)
  const flare = (symptomDelta != null && symptomDelta > SESSION_STOP_RISE) || eventType === 'symptom-stopped' || nextDayFlare
  const status: Session['status'] = flare ? 'flare' : symptomDelta != null ? 'clean' : 'unknown'

  let timeInBandPct = num(s.timeInBandPct) ?? num(s.inBandPct)
  if (timeInBandPct == null) {
    const sec = num(s.timeInBandSec) ?? num(s.inBandSec)
    if (sec != null && mins != null && mins > 0) timeInBandPct = (sec / (mins * 60)) * 100
  }
  if (timeInBandPct != null) timeInBandPct = Math.max(0, Math.min(100, Math.round(timeInBandPct)))

  const iso = s.date && !Number.isNaN(Date.parse(s.date)) ? s.date : null
  return {
    date: fmtShort(iso) ?? '—',
    dateIso: iso,
    avgHr, peakHr, mins, symptomDelta, status,
    eventType,
    modality: typeof s.modality === 'string' ? s.modality : null,
    verifiedReadingPct: num(s.verifiedReadingPct),
    // PROVENANCE REQUIRED, same rule the server applies to the HRt trajectory
    // (app/api/sst/clinic-sessions/route.ts) and to reports (reports/load.ts
    // isVerified): a row that claims hrVerified but records NO source, or a
    // manual one, is not a live-sensor session. Trusting the flag alone let the
    // row print the emerald "Live HR verified" badge off a self-asserted field
    // while the trajectory point beside it plotted the same session unverified.
    hrVerified:
      s.hrVerified === true && typeof s.hrSource === 'string' && s.hrSource.trim() !== '' && s.hrSource !== 'manual',
    nextDayFlare,
    overrodeStop,
    sessionEndFeel: typeof s.sessionEndFeel === 'string' ? s.sessionEndFeel : null,
    timeInBandPct,
    deviceName: typeof s.deviceName === 'string' && s.deviceName.trim() ? s.deviceName.trim() : null,
  }
}

/** The install-UUID identity for a mapped patient, or null for label-only rows. */
function refOf(p: Patient): string | null {
  return p.patientKey && !p.patientKey.startsWith('label:') ? p.patientKey : null
}

/**
 * The label as STORED — what a report query and a printed document must use.
 * `name` can carry the roster's display-only "(2)" disambiguation suffix, which
 * matches nothing in the DB: for a label-only patient it 404'd the report, and
 * where a `ref` rescued the lookup it still printed "James M (2)" as the
 * patient's name on the ACC884 / GP letter / filed PMS note. The patient-list
 * page already stripped it; the hub did not (2026-08-05).
 */
function labelOf(p: Patient): string {
  return (p.label || '').trim() || p.name.replace(/\s\(\d+\)$/, '')
}

function mapRealPatient(p: ApiPatient, clinicCode: string): Patient {
  const patientKey = extractRef(p) ?? `label:${normLabel(p.name) || 'unidentified'}`
  const hrtPoints: TrajectoryPoint[] = (p.hrtTrajectory ?? []).map((t) => ({
    date: t.date ?? '',
    hrt: t.hrt ?? null,
    source: t.source,
    verified: t.verified === true,
    gated: t.gated === true,
    interpretation: t.interpretation ?? null,
    eventType: normEvent(t.eventType),
    modality: typeof t.modality === 'string' ? t.modality : null,
    verifiedReadingPct: num(t.verifiedReadingPct),
    stagesRecorded: num(t.stagesRecorded),
  }))
  const latestInterp = [...hrtPoints].reverse().find((t) => t.interpretation)?.interpretation ?? null
  const clearanceReady = p.clearanceReady === true || latestInterp === 'no-intolerance'
  // How far the ramp that produced the clearance signal actually got. The
  // engine returns 'no-intolerance' — this banner — from a graded test that
  // terminated at voluntary exhaustion regardless of length: a one-minute ramp
  // reads identically to a completed 20-minute protocol. The clinician making
  // the clearance decision must see the exercise dose behind it. Null when the
  // stage table wasn't stored (legacy rows) — never guessed.
  const clearanceRamp = clearanceReady
    ? ([...hrtPoints].reverse().find((t) => t.interpretation === 'no-intolerance')?.stagesRecorded ?? null)
    : null
  const stage: Stage = clearanceReady
    ? { n: 7, label: 'Cleared — refer to MD' }
    : p.hrt
      ? { n: 4, label: 'Sub-symptom aerobic' }
      : { n: 2, label: 'Threshold test pending' }
  // newest first for display (API returns ascending)
  const sessions = (p.sessions ?? []).map(mapApiSession).reverse()
  const condition = (p.condition || '').trim()
  return {
    id: `real-${patientKey}`,
    patientKey,
    name: p.name?.trim() || 'Unidentified',
    label: (p.label || '').trim() || undefined,
    // Real SST intake doesn't capture these yet — leave them unknown and the
    // card simply omits them (never "0 · — · 0d post-injury").
    age: null,
    sport: condition ? condition.charAt(0).toUpperCase() + condition.slice(1) : null,
    code: clinicCode,
    injuryDate: null,
    daysPost: null,
    stage,
    hrt: p.hrt ?? null,
    bandLow: p.bandLow ?? 0,
    bandHigh: p.bandHigh ?? 0,
    restSymptoms: null,
    baseline: 'none',
    trend: [],
    hrtPoints,
    sessions,
    lastActivity: p.lastActivity ?? sessions[0]?.dateIso ?? null,
    clearanceReady,
    clearanceRamp,
  }
}

/* ───────────────────────────────────────────────────────────────────
   Escalation ladder (three tiers):
   - ordinary sessions accumulate quietly
   - REVIEW  (amber): flare session · symptom-stopped · overrode stop ·
     next-day flare · aborted threshold test
   - URGENT  (red):  red-flag threshold event
   Acknowledgement is CLINIC-WIDE and SERVER-SIDE (sst_clinic_acks, via
   /api/sst/clinic-acks; returned with the roster by /api/sst/clinic-sessions).
   It was per-browser localStorage until 2026-08-05, which meant one clinician
   acknowledging on her laptop left the other 14 seats staring at the URGENT
   banner, and there was no record of who reviewed what. localStorage is now
   only an OPTIMISTIC CACHE so the banner clears instantly on the acting
   clinician's screen; the server row is the record.
─────────────────────────────────────────────────────────────────── */
type Attention = { level: 'urgent' | 'review'; reason: string; dateKey: string }

function deriveAttention(pt: Patient): Attention | null {
  const traj = pt.hrtPoints ?? [] // chronological (API order)
  // Urgent unless a 'red-flag-cleared' event LANDED AFTER the red flag —
  // the app lets a clinician-advised patient clear the hold after review.
  let redI = -1
  let clearedI = -1
  traj.forEach((t, i) => {
    // eventType FIRST: event rows carry interpretation='invalid' (server
    // forces it so they can't read as tests), and normEvent('invalid') is
    // truthy — the ?? chain never reached eventType, so the URGENT banner
    // could never auto-clear (round-L #2).
    const e = normEvent(t.eventType) ?? normEvent(t.interpretation)
    if (e === 'red-flag') redI = i
    if (e === 'red-flag-cleared') clearedI = i
  })
  if (redI >= 0 && redI > clearedI) {
    const red = traj[redI]
    return {
      level: 'urgent',
      reason: `Red flag reported ${fmtShort(red.date) ?? ''} — patient advised to seek medical review`.replace('  ', ' '),
      dateKey: red.date || 'red-flag',
    }
  }
  const cands: Attention[] = []
  for (const s of pt.sessions) { // newest first
    const key = s.dateIso ?? s.date
    if (s.eventType === 'symptom-stopped') cands.push({ level: 'review', reason: `Session stopped on symptom rise — ${s.date}`, dateKey: key })
    else if (s.overrodeStop) cands.push({ level: 'review', reason: `Patient overrode an in-session stop — ${s.date}`, dateKey: key })
    else if (s.nextDayFlare) cands.push({ level: 'review', reason: `Next-day symptom flare reported — ${s.date}`, dateKey: key })
    else if (s.status === 'flare') cands.push({ level: 'review', reason: `Symptom flare in session — ${s.date}`, dateKey: key })
  }
  const aborted = [...traj].reverse().find((t) => normEvent(t.interpretation) === 'aborted' || normEvent(t.eventType) === 'aborted')
  if (aborted) cands.push({ level: 'review', reason: `Threshold test aborted — ${fmtShort(aborted.date) ?? aborted.date}`, dateKey: aborted.date || 'aborted' })
  if (!cands.length) return null
  cands.sort((a, b) => (Date.parse(b.dateKey) || 0) - (Date.parse(a.dateKey) || 0))
  return cands[0]
}

/** The identity the SERVER stores an ack against (same key the roster groups on). */
function ackPatientKeyOf(pt: Patient): string {
  return pt.patientKey ?? pt.id
}

/** localStorage cache key — clinic + patient identity + the escalating event's date. */
function ackKeyOf(clinic: string, pt: Patient, att: Attention) {
  return `sst-hub-ack:${clinic || 'DEMO'}:${ackPatientKeyOf(pt)}:${att.dateKey}`
}

/**
 * The key the SERVER ack map is indexed on. It MUST be built by ONE function:
 * the loader joined patientKey + dateKey with a NUL escape while both readers
 * joined them with a SPACE, so a server-recorded acknowledgement never
 * resolved. Every other seat in the clinic kept staring at the URGENT/REVIEW
 * banner a colleague had already reviewed, and "Reviewed by <name>" never
 * rendered — the one question a supervision surface exists to answer. The
 * localStorage cache hid it on the acting clinician's own browser (2026-08-06).
 */
function serverAckKey(patientKey: string, dateKey: string) {
  return `${patientKey}\u0000${dateKey}`
}

/** What the hub knows about an acknowledgement — `by` is null for cache-only hits. */
type AckRecord = { by: string | null; at: string | null }

function MiniChip({ tone, children }: { tone: 'slate' | 'amber' | 'emerald'; children: React.ReactNode }) {
  const cls = tone === 'amber'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-50 text-slate-600 border-slate-200'
  return <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>{children}</span>
}

type RealState = 'idle' | 'loading' | 'ready' | 'missing-key' | 'unauthorized' | 'unknown-code' | 'error'

export default function ClinicalHubPage() {
  const [roster, setRoster] = useState<Patient[]>(PATIENTS)
  // Opens on the delivered-dose case: prescribed-is-not-performed is the beat
  // the demo is built around, so it should be on screen before anyone clicks.
  const [selectedId, setSelectedId] = useState('c-adherence')
  // Session history is capped at the 6 most recent; a full episode expands.
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [clinicCode, setClinicCode] = useState('')
  const [viewKey, setViewKey] = useState<string | null>(null)
  const [clinicName, setClinicName] = useState<string | null>(null)
  const [mode, setMode] = useState<'demo' | 'real'>('demo')
  const [realState, setRealState] = useState<RealState>('idle')
  // Acknowledgements keyed by the localStorage cache key. The SERVER copy
  // (loaded with the roster) is the record; localStorage only pre-fills so the
  // acting clinician's own screen doesn't flash the banner back on reload.
  const [acks, setAcks] = useState<Record<string, AckRecord>>({})
  // Raw server acks, keyed `${patientKey}\u0000${dateKey}` — merged into `acks`
  // once the roster is mapped (a patient's escalating event decides the key).
  const [serverAcks, setServerAcks] = useState<Record<string, AckRecord>>({})

  // Real data: ?clinic=<code>&k=<viewkey> loads that clinic's actual SST
  // sessions from /api/sst/clinic-sessions. DEMO00 is the public demo (no key
  // required). A real code with no/rejected key shows a key state — it never
  // falls through to the demo roster. window.location avoids a Suspense
  // boundary for useSearchParams.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = (params.get('clinic') || '').trim().toUpperCase()
    const k = (params.get('k') || '').trim() || null
    if (!code) return // pure demo preview
    setClinicCode(code)
    setViewKey(k)
    const isDemoCode = code === 'DEMO00'
    if (!isDemoCode) {
      setMode('real')
      setRoster([]) // never show the demo roster under a real clinic code
      setSelectedId('')
      if (!k) {
        setRealState('missing-key')
        return
      }
      setRealState('loading')
    }
    fetch(`/api/sst/clinic-sessions?code=${encodeURIComponent(code)}${k ? `&k=${encodeURIComponent(k)}` : ''}`)
      .then(async (r) => {
        if (!r.ok) {
          if (isDemoCode) return // demo keeps its fixtures
          setRealState(r.status === 401 || r.status === 403 ? 'unauthorized' : r.status === 404 ? 'unknown-code' : 'error')
          return
        }
        const data = (await r.json()) as {
          patients?: ApiPatient[]
          clinicName?: string
          acks?: Array<{ patientKey?: string; dateKey?: string; acknowledgedBy?: string | null; acknowledgedAt?: string }>
        }
        if (typeof data?.clinicName === 'string' && data.clinicName.trim()) setClinicName(data.clinicName.trim())
        // Clinic-wide acknowledgements ride with the roster — every seat sees
        // the same banner state, and who cleared it.
        if (Array.isArray(data?.acks)) {
          const next: Record<string, AckRecord> = {}
          for (const a of data.acks) {
            if (!a?.patientKey || !a?.dateKey) continue
            next[serverAckKey(a.patientKey, a.dateKey)] = {
              by: typeof a.acknowledgedBy === 'string' && a.acknowledgedBy.trim() ? a.acknowledgedBy.trim() : null,
              at: typeof a.acknowledgedAt === 'string' ? a.acknowledgedAt : null,
            }
          }
          setServerAcks(next)
        }
        const mapped = groupApiPatients(data?.patients ?? []).map((pp) => mapRealPatient(pp, code))
        // DEMO00 ALWAYS keeps the curated fixture roster. It used to adopt live
        // DEMO00 rows whenever any existed — which meant every e2e/manual test
        // session became the public demo: rows like "E2E Garmin 997834" and a
        // half-finished episode showing an 81 bpm "threshold" with a 65–73 bpm
        // band (physiologically impossible; it was a resting HR). This URL is
        // linked from /acc as a pitch demo, so it must be deterministic and
        // clinically coherent, never whatever was last tested against prod.
        if (isDemoCode) return
        setRoster(mapped)
        setSelectedId(mapped[0]?.id ?? '')
        setRealState('ready')
      })
      .catch(() => {
        if (!isDemoCode) setRealState('error')
      })
  }, [])

  // Resolve each patient's escalating event against the SERVER acks, with the
  // localStorage cache as a fallback so the acting clinician's own screen never
  // flashes a banner they already cleared while the roster reloads.
  useEffect(() => {
    const next: Record<string, AckRecord> = {}
    for (const pt of roster) {
      const att = deriveAttention(pt)
      if (!att) continue
      const key = ackKeyOf(clinicCode, pt, att)
      const server = serverAcks[serverAckKey(ackPatientKeyOf(pt), att.dateKey)]
      if (server) {
        next[key] = server
        continue
      }
      try {
        if (window.localStorage.getItem(key)) next[key] = { by: null, at: null }
      } catch {
        /* storage unavailable (private mode) — the server copy still governs */
      }
    }
    setAcks(next)
  }, [roster, clinicCode, serverAcks])

  /**
   * Mark reviewed: optimistic locally, then RECORDED clinic-wide so the other
   * seats stop seeing the banner and the clinic has a "who reviewed this" row.
   * A failed write rolls the optimistic state back — a banner that silently
   * disappeared without being recorded is worse than one that stays up.
   */
  function markReviewed(key: string, pt: Patient, att: Attention) {
    try {
      window.localStorage.setItem(key, String(Date.now()))
    } catch { /* non-persistent fallback below still updates state */ }
    setAcks((prev) => ({ ...prev, [key]: { by: null, at: new Date().toISOString() } }))
    if (isDemo || !clinicCode || !viewKey) return // demo/keyless: optimistic only, never writes
    void fetch('/api/sst/clinic-acks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: clinicCode,
        k: viewKey,
        patientKey: ackPatientKeyOf(pt),
        dateKey: att.dateKey,
      }),
      credentials: 'include', // lets the server stamp the signed-in clinician
    })
      .then(async (r) => {
        const d = r.ok ? await r.json().catch(() => null) : null
        if (d?.ack) {
          const rec: AckRecord = { by: d.ack.acknowledgedBy ?? null, at: d.ack.acknowledgedAt ?? null }
          setServerAcks((prev) => ({ ...prev, [serverAckKey(ackPatientKeyOf(pt), att.dateKey)]: rec }))
          setAcks((prev) => ({ ...prev, [key]: rec }))
          return
        }
        if (!r.ok) throw new Error(String(r.status))
      })
      .catch(() => {
        try { window.localStorage.removeItem(key) } catch { /* nothing to undo */ }
        setAcks((prev) => {
          const copy = { ...prev }
          delete copy[key]
          return copy
        })
      })
  }

  const isDemo = mode === 'demo'
  const filtered = roster.filter((pt) => pt.name.toLowerCase().includes(query.toLowerCase()))
  const decorated = filtered.map((pt) => {
    const att = deriveAttention(pt)
    const key = att ? ackKeyOf(clinicCode, pt, att) : null
    return { pt, att, ackKey: key, acked: key ? !!acks[key] : false }
  })
  const needsReview = decorated
    .filter((d) => d.att && !d.acked)
    .sort((a, b) => (a.att!.level === b.att!.level ? 0 : a.att!.level === 'urgent' ? -1 : 1))
  const others = decorated.filter((d) => !d.att || d.acked)
  const p = roster.find((x) => x.id === selectedId) ?? roster[0]
  const selAtt = p ? deriveAttention(p) : null
  const selAckKey = p && selAtt ? ackKeyOf(clinicCode, p, selAtt) : null
  const selAck = selAckKey ? acks[selAckKey] : undefined
  const selAcked = !!selAck

  function addPatient(form: { name: string; age: string; sport: string; injuryDate: string }) {
    const seq = roster.length + 1
    const id = `p${seq}-${form.name.replace(/\s+/g, '').toLowerCase()}`
    const next: Patient = {
      id, name: form.name.trim() || 'New patient', age: Number(form.age) || null,
      sport: form.sport.trim() || null, code: mintPatientCode('CEA-CLN', seq),
      injuryDate: form.injuryDate || 'Today', daysPost: 0,
      stage: { n: 1, label: 'Intake — threshold test pending' },
      hrt: null, bandLow: 0, bandHigh: 0, restSymptoms: 0, baseline: 'none',
      trend: [], sessions: [],
      flag: 'New patient — capture a baseline and run the graded threshold test to begin.',
    }
    setRoster((r) => [next, ...r])
    setSelectedId(id)
    setShowAllSessions(false)
    setAddOpen(false)
  }

  function updatePatient(id: string, partial: Partial<Patient>) {
    setRoster((r) => r.map((pt) => (pt.id === id ? { ...pt, ...partial } : pt)))
  }
  const setStage = (n: number) => {
    if (!p) return
    const s = STAGES.find((x) => x.n === n)
    if (s) updatePatient(p.id, { stage: s })
  }

  // clinic-sessions returns clinicName; the `?? code` is a defensive fallback
  // for the pre-load tick (and any legacy record without a name).
  const clinicTitle = isDemo
    ? 'Example Clinic — worked cases'
    : clinicName ?? `${clinicCode} · Your clinic`

  const showLive = clinicCode !== '' && (clinicCode === 'DEMO00' || !!viewKey)

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Demo disclosure — demo mode only. A real clinic sees its real data,
          unbannered.

          This page is linked publicly from the /acc supplier pitch, so the
          disclosure STAYS: the episodes below are worked examples built to the
          published protocol, not people. What changed is the volume. It used to
          be a full-width bar reading "every patient below is fabricated", which
          is both louder than the disclosure needs to be and reads, on a
          screenshare, as though the product itself is a mock-up. The instrument
          is real; the episodes are examples. The line below says exactly that,
          once, without shouting over the thing it is captioning.

          The fixtures previously carried full given names, which read as real
          people to a clinician — on a shared screen there is no way to tell a
          fixture from a patient. They are now initials plus age band, sex and
          sport: enough clinical context for the case to land, nothing that
          resembles a person. */}
      {isDemo && (
        <div className="bg-[var(--accent)]/[0.07] border-b border-[var(--accent)]/20 text-center text-[11.5px] py-1.5 px-4 text-[#4a6a6e]">
          <strong className="font-semibold text-[#2c5457]">Example clinic.</strong>{' '}
          Worked cases built to the published protocol — not patients, and not real health data.
        </div>
      )}

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Live in-session monitor */}
        {showLive && <SstLivePanel code={clinicCode} viewKey={viewKey} />}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#0b6165] flex items-center justify-center">
              <Stethoscope className="w-[22px] h-[22px] text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">Clinical Hub</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {clinicTitle}{realState === 'ready' || isDemo ? <> · {roster.length} {isDemo ? 'example' : 'active'} patient{roster.length === 1 ? '' : 's'}</> : null}
              </p>
            </div>
          </div>
          {isDemo && (
            <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> Add patient
            </button>
          )}
        </div>

        {/* Real-mode key / load states — never fetch-fail into fake data */}
        {!isDemo && realState !== 'ready' ? (
          <div className="max-w-xl mx-auto py-10">
            {realState === 'loading' ? (
              <div className="glass-premium rounded-2xl p-10 text-center">
                <p className="text-sm text-muted-foreground">Loading your clinic&apos;s sessions…</p>
              </div>
            ) : realState === 'missing-key' || realState === 'unauthorized' ? (
              <div className="glass-premium rounded-2xl p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-6 h-6 text-amber-600" strokeWidth={1.8} />
                </div>
                <h2 className="text-base font-bold text-foreground mb-2">
                  {realState === 'missing-key' ? 'This hub link is missing its clinic key' : 'This clinic key wasn’t accepted'}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {realState === 'missing-key'
                    ? 'This hub link is missing its clinic key — use the link from your welcome email.'
                    : 'Use the exact hub link from your welcome email — it carries your clinic’s private view key.'}
                </p>
              </div>
            ) : realState === 'unknown-code' ? (
              <div className="glass-premium rounded-2xl p-10 text-center">
                <h2 className="text-base font-bold text-foreground mb-2">Clinic code not recognised</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-mono">{clinicCode}</span> isn&apos;t a registered clinic code — check the link from your welcome email.
                </p>
              </div>
            ) : (
              <div className="glass-premium rounded-2xl p-10 text-center">
                <h2 className="text-base font-bold text-foreground mb-2">Couldn&apos;t load your clinic&apos;s sessions</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">Refresh to try again — nothing is lost.</p>
              </div>
            )}
          </div>
        ) : !isDemo && roster.length === 0 ? (
          /* Real clinic, zero patients — premium empty state, never the demo roster */
          <div className="max-w-xl mx-auto py-10">
            <div className="glass-premium rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-6 h-6 text-[var(--accent)]" strokeWidth={1.8} />
              </div>
              <h2 className="text-base font-bold text-foreground mb-2">No patients yet</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Hand a patient your QR card and their first session appears here live.
              </p>
              <p className="text-xs text-muted-foreground/70 leading-relaxed mt-3">
                Threshold tests, training sessions and live in-session heart rate all flow to this hub the moment a patient enters your clinic code.
              </p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          {/* ── Roster ── */}
          <aside className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl glass-premium text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              />
            </div>

            {/* Escalation ladder: unacknowledged attention pins to the top */}
            {needsReview.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 px-1 pt-1">
                Needs review · {needsReview.length}
              </p>
            )}
            {needsReview.map((d) => (
              <RosterCard key={d.pt.id} pt={d.pt} att={d.att} acked={false}
                active={d.pt.id === selectedId} onSelect={() => setSelectedId(d.pt.id)} />
            ))}
            {needsReview.length > 0 && others.length > 0 && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1 pt-2">
                All patients
              </p>
            )}
            {others.map((d) => (
              <RosterCard key={d.pt.id} pt={d.pt} att={d.att} acked={d.acked}
                active={d.pt.id === selectedId} onSelect={() => setSelectedId(d.pt.id)} />
            ))}
          </aside>

          {/* ── Detail ── */}
          {p && (
          <section className="space-y-5">
            {/* Patient header */}
            <div className="glass-premium rounded-2xl p-5 sm:p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 flex items-center justify-center text-[var(--accent)] font-bold text-lg">
                    {initials(p.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-foreground leading-tight">{p.name}</h2>
                      {/* Sits beside the NAME, the one element most likely to be
                          read as a real person — so it stays. Neutral rather
                          than amber: this is a provenance label, not a warning
                          about the record's integrity, and amber on a shared
                          screen reads as the latter. */}
                      {isDemo && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eef5f5] text-[#4a6a6e] border border-[#dcebeb]">
                          Example case
                        </span>
                      )}
                    </div>
                    {/* Render only what we actually know — no zeroed placeholders */}
                    {/* The name line already carries age, sex and sport —
                        repeating them here was the first thing a reader saw
                        twice. This line holds only what the name doesn't. */}
                    <p className="text-sm text-muted-foreground">
                      clinic code <span className="font-mono text-foreground">{p.code}</span>
                    </p>
                    {(p.injuryDate || p.daysPost != null || p.lastActivity) && (
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {p.injuryDate && <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Injured {p.injuryDate}</span>}
                        {p.daysPost != null && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {p.daysPost} days post</span>}
                        {p.daysPost == null && p.lastActivity && (
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Last activity {fmtShort(p.lastActivity)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                    Stage {p.stage.n} — {p.stage.label}
                  </span>
                  {/* Episode reports — the SKINNED report API (/api/sst/report),
                      which until 2026-07-27 had NO real-clinic UI consumer: a
                      genuine NZ supplier could not produce the ACC884 the /acc
                      pitch sells without hand-crafting a URL ("shell of a
                      product" — owner). Authorises via the same code+viewKey
                      this hub carries; the server validates each skin against
                      its jurisdiction. Real synced patients only. */}
                  {/* Reports + PMS filing render on REAL synced patients AND on
                      the DEMO00 fixtures — the demo dashboard is the pitch
                      surface; hiding the product's best features from it was
                      the mistake (owner, 2026-07-27). DEMO00's report API is
                      keyless by design and the loader synthesises a coherent
                      episode for any patient label. */}
                  {((clinicCode !== '' && viewKey && p.id.startsWith('real-')) || isDemo) && (
                    <>
                      {([
                        ['gp-report', 'GP report'],
                        ['rtp-clearance', 'RTP data'],
                        ['medicolegal', 'Clinical record'],
                        ['acc884', 'ACC884 (NZ)'],
                      ] as const).map(([skin, label]) => (
                        <a
                          key={skin}
                          href={`/api/sst/report?code=${encodeURIComponent(isDemo ? 'DEMO00' : clinicCode)}${viewKey ? `&k=${encodeURIComponent(viewKey)}` : ''}&patient=${encodeURIComponent(labelOf(p))}${refOf(p) ? `&ref=${encodeURIComponent(refOf(p) as string)}` : ''}&skin=${skin}${p.demoCase ? `&case=${p.demoCase}` : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/5 transition"
                        >
                          <FileText className="w-3.5 h-3.5" /> {label} <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      ))}
                      <PmsFileButton clinicCode={isDemo ? 'DEMO00' : clinicCode} viewKey={viewKey ?? ''} patientName={labelOf(p)} patientRef={refOf(p)} demo={isDemo} />
                    </>
                  )}
                </div>
              </div>

              {/* URGENT — red-flag test event */}
              {selAtt?.level === 'urgent' && !selAcked && selAckKey && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
                  <AlertOctagon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-800 leading-relaxed flex-1 font-medium">{selAtt.reason}</p>
                  <button onClick={() => markReviewed(selAckKey, p, selAtt)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 transition flex-shrink-0">
                    Mark reviewed
                  </button>
                </div>
              )}
              {/* REVIEW — flare / symptom-stopped / overrode stop / next-day flare / aborted test */}
              {selAtt?.level === 'review' && !selAcked && selAckKey && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-800 leading-relaxed">{selAtt.reason}</p>
                      {p.flag && !p.clearanceReady && (
                        <p className="text-xs text-amber-800/90 leading-relaxed mt-1">{p.flag}</p>
                      )}
                    </div>
                    <button onClick={() => markReviewed(selAckKey, p, selAtt)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-100 transition flex-shrink-0">
                      Mark reviewed
                    </button>
                  </div>
                </div>
              )}
              {selAtt && selAcked && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-[var(--accent)]" /> Reviewed
                  {selAck?.by ? ` by ${selAck.by}` : ''}
                  {selAck?.at ? ` · ${fmtShort(selAck.at) ?? ''}` : ''} — {selAtt.reason}
                </p>
              )}

              {/* Clearance-ready — honest framing: the decision stays clinical */}
              {p.clearanceReady && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Recovered — no-intolerance on re-test. Ready for your clearance review — clearance is your clinical decision.
                    {p.clearanceRamp != null && p.clearanceRamp > 0 && (
                      <>
                        {' '}
                        <span className={p.clearanceRamp < PROTOCOL_STAGE_CAP ? 'font-semibold' : ''}>
                          That test ran {p.clearanceRamp} minute{p.clearanceRamp === 1 ? '' : 's'} of the{' '}
                          {PROTOCOL_STAGE_CAP}-minute graded ramp before it was stopped.
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}

              {p.flag && !p.clearanceReady && !(selAtt?.level === 'review' && !selAcked && selAckKey) && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">{p.flag}</p>
                </div>
              )}
            </div>

            {/* Return-to-activity stage — editable in demo only; stage edits
                aren't persisted anywhere yet, so a real clinic sees the stage
                DERIVED from threshold results, read-only. */}
            <div className="glass-premium rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                  <h3 className="text-sm font-bold text-foreground">Return-to-activity stage</h3>
                </div>
                {isDemo ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Demo preview</span>
                    <button onClick={() => setStage(Math.max(1, p.stage.n - 1))} disabled={p.stage.n <= 1}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-black/10 text-muted-foreground hover:bg-black/[0.03] transition disabled:opacity-40">
                      <ChevronLeft className="w-3.5 h-3.5" /> Step back
                    </button>
                    <button onClick={() => setStage(Math.min(7, p.stage.n + 1))} disabled={p.stage.n >= 7}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-40">
                      Advance <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Derived from threshold results</span>
                )}
              </div>
              {/* ladder — clickable in demo only */}
              <div className="flex items-center gap-1.5">
                {STAGES.map((s) => {
                  const done = s.n < p.stage.n, current = s.n === p.stage.n
                  // `min-w-0` matters: flex-1 is `flex: 1 1 0%` but does NOT
                  // let a child shrink below its min-content width, so seven
                  // segments plus gaps ran 6px past a 375px viewport (375px
                  // sweep, 2026-08-06). Same root cause as the /learning
                  // overflow fixed the same day.
                  const cls = `flex-1 min-w-0 h-2 rounded-full transition ${current ? 'bg-[var(--accent)]' : done ? 'bg-[var(--accent)]/35' : 'bg-black/[0.06]'}`
                  return isDemo
                    ? <button key={s.n} onClick={() => setStage(s.n)} title={s.label} className={`${cls} hover:bg-black/10`} />
                    : <div key={s.n} title={s.label} className={cls} />
                })}
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs font-semibold text-foreground">Stage {p.stage.n} · {p.stage.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.stage.n < 7 ? `Next: ${STAGES.find((s) => s.n === p.stage.n + 1)?.label}` : 'Refer to treating doctor for clearance'}
                </p>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="glass-premium rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2"><HeartPulse className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /><p className="stat-label mb-0">HR threshold</p></div>
                <p className="stat-value">{p.hrt ? <>{p.hrt}<span className="text-base font-medium text-muted-foreground"> bpm</span></> : <span className="text-base text-muted-foreground">Not set</span>}</p>
                {p.hrt != null && p.hrt < 135 && (
                  <p className="mt-1 text-[11px] font-semibold leading-snug text-amber-700" title="Haider et al. 2019">
                    Low threshold (&lt;135 bpm) — associated with slower recovery; oversee dosing, re-assess more often.
                  </p>
                )}
              </div>
              <div className="glass-premium rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2"><Activity className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /><p className="stat-label mb-0">Training band</p></div>
                <p className="stat-value">{p.hrt ? <>{p.bandLow}–{p.bandHigh}<span className="text-base font-medium text-muted-foreground"> bpm</span></> : <span className="text-base text-muted-foreground">—</span>}</p>
              </div>
              {p.restSymptoms != null ? (
                <div className="glass-premium rounded-2xl p-5 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /><p className="stat-label mb-0">Symptoms at rest</p></div>
                  <p className="stat-value">{p.restSymptoms}<span className="text-base font-medium text-muted-foreground"> / 10</span></p>
                </div>
              ) : (
                <div className="glass-premium rounded-2xl p-5 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-2"><Clock className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} /><p className="stat-label mb-0">Last activity</p></div>
                  <p className="stat-value">
                    {daysAgo(p.lastActivity) != null
                      ? daysAgo(p.lastActivity) === 0 ? 'Today' : <>{daysAgo(p.lastActivity)}<span className="text-base font-medium text-muted-foreground">d ago</span></>
                      : <span className="text-base text-muted-foreground">—</span>}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SST session history */}
              <div className="glass-premium rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                    <h3 className="text-sm font-bold text-foreground">SST program</h3>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{p.sessions.length} session{p.sessions.length === 1 ? '' : 's'}</span>
                </div>
                {p.sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground leading-relaxed py-6 text-center">
                    No sessions yet. Run the graded threshold test to set this patient&apos;s HRt and training band.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {(showAllSessions ? p.sessions : p.sessions.slice(0, 6)).map((s, i) => <SessionRow key={i} s={s} />)}
                    {p.sessions.length > 6 && (
                      <button type="button" onClick={() => setShowAllSessions((v) => !v)}
                        className="w-full text-center text-xs font-semibold text-[var(--accent)] py-2 rounded-lg hover:bg-[var(--accent)]/5 transition">
                        {showAllSessions ? 'Show recent only' : `Show all ${p.sessions.length} sessions`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Measured-HRt recovery-trajectory instrument — the wedge made
                  visible (serial MEASURED HRt, not a symptom-score curve), with
                  per-point provenance + clinician-gated-only enforcement. */}
              <SstTrajectory points={p.hrtPoints ?? []} />
            </div>

            {/* Baseline & serial testing (SCAT6/SCOAT6) — FIXTURE data, demo mode only */}
            {isDemo && BASELINES[p.id] && <BaselinePanel base={BASELINES[p.id]} />}

            {/* Clinical notes — not persisted anywhere yet, so demo mode only */}
            {isDemo && (
              <div className="glass-premium rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <NotebookPen className="w-[18px] h-[18px] text-[var(--accent)]" strokeWidth={1.8} />
                  <h3 className="text-sm font-bold text-foreground">Clinical notes</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Demo preview — not saved</span>
                </div>
                <textarea
                  value={p.notes ?? ''}
                  onChange={(e) => updatePatient(p.id, { notes: e.target.value })}
                  placeholder="Session observations, symptom triggers, RTP decisions, referrals…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl glass-premium text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>
            )}
          </section>
          )}
        </div>
        )}
      </div>

      {addOpen && isDemo && <AddPatientModal onClose={() => setAddOpen(false)} onAdd={addPatient} />}
    </div>
  )
}

function RosterCard({ pt, att, acked, active, onSelect }: {
  pt: Patient
  att: Attention | null
  acked: boolean
  active: boolean
  onSelect: () => void
}) {
  // The de-identified name already reads "R.K. — 31F, recreational netball";
  // repeating "31 · Netball" under it was pure noise. The second line now says
  // what the name can't: activity.
  const last = daysAgo(pt.lastActivity)
  const meta = [
    pt.sessions.length ? `${pt.sessions.length} session${pt.sessions.length === 1 ? '' : 's'}` : null,
    last != null ? (last === 0 ? 'active today' : `last ${last}d ago`) : null,
  ].filter(Boolean).join(' · ')
  return (
    <button onClick={onSelect}
      className={`w-full text-left glass-premium rounded-2xl p-4 transition group ${active ? 'ring-2 ring-[var(--accent)]/40' : 'hover:-translate-y-0.5'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/5 flex items-center justify-center text-[var(--accent)] font-bold text-sm flex-shrink-0">
          {initials(pt.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{pt.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {meta || 'no sessions yet'}
          </p>
        </div>
        {att && !acked
          ? (att.level === 'urgent'
              ? <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />)
          : pt.flag
            ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[var(--accent)] flex-shrink-0" />}
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
          Stage {pt.stage.n}
        </span>
        {att?.level === 'review' && !acked && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Review</span>
        )}
        {att && acked && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/[0.03] text-muted-foreground border border-black/5">Reviewed</span>
        )}
        {pt.daysPost != null
          ? <span className="text-[11px] text-muted-foreground">{pt.daysPost}d post-injury</span>
          : last != null
            ? <span className="text-[11px] text-muted-foreground">last session {last === 0 ? 'today' : `${last}d ago`}</span>
            : null}
      </div>
      {/* URGENT — red-flag banner on the patient card */}
      {att?.level === 'urgent' && !acked && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5">
          <AlertOctagon className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] font-semibold text-red-700 leading-snug">{att.reason}</p>
        </div>
      )}
    </button>
  )
}

function SessionRow({ s }: { s: Session }) {
  const dotCls = s.status === 'flare' ? 'bg-amber-500' : s.status === 'clean' ? 'bg-[var(--accent)]' : 'bg-slate-300'
  const bits = [
    s.avgHr != null ? `avg ${s.avgHr}` : null,
    s.peakHr != null ? `peak ${s.peakHr} bpm` : null,
    s.mins != null ? `${s.mins} min` : null,
  ].filter(Boolean).join(' · ')
  // Verified badge: hrVerified AND (verifiedReadingPct ≥ 80 when present —
  // absence tolerated for old rows that never reported the percentage).
  // "Live HR verified" is source-neutral on purpose: the verified tier is any
  // live Bluetooth HR stream (mostly wrist wearables in broadcast mode), not
  // chest straps specifically.
  const verified = s.hrVerified === true && (s.verifiedReadingPct == null || s.verifiedReadingPct >= 80)
  const hasChips = !!(s.modality || verified || s.timeInBandPct != null || s.eventType === 'symptom-stopped'
    || s.eventType === 'abandoned' || s.overrodeStop || s.nextDayFlare || s.sessionEndFeel || s.deviceName)
  return (
    <div className="rounded-xl bg-black/[0.015] px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotCls}`} />
        <p className="text-xs font-medium text-foreground w-14 flex-shrink-0">{s.date}</p>
        <p className="text-xs text-muted-foreground flex-1">{bits || 'no data recorded'}</p>
        <span className={`text-[11px] font-semibold ${s.symptomDelta != null && s.symptomDelta > SESSION_STOP_RISE ? 'text-amber-600' : s.symptomDelta == null ? 'text-muted-foreground/60' : 'text-[var(--accent)]'}`}>
          {s.symptomDelta == null ? 'Δ —' : s.symptomDelta === 0 ? 'no Δ' : s.symptomDelta > 0 ? `+${s.symptomDelta}` : `${s.symptomDelta}`}
        </span>
      </div>
      {hasChips && (
        <div className="flex items-center flex-wrap gap-1.5 mt-1.5 pl-5">
          {s.modality && <MiniChip tone="slate"><span className="capitalize">{s.modality}</span></MiniChip>}
          {s.timeInBandPct != null && <MiniChip tone="slate">{s.timeInBandPct}% in band</MiniChip>}
          {verified && <MiniChip tone="emerald"><ShieldCheck className="w-3 h-3" /> Live HR verified</MiniChip>}
          {s.deviceName && <MiniChip tone="slate">{s.deviceName}</MiniChip>}
          {s.eventType === 'symptom-stopped' && <MiniChip tone="amber">stopped on symptoms</MiniChip>}
          {s.eventType === 'abandoned' && <MiniChip tone="slate">abandoned</MiniChip>}
          {s.overrodeStop && <MiniChip tone="amber">overrode stop</MiniChip>}
          {s.nextDayFlare && <MiniChip tone="amber">next-day flare</MiniChip>}
          {s.sessionEndFeel && <MiniChip tone="slate">felt {s.sessionEndFeel}</MiniChip>}
        </div>
      )}
    </div>
  )
}

function AddPatientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (f: { name: string; age: string; sport: string; injuryDate: string }) => void }) {
  const [form, setForm] = useState({ name: '', age: '', sport: '', injuryDate: '' })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md glass-premium rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-base font-bold text-foreground">Add patient</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Demo preview — not saved</span>
        </div>
        <p className="text-xs text-muted-foreground mb-5">
          Each patient gets a unique code under your clinic. Share it with them for the SST app so their sessions flow back to this card.
        </p>
        <div className="space-y-3">
          {([['name', 'Full name', 'text'], ['age', 'Age', 'number'], ['sport', 'Sport', 'text'], ['injuryDate', 'Date of injury', 'text']] as const).map(([k, label, type]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-foreground">{label}</label>
              <input type={type} value={form[k]} onChange={set(k)}
                placeholder={k === 'injuryDate' ? 'e.g. 24 Jun 2026' : ''}
                className="mt-1 w-full px-3 py-2 rounded-xl glass-premium text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="text-sm font-semibold px-4 py-2 rounded-lg text-muted-foreground hover:bg-black/[0.03] transition">Cancel</button>
          <button onClick={() => onAdd(form)} disabled={!form.name.trim()}
            className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add to roster
          </button>
        </div>
      </div>
    </div>
  )
}
