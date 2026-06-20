import type { Metadata } from 'next'
import { getEpModulesMeta } from '@/data/ep-modules'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import CrmWorkshopInterest from '@/components/CrmWorkshopInterest'

// ─────────────────────────────────────────────────────────────────────────────
// Concussion Rehab Mastery — PUBLIC sales/landing page (EP-scoped course).
//
// IMPORTANT: this page is built ahead of launch. It MUST stay unlisted and
// unindexed until the founder flips it live — hence noindex/nofollow and no
// link from any nav/homepage. Marketing page only; course content stays gated.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — Built for Exercise Physiologists',
  description:
    'The only concussion-rehabilitation course scoped for Accredited Exercise Physiologists and Exercise Scientists. 8 online modules · 8 CPD hours · designed to ESSA CPD standards (accreditation pending).',
  robots: 'noindex, nofollow',
}

// Interest capture — no backend. A mailto keeps this fully self-contained;
// the founder will wire a proper form later.
const INTEREST_HREF =
  'mailto:hello@concussion-education-australia.com?subject=Concussion%20Rehab%20Mastery%20%E2%80%94%20Register%20my%20interest&body=Hi%20Zac%2C%20I%27d%20like%20to%20register%20my%20interest%20in%20Concussion%20Rehab%20Mastery.%0A%0AName%3A%0AProfession%20(AEP%20%2F%20AES)%3A%0AESSA%20number%20(optional)%3A%0A'

const WHY_NOW = [
  {
    stat: 'Only one',
    label: 'EP-specific course',
    body: 'There is no other concussion-rehabilitation course written for the exercise-physiology scope of practice. This is it — built around what you do, not adapted from a physio or GP syllabus.',
  },
  {
    stat: 'In-scope',
    label: 'yet absent from training',
    body: 'Graded exertion and sub-symptom-threshold aerobic prescription sit squarely inside AEP scope — but concussion was never part of your training. This closes that gap.',
  },
  {
    stat: '8 points',
    label: 'of ESSA Further Education',
    body: 'Eight CPD points covers most of an ESSA member’s annual Further-Education requirement in a single, focused, clinically rigorous course.',
  },
]

const INCLUDED = [
  {
    title: '8 online modules',
    body: '8 CPD hours of structured, video-supported learning — from the neurometabolic cascade to documentation and referral.',
  },
  {
    title: 'Live Baseline & Serial Testing tool',
    body: 'A working assessment instrument for capturing baseline and serial exertion data, not a static PDF.',
  },
  {
    title: 'The Clinical Toolkit',
    body: 'BCTT testing sheet, SSTAE prescription templates, the phenotype-specific exercise library, progression and stop-criteria references — everything for the chairside workflow.',
  },
  {
    title: 'Administrative document pack',
    body: 'NDIS, WorkCover and GP report templates written to close the loop with the referring care team.',
  },
  {
    title: 'Certificate of completion',
    body: 'Issued on passing the assessment — 80% pass mark — evidencing 8 CPD hours.',
  },
  {
    title: 'Lifetime access',
    body: 'One-time payment. Revisit every module, tool and template whenever a concussion patient lands in your care.',
  },
]

const SCOPE_IN = [
  'Assess exercise tolerance and identify the symptom-limited threshold (BCTT / graded exertion)',
  'Prescribe and progress sub-symptom-threshold aerobic exercise (SSTAE)',
  'Deliver phenotype-specific reconditioning within EP scope',
  'Guide graded return-to-activity and sport-specific reconditioning',
  'Monitor heart rate, workload, RPE and symptom response — and adjust dose',
  'Recognise red flags, stop, and escalate to the medical team',
]

const SCOPE_OUT = [
  'Diagnose or re-diagnose concussion',
  'Determine medical readiness to commence rehabilitation',
  'Grant return-to-sport or medical clearance',
  'Independently manage red-flag or deteriorating presentations beyond stop-and-refer',
]

const FAQ = [
  {
    q: 'Is it ESSA accredited?',
    a: 'ESSA CPD accreditation is pending — the course is in application and has been designed to ESSA CPD standards. We don’t claim accreditation we don’t yet hold; this page will be updated the moment it’s confirmed.',
  },
  {
    q: 'How many CPD points is it worth?',
    a: '8 CPD hours, mapped to 8 ESSA CPD points across the eight modules — enough to cover most of a member’s annual Further-Education requirement.',
  },
  {
    q: 'Do I need the in-person workshop?',
    a: 'No — the online course is complete and standalone. You finish it at your own pace and sit the assessment entirely online; nothing further is required to certify. If you also want the hands-on skills, you can add the same full-day practical workshop every clinician takes (SCAT6, VOMS, BESS and cervicogenic assessment) — the standard optional upgrade, exactly like osteopaths and physiotherapists. There is no fixed workshop date yet; register your interest in the workshop section above and we’ll place you in the next one in your region.',
  },
  {
    q: 'Is concussion rehab within my scope?',
    a: 'Yes. AEPs implement graded exertion and exercise prescription — exactly what evidence-based concussion rehab now requires. You implement and progress the rehabilitation; you do not diagnose or grant clearance. The course is comprehensive within that scope.',
  },
]

function totals(meta: ReturnType<typeof getEpModulesMeta>) {
  const points = meta.reduce((sum, m) => sum + m.points, 0)
  return { count: meta.length, points }
}

export default async function ConcussionRehabMasteryPage() {
  // GATED PRE-LAUNCH (Zac 2026-06): admin / demo-key / enrolled only — must NOT
  // be publicly reachable until launch. Remove this line to go live.
  await requireAiCourseAccess('/login')
  const modules = getEpModulesMeta()
  const { count } = totals(modules)

  return (
    <main className="bg-[var(--background)] text-[var(--foreground)]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 50% at 15% 0%, rgba(13,115,119,0.10), transparent 60%), radial-gradient(50% 45% at 95% 10%, rgba(16,145,138,0.08), transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--card-solid)] px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            For Accredited Exercise Physiologists &amp; Exercise Scientists
          </div>

          <h1 className="mt-7 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            Concussion Rehab Mastery
            <span className="mt-3 block text-2xl font-semibold tracking-[-0.02em] text-accent sm:text-3xl">
              Built for Exercise Physiologists.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[var(--muted-foreground)] sm:text-xl">
            Concussion care has moved from rest to <strong className="text-[var(--foreground)]">active rehabilitation</strong>.
            The Buffalo treadmill test, then a sub-symptom-threshold aerobic
            prescription, progressed against an objective heart-rate ceiling —
            that is <em>exercise prescription</em>. It is the AEP’s core skill,
            applied to a condition you were never trained for. This course
            closes that gap.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={INTEREST_HREF}
              className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-4 text-base font-semibold text-white shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-light)]"
            >
              Register your interest
            </a>
            <a
              href="#curriculum"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card-solid)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:border-accent hover:text-accent"
            >
              See the curriculum
            </a>
            <a
              href="/ep-course/modules/1"
              className="inline-flex items-center justify-center px-2 py-4 text-base font-semibold text-accent transition-colors hover:text-[var(--accent-light)]"
            >
              Preview the modules →
            </a>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--border)] shadow-[var(--shadow-sm)] sm:grid-cols-4">
            {[
              { v: String(count), l: 'Online modules' },
              { v: '8', l: 'CPD hours' },
              { v: '8', l: 'ESSA CPD points' },
              { v: '100%', l: 'Online · self-paced' },
            ].map((s) => (
              <div key={s.l} className="bg-[var(--card-solid)] px-5 py-5">
                <dt className="text-2xl font-extrabold tracking-[-0.02em] text-accent">{s.v}</dt>
                <dd className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                  {s.l}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-sm text-[var(--muted-foreground)]">
            ESSA CPD accreditation pending — designed to ESSA CPD standards.
          </p>
        </div>
      </section>

      {/* ── Why now / white space ────────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface-warm)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Why now
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
            The white space the profession has been waiting for.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {WHY_NOW.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-7 shadow-[var(--shadow-sm)]"
              >
                <div className="text-2xl font-extrabold tracking-[-0.02em] text-accent">
                  {c.stat}
                </div>
                <div className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                  {c.label}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scope-accuracy reassurance ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Scope-accurate by design
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
              You implement the rehabilitation. You don’t diagnose or clear.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[var(--muted-foreground)]">
              Every module holds the same boundary. A patient arrives with an
              existing diagnosis and a referral. You assess exercise tolerance,
              prescribe and progress graded exertion, monitor the physiological
              and symptom response, and feed it back to the referring clinician.
              Diagnosis, red-flag triage and return-to-sport clearance stay with
              the medical and physiotherapy team. Comprehensive — within scope.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-subtle)] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-accent">
                Inside your scope
              </h3>
              <ul className="mt-4 space-y-3">
                {SCOPE_IN.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-snug text-[var(--foreground)]">
                    <span aria-hidden className="mt-0.5 select-none font-bold text-accent">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                Outside your scope
              </h3>
              <ul className="mt-4 space-y-3">
                {SCOPE_OUT.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-snug text-[var(--muted-foreground)]">
                    <span aria-hidden className="mt-0.5 select-none font-bold text-[var(--muted-foreground)]">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Curriculum ───────────────────────────────────────────────────── */}
      <section id="curriculum" className="border-y border-[var(--border)] bg-[var(--surface-warm)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                The curriculum
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
                Eight modules. Eight CPD hours. Eight points.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--muted-foreground)]">
              From the neurometabolic cascade to documentation and referral —
              a complete, scope-bounded path through concussion exercise rehab.
            </p>
          </div>

          <ol className="mt-12 space-y-4">
            {modules.map((m) => (
              <li
                key={m.id}
                className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--border-strong)] sm:flex-row sm:items-center"
              >
                <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--accent-muted)] text-base font-extrabold text-accent">
                  {m.id}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                    {m.title}
                  </h3>
                  {m.subtitle ? (
                    <p className="mt-1 text-sm leading-snug text-[var(--muted-foreground)]">
                      {m.subtitle}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-none items-center gap-3 text-xs font-semibold sm:flex-col sm:items-end sm:gap-1">
                  <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-[var(--muted-foreground)]">
                    {m.duration}
                  </span>
                  <span className="rounded-full bg-[var(--accent-muted)] px-3 py-1 text-accent">
                    {m.points} CPD {m.points === 1 ? 'point' : 'points'}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-subtle)] px-6 py-5">
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
              Total
            </span>
            <span className="text-sm font-bold text-accent">
              8 hours · 8 CPD points · 80% assessment pass mark
            </span>
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="/ep-course/modules/1"
              className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card-solid)] px-7 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:border-accent hover:text-accent"
            >
              Preview the modules — go to the course →
            </a>
          </div>
        </div>
      </section>

      {/* ── Course bento ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Inside the course
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
          Not a slide deck. A working clinical system.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)]">
          Every module is paired with the instrument or template you&rsquo;ll use the
          next time a concussion patient lands in your care.
        </p>

        <div className="bento-premium mt-12">
          {/* Hero tile */}
          <div className="bento-large relative flex flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-8 shadow-[var(--shadow-md)] sm:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(80% 70% at 100% 0%, rgba(13,115,119,0.10), transparent 60%)',
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--accent-subtle)] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
                The complete course
              </span>
              <p className="mt-7 text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--foreground)] sm:text-6xl">
                8 modules
              </p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted-foreground)]">
                A complete, scope-bounded path from the neurometabolic cascade to
                documentation and referral — built for the exercise-physiology scope,
                not adapted from a physio or GP syllabus.
              </p>
            </div>
            <dl className="relative mt-8 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-6">
              {[
                { v: '8', l: 'CPD hours' },
                { v: '8', l: 'ESSA points' },
                { v: '80%', l: 'Pass mark' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="text-2xl font-extrabold tracking-[-0.02em] text-accent">
                    {s.v}
                  </dt>
                  <dd className="mt-1 text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                    {s.l}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Live Baseline & Serial Testing tool */}
          <div className="bento-tall flex flex-col justify-between rounded-3xl border border-[var(--border-strong)] bg-[var(--accent-subtle)] p-7 shadow-[var(--shadow-sm)]">
            <div>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
                Working instrument
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                Live Baseline &amp; Serial Testing tool
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                A real assessment instrument for capturing baseline and serial exertion
                data over a rehab episode — not a static PDF you print and lose.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                Captures
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                HR ceiling · RPE · symptom score · session-over-session trend
              </p>
            </div>
          </div>

          {/* BCTT calculator */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-7 shadow-[var(--shadow-sm)]">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
              Built-in calculator
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
              BCTT calculator
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Buffalo treadmill test workload and symptom-threshold heart-rate maths,
              done for you — so you prescribe to an objective ceiling, not a guess.
            </p>
          </div>

          {/* Phenotype exercise library — wide */}
          <div className="bento-span-2 flex flex-col justify-between rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-7 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:gap-8">
            <div>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
                Chairside reference
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                Phenotype-specific exercise library
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--muted-foreground)]">
                Reconditioning prescriptions mapped to the presentation in front of you —
                with progression and stop-criteria references for each.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 sm:mt-0 sm:max-w-[14rem] sm:justify-end">
              {['Autonomic', 'Vestibular', 'Cervicogenic', 'Ocular', 'Cognitive/fatigue'].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--accent-muted)] px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Certificate */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-7 shadow-[var(--shadow-sm)]">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
              On passing
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
              Certificate of completion
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Issued at the 80% pass mark, evidencing 8 CPD hours for your ESSA
              Further-Education record.
            </p>
          </div>

          {/* Lifetime access */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-7 shadow-[var(--shadow-sm)]">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
              One-time payment
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
              Lifetime access
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Revisit every module, tool and template whenever the next concussion
              patient lands in your care.
            </p>
          </div>

          {/* Scope-accurate design — wide */}
          <div className="bento-span-2 flex flex-col justify-between rounded-3xl border border-[var(--border-strong)] bg-[var(--accent-subtle)] p-7 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:gap-8">
            <div>
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
                Scope-accurate by design
              </span>
              <h3 className="mt-4 text-lg font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                Everything stays inside EP scope
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted-foreground)]">
                You implement and progress the rehabilitation. Diagnosis, red-flag
                triage and return-to-sport clearance stay with the medical team — every
                module holds that boundary, plus NDIS / WorkCover / GP report templates
                to close the loop.
              </p>
            </div>
            <a
              href="/ep-course/modules/1"
              className="mt-5 inline-flex flex-none items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-light)] sm:mt-0"
            >
              Go to the course →
            </a>
          </div>
        </div>
      </section>

      {/* ── What's included ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          What’s included
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
          Everything you need to run a concussion-rehab caseload.
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-7 shadow-[var(--shadow-sm)]"
            >
              <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface-warm)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Who it’s for
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
            Written for two practitioners, scoped for each.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-8 shadow-[var(--shadow-sm)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Accredited Exercise Physiologists
              </h3>
              <p className="mt-2 text-sm font-medium text-accent">Clinical rehabilitation</p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                For AEPs at every experience level. Take a diagnosed, referred
                patient and deliver the full graded-exertion pathway — exercise-
                tolerance testing, sub-symptom-threshold prescription, phenotype-
                specific reconditioning and graded return-to-activity — with the
                monitoring and documentation to back it.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-8 shadow-[var(--shadow-sm)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Exercise Scientists
              </h3>
              <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">
                Screening &amp; conditioning (non-clinical)
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                AES practice is non-clinical, so the course supports you in
                baseline and pre-season screening and in return-to-sport
                conditioning — not clinical concussion rehabilitation. Build the
                physiological literacy to run robust baselines and condition
                athletes safely around the medical team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── In-person workshop (optional hands-on extension) ─────────────── */}
      <section id="workshop" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* Left — mixed-cohort messaging */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Optional hands-on extension
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
              Want the skills in your hands? Add the workshop.
            </h2>

            <div className="mt-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--accent-subtle)] p-6">
              <p className="text-sm font-semibold text-accent">
                The online course is the EP-custom part. The workshop is shared.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                You can finish all eight modules and sit the assessment entirely
                online — nothing further is required to certify. If you want the
                hands-on skills too, you add the
                <strong className="text-[var(--foreground)]"> same full-day practical workshop every clinician takes</strong> —
                the standard optional upgrade, exactly like osteopaths and physiotherapists.
              </p>
            </div>

            <ul className="mt-8 space-y-5">
              <li className="flex gap-4">
                <span aria-hidden className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[var(--accent-muted)] text-sm font-bold text-accent">
                  1
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                    The same hands-on day everyone attends
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    One supervised full day of SCAT6, VOMS, BESS and cervicogenic
                    assessment practice with expert feedback — the practical
                    assessment skills that sit alongside your rehab workflow. You
                    attend in the same room as osteopaths, physiotherapists and GPs.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[var(--accent-muted)] text-sm font-bold text-accent">
                  2
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                    Online is EP-scoped; the workshop is universal
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    Your eight online modules are written for the exercise-physiology
                    scope of practice. The hands-on day is the same for every
                    discipline — the assessment competence every clinician needs,
                    learned in the room where the rest of the care team works.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span aria-hidden className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[var(--accent-muted)] text-sm font-bold text-accent">
                  3
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-[-0.01em] text-[var(--foreground)]">
                    Add it as an upgrade — or stay fully online
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    The workshop is an optional add-on at the standard upgrade price
                    (the same one every clinician pays). There&rsquo;s no fixed date
                    yet — register your interest and we&rsquo;ll place you in the next
                    workshop in your region.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Right — interest form */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-7 shadow-[var(--shadow-md)] sm:p-9">
            <h3 className="text-xl font-bold tracking-[-0.02em] text-[var(--foreground)]">
              Register your workshop interest
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
              Tell us where you are and we&rsquo;ll place you in the next workshop
              near you.
            </p>
            <div className="mt-7">
              <CrmWorkshopInterest />
            </div>
          </div>
        </div>
      </section>

      {/* ── Credibility ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-solid)] p-8 shadow-[var(--shadow-md)] sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Who built it
          </p>
          <blockquote className="mt-5 text-xl font-medium leading-relaxed tracking-[-0.01em] text-[var(--foreground)] sm:text-2xl">
            “Concussion rehab is an exercise-physiology problem. A functional,
            energy-starved, autonomically-dysregulated injury that responds to
            precisely-dosed exertion is, by its nature, your discipline.”
          </blockquote>
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <p className="text-base font-semibold text-[var(--foreground)]">
              Zac Lewis — Osteopath (AQF-7), PhD (Neuroscience) candidate
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
              10+ years in concussion and neurological rehabilitation. The
              course is grounded in the Leddy / Buffalo evidence base and the
              Amsterdam 2023 international consensus on concussion in sport —
              translated specifically for the exercise-physiology scope of
              practice.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--surface-warm)]">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Enrolment
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
            One course. Lifetime access.
          </h2>

          <div className="mx-auto mt-10 max-w-md rounded-3xl border border-[var(--border-strong)] bg-[var(--card-solid)] p-8 shadow-[var(--shadow-lg)] sm:p-10">
            <div className="text-5xl font-extrabold tracking-[-0.03em] text-[var(--foreground)]">
              A$497
            </div>
            <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)]">
              One-time payment · lifetime access · includes the live Baseline &amp; Serial Testing tool, BCTT calculator and full Clinical Toolkit
            </p>

            <ul className="mt-8 space-y-3 text-left">
              {[
                'All 8 modules — 8 CPD hours',
                '8 ESSA CPD points (accreditation pending)',
                'Live Baseline & Serial Testing tool + Clinical Toolkit',
                'NDIS / WorkCover / GP report templates',
                'Certificate on passing (80% pass mark)',
                'Lifetime access — revisit any time',
              ].map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-snug text-[var(--foreground)]">
                  <span aria-hidden className="mt-0.5 select-none font-bold text-accent">✓</span>
                  {line}
                </li>
              ))}
            </ul>

            <a
              href={INTEREST_HREF}
              className="mt-9 inline-flex w-full items-center justify-center rounded-full bg-accent px-8 py-4 text-base font-semibold text-white shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-light)]"
            >
              Register your interest
            </a>
            <p className="mt-4 text-xs text-[var(--muted-foreground)]">
              Be first to know when enrolment opens and pricing is confirmed.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          Questions
        </p>
        <h2 className="mt-3 text-center text-3xl font-bold tracking-[-0.025em] sm:text-4xl">
          Frequently asked
        </h2>
        <dl className="mt-12 divide-y divide-[var(--border)] border-y border-[var(--border)]">
          {FAQ.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-base font-semibold text-[var(--foreground)]">{item.q}</dt>
              <dd className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-[var(--border)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(70% 120% at 50% 0%, rgba(13,115,119,0.10), transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
            The condition you weren’t trained for — now within reach.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted-foreground)]">
            Concussion Rehab Mastery is the EP-scoped path into concussion
            rehabilitation. Register your interest and we’ll let you know the
            moment enrolment opens.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={INTEREST_HREF}
              className="inline-flex items-center justify-center rounded-full bg-accent px-9 py-4 text-base font-semibold text-white shadow-[var(--shadow-md)] transition-transform hover:-translate-y-0.5 hover:bg-[var(--accent-light)]"
            >
              Register your interest
            </a>
            <a
              href={INTEREST_HREF}
              className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card-solid)] px-9 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:border-accent hover:text-accent"
            >
              Contact us
            </a>
          </div>
          <p className="mt-8 text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            ESSA CPD accreditation pending · designed to ESSA CPD standards
          </p>
        </div>
      </section>
    </main>
  )
}
