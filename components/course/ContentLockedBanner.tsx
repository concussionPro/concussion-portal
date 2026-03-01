'use client'

import { Lock, ArrowRight, Award, BookOpen, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ContentLockedBanner({ remainingSections }: { remainingSections?: string[] }) {
  const router = useRouter()

  return (
    <div className="relative my-8">
      {/* Fade out effect above the banner */}
      <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-white z-10"></div>

      {/* Lock banner - glassmorphic light style */}
      <div className="relative z-20 glass rounded-2xl p-8 border-2 border-accent/30 shadow-xl">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>

          {/* Headline */}
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Unlock the Full Module
          </h3>
          <p className="text-muted-foreground text-base mb-6 leading-relaxed max-w-2xl mx-auto">
            You&apos;re viewing a preview. Enrol to unlock <strong className="text-foreground">all 8 modules</strong>, downloadable clinical tools, and earn <strong className="text-foreground">up to 14 CPD hours</strong> &mdash; endorsed by <strong className="text-accent">Osteopathy Australia</strong>.
          </p>

          {/* Value props row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
            <div className="glass rounded-xl p-3 border border-border/30">
              <BookOpen className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-lg font-bold text-foreground">8</div>
              <div className="text-xs text-muted-foreground">Modules</div>
            </div>
            <div className="glass rounded-xl p-3 border border-border/30">
              <Award className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-lg font-bold text-foreground">14</div>
              <div className="text-xs text-muted-foreground">CPD Hours</div>
            </div>
            <div className="glass rounded-xl p-3 border border-border/30">
              <ShieldCheck className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-xs font-semibold text-foreground leading-tight mt-1">AHPRA Aligned</div>
              <div className="text-[10px] text-muted-foreground">Endorsed by OA</div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push('/pricing')}
            className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            View Pricing &amp; Enrol
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-muted-foreground text-sm mt-4">
            Online from $497 AUD &middot; Complete course from $1,190 AUD
          </p>
        </div>
      </div>

      {/* Remaining sections as greyed-out titles */}
      {remainingSections && remainingSections.length > 0 && (
        <div className="relative mt-4 pointer-events-none select-none">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 rounded-xl"></div>
          <div className="space-y-3 py-2">
            {remainingSections.map((title, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200 opacity-50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-400 text-sm">{title}</div>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
