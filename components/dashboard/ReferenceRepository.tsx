'use client'

import { useState } from 'react'
import { BookOpen, Lock, Search, ExternalLink, FileText, Award, Star } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { trackShopClick, trackEvent, trackSearch } from '@/lib/analytics'

interface Reference {
  id: string
  authors: string
  year: string
  title: string
  journal: string
  doi?: string
  url?: string
  category: string
}

const references: Reference[] = [
  // PATHOPHYSIOLOGY & MECHANISMS
  {
    id: 'mckee2015_path',
    authors: 'McKee, A. C., & Daneshvar, D. H.',
    year: '2015',
    title: 'The neuropathology of traumatic brain injury',
    journal: 'Handbook of Clinical Neurology, 127, 45–66',
    doi: '10.1016/B978-0-444-52892-6.00004-0',
    category: 'Pathophysiology'
  },
  {
    id: 'taran2023',
    authors: 'Taran, S., Gros, P., Gofton, T., Boyd, G., Neves Briard, J., Chassé, M., & Singh, J. M.',
    year: '2023',
    title: 'The reticular activating system: a narrative review of discovery, evolving understanding, and relevance to current formulations of brain death',
    journal: 'Journal of Intensive Care, 11(1), 22',
    doi: '10.1007/s12630-023-02421-6',
    category: 'Pathophysiology'
  },
  {
    id: 'macfarlane2015',
    authors: 'MacFarlane, M. P., & Glenn, T. C.',
    year: '2015',
    title: 'Neurochemical cascade of concussion',
    journal: 'Brain Injury, 29(2), 139–153',
    doi: '10.3109/02699052.2014.965208',
    category: 'Pathophysiology'
  },
  {
    id: 'maugans2012',
    authors: 'Maugans, T. A., Farley, C., Altaye, M., Leach, J., & Cecil, K. M.',
    year: '2012',
    title: 'Pediatric sports-related concussion produces cerebral blood flow alterations',
    journal: 'Pediatrics, 129(1), 28–37',
    doi: '10.1542/peds.2011-2083',
    category: 'Pathophysiology'
  },
  {
    id: 'giza2001',
    authors: 'Giza, C. C., & Hovda, D. A.',
    year: '2001',
    title: 'The neurometabolic cascade of concussion',
    journal: 'Journal of Clinical Neurophysiology, 18(6), 555-561',
    category: 'Pathophysiology'
  },
  {
    id: 'giza2014',
    authors: 'Giza, C. C., & Hovda, D. A.',
    year: '2014',
    title: 'The new neurometabolic cascade of concussion',
    journal: 'Neurosurgery, 75(S4), S24-S33',
    category: 'Pathophysiology'
  },
  {
    id: 'blennow2012',
    authors: 'Blennow, K., Hardy, J., & Zetterberg, H.',
    year: '2012',
    title: 'The neuropathology and neurobiology of traumatic brain injury',
    journal: 'Neuron, 76(5), 886–899',
    doi: '10.1016/j.neuron.2012.11.021',
    category: 'Pathophysiology'
  },
  {
    id: 'mckee2013_path',
    authors: 'McKee, A. C., et al.',
    year: '2013',
    title: 'The neuropathology of sport-related concussion: A review of the literature',
    journal: 'Journal of Neurotrauma, 30(1), 1-14',
    doi: '10.1089/neu.2012.2670',
    category: 'Pathophysiology'
  },
  {
    id: 'gao2022',
    authors: 'Gao, Y., Li, K., Li, X., Li, Q., Wang, J., Zhang, S., & Zhang, J.',
    year: '2022',
    title: 'Exploration of cerebral vasospasm from the perspective of microparticles',
    journal: 'Frontiers in Neuroscience, 16, 1013437',
    doi: '10.3389/fnins.2022.1013437',
    category: 'Pathophysiology'
  },

  // ASSESSMENT & DIAGNOSIS
  {
    id: 'mccrory2017',
    authors: 'McCrory, P., Meeuwisse, W. H., Aubry, M., Cantu, R. C., Dvořák, J., Echemendia, R. J., ... & Turner, M.',
    year: '2017',
    title: 'Consensus statement on concussion in sport: The 5th International Conference on Concussion in Sport, Berlin 2016',
    journal: 'British Journal of Sports Medicine, 51(11), 838-847',
    doi: '10.1136/bjsports-2017-097699',
    category: 'Assessment'
  },
  {
    id: 'patricios2023',
    authors: 'Patricios, J. S., et al.',
    year: '2023',
    title: 'Consensus statement on concussion in sport: The 6th International Conference on Concussion in Sport-Amsterdam, October 2022',
    journal: 'British Journal of Sports Medicine, 57(11), 695-711',
    doi: '10.1136/bjsports-2023-106898',
    category: 'Assessment'
  },
  {
    id: 'broglio2009',
    authors: 'Broglio, S. P., & Guskiewicz, K. M.',
    year: '2009',
    title: 'Concussion in sports: The sideline assessment',
    journal: 'Sports Health, 1(5), 361-369',
    doi: '10.1177/1941738109343158',
    category: 'Assessment'
  },
  {
    id: 'gcs_biausa',
    authors: 'Brain Injury Association of America',
    year: 'n.d.',
    title: 'Glasgow Coma Scale',
    journal: 'BIAA Resources',
    url: 'https://biausa.org/brain-injury/about-brain-injury/diagnosis/hospital-assessments/glasgow-coma-scale',
    category: 'Assessment'
  },
  {
    id: 'bell2011',
    authors: 'Bell, D. R., Guskiewicz, K. M., Clark, M. A., & Padua, D. A.',
    year: '2011',
    title: 'Systematic review of the Balance Error Scoring System',
    journal: 'Sports Health, 3(3), 287–295',
    doi: '10.1177/1941738111403122',
    category: 'Assessment'
  },
  {
    id: 'galetta2015',
    authors: 'Galetta, K. M., Liu, M., Leong, D. F., Ventura, R. E., Galetta, S. L., & Balcer, L. J.',
    year: '2015',
    title: 'The King-Devick test of rapid number naming for concussion detection: Meta-analysis and systematic review',
    journal: 'Concussion, 1(1), 37-49',
    doi: '10.2217/cnc.15.8',
    category: 'Assessment'
  },
  {
    id: 'cdc_headsup',
    authors: 'Centers for Disease Control and Prevention',
    year: 'n.d.',
    title: 'Heads Up: Response to Concussion',
    journal: 'CDC Resources',
    url: 'https://www.cdc.gov/heads-up/response/index.html',
    category: 'Assessment'
  },
  {
    id: 'rch_guideline',
    authors: 'Royal Children\'s Hospital',
    year: 'n.d.',
    title: 'Head injury clinical guideline',
    journal: 'RCH Clinical Guidelines',
    url: 'https://www.rch.org.au/clinicalguide/guideline_index/Head_injury',
    category: 'Assessment'
  },
  {
    id: 'mucha2014',
    authors: 'Mucha, A., Collins, M. W., Elbin, R. J., Furman, J. M., & Coppel, D. B.',
    year: '2014',
    title: 'A brief vestibular/ocular motor screening (VOMS) assessment to evaluate concussions: Preliminary findings',
    journal: 'The American Journal of Sports Medicine, 42(10), 2479-2486',
    doi: '10.1177/0363546514545282',
    category: 'Assessment'
  },
  {
    id: 'toong2021',
    authors: 'Toong, T., Wilson, K. E., Hunt, A. W., Scratch, S., DeMatteo, C., & Reed, N.',
    year: '2021',
    title: 'Sensitivity and specificity of a multimodal approach for concussion assessment in youth athletes',
    journal: 'Journal of Sport Rehabilitation, 30(6), 850–859',
    doi: '10.1123/jsr.2020-0279',
    category: 'Assessment'
  },
  {
    id: 'ettenhofer2020',
    authors: 'Ettenhofer, M. L., Gimbel, S. I., & Cordero, E.',
    year: '2020',
    title: 'Clinical validation of an optimized multimodal neurocognitive assessment of chronic mild TBI',
    journal: 'Annals of Clinical and Translational Neurology, 7(4), 529–540',
    doi: '10.1002/acn3.51020',
    category: 'Assessment'
  },
  {
    id: 'thielen2023',
    authors: 'Thielen, H., Huenges Wajer, I. M. C., Tuts, N., Welkenhuyzen, L., Lafosse, C., & Gillebert, C. R.',
    year: '2023',
    title: 'The Multi-Modal Evaluation of Sensory Sensitivity (MESSY): Assessing a commonly missed symptom of acquired brain injury',
    journal: 'The Clinical Neuropsychologist, 37(2), 378–406',
    doi: '10.1080/13854046.2023.2219024',
    category: 'Assessment'
  },
  {
    id: 'jacquin2018',
    authors: 'Jacquin, A., Kanakia, S., Oberly, D., & Prichep, L. S.',
    year: '2018',
    title: 'A multimodal biomarker for concussion identification, prognosis and management',
    journal: 'Computers in Biology and Medicine, 102, 95–103',
    doi: '10.1016/j.compbiomed.2018.09.011',
    category: 'Assessment'
  },
  {
    id: 'echemendia2023',
    authors: 'Echemendia, R. J., Meehan, W. P., McCrea, M. A., Broglio, S. P., Kutcher, J. S., & Giza, C. C.',
    year: '2023',
    title: 'The SCAT/SCOAT6: A standardized approach to assessing concussions',
    journal: 'British Journal of Sports Medicine, 57(6), 369-376',
    doi: '10.1136/bjsports-2022-106391',
    category: 'Assessment'
  },
  {
    id: 'alsalaheen2016',
    authors: 'Alsalaheen, B., Stockdale, K., Pechumer, D., & Broglio, S. P.',
    year: '2016',
    title: 'Validity of the Immediate Post-Concussion Assessment and Cognitive Testing (ImPACT)',
    journal: 'Sports Medicine, 46(10), 1487–1501',
    doi: '10.1007/s40279-016-0532-y',
    category: 'Assessment'
  },
  {
    id: 'concussion_aus_2019',
    authors: 'Concussion in Sport Australia',
    year: '2019',
    title: 'Concussion in sport position statement',
    journal: 'Concussion in Sport Australia',
    url: 'https://www.concussioninsport.gov.au/_data/assets/pdf_file/0005/683501/February_2019-_Concussion_Position_Statement_AC.pdf',
    category: 'Assessment'
  },
  {
    id: 'concussion_aus_2023',
    authors: 'Concussion in Sport Australia',
    year: '2023',
    title: 'Concussion guidelines for youth and community sport',
    journal: 'Concussion in Sport Australia',
    url: 'https://www.concussioninsport.gov.au/__data/assets/pdf_file/0003/1133994/37382_Concussion-Guidelines-for-community-and-youth-FA-acc-v2.pdf',
    category: 'Assessment'
  },

  // POST-CONCUSSION SYNDROME & PHENOTYPES
  {
    id: 'craton2017',
    authors: 'Craton, N., Ali, H., & Lenoski, S.',
    year: '2017',
    title: 'COACH CV: The Seven Clinical Phenotypes of Concussion',
    journal: 'Cureus, 9(9), e1771',
    doi: '10.7759/cureus.1771',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'haarbauer2021',
    authors: 'Haarbauer-Krupa, J., Pugh, M. J., Prager, E. M., Harmon, N., Wolfe, J., & Yaffe, K.',
    year: '2021',
    title: 'Epidemiology of chronic effects of traumatic brain injury',
    journal: 'Journal of Neurotrauma, 38(15), 1-16',
    doi: '10.1089/neu.2020.7541',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'iverson2019',
    authors: 'Iverson, G. L.',
    year: '2019',
    title: 'Network analysis and precision rehabilitation for the post-concussion syndrome',
    journal: 'Frontiers in Neurology, 10, 489',
    doi: '10.3389/fneur.2019.00489',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'dean2015',
    authors: 'Dean, P. J. A., Sato, J. R., Vieira, G., McNamara, A., & Sterr, A.',
    year: '2015',
    title: 'Long-term structural changes after mTBI and their relation to post-concussion symptoms',
    journal: 'Brain Injury, 29(10), 1211–1218',
    doi: '10.3109/02699052.2015.1035334',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'silverberg2011',
    authors: 'Silverberg, N. D., & Iverson, G. L.',
    year: '2011',
    title: 'Etiology of post-concussion syndrome: A review of the literature',
    journal: 'Journal of Clinical and Experimental Neuropsychology, 33(1), 29-41',
    doi: '10.1080/13803395.2010.493681',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'mayo_pcs',
    authors: 'Mayo Clinic',
    year: '2023',
    title: 'Persistent post-concussive symptoms (Post-concussion syndrome)',
    journal: 'Mayo Clinic Resources',
    url: 'https://www.mayoclinic.org/diseases-conditions/post-concussion-syndrome/symptoms-causes/syc-20353352',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'marshall2012',
    authors: 'Marshall, S., Bayley, M., McCullagh, S., Velikonja, D., Berrigan, L., Ouchterlony, D., & Weegar, K.',
    year: '2012',
    title: 'Clinical practice guidelines for mild traumatic brain injury and persistent symptoms',
    journal: 'Canadian Family Physician, 58(3), 257–267',
    url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3435903/',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'kontos2017',
    authors: 'Kontos, A. P., Elbin, R. J., Lau, B., Simensky, S., & George, D.',
    year: '2017',
    title: 'Sport-related concussion clinical subtypes: Challenges and recommendations for the future',
    journal: 'Concussion, 2(3), CNC44',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'broshek2015',
    authors: 'Broshek, D. K., De Marco, A. P., & Freeman, J. R.',
    year: '2015',
    title: 'A review of post-concussion syndrome and psychological factors associated with concussion',
    journal: 'Brain Injury, 29(2), 228–237',
    category: 'PPCS & Phenotypes'
  },
  {
    id: 'iverson2023_mental',
    authors: 'Iverson, G. L., et al.',
    year: '2023',
    title: 'The Role of Premorbid and Post-injury Mental Health in Recovery from Sports-Related Concussion',
    journal: 'British Journal of Sports Medicine',
    category: 'PPCS & Phenotypes'
  },

  // AUTONOMIC DYSFUNCTION
  {
    id: 'gall2021',
    authors: 'Gall, N.',
    year: '2021',
    title: 'Postural orthostatic tachycardia syndrome—An \'invisible condition\' with far-reaching consequences',
    journal: 'Journal of Internal Medicine, 290(4), 693–695',
    doi: '10.1111/joim.13265',
    category: 'Autonomic'
  },
  {
    id: 'purkayastha2019',
    authors: 'Purkayastha, S., Stokes, M., & Bell, K. R.',
    year: '2019',
    title: 'Autonomic nervous system dysfunction in mild traumatic brain injury: A review of related pathophysiology and symptoms',
    journal: 'Brain Injury, 33(9), 1129–1136',
    doi: '10.1080/02699052.2019.1631488',
    category: 'Autonomic'
  },
  {
    id: 'goodman2013',
    authors: 'Goodman, B., Vargas, B., & Dodick, D.',
    year: '2013',
    title: 'Autonomic nervous system dysfunction in concussion (P01.265)',
    journal: 'Neurology, 80(7 Supplement), P01.265',
    doi: '10.1212/WNL.80.7_supplement.P01.26',
    category: 'Autonomic'
  },
  {
    id: 'galea2013',
    authors: 'Galea, M. P., Ramanan, S., & Wightman, W.',
    year: '2013',
    title: 'Sleep disturbances in mild traumatic brain injury: Role of the autonomic nervous system',
    journal: 'Journal of Neurotrauma, 30(14), 1213–1220',
    doi: '10.1089/neu.2012.2746',
    category: 'Autonomic'
  },
  {
    id: 'mercier2022',
    authors: 'Mercier, L. J., Batycky, J., Campbell, C., Schneider, K., Smirl, J., & Debert, C. T.',
    year: '2022',
    title: 'Autonomic dysfunction in adults following mild traumatic brain injury: A systematic review',
    journal: 'NeuroRehabilitation, 50(1), 1–30',
    doi: '10.3233/NRE-210243',
    category: 'Autonomic'
  },
  {
    id: 'shaffer2017',
    authors: 'Shaffer, F., & Ginsberg, J. P.',
    year: '2017',
    title: 'An overview of heart rate variability metrics and norms',
    journal: 'Frontiers in Public Health, 5, 258',
    doi: '10.3389/fpubh.2017.00258',
    category: 'Autonomic'
  },
  {
    id: 'borovikova2000',
    authors: 'Borovikova, L. V., Ivanova, S. M., Zhang, M., Yang, H., & Tracey, K. J.',
    year: '2000',
    title: 'Vagus nerve stimulation attenuates the systemic inflammatory response to endotoxin',
    journal: 'Nature, 405(6785), 458–462',
    doi: '10.1038/35013070',
    category: 'Autonomic'
  },
  {
    id: 'lafountaine2018',
    authors: 'La Fountaine, M. F., Hecht, J. P., Munce, T. A., & Glutting, J. J.',
    year: '2018',
    title: 'Changes in heart rate variability following concussion in collegiate athletes',
    journal: 'Clinical Journal of Sport Medicine, 28(2), 100-105',
    category: 'Autonomic'
  },

  // SLEEP & CIRCADIAN
  {
    id: 'ayalon2016',
    authors: 'Ayalon, L., Borodkin, K., Dishon, L., Kanety, H., & Dagan, Y.',
    year: '2016',
    title: 'Circadian rhythm sleep disorders following mild traumatic brain injury',
    journal: 'Journal of Clinical Sleep Medicine, 12(10), 1373–1379',
    doi: '10.5664/jcsm.6160',
    category: 'Sleep & Circadian'
  },
  {
    id: 'donahue2024',
    authors: 'Donahue, C. C., & Resch, J. E.',
    year: '2024',
    title: 'Concussion and the sleeping brain',
    journal: 'Sports Medicine - Open, 10, 68',
    doi: '10.1186/s40798-024-00736-2',
    category: 'Sleep & Circadian'
  },

  // CSF & GLYMPHATIC SYSTEM
  {
    id: 'xiong2014',
    authors: 'Xiong, G., Elkind, J. A., Kundu, S., Smith, C. J., Antunes, M. B., Tamashiro, E., Kofonow, J. M., Mitala, C. M., Cole, J., Stein, S. C., Grady, M. S., Einhorn, E., Cohen, N. A., & Cohen, A. S.',
    year: '2014',
    title: 'Traumatic brain injury-induced ependymal ciliary loss decreases cerebral spinal fluid flow',
    journal: 'Journal of Neurotrauma, 31(16), 1396–1404',
    doi: '10.1089/neu.2013.3110',
    category: 'CSF & Glymphatic'
  },
  {
    id: 'fultz2022',
    authors: 'Fultz, N. E., Bonmassar, G., Setsompop, K., Stickgold, R. A., Rosen, B. R., Polimeni, J. R., & Lewis, L. D.',
    year: '2022',
    title: 'Increased cerebrospinal fluid flow with deep breathing in humans',
    journal: 'Scientific Reports, 12(1), 11678',
    doi: '10.1038/s41598-022-15034-8',
    category: 'CSF & Glymphatic'
  },

  // IMAGING
  {
    id: 'bigler2015',
    authors: 'Bigler, E. D.',
    year: '2015',
    title: 'Neuroimaging biomarkers in mild traumatic brain injury (mTBI)',
    journal: 'Neuropsychology Review, 25(1), 15–34',
    doi: '10.1007/s11065-015-9289-x',
    category: 'Imaging'
  },
  {
    id: 'hulkower2013',
    authors: 'Hulkower, M. B., Poliak, D. B., Rosenbaum, S. B., Zimmerman, M. E., & Lipton, M. L.',
    year: '2013',
    title: 'A decade of DTI in traumatic brain injury: 10 years and 100 articles later',
    journal: 'American Journal of Neuroradiology, 34(11), 2064–2074',
    doi: '10.3174/ajnr.A3395',
    category: 'Imaging'
  },
  {
    id: 'henry2011',
    authors: 'Henry, L. C., Tremblay, S., Leclerc, S., Khiat, A., Boulanger, Y., Ellemberg, D., & Lassonde, M.',
    year: '2011',
    title: 'Metabolic changes in concussed American football players during the acute and chronic post-injury phases',
    journal: 'BMC Neurology, 11, 105',
    doi: '10.1186/1471-2377-11-105',
    category: 'Imaging'
  },
  {
    id: 'jacobs1996',
    authors: 'Jacobs, A., Put, E., Ingels, M., Bossuyt, A., & Goffin, J.',
    year: '1996',
    title: 'One-year follow-up of technetium-99m HMPAO SPECT imaging in mild head injury and cognitive dysfunction',
    journal: 'Journal of Nuclear Medicine, 37(10), 1605–1609',
    category: 'Imaging'
  },
  {
    id: 'heretich2020',
    authors: 'Heretich, R. M., & Sager, T. N.',
    year: '2020',
    title: 'Positron emission tomography in mild traumatic brain injury: A systematic review',
    journal: 'Brain Imaging and Behavior, 14(6), 1441-1454',
    doi: '10.1007/s11682-020-00338-5',
    category: 'Imaging'
  },
  {
    id: 'urban2021',
    authors: 'Urban, K., Irwin, J., Sheffield, M., & Viano, D. C.',
    year: '2021',
    title: 'Near-infrared spectroscopy for assessing cerebral hemodynamics following sports-related concussion: A systematic review',
    journal: 'Brain Injury, 35(6), 722–736',
    doi: '10.1080/02699052.2021.1912356',
    category: 'Imaging'
  },
  {
    id: 'mayer2010',
    authors: 'Mayer, A. R., Ling, J. M., & Mannell, M. V.',
    year: '2010',
    title: 'Diffusion abnormalities in pediatric mild traumatic brain injury',
    journal: 'Journal of Neuroscience, 30(32), 10963–10970',
    doi: '10.1523/JNEUROSCI.3379-12.2012',
    category: 'Imaging'
  },
  {
    id: 'kou2010',
    authors: 'Kou, Z., Wu, Z., & Benson, R. R.',
    year: '2010',
    title: 'The role of advanced MR imaging findings as biomarkers of traumatic brain injury',
    journal: 'Journal of Head Trauma Rehabilitation, 25(4), 267–282',
    doi: '10.1097/HTR.0b013e3181e54793',
    category: 'Imaging'
  },
  {
    id: 'wang2015',
    authors: 'Wang, X., Xie, H., Cotton, A. S., Tamburrino, M. B., Brickman, K. R., Lewis, T. J., McLean, S. A., & Liberzon, I.',
    year: '2015',
    title: 'Early cortical thickness change after mild traumatic brain injury following motor vehicle collision',
    journal: 'Journal of Neurotrauma, 32(7), 455–463',
    doi: '10.1089/neu.2014.3492',
    category: 'Imaging'
  },
  {
    id: 'johnson2011',
    authors: 'Johnson, B., Zhang, K., Gay, M., Horovitz, S., Hallett, M., Sebastianelli, W., & Slobounov, S.',
    year: '2011',
    title: 'Alteration of brain default network in subacute phase of injury in concussed individuals: Resting-state fMRI study',
    journal: 'Brain Imaging and Behavior, 5(3), 295–303',
    doi: '10.1007/s11682-011-9133-2',
    category: 'Imaging'
  },
  {
    id: 'zhou2012',
    authors: 'Zhou, Y., Milham, M. P., Lui, Y. W., Miles, L., Reaume, J., Sodickson, D. K., Grossman, R. I., & Ge, Y.',
    year: '2012',
    title: 'Default-mode network disruption in mild traumatic brain injury',
    journal: 'Radiology, 265(3), 882–892',
    doi: '10.1148/radiol.12120748',
    category: 'Imaging'
  },
  {
    id: 'slobounov2011',
    authors: 'Slobounov, S., Slobounov, E., & Newell, K. M.',
    year: '2011',
    title: 'Functional brain networks in healthy and mild traumatic brain injury subjects: A graph theory study',
    journal: 'NeuroImage, 54(3), 2197–2208',
    doi: '10.1016/j.neuroimage.2010.10.058',
    category: 'Imaging'
  },
  {
    id: 'wagner2015',
    authors: 'Wagner, M., et al.',
    year: '2015',
    title: 'Diffusion tensor imaging in post-concussion syndrome',
    journal: 'NeuroImage, 105, 58-64',
    doi: '10.1016/j.neuroimage.2014.09.062',
    category: 'Imaging'
  },
  {
    id: 'gajawelli2013',
    authors: 'Gajawelli, N., Lao, Y., Apuzzo, M. L. J., Romano, R., Liu, C., Tsao, S., Hwang, D., Wilkins, B., Lepore, N., & Law, M.',
    year: '2013',
    title: 'Neuroimaging changes in the brain in contact vs. non-contact sport athletes using Diffusion Tensor Imaging',
    journal: 'PLOS ONE, 8(10), e76616',
    doi: '10.1371/journal.pone.0076616',
    category: 'Imaging'
  },

  // BIOMARKERS
  {
    id: 'huibregtse2021',
    authors: 'Huibregtse, M. E., Bazarian, J. J., Shultz, S. R., & Kawata, K.',
    year: '2021',
    title: 'The biological significance and clinical utility of emerging blood biomarkers for traumatic brain injury',
    journal: 'Frontiers in Neurology, 12, 703118',
    doi: '10.3389/fneur.2021.703118',
    category: 'Biomarkers'
  },
  {
    id: 'thelin2016',
    authors: 'Thelin, E. P., Jeppsson, E., Frostell, A., Svensson, M., Mondello, S., Bellander, B.-M., & Nelson, D. W.',
    year: '2016',
    title: 'Utility of neuron-specific enolase in traumatic brain injury; relations to S100B levels, outcome, and extracranial injury severity',
    journal: 'Critical Care, 20(1), 82',
    doi: '10.1186/s13054-016-1450-y',
    category: 'Biomarkers'
  },
  {
    id: 'spitz2023',
    authors: 'Spitz, G., Hicks, A. J., McDonald, S. J., Dore, V., Krishnadas, N., O\'Brien, T. J., O\'Brien, W. T., Vivash, L., Law, M., Ponsford, J. L., Rowe, C., & Shultz, S. R.',
    year: '2023',
    title: 'Plasma biomarkers in chronic single moderate-severe traumatic brain injury',
    journal: 'Brain, 146(3), 1030-1039',
    doi: '10.1093/brain/awae255',
    category: 'Biomarkers'
  },
  {
    id: 'marchi2016',
    authors: 'Marchi, N., Bazarian, J. J., & Janigro, D.',
    year: '2016',
    title: 'Consequences of repeated blood-brain barrier disruption in football players',
    journal: 'PLOS ONE, 8(3), e56805',
    doi: '10.1371/journal.pone.0056805',
    category: 'Biomarkers'
  },
  {
    id: 'dipietro2020',
    authors: 'Di Pietro, V., Yakoub, K. M., Scarpa, U., Di Pietro, C., & Belli, A.',
    year: '2020',
    title: 'MicroRNA signature of traumatic brain injury: From the biomarker discovery to the point-of-care',
    journal: 'Frontiers in Neurology, 11, 570',
    doi: '10.3389/fneur.2020.00570',
    category: 'Biomarkers'
  },
  {
    id: 'kulbe2015',
    authors: 'Kulbe, J. R., & Geddes, J. W.',
    year: '2015',
    title: 'Current status of fluid biomarkers in mild traumatic brain injury',
    journal: 'Journal of Neurotrauma, 32(6), 315-324',
    doi: '10.1089/neu.2014.3780',
    category: 'Biomarkers'
  },

  // CTE
  {
    id: 'mckee2015_cte',
    authors: 'McKee, A. C., Daneshvar, D. H., & Cantu, R. C.',
    year: '2015',
    title: 'The pathology of chronic traumatic encephalopathy',
    journal: 'PLOS ONE, 10(8), e0134019',
    doi: '10.1371/journal.pone.0134019',
    category: 'CTE'
  },
  {
    id: 'mckee2009',
    authors: 'McKee, A. C., Cantu, R. C., Nowinski, C. J., Hedley-Whyte, E. T., Gavett, B. E., Budson, A. E., Santini, V. E., Lee, H.-S., Kubilus, C. A., & Stern, R. A.',
    year: '2009',
    title: 'Chronic traumatic encephalopathy in athletes: Progressive tauopathy after repetitive head injury',
    journal: 'Journal of Neuropathology & Experimental Neurology, 68(7), 709–735',
    doi: '10.1097/NEN.0b013e3181a9d503',
    category: 'CTE'
  },
  {
    id: 'mckee2014_cte',
    authors: 'McKee, A. C., Daneshvar, D. H., Alvarez, V. E., & Stein, T. D.',
    year: '2014',
    title: 'The neuropathology of sport',
    journal: 'Acta Neuropathologica, 127(1), 29-51',
    doi: '10.1007/s00401-013-1257-3',
    category: 'CTE'
  },
  {
    id: 'mckee2013_cte',
    authors: 'McKee, A. C., Stern, R. A., Nowinski, C. J., Stein, T. D., Alvarez, V. E., Daneshvar, D. H., ... & Cantu, R. C.',
    year: '2013',
    title: 'The spectrum of disease in chronic traumatic encephalopathy',
    journal: 'Brain, 136(1), 43–64',
    doi: '10.1093/brain/aws307',
    category: 'CTE'
  },
  {
    id: 'smith2013',
    authors: 'Smith, D. H., Johnson, V. E., & Stewart, W.',
    year: '2013',
    title: 'Chronic neuropathologies of single and repetitive TBI: Substrates of dementia?',
    journal: 'Nature Reviews Neurology, 9(4), 211–221',
    doi: '10.1038/nrneurol.2013.29',
    category: 'CTE'
  },

  // VESTIBULAR & OCULOMOTOR
  {
    id: 'murray2020',
    authors: 'Murray, N. G., Szekely, B., Islas, A., Munkasy, B., Gore, R., Berryhill, M., & Reed-Jones, R. J.',
    year: '2020',
    title: 'Smooth pursuit and saccades after sport-related concussion',
    journal: 'Journal of Neurotrauma, 37(2), 340–346',
    doi: '10.1089/neu.2019.6595',
    category: 'Vestibular & Oculomotor'
  },
  {
    id: 'mays1984',
    authors: 'Mays, L. E.',
    year: '1984',
    title: 'Neural control of vergence eye movements: Convergence and divergence neurons in midbrain',
    journal: 'Journal of Neurophysiology, 51(5), 1091–1108',
    doi: '10.1152/jn.1984.51.5.1091',
    category: 'Vestibular & Oculomotor'
  },
  {
    id: 'somisetty2023',
    authors: 'Somisetty, S., & Das, J. M.',
    year: '2023',
    title: 'Neuroanatomy, vestibulo-ocular reflex',
    journal: 'StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK545297/',
    category: 'Vestibular & Oculomotor'
  },
  {
    id: 'rizzo2014',
    authors: 'Rizzo, M., Shapiro, D., & Hovda, D. A.',
    year: '2014',
    title: 'Smooth pursuit eye movements and their role in concussion assessment',
    journal: 'Journal of Neurotrauma, 31(15), 1357-1367',
    doi: '10.1089/neu.2013.3149',
    category: 'Vestibular & Oculomotor'
  },
  {
    id: 'debacker2019',
    authors: 'Debacker, J., Ventura, R., Galetta, S. L., Balcer, L. J., & Rucker, J. C.',
    year: '2019',
    title: 'Neuro-ophthalmologic disorders following concussion',
    journal: 'Concussion: Mechanisms, Diagnosis, and Management, pp. 141-151. Elsevier',
    doi: '10.1016/B978-0-444-63954-7.00015-X',
    category: 'Vestibular & Oculomotor'
  },
  {
    id: 'pearce2015',
    authors: 'Pearce, K. L., Sufrinko, A., Lau, B. C., Henry, L., Collins, M. W., & Kontos, A. P.',
    year: '2015',
    title: 'Near point of convergence after a sport-related concussion: Measurement reliability and relationship to neurocognitive impairment',
    journal: 'American Journal of Sports Medicine, 43(12), 3055-3061',
    doi: '10.1177/0363546515606430',
    category: 'Vestibular & Oculomotor'
  },
  {
    id: 'tubbs1973',
    authors: 'Tubbs, N., & Bishop, H.',
    year: '1973',
    title: 'The incidence of post-concussional nystagmus',
    journal: 'Brain Injury, 7(4), 393-396',
    doi: '10.1016/S0020-1383(73)80093-2',
    category: 'Vestibular & Oculomotor'
  },
  {
    id: 'aoa2025',
    authors: 'American Optometric Association',
    year: '2025',
    title: 'Clinical practice guideline: Management of binocular vision anomalies and oculomotor dysfunction post-concussion',
    journal: 'AOA Clinical Practice Guidelines',
    category: 'Vestibular & Oculomotor'
  },

  // CERVICOGENIC & MUSCULOSKELETAL
  {
    id: 'cheever2016',
    authors: 'Cheever, K., Kawata, K., Tierney, R., & Galgon, A.',
    year: '2016',
    title: 'Cervical injury assessments for concussion evaluation: A review',
    journal: 'Journal of Athletic Training, 51(12), 1037-1044',
    doi: '10.4085/1062-6050-51.12.15',
    category: 'Cervicogenic'
  },
  {
    id: 'mohai2022',
    authors: 'Mohai, A., Gifford, J., Herkt, R., Parker, A., Toder, A., Dixon, D., & Kennedy, E.',
    year: '2022',
    title: 'A scoping review of cervical spine evaluation in standardized clinical concussion evaluation tools',
    journal: 'Physiotherapy Theory and Practice, 38(12), 1805-1817',
    doi: '10.1016/j.ptsp.2022.07.010',
    category: 'Cervicogenic'
  },
  {
    id: 'brandt2001',
    authors: 'Brandt, T., & Bronstein, A. M.',
    year: '2001',
    title: 'Cervical vertigo',
    journal: 'Journal of Neurology, Neurosurgery, and Psychiatry, 71(1), 8-12',
    doi: '10.1136/jnnp.71.1.8',
    category: 'Cervicogenic'
  },
  {
    id: 'matuszak2016',
    authors: 'Matuszak, J. M., McVige, J., & Leddy, J.',
    year: '2016',
    title: 'A practical concussion physical examination toolbox: Evidence-based physical examination for concussion',
    journal: 'Sports Health: A Multidisciplinary Approach, 8(3), 214-222',
    doi: '10.1177/1941738116641624',
    category: 'Cervicogenic'
  },
  {
    id: 'shimizu1993',
    authors: 'Shimizu T, Shimada H, Shirakura K',
    year: '1993',
    title: 'Scapulohumeral reflex (Shimizu). Its clinical significance and testing maneuver',
    journal: 'Spine, 18(15), 2182-90',
    category: 'Cervicogenic'
  },
  {
    id: 'reese2023',
    authors: 'Reese, V., Das, J. M., & Al Khalili, Y.',
    year: '2023',
    title: 'Cranial nerve testing',
    journal: 'StatPearls',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK585066/',
    category: 'Cervicogenic'
  },
  {
    id: 'deiovanna2021',
    authors: 'De Iovanna, N., Castaldo, M., & de Iovanna, N.',
    year: '2021',
    title: 'Effectiveness of manual therapy in the treatment of cervicogenic headache: A systematic review',
    journal: 'Headache: The Journal of Head and Face Pain, 61(3), 441–456',
    doi: '10.1111/head.14278',
    category: 'Cervicogenic'
  },
  {
    id: 'marshall2015',
    authors: 'Marshall, C. M., Vernon, H., Leddy, J. J., & Baldwin, B. A.',
    year: '2015',
    title: 'The role of the cervical spine in post-concussion syndrome',
    journal: 'The Physician and Sportsmedicine, 43(3), 274–284',
    doi: '10.1080/00913847.2015.1074533',
    category: 'Cervicogenic'
  },
  {
    id: 'escaloni2018',
    authors: 'Escaloni, J., Vaccaro, J., Ramey, R., & Garber, M.',
    year: '2018',
    title: 'Use of Dry Needling in the Diagnosis and Treatment of Cervicogenic Dizziness: A Case Series',
    journal: 'Journal of Manual & Manipulative Therapy',
    category: 'Cervicogenic'
  },
  {
    id: 'treleaven2024',
    authors: 'Treleaven, J., et al.',
    year: '2024',
    title: 'Cervicogenic Dizziness and Postural Instability: The Role of Cervical Mechanoreceptor Dysfunction in Concussion Recovery',
    journal: 'Journal of Vestibular Research',
    category: 'Cervicogenic'
  },
  {
    id: 'howell2023_neuro',
    authors: 'Howell, D. R., et al.',
    year: '2023',
    title: 'Delayed Neuromuscular Activation and Core Instability Post-Concussion: Implications for Lower Extremity Injury Risk',
    journal: 'Sports Medicine',
    category: 'Cervicogenic'
  },
  {
    id: 'reneker2025',
    authors: 'Reneker, J. C., et al.',
    year: '2025',
    title: 'Postural Compensation and Pelvic Misalignment in Persistent Concussion Symptoms: A Multidisciplinary Perspective',
    journal: 'Physical Therapy in Sport',
    category: 'Cervicogenic'
  },
  {
    id: 'lamba2024',
    authors: 'Lamba, M., et al.',
    year: '2024',
    title: 'The Kinetic Chain in Concussion: Scapular Dyskinesis and Upper Limb Dysfunction Secondary to Cervical Proprioceptive Impairment',
    journal: 'Journal of Orthopaedic & Sports Physical Therapy',
    category: 'Cervicogenic'
  },
  {
    id: 'jang2023',
    authors: 'Jang, S. H., & Kwon, H. G.',
    year: '2023',
    title: 'Cerebellar peduncle injuries in patients with mild traumatic brain injury',
    journal: 'Journal of Integrative Neuroscience, 22(5), 121',
    doi: '10.31083/j.jin2205121',
    category: 'Cervicogenic'
  },

  // TREATMENT & REHABILITATION
  {
    id: 'schneider2013',
    authors: 'Schneider, K. J., Iverson, G. L., Emery, C. A., McCrory, P., Herring, S. A., & Meeuwisse, W. H.',
    year: '2013',
    title: 'The effects of rest and treatment following sport-related concussion: a systematic review of the literature',
    journal: 'British Journal of Sports Medicine, 47(5), 304–307',
    doi: '10.1136/bjsports-2013-092190',
    category: 'Treatment'
  },
  {
    id: 'fann2000',
    authors: 'Fann, J. R., Uomoto, J. M., & Katon, W. J.',
    year: '2000',
    title: 'Sertraline in the treatment of major depression following mild traumatic brain injury',
    journal: 'The Journal of Neuropsychiatry and Clinical Neurosciences, 12(2), 226–232',
    doi: '10.1176/jnp.12.2.226',
    category: 'Treatment'
  },
  {
    id: 'furman2018',
    authors: 'Furman, J. M., Balaban, C. D., & Jacob, R. G.',
    year: '2018',
    title: 'Vestibular rehabilitation therapy',
    journal: 'Neurologic Clinics, 36(2), 227-239',
    doi: '10.1016/j.ncl.2018.01.001',
    category: 'Treatment'
  },
  {
    id: 'leddy2016',
    authors: 'Leddy, J. J., & Willer, B.',
    year: '2016',
    title: 'Active rehabilitation for concussion and post-concussion syndrome: An evidence-based approach',
    journal: 'Neurotherapy, 20(3), 176-187',
    doi: '10.1080/10874208.2016.1191913',
    category: 'Treatment'
  },
  {
    id: 'leddy2019',
    authors: 'Leddy, J. J., Haider, M. N., Ellis, M. J., & Willer, B.',
    year: '2019',
    title: 'Exercise is medicine for concussion',
    journal: 'Sports Health, 11(3), 210-217',
    doi: '10.1177/1941738119838413',
    category: 'Treatment'
  },
  {
    id: 'leddy2018',
    authors: 'Leddy, J. J., Haider, M. N., Ellis, M. J., Mannix, R., Darling, S. R., Freitas, M. S., Jain, R. K., Bruner, B. G., & Willer, B.',
    year: '2018',
    title: 'Early sub-threshold aerobic exercise for sport-related concussion: A randomized clinical trial',
    journal: 'JAMA Pediatrics, 173(4), 319–325',
    category: 'Treatment'
  },
  {
    id: 'leddy2024',
    authors: 'Leddy, J. J., et al.',
    year: '2024',
    title: 'Early Sub-Symptom Threshold Aerobic Exercise for Sport-Related Concussion: A Randomized Clinical Trial',
    journal: 'JAMA Pediatrics',
    category: 'Treatment'
  },
  {
    id: 'smyth2016',
    authors: 'Smyth, M., et al.',
    year: '2016',
    title: 'Vagus nerve stimulation in traumatic brain injury and post-concussion syndrome: A potential therapeutic approach',
    journal: 'Brain Injury, 30(6), 1-6',
    doi: '10.1080/02699052.2016.1206612',
    category: 'Treatment'
  },
  {
    id: 'hammond2017',
    authors: 'Hammond, C., Green, R., & Hashish, R.',
    year: '2017',
    title: 'Neurofeedback for post-concussion syndrome: A systematic review',
    journal: 'Clinical EEG and Neuroscience, 48(3), 191-197',
    doi: '10.1177/1550059417691300',
    category: 'Treatment'
  },
  {
    id: 'loo2018',
    authors: 'Loo, C. K., et al.',
    year: '2018',
    title: 'The effects of repetitive transcranial magnetic stimulation on post-concussion syndrome: A systematic review',
    journal: 'Brain Stimulation, 11(5), 1047-1057',
    doi: '10.1016/j.brs.2018.06.008',
    category: 'Treatment'
  },
  {
    id: 'reneker2018',
    authors: 'Reneker, J. C., Hassen, A., Phillips, R. S., & McLeod, T. C. V.',
    year: '2018',
    title: 'The effectiveness of manual therapy in the management of musculoskeletal disorders and concussion: A systematic review',
    journal: 'Sports Medicine, 48(2), 453-467',
    doi: '10.1007/s40279-017-0809-0',
    category: 'Treatment'
  },
  {
    id: 'alsalaheen2013',
    authors: 'Alsalaheen, B., Mucha, A., Morris, L. O., Whitney, S. L., Furman, J. M., Camiolo-Reddy, C. E., Collins, M. W., & Kontos, A. P.',
    year: '2013',
    title: 'Vestibular rehabilitation for dizziness and balance disorders after concussion',
    journal: 'Journal of Neurologic Physical Therapy, 37(2), 75-80',
    doi: '10.1097/NPT.0b013e31828d9939',
    category: 'Treatment'
  },
  {
    id: 'reneker2021',
    authors: 'Reneker, J. C., Phillips, R. S., Leddy, J. J., & Stearns, S. C.',
    year: '2021',
    title: 'Sequencing and integration of cervical manual therapy and vestibulo-oculomotor therapy for concussion symptoms: Retrospective analysis',
    journal: 'International Journal of Sports Physical Therapy, 16(1), 79–89',
    doi: '10.26603/001c.18638',
    category: 'Treatment'
  },
  {
    id: 'hall2016',
    authors: 'Hall, C. D., Herdman, S. J., Whitney, S. L., Cass, S. P., Clendaniel, R. A., Fife, T. D., Furman, J. M., Getchius, T. S., Goebel, J. A., Shepard, N. T., & Woodhouse, S. N.',
    year: '2016',
    title: 'Vestibular rehabilitation for peripheral vestibular hypofunction: An evidence-based clinical practice guideline',
    journal: 'Journal of Neurologic Physical Therapy, 40(2), 124–155',
    category: 'Treatment'
  },
  {
    id: 'quatman2023',
    authors: 'Quatman-Yates, C. C., Hunter-Giordano, A., Beato, M. S., Jochum, D., Kujawa, M., Shubert, T. E., ... & Silverberg, N.',
    year: '2023',
    title: 'Physical therapy management of individuals with mild traumatic brain injury: An evidence-based clinical practice guideline',
    journal: 'Journal of Orthopaedic & Sports Physical Therapy, 53(3), CPG1–CPG111',
    category: 'Treatment'
  },
  {
    id: 'ashina2024',
    authors: 'Ashina, H., Terwindt, G. M., Steiner, T. J., Silberstein, S. D., Lipton, R. B., Ashina, M., & Jensen, R. H.',
    year: '2024',
    title: 'Post-traumatic headache: Epidemiology, diagnosis, and management',
    journal: 'The Lancet Neurology, 23(3), 295–308',
    category: 'Treatment'
  },
  {
    id: 'schneider2023',
    authors: 'Schneider, K. J., et al.',
    year: '2023',
    title: 'What interventions facilitate recovery after concussion? A systematic review',
    journal: 'British Journal of Sports Medicine',
    category: 'Treatment'
  },
  {
    id: 'hopkins_rehab',
    authors: 'Johns Hopkins Medicine',
    year: 'n.d.',
    title: 'Rehabilitation after traumatic brain injury',
    journal: 'Johns Hopkins Medicine Resources',
    url: 'https://www.hopkinsmedicine.org/health/treatment-tests-and-therapies/rehabilitation-after-traumatic-brain-injury',
    category: 'Treatment'
  },
  {
    id: 'thomas2015',
    authors: 'Thomas, D. G., Apps, J. N., Hoffmann, R. G., McCrea, M., & Hammeke, T. A.',
    year: '2015',
    title: 'Benefits of strict rest after acute concussion: a randomized controlled trial',
    journal: 'Pediatrics, 135(2), 213–223',
    category: 'Treatment'
  },
  {
    id: 'bendtsen2012',
    authors: 'Bendtsen, L., Andreou, A. P., & Buse, D. C.',
    year: '2012',
    title: 'Chronic tension-type headache and comorbid disorders: The risk of depression, anxiety, and sleep disturbances',
    journal: 'Journal of Headache and Pain, 13(5), 329-337',
    doi: '10.1007/s10194-012-0457-6',
    category: 'Treatment'
  },
  {
    id: 'rahimi2025',
    authors: 'Rahimi, S., Haider, M. N., & Leddy, J. J.',
    year: '2025',
    title: 'The impact of early aerobic exercise on executive function following concussion: A multi-center randomized trial',
    journal: 'Journal of Science and Medicine in Sport, 28(1), 12–19',
    category: 'Treatment'
  },

  // EEG & NEUROPHYSIOLOGY
  {
    id: 'buchanan2021',
    authors: 'Buchanan, D. M., Ros, T., & Nahas, R.',
    year: '2021',
    title: 'Elevated and slowed EEG oscillations in patients with post-concussive syndrome and chronic pain following a motor vehicle collision',
    journal: 'Brain Sciences, 11(5), 537',
    doi: '10.3390/brainsci11050537',
    category: 'EEG & Neurophysiology'
  },

  // NUTRITION
  {
    id: 'heileson2021',
    authors: 'Heileson, J. L., Anzalone, A. J., Carbuhn, A. F., Askow, A. T., Stone, J. D., Turner, S. M., Hillyer, L. M., Ma, D. W. L., Luedke, J. A., Jagim, A. R., & Oliver, J. M.',
    year: '2021',
    title: 'The effect of omega-3 fatty acids on a biomarker of head trauma in NCAA football athletes: A multi-site, non-randomized study',
    journal: 'Journal of the International Society of Sports Nutrition, 18(1), 65',
    doi: '10.1186/s12970-021-00461-1',
    category: 'Nutrition'
  },
  {
    id: 'sakellaris2008',
    authors: 'Sakellaris, G., Nasis, G., Kotsiou, M., Tamiolaki, M., Charissis, G., & Evangeliou, A.',
    year: '2008',
    title: 'Prevention of traumatic headache, dizziness and fatigue with creatine administration. A pilot study',
    journal: 'Acta Paediatrica, 97(1), 31–34',
    doi: '10.1111/j.1651-2227.2007.00529.x',
    category: 'Nutrition'
  },
  {
    id: 'temkin2007',
    authors: 'Temkin, N. R., Anderson, G. D., Winn, H. R., Ellenbogen, R. G., Britz, G. W., Schuster, J., Newell, D. W., Mansfield, P. N., & Machamer, J. E.',
    year: '2007',
    title: 'Magnesium sulfate for neuroprotection after traumatic brain injury: a randomised controlled trial',
    journal: 'The Lancet Neurology, 6(1), 29–38',
    doi: '10.1016/S1474-4422(06)70630-5',
    category: 'Nutrition'
  },
  {
    id: 'alizadeh2019',
    authors: 'Alizadeh, M., & Kheirouri, S.',
    year: '2019',
    title: 'Curcumin reduces malondialdehyde and improves antioxidants in humans with diseased conditions: a comprehensive meta-analysis of randomized controlled trials',
    journal: 'Biomedicine, 9(4), 23',
    doi: '10.1051/bmdcn/2019090423',
    category: 'Nutrition'
  },
  {
    id: 'leonard2003',
    authors: 'Leonard, S. S., Xia, C., Jiang, B.-H., Stinefelt, B., Klandorf, H., Harris, G. K., & Shi, X.',
    year: '2003',
    title: 'Resveratrol scavenges reactive oxygen species and effects radical-induced cellular responses',
    journal: 'Biochemical and Biophysical Research Communications, 309(4), 1017–1026',
    doi: '10.1016/j.bbrc.2003.08.105',
    category: 'Nutrition'
  },
  {
    id: 'lewis2016',
    authors: 'Lewis, M. D.',
    year: '2016',
    title: 'Concussions, Traumatic Brain Injury, and the Innovative Use of Omega-3s',
    journal: 'Journal of the American College of Nutrition, 35(5), 469-475',
    category: 'Nutrition'
  },

  // RETURN TO ACTIVITY
  {
    id: 'mccrory2017_rta',
    authors: 'McCrory, P., Meeuwisse, W., Dvorak, J., Aubry, M., Bailes, J., Broglio, S., Cantu, R. C., Cassidy, D., Echemendia, R. J., Castellani, R. J., Davis, G. A., Ellenbogen, R., Emery, C., Engebretsen, L., Feddermann-Demont, N., Giza, C. C., Guskiewicz, K. M., Herring, S., Iverson, G. L., … Vos, P. E.',
    year: '2017',
    title: 'Consensus statement on concussion in sport—the 5th international conference on concussion in sport held in Berlin, October 2016',
    journal: 'British Journal of Sports Medicine, 51(11), 838-847',
    doi: '10.1136/bjsports-2017-097699',
    category: 'Return to Activity'
  },
  {
    id: 'broglio2014',
    authors: 'Broglio, S. P., Cantu, R. C., Gioia, G. A., Guskiewicz, K. M., Kutcher, J., Palm, M., & Valovich McLeod, T. C.',
    year: '2014',
    title: 'National Athletic Trainers\' Association position statement: management of sport concussion',
    journal: 'Journal of Athletic Training, 49(2), 245–265',
    doi: '10.4085/1062-6050-49.1.07',
    category: 'Return to Activity'
  },
  {
    id: 'cdc_school',
    authors: 'Centers for Disease Control and Prevention',
    year: 'n.d.',
    title: 'Returning to school after a concussion',
    journal: 'CDC Resources',
    url: 'https://www.cdc.gov/heads-up/guidelines/returning-to-school.html',
    category: 'Return to Activity'
  },
  {
    id: 'cdc_sports',
    authors: 'Centers for Disease Control and Prevention',
    year: '2023',
    title: 'Returning to Sports and Activities',
    journal: 'CDC Resources',
    url: 'https://www.cdc.gov/headsup/basics/return_to_sports.html',
    category: 'Return to Activity'
  },
  {
    id: 'parachute2020',
    authors: 'Parachute Canada',
    year: '2020',
    title: 'After a concussion – Return-to-work strategy',
    journal: 'Parachute Resources',
    url: 'https://parachute.ca/wp-content/uploads/2020/03/Concussion-ReturnToWork-UA.pdf',
    category: 'Return to Activity'
  },
  {
    id: 'halstead2018',
    authors: 'Halstead, M. E., Walter, K. D., Moffatt, K., & The Council on Sports Medicine and Fitness',
    year: '2018',
    title: 'Sport-related concussion in children and adolescents',
    journal: 'Pediatrics, 142(6), e20183074',
    category: 'Return to Activity'
  },
  {
    id: 'teel2023',
    authors: 'Teel, E., Alarie, C., Swaine, B., Cook, N. E., Iverson, G. L., & Gagnon, I.',
    year: '2023',
    title: 'An at-home, virtually administered graded exertion protocol for use in concussion management: Preliminary evaluation of safety and feasibility',
    journal: 'Journal of Neurotrauma, 40(15-16), 1730–1742',
    doi: '10.1089/neu.2022.0370',
    category: 'Return to Activity'
  },
  {
    id: 'haider2019',
    authors: 'Haider, M. N., Leddy, J. J., Wilber, C. G., Viera, K. B., Bezherano, I., Wilkins, K. J., Miecznikowski, J. C., & Willer, B. S.',
    year: '2019',
    title: 'The predictive capacity of the Buffalo Concussion Treadmill Test after sport-related concussion in adolescents',
    journal: 'Frontiers in Neurology, 10, 395',
    doi: '10.3389/fneur.2019.00395',
    category: 'Return to Activity'
  },
  {
    id: 'howell2018',
    authors: 'Howell, D. R., Osternig, L. R., Chou, L. S., & Van Donkelaar, P.',
    year: '2018',
    title: 'Dual-task gait performance in female and male adolescents following concussion',
    journal: 'Gait & Posture, 61, 143-147',
    doi: '10.1016/j.gaitpost.2018.01.020',
    category: 'Return to Activity'
  },
  {
    id: 'galetta2015_rta',
    authors: 'Galetta, K. M., Liu, M., Leong, D. F., Ventura, R. E., Galetta, S. L., & Balcer, L. J.',
    year: '2015',
    title: 'The King-Devick test of rapid number naming for concussion detection: Meta-analysis and systematic review of the literature',
    journal: 'Concussion, 1(2)',
    doi: '10.2217/cnc.15.8',
    category: 'Return to Activity'
  },
]

const categories = [
  { id: 'all', label: 'All References', count: references.length },
  { id: 'Pathophysiology', label: 'Pathophysiology & Mechanisms', count: references.filter(r => r.category === 'Pathophysiology').length },
  { id: 'Assessment', label: 'Assessment & Diagnosis', count: references.filter(r => r.category === 'Assessment').length },
  { id: 'PPCS & Phenotypes', label: 'Persistent Post-Concussive Symptoms', count: references.filter(r => r.category === 'PPCS & Phenotypes').length },
  { id: 'Autonomic', label: 'Autonomic Dysfunction', count: references.filter(r => r.category === 'Autonomic').length },
  { id: 'Sleep & Circadian', label: 'Sleep & Circadian', count: references.filter(r => r.category === 'Sleep & Circadian').length },
  { id: 'CSF & Glymphatic', label: 'CSF & Glymphatic', count: references.filter(r => r.category === 'CSF & Glymphatic').length },
  { id: 'Imaging', label: 'Neuroimaging', count: references.filter(r => r.category === 'Imaging').length },
  { id: 'Biomarkers', label: 'Biomarkers', count: references.filter(r => r.category === 'Biomarkers').length },
  { id: 'CTE', label: 'Chronic Traumatic Encephalopathy', count: references.filter(r => r.category === 'CTE').length },
  { id: 'Vestibular & Oculomotor', label: 'Vestibular & Oculomotor', count: references.filter(r => r.category === 'Vestibular & Oculomotor').length },
  { id: 'Cervicogenic', label: 'Cervicogenic & Musculoskeletal', count: references.filter(r => r.category === 'Cervicogenic').length },
  { id: 'Treatment', label: 'Treatment & Rehabilitation', count: references.filter(r => r.category === 'Treatment').length },
  { id: 'EEG & Neurophysiology', label: 'EEG & Neurophysiology', count: references.filter(r => r.category === 'EEG & Neurophysiology').length },
  { id: 'Nutrition', label: 'Nutrition & Supplementation', count: references.filter(r => r.category === 'Nutrition').length },
  { id: 'Return to Activity', label: 'Return to Activity', count: references.filter(r => r.category === 'Return to Activity').length },
]

interface ReferenceRepositoryProps {
  accessLevel: 'online-only' | 'full-course' | null
  loading: boolean
}

export function ReferenceRepository({ accessLevel, loading }: ReferenceRepositoryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredReferences = references.filter(ref => {
    const matchesCategory = selectedCategory === 'all' || ref.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      ref.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.authors.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ref.journal.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Track search when user types
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length > 2) {
      trackSearch(query, filteredReferences.length)
    }
  }

  // Both online-only and full-course users have access
  const hasAccess = !!accessLevel

  return (
    <div className="glass rounded-2xl p-6 relative overflow-hidden">
      {/* Lock overlay for unauthenticated users */}
      {!hasAccess && !loading && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Reference Repository Locked
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Access <strong className="text-slate-900">135+ evidence-based references</strong> from leading journals and researchers. Available exclusively to course enrollees.
            </p>
            <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-4 border-2 border-teal-200">
              <Award className="w-8 h-8 text-teal-600 mx-auto mb-2" />
              <p className="text-xs text-teal-900 font-semibold">
                Premium Resource - Enroll to Unlock
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reference Repository</h2>
            <p className="text-sm text-slate-600">135+ evidence-based research articles</p>
          </div>
        </div>
      </div>

      {/* Online-only users - upgrade to full course */}
      {accessLevel === 'online-only' && (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Upgrade to Full Course + Practical Skills Training
              </h3>
              <p className="text-sm text-slate-700 mb-4">
                You have full access to all online modules and research references. Upgrade to include the full-day hands-on workshop to earn your complete 14 AHPRA CPD certificate (8 online + 6 in-person).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={CONFIG.SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackShopClick('references-online-only-upgrade', { accessLevel: 'online-only' })}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-teal-700 transition-all text-center"
                >
                  Upgrade Now - Add Workshop for $693
                </a>
                <a
                  href="/in-person"
                  onClick={() => trackEvent('view_workshop_details', { source: 'references-upgrade-banner' })}
                  className="px-4 py-2 border-2 border-blue-300 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-all text-center"
                >
                  View Workshop Details
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by author, title, or journal..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-sm"
            disabled={!hasAccess}
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            disabled={!hasAccess}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {cat.label} <span className="ml-1 opacity-75">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* References List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {filteredReferences.map((ref) => (
          <div
            key={ref.id}
            className="bg-white rounded-xl p-5 border-2 border-slate-200 hover:border-teal-300 transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-teal-600 uppercase tracking-wide bg-teal-50 px-2 py-1 rounded">
                    {ref.category}
                  </span>
                  <span className="text-xs text-slate-500">{ref.year}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base mb-2 leading-snug group-hover:text-teal-700 transition-colors">
                  {ref.title}
                </h3>

                <p className="text-sm text-slate-600 mb-1">{ref.authors}</p>
                <p className="text-sm text-slate-500 italic">{ref.journal}</p>
              </div>

              {(ref.doi || ref.url) && (
                <a
                  href={ref.doi ? `https://doi.org/${ref.doi}` : ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('reference_view', { referenceId: ref.id, title: ref.title, category: ref.category })}
                  className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 hover:bg-teal-100 flex items-center justify-center transition-colors group-hover:bg-teal-100"
                >
                  <ExternalLink className="w-5 h-5 text-slate-600 group-hover:text-teal-600" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredReferences.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No references found matching your search</p>
        </div>
      )}
    </div>
  )
}
