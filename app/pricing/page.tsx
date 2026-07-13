'use client'

// The public CCM (Concussion Clinical Mastery) landing. The page body now lives
// in components/pricing/CcmPricingContent so it can be reused as-is (with its
// own nav) by the dual-stream /courses/streams toggle.
import CcmPricingContent from '@/components/pricing/CcmPricingContent'

export default function PricingPage() {
  return <CcmPricingContent />
}
