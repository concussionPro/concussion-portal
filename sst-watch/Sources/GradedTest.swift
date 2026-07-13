import SwiftUI
import Combine

// The graded exertion test — the measurement instrument. 60-second stages,
// live HR big and central, a per-stage symptom score (0–10) that SEEDS from the
// resting score (it does not reset to 0). The minute logs ITSELF at 0:00 from
// the live HR — no manual logging. The stop controls live below the fold.
//
// Crossing the ≥3-pt symptom rise ENDS THE TEST AUTOMATICALLY (that stage's HR
// is the HRt by definition — asking for a confirming tap mid-symptom-spike is
// wrong). Per the BCTT (Leddy 2013), RPE's protocol job is qualifying the
// EXHAUSTION termination (volitional fatigue = RPE ≥ 17 without provocation →
// the no-intolerance/refer signal), so it is asked ONCE at the exhaustion
// stop, never per minute. HR is only ever the live reading — a stage cannot
// be logged without one.

struct GradedTestView: View {
    @EnvironmentObject var flow: SSTFlow
    @ObservedObject var workout: SSTWorkout

    private let stageSeconds = 60
    // Matches the web engine (MAX_STAGES = 20) and the BCTT protocol: +1° incline
    // each minute for 15 stages, then +speed per minute — the test runs to
    // provocation / exhaustion / ≥90% age-max, capped at 20 minutes.
    private let maxStages = 20

    @State private var stages: [TestStage] = []
    @State private var remaining = 60
    // Wall-clock anchor for the stage countdown — ticks can be throttled
    // (wrist-down), so `remaining` derives from elapsed time, never tick counts.
    @State private var stageStartedAt = Date()
    @State private var symptom = 0
    // Terminal RPE (Borg 6–20), asked once when the patient stops for exhaustion.
    @State private var exhaustionRPE = 17
    @State private var askExhaustionRPE = false

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var minute: Int { stages.count + 1 }
    private var symptomRise: Int { symptom - flow.restingSymptom }
    private var spike: Bool { symptomRise >= SSTProtocol.provocationRise }

    var body: some View {
        ScrollView {
            VStack(spacing: 6) {
                // Compact header: minute + small countdown ring on one row, so
                // HR and the symptom picker fit without scrolling.
                HStack {
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Minute \(minute)").font(.headline)
                        Text("of \(maxStages)").font(.caption2).foregroundStyle(.secondary)
                    }
                    Spacer()
                    stageRing
                }

                HRReadout(bpm: workout.bpm, tint: spike ? .orange : .primary)

                HRSourceStatus(workout: workout)

                CrownScorePicker(
                    title: "How bad are your symptoms right now?",
                    value: $symptom,
                    descriptor: symptomWord,
                    accentFor: symptomSeverityColor
                )
                if spike, workout.bpm == nil {
                    Label("Symptoms are up 3+ — the test ends as soon as your heart rate reads", systemImage: "exclamationmark.triangle")
                        .font(.caption2).foregroundStyle(.orange)
                        .multilineTextAlignment(.center)
                }

                // The minute logs ITSELF at 0:00 from the live HR — no manual
                // logging. This just shows what's happening so it's visible.
                Label(
                    workout.bpm == nil
                        ? "Waiting for heart rate…"
                        : (remaining == 0 ? "Logging minute \(minute)…" : "Logs automatically at 0:00"),
                    systemImage: workout.bpm == nil ? "heart.slash" : "checkmark.circle"
                )
                .font(.caption2)
                .foregroundStyle(workout.bpm == nil ? .orange : .secondary)
                .frame(maxWidth: .infinity)

                // Always enabled: it must be a clean exit even with no HR / no
                // stages (e.g. bailing early, or the sim with no sensor).
                // stopForExhaustion() maps an empty test to `invalid` → the
                // Result screen → Home, so the user is never trapped. Previously
                // `.disabled(workout.bpm == nil && stages.isEmpty)` left the only
                // enabled exit as "Warning sign — stop" (a false red-flag lock).
                Button(role: .destructive) { stopForExhaustion() } label: {
                    Label("Stop — end test", systemImage: "stop.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)

                // Red-flag stop: severe/warning symptoms end the test as a
                // red-flag termination — NEVER as exhaustion (which would sync
                // a false clearance signal to the clinic).
                Button(role: .destructive) { finish(redFlag: true) } label: {
                    Label("Warning sign — stop", systemImage: "exclamationmark.triangle.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .tint(.red)
            }
            .padding(.horizontal, 4)
        }
        .onAppear {
            stageStartedAt = Date()
            // Seed the symptom picker from the resting score the patient entered
            // at readiness — the base carries in, it does NOT reset to 0.
            symptom = flow.restingSymptom
        }
        .onReceive(ticker) { _ in
            let elapsed = Int(Date().timeIntervalSince(stageStartedAt))
            let next = max(0, stageSeconds - elapsed)
            if next == 0, remaining > 0 { Haptics.play(.stop) }   // stage end
            remaining = next
            // Auto-log the completed minute the instant it ends AND a live HR is
            // present — no manual tap. If HR isn't ready at 0:00, the next tick
            // logs it. logStage() advances the stage, so this fires once per stage.
            if next == 0, workout.bpm != nil {
                logStage()
            }
        }
        // Threshold crossed → auto-log the provoking stage and end the test.
        // The tap that moved the score IS the report; no confirming tap needed.
        .onChange(of: symptom) { _, _ in
            if spike, workout.bpm != nil {
                Haptics.play(.directionUp)
                logStage()
            }
        }
        .sheet(isPresented: $askExhaustionRPE) { exhaustionSheet }
    }

    private var stageRing: some View {
        ZStack {
            Circle().stroke(Color.gray.opacity(0.25), lineWidth: 5)
            Circle()
                .trim(from: 0, to: CGFloat(remaining) / CGFloat(stageSeconds))
                .stroke(remaining == 0 ? Color.green : Color.blue,
                        style: StrokeStyle(lineWidth: 5, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 0.25), value: remaining)
            Text(remaining == 0 ? "Log" : "\(remaining)")
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .monospacedDigit()
        }
        .frame(width: 42, height: 42)
    }

    /// One-off Borg rating on the exhaustion stop — qualifies the termination
    /// (RPE ≥ 17 = true volitional exhaustion → a trustworthy no-intolerance).
    private var exhaustionSheet: some View {
        ScrollView {
            VStack(spacing: 10) {
                CrownScorePicker(
                    title: "How hard was it when you stopped?",
                    value: $exhaustionRPE,
                    range: 6...20,
                    accent: .purple,
                    descriptor: borgWord
                )
                PrimaryButton(title: "End test", systemImage: "checkmark") {
                    if !stages.isEmpty {
                        stages[stages.count - 1].rpe = exhaustionRPE
                    }
                    askExhaustionRPE = false
                    finish()
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func logStage() {
        guard let hr = workout.bpm else { return }
        let stage = TestStage(
            minute: minute,
            heartRate: hr,
            symptomScore: symptom,
            rpe: nil,
            redFlag: false
        )
        stages.append(stage)
        Haptics.play(.success)

        // End conditions: symptom spike (HRt found) or the stage cap.
        if spike || stages.count >= maxStages {
            finish()
        } else {
            // Next stage; carry the symptom score forward.
            stageStartedAt = Date()
            remaining = stageSeconds
        }
    }

    private func stopForExhaustion() {
        // Nothing logged yet → nothing to qualify; finish() maps it to invalid.
        if stages.isEmpty {
            finish()
        } else {
            askExhaustionRPE = true
        }
    }

    private func finish(redFlag: Bool = false) {
        flow.completeGradedTest(stages: stages, redFlagStop: redFlag)
    }
}
