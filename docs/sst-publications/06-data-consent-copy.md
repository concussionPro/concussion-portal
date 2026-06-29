# Data and consent copy — SST Trainer

Concussion Education Australia (CEA)
Draft v1.0 · 2026

Plain-English, properly-scoped consent and data-governance copy for two audiences:

- **(A) Patient in-app consent** — opt-in to anonymised session-data collection for service improvement and research.
- **(B) Clinic data-contribution agreement** — pooling de-identified outcome data into the CEA concussion evidence base, framed as the adoption value proposition for established concussion clinics.

> **Privacy framing.** This copy is written to be **Australian Privacy Principles (APP)**-aware. It distinguishes *personal information* (identifiable — your name, your clinician's record of you) from *de-identified information* (stripped of identifiers and not reasonably re-identifiable), and it keeps the two flows separate: care data goes to your clinician regardless of any research choice; the research pool only ever receives de-identified data, and only with consent. This is operational copy, not legal advice — have it reviewed against the current Privacy Act / APPs and any applicable health-records legislation before go-live. The data flows it governs are implemented in `lib/sst-trainer/clinic-sync.ts`, `app/api/sst/live/route.ts`, and `app/api/sst/clinic-sessions/route.ts`.

---

## Part A — Patient in-app consent

### A.1 The short version (the screen the patient sees)

**Help improve concussion care (optional)**

Your training and test results always go to your clinician so they can look after you — that happens no matter what you choose here.

Separately, you can choose to let us use a **de-identified copy** of this data (your name and contact details removed) to improve the app and to learn what helps people recover. It's completely optional, it won't change your care, and you can turn it off any time.

- [ ] **Yes — use my de-identified data to improve the app and for research.**
- [ ] **No thanks — just send my results to my clinician.**

*Either way, your clinician still receives everything they need for your care.*

[ What we collect ] [ How we de-identify ] [ Your choices ] — (expandable links to A.2–A.4)

---

### A.2 What we collect (expandable)

When you use the SST Trainer we record information about your **sessions**, not about you personally:

- Your heart-rate threshold (HRt) and your prescribed training band.
- For each session: your average and peak heart rate, how many minutes you completed, and your symptom score before and during the session (the 0–10 ratings you tap in).
- Whether you reported feeling worse the next day.
- The condition you're training for (e.g. concussion) and timestamps.
- Which heart-rate source you used (a Bluetooth wearable, the phone camera, or manual entry).

**We do not need or store special identifiers to do research.** Your heart rate is only ever a real measurement from your device or the camera — the app never makes a number up.

If you entered a **clinic code**, your results are sent to that clinic so your clinician can see them. If you didn't enter a clinic code, nothing is sent anywhere except what's needed to run the app on your device.

---

### A.3 How we de-identify (expandable)

If you opt in to research:

- We remove your **name, contact details, clinic code, and anything that directly identifies you** before your data enters the research pool.
- Your session data is combined with many other people's, so individual sessions can't reasonably be traced back to you.
- The research pool holds **de-identified information only** — it is not used to contact you, market to you, or make any decision about you as an individual.
- We don't sell your data.

If you opt out, none of your data goes into the research pool. Your clinician still receives your results for your care, exactly as before.

---

### A.4 Your choices and your rights (expandable)

- **It's opt-in.** Research use only happens if you tick "Yes."
- **It's withdrawable.** You can change your choice any time in the app's settings. Withdrawing stops any future data going into the research pool. Because the pool is de-identified and combined, we may not be able to find and pull out data you already contributed — but no new data will be added once you withdraw.
- **It won't affect your care.** Opting out changes nothing about the treatment you receive or what your clinician sees.
- **You can ask about your information.** Under the Australian Privacy Principles you can ask us what personal information we hold about you and ask us to correct it. Contact details and our full Privacy Policy are linked below.
- **Under-18s.** If you're under 18, a parent or guardian should make this choice with you. Your clinician can help.

[ Read the full Privacy Policy ] · [ Contact us about your data ]

---

### A.5 Internal notes (not shown to patients)

- The opt-in flag must be stored against the session-creation path so the research-export query can filter on it; **default is opt-out** (no research use unless explicitly ticked).
- The clinic-sync path (`clinic-sync.ts`) is the *care* flow and is gated only on the presence of a clinic code — it is **not** gated on the research consent, because care data to the treating clinician is the basis of the clinical relationship, not a secondary use. Keep these two gates independent in code and in copy.
- Research export must apply the de-identification step (strip name, contact, clinic code, free-text patient label) and must exclude any session whose patient explicitly opted out.
- Camera-PPG and BLE both produce *real* heart rate only; never log a simulated value, so there is no "synthetic data" caveat to disclose.
- If any future feature collects identifiers for research (it currently does not), that is a materially different consent and must be re-papered.

---

## Part B — Clinic data-contribution agreement

*Framed as the adoption value proposition for established concussion clinics.*

### B.1 The pitch (one paragraph)

Concussion is one of the few areas of practice where the evidence base is still being written — and where the people writing it are mostly overseas research centres with treadmills and lab budgets. The SST Trainer lets your clinic do two things at once: deliver the consensus-endorsed sub-symptom-threshold aerobic exercise prescription to your patients with live heart-rate monitoring between visits, **and** contribute the de-identified results into a shared Australian concussion evidence base that you also draw from. You put in de-identified outcomes; you get back benchmarks, norms, and a growing dataset that makes every clinic in the network — including yours — better at concussion care. It is the clinical-registry model, built into the tool, with no extra admin.

### B.2 What the clinic contributes

By enabling data contribution, your clinic agrees to pool **de-identified** patient outcome data into the CEA concussion evidence base. Specifically, per patient (with all direct identifiers removed):

- Serial HRt values (the recovery trajectory).
- Prescribed bands and how they progressed.
- Session adherence (sessions completed, minutes, days/week).
- Symptom deltas and next-day flare rates.
- Time from first test to the clearance signal (a re-test showing recovered exercise tolerance).
- Condition and de-identified demographics at the coarse level needed for analysis (e.g. age band, sex), **never** name, contact details, address, or your internal patient identifiers.

### B.3 What the clinic gets back (the value exchange)

- **Benchmarks and norms.** See how your patients' recovery trajectories and adherence compare with the de-identified network — the kind of normative data no single clinic can generate alone.
- **A live clinical dashboard.** Watch patients run their between-visit sessions in real time, track each patient's HRt recovery curve, and get an automatic clearance-review flag when a re-test no longer provokes symptoms.
- **First access to the evidence.** Contributing clinics receive the aggregate findings, practice insights, and any publications first, and are acknowledged as part of the contributing network.
- **A defensible, current standard of care.** Delivering the consensus prescription with objective monitoring and a documented audit trail strengthens the clinic's clinical governance position.

### B.4 The clinic's responsibilities (APP-aware)

The contributing clinic agrees that:

1. **It is the treating party and holds the care relationship.** The clinic is responsible for obtaining each patient's consent to use the tool for their care and for the patient-facing research opt-in (Part A), consistent with the Australian Privacy Principles and any applicable health-records law.
2. **Only de-identified data is pooled.** The clinic will not transmit direct identifiers into the evidence base. CEA applies de-identification on ingest as a second safeguard; the clinic does not rely on that alone for identifiers it controls (e.g. it must not put a patient's name in the free-text patient label if that label is contributed).
3. **Patient opt-outs are honoured.** Patients who decline research use still receive full care; their data is excluded from the pool.
4. **No re-identification.** Neither party will attempt to re-identify pooled data, and the data will not be sold.
5. **Purpose limitation.** Pooled data is used for service improvement, quality benchmarking, and concussion research (including a future retrospective observational study on de-identified routine-care data) — not for marketing to patients and not for any individual-level decision about a patient.

### B.5 Governance and the research pathway

- The de-identified pool is the dataset intended to power a **future retrospective observational study** (serial HRt, adherence, time-to-clearance, flare rates). That study will go through the appropriate **low/negligible-risk ethics review** for de-identified, already-collected data before any analysis is published, and contributing clinics will be informed.
- Data handling follows the CEA Privacy Policy and is structured to be consistent with the Australian Privacy Principles (collection limitation, purpose limitation, de-identification, security, and access/correction rights for any personal information CEA holds).
- A clinic may withdraw from contribution at any time; withdrawal stops future contribution. De-identified data already pooled and combined may not be individually retrievable, which is disclosed up front.

### B.6 Plain-language summary box (for the clinic sign-up screen)

**Join the CEA concussion evidence network**

- You deliver the evidence-based active-rehab prescription with live heart-rate monitoring between visits.
- You contribute **de-identified** patient outcomes to a shared Australian evidence base.
- You get back benchmarks, norms, a live clinical dashboard, and first access to the findings.
- Patients always control whether their de-identified data is used for research — and always get full care either way.
- No identifiers are pooled. No data is sold. No re-identification.

[ Enable data contribution for my clinic ] · [ Read the data agreement ] · [ Read the Privacy Policy ]

---

### B.7 Internal notes (not shown to clinics)

- The contribution toggle is a clinic-level setting; it gates whether a clinic's already-de-identified sessions are included in the research/benchmark pool, *separate* from each patient's individual opt-in. Both must be true for a session to enter the pool: clinic contribution ON **and** patient research opt-in YES.
- Care data to the clinician (the dashboard, live ticks, session history) is unaffected by either research flag — it is the primary clinical use.
- Before go-live: legal review of this agreement and the patient consent against the Privacy Act / APPs (and state health-records acts where relevant); confirm the de-identification routine in the research-export path strips the free-text `patient_label`; confirm there is a real settings control implementing the patient withdrawal described in A.4.
