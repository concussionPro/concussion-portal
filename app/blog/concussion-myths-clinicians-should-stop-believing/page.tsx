import { Metadata } from 'next'
import { createBlogPostSchema } from '@/lib/schema-markup'
import { ArrowRight, Clock, Brain, AlertTriangle, CheckCircle, XCircle, ShieldAlert, Activity, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { CONFIG } from '@/lib/config'
import { RelatedPosts } from '@/components/blog/RelatedPosts'

export const metadata: Metadata = {
  title: '7 Concussion Myths Clinicians Should Stop Believing in 2026',
  description: 'Debunking the most persistent concussion myths that still influence clinical practice. From loss of consciousness misconceptions to premature clearance assumptions, learn what the evidence actually says.',
  keywords: 'concussion myths, concussion misconceptions, concussion facts clinicians, loss of consciousness concussion, concussion rest myth, concussion recovery evidence',
  openGraph: {
    title: '7 Concussion Myths Clinicians Should Stop Believing in 2026',
    description: 'Debunking the most persistent concussion myths that still influence clinical practice. From loss of consciousness misconceptions to premature clearance assumptions, learn what the evidence actually says.',
    type: 'article',
    url: 'https://portal.concussion-education-australia.com/blog/concussion-myths-clinicians-should-stop-believing',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/blog/concussion-myths-clinicians-should-stop-believing',
  },
}

export default function ConcussionMythsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBlogPostSchema({
            title: '7 Concussion Myths Clinicians Should Stop Believing in 2026',
            description: 'Debunking the most persistent concussion myths that still influence clinical practice. From loss of consciousness misconceptions to premature clearance assumptions, learn what the evidence actually says.',
            datePublished: '2026-03-09',
            dateModified: '2026-03-09',
            author: 'Zac Lewis',
            url: 'https://portal.concussion-education-australia.com/blog/concussion-myths-clinicians-should-stop-believing',
          }))
        }}
      />

      <SiteNav />
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-rose-500 to-pink-500 text-white pt-[120px] pb-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Evidence Review -- March 2026
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              7 Concussion Myths Clinicians Should Stop Believing in 2026
            </h1>
            <p className="text-xl text-rose-100 mb-4">
              These misconceptions have persisted for decades despite clear evidence to the contrary. Each one has the potential to delay recovery, compromise clinical decisions, and harm patients.
            </p>
            <div className="flex items-center gap-3 text-rose-100 text-sm">
              <Clock className="w-4 h-4" />
              <span>Zac Lewis -- March 9, 2026 -- 9 min read</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Why Myths Matter in Clinical Practice
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                Concussion management has evolved dramatically over the past decade, yet clinical practice often lags behind the evidence. Many of the beliefs that shaped concussion care in the early 2000s have been comprehensively disproven, but they persist -- in textbooks, in clinical protocols, and in the assumptions that guide everyday decision-making.
              </p>
              <p>
                The problem is not merely academic. <strong>When clinicians act on outdated beliefs, patients suffer measurable consequences</strong>: prolonged recovery, unnecessary restrictions, missed diagnoses, and premature return-to-play clearances that put athletes at risk. The Amsterdam Consensus Statement (Patricios et al., 2023) and the body of research that surrounds it have given us a clearer evidence base than we have ever had.
              </p>
              <p>
                These are seven myths that Australian clinicians should stop believing -- and what the evidence says instead.
              </p>
            </div>
          </div>

          {/* Myth 1: Loss of Consciousness */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Myth 1: &ldquo;You Have to Lose Consciousness to Have a Concussion&rdquo;
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">The Myth</h4>
                    <p className="text-sm text-slate-700">
                      A concussion has only occurred if the patient loses consciousness. If they stayed awake, it&apos;s not a &ldquo;real&rdquo; concussion.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Why it persists:</strong> This belief is deeply embedded in popular culture and was reinforced by older medical definitions that emphasised loss of consciousness (LOC) as a hallmark of concussion. Many clinicians trained before the mid-2010s were taught that LOC was a defining feature, and the association between &ldquo;being knocked out&rdquo; and brain injury remains strong in public perception.
              </p>
              <p>
                <strong>What the evidence says:</strong> Fewer than 10% of sport-related concussions involve any loss of consciousness (McCrory et al., 2017). The 5th and 6th International Consensus Statements on Concussion in Sport both define concussion as a functional brain disturbance caused by biomechanical forces, with or without LOC. The most common presenting features are headache, confusion, balance disturbance, and feeling &ldquo;not right&rdquo; -- not unconsciousness.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Implication</h4>
                    <p className="text-sm text-slate-700">
                      If you are waiting for LOC to suspect concussion, you are missing approximately 90% of cases. Any athlete with acute onset of headache, confusion, dizziness, visual disturbance, or behavioural change following a direct or indirect force to the head should be assessed for concussion regardless of whether they lost consciousness.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Myth 2: Rest Until Symptom-Free */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Activity className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Myth 2: &ldquo;Rest Until Symptom-Free Is the Best Treatment&rdquo;
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">The Myth</h4>
                    <p className="text-sm text-slate-700">
                      Complete physical and cognitive rest until all symptoms have resolved is the gold standard for concussion treatment.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Why it persists:</strong> Rest-based protocols were the prevailing recommendation for over a decade. They were intuitively appealing -- if the brain is injured, it makes sense to &ldquo;rest&rdquo; it. The 2012 Zurich Consensus Statement recommended cognitive and physical rest until symptom resolution, and this message was reinforced across medical education, sports organisations, and public health campaigns.
              </p>
              <p>
                <strong>What the evidence says:</strong> The Amsterdam 2023 Consensus Statement (Patricios et al., 2023) explicitly recommends against prolonged rest beyond 24-48 hours. Multiple randomised controlled trials have demonstrated that strict rest beyond this window increases the risk of persistent symptoms by promoting cardiovascular deconditioning, sleep disruption, anxiety, and depression (Leddy et al., 2019; Grool et al., 2016). Sub-symptom threshold aerobic exercise introduced by 72 hours post-injury reduces recovery time by an average of 4-5 days compared to strict rest protocols.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Implication</h4>
                    <p className="text-sm text-slate-700">
                      Prescribe 24-48 hours of relative rest, then initiate a structured active recovery programme. Heart-rate-monitored walking by Day 3 is now the standard. Continued advice to &ldquo;rest in a dark room until you feel better&rdquo; is below the current standard of care and may actively harm your patients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Myth 3: Normal CT Rules Out Concussion */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Search className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Myth 3: &ldquo;A Normal CT Scan Rules Out Concussion&rdquo;
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">The Myth</h4>
                    <p className="text-sm text-slate-700">
                      If the CT scan is normal, there is no concussion. The patient can safely return to activity.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Why it persists:</strong> CT scans are the most widely available neuroimaging modality in emergency settings. Clinicians and patients alike can find reassurance in a &ldquo;clear scan,&rdquo; and there is a natural tendency to equate normal imaging with the absence of injury. This belief is reinforced every time a patient or parent is told &ldquo;the scan came back fine&rdquo; without further context.
              </p>
              <p>
                <strong>What the evidence says:</strong> CT detects structural pathology -- skull fractures, intracranial haemorrhage, cerebral contusions. Concussion, by definition, is a <strong>functional</strong> brain disturbance. It involves neurometabolic dysfunction, ionic flux, and microstructural changes that are entirely invisible to CT. The consensus is unequivocal: concussion is a clinical diagnosis based on the mechanism of injury, symptom presentation, and clinical examination (McCrory et al., 2017; Patricios et al., 2023). A normal CT scan is expected in concussion. Its purpose is to rule out more serious structural injury, not to diagnose or exclude concussion.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Implication</h4>
                    <p className="text-sm text-slate-700">
                      Never use a normal CT result to clear a patient for return to activity. Communicate clearly to patients: &ldquo;The CT shows there is no bleeding or fracture, which is great news. But concussion doesn&apos;t show up on CT. Your diagnosis is based on your symptoms and your clinical examination.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Myth 4: Children Recover Faster */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Users className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Myth 4: &ldquo;Children Recover Faster Than Adults&rdquo;
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">The Myth</h4>
                    <p className="text-sm text-slate-700">
                      Children and adolescents bounce back from concussion more quickly than adults because young brains are more resilient and adaptable.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Why it persists:</strong> The concept of &ldquo;neuroplasticity&rdquo; has been broadly (and often incorrectly) applied. Because developing brains demonstrate greater capacity for neural reorganisation in certain contexts, there is an assumption that this translates to faster concussion recovery. This belief is also reinforced by the observation that children are often physically active soon after injury -- which parents and clinicians may misinterpret as recovery.
              </p>
              <p>
                <strong>What the evidence says:</strong> The evidence shows the opposite. Children and adolescents typically take <strong>longer to recover</strong> from concussion than adults (Davis et al., 2017). The developing brain is more vulnerable to the neurometabolic effects of concussion, and the ongoing processes of myelination and synaptic pruning make it more susceptible to disruption. Paediatric concussion recovery times are typically 2-4 weeks, compared to 10-14 days for adults. The Amsterdam Consensus recommends more conservative return-to-play timelines for children, with a minimum of 14 days before full return to contact sport.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Implication</h4>
                    <p className="text-sm text-slate-700">
                      Paediatric concussions require more caution, not less. Never assume a child has recovered because they appear physically active or report feeling &ldquo;fine.&rdquo; Apply the extended return-to-play timelines recommended for children, and consider the additional cognitive demands of returning to school alongside sport.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Myth 5: SCAT6 Clearance */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <ShieldAlert className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Myth 5: &ldquo;If They Pass the SCAT6, They&apos;re Cleared&rdquo;
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">The Myth</h4>
                    <p className="text-sm text-slate-700">
                      A &ldquo;normal&rdquo; score on the SCAT6 means the concussion has resolved and the athlete can return to play.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Why it persists:</strong> The SCAT has become the most widely recognised concussion assessment tool globally. Its structured format and scoring system create an expectation that it functions like a diagnostic test with a clear pass/fail threshold. Clinicians, particularly those without specialised concussion training, may treat a &ldquo;normal&rdquo; SCAT score as equivalent to medical clearance.
              </p>
              <p>
                <strong>What the evidence says:</strong> The SCAT6 is explicitly designed as an <strong>assessment aid, not a clearance mechanism</strong> (Echemendia et al., 2023). It does not have a validated cut-off score that defines &ldquo;concussion&rdquo; or &ldquo;no concussion.&rdquo; Sensitivity decreases significantly after the first few hours. Moreover, the SCAT6 does not assess several critical domains, including vestibular-ocular function (assessed by the SCOAT6 and VOMS), cervical spine involvement, psychological factors, or exercise tolerance. Return-to-play clearance requires a multi-domain assessment including clinical examination, graded exercise testing, sport-specific functional testing, and medical judgment.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Implication</h4>
                    <p className="text-sm text-slate-700">
                      The SCAT6 is one tool in a comprehensive assessment battery -- not a standalone clearance test. Return-to-play decisions must incorporate graded return-to-sport protocols, the SCOAT6 for office-based follow-up, exercise tolerance testing, and clinical judgment. No single instrument should be used in isolation to clear an athlete.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Myth 6: Second Impact Syndrome */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Myth 6: &ldquo;Second Impact Syndrome Is Common and Well-Documented&rdquo;
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">The Myth</h4>
                    <p className="text-sm text-slate-700">
                      Sustaining a second concussion before the first has resolved commonly causes catastrophic brain swelling (second impact syndrome), and this is well-established in the medical literature.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Why it persists:</strong> Second impact syndrome (SIS) has been heavily emphasised in concussion education materials for decades. It is a dramatic and frightening concept -- catastrophic cerebral oedema following a seemingly minor second impact -- which makes it memorable and frequently cited. It has been used extensively as the primary justification for conservative return-to-play timelines.
              </p>
              <p>
                <strong>What the evidence says:</strong> The evidence base for SIS as a distinct pathological entity is extremely thin. Fewer than 20 cases have been reported in the medical literature, and many of these have been challenged on methodological grounds -- including questions about whether a confirmed first concussion actually occurred (McCrory &amp; Berkovic, 1998; McCrory, 2001). The concept remains controversial and is not universally accepted. <strong>However</strong> -- and this is critical -- the rarity of SIS does not mean premature return to play is safe. Repeat concussion during the recovery window is associated with prolonged symptoms, cumulative cognitive effects, and increased vulnerability to further injury (Guskiewicz et al., 2003). The reasons to avoid premature RTP are well-established; SIS is simply not the strongest one.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Implication</h4>
                    <p className="text-sm text-slate-700">
                      Do not rely on the threat of SIS as your primary rationale for conservative return-to-play management. Instead, base your decisions on the well-documented risks of repeat concussion during the recovery window: prolonged symptoms, cumulative effects, and increased vulnerability. The evidence for cautious RTP is strong; it does not need to rest on a poorly documented entity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Myth 7: Symptom Resolution = Brain Recovery */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-start gap-3 mb-6">
              <Brain className="w-8 h-8 text-rose-500 flex-shrink-0" />
              <h2 className="text-3xl font-bold text-slate-900">
                Myth 7: &ldquo;Once Symptoms Resolve, the Brain Has Fully Recovered&rdquo;
              </h2>
            </div>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">The Myth</h4>
                    <p className="text-sm text-slate-700">
                      When a patient reports feeling normal and all symptoms have resolved, the brain has fully recovered and the patient can immediately return to full activity.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                <strong>Why it persists:</strong> Symptom self-report is the most accessible and widely used measure in concussion management. It is understandable that clinicians equate the absence of symptoms with the resolution of the underlying injury. This approach is also simpler and faster than multi-domain assessment, which creates a practical incentive to rely on symptom resolution alone.
              </p>
              <p>
                <strong>What the evidence says:</strong> Physiological recovery consistently lags behind symptom resolution. Advanced neuroimaging studies using functional MRI (fMRI), diffusion tensor imaging (DTI), and blood biomarker analysis have demonstrated ongoing neurometabolic and microstructural changes in the brain well after patients report being symptom-free (Churchill et al., 2017; Kamins et al., 2017). The Buffalo Concussion Treadmill Test and other exercise provocation protocols frequently demonstrate physiological abnormalities in patients who are asymptomatic at rest. This is precisely why the Amsterdam Consensus mandates a <strong>graded return-to-play protocol</strong> that requires patients to complete progressively demanding physical and cognitive challenges before clearance -- even after symptom resolution.
              </p>

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-6 my-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Clinical Implication</h4>
                    <p className="text-sm text-slate-700">
                      Symptom resolution is a necessary but insufficient criterion for return-to-play clearance. Every patient must complete the full graded return-to-sport protocol (minimum 24 hours per step) after becoming symptom-free. Exercise provocation testing (such as the Buffalo Concussion Treadmill Test) should be used to confirm physiological recovery before clearance for unrestricted activity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Closing Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Evidence-Based Practice Means Letting Go of Old Beliefs
            </h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                These seven myths are not obscure academic curiosities. They are beliefs that continue to shape clinical decisions in emergency departments, GP clinics, sports medicine practices, and on sidelines across Australia. Each one has the potential to delay recovery, compromise patient safety, or lead to inappropriate clearance decisions.
              </p>
              <p>
                The common thread is this: concussion is more complex than any single test, symptom, or rule can capture. Effective management requires multi-domain assessment, structured active recovery, graded return-to-play protocols, and an understanding of the current evidence base -- not reliance on assumptions that were outdated years ago.
              </p>
              <p>
                As clinicians, our obligation is clear. We must align our practice with the best available evidence, update our protocols to reflect the Amsterdam Consensus, and critically examine the assumptions we carry from our training. The evidence has moved on. Our practice must move with it.
              </p>
            </div>
          </div>

          {/* References */}
          <div className="bg-slate-100 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">References</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                Patricios, J. S., et al. (2023). Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport -- Amsterdam, October 2022. <em>British Journal of Sports Medicine</em>, 57(11), 695-711.
              </li>
              <li>
                McCrory, P., et al. (2017). Consensus statement on concussion in sport -- the 5th International Conference on Concussion in Sport held in Berlin, October 2016. <em>British Journal of Sports Medicine</em>, 51(11), 838-847.
              </li>
              <li>
                Leddy, J. J., et al. (2019). Early subthreshold aerobic exercise for sport-related concussion: a randomized clinical trial. <em>JAMA Pediatrics</em>, 173(4), 319-325.
              </li>
              <li>
                Grool, A. M., et al. (2016). Association between early participation in physical activity following acute concussion and persistent postconcussive symptoms in children and adolescents. <em>JAMA</em>, 316(23), 2504-2514.
              </li>
              <li>
                Davis, G. A., et al. (2017). What is the difference in concussion management in children as compared with adults? A systematic review. <em>British Journal of Sports Medicine</em>, 51(12), 949-957.
              </li>
              <li>
                Echemendia, R. J., et al. (2023). Sport Concussion Assessment Tool - 6th Edition (SCAT6). <em>British Journal of Sports Medicine</em>, 57(11), 622-631.
              </li>
              <li>
                McCrory, P., &amp; Berkovic, S. F. (1998). Second impact syndrome. <em>Neurology</em>, 50(3), 677-683.
              </li>
              <li>
                McCrory, P. (2001). Does second impact syndrome exist? <em>Clinical Journal of Sport Medicine</em>, 11(3), 144-149.
              </li>
              <li>
                Guskiewicz, K. M., et al. (2003). Cumulative effects associated with recurrent concussion in collegiate football players: the NCAA Concussion Study. <em>JAMA</em>, 290(19), 2549-2555.
              </li>
              <li>
                Churchill, N. W., et al. (2017). Brain structure and function associated with a history of sport concussion: a multi-modal magnetic resonance imaging study. <em>Journal of Neurotrauma</em>, 34(4), 765-771.
              </li>
              <li>
                Kamins, J., et al. (2017). What does the athlete&apos;s clinical picture look like? A concussion symptom checklist reexamination. <em>British Journal of Sports Medicine</em>, 51(4), 299-304.
              </li>
            </ul>
          </div>

          <RelatedPosts slugs={['concussion-update-2026', 'return-to-play', 'voms-screening']} />

          {/* CTA Section */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 md:p-10 text-white mt-12">
            <h2 className="text-2xl font-bold mb-3">Practice Evidence-Based Concussion Management</h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Our courses are built on the Amsterdam Consensus and the latest evidence base. Learn to administer SCAT6 and SCOAT6 correctly, perform VOMS screening, implement active recovery protocols, and make confident return-to-play decisions -- all aligned with AHPRA CPD requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scat-mastery" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold hover:bg-white/90 transition-all">
                Free SCAT6 Training
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/20 text-white/80 rounded-xl text-sm font-semibold hover:bg-white/10 transition-all">
                Full Course (14 CPD) — ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
