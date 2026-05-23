import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { POLL_TOPICS, getTopicTallies, getVoterCount } from '@/lib/polls'
import { PollClient } from './PollClient'

export const metadata: Metadata = {
  title: 'Vote on next CEA course',
  description: 'Vote for up to 3 CPD topics. The winner gets built next at A$97. Voters get 40% off launch week.',
}

export const dynamic = 'force-dynamic'

export default async function PollPage() {
  const [tallies, voterCount] = await Promise.all([
    getTopicTallies().catch(() => []),
    getVoterCount().catch(() => 0),
  ])

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent mb-3">
          What we build next is your call
        </p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 leading-tight max-w-3xl">
          Vote for the next CEA course.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-3 leading-relaxed">
          Pick up to 3 topics. The top-voted course gets built next at A$97. <strong className="text-foreground">Voters get 40% off launch week — A$57</strong>.
        </p>
        <p className="text-sm text-muted-foreground mb-10">
          {voterCount > 0 ? (
            <><strong className="text-foreground">{voterCount} clinicians</strong> have voted so far. Live results update at the bottom.</>
          ) : (
            <>Be the first to vote — your picks shape the next monthly drop.</>
          )}
        </p>

        <PollClient topics={POLL_TOPICS} initialTallies={tallies} initialVoterCount={voterCount} />
      </div>
    </div>
  )
}
