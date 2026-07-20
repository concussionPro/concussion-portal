/**
 * Recognise & Remove — Concussion Awareness for Community Sport and Schools.
 *
 * A self-serve, NON-CLINICAL awareness micro-course for coaches, umpires,
 * first-aiders, teachers and parents. Scope is strictly "Recognise, Remove,
 * Refer, Record" — it must never train a non-clinician to diagnose, clear, or
 * treat concussion. Aligned to the Australian Concussion Guidelines for Youth &
 * Community Sport (2024). Distributed B2B2C through sports-workforce providers
 * (Tier A), NSOs (Tier B) and peak bodies (Tier C).
 */

export interface CourseLesson {
  id: number
  title: string
  /** paragraphs of teaching content */
  body: string[]
  /** optional bulleted callout (e.g. red-flag list) */
  callout?: { tone: 'warn' | 'key'; title: string; items: string[] }
}

export interface QuizQuestion {
  q: string
  options: string[]
  /** 0-based index of the correct option */
  answer: number
}

export const SCHOOLS_COURSE = {
  title: 'Recognise & Remove',
  subtitle: 'Concussion Awareness for Community Sport & Schools',
  aligned: 'Aligned to the Australian Concussion Guidelines for Youth & Community Sport (2024)',
  format: 'Self-paced online · ~30–45 minutes · 6 lessons · 10-question knowledge check · Certificate of Completion',
  audience:
    'For non-clinical staff — coaches, assistant coaches, umpires and referees, sports trainers and first-aiders, PE and classroom teachers, team managers, and parent volunteers.',
  scopeNote:
    'This course teaches you to recognise a suspected concussion, remove the person from play, and refer them to a doctor. It does NOT train you to diagnose concussion, decide when someone has recovered, or treat a head injury — those decisions belong to a medical or healthcare practitioner. When unsure, act on the side of caution every time.',
  outcomes: [
    'Describe in plain terms what a concussion is and why it must be taken seriously — even with no loss of consciousness and no visible injury.',
    'Recognise the common visible signs and reported symptoms of a suspected concussion.',
    'Identify red-flag emergency signs that require calling an ambulance immediately.',
    'Apply the "if in doubt, sit them out" rule — no same-day return to play.',
    'Explain the graded return-to-sport and return-to-learn pathway and the 14-day / 21-day minimums.',
    'Document what you observed and refer the person to the right healthcare practitioner, staying within your non-clinical role.',
  ],
  lessons: [
    {
      id: 1,
      title: 'What concussion actually is',
      body: [
        'A concussion is a traumatic brain injury. It is caused by a bump, blow, or jolt to the head — or by a hit to the body that makes the head and brain move rapidly back and forth. That sudden movement can stretch and disrupt brain cells and briefly change how the brain works. It is a genuine injury to the brain, not simply "getting your bell rung."',
        'The most important thing to understand is that a concussion is usually invisible. There is no cut, no swelling, no bruise. Most concussions happen without any loss of consciousness — the person does not need to be knocked out to be concussed. This is why concussion is so easy to miss, and why a trained bystander who knows what to look for is so valuable on a sideline or in a schoolyard.',
        'Standard scans like X-rays and ordinary CT scans usually look completely normal after a concussion. That does not mean nothing has happened — the injury is to the function of the brain, not necessarily its structure. Children and adolescents are more vulnerable: their brains are still developing, they can take longer to recover, and a second injury before the first has healed can be far more serious. That is why the safest, most conservative approach always wins — especially for anyone under 19.',
      ],
    },
    {
      id: 2,
      title: 'Recognise: signs and symptoms',
      body: [
        'Recognising a suspected concussion is the single most important skill this course teaches. You are not diagnosing — you are noticing that "something is not right" after a knock, and treating it seriously. Signs and symptoms can appear immediately, or be delayed by minutes, hours, or even a day or two. The absence of symptoms right after a hit does not rule concussion out.',
        'Visible signs you might observe: lying motionless; slow to get up; dazed, blank or vacant look; unsteadiness or loss of balance; clutching the head; confusion about the game, score or location; a seizure; or loss of consciousness (even brief).',
        'Symptoms the person might report: headache or pressure in the head; dizziness; nausea; blurred or double vision; sensitivity to light or noise; feeling foggy or "not right"; difficulty concentrating or remembering; feeling more emotional or irritable; and tiredness. In children, watch for behaviour that is out of character.',
        'You do NOT need to see many signs to act. One sign or one reported symptom after a head or body impact is enough to suspect concussion. Recognition is not about being certain — it is about noticing enough to be concerned, then acting on that concern.',
      ],
    },
    {
      id: 3,
      title: 'Red flags and emergencies',
      body: [
        'Most concussions are not medical emergencies, but a small number of head injuries are life-threatening and need an ambulance right now. Know the red flags and call 000 immediately if you see any of them — do not wait, do not "keep an eye on it," and do not drive the person yourself if these signs are present.',
        'If a neck or spinal injury is possible — the person reports neck pain, or was in a heavy collision — do not move them unless they are in immediate danger. Keep them still and calm and wait for paramedics. If the person is unconscious, assume a neck injury until medical staff prove otherwise.',
        'Red flags can develop after the initial impact, so anyone who has had a significant head knock should be watched closely, and any adult supervising them that night should be told exactly which warning signs mean going straight to a hospital emergency department.',
      ],
      callout: {
        tone: 'warn',
        title: 'Call an ambulance (000) immediately if you see any of these',
        items: [
          'Deteriorating consciousness — increasingly drowsy, hard to wake, or unresponsive',
          'Repeated vomiting',
          'A seizure or convulsion',
          'Neck pain or tenderness (possible spinal injury)',
          'Weakness, numbness, or tingling in the arms or legs',
          'Increasing confusion, agitation, or unusual/combative behaviour',
          'Severe or increasing headache',
          'Double vision',
          'Loss of consciousness',
        ],
      },
    },
    {
      id: 4,
      title: 'Remove: the sideline decision',
      body: [
        'The rule at the heart of this course is simple and non-negotiable: "If in doubt, sit them out." Whenever you suspect a concussion, the person is removed from the game, training, or activity immediately and does NOT return to play that same day — full stop. There is no same-day return to play for a suspected concussion, at any level, for any player, no matter how important the match.',
        'This applies even if the person insists they are fine, even if symptoms seem to settle, and even if a parent, coach, or the player is pushing to keep going. Symptoms can be masked by adrenaline and worsen later. A person who returns while still concussed risks a second impact before the brain has recovered — which can cause a far more severe, occasionally catastrophic injury.',
        'As a non-clinical staff member, you have the authority and the responsibility to remove someone from play — you do not need to be a doctor, and you should never be talked out of it. Removal is not a diagnosis; it is a precaution. You are simply saying "I\'m not sure this is safe, so we stop." That decision is always defensible and always correct when concussion is suspected.',
        'Once removed, the person should not be left alone, should not drive, and should not drink alcohol. Keep them calm and supervised, hand over to a responsible adult, and make sure they understand the next step: be assessed by a doctor, and watch for the red flags.',
      ],
    },
    {
      id: 5,
      title: 'Return-to-sport and return-to-learn',
      body: [
        'Coming back from a concussion is a gradual, stepwise process — never a straight jump back into the game. It runs on two tracks at once: returning to learning/work (school, study, or a job) and returning to sport. For students, return-to-learn generally takes priority: a young person should manage a normal school day comfortably before progressing to the more demanding stages of return-to-sport.',
        'The graded pathway moves step by step — complete rest, light activity, sport-specific exercise, non-contact training, and only then, with a healthcare practitioner\'s guidance, full contact training and competition. A person moves up only if they stay symptom-free at each step. If symptoms return, they drop back a level and rest before trying again.',
        'As non-clinical staff, your role here is to support and enforce the plan the person\'s doctor has set — for example, holding a keen player back until they are cleared — not to design the plan, shorten the timeframes, or decide the person is ready. The decision that someone is fit to return to contact sport is a healthcare practitioner\'s decision, not yours.',
      ],
      callout: {
        tone: 'key',
        title: 'Minimum timeframes for youth & community sport (minimums, not targets)',
        items: [
          'At least 14 days symptom-free (at rest) before returning to contact/collision TRAINING',
          'At least 21 days from injury before returning to competitive contact/collision sport',
          'Anyone under 19, and anyone without a healthcare practitioner guiding recovery, follows this conservative pathway',
        ],
      },
    },
    {
      id: 6,
      title: 'Your scope and documentation',
      body: [
        'Being clear about your scope keeps everyone safe — including you. Your job is Recognise, Remove, Refer, Record. You recognise a suspected concussion, remove the person for the day, refer them to a doctor, and record what you saw. You do NOT diagnose, you do NOT clear anyone to return, and you do NOT treat the injury. Whenever a question crosses into "is this a concussion?" or "are they better yet?", that is a healthcare practitioner\'s call.',
        'Who to refer to: anyone with a suspected concussion should be assessed by a medical doctor (GP, urgent care, or a hospital emergency department). Red flags go straight to 000. Recovery and return-to-sport clearance are guided by a doctor or appropriate healthcare practitioner. Your role is to make sure the person actually gets to that care.',
        'What to record — capture the facts while fresh: name, age, team/class; date, time, location; how it happened (the mechanism); what you observed and what the person reported (their words); whether red flags were present and whether an ambulance was called; the time you removed them and who took over their care; and what you advised.',
        'Stick to facts and observations, not opinions or diagnoses. Avoid "mild concussion" or "he\'ll be fine"; instead write "reported headache and looked unsteady after a head knock; removed from play; advised to see a doctor." Good documentation protects the injured person, supports the doctor\'s assessment, and protects you and your organisation by showing you followed the guidelines.',
      ],
    },
  ] as CourseLesson[],
  quiz: [
    { q: 'A concussion is best described as:', options: ['A minor injury that only counts if the person is knocked out', 'A traumatic brain injury that can happen with or without loss of consciousness', 'A neck injury', 'Ordinary tiredness after exercise'], answer: 1 },
    { q: 'A player takes a knock to the head but was NOT knocked out and says they feel fine. What is the safest approach?', options: ['Let them keep playing since they weren\'t knocked out', 'Watch for signs and symptoms and, if concussion is suspected, remove them — "if in doubt, sit them out"', 'Ask them to run a lap to prove they\'re okay', 'Wait until half-time to decide'], answer: 1 },
    { q: 'When can a person with a SUSPECTED concussion return to play on the same day?', options: ['After 15 minutes if symptoms settle', 'If a parent says it\'s okay', 'Never — there is no same-day return to play for a suspected concussion', 'If it\'s an important match'], answer: 2 },
    { q: 'Which of these is a RED FLAG requiring you to call an ambulance (000) immediately?', options: ['A mild headache that is not getting worse', 'Feeling a bit tired', 'Repeated vomiting, a seizure, neck pain, or deteriorating consciousness', 'Sensitivity to bright light only'], answer: 2 },
    { q: 'Concussion symptoms:', options: ['Always appear straight away', 'Only appear if there is a visible injury', 'Can be delayed by hours or even a day or two', 'Can be seen on an ordinary X-ray'], answer: 2 },
    { q: 'As a non-clinical coach, umpire, teacher, or first-aider, are you responsible for diagnosing concussion and clearing the person to return?', options: ['Yes, if you\'ve done this course', 'No — you recognise, remove, refer, and record; diagnosis and clearance are a healthcare practitioner\'s job', 'Yes, if no doctor is available', 'Only for players over 18'], answer: 1 },
    { q: 'For youth and community sport, the minimum time symptom-free (at rest) before returning to CONTACT/COLLISION TRAINING is:', options: ['3 days', '7 days', '14 days', 'No minimum'], answer: 2 },
    { q: 'The minimum time from injury before returning to COMPETITIVE CONTACT/COLLISION sport is:', options: ['10 days', '14 days', '21 days', '48 hours'], answer: 2 },
    { q: 'Which statement about return-to-learn and return-to-sport is correct?', options: ['Sport always comes before school', 'They run alongside each other, and a student should be coping with normal schoolwork before progressing to contact sport', 'Return-to-learn is not relevant to concussion', 'A student can do full training while off school sick'], answer: 1 },
    { q: 'Which group should follow the conservative return pathway?', options: ['Only professional athletes', 'Nobody, if they feel fine', 'Anyone under 19, and anyone without a healthcare practitioner guiding their recovery', 'Only players who were knocked out'], answer: 2 },
  ] as QuizQuestion[],
  passMark: 8,
} as const
