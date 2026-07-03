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

                if let p = rx {
                    bandCard(p)
                    PrimaryButton(title: "Start session", systemImage: "play.fill") {
                        flow.beginTraining()
                    }
                    retestButton
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
