import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { createAuthorSchema, organizationSchema } from '@/lib/schema-markup'
import { GraduationCap, ShieldCheck, BookOpen, Activity, Stethoscope, Users } from 'lucide-react'

const TITLE = 'Zac Lewis — Founder + Lead Educator, Concussion Education Australia'
const DESCRIPTION = "Zac Lewis is an AHPRA-registered Osteopath (B.Clin.Sci., M.Ost.Med), founder and lead clinical educator of Concussion Education Australia. AU concussion + AI in clinical practice training."
const URL = 'https://portal.concussion-education-australia.com/about/zac-lewis'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: 'zac lewis osteopath, zac lewis concussion, zac lewis ahpra, founder concussion education australia, ahpra registered osteopath author, australian concussion educator',
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'profile', url: URL },
  alternates: { canonical: URL },
}

export default function ZacLewisAboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: 'Zac Lewis',
            jobTitle: 'Founder & Lead Educator, Concussion Education Australia',
            description: "AHPRA-registered Osteopath, concussion specialist, and founder of Concussion Education Australia. Lead clinical educator across the Concussion Clinical Mastery and AI in Clinical Practice training streams.",
            url: URL,
            image: 'https://portal.concussion-education-australia.com/og-image.png',
            hasCredential: [
              {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'Professional Registration',
                name: 'Registered Osteopath (AHPRA)',
                recognizedBy: {
                  '@type': 'Organization',
                  name: 'Australian Health Practitioner Regulation Agency (AHPRA)',
                  url: 'https://www.ahpra.gov.au',
                },
              },
              {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'Postgraduate degree',
                name: 'Master of Osteopathic Medicine (M.Ost.Med)',
              },
              {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'Undergraduate degree',
                name: 'Bachelor of Clinical Science (B.Clin.Sci.)',
              },
            ],
            memberOf: {
              '@type': 'Organization',
              name: 'Osteopathy Australia',
              url: 'https://osteopathy.org.au',
            },
            worksFor: {
              '@type': 'Organization',
              name: 'Concussion Education Australia',
              url: 'https://portal.concussion-education-australia.com',
            },
            knowsAbout: [
              'Sport-Related Concussion',
              'SCAT-6 Assessment',
              'SCOAT-6 Assessment',
              'Vestibular-Ocular Motor Screening',
              'Return-to-Play Protocols',
              'Persistent Post-Concussion Symptoms (PPCS)',
              'Mild Traumatic Brain Injury',
              'Sports Medicine',
              'AHPRA AI Guidelines',
              'Australian Privacy Principles for Healthcare',
              'AI Medical Scribes (Heidi, Lyrebird, Halo)',
              'AI in Clinical Practice',
              'Healthcare AI Compliance',
              'Osteopathic Medicine',
            ],
            sameAs: [
              'https://portal.concussion-education-australia.com',
              'https://concussion-education-australia.com',
              'https://orcid.org/0009-0002-4267-0451',
            ],
            email: 'zac@concussion-education-australia.com',
          }),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">

        <section className="bg-gradient-to-br from-teal-700 to-emerald-700 text-white pt-[120px] pb-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="inline-block bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-3">
              About the Founder
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">Zac Lewis</h1>
            <p className="text-base md:text-lg text-emerald-100 mb-2">
              Founder &amp; Lead Educator, Concussion Education Australia
            </p>
            <p className="text-sm text-emerald-100">
              B.Clin.Sci., M.Ost.Med · AHPRA-registered Osteopath
            </p>
          </div>
        </section>

        <main className="max-w-4xl mx-auto px-6 py-12 grid md:grid-cols-[1fr_minmax(0,280px)] gap-8">

          <article className="space-y-8">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
              <h2 className="text-xl font-bold text-slate-900 mb-4">About</h2>
              <div className="space-y-3 text-slate-700 leading-relaxed text-sm">
                <p>
                  Zac Lewis is an AHPRA-registered Osteopath and concussion specialist based in Australia. He founded Concussion Education Australia (CEA) to close the gap between what consensus statements recommend for concussion management and what clinicians actually do in clinic.
                </p>
                <p>
                  His clinical experience spans sport and primary-care settings. He has worked alongside high-performance teams, university clinics, and private practice — most clinicians who finish his courses say the &ldquo;clinic-real&rdquo; framing is what made the content stick.
                </p>
                <p>
                  Beyond concussion, Zac has published and trained extensively on the safe integration of AI tools (Heidi, Lyrebird, ChatGPT, Claude) into Australian clinical practice — covering AHPRA AI guidelines, Australian Privacy Principles (APP 8 offshore disclosure), NDIS audit-safe documentation, and indemnity-insurer positions.
                </p>
                <p>
                  CEA is endorsed by Osteopathy Australia (peak body for ~3,000 registered AU osteopaths) and operates under AHPRA-aligned CPD standards.
                </p>
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Credentials</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">Registered Osteopath (AHPRA)</p>
                    <p className="text-xs text-slate-600 leading-relaxed">Australian Health Practitioner Regulation Agency — the regulator anchoring CEA&apos;s clinical YMYL content authority.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">Master of Osteopathic Medicine (M.Ost.Med)</p>
                    <p className="text-xs text-slate-600">Postgraduate clinical qualification.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">Bachelor of Clinical Science (B.Clin.Sci.)</p>
                    <p className="text-xs text-slate-600">Undergraduate clinical science.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">Concussion research (co-author)</p>
                    <p className="text-xs text-slate-600">Co-author of a concussion study currently under external review (Lewis &amp; Baker); not yet published.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">Member, Osteopathy Australia</p>
                    <p className="text-xs text-slate-600">Peak body for Australian osteopathic medicine. CEA is endorsed by Osteopathy Australia.</p>
                  </div>
                </li>
              </ul>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Areas of Clinical Authority</h2>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <Topic icon={Stethoscope} title="Concussion Clinical" detail="SCAT6, SCOAT6, VOMS, BESS, return-to-play protocols, Amsterdam 2023 consensus implementation." />
                <Topic icon={Activity} title="Persistent Post-Concussion Symptoms" detail="The chronic 5-20% — vestibulo-ocular workup, cervical contribution, autonomic dysregulation, escalation criteria." />
                <Topic icon={ShieldCheck} title="AI in Clinical Practice" detail="AHPRA AI guidelines, Australian Privacy Principles, NDIS audit-safe documentation, AI scribe tool selection (Heidi, Lyrebird, ChatGPT)." />
                <Topic icon={BookOpen} title="Osteopathic Medicine" detail="Manual therapy applications, cervical assessment + treatment, biomechanical workup post-trauma." />
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Published Resources</h2>
              <p className="text-sm text-slate-700 leading-relaxed mb-3">
                Zac is the lead clinical author of all CEA content, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                <li>Concussion Clinical Mastery course (8 CPD hours online, up to 14 with the in-person day; Osteopathy Australia endorsed)</li>
                <li>AI in Clinical Practice short course (3 CPD hours)</li>
                <li>Free SCAT6/SCOAT6 Mastery course + fillable assessment forms</li>
                <li>20+ peer-citable clinical blog articles on concussion, PPCS, and AI in clinical practice (full index at <Link href="/blog" className="text-teal-700 underline">portal.concussion-education-australia.com/blog</Link>)</li>
                <li>Free AI Safety Checklist for Allied Health Documentation</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-7">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Contact</h2>
              <p className="text-sm text-slate-700">
                Email: <a href="mailto:zac@concussion-education-australia.com" className="text-teal-700 underline">zac@concussion-education-australia.com</a>
              </p>
            </section>
          </article>

          <aside className="space-y-3 md:sticky md:top-24 self-start">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Training Streams</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="text-teal-700 hover:underline font-semibold">Concussion Clinical Mastery →</Link></li>
                <li><Link href="/courses/ai-in-clinical-practice" className="text-teal-700 hover:underline font-semibold">AI in Clinical Practice →</Link></li>
                <li><Link href="/scat-mastery" className="text-teal-700 hover:underline font-semibold">Free SCAT6 Mastery →</Link></li>
                <li><Link href="/ai-safety-checklist" className="text-teal-700 hover:underline font-semibold">Free AI Safety Checklist →</Link></li>
                <li><Link href="/ppcs-waitlist" className="text-teal-700 hover:underline font-semibold">PPCS Waitlist →</Link></li>
              </ul>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Endorsement</p>
              <p className="text-xs text-slate-700">
                Endorsed by Osteopathy Australia — the national peak body representing ~3,000 AHPRA-registered osteopaths.
              </p>
            </div>
          </aside>
        </main>
      </div>
    </>
  )
}

function Topic({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
  return (
    <div className="flex gap-3 p-3 border border-slate-200 rounded-lg">
      <Icon className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-600 leading-relaxed">{detail}</p>
      </div>
    </div>
  )
}
