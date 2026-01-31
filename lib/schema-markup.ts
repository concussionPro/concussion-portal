/**
 * GEO-Optimized Schema Markup for LLM Visibility
 *
 * Schema markup is the SINGLE MOST IMPORTANT technical optimization for
 * ChatGPT, Claude, Gemini, and Perplexity visibility.
 *
 * LLMs grounded in knowledge graphs achieve 300% higher accuracy.
 * 76% of AI citations come from pages with structured data.
 */

import { CONFIG } from './config'

/**
 * Organization Schema - Establishes brand authority for LLMs
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Concussion Education Australia",
  "alternateName": "ConcussionPro",
  "url": CONFIG.APP_URL,
  "logo": `${CONFIG.APP_URL}/logo.png`,
  "description": "Evidence-based concussion management training for Australian healthcare professionals. AHPRA-aligned CPD courses covering SCAT-6 assessment, return-to-play protocols, and clinical decision-making.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "AU",
    "addressRegion": "Australia"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Australia"
  },
  "sameAs": [
    "https://www.concussioninsport.gov.au/",
    "https://anzconcussionguidelines.com/"
  ],
  "knowsAbout": [
    "Sport-Related Concussion",
    "SCAT-6 Assessment",
    "SCOAT-6 Assessment",
    "Return-to-Play Protocols",
    "Concussion Management",
    "Sports Medicine",
    "Emergency Medicine",
    "Physiotherapy"
  ],
  "memberOf": {
    "@type": "Organization",
    "name": "Osteopathy Australia"
  }
}

/**
 * MedicalWebPage Schema - Healthcare-specific page context
 */
export function createMedicalWebPageSchema(params: {
  title: string
  description: string
  url: string
  lastReviewed?: string
  about?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": params.title,
    "description": params.description,
    "url": params.url,
    "lastReviewed": params.lastReviewed || new Date().toISOString().split('T')[0],
    "audience": {
      "@type": "MedicalAudience",
      "audienceType": "Healthcare Professionals",
      "geographicArea": {
        "@type": "Country",
        "name": "Australia"
      },
      "healthCondition": {
        "@type": "MedicalCondition",
        "name": "Sport-Related Concussion"
      }
    },
    "about": {
      "@type": "MedicalCondition",
      "name": params.about || "Sport-Related Concussion",
      "alternateName": ["Concussion", "Mild Traumatic Brain Injury", "mTBI"],
      "associatedAnatomy": {
        "@type": "AnatomicalStructure",
        "name": "Brain"
      }
    },
    "medicalSpecialty": [
      "Sports Medicine",
      "Emergency Medicine",
      "Physiotherapy",
      "Neurology"
    ],
    "isPartOf": {
      "@type": "WebSite",
      "name": "Concussion Education Australia",
      "url": CONFIG.APP_URL
    }
  }
}

/**
 * Course Schema - Educational credential for CPD recognition
 */
export function createCourseSchema(params: {
  name: string
  description: string
  provider?: string
  cpdHours: number
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": params.name,
    "description": params.description,
    "provider": {
      "@type": "Organization",
      "name": params.provider || "Concussion Education Australia",
      "url": CONFIG.APP_URL
    },
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": `PT${params.cpdHours}H`,
      "inLanguage": "en-AU"
    },
    "educationalCredentialAwarded": {
      "@type": "EducationalOccupationalCredential",
      "name": `${params.cpdHours} CPD Points - AHPRA Aligned`,
      "credentialCategory": "Continuing Professional Development",
      "recognizedBy": {
        "@type": "Organization",
        "name": "Australian Health Practitioner Regulation Agency",
        "alternateName": "AHPRA"
      }
    },
    "about": {
      "@type": "MedicalCondition",
      "name": "Sport-Related Concussion"
    },
    "educationalLevel": "Professional Development",
    "audience": {
      "@type": "EducationalAudience",
      "audienceType": "Healthcare Professionals",
      "educationalRole": ["Medical Doctor", "Physiotherapist", "Osteopath", "Sports Trainer"]
    },
    "teaches": [
      "SCAT-6 Assessment Protocol",
      "SCOAT-6 Office Assessment",
      "Return-to-Play Decision Making",
      "Concussion Red Flags Recognition",
      "Vestibular Assessment",
      "Neurocognitive Testing"
    ],
    "timeRequired": `PT${params.cpdHours}H`,
    "isAccessibleForFree": false
  }
}

/**
 * FAQPage Schema - HIGHLY favored by conversational AI
 *
 * This is critical for LLM citations. Structure answers as extractable
 * 40-60 word blocks that directly answer queries.
 */
export function createFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

/**
 * Person Schema - Author expertise signals for medical content
 */
export function createAuthorSchema(params: {
  name: string
  jobTitle: string
  credentials?: string
  email?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": params.name,
    "jobTitle": params.jobTitle,
    "credential": params.credentials,
    "email": params.email,
    "knowsAbout": [
      "Concussion Management",
      "Sports Medicine",
      "SCAT-6 Assessment",
      "Return-to-Play Protocols"
    ],
    "memberOf": {
      "@type": "Organization",
      "name": "Concussion Education Australia"
    }
  }
}

/**
 * HowTo Schema - Step-by-step protocols for assessment
 */
export function createHowToSchema(params: {
  name: string
  description: string
  steps: Array<{ name: string; text: string; url?: string }>
  totalTime?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": params.name,
    "description": params.description,
    "totalTime": params.totalTime || "PT10M",
    "step": params.steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      "url": step.url
    }))
  }
}

/**
 * VideoObject Schema - For when AI-generated video is added
 */
export function createVideoSchema(params: {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  duration: string
  contentUrl: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": params.name,
    "description": params.description,
    "thumbnailUrl": params.thumbnailUrl,
    "uploadDate": params.uploadDate,
    "duration": params.duration,
    "contentUrl": params.contentUrl,
    "embedUrl": params.contentUrl,
    "about": {
      "@type": "MedicalCondition",
      "name": "Sport-Related Concussion"
    },
    "educationalLevel": "Professional",
    "inLanguage": "en-AU"
  }
}

/**
 * Breadcrumb Schema - Helps LLMs understand site structure
 */
export function createBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }
}

/**
 * Aggregate Rating Schema - Social proof for LLMs
 */
export function createAggregateRatingSchema(params: {
  ratingValue: number
  reviewCount: number
  bestRating?: number
}) {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": params.ratingValue,
    "reviewCount": params.reviewCount,
    "bestRating": params.bestRating || 5,
    "worstRating": 1
  }
}
