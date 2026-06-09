import Link from 'next/link'
import { PlayCircle, TrendingUp, Sparkles, Activity, ArrowLeft } from 'lucide-react'
import { CONFIG } from '@/lib/config'

/**
 * Mock clinician-state sidebar shown on the AI course landing inside
 * the partner demo flow. Demonstrates to Paul what a Heidi user would
 * see if CEA were integrated:
 *   - currently doing (course progress)
 *   - CPD hours acquired YTD vs required
 *   - suggested courses (recommendation engine)
 *   - recent auto-logged activity (passive CPD)
 *
 * All numbers + activity entries are mock data — labelled as such at
 * the top so Paul knows it's illustrative of the UX, not a real feed.
 */
export function ClinicianMockDashboard() {
  return (
    <aside className="hidden md:flex fixed left-0 top-[88px] bottom-0 w-72 flex-col border-r border-slate-200 bg-white z-30 overflow-y-auto">
      {/* Banner — flags this as the mock-clinician view */}
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-800">
          Mock view · what your user would see
        </p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-5">
        {/* CURRENTLY DOING */}
        <section>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">
            Currently doing
          </p>
          <div className="rounded-lg border border-accent/30 bg-accent/[0.04] p-3">
            <p className="text-[10px] font-semibold text-accent uppercase tracking-wide mb-0.5">
              AI in Clinical Practice
            </p>
            <p className="text-xs font-bold text-foreground leading-tight mb-2">
              Module 3 · Documentation Workflows
            </p>
            <div className="mb-2">
              <div className="flex items-baseline justify-between mb-1 text-[10px] text-slate-500">
                <span>3 of 9 modules</span>
                <span className="font-semibold tabular-nums">33%</span>
              </div>
              <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-accent" style={{ width: '33%' }} />
              </div>
            </div>
            <button
              type="button"
              className="w-full mt-1.5 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-accent text-white text-[11px] font-semibold hover:bg-accent/90 transition-colors"
            >
              <PlayCircle className="w-3 h-3" />
              Continue
            </button>
          </div>
        </section>

        {/* CPD HOURS YTD */}
        <section>
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">
            CPD hours · 2026 YTD
          </p>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-baseline justify-between mb-1.5">
              <p className="text-xl font-bold text-foreground tabular-nums leading-none">14.5</p>
              <p className="text-[10px] text-slate-500 tabular-nums">/ 20 needed</p>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
              <div className="h-full bg-emerald-500" style={{ width: '72%' }} />
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug">
              Physiotherapy Board · on track for re-registration
            </p>
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-[10px]">
              <div>
                <p className="text-slate-500">Active (courses)</p>
                <p className="font-bold text-foreground tabular-nums">8.0 hrs</p>
              </div>
              <div>
                <p className="text-slate-500">Passive (auto-logged)</p>
                <p className="font-bold text-foreground tabular-nums">6.5 hrs</p>
              </div>
            </div>
          </div>
        </section>

        {/* SUGGESTED FOR YOU */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3 h-3 text-accent" />
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Suggested for you
            </p>
          </div>
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 hover:border-accent/40 cursor-pointer transition-colors">
              <p className="text-xs font-bold text-foreground leading-tight mb-0.5">
                The Vagus Nerve in Clinical Practice
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug mb-1">
                1.25 CPD hours · A$97
              </p>
              <p className="text-[10px] text-accent leading-snug">
                Matches your recent scribe topics (autonomic, POTS)
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 hover:border-accent/40 cursor-pointer transition-colors">
              <p className="text-xs font-bold text-foreground leading-tight mb-0.5">
                Concussion Clinical Mastery
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug mb-1">
                14 CPD hours · A${CONFIG.COURSE.PRICE_REGULAR.toLocaleString()} · OA-endorsed
              </p>
              <p className="text-[10px] text-accent leading-snug">
                Matches sports-medicine case patterns
              </p>
            </div>
          </div>
        </section>

        {/* RECENT ACTIVITY */}
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Activity className="w-3 h-3 text-emerald-700" />
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Auto-logged this week
            </p>
          </div>
          <ul className="space-y-1.5">
            {[
              { t: 'Scribe session · complex consult', hrs: '0.3', when: 'today' },
              { t: 'Literature search · 4 papers', hrs: '0.5', when: 'today' },
              { t: 'Module 2 completed', hrs: '0.3', when: 'yesterday' },
              { t: 'Scribe session', hrs: '0.2', when: '2 days ago' },
              { t: 'Guideline review', hrs: '0.4', when: '3 days ago' },
            ].map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-[10px]">
                <TrendingUp className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                <span className="flex-1 text-foreground/85 leading-tight">{e.t}</span>
                <span className="text-slate-500 tabular-nums font-semibold">+{e.hrs}h</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Footer — booking link + back to demo */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 space-y-2">
        <a
          href="https://cal.com/zac-lewis-so8zjs"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-accent text-white text-[11px] font-semibold hover:bg-accent/90 transition-colors"
        >
          Book a 30-min call →
        </a>
        <Link
          href="/courses/private-preview"
          className="block text-center text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to demo overview
        </Link>
      </div>
    </aside>
  )
}
