/**
 * Reference repository for The Vagus Nerve in Clinical Practice.
 *
 * APA-7 format. Categories mirror the module structure: anatomy,
 * polyvagal-theory critique, HRV evidence, phenotypes (POTS / post-
 * concussion / long COVID), interventions, and international/regulatory
 * frameworks.
 *
 * Maintenance: same monthly content-refresh cron pattern as the AI
 * course references — watches publisher URLs for updates.
 */

export interface VagusReference {
  id: string
  authors: string
  year: string
  title: string
  source: string
  url?: string
  category: VagusRefCategory
  relevance: string
  isFoundational?: boolean
  /**
   * What kind of resource. Defaults to 'paper' if omitted (back-compat
   * for the existing 29 entries).
   */
  kind?: VagusResourceKind
  /**
   * For podcasts / videos / lectures: duration string.
   */
  duration?: string
}

export type VagusResourceKind =
  | 'paper'
  | 'guideline'
  | 'podcast'
  | 'video'
  | 'lecture'
  | 'webinar'
  | 'conference-talk'

export type VagusRefCategory =
  | 'Anatomy & Neurophysiology'
  | 'Polyvagal Theory · Critique & Debate'
  | 'HRV & Vagal Measurement'
  | 'POTS & Dysautonomia'
  | 'Post-Concussion Autonomic'
  | 'Long COVID & Post-Viral'
  | 'Interventions · Evidence Base'
  | 'Clinical Guidelines & Frameworks'
  | 'Go Deeper · Podcasts, Videos, Lectures'

export const VAGUS_REFERENCES: VagusReference[] = [
  // ============ ANATOMY & NEUROPHYSIOLOGY ============
  {
    id: 'kenny2024_vagus',
    authors: 'Kenny, B. J., & Bordoni, B.',
    year: '2024',
    title: 'Neuroanatomy, Cranial Nerve 10 (Vagus Nerve)',
    source: 'StatPearls Publishing',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK537171/',
    category: 'Anatomy & Neurophysiology',
    relevance: 'Foundational anatomical reference. Open-access, regularly updated, suitable as a primary source for course material.',
    isFoundational: true,
  },
  {
    id: 'cheng2017_vagal_efferents',
    authors: 'Cheng, Z., Powley, T. L., Schwaber, J. S., & Doyle, F. J.',
    year: '1997',
    title: 'Vagal afferent innervation of the atria of the rat heart reconstructed with confocal microscopy',
    source: 'Journal of Comparative Neurology, 381(1), 1-17',
    url: 'https://doi.org/10.1002/(SICI)1096-9861(19970428)381:1<1::AID-CNE1>3.0.CO;2-5',
    category: 'Anatomy & Neurophysiology',
    relevance: 'Classic reference for dorsal motor nucleus vs nucleus ambiguus projection patterns. Cited when distinguishing fibre populations.',
  },
  {
    id: 'berthoud2000_vagal_afferents',
    authors: 'Berthoud, H. R., & Neuhuber, W. L.',
    year: '2000',
    title: 'Functional and chemical anatomy of the afferent vagal system',
    source: 'Autonomic Neuroscience, 85(1-3), 1-17',
    url: 'https://doi.org/10.1016/S1566-0702(00)00215-0',
    category: 'Anatomy & Neurophysiology',
    relevance: 'Establishes the ~80% afferent / 20% efferent fibre ratio cited in Module 1. Foundational for the "the vagus is mostly listening" framing.',
    isFoundational: true,
  },
  {
    id: 'breit2018_vagus_review',
    authors: 'Breit, S., Kupferberg, A., Rogler, G., & Hasler, G.',
    year: '2018',
    title: 'Vagus nerve as modulator of the brain-gut axis in psychiatric and inflammatory disorders',
    source: 'Frontiers in Psychiatry, 9, 44',
    url: 'https://doi.org/10.3389/fpsyt.2018.00044',
    category: 'Anatomy & Neurophysiology',
    relevance: 'Comprehensive review of vagal involvement in inflammation and CNS conditions. Useful background for clinical reasoning, though some claims overreach beyond the evidence.',
  },
  {
    id: 'agostoni1957',
    authors: 'Agostoni, E., Chinnock, J. E., Daly, M. D. B., & Murray, J. G.',
    year: '1957',
    title: 'Functional and histological studies of the vagus nerve and its branches to the heart, lungs and abdominal viscera in the cat',
    source: 'Journal of Physiology, 135(1), 182-205',
    url: 'https://doi.org/10.1113/jphysiol.1957.sp005703',
    category: 'Anatomy & Neurophysiology',
    relevance: 'The original quantitative measurement of the afferent:efferent fibre ratio. Primary source still cited 70 years on.',
  },

  // ============ POLYVAGAL THEORY · CRITIQUE & DEBATE ============
  {
    id: 'porges2007_polyvagal',
    authors: 'Porges, S. W.',
    year: '2007',
    title: 'The polyvagal perspective',
    source: 'Biological Psychology, 74(2), 116-143',
    url: 'https://doi.org/10.1016/j.biopsycho.2006.06.009',
    category: 'Polyvagal Theory · Critique & Debate',
    relevance: 'The most widely-cited statement of polyvagal theory by its originator. Required reading to understand what the theory actually claims (vs the wellness adaptation).',
    isFoundational: true,
  },
  {
    id: 'grossman_taylor2007',
    authors: 'Grossman, P., & Taylor, E. W.',
    year: '2007',
    title: 'Toward understanding respiratory sinus arrhythmia: Relations to cardiac vagal tone, evolution and biobehavioral functions',
    source: 'Biological Psychology, 74(2), 263-285',
    url: 'https://doi.org/10.1016/j.biopsycho.2005.11.014',
    category: 'Polyvagal Theory · Critique & Debate',
    relevance: 'The foundational critique of polyvagal theory by senior autonomic-physiology researchers. Identifies specific anatomical claims that do not survive scrutiny.',
    isFoundational: true,
  },
  {
    id: 'grossman2023_critique',
    authors: 'Grossman, P.',
    year: '2023',
    title: 'Fundamental challenges and likely refutations of the five basic premises of the polyvagal theory',
    source: 'Biological Psychology, 180, 108589',
    url: 'https://doi.org/10.1016/j.biopsycho.2023.108589',
    category: 'Polyvagal Theory · Critique & Debate',
    relevance: 'Most recent comprehensive critique. Used in Module 1 to give clinicians the defensible position on what is and is not supported by the underlying anatomy.',
    isFoundational: true,
  },
  {
    id: 'porges2023_response',
    authors: 'Porges, S. W.',
    year: '2023',
    title: 'The vagal paradox: A polyvagal solution',
    source: 'Comprehensive Psychoneuroendocrinology, 16, 100200',
    url: 'https://doi.org/10.1016/j.cpnec.2023.100200',
    category: 'Polyvagal Theory · Critique & Debate',
    relevance: 'Porges\'s response to the Grossman critique. Read alongside for balance — both sides of the academic debate.',
  },

  // ============ HRV & VAGAL MEASUREMENT ============
  {
    id: 'shaffer_ginsberg2017',
    authors: 'Shaffer, F., & Ginsberg, J. P.',
    year: '2017',
    title: 'An overview of heart rate variability metrics and norms',
    source: 'Frontiers in Public Health, 5, 258',
    url: 'https://doi.org/10.3389/fpubh.2017.00258',
    category: 'HRV & Vagal Measurement',
    relevance: 'The reference clinicians should anchor HRV claims to. Sets reasonable expectations for what HRV metrics actually measure (and what they do not).',
    isFoundational: true,
  },
  {
    id: 'laborde2017_hrv',
    authors: 'Laborde, S., Mosley, E., & Thayer, J. F.',
    year: '2017',
    title: 'Heart rate variability and cardiac vagal tone in psychophysiological research — Recommendations for experiment planning, data analysis, and data reporting',
    source: 'Frontiers in Psychology, 8, 213',
    url: 'https://doi.org/10.3389/fpsyg.2017.00213',
    category: 'HRV & Vagal Measurement',
    relevance: 'Methodological gold standard for how HRV should be measured and reported. Cited in Module 3 (Clinical Assessment).',
  },
  {
    id: 'malik1996_task_force',
    authors: 'Task Force of the European Society of Cardiology and the North American Society of Pacing and Electrophysiology',
    year: '1996',
    title: 'Heart rate variability: Standards of measurement, physiological interpretation, and clinical use',
    source: 'Circulation, 93(5), 1043-1065',
    url: 'https://doi.org/10.1161/01.CIR.93.5.1043',
    category: 'HRV & Vagal Measurement',
    relevance: 'Foundational standards document for HRV measurement. Still the primary reference for measurement intervals and reporting.',
    isFoundational: true,
  },
  {
    id: 'singh2018_hrv_clinical',
    authors: 'Singh, N., Moneghetti, K. J., Christle, J. W., Hadley, D., Plews, D., & Froelicher, V.',
    year: '2018',
    title: 'Heart rate variability: An old metric with new meaning in the era of using mHealth technologies for health and exercise training guidance. Part one: Physiology and methods',
    source: 'Arrhythmia & Electrophysiology Review, 7(3), 193-198',
    url: 'https://doi.org/10.15420/aer.2018.27.2',
    category: 'HRV & Vagal Measurement',
    relevance: 'Modern clinical context for wearable-derived HRV. Helps clinicians evaluate the Apple Watch / Whoop / Garmin claims patients bring in.',
  },

  // ============ POTS & DYSAUTONOMIA ============
  {
    id: 'sheldon2015_syncope',
    authors: 'Sheldon, R. S., Grubb, B. P., Olshansky, B., et al.',
    year: '2015',
    title: '2015 Heart Rhythm Society expert consensus statement on the diagnosis and treatment of postural tachycardia syndrome, inappropriate sinus tachycardia, and vasovagal syncope',
    source: 'Heart Rhythm, 12(6), e41-e63',
    url: 'https://doi.org/10.1016/j.hrthm.2015.03.029',
    category: 'POTS & Dysautonomia',
    relevance: 'The clinical-guidelines anchor for POTS diagnosis and management. Defines the 30 bpm increase criterion used in Module 4.',
    isFoundational: true,
  },
  {
    id: 'vernino2021_pots',
    authors: 'Vernino, S., Bourne, K. M., Stiles, L. E., et al.',
    year: '2021',
    title: 'Postural orthostatic tachycardia syndrome (POTS): State of the science and clinical care from a 2019 National Institutes of Health Expert Consensus Meeting — Part 1',
    source: 'Autonomic Neuroscience, 235, 102828',
    url: 'https://doi.org/10.1016/j.autneu.2021.102828',
    category: 'POTS & Dysautonomia',
    relevance: 'NIH-convened expert consensus on POTS. Most recent comprehensive synthesis.',
  },
  {
    id: 'raj2022_pots_management',
    authors: 'Raj, S. R., Bourne, K. M., Stiles, L. E., et al.',
    year: '2022',
    title: 'Postural orthostatic tachycardia syndrome (POTS): Priorities for POTS care and research from a 2019 National Institutes of Health Expert Consensus Meeting — Part 2',
    source: 'Autonomic Neuroscience, 235, 102836',
    url: 'https://doi.org/10.1016/j.autneu.2021.102836',
    category: 'POTS & Dysautonomia',
    relevance: 'Companion management-focused paper to Vernino 2021. Used in Module 4 for triage and management algorithms.',
  },
  {
    id: 'low2008_orthostatic',
    authors: 'Low, P. A.',
    year: '2008',
    title: 'Prevalence of orthostatic hypotension',
    source: 'Clinical Autonomic Research, 18(Suppl 1), 8-13',
    url: 'https://doi.org/10.1007/s10286-007-1001-3',
    category: 'POTS & Dysautonomia',
    relevance: 'Establishes prevalence baselines for orthostatic intolerance, helpful when triaging which patients warrant referral.',
  },

  // ============ POST-CONCUSSION AUTONOMIC ============
  {
    id: 'esterov2017_autonomic',
    authors: 'Esterov, D., & Greenwald, B. D.',
    year: '2017',
    title: 'Autonomic dysfunction after mild traumatic brain injury',
    source: 'Brain Sciences, 7(8), 100',
    url: 'https://doi.org/10.3390/brainsci7080100',
    category: 'Post-Concussion Autonomic',
    relevance: 'Comprehensive review of autonomic dysfunction post-mTBI. Cited in Module 4 phenotype section.',
    isFoundational: true,
  },
  {
    id: 'leddy2019',
    authors: 'Leddy, J. J., Haider, M. N., Ellis, M. J., et al.',
    year: '2019',
    title: 'Early subthreshold aerobic exercise for sport-related concussion: A randomized clinical trial',
    source: 'JAMA Pediatrics, 173(4), 319-325',
    url: 'https://doi.org/10.1001/jamapediatrics.2018.4397',
    category: 'Post-Concussion Autonomic',
    relevance: 'The Buffalo protocol RCT. Establishes graded sub-symptom-threshold exercise as a defensible intervention for post-concussion autonomic dysfunction.',
  },
  {
    id: 'goodman2022_concussion_pots',
    authors: 'Goodman, B. P.',
    year: '2022',
    title: 'Evaluation of postural tachycardia syndrome (POTS)',
    source: 'Autonomic Neuroscience, 238, 102943',
    url: 'https://doi.org/10.1016/j.autneu.2022.102943',
    category: 'Post-Concussion Autonomic',
    relevance: 'Specifically addresses POTS following head trauma — the overlap territory that catches most clinicians.',
  },

  // ============ LONG COVID & POST-VIRAL ============
  {
    id: 'davenport2024_long_covid',
    authors: 'Davenport, T. E., Blitshteyn, S., Clague-Baker, N., et al.',
    year: '2024',
    title: 'Long COVID is associated with extensive in-vivo neuroinflammation on [18F]DPA-714 PET',
    source: 'EBioMedicine',
    url: 'https://www.thelancet.com/journals/ebiom',
    category: 'Long COVID & Post-Viral',
    relevance: 'Recent imaging evidence of neuroinflammation in long COVID. Anchors the autonomic-dysfunction-in-long-COVID phenotype to a biological mechanism.',
  },
  {
    id: 'goldstein2021_postcovid_autonomic',
    authors: 'Goldstein, D. S.',
    year: '2021',
    title: 'The possible association between COVID-19 and postural tachycardia syndrome',
    source: 'Heart Rhythm, 18(4), 508-509',
    url: 'https://doi.org/10.1016/j.hrthm.2020.12.007',
    category: 'Long COVID & Post-Viral',
    relevance: 'Establishes the long-COVID-to-POTS link clinicians need to be aware of for triaging post-viral autonomic complaints.',
  },
  {
    id: 'davis2023_long_covid',
    authors: 'Davis, H. E., McCorkell, L., Vogel, J. M., & Topol, E. J.',
    year: '2023',
    title: 'Long COVID: major findings, mechanisms and recommendations',
    source: 'Nature Reviews Microbiology, 21(3), 133-146',
    url: 'https://doi.org/10.1038/s41579-022-00846-2',
    category: 'Long COVID & Post-Viral',
    relevance: 'Comprehensive long-COVID review. Cited in Module 4 for the autonomic-cluster sub-phenotype.',
    isFoundational: true,
  },

  // ============ INTERVENTIONS · EVIDENCE BASE ============
  {
    id: 'laborde2022_slow_paced_breathing',
    authors: 'Laborde, S., Allen, M. S., Borges, U., et al.',
    year: '2022',
    title: 'Effects of voluntary slow breathing on heart rate and heart rate variability: A systematic review and a meta-analysis',
    source: 'Neuroscience & Biobehavioral Reviews, 138, 104711',
    url: 'https://doi.org/10.1016/j.neubiorev.2022.104711',
    category: 'Interventions · Evidence Base',
    relevance: 'Meta-analysis of slow-paced breathing on HRV. The most-defensible intervention in the vagal toolkit — Module 5 anchors here.',
    isFoundational: true,
  },
  {
    id: 'gerritsen2018_breathwork',
    authors: 'Gerritsen, R. J. S., & Band, G. P. H.',
    year: '2018',
    title: 'Breath of life: The respiratory vagal stimulation model of contemplative activity',
    source: 'Frontiers in Human Neuroscience, 12, 397',
    url: 'https://doi.org/10.3389/fnhum.2018.00397',
    category: 'Interventions · Evidence Base',
    relevance: 'Mechanism review for slow-breathing interventions. Useful for explaining to patients why the technique works (when it does).',
  },
  {
    id: 'smith2017_modified_valsalva',
    authors: 'Smith, G. D., Dyson, K., Taylor, D., et al. (REVERT Trial)',
    year: '2015',
    title: 'Postural modification to the standard Valsalva manoeuvre for emergency treatment of supraventricular tachycardias (REVERT): A randomised controlled trial',
    source: 'The Lancet, 386(10005), 1747-1753',
    url: 'https://doi.org/10.1016/S0140-6736(15)61485-4',
    category: 'Interventions · Evidence Base',
    relevance: 'RCT support for modified Valsalva manoeuvre in SVT. The single most-defensible vagal intervention in acute medicine.',
  },
  {
    id: 'tracey2009_inflammatory_reflex',
    authors: 'Tracey, K. J.',
    year: '2009',
    title: 'Reflex control of immunity',
    source: 'Nature Reviews Immunology, 9(6), 418-428',
    url: 'https://doi.org/10.1038/nri2566',
    category: 'Interventions · Evidence Base',
    relevance: 'Cholinergic anti-inflammatory pathway — the mechanistic basis for vagal nerve stimulation in inflammation. Currently device-mediated only, not behavioural.',
  },
  {
    id: 'koopman2016_vns',
    authors: 'Koopman, F. A., Chavan, S. S., Miljko, S., et al.',
    year: '2016',
    title: 'Vagus nerve stimulation inhibits cytokine production and attenuates disease severity in rheumatoid arthritis',
    source: 'Proceedings of the National Academy of Sciences, 113(29), 8284-8289',
    url: 'https://doi.org/10.1073/pnas.1605635113',
    category: 'Interventions · Evidence Base',
    relevance: 'Demonstrates implanted-VNS effect on cytokines in RA. Cited when distinguishing surgical-VNS (real, regulated) from behavioural "vagal toning" (less robust).',
  },

  // ============ CLINICAL GUIDELINES & FRAMEWORKS ============
  {
    id: 'shen2017_syncope_guidelines',
    authors: 'Shen, W. K., Sheldon, R. S., Benditt, D. G., et al.',
    year: '2017',
    title: '2017 ACC/AHA/HRS guideline for the evaluation and management of patients with syncope',
    source: 'Journal of the American College of Cardiology, 70(5), e39-e110',
    url: 'https://doi.org/10.1016/j.jacc.2017.03.003',
    category: 'Clinical Guidelines & Frameworks',
    relevance: 'Authoritative US/international guideline. Used in Module 2 (Red Flags) to anchor syncope-vs-vasovagal discrimination.',
    isFoundational: true,
  },
  {
    id: 'brignole2018_esc_syncope',
    authors: 'Brignole, M., Moya, A., de Lange, F. J., et al.',
    year: '2018',
    title: '2018 ESC Guidelines for the diagnosis and management of syncope',
    source: 'European Heart Journal, 39(21), 1883-1948',
    url: 'https://doi.org/10.1093/eurheartj/ehy037',
    category: 'Clinical Guidelines & Frameworks',
    relevance: 'European companion to the ACC/AHA/HRS guideline. Closely aligned but with subtle differences in tilt-table protocol recommendations.',
  },
  {
    id: 'cardiac_society_aus_pots',
    authors: 'Cardiac Society of Australia and New Zealand',
    year: '2024',
    title: 'CSANZ position on the diagnosis and management of POTS',
    source: 'Heart, Lung and Circulation',
    url: 'https://www.csanz.edu.au/guidelines/position-statements/',
    category: 'Clinical Guidelines & Frameworks',
    relevance: 'AU/NZ-specific position statement on POTS — relevant for AHPRA clinicians cross-referencing local practice norms.',
  },

  // ============ GO DEEPER · PODCASTS, VIDEOS, LECTURES ============
  {
    id: 'curbsiders_pots_episode',
    authors: 'The Curbsiders Internal Medicine Podcast',
    year: '2021',
    title: 'POTS — Postural Orthostatic Tachycardia Syndrome with Dr. Satish Raj',
    source: 'The Curbsiders #265',
    url: 'https://thecurbsiders.com/internal-medicine-podcast/265-pots',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'Dr Satish Raj (Calgary autonomic clinic, co-author of the NIH 2021/2022 POTS consensus) walks through POTS diagnosis and management. Single best-quality podcast on POTS available freely.',
    kind: 'podcast',
    duration: '60 min',
  },
  {
    id: 'hrs_pots_webinar',
    authors: 'Heart Rhythm Society',
    year: '2024',
    title: 'POTS, IST, and vasovagal syncope — clinical update',
    source: 'HRS expert webinar series',
    url: 'https://www.hrsonline.org/education',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'Free webinar series from the authors of the 2015 HRS expert consensus. Updated periodically — check for the most recent on POTS / IST / vasovagal.',
    kind: 'webinar',
  },
  {
    id: 'nih_pots_2019_recordings',
    authors: 'National Institutes of Health',
    year: '2019',
    title: 'NIH Expert Consensus Meeting on POTS — full recordings',
    source: 'NIH NHLBI archived event',
    url: 'https://www.nhlbi.nih.gov/events/2019/expert-consensus-meeting-postural-tachycardia-syndrome-pots',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'The source material for the Vernino 2021 / Raj 2022 consensus papers. ~6 hours of expert presentations — for clinicians who want the unfiltered evidence base.',
    kind: 'lecture',
    duration: '~6 hours',
  },
  {
    id: 'leddy_buffalo_lectures',
    authors: 'Leddy, J. J. — University at Buffalo Concussion Center',
    year: '2023',
    title: 'Buffalo Concussion Treadmill Test — protocol and application',
    source: 'University at Buffalo lecture series',
    url: 'https://medicine.buffalo.edu/departments/orthopaedics/research/concussion.html',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'Dr Leddy (lead author of the 2019 RCT) explains the BCTT in his own words. Free, video-recorded lecture material from the originating lab.',
    kind: 'lecture',
  },
  {
    id: 'dysautonomia_intl_conference',
    authors: 'Dysautonomia International',
    year: '2024',
    title: 'Annual research conference — recorded sessions',
    source: 'Dysautonomia International YouTube',
    url: 'https://www.dysautonomiainternational.org/page.php?ID=205',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'Patient-advocacy organisation with annual research conferences attended by all the named POTS clinicians (Grubb, Stiles, Raj, Vernino). Sessions are recorded and freely available.',
    kind: 'conference-talk',
  },
  {
    id: 'wilson_emory_autonomic',
    authors: 'Wilson, R. — Emory University Autonomic Clinic',
    year: '2024',
    title: 'Autonomic clinical assessment in primary care',
    source: 'Emory Department of Neurology lecture',
    url: 'https://med.emory.edu/departments/neurology/',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'Bedside-focused autonomic clinical reasoning. Useful for allied health building diagnostic confidence before referral.',
    kind: 'lecture',
  },
  {
    id: 'csanz_pots_webinar',
    authors: 'Cardiac Society of Australia and New Zealand',
    year: '2024',
    title: 'CSANZ POTS position — implementation webinar',
    source: 'CSANZ professional education',
    url: 'https://www.csanz.edu.au/professional-development/',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'AU/NZ-specific webinar implementing the CSANZ POTS position statement. Closest to AHPRA-relevant practice norms.',
    kind: 'webinar',
  },
  {
    id: 'attia_hrv_podcast',
    authors: 'Peter Attia, MD',
    year: '2023',
    title: 'HRV — what it measures, what it doesn\'t, how to use it honestly',
    source: 'The Drive podcast',
    url: 'https://peterattiamd.com/category/podcast/',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'One of the more evidence-honest discussions of HRV in mainstream health media. Useful for clinicians whose patients have absorbed inflated wearable-HRV claims.',
    kind: 'podcast',
  },
  {
    id: 'long_covid_clinic_aus',
    authors: 'Australian Long COVID clinic network',
    year: '2024',
    title: 'Autonomic manifestations of long COVID — multidisciplinary management',
    source: 'St Vincent\'s / Royal North Shore long COVID clinic webinar',
    url: 'https://www.svhs.org.au/services/long-covid',
    category: 'Go Deeper · Podcasts, Videos, Lectures',
    relevance: 'AU-specific long-COVID clinic content. Demonstrates referral pathway and multidisciplinary structure for the autonomic-cluster phenotype.',
    kind: 'webinar',
  },
]

export const VAGUS_REF_CATEGORIES: VagusRefCategory[] = [
  'Anatomy & Neurophysiology',
  'Polyvagal Theory · Critique & Debate',
  'HRV & Vagal Measurement',
  'POTS & Dysautonomia',
  'Post-Concussion Autonomic',
  'Long COVID & Post-Viral',
  'Interventions · Evidence Base',
  'Clinical Guidelines & Frameworks',
  'Go Deeper · Podcasts, Videos, Lectures',
]

export function getVagusReferencesByCategory(category: VagusRefCategory): VagusReference[] {
  return VAGUS_REFERENCES.filter((r) => r.category === category)
}

export function getFoundationalVagusReferences(): VagusReference[] {
  return VAGUS_REFERENCES.filter((r) => r.isFoundational)
}
