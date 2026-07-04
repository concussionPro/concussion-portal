import SwiftUI

// Home. With a prescription: today's band, Start session, Re-test (48h-gated),
// Progress. Without one: a prompt to run the graded test.

struct HomeView: View {
    @EnvironmentObject var flow: SSTFlow

    private var rx: Prescription? { flow.state.prescription }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                header

                if flow.state.redFlagLocked {
                    redFlagLockCard
                } else if let p = rx {
                    bandCard(p)
                    PrimaryButton(title: "Start session", systemImage: "play.fill") {
                        flow.beginTraining()
                    }
                    retestButton
                    Button { flow.goProgram() } label: {
                        Label("My program", systemImage: "list.clipboard")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    Button { flow.goProgress() } label: {
                        Label("Progress", systemImage: "chart.line.uptrend.xyaxis")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                } else {
                    MessageCard(
                        icon: "target",
                        iconColor: .blue,
                        title: "Find your band",
                        body: "Run a short graded test to measure your threshold and set your training band."
                    )
                    PrimaryButton(title: "Start graded test", systemImage: "figure.run") {
                        flow.startTestFlow()
                    }
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private var header: some View {
        VStack(spacing: 1) {
            Text(flow.state.patientName.map { "Welcome back, \($0)" } ?? "Welcome back")
                .font(.headline)
                .multilineTextAlignment(.center)
            if let clinic = flow.state.clinicName {
                Text(clinic).font(.caption2).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func bandCard(_ p: Prescription) -> some View {
        VStack(spacing: 2) {
            Text("Today's band").font(.caption).foregroundStyle(.secondary)
            Text("\(p.bandLow)–\(p.bandHigh)")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.green)
            Text("bpm · \(p.minutes) min · ceiling \(p.hrt)")
                .font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
    }

    /// Red-flag lock: testing and training stay blocked until the patient
    /// confirms a clinician has reviewed + cleared them (mirrors the web lock).
    private var redFlagLockCard: some View {
        VStack(spacing: 10) {
            MessageCard(
                icon: "exclamationmark.triangle.fill",
                iconColor: .red,
                title: "Paused for review",
                body: "A warning sign came up. Training and testing stay paused until a clinician has reviewed you and cleared you to resume."
            )
            PrimaryButton(title: "A clinician has cleared me", systemImage: "checkmark.seal", tint: .green) {
                flow.confirmClearance()
            }
        }
    }

    @ViewBuilder
    private var retestButton: some View {
        if flow.canRetest {
            Button { flow.startRetest() } label: {
                Label("Re-test", systemImage: "arrow.clockwise")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        } else {
            Label("Re-test in ~\(flow.retestHoursRemaining)h", systemImage: "clock")
                .font(.caption)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity)
        }
    }
}
