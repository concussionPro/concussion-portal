import { Sparkles } from 'lucide-react'

interface ConversationCardProps {
  label: string
  tier: 'Smaller' | 'Preferred'
  title: string
  body: string
}

/**
 * Passive informational card on the heidi-tour page. Shows the two
 * possible conversation directions without asking the viewer to commit
 * or pick one on the spot. This is a demo, not a contract surface.
 *
 * Visual differentiation of 'Preferred' is preserved (border + sparkle)
 * so the framing is honest but the page doesn't force a decision.
 */
export function ConversationCard({ label, tier, title, body }: ConversationCardProps) {
  const isPreferred = tier === 'Preferred'

  return (
    <div
      className={`rounded-xl border p-5 ${
        isPreferred
          ? 'border-2 border-accent/40 bg-gradient-to-br from-accent/[0.04] to-white'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent">{label}</p>
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
      <p className="text-sm font-bold text-foreground mb-1.5 leading-snug">{title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </div>
  )
}
