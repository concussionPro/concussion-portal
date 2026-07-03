import SwiftUI
import Combine

// The graded exertion test — the measurement instrument. 60-second stages,
// live HR big and central, a per-stage symptom score (0–10) and optional RPE.
// A stage is logged at the 60s mark, or early on a symptom spike. The test
// ends on a ≥3-pt symptom rise over rest (→ HRt), exhaustion, or the stage cap.
// HR is only ever the live reading — a stage cannot be logged without one.

struct GradedTestView: View {
    @EnvironmentObject var flow: SSTFlow
    @ObservedObject var workout: SSTWorkout

    private let stageSeconds = 60
    private let maxStages = 12

    @State private var stages: [TestStage] = []
    @State private var remaining = 60
    @State private var symptom = 0
    @State private var rpe = 12
    @State private var useRPE = false

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var minute: Int { stages.count + 1 }
    private var symptomRise: Int { symptom - flow.restingSymptom }
    private var spike: Bool { symptomRise >= SSTProtocol.provocationRise }

    /// Log is allowed at the end of the stage, or immediately on a symptom
    /// spike — but never without a live heart rate.
    private var canLog: Bool {
        guard workout.bpm != nil else { return false }
        return remaining == 0 || spike
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                HStack {
                    Text("Minute \(minute)").font(.headline)
                    Spacer()
                    Text("of \(maxStages)").font(.caption2).foregroundStyle(.secondary)
                }

                stageRing

                HRReadout(bpm: workout.bpm, tint: spike ? .orange : .primary)

                if workout.bpm == nil {
                    Text("Waiting for heart rate…")
                        .font(.caption2).foregroundStyle(.secondary)
                }

                Divider()

                CrownScorePicker(
                    title: "Symptoms now (0–10)",
                    value: $symptom,
                    accent: spike ? .orange : .blue
                )
                if spike {
                    Label("Symptom spike — logging ends the test", systemImage: "exclamationmark.triangle")
                        .font(.caption2).foregroundStyle(.orange)
                        .multilineTextAlignment(.center)
                }

                Toggle(isOn: $useRPE) { Text("Add effort (RPE)").font(.caption) }
                if useRPE {
                    CrownScorePicker(title: "Effort (Borg 6–20)", value: $rpe, range: 6...20, accent: .purple)
                }

                PrimaryButton(
                    title: remaining == 0 ? "Log minute \(minute)" : (spike ? "Log now — end test" : "Log at 0:00"),
                    systemImage: "square.and.pencil",
                    tint: spike ? .orange : .blue
                ) { logStage(early: remaining > 0) }
                .disabled(!canLog)

                Button(role: .destructive) { finish() } label: {
                    Label("Stop — exhausted", systemImage: "stop.circle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .disabled(workout.bpm == nil && stages.isEmpty)
            }
            .padding(.horizontal, 4)
        }
        .onReceive(ticker) { _ in
            if remaining > 0 {
                remaining -= 1
                if remaining == 0 { Haptics.play(.stop) }   // stage end
            }
        }
    }

    private var stageRing: some View {
        ZStack {
            Circle().stroke(Color.gray.opacity(0.25), lineWidth: 7)
            Circle()
                .trim(from: 0, to: CGFloat(remaining) / CGFloat(stageSeconds))
                .stroke(remaining == 0 ? Color.green : Color.blue,
                        style: StrokeStyle(lineWidth: 7, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 0.25), value: remaining)
            Text(remaining == 0 ? "Log" : "\(remaining)")
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .monospacedDigit()
        }
        .frame(width: 76, height: 76)
    }

    private func logStage(early: Bool) {
        guard let hr = workout.bpm else { return }
        let stage = TestStage(
            minute: minute,
            heartRate: hr,
            symptomScore: symptom,
            rpe: useRPE ? rpe : nil,
            redFlag: false
        )
        stages.append(stage)
        Haptics.play(.success)

        // End conditions: symptom spike (HRt found) or the stage cap.
        if spike || stages.count >= maxStages {
            finish()
        } else {
            remaining = stageSeconds   // next stage; carry the symptom score forward
        }
    }

    private func finish() {
        flow.completeGradedTest(stages: stages)
    }
}
