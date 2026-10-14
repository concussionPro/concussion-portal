import SwiftUI

// Home. With a prescription: today's band, Start session, Re-test (48h-gated),
// Progress. Without one: a prompt to run the graded test.

struct HomeView: View {
    @EnvironmentObject var flow: SSTFlow

    private var rx: Prescription? { flow.state.prescription }

    /// Queued clinical events not yet accepted by the backend. Read on each
    /// body evaluation rather than cached — the flush runs on launch and on
    /// connectivity regain, so a cached count would show stale work.
    private var pendingUploads: Int { SSTStore.pendingCount }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                header

                // Clinical events still only on the wrist. Shown so a watch is
                // never handed on — or factory-reset — while the last patient's
                // sessions have not reached their file. They survive a patient
                // handover either way (the queue keeps its own identity per
                // entry), but a reset of the WATCH itself would take them, so
                // the clinician needs to know to keep it on Wi-Fi.
                if pendingUploads > 0 {
                    Text("^[\(pendingUploads) session](inflect: true) still to upload — keep on Wi-Fi")
                        .font(.system(size: 12))
                        .foregroundStyle(.orange)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                }

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
            .padding(.bottom, 12)
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
        VStack(spacing: 7) {
            Text("TODAY'S BAND")
                .font(.system(size: 11, weight: .bold)).tracking(1.4)
                .foregroundStyle(.secondary)
            Text("\(p.bandLow)–\(p.bandHigh)")
                .font(.system(size: 46, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(Color(red: 0.46, green: 0.94, blue: 0.58))
            Text("BPM").font(.system(size: 10.5, weight: .semibold)).tracking(1)
                .foregroundStyle(.secondary)
            BandBar(low: p.bandLow, high: p.bandHigh, ceiling: p.hrt)
                .padding(.horizontal, 8).padding(.top, 3)
            Text("Ceiling \(p.hrt) bpm · \(p.minutes) min/day")
                .font(.system(size: 11.5, weight: .medium))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(
            LinearGradient(colors: [Color.green.opacity(0.10), Color.green.opacity(0.03)],
                           startPoint: .top, endPoint: .bottom),
            in: RoundedRectangle(cornerRadius: 16)
        )
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
