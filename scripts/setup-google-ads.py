#!/usr/bin/env python3
"""
ConcussionPro Google Ads — Complete API Setup
6 Campaigns · 10 Ad Groups · 20+ Ads · Extensions · Shared Negatives

Everything created in PAUSED state.

Build order:
1. Shared negative keyword list
2. Campaigns
3. Ad groups
4. Keywords per ad group
5. RSA ads
6. Display ads (responsive display)
7. Account-level extensions (sitelinks, callouts, structured snippets, promotion)

Usage:
  pip install google-ads
  python scripts/setup-google-ads.py

Requires google-ads.yaml in project root or env vars:
  GOOGLE_ADS_DEVELOPER_TOKEN
  GOOGLE_ADS_CLIENT_ID
  GOOGLE_ADS_CLIENT_SECRET
  GOOGLE_ADS_REFRESH_TOKEN
  GOOGLE_ADS_CUSTOMER_ID
  GOOGLE_ADS_LOGIN_CUSTOMER_ID  (MCC account, if applicable)
"""

import os
import sys
import traceback
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# ─── Configuration ───────────────────────────────────────────────────────────

CUSTOMER_ID = os.environ.get("GOOGLE_ADS_CUSTOMER_ID", "").replace("-", "")
PORTAL_URL = "https://portal.concussion-education-australia.com"

# ─── Data Definitions ────────────────────────────────────────────────────────

GLOBAL_NEGATIVES = [
    # Consumer / Patient Intent
    "patient", "symptoms", "my concussion", "do i have a concussion",
    "concussion treatment", "concussion cure", "concussion therapy",
    "headache relief", "brain injury", "brain fog", "memory loss",
    "concussion recovery tips", "how long does concussion last",
    # Medical / Legal
    "lawsuit", "compensation", "legal claim", "brain injury claim",
    "NDIS", "insurance claim", "medicolegal", "negligence",
    # Wrong Academic Qualification
    "university degree", "bachelor", "masters", "postgraduate",
    "phd", "medical school", "nursing degree",
    # Consumer Sport / News
    "NRL concussion news", "AFL concussion controversy", "CTE",
    "chronic traumatic", "NFL concussion", "concussion in sport news",
    # Wrong Product
    "helmet", "mouthguard", "mouth guard", "first aid course",
    "first aid certificate", "coaching course", "volunteer",
    # Career / Employment
    "job", "salary", "career", "hire", "employment", "work as", "become a physio",
]

CAMPAIGNS = [
    {
        "name": "CEA — Preseason Sports Clinic Acquisition",
        "type": "SEARCH",
        "budget_micros": 15_000_000,  # $15/day = ~$450/mo
        "ad_groups": [
            {
                "name": "1A — Preseason Baseline Testing",
                "final_url": f"{PORTAL_URL}/preseason",
                "cpc_micros": 7_000_000,  # $7 max CPC
                "local_negatives": [
                    "concussion treatment", "concussion news", "injury compensation",
                    "children concussion", "kid concussion", "parent concussion",
                ],
                "keywords": [
                    {"text": "preseason concussion baseline testing", "match": "EXACT"},
                    {"text": "concussion baseline test athletes", "match": "EXACT"},
                    {"text": "athlete concussion baseline screening", "match": "EXACT"},
                    {"text": "SCAT6 baseline testing sports club", "match": "EXACT"},
                    {"text": "preseason concussion screening australia", "match": "EXACT"},
                    {"text": "sports concussion baseline protocol", "match": "EXACT"},
                    {"text": "preseason concussion assessment tool", "match": "EXACT"},
                    {"text": "concussion baseline athletes clinic", "match": "PHRASE"},
                    {"text": "SCAT6 baseline sports", "match": "PHRASE"},
                    {"text": "preseason SCAT6 testing", "match": "PHRASE"},
                ],
                "ads": [
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/preseason",
                        "path1": "preseason",
                        "path2": "register",
                        "headlines": [
                            "Free Preseason SCAT6 Baseline",
                            "Athletes Self-Test Remotely",
                            "PDF Report Sent to Your Clinic",
                            "No Appointment Needed",
                            "Free for Sports Clinics",
                            "AFL · NRL · Rugby Ready",
                            "Register Clinic in 30 Seconds",
                            "5-Min Athlete Self-Assessment",
                            "Know Each Athlete's Baseline",
                            "Full SCAT6 PDF Per Athlete",
                            "Endorsed by Osteopathy Aust",
                            "Collect Baselines Before Contact",
                            "Preseason Ready — Start Now",
                            "Share One Link — Collect Data",
                            "ConcussionPro Baseline Tool",
                        ],
                        "descriptions": [
                            "Register your clinic free. Athletes complete the SCAT6 baseline on their phone in 5 minutes. Full PDF report emailed to you.",
                            "AFL, NRL and rugby preseason is here. Know every athlete's normal before contact starts. No appointments. No data stored.",
                            "Stop chasing athletes into the clinic for baselines. Share a unique link — they complete it on any device. You get the data.",
                            "Used by Australian sports clinics this season. Free forever. Back it up with 14 AHPRA CPD hours in concussion management.",
                        ],
                        "pin_h1": True,
                    },
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/preseason",
                        "path1": "baseline",
                        "path2": "athletes",
                        "headlines": [
                            "SCAT6 Baseline Tool — Free Clinics",
                            "Athletes Complete Test on Any Device",
                            "Preseason Starts — Are You Ready?",
                            "No Clinic Visit Required",
                            "Protect Athletes This Season",
                            "Rugby · AFL · NRL · Football Ready",
                            "Instant Clinic Registration",
                            "Athletes Self-Complete SCAT6",
                            "Baseline Before First Contact",
                            "Full SCAT6 Report — Free",
                            "ConcussionPro — Free for Clinics",
                            "Catch What Norms Can't",
                            "Individual Baseline = Better Care",
                            "SCAT6 Baseline in 5 Minutes",
                            "Register Now — Season Is Live",
                        ],
                        "descriptions": [
                            "Without a baseline, you're comparing a concussed athlete to population norms — not their own normal. Fix that in 30 seconds.",
                            "Share your clinic's unique link with sports clubs. Athletes complete SCAT6 baseline remotely. You receive a full PDF per athlete.",
                            "Preseason is the only time to collect a true baseline. Once contact starts, the window is gone. Register your clinic now — free.",
                            "Endorsed by Osteopathy Australia. Covers all SCAT6 cognitive sections. Clinical PDF report emailed to your clinic for every athlete.",
                        ],
                    },
                ],
            },
            {
                "name": "1B — Sports Clinic / Practice Owner Intent",
                "final_url": f"{PORTAL_URL}/preseason",
                "cpc_micros": 10_000_000,  # $10 max CPC
                "local_negatives": [],
                "keywords": [
                    {"text": "concussion management sports clinic australia", "match": "EXACT"},
                    {"text": "sports physio concussion assessment tool", "match": "EXACT"},
                    {"text": "sports medicine clinic concussion protocol", "match": "EXACT"},
                    {"text": "concussion protocol AFL club", "match": "EXACT"},
                    {"text": "concussion protocol NRL club", "match": "EXACT"},
                    {"text": "sports clinic SCAT6 assessment", "match": "PHRASE"},
                    {"text": "concussion baseline physiotherapy", "match": "PHRASE"},
                    {"text": "sports medicine concussion baseline", "match": "PHRASE"},
                    {"text": "head physio concussion screening tool", "match": "EXACT"},
                ],
                "ads": [
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/preseason",
                        "path1": "sports",
                        "path2": "baseline",
                        "headlines": [
                            "Concussion Baseline for Sports Clinics",
                            "Athletes Self-Test — No Appointment",
                            "Clinic Registers Free | AFL · NRL",
                            "Your Unique Link → Athlete Reports",
                            "SCAT6 Baselines Without the Chasing",
                            "Free Tool for Physios & Osteopaths",
                            "Endorsed by Osteopathy Australia",
                            "One Link → Full Team Baseline Data",
                            "PDF Baseline Report Per Athlete",
                            "No Data Stored — Privacy First",
                            "Used by Clinics Across Australia",
                            "Register Clinic in 30 Seconds",
                            "Back It With 14 AHPRA CPD Hours",
                            "ConcussionPro — Trusted by Clinics",
                            "Preseason Protocol Starts Here",
                        ],
                        "descriptions": [
                            "Give every athlete a SCAT6 baseline without a single clinic appointment. Share your unique link — athletes complete it on their phone. You get the PDF.",
                            "Australian sports clinics are using ConcussionPro to baseline entire football squads this preseason. Register your clinic free — takes 30 seconds.",
                            "Free preseason baseline tool. Then when an athlete gets concussed, you have their individual normal to compare. Know exactly what's changed.",
                            "Baseline tool is free. Back it up with our full 14 CPD hr concussion management course — SCAT6, VOMS, BESS, return-to-play. Endorsed by Osteopathy AU.",
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "CEA — Concussion Course Purchase Intent",
        "type": "SEARCH",
        "budget_micros": 20_000_000,  # $20/day = ~$600/mo
        "local_campaign_negatives": ["free"],
        "ad_groups": [
            {
                "name": "2A — Concussion Management Course Direct",
                "final_url": f"{PORTAL_URL}/pricing",
                "cpc_micros": 10_000_000,
                "local_negatives": ["free", "symptoms", "treatment", "patient"],
                "keywords": [
                    {"text": "concussion management course online", "match": "EXACT"},
                    {"text": "concussion management course australia", "match": "EXACT"},
                    {"text": "concussion course for physiotherapists", "match": "EXACT"},
                    {"text": "concussion course for osteopaths", "match": "EXACT"},
                    {"text": "concussion assessment course australia", "match": "EXACT"},
                    {"text": "concussion clinical training online", "match": "EXACT"},
                    {"text": "concussion management course CPD", "match": "PHRASE"},
                    {"text": "concussion clinical training online australia", "match": "PHRASE"},
                    {"text": "concussion course online australia", "match": "PHRASE"},
                ],
                "ads": [
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "path1": "concussion",
                        "path2": "course",
                        "headlines": [
                            "Concussion Management Course Online",
                            "14 CPD Points — AHPRA Aligned",
                            "SCAT6 · VOMS · BESS Protocols",
                            "Endorsed by Osteopathy Australia",
                            "Online Course + Practical Workshop",
                            "Evidence-Based | Start Today",
                            "8 Online Modules | From $497",
                            "500+ Australian Clinicians Trained",
                            "7-Day Satisfaction Guarantee",
                            "Lifetime Access | Self-Paced",
                            "Paediatric Protocols Included",
                            "Tax-Deductible CPD",
                            "AHPRA Certificate on Completion",
                            "Physios · Osteos · Sports Med",
                            "ConcussionPro — Australia's Best",
                        ],
                        "descriptions": [
                            "Evidence-based concussion assessment and management. 8 modules — SCAT6, VOMS, BESS, cervicogenic screening and return-to-play. AHPRA certificate included.",
                            "Australia's only concussion CPD covering VOMS, BESS and cervicogenic differentiation. Skills that separate confident clinicians from uncertain ones. From $497.",
                            "14 AHPRA CPD hours. 8 self-paced online modules + optional full-day practical workshop. Lifetime access. Endorsed by Osteopathy Australia. 7-day guarantee.",
                            "Built by clinicians for clinicians. Includes SCAT6 & SCOAT6 auto-scoring forms, referral templates, return-to-play flowcharts. Tax-deductible. Enrol today.",
                        ],
                    },
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "path1": "CPD",
                        "path2": "enrol",
                        "headlines": [
                            "Master Concussion Assessment",
                            "8 CPD Points | Online | Self-Paced",
                            "VOMS · BESS · Return-to-Play",
                            "500+ Clinicians Trained",
                            "Most Comprehensive Concussion CPD",
                            "Endorsed Osteopathy Australia",
                            "Start Today | From $497",
                            "7-Day Satisfaction Guarantee",
                            "Paediatric & Adult Protocols",
                            "Lifetime Course Access",
                            "AHPRA CPD Certificate",
                            "Cervicogenic Differentiation",
                            "Tax-Deductible | Reimbursable",
                            "Physio · Osteo · Allied Health",
                            "130+ Evidence-Based References",
                        ],
                        "descriptions": [
                            "'Best concussion training I've done.' Used by physios, osteopaths and sports medicine GPs across Australia. 8 modules. Lifetime access. 7-day guarantee.",
                            "Most CPD covers theory. ConcussionPro trains clinical skills — VOMS testing, BESS scoring, cervicogenic assessment. The assessments that change outcomes.",
                            "SCAT6, Child SCAT6, SCOAT6, VOMS, BESS protocols. Adult and paediatric frameworks. Return-to-play and return-to-learn pathways. All in one course.",
                            "Endorsed by Osteopathy Australia. 14 AHPRA CPD hours (8 online + 6 practical). Tax-deductible. 7-day satisfaction guarantee. Enrol at any time.",
                        ],
                    },
                ],
            },
            {
                "name": "2B — SCAT6 Course Purchase Intent",
                "final_url": f"{PORTAL_URL}/pricing",
                "cpc_micros": 9_000_000,
                "local_negatives": ["free", "download", "form", "template", "PDF only"],
                "keywords": [
                    {"text": "SCAT6 training course online", "match": "EXACT"},
                    {"text": "SCAT6 training for physiotherapists", "match": "EXACT"},
                    {"text": "SCAT6 training for osteopaths", "match": "EXACT"},
                    {"text": "SCOAT6 training course", "match": "EXACT"},
                    {"text": "SCAT6 course australia", "match": "EXACT"},
                    {"text": "SCAT6 administration training course", "match": "PHRASE"},
                    {"text": "SCAT6 certification australia", "match": "PHRASE"},
                    {"text": "SCAT6 scoring training", "match": "PHRASE"},
                    {"text": "SCAT6 training for clinicians", "match": "EXACT"},
                ],
                "ads": [
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "path1": "SCAT6",
                        "path2": "course",
                        "headlines": [
                            "SCAT6 Clinical Training Course",
                            "Earn 14 AHPRA CPD Points",
                            "Admin · Scoring · Interpretation",
                            "SCAT6 & Child SCAT6 Covered",
                            "Endorsed by Osteopathy Aust",
                            "From $497 | Start Today",
                            "Online + Optional Workshop Day",
                            "Auto-Scoring Forms Included",
                            "500+ Australian Clinicians",
                            "AHPRA Certificate Included",
                            "Red Flags · Medicolegal Docs",
                            "SCOAT6 Also Covered",
                            "Lifetime Access | Self-Paced",
                            "7-Day Satisfaction Guarantee",
                            "ConcussionPro — Trusted Course",
                        ],
                        "descriptions": [
                            "Master SCAT6 and Child SCAT6 — every section, every scoring rule, every red flag. Includes SCOAT6, mBESS and auto-scoring fillable forms. AHPRA CPD certificate.",
                            "Step-by-step SCAT6 administration, cognitive screening, balance testing and medicolegal documentation. Built for physios, osteos and sports medicine clinicians.",
                            "8 online modules covering SCAT6, SCOAT6, VOMS, BESS, cervicogenic differentiation and return-to-play. 14 CPD points total. Online from $497.",
                            "Australia's most comprehensive SCAT6 training. Endorsed by Osteopathy Australia. Includes clinical toolkit. 500+ clinicians trained. 7-day guarantee.",
                        ],
                    },
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "path1": "SCAT6",
                        "path2": "enrol",
                        "headlines": [
                            "Administer SCAT6 With Confidence",
                            "SCAT6 & SCOAT6 | Online Course",
                            "14 CPD Points | AHPRA Aligned",
                            "Every Section — Step by Step",
                            "Sideline to Clinic Protocols",
                            "From $497 | Lifetime Access",
                            "Endorsed Osteopathy Australia",
                            "Red Flags · Scoring · Referral",
                            "500+ Clinicians Trust This Course",
                            "7-Day Guarantee | Enrol Now",
                            "Paediatric SCAT6 Included",
                            "VOMS · BESS Also Covered",
                            "Tax-Deductible CPD Investment",
                            "Start Free — Upgrade Anytime",
                            "ConcussionPro Concussion Course",
                        ],
                        "descriptions": [
                            "Know exactly what to do the next time an athlete walks off with a suspected concussion. SCAT6 training built for real clinical situations. From $497.",
                            "Acute sideline assessment, clinic follow-up, return-to-play decisions — every stage trained. SCAT6, SCOAT6, red flags, medicolegal documentation included.",
                            "Learn to administer, score and interpret SCAT6 and Child SCAT6. Cognitive screening, balance testing, symptom grading. Auto-scoring forms included.",
                            "Free 2-hour SCAT6 module available — no card required. Or enrol in full 8-module course from $497. 14 AHPRA CPD points. Endorsed by Osteopathy Australia.",
                        ],
                    },
                ],
            },
            {
                "name": "2C — CPD Hours / AHPRA Deadline Intent",
                "final_url": f"{PORTAL_URL}/pricing",
                "cpc_micros": 9_000_000,
                "local_negatives": [],
                "keywords": [
                    {"text": "physiotherapy CPD course online australia", "match": "EXACT"},
                    {"text": "osteopathy CPD online", "match": "EXACT"},
                    {"text": "allied health CPD course online", "match": "EXACT"},
                    {"text": "AHPRA CPD hours online", "match": "EXACT"},
                    {"text": "CPD points online course healthcare australia", "match": "EXACT"},
                    {"text": "CPD hours online concussion", "match": "PHRASE"},
                    {"text": "CPD points physiotherapy 2026", "match": "PHRASE"},
                    {"text": "continuing professional development concussion", "match": "PHRASE"},
                    {"text": "exercise physiologist CPD online", "match": "EXACT"},
                    {"text": "sports physiotherapist CPD course", "match": "EXACT"},
                ],
                "ads": [
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "path1": "CPD",
                        "path2": "ahpra",
                        "headlines": [
                            "Need CPD Hours Before Nov 30?",
                            "Earn 14 AHPRA CPD Points Online",
                            "Concussion Clinical Training",
                            "Self-Paced — Finish This Week",
                            "Certificate on Completion",
                            "From $497 | 7-Day Guarantee",
                            "Endorsed Osteopathy Australia",
                            "Physio · Osteo · Allied Health",
                            "8 Clinical Modules Online",
                            "Complete in Days Not Weeks",
                            "SCAT6 · VOMS · BESS Training",
                            "Tax-Deductible CPD",
                            "Lifetime Access After Enrol",
                            "500+ Clinicians Trained",
                            "AHPRA Renewal CPD — Enrol Now",
                        ],
                        "descriptions": [
                            "AHPRA-aligned CPD certificate on completion. 8 clinical modules — SCAT6, VOMS, BESS and return-to-play. Self-paced. Start today and finish before renewal deadline.",
                            "Physio and osteo AHPRA renewals due November 30. 14 CPD points available online + optional practical workshop. Complete at your own pace from $497.",
                            "Don't rush through generic CPD. Concussion management is clinically relevant, practically applicable, and earns 14 AHPRA-aligned hours. From $497.",
                            "Endorsed by Osteopathy Australia. Self-paced — complete in your own time. Lifetime access so you can revisit protocols. 7-day satisfaction guarantee.",
                        ],
                    },
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "path1": "CPD",
                        "path2": "online",
                        "headlines": [
                            "Earn 14 AHPRA CPD Points Online",
                            "Concussion Assessment Training",
                            "SCAT6 · VOMS · BESS Protocols",
                            "AHPRA Certificate | Self-Paced",
                            "Endorsed Osteopathy Australia",
                            "Physio · Osteo · Allied Health",
                            "From $497 | Lifetime Access",
                            "500+ Australian Clinicians",
                            "Tax-Deductible CPD",
                            "8 Online Modules + Workshop",
                            "7-Day Satisfaction Guarantee",
                            "Evidence-Based | 130+ Refs",
                            "Complete Anytime | Start Now",
                            "Paediatric Protocols Included",
                            "Relevant CPD You'll Actually Use",
                        ],
                        "descriptions": [
                            "Practical concussion assessment and management training. Evidence-based across 8 online modules. AHPRA CPD certificate on completion. From $497. Start anytime.",
                            "The CPD that improves your clinical practice. SCAT6, VOMS, BESS — skills with direct patient impact. Endorsed by Osteopathy Australia. Online + optional practical.",
                            "14 AHPRA CPD hours available. 8 online modules covering concussion assessment, management, paediatric protocols and return-to-play. Tax-deductible. From $497.",
                            "Learn evidence-based concussion management from clinicians who specialise in it. Self-paced, lifetime access, AHPRA certificate. Endorsed by Osteopathy Australia.",
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "CEA — SCAT6 Free Lead Capture",
        "type": "SEARCH",
        "budget_micros": 8_000_000,  # $8/day = ~$250/mo
        "ad_groups": [
            {
                "name": "3 — SCAT6 Free Lead Capture",
                "final_url": f"{PORTAL_URL}/scat-mastery",
                "cpc_micros": 5_000_000,
                "local_negatives": ["purchase", "enrol", "register", "$497", "cost", "nursing", "dental", "pharmacy"],
                "keywords": [
                    {"text": "free SCAT6 training online", "match": "EXACT"},
                    {"text": "SCAT6 form download australia", "match": "EXACT"},
                    {"text": "SCAT6 assessment tool training", "match": "EXACT"},
                    {"text": "concussion assessment training free", "match": "EXACT"},
                    {"text": "free concussion CPD course", "match": "EXACT"},
                    {"text": "SCAT6 mastery online", "match": "PHRASE"},
                    {"text": "SCAT6 forms australia", "match": "PHRASE"},
                    {"text": "free concussion training CPD", "match": "PHRASE"},
                    {"text": "SCAT6 course free", "match": "PHRASE"},
                ],
                "ads": [
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/scat-mastery",
                        "path1": "SCAT6",
                        "path2": "free",
                        "headlines": [
                            "Free SCAT6 Clinical Training",
                            "2 AHPRA CPD Points Included",
                            "SCAT6 & SCOAT6 — Step by Step",
                            "Free Certificate | No Credit Card",
                            "2-Hour Self-Paced Module",
                            "Red Flags & Admin Protocol",
                            "Auto-Scoring Forms Included",
                            "500+ Clinicians Trained Free",
                            "Then Upgrade to Full Course",
                            "12 More CPD Points — From $497",
                            "Endorsed Osteopathy Australia",
                            "Start Now — No Card Required",
                            "Immediate Access on Signup",
                            "ConcussionPro Free Module",
                            "Used Across Australia",
                        ],
                        "descriptions": [
                            "Master SCAT6 and SCOAT6 administration in 2 hours. Step-by-step protocols, red flag recognition, auto-scoring forms, medicolegal documentation. Free with CPD cert.",
                            "Used by 500+ Australian clinicians. Complete free — then unlock all 8 modules including VOMS, BESS and return-to-play. 12 more AHPRA CPD points from $497.",
                            "Immediate access — no credit card, no commitment. 2 AHPRA CPD points with certificate. Upgrade to full clinical training course anytime. Endorsed by Osteopathy AU.",
                            "Free SCAT6 module includes auto-scoring fillable SCAT6, Child SCAT6 and SCOAT6 forms. Clinical toolkit. Red flag identification. Certificate of completion.",
                        ],
                    },
                    {
                        "type": "RSA",
                        "final_url": f"{PORTAL_URL}/scat-mastery",
                        "path1": "SCAT6",
                        "path2": "forms",
                        "headlines": [
                            "Free SCAT6 & SCOAT6 Forms",
                            "Auto-Scoring Fillable PDFs",
                            "2 CPD Points + Training Included",
                            "SCAT6 · Child SCAT6 · SCOAT6",
                            "Free | No Credit Card Required",
                            "Endorsed by Osteopathy Aust",
                            "2-Hour Clinical Module Included",
                            "Download + Learn in One Step",
                            "Medicolegal Documentation",
                            "mBESS Form Also Included",
                            "Instant Access on Signup",
                            "Upgrade for 12 More CPD Points",
                            "AHPRA Certificate Free",
                            "Used by 500+ Clinicians",
                            "ConcussionPro Starter Module",
                        ],
                        "descriptions": [
                            "Download auto-scoring SCAT6, Child SCAT6, SCOAT6 and mBESS forms — 2025 versions. Includes free 2-hour clinical training module with AHPRA CPD certificate.",
                            "Not just forms — a complete free module. SCAT6 administration, red flag identification, scoring and medicolegal documentation. 2 AHPRA CPD points. No card required.",
                            "Free starter module includes all auto-scoring forms + 2 AHPRA CPD points. Upgrade to full course for 12 more CPD hours — VOMS, BESS, return-to-play. From $497.",
                            "Endorsed by Osteopathy Australia. Trusted by 500+ Australian clinicians. Free access, instant download. Upgrade anytime to full concussion management course.",
                        ],
                    },
                ],
            },
        ],
    },
    {
        "name": "CEA — Retargeting Free & Warm Users",
        "type": "DISPLAY",
        "budget_micros": 5_000_000,  # $5/day = ~$150/mo
        "ad_groups": [
            {
                "name": "4A — Free Users Not Upgraded",
                "final_url": f"{PORTAL_URL}/pricing",
                "cpc_micros": 2_000_000,
                "local_negatives": [],
                "keywords": [],
                "ads": [
                    {
                        "type": "DISPLAY",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "short_headlines": [
                            "Ready to Go Beyond SCAT6 Basics?",
                            "Unlock VOMS, BESS & 12 More CPDs",
                            "Full Clinical Training — From $497",
                            "Upgrade Your Concussion Skills",
                            "12 More CPD Points Waiting for You",
                        ],
                        "long_headline": "You've Completed the Free Module. Unlock VOMS, BESS and Return-to-Play — 12 CPD Points from $497",
                        "descriptions": [
                            "Complete clinical concussion management. All 8 modules. AHPRA certificate. 7-day guarantee. From $497.",
                            "You've done the intro. Now master VOMS testing, BESS scoring, paediatric protocols and return-to-play decisions.",
                        ],
                        "business_name": "ConcussionPro",
                    },
                ],
            },
            {
                "name": "4B — Preseason Registrants Not on Course",
                "final_url": f"{PORTAL_URL}/scat-mastery",
                "cpc_micros": 2_000_000,
                "local_negatives": [],
                "keywords": [],
                "ads": [
                    {
                        "type": "DISPLAY",
                        "final_url": f"{PORTAL_URL}/scat-mastery",
                        "short_headlines": [
                            "You Have the Baselines — Now Use Them",
                            "Know What to Do When They Get Hurt",
                            "Free Preseason Tool Registered",
                            "Step 2: Learn the Full Assessment",
                            "SCAT6 Mastery — Free to Start",
                        ],
                        "long_headline": "Baseline Collected. Now What? Learn to Interpret SCAT6 Results, VOMS & Return-to-Play — Free Module First",
                        "descriptions": [
                            "You've registered your clinic for preseason baselines. Complete the clinical picture — free SCAT6 training module, then full CPD course from $497.",
                            "Collecting baselines is step one. Step two is knowing exactly what to do when an athlete gets concussed. Start with the free module — no card needed.",
                        ],
                        "business_name": "ConcussionPro",
                    },
                ],
            },
            {
                "name": "4C — Course Previewers Not Enrolled",
                "final_url": f"{PORTAL_URL}/pricing",
                "cpc_micros": 2_000_000,
                "local_negatives": [],
                "keywords": [],
                "ads": [
                    {
                        "type": "DISPLAY",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "short_headlines": [
                            "You've Seen the Modules — Enrol Now",
                            "14 CPD Points | 7-Day Guarantee",
                            "Lifetime Access | Start Today",
                            "From $497 | AHPRA Certificate",
                            "500+ Clinicians Already Enrolled",
                        ],
                        "long_headline": "You've Previewed the Course. Master SCAT6, VOMS, BESS and Return-to-Play — 14 AHPRA CPD Points from $497",
                        "descriptions": [
                            "Ready to enrol? 14 AHPRA CPD hours. 8 online modules + optional practical workshop. 7-day guarantee. From $497. Endorsed by Osteopathy Australia.",
                            "500+ Australian clinicians trained. Lifetime access. Auto-scoring SCAT6 forms. Clinical toolkit. Tax-deductible. Enrol today and start immediately.",
                        ],
                        "business_name": "ConcussionPro",
                    },
                ],
            },
        ],
    },
    {
        "name": "CEA — Retargeting Pricing Abandoners",
        "type": "DISPLAY",
        "budget_micros": 2_000_000,  # ~$2/day = ~$50/mo
        "ad_groups": [
            {
                "name": "5 — Pricing Page Abandoners",
                "final_url": f"{PORTAL_URL}/pricing",
                "cpc_micros": 3_000_000,
                "local_negatives": [],
                "keywords": [],
                "ads": [
                    {
                        "type": "DISPLAY",
                        "final_url": f"{PORTAL_URL}/pricing",
                        "short_headlines": [
                            "Still Thinking About It? Here's Why",
                            "500+ Clinicians Made This Choice",
                            "7-Day Guarantee — Zero Risk Enrol",
                            "Best Concussion Training — From $497",
                            "14 CPD Points. Lifetime Access.",
                        ],
                        "long_headline": "'Best concussion training I've done.' AHPRA-aligned. 7-day satisfaction guarantee. Endorsed by Osteopathy Australia. From $497.",
                        "descriptions": [
                            "8 online modules. SCAT6, VOMS, BESS, return-to-play. Lifetime access. AHPRA certificate. Endorsed by Osteopathy Australia. 7-day guarantee. Nothing to lose.",
                            "Tax-deductible CPD. 500+ Australian clinicians trained. The course with the assessments competitors don't teach. Enrol today — access starts immediately.",
                        ],
                        "business_name": "ConcussionPro",
                    },
                ],
            },
        ],
    },
    {
        "name": "CEA — Upsell Online Buyers to Full Bundle",
        "type": "DISPLAY",
        "budget_micros": 2_000_000,  # ~$2/day
        "ad_groups": [
            {
                "name": "6 — Online Course → Workshop Upsell",
                "final_url": f"{PORTAL_URL}/in-person",
                "cpc_micros": 3_000_000,
                "local_negatives": [],
                "keywords": [],
                "ads": [
                    {
                        "type": "DISPLAY",
                        "final_url": f"{PORTAL_URL}/in-person",
                        "short_headlines": [
                            "Course Enrolled — Add the Workshop",
                            "Hands-On SCAT6 · VOMS · BESS Day",
                            "6 More CPD Points | 14 Total",
                            "Theory + Practice = Full Competence",
                            "Jun-Aug 2026 | Syd · Melb · Byron",
                        ],
                        "long_headline": "You've Done the Theory. Now Practice SCAT6, VOMS and BESS With Expert Feedback — 6 More CPD Points, 14 Total.",
                        "descriptions": [
                            "Add the full-day practical workshop. Supervised SCAT6, VOMS, BESS and cervicogenic assessment with live feedback. Max 12 per group. Sydney, Melbourne & Byron Bay.",
                            "Theory alone won't build clinical confidence. The workshop is where assessment skills become instinct. Includes case simulations, printed workbook, all equipment.",
                        ],
                        "business_name": "ConcussionPro",
                    },
                    {
                        "type": "DISPLAY",
                        "final_url": f"{PORTAL_URL}/in-person",
                        "short_headlines": [
                            "Workshop Spots Filling — Jul 2026",
                            "Max 12 Clinicians Per Session",
                            "Add Practical Day to Your Course",
                            "Sydney · Melbourne · Byron Bay",
                            "6 CPD Points | Hands-On Training",
                        ],
                        "long_headline": "Limited to 12 Clinicians. Hands-On SCAT6, VOMS & BESS Training With Expert Feedback. Jun-Aug 2026 — Sydney, Melbourne, Byron Bay.",
                        "descriptions": [
                            "Small group, supervised practice. SCAT6, Child SCAT6, VOMS, BESS, cervicogenic assessment — all hands-on with live feedback and case simulations. 6 CPD points.",
                            "Complete your concussion training. 8 online modules done — add the practical day for 14 AHPRA CPD hours total. Locations: Sydney, Melbourne, Byron Bay.",
                        ],
                        "business_name": "ConcussionPro",
                    },
                ],
            },
        ],
    },
]

SITELINKS = [
    {"text": "Free Preseason Baseline", "url": f"{PORTAL_URL}/preseason",
     "desc1": "Athletes self-complete SCAT6 remotely", "desc2": "Free for sports clinics — instant PDF"},
    {"text": "Free SCAT6 Training", "url": f"{PORTAL_URL}/scat-mastery",
     "desc1": "2 AHPRA CPD pts — no card needed", "desc2": "Auto-scoring forms included free"},
    {"text": "Course Modules & Preview", "url": f"{PORTAL_URL}/preview",
     "desc1": "See all 8 clinical modules", "desc2": "Evidence-based concussion protocols"},
    {"text": "Hands-On Workshop", "url": f"{PORTAL_URL}/in-person",
     "desc1": "6 CPD pts · Syd · Melb · Byron Bay", "desc2": "Max 12 per group — Jun-Aug 2026"},
    {"text": "Pricing & Enrol", "url": f"{PORTAL_URL}/pricing",
     "desc1": "Online $497 · Full bundle $1,190", "desc2": "14 AHPRA CPD points total"},
    {"text": "SCAT6 & SCOAT6 Forms", "url": f"{PORTAL_URL}/scat-forms",
     "desc1": "Auto-scoring 2025 versions", "desc2": "Free download — no account needed"},
]

CALLOUTS = [
    "14 AHPRA CPD Points Available",
    "Endorsed by Osteopathy Australia",
    "7-Day Satisfaction Guarantee",
    "500+ Australian Clinicians Trained",
    "Tax-Deductible CPD",
    "Lifetime Course Access",
    "Free Preseason Baseline Tool",
    "Online + Hands-On Workshop Option",
]

STRUCTURED_SNIPPETS = [
    "SCAT6 & SCOAT6 Clinical Administration",
    "VOMS Vestibular-Ocular Assessment",
    "BESS Balance Error Scoring System",
    "Return-to-Play & Return-to-Learn",
    "Paediatric Concussion Assessment",
    "Cervicogenic Differentiation",
    "Concussion Phenotyping",
    "Medicolegal Documentation",
]


# ─── Helper Functions ────────────────────────────────────────────────────────

def create_client():
    """Create GoogleAdsClient from env vars or yaml."""
    # Try env vars first
    dev_token = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN")
    if dev_token:
        credentials = {
            "developer_token": dev_token,
            "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
            "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
            "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
            "use_proto_plus": True,
        }
        login_cid = os.environ.get("GOOGLE_ADS_LOGIN_CUSTOMER_ID", "").replace("-", "")
        if login_cid:
            credentials["login_customer_id"] = login_cid
        return GoogleAdsClient.load_from_dict(credentials)
    else:
        return GoogleAdsClient.load_from_storage("google-ads.yaml")


def ok(msg):
    print(f"  ✅ {msg}")


def fail(msg, exc=None):
    print(f"  ❌ {msg}")
    if exc:
        if isinstance(exc, GoogleAdsException):
            for error in exc.failure.errors:
                print(f"     Error: {error.message}")
                if error.location:
                    for fi in error.location.field_path_elements:
                        print(f"     Field: {fi.field_name}")
        else:
            traceback.print_exc()


# ─── Step 1: Shared Negative Keyword List ────────────────────────────────────

def create_shared_negative_list(client):
    print("\n═══ STEP 1: Shared Negative Keyword List ═══")
    sknl_service = client.get_service("SharedSetService")
    kw_service = client.get_service("SharedCriterionService")

    # Create the shared set
    op = client.get_type("SharedSetOperation")
    op.create.name = "CEA_Global_Negatives"
    op.create.type_ = client.enums.SharedSetTypeEnum.NEGATIVE_KEYWORDS

    try:
        response = sknl_service.mutate_shared_sets(customer_id=CUSTOMER_ID, operations=[op])
        shared_set_rn = response.results[0].resource_name
        ok(f"Shared set: {shared_set_rn}")
    except GoogleAdsException as ex:
        fail("Failed to create shared set", ex)
        return None

    # Add keywords to the shared set
    ops = []
    for kw in GLOBAL_NEGATIVES:
        kw_op = client.get_type("SharedCriterionOperation")
        kw_op.create.shared_set = shared_set_rn
        kw_op.create.keyword.text = kw
        kw_op.create.keyword.match_type = client.enums.KeywordMatchTypeEnum.BROAD
        ops.append(kw_op)

    try:
        response = kw_service.mutate_shared_criteria(customer_id=CUSTOMER_ID, operations=ops)
        ok(f"Added {len(response.results)} negative keywords to shared list")
    except GoogleAdsException as ex:
        fail("Failed to add negatives", ex)

    return shared_set_rn


def attach_shared_set_to_campaign(client, campaign_rn, shared_set_rn):
    """Attach a shared negative keyword list to a campaign."""
    css_service = client.get_service("CampaignSharedSetService")
    op = client.get_type("CampaignSharedSetOperation")
    op.create.campaign = campaign_rn
    op.create.shared_set = shared_set_rn
    try:
        response = css_service.mutate_campaign_shared_sets(customer_id=CUSTOMER_ID, operations=[op])
        ok(f"  Attached shared negatives to campaign")
    except GoogleAdsException as ex:
        fail("  Failed to attach shared set", ex)


# ─── Step 2: Campaigns ──────────────────────────────────────────────────────

def create_campaign(client, campaign_data):
    campaign_service = client.get_service("CampaignService")
    budget_service = client.get_service("CampaignBudgetService")

    # Create budget first
    budget_op = client.get_type("CampaignBudgetOperation")
    budget_op.create.name = f"Budget — {campaign_data['name']}"
    budget_op.create.amount_micros = campaign_data["budget_micros"]
    budget_op.create.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD

    try:
        budget_response = budget_service.mutate_campaign_budgets(
            customer_id=CUSTOMER_ID, operations=[budget_op]
        )
        budget_rn = budget_response.results[0].resource_name
        ok(f"Budget: {budget_rn}")
    except GoogleAdsException as ex:
        fail("Failed to create budget", ex)
        return None

    # Create the campaign
    camp_op = client.get_type("CampaignOperation")
    camp = camp_op.create
    camp.name = campaign_data["name"]
    camp.status = client.enums.CampaignStatusEnum.PAUSED
    camp.campaign_budget = budget_rn

    if campaign_data["type"] == "SEARCH":
        camp.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
        camp.manual_cpc.enhanced_cpc_enabled = False
        # Target Australia
        camp.geo_target_type_setting.positive_geo_target_type = (
            client.enums.PositiveGeoTargetTypeEnum.PRESENCE
        )
    elif campaign_data["type"] == "DISPLAY":
        camp.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.DISPLAY
        camp.manual_cpc.enhanced_cpc_enabled = False

    # Network settings for search — search only, no display expansion
    if campaign_data["type"] == "SEARCH":
        camp.network_settings.target_google_search = True
        camp.network_settings.target_search_network = False
        camp.network_settings.target_content_network = False

    try:
        camp_response = campaign_service.mutate_campaigns(
            customer_id=CUSTOMER_ID, operations=[camp_op]
        )
        campaign_rn = camp_response.results[0].resource_name
        ok(f"Campaign: {campaign_rn}")
        return campaign_rn
    except GoogleAdsException as ex:
        fail(f"Failed to create campaign: {campaign_data['name']}", ex)
        return None


# ─── Step 3-4: Ad Groups + Keywords ─────────────────────────────────────────

def create_ad_group(client, campaign_rn, ag_data):
    ag_service = client.get_service("AdGroupService")

    op = client.get_type("AdGroupOperation")
    ag = op.create
    ag.name = ag_data["name"]
    ag.campaign = campaign_rn
    ag.status = client.enums.AdGroupStatusEnum.PAUSED
    ag.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD
    if ag_data.get("cpc_micros"):
        ag.cpc_bid_micros = ag_data["cpc_micros"]

    try:
        response = ag_service.mutate_ad_groups(customer_id=CUSTOMER_ID, operations=[op])
        ag_rn = response.results[0].resource_name
        ok(f"Ad Group: {ag_rn}")
        return ag_rn
    except GoogleAdsException as ex:
        fail(f"Failed to create ad group: {ag_data['name']}", ex)
        return None


def create_keywords(client, ag_rn, keywords):
    if not keywords:
        return
    agc_service = client.get_service("AdGroupCriterionService")
    match_map = {
        "EXACT": client.enums.KeywordMatchTypeEnum.EXACT,
        "PHRASE": client.enums.KeywordMatchTypeEnum.PHRASE,
        "BROAD": client.enums.KeywordMatchTypeEnum.BROAD,
    }
    ops = []
    for kw in keywords:
        op = client.get_type("AdGroupCriterionOperation")
        criterion = op.create
        criterion.ad_group = ag_rn
        criterion.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
        criterion.keyword.text = kw["text"]
        criterion.keyword.match_type = match_map[kw["match"]]
        ops.append(op)

    try:
        response = agc_service.mutate_ad_group_criteria(customer_id=CUSTOMER_ID, operations=ops)
        ok(f"  Added {len(response.results)} keywords")
    except GoogleAdsException as ex:
        fail(f"  Failed to add keywords", ex)


def create_negative_keywords(client, ag_rn, negatives):
    if not negatives:
        return
    agc_service = client.get_service("AdGroupCriterionService")
    ops = []
    for kw in negatives:
        op = client.get_type("AdGroupCriterionOperation")
        criterion = op.create
        criterion.ad_group = ag_rn
        criterion.negative = True
        criterion.keyword.text = kw
        criterion.keyword.match_type = client.enums.KeywordMatchTypeEnum.BROAD
        ops.append(op)

    try:
        response = agc_service.mutate_ad_group_criteria(customer_id=CUSTOMER_ID, operations=ops)
        ok(f"  Added {len(response.results)} negative keywords (local)")
    except GoogleAdsException as ex:
        fail(f"  Failed to add negative keywords", ex)


def create_campaign_negative_keywords(client, campaign_rn, negatives):
    if not negatives:
        return
    cc_service = client.get_service("CampaignCriterionService")
    ops = []
    for kw in negatives:
        op = client.get_type("CampaignCriterionOperation")
        criterion = op.create
        criterion.campaign = campaign_rn
        criterion.negative = True
        criterion.keyword.text = kw
        criterion.keyword.match_type = client.enums.KeywordMatchTypeEnum.BROAD
        ops.append(op)

    try:
        response = cc_service.mutate_campaign_criteria(customer_id=CUSTOMER_ID, operations=ops)
        ok(f"  Added {len(response.results)} campaign-level negatives")
    except GoogleAdsException as ex:
        fail(f"  Failed to add campaign negatives", ex)


# ─── Step 5: RSA Ads ────────────────────────────────────────────────────────

def create_rsa_ad(client, ag_rn, ad_data):
    ad_service = client.get_service("AdGroupAdService")
    op = client.get_type("AdGroupAdOperation")
    ad_group_ad = op.create
    ad_group_ad.ad_group = ag_rn
    ad_group_ad.status = client.enums.AdGroupAdStatusEnum.PAUSED

    ad = ad_group_ad.ad
    ad.final_urls.append(ad_data["final_url"])

    if ad_data.get("path1"):
        ad.responsive_search_ad.path1 = ad_data["path1"]
    if ad_data.get("path2"):
        ad.responsive_search_ad.path2 = ad_data["path2"]

    for i, headline in enumerate(ad_data["headlines"][:15]):
        h = client.get_type("AdTextAsset")
        h.text = headline
        # Pin H1 to position 1 if requested
        if i == 0 and ad_data.get("pin_h1"):
            h.pinned_field = client.enums.ServedAssetFieldTypeEnum.HEADLINE_1
        ad.responsive_search_ad.headlines.append(h)

    for desc in ad_data["descriptions"][:4]:
        d = client.get_type("AdTextAsset")
        d.text = desc
        ad.responsive_search_ad.descriptions.append(d)

    try:
        response = ad_service.mutate_ad_group_ads(customer_id=CUSTOMER_ID, operations=[op])
        ok(f"  RSA Ad: {response.results[0].resource_name}")
    except GoogleAdsException as ex:
        fail(f"  Failed to create RSA ad", ex)


# ─── Step 6: Display Ads (Responsive Display) ───────────────────────────────

def create_display_ad(client, ag_rn, ad_data):
    ad_service = client.get_service("AdGroupAdService")
    op = client.get_type("AdGroupAdOperation")
    ad_group_ad = op.create
    ad_group_ad.ad_group = ag_rn
    ad_group_ad.status = client.enums.AdGroupAdStatusEnum.PAUSED

    ad = ad_group_ad.ad
    ad.final_urls.append(ad_data["final_url"])

    rda = ad.responsive_display_ad
    rda.business_name = ad_data.get("business_name", "ConcussionPro")

    for headline in ad_data["short_headlines"][:5]:
        h = client.get_type("AdTextAsset")
        h.text = headline
        rda.headlines.append(h)

    long_h = client.get_type("AdTextAsset")
    long_h.text = ad_data["long_headline"]
    rda.long_headline = long_h

    for desc in ad_data["descriptions"][:5]:
        d = client.get_type("AdTextAsset")
        d.text = desc
        rda.descriptions.append(d)

    # Note: images/logos would need to be uploaded separately via AssetService.
    # For now, Google will auto-generate from the URL.

    try:
        response = ad_service.mutate_ad_group_ads(customer_id=CUSTOMER_ID, operations=[op])
        ok(f"  Display Ad: {response.results[0].resource_name}")
    except GoogleAdsException as ex:
        fail(f"  Failed to create display ad", ex)


# ─── Step 7: Extensions ─────────────────────────────────────────────────────

def create_sitelink_extensions(client):
    print("\n═══ STEP 7a: Sitelink Extensions ═══")
    asset_service = client.get_service("AssetService")
    customer_service = client.get_service("CustomerAssetService")

    asset_rns = []
    for sl in SITELINKS:
        op = client.get_type("AssetOperation")
        asset = op.create
        asset.type_ = client.enums.AssetTypeEnum.SITELINK
        asset.sitelink_asset.link_text = sl["text"]
        asset.sitelink_asset.description1 = sl["desc1"]
        asset.sitelink_asset.description2 = sl["desc2"]
        asset.final_urls.append(sl["url"])

        try:
            response = asset_service.mutate_assets(customer_id=CUSTOMER_ID, operations=[op])
            rn = response.results[0].resource_name
            asset_rns.append(rn)
            ok(f"Sitelink asset: {sl['text']} → {rn}")
        except GoogleAdsException as ex:
            fail(f"Failed to create sitelink: {sl['text']}", ex)

    # Link to customer (account-level)
    for rn in asset_rns:
        op = client.get_type("CustomerAssetOperation")
        op.create.asset = rn
        op.create.field_type = client.enums.AssetFieldTypeEnum.SITELINK
        try:
            response = customer_service.mutate_customer_assets(customer_id=CUSTOMER_ID, operations=[op])
            ok(f"  Linked to account: {response.results[0].resource_name}")
        except GoogleAdsException as ex:
            fail(f"  Failed to link sitelink to account", ex)


def create_callout_extensions(client):
    print("\n═══ STEP 7b: Callout Extensions ═══")
    asset_service = client.get_service("AssetService")
    customer_service = client.get_service("CustomerAssetService")

    for callout in CALLOUTS:
        op = client.get_type("AssetOperation")
        op.create.type_ = client.enums.AssetTypeEnum.CALLOUT
        op.create.callout_asset.callout_text = callout

        try:
            response = asset_service.mutate_assets(customer_id=CUSTOMER_ID, operations=[op])
            rn = response.results[0].resource_name
            ok(f"Callout: {callout} → {rn}")

            # Link to account
            link_op = client.get_type("CustomerAssetOperation")
            link_op.create.asset = rn
            link_op.create.field_type = client.enums.AssetFieldTypeEnum.CALLOUT
            customer_service.mutate_customer_assets(customer_id=CUSTOMER_ID, operations=[link_op])
        except GoogleAdsException as ex:
            fail(f"Failed to create callout: {callout}", ex)


def create_structured_snippets(client):
    print("\n═══ STEP 7c: Structured Snippets ═══")
    asset_service = client.get_service("AssetService")
    customer_service = client.get_service("CustomerAssetService")

    # All snippets under header "Courses"
    ops = []
    for snippet_val in STRUCTURED_SNIPPETS:
        op = client.get_type("AssetOperation")
        op.create.type_ = client.enums.AssetTypeEnum.STRUCTURED_SNIPPET
        op.create.structured_snippet_asset.header = "Courses"
        op.create.structured_snippet_asset.values.append(snippet_val)
        ops.append(op)

    # Structured snippets need to be one asset with multiple values
    # Actually, each structured snippet asset has one header + multiple values
    op = client.get_type("AssetOperation")
    op.create.type_ = client.enums.AssetTypeEnum.STRUCTURED_SNIPPET
    op.create.structured_snippet_asset.header = "Courses"
    for val in STRUCTURED_SNIPPETS:
        op.create.structured_snippet_asset.values.append(val)

    try:
        response = asset_service.mutate_assets(customer_id=CUSTOMER_ID, operations=[op])
        rn = response.results[0].resource_name
        ok(f"Structured snippets (Courses): {rn}")

        link_op = client.get_type("CustomerAssetOperation")
        link_op.create.asset = rn
        link_op.create.field_type = client.enums.AssetFieldTypeEnum.STRUCTURED_SNIPPET
        customer_service.mutate_customer_assets(customer_id=CUSTOMER_ID, operations=[link_op])
        ok(f"  Linked to account")
    except GoogleAdsException as ex:
        fail(f"Failed to create structured snippets", ex)


def create_promotion_extension(client):
    print("\n═══ STEP 7d: Promotion Extension ═══")
    asset_service = client.get_service("AssetService")
    customer_service = client.get_service("CustomerAssetService")

    op = client.get_type("AssetOperation")
    op.create.type_ = client.enums.AssetTypeEnum.PROMOTION
    promo = op.create.promotion_asset
    promo.promotion_target = "Full Course Bundle — Save $210"
    promo.money_amount_off.amount_micros = 210_000_000
    promo.money_amount_off.currency_code = "AUD"
    promo.language = "en"
    promo.final_urls.append(f"{PORTAL_URL}/pricing")
    promo.occasion = client.enums.PromotionExtensionOccasionEnum.NONE

    try:
        response = asset_service.mutate_assets(customer_id=CUSTOMER_ID, operations=[op])
        rn = response.results[0].resource_name
        ok(f"Promotion: {rn}")

        link_op = client.get_type("CustomerAssetOperation")
        link_op.create.asset = rn
        link_op.create.field_type = client.enums.AssetFieldTypeEnum.PROMOTION
        customer_service.mutate_customer_assets(customer_id=CUSTOMER_ID, operations=[link_op])
        ok(f"  Linked to account")
    except GoogleAdsException as ex:
        fail(f"Failed to create promotion extension", ex)


# ─── Geo targeting (Australia) ───────────────────────────────────────────────

def set_campaign_geo_target(client, campaign_rn):
    """Target Australia (geo criterion ID: 2036)."""
    cc_service = client.get_service("CampaignCriterionService")
    op = client.get_type("CampaignCriterionOperation")
    criterion = op.create
    criterion.campaign = campaign_rn
    criterion.location.geo_target_constant = (
        client.get_service("GeoTargetConstantService").geo_target_constant_path(2036)
    )
    try:
        cc_service.mutate_campaign_criteria(customer_id=CUSTOMER_ID, operations=[op])
        ok(f"  Geo target: Australia")
    except GoogleAdsException as ex:
        fail(f"  Failed to set geo target", ex)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    if not CUSTOMER_ID:
        print("ERROR: Set GOOGLE_ADS_CUSTOMER_ID environment variable")
        sys.exit(1)

    print(f"Customer ID: {CUSTOMER_ID}")
    print(f"Portal URL: {PORTAL_URL}")
    print("All campaigns will be created in PAUSED state.\n")

    client = create_client()

    # Step 1: Shared negative keyword list
    shared_set_rn = create_shared_negative_list(client)

    # Steps 2-6: Campaigns, ad groups, keywords, ads
    for campaign_data in CAMPAIGNS:
        print(f"\n═══ CAMPAIGN: {campaign_data['name']} ═══")

        # Step 2: Create campaign
        campaign_rn = create_campaign(client, campaign_data)
        if not campaign_rn:
            continue

        # Set geo targeting to Australia
        set_campaign_geo_target(client, campaign_rn)

        # Attach shared negatives
        if shared_set_rn:
            attach_shared_set_to_campaign(client, campaign_rn, shared_set_rn)

        # Campaign-level negatives
        if campaign_data.get("local_campaign_negatives"):
            create_campaign_negative_keywords(client, campaign_rn, campaign_data["local_campaign_negatives"])

        # Step 3-6: Ad groups with keywords and ads
        for ag_data in campaign_data["ad_groups"]:
            print(f"\n  ── Ad Group: {ag_data['name']} ──")

            # Step 3: Create ad group
            ag_rn = create_ad_group(client, campaign_rn, ag_data)
            if not ag_rn:
                continue

            # Step 4: Add keywords
            create_keywords(client, ag_rn, ag_data.get("keywords", []))

            # Add local negative keywords
            create_negative_keywords(client, ag_rn, ag_data.get("local_negatives", []))

            # Steps 5-6: Create ads
            for ad_data in ag_data.get("ads", []):
                if ad_data["type"] == "RSA":
                    create_rsa_ad(client, ag_rn, ad_data)
                elif ad_data["type"] == "DISPLAY":
                    create_display_ad(client, ag_rn, ad_data)

    # Step 7: Account-level extensions
    create_sitelink_extensions(client)
    create_callout_extensions(client)
    create_structured_snippets(client)
    create_promotion_extension(client)

    print("\n" + "═" * 60)
    print("DONE. All campaigns created in PAUSED state.")
    print("Review in Google Ads UI before enabling.")
    print("═" * 60)


if __name__ == "__main__":
    main()
