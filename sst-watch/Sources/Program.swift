import SwiftUI

// "Your program" — the continuation page after a threshold result, and always
// reachable from Home. The prescription in plain terms plus the rules that run
// the program, so nobody leaves the result screen wondering what happens next.
// Every number derives from the prescription / SSTProtocol — nothing hardcoded.

struct ProgramView: View {
    @EnvironmentObject var flow: SSTFlow

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                ScreenTitle(text: "Your program", subtitle: "What happens from here")

                if let p = flow.state.prescription {
                    VStack(spacing: 2) {
                        Text("Train at").font(.caption).foregroundStyle(.secondary)
                        Text("\(p.bandLow)–\(p.bandHigh) bpm")
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(.green)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(.green.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))

                    VStack(alignment: .leading, spacing: 8) {
                        row("timer", "\(p.minutes) minutes a session — the watch times it and ends it for you")
                        row("calendar", "\(SSTProtocol.sessionsPerWeek) days a week, easy cardio (walk, bike, jog)")
                        row("waveform.path.ecg", "Feel worse during a session? Tap Symptoms — a rise of more than \(SSTProtocol.sessionStopRise) stops it safely")
                        row("arrow.up.circle", "\(SSTProtocol.cleanNeeded) clean tracked sessions in a row step your band up")
                        row("arrow.clockwise", "At your ceiling (\(p.hrt) bpm) the app asks for a re-test — that's progress, not a setback")
                        row("exclamationmark.triangle", "Warning signs? Stop and get checked before training again")
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    // Prolonged-recovery prognostic flag (Haider 2019). Clinician-
                    // facing note carried on the prescription; shown when set.
                    if p.hasProlongedRecoveryRisk {
                        Label(p.clinicianNote ?? "Your threshold is on the lower side, which can mean a slower recovery. Keep sessions gentle and stay in close contact with your clinician.", systemImage: "stethoscope")
                            .font(.caption2)
                            .foregroundStyle(.orange)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.vertical, 6)
                            .padding(.horizontal, 8)
                            .background(.orange.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
                    }

                    PrimaryButton(title: "Start first session", systemImage: "play.fill") {
                        flow.beginTraining()
                    }
                    Button("Later") { flow.goHome() }.buttonStyle(.bordered)
                } else {
                    MessageCard(
                        icon: "target",
                        iconColor: .blue,
                        title: "No band yet",
                        body: "Run the graded test first — it measures your threshold and sets your program."
                    )
                    PrimaryButton(title: "Back", tint: .gray) { flow.goHome() }
                }
            }
            .padding(.horizontal, 4)
        }
    }

    private func row(_ icon: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 6) {
            Image(systemName: icon)
                .foregroundStyle(.blue)
                .font(.caption)
                .frame(width: 16)
            Text(text).font(.caption2)
        }
    }
}
