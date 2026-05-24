'use client'

import { useState } from 'react'
import { DEMO_EVENTS, trackDemoEvent } from '@/lib/analytics-demo'
import { Sparkles } from 'lucide-react'

interface ConversationCardProps {
  label: string
  tier: 'Smaller' | 'Preferred'
  title: string
  body: string
}

/**
 * The "Two conversations open" cards on the heidi-tour page. Click
 * tracking fires demo_resource_clicked with conversation= attribute so
 * Zac can see which framing Paul engaged with first / longest.
 *
 * Reading the body via :open expand fires conversation_expanded event.
 */
export function ConversationCard({ label, tier, title, body }: ConversationCardProps) {
  const [expanded, setExpanded] = useState(false)

  const handleClick = () => {
    const next = !expanded
    setExpanded(next)
    if (next) {
      trackDemoEvent(DEMO_EVENTS.RESOURCE_CLICKED, {
        resource: 'conversation-card',
        conversation: label,
        tier,
        title,
        action: 'expanded',
      }).catch(() => {})
    }
  }

  const isPreferred = tier === 'Preferred'

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-expanded={expanded}
      className={`text-left rounded-xl border p-5 transition-all w-full ${
        isPreferred
          ? 'border-2 border-accent/40 bg-gradient-to-br from-accent/[0.04] to-white hover:border-accent/60 hover:shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent">
          {label}
        </p>
        <span
          className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
            isPreferred
              ? 'bg-accent/10 text-accent border-accent/20'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          {isPreferred && <Sparkles className="w-2.5 h-2.5" />}
          {tier}
        </span>
      </div>
      <p className="text-sm font-bold text-foreground mb-1.5 leading-snug">
        {title}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
      <p className="mt-3 text-[10px] text-accent font-semibold">
        {expanded ? 'Acknowledged ✓' : 'Tap to acknowledge this is the conversation worth having →'}
      </p>
    </button>
  )
}
