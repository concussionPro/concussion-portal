// Publications data model for /publications.
// QUALITY OVER QUANTITY — only genuinely achievable, real outputs are listed:
// peer-reviewed journals (JMIR, JOSS) + real-DOI research reports (Zenodo).
// Deliberately EXCLUDES the speculative trial/dataset/scoping titles that are
// gated on primary data, ethics, or a senior co-author and may never land —
// listing those as "papers" reads as vapor and hurts credibility.
//
// Status drives the page: each entry flips in-preparation → preprint →
// under-review → published (add `url` when the DOI/preprint goes live).
import { PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
// Claim discipline: methods/provenance & comfort framing, never efficacy/diagnosis.

export type PubStatus = 'in-preparation' | 'preprint' | 'under-review' | 'published'
export type VenueType = 'Peer-reviewed journal' | 'Preprint' | 'Research report'
export type Program = 'Concussion — exercise rehabilitation' | 'Concussion — oculomotor screening' | 'Visual comfort'

export interface Publication {
  id: string
  program: Program
  primary?: boolean
  title: string
  authors: string
  venue: string
  venueType: VenueType
  year: string
  status: PubStatus
  url?: string // DOI / preprint / Zenodo link, set when live
  summary: string
}

export const publications: Publication[] = [
  {
    id: 'sst-protocol-zenodo',
    program: 'Concussion — exercise rehabilitation',
    primary: true,
    title:
      'Clinician-Supervised Sub-Symptom-Threshold Aerobic Exercise Rehabilitation After Concussion: A Standardised Delivery and Measurement Protocol (v2)',
    authors: 'Lewis Z.',
    venue: 'Zenodo (open access, CC BY 4.0)',
    venueType: 'Research report',
    year: '2026',
    status: 'published',
    url: PROTOCOL_DOI_URL,
    summary:
      'The published protocol behind the SST platform: the graded threshold test, the sub-symptom training band, session verification against live heart rate, rest-day comparator, and graded return. Open method, citable DOI — the instrumentation is what clinics licence.',
  },
  {
    id: 'sst-clinical-review',
    program: 'Concussion — exercise rehabilitation',
    primary: true,
    title:
      'Sub-Symptom-Threshold Aerobic Exercise in the Management of Sport-Related Concussion: From the Buffalo Concussion Treadmill Test to Clinician-Supervised Digital Delivery — A Clinical Review',
    authors: 'Lewis Z.',
    venue: 'medRxiv (preprint) → clinical-review journal',
    venueType: 'Preprint',
    year: '2026',
    status: 'in-preparation',
    summary:
      'A clinical review of the evidence for early sub-symptom-threshold aerobic exercise after concussion (Leddy et al.; 2023 Amsterdam consensus) and the delivery gap between clinic and home that software can close.',
  },
  {
    id: 'sst-tools-paper',
    program: 'Concussion — exercise rehabilitation',
    primary: true,
    title:
      'A Hardware-Agnostic, No-Fabricated-Signal Engine for Clinician-Supervised Sub-Symptom-Threshold Aerobic Exercise in Concussion: Design and Verification',
    authors: 'Lewis Z.',
    venue: 'JMIR mHealth and uHealth',
    venueType: 'Peer-reviewed journal',
    year: '2026',
    status: 'in-preparation',
    summary:
      'A tools/methods paper describing a pure-function clinical engine, a multi-source heart-rate abstraction (BLE strap, camera PPG, manual), and a fail-closed “no fabricated signal” guarantee that delivers a measured (not estimated) heart-rate threshold between clinical visits. A provenance and signal-quality guarantee — not an accuracy or efficacy claim.',
  },
  {
    id: 'sst-protocol-framework',
    program: 'Concussion — exercise rehabilitation',
    primary: true,
    title:
      'A Standardised Clinician-Supervised Digital Workflow for Sub-Symptom-Threshold Aerobic Exercise After Concussion',
    authors: 'Lewis Z.',
    venue: 'protocols.io → JMIR Research Protocols',
    venueType: 'Peer-reviewed journal',
    year: '2026',
    status: 'in-preparation',
    summary:
      'A protocol/framework paper standardising the five-stage clinician-supervised workflow — baseline, a measured heart-rate threshold, the sub-symptom training band, live-monitored between-visit rehabilitation, and graded return. A standardisation of delivery, not an efficacy claim.',
  },
  {
    id: 'neurovision-joss',
    program: 'Concussion — oculomotor screening',
    title: 'NeuroVision: An Open-Source Engine for Webcam-Based Oculomotor and Gaze Measurement',
    authors: 'Lewis Z.',
    venue: 'Journal of Open Source Software (JOSS)',
    venueType: 'Peer-reviewed journal',
    year: '2026',
    status: 'in-preparation',
    summary:
      'A software paper for the open, on-device engine that extracts smooth-pursuit, saccade, fixation, blink and gaze measures from a commodity webcam, with a hardware-agnostic source abstraction.',
  },
  {
    id: 'neurovision-feasibility',
    program: 'Concussion — oculomotor screening',
    title:
      'Feasibility and Reliability of Webcam-Based Oculomotor Feature Extraction: A Secondary Analysis of Public Gaze Datasets',
    authors: 'Lewis Z.',
    venue: 'JMIR Formative Research',
    venueType: 'Peer-reviewed journal',
    year: '2026',
    status: 'in-preparation',
    summary:
      'A feasibility and reliability analysis of webcam oculomotor extraction against public reference datasets (GazeBase, GazeBaseVR, RT-BENE). Feasibility, not diagnostic accuracy.',
  },
  {
    id: 'mellowvision-whitepaper',
    program: 'Visual comfort',
    title:
      'Measured, Personalised Spectral and Contrast Modulation of Digital Displays for Light Discomfort: Mechanism, Evidence Base, and Boundaries',
    authors: 'Lewis Z.',
    venue: 'Zenodo (citable DOI)',
    venueType: 'Research report',
    year: '2026',
    status: 'in-preparation',
    summary:
      'A research report on personalising display colour and contrast to an individual’s measured and stated comfort, grounded in the melanopsin/ipRGC photophobia pathway. Relevant to post-concussion screen intolerance. A wellness/accessibility framework — not a medical device, and not peer-reviewed.',
  },
]

export const programOrder: Program[] = [
  'Concussion — exercise rehabilitation',
  'Concussion — oculomotor screening',
  'Visual comfort',
]
